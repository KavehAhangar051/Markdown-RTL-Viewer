'use client';

import React, { useEffect } from 'react';
import { LazyMotion, MotionConfig, domMax } from 'motion/react';
import { isLowEndDevice, monitorFramePacingForLowEnd } from '@/utils/deviceDetector';

interface MotionProviderProps {
  children: React.ReactNode;
}

/**
 * Global LazyMotion and MotionConfig provider.
 * Automatically detects low-end devices or <45 FPS frame pacing in Google Chrome / WebView2
 * and activates GPU compositor optimizations (`html.reduce-motion-low-end`) while keeping
 * all studio animations active at ~60 FPS (unless the user explicitly sets OS reduced motion).
 */
export function MotionProvider({ children }: MotionProviderProps) {
  useEffect(() => {
    const applyLowEndGpuMode = () => {
      document.documentElement.classList.add('reduce-motion-low-end');
      document.documentElement.dataset.lowEnd = 'true';
    };

    if (isLowEndDevice()) {
      applyLowEndGpuMode();

      return;
    }

    const stopMonitoring = monitorFramePacingForLowEnd(() => {
      applyLowEndGpuMode();
    });

    return () => {
      stopMonitoring();
    };
  }, []);

  return (
    <LazyMotion features={domMax} strict={false}>
      <MotionConfig reducedMotion="user">
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
