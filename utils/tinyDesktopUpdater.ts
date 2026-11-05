/**
 * @file utils/tinyDesktopUpdater.ts
 * @description Differential (Delta) Self-Updater for the TinyJS Windows Desktop App.
 * Compares content-addressed SHA-256 file hashes between the local installation and the
 * latest GitHub release/Pages manifest so only modified chunks (typically a few KB) are
 * downloaded and applied, saving >90% of user bandwidth.
 */

import {
  TinyDeltaManifest,
  TinyDeltaPatchFilePayload,
} from '@/types/tiny';
import {
  getTinyBridge,
  relativizeStaticExportCss,
  relativizeStaticExportHtml,
  relativizeWebpackPublicPath,
} from '@/utils/tinyDesktopBridge';

export interface TinyDeltaFileEntry {
  readonly relPath: string;
  readonly sha256: string;
  readonly size: number;
}

export interface TinyDeltaUpdatePlan {
  readonly available: boolean;
  readonly currentVersion: string;
  readonly latestVersion: string;
  readonly baseUrl: string;
  readonly changedFiles: readonly TinyDeltaFileEntry[];
  readonly unchangedCount: number;
  readonly totalDeltaBytes: number;
  readonly totalFullBytes: number;
  readonly remoteManifest: TinyDeltaManifest;
}

const REMOTE_MANIFEST_URLS: readonly string[] = [
  'https://kavehahangar051.github.io/Markdown-RTL-Viewer/delta-manifest.json',
  'https://raw.githubusercontent.com/KavehAhangar051/Markdown-RTL-Viewer/main/public/delta-manifest.json',
];

const LOCAL_DELTA_STORAGE_KEY = 'rtl-studio-delta-manifest-v1';

/**
 * Compares two semantic version strings (e.g., `'2.3.0'` vs `'2.2.0'`).
 *
 * @param {string} versionA - Candidate version string.
 * @param {string} versionB - Baseline version string.
 * @returns {number} `1` if A > B, `-1` if A < B, or `0` if equal.
 */
export function compareSemver(versionA: string, versionB: string): number {
  const cleanA = String(versionA ?? '')
    .trim()
    .replace(/^v/i, '')
    .split('-')[0]
    .split('.')
    .map((n) => Number.parseInt(n, 10) || 0);

  const cleanB = String(versionB ?? '')
    .trim()
    .replace(/^v/i, '')
    .split('-')[0]
    .split('.')
    .map((n) => Number.parseInt(n, 10) || 0);

  const maxLen = Math.max(cleanA.length, cleanB.length, 3);

  for (let i = 0; i < maxLen; i += 1) {
    const partA = cleanA[i] ?? 0;
    const partB = cleanB[i] ?? 0;

    if (partA > partB) return 1;

    if (partA < partB) return -1;
  }

  return 0;
}

/**
 * Formats byte counts into a compact human-readable label (e.g., `'42.4 KB'`).
 *
 * @param {number} bytes - Number of bytes.
 * @returns {string} Formatted byte size label.
 */
export function formatDeltaBytes(bytes: number): string {
  const safeBytes = Math.max(0, Number(bytes) || 0);

  if (safeBytes < 1024) {
    return `${safeBytes} B`;
  }

  const kb = safeBytes / 1024;

  if (kb < 1024) {
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  }

  const mb = kb / 1024;

  return `${mb.toFixed(2)} MB`;
}

/**
 * Pure function that computes the exact differential update plan between the locally
 * installed manifest and a remote GitHub manifest, queuing only files whose SHA-256 hash changed.
 *
 * @param {TinyDeltaManifest | null} localManifest - Currently installed manifest (or null if only version is known).
 * @param {TinyDeltaManifest} remoteManifest - Latest remote manifest from GitHub.
 * @param {string} fallbackLocalVersion - Version string used when localManifest is null.
 * @returns {TinyDeltaUpdatePlan} Computed differential update plan.
 */
export function computeDeltaUpdatePlan(
  localManifest: TinyDeltaManifest | null,
  remoteManifest: TinyDeltaManifest,
  fallbackLocalVersion = '2.2.0'
): TinyDeltaUpdatePlan {
  const currentVersion = localManifest?.version || fallbackLocalVersion;
  const latestVersion = remoteManifest.version;
  const isNewer = compareSemver(latestVersion, currentVersion) > 0;

  const localFiles = localManifest?.files ?? {};
  const remoteEntries = Object.entries(remoteManifest.files ?? {});

  const changedFiles: TinyDeltaFileEntry[] = [];
  let unchangedCount = 0;
  let totalDeltaBytes = 0;
  let totalFullBytes = 0;

  for (const [relPath, meta] of remoteEntries) {
    totalFullBytes += meta.size;
    const localEntry = localFiles[relPath];

    if (localEntry && localEntry.sha256 === meta.sha256) {
      unchangedCount += 1;
    } else {
      changedFiles.push({
        relPath,
        sha256: meta.sha256,
        size: meta.size,
      });
      totalDeltaBytes += meta.size;
    }
  }

  return {
    available: isNewer && changedFiles.length > 0,
    currentVersion,
    latestVersion,
    baseUrl: remoteManifest.baseUrl || 'https://kavehahangar051.github.io/Markdown-RTL-Viewer',
    changedFiles,
    unchangedCount,
    totalDeltaBytes,
    totalFullBytes,
    remoteManifest,
  };
}

