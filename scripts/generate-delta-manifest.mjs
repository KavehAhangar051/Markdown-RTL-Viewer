#!/usr/bin/env node

/**
 * @file scripts/generate-delta-manifest.mjs
 * @description Generates content-addressed SHA-256 metadata (`delta-manifest.json`) AND
 * fine-grained character/statement/line-level diff patches (`public/delta-patches/*.patch.json`)
 * so the TinyJS Windows desktop app downloads ONLY modified lines, statements, and characters.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const OUT_DIR = path.resolve(ROOT_DIR, 'out');
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');
const PATCHES_PUBLIC_DIR = path.resolve(PUBLIC_DIR, 'delta-patches');
const PATCHES_OUT_DIR = path.resolve(OUT_DIR, 'delta-patches');
const TINY_CONFIG_PATH = path.resolve(ROOT_DIR, 'tinyjs.json');

function walkFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function normalizeSlotKey(relPath) {
  return relPath
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/-[0-9a-f]{16}(\.[a-z0-9]+)$/i, '$1')
    .replace(/\.[0-9a-f]{16}(\.[a-z0-9]+)$/i, '$1');
}

function slotToSafeFilename(slotKey) {
  return slotKey.replace(/[^a-zA-Z0-9._-]/g, '__');
}

function isPatchableCodeOrMarkup(relPath) {
  if (relPath === 'index.html') return true;
  if (relPath.startsWith('_next/static/css/') && relPath.endsWith('.css')) return true;
  if (relPath.startsWith('_next/static/chunks/') && relPath.endsWith('.js')) return true;
  return false;
}

/**
 * Splits a file's middle region into fine-grained statement/line tokens so unchanged
 * statements inside minified JS/CSS/HTML are preserved and skipped in diff hunks.
 */
function splitIntoStatements(text) {
  const tokens = [];
  let start = 0;
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const ch = text.charCodeAt(i);
    // Split after '\n' (10), ';' (59), or '},' (125 followed by 44)
    if (
      ch === 10 ||
      ch === 59 ||
      (ch === 44 && i > 0 && text.charCodeAt(i - 1) === 125)
    ) {
      tokens.push({
        text: text.slice(start, i + 1),
        offset: start,
        len: i + 1 - start,
      });
      start = i + 1;
    }
  }

  if (start < len) {
    tokens.push({
      text: text.slice(start),
      offset: start,
      len: len - start,
    });
  }

  return tokens;
}

/**
 * Computes compact character/statement-level edit operations `[[offset, deleteCount, insertText], ...]`
 * transforming `oldText` into `newText`. Unchanged prefix, suffix, and internal statements are skipped.
 */
