'use client';

import React, { useEffect, useState } from 'react';
import { LazyMotion, MotionConfig, domMax } from 'motion/react';
import { isLowEndDevice, monitorFramePacingForLowEnd } from '@/utils/deviceDetector';

interface MotionProviderProps {
  children: React.ReactNode;
}

/**
 * Global LazyMotion and MotionConfig provider.
 * Automatically detects low-end devices or <45 FPS frame pacing in Google Chrome
 * and activates `reducedMotion="always"` plus CSS GPU optimizations (`html.reduce-motion-low-end`)
 * to sustain smooth ~60 FPS rendering.
 */
export function MotionProvider({ children }: MotionProviderProps) {
  const [forceReducedMotion, setForceReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    const applyLowEndMode = () => {
      setForceReducedMotion(true);
      document.documentElement.classList.add('reduce-motion-low-end');
      document.documentElement.dataset.lowEnd = 'true';
    };

    if (isLowEndDevice()) {
      applyLowEndMode();

      return;
    }

    const stopMonitoring = monitorFramePacingForLowEnd(() => {
      applyLowEndMode();
    });

    return () => {
      stopMonitoring();
    };
  }, []);

  return (
    <LazyMotion features={domMax} strict={false}>
      <MotionConfig reducedMotion={forceReducedMotion ? 'always' : 'user'}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
