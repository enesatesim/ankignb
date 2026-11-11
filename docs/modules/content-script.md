# Module: Content script

> **Summary:** `src/entrypoints/content/index.ts` runs in the top frame of Gemini Notebook. It waits for the `ANKIGNB_DATA` message from the artifact iframe, converts the data to TSV, and keeps the **Copy**, **Download** and **Support (coffee)** buttons present in the open artifact's footer, re-adding them whenever Angular re-renders it.

## Definition

```ts
defineContentScript({
  matches: ['https://notebook.google.com/*', 'https://notebooklm.google.com/*'],
  allFrames: true,
  main() { ... },
});
```

- `notebook.google.com` is the current host. `notebooklm.google.com` now redirects there and is kept only as a fallback.
- Chrome only. The Firefox branch (`index.ts:27-31`) defines the same `matches` with an empty `main()`.
- `allFrames: true`, but `main()` returns immediately in sub-frames (`window.top !== window`). Only the top frame has the footer, and the artifact iframe posts to `window.parent`, which is the top frame.
- `runAt` is the WXT default (`document_idle`).

## Runtime behavior (`main`)

State: one `payload` (`{ id, tsv, frame }`) for the most recent artifact, where `frame` is the `<iframe>` element that sent it.

### 1. Message listener (`index.ts:54-67`)

- Accepts only `event.data?.type === 'ANKIGNB_DATA'` with a string `data`.
- Converts with `toTsv` (see [Utilities](utils.md#totsvdata)). Payloads that fail to parse or give zero rows are ignored, so no buttons appear for them.
- `findSourceFrame` matches `event.source` against `artifact-viewer .app-frame-container iframe`. If none matches it falls back to the first such iframe.
- An identical TSV from the same frame is ignored (the background may inject into both the shim document and the blob document).
- Stores the payload with a new `id` and calls `render()`.

### 2. DOM observer (`index.ts:69-79`)

A `MutationObserver` on `document.body` (`childList`, `subtree`) calls `render()` at most once per animation frame. This is what restores the buttons when Angular re-creates the footer (resize, layout change, re-opening the artifact) and what handles a message that arrives before the footer exists.

### 3. `render()` (`index.ts:91-116`)

1. No payload → nothing to do.
2. If the payload's iframe is no longer in the DOM (artifact closed, or another one opened), drop the payload and remove the buttons.
3. Look up `artifact-viewer .artifact-footer` fresh. None → wait for the next mutation.
4. If the footer already has buttons tagged `data-ankignb="<id>"`, stop. Otherwise remove all old `[data-ankignb]` elements and call `injectButtons`.
5. Observe the footer with a `ResizeObserver` and call `fitButtonsToFooter` (labels collapse to icons when the panel is too narrow; see [Utilities](utils.md#fitbuttonstofooterfooter)).

### 4. `injectButtons(footer, tsv, id)` (`index.ts:118-139`)

| Button | Icon | On click |
|---|---|---|
| **Copy** | `content_copy` | `navigator.clipboard.writeText(tsv)` (no BOM), then the icon flashes `check` for 1.5 s |
| **Download** | `download` | `handleDownload(tsv)` |
| Coffee (icon only) | `local_cafe` | Opens `https://buymeacoffee.com/lkmss` (the original AnkiNLM author) |

Each button gets `title` and `aria-label` text and the `data-ankignb` attribute. Icon names must exist in the page's icon font; see [DOM Contract #11](../gemini-notebook-dom-contract.md#dependencies).

### 5. `handleDownload(tsv)` (`index.ts:148-158`)

Creates a fresh object URL on every click, clicks a temporary `<a download="…">`, and revokes the URL a second later, so the button works repeatedly.

### 6. `getDownloadFilename()` (`index.ts:160-169`)

Names the file `<notebook> - <artifact>.csv`, for example `Writing and Evaluating Test Items - Psychometric Testing Flashcards.csv`. Both titles are read at click time, so a renamed notebook or artifact is picked up without reopening it:

- **Notebook:** the value of `editable-project-title input.title-input`, or else `document.title` with the trailing ` - Gemini Notebook` removed.
- **Artifact:** the value of `artifact-viewer .artifact-header input.artifact-title`.

Both are `<input>`s (the titles are editable), so the code reads `.value`, not `textContent`. `buildDownloadFilename` (see [Utilities](utils.md#builddownloadfilenamenotebooktitle-artifacttitle)) cleans the titles and falls back to `flashcards.csv` when neither is found. See [DOM Contract #12](../gemini-notebook-dom-contract.md#dependencies).

## Failure modes to keep in mind

| Situation | Result |
|---|---|
| Footer or viewer selector changes | No buttons. See [DOM Contract](../gemini-notebook-dom-contract.md) |
| Artifact iframe moves out of `.app-frame-container` | Source frame can't be identified; buttons show only while some artifact iframe exists |
| Icon name missing from the page's subset font | The icon shows as its first letter(s) |
| JSON is neither flashcards nor quiz | Ignored; no buttons |

---

**Related pages:** [Background](background.md) · [Utilities](utils.md) · [Gemini Notebook DOM Contract](../gemini-notebook-dom-contract.md)
