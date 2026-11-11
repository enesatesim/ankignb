# Known Issues & Tech Debt

> **Summary:** Bugs and rough edges found by reading the source as of v1.3. Each entry has a location, its impact and a suggested fix. Check here before reporting or "fixing" something, and update this page when an issue is resolved.

Severity: 🔴 user-visible bug · 🟠 robustness/security · 🟡 cleanup

Fixed in v1.3 (AnkiGNB): no buttons on flashcard sets generated since about November 2026, because `f`/`b` became content-block objects instead of strings (see [Data Formats](data-formats.md#flashcards)); Copy copied raw JSON; duplicate buttons; buttons lost on resize; download working only once; data arriving before the footer was lost; the injected reader didn't wait for `app-root`; unhandled parse errors; `createStyledButton` markup tied to an old NotebookLM build.

---

## 1. `postMessage` is not origin-checked
🟠 · `src/entrypoints/background/index.ts:149`, `src/entrypoints/content/index.ts:48-61`

The sender uses target origin `'*'`. The receiver validates the message shape (`type === 'ANKIGNB_DATA'`, string `data`, parseable rows) but not `event.origin`. Another frame on the page could feed arbitrary JSON (the impact is limited to the exported file).
**Fix:** check that `event.origin` is a `*.usercontent.goog` origin, or that `event.source` is the artifact iframe's window.

## 2. Icons depend on Google's subset icon font
🟠 · `src/entrypoints/content/index.ts:118-139`

The page loads a "Luminous Symbols" / "Google Symbols" font that contains only the icons Gemini Notebook itself uses. `copy_all`, `save_alt` and `coffee` are **not** in it (they render as letters); `content_copy`, `download`, `local_cafe` and `check` are (checked November 2026). Google can drop any of them.
**Fix:** when changing icons, test the ligature on the live page (see [DOM Contract](gemini-notebook-dom-contract.md#re-discovering-selectors-after-a-gemini-notebook-update)). A more robust option is inline SVG icons.

## 3. Firefox support is non-functional
🔴 · `src/entrypoints/background/index.ts:5-116`, `src/entrypoints/content/index.ts:21-25`

The injected code string has a syntax error (a stray `}` after `console.log(...)`) and references an undefined `found`. It never posts data. The Firefox content script `main()` is empty.
**Fix:** see [Browser Support → What's needed](browser-support.md#whats-needed-to-make-firefox-work).

## 4. Quiz export is lossy
🟡 · `src/utils/utils.ts` (`toTsv`)

Quiz rows keep only the question and the correct answer (no distractors or rationale). This is a product limitation, not necessarily a bug.

## 5. "CSV" file is tab-separated
🟡 · `src/utils/utils.ts` (`toTsv`, `createCsvBlob`)

The `.csv` extension and `text/csv` MIME type, combined with tab delimiters, can confuse spreadsheet apps (Anki handles it). Consider `.tsv` / `text/tab-separated-values`, or document it clearly (done in [Data Formats](data-formats.md)).

## 6. Version hard-coded in several places
🟡 · `wxt.config.ts:11`, `src/components/Popup.tsx:9`, `package.json:5`

See [Build & Release → Version bump checklist](build-and-release.md#version-bump-checklist).

## 7. Leftover starter boilerplate
🟡
- `src/entrypoints/popup/App.css` is mostly unused starter CSS, and its `#root` rules partly conflict with `style.css`.
- `src/app.config.ts` is empty.
- A large commented-out block in `src/entrypoints/background/index.ts:89-114`.
- Portuguese comments in the Firefox prototype.

## 8. No automated tests
🟡

Only `tsc --noEmit` exists. `toTsv` and `escapeCsvField` are pure functions and would be easy to cover with Vitest (WXT has first-class Vitest support).

---

**Related pages:** [Content script](modules/content-script.md) · [Background](modules/background.md) · [Contributing](contributing.md)
