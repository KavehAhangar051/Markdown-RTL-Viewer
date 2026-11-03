'use client';

/**
 * @file store/MarkdownContext.tsx
 * @description React Context providing centralized state management for Markdown conversion and UI workflows.
 */

import React, { createContext, useContext, useState, useMemo, useCallback, useSyncExternalStore, useRef, useDeferredValue, useEffect } from 'react';
import { MarkdownContextType } from '@/types/markdown';
import { ViewMode, Theme, ToastState, ToastType, ToastActionConfig } from '@/types/ui';
import { Language, Translations } from '@/types/i18n';
import { TRANSLATIONS } from '@/constants/translations';
import { processDocument } from '@/services/markdownEngine';
import { useTheme } from 'next-themes';
import { SAMPLE_RTL_MARKDOWN_FA, SAMPLE_RTL_MARKDOWN_EN } from '@/constants/sampleMarkdown';
import { TOAST_DISMISS_DURATION_MS } from '@/constants/domain';
import { resolveViewModeTransitionType, runStudioTransition } from '@/utils/viewTransitions';

export type { MarkdownContextType };

const emptySubscribe = () => () => {};

const MarkdownContext = createContext<MarkdownContextType | undefined>(undefined);

/**
 * Global Markdown State Provider wrapping the studio application.
 *
 * @param props - Children components to render within context.
 * @returns Context Provider element.
 */
