/**
 * @file utils/tinyDeltaPatcher.ts
 * @description Character/statement-level diff patcher and WebView2 hot-boot engine for the TinyJS
 * Windows desktop application. Reconstructs updated files by splicing only the modified lines,
 * statements, and characters onto local files and hot-swapping the active DOM/JS bundle.
 */

import {
  TinyCharDiffOp,
  TinyDeltaManifest,
  TinyPatchedFilesMap,
} from '@/types/tiny';
import { getTinyBridge } from '@/utils/tinyDesktopBridge';

/**
 * Normalizes a Next.js asset path into a stable logical slot identifier by stripping
 * the 16-hex-character build hash (e.g., `_next/static/chunks/app/page-33492bf8bf3ef926.js`
 * becomes `_next/static/chunks/app/page.js`).
 *
 * @param {string} relPath - Relative asset path inside `out/`.
 * @returns {string} Stable slot key across builds.
 */
export function normalizeDeltaSlotKey(relPath: string): string {
  return String(relPath ?? '')
    .replace(/^\/+/, '')
    .replace(/-[0-9a-f]{16}(\.[a-z0-9]+)$/i, '$1')
    .replace(/\.[0-9a-f]{16}(\.[a-z0-9]+)$/i, '$1');
}

/**
 * Applies an array of character/statement-level diff operations (`[offset, deleteCount, insertText]`)
 * onto a local base text string to reconstruct the updated target file without downloading unchanged text.
 *
 * @param {string} baseText - Existing local file text on the user's machine.
 * @param {readonly TinyCharDiffOp[]} ops - Ordered character-range edit operations.
 * @returns {string} Reconstructed target file content.
 */
export function applyCharDiffOps(
  baseText: string,
  ops: readonly TinyCharDiffOp[]
): string {
  if (!ops || ops.length === 0) {
    return baseText;
  }

  let out = '';
  let cursor = 0;

  for (const op of ops) {
    const offset = op[0];
    const deleteCount = op[1];
    const insertText = op[2];

    if (offset > cursor) {
      out += baseText.slice(cursor, offset);
    }

    out += insertText;
    cursor = offset + deleteCount;
  }

  if (cursor < baseText.length) {
    out += baseText.slice(cursor);
  }

  return out;
}

/**
 * Computes the SHA-256 hex digest of a UTF-8 string using the browser's native Web Crypto API.
 *
 * @param {string} text - Input string to hash.
 * @returns {Promise<string>} Lowercase hex SHA-256 hash.
 */
export async function computeTextSha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(digest));

  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Reads a local base file either from the already-patched `patchedFiles` map or directly
 * from the bundled desktop WebView (`./<relPath>`) with zero internet bandwidth.
 *
 * @param {string} relPath - Relative path to read locally.
 * @param {Readonly<Record<string, string>>} [patchedFiles] - Locally cached patched files.
 * @returns {Promise<string | null>} Local file text or null if not found.
 */
export async function readLocalAssetText(
  relPath: string,
  patchedFiles?: Readonly<TinyPatchedFilesMap>
): Promise<string | null> {
  const cleanRel = relPath.replace(/^\/+/, '');

  if (patchedFiles && cleanRel in patchedFiles) {
    return patchedFiles[cleanRel];
  }

  try {
    const res = await fetch(`./${cleanRel}`, { cache: 'no-store' });

    if (res.ok) {
      return await res.text();
    }
  } catch {
    // Local asset does not exist under this exact hash name
  }

  return null;
}

/**
 * Hot-boots the patched frontend bundle (`patchedFiles`) directly inside the active TinyJS
 * WebView2 window by converting modified CSS/JS slots into in-memory `<style>` and `Blob` URLs
 * and replacing the document in-place while preserving `window.tiny`.
 *
 * @param {TinyDeltaManifest} manifest - Target delta manifest being booted.
 * @param {Readonly<TinyPatchedFilesMap>} patchedFiles - Map of relative paths to patched file contents.
 * @returns {Promise<boolean>} True if the patched bundle was booted into the active window.
 */
export async function bootTinyDesktopPatchedBundle(
  manifest: TinyDeltaManifest,
  patchedFiles: Readonly<TinyPatchedFilesMap>
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  if (window.__TINY_BOOTED_DELTA_VERSION__ === manifest.version) {
    return false;
  }

  const fileKeys = Object.keys(patchedFiles);

  if (fileKeys.length === 0) {
    return false;
  }

  let html: string | null = patchedFiles['index.html'] ?? null;

  if (!html) {
    html = await readLocalAssetText('index.html');
  }

  if (!html) {
    return false;
  }

  const slotToContent = new Map<string, { relPath: string; content: string }>();

  for (const [relPath, content] of Object.entries(patchedFiles)) {
    slotToContent.set(normalizeDeltaSlotKey(relPath), { relPath, content });
  }

  // Inline any patched CSS stylesheets and keep font URLs pointing to ./_next/static/media/
  html = html.replace(
    /<link\s+[^>]*rel="stylesheet"[^>]*href="\.\/(_next\/static\/css\/[^"]+)"[^>]*\/?>/gi,
    (fullMatch, cssRelPath: string) => {
      const directCss =
        patchedFiles[cssRelPath] ??
        slotToContent.get(normalizeDeltaSlotKey(cssRelPath))?.content;

      if (!directCss) {
        return fullMatch;
      }

      const fixedCss = directCss.replace(
        /url\(\s*(['"]?)\.\.\/media\//g,
        'url($1./_next/static/media/'
      );

      return `<style data-delta-css="${cssRelPath}">${fixedCss}</style>`;
    }
  );

  // Convert any patched JS chunks into in-memory Blob URLs so the new JS executes immediately
  html = html.replace(
    /(src|href)="\.\/(_next\/static\/chunks\/[^"]+\.js)"/gi,
    (fullMatch, attr: string, jsRelPath: string) => {
      const directJs =
        patchedFiles[jsRelPath] ??
        slotToContent.get(normalizeDeltaSlotKey(jsRelPath))?.content;

      if (!directJs) {
        return fullMatch;
      }

      const blob = new Blob([directJs], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);

      return `${attr}="${blobUrl}"`;
    }
  );

  const bootMarkerScript = `<script>window.__TINY_BOOTED_DELTA_VERSION__=${JSON.stringify(
    manifest.version
  )};</script>`;

  html = html.replace('<head>', `<head>${bootMarkerScript}`);

  const savedTiny = getTinyBridge();
  window.__TINY_BOOTED_DELTA_VERSION__ = manifest.version;

  document.open();
  document.write(html);
  document.close();

  if (savedTiny && !window.tiny) {
    window.tiny = savedTiny;
  }

  return true;
}
