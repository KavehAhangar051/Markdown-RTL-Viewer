/**
 * @file services/markdownEngine.ts
 * @description Deep domain module for Markdown processing, RTL conversion, document analytics, and export preparation.
 * Designed according to codebase-design principles: deep implementation behind a compact, high-leverage interface.
 */

import { DocumentStats } from '@/types/markdown';
import { DEFAULT_READING_SPEED_WPM } from '@/constants/domain';
import { convertToRtlMarkdown } from '@/utils/rtlConverter';
import { calculateDocumentStats } from '@/utils/statsCalculator';
import { createBoundedCache, CacheTelemetryStats } from '@/utils/lruCache';

/**
 * Configuration options for document processing across the engine seam.
 */
export interface ProcessDocumentOptions {
  /** Force right alignment on table column dividers */
  readonly alignTablesRtl?: boolean;
  /** Custom reading speed in words per minute (defaults to 180 wpm) */
  readonly wordsPerMinute?: number;
}

/**
 * Result of comprehensive document processing across the Markdown engine seam.
 */
export interface ProcessedDocument {
  /** Original un-mutated raw markdown input */
  readonly raw: string;
  /** Transformed markdown with right-aligned table columns and preserved code fences */
  readonly rtlMarkdown: string;
  /** Comprehensive metrics including line count, words, and Persian ratio */
  readonly stats: DocumentStats;
  /** Whether the document contains meaningful non-whitespace content */
  readonly hasContent: boolean;
  /** Document title extracted from the first heading (# Title), if available */
  readonly title: string;
}

/**
 * Document export bundle containing content, target filename, and MIME type.
 */
export interface ExportBundle {
  readonly content: string;
  readonly filename: string;
  readonly mimeType: string;
}

/** Maximum number of processed document states cached in memory */
const DOCUMENT_CACHE_LIMIT = 64;

/** Internal bounded LRU cache for markdown processing output */
const documentCache = createBoundedCache<ProcessedDocument>(DOCUMENT_CACHE_LIMIT);

/**
 * Clears the markdown document processing LRU cache.
 */
export function clearDocumentCache(): void {
  documentCache.clear();
}

/**
 * Snapshot of markdown document cache performance metrics.
 */
export type DocumentCacheStats = CacheTelemetryStats;

/**
 * Returns performance metrics for the markdown document processing LRU cache.
 *
 * @returns {DocumentCacheStats} Cache performance snapshot.
 */
export function getDocumentCacheStats(): DocumentCacheStats {
  return documentCache.getStats();
}

/**
 * Deep module interface for processing a markdown document.
 * Encapsulates table alignment, code fence isolation, word tokenization,
 * Persian character detection, title extraction, and reading time calculation.
 * Results are cached in a bounded LRU cache to eliminate redundant computation.
 *
 * @param {string} rawText - Raw markdown text input.
 * @param {ProcessDocumentOptions} [options] - Optional processing configuration.
 * @returns {ProcessedDocument} Immutable processed document result.
 */
export function processDocument(
  rawText: string,
  options?: ProcessDocumentOptions
): ProcessedDocument {
  const safeText = rawText ?? '';
  const alignTables = options?.alignTablesRtl ?? true;

  const wpm =
    options?.wordsPerMinute && options.wordsPerMinute > 0
      ? options.wordsPerMinute
      : DEFAULT_READING_SPEED_WPM;

  const cacheKey = `${alignTables}::${wpm}::${safeText}`;

  const cached = documentCache.get(cacheKey);

  if (cached !== undefined) {
    return cached;
  }

  const trimmed = safeText.trim();
  const hasContent = trimmed.length > 0;

  // 1. Transform syntax (RTL table alignment while preserving code blocks)
  const rtlMarkdown = alignTables ? convertToRtlMarkdown(safeText) : safeText;

  // 2. Compute document analytics and reading estimates directly with target WPM
  const stats = calculateDocumentStats(safeText, wpm);

  // 3. Extract primary document title if present
  const title = extractDocumentTitle(safeText);

  const result: ProcessedDocument = {
    raw: safeText,
    rtlMarkdown,
    stats,
    hasContent,
    title,
  };

  documentCache.set(cacheKey, result);

  return result;
}

/** Pre-compiled regexes for title extraction to prevent re-compilation in loop */
const TITLE_CODE_FENCE_REGEX = /^\s*(```|~~~)/;
const ATX_H1_REGEX = /^#\s+(.+)$/;
const SETEXT_H1_REGEX = /^\s*={3,}\s*$/;

/**
 * Prepares an export bundle for downloading or sharing a processed markdown document.
 * Pure in-process computation without browser DOM side-effects.
 *
 * @param {string} markdown - The markdown content to export.
 * @param {string} [customTitle] - Optional custom title to use in the filename.
 * @returns {ExportBundle} Immutable export package with content, sanitized filename, and MIME type.
 */
export function prepareExportBundle(
  markdown: string,
  customTitle?: string
): ExportBundle {
  const safeTitle = (customTitle || extractDocumentTitle(markdown) || 'rtl-document')
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'rtl-document';

  return {
    content: markdown ?? '',
    filename: `${safeTitle}.md`,
    mimeType: 'text/markdown;charset=utf-8',
  };
}

/**
 * Extracts the primary heading from markdown source text, ignoring code blocks.
 * Scans line-by-line up to the first 60 lines to avoid allocating massive string arrays.
 *
 * @param {string} text - Raw markdown text.
 * @returns {string} Extracted heading title or empty string.
 */
function extractDocumentTitle(text: string): string {
  if (!text) return '';
  let inCode = false;
  let lineStart = 0;
  let lineCount = 0;
  let prevLine = '';

  while (lineStart < text.length && lineCount < 60) {
    let lineEnd = text.indexOf('\n', lineStart);

    if (lineEnd === -1) {
      lineEnd = text.length;
    }

    const line = text.slice(lineStart, lineEnd);
    lineCount++;
    lineStart = lineEnd + 1;

    if (TITLE_CODE_FENCE_REGEX.test(line)) {
      inCode = !inCode;
      prevLine = line;
      continue;
    }

    if (!inCode) {
      // ATX Level 1 heading: # Title
      const atxMatch = line.match(ATX_H1_REGEX);

      if (atxMatch) {
        return atxMatch[1].trim();
      }

      // Setext Level 1 heading: Title on prevLine, ===... on current line
      if (SETEXT_H1_REGEX.test(line) && prevLine.trim().length > 0 && !TITLE_CODE_FENCE_REGEX.test(prevLine)) {
        return prevLine.trim();
      }
    }

    prevLine = line;
  }

  return '';
}
