# Getting Started

> **Summary:** How to install dependencies, run AnkiGNB in development mode, build production bundles for Chrome and Firefox, and load them into a browser.

## Prerequisites

- **Node.js**: a current LTS release. WXT 0.20 requires Node 18+.
- **npm**: the repo ships a `package-lock.json`.
- **Chrome/Chromium** and/or **Firefox** (109+) for manual testing.
- A Google account with access to [Gemini Notebook](https://notebook.google.com) (formerly NotebookLM) and a notebook that has generated **flashcards** or a **quiz** in Studio.

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

1. Open a notebook at `https://notebook.google.com/`.
2. In **Studio**, open a generated **Flashcards** (or **Quiz**) artifact.
3. Check that **Copy**, **Download** and a coffee icon button appear **once** in the artifact footer, next to the thumbs up / down buttons, in the same style. In a narrow Studio panel they show icons only; widen the panel and the labels should appear.
4. Click **Copy** (the icon turns into a check) and paste somewhere: one `front<TAB>back` row per card, no JSON.
5. Click **Download** twice. Two `flashcards.csv` files should be saved, each with one tab-separated row per card.
6. Resize the window and close/re-open the artifact. The buttons should come back, never duplicated.
7. Open a non-card artifact (audio, report). No AnkiGNB buttons should appear there.
8. Import the file into Anki (Field 1 → Front, Field 2 → Back).

Useful consoles:
- **Background (service worker):** on `chrome://extensions`, click *Inspect views: service worker*. It logs `AnkiGNB background started`.
- **Top frame:** `document.querySelectorAll('[data-ankignb]')` in the page console lists the injected buttons.

---

**Related pages:** [Architecture](architecture.md) · [Build & Release](build-and-release.md) · [Contributing](contributing.md)
