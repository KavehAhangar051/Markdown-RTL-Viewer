'use client';

/**
 * @file components/ui/pwa-install-button.tsx
 * @description Header action button and iOS installation modal for Progressive Web App (PWA) setup.
 */

import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useStudioUI } from '@/store/MarkdownContext';

/**
 * Renders an adaptive PWA install button in the application header when the app is installable
 * (via Chromium `beforeinstallprompt` or iOS Safari manual Add to Home Screen).
 *
 * @returns {React.JSX.Element | null} The install button and optional iOS modal, or null if already installed.
 */
export function PWAInstallButton(): React.JSX.Element | null {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { theme, language, t } = useStudioUI();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const isDark = theme === 'dark';
  const isFa = language === 'fa';

  if (isInstalled || (!isInstallable && !isIOS)) {
    return null;
  }

  const handleClick = () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    void install();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        id="header-pwa-install-btn"
        aria-label={t.pwa.installTooltip}
        title={t.pwa.installTooltip}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
          isDark
            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border-emerald-500/30 hover:border-emerald-500/50'
            : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 hover:text-emerald-800 border-emerald-200 hover:border-emerald-300'
        }`}
      >
        <Download className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span className="hidden md:inline">{t.pwa.installButton}</span>
      </button>

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 pointer-events-auto"
          dir={isFa ? 'rtl' : 'ltr'}
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-500 shrink-0" />
                <h3 className="text-sm font-semibold">{t.pwa.iosModalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label={t.pwa.iosCloseButton}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p
              className={`text-xs leading-relaxed mb-4 ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              {t.pwa.iosModalSubtitle}
            </p>

            <div
              className={`space-y-3 rounded-xl p-3.5 mb-4 border text-xs ${
                isDark
                  ? 'bg-zinc-950/70 border-zinc-800/80 text-zinc-300'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Share className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t.pwa.iosStep1}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <PlusSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t.pwa.iosStep2}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              {t.pwa.iosCloseButton}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
