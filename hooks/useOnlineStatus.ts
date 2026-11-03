'use client';

/**
 * @file hooks/useOnlineStatus.ts
 * @description Custom hook tracking browser network connectivity status (`navigator.onLine`).
 */

import { useSyncExternalStore } from 'react';

function subscribeOnlineStatus(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot(): boolean {
  if (typeof navigator === 'undefined') {
    return true;
  }
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  return true;
}

/**
 * Tracks live browser connectivity state without hydration mismatches.
 *
 * @returns {boolean} True when online, false when offline.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getServerSnapshot
  );
}
