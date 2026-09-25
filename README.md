# RTL Markdown Studio

> A high-performance, privacy-first, bidirectional Markdown editor and previewer crafted for Persian, Arabic, and multilingual technical documentation.

[![Next.js](https://img.shields.io/badge/Next.js-15.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Zero Backend](https://img.shields.io/badge/Privacy-100%25%20Client--Side-10b981)](#-zero-backend-privacy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Why RTL Markdown Studio?

Writing technical documentation in Right-to-Left (RTL) languages like Persian (Farsi) and Arabic has historically been plagued by compounding layout and formatting failures:

- **Inverted Punctuation & Brackets:** Trailing parentheses, brackets, and periods flip to improper positions across mixed-direction sentences.
- **Code Block Corruption:** Code snippets inadvertently get flipped into RTL mode, corrupting indentation, syntax structures, and readability.
- **Broken Tables & Lists:** Markdown tables and structured task lists lose column alignment and flow integrity.
- **Cloud Telemetry & Privacy Leaks:** Online converters and SaaS platforms transmit raw, unencrypted author drafts to remote servers.

**RTL Markdown Studio** solves these challenges natively by providing an isolated, pure client-side environment with bidirectional typography parsing, zero-overhead memory caching, and a macOS-inspired motion design system.

---

## ✨ Key Features

### 🔀 Smart Bi-Directional Formatting
Intelligently isolates RTL paragraphs, headers, blockquotes, and lists while preserving standard CommonMark and GFM specifications without mangling Markdown syntax.

### 💻 Zero-Disruption Code Blocks (ADR-0003)
Code fences and inline spans remain strictly Left-to-Right (LTR). Includes real-time syntax highlighting via `Highlight.js`, line numbering, language tags, and hybrid font fallback pairing `JetBrains Mono` with `Vazirmatn` for embedded RTL comments.

### 🔒 100% Zero-Backend Privacy (ADR-0008)
All transformations, rendering, and statistical evaluations run entirely in local browser RAM. No servers, tracking cookies, analytics pixels, or external API endpoints.

### ⚡ 60 FPS Deferred Reactive Pipeline (ADR-0010)
Utilizes React 19's `useDeferredValue` and multi-tier LRU caching. Editor typing remains instantaneous with priority scheduling, offloading heavy Markdown parsing and AST transformation seamlessly.

### 🎛️ Fluid Magnification Studio Dock (ADR-0007)
A floating interactive dock featuring spring physics and pointer-proximity magnification (macOS Dock style), quick-action triggers, and focus mode toggling.

### 🎯 Distraction-Free Focus Mode
Instantly collapses secondary layout panels, headers, and toolbars into a distraction-free writing sanctuary with smooth keyboard shortcuts.

### 📊 Real-Time Document Analytics
Live calculation of word count, Persian/Latin character counts, line tallies, estimated reading duration, and native Persian numeral conversion (`persianizer`).

### 🚀 Static & Multi-Environment Ready (ADR-0013)
Fully compatible with Next.js static exports (`output: 'export'`), sub-path deployment (`basePath`), automated GitHub Actions CI/CD, and containerized runtimes.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 15.4 (App Router) + React 19 |
| **Language** | TypeScript 5.9 (Strict Type Safety) |
| **Styling & Design System** | Tailwind CSS v4 + Radix UI Primitives |
| **Animation & Motion** | Motion (Framer Motion v12) + Lenis Smooth Scroll |
| **Markdown Processing** | `react-markdown` + `remark-gfm` + `highlight.js` |
| **Icons** | Lucide React |
| **Testing** | Bun Test Suite + Unit / Integration Tests |

---

## 📁 Directory Structure & Architecture

Built with strict adherence to **Single Responsibility Principle (SRP)**, **Separation of Concerns (SoC)**, and a strict 200–300 line-count threshold per file:

```text
/
├── app/                  # Next.js 15 App Router root layouts, providers, and main page
├── components/
│   ├── layout/           # Capsule header, studio dock, smooth-scroll, and focus bar
│   ├── views/            # Split-pane editor, live preview, stats badges, and modals
│   ├── ui/               # Reusable primitives (Buttons, Modals, Tables, Code Blocks)
│   ├── motion/           # Spring variants, loaders, and state-swap transitions
│   └── providers/        # Context providers for theme and motion accessibility
├── services/             # Pure domain Markdown engine (Zero React/DOM dependencies)
├── store/                # Global state, deferred pipeline, and toast notification context
├── hooks/                # Precision hooks (Active line calculator, clipboard, smooth scroll)
├── utils/                # Pure utility functions (RTL converter, stats, syntax highlighter)
├── constants/            # Default settings, sample texts, and zero-dependency i18n
├── types/                # Strongly-typed interfaces and domain contracts
├── adr/                  # Architecture Decision Records (ADR-0001 through ADR-0013)
├── docs/                 # In-depth architectural guides, diagrams, and specs
└── tests/                # Unit and integration test suites
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** `v20+` (or `v22+` recommended) OR **Bun** `v1.0+`
- **Package Manager:** `npm`, `pnpm`, or `bun`

### 1. Clone & Install
```bash
git clone https://github.com/KamyarAhangar8778/Markdown-RTL-Viewer.git
cd Markdown-RTL-Viewer
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Linting & Quality Verification
```bash
npm run typecheck    # Validate TypeScript types
npm run lint         # Run ESLint validation
npm run check        # Run typecheck and lint in sequence
```

### 4. Production Build & Static Export
```bash
# Build for production server
npm run build
npm run start

# Or build standalone static export for GitHub Pages / CDN
npm run build:export
```

---

## 📐 Architecture Decision Records (ADRs)

Key architectural paradigms and technical trade-offs are thoroughly documented:

- **[ADR-0001](./adr/0001-rtl-markdown-architecture.md):** RTL Markdown segmentation and LTR block protection.
- **[ADR-0002](./adr/0002-desktop-only-smooth-scroll.md):** Inertia smooth-scrolling restricted to desktop fine pointers.
- **[ADR-0003](./adr/0003-hybrid-code-typography-and-font-caching.md):** Hybrid font stacks for bidirectional code typography.
- **[ADR-0004](./adr/0004-floating-island-header.md):** Floating capsule header with backdrop blur.
- **[ADR-0005](./adr/0005-deep-markdown-engine-seam.md):** Pure functional domain seam for the markdown processor.
- **[ADR-0006](./adr/0006-three-layer-motion-design-system.md):** Primary, secondary, and ambient spring motion architecture.
- **[ADR-0007](./adr/0007-fluid-magnification-studio-dock.md):** Proximity-based dock scaling physics.
- **[ADR-0008](./adr/0008-zero-backend-client-side-privacy.md):** Zero-backend, fully local execution model.
- **[ADR-0009](./adr/0009-active-line-position-tracking.md):** Constant-time active line position calculation.
- **[ADR-0010](./adr/0010-deferred-reactive-state-pipeline.md):** Deferred state pipeline for smooth 60fps input.
- **[ADR-0011](./adr/0011-zero-dependency-dual-language-i18n.md):** Zero-dependency type-safe dictionary for `fa` / `en`.
- **[ADR-0012](./adr/0012-lru-caching-and-off-thread-processing.md):** Multi-tier bounded LRU caches & worker delegation.
- **[ADR-0013](./adr/0013-github-pages-static-deployment.md):** Static Next.js export with automated GitHub Actions CI/CD.

---

## 📚 Documentation Index

- 📘 [System Architecture & Agent Guide](./ARCHITECTURE.md)
- 🎨 [Design System & Motion Standards](./DESIGN.md)
- 📊 [Architecture Flow & Data Diagrams](./docs/ARCHITECTURE_DIAGRAMS.md)
- 🛠 [Developer & Contribution Guide](./docs/DEVELOPMENT_GUIDE.md)
- 🌐 [GitHub Pages Deployment Manual](./docs/GITHUB_PAGES_DEPLOYMENT.md)

---

## 📄 License

This project is open-source software licensed under the [MIT License](./LICENSE). Crafted with care for the Persian, Arabic, and global developer community.
