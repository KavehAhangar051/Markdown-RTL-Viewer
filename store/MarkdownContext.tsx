'use client';

/**
 * @file store/MarkdownContext.tsx
 * @description React Context providing centralized state management for Markdown conversion and UI workflows.
 */

import React, { createContext, useContext, useState, useMemo, useCallback, useSyncExternalStore, useRef, useDeferredValue } from 'react';
import { MarkdownContextType } from '@/types/markdown';
import { ViewMode, Theme } from '@/types/ui';
import { Language, Translations } from '@/types/i18n';
import { TRANSLATIONS } from '@/constants/translations';
import { processDocument } from '@/services/markdownEngine';
import { useTheme } from 'next-themes';
import { SAMPLE_RTL_MARKDOWN_FA, SAMPLE_RTL_MARKDOWN_EN } from '@/constants/sampleMarkdown';
import { ToastState } from '@/components/ui/toast-notification';
import { TOAST_DISMISS_DURATION_MS } from '@/constants/domain';

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

  const [language, setLanguage] = useState<Language>('fa');
  const [rawMarkdown, setRawMarkdown] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isPasteOpen, setIsPasteOpen] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isSyncScroll, setIsSyncScroll] = useState<boolean>(true);
  const [editorElement, setEditorElement] = useState<HTMLTextAreaElement | null>(null);
  const [previewElement, setPreviewElement] = useState<HTMLDivElement | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((
    message: string,
    type: 'success' | 'info' | 'error' = 'success',
    action?: { label: string; onClick: () => void }
  ) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ message, type, id: Date.now(), action });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, TOAST_DISMISS_DURATION_MS);
  }, []);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => !prev);
  }, []);

  const t = useMemo(() => TRANSLATIONS[language], [language]);

  const toggleSyncScroll = useCallback(() => {
    setIsSyncScroll((prev) => {
      const next = !prev;
      showToast(next ? t.editor.syncScrollEnabled : t.editor.syncScrollDisabled, 'info');

      return next;
    });
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
  }, [language, showToast]);

  const deferredRawMarkdown = useDeferredValue(rawMarkdown);
  const isProcessing = deferredRawMarkdown !== rawMarkdown;

  const processedDoc = useMemo(() => {
    return processDocument(deferredRawMarkdown);
  }, [deferredRawMarkdown]);

  const { rtlMarkdown, stats } = processedDoc;

  const clearContent = useCallback(() => {
    if (!rawMarkdown) {
      showToast(t.toasts.editorCleared, 'info');

      return;
    }

    const backup = rawMarkdown;
    setRawMarkdown('');
    showToast(
      t.toasts.editorCleared,
      'info',
      {
        label: t.toasts.undoAction,
        onClick: () => {
          setRawMarkdown(backup);
          showToast(t.toasts.contentRestored, 'success');
        },
      }
    );
  }, [rawMarkdown, showToast, t.toasts.editorCleared, t.toasts.undoAction, t.toasts.contentRestored]);

  const loadSample = useCallback(() => {
    const sample = language === 'fa' ? SAMPLE_RTL_MARKDOWN_FA : SAMPLE_RTL_MARKDOWN_EN;
    setRawMarkdown(sample);
    showToast(t.toasts.sampleLoaded, 'success');
  }, [language, showToast, t.toasts.sampleLoaded]);

  const contextValue: MarkdownContextType = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      language,
      setLanguage,
      toggleLanguage,
      t,
      rawMarkdown,
      setRawMarkdown,
      rtlMarkdown,
      viewMode,
      setViewMode,
      stats,
      isProcessing,
      isUploadOpen,
      setIsUploadOpen,
      isPasteOpen,
      setIsPasteOpen,
      isFocusMode,
      setIsFocusMode,
      toggleFocusMode,
      isSyncScroll,
      setIsSyncScroll,
      toggleSyncScroll,
      editorElement,
      setEditorElement,
      previewElement,
      setPreviewElement,
      clearContent,
      loadSample,
      toast,
      showToast,
      closeToast,
    }),
    [
      theme,
      setTheme,
      toggleTheme,
      language,
      toggleLanguage,
      t,
      rawMarkdown,
      rtlMarkdown,
      viewMode,
      stats,
      isProcessing,
      isUploadOpen,
      isPasteOpen,
      isFocusMode,
      toggleFocusMode,
      isSyncScroll,
      toggleSyncScroll,
      editorElement,
      previewElement,
      clearContent,
      loadSample,
      toast,
      showToast,
      closeToast,
    ]
  );

  const uiContextValue = useMemo(
    () => ({
      theme,
      language,
      t,
      showToast,
    }),
    [theme, language, t, showToast]
  );

  return (
    <StudioUIContext.Provider value={uiContextValue}>
      <MarkdownContext.Provider value={contextValue}>
        {children}
      </MarkdownContext.Provider>
    </StudioUIContext.Provider>
  );
};

export interface StudioUIContextType {
  theme: Theme;
  language: Language;
  t: Translations;
  showToast: MarkdownContextType['showToast'];
}

const StudioUIContext = createContext<StudioUIContextType | undefined>(undefined);

/**
 * Lightweight hook subscribing only to stable UI settings (theme, language, translations, toast)
 * so consumers do not re-render on every keystroke in the Markdown editor.
 *
 * @returns {StudioUIContextType} Stable UI state and toast dispatcher.
 */
export const useStudioUI = (): StudioUIContextType => {
  const context = useContext(StudioUIContext);

  if (!context) {
    throw new Error('useStudioUI must be used within a MarkdownProvider');
  }

  return context;
};

/**
 * Custom hook to access the global MarkdownContext values and dispatchers.
 *
 * @returns MarkdownContextType with all state and methods.
 * @throws Error if used outside of a MarkdownProvider.
 */
export const useMarkdownContext = (): MarkdownContextType => {
  const context = useContext(MarkdownContext);

  if (!context) {
    throw new Error('useMarkdownContext must be used within a MarkdownProvider');
  }

  return context;
};


