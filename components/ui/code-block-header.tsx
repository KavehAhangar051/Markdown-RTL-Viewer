'use client';

/**
 * @file components/ui/code-block-header.tsx
 * @description Header bar for code blocks showing language badge and copy action button.
 */

import React from 'react';
import { m, useReducedMotion } from 'motion/react';
import { Copy, Check } from '@/components/animate-ui/icons';
import { SPRING_PRESS, EASE_OUT } from '@/lib/ease';
import { ActionSwapIcon } from '@/components/motion/action-swap';
import { formatLanguageDisplayName } from '@/utils/syntaxHighlighter';
import { CodeLanguageBadge } from '@/components/ui/code-language-badge';

interface CodeBlockHeaderProps {
  languageName: string;
  isDark: boolean;
  isPersian: boolean;
  copied: boolean;
  onCopy: () => void;
}

function getHeaderClass(isDark: boolean): string {
  return isDark
    ? 'bg-zinc-900/75 border-zinc-800/80 text-zinc-200'
    : 'bg-zinc-100/85 border-zinc-200/90 text-zinc-800';
}

function getButtonClass(copied: boolean, isDark: boolean): string {
  if (copied) {
    return isDark
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
      : 'bg-emerald-50 text-emerald-700 border-emerald-300';
  }

  if (isDark) {
    return 'bg-zinc-950/80 text-zinc-300 border-zinc-800 hover:bg-zinc-800/80 hover:text-zinc-100 hover:border-zinc-700 focus-visible:ring-offset-zinc-950';
  }

  return 'bg-white text-zinc-700 border-zinc-300/90 hover:bg-zinc-50 hover:text-zinc-950 hover:border-zinc-400 shadow-xs focus-visible:ring-offset-white';
}

interface CopyLabels {
  readonly title: string;
  readonly ariaLabel: string;
  readonly text: string;
}

function getCopyLabels(isPersian: boolean, copied: boolean): CopyLabels {
  if (isPersian) {
    return {
      title: copied ? 'کپی شد' : 'کپی کد',
      ariaLabel: copied ? 'کد در کلیپ‌بورد کپی شد' : 'کپی کد در کلیپ‌بورد',
      text: copied ? 'کپی شد' : 'کپی',
    };
  }

  return {
    title: copied ? 'Copied' : 'Copy code',
    ariaLabel: copied ? 'Code copied to clipboard' : 'Copy code to clipboard',
    text: copied ? 'Copied' : 'Copy',
  };
}

function CopyButtonContent({
  copied,
}: {
  copied: boolean;
}): React.JSX.Element {
  return (
    <ActionSwapIcon
      value={copied ? 'copied' : 'copy'}
      animation="blur"
      className="w-3.5 h-3.5"
    >
      {copied ? (
        <Check animate aria-hidden="true" className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
      ) : (
        <Copy animateOnHover aria-hidden="true" className="w-3.5 h-3.5" />
      )}
    </ActionSwapIcon>
  );
}

/**
 * Studio-aligned VSCode code block header bar with language-specific emblem and copy button.
 */
export function CodeBlockHeader({
  languageName,
  isDark,
  isPersian,
  copied,
  onCopy,
}: CodeBlockHeaderProps): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const { title, ariaLabel, text } = getCopyLabels(isPersian, copied);
  const displayLang = formatLanguageDisplayName(languageName, isPersian);

  return (
    <div
      data-code-header
      className={`flex items-center justify-between px-3.5 py-2 border-b text-xs select-none transition-colors ${getHeaderClass(isDark)}`}
      dir="ltr"
    >
      <div className="flex items-center gap-2">
        <CodeLanguageBadge languageName={languageName} isDark={isDark} />
        <span
          data-code-header-lang
          className={`font-mono font-semibold tracking-tight text-xs ${
            isDark ? 'text-zinc-200' : 'text-zinc-800'
          }`}
        >
          {displayLang}
        </span>
      </div>

      <m.button
        type="button"
        onClick={onCopy}
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        animate={
          copied && !reduceMotion
            ? { scale: [1, 1.05, 1], transition: { duration: 0.2, ease: EASE_OUT } }
            : { scale: 1 }
        }
        transition={SPRING_PRESS}
        className={`min-h-[28px] px-2.5 py-1 flex items-center gap-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer border touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${getButtonClass(copied, isDark)}`}
        title={title}
        aria-label={ariaLabel}
      >
        <CopyButtonContent copied={copied} />
        <span className="font-vazir">{text}</span>
      </m.button>
    </div>
  );
}
