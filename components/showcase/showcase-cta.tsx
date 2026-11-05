'use client';

/**
 * @file components/showcase/showcase-cta.tsx
 * @description Action chapter presenting a high-contrast CTA and clean studio footer links.
 */

import React from 'react';
import { ArrowLeft, ArrowRight, Play, FileCode, Code2, ExternalLink } from '@/components/animate-ui/icons';

interface ShowcaseCtaProps {
  isDark: boolean;
  isFa: boolean;
  onLaunchEditor: () => void;
  onLoadSample: () => void;
}

export function ShowcaseCta({
  isDark,
  isFa,
  onLaunchEditor,
  onLoadSample,
}: ShowcaseCtaProps): React.JSX.Element {
  const ArrowIcon = isFa ? ArrowLeft : ArrowRight;

  return (
    <section className="relative w-full pt-28 sm:pt-36 pb-20 sm:pb-24 px-4 sm:px-6 overflow-hidden border-t border-zinc-800/40">
      {/* Background Radial Glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[380px] rounded-full blur-[160px] pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(99,102,241,0.15) 60%, transparent 80%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Massive Editorial Header */}
        <h2
          className={`text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] ${
            isDark ? 'text-zinc-100' : 'text-zinc-950'
          } ${isFa ? 'font-vazir' : 'font-sans'}`}
        >
          {isFa
            ? 'آماده تجربه نگارش سریع و دقیق مارک‌داون هستید؟'
            : 'Ready to Experience Precision Markdown Craft?'}
        </h2>

        <p
          className={`mt-6 max-w-2xl text-sm sm:text-base leading-relaxed ${
            isDark ? 'text-zinc-400' : 'text-zinc-600'
          }`}
        >
          {isFa
            ? 'بدون نیاز به ثبت‌نام یا نصب، بلافاصله سند خود را در ویرایشگر بنویسید یا نمونه متن را بارگذاری کنید.'
            : 'No signup, no dependencies, zero backend. Launch the studio editor right away or load a sample document.'}
        </p>

        {/* High-Contrast Action Buttons */}
        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
          <button
            type="button"
            onClick={onLaunchEditor}
            className={`w-full sm:w-auto px-8 py-4 min-h-[52px] rounded-full text-base font-semibold flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl cursor-pointer hover:scale-[1.03] active:scale-[0.98] ${
              isDark
                ? 'bg-white text-zinc-950 hover:bg-zinc-100 shadow-white/10'
                : 'bg-zinc-950 text-white hover:bg-zinc-800 shadow-zinc-950/20'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isFa ? 'ورود به ویرایشگر استودیو' : 'Enter Studio Editor'}</span>
            <ArrowIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onLoadSample}
            className={`w-full sm:w-auto px-6 py-4 min-h-[52px] rounded-full text-sm font-semibold flex items-center justify-center gap-2 border transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
              isDark
                ? 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80 hover:border-zinc-500'
                : 'bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-300 hover:border-zinc-400'
            }`}
          >
            <FileCode className="w-4 h-4 text-emerald-500" />
            <span>{isFa ? 'بارگذاری نمونه' : 'Load Sample'}</span>
          </button>
        </div>

        {/* Clean Footer Links */}
        <div className="mt-20 pt-8 border-t border-zinc-800/40 w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">RTL Markdown Studio</span>
            <span>-</span>
            <span>Version 2.0</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Source Code</span>
            </a>
            <button
              type="button"
              onClick={onLaunchEditor}
              className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isFa ? 'ادیتور زنده' : 'Live Editor'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
