# Architecture

## Entrypoints

WXT entrypoints live in `src/entrypoints/`:

1. `background/index.ts` — privileged script, observes navigation and injects into data iframes.
2. `content/index.ts` — runs on `https://notebooklm.google.com/*`, watches the Studio DOM and injects UI.
3. `popup/` (`App.tsx`, `main.tsx`, `index.html`) — informational popup only, no export logic.

Popup component: `src/components/Popup.tsx`.

## Data Flow (Chrome)

1. User opens NotebookLM Studio; flashcard data is rendered inside a `blob:https://` iframe containing `<app-root data-app-data="...">`.
2. Background `chrome.webNavigation.onCommitted` filter (`src/entrypoints/background/index.ts:126`) detects `blob:https://` frames and runs `chrome.scripting.executeScript` in that frame.
3. Injected function reads `data-app-data` and calls `window.parent.postMessage({ type: 'NOTEBOOKLM_DATA', data }, '*')` (`src/entrypoints/background/index.ts:143`).
4. Content script listens for `message` events with `type === 'NOTEBOOKLM_DATA'` (`src/entrypoints/content/index.ts:32`) and calls `handleNotebookLMData(data)`.
5. `handleNotebookLMData` (`src/entrypoints/content/index.ts:48`):
   - `createCsvBlob(data)` (`src/utils/utils.ts:44`) parses JSON and builds the CSV `Blob`.
   - `createStyledButton(...)` (`src/utils/utils.ts:3`) injects Copy / Download / donate buttons into `.artifact-viewer-container .artifact-footer`.
   - Copy writes raw text via `navigator.clipboard.writeText`; Download creates an object URL and clicks a temp `<a download="flashcards.csv">`.

A `MutationObserver` on `document.body` tracks `artifact-viewer.ng-star-inserted` nodes to locate the footer container (`src/entrypoints/content/index.ts:16`).

## Firefox Path

`src/entrypoints/background/index.ts:6` and `src/entrypoints/content/index.ts:5` branch on `import.meta.env.FIREFOX`:

- Background listens for `usercontent.goog` + `shim.html` frames via `browser.webNavigation.onCommitted` and probes them with `browser.tabs.executeScript`. Full extraction is still work-in-progress (no `NOTEBOOKLM_DATA` handling yet).
- Content script currently registers an empty `main()`.

## Key Modules

- `src/types.ts:1` — `QuizData { quiz: { question, answerOptions: { text, rationale, isCorrect }[] }[] }`, `src/types.ts:8` — `FlashcardData { flashcards: { f, b }[] }`.
- `src/utils/typeguards.ts:3` — `isQuizData()`, `src/utils/typeguards.ts:7` — `isFlashcardData()`. Simple shape checks (`'quiz' in data`, `'flashcards' in data`).
- `src/utils/utils.ts:3` — `createStyledButton(parentEl, label, matIcon, classes?, styles?)` builds a NotebookLM-styled `mat-stroked-button` and appends it.
- `src/utils/utils.ts:44` — `createCsvBlob(data: string)` returns `Blob | undefined`. See [CSV Format](./csv-format.md).
