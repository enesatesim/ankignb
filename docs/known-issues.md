# Known Issues & Tech Debt

> **Summary:** Bugs and rough edges found by reading the source as of v1.2. Each entry has a location, its impact and a suggested fix. Check here before reporting or "fixing" something, and update this page when an issue is resolved.

Severity: 🔴 user-visible bug · 🟠 robustness/security · 🟡 cleanup

---

## 1. Copy button copies raw JSON, not the CSV
🔴 · `src/entrypoints/content/index.ts:53-55`

`navigator.clipboard.writeText(data)` writes the original JSON string, but the README advertises "Copy CSV".
**Fix:** write the TSV text instead. Either have `createCsvBlob` also return the string, or call `await blob.text()`. Decide whether to strip the BOM for clipboard use.

## 2. Buttons are appended on every message (duplicates)
🔴 · `src/entrypoints/content/index.ts:48-75`

Each `NOTEBOOKLM_DATA` message appends a fresh Copy, Download and Coffee set to the same footer. Re-rendered or re-opened artifacts can show duplicate buttons, and old buttons keep stale data.
**Fix:** tag injected buttons (for example a `data-ankinlm` attribute or a wrapper element), remove the old ones before inserting, or update their handlers in place.

## 3. Buttons disappear after resize / footer reference goes stale
🔴 · `src/entrypoints/content/index.ts:15-30`

`footerContainer` is captured once, when `artifact-viewer` is inserted. If Angular re-creates the footer (for example on resize or layout change), the buttons are lost and nothing re-injects them. The popup tells users to refresh the page.
**Fix:** cache the last payload. Re-query the footer whenever the DOM changes, and re-inject if the buttons are missing.

## 4. `postMessage` is not origin-checked
🟠 · `src/entrypoints/background/index.ts:143-149`, `src/entrypoints/content/index.ts:32-34`

The sender uses target origin `'*'`. The receiver accepts any message with `type === 'NOTEBOOKLM_DATA'` from any frame or window, and assumes `event.data` is non-null. Another frame on the page could feed arbitrary JSON (the impact is limited to the exported file). A non-object `event.data` throws.
**Fix:** check `event.data?.type`. Validate `event.source` against known iframes or check that `event.origin` is the expected sandbox origin. Validate the parsed shape before use.

## 5. Download works only once per render
🔴 · `src/entrypoints/content/index.ts:38-46,57-60`

One object URL is created per render, and `handleDownload` revokes it after the first click. A second click downloads nothing.
**Fix:** create the object URL inside the click handler, or don't revoke it until the buttons are replaced.

## 6. Firefox support is non-functional
🔴 · `src/entrypoints/background/index.ts:5-116`, `src/entrypoints/content/index.ts:5-9`

The injected code string has a syntax error (a stray `}` after `console.log(...)`) and references an undefined `found`. It never posts data. The Firefox content script `main()` is empty.
**Fix:** see [Browser Support → What's needed](browser-support.md#whats-needed-to-make-firefox-work).

## 7. Race: data can arrive before the footer exists
🟠 · `src/entrypoints/content/index.ts:50`

If the iframe message arrives before `artifact-viewer` is inserted, `handleNotebookLMData` returns early and the data is lost.
**Fix:** store the last payload and inject when the footer appears (combine with #3).

## 8. Injected reader doesn't wait for `app-root`
🟠 · `src/entrypoints/background/index.ts:135-150`

The function runs once, right after `onCommitted`. If the attribute isn't rendered yet, it silently does nothing.
**Fix:** wait for `app-root[data-app-data]` with a MutationObserver and a timeout.

## 9. Unhandled parse errors and shallow validation
🟠 · `src/utils/utils.ts:45`, `src/utils/typeguards.ts`

`JSON.parse` isn't wrapped in try/catch, and the type guards only check that the top-level arrays exist. A missing `f`, `b` or `question` throws in `escapeCsvField`. Unknown shapes produce an empty (BOM-only) file while still showing buttons.
**Fix:** use try/catch, validate items, and skip injection or show a message when there are zero rows.

## 10. Quiz export is lossy and misnamed
🟡 · `src/utils/utils.ts:65-73`, `src/entrypoints/content/index.ts:41`

Quiz rows keep only the question and the correct answer (no distractors or rationale), and the file is still called `flashcards.csv`. This is a product limitation, not necessarily a bug.

## 11. "CSV" file is tab-separated
🟡 · `src/utils/utils.ts:61,71`

The `.csv` extension and `text/csv` MIME type, combined with tab delimiters, can confuse spreadsheet apps (Anki handles it). Consider `.tsv` / `text/tab-separated-values`, or document it clearly (done in [Data Formats](data-formats.md)).

## 12. Version hard-coded in several places
🟡 · `wxt.config.ts:11`, `src/components/Popup.tsx:9`, `package.json:5`

See [Build & Release → Version bump checklist](build-and-release.md#version-bump-checklist).

## 13. Leftover starter boilerplate
🟡
- `package.json` `name: "wxt-react-starter"`, `description: "manifest.json description"`.
- `src/entrypoints/popup/index.html` `<title>Default Popup Title</title>`.
- `src/entrypoints/popup/App.css` is mostly unused starter CSS, and its `#root` rules partly conflict with `style.css`.
- `src/app.config.ts` is empty.
- A large commented-out block in `src/entrypoints/background/index.ts:89-114`.
- Portuguese comments and log messages mixed with English.

## 14. `createStyledButton` markup tied to an old NotebookLM build
🟡 · `src/utils/utils.ts:11-37`

The markup hard-codes Angular scoped attributes (`_ngcontent-ng-c…`), sets `aria-label="Copy JSON"` on every button (an accessibility bug for Download and Coffee), and interpolates `label` and `matIcon` into `innerHTML` unescaped (safe today because all call sites pass constants).
**Fix:** build the element with `document.createElement`, and set a per-button `aria-label`.

## 15. No automated tests
🟡

Only `tsc --noEmit` exists. `createCsvBlob` and `escapeCsvField` are pure functions and would be easy to cover with Vitest (WXT has first-class Vitest support).

---

**Related pages:** [Content script](modules/content-script.md) · [Background](modules/background.md) · [Contributing](contributing.md)
