/**
 * @file utils/typographySegmenter.ts
 * @description Intelligent character-by-character and token-level script segmenter for Persian (Vazirmatn) and Latin (Kode Mono).
 */

import React from 'react';
import {
  isPersianCharCode,
  isDigitCode,
  hasPersianText,
  hasNonAsciiDigit,
  normalizeDigitsToAscii,
} from '@/utils/persianizer';

/** CSS font-family string for Persian typography (Dana with Vazirmatn fallback) */
export const FONT_VAZIR_STYLE = "'Dana', 'Vazirmatn', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

/** CSS font-family string for Latin & numeric typography (Kode Mono per DESIGN.md) */
export const FONT_MONO_STYLE = "'Kode Mono', monospace";

/** Shared frozen style objects to eliminate per-span object allocations during React rendering */
const PERSIAN_SPAN_STYLE = { fontFamily: FONT_VAZIR_STYLE } as const;
const LATIN_SPAN_STYLE = {
  fontFamily: FONT_MONO_STYLE,
  direction: 'ltr',
  unicodeBidi: 'isolate',
} as const;

/** Script category classification */
export type ScriptType = 'persian' | 'latin';

/** Segmented text chunk with resolved script */
export interface ScriptSegment {
  readonly text: string;
  readonly script: ScriptType;
}

/**
 * Fast numeric check if UTF-16 character code is a Latin letter (A-Z, a-z).
 *
 * @param {number} code - Character code.
 * @returns {boolean} True if character code represents an English/Latin letter.
 */
function isLatinLetterCode(code: number): boolean {
  return (code >= 0x0041 && code <= 0x005a) || (code >= 0x0061 && code <= 0x007a);
}

function findFirstScriptInText(text: string, startIndex: number): ScriptType | null {
  const len = text.length;

  for (let i = startIndex; i < len; i++) {
    const code = text.charCodeAt(i);

    if (isDigitCode(code) || isLatinLetterCode(code)) return 'latin';

    if (isPersianCharCode(code)) return 'persian';
  }

  return null;
}

function isLatinOrDigitCode(code: number): boolean {
  return isLatinLetterCode(code) || isDigitCode(code);
}

function isLatinWordConnectorCode(code: number): boolean {
  // '.', '-', '_', '/', ':', '@'
  return (
    code === 0x002e ||
    code === 0x002d ||
    code === 0x005f ||
    code === 0x002f ||
    code === 0x003a ||
    code === 0x0040
  );
}

function isLatinSuffixSymbolCode(code: number): boolean {
  // '+', '#', '%'
  return code === 0x002b || code === 0x0023 || code === 0x0025;
}

function isSpaceBridgingLatin(text: string, spaceIndex: number): boolean {
  const len = text.length;
  let k = spaceIndex + 1;

  while (k < len && text.charCodeAt(k) === 0x0020) {
    k++;
  }

  return k < len && isLatinOrDigitCode(text.charCodeAt(k));
}

