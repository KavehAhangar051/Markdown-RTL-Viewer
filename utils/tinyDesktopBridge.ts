/**
 * @file utils/tinyDesktopBridge.ts
 * @description Thin platform adapter and pure asset relativizers for the TinyJS native desktop app
 * (Windows WebView2, macOS WKWebView, Linux WebKitGTK).
 * Follows ADR-0005 (Deep Domain Seam) by isolating `window.tiny` RPC calls behind explicit
 * discriminated-union outcomes while keeping browser fallback paths 100% intact.
 */

import '@/types/tiny';
import { TinyBridge, TinyOpenedFileEntry } from '@/types/tiny';
import { SUPPORTED_UPLOAD_EXTENSIONS } from '@/constants/domain';

export type TinyDesktopOpenOutcome =
  | { readonly status: 'ok'; readonly content: string; readonly fileName: string; readonly path: string }
  | { readonly status: 'cancelled' }
  | { readonly status: 'invalid_type' }
  | { readonly status: 'file_too_large' }
  | { readonly status: 'read_error' }
  | { readonly status: 'unavailable' };

export type TinyDesktopSaveOutcome =
  | { readonly status: 'ok'; readonly fileName: string; readonly path: string }
  | { readonly status: 'cancelled' }
  | { readonly status: 'write_error' }
  | { readonly status: 'unavailable' };

const TINY_ALLOWED_FILE_TYPES: readonly string[] = SUPPORTED_UPLOAD_EXTENSIONS.map((ext) =>
  ext.replace(/^\./, '')
);

/**
 * Returns the active `window.tiny` bridge when running inside the TinyJS desktop shell, or null in web browsers.
 *
 * @returns {TinyBridge | null} The TinyJS bridge instance or null.
 */
export function getTinyBridge(): TinyBridge | null {
  if (typeof window === 'undefined' || typeof window.tiny === 'undefined') {
    return null;
  }

  return window.tiny ?? null;
}

/**
 * Detects whether the application is currently executing inside the TinyJS native desktop runtime.
 *
 * @returns {boolean} True when `window.tiny` is injected by the TinyJS launcher.
 */
export function isTinyDesktopRuntime(): boolean {
  return getTinyBridge() !== null;
}

/**
 * Extracts the basename from a Windows (`C:\docs\note.md`) or POSIX (`/home/user/note.md`) path.
 *
 * @param {string} rawPath - Full filesystem path.
 * @returns {string} Extracted filename or `'document.md'` fallback.
 */
export function extractFileNameFromPath(rawPath: string): string {
  const normalized = (rawPath ?? '').trim().replace(/\\/g, '/');
  const segments = normalized.split('/').filter(Boolean);

  return segments.length > 0 ? segments[segments.length - 1] : 'document.md';
}

/**
 * Pure transformer that converts root-relative asset paths (`/_next/`, `/favicon.ico`, `/icon*`)
 * in exported Next.js HTML into relative paths (`./_next/`, `./favicon.ico`) so the bundle
 * loads cleanly over `file://` inside TinyJS's native Windows WebView2 launcher.
 *
 * @param {string} html - Raw HTML string emitted by `next build` static export.
 * @returns {string} Relativized HTML suitable for `file://` execution.
 */
