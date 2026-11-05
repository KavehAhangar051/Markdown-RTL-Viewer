'use client';

/**
 * @file components/views/sync-scroll-toggle.tsx
 * @description Accessible toggle button for synchronizing scroll position between editor and preview panels.
 */

import React from 'react';
import { m } from 'motion/react';
import { Link2, Unlink } from '@/components/animate-ui/icons';
import { SPRING_PRESS } from '@/lib/ease';
import { ActionSwapIcon } from '@/components/motion/action-swap';

export interface SyncScrollToggleButtonProps {
  isSyncScroll: boolean;
  isDark: boolean;
  reduceMotion: boolean | null;
  onToggle: () => void;
  label: string;
  enabledTitle: string;
  disabledTitle: string;
}

function getSyncButtonThemeClass(isSyncScroll: boolean, isDark: boolean): string {
  if (isSyncScroll) {
    return isDark
      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/60 shadow-xs focus-visible:ring-offset-zinc-950'
      : 'bg-emerald-50 border-emerald-300/80 text-emerald-700 hover:bg-emerald-100 shadow-xs focus-visible:ring-offset-white';
  }

  return isDark
    ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 focus-visible:ring-offset-zinc-950'
    : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 focus-visible:ring-offset-white';
}

/**
 * Renders an accessible toggle button indicating and controlling synchronized scrolling in split view.
 *
 * @param {SyncScrollToggleButtonProps} props - Component properties.
 * @returns {React.JSX.Element} Rendered toggle button.
 */
export function SyncScrollToggleButton({
  isSyncScroll,
  isDark,
  reduceMotion,
  onToggle,
  label,
  enabledTitle,
  disabledTitle,
}: SyncScrollToggleButtonProps): React.JSX.Element {
  const themeClass = getSyncButtonThemeClass(isSyncScroll, isDark);

  return (
    <m.button
      id="sync-scroll-toggle-btn"
      type="button"
      onClick={onToggle}
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      transition={SPRING_PRESS}
      title={isSyncScroll ? enabledTitle : disabledTitle}
      aria-label={label}
      aria-pressed={isSyncScroll}
      className={`inline-flex items-center gap-1.5 min-h-[36px] sm:min-h-[30px] px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer select-none touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${themeClass}`}
    >
      <ActionSwapIcon
        value={isSyncScroll ? 'sync' : 'unsync'}
        animation="blur"
        className="w-3.5 h-3.5"
      >
        {isSyncScroll ? (
          <Link2 aria-hidden="true" className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        ) : (
          <Unlink aria-hidden="true" className="w-3.5 h-3.5 opacity-60 shrink-0" />
        )}
      </ActionSwapIcon>
      <span>{label}</span>
      <span
        aria-hidden="true"
        className={`w-1.5 h-1.5 rounded-full transition-colors ${
          isSyncScroll ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-zinc-500'
        }`}
      />
    </m.button>
  );
}
