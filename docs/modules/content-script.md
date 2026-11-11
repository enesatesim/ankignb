# Module: Content script

> **Summary:** `src/entrypoints/content/index.ts` runs in every frame of NotebookLM. It tracks the artifact footer element, waits for the `NOTEBOOKLM_DATA` message from the artifact iframe, then converts the data and injects the **Copy**, **Download** and **Support (coffee)** buttons.

## Definition

```ts
defineContentScript({
  matches: ['https://notebooklm.google.com/*'],
  allFrames: true,
  main() { ... },
});
```

- Chrome only. The Firefox branch (`index.ts:5-9`) defines the same `matches` with an empty `main()`.
- `allFrames: true` means an instance also runs in any NotebookLM-origin sub-frames. In practice the top frame does the work.
- `runAt` is the WXT default (`document_idle`).

## Runtime behavior (`main`)

### 1. Footer discovery (`index.ts:15-36`)

A `MutationObserver` on `document.body` (`childList`, `subtree`) looks at every **added** node. When one matches `artifact-viewer` and has the class `ng-star-inserted` (an Angular marker for nodes inserted by structural directives), it stores:

```ts
footerContainer = node.querySelector('.artifact-viewer-container .artifact-footer');
```

The observer is never disconnected, and only the most recently inserted `artifact-viewer` is remembered.

### 2. Message listener (`index.ts:32-34`)

```ts
window.addEventListener('message', (event) => {
  if (event.data.type === 'NOTEBOOKLM_DATA') handleNotebookLMData(event.data.data);
});
```

There's no origin or shape validation. A message whose `data` is `null` would throw on `.type`.

### 3. `handleNotebookLMData(data: string)` (`index.ts:48-75`)

1. `createCsvBlob(data)` parses the JSON and returns a TSV `Blob` (see [Utilities](utils.md#createcsvblobdata) and [Data Formats](../data-formats.md)).
2. It returns early if there's no blob **or no `footerContainer` yet**.
3. **Copy** button (`copy_all` icon): `navigator.clipboard.writeText(data)`. Note that this writes the **raw JSON**, not the TSV ([Known Issue #1](../known-issues.md#1-copy-button-copies-raw-json-not-the-csv)).
4. **Download** button (`save_alt` icon): creates one object URL up front, and `handleDownload(url)` clicks a temporary `<a download="flashcards.csv">`, then **revokes** the URL ([Known Issue #5](../known-issues.md#5-download-works-only-once-per-render)).
5. **Coffee** button (`coffee` icon, no label, `title="Buy Creator a Coffe :)"`): opens `https://buymeacoffee.com/lkmss`.
6. Every child of the footer (including NotebookLM's own buttons) gets inline styles: `padding: 0 20px`, `margin-right: 10px`, `color: #fff`.

### 4. `handleDownload(url)` (`index.ts:38-46`)

The standard anchor-click download. The filename is hard-coded to `flashcards.csv`, even for quiz data.

## Failure modes to keep in mind

| Situation | Result |
|---|---|
| Message arrives before `artifact-viewer` is inserted | No buttons (early return) |
| Same artifact re-renders, or another artifact is opened | Another full set of buttons is appended (duplicates) |
| Window resize causes Angular to re-create the footer | `footerContainer` points to a detached node, so the buttons vanish (documented in the popup) |
| `data-app-data` is not valid JSON | `JSON.parse` throws inside the listener and nothing is shown |
| JSON is neither flashcards nor quiz | An empty blob (BOM only); buttons are still shown |

All of these are tracked in [Known Issues](../known-issues.md).

---

**Related pages:** [Background](background.md) · [Utilities](utils.md) · [NotebookLM DOM Contract](../notebooklm-dom-contract.md)
