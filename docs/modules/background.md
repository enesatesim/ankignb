# Module: Background script

> **Summary:** `src/entrypoints/background/index.ts` watches frame navigations. When Gemini Notebook creates an artifact sub-frame, it injects a function that waits for the artifact JSON and posts it to the parent frame. The Chrome branch works. The Firefox branch is an unfinished prototype.

## Structure

```ts
let backgroundEntrypoint;
if (import.meta.env.FIREFOX) {
  backgroundEntrypoint = defineBackground(() => { /* Firefox prototype */ });
} else {
  backgroundEntrypoint = defineBackground(() => { /* Chrome implementation */ });
}
export default backgroundEntrypoint;
```

`defineBackground` is a WXT auto-import. `import.meta.env.FIREFOX` is a build-time constant, so only one branch survives in each browser's bundle.

## Chrome branch (`index.ts:117-180`)

1. Logs `AnkiGNB background started` and bails out if `chrome.webNavigation` is missing.
2. Subscribes to `chrome.webNavigation.onCommitted`.
3. **Frame filter** (`isArtifactFrame`, `index.ts:129-130`): it ignores the event unless both conditions hold:
   - `details.frameId > 0` (a sub-frame, not the top document), **and**
   - the URL starts with `blob:https://` **or** is an `https://*.usercontent.goog/` URL (the sandbox shim, e.g. `…scf.usercontent.goog/notebooklm-apps/shim.html`).

   It doesn't check that the tab is a Gemini Notebook tab. However, `executeScript` only succeeds where host permissions allow it (`notebook.google.com`, `notebooklm.google.com`, `*.usercontent.goog`), so other sites fail silently into the `catch`.
4. Calls `chrome.scripting.executeScript` with `target: { tabId, frameIds: [frameId] }` and an inline `func`.
5. The injected `func` (it runs **inside the iframe** and can't use closures or imports):
   - If `app-root[data-app-data]` exists, posts it right away.
   - Otherwise it waits with a `MutationObserver` (child list + the `data-app-data` attribute) for up to 10 s, then gives up.
   - Posts `window.parent.postMessage({ type: 'ANKIGNB_DATA', data }, '*')`.

   In frames without artifact data (for example the shim before it swaps to the blob document) it does nothing and times out.
6. Errors are logged to the service worker console.

## Firefox branch (`index.ts:5-116`)

A prototype that targets MV2 APIs:

- Listens to `browser.webNavigation.onCommitted` for sub-frames whose URL contains both `usercontent.goog` and `shim.html`.
- Confirms the frame through `browser.webNavigation.getAllFrames`, then registers a one-shot `onCompleted` listener for that frame (`handleFrameLoad`).
- On completion, `injectIntoFrame` calls `browser.tabs.executeScript` with a **code string**.

**The code string is broken.** It has a stray `}` right after `console.log(document.body.firstChild)`, which closes the `try` early, and it references an undefined variable `found`. It also never calls `postMessage`, so even if it parsed it would not deliver data. On top of that, the Firefox content script `main()` is empty. Treat this branch as a placeholder. A large commented-out alternative (`index.ts:89-114`) also lives here.

See [Browser Support](../browser-support.md) and [Known Issues](../known-issues.md#3-firefox-support-is-non-functional).

## Permissions it relies on (Chrome)

| Permission | Used for |
|---|---|
| `webNavigation` | `onCommitted` events with `frameId` and `url` |
| `scripting` | `chrome.scripting.executeScript` |
| host `https://notebook.google.com/*`, `https://notebooklm.google.com/*`, `https://*.usercontent.goog/*` | Allowing injection into the Gemini Notebook tab and its sandbox frames |

## Editing tips

- The injected `func` is serialized. Anything it uses must be defined **inside** the function body, including the `ANKIGNB_DATA` constant.
- If Gemini Notebook changes its frame URL scheme, step 3 is the first thing to update. See [Gemini Notebook DOM Contract](../gemini-notebook-dom-contract.md).

---

**Related pages:** [Architecture](../architecture.md) · [Content script](content-script.md) · [Browser Support](../browser-support.md)
