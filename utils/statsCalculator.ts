/**
 * @file utils/statsCalculator.ts
 * @description Utility to compute word count, character count, Persian character ratio, and read time.
 */

import { DocumentStats } from '@/types/markdown';
import { DEFAULT_READING_SPEED_WPM } from '@/constants/domain';
import { isPersianCharCode } from './persianizer';

/**
 * Calculates comprehensive document statistics for a given text using a high-performance,
 * single-pass scan that eliminates intermediate string arrays and garbage-collection pressure.
 * Operates purely on UTF-16 numeric character codes (SMI) avoiding single-character string allocations.
 *
 * @param {string} text - The raw text input to analyze.
 * @param {number} [wordsPerMinute] - Custom reading speed in words per minute (defaults to 180 wpm).
 * @returns {DocumentStats} Comprehensive metrics and statistics for the document.
 */
export function calculateDocumentStats(text: string, wordsPerMinute?: number): DocumentStats {
  if (!text) {
    return {
      characterCount: 0,
      wordCount: 0,
      persianCharCount: 0,
      lineCount: 0,
      estimatedReadTimeMinutes: 0,
    };
  }

  const characterCount = text.length;
  let lineCount = 1;
  let persianCharCount = 0;
  let wordCount = 0;
  let inWord = false;

  for (let i = 0; i < characterCount; i++) {
    const code = text.charCodeAt(i);

    if (code === 10) {
      lineCount++;
    }

    if (isPersianCharCode(code)) {
      persianCharCount++;
    }

    // High-speed whitespace detection matching /\s+/
    // Branch on ASCII range (<= 32) first to handle 99.9% of characters in 1 comparison
    const isWhitespace =
      code <= 32
        ? code === 32 || code === 10 || code === 9 || code === 13 || code === 12 || code === 11
        : code === 160 ||
          (code >= 0x2000 && code <= 0x200a) ||
          code === 0x2028 ||
          code === 0x2029 ||
          code === 0x3000;

    if (isWhitespace) {
      if (inWord) {
        wordCount++;
        inWord = false;
      }
    } else {
      inWord = true;
    }
  }

  if (inWord) {
    wordCount++;
  }

  const wpm = wordsPerMinute && wordsPerMinute > 0 ? wordsPerMinute : DEFAULT_READING_SPEED_WPM;

  const estimatedReadTimeMinutes =
    wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / wpm));

  return {
    characterCount,
    wordCount,
    persianCharCount,
    lineCount,
    estimatedReadTimeMinutes,
  };
}
