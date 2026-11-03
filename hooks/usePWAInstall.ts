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
    const assetCache = await caches.open('rtl-studio-assets-v2');
    const shellCache = await caches.open('rtl-studio-shell-v2');

    await shellCache.add(new Request(window.location.pathname || '/', { cache: 'no-cache' })).catch(() => undefined);

    const resourceUrls = new Set<string>();

    document
      .querySelectorAll<HTMLScriptElement>('script[src]')
      .forEach((script) => {
        if (script.src && script.src.startsWith(window.location.origin)) {
          resourceUrls.add(script.src);
        }
      });

    document
      .querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href], link[rel="preload"][href]')
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
  standaloneMedia.addEventListener('change', callback);
  window.addEventListener('appinstalled', callback);
  return () => {
    standaloneMedia.removeEventListener('change', callback);
    window.removeEventListener('appinstalled', callback);
  };
}

function getStandaloneSnapshot(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
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

/**
 * Hook that registers `/sw.js` and exposes PWA installation state and trigger.
 *
 * @returns {PWAInstallState} Current PWA installability, standalone state, iOS detection, and install handler.
 */
export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
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

  const isInstalled = isStandalone || installedViaPrompt;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Register Offline Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(() => {
          void warmLoadedPageAssets();
        })
        .catch(() => {
          // Ignore registration errors in unsupported environments
        });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalledViaPrompt(true);
      setDeferredPrompt(null);
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
  }, []);

  const install = useCallback(async (): Promise<
    'accepted' | 'dismissed' | 'unavailable'
  > => {
    if (!deferredPrompt) {
      return 'unavailable';
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalledViaPrompt(true);
      setDeferredPrompt(null);
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

