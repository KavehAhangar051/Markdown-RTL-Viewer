'use client';

/**
 * @file hooks/useClipboard.ts
 * @description Deep React hook for interacting with the system clipboard.
 * Implements John Ousterhout's 'Pull Complexity Downward' principle:
 * abstracts away navigator permissions, fallback textarea execution, debounced timer resets,
 * and memory cleanup behind a simple, high-leverage interface.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getTinyBridge } from '@/utils/tinyDesktopBridge';

export interface ClipboardReadResult {
  text: string | null;
  success: boolean;
  error?: 'unsupported' | 'permission_denied' | 'empty' | 'unknown';
}

/**
 * Custom React hook for reading from and writing to the system clipboard.
 * Pulls browser inconsistencies downward: handles TinyJS native OS clipboard,
 * modern Async Clipboard API, legacy execCommand fallback, and debounced copied-state timers.
 *
 * @param {number} [timeoutMs=2000] - Duration in milliseconds before resetting the copied state.
 * @returns {{ copied: boolean; copyToClipboard: (text: string) => Promise<boolean>; readFromClipboard: () => Promise<ClipboardReadResult> }}
 */
export function useClipboard(timeoutMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Copies text to clipboard with native TinyJS support and fallback for restricted iframe contexts.
   */
  const copyToClipboard = useCallback(
    async (text: string): Promise<boolean> => {
      if (typeof window === 'undefined') return false;

      let succeeded = false;
      const tiny = getTinyBridge();

      // 0. Native TinyJS desktop launcher clipboard
      if (tiny) {
        try {
          await tiny.clipboard.write({ text });
          succeeded = true;
        } catch {
          succeeded = false;
        }
      }

      // 1. Primary browser path: Modern Clipboard API
      if (!succeeded) {
        try {
          if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            succeeded = true;
          }
        } catch {
          // Fall back to legacy execCommand on permission or iframe sandbox restriction
        }
      }

      // 2. Fallback path: execCommand('copy') via temporary textarea
      if (!succeeded && typeof document !== 'undefined') {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          textarea.style.pointerEvents = 'none';
          document.body.appendChild(textarea);
          textarea.select();
          succeeded = document.execCommand('copy');
          document.body.removeChild(textarea);
        } catch {
          succeeded = false;
        }
      }

      if (succeeded) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        setCopied(true);
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
          timeoutRef.current = null;
        }, timeoutMs);
      }

      return succeeded;
    },
    [timeoutMs]
  );

  /**
   * Reads plain text from system clipboard, defining unreadable/denied states cleanly.
   */
  const readFromClipboard = useCallback(async (): Promise<ClipboardReadResult> => {
    if (typeof window === 'undefined') {
      return { text: null, success: false, error: 'unsupported' };
    }

    const tiny = getTinyBridge();

    if (tiny) {
      try {
        const clip = await tiny.clipboard.read();

        if (clip.text) {
          return { text: clip.text, success: true };
        }

        return { text: '', success: false, error: 'empty' };
      } catch {
        // Fall through to browser clipboard API
      }
    }

    if (!navigator?.clipboard?.readText) {
      return { text: null, success: false, error: 'unsupported' };
    }

    try {
      window.focus();
    } catch {
      // Ignore focus errors
    }

    try {
      const text = await navigator.clipboard.readText();

      return { text, success: true };
    } catch {
      return { text: null, success: false, error: 'permission_denied' };
    }
  }, []);

  return { copied, copyToClipboard, readFromClipboard };
}
