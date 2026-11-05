'use client';

/**
 * @file components/views/preview-empty-state.tsx
 * @description Accessible empty state component for the Markdown preview panel with sample loader CTA.
 */

import React from 'react';
import { m } from 'motion/react';
import { Eye, FileCode } from '@/components/animate-ui/icons';
import { SPRING_PRESS } from '@/lib/ease';
import { ambientAuraVariants } from '@/components/motion/motion-variants';

export interface PreviewEmptyStateProps {
  isDark: boolean;
  isFa: boolean;
  t: { preview: { emptyTitle: string; emptyDescription: string } };
  loadSample: () => void;
  reduceMotion: boolean | null;
}

/**
 * Meaningful empty state displayed when the Markdown document has no content.
 * Meets WCAG 2.1 AA with `role="status"`, semantic heading hierarchy (`h3`), and clear action CTA.
 *
 * @param {PreviewEmptyStateProps} props - Empty state properties.
 * @returns {React.JSX.Element} Rendered empty state view.
 */
export function PreviewEmptyState({
  isDark,
  isFa,
  t,
  loadSample,
  reduceMotion,
}: PreviewEmptyStateProps): React.JSX.Element {
  const buttonClass = `mt-4 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-colors cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
    isDark
      ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80 shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:border-zinc-600 focus-visible:ring-offset-zinc-950'
      : 'bg-white hover:bg-zinc-50 text-zinc-900 border-zinc-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-zinc-300 focus-visible:ring-offset-white'
  } ${isFa ? 'font-vazir' : 'font-sans'}`;

  const sampleLabel = isFa ? 'بارگذاری نمونه مارک‌داون' : 'Load Sample Markdown';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`h-full flex flex-col items-center justify-center text-center p-8 select-none ${
        isDark ? 'text-zinc-500' : 'text-zinc-400'
      }`}
    >
      <div className="relative mb-3 flex items-center justify-center">
        {/* Ambient Layer: Subtle breathing radial aura */}
        {!reduceMotion && (
          <m.div
            variants={ambientAuraVariants}
            animate="idle"
            className="absolute -inset-3 rounded-full bg-emerald-500/10 blur-xl pointer-events-none"
          />
        )}
        <m.div
          animate={reduceMotion ? undefined : { y: [-3, 3, -3] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className={`relative p-3.5 rounded-2xl border ${
            isDark
              ? 'bg-zinc-900/60 border-zinc-800/80 shadow-lg shadow-black/40'
              : 'bg-zinc-100 border-zinc-200 shadow-sm'
          }`}
        >
          <Eye
            aria-hidden="true"
            className={`w-8 h-8 opacity-70 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
          />
        </m.div>
      </div>
      <h3
        className={`text-sm font-semibold ${
          isDark ? 'text-zinc-300' : 'text-zinc-800'
        } ${isFa ? 'font-vazir' : 'font-sans'}`}
      >
        {t.preview.emptyTitle}
      </h3>
      <p className={`text-xs mt-1 max-w-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
        {t.preview.emptyDescription}
      </p>
      <m.button
        id="preview-load-sample-btn"
        onClick={loadSample}
        type="button"
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        whileHover={reduceMotion ? undefined : { scale: 1.02 }}
        transition={SPRING_PRESS}
        aria-label={sampleLabel}
        className={buttonClass}
      >
        <FileCode aria-hidden="true" className="w-4 h-4 text-emerald-500" />
        <span>{sampleLabel}</span>
      </m.button>
    </div>
  );
}
