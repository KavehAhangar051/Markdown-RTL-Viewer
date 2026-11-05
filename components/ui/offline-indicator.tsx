'use client';

/**
 * @file components/ui/offline-indicator.tsx
 * @description Non-intrusive connectivity badge informing the user when RTL Markdown Studio is operating offline.
 */

import React from 'react';
import { WifiOff } from '@/components/animate-ui/icons';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useStudioUI } from '@/store/MarkdownContext';

/**
 * Displays a compact badge in the header/workspace when the browser loses network connectivity,
 * reassuring the user that all Markdown conversion and editing continue locally offline.
 *
 * @returns {React.JSX.Element | null} Offline badge when disconnected, or null when online.
 */
export function OfflineIndicator(): React.JSX.Element | null {
  const isOnline = useOnlineStatus();
  const { theme, t } = useStudioUI();
  const isDark = theme === 'dark';

  if (isOnline) {
    return null;
  }

  return (
    <div
      id="pwa-offline-indicator"
      role="status"
      aria-live="polite"
      title={t.pwa.offlineTooltip}
      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all duration-200 select-none ${
        isDark
          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
          : 'bg-amber-50 text-amber-800 border-amber-300'
      }`}
    >
      <WifiOff animate className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      <span className="hidden sm:inline">{t.pwa.offlineBadge}</span>
    </div>
  );
}