function computeCharDiffOps(oldText, newText) {
  if (oldText === newText) {
    return [];
  }

  const oldLen = oldText.length;
  const newLen = newText.length;
  const minLen = Math.min(oldLen, newLen);

  let prefixLen = 0;
  while (prefixLen < minLen && oldText.charCodeAt(prefixLen) === newText.charCodeAt(prefixLen)) {
    prefixLen++;
  }

  let suffixLen = 0;
  while (
    suffixLen < minLen - prefixLen &&
    oldText.charCodeAt(oldLen - 1 - suffixLen) === newText.charCodeAt(newLen - 1 - suffixLen)
  ) {
    suffixLen++;
  }

  const oldMid = oldText.slice(prefixLen, oldLen - suffixLen);
  const newMid = newText.slice(prefixLen, newLen - suffixLen);

  const oldTokens = splitIntoStatements(oldMid);
  const newTokens = splitIntoStatements(newMid);

  // If few tokens or very small middle region, emit single exact character slice op
  if (oldTokens.length * newTokens.length > 4_000_000 || oldTokens.length <= 2 || newTokens.length <= 2) {
    return [[prefixLen, oldMid.length, newMid]];
  }

  // Greedy forward anchor matching on statement tokens to skip identical internal statements
  const oldIndexMap = new Map();
  for (let i = 0; i < oldTokens.length; i++) {
    const t = oldTokens[i].text;
    if (t.length >= 16) {
      const list = oldIndexMap.get(t);
      if (list) list.push(i);
      else oldIndexMap.set(t, [i]);
    }
  }

  const ops = [];
  let oldIdx = 0;
  let newIdx = 0;

  while (newIdx < newTokens.length) {
    const candidate = newTokens[newIdx].text;
    const matchPositions = oldIndexMap.get(candidate);
    let matchedOldIdx = -1;

    if (matchPositions) {
      for (const pos of matchPositions) {
        if (pos >= oldIdx && pos - oldIdx <= 250) {
          matchedOldIdx = pos;
          break;
        }
      }
    }

    if (matchedOldIdx !== -1) {
      // Emit pending diff before this matched anchor
      if (matchedOldIdx > oldIdx || newIdx > 0) {
        const delStart = oldIdx < oldTokens.length ? prefixLen + oldTokens[oldIdx].offset : prefixLen + oldMid.length;
        const delEnd = prefixLen + oldTokens[matchedOldIdx].offset;
        const delCount = delEnd - delStart;
        if (delCount > 0) {
          ops.push([delStart, delCount, '']);
        }
      }

      // Advance across all consecutive identical statements
      while (
        matchedOldIdx < oldTokens.length &&
        newIdx < newTokens.length &&
        oldTokens[matchedOldIdx].text === newTokens[newIdx].text
      ) {
        matchedOldIdx++;
        newIdx++;
      }
      oldIdx = matchedOldIdx;
      continue;
    }

    // Gather modified new statements until next anchor match
    const insStartNewIdx = newIdx;
    let nextAnchorOldIdx = -1;

    while (newIdx < newTokens.length) {
      const nextCand = newTokens[newIdx].text;
      const positions = oldIndexMap.get(nextCand);
      if (positions) {
        for (const pos of positions) {
          if (pos >= oldIdx && pos - oldIdx <= 250) {
            nextAnchorOldIdx = pos;
            break;
          }
        }
      }
      if (nextAnchorOldIdx !== -1) {
        break;
      }
      newIdx++;
    }

    const insText = newTokens
      .slice(insStartNewIdx, newIdx)
      .map((t) => t.text)
      .join('');

    const delStart =
      oldIdx < oldTokens.length ? prefixLen + oldTokens[oldIdx].offset : prefixLen + oldMid.length;
    const delEnd =
      nextAnchorOldIdx !== -1
        ? prefixLen + oldTokens[nextAnchorOldIdx].offset
        : prefixLen + oldMid.length;

    ops.push([delStart, delEnd - delStart, insText]);
    oldIdx = nextAnchorOldIdx !== -1 ? nextAnchorOldIdx : oldTokens.length;
  }

  if (oldIdx < oldTokens.length) {
    const delStart = prefixLen + oldTokens[oldIdx].offset;
    const delEnd = prefixLen + oldMid.length;
    if (delEnd > delStart) {
      ops.push([delStart, delEnd - delStart, '']);
    }
  }

  return ops;
}

