/**
 * @file tests/domain-contracts.test.ts
 * @description Automated contract verification suite for pure domain logic (The Pragmatic Programmer).
 * Tests DRY invariants, bounded LRU cache behavior, RTL table alignment, Persian/digit classification,
 * file upload validation contracts, and C-family syntax highlighting enhancement.
 */

import assert from 'node:assert/strict';
import { createBoundedCache } from '../utils/lruCache';
import { isDigitCode, isPersianChar, hasPersianText } from '../utils/persianizer';
import { segmentTextByScript, segmentHtmlByLanguage } from '../utils/typographySegmenter';
import { convertToRtlMarkdown } from '../utils/rtlConverter';
import { calculateDocumentStats } from '../utils/statsCalculator';
import { validateMarkdownUploadFile } from '../utils/fileHelpers';
import { processDocument, prepareExportBundle, clearDocumentCache, getDocumentCacheStats } from '../services/markdownEngine';
import { highlightCode, normalizeLanguage, clearHighlightCache, getHighlightCacheStats } from '../utils/syntaxHighlighter';
import { getScrollProgress, calculateTargetScrollTop } from '../utils/syncScroll';
import { MAX_UPLOAD_FILE_SIZE_BYTES } from '../constants/domain';

function verifyBoundedLruCacheContracts(): void {
  const cache = createBoundedCache<number>(2);
  assert.equal(cache.get('a'), undefined);
  assert.equal(cache.getStats().misses, 1);

  cache.set('a', 1);
  cache.set('b', 2);
  // Refresh 'a' so 'b' becomes least-recently-used
  assert.equal(cache.get('a'), 1);
  assert.equal(cache.getStats().hits, 1);

  // Inserting 'c' must evict 'b', keeping 'a' and 'c'
  cache.set('c', 3);
  assert.equal(cache.get('b'), undefined);
  assert.equal(cache.get('a'), 1);
  assert.equal(cache.get('c'), 3);
  assert.equal(cache.getStats().size, 2);

  cache.clear();
  assert.equal(cache.getStats().size, 0);
  assert.equal(cache.getStats().hits, 0);
  assert.equal(cache.getStats().misses, 0);
}

function verifyPersianAndDigitDryContracts(): void {
  // Digits (ASCII, Arabic, Persian) must be classified as digits and NEVER as Persian text letters
  assert.equal(isDigitCode('5'.charCodeAt(0)), true);
  assert.equal(isDigitCode('۵'.charCodeAt(0)), true);
  assert.equal(isDigitCode('٥'.charCodeAt(0)), true);

  assert.equal(isPersianChar('۵'), false);
  assert.equal(hasPersianText('12345 ۰۱۲۳۴۵'), false);
  assert.equal(hasPersianText('سلام 123'), true);

  const segments = segmentTextByScript('نسخه 2.0 پایدار');
  assert.equal(segments.length, 3);
  assert.equal(segments[0].script, 'persian');
  assert.equal(segments[1].script, 'latin');
  assert.equal(segments[2].script, 'persian');

  const pureLatinHtml = '<span class="hljs-number">42</span>';
  assert.equal(segmentHtmlByLanguage(pureLatinHtml), pureLatinHtml);
}

function verifyRtlMarkdownAndEngineContracts(): void {
  clearDocumentCache();

  const raw = [
    '# عنوان آزمایشی',
    '',
    '| ستون ۱ | ستون ۲ |',
    '| --- | :--- |',
    '| الف | ب |',
    '',
    '```c',
    '| not | a | table |',
    '| --- | --- | --- |',
    '```',
  ].join('\n');

  const doc = processDocument(raw);
  assert.equal(doc.title, 'عنوان آزمایشی');
  assert.equal(doc.hasContent, true);
  assert.equal(doc.rtlMarkdown.includes('| ---: | ---: |'), true);
  // Table inside code fence must remain untouched
  assert.equal(doc.rtlMarkdown.includes('| --- | --- | --- |'), true);

  // Second call with identical input must hit LRU cache
  const cachedDoc = processDocument(raw);
  assert.equal(cachedDoc, doc);
  assert.equal(getDocumentCacheStats().hits, 1);

  const bundle = prepareExportBundle(doc.rtlMarkdown, doc.title);
  assert.equal(bundle.filename, 'عنوان-آزمایشی.md');
  assert.equal(bundle.mimeType, 'text/markdown;charset=utf-8');
  assert.equal(convertToRtlMarkdown(''), '');
}

function verifyStatsAndSyncScrollContracts(): void {
  const emptyStats = calculateDocumentStats('');
  assert.equal(emptyStats.wordCount, 0);
  assert.equal(emptyStats.lineCount, 0);
  assert.equal(emptyStats.estimatedReadTimeMinutes, 0);

  const stats = calculateDocumentStats('سلام دنیا\nHello world');
  assert.equal(stats.wordCount, 4);
  assert.equal(stats.lineCount, 2);
  assert.equal(stats.persianCharCount, 8);
  assert.equal(stats.estimatedReadTimeMinutes, 1);

  assert.equal(getScrollProgress(50, 200, 100), 0.5);
  assert.equal(getScrollProgress(NaN, 200, 100), 0);
  assert.equal(calculateTargetScrollTop(50, 200, 100, 500, 100), 200);
}

function verifyFileValidationAndSyntaxHighlighterContracts(): void {
  // Case-insensitive extension check + size boundary check
  assert.equal(validateMarkdownUploadFile('README.MD', 1024), 'valid');
  assert.equal(validateMarkdownUploadFile('notes.txt', 0), 'valid');
  assert.equal(validateMarkdownUploadFile('virus.exe', 512), 'invalid_type');
  assert.equal(validateMarkdownUploadFile('huge.md', MAX_UPLOAD_FILE_SIZE_BYTES + 1), 'file_too_large');

  clearHighlightCache();
  assert.equal(normalizeLanguage('C++'), 'cpp');
  assert.equal(normalizeLanguage('py3'), 'python');

  const cHighlight = highlightCode('PacketNode_t* node = create_node(MAX_BUF); node->len = 0;', 'c');
  assert.equal(cHighlight.language, 'c');
  assert.equal(cHighlight.html.includes('hljs-type'), true);
  assert.equal(cHighlight.html.includes('hljs-title function_ invoke_'), true);
  assert.equal(cHighlight.html.includes('hljs-variable constant_'), true);
  assert.equal(cHighlight.html.includes('hljs-property'), true);

  // Cache hit check
  highlightCode('PacketNode_t* node = create_node(MAX_BUF); node->len = 0;', 'c');
  assert.equal(getHighlightCacheStats().hits, 1);
}

verifyBoundedLruCacheContracts();

verifyPersianAndDigitDryContracts();

verifyRtlMarkdownAndEngineContracts();

verifyStatsAndSyncScrollContracts();

verifyFileValidationAndSyntaxHighlighterContracts();
