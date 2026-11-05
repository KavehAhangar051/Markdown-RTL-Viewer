'use client';

/**
 * @file components/showcase/showcase-hero.tsx
 * @description Cinematic Center Hero section following AIDA structure and wide editorial typography.
 */

import React from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Play, FileCode } from '@/components/animate-ui/icons';
import showcaseTypographyImg from '@/src/assets/images/showcase_typography_1793882927470.jpg';

interface ShowcaseHeroProps {
  isDark: boolean;
  isFa: boolean;
  onLaunchEditor: () => void;
  onLoadSample: () => void;
}

export function ShowcaseHero({
  isDark,
  isFa,
  onLaunchEditor,
  onLoadSample,
}: ShowcaseHeroProps): React.JSX.Element {
  const ArrowIcon = isFa ? ArrowLeft : ArrowRight;

  return (
    <section className="relative w-full pt-20 sm:pt-28 md:pt-36 pb-24 sm:pb-32 px-4 sm:px-6 flex flex-col items-center justify-center text-center overflow-hidden">
      {/* Background Ambient Radial Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[480px] rounded-full blur-[140px] pointer-events-none opacity-25"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(16,185,129,0.35) 0%, rgba(59,130,246,0.15) 50%, transparent 75%)'
            : 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, rgba(99,102,241,0.12) 50%, transparent 75%)',
        }}
      />

      {/* Cinematic Ultra-Wide Heading Container (Guarantees 2-3 lines max) */}
      <div className="relative z-10 max-w-6xl w-full mx-auto">
        <h1
          className={`text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.18] sm:leading-[1.15] ${
            isDark ? 'text-zinc-100' : 'text-zinc-950'
          } ${isFa ? 'font-vazir' : 'font-sans'}`}
        >
          {isFa ? (
            <>
              استودیو پیشرفته پردازش متن
              <span className="relative inline-flex items-center align-middle mx-2.5 sm:mx-3.5 my-1">
                <span className="relative w-20 sm:w-28 md:w-32 h-9 sm:h-12 md:h-14 rounded-full overflow-hidden border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
                  <Image
                    src={showcaseTypographyImg}
                    alt="Bi-directional Typography Geometry"
                    fill
                    sizes="(max-width: 768px) 120px, 160px"
                    className="object-cover contrast-110 hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                    priority
                  />
                </span>
              </span>
              راست‌چین با وفاداری کامل به ساختار کد
            </>
          ) : (
            <>
              High Precision Markdown Studio
              <span className="relative inline-flex items-center align-middle mx-2.5 sm:mx-3.5 my-1">
                <span className="relative w-20 sm:w-28 md:w-32 h-9 sm:h-12 md:h-14 rounded-full overflow-hidden border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
                  <Image
                    src={showcaseTypographyImg}
                    alt="Bi-directional Typography Geometry"
                    fill
                    sizes="(max-width: 768px) 120px, 160px"
                    className="object-cover contrast-110 hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                    priority
                  />
                </span>
              </span>
              Engineered for Hybrid Bi-directional Text
            </>
          )}
        </h1>

        {/* Subtitle with High-Contrast Typography */}
        <p
          className={`mt-6 sm:mt-8 max-w-3xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed font-normal ${
            isDark ? 'text-zinc-400' : 'text-zinc-600'
          } ${isFa ? 'font-vazir' : 'font-sans'}`}
        >
          {isFa
            ? 'محیط کاری اختصاصی برای جداسازی هوشمند متون راست‌چین فارسی از بلوک‌های سیستمی کد، فرمول‌های علمی کاتک و جداول ساختاریافته در کلاینت بدون نیاز به سرور.'
            : 'Dedicated client-side studio isolating Persian and Arabic RTL prose from system code blocks, KaTeX scientific formulas, and GFM structured tables with zero backend.'}
        </p>

        {/* Two High-Contrast CTAs */}
        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
          <button
            type="button"
            onClick={onLaunchEditor}
            className={`w-full sm:w-auto px-7 py-3.5 min-h-[50px] rounded-full text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 shadow-xl cursor-pointer hover:scale-[1.03] active:scale-[0.98] ${
              isDark
                ? 'bg-white text-zinc-950 hover:bg-zinc-100 shadow-white/10'
                : 'bg-zinc-950 text-white hover:bg-zinc-800 shadow-zinc-950/20'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isFa ? 'شروع کار در استودیو' : 'Launch Studio'}</span>
            <ArrowIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onLoadSample}
            className={`w-full sm:w-auto px-6 py-3.5 min-h-[50px] rounded-full text-sm font-semibold flex items-center justify-center gap-2 border transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
              isDark
                ? 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80 hover:border-zinc-500'
                : 'bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-300 hover:border-zinc-400'
            }`}
          >
            <FileCode className="w-4 h-4 text-emerald-500" />
            <span>{isFa ? 'بارگذاری سند نمونه' : 'Load Sample Document'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
