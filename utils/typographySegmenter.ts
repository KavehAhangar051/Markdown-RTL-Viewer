/**
 * @file utils/typographySegmenter.ts
 * @description Intelligent character-by-character and token-level script segmenter for Persian (Vazirmatn) and Latin (Kode Mono).
 */

import React from 'react';
import { isPersianCharCode, isDigitCode, hasPersianText } from '@/utils/persianizer';

export { isDigitCode };

/** CSS font-family string for Persian typography (Dana with Vazirmatn fallback) */
export const FONT_VAZIR_STYLE = "'Dana', 'Vazirmatn', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

/** Alias for Persian font style */
export const FONT_PERSIAN_STYLE = FONT_VAZIR_STYLE;

/** CSS font-family string for Latin Kode Mono */
export const FONT_MONO_STYLE = "'Kode Mono', monospace";

/** Script category classification */
export type ScriptType = 'persian' | 'latin';

/** Segmented text chunk with resolved script */
export interface ScriptSegment {
  readonly text: string;
  readonly script: ScriptType;
}

/**
 * Checks if a character is a numeric digit (ASCII 0-9, Arabic, or Persian digits).
 *
 * @param {string} char - Single character.
 * @returns {boolean} True if character is a digit.
 */
export function isDigit(char: string): boolean {
  if (!char) return false;

  return isDigitCode(char.charCodeAt(0));
}

/**
 * Fast numeric check if UTF-16 character code is a Latin letter (A-Z, a-z).
 *
 * @param {number} code - Character code.
 * @returns {boolean} True if character code represents an English/Latin letter.
 */
export function isLatinLetterCode(code: number): boolean {
  return (code >= 0x0041 && code <= 0x005a) || (code >= 0x0061 && code <= 0x007a);
}

/**
 * Checks if a character is a Latin alphabet character (A-Z, a-z).
 *
 * @param {string} char - Single character.
 * @returns {boolean} True if the character is an English/Latin letter.
 */
export function isLatinLetter(char: string): boolean {
  if (!char) return false;

  return isLatinLetterCode(char.charCodeAt(0));
}

/**
 * Scans ahead in text to identify the script of the first upcoming letter or digit.
 * Returns null if no letter or digit characters are found.
 *
 * @param {string} text - Raw string.
 * @param {number} startIndex - Starting search index.
 * @returns {ScriptType | null} Detected upcoming script or null.
 */
function findFirstScriptInText(text: string, startIndex: number): ScriptType | null {
  const len = text.length;

  for (let i = startIndex; i < len; i++) {
    const code = text.charCodeAt(i);

    if (isDigitCode(code)) return 'latin';

    if (isPersianCharCode(code)) return 'persian';

    if (isLatinLetterCode(code)) return 'latin';
  }

  return null;
}

/**
 * Segments an input string into consecutive runs of Persian vs Latin text chunks.
 * Uses range-based slicing instead of per-character string concatenation to minimize GC pressure.
 * Digits are routed to the Latin/Kode Mono font stack per typography specifications.
 *
 * @param {string} text - Raw string to analyze.
 * @param {ScriptType} [defaultScript='persian'] - Fallback script when context has no letters.
 * @returns {ScriptSegment[]} Array of classified script segments.
 */
export function segmentTextByScript(text: string, defaultScript: ScriptType = 'persian'): ScriptSegment[] {
  if (!text) return [];

  const segments: ScriptSegment[] = [];
  let currentScript: ScriptType | null = null;
  let segmentStart = 0;
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const code = text.charCodeAt(i);

    if (isDigitCode(code)) {
      if (currentScript !== 'latin') {
        if (i > segmentStart) {
          segments.push({ text: text.slice(segmentStart, i), script: currentScript ?? 'persian' });
        }

        currentScript = 'latin';
        segmentStart = i;
      }
    } else if (isPersianCharCode(code)) {
      if (currentScript !== 'persian') {
        if (i > segmentStart) {
          segments.push({ text: text.slice(segmentStart, i), script: currentScript ?? 'latin' });
        }

        currentScript = 'persian';
        segmentStart = i;
      }
    } else if (isLatinLetterCode(code)) {
      if (currentScript !== 'latin') {
        if (i > segmentStart) {
          segments.push({ text: text.slice(segmentStart, i), script: currentScript ?? 'persian' });
        }

        currentScript = 'latin';
        segmentStart = i;
      }
    } else {
      // Neutral characters (whitespace, punctuation, symbols)
      if (currentScript === null) {
        currentScript = findFirstScriptInText(text, i) ?? defaultScript;
      }
    }
  }

  if (segmentStart < len && currentScript) {
    segments.push({ text: text.slice(segmentStart), script: currentScript });
  }

  return segments;
}

