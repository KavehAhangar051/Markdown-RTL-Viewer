'use client';

/**
 * @file components/views/editor-stats-badges.tsx
 * @description Statistical metric badges component rendered inside the editor toolbar header.
 */

import React from 'react';
import { m, useReducedMotion } from 'motion/react';
import { WrapText, CaseSensitive, Type } from 'lucide-react';
import { badgeContainerVariants, badgeItemVariants } from '@/components/motion/motion-variants';
import { SPRING_PRESS } from '@/lib/ease';

export interface EditorStatsBadgesProps {
  stats: { lineCount: number; wordCount: number; characterCount: number };
  isDark: boolean;
  locale: string;
  t: { editor: { lines: string; words: string; chars: string } };
}

/**
 * Statistical metric badges showing line count, word count, and character count in the editor.
 * Uses micro-cascade entrance and gentle spring physics on hover.
 *
 * @param {EditorStatsBadgesProps} props - Component properties.
 * @returns {React.JSX.Element} Rendered stat badges.
 */
export const EditorStatsBadges: React.FC<EditorStatsBadgesProps> = React.memo(({
  stats,
  isDark,
  locale,
  t,
}) => {
  const reduceMotion = useReducedMotion();

  const badgeClass = `text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors select-none ${
    isDark
      ? 'bg-zinc-900 text-zinc-300 border-zinc-800/80 hover:border-zinc-700'
      : 'bg-white text-zinc-700 border-zinc-300 shadow-xs hover:border-zinc-400'
  }`;

  const iconClass = `w-3 h-3 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`;
  const labelClass = `font-normal ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`;
  const valueClass = `font-bold tabular-nums ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`;

  return (
    <m.div
      variants={reduceMotion ? undefined : badgeContainerVariants}
      initial="hidden"
      animate="visible"
      className="flex items-center gap-1.5 me-1.5 flex-wrap"
    >
      <m.span
        id="editor-stat-lines"
        variants={reduceMotion ? undefined : badgeItemVariants}
        whileHover={reduceMotion ? undefined : { scale: 1.03 }}
        transition={SPRING_PRESS}
        className={badgeClass}
        title={t.editor.lines}
      >
        <WrapText className={iconClass} />
        <span className={labelClass}>{t.editor.lines}</span>
        <strong className={valueClass}>{stats.lineCount.toLocaleString(locale)}</strong>
      </m.span>

      <m.span
        id="editor-stat-words"
        variants={reduceMotion ? undefined : badgeItemVariants}
        whileHover={reduceMotion ? undefined : { scale: 1.03 }}
        transition={SPRING_PRESS}
        className={badgeClass}
        title={t.editor.words}
      >
        <CaseSensitive className={iconClass} />
        <span className={labelClass}>{t.editor.words}</span>
        <strong className={valueClass}>{stats.wordCount.toLocaleString(locale)}</strong>
      </m.span>

      <m.span
        id="editor-stat-chars"
        variants={reduceMotion ? undefined : badgeItemVariants}
        whileHover={reduceMotion ? undefined : { scale: 1.03 }}
        transition={SPRING_PRESS}
        className={badgeClass}
        title={t.editor.chars}
      >
        <Type className={iconClass} />
        <span className={labelClass}>{t.editor.chars}</span>
        <strong className={valueClass}>{stats.characterCount.toLocaleString(locale)}</strong>
      </m.span>
    </m.div>
  );
});

EditorStatsBadges.displayName = 'EditorStatsBadges';
