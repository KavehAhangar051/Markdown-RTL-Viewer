/**
 * @file utils/tinyDesktopUpdater.ts
 * @description Character & Statement-Level Differential (Delta) Self-Updater for the TinyJS
 * Windows Desktop App. Downloads ONLY modified lines, statements, and characters
 * (`delta-patches/*.patch.json`), splices them onto the local files on disk, and immediately
 * hot-boots the updated bundle inside the active WebView2 window.
 */

import {
  TinyDeltaManifest,
  TinyDeltaPatchFilePayload,
  TinyPatchedFilesMap,
  TinySlotPatchDocument,
} from '@/types/tiny';
import {
  getTinyBridge,
  relativizeStaticExportCss,
  relativizeStaticExportHtml,
  relativizeWebpackPublicPath,
} from '@/utils/tinyDesktopBridge';
import {
  applyCharDiffOps,
  bootTinyDesktopPatchedBundle,
  computeTextSha256,
  normalizeDeltaSlotKey,
  readLocalAssetText,
} from '@/utils/tinyDeltaPatcher';

export interface TinyDeltaFileEntry {
  readonly relPath: string;
  readonly slot: string;
  readonly localBaseRelPath: string;
  readonly sha256: string;
  readonly size: number;
  readonly patchFile?: string;
  readonly fullFile?: string;
  readonly patchSize: number;
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
  'https://raw.githubusercontent.com/KavehAhangar051/Markdown-RTL-Viewer/main/public/delta-manifest.json',
  'https://kavehahangar051.github.io/Markdown-RTL-Viewer/delta-manifest.json',
];

const DEFAULT_RAW_BASE_URL =
  'https://raw.githubusercontent.com/KavehAhangar051/Markdown-RTL-Viewer/main/public';

const LOCAL_DELTA_STORAGE_KEY = 'rtl-studio-delta-manifest-v1';

/**
 * Compares two semantic version strings (e.g., `'2.3.0'` vs `'2.2.3'`).
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
 * Formats byte counts into a compact human-readable label (e.g., `'1.4 KB'`).
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
 * Pure function that computes the character/statement-level differential update plan between
 * the locally installed manifest and the remote GitHub manifest.
 *
 * @param {TinyDeltaManifest | null} localManifest - Currently installed manifest.
 * @param {TinyDeltaManifest} remoteManifest - Latest remote manifest from GitHub.
 * @param {string} fallbackLocalVersion - Version string used when localManifest is null.
 * @returns {TinyDeltaUpdatePlan} Computed differential update plan.
 */
export function computeDeltaUpdatePlan(
  localManifest: TinyDeltaManifest | null,
  remoteManifest: TinyDeltaManifest,
  fallbackLocalVersion = '2.3.0'
): TinyDeltaUpdatePlan {
  const currentVersion = localManifest?.version || fallbackLocalVersion;
  const latestVersion = remoteManifest.version;
  const isNewer = compareSemver(latestVersion, currentVersion) > 0;

  const localFiles = localManifest?.files ?? {};
  const localSlotMap = new Map<string, { relPath: string; sha256: string; size: number }>();

  for (const [localRel, localMeta] of Object.entries(localFiles)) {
    localSlotMap.set(normalizeDeltaSlotKey(localRel), {
      relPath: localRel,
      sha256: localMeta.sha256,
      size: localMeta.size,
    });
  }

  const remoteEntries = Object.entries(remoteManifest.files ?? {});
  const remotePatches = remoteManifest.patches ?? {};

  const changedFiles: TinyDeltaFileEntry[] = [];
  let unchangedCount = 0;
  let totalDeltaBytes = 0;
  let totalFullBytes = 0;

  for (const [relPath, meta] of remoteEntries) {
    totalFullBytes += meta.size;
    const slot = normalizeDeltaSlotKey(relPath);

    const localEntry = localFiles[relPath]
      ? { relPath, ...localFiles[relPath] }
      : localSlotMap.get(slot);

    if (localEntry && localEntry.sha256 === meta.sha256) {
      unchangedCount += 1;
    } else {
      const slotPatch = remotePatches[slot];

      const effectivePatchSize = slotPatch
        ? Math.min(slotPatch.patchSize, meta.size)
        : meta.size;

      changedFiles.push({
        relPath,
        slot,
        localBaseRelPath: localEntry?.relPath || slotPatch?.baseRelPath || relPath,
        sha256: meta.sha256,
        size: meta.size,
        patchFile: slotPatch?.patchFile,
        fullFile: slotPatch?.fullFile,
        patchSize: effectivePatchSize,
      });

      totalDeltaBytes += effectivePatchSize;
    }
  }

  return {
    available: isNewer && changedFiles.length > 0,
    currentVersion,
    latestVersion,
    baseUrl: remoteManifest.baseUrl || DEFAULT_RAW_BASE_URL,
    changedFiles,
    unchangedCount,
    totalDeltaBytes,
    totalFullBytes,
    remoteManifest,
  };
}

