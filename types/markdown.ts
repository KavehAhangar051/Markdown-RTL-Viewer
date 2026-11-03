/**
 * @file types/markdown.ts
 * @description Type definitions for Markdown document state and stats.
 */

import { ViewMode, Theme, ToastState, ToastType, ToastActionConfig } from '@/types/ui';
import { Language, Translations } from '@/types/i18n';

export interface DocumentStats {
  readonly characterCount: number;
  readonly wordCount: number;
  readonly persianCharCount: number;
  readonly lineCount: number;
  readonly estimatedReadTimeMinutes: number;
}

export interface MarkdownContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  rawMarkdown: string;
  setRawMarkdown: (val: string) => void;
  applyExternalMarkdown: (content: string) => void;
  rtlMarkdown: string;
  documentTitle: string;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  stats: DocumentStats;
  isProcessing: boolean;
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  isPasteOpen: boolean;
  setIsPasteOpen: (open: boolean) => void;
  isFocusMode: boolean;
  setIsFocusMode: (focus: boolean) => void;
  toggleFocusMode: () => void;
  isShowcaseOpen: boolean;
  setIsShowcaseOpen: (open: boolean) => void;
  isSyncScroll: boolean;
  setIsSyncScroll: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleSyncScroll: () => void;
  editorElement: HTMLTextAreaElement | null;
  setEditorElement: (el: HTMLTextAreaElement | null) => void;
  previewElement: HTMLDivElement | null;
  setPreviewElement: (el: HTMLDivElement | null) => void;
  clearContent: () => void;
  loadSample: () => void;
  toast: ToastState | null;
  showToast: (message: string, type?: ToastType, action?: ToastActionConfig) => void;
  closeToast: () => void;
}


