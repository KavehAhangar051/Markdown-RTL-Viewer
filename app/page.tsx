'use client';

/**
 * @file app/page.tsx
 * @description Root application view presenting full dark cinematic glass UI for RTL Markdown Studio.
 */

import React from 'react';
import dynamic from 'next/dynamic';
import { m, AnimatePresence } from 'motion/react';
import { MarkdownProvider, useStudioUI } from '@/store/MarkdownContext';
import { Header } from '@/components/layout/header';
import { StudioDock } from '@/components/layout/studio-dock';
import { FocusModeBar } from '@/components/layout/focus-mode-bar';
import { EditorView } from '@/components/views/editor-view';
import { PreviewView } from '@/components/views/preview-view';
import { ToastNotification } from '@/components/ui/toast-notification';
import { useSyncScroll } from '@/hooks/useSyncScroll';
import { viewModeVariants } from '@/components/motion/motion-variants';
import { SharedPanelTransition } from '@/components/motion/studio-view-transition';
import { StudioShowcase } from '@/components/showcase/studio-showcase';
import { DURATION, EASE_OUT } from '@/lib/ease';

const UploadModal = dynamic(
  () => import('@/components/views/upload-modal').then((mod) => mod.UploadModal),
  { ssr: false }
);

const PasteModal = dynamic(
  () => import('@/components/views/paste-modal').then((mod) => mod.PasteModal),
  { ssr: false }
);

const WorkspaceViews = React.memo(function WorkspaceViews({
  viewMode,
}: {
  viewMode: 'split' | 'editor' | 'preview';
}) {
  return (
    <div className="w-full flex flex-col gap-2.5 sm:gap-3">
      {viewMode === 'split' && (
        <m.div
          key="view-split"
          variants={viewModeVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 h-full w-full"
        >
          <SharedPanelTransition panel="editor">
            <EditorView />
          </SharedPanelTransition>
          <SharedPanelTransition panel="preview">
            <PreviewView />
          </SharedPanelTransition>
        </m.div>
      )}

      {viewMode === 'editor' && (
        <m.div
          key="view-editor"
          variants={viewModeVariants}
          initial="initial"
          animate="animate"
          className="w-full h-full"
        >
          <SharedPanelTransition panel="editor">
            <EditorView />
          </SharedPanelTransition>
        </m.div>
      )}

      {viewMode === 'preview' && (
        <m.div
          key="view-preview"
          variants={viewModeVariants}
          initial="initial"
          animate="animate"
          className="w-full h-auto min-h-full flex justify-center"
        >
          <div className="w-full max-w-[1120px] mx-auto">
            <SharedPanelTransition panel="preview">
              <PreviewView />
            </SharedPanelTransition>
          </div>
        </m.div>
      )}
    </div>
  );
});

function MainAppContent() {
  const {
    viewMode,
    language,
    theme,
    isFocusMode,
    isShowcaseOpen,
    setIsShowcaseOpen,
    toast,
    closeToast,
    editorElement,
    previewElement,
    isSyncScroll,
  } = useStudioUI();

  const isDark = theme === 'dark';
  const isFa = language === 'fa';

  // Synchronize scrolling between editor and preview in Split View mode
  useSyncScroll({
    editorEl: editorElement,
    previewEl: previewElement,
    enabled: !isShowcaseOpen && isSyncScroll && viewMode === 'split',
  });

  const isPageScrollable = isShowcaseOpen || viewMode === 'preview';

  const scrollContainerClass = isPageScrollable
    ? 'min-h-screen overflow-x-clip'
    : 'h-screen max-h-screen overflow-hidden';

  const themeContainerClass = isDark
    ? 'bg-black text-zinc-100 dark'
    : 'bg-slate-100/70 text-zinc-900 light';

  const mainPaddingClass = isFocusMode
    ? 'p-1.5 sm:p-2 pt-1.5 sm:pt-2 pb-2'
    : 'p-2 sm:p-3 md:p-3.5 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(5rem+env(safe-area-inset-bottom,0px))]';

  return (
    <div
      className={`${scrollContainerClass} flex flex-col bg-noise relative transition-colors duration-300 ${themeContainerClass} ${isFa ? 'font-vazir' : 'font-sans'}`}
      dir={isFa ? 'rtl' : 'ltr'}
    >
      {/* Animated Header (Smoothly transitions in/out in Focus Mode without layout thrashing) */}
      <AnimatePresence initial={false}>
        {!isFocusMode && (
          <m.div
            key="main-header-wrapper"
            initial={{ opacity: 0, y: -20, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -20, scaleY: 0.95 }}
            transition={{ duration: DURATION.slow, ease: EASE_OUT }}
            className="w-full shrink-0 origin-top overflow-hidden"
          >
            <Header />
          </m.div>
        )}
      </AnimatePresence>

      {/* Floating Exit Widget for Focus Mode */}
      <AnimatePresence>
        {!isShowcaseOpen && isFocusMode && <FocusModeBar key="focus-exit-widget" />}
      </AnimatePresence>

      {isShowcaseOpen ? (
        <StudioShowcase
          onClose={() => {
            setIsShowcaseOpen(false);
            if (typeof window !== 'undefined') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        />
      ) : (
        <>
          {/* Main Workspace Grid (Extends to top in Focus Mode with layout animation) */}
          <m.main
            layout
            transition={{ duration: DURATION.slow, ease: EASE_OUT }}
            className={`flex-1 max-w-[1580px] w-full mx-auto flex flex-col gap-2.5 sm:gap-3 z-10 ${
              isPageScrollable ? '' : 'min-h-0 overflow-hidden'
            } ${mainPaddingClass}`}
          >
            <div className="flex-1 w-full flex flex-col gap-2.5 sm:gap-3 items-start">
              <WorkspaceViews viewMode={viewMode} />
            </div>
          </m.main>

          {/* Interactive macOS-style Magnification Dock (Exits with motion in Focus Mode) */}
          <AnimatePresence initial={false}>
            {!isFocusMode && <StudioDock key="studio-dock" />}
          </AnimatePresence>
        </>
      )}

      {/* Toast Notification Banner */}
      <ToastNotification
        toast={toast}
        onClose={closeToast}
        isDark={isDark}
        isFa={isFa}
      />

      {/* Lazy-Loaded Modals (Modal component handles AnimatePresence enter/exit internally) */}
      <UploadModal />
      <PasteModal />
    </div>
  );
}

export default function Home() {
  return (
    <MarkdownProvider>
      <MainAppContent />
    </MarkdownProvider>
  );
}

