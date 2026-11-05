'use client';

/**
 * @file components/showcase/showcase-bento.tsx
 * @description Gapless Bento Grid with grid-flow-dense and mathematically interlocking card dimensions.
 */

import React from 'react';
import Image from 'next/image';
import { AlignRight, ShieldCheck, Activity, Terminal } from '@/components/animate-ui/icons';
import showcaseEditorialImg from '@/public/images/showcase-editorial.svg';

interface ShowcaseBentoProps {
  isDark: boolean;
  isFa: boolean;
}

export function ShowcaseBento({ isDark, isFa }: ShowcaseBentoProps): React.JSX.Element {
  return (
    <section className="relative w-full py-24 sm:py-32 md:py-40 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="max-w-3xl mb-12 sm:mb-16">
        <h2
          className={`text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight ${
            isDark ? 'text-zinc-100' : 'text-zinc-950'
          } ${isFa ? 'font-vazir' : 'font-sans'}`}
        >
          {isFa
            ? 'معماری یکپارچه برای پردازش ظریف متون هیبریدی'
            : 'Engineered Precision for Bi-Directional Prose'}
        </h2>
        <p
          className={`mt-4 text-sm sm:text-base leading-relaxed ${
            isDark ? 'text-zinc-400' : 'text-zinc-600'
          }`}
        >
          {isFa
            ? 'طراحی بدون مصالحه: هر سلول شبکه با الگوریتم‌های اختصاصی جداسازی متن و محاسبات در حافظه کلاینت همگام شده است.'
            : 'Uncompromising design: each grid tile mirrors our in-memory client engine, pure domain seams, and zero-backend execution.'}
        </p>
      </div>

      {/* Gapless Bento Grid: 4 columns, dense packing, exactly 8 interlocking cells */}
      <div className="grid grid-cols-1 md:grid-cols-4 grid-flow-dense gap-4 sm:gap-6 auto-rows-[240px] sm:auto-rows-[270px]">
        {/* Card 1: 2 cols x 2 rows (4 cells) - RTL/LTR Hybrid Core */}
        <div
          className={`group relative md:col-span-2 md:row-span-2 rounded-3xl overflow-hidden border p-6 sm:p-8 flex flex-col justify-between transition-colors duration-500 shadow-xl ${
            isDark
              ? 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700'
              : 'bg-white border-zinc-200/90 hover:border-zinc-300 shadow-zinc-200/50'
          }`}
        >
          {/* Background Image with Hover Physics */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Image
              src={showcaseEditorialImg}
              alt="Editorial Architecture"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover opacity-15 grayscale contrast-125 mix-blend-luminosity group-hover:scale-105 transition-transform duration-700 ease-out"
              referrerPolicy="no-referrer"
            />
            <div
              className={`absolute inset-0 ${
                isDark
                  ? 'bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent'
                  : 'bg-gradient-to-t from-white via-white/80 to-transparent'
              }`}
            />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <AlignRight className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-mono tracking-wider uppercase px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ADR-0001
            </span>
          </div>

          <div className="relative z-10 mt-auto pt-8">
            <h3
              className={`text-xl sm:text-2xl font-bold tracking-tight ${
                isDark ? 'text-zinc-100' : 'text-zinc-900'
              }`}
            >
              {isFa ? 'جداسازی هوشمند متون راست‌چین از بلوک‌های کد' : 'Intelligent RTL & LTR Isolation'}
            </h3>
            <p
              className={`mt-3 text-xs sm:text-sm leading-relaxed ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              {isFa
                ? 'متون فارسی با خوانایی حداکثری و فونت‌های دانا و وزیرمتن رندر می‌شوند، در حالی که کدهای سیستمی، کاراکترهای اسکی و جداول چندستونی در ساختار چپ‌چین با Kode Mono محافظت می‌شوند.'
                : 'Persian and Arabic prose flow in native right-to-left alignment, while system code blocks, ASCII delimiters, and GFM tables remain anchored in pristine LTR monospace.'}
            </p>
          </div>
        </div>

        {/* Card 2: 2 cols x 1 row (2 cells) - KaTeX Scientific Math */}
        <div
          className={`group relative md:col-span-2 md:row-span-1 rounded-3xl overflow-hidden border p-6 sm:p-7 flex flex-col justify-between transition-colors duration-500 shadow-lg ${
            isDark
              ? 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700'
              : 'bg-white border-zinc-200/90 hover:border-zinc-300 shadow-zinc-200/50'
          }`}
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              KaTeX + Math
            </span>
          </div>

          <div className="relative z-10 mt-auto">
            <h3
              className={`text-lg sm:text-xl font-bold tracking-tight ${
                isDark ? 'text-zinc-100' : 'text-zinc-900'
              }`}
            >
              {isFa ? 'فرمول‌های علمی و نمادهای ریاضی کاتک' : 'KaTeX Scientific Formulae'}
            </h3>
            <p
              className={`mt-2 text-xs leading-relaxed ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              {isFa
                ? 'رندر درون‌متنی و بلاک نمادهای یونانی و معادلات دیفرانسیل با تفکیک کامل جهت متن فارسی.'
                : 'Inline and block mathematical notation rendered with zero latency and flawless RTL isolation.'}
            </p>
          </div>
        </div>

        {/* Card 3: 1 col x 1 row (1 cell) - Zero Backend Privacy */}
        <div
          className={`group relative md:col-span-1 md:row-span-1 rounded-3xl overflow-hidden border p-6 flex flex-col justify-between transition-colors duration-500 shadow-lg ${
            isDark
              ? 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700'
              : 'bg-white border-zinc-200/90 hover:border-zinc-300 shadow-zinc-200/50'
          }`}
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              ADR-0008
            </span>
          </div>

          <div className="relative z-10 mt-auto">
            <h3
              className={`text-base font-bold tracking-tight ${
                isDark ? 'text-zinc-100' : 'text-zinc-900'
              }`}
            >
              {isFa ? 'حریم خصوصی محلی' : '100% In-Memory'}
            </h3>
            <p
              className={`mt-1.5 text-xs leading-normal ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              {isFa
                ? 'تمام محاسبات در مرورگر کلاینت انجام می‌شود. صفر بایت ارسال به سرور.'
                : 'Pure local execution in browser RAM. Zero telemetry or server calls.'}
            </p>
          </div>
        </div>

        {/* Card 4: 1 col x 1 row (1 cell) - C-Family Syntax Enhancer */}
        <div
          className={`group relative md:col-span-1 md:row-span-1 rounded-3xl overflow-hidden border p-6 flex flex-col justify-between transition-colors duration-500 shadow-lg ${
            isDark
              ? 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700'
              : 'bg-white border-zinc-200/90 hover:border-zinc-300 shadow-zinc-200/50'
          }`}
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              C / Rust / TS
            </span>
          </div>

          <div className="relative z-10 mt-auto">
            <h3
              className={`text-base font-bold tracking-tight ${
                isDark ? 'text-zinc-100' : 'text-zinc-900'
              }`}
            >
              {isFa ? 'هایلایت معنایی' : 'Syntax Engine'}
            </h3>
            <p
              className={`mt-1.5 text-xs leading-normal ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              {isFa
                ? 'تفکیک دقیق پوینترها، انواع سیستمی و متون فارسی در کامنت‌ها.'
                : 'Semantic token separation for pointers, constants, and mixed comments.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
