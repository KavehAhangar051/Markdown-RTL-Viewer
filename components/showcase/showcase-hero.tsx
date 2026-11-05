'use client';

/**
 * @file components/showcase/showcase-hero.tsx
 * @description Cinematic Center Hero section following AIDA structure and wide editorial typography.
 */

import React from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Play, FileCode } from '@/components/animate-ui/icons';
import showcaseTypographyImg from '@/src/assets/images/showcase_typography_1793882927470.jpg';
import markdownStudioBannerImg from '@/src/assets/images/markdown_studio_banner_1793882933695.jpg';

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
    <section className="relative w-full pt-16 sm:pt-24 md:pt-28 pb-20 sm:pb-28 px-4 sm:px-6 flex flex-col items-center justify-center text-center overflow-hidden">
      <div className="relative z-10 max-w-6xl w-full mx-auto">
        {/* Cinematic Balanced Display Headline */}
        <h1
          className={`text-3xl sm:text-5xl md:text-6xl lg:text-[4.15rem] font-extrabold tracking-tight leading-[1.2] sm:leading-[1.15] [text-wrap:balance] ${
            isDark ? 'text-zinc-100' : 'text-zinc-950'
          } ${isFa ? 'font-vazir' : 'font-sans'}`}
        >
          {isFa ? (
            <>
              استودیو پیشرفته پردازش متن
              <span className="relative inline-flex items-center align-middle mx-2.5 sm:mx-3.5 my-1">
                <span className="relative w-20 sm:w-28 md:w-36 h-9 sm:h-12 md:h-14 rounded-2xl overflow-hidden border border-emerald-500/40 shadow-lg shadow-emerald-500/15">
                  <Image
                    src={showcaseTypographyImg}
                    alt="Bi-directional Typography Geometry"
                    fill
                    sizes="(max-width: 768px) 120px, 160px"
                    className="object-cover contrast-110 hover:scale-110 transition-transform duration-500 transform-gpu"
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
                <span className="relative w-20 sm:w-28 md:w-36 h-9 sm:h-12 md:h-14 rounded-2xl overflow-hidden border border-emerald-500/40 shadow-lg shadow-emerald-500/15">
                  <Image
                    src={showcaseTypographyImg}
                    alt="Bi-directional Typography Geometry"
                    fill
                    sizes="(max-width: 768px) 120px, 160px"
                    className="object-cover contrast-110 hover:scale-110 transition-transform duration-500 transform-gpu"
                    referrerPolicy="no-referrer"
                    priority
                  />
                </span>
              </span>
              Engineered for Hybrid Bi-Directional Text
            </>
          )}
        </h1>

        {/* High-Contrast Editorial Subtitle */}
        <p
          className={`mt-6 sm:mt-7 max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed font-normal [text-wrap:balance] ${
            isDark ? 'text-zinc-400' : 'text-zinc-600'
          } ${isFa ? 'font-vazir' : 'font-sans'}`}
        >
          {isFa
            ? 'محیط کاری اختصاصی برای جداسازی هوشمند متون راست‌چین فارسی از بلوک‌های سیستمی کد، فرمول‌های علمی کاتک و جداول ساختاریافته در حافظه کلاینت بدون نیاز به سرور.'
            : 'Dedicated client-side studio isolating Persian and Arabic RTL prose from system code blocks, KaTeX scientific formulas, and GFM structured tables with zero backend.'}
        </p>

        {/* Action Controls */}
        <div className="mt-9 sm:mt-11 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md mx-auto">
          <button
            type="button"
            onClick={onLaunchEditor}
            className={`w-full sm:w-auto px-7 py-3.5 min-h-[48px] rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 shadow-xl cursor-pointer whitespace-nowrap shrink-0 hover:scale-[1.02] active:scale-[0.98] transform-gpu ${
              isDark
                ? 'bg-zinc-100 text-zinc-950 hover:bg-white shadow-emerald-500/10'
                : 'bg-zinc-950 text-white hover:bg-zinc-800 shadow-zinc-950/15'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isFa ? 'شروع کار در استودیو' : 'Launch Studio'}</span>
            <ArrowIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onLoadSample}
            className={`w-full sm:w-auto px-6 py-3.5 min-h-[48px] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 hover:scale-[1.02] active:scale-[0.98] transform-gpu ${
              isDark
                ? 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border-zinc-800 hover:border-zinc-700'
                : 'bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-300 hover:border-zinc-400'
            }`}
          >
            <FileCode className="w-4 h-4 text-emerald-500" />
            <span>{isFa ? 'بارگذاری سند نمونه' : 'Load Sample Document'}</span>
          </button>
        </div>

        {/* Clean 16:9 Architectural 3D Stage */}
        <div className="mt-14 sm:mt-16 max-w-5xl mx-auto">
          <div
            onClick={onLaunchEditor}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onLaunchEditor();
              }
            }}
            className={`group relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-3xl overflow-hidden border transition-all duration-500 cursor-pointer shadow-2xl ${
              isDark
                ? 'bg-zinc-950 border-zinc-800/90 hover:border-emerald-500/40 shadow-black/80'
                : 'bg-zinc-950 border-zinc-800 hover:border-emerald-500/50 shadow-zinc-400/30'
            }`}
          >
            <Image
              src={markdownStudioBannerImg}
              alt="RTL Markdown Studio 3D Geometric Architecture"
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-700 ease-out transform-gpu"
              referrerPolicy="no-referrer"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-zinc-950/20" />
          </div>
        </div>
      </div>
    </section>
  );
}
