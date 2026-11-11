# AnkiGNB Developer Wiki

> **Summary:** AnkiGNB is a browser extension built with WXT, React and TypeScript, forked from AnkiNLM by lkmss. It reads the flashcard or quiz data that Google's Gemini Notebook (formerly NotebookLM) renders inside a sandboxed iframe and adds **Copy**, **Download** and **Support** buttons to the Studio artifact footer. Download saves an Anki-importable, tab-separated `.csv` file.

This folder is the technical documentation for developers and AI agents. For end-user installation and Anki import steps, see the root [README](../README.md).

---

## Quick facts

| Item | Value |
|---|---|
| Product name | AnkiGNB (repo folder: `ankignb`), a fork of [AnkiNLM](https://github.com/maialks/ankinlm) |
| Extension version | `1.3` (set in `wxt.config.ts`, see [Build & Release](build-and-release.md)) |
| Framework | [WXT](https://wxt.dev) `^0.20.11`, `srcDir: 'src'` |
| UI | React 19 (popup only), `lucide-react` icons |
| Language | TypeScript `^5.9` |
| Target site | `https://notebook.google.com/*` (Gemini Notebook). The old `notebooklm.google.com` redirects there and is kept as a fallback |
| Browsers | Chrome / Chromium (Manifest V3, **works**); Firefox (Manifest V2, **not functional yet**, see [Browser Support](browser-support.md)) |
| Entrypoints | `background`, `content`, `popup` (under `src/entrypoints/`) |
| Tests / lint | None |
| Network calls | None. Everything runs locally (see `PRIVACY_POLICY.md`) |

---

## Page index

### Start here
- [Getting Started](getting-started.md): install, run in dev mode, build, load the unpacked extension
- [Architecture](architecture.md): components, end-to-end data flow, message contract, repo layout

### Modules
- [Background script](modules/background.md): `src/entrypoints/background/index.ts`
- [Content script](modules/content-script.md): `src/entrypoints/content/index.ts`
- [Popup](modules/popup.md): `src/entrypoints/popup/*`, `src/components/Popup.tsx`
- [Utilities & types](modules/utils.md): `src/utils/*`, `src/types.ts`

### Reference
- [Data Formats](data-formats.md): Gemini Notebook JSON input, the TSV/CSV output spec, Anki mapping
- [Gemini Notebook DOM Contract](gemini-notebook-dom-contract.md): every external host, selector, attribute and icon name the extension depends on
- [Browser Support](browser-support.md): Chrome MV3 vs Firefox MV2, permissions
- [Build & Release](build-and-release.md): versioning, zipping, store submission
- [Known Issues](known-issues.md): bugs and tech debt, with locations and suggested fixes
- [Contributing](contributing.md): conventions, recipes, pre-PR checklist
- [Glossary](glossary.md)

---

## For AI agents

**Orientation in 30 seconds:**

1. The whole product is about 500 lines of source. Read these four files in order:
   1. `src/entrypoints/background/index.ts`
   2. `src/entrypoints/content/index.ts`
   3. `src/utils/utils.ts`
   4. `src/types.ts`
2. Data path on Chrome: the **background** script injects a function into the Gemini Notebook artifact sub-frame (`blob:` or `*.usercontent.goog`). That function waits for `app-root[data-app-data]` and `postMessage`s it to the parent frame. The **content** script receives the message, converts it with `toTsv`, and keeps cloned native buttons in `artifact-viewer .artifact-footer`.
3. WXT globals (`defineBackground`, `defineContentScript`, `browser`) are **auto-imported**. Don't add imports for them. The `@/` alias maps to `src/`.

**Commands:**

```bash
npm install
```

```bash
npm run compile
```

```bash
npm run build
```

`npm run compile` (type-check) is the only automated check. There is no test runner.

**Invariants. Don't break these without understanding them:**
- The message `type` string `'ANKIGNB_DATA'` is shared between the background-injected function and the content script.
- The selectors in [Gemini Notebook DOM Contract](gemini-notebook-dom-contract.md) are owned by Google, not this repo. If the extension "stops working", check those first.
- Output is **tab-delimited** even though the file is named `.csv`. Anki's import relies on that (Field 1 = Front, Field 2 = Back).
- The extension version lives in three places (see [Build & Release](build-and-release.md#version-bump-checklist)).
- `PRIVACY_POLICY.md` promises no data collection and no network transmission. Any feature that adds a network call or storage must update it.

**Before claiming something is a bug, check [Known Issues](known-issues.md).** Several obvious-looking defects (broken Firefox, no origin check on `postMessage`, the `.csv` name for a tab-separated file) are already documented there.

**Some comments in the Firefox prototype are still in Portuguese.** That's expected; write new ones in English.
