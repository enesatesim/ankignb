# Architecture

## Entrypoints

WXT entrypoints live in `src/entrypoints/`:

1. `background/index.ts` — privileged script, observes subframe navigation (`webNavigation`) and injects DOM observer into data iframes.
2. `content/index.ts` — runs on `notebook.google.com`, `notebooklm.google.com`, etc., watches the Studio DOM and reactively injects UI.
3. `popup/` (`App.tsx`, `main.tsx`, `index.html`) — informational popup only, no export logic.

Popup component: `src/components/Popup.tsx`.

## Data Flow (Chrome & Firefox)

1. User opens Gemini Notebook Studio; flashcard data is rendered inside a `blob:` or `usercontent.goog` iframe containing `<app-root data-app-data="...">`.
2. Background `webNavigation.onCommitted` and `onCompleted` listeners detect subframe navigation and inject `extractAndPostNotebookData`.
3. Injected function reads `data-app-data` (using an immediate check, `MutationObserver`, and polling fallback) and calls `window.parent.postMessage({ type: 'GEMINI_NOTEBOOK_DATA', data }, '*')` (as well as legacy `NOTEBOOKLM_DATA`).
4. Content script listens for `message` events, stores `currentData`, and executes `updateUI()`.
5. `updateUI()`:
   - Finds `.artifact-viewer-container .artifact-footer`, `artifact-viewer .artifact-footer`, or `.artifact-footer`.
   - Idempotently mounts `.ankignb-actions-container` containing Copy CSV, Download CSV, and Support buttons.
   - Preserves buttons across window resizes, tab switches, and Angular re-renders via `MutationObserver` on `document.body` and a `resize` listener.
   - Copy generates formatted tab-separated CSV text via `generateCsvString(data)` and writes it via `navigator.clipboard.writeText`.
   - Download generates UTF-8 BOM CSV via `createCsvBlob(data)` and downloads `flashcards.csv`.

## Key Modules

- `src/types.ts:1` — `QuizData { quiz: { question, answerOptions: { text, rationale, isCorrect }[] }[] }`, `src/types.ts:8` — `FlashcardData { flashcards: { f, b }[] }`.
- `src/utils/typeguards.ts:3` — `isQuizData()`, `src/utils/typeguards.ts:7` — `isFlashcardData()`. Simple shape checks (`'quiz' in data`, `'flashcards' in data`).
- `src/utils/utils.ts:3` — `createStyledButton(parentEl, label, matIcon, classes?, styles?)` builds a Gemini Notebook-styled `mat-stroked-button` and appends it.
- `src/utils/utils.ts:40` — `escapeCsvField(field: string)` handles quotes, tabs, and newlines.
- `src/utils/utils.ts:48` — `generateCsvString(data: string)` parses JSON flashcards/quiz into tab-delimited CSV text.
- `src/utils/utils.ts:89` — `createCsvBlob(data: string)` returns `Blob | undefined`. See [CSV Format](./csv-format.md).

