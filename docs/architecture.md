# Architecture

> **Summary:** Three WXT entrypoints work together. The **background** script injects a reader into NotebookLM's sandboxed `blob:` iframe. The reader posts the artifact JSON to the parent frame. The **content** script converts that JSON to a TSV file and injects buttons into the NotebookLM UI. The **popup** is static info only.

## Components

| Component | File | Runs in | Responsibility |
|---|---|---|---|
| Background | `src/entrypoints/background/index.ts` | Extension service worker (Chrome) / background page (Firefox) | Detects NotebookLM artifact sub-frames and injects the data-reader function into them |
| Content script | `src/entrypoints/content/index.ts` | Every frame of `https://notebooklm.google.com/*` (`allFrames: true`) | Finds the artifact footer, listens for `NOTEBOOKLM_DATA`, builds the file, injects the buttons |
| Popup | `src/entrypoints/popup/*`, `src/components/Popup.tsx` | Toolbar popup | Static help text and links. No logic |
| Utilities | `src/utils/utils.ts`, `src/utils/typeguards.ts` | Bundled into the content script | DOM button factory, JSON → TSV conversion, type guards |
| Types | `src/types.ts` | n/a | Shapes of the NotebookLM artifact JSON |
| Manifest config | `wxt.config.ts` | Build time | Per-browser manifest (MV3 for Chrome, MV2 for Firefox) |

## Why an iframe injection?

NotebookLM Studio renders each generated artifact (flashcards, quiz) in a **sandboxed sub-frame**. As observed by the code, the frame URL starts with `blob:https://` on Chrome, and the Firefox code looks for `*.usercontent.goog/.../shim.html`. Inside that frame, an Angular `<app-root>` element carries the full artifact payload as a JSON string in its `data-app-data` attribute.

Static content scripts can't reliably reach a `blob:` frame, because its origin and URL don't match the manifest `matches`. So the background script watches `webNavigation.onCommitted` and calls `chrome.scripting.executeScript` against that exact `frameId`. The injected function can't call extension APIs or share memory with the content script, so it hands the data over with `window.parent.postMessage`.

> The iframe/blob/usercontent.goog details are **inferred from the code**, not from Google documentation. See [NotebookLM DOM Contract](notebooklm-dom-contract.md).

## End-to-end flow (Chrome)

```mermaid
sequenceDiagram
    autonumber
    participant NLM as NotebookLM page (top frame)
    participant CS as Content script (top frame)
    participant BG as Background (service worker)
    participant IF as Artifact iframe (blob:https://...)

    CS->>NLM: MutationObserver on document.body
    NLM-->>CS: <artifact-viewer class="ng-star-inserted"> added
    CS->>CS: footerContainer = .artifact-viewer-container .artifact-footer
    NLM->>IF: create sub-frame (blob: URL)
    IF-->>BG: webNavigation.onCommitted (frameId > 0, url starts "blob:https://")
    BG->>IF: scripting.executeScript(func)
    IF->>IF: read app-root[data-app-data]
    IF->>CS: window.parent.postMessage({type:'NOTEBOOKLM_DATA', data}, '*')
    CS->>CS: createCsvBlob(data) → Blob (TSV + BOM)
    CS->>NLM: append Copy / Download / Coffee buttons to footer
```

Ordering matters. `footerContainer` must be set (steps 1–3) **before** the message arrives (step 7). Otherwise `handleNotebookLMData` returns early and no buttons are shown. See [Known Issues](known-issues.md).

## Message contract

Sent by the background-injected function (`src/entrypoints/background/index.ts:143`):

```ts
window.parent.postMessage(
  { type: 'NOTEBOOKLM_DATA', data: string /* raw JSON from data-app-data */ },
  '*'
);
```

Received by the content script (`src/entrypoints/content/index.ts:32`):

```ts
window.addEventListener('message', (event) => {
  if (event.data.type === 'NOTEBOOKLM_DATA') handleNotebookLMData(event.data.data);
});
```

- `data` is the **unparsed** JSON string. It's parsed inside `createCsvBlob`.
- Neither side checks the origin (target origin `'*'`, no `event.origin` check). See [Known Issues](known-issues.md#4-postmessage-is-not-origin-checked).

## Repository layout

```
.
├── wxt.config.ts            # Manifest generation per browser
├── package.json             # Scripts & deps (name/description still WXT starter defaults)
├── tsconfig.json            # Extends .wxt/tsconfig.json (generated)
├── PRIVACY_POLICY.md        # Store-facing privacy statement
├── README.md                # End-user README
├── public/icon/*.png        # 16/32/48/64/96/128 px icons (auto-picked by WXT)
├── docs/                    # ← this wiki
└── src/
    ├── app.config.ts        # Empty
    ├── types.ts             # QuizData, FlashcardData
    ├── components/
    │   └── Popup.tsx        # Popup UI
    ├── utils/
    │   ├── utils.ts         # createStyledButton, createCsvBlob
    │   └── typeguards.ts    # isQuizData, isFlashcardData
    └── entrypoints/
        ├── background/index.ts
        ├── content/index.ts
        └── popup/
            ├── index.html   # <meta name="manifest.type" content="browser_action">
            ├── main.tsx     # React root
            ├── App.tsx
            ├── App.css      # Mostly leftover starter CSS
            └── style.css    # Real popup styles
```

## Browser split

Both the background and content entrypoints branch on `import.meta.env.FIREFOX` at module level and export a different `define*()` result per browser. The Chrome branch is the working implementation. The Firefox branch is an unfinished prototype. See [Browser Support](browser-support.md).

---

**Related pages:** [Background](modules/background.md) · [Content script](modules/content-script.md) · [Data Formats](data-formats.md) · [NotebookLM DOM Contract](notebooklm-dom-contract.md)
