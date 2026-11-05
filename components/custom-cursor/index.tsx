/**
 * @file components/custom-cursor/index.tsx
 * @description Main custom kinematic cursor integration component.
 * Hides default browser cursor on fine-pointer devices and renders the responsive 3D cursor.
 */

'use client';

import React, { useSyncExternalStore } from 'react';
import { useReducedMotion } from 'motion/react';
import { isLowEndDevice } from '@/utils/deviceDetector';
import { isTinyDesktopRuntime } from '@/utils/tinyDesktopBridge';
import { useCursorState } from './hooks/use-cursor-state';
import { CursorSvg } from './components/cursor-svg';

const emptySubscribe = () => () => {};
const getCanRenderCursor = () => {
  if (window.matchMedia('(pointer: coarse)').matches) {
    return false;
  }

  // In the native Windows desktop app, always enable the GPU-accelerated 3D cursor.
  // In standard web browsers on low-end hardware, use the zero-latency native OS hardware cursor.
  if (isTinyDesktopRuntime()) {
    return true;
  }

  return !isLowEndDevice();
};

const getServerCanRenderCursor = () => false;

/**
 * Custom kinematic cursor that provides responsive physical interactions on fine pointer devices.
 * Preserves the native OS cursor whenever disabled (e.g., touch devices, reduced motion, or low-end web browsers).
 *
 * @returns {React.JSX.Element | null} The cursor component or null when native OS cursor is active.
 */
export function CustomCursor() {
  const canRender = useSyncExternalStore(
    emptySubscribe,
    getCanRenderCursor,
    getServerCanRenderCursor
  );
  const reduceMotion = useReducedMotion();
  const isEnabled = Boolean(canRender && !reduceMotion);

  const state = useCursorState(isEnabled);

  if (!isEnabled) {
    return null;
  }

  return <CursorSvg {...state} />;
}