function applyCharDiffOpsNode(baseText, ops) {
  let out = '';
  let cursor = 0;
  for (const [offset, deleteCount, insertText] of ops) {
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

export function generateDeltaManifest() {
  const tinyConfig = JSON.parse(fs.readFileSync(TINY_CONFIG_PATH, 'utf8'));
  const version = String(tinyConfig.version || '2.3.0');

  let previousManifest = null;
  const prevManifestPath = path.join(PUBLIC_DIR, 'delta-manifest.json');
  if (fs.existsSync(prevManifestPath)) {
    try {
      previousManifest = JSON.parse(fs.readFileSync(prevManifestPath, 'utf8'));
    } catch {
      previousManifest = null;
    }
  }

  fs.mkdirSync(PATCHES_PUBLIC_DIR, { recursive: true });
  if (fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(PATCHES_OUT_DIR, { recursive: true });
  }

  const prevSlotToRelPath = new Map();
  if (previousManifest && previousManifest.files) {
    for (const [prevRel, prevMeta] of Object.entries(previousManifest.files)) {
      prevSlotToRelPath.set(normalizeSlotKey(prevRel), {
        relPath: prevRel,
        sha256: prevMeta.sha256,
      });
    }
  }

  const filesMap = {};
  const patchesMap = {};

  if (fs.existsSync(OUT_DIR)) {
    const allFiles = walkFiles(OUT_DIR);
    for (const fullPath of allFiles) {
      const relPath = path.relative(OUT_DIR, fullPath).replace(/\\/g, '/');
      if (
        relPath === 'delta-manifest.json' ||
        relPath === '.nojekyll' ||
        relPath.startsWith('delta-patches/')
      ) {
        continue;
      }

      if (!isPatchableCodeOrMarkup(relPath)) {
        continue;
      }

      const buffer = fs.readFileSync(fullPath);
      const newSha256 = sha256Buffer(buffer);
      const newSize = buffer.byteLength;
      filesMap[relPath] = { sha256: newSha256, size: newSize };

      const slot = normalizeSlotKey(relPath);
      const safeSlot = slotToSafeFilename(slot);
      const baselineFullPath = path.join(PATCHES_PUBLIC_DIR, `${safeSlot}.full.txt`);
      const patchRelFile = `delta-patches/${safeSlot}.patch.json`;
      const fullRelFile = `delta-patches/${safeSlot}.full.txt`;

      const newText = buffer.toString('utf8');
      const prevSlotInfo = prevSlotToRelPath.get(slot);

      let oldText = newText;
      let baseRelPath = relPath;
      let baseSha256 = newSha256;

      if (fs.existsSync(baselineFullPath)) {
        const candidateOldText = fs.readFileSync(baselineFullPath, 'utf8');
        const candidateOldSha = sha256Buffer(Buffer.from(candidateOldText, 'utf8'));
        // Only overwrite baseline when the file actually changed in this build
        if (candidateOldSha !== newSha256) {
          oldText = candidateOldText;
          baseSha256 = candidateOldSha;
          baseRelPath = prevSlotInfo?.relPath || relPath;
        } else if ( fs.existsSync(path.join(PATCHES_PUBLIC_DIR, `${safeSlot}.patch.json`)) ) {
          try {
            const existingPatch = JSON.parse(
              fs.readFileSync(path.join(PATCHES_PUBLIC_DIR, `${safeSlot}.patch.json`), 'utf8')
            );
            if (existingPatch.targetSha256 === newSha256) {
              patchesMap[slot] = {
                slot,
                baseRelPath: existingPatch.baseRelPath,
                targetRelPath: relPath,
                baseSha256: existingPatch.baseSha256,
                targetSha256: newSha256,
                patchFile: patchRelFile,
                fullFile: fullRelFile,
                patchSize: fs.statSync(path.join(PATCHES_PUBLIC_DIR, `${safeSlot}.patch.json`)).size,
                fullSize: newSize,
              };
              if (fs.existsSync(OUT_DIR)) {
                fs.copyFileSync(
                  path.join(PATCHES_PUBLIC_DIR, `${safeSlot}.patch.json`),
                  path.join(OUT_DIR, patchRelFile)
                );
                fs.writeFileSync(path.join(OUT_DIR, fullRelFile), newText, 'utf8');
              }
              continue;
            }
          } catch {
            // Recompute patch below
          }
        }
      }

      let ops = computeCharDiffOps(oldText, newText);
      const verified = applyCharDiffOpsNode(oldText, ops);
      if (verified !== newText) {
        ops = [[0, oldText.length, newText]];
      }

      const patchDoc = {
        slot,
        baseRelPath,
        targetRelPath: relPath,
        baseSha256,
        targetSha256: newSha256,
        ops,
      };

      const patchJson = JSON.stringify(patchDoc);
      const patchBytes = Buffer.byteLength(patchJson, 'utf8');

      fs.writeFileSync(path.join(PATCHES_PUBLIC_DIR, `${safeSlot}.patch.json`), patchJson, 'utf8');
      fs.writeFileSync(baselineFullPath, newText, 'utf8');

      if (fs.existsSync(OUT_DIR)) {
        fs.writeFileSync(path.join(OUT_DIR, patchRelFile), patchJson, 'utf8');
        fs.writeFileSync(path.join(OUT_DIR, fullRelFile), newText, 'utf8');
      }

      patchesMap[slot] = {
        slot,
        baseRelPath,
        targetRelPath: relPath,
        baseSha256,
        targetSha256: newSha256,
        patchFile: patchRelFile,
        fullFile: fullRelFile,
        patchSize: patchBytes,
        fullSize: newSize,
      };
    }
  }

  const manifest = {
    version,
    publishedAt: new Date().toISOString(),
    baseUrl: 'https://raw.githubusercontent.com/KavehAhangar051/Markdown-RTL-Viewer/main/public',
    releaseTag: `v${version}-windows`,
    files: filesMap,
    patches: patchesMap,
  };

  const json = JSON.stringify(manifest, null, 2);

  if (fs.existsSync(OUT_DIR)) {
    fs.writeFileSync(path.join(OUT_DIR, 'delta-manifest.json'), json, 'utf8');
  }

  if (fs.existsSync(PUBLIC_DIR)) {
    fs.writeFileSync(path.join(PUBLIC_DIR, 'delta-manifest.json'), json, 'utf8');
  }

  console.log(
    `==> [DeltaUpdater] Generated character-level delta-manifest.json for v${version} (${Object.keys(filesMap).length} code/style bundles indexed).`
  );
}

generateDeltaManifest();
