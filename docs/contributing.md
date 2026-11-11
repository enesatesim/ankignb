# Contributing

> **Summary:** Conventions, common change recipes, and a pre-PR checklist for humans and AI agents working on AnkiNLM.

## Conventions

- **TypeScript everywhere.** `tsconfig.json` extends the generated `.wxt/tsconfig.json`, adds `jsx: react-jsx`, and allows `.ts`/`.tsx` extensions in imports.
- **Path alias:** `@/` → `src/` (provided by WXT). Example: `import { createCsvBlob } from '@/utils/utils'`.
- **WXT auto-imports:** `defineBackground`, `defineContentScript`, `browser` and others are globals. Don't import them manually. The background script imports `browser` explicitly from `@wxt-dev/webextension-polyfill/browser` for the Firefox branch, and the Chrome branch uses the `chrome.*` global (`@types/chrome`).
- **Entrypoints** live in `src/entrypoints/<name>/`. WXT derives the manifest entries from the folder names and the `define*` options. Don't hand-edit a `manifest.json`. Change `wxt.config.ts` or the entrypoint options instead.
- **Browser branching:** use `import.meta.env.FIREFOX` (a build-time constant).
- **Style:** 2-space indent, single quotes, semicolons, a trailing comma in multi-line literals (Prettier-like, but there's no config in the repo). JSX uses single-quoted attributes.
- **Language:** write new comments, logs and docs in English.
- **Privacy:** no network calls, analytics or storage without updating `PRIVACY_POLICY.md` (see [Build & Release](build-and-release.md#privacy-policy)).

## Where to make common changes

| Goal | File(s) |
|---|---|
| Change exported columns, delimiter or escaping | `src/utils/utils.ts` (`createCsvBlob`), then [Data Formats](data-formats.md) |
| Support a new NotebookLM artifact type | `src/types.ts`, `src/utils/typeguards.ts`, `src/utils/utils.ts` |
| Change, add or remove footer buttons | `src/entrypoints/content/index.ts` (`handleNotebookLMData`) |
| NotebookLM changed its DOM or frames | See [NotebookLM DOM Contract](notebooklm-dom-contract.md) |
| Permissions or manifest fields | `wxt.config.ts` |
| Popup text or links | `src/components/Popup.tsx`, `src/entrypoints/popup/style.css` |
| Version bump | See [Build & Release](build-and-release.md#version-bump-checklist) |

## Recipe: add a new artifact type or export format

Example: exporting quiz distractors, or a new NotebookLM artifact such as a "glossary".

1. Add the payload interface to `src/types.ts`. Capture a real payload first. See [DOM Contract → Re-discovering](notebooklm-dom-contract.md#re-discovering-selectors-after-a-notebooklm-update).
2. Add an `isXxxData` guard to `src/utils/typeguards.ts` that follows the existing shallow pattern. Ideally also validate the item fields.
3. In `createCsvBlob`, add an `if (isXxxData(parsedData)) { … rows.push(...) }` block. Pass every field through `escapeCsvField`, and keep the 2-column Front/Back layout unless you also update the Anki import docs.
4. If the filename should differ per type, change `handleDownload` in `content/index.ts`. It's currently hard-coded to `flashcards.csv`.
5. Update [Data Formats](data-formats.md) and, if the change is user-visible, the root `README.md`.

## Recipe: add a footer button

```ts
const btn = createStyledButton(footerContainer, 'Label', 'material_symbol_name');
btn.addEventListener('click', () => { /* ... */ });
```

- Use a [Material Symbols](https://fonts.google.com/icons) ligature name. NotebookLM's page provides the font.
- Pass `''` as the label for an icon-only button, and set a `title`.
- Read [Known Issues #2/#3](known-issues.md#2-buttons-are-appended-on-every-message-duplicates) first. Duplicates and staleness affect every new button too.

## Pre-PR checklist

- [ ] `npm run compile` passes.
- [ ] `npm run build` succeeds (and `npm run build:firefox` if Firefox code was touched).
- [ ] The [manual smoke test](getting-started.md#manual-smoke-test) passes on Chrome with **both** a flashcard and a quiz artifact.
- [ ] Imported the downloaded file into Anki, including a card with LaTeX, quotes and a newline.
- [ ] The version is bumped in every location if this is a release.
- [ ] `PRIVACY_POLICY.md` is still accurate.
- [ ] The docs in `docs/` are updated, including [Known Issues](known-issues.md) if you fixed or found something.

## Notes for AI agents

- The codebase is small. Read every file in `src/` before making cross-cutting changes. That's cheaper than guessing.
- You can't verify NotebookLM behavior from the repo alone. If a change depends on NotebookLM's DOM, say so and ask a human to run the smoke test.
- Don't "fix" items from [Known Issues](known-issues.md) as a side effect of unrelated work. Keep changes scoped, and update that page when you do fix one.
- Keep the injected `func` in the background script self-contained. It's serialized and runs in another frame.

---

**Related pages:** [Getting Started](getting-started.md) · [Architecture](architecture.md) · [Known Issues](known-issues.md)