/**
 * Loads the local delta manifest from the native TinyJS backend, localStorage cache, or bundled `./delta-manifest.json`.
 */
async function loadLocalDeltaManifest(): Promise<{
  manifest: TinyDeltaManifest | null;
  version: string;
}> {
  const tiny = getTinyBridge();
  let version = '2.2.0';

  if (tiny) {
    try {
      const state = await tiny.api.call('getDeltaState');

      if (state.ok) {
        version = state.currentVersion || version;

        if (state.manifest) {
          return { manifest: state.manifest, version };
        }
      }
    } catch {
      // Fallback to localStorage or bundled delta-manifest.json
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const cachedRaw = window.localStorage.getItem(LOCAL_DELTA_STORAGE_KEY);

      if (cachedRaw) {
        // SAFETY: Immediately guarded below for `parsed.version` and `parsed.files` shape before returning
        const parsed = JSON.parse(cachedRaw) as TinyDeltaManifest;

        if (parsed && parsed.version && parsed.files) {
          return { manifest: parsed, version: parsed.version };
        }
      }
    } catch {
      // Ignore storage parse errors
    }
  }

  try {
    const res = await fetch('./delta-manifest.json', { cache: 'no-store' });

    if (res.ok) {
      // SAFETY: Bundled delta-manifest.json is generated by scripts/generate-delta-manifest.mjs with TinyDeltaManifest schema
      const bundled = (await res.json()) as TinyDeltaManifest;

      return { manifest: bundled, version: bundled.version || version };
    }
  } catch {
    // Ignore when running in dev server without ./delta-manifest.json
  }

  return { manifest: null, version };
}

/**
 * Checks GitHub for a newer release manifest and computes the differential (delta) download plan.
 *
 * @returns {Promise<TinyDeltaUpdatePlan | null>} Delta update plan or null if offline/unavailable.
 */
export async function checkTinyDesktopDeltaUpdate(): Promise<TinyDeltaUpdatePlan | null> {
  if (!getTinyBridge()) {
    return null;
  }

  const { manifest: localManifest, version: currentVersion } = await loadLocalDeltaManifest();

  for (const url of REMOTE_MANIFEST_URLS) {
    try {
      const response = await fetch(`${url}?t=${Date.now()}`, {
        cache: 'no-store',
      });

      if (!response.ok) continue;

      // SAFETY: Immediately validated for `remoteManifest.version` and `remoteManifest.files` on the next line
      const remoteManifest = (await response.json()) as TinyDeltaManifest;

      if (!remoteManifest || !remoteManifest.version || !remoteManifest.files) {
        continue;
      }

      return computeDeltaUpdatePlan(localManifest, remoteManifest, currentVersion);
    } catch {
      // Try next mirror URL
    }
  }

  return null;
}

/**
 * Downloads ONLY the changed files in the delta plan, relativizes paths for `file://` WebView2,
 * and persists the differential patch via the native TinyJS backend.
 *
 * @param {TinyDeltaUpdatePlan} plan - Computed differential update plan.
 * @param {(completed: number, total: number) => void} [onProgress] - Progress callback.
 * @returns {Promise<boolean>} True when the delta update succeeded.
 */
export async function executeTinyDesktopDeltaUpdate(
  plan: TinyDeltaUpdatePlan,
  onProgress?: (completed: number, total: number) => void
): Promise<boolean> {
  const tiny = getTinyBridge();

  if (!tiny || !plan.available) {
    return false;
  }

  const total = plan.changedFiles.length;
  const downloadedPayloads: TinyDeltaPatchFilePayload[] = [];
  let completed = 0;

  try {
    for (const fileEntry of plan.changedFiles) {
      const cleanBase = plan.baseUrl.replace(/\/+$/, '');
      const cleanRel = fileEntry.relPath.replace(/^\/+/, '');
      const fileUrl = `${cleanBase}/${cleanRel}?v=${encodeURIComponent(plan.latestVersion)}`;

      const response = await fetch(fileUrl, { cache: 'no-store' });

      if (!response.ok) {
        return false;
      }

      let textContent = await response.text();

      if (cleanRel.endsWith('.html')) {
        textContent = relativizeStaticExportHtml(textContent);
      } else if (cleanRel.endsWith('.css')) {
        textContent = relativizeStaticExportCss(textContent);
      } else if (cleanRel.includes('webpack-') && cleanRel.endsWith('.js')) {
        textContent = relativizeWebpackPublicPath(textContent);
      }

      downloadedPayloads.push({
        relPath: cleanRel,
        content: textContent,
      });

      completed += 1;
      onProgress?.(completed, total);
    }

    const applyRes = await tiny.api.call('applyDeltaUpdate', {
      manifest: plan.remoteManifest,
      files: downloadedPayloads,
    });

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          LOCAL_DELTA_STORAGE_KEY,
          JSON.stringify(plan.remoteManifest)
        );
      } catch {
        // Ignore storage write errors
      }
    }

    return Boolean(applyRes.ok);
  } catch {
    return false;
  }
}