export const MarkdownProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setTheme: setNextTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // During SSR and initial client hydration, default to 'dark' to guarantee
  // that server-rendered HTML matches client properties identically without mismatch.
  const theme: Theme = mounted && (resolvedTheme === 'light' || resolvedTheme === 'dark')
    ? resolvedTheme
    : 'dark';

  const [language, setLanguageState] = useState<Language>('fa');
  const [rawMarkdown, setRawMarkdownState] = useState<string>('');
  const [committedMarkdown, setCommittedMarkdown] = useState<string>('');
  const [viewMode, setViewModeState] = useState<ViewMode>('split');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isPasteOpen, setIsPasteOpen] = useState<boolean>(false);
  const [isFocusMode, setIsFocusModeState] = useState<boolean>(false);
  const [isShowcaseOpen, setIsShowcaseOpenState] = useState<boolean>(true);
  const [isSyncScroll, setIsSyncScroll] = useState<boolean>(true);
  const [editorElement, setEditorElement] = useState<HTMLTextAreaElement | null>(null);
  const [previewElement, setPreviewElement] = useState<HTMLDivElement | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rawMarkdownRef = useRef<string>(rawMarkdown);
  const isSyncScrollRef = useRef<boolean>(isSyncScroll);
  const isFocusModeRef = useRef<boolean>(isFocusMode);

  useEffect(() => {
    rawMarkdownRef.current = rawMarkdown;
    isSyncScrollRef.current = isSyncScroll;
    isFocusModeRef.current = isFocusMode;
  }, [rawMarkdown, isSyncScroll, isFocusMode]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const setRawMarkdown = useCallback((value: string) => {
    setRawMarkdownState(value);

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    if (!value) {
      setCommittedMarkdown('');

      return;
    }

    typingTimerRef.current = setTimeout(() => {
      typingTimerRef.current = null;
      setCommittedMarkdown(value);
    }, 90);
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((
    message: string,
    type: ToastType = 'success',
    action?: ToastActionConfig
  ) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ message, type, id: Date.now(), action });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, TOAST_DISMISS_DURATION_MS);
  }, []);

  const applyExternalMarkdown = useCallback((content: string) => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    runStudioTransition('content-load', () => {
      setRawMarkdownState(content);
      setCommittedMarkdown(content);
    });
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    runStudioTransition(resolveViewModeTransitionType(mode), () => {
      setViewModeState(mode);
    });
  }, []);

  const setIsFocusMode = useCallback((value: boolean) => {
    runStudioTransition(value ? 'focus-enter' : 'focus-exit', () => {
      setIsFocusModeState(value);
    });
  }, []);

  const setIsShowcaseOpen = useCallback((value: boolean) => {
    runStudioTransition('content-load', () => {
      setIsShowcaseOpenState(value);
      if (value) {
        setIsFocusModeState(false);
      }
    });
  }, []);

  const toggleFocusMode = useCallback(() => {
    const next = !isFocusModeRef.current;

    runStudioTransition(next ? 'focus-enter' : 'focus-exit', () => {
      setIsFocusModeState((prev) => !prev);
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    runStudioTransition('lang-switch', () => {
      setLanguageState(lang);
    });
  }, []);

  const t = TRANSLATIONS[language];

  const toggleSyncScroll = useCallback(() => {
    const next = !isSyncScrollRef.current;
    setIsSyncScroll((prev) => !prev);
    showToast(next ? t.editor.syncScrollEnabled : t.editor.syncScrollDisabled, 'info');
  }, [showToast, t.editor.syncScrollEnabled, t.editor.syncScrollDisabled]);

  const setTheme = useCallback((newTheme: Theme) => {
    setNextTheme?.(newTheme);
  }, [setNextTheme]);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [theme, setTheme]);

  const toggleLanguage = useCallback(() => {
    const nextLang: Language = language === 'fa' ? 'en' : 'fa';
    setLanguage(nextLang);
    showToast(TRANSLATIONS[nextLang].toasts.langSwitched(nextLang === 'fa' ? 'فارسی' : 'English'), 'info');
  }, [language, setLanguage, showToast]);

  const deferredRawMarkdown = useDeferredValue(committedMarkdown);
  const isProcessing = rawMarkdown !== deferredRawMarkdown;

  const processedDoc = useMemo(() => {
    return processDocument(deferredRawMarkdown);
  }, [deferredRawMarkdown]);

  const { rtlMarkdown, stats, title: documentTitle } = processedDoc;
  const exportSnapshotRef = useRef({ rtlMarkdown, documentTitle });

  useEffect(() => {
    exportSnapshotRef.current = { rtlMarkdown, documentTitle };
  }, [rtlMarkdown, documentTitle]);

  const getExportSnapshot = useCallback(() => exportSnapshotRef.current, []);

  const clearContent = useCallback(() => {
    const currentMarkdown = rawMarkdownRef.current;

    if (!currentMarkdown) {
      showToast(t.toasts.editorCleared, 'info');

      return;
    }

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    const backup = currentMarkdown;

    runStudioTransition('content-clear', () => {
      setRawMarkdownState('');
      setCommittedMarkdown('');
    });

    showToast(
      t.toasts.editorCleared,
      'info',
      {
        label: t.toasts.undoAction,
        onClick: () => {
          applyExternalMarkdown(backup);
          showToast(t.toasts.contentRestored, 'success');
        },
      }
    );
  }, [applyExternalMarkdown, showToast, t.toasts.editorCleared, t.toasts.undoAction, t.toasts.contentRestored]);

  const loadSample = useCallback(() => {
    const sample = language === 'fa' ? SAMPLE_RTL_MARKDOWN_FA : SAMPLE_RTL_MARKDOWN_EN;
    applyExternalMarkdown(sample);
    showToast(t.toasts.sampleLoaded, 'success');
  }, [applyExternalMarkdown, language, showToast, t.toasts.sampleLoaded]);

  const contextValue: MarkdownContextType = useMemo(
    () => ({
      theme, setTheme, toggleTheme, language, setLanguage, toggleLanguage, t,
      rawMarkdown, setRawMarkdown, applyExternalMarkdown, rtlMarkdown, documentTitle,
      viewMode, setViewMode, stats, isProcessing, isUploadOpen, setIsUploadOpen,
      isPasteOpen, setIsPasteOpen, isFocusMode, setIsFocusMode, toggleFocusMode,
      isShowcaseOpen, setIsShowcaseOpen,
      isSyncScroll, setIsSyncScroll, toggleSyncScroll, editorElement, setEditorElement,
      previewElement, setPreviewElement, clearContent, loadSample, toast, showToast, closeToast,
    }),
    [
      theme, setTheme, toggleTheme, language, setLanguage, toggleLanguage, t,
      rawMarkdown, setRawMarkdown, applyExternalMarkdown, rtlMarkdown, documentTitle,
      viewMode, setViewMode, stats, isProcessing, isUploadOpen, isPasteOpen,
      isFocusMode, setIsFocusMode, toggleFocusMode, isShowcaseOpen, setIsShowcaseOpen,
      isSyncScroll, toggleSyncScroll,
      editorElement, previewElement, clearContent, loadSample, toast, showToast, closeToast,
    ]
  );

  const uiContextValue: StudioUIContextType = useMemo(
    () => ({
      theme, setTheme, toggleTheme, language, setLanguage, toggleLanguage, t,
      viewMode, setViewMode, isFocusMode, setIsFocusMode, toggleFocusMode,
      isShowcaseOpen, setIsShowcaseOpen,
      isSyncScroll, setIsSyncScroll, toggleSyncScroll, isUploadOpen, setIsUploadOpen,
      isPasteOpen, setIsPasteOpen, editorElement, setEditorElement,
      previewElement, setPreviewElement, applyExternalMarkdown, clearContent,
      loadSample, getExportSnapshot, toast, showToast, closeToast,
    }),
    [
      theme, setTheme, toggleTheme, language, setLanguage, toggleLanguage, t,
      viewMode, setViewMode, isFocusMode, setIsFocusMode, toggleFocusMode,
      isShowcaseOpen, setIsShowcaseOpen,
      isSyncScroll, toggleSyncScroll, isUploadOpen, isPasteOpen,
      editorElement, previewElement, applyExternalMarkdown, clearContent,
      loadSample, getExportSnapshot, toast, showToast, closeToast,
    ]
  );

  const previewContextValue: PreviewDocumentContextType = useMemo(
    () => ({
      rtlMarkdown,
      stats,
      documentTitle,
      isProcessing,
    }),
    [rtlMarkdown, stats, documentTitle, isProcessing]
  );

  return (
    <StudioUIContext.Provider value={uiContextValue}>
      <PreviewDocumentContext.Provider value={previewContextValue}>
        <MarkdownContext.Provider value={contextValue}>
          {children}
        </MarkdownContext.Provider>
      </PreviewDocumentContext.Provider>
    </StudioUIContext.Provider>
  );
};

