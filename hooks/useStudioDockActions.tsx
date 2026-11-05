'use client';

/**
 * @file hooks/useStudioDockActions.tsx
 * @description Custom hook encapsulating actions, handlers, and items configuration for the Studio Dock.
 */

import React, { useMemo, useCallback } from 'react';
import {
  Upload,
  Clipboard,
  Download,
  Columns2,
  PenBox,
  Eye,
  Trash2,
} from '@/components/animate-ui/icons';
import { useStudioUI } from '@/store/MarkdownContext';
import { useClipboard } from '@/hooks/useClipboard';
import { downloadFile } from '@/utils/fileHelpers';
import {
  isTinyDesktopRuntime,
  openMarkdownViaTinyDesktop,
  saveMarkdownViaTinyDesktop,
} from '@/utils/tinyDesktopBridge';
import { prepareExportBundle } from '@/services/markdownEngine';
import { DockItemData } from '@/types/dock';

const UPLOAD_ICON = <Upload animateOnHover aria-hidden="true" className="w-5 h-5" />;
const PASTE_ICON = <Clipboard animateOnHover aria-hidden="true" className="w-5 h-5" />;
const DOWNLOAD_ICON = <Download animateOnHover aria-hidden="true" className="w-5 h-5" />;
const SPLIT_ICON = <Columns2 animateOnHover aria-hidden="true" className="w-5 h-5" />;
const EDITOR_ICON = <PenBox animateOnHover aria-hidden="true" className="w-5 h-5" />;
const PREVIEW_ICON = <Eye animateOnHover aria-hidden="true" className="w-5 h-5" />;
const CLEAR_ICON = <Trash2 animateOnHover aria-hidden="true" className="w-5 h-5 text-red-400" />;

/**
 * Custom hook providing action handlers and generated items for the Studio Dock.
 * Subscribes exclusively to useStudioUI so dock items never re-render during typing or markdown parsing.
 *
 * @returns An array of DockItemData configured with current state, handlers, and active indicators.
 */
export function useStudioDockActions(): DockItemData[] {
  const {
    applyExternalMarkdown,
    getExportSnapshot,
    viewMode,
    setViewMode,
    setIsUploadOpen,
    setIsPasteOpen,
    clearContent,
    showToast,
    t,
  } = useStudioUI();

  const { readFromClipboard } = useClipboard();

  const handleUpload = useCallback(async () => {
    if (!isTinyDesktopRuntime()) {
      setIsUploadOpen(true);

      return;
    }

    const outcome = await openMarkdownViaTinyDesktop();

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

    applyExternalMarkdown(outcome.content);
    showToast(t.toasts.uploadSuccess(outcome.fileName), 'success');
  }, [
    applyExternalMarkdown,
    setIsUploadOpen,
    showToast,
    t.toasts,
    t.uploadModal.maxSizeText,
  ]);

  const handlePaste = useCallback(async () => {
    try {
      const result = await readFromClipboard();

      if (result.success && result.text) {
        applyExternalMarkdown(result.text);
        showToast(t.toasts.pasteSuccess, 'success');
      } else {
        setIsPasteOpen(true);
      }
    } catch {
      setIsPasteOpen(true);
    }
  }, [readFromClipboard, applyExternalMarkdown, setIsPasteOpen, showToast, t.toasts.pasteSuccess]);

  const handleDownload = useCallback(async () => {
    const { rtlMarkdown: currentRtl, documentTitle } = getExportSnapshot();

    if (!currentRtl.trim()) {
      showToast(t.toasts.noTextToDownload, 'error');

      return;
    }

    const bundle = prepareExportBundle(currentRtl, documentTitle);

    if (isTinyDesktopRuntime()) {
      const saveOutcome = await saveMarkdownViaTinyDesktop(bundle.content, bundle.filename);

      if (saveOutcome.status === 'ok') {
        showToast(t.toasts.downloadSuccess, 'success');
      } else if (saveOutcome.status === 'write_error') {
        showToast(t.toasts.fileReadError, 'error');
      }

      return;
    }

    downloadFile(bundle.content, bundle.filename, bundle.mimeType);
    showToast(t.toasts.downloadSuccess, 'success');
  }, [getExportSnapshot, showToast, t.toasts.noTextToDownload, t.toasts.downloadSuccess, t.toasts.fileReadError]);

  const dockItems: DockItemData[] = useMemo(
    () => [
      { id: 'dock-upload', icon: UPLOAD_ICON, label: t.dock.upload, onClick: () => void handleUpload() },
      { id: 'dock-paste', icon: PASTE_ICON, label: t.dock.paste, onClick: handlePaste },
      { id: 'dock-download', icon: DOWNLOAD_ICON, label: t.dock.download, onClick: () => void handleDownload() },
      { id: 'dock-split', icon: SPLIT_ICON, label: t.dock.splitView, onClick: () => setViewMode('split'), isActive: viewMode === 'split' },
      { id: 'dock-editor', icon: EDITOR_ICON, label: t.dock.editorView, onClick: () => setViewMode('editor'), isActive: viewMode === 'editor' },
      { id: 'dock-preview', icon: PREVIEW_ICON, label: t.dock.previewView, onClick: () => setViewMode('preview'), isActive: viewMode === 'preview' },
      { id: 'dock-clear', icon: CLEAR_ICON, label: t.dock.clear, onClick: clearContent },
    ],
    [
      handleUpload,
      handlePaste,
      handleDownload,
      setViewMode,
      viewMode,
      clearContent,
      t,
    ]
  );

  return dockItems;
}

