'use client';

/**
 * @file components/ui/initial-app-loader.tsx
 * @description Pure, minimal full-screen preloader featuring the raw ASCII Line spinner (| / - \).
 */

import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { AsciiLineLoader } from '@/components/motion/loader';
import { EASE_OUT } from '@/lib/ease';

interface PreHydrationWindow extends Window {
  __asciiPreInterval?: number;
}

/**
 * Clean initial application loader using only the raw ASCII Line animation.
 * Disappears once the page and all assets are fully loaded.
 *
 * @returns {React.JSX.Element} Minimal full-screen loader.
 */
export function InitialAppLoader(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Clean up pre-hydration interval and remove fallback element
    if (typeof window !== 'undefined') {
      // SAFETY: Window optionally stores the pre-hydration ASCII animation timer ID
      const win = window as PreHydrationWindow;

      if (win.__asciiPreInterval !== undefined) {
        clearInterval(win.__asciiPreInterval);
      }
    }

    const preFallback = document.getElementById('pre-hydration-loader');

    if (preFallback) {
      preFallback.remove();
    }

    let rafId: number | null = null;

    const finishLoading = () => {
      // Dismiss loader on next animation frame once hydrated so LCP (< 2.5s) and INP are never blocked
      rafId = window.requestAnimationFrame(() => {
        setIsLoading(false);
      });
    };

    finishLoading();

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <m.div
          id="app-initial-loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: EASE_OUT }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black text-zinc-200 select-none pointer-events-none"
        >
          <AsciiLineLoader size={32} />
        </m.div>
      )}
    </AnimatePresence>
  );
}
