'use client';

/**
 * @file components/showcase/showcase-bento.tsx
 * @description Gapless Bento Grid with grid-flow-dense and mathematically interlocking card dimensions.
 */

import React from 'react';
import Image from 'next/image';
import { AlignRight, ShieldCheck, Activity, Terminal } from '@/components/animate-ui/icons';
import showcaseEditorialImg from '@/src/assets/images/showcase_editorial_1793882927612.jpg';
import markdownStudioBannerImg from '@/src/assets/images/markdown_studio_banner_1793882933695.jpg';
import showcasePrivacyVaultImg from '@/src/assets/images/showcase_privacy_vault_1793885752501.jpg';
import showcaseSyntaxPrismImg from '@/src/assets/images/showcase_syntax_prism_1793885754672.jpg';

interface ShowcaseBentoProps {
  isDark: boolean;
  isFa: boolean;
}

export function ShowcaseBento({ isDark, isFa }: ShowcaseBentoProps): React.JSX.Element {
  return (
    <section className="relative w-full py-24 sm:py-32 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="max-w-3xl mb-12 sm:mb-16">
        <h2
          className={`text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight [text-wrap:balance] ${
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
            : 'Uncompromising design: each grid tile mirrors our in-memory client engine and zero-backend execution.'}
        </p>
      </div>

      {/* Gapless Bento Grid: 4 columns, dense packing, 8 interlocking cells */}
      <div className="grid grid-cols-1 md:grid-cols-4 grid-flow-dense gap-4 sm:gap-6 auto-rows-[250px] sm:auto-rows-[275px]">
        {/* Card 1: 2 cols x 2 rows (4 cells) - RTL/LTR Hybrid Core */}
        <div
          className={`group relative md:col-span-2 md:row-span-2 rounded-3xl overflow-hidden border p-6 sm:p-8 flex flex-col justify-between transition-colors duration-500 shadow-xl ${
            isDark
              ? 'bg-zinc-950 border-zinc-800/80 hover:border-emerald-500/40'
              : 'bg-zinc-950 border-zinc-800 hover:border-emerald-500/50 shadow-zinc-300/60'
          }`}
        >
          {/* Background 16:9 3D Editorial Artwork */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Image
              src={showcaseEditorialImg}
              alt="Editorial Architecture"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover opacity-80 group-hover:opacity-95 group-hover:scale-105 transition-all duration-700 ease-out transform-gpu"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/15" />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 backdrop-blur-md">
              <AlignRight className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 mt-auto pt-8">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
              {isFa ? 'جداسازی هوشمند متون راست‌چین از بلوک‌های کد' : 'Intelligent RTL & LTR Isolation'}
            </h3>
            <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-zinc-300">
              {isFa
                ? 'متون فارسی با خوانایی حداکثری و فونت وزیرمتن رندر می‌شوند، در حالی که کدهای سیستمی، پرانتزهای دوتایی و جداول در ساختار چپ‌چین با Kode Mono محافظت می‌شوند.'
                : 'Persian and Arabic prose flow in native right-to-left alignment, while system code blocks, paired parentheses, and GFM tables remain anchored in pristine LTR monospace.'}
            </p>
          </div>
        </div>

        {/* Card 2: 2 cols x 1 row (2 cells) - KaTeX Scientific Math */}
        <div
          className={`group relative md:col-span-2 md:row-span-1 rounded-3xl overflow-hidden border p-6 sm:p-7 flex flex-col justify-between transition-colors duration-500 shadow-lg ${
            isDark
              ? 'bg-zinc-950 border-zinc-800/80 hover:border-indigo-500/40'
              : 'bg-zinc-950 border-zinc-800 hover:border-indigo-500/50 shadow-zinc-300/60'
          }`}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Image
              src={markdownStudioBannerImg}
              alt="KaTeX Polyhedral Geometry"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover opacity-75 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700 ease-out transform-gpu"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/15" />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 backdrop-blur-md">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 mt-auto">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100">
              {isFa ? 'فرمول‌های علمی و نمادهای ریاضی کاتک' : 'KaTeX Scientific Formulae'}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
              {isFa
                ? 'رندر درون‌متنی و بلاک نمادهای یونانی و معادلات دیفرانسیل با تفکیک کامل جهت متن فارسی.'
                : 'Inline and block mathematical notation rendered with zero latency and flawless RTL isolation.'}
            </p>
          </div>
        </div>

        {/* Card 3: 1 col x 1 row (1 cell, 1:1 Aspect Ratio) - Zero Backend Privacy */}
        <div
          className={`group relative md:col-span-1 md:row-span-1 rounded-3xl overflow-hidden border p-6 flex flex-col justify-between transition-colors duration-500 shadow-lg ${
            isDark
              ? 'bg-zinc-950 border-zinc-800/80 hover:border-amber-500/40'
              : 'bg-zinc-950 border-zinc-800 hover:border-amber-500/50 shadow-zinc-300/60'
          }`}
        >
          {/* 1:1 Bespoke 3D Containment Vault Image */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Image
              src={showcasePrivacyVaultImg}
              alt="100% In-Memory Local Privacy Vault"
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover opacity-80 group-hover:opacity-95 group-hover:scale-105 transition-all duration-700 ease-out transform-gpu"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/15" />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-400 backdrop-blur-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 mt-auto">
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-zinc-100">
              {isFa ? 'حریم خصوصی محلی' : '100% In-Memory'}
            </h3>
            <p className="mt-1.5 text-xs leading-normal text-zinc-300">
              {isFa
                ? 'تمام محاسبات در مرورگر کلاینت انجام می‌شود. صفر بایت ارسال به سرور.'
                : 'Pure local execution in browser RAM. Zero telemetry or server calls.'}
            </p>
          </div>
        </div>

        {/* Card 4: 1 col x 1 row (1 cell, 1:1 Aspect Ratio) - C-Family Syntax Enhancer */}
        <div
          className={`group relative md:col-span-1 md:row-span-1 rounded-3xl overflow-hidden border p-6 flex flex-col justify-between transition-colors duration-500 shadow-lg ${
            isDark
              ? 'bg-zinc-950 border-zinc-800/80 hover:border-cyan-500/40'
              : 'bg-zinc-950 border-zinc-800 hover:border-cyan-500/50 shadow-zinc-300/60'
          }`}
        >
          {/* 1:1 Bespoke 3D Crystal Syntax Prism Image */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Image
              src={showcaseSyntaxPrismImg}
              alt="Semantic Syntax Highlighting Prism"
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover opacity-80 group-hover:opacity-95 group-hover:scale-105 transition-all duration-700 ease-out transform-gpu"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/15" />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 backdrop-blur-md">
              <Terminal className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 mt-auto">
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-zinc-100">
              {isFa ? 'هایلایت معنایی' : 'Syntax Engine'}
            </h3>
            <p className="mt-1.5 text-xs leading-normal text-zinc-300">
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
