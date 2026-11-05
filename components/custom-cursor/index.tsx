/**
 * @file components/custom-cursor/index.tsx
 * @description Main custom kinematic cursor integration component.
 * Hides default browser cursor on fine-pointer devices and renders the responsive 3D cursor.
 */

'use client';

import React, { useSyncExternalStore } from 'react';
import { useReducedMotion } from 'motion/react';
import { isLowEndDevice } from '@/utils/deviceDetector';
import { useCursorState } from './hooks/use-cursor-state';
import { CursorSvg } from './components/cursor-svg';

const emptySubscribe = () => () => {};
const getCanRenderCursor = () =>
  !window.matchMedia('(pointer: coarse)').matches && !isLowEndDevice();
const getServerCanRenderCursor = () => false;

/**
 * Custom kinematic cursor that provides responsive physical interactions on fine pointer devices.
 * Automatically deactivates on touch interfaces and low-end / reduced-motion devices to preserve 60 FPS.
 *
 * @returns {React.JSX.Element | null} The cursor component or null when unmounted / on touch or low-end devices.
 */
export function CustomCursor() {
  const canRender = useSyncExternalStore(
    emptySubscribe,
    getCanRenderCursor,
    getServerCanRenderCursor
  );
  const reduceMotion = useReducedMotion();

  const state = useCursorState();

  if (!canRender || reduceMotion) {
    return null;
  }

  return <CursorSvg {...state} />;
}

