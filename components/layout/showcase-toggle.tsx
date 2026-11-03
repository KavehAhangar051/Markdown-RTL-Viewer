'use client';

/**
 * @file components/layout/showcase-toggle.tsx
 * @description Header button linking to the Awwwards-tier Studio Showcase.
 */

import React from 'react';
import { Sparkles, Code2 } from 'lucide-react';
import { useStudioUI } from '@/store/MarkdownContext';

export function ShowcaseToggle(): React.JSX.Element {
  const { theme, language, isShowcaseOpen, setIsShowcaseOpen } = useStudioUI();
  const isDark = theme === 'dark';
  const isFa = language === 'fa';

  const label = isShowcaseOpen
    ? isFa
      ? 'ویرایشگر استودیو'
      : 'Studio Editor'
    : isFa
      ? 'معرفی استدیو'
      : 'Studio Showcase';

  const handleToggle = () => {
    setIsShowcaseOpen(!isShowcaseOpen);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      id="header-showcase-link"
      aria-label={label}
      title={label}
      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
        isDark
          ? 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800/80 hover:border-zinc-700'
          : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 hover:text-zinc-950 border-zinc-200 hover:border-zinc-300'
      }`}
    >
      {isShowcaseOpen ? (
        <Code2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      ) : (
        <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      )}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
