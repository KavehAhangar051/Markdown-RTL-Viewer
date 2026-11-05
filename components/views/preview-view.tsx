'use client';

/**
 * @file components/views/preview-view.tsx
 * @description Rendered RTL Markdown preview panel composing MemoizedMarkdown and PreviewEmptyState.
 */

import React from 'react';
import { useReducedMotion } from 'motion/react';
import { useStudioUI, usePreviewDocument } from '@/store/MarkdownContext';
import { Eye } from '@/components/animate-ui/icons';
import { AsciiLineLoader } from '@/components/motion/loader';
import { ViewFadeTransition } from '@/components/motion/studio-view-transition';
import { PreviewEmptyState } from './preview-empty-state';
import { MemoizedMarkdown } from './preview-markdown-components';

/**
 * Rendered RTL Markdown preview container with live processing status, empty state, and scroll sync support.
 *
 * @returns {React.JSX.Element} The rendered PreviewView component.
 */
export const PreviewView = React.memo(function PreviewView(): React.JSX.Element {
  const {
    t,
    language,
    theme,
    loadSample,
    isFocusMode,
    viewMode,
    setPreviewElement,
  } = useStudioUI();
  const { rtlMarkdown, isProcessing } = usePreviewDocument();

  const isDark = theme === 'dark';
  const isFa = language === 'fa';
  const reduceMotion = useReducedMotion();
  const isPreviewOnly = viewMode === 'preview';

  return (
    <section
      id="preview-view-container"
      aria-labelledby="preview-panel-title"
      className={`flex flex-col ${
        isPreviewOnly ? 'h-auto min-h-[600px] max-w-[1120px] mx-auto w-full' : 'h-full w-full'
      } glass-panel rounded-2xl border overflow-hidden shadow-2xl transition-colors duration-200 ${
        isDark ? 'border-zinc-800 bg-black/90' : 'border-zinc-200/90 bg-white/95 shadow-zinc-200/60'
      }`}
    >
      {/* Preview Header */}
      <div
        id="preview-toolbar-header"
        className={`flex items-center justify-between px-4 py-2.5 min-h-[45px] border-b text-xs transition-colors ${
          isDark ? 'bg-zinc-950/90 border-zinc-800 text-zinc-200' : 'bg-zinc-100/90 border-zinc-200 text-zinc-800'
        }`}
      >
        <div className="flex items-center gap-2 font-semibold">
          <div
            aria-hidden="true"
            className={`p-1.5 rounded-lg border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-300 text-zinc-700 shadow-xs'
            }`}
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
          </div>
          <h2 id="preview-panel-title" className="text-xs font-semibold">
            {t.preview.title}
          </h2>
        </div>

        {isProcessing && (
          <div
            id="preview-ascii-line-loader"
            role="status"
            aria-label={isFa ? 'در حال پردازش مارک‌داون' : 'Processing markdown'}
            className="text-xs font-mono select-none opacity-60"
          >
            <AsciiLineLoader size={14} />
          </div>
        )}
      </div>

      {/* Preview Content Container */}
      <div className={`relative flex-1 p-2 pb-2.5 transition-colors ${isDark ? 'bg-black' : 'bg-zinc-50/50'}`}>
        <div
          id="preview-markdown-content"
          ref={setPreviewElement}
          aria-busy={isProcessing}
          data-lenis-prevent={isPreviewOnly ? undefined : 'true'}
          className={`relative w-full rounded-xl ${
            isPreviewOnly
              ? 'px-4 sm:px-8 md:px-10 pt-4 sm:pt-6 pb-12 sm:pb-16'
              : 'px-3 sm:px-4 md:px-5 pt-2 sm:pt-2.5 pb-12 sm:pb-16'
          } transition-colors duration-300 glass-input border shadow-inner ${
            isDark
              ? 'text-zinc-100 border-zinc-800 bg-black/40'
              : 'text-zinc-900 border-zinc-300 bg-white/80'
          } ${
            isPreviewOnly
              ? 'h-auto min-h-[580px] overflow-visible'
              : isFocusMode
              ? 'h-[calc(100vh-110px)] min-h-[480px] overflow-y-auto overscroll-contain editor-scrollbar'
              : 'h-[calc(100vh-195px)] min-h-[480px] max-h-[820px] overflow-y-auto overscroll-contain editor-scrollbar'
          }`}
          dir="rtl"
        >
          {rtlMarkdown.trim() ? (
            <ViewFadeTransition transitionKey="preview-rendered">
              <MemoizedMarkdown
                content={rtlMarkdown}
                className={`markdown-rtl-content text-start ${isPreviewOnly ? 'max-w-[960px] mx-auto' : ''}`}
              />
            </ViewFadeTransition>
          ) : (
            <ViewFadeTransition transitionKey="preview-empty">
              <PreviewEmptyState
                isDark={isDark}
                isFa={isFa}
                t={t}
                loadSample={loadSample}
                reduceMotion={reduceMotion}
              />
            </ViewFadeTransition>
          )}
        </div>
      </div>
    </section>
  );
});

PreviewView.displayName = 'PreviewView';
