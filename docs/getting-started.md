# Getting Started

> **Summary:** How to install dependencies, run AnkiNLM in development mode, build production bundles for Chrome and Firefox, and load them into a browser.

## Prerequisites

- **Node.js**: a current LTS release. WXT 0.20 requires Node 18+.
- **npm**: the repo ships a `package-lock.json`.
- **Chrome/Chromium** and/or **Firefox** (109+) for manual testing.
- A Google account with access to [NotebookLM](https://notebooklm.google.com) and a notebook that has generated **flashcards** or a **quiz** in Studio.

## Install

```bash
npm install
```

The `postinstall` hook runs `wxt prepare`. That generates the `.wxt/` directory, which includes `.wxt/tsconfig.json` (the root `tsconfig.json` extends it) and the type declarations for WXT auto-imports. If type errors mention `defineBackground` or `defineContentScript`, run `npx wxt prepare` again.

## npm scripts

| Script | Command | What it does |
|---|---|---|
| `dev` | `wxt` | Dev build for Chrome with hot reload. Opens a browser with the extension loaded |
| `dev:firefox` | `wxt -b firefox` | Same, for Firefox (MV2) |
| `build` | `wxt build` | Production build to `.output/chrome-mv3/` |
| `build:firefox` | `wxt build -b firefox` | Production build to `.output/firefox-mv2/` |
| `zip` | `wxt zip` | Build and zip for the Chrome Web Store |
| `zip:firefox` | `wxt zip -b firefox` | Build and zip for AMO (also produces a sources zip) |
| `compile` | `tsc --noEmit` | Type-check only. **This is the only automated check in the repo** |
| `postinstall` | `wxt prepare` | Generates `.wxt/` types |

`.output/`, `.wxt/` and `web-ext.config.ts` are git-ignored.

## Run in development

```bash
npm run dev
```

WXT launches a fresh Chrome profile with the extension installed. That profile is not signed in to Google. Either sign in there, or create a git-ignored `web-ext.config.ts` that points WXT at an existing profile ([WXT docs: browser startup](https://wxt.dev/guide/essentials/config/browser-startup.html)).

## Load a production build manually

**Chrome**
1. Run `npm run build`.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select `.output/chrome-mv3/`.

**Firefox** (currently non-functional, see [Browser Support](browser-support.md))
1. Run `npm run build:firefox`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on** and select `.output/firefox-mv2/manifest.json`.

## Manual smoke test

1. Open a notebook at `https://notebooklm.google.com/`.
2. In **Studio**, open a generated **Flashcards** (or **Quiz**) artifact.
3. Check that **Copy**, **Download** and a coffee icon button appear in the artifact footer.
4. Click **Download**. A `flashcards.csv` file should be saved. Open it and check that it has one tab-separated `front<TAB>back` row per card.
5. Import the file into Anki (Field 1 → Front, Field 2 → Back).

Useful consoles:
- **Background (service worker):** on `chrome://extensions`, click *Inspect views: service worker*. It logs `background script iniciado`.
- **Iframe:** the page DevTools console, with the context switched to the `blob:` frame. It logs `script injetado no iframe`.

---

**Related pages:** [Architecture](architecture.md) · [Build & Release](build-and-release.md) · [Contributing](contributing.md)