export function relativizeStaticExportHtml(html: string): string {
  if (!html) {
    return '';
  }

  return html
    .replace(
      /(href|src)="\/(_next\/|favicon\.ico|icon|apple-|manifest\.webmanifest)/g,
      '$1="./$2'
    )
    .replace(/"\/_next\/static\//g, '"./_next/static/')
    .replace(/\\"\/_next\/static\//g, '\\"./_next/static/')
    .replace(
      /\\"href\\":\\"\/(favicon\.ico|icon|apple-|manifest\.webmanifest)/g,
      '\\"href\\":\\"./$1'
    );
}

/**
 * Pure transformer that rewrites root-relative font and media URLs inside Next.js static CSS
 * (`url(/_next/static/media/...)` -> `url(../media/...)`) for `file://` compatibility.
 *
 * @param {string} css - Raw CSS content from `out/_next/static/css/*.css`.
 * @returns {string} Relativized CSS content.
 */
export function relativizeStaticExportCss(css: string): string {
  if (!css) {
    return '';
  }

  return css.replace(/url\(\s*(['"]?)\/_next\/static\/media\//g, 'url($1../media/');
}

/**
 * Pure transformer that updates Webpack's runtime publicPath (`r.p="/_next/"`) to `./_next/`
 * so lazy-loaded dynamic chunks resolve relative to `index.html` over `file://`.
 *
 * @param {string} webpackRuntimeJs - Raw JS from `out/_next/static/chunks/webpack-*.js`.
 * @returns {string} Updated Webpack runtime JS.
 */
export function relativizeWebpackPublicPath(webpackRuntimeJs: string): string {
  if (!webpackRuntimeJs) {
    return '';
  }

  return webpackRuntimeJs.replace(/\.p="\/_next\/"/g, '.p="./_next/"');
}

/**
 * Reads a specific filesystem path through the TinyJS txiki.js backend.
 *
 * @param {string} path - Absolute file path on disk.
 * @returns {Promise<TinyDesktopOpenOutcome>} Validated file content or failure status.
 */
export async function readMarkdownPathViaTinyDesktop(
  path: string
): Promise<TinyDesktopOpenOutcome> {
  const tiny = getTinyBridge();

  if (!tiny) {
    return { status: 'unavailable' };
  }

  try {
    const response = await tiny.api.call('readMarkdownFile', { path });

    if (!response.ok) {
      return { status: response.error };
    }

    return {
      status: 'ok',
      content: response.content,
      fileName: response.fileName || extractFileNameFromPath(path),
      path: response.path,
    };
  } catch {
    return { status: 'read_error' };
  }
}

/**
 * Opens the native OS file picker (Windows Common Item Dialog / macOS NSOpenPanel / GTK FileChooser)
 * and reads the selected Markdown document via the TinyJS backend.
 *
 * @returns {Promise<TinyDesktopOpenOutcome>} Selected file payload or cancellation/error status.
 */
export async function openMarkdownViaTinyDesktop(): Promise<TinyDesktopOpenOutcome> {
  const tiny = getTinyBridge();

  if (!tiny) {
    return { status: 'unavailable' };
  }

  try {
    const chosenPath = await tiny.dialog.openFile({ types: TINY_ALLOWED_FILE_TYPES });

    if (chosenPath === null) {
      return { status: 'cancelled' };
    }

    return await readMarkdownPathViaTinyDesktop(chosenPath);
  } catch {
    return { status: 'read_error' };
  }
}

/**
 * Opens the native OS Save As dialog and writes the exported RTL Markdown document directly to disk.
 *
 * @param {string} content - Processed Markdown string to save.
 * @param {string} suggestedFilename - Default filename pre-filled in the native save dialog.
 * @returns {Promise<TinyDesktopSaveOutcome>} Save outcome with written filename and path.
 */
export async function saveMarkdownViaTinyDesktop(
  content: string,
  suggestedFilename: string
): Promise<TinyDesktopSaveOutcome> {
  const tiny = getTinyBridge();

  if (!tiny) {
    return { status: 'unavailable' };
  }

  const cleanName = extractFileNameFromPath(suggestedFilename || 'rtl-document.md');

  try {
    const targetPath = await tiny.dialog.saveFile({
      types: ['md', 'txt'],
      name: cleanName,
    });

    if (targetPath === null) {
      return { status: 'cancelled' };
    }

    const result = await tiny.api.call('saveMarkdownFile', {
      path: targetPath,
      content,
    });

    if (!result.ok) {
      return { status: 'write_error' };
    }

    return {
      status: 'ok',
      fileName: result.fileName || extractFileNameFromPath(targetPath),
      path: result.path,
    };
  } catch {
    return { status: 'write_error' };
  }
}

/**
 * Drains any Markdown files passed to the desktop app at cold start or via "Open With".
 *
 * @returns {Promise<readonly TinyOpenedFileEntry[]>} Array of opened files.
 */
export async function drainTinyOpenedFiles(): Promise<readonly TinyOpenedFileEntry[]> {
  const tiny = getTinyBridge();

  if (!tiny) {
    return [];
  }

  try {
    return await tiny.api.call('takeOpenedFiles');
  } catch {
    return [];
  }
}

/**
 * Synchronizes the native desktop window title bar with the active Markdown document title.
 *
 * @param {string} documentTitle - Extracted title of the current Markdown document.
 * @param {string} brandTitle - Localized studio brand title.
 */
export async function syncTinyWindowTitle(
  documentTitle: string,
  brandTitle: string
): Promise<void> {
  const tiny = getTinyBridge();

  if (!tiny) {
    return;
  }

  const trimmedDoc = (documentTitle ?? '').trim();
  const nextTitle = trimmedDoc ? `${trimmedDoc} — ${brandTitle}` : brandTitle;

  try {
    await tiny.win.setTitle(nextTitle);
  } catch {
    // Ignore title bar sync errors
  }
}

/**
 * Minimizes the native TinyJS desktop window.
 */
export async function minimizeTinyWindow(): Promise<void> {
  const tiny = getTinyBridge();

  if (!tiny) {
    return;
  }

  try {
    await tiny.win.minimize();
  } catch {
    // Ignore window minimize errors
  }
}

/**
 * Toggles maximize / restore (zoom) on the native TinyJS desktop window.
 */
export async function toggleMaximizeTinyWindow(): Promise<void> {
  const tiny = getTinyBridge();

  if (!tiny) {
    return;
  }

  try {
    await tiny.win.zoom();
  } catch {
    // Ignore window zoom errors
  }
}

/**
 * Closes the native TinyJS desktop window.
 */
export async function closeTinyWindow(): Promise<void> {
  const tiny = getTinyBridge();

  if (!tiny) {
    return;
  }

  try {
    await tiny.win.close();
  } catch {
    // Ignore window close errors
  }
}
