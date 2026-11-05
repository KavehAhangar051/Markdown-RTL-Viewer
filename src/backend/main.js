/**
 * @file src/backend/main.js
 * @description Native TinyJS backend running on txiki.js (tjs global).
 * Provides zero-telemetry local filesystem access for reading/saving Markdown files,
 * cold-start file association handling ("Open With" on Windows/macOS/Linux),
 * and native desktop menu bar orchestration.
 */

const MAX_MARKDOWN_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.md', '.markdown', '.txt'];

const textDecoder = new TextDecoder('utf-8');
const textEncoder = new TextEncoder();

/** @type {string[]} */
const openedFilesQueue = [];

/**
 * Extracts the filename segment from a Windows or POSIX filesystem path.
 *
 * @param {string} rawPath - Full filesystem path.
 * @returns {string} Extracted basename.
 */
function extractFileName(rawPath) {
  const normalized = String(rawPath ?? '').replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);

  return parts.length > 0 ? parts[parts.length - 1] : 'document.md';
}

/**
 * Checks whether a path has an allowed Markdown/text extension.
 *
 * @param {string} rawPath - Candidate file path.
 * @returns {boolean} True when extension is allowed.
 */
function hasAllowedExtension(rawPath) {
  const lower = extractFileName(rawPath).toLowerCase();

  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Safely reads and validates a Markdown/text file from disk via txiki.js.
 *
 * @param {string} targetPath - Absolute path on disk.
 * @returns {Promise<{ ok: true, content: string, fileName: string, path: string } | { ok: false, error: 'invalid_type' | 'file_too_large' | 'read_error' }>}
 */
async function readValidatedMarkdownFile(targetPath) {
  const safePath = String(targetPath ?? '').trim();

  if (!safePath || !hasAllowedExtension(safePath)) {
    return { ok: false, error: 'invalid_type' };
  }

  try {
    const statInfo = await tjs.stat(safePath);

    if (!statInfo || statInfo.size > MAX_MARKDOWN_FILE_SIZE_BYTES) {
      return { ok: false, error: 'file_too_large' };
    }

    const bytes = await tjs.readFile(safePath);
    const content = textDecoder.decode(bytes);

    return {
      ok: true,
      content,
      fileName: extractFileName(safePath),
      path: safePath,
    };
  } catch {
    return { ok: false, error: 'read_error' };
  }
}

export const api = {
  /**
   * Reads a local Markdown or text file selected via native dialog or dropped onto the window.
   */
  readMarkdownFile: async ({ path }) => {
    return await readValidatedMarkdownFile(path);
  },

  /**
   * Writes UTF-8 Markdown content to the user-chosen path from the native Save dialog.
   */
  saveMarkdownFile: async ({ path, content }) => {
    const safePath = String(path ?? '').trim();

    if (!safePath) {
      return { ok: false, error: 'write_error' };
    }

    try {
      const encoded = textEncoder.encode(String(content ?? ''));
      await tjs.writeFile(safePath, encoded);

      return {
        ok: true,
        path: safePath,
        fileName: extractFileName(safePath),
      };
    } catch {
      return { ok: false, error: 'write_error' };
    }
  },

  /**
   * Drains files passed via OS "Open With" or command line at cold start or runtime.
   */
  takeOpenedFiles: async () => {
    const batch = openedFilesQueue.splice(0, openedFilesQueue.length);
    const loadedFiles = [];

    for (const filePath of batch) {
      const res = await readValidatedMarkdownFile(filePath);

      if (res.ok) {
        loadedFiles.push({
          content: res.content,
          fileName: res.fileName,
          path: res.path,
        });
      }
    }

    return loadedFiles;
  },

  /**
   * Returns desktop runtime metadata for diagnostics and UI display.
   */
  getDesktopInfo: async (_params, app) => {
    const info = await app.info();
    const arch = await app.system.architecture();
    const os = app.system.os();

    return {
      os,
      arch,
      version: info.version,
      tinyjs: info.tinyjs,
      runtime: info.runtime,
    };
  },
};

/**
 * Initializes native Windows/macOS/Linux application menu bar and minimum window dimensions.
 *
 * @param {object} app - TinyJS backend application handle.
 */
export async function init(app) {
  try {
    await app.win.setMinSize(720, 520);
    await app.win.setSize(1920, 1080);
  } catch {
    // Ignore on platforms/sessions that restrict window sizing
  }

  try {
    await app.menu.set([
      {
        title: 'File',
        items: [
          { id: 'file-open', label: 'Open Markdown…', key: 'o' },
          { id: 'file-save', label: 'Save Markdown As…', key: 's' },
          { separator: true },
          { id: 'file-sample', label: 'Load Sample Document' },
          { id: 'file-clear', label: 'Clear Editor' },
        ],
      },
      {
        role: 'edit',
        items: [{ role: 'standard' }],
      },
      {
        title: 'View',
        items: [
          { id: 'view-split', label: 'Split View', key: '1' },
          { id: 'view-editor', label: 'Editor View', key: '2' },
          { id: 'view-preview', label: 'Preview View', key: '3' },
          { separator: true },
          { id: 'view-focus', label: 'Toggle Focus Mode', key: 'f' },
          { id: 'view-theme', label: 'Toggle Dark / Light Theme', key: 't' },
          { id: 'view-lang', label: 'Switch Language (FA / EN)', key: 'l' },
        ],
      },
      {
        role: 'help',
        items: [
          { id: 'help-showcase', label: 'Studio Overview & Showcase' },
        ],
      },
    ]);

    if (app.system.isWindows()) {
      await app.win.setChrome({
        frame: false,
        menu: false,
      });
    }
  } catch {
    // Menu bar and chrome setup are best-effort across window managers
  }
}

/**
 * Forwards native menu bar selections to the frontend studio window.
 *
 * @param {string} id - Selected menu item identifier.
 * @param {object} app - TinyJS backend application handle.
 */
export function onMenu(id, app) {
  app.push('studio-menu-command', { id });
}

/**
 * Handles files opened with the desktop executable via Windows Explorer "Open With",
 * Dock drop, or CLI arguments.
 *
 * @param {string[]} paths - Array of absolute filesystem paths.
 * @param {object} app - TinyJS backend application handle.
 */
export function onOpenFiles(paths, app) {
  if (!Array.isArray(paths) || paths.length === 0) {
    return;
  }

  for (const p of paths) {
    if (p && hasAllowedExtension(p)) {
      openedFilesQueue.push(p);
    }
  }

  if (openedFilesQueue.length > 0) {
    app.push('files-opened', { count: openedFilesQueue.length });
  }
}

/**
 * Handles custom `rtlmarkdown://` deep links safely.
 *
 * @param {string} rawUrl - Deep link URL string.
 * @param {object} app - TinyJS backend application handle.
 */
export function onOpenUrl(rawUrl, app) {
  try {
    const parsed = new URL(String(rawUrl ?? ''));

    if (parsed.protocol !== 'rtlmarkdown:') {
      return;
    }

    const action = parsed.hostname || parsed.pathname.replace(/^\/+/, '');
    app.push('deep-link-opened', {
      action,
      mode: parsed.searchParams.get('mode'),
      lang: parsed.searchParams.get('lang'),
    });
  } catch {
    // Ignore malformed deep link URLs
  }
}
