'use client';

/**
 * @file hooks/useDesktopSmoothScroll.ts
 * @description Custom React hook to dynamically load and manage Lenis smooth scrolling exclusively on desktop and laptop devices.
 */

import { useEffect, useRef } from 'react';
import { isDesktopOrLaptop } from '@/utils/deviceDetector';
import Lenis from 'lenis';

/**
 * Activates inertia-based smooth scrolling on desktop and laptop viewports via Lenis.
 * Automatically cleans up animations and instances on unmount or when transitioning to mobile screens.
 */
export function useDesktopSmoothScroll(): void {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    let animationFrameId: number | null = null;
    let isCancelled = false;

    let virtualTime = 0;
    let lastRafTime: number | null = null;

    const raf = (time: number) => {
      const lenis = lenisRef.current;

      if (!lenis) {
        animationFrameId = null;
        lastRafTime = null;

        return;
      }

      // Clamp frame delta to at most 33.3ms (30fps floor) so waking up after an idle pause
      // never feeds a multi-second deltaTime spike into Lenis's inertia solver.
      const frameDelta = lastRafTime === null ? 16.67 : Math.min(Math.max(time - lastRafTime, 1), 33.33);
      lastRafTime = time;
      virtualTime += frameDelta;

      lenis.raf(virtualTime);

      if (lenis.isScrolling) {
        animationFrameId = requestAnimationFrame(raf);
      } else {
        animationFrameId = null;
        lastRafTime = null;
      }
    };

    const wakeLoop = () => {
      if (animationFrameId === null && !isCancelled && lenisRef.current) {
        lastRafTime = null;
        animationFrameId = requestAnimationFrame(raf);
      }
    };

    /**
     * Initializes Lenis smooth scroll if environment is verified as desktop/laptop.
     */
    function initSmoothScroll() {
      if (!isDesktopOrLaptop()) {
        destroyLenis();

        return;
      }

      if (lenisRef.current) return;

      try {
        if (isCancelled) return;

        const lenis = new Lenis({
          lerp: 0.12,
          orientation: 'vertical',
          gestureOrientation: 'vertical',
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 1,
        });

        lenisRef.current = lenis;
        lenis.on('scroll', wakeLoop);
        window.addEventListener('wheel', wakeLoop, { capture: true, passive: true });
        window.addEventListener('touchmove', wakeLoop, { capture: true, passive: true });
        window.addEventListener('keydown', wakeLoop, { capture: true, passive: true });
        wakeLoop();
      } catch (err) {
        console.error('Failed to initialize Lenis smooth scroll:', err);
      }
    }

    /**
     * Tears down active Lenis instance and animation loop.
     */
    function destroyLenis() {
      window.removeEventListener('wheel', wakeLoop, { capture: true });
      window.removeEventListener('touchmove', wakeLoop, { capture: true });
      window.removeEventListener('keydown', wakeLoop, { capture: true });

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      lastRafTime = null;

      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
    }

    initSmoothScroll();

    let resizeTimeout: NodeJS.Timeout | null = null;

    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!isDesktopOrLaptop()) {
          destroyLenis();
        } else if (!lenisRef.current) {
          initSmoothScroll();
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      isCancelled = true;

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      if (resizeTimeout) clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      destroyLenis();
    };
  }, []);
}
