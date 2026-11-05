'use client';

/**
 * @file components/showcase/showcase-cta.tsx
 * @description Action chapter presenting a high-contrast CTA and clean studio footer links.
 */

import React from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  FileCode,
  Code2,
  ExternalLink,
  Download,
} from '@/components/animate-ui/icons';
import showcaseCtaHorizonImg from '@/src/assets/images/showcase_cta_horizon_1793885754907.jpg';

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
    <footer className="relative w-full pt-16 sm:pt-24 pb-16 sm:pb-20 px-4 sm:px-6 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* 16:9 Architectural 3D Conversion Portal */}
        <div
          className={`group relative rounded-3xl overflow-hidden border px-6 py-16 sm:px-12 sm:py-24 text-center flex flex-col items-center justify-center shadow-2xl ${
            isDark
              ? 'bg-zinc-950 border-zinc-800/90 shadow-black/80'
              : 'bg-zinc-950 border-zinc-800 shadow-zinc-400/30'
          }`}
        >
          {/* 16:9 Bespoke 3D Perspective Horizon Image */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Image
              src={showcaseCtaHorizonImg}
              alt="Architectural 3D Perspective Horizon"
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover opacity-85 group-hover:scale-[1.03] transition-transform duration-700 ease-out transform-gpu"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/35" />
          </div>

          {/* Unboxed Architectural Index */}
          <div
            dir="ltr"
            className="relative z-10 mb-5 flex items-center justify-center gap-2 text-xs font-mono tracking-widest uppercase text-zinc-300"
          >
            <span className="text-emerald-400 font-semibold">03</span>
            <span aria-hidden="true" className="opacity-40">
              ·
            </span>
            <span>DIRECT WORKSPACE ENTRY</span>
            <span aria-hidden="true" className="opacity-40">
              ·
            </span>
            <span>ZERO SETUP</span>
          </div>

          {/* High-Contrast Editorial Headline */}
          <h2
            className={`relative z-10 max-w-3xl text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] text-zinc-100 [text-wrap:balance] ${
              isFa ? 'font-vazir' : 'font-sans'
            }`}
          >
            {isFa
              ? 'آماده تجربه نگارش سریع و دقیق مارک‌داون هستید؟'
              : 'Ready to Experience Precision Markdown Craft?'}
          </h2>

          <p className="relative z-10 mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-zinc-300 [text-wrap:balance]">
            {isFa
              ? 'بدون نیاز به ثبت‌نام یا سرور، بلافاصله سند خود را در محیط کاری بنویسید یا سند نمونه دوجهته را بارگذاری کنید.'
              : 'No signup, no dependencies, zero backend. Launch the studio editor right away or load the bi-directional sample document.'}
          </p>

          {/* Action Buttons */}
          <div className="relative z-10 mt-9 sm:mt-11 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md mx-auto">
            <button
              type="button"
              onClick={onLaunchEditor}
              className="w-full sm:w-auto px-8 py-4 min-h-[50px] rounded-xl text-sm sm:text-base font-semibold flex items-center justify-center gap-2.5 bg-zinc-100 text-zinc-950 hover:bg-white transition-all duration-200 shadow-2xl cursor-pointer whitespace-nowrap shrink-0 hover:scale-[1.02] active:scale-[0.98] transform-gpu"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isFa ? 'ورود به ویرایشگر استودیو' : 'Enter Studio Editor'}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onLoadSample}
              className="w-full sm:w-auto px-6 py-4 min-h-[50px] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 border border-zinc-700/80 hover:border-zinc-500 transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 hover:scale-[1.02] active:scale-[0.98] transform-gpu"
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>{isFa ? 'بارگذاری سند نمونه' : 'Load Sample'}</span>
            </button>
          </div>
        </div>

        {/* 4-Column Structured Engineering Footer */}
        <div
          className={`mt-16 sm:mt-20 pt-12 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 ${
            isDark ? 'border-zinc-800/70' : 'border-zinc-200'
          }`}
        >
          {/* Column 1: Studio Brand & Architecture */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-base font-bold tracking-tight ${
                  isDark ? 'text-zinc-100' : 'text-zinc-900'
                }`}
              >
                RTL Markdown Studio
              </span>
              <span className="text-xs font-mono text-emerald-500 tabular-nums">v2.3.2</span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {isFa
                ? 'استودیوی تخصصی پردازش متون راست‌چین فارسی و بلوک‌های کد چپ‌چین با معماری ۱۰۰٪ محلی و نرخ رندر ۶۰ فریم بر ثانیه.'
                : 'Precision bi-directional Markdown workspace engineered for Persian/Arabic RTL prose and LTR system code at locked 60fps.'}
            </p>
          </div>

          {/* Column 2: Core Engine Specifications */}
          <div className="space-y-3">
            <h3
              className={`text-xs font-mono uppercase tracking-wider ${
                isDark ? 'text-zinc-300' : 'text-zinc-800'
              }`}
            >
              {isFa ? 'مشخصات موتور' : 'Engine Specifications'}
            </h3>
            <ul className={`space-y-2 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              <li>Unicode UAX #9 BiDi Segmenter</li>
              <li>Vazirmatn + Kode Mono Pairing</li>
              <li>KaTeX Mathematical Typesetting</li>
              <li>128-Slot Bounded LRU Memo Cache</li>
            </ul>
          </div>

          {/* Column 3: Quick Studio Actions */}
          <div className="space-y-3">
            <h3
              className={`text-xs font-mono uppercase tracking-wider ${
                isDark ? 'text-zinc-300' : 'text-zinc-800'
              }`}
            >
              {isFa ? 'دسترسی سریع' : 'Workspace Actions'}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={onLaunchEditor}
                  className={`hover:text-emerald-500 transition-colors cursor-pointer ${
                    isDark ? 'text-zinc-400' : 'text-zinc-600'
                  }`}
                >
                  {isFa ? 'باز کردن ویرایشگر زنده' : 'Launch Live Workspace'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onLoadSample}
                  className={`hover:text-emerald-500 transition-colors cursor-pointer ${
                    isDark ? 'text-zinc-400' : 'text-zinc-600'
                  }`}
                >
                  {isFa ? 'بارگذاری سند نمونه جامع' : 'Load Comprehensive Sample'}
                </button>
              </li>
              <li className={`font-mono text-[11px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                {isFa ? 'بروزرسانی تفاضلی در سطح کاراکتر' : 'Character-Level Delta Updater'}
              </li>
            </ul>
          </div>

          {/* Column 4: Official Links & Releases */}
          <div className="space-y-3">
            <h3
              className={`text-xs font-mono uppercase tracking-wider ${
                isDark ? 'text-zinc-300' : 'text-zinc-800'
              }`}
            >
              {isFa ? 'مخزن و انتشارها' : 'Repository & Releases'}
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="https://github.com/KavehAhangar051/Markdown-RTL-Viewer"
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 hover:text-emerald-500 transition-colors ${
                    isDark ? 'text-zinc-400' : 'text-zinc-600'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isFa ? 'مخزن رسمی گیت‌هاب' : 'GitHub Source Repository'}</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/KavehAhangar051/Markdown-RTL-Viewer/releases/latest"
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 hover:text-emerald-500 transition-colors ${
                    isDark ? 'text-zinc-400' : 'text-zinc-600'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{isFa ? 'دانلود نسخه پرتابل ویندوز (x64)' : 'Windows Portable Release (x64)'}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Hairline Legal & Telemetry Strip */}
        <div
          dir="ltr"
          className={`mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono ${
            isDark ? 'border-zinc-900 text-zinc-500' : 'border-zinc-200/80 text-zinc-500'
          }`}
        >
          <div>RTL MARKDOWN STUDIO · MIT LICENSE · ZERO TELEMETRY</div>
          <div className="tabular-nums">1920×1080 NATIVE · WEBVIEW2 GPU · 60 FPS</div>
        </div>
      </div>
    </footer>
  );
}