/**
 * Loads the local delta manifest from the native TinyJS backend (and hot-boots any cached
 * delta update on cold start), falling back to localStorage or bundled `./delta-manifest.json`.
 */
async function loadLocalDeltaManifest(): Promise<{
  manifest: TinyDeltaManifest | null;
  version: string;
}> {
  const tiny = getTinyBridge();
  let version = '2.3.0';

  if (tiny) {
    try {
      const state = await tiny.api.call('getDeltaState');

      if (state.ok) {
        version = state.currentVersion || version;

        if (state.manifest) {
          if (
            state.patchedFiles &&
            Object.keys(state.patchedFiles).length > 0 &&
            typeof window !== 'undefined' &&
            window.__TINY_BOOTED_DELTA_VERSION__ !== state.manifest.version
          ) {
            await bootTinyDesktopPatchedBundle(state.manifest, state.patchedFiles);
          }

          return { manifest: state.manifest, version };
        }
      }
    } catch {
      // Fallback to localStorage or bundled delta-manifest.json
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

  return { manifest: null, version };
}

/**
 * Checks GitHub for a newer release manifest and computes the character-level differential download plan.
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
 * Downloads ONLY the character/statement-level diff patches (`*.patch.json`), reconstructs
 * the modified files from local disk assets, saves them to the native TinyJS delta cache,
 * and immediately hot-boots the updated application code inside the active window.
 *
 * @param {TinyDeltaUpdatePlan} plan - Computed differential update plan.
 * @param {(completed: number, total: number) => void} [onProgress] - Progress callback.
 * @returns {Promise<boolean>} True when the delta update succeeded and booted.
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
    const priorState = await tiny.api.call('getDeltaState');

    const mergedPatchedFiles: TinyPatchedFilesMap = {
      ...priorState.patchedFiles,
    };

    const cleanBase = plan.baseUrl.replace(/\/+$/, '');

    for (const fileEntry of plan.changedFiles) {
      const cleanRel = fileEntry.relPath.replace(/^\/+/, '');
      let reconstructedText: string | null = null;

      // 1. Primary path: Download ONLY character/statement-level diff hunks (.patch.json)
      if (fileEntry.patchFile) {
        try {
          const patchUrl = `${cleanBase}/${fileEntry.patchFile}?v=${encodeURIComponent(
            plan.latestVersion
          )}`;

          const patchRes = await fetch(patchUrl, { cache: 'no-store' });

          if (patchRes.ok) {
            // SAFETY: Validated below for Array.isArray(patchDoc.ops) before applying character ops
            const patchDoc = (await patchRes.json()) as TinySlotPatchDocument;

            if (patchDoc && Array.isArray(patchDoc.ops)) {
              const localBase =
                (await readLocalAssetText(fileEntry.localBaseRelPath, mergedPatchedFiles)) ??
                (await readLocalAssetText(patchDoc.baseRelPath, mergedPatchedFiles));

              if (localBase !== null) {
                const candidate = applyCharDiffOps(localBase, patchDoc.ops);
                const candidateSha = await computeTextSha256(candidate);

                if (candidateSha === fileEntry.sha256) {
                  reconstructedText = candidate;
                }
              }
            }
          }
        } catch {
          // Fallback to full slot reconstruction below if jumping across incompatible older base versions
        }
      }

      // 2. Fallback path for multi-version jumps where local base hash predates the patch baseline
      if (reconstructedText === null) {
        const fallbackRel = fileEntry.fullFile || cleanRel;

        const fallbackUrl = `${cleanBase}/${fallbackRel}?v=${encodeURIComponent(
          plan.latestVersion
        )}`;

        const fullRes = await fetch(fallbackUrl, { cache: 'no-store' });

        if (!fullRes.ok) {
          return false;
        }

        reconstructedText = await fullRes.text();
      }

      if (cleanRel.endsWith('.html')) {
        reconstructedText = relativizeStaticExportHtml(reconstructedText);
      } else if (cleanRel.endsWith('.css')) {
        reconstructedText = relativizeStaticExportCss(reconstructedText);
      } else if (cleanRel.includes('webpack-') && cleanRel.endsWith('.js')) {
        reconstructedText = relativizeWebpackPublicPath(reconstructedText);
      }

      downloadedPayloads.push({
        relPath: cleanRel,
        content: reconstructedText,
      });
      mergedPatchedFiles[cleanRel] = reconstructedText;

      completed += 1;
      onProgress?.(completed, total);
    }

    const applyRes = await tiny.api.call('applyDeltaUpdate', {
      manifest: plan.remoteManifest,
      files: downloadedPayloads,
    });

    if (!applyRes.ok) {
      return false;
    }

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

    await bootTinyDesktopPatchedBundle(plan.remoteManifest, mergedPatchedFiles);

    return true;
  } catch {
    return false;
  }
}
