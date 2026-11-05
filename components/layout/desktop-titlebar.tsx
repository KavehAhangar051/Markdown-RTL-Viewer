'use client';

/**
 * @file components/layout/desktop-titlebar.tsx
 * @description Custom frameless Windows 11 / TinyJS desktop titlebar replacing the legacy white Win32
 * titlebar and menu bar with a dark glassmorphic studio bar (`data-tiny-drag`).
 */

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import {
  Upload,
  Download,
  FileCode,
  Trash2,
  X,
  Terminal,
} from '@/components/animate-ui/icons';
import { RefreshCw } from 'lucide-react';
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
import {
  checkTinyDesktopDeltaUpdate,
  executeTinyDesktopDeltaUpdate,
  formatDeltaBytes,
  TinyDeltaUpdatePlan,
} from '@/utils/tinyDesktopUpdater';

const subscribeDesktop = (onStoreChange: () => void) => {
  window.addEventListener('resize', onStoreChange);

  return () => window.removeEventListener('resize', onStoreChange);
};

const getIsDesktopClient = () => isTinyDesktopRuntime();
const getServerIsDesktopClient = () => false;

/**
 * Custom dark/theme-aware titlebar rendered exclusively inside the TinyJS desktop runtime.
 * Provides native window dragging (`data-tiny-drag`), quick File actions, differential (delta)
 * self-updater button, active document title, and Windows 11 Minimize / Maximize / Close controls.
 */
export function DesktopTitlebar(): React.JSX.Element | null {
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    getIsDesktopClient,
    getServerIsDesktopClient
  );

  const [updatePlan, setUpdatePlan] = useState<TinyDeltaUpdatePlan | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<string>('');
  const [activeVersion, setActiveVersion] = useState<string>('2.2.0');

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

  useEffect(() => {
    if (!isDesktop) {
      return;
    }

    let cancelled = false;

    void checkTinyDesktopDeltaUpdate().then((plan) => {
      if (cancelled || !plan) return;
      setActiveVersion(plan.currentVersion);

      if (plan.available) {
        setUpdatePlan(plan);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isDesktop]);

  if (!isDesktop) {
    return null;
  }

  const isDark = theme === 'dark';
  const isFa = language === 'fa';

  const handleApplyDeltaUpdate = async () => {
    if (!updatePlan || isUpdating) return;

    setIsUpdating(true);
    setUpdateProgress(`0/${updatePlan.changedFiles.length}`);

    const ok = await executeTinyDesktopDeltaUpdate(updatePlan, (done, total) => {
      setUpdateProgress(`${done}/${total}`);
    });

    setIsUpdating(false);

    if (ok) {
      const targetVer = updatePlan.latestVersion;
      setActiveVersion(targetVer);
      setUpdatePlan(null);
      showToast(
        isFa
          ? `بروزرسانی تفاضلی به نسخه v${targetVer} انجام شد (${updatePlan.changedFiles.length} فایل تغییریافته دریافت شد)`
          : `Delta update to v${targetVer} applied (${updatePlan.changedFiles.length} changed files downloaded)`,
        'success'
      );
    } else {
      showToast(
        isFa ? 'خطا در دریافت فایل‌های بروزرسانی تفاضلی' : 'Failed to download delta update files',
        'error'
      );
    }
  };

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
      {/* Left: App Badge, Quick File Bar & Conditional Delta Update Button */}
      <div className="flex items-center gap-1.5" data-tiny-nodrag>
        <div className="flex items-center gap-1.5 pr-2 mr-1 border-r border-white/10 pointer-events-none">
          <Terminal className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-mono font-semibold tracking-tight text-[11px]">
            RTL Studio
          </span>
          <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-400">
            v{activeVersion}
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

        {updatePlan?.available && (
          <button
            type="button"
            id="tiny-desktop-update-btn"
            disabled={isUpdating}
            onClick={() => void handleApplyDeltaUpdate()}
            title={
              isFa
                ? `دریافت فقط فایل‌های تغییریافته (${updatePlan.changedFiles.length} فایل — ${formatDeltaBytes(updatePlan.totalDeltaBytes)})`
                : `Download only modified files (${updatePlan.changedFiles.length} files — ${formatDeltaBytes(updatePlan.totalDeltaBytes)})`
            }
            className="ml-1 px-2.5 py-0.5 rounded-md flex items-center gap-1.5 font-medium bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 text-emerald-400 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>
              {isUpdating
                ? isFa
                  ? `بروزرسانی... (${updateProgress})`
                  : `Updating... (${updateProgress})`
                : isFa
                  ? `بروزرسانی v${updatePlan.latestVersion} (${formatDeltaBytes(updatePlan.totalDeltaBytes)})`
                  : `Update v${updatePlan.latestVersion} (${formatDeltaBytes(updatePlan.totalDeltaBytes)})`}
            </span>
          </button>
        )}
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