export interface StudioUIContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isFocusMode: boolean;
  setIsFocusMode: (focus: boolean) => void;
  toggleFocusMode: () => void;
  isShowcaseOpen: boolean;
  setIsShowcaseOpen: (open: boolean) => void;
  isSyncScroll: boolean;
  setIsSyncScroll: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleSyncScroll: () => void;
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  isPasteOpen: boolean;
  setIsPasteOpen: (open: boolean) => void;
  editorElement: HTMLTextAreaElement | null;
  setEditorElement: (el: HTMLTextAreaElement | null) => void;
  previewElement: HTMLDivElement | null;
  setPreviewElement: (el: HTMLDivElement | null) => void;
  applyExternalMarkdown: (content: string) => void;
  clearContent: () => void;
  loadSample: () => void;
  getExportSnapshot: () => { rtlMarkdown: string; documentTitle: string };
  toast: ToastState | null;
  showToast: MarkdownContextType['showToast'];
  closeToast: () => void;
}

export interface PreviewDocumentContextType {
  rtlMarkdown: string;
  stats: MarkdownContextType['stats'];
  documentTitle: string;
  isProcessing: boolean;
}

const StudioUIContext = createContext<StudioUIContextType | undefined>(undefined);
const PreviewDocumentContext = createContext<PreviewDocumentContextType | undefined>(undefined);

/**
 * Lightweight hook subscribing only to stable UI/workspace settings and actions
 * so consumers do not re-render on every keystroke in the Markdown editor.
 */
export const useStudioUI = (): StudioUIContextType => {
  const context = useContext(StudioUIContext);

  if (!context) {
    throw new Error('useStudioUI must be used within a MarkdownProvider');
  }

  return context;
};

/**
 * Hook subscribing only to deferred/processed preview document output.
 * Prevents PreviewView from re-rendering on raw keystroke events before debounce settles.
 */
export const usePreviewDocument = (): PreviewDocumentContextType => {
  const context = useContext(PreviewDocumentContext);

  if (!context) {
    throw new Error('usePreviewDocument must be used within a MarkdownProvider');
  }

  return context;
};

/**
 * Custom hook to access the full MarkdownContext values and dispatchers.
 */
export const useMarkdownContext = (): MarkdownContextType => {
  const context = useContext(MarkdownContext);

  if (!context) {
    throw new Error('useMarkdownContext must be used within a MarkdownProvider');
  }

  return context;
};


