'use client';

/**
 * @file hooks/useTinyDesktopIntegration.ts
 * @description React hook wiring TinyJS native desktop capabilities (menu bar commands,
 * cold-start "Open With" file loading, Windows Explorer file drag-and-drop, deep links,
 * and native window title synchronization) into RTL Markdown Studio.
 */

import { useEffect, useCallback } from 'react';
import { useStudioUI, usePreviewDocument } from '@/store/MarkdownContext';
import { prepareExportBundle } from '@/services/markdownEngine';
import {
  getTinyBridge,
  openMarkdownViaTinyDesktop,
  readMarkdownPathViaTinyDesktop,
  saveMarkdownViaTinyDesktop,
  drainTinyOpenedFiles,
  syncTinyWindowTitle,
  TinyDesktopOpenOutcome,
} from '@/utils/tinyDesktopBridge';
import { TinyStudioMenuCommandId } from '@/types/tiny';

/**
 * Connects the studio workspace to the TinyJS native desktop shell when running as a Windows,
 * macOS, or Linux desktop app. Safely no-ops in standard web browsers.
 */
export function useTinyDesktopIntegration(): void {
  const {
    applyExternalMarkdown,
    getExportSnapshot,
    setViewMode,
    setIsShowcaseOpen,
    toggleFocusMode,
    toggleTheme,
    toggleLanguage,
    setLanguage,
    clearContent,
    loadSample,
    showToast,
    t,
  } = useStudioUI();

  const { documentTitle } = usePreviewDocument();

  const handleOpenOutcome = useCallback(
    (outcome: TinyDesktopOpenOutcome) => {
      if (outcome.status === 'cancelled' || outcome.status === 'unavailable') {
        return;
      }

      if (outcome.status === 'invalid_type') {
        showToast(t.toasts.invalidFileType, 'error');

        return;
      }

      if (outcome.status === 'file_too_large') {
        showToast(t.uploadModal.maxSizeText, 'error');

        return;
      }

      if (outcome.status === 'read_error') {
        showToast(t.toasts.fileReadError, 'error');

        return;
      }

      setIsShowcaseOpen(false);
      applyExternalMarkdown(outcome.content);
      showToast(t.toasts.uploadSuccess(outcome.fileName), 'success');
    },
    [
      applyExternalMarkdown,
      setIsShowcaseOpen,
      showToast,
      t.toasts,
      t.uploadModal.maxSizeText,
    ]
  );

  const handleNativeSave = useCallback(async () => {
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
  }, [getExportSnapshot, showToast, t.toasts.downloadSuccess, t.toasts.fileReadError, t.toasts.noTextToDownload]);

  // Synchronize native Windows/macOS/Linux title bar with active document title
  useEffect(() => {
    void syncTinyWindowTitle(documentTitle, t.header.brandTitle);
  }, [documentTitle, t.header.brandTitle]);

  // Subscribe to native menu bar, cold-start files, OS drag-and-drop, and deep links
  useEffect(() => {
    const tiny = getTinyBridge();

    if (!tiny) {
      return;
    }

    document.documentElement.classList.add('tiny-desktop-gpu');

    const loadQueuedFiles = async () => {
      const files = await drainTinyOpenedFiles();

      if (files.length > 0) {
        const latest = files[files.length - 1];
        setIsShowcaseOpen(false);
        applyExternalMarkdown(latest.content);
        showToast(t.toasts.uploadSuccess(latest.fileName), 'success');
      }
    };

    void loadQueuedFiles();

    const offFilesOpened = tiny.api.on('files-opened', () => {
      void loadQueuedFiles();
    });

    const offDrop = tiny.win.onDrop((paths) => {
      if (!paths || paths.length === 0) {
        return;
      }

      const firstPath = paths[0];
      void readMarkdownPathViaTinyDesktop(firstPath).then(handleOpenOutcome);
    });

    const handleMenuCommand = (commandId: TinyStudioMenuCommandId) => {
      switch (commandId) {
        case 'file-open':
          void openMarkdownViaTinyDesktop().then(handleOpenOutcome);
          break;
        case 'file-save':
          void handleNativeSave();
          break;
        case 'file-sample':
          setIsShowcaseOpen(false);
          loadSample();
          break;
        case 'file-clear':
          setIsShowcaseOpen(false);
          clearContent();
          break;
        case 'view-split':
          setIsShowcaseOpen(false);
          setViewMode('split');
          break;
        case 'view-editor':
          setIsShowcaseOpen(false);
          setViewMode('editor');
          break;
        case 'view-preview':
          setIsShowcaseOpen(false);
          setViewMode('preview');
          break;
        case 'view-focus':
          setIsShowcaseOpen(false);
          toggleFocusMode();
          break;
        case 'view-theme':
          toggleTheme();
          break;
        case 'view-lang':
          toggleLanguage();
          break;
        case 'help-showcase':
          setIsShowcaseOpen(true);
          break;
      }
    };

    const offMenu = tiny.api.on('studio-menu-command', (payload) => {
      handleMenuCommand(payload.id);
    });

    const offDeepLink = tiny.api.on('deep-link-opened', (payload) => {
      if (payload.lang === 'fa' || payload.lang === 'en') {
        setLanguage(payload.lang);
      }

      if (payload.mode === 'split' || payload.mode === 'editor' || payload.mode === 'preview') {
        setIsShowcaseOpen(false);
        setViewMode(payload.mode);
      } else if (payload.action === 'sample') {
        setIsShowcaseOpen(false);
        loadSample();
      }
    });

    return () => {
      offFilesOpened();
      offDrop();
      offMenu();
      offDeepLink();
    };
  }, [
    applyExternalMarkdown,
    clearContent,
    handleNativeSave,
    handleOpenOutcome,
    loadSample,
    setIsShowcaseOpen,
    setLanguage,
    setViewMode,
    showToast,
    t.toasts,
    toggleFocusMode,
    toggleLanguage,
    toggleTheme,
  ]);
}