/** Pre-compiled token regex for HTML segmentation */
const HTML_TOKEN_REGEX = /(<[^>]+>|&(?:[a-zA-Z0-9]+|#\d+|#x[0-9a-fA-F]+);|[^<>&]+)/g;

/**
 * Transforms an HTML string (such as highlight.js output) by wrapping text runs in font-specific spans.
 * Preserves all HTML tags, attributes, and entities.
 * Includes a fast-path bypass when no Persian text exists, preventing thousands of redundant DOM nodes.
 *
 * @param {string} html - Raw HTML markup to segment.
 * @returns {string} HTML markup with character-analyzed font spans.
 */
export function segmentHtmlByLanguage(html: string): string {
  if (!html) return '';

  // Fast-path: If the highlighted HTML contains no Persian characters, return as-is.
  if (!hasPersianText(html)) {
    return html;
  }

  HTML_TOKEN_REGEX.lastIndex = 0;
  let output = '';
  let match: RegExpExecArray | null;

  while ((match = HTML_TOKEN_REGEX.exec(html)) !== null) {
    const token = match[0];

    // Preserve HTML tags as-is
    if (token.charCodeAt(0) === 60 && token.charCodeAt(token.length - 1) === 62) { // '<' and '>'
      output += token;
      continue;
    }

    // Treat entities (e.g. &quot;, &#39;, &lt;) as Latin/syntax tokens without wrapping
    if (token.charCodeAt(0) === 38 && token.charCodeAt(token.length - 1) === 59) { // '&' and ';'
      output += token;
      continue;
    }

    // Analyze plain text node for Persian and Latin segments
    const segments = segmentTextByScript(token, 'latin');
    const segCount = segments.length;

    for (let s = 0; s < segCount; s++) {
      const segment = segments[s];

      if (segment.script === 'persian') {
        output += `<span class="font-vazir font-persian-token" style="font-family: ${FONT_VAZIR_STYLE};">${segment.text}</span>`;
      } else {
        output += `<span class="font-mono font-latin-token" style="font-family: ${FONT_MONO_STYLE};">${segment.text}</span>`;
      }
    }
  }

  return output;
}

/**
 * Converts a mixed Persian/Latin string into an array of React spans with dedicated fonts.
 *
 * @param {string} text - Plain text to segment.
 * @param {string} [keyPrefix='seg'] - Unique prefix for React element keys.
 * @param {ScriptType} [defaultScript='persian'] - Fallback script for neutral text.
 * @returns {React.ReactNode} Array of React span elements or plain string.
 */
export function segmentMixedTextToReact(
  text: string,
  keyPrefix = 'seg',
  defaultScript: ScriptType = 'persian'
): React.ReactNode {
  if (!text) return text;

  const segments = segmentTextByScript(text, defaultScript);

  if (segments.length === 0) return text;

  if (segments.length === 1 && segments[0].script === 'persian') {
    return React.createElement(
      'span',
      { key: `${keyPrefix}-0`, className: 'font-vazir font-persian-token', style: { fontFamily: FONT_VAZIR_STYLE } },
      text
    );
  }

  if (segments.length === 1 && segments[0].script === 'latin') {
    return React.createElement(
      'span',
      { key: `${keyPrefix}-0`, className: 'font-mono font-latin-token', style: { fontFamily: FONT_MONO_STYLE } },
      text
    );
  }

  return segments.map((seg, idx) =>
    React.createElement(
      'span',
      {
        key: `${keyPrefix}-${idx}`,
        className: seg.script === 'persian' ? 'font-vazir font-persian-token' : 'font-mono font-latin-token',
        style: {
          fontFamily: seg.script === 'persian' ? FONT_VAZIR_STYLE : FONT_MONO_STYLE,
        },
      },
      seg.text
    )
  );
}

function isBooleanPrimitive(val: React.ReactNode): val is boolean {
  return Object.prototype.toString.call(val) === '[object Boolean]';
}

function isStringPrimitive(val: React.ReactNode): val is string {
  return Object.prototype.toString.call(val) === '[object String]';
}

function isNumberPrimitive(val: React.ReactNode): val is number {
  return Object.prototype.toString.call(val) === '[object Number]';
}

/**
 * Traverses React children recursively and applies typography script segmentation to plain text strings.
 * Preserves existing JSX component trees while isolating Persian tokens with Dana and Latin with Kode Mono.
 *
 * @param {React.ReactNode} children - React children to process.
 * @param {ScriptType} [defaultScript='persian'] - Fallback script for neutral text.
 * @returns {React.ReactNode} Processed React children with granular font segmentation.
 */
export function renderHybridChildren(
  children: React.ReactNode,
  defaultScript: ScriptType = 'persian'
): React.ReactNode {
  if (children === null || children === undefined || isBooleanPrimitive(children)) {
    return children;
  }

  if (isStringPrimitive(children)) {
    return segmentMixedTextToReact(children, 'seg', defaultScript);
  }

  if (isNumberPrimitive(children)) {
    return String(children);
  }

  if (Array.isArray(children)) {
    return React.Children.map(children, (child, idx) =>
      React.createElement(React.Fragment, { key: `hybrid-${idx}` }, renderHybridChildren(child, defaultScript))
    );
  }

  if (React.isValidElement(children)) {
    // SAFETY: React.isValidElement confirms children is a valid ReactElement
    const element = children as React.ReactElement<{
      children?: React.ReactNode;
      className?: string;
    }>;

    // Preserve KaTeX math trees and MathML nodes untouched so KaTeX fonts and metrics are never overridden
    const cls = element.props?.className ?? '';
    const tagType = String(element.type);

    if (
      cls.includes('katex') ||
      cls.includes('math') ||
      tagType === 'math' ||
      tagType === 'semantics' ||
      tagType === 'annotation'
    ) {
      return children;
    }

    if (element.props && element.props.children !== undefined) {
      return React.cloneElement(element, {
        ...element.props,
        children: renderHybridChildren(element.props.children, defaultScript),
      });
    }
  }

  return children;
}
