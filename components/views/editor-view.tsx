'use client';

/**
 * @file components/views/editor-view.tsx
 * @description Raw Markdown input editor component with integrated live metrics and non-blocking line highlight.
 */

import React, { useState, useCallback, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { useMarkdownContext } from '@/store/MarkdownContext';
import { useActiveLinePosition } from '@/hooks/useActiveLinePosition';
import { FileText } from '@/components/animate-ui/icons';
import { EditorStatsBadges } from './editor-stats-badges';
import { EditorActiveLine } from './editor-active-line';
import { SyncScrollToggleButton } from './sync-scroll-toggle';

/**
 * Raw Markdown Editor View containing integrated metric pills and interactive text area.
 * Memoized with React.memo to eliminate redundant render passes during global state updates.
 *
 * @returns {React.JSX.Element} The rendered EditorView component.
 */
export const EditorView = React.memo(function EditorView(): React.JSX.Element {
  const {
    rawMarkdown,
    setRawMarkdown,
    stats,
    language,
    t,
    theme,
    isFocusMode,
    viewMode,
    isSyncScroll,
    toggleSyncScroll,
    setEditorElement,
  } = useMarkdownContext();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const { activeLine, recalculateLine } = useActiveLinePosition(textareaRef);

  const isDark = theme === 'dark';
  const isFa = language === 'fa';
  const locale = isFa ? 'fa-IR' : 'en-US';
  const reduceMotion = useReducedMotion();

  const handleCursorUpdate = useCallback(() => {
    recalculateLine();
  }, [recalculateLine]);

  const handleTextareaRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      textareaRef.current = el;
      setEditorElement(el);
    },
    [setEditorElement]
  );

  const panelThemeClass = isDark
    ? 'border-zinc-800 bg-black/90'
    : 'border-zinc-200/90 bg-white/95 shadow-zinc-200/60';

  const headerThemeClass = isDark
    ? 'bg-zinc-950/90 border-zinc-800 text-zinc-200'
    : 'bg-zinc-100/90 border-zinc-200 text-zinc-800';

  const iconBadgeClass = isDark
    ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
    : 'bg-white border-zinc-300 text-zinc-700 shadow-xs';

  const textareaThemeClass = isDark
    ? 'text-zinc-100 border-zinc-800 placeholder:text-zinc-600 focus-visible:ring-offset-zinc-950'
    : 'text-zinc-900 border-zinc-300 placeholder:text-zinc-500 focus-visible:ring-offset-white';

  const viewportHeightClass = isFocusMode
    ? 'h-[calc(100vh-110px)] min-h-[480px]'
    : 'h-[calc(100vh-195px)] min-h-[480px] max-h-[820px]';

  return (
    <section
      id="editor-view-container"
      aria-labelledby="editor-panel-title"
      className={`flex flex-col h-full glass-panel rounded-2xl border overflow-hidden shadow-2xl transition-colors duration-200 ${panelThemeClass}`}
    >
      {/* Editor Header with Integrated Stats & SyncScroll Toggle */}
      <div
        id="editor-toolbar-header"
        className={`flex flex-wrap items-center justify-between px-4 py-2.5 min-h-[45px] border-b text-xs gap-2 transition-colors ${headerThemeClass}`}
      >
        <div className="flex items-center gap-2 font-semibold flex-wrap">
          <div className={`p-1.5 rounded-lg border ${iconBadgeClass}`} aria-hidden="true">
            <FileText className="w-4 h-4" aria-hidden="true" />
          </div>
          <h2 id="editor-panel-title" className="text-xs font-semibold">{t.editor.title}</h2>

          <EditorStatsBadges stats={stats} isDark={isDark} locale={locale} t={t} />
        </div>

        {/* SyncScroll Switcher in Split View */}
        {viewMode === 'split' && (
          <SyncScrollToggleButton
            isSyncScroll={isSyncScroll}
            isDark={isDark}
            reduceMotion={reduceMotion}
            onToggle={toggleSyncScroll}
            label={t.editor.syncScroll}
            enabledTitle={t.editor.syncScrollEnabled}
            disabledTitle={t.editor.syncScrollDisabled}
          />
        )}
      </div>

      {/* Editor Textarea Container */}
      <div className={`relative flex-1 p-2 pb-2.5 transition-colors ${isDark ? 'bg-black' : 'bg-zinc-50/50'}`}>
        <div
          data-lenis-prevent="true"
          className={`relative w-full rounded-xl overflow-hidden transition-colors duration-300 ${viewportHeightClass}`}
        >
          <EditorActiveLine
            isVisible={isFocused && activeLine.isVisible}
            isDark={isDark}
            top={activeLine.top}
            height={activeLine.height}
          />

          <label htmlFor="editor-markdown-textarea" className="sr-only">
            {t.editor.title}
          </label>
          <textarea
            id="editor-markdown-textarea"
            ref={handleTextareaRef}
            value={rawMarkdown}
            aria-label={t.editor.title}
            aria-multiline="true"
            data-lenis-prevent="true"
            onChange={(e) => {
              setRawMarkdown(e.target.value);
              handleCursorUpdate();
            }}
            onSelect={handleCursorUpdate}
            onKeyUp={handleCursorUpdate}
            onClick={handleCursorUpdate}
            onScroll={handleCursorUpdate}
            onWheel={(e) => {
              e.stopPropagation();
            }}
            onFocus={() => {
              setIsFocused(true);
              handleCursorUpdate();
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={t.editor.placeholder}
            dir={isFa ? 'rtl' : 'ltr'}
            className={`relative z-10 w-full h-full p-3.5 sm:p-4 pb-12 sm:pb-16 text-base sm:text-sm leading-relaxed overflow-y-auto overscroll-contain editor-scrollbar focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 resize-none glass-input rounded-xl border shadow-inner transition-colors bg-transparent ${textareaThemeClass} ${isFa ? 'font-vazir' : 'font-sans'}`}
          />
        </div>
      </div>
    </section>
  );
});

EditorView.displayName = 'EditorView';
