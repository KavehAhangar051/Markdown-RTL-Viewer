/**
 * @file tests/domain-contracts.test.ts
 * @description Automated contract verification suite for pure domain logic (The Pragmatic Programmer).
 * Tests DRY invariants, bounded LRU cache behavior, RTL table alignment, Persian/digit classification,
 * file upload validation contracts, and C-family syntax highlighting enhancement.
 */

import assert from 'node:assert/strict';
import { createBoundedCache } from '../utils/lruCache';
import { isDigitCode, isPersianChar, hasPersianText, normalizeDigitsToAscii } from '../utils/persianizer';
import {
  FONT_MONO_STYLE,
  segmentTextByScript,
  segmentHtmlByLanguage,
  segmentMixedTextToReact,
} from '../utils/typographySegmenter';
import { convertToRtlMarkdown, CODE_FENCE_REGEX, updateCodeFenceState } from '../utils/rtlConverter';
import { calculateDocumentStats, EMPTY_DOCUMENT_STATS } from '../utils/statsCalculator';
import { validateMarkdownUploadFile, processUploadedMarkdownFile } from '../utils/fileHelpers';
import {
  processDocument,
  prepareExportBundle,
  clearDocumentCache,
  getDocumentCacheStats,
  EMPTY_PROCESSED_DOCUMENT,
} from '../services/markdownEngine';
import {
  highlightCode,
  normalizeLanguage,
  formatLanguageDisplayName,
  clearHighlightCache,
  getHighlightCacheStats,
} from '../utils/syntaxHighlighter';
import { enhanceHighlightedHtml } from '../utils/cFamilyEnhancer';
import { calculateActiveLinePosition } from '../hooks/useActiveLinePosition';
import { getScrollProgress, calculateTargetScrollTop } from '../utils/syncScroll';
import { MAX_UPLOAD_FILE_SIZE_BYTES } from '../constants/domain';
import { SAMPLE_RTL_MARKDOWN_FA, SAMPLE_RTL_MARKDOWN_EN } from '../constants/sampleMarkdown';
import {
  STUDIO_VT_NAMES,
  STUDIO_TRANSITION_TYPES,
  STUDIO_VT_ANIMATIONS,
  resolveViewModeTransitionType,
  runStudioTransition,
} from '../utils/viewTransitions';
import manifest from '../app/manifest';

const EMOJI_CODEPOINT_REGEX = /\p{Extended_Pictographic}/u;

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
  // Font contract: Latin/digit tokens must prioritize Kode Mono per DESIGN.md
  assert.equal(FONT_MONO_STYLE.startsWith("'Kode Mono'"), true);

  // Digits (ASCII, Arabic, Persian) must be classified as digits and NEVER as Persian text letters
  assert.equal(isDigitCode('5'.charCodeAt(0)), true);
  assert.equal(isDigitCode('۵'.charCodeAt(0)), true);
  assert.equal(isDigitCode('٥'.charCodeAt(0)), true);
  assert.equal(normalizeDigitsToAscii('۰۱۲۳۴۵۶۷۸۹ ٠١٢٣٤٥٦٧٨٩'), '0123456789 0123456789');

  assert.equal(isPersianChar('۵'), false);
  assert.equal(hasPersianText('12345 ۰۱۲۳۴۵'), false);
  assert.equal(hasPersianText('سلام 123'), true);

  const segments = segmentTextByScript('نسخه ۲.۰ پایدار');
  assert.equal(segments.length, 3);
  assert.equal(segments[0].script, 'persian');
  assert.equal(segments[1].script, 'latin');
  assert.equal(segments[1].text, '2.0 ');
  assert.equal(segments[2].script, 'persian');

  // Pure Persian prose inside a Persian container must return the raw string without allocating span wrappers
  const purePersianProse = 'این یک متن کاملاً فارسی بدون کاراکتر لاتین است.';
  assert.equal(segmentMixedTextToReact(purePersianProse, 'seg', 'persian'), purePersianProse);

  const pureLatinHtml = '<span class="hljs-number">42</span>';
  assert.equal(segmentHtmlByLanguage(pureLatinHtml), pureLatinHtml);
}

