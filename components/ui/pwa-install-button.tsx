'use client';

/**
 * @file components/ui/pwa-install-button.tsx
 * @description Header action button and iOS installation modal for Progressive Web App (PWA) setup.
 */

import React, { useState } from 'react';
import { Download, Share, PlusSquare, MoreVertical } from '@/components/animate-ui/icons';
import { Modal } from '@/components/ui/modal';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useStudioUI } from '@/store/MarkdownContext';

/**
 * Renders an adaptive PWA install button in the application header whenever the app is not yet
 * running in standalone mode. Triggers Chromium's native install prompt when available, or opens
 * a guided modal for Desktop / iOS Safari installation.
 *
 * @returns {React.JSX.Element | null} The install button and guide modal, or null if already installed.
 */
export function PWAInstallButton(): React.JSX.Element | null {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { theme, t } = useStudioUI();
  const [activeGuide, setActiveGuide] = useState<'ios' | 'desktop' | null>(null);

  const isDark = theme === 'dark';

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      setActiveGuide('ios');

      return;
    }

    if (isInstallable) {
      const result = await install();

      if (result !== 'unavailable') {
        return;
      }
    }

    setActiveGuide('desktop');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
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
        <span className="hidden sm:inline">{t.pwa.installButton}</span>
      </button>

      <Modal
        isOpen={activeGuide !== null}
        onClose={() => setActiveGuide(null)}
        title={activeGuide === 'ios' ? t.pwa.iosModalTitle : t.pwa.desktopModalTitle}
        description={activeGuide === 'ios' ? t.pwa.iosModalSubtitle : t.pwa.desktopModalSubtitle}
      >
        <div
          className={`space-y-3 rounded-xl p-3.5 mb-4 border text-xs leading-relaxed ${
            isDark
              ? 'bg-zinc-950/70 border-zinc-800/80 text-zinc-300'
              : 'bg-zinc-50 border-zinc-200 text-zinc-700'
          }`}
        >
          {activeGuide === 'ios' ? (
            <>
              <div className="flex items-center gap-2.5">
                <Share className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t.pwa.iosStep1}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <PlusSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t.pwa.iosStep2}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2.5">
                <Download className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{t.pwa.desktopStep1}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MoreVertical className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{t.pwa.desktopStep2}</span>
              </div>
            </>
          )}
        </div>

        {activeGuide === 'desktop' && (
          <>
            <div
              className={`rounded-xl p-3.5 mb-3 border text-xs leading-relaxed ${
                isDark
                  ? 'bg-zinc-950/90 border-emerald-500/30 text-zinc-200'
                  : 'bg-emerald-50/60 border-emerald-200 text-zinc-800'
              }`}
            >
              <div className="font-semibold text-emerald-500 mb-1">
                {t.pwa.tinyjsTitle}
              </div>
              <p className={`text-[11px] mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {t.pwa.tinyjsSubtitle}
              </p>
              <code
                dir="ltr"
                className={`block w-full text-[11px] font-mono px-2.5 py-2 rounded-lg border select-all overflow-x-auto ${
                  isDark
                    ? 'bg-black/80 border-zinc-800 text-emerald-300'
                    : 'bg-white border-zinc-200 text-emerald-800'
                }`}
              >
                {t.pwa.tinyjsBuildCmd}
              </code>
            </div>

            <p
              className={`text-[11px] leading-relaxed mb-4 px-3 py-2 rounded-xl border ${
                isDark
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300/90'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {t.pwa.desktopIframeHint}
            </p>
          </>
        )}

        <button
          type="button"
          onClick={() => setActiveGuide(null)}
          id="pwa-modal-close-btn"
          className="w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
        >
          {t.pwa.iosCloseButton}
        </button>
      </Modal>
    </>
  );
}
