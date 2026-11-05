/**
 * @file tests/tiny-desktop-bridge.test.ts
 * @description Node:test unit suite verifying TinyJS desktop bridge contracts,
 * Windows/POSIX path handling, static export relativization, and mocked `window.tiny` RPC flows.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractFileNameFromPath,
  relativizeStaticExportHtml,
  relativizeStaticExportCss,
  relativizeWebpackPublicPath,
  isTinyDesktopRuntime,
  openMarkdownViaTinyDesktop,
  saveMarkdownViaTinyDesktop,
  readMarkdownPathViaTinyDesktop,
  syncTinyWindowTitle,
} from '../utils/tinyDesktopBridge';
import type { TinyBridge } from '../types/tiny';

test('extractFileNameFromPath handles Windows and POSIX paths accurately', () => {
  assert.equal(extractFileNameFromPath('C:\\Users\\Aria\\Desktop\\proposal.md'), 'proposal.md');
  assert.equal(extractFileNameFromPath('D:\\Projects\\rtl-studio\\README.markdown'), 'README.markdown');
  assert.equal(extractFileNameFromPath('/var/docs/guide.txt'), 'guide.txt');
  assert.equal(extractFileNameFromPath('   '), 'document.md');
});

test('relativizeStaticExportHtml rewrites Next.js root-relative assets for file:// WebView2', () => {
  const input = [
    '<link rel="stylesheet" href="/_next/static/css/986a.css"/>',
    '<script src="/_next/static/chunks/main-app.js" async=""></script>',
    '<link rel="icon" href="/favicon.ico"/>',
    '<link rel="manifest" href="/manifest.webmanifest"/>',
    '<script>self.__next_f.push([1,"{\\"href\\":\\"/apple-icon.png\\",\\"chunk\\":\\"/_next/static/chunks/1.js\\"}"])</script>',
  ].join('');

  const output = relativizeStaticExportHtml(input);
  assert.equal(output.includes('href="./_next/static/css/986a.css"'), true);
  assert.equal(output.includes('src="./_next/static/chunks/main-app.js"'), true);
  assert.equal(output.includes('href="./favicon.ico"'), true);
  assert.equal(output.includes('href="./manifest.webmanifest"'), true);
  assert.equal(output.includes('\\"href\\":\\"./apple-icon.png\\"'), true);
  assert.equal(output.includes('\\"./_next/static/chunks/1.js\\"'), true);
});

test('relativizeStaticExportCss and relativizeWebpackPublicPath rewrite font and chunk roots', () => {
  const css = 'src:url(/_next/static/media/vazirmatn-700.woff2) format("woff2");';
  assert.equal(relativizeStaticExportCss(css), 'src:url(../media/vazirmatn-700.woff2) format("woff2");');

  const webpack = 'r.tu=e=>r.tt().createScriptURL(e),r.p="/_next/",r.nc=void 0';
  assert.equal(
    relativizeWebpackPublicPath(webpack),
    'r.tu=e=>r.tt().createScriptURL(e),r.p="./_next/",r.nc=void 0'
  );
});

test('TinyJS bridge RPC adapters interact with mocked window.tiny on Windows', async () => {
  const titles: string[] = [];
  const savedFiles: Array<{ path: string; content: string }> = [];

  const mockTiny: TinyBridge = {
    dialog: {
      openFile: async () => 'C:\\Users\\Dev\\Notes\\persian-doc.md',
      saveFile: async (opts) => `C:\\Users\\Dev\\Exports\\${opts?.name ?? 'out.md'}`,
    },
    win: {
      setTitle: async (title: string) => {
        titles.push(title);
      },
      onDrop: () => () => {},
    },
    clipboard: {
      read: async () => ({ kind: 'text', text: '# کلیپ‌بورد', html: null }),
      write: async () => {},
    },
    system: {
      os: () => 'windows',
      isWindows: () => true,
      isMacOS: () => false,
      isLinux: () => false,
    },
    api: {
      call: (async (method: string, params?: Record<string, string>) => {
        if (method === 'readMarkdownFile') {
          if (params?.path?.endsWith('.exe')) {
            return { ok: false, error: 'invalid_type' };
          }

          return {
            ok: true,
            content: '# سند آزمایشی ویندوز\nمتن راست‌چین',
            fileName: 'persian-doc.md',
            path: params?.path ?? '',
          };
        }

        if (method === 'saveMarkdownFile') {
          savedFiles.push({ path: params?.path ?? '', content: params?.content ?? '' });

          return {
            ok: true,
            path: params?.path ?? '',
            fileName: 'exported.md',
          };
        }

        return [];
      }) as TinyBridge['api']['call'],
      on: () => () => {},
    },
  };

  const globalWithWindow = globalThis as unknown as { window?: { tiny?: TinyBridge } };
  const prevWindow = globalWithWindow.window;
  globalWithWindow.window = { tiny: mockTiny };

  try {
    assert.equal(isTinyDesktopRuntime(), true);

    const openResult = await openMarkdownViaTinyDesktop();
    assert.equal(openResult.status, 'ok');
    if (openResult.status === 'ok') {
      assert.equal(openResult.fileName, 'persian-doc.md');
      assert.equal(openResult.content.includes('سند آزمایشی ویندوز'), true);
    }

    const invalidResult = await readMarkdownPathViaTinyDesktop('C:\\bad.exe');
    assert.equal(invalidResult.status, 'invalid_type');

    const saveResult = await saveMarkdownViaTinyDesktop('# خروجی', 'exported.md');
    assert.equal(saveResult.status, 'ok');
    assert.equal(savedFiles.length, 1);
    assert.equal(savedFiles[0].path, 'C:\\Users\\Dev\\Exports\\exported.md');
    assert.equal(savedFiles[0].content, '# خروجی');

    await syncTinyWindowTitle('معماری سیستم', 'RTL Markdown Studio');
    assert.equal(titles[0], 'معماری سیستم — RTL Markdown Studio');
  } finally {
    globalWithWindow.window = prevWindow;
  }
});
