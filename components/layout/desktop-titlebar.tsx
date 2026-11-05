'use client';

/**
 * @file components/layout/desktop-titlebar.tsx
 * @description Custom frameless Windows 11 / TinyJS desktop titlebar replacing the legacy white Win32
 * titlebar and menu bar with a dark glassmorphic studio bar (`data-tiny-drag`).
 */

import React, { useSyncExternalStore } from 'react';
import {
  Upload,
  Download,
  FileCode,
  Trash2,
  X,
  Terminal,
} from '@/components/animate-ui/icons';
import { useStudioUI, usePreviewDocument } from '@/store/MarkdownContext';
import { prepareExportBundle } from '@/services/markdownEngine';
import {
  isTinyDesktopRuntime,
  openMarkdownViaTinyDesktop,
  saveMarkdownViaTinyDesktop,
  minimizeTinyWindow,
  toggleMaximizeTinyWindow,
  closeTinyWindow,
} from '@/utils/tinyDesktopBridge';

const subscribeDesktop = (onStoreChange: () => void) => {
  window.addEventListener('resize', onStoreChange);

  return () => window.removeEventListener('resize', onStoreChange);
};

const getIsDesktopClient = () => isTinyDesktopRuntime();
const getServerIsDesktopClient = () => false;

/**
 * Custom dark/theme-aware titlebar rendered exclusively inside the TinyJS desktop runtime.
 * Provides native window dragging (`data-tiny-drag`), quick File actions, active document title,
 * and Windows 11 Minimize / Maximize / Close window controls without any white Win32 bar.
 */
export function DesktopTitlebar(): React.JSX.Element | null {
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    getIsDesktopClient,
    getServerIsDesktopClient
  );

  const {
    theme,
    language,
    applyExternalMarkdown,
    getExportSnapshot,
    setIsShowcaseOpen,
    loadSample,
    clearContent,
    showToast,
    t,
  } = useStudioUI();

  const { documentTitle } = usePreviewDocument();

  if (!isDesktop) {
    return null;
  }

  const isDark = theme === 'dark';
  const isFa = language === 'fa';

  const handleOpenFile = async () => {
    const outcome = await openMarkdownViaTinyDesktop();

    if (outcome.status === 'ok') {
      setIsShowcaseOpen(false);
      applyExternalMarkdown(outcome.content);
      showToast(t.toasts.uploadSuccess(outcome.fileName), 'success');
    } else if (outcome.status === 'invalid_type') {
      showToast(t.toasts.invalidFileType, 'error');
    } else if (outcome.status === 'file_too_large') {
      showToast(t.uploadModal.maxSizeText, 'error');
    } else if (outcome.status === 'read_error') {
      showToast(t.toasts.fileReadError, 'error');
    }
  };

  const handleSaveFile = async () => {
    const { rtlMarkdown: currentRtl, documentTitle: currentTitle } = getExportSnapshot();

    if (!currentRtl.trim()) {
      showToast(t.toasts.noTextToDownload, 'error');

      return;
    }

    const bundle = prepareExportBundle(currentRtl, currentTitle);
    const outcome = await saveMarkdownViaTinyDesktop(bundle.content, bundle.filename);

    if (outcome.status === 'ok') {
      showToast(t.toasts.downloadSuccess, 'success');
    } else if (outcome.status === 'write_error') {
      showToast(t.toasts.fileReadError, 'error');
    }
  };

  const handleSample = () => {
    setIsShowcaseOpen(false);
    loadSample();
  };

  const handleClear = () => {
    setIsShowcaseOpen(false);
    clearContent();
  };

  const actionBtnClass = isDark
    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-white/10'
    : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/5';

  return (
    <div
      id="tiny-desktop-titlebar"
      dir="ltr"
      data-tiny-drag
      onDoubleClick={() => void toggleMaximizeTinyWindow()}
      className={`w-full h-8 shrink-0 select-none flex items-center justify-between pl-3 pr-0 border-b text-[11px] z-50 transition-colors ${
        isDark
          ? 'bg-zinc-950/95 border-white/10 text-zinc-300'
          : 'bg-zinc-100/95 border-zinc-300/80 text-zinc-700'
      }`}
    >
      {/* Left: App Badge & Quick File Bar */}
      <div className="flex items-center gap-1.5" data-tiny-nodrag>
        <div className="flex items-center gap-1.5 pr-2 mr-1 border-r border-white/10 pointer-events-none">
          <Terminal className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-mono font-semibold tracking-tight text-[11px]">
            RTL Studio
          </span>
        </div>

        <button
          type="button"
          onClick={() => void handleOpenFile()}
          title="Ctrl+O"
          className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${actionBtnClass}`}
        >
          <Upload className="w-3 h-3 text-emerald-500" />
          <span>{isFa ? 'باز کردن' : 'Open'}</span>
        </button>

        <button
          type="button"
          onClick={() => void handleSaveFile()}
          title="Ctrl+S"
          className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${actionBtnClass}`}
        >
          <Download className="w-3 h-3 text-emerald-500" />
          <span>{isFa ? 'ذخیره' : 'Save'}</span>
        </button>

        <button
          type="button"
          onClick={handleSample}
          className={`hidden sm:flex px-2 py-0.5 rounded-md items-center gap-1 transition-colors cursor-pointer ${actionBtnClass}`}
        >
          <FileCode className="w-3 h-3 text-emerald-500" />
          <span>{isFa ? 'نمونه' : 'Sample'}</span>
        </button>

        <button
          type="button"
          onClick={handleClear}
          className={`hidden sm:flex px-2 py-0.5 rounded-md items-center gap-1 transition-colors cursor-pointer ${actionBtnClass}`}
        >
          <Trash2 className="w-3 h-3 text-rose-400" />
          <span>{isFa ? 'پاک‌سازی' : 'Clear'}</span>
        </button>
      </div>

      {/* Center: Active Document Title (Draggable) */}
      <div
        data-tiny-drag
        className="flex-1 flex items-center justify-center px-4 truncate pointer-events-none"
      >
        <span dir="auto" className="truncate max-w-[360px] font-medium opacity-75">
          {documentTitle ? `${documentTitle} — ${t.header.brandTitle}` : t.header.brandTitle}
        </span>
      </div>

      {/* Right: Windows 11 Caption Controls */}
      <div className="flex items-center h-full" data-tiny-nodrag>
        <button
          type="button"
          id="tiny-win-minimize"
          onClick={() => void minimizeTinyWindow()}
          aria-label="Minimize"
          className={`h-full w-11 flex items-center justify-center transition-colors cursor-pointer ${
            isDark ? 'hover:bg-white/10 text-zinc-400 hover:text-zinc-100' : 'hover:bg-black/10 text-zinc-600'
          }`}
        >
          <span aria-hidden="true" className="w-2.5 h-[1.5px] bg-current rounded-full" />
        </button>

        <button
          type="button"
          id="tiny-win-maximize"
          onClick={() => void toggleMaximizeTinyWindow()}
          aria-label="Maximize"
          className={`h-full w-11 flex items-center justify-center transition-colors cursor-pointer ${
            isDark ? 'hover:bg-white/10 text-zinc-400 hover:text-zinc-100' : 'hover:bg-black/10 text-zinc-600'
          }`}
        >
          <span aria-hidden="true" className="w-2.5 h-2.5 border-[1.5px] border-current rounded-[2px]" />
        </button>

        <button
          type="button"
          id="tiny-win-close"
          onClick={() => void closeTinyWindow()}
          aria-label="Close"
          className="h-full w-11 flex items-center justify-center transition-colors cursor-pointer hover:bg-red-600 hover:text-white text-zinc-400"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
