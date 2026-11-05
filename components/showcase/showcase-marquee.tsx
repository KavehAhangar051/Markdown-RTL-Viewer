'use client';

/**
 * @file components/showcase/showcase-marquee.tsx
 * @description Infinite scrolling marquee displaying core technical capabilities.
 */

import React from 'react';
import {
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  Database,
  Terminal,
  Activity,
  Binary,
} from '@/components/animate-ui/icons';

interface ShowcaseMarqueeProps {
  isDark: boolean;
  isFa: boolean;
}

const CAPABILITIES = [
  { fa: 'ایزولاسیون کامل کدهای چپ‌چین', en: 'Strict LTR Code Isolation', icon: Terminal },
  { fa: 'حریم خصوصی ۱۰۰٪ بدون سرور', en: 'Zero-Backend Local Privacy', icon: ShieldCheck },
  { fa: 'رندر فرمول‌های علمی کاتک', en: 'KaTeX Mathematical Formulae', icon: Activity },
  { fa: 'کش دوگانه کراندار LRU', en: 'Bounded LRU In-Memory Cache', icon: Database },
  { fa: 'هایلایت نحوی خانواده C و توکن‌های فارسی', en: 'C-Family & Mixed Token Highlighting', icon: Binary },
  { fa: 'پردازش غیرمسدودکننده ۶۰fps', en: 'Deferred 60fps Reactivity', icon: Zap },
  { fa: 'انتقال‌های صفحه با View Transitions', en: 'Hardware Accelerated View Transitions', icon: Layers },
  { fa: 'محاسبات بدون وابستگی DOM', en: 'Pure Functional Domain Seam', icon: Cpu },
];

export function ShowcaseMarquee({ isDark, isFa }: ShowcaseMarqueeProps): React.JSX.Element {
  return (
    <div
      className={`relative w-full overflow-hidden py-4 border-y ${
        isDark ? 'border-zinc-800/80 bg-zinc-950/40' : 'border-zinc-200/80 bg-zinc-100/50'
      }`}
    >
      {/* Side Vignette Fades */}
      <div
        className={`absolute inset-y-0 left-0 w-20 z-10 pointer-events-none ${
          isDark
            ? 'bg-gradient-to-r from-black to-transparent'
            : 'bg-gradient-to-r from-slate-100 to-transparent'
        }`}
      />
      <div
        className={`absolute inset-y-0 right-0 w-20 z-10 pointer-events-none ${
          isDark
            ? 'bg-gradient-to-l from-black to-transparent'
            : 'bg-gradient-to-l from-slate-100 to-transparent'
        }`}
      />

      <div className="flex w-max animate-marquee space-x-8 sm:space-x-12 rtl:space-x-reverse select-none">
        {[...CAPABILITIES, ...CAPABILITIES].map((item, idx) => {
          const Icon = item.icon;

          return (
            <div
              key={`${item.en}-${idx}`}
              className="flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium tracking-tight opacity-75 hover:opacity-100 transition-opacity"
            >
              <Icon className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>
                {isFa ? item.fa : item.en}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
