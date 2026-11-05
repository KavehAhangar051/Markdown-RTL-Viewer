#!/usr/bin/env node

/**
 * @file scripts/generate-delta-manifest.mjs
 * @description Generates a content-addressed SHA-256 delta manifest (`delta-manifest.json`)
 * for all built frontend assets in `out/`, enabling low-bandwidth differential updates
 * in the TinyJS Windows desktop application (downloading only modified chunks).
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const OUT_DIR = path.resolve(ROOT_DIR, 'out');
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');
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

function sha256File(filePath) {
  const buffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  return { sha256: hash, size: buffer.byteLength };
}

export function generateDeltaManifest() {
  const tinyConfig = JSON.parse(fs.readFileSync(TINY_CONFIG_PATH, 'utf8'));
  const version = String(tinyConfig.version || '2.2.0');

  const filesMap = {};

  if (fs.existsSync(OUT_DIR)) {
    const allFiles = walkFiles(OUT_DIR);
    for (const fullPath of allFiles) {
      const relPath = path.relative(OUT_DIR, fullPath).replace(/\\/g, '/');
      if (relPath === 'delta-manifest.json' || relPath === '.nojekyll') {
        continue;
      }
      filesMap[relPath] = sha256File(fullPath);
    }
  }

  const manifest = {
    version,
    publishedAt: new Date().toISOString(),
    baseUrl: 'https://kavehahangar051.github.io/Markdown-RTL-Viewer',
    releaseTag: `v${version}-windows`,
    files: filesMap,
  };

  const json = JSON.stringify(manifest, null, 2);

  if (fs.existsSync(OUT_DIR)) {
    fs.writeFileSync(path.join(OUT_DIR, 'delta-manifest.json'), json, 'utf8');
  }

  if (fs.existsSync(PUBLIC_DIR)) {
    fs.writeFileSync(path.join(PUBLIC_DIR, 'delta-manifest.json'), json, 'utf8');
  }

  console.log(
    `==> [DeltaUpdater] Generated delta-manifest.json for v${version} (${Object.keys(filesMap).length} files indexed).`
  );
}

generateDeltaManifest();
