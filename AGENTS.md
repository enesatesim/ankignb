# AGENTS.md

## What this repo is

**AnkiGNB** (repo folder `ankignb`) is a small browser extension, built with [WXT](https://wxt.dev), React and TypeScript. It is a fork of [AnkiNLM](https://github.com/maialks/ankinlm) by lkmss, updated for **Gemini Notebook** (`notebook.google.com`), which is what Google renamed NotebookLM to. It reads the flashcard or quiz data that Gemini Notebook renders inside a sandboxed iframe. It then adds **Copy**, **Download** and **Support** buttons to the Studio artifact footer, so users can export the cards as an Anki-importable file.

- Chrome / Chromium (Manifest V3) works. The fork is not on the Chrome Web Store yet (the existing listing is the original AnkiNLM).
- Firefox (Manifest V2) has a build target, but its code is an unfinished prototype.
- The extension makes no network calls. Everything runs locally (see [PRIVACY_POLICY.md](PRIVACY_POLICY.md)).

The root [README.md](README.md) is for end users (install and Anki import steps). Developer docs live in [`docs/`](docs/).

## Read the docs first

**Check [`docs/`](docs/) before you explore the source.** The wiki already covers the architecture, the data flow, the external Gemini Notebook selectors, and known bugs. Reading the relevant page first is usually faster than working it out from the code, and it stops you from "fixing" something that is already documented or intentional.

Start with [docs/README.md](docs/README.md). It has quick facts, a page index and a "For AI agents" orientation section. Then go to the page that matches your task:

| If you are… | Read |
|---|---|
| Setting up, running in dev mode or building | [getting-started.md](docs/getting-started.md) |
| Trying to understand how the pieces fit together | [architecture.md](docs/architecture.md) |
| Changing a specific file | [modules/background.md](docs/modules/background.md), [modules/content-script.md](docs/modules/content-script.md), [modules/popup.md](docs/modules/popup.md), [modules/utils.md](docs/modules/utils.md) |
| Touching the input JSON or the CSV/TSV output | [data-formats.md](docs/data-formats.md) |
| Debugging "the extension stopped working" | [gemini-notebook-dom-contract.md](docs/gemini-notebook-dom-contract.md) |
| Working on Firefox or permissions | [browser-support.md](docs/browser-support.md) |
| Bumping the version or preparing a release | [build-and-release.md](docs/build-and-release.md), then follow [releasing-updates.md](docs/releasing-updates.md) step by step |
| About to report or fix a bug | [known-issues.md](docs/known-issues.md) |
| Making any change, before you open a PR | [contributing.md](docs/contributing.md) |
| Unsure what a term means | [glossary.md](docs/glossary.md) |

## Commands

```bash
npm install          # also runs `wxt prepare`
npm run dev          # Chrome dev mode
npm run compile      # type-check (tsc --noEmit), the only automated check
npm run build        # production build to .output/chrome-mv3/
```

There is no test runner and no linter. Run `npm run compile` after every change.

## Key rules

These are the short version. The details are in the docs linked above.

- WXT globals (`defineBackground`, `defineContentScript`, `browser`) are auto-imported. Don't import them yourself. `@/` maps to `src/`.
- Don't hand-edit a `manifest.json`. Change `wxt.config.ts` or the entrypoint options instead.
- The output file is **tab-delimited** even though it is named `.csv`. Anki import relies on this.
- The message type `'ANKIGNB_DATA'` is shared between the background-injected function and the content script. Keep them in sync.
- Gemini Notebook selectors, frame URLs and icon names belong to Google and can change at any time. See [gemini-notebook-dom-contract.md](docs/gemini-notebook-dom-contract.md).
- The version number lives in several places. Follow the checklist in [build-and-release.md](docs/build-and-release.md).
- Any network call, analytics or storage needs a matching update to [PRIVACY_POLICY.md](PRIVACY_POLICY.md).
- Some existing comments and logs are in Portuguese. Write new ones in English.

## Keep the docs current

If your change makes a doc page wrong (behaviour, file paths, line numbers, selectors, a known issue you fixed), update that page in the same change.
