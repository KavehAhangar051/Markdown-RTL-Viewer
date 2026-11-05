'use client';

/**
 * @file components/ui/math-block.tsx
 * @description ChatGPT & Gemini inspired display math block and inline math wrapper
 * with LTR isolation, responsive horizontal scroll, and one-click LaTeX copy.
 */

import React, { useCallback } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { Copy, Check } from '@/components/animate-ui/icons';
import { useStudioUI } from '@/store/MarkdownContext';
import { useClipboard } from '@/hooks/useClipboard';
import { CLIPBOARD_RESET_DURATION_MS } from '@/constants/domain';
import { SPRING_PRESS } from '@/lib/ease';
import { ActionSwapIcon } from '@/components/motion/action-swap';

/**
 * Recursively searches a KaTeX React element tree for the `<annotation encoding="application/x-tex">`
 * node to extract the original raw LaTeX formula string.
 *
 * @param {React.ReactNode} node - React children inside `.katex-display`.
 * @returns {string} Extracted raw LaTeX source or empty string.
 */
function extractLatexFromKatexNode(node: React.ReactNode): string {
  if (!node) return '';

  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const found = extractLatexFromKatexNode(node[i]);

      if (found) return found;
    }

    return '';
  }

  if (React.isValidElement(node)) {
    // SAFETY: React.isValidElement confirms node is a ReactElement instance
    const element = node as React.ReactElement<{ children?: React.ReactNode }>;

    if (element.type === 'annotation') {
      const raw = element.props?.children;

      if (Array.isArray(raw)) return raw.join('').trim();

      return String(raw ?? '').trim();
    }

    if (element.props?.children !== undefined) {
      return extractLatexFromKatexNode(element.props.children);
    }
  }

  return '';
}

export interface MathDisplayBlockProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
}

/**
 * Renders a display-mode math equation (`$$ ... $$`) inside a sleek glassmorphic card
 * with LTR direction isolation, centered equation typography, and a floating copy LaTeX button.
 *
 * @param {MathDisplayBlockProps} props - Span attributes from rehype-katex.
 * @returns {React.JSX.Element} Styled display math container.
 */
export const MathDisplayBlock = React.memo(function MathDisplayBlock({
  className,
  children,
}: MathDisplayBlockProps): React.JSX.Element {
  const { theme, language, showToast } = useStudioUI();
  const isDark = theme === 'dark';
  const isFa = language === 'fa';
  const reduceMotion = useReducedMotion();
  const { copied, copyToClipboard } = useClipboard(CLIPBOARD_RESET_DURATION_MS);

  const handleCopyLatex = useCallback(() => {
    const latex = extractLatexFromKatexNode(children);

    if (!latex) return;

    copyToClipboard(latex);
    showToast(
      isFa ? 'فرمول LaTeX در کلیپ‌بورد کپی شد' : 'LaTeX formula copied to clipboard',
      'success'
    );
  }, [children, copyToClipboard, showToast, isFa]);

  const copyTitle = isFa
    ? copied
      ? 'کپی شد'
      : 'کپی فرمول LaTeX'
    : copied
    ? 'Copied'
    : 'Copy LaTeX';

  return (
    <span
      dir="ltr"
      className={`group/math relative my-5 block w-full rounded-lg px-3 py-2.5 transition-colors duration-150 select-text ${
        isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-black/[0.025]'
      }`}
    >
      {/* Subtle Hover Copy LaTeX Button (Gemini / Claude / ChatGPT style) */}
      <m.button
        type="button"
        onClick={handleCopyLatex}
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        transition={SPRING_PRESS}
        title={copyTitle}
        aria-label={copyTitle}
        className={`absolute top-1.5 right-1.5 z-10 min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 sm:w-7 sm:h-7 flex items-center justify-center rounded-md border text-[11px] transition-[opacity,color,background-color,border-color] duration-150 cursor-pointer opacity-0 group-hover/math:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          copied
            ? isDark
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 opacity-100'
              : 'bg-emerald-50 text-emerald-600 border-emerald-300 opacity-100'
            : isDark
            ? 'bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:text-zinc-100 hover:bg-zinc-800'
            : 'bg-white/95 text-zinc-500 border-zinc-200/90 hover:text-zinc-900 hover:bg-zinc-100 shadow-2xs'
        }`}
      >
        <ActionSwapIcon
          value={copied ? 'copied' : 'copy'}
          animation="blur"
          className="w-3.5 h-3.5"
        >
          {copied ? (
            <Check animate aria-hidden="true" className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
          ) : (
            <Copy animateOnHover aria-hidden="true" className="w-3.5 h-3.5" />
          )}
        </ActionSwapIcon>
      </m.button>

      {/* Scrollable Centered LTR Equation Viewport */}
      <span className="block w-full overflow-x-auto overflow-y-hidden py-1 text-center">
        <span className={className} dir="ltr">
          {children}
        </span>
      </span>
    </span>
  );
});

MathDisplayBlock.displayName = 'MathDisplayBlock';
