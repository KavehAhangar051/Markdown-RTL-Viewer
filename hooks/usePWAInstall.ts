'use client';

/**
 * @file hooks/usePWAInstall.ts
 * @description Custom hook managing Service Worker registration, warm caching of loaded assets,
 * and PWA installation state across Chromium, desktop, Android, and iOS Safari.
 */

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

export interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

/**
 * Warms the Service Worker cache with scripts, stylesheets, and icons already loaded
 * in the current document so offline reloads work even after the very first visit.
 */
async function warmLoadedPageAssets(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    const assetCache = await caches.open('rtl-studio-assets-v3');
    const shellCache = await caches.open('rtl-studio-shell-v3');

    await shellCache
      .add(new Request(window.location.pathname || '/', { cache: 'no-cache' }))
      .catch(() => undefined);

    const resourceUrls = new Set<string>();

    document
      .querySelectorAll<HTMLScriptElement>('script[src]')
      .forEach((script) => {
        if (script.src && script.src.startsWith(window.location.origin)) {
          resourceUrls.add(script.src);
        }
      });

    document
      .querySelectorAll<HTMLLinkElement>(
        'link[rel="stylesheet"][href], link[rel="preload"][href]'
      )
      .forEach((link) => {
        if (link.href && link.href.startsWith(window.location.origin)) {
          resourceUrls.add(link.href);
        }
      });

    await Promise.allSettled(
      Array.from(resourceUrls).map(async (url) => {
        const existing = await assetCache.match(url);
        if (!existing) {
          await assetCache.add(url);
        }
      })
    );
  } catch {
    // Ignore cache warming errors in restricted contexts
  }
}

function subscribeStandalone(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const standaloneMedia = window.matchMedia('(display-mode: standalone)');
  const overlayMedia = window.matchMedia(
    '(display-mode: window-controls-overlay)'
  );
  standaloneMedia.addEventListener('change', callback);
  overlayMedia.addEventListener('change', callback);
  window.addEventListener('appinstalled', callback);
  return () => {
    standaloneMedia.removeEventListener('change', callback);
    overlayMedia.removeEventListener('change', callback);
    window.removeEventListener('appinstalled', callback);
  };
}

function getStandaloneSnapshot(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function getServerFalseSnapshot(): boolean {
  return false;
}

const emptySubscribe = () => () => {};

function getIOSSnapshot(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const userAgent = window.navigator.userAgent.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  );
}

function subscribeInstallPrompt(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault();
    window.__deferredPwaPrompt = e as BeforeInstallPromptEvent;
    callback();
  };

  const handleAppInstalled = () => {
    window.__deferredPwaPrompt = null;
    callback();
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);

  return () => {
    window.removeEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt
    );
    window.removeEventListener('appinstalled', handleAppInstalled);
  };
}

function getInstallPromptSnapshot(): BeforeInstallPromptEvent | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.__deferredPwaPrompt ?? null;
}

function getServerNullSnapshot(): BeforeInstallPromptEvent | null {
  return null;
}

/**
 * Hook that registers `sw.js` (respecting `NEXT_PUBLIC_BASE_PATH`) and exposes PWA installation state.
 *
 * @returns {PWAInstallState} Current PWA installability, standalone state, iOS detection, and install handler.
 */
export function usePWAInstall(): PWAInstallState {
  const [installedViaPrompt, setInstalledViaPrompt] = useState<boolean>(false);

  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getServerFalseSnapshot
  );
  const isIOSDevice = useSyncExternalStore(
    emptySubscribe,
    getIOSSnapshot,
    getServerFalseSnapshot
  );
  const deferredPrompt = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPromptSnapshot,
    getServerNullSnapshot
  );

  const isInstalled = isStandalone || installedViaPrompt;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Register Offline Service Worker with basePath support
    if ('serviceWorker' in navigator) {
      const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const normalizedBase = rawBasePath
        ? (rawBasePath.startsWith('/') ? rawBasePath : `/${rawBasePath}`).replace(
            /\/$/,
            ''
          )
        : '';
      const swUrl = `${normalizedBase}/sw.js`;
      const swScope = `${normalizedBase}/`;

      navigator.serviceWorker
        .register(swUrl, { scope: swScope })
        .then(() => {
          void warmLoadedPageAssets();
        })
        .catch(() => {
          // Ignore registration errors in unsupported environments
        });
    }
  }, []);

  const install = useCallback(async (): Promise<
    'accepted' | 'dismissed' | 'unavailable'
  > => {
    const promptEvent =
      deferredPrompt ??
      (typeof window !== 'undefined' ? window.__deferredPwaPrompt : null);
    if (!promptEvent) {
      return 'unavailable';
    }

    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      if (typeof window !== 'undefined') {
        window.__deferredPwaPrompt = null;
      }
      setInstalledViaPrompt(true);
    }
    return outcome;
  }, [deferredPrompt]);

  return {
    isInstallable: deferredPrompt !== null && !isInstalled,
    isInstalled,
    isIOS: isIOSDevice && !isInstalled,
    install,
  };
}

