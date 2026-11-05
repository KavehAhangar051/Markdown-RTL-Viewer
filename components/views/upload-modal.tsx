'use client';

/**
 * @file components/views/upload-modal.tsx
 * @description Upload modal with drag-and-drop zone for .md files.
 */

import React, { useState } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { useStudioUI } from '@/store/MarkdownContext';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { CloudUpload, FileText } from '@/components/animate-ui/icons';
import { processUploadedMarkdownFile } from '@/utils/fileHelpers';
import { SPRING_PRESS } from '@/lib/ease';
import { UPLOAD_ACCEPT_ATTR } from '@/constants/domain';

const getDropzoneClass = (isDragging: boolean, isDark: boolean): string => {
  if (isDragging) {
    return isDark
      ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-950/30'
      : 'border-emerald-600 bg-emerald-50/80 shadow-lg shadow-emerald-200/50';
  }

  return isDark
    ? 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700'
    : 'border-zinc-300 bg-zinc-50/80 hover:border-zinc-400';
};

const getCloudUploadIconClass = (isDragging: boolean, isDark: boolean): string => {
  if (isDragging) return 'text-emerald-500';

  return isDark ? 'text-zinc-400' : 'text-zinc-600';
};

export function UploadModal(): React.JSX.Element {
  const { isUploadOpen, setIsUploadOpen, applyExternalMarkdown, showToast, t, theme } = useStudioUI();
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const isDark = theme === 'dark';

  const handleClose = () => {
    setIsUploadOpen(false);
    setErrorMsg(null);
    setIsReading(false);
  };

  const handleFileSelect = async (file: File) => {
    setErrorMsg(null);
    setIsReading(true);

    const result = await processUploadedMarkdownFile(file);
    setIsReading(false);

    if (result.status === 'invalid_type') {
      setErrorMsg(t.toasts.invalidFileType);
      showToast(t.toasts.invalidFileType, 'error');

      return;
    }

    if (result.status === 'file_too_large') {
      setErrorMsg(t.uploadModal.maxSizeText);
      showToast(t.uploadModal.maxSizeText, 'error');

      return;
    }

    if (result.status === 'read_error') {
      setErrorMsg(t.toasts.fileReadError);
      showToast(t.toasts.fileReadError, 'error');

      return;
    }

    applyExternalMarkdown(result.content);
    showToast(t.toasts.uploadSuccess(result.fileName), 'success');
    handleClose();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <Modal
      isOpen={isUploadOpen}
      onClose={handleClose}
      title={t.uploadModal.title}
      description={t.uploadModal.description}
    >
      <m.div
        role="region"
        aria-label={t.uploadModal.title}
        aria-busy={isReading}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        animate={reduceMotion ? undefined : { scale: isDragging ? 1.02 : 1 }}
        transition={SPRING_PRESS}
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-colors duration-200 ${getDropzoneClass(isDragging, isDark)}`}
      >
        <m.div
          animate={isDragging && !reduceMotion ? { y: [-2, -6, -2] } : { y: 0 }}
          transition={{ duration: 0.6, repeat: isDragging ? Infinity : 0 }}
        >
          <CloudUpload
            animate={isDragging ? true : undefined}
            aria-hidden="true"
            className={`w-12 h-12 mb-3 transition-colors ${getCloudUploadIconClass(isDragging, isDark)}`}
          />
        </m.div>
        <p className={`text-sm font-medium mb-1 ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
          {t.uploadModal.dragDropText}
        </p>
        <p className={`text-xs mb-4 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{t.uploadModal.maxSizeText}</p>

        {errorMsg && (
          <p
            role="alert"
            className={`text-xs font-medium mb-3 px-3 py-1.5 rounded-lg border ${
              isDark
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {errorMsg}
          </p>
        )}

        <label
          htmlFor="upload-modal-file-input"
          className={`cursor-pointer rounded-xl focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 ${
            isDark ? 'focus-within:ring-offset-zinc-950' : 'focus-within:ring-offset-white'
          }`}
        >
          <Button variant="primary" size="sm" asChild disabled={isReading}>
            <span className="inline-flex items-center gap-1.5">
              <FileText aria-hidden="true" className="w-4 h-4" />
              {t.uploadModal.selectButton}
            </span>
          </Button>
          <input
            id="upload-modal-file-input"
            aria-label={t.uploadModal.selectButton}
            type="file"
            disabled={isReading}
            accept={UPLOAD_ACCEPT_ATTR}
            className="sr-only"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
        </label>
      </m.div>
    </Modal>
  );
}
