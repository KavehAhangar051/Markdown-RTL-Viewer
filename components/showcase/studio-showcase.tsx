'use client';

/**
 * @file components/showcase/studio-showcase.tsx
 * @description Master AIDA showcase container implementing award-winning design engineering.
 */

import React from 'react';
import { useMarkdownContext } from '@/store/MarkdownContext';
import { ShowcaseHero } from '@/components/showcase/showcase-hero';
import { ShowcaseMarquee } from '@/components/showcase/showcase-marquee';
import { ShowcaseBento } from '@/components/showcase/showcase-bento';
import { ShowcaseAccordion } from '@/components/showcase/showcase-accordion';
import { ShowcaseCta } from '@/components/showcase/showcase-cta';

interface StudioShowcaseProps {
  onClose?: () => void;
}

export function StudioShowcase({ onClose }: StudioShowcaseProps): React.JSX.Element {
  const { theme, language, loadSample } = useMarkdownContext();
  const isDark = theme === 'dark';
  const isFa = language === 'fa';

  const handleLaunchEditor = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleLoadSample = () => {
    loadSample();
    if (onClose) {
      onClose();
    }
  };

  return (
    <main
      id="studio-showcase-flow"
      className={`relative overflow-x-hidden w-full max-w-full transition-colors duration-300 selection:bg-emerald-500/25 ${
        isDark ? 'bg-[#060608] text-zinc-100' : 'bg-[#f8fafc] text-zinc-900'
      } ${isFa ? 'font-vazir' : 'font-sans'}`}
      dir={isFa ? 'rtl' : 'ltr'}
    >
      {/* Architectural Blueprint Coordinate Grid & Radial Mask */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className={`absolute inset-0 ${
            isDark ? 'opacity-[0.055]' : 'opacity-[0.045]'
          }`}
          style={{
            backgroundImage: isDark
              ? 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)'
              : 'linear-gradient(to right, #09090b 1px, transparent 1px), linear-gradient(to bottom, #09090b 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage:
              'radial-gradient(ellipse 85% 75% at 50% 35%, #000 35%, transparent 100%)',
          }}
        />
        {/* Subtle Top Architectural Horizon Beam */}
        <div
          className="absolute -top-36 left-1/2 -translate-x-1/2 w-[1100px] h-[420px] rounded-full blur-[150px] opacity-25"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(16,185,129,0.28) 0%, rgba(6,182,212,0.14) 45%, transparent 75%)'
              : 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(99,102,241,0.10) 45%, transparent 75%)',
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Attention: Cinematic Center Hero with 16:9 Live 3D Studio Stage */}
        <ShowcaseHero
          isDark={isDark}
          isFa={isFa}
          onLaunchEditor={handleLaunchEditor}
          onLoadSample={handleLoadSample}
        />

        {/* Infinite Scrolling Capability Marquee */}
        <ShowcaseMarquee isDark={isDark} isFa={isFa} />

        {/* Interest: Gapless 4-Column Bento Grid with 1:1 & 16:9 3D Assets */}
        <ShowcaseBento isDark={isDark} isFa={isFa} />

        {/* Desire: Interactive Horizontal Accordion */}
        <ShowcaseAccordion isDark={isDark} isFa={isFa} />

        {/* Action: 16:9 3D Conversion Portal & Structured Engineering Footer */}
        <ShowcaseCta
          isDark={isDark}
          isFa={isFa}
          onLaunchEditor={handleLaunchEditor}
          onLoadSample={handleLoadSample}
        />
      </div>
    </main>
  );
}