function verifyRtlMarkdownAndEngineContracts(): void {
  clearDocumentCache();

  // PoEAA Special Case Value Object contract for empty documents
  assert.equal(processDocument(''), EMPTY_PROCESSED_DOCUMENT);
  assert.equal(Object.isFrozen(EMPTY_PROCESSED_DOCUMENT), true);

  assert.equal(CODE_FENCE_REGEX.test('```ts'), true);
  assert.equal(CODE_FENCE_REGEX.test('  ~~~python'), true);

  const raw = [
    '```bash',
    '# comment inside code block must not become document title',
    '```',
    '',
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

  // Setext H1 title extraction contract
  const setextDoc = processDocument('عنوان ستکست\n===========\nمتن آزمایشی');
  assert.equal(setextDoc.title, 'عنوان ستکست');

  // Second call with identical input must hit LRU cache
  const cachedDoc = processDocument(raw);
  assert.equal(cachedDoc, doc);
  assert.equal(getDocumentCacheStats().hits, 1);

  const bundle = prepareExportBundle(doc.rtlMarkdown, doc.title);
  assert.equal(bundle.filename, 'عنوان-آزمایشی.md');
  assert.equal(bundle.mimeType, 'text/markdown;charset=utf-8');

  const fallbackBundle = prepareExportBundle('بدون تیتر', '!!!');
  assert.equal(fallbackBundle.filename, 'rtl-document.md');
  assert.equal(convertToRtlMarkdown(''), '');

  // Plan 006: 4-backtick outer fence containing 3-backtick inner fence + single-pipe false-positive guard
  assert.deepEqual(updateCodeFenceState('````markdown', null), { toggled: true, activeFence: '````' });
  assert.deepEqual(updateCodeFenceState('```', '````'), { toggled: false, activeFence: '````' });
  assert.deepEqual(updateCodeFenceState('````', '````'), { toggled: true, activeFence: null });

  const nestedFenceMd = [
    '````markdown',
    '```',
    '# تیتر داخل کد نباید استخراج شود',
    '| col1 | col2 |',
    '| --- | --- |',
    '```',
    '````',
    '# تیتر واقعی بیرون کد',
    '--- |',
    'ستون اول | ستون دوم',
    '--- | ---',
  ].join('\n');

  const nestedDoc = processDocument(nestedFenceMd);
  assert.equal(nestedDoc.title, 'تیتر واقعی بیرون کد');
  assert.equal(nestedDoc.rtlMarkdown.includes('| --- | --- |'), true);
  assert.equal(nestedDoc.rtlMarkdown.includes('\n--- |\n'), true);
  assert.equal(nestedDoc.rtlMarkdown.includes('---: | ---:'), true);

  // ChatGPT / Claude / Gemini math delimiter normalization contracts
  const mathMd = [
    'فرمول درون‌خطی \\( E = mc^2 \\) و کد `\\( not math \\)` در یک خط.',
    '$$ \\int_0^1 x^2 dx = \\frac{1}{3} $$',
    '\\[ \\sum_{k=1}^n k = \\frac{n(n+1)}{2} \\]',
    '```tex',
    '\\[ untouched inside code fence \\]',
    '$$ untouched single line $$',
    '```',
  ].join('\n');

  const mathConverted = convertToRtlMarkdown(mathMd);
  assert.equal(mathConverted.includes('فرمول درون‌خطی $E = mc^2$ و کد `\\( not math \\)`'), true);
  assert.equal(mathConverted.includes('$$\n\\int_0^1 x^2 dx = \\frac{1}{3}\n$$'), true);
  assert.equal(mathConverted.includes('$$\n\\sum_{k=1}^n k = \\frac{n(n+1)}{2}\n$$'), true);
  assert.equal(mathConverted.includes('\\[ untouched inside code fence \\]'), true);
  assert.equal(mathConverted.includes('$$ untouched single line $$'), true);
}

function verifyStatsAndSyncScrollContracts(): void {
  const emptyStats = calculateDocumentStats('');
  assert.equal(emptyStats, EMPTY_DOCUMENT_STATS);
  assert.equal(Object.isFrozen(EMPTY_DOCUMENT_STATS), true);
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

  // Plan 007: Active line position pure calculation contracts (ADR-0009)
  const line1 = calculateActiveLinePosition(0, 'خط اول\nخط دوم\nخط سوم', 0, 300);
  assert.equal(line1.lineNumber, 1);
  assert.equal(line1.top, 16);
  assert.equal(line1.height, 24);
  assert.equal(line1.isVisible, true);

  const line3 = calculateActiveLinePosition(16, 'خط اول\nخط دوم\nخط سوم', 5, 300, {
    lineHeight: 20,
    paddingTop: 10,
  });
  assert.equal(line3.lineNumber, 3);
  assert.equal(line3.top, 45);
  assert.equal(line3.isVisible, true);

  const cachedLine = calculateActiveLinePosition(16, 'خط اول\nخط دوم\nخط سوم', 10, 300, {
    lineHeight: 20,
    paddingTop: 10,
    cachedLineNumber: 3,
  });
  assert.equal(cachedLine.lineNumber, 3);
  assert.equal(cachedLine.top, 40);

  const offscreenLine = calculateActiveLinePosition(999, 'a\nb\nc\nd', 500, 100);
  assert.equal(offscreenLine.lineNumber, 4);
  assert.equal(offscreenLine.isVisible, false);
}

async function verifyFileValidationAndSyntaxHighlighterContracts(): Promise<void> {
  // Case-insensitive extension check + size boundary check
  assert.equal(validateMarkdownUploadFile('README.MD', 1024), 'valid');
  assert.equal(validateMarkdownUploadFile('notes.txt', 0), 'valid');
  assert.equal(validateMarkdownUploadFile('virus.exe', 512), 'invalid_type');
  assert.equal(validateMarkdownUploadFile('huge.md', MAX_UPLOAD_FILE_SIZE_BYTES + 1), 'file_too_large');

  const nullFileResult = await processUploadedMarkdownFile(null);
  assert.equal(nullFileResult.status, 'invalid_type');

  const validFile = new File(['# سلام دنیا'], 'sample.md', { type: 'text/markdown' });
  const uploadedResult = await processUploadedMarkdownFile(validFile);
  assert.equal(uploadedResult.status, 'ok');
  if (uploadedResult.status === 'ok') {
    assert.equal(uploadedResult.content, '# سلام دنیا');
    assert.equal(uploadedResult.fileName, 'sample.md');
  }

  clearHighlightCache();
  assert.equal(normalizeLanguage('C++'), 'cpp');
  assert.equal(normalizeLanguage('py3'), 'python');
  assert.equal(formatLanguageDisplayName('c++', true), 'C++');
  assert.equal(formatLanguageDisplayName('plaintext', true), 'متن');
  assert.equal(formatLanguageDisplayName('', false), 'TEXT');

  const plainPersianBlock = highlightCode('این یک متن ساده فارسی است', 'text');
  assert.equal(plainPersianBlock.language, 'text');
  assert.equal(plainPersianBlock.dir, 'rtl');

  const cHighlight = highlightCode(
    '// نسخه 2.0 پایدار\nPacketNode_t* node = create_node(MAX_BUF); node->len = 0;',
    'c'
  );

  assert.equal(cHighlight.language, 'c');
  assert.equal(cHighlight.dir, 'ltr');
  assert.equal(cHighlight.html.includes('hljs-type'), true);
  assert.equal(cHighlight.html.includes('hljs-title function_ invoke_'), true);
  assert.equal(cHighlight.html.includes('hljs-variable constant_'), true);
  assert.equal(cHighlight.html.includes('hljs-property'), true);
  assert.equal(cHighlight.html.includes('font-persian-token'), true);
  assert.equal(cHighlight.html.includes('font-latin-token'), true);

  // Performance budget guard (Step 5): pure-Latin tokens inside a mixed code block must not be wrapped in redundant font-latin-token spans
  const spanCount = (cHighlight.html.match(/<span/g) || []).length;
  assert.equal(spanCount <= 16, true);

  // Cache hit check
  highlightCode(
    '// نسخه 2.0 پایدار\nPacketNode_t* node = create_node(MAX_BUF); node->len = 0;',
    'c'
  );

  assert.equal(getHighlightCacheStats().hits, 1);

  // Plan 007: C-family enhancer immunity for non-systems languages and string/comment spans
  assert.equal(enhanceHighlightedHtml('call_fn(MAX_VAL)', 'python'), 'call_fn(MAX_VAL)');
  const stringAndCommentHtml =
    '<span class="hljs-string">"ptr-&gt;secret(MAX_KEY)"</span> <span class="hljs-comment">// obj.field</span>';
  assert.equal(enhanceHighlightedHtml(stringAndCommentHtml, 'c'), stringAndCommentHtml);
}

function verifyViewTransitionContracts(): void {
  // Every registered view-transition-name must be non-empty and globally unique
  const names = Object.values(STUDIO_VT_NAMES);
  const uniqueNames = new Set(names);
  assert.equal(uniqueNames.size, names.length);

  for (const name of names) {
    assert.equal(name.length > 0 && name !== 'none', true);
  }

  // Transition type mapping for all studio ViewMode values
  assert.equal(resolveViewModeTransitionType('split'), 'view-split');
  assert.equal(resolveViewModeTransitionType('editor'), 'view-editor');
  assert.equal(resolveViewModeTransitionType('preview'), 'view-preview');

  // Animation and transition registries must include 'default' / 'none'
  assert.equal(STUDIO_TRANSITION_TYPES.includes('default'), true);
  assert.equal(STUDIO_VT_ANIMATIONS.includes('none'), true);

  // runStudioTransition must invoke the synchronous state update callback
  let executed = false;

  runStudioTransition(['view-split', 'default'], () => {
    executed = true;
  });

  assert.equal(executed, true);

  // minimalist-skill contract: sample documents must be 100% emoji-free
  assert.equal(EMOJI_CODEPOINT_REGEX.test(SAMPLE_RTL_MARKDOWN_FA), false);
  assert.equal(EMOJI_CODEPOINT_REGEX.test(SAMPLE_RTL_MARKDOWN_EN), false);
}

async function verifyTinyDesktopBridgeContracts(): Promise<void> {
  const {
    extractFileNameFromPath,
    relativizeStaticExportHtml,
    relativizeStaticExportCss,
    relativizeWebpackPublicPath,
    isTinyDesktopRuntime,
    openMarkdownViaTinyDesktop,
    saveMarkdownViaTinyDesktop,
  } = await import('../utils/tinyDesktopBridge');

  // Windows & POSIX path basename extraction
  assert.equal(extractFileNameFromPath('C:\\Users\\Dev\\Documents\\notes.md'), 'notes.md');
  assert.equal(extractFileNameFromPath('/home/dev/workspace/readme.MD'), 'readme.MD');
  assert.equal(extractFileNameFromPath(''), 'document.md');

  // Static export HTML relativization for TinyJS file:// WebView2 packaging
  const rawHtml =
    '<link rel="stylesheet" href="/_next/static/css/app.css"/><script src="/_next/static/chunks/main.js"></script><link rel="icon" href="/favicon.ico"/><script>self.__next_f.push([1,"{\\"href\\":\\"/icon.svg\\"}"])</script>';
  const relHtml = relativizeStaticExportHtml(rawHtml);
  assert.equal(relHtml.includes('href="./_next/static/css/app.css"'), true);
  assert.equal(relHtml.includes('src="./_next/static/chunks/main.js"'), true);
  assert.equal(relHtml.includes('href="./favicon.ico"'), true);
  assert.equal(relHtml.includes('\\"href\\":\\"./icon.svg\\"'), true);

  // Static export CSS font URL relativization
  const rawCss =
    '@font-face{src:url(/_next/static/media/vazirmatn.woff2) format("woff2"),url("/_next/static/media/kode-mono.woff2");}';
  const relCss = relativizeStaticExportCss(rawCss);
  assert.equal(relCss.includes('url(../media/vazirmatn.woff2)'), true);
  assert.equal(relCss.includes('url("../media/kode-mono.woff2")'), true);

  // Webpack runtime publicPath relativization for dynamic chunk loading over file://
  const rawWebpack = '(()=>{r.tu=e=>e,r.p="/_next/",r.u=e=>"static/chunks/"+e+".js"})()';
  assert.equal(relativizeWebpackPublicPath(rawWebpack).includes('r.p="./_next/"'), true);

  // Outside TinyJS launcher, runtime detector and RPC adapters must cleanly report unavailable
  assert.equal(isTinyDesktopRuntime(), false);
  const openRes = await openMarkdownViaTinyDesktop();
  assert.equal(openRes.status, 'unavailable');
  const saveRes = await saveMarkdownViaTinyDesktop('# تست', 'test.md');
  assert.equal(saveRes.status, 'unavailable');
}

async function runAllContractVerifications(): Promise<void> {
  verifyBoundedLruCacheContracts();
  verifyPersianAndDigitDryContracts();
  verifyRtlMarkdownAndEngineContracts();
  verifyStatsAndSyncScrollContracts();
  await verifyFileValidationAndSyntaxHighlighterContracts();
  verifyViewTransitionContracts();
  await verifyTinyDesktopBridgeContracts();
}

void runAllContractVerifications();
