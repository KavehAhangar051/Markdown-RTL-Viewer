# RTL Markdown Studio

> A high-performance, privacy-first, bidirectional Markdown editor and previewer crafted for Persian, Arabic, and multilingual technical documentation — available on the Web and as a Portable Windows Desktop App (`1920×1080`, 60 FPS GPU-accelerated).

[![Next.js](https://img.shields.io/badge/Next.js-15.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Windows Desktop](https://img.shields.io/badge/Windows-Portable%20x64%20(TinyJS)-0078D6?logo=windows)](https://github.com/KavehAhangar051/Markdown-RTL-Viewer/releases)
[![Zero Backend](https://img.shields.io/badge/Privacy-100%25%20Client--Side-10b981)](#-key-features)

---

## ✨ Key Features

- **🔀 Smart Bi-Directional Formatting:** Isolates RTL paragraphs, headings, blockquotes, and tables while keeping inline and fenced code blocks strictly LTR.
- **💻 Hybrid Code & Math Rendering:** Real-time syntax highlighting via `Highlight.js` (pairing `Kode Mono` for code with `Dana` / `Vazirmatn` for Persian comments) plus scientific formulas via `KaTeX`.
- **🪟 Native Portable Windows App (`1920×1080`):** Built on TinyJS (`WebView2` + `txiki.js`) with a custom dark frameless Windows 11 titlebar, native Open/Save dialogs (`Ctrl+O` / `Ctrl+S`), and Explorer drag-and-drop.
- **🔄 Low-Bandwidth Differential (Delta) Updater:** Compares `SHA-256` file hashes in `delta-manifest.json` against GitHub and displays an in-app update button in the desktop titlebar that downloads **only modified chunks** (a few KB) instead of re-downloading the entire app.
- **⚡ Locked 60 FPS with All Animations Active:** DirectComposition hardware acceleration (`--enable-gpu-rasterization`, `--enable-zero-copy`, `UseSkiaRenderer`), Windows `AboveNormal` process scheduling, and automatic low-end GPU optimization (`scale`-based dock physics and zero-blur composited surfaces).
- **🔒 100% Client-Side Privacy:** Runs entirely in local memory with zero backend servers or telemetry.

---

## 🚀 Getting Started

### 1. Install & Run Web Development Server
```bash
bun install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Quality Verification (Typecheck & Lint)
```bash
npm run check        # Runs tsc --noEmit, ESLint, and Oxlint
```

### 3. Portable Windows Desktop App
Download the latest portable Windows release from **[GitHub Releases](https://github.com/KavehAhangar051/Markdown-RTL-Viewer/releases)**:
1. Download `RTL-Markdown-Studio-v<version>-Windows-x64-Portable.zip` (or `RTL-Markdown-Studio-Windows-x64.zip`).
2. Extract the archive into any folder.
3. Run `rtl-markdown-studio.exe` (keep `launcher.exe` in the same folder). No installation required.

To build the Windows executable from source:
```powershell
irm https://tinyjs.app/install.ps1 | iex
npm run desktop:build
```

---

## 📚 Documentation

- 📘 [System Architecture (`ARCHITECTURE.md`)](./ARCHITECTURE.md)
- 🎨 [Design System & 60 FPS GPU Motion (`DESIGN.md`)](./DESIGN.md)
- 🤖 [Agent & Engineering Rules (`AGENTS.md`)](./AGENTS.md)

---

## 📄 License

Licensed under the [MIT License](./LICENSE).
