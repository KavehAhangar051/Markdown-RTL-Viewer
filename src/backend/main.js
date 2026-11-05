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

// Configure WebView2 Chromium engine with game-grade DirectComposition & GPU rasterization flags
try {
  const gpuFlags = [
    '--enable-gpu-rasterization',
    '--enable-zero-copy',
    '--ignore-gpu-blocklist',
    '--enable-hardware-overlays',
    '--enable-features=UseSkiaRenderer,CanvasOopRasterization,DirectCompositionUseNV12DecodeSwapChain',
    '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling',
  ].join(' ');
  tjs.setenv('WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS', gpuFlags);
} catch {
  // Ignore if environment variables are read-only in restricted sandbox
}

/**
 * Resolves the user-writable local directory for storing differential (delta) updates on Windows/macOS/Linux.
 *
 * @returns {string} Path to delta cache directory.
 */
function getDeltaCacheDir() {
  try {
    const localAppData = tjs.getenv('LOCALAPPDATA') || tjs.getenv('APPDATA') || tjs.getenv('HOME') || '.';

    return `${localAppData.replace(/\\/g, '/')}/rtl-markdown-studio/delta-cache`;
  } catch {
    return './delta-cache';
  }
}

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

  /**
   * Reads the locally applied differential (delta) update state and patched file contents from disk
   * so the desktop app boots and executes the patched code without re-downloading unchanged files.
   */
  getDeltaState: async (_params, app) => {
    const info = await app.info();
    const exeVersion = String(info.version || '2.3.0');
    const cacheDir = getDeltaCacheDir();
    const manifestPath = `${cacheDir}/delta-manifest.json`;

    try {
      const bytes = await tjs.readFile(manifestPath);
      const manifest = JSON.parse(textDecoder.decode(bytes));
      const cachedVersion = String(manifest.version || exeVersion);

      const parseParts = (v) =>
        String(v ?? '')
          .replace(/^v/i, '')
          .split('-')[0]
          .split('.')
          .map((n) => Number.parseInt(n, 10) || 0);

      const cParts = parseParts(cachedVersion);
      const eParts = parseParts(exeVersion);
      let isCacheNewer = false;

      for (let i = 0; i < 3; i++) {
        if ((cParts[i] || 0) > (eParts[i] || 0)) {
          isCacheNewer = true;
          break;
        }
        if ((cParts[i] || 0) < (eParts[i] || 0)) {
          break;
        }
      }

      if (!isCacheNewer) {
        return {
          ok: true,
          currentVersion: exeVersion,
          exeVersion,
          manifest: null,
        };
      }

      const patchedFiles = {};
      const fileKeys = Object.keys(manifest.files || {});

      for (const relPath of fileKeys) {
        try {
          const fileBytes = await tjs.readFile(`${cacheDir}/files/${relPath}`);
          patchedFiles[relPath] = textDecoder.decode(fileBytes);
        } catch {
          // Only files that were patched exist in delta-cache/files/
        }
      }

      return {
        ok: true,
        currentVersion: cachedVersion,
        exeVersion,
        manifest,
        patchedFiles,
      };
    } catch {
      return {
        ok: true,
        currentVersion: exeVersion,
        exeVersion,
        manifest: null,
      };
    }
  },

  /**
   * Writes only the modified (delta) files downloaded from GitHub into the local delta cache
   * and updates the local `delta-manifest.json`.
   */
  applyDeltaUpdate: async ({ manifest, files }) => {
    if (!manifest || !manifest.version || !Array.isArray(files)) {
      return { ok: false, error: 'invalid_payload' };
    }

    const cacheDir = getDeltaCacheDir();

    try {
      await tjs.makeDir(`${cacheDir}/files`, { recursive: true });

      for (const item of files) {
        const cleanRel = String(item.relPath ?? '')
          .replace(/\\/g, '/')
          .replace(/^\/+/, '')
          .replace(/\.\./g, '');

        if (!cleanRel) continue;

        const targetFile = `${cacheDir}/files/${cleanRel}`;
        const lastSlash = targetFile.lastIndexOf('/');

        if (lastSlash > 0) {
          await tjs.makeDir(targetFile.slice(0, lastSlash), { recursive: true });
        }

        await tjs.writeFile(targetFile, textEncoder.encode(String(item.content ?? '')));
      }

      await tjs.writeFile(
        `${cacheDir}/delta-manifest.json`,
        textEncoder.encode(JSON.stringify(manifest, null, 2))
      );

      return {
        ok: true,
        version: String(manifest.version),
        updatedCount: files.length,
      };
    } catch {
      return { ok: false, error: 'write_failed' };
    }
  },
};

/**
 * Initializes native Windows/macOS/Linux application menu bar, 1920x1080 default resolution,
 * and Windows High-Performance GPU & AboveNormal process priority scheduling.
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

      // Elevate Windows process priority to AboveNormal and set DirectX High-Performance GPU preference (GpuPreference=2)
      try {
        tjs.spawn(
          [
            'powershell.exe',
            '-WindowStyle',
            'Hidden',
            '-NoProfile',
            '-NonInteractive',
            '-Command',
            "Get-Process -Name 'rtl-markdown-studio','msedgewebview2' -ErrorAction SilentlyContinue | ForEach-Object { $_.PriorityClass = 'AboveNormal' }",
          ],
          { stdin: 'ignore', stdout: 'ignore', stderr: 'ignore' }
        );
      } catch {
        // Ignore if PowerShell process priority boost is restricted
      }
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