function hasClosedAsciiParenWithoutPersian(text: string, openParenIndex: number): boolean {
  const len = text.length;
  let depth = 1;

  for (let k = openParenIndex + 1; k < len; k++) {
    const code = text.charCodeAt(k);

    if (isPersianCharCode(code)) {
      return false;
    }

    if (code === 0x0028) {
      depth++;
    } else if (code === 0x0029) {
      depth--;

      if (depth === 0) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Creates a ScriptSegment, normalizing any Persian/Arabic digits to ASCII 0-9 when script is 'latin'
 * so that Kode Mono renders its native numeric glyphs instead of falling back to system fonts.
 */
function buildSegment(rawSlice: string, script: ScriptType): ScriptSegment {
  return {
    text: script === 'latin' ? normalizeDigitsToAscii(rawSlice) : rawSlice,
    script,
  };
}

/**
 * Segments an input string into consecutive runs of Persian vs Latin text chunks.
 * Uses range-based slicing instead of per-character string concatenation to minimize GC pressure.
 * Digits are routed to the Latin/Kode Mono font stack and normalized to ASCII 0-9 per typography specifications.
 * Trailing spaces and prose parentheses/brackets are kept out of isolated LTR Latin segments so RTL spacing
 * and Unicode Bidi paired-bracket mirroring work accurately.
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
  let openLatinParens = 0;
  let hasSeenStrongChar = false;
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const code = text.charCodeAt(i);

    if (isDigitCode(code) || isLatinLetterCode(code)) {
      hasSeenStrongChar = true;

      if (currentScript !== 'latin') {
        if (i > segmentStart) {
          segments.push(buildSegment(text.slice(segmentStart, i), currentScript ?? defaultScript));
        }

        currentScript = 'latin';
        segmentStart = i;
        openLatinParens = 0;
      }
    } else if (isPersianCharCode(code)) {
      hasSeenStrongChar = true;

      if (currentScript !== 'persian') {
        if (i > segmentStart) {
          segments.push(buildSegment(text.slice(segmentStart, i), currentScript ?? defaultScript));
        }

        currentScript = 'persian';
        segmentStart = i;
        openLatinParens = 0;
      }
    } else if (currentScript === 'latin') {
      let keepInLatin = false;

      if (defaultScript === 'latin' && !hasSeenStrongChar) {
        keepInLatin = true;
      } else if (code === 0x0028) {
        if (
          i > 0 &&
          isLatinOrDigitCode(text.charCodeAt(i - 1)) &&
          hasClosedAsciiParenWithoutPersian(text, i)
        ) {
          keepInLatin = true;
          openLatinParens++;
        }
      } else if (code === 0x0029) {
        if (openLatinParens > 0) {
          keepInLatin = true;
          openLatinParens--;
        }
      } else if (isLatinSuffixSymbolCode(code)) {
        keepInLatin = true;
      } else if (isLatinWordConnectorCode(code)) {
        keepInLatin = i + 1 < len && isLatinOrDigitCode(text.charCodeAt(i + 1));
      } else if (code === 0x0020) {
        keepInLatin = openLatinParens > 0 || isSpaceBridgingLatin(text, i);
      }

      if (!keepInLatin) {
        const shouldSwitchToPersian =
          defaultScript === 'persian' || findFirstScriptInText(text, i) === 'persian';

        if (shouldSwitchToPersian) {
          if (i > segmentStart) {
            segments.push(buildSegment(text.slice(segmentStart, i), 'latin'));
          }

          currentScript = 'persian';
          segmentStart = i;
          openLatinParens = 0;
        }
      }
    } else if (currentScript === null) {
      currentScript = defaultScript;
    }
  }

  if (segmentStart < len && currentScript) {
    segments.push(
      buildSegment(segmentStart === 0 ? text : text.slice(segmentStart), currentScript)
    );
  }

  return segments;
}

/** Pre-compiled token regex for HTML segmentation */
const HTML_TOKEN_REGEX = /(<[^>]+>|&(?:[a-zA-Z0-9]+|#\d+|#x[0-9a-fA-F]+);|[^<>&]+)/g;

/**
 * Transforms an HTML string (such as highlight.js output) by wrapping text runs in font-specific spans.
 * Preserves all HTML tags, attributes, and entities.
 * Includes a fast-path bypass when no Persian text or non-ASCII digits exist, preventing redundant DOM nodes.
 *
 * @param {string} html - Raw HTML markup to segment.
 * @returns {string} HTML markup with character-analyzed font spans.
 */
export function segmentHtmlByLanguage(html: string): string {
  if (!html) return '';

  // Fast-path: If the highlighted HTML contains no Persian characters and no Persian/Arabic digits, return as-is.
  if (!hasPersianText(html) && !hasNonAsciiDigit(html)) {
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

    // Fast-path per token: if this text node has no Persian characters, normalize any Persian digits and inherit Kode Mono
    if (!hasPersianText(token)) {
      output += normalizeDigitsToAscii(token);
      continue;
    }

    // Analyze mixed/Persian text node for Persian and Latin segments (e.g. numbers inside Persian comments)
    const segments = segmentTextByScript(token, 'latin');
    const segCount = segments.length;

    for (let s = 0; s < segCount; s++) {
      const segment = segments[s];

      if (segment.script === 'persian') {
        output += `<span class="font-vazir font-persian-token" dir="rtl" style="font-family: ${FONT_VAZIR_STYLE}; unicode-bidi: isolate;">${segment.text}</span>`;
      } else {
        output += `<span class="font-mono font-latin-token" dir="ltr" style="font-family: ${FONT_MONO_STYLE}; unicode-bidi: isolate;">${segment.text}</span>`;
      }
    }
  }

  return output;
}

/**
 * Fast scan checking whether a string contains any Latin letters or numeric digits.
 * Allows pure-Persian strings to bypass array/object allocation in segmentMixedTextToReact.
 */
function hasLatinOrDigit(text: string): boolean {
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const code = text.charCodeAt(i);

    if (isDigitCode(code) || isLatinLetterCode(code)) {
      return true;
    }
  }

  return false;
}

/**
 * Converts a mixed Persian/Latin string into React nodes with dedicated fonts.
 * Segments matching `defaultScript` are returned as plain strings (inheriting the parent font)
 * to minimize React element and DOM node allocations on mid/low-tier devices.
 *
 * @param {string} text - Plain text to segment.
 * @param {string} [keyPrefix='seg'] - Unique prefix for React element keys.
 * @param {ScriptType} [defaultScript='persian'] - Fallback script for neutral text.
 * @returns {React.ReactNode} React node(s) or plain string.
 */
export function segmentMixedTextToReact(
  text: string,
  keyPrefix = 'seg',
  defaultScript: ScriptType = 'persian'
): React.ReactNode {
  if (!text) return text;

  // Fast-path: pure Persian/neutral text inside a Persian container needs zero span wrappers or array allocations
  if (defaultScript === 'persian' && !hasLatinOrDigit(text)) {
    return text;
  }

  // Fast-path: pure Latin/neutral text inside a Latin container needs zero span wrappers
  if (defaultScript === 'latin' && !hasPersianText(text)) {
    return normalizeDigitsToAscii(text);
  }

  const segments = segmentTextByScript(text, defaultScript);

  if (segments.length === 0) return text;

  if (segments.length === 1 && segments[0].script === defaultScript) {
    return segments[0].text;
  }

  if (segments.length === 1) {
    const isPersian = segments[0].script === 'persian';

    return React.createElement(
      'span',
      {
        key: `${keyPrefix}-0`,
        className: isPersian ? 'font-vazir font-persian-token' : 'font-mono font-latin-token',
        style: isPersian ? PERSIAN_SPAN_STYLE : LATIN_SPAN_STYLE,
      },
      segments[0].text
    );
  }

  return segments.map((seg, idx) => {
    if (seg.script === defaultScript) {
      return seg.text;
    }

    const isPersian = seg.script === 'persian';

    return React.createElement(
      'span',
      {
        key: `${keyPrefix}-${idx}`,
        className: isPersian ? 'font-vazir font-persian-token' : 'font-mono font-latin-token',
        style: isPersian ? PERSIAN_SPAN_STYLE : LATIN_SPAN_STYLE,
      },
      seg.text
    );
  });
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
      node?: { tagName?: string };
    }>;

    // Preserve KaTeX math trees, MathML nodes, and CodeBlock/Pre elements untouched
    // so CodeBlock receives raw string children and KaTeX keeps its internal font metrics.
    const cls = element.props?.className ?? '';
    const tagType = String(element.type);
    const nodeTag = element.props?.node?.tagName ?? '';
    const elemDisplayName = (element.type as { displayName?: string })?.displayName ?? '';

    if (
      cls.includes('katex') ||
      cls.includes('math') ||
      cls.includes('language-') ||
      tagType === 'math' ||
      tagType === 'semantics' ||
      tagType === 'annotation' ||
      tagType === 'code' ||
      tagType === 'pre' ||
      nodeTag === 'code' ||
      nodeTag === 'pre' ||
      elemDisplayName === 'CodeBlock'
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
