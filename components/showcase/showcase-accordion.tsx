'use client';

/**
 * @file components/showcase/showcase-accordion.tsx
 * @description Horizontal expanding accordion slices demonstrating core architecture pillars.
 */

import React, { useState } from 'react';
import Image from 'next/image';
import { Sparkles, Gauge, Compass } from '@/components/animate-ui/icons';

interface ShowcaseAccordionProps {
  isDark: boolean;
  isFa: boolean;
}

const SLICES = [
  {
    id: 'slice-0',
    titleFa: 'مهندسی عمیق دامنه',
    titleEn: 'Deep Domain Seams',
    descFa: 'توابع خالص بدون وابستگی به DOM و فریم‌ورک با استانداردهای آزمون‌پذیری مارتین فاولر و کنت بک.',
    descEn: 'Pure functions independent of DOM and UI frameworks, strictly following PoEAA design seams.',
    image: 'https://picsum.photos/seed/architecture/800/800',
    icon: Compass,
    badge: 'PoEAA & Pragmatic',
  },
  {
    id: 'slice-1',
    titleFa: 'واکنش‌گرایی ۶۰ فریم بر ثانیه',
    titleEn: '60fps Responsive Pipeline',
    descFa: 'خط‌لوله پردازش اسناد حجیم با خط معوق تا پاسخ‌دهی تایپ در ادیتور همیشه بدون لکنت باقی بماند.',
    descEn: 'Deferred processing pipeline ensuring typing responsiveness remains at a locked 60 frames per second.',
    image: 'https://picsum.photos/seed/speed/800/800',
    icon: Gauge,
    badge: 'ADR-0010 Deferred',
  },
  {
    id: 'slice-2',
    titleFa: 'سیستم موشن و تعامل لمسی',
    titleEn: 'Kinetic Motion & Physics',
    descFa: 'داک متحرک مک‌او‌اس با بزرگ‌نمایی پیوسته، انیمیشن‌های فیزیکی اسپرینگ و ترنزیشن‌های بومی کلاینت.',
    descEn: 'Fluid macOS magnification dock, spring physics curves, and GPU-accelerated View Transitions.',
    image: 'https://picsum.photos/seed/abstract/800/800',
    icon: Sparkles,
    badge: 'Spring Physics',
  },
];

export function ShowcaseAccordion({ isDark, isFa }: ShowcaseAccordionProps): React.JSX.Element {
  const [activeSlice, setActiveSlice] = useState<number>(0);

  return (
    <section className="relative w-full py-24 sm:py-32 md:py-40 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Editorial Title */}
      <div className="max-w-3xl mb-12 sm:mb-16">
        <h2
          className={`text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight ${
            isDark ? 'text-zinc-100' : 'text-zinc-950'
          } ${isFa ? 'font-vazir' : 'font-sans'}`}
        >
          {isFa ? 'ارکان مهندسی و تعامل رابط کاربری' : 'Pillars of Architectural Craft'}
        </h2>
        <p
          className={`mt-4 text-sm sm:text-base leading-relaxed ${
            isDark ? 'text-zinc-400' : 'text-zinc-600'
          }`}
        >
          {isFa
            ? 'برش‌های تعاملی افقی: روی هر ستون حرکت کنید تا لایه‌های فنی و معماری استودیو آشکار شود.'
            : 'Interactive horizontal slices: hover across columns to uncover the engineering layers.'}
        </p>
      </div>

      {/* Horizontal Expanding Accordion Container */}
      <div className="flex flex-col md:flex-row gap-4 h-[580px] sm:h-[500px] w-full overflow-hidden">
        {SLICES.map((slice, index) => {
          const isActive = activeSlice === index;
          const Icon = slice.icon;

          return (
            <div
              key={slice.id}
              onMouseEnter={() => setActiveSlice(index)}
              onClick={() => setActiveSlice(index)}
              className={`group relative rounded-3xl overflow-hidden border p-6 sm:p-8 flex flex-col justify-between transition-all duration-700 ease-out cursor-pointer ${
                isActive ? 'md:flex-[3]' : 'md:flex-1'
              } ${
                isDark
                  ? 'bg-zinc-950/90 border-zinc-800 hover:border-zinc-700'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-md'
              }`}
            >
              {/* Background Cover Image with Hover Physics */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <Image
                  src={slice.image}
                  alt={slice.titleEn}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={`object-cover contrast-125 mix-blend-luminosity transition-all duration-700 ${
                    isActive ? 'scale-105 opacity-25' : 'scale-100 opacity-10 grayscale'
                  }`}
                  referrerPolicy="no-referrer"
                />
                <div
                  className={`absolute inset-0 ${
                    isDark
                      ? 'bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent'
                      : 'bg-gradient-to-t from-white via-white/85 to-transparent'
                  }`}
                />
              </div>

              {/* Slice Header with Badge */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                  <Icon animate={isActive ? true : undefined} className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {slice.badge}
                </span>
              </div>

              {/* Bottom Content with Smooth Reveal */}
              <div className="relative z-10 mt-auto pt-6">
                <h3
                  className={`text-lg sm:text-2xl font-bold tracking-tight transition-colors ${
                    isDark ? 'text-zinc-100' : 'text-zinc-900'
                  }`}
                >
                  {isFa ? slice.titleFa : slice.titleEn}
                </h3>
                <p
                  className={`mt-3 text-xs sm:text-sm leading-relaxed transition-all duration-500 ${
                    isActive ? 'opacity-100 max-h-24' : 'opacity-0 md:max-h-0 overflow-hidden'
                  } ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
                >
                  {isFa ? slice.descFa : slice.descEn}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
