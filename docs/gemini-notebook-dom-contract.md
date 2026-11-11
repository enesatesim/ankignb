# Gemini Notebook DOM Contract

> **Summary:** AnkiGNB depends on undocumented Gemini Notebook (formerly NotebookLM) internals: hosts, frame URLs, Angular element names, CSS classes, icon-font ligatures and one data attribute. Google can change any of them without notice. When the extension "suddenly stops working", start here.

None of this is guaranteed by Google. Values marked ✔ were checked on the live site in November 2026, after the rebrand. Values marked *inferred* could not be read from outside the cross-origin sandbox frame and come from the code that worked before the rebrand.

## Dependencies

| # | What | Value the code expects | Used in | Breaks → symptom |
|---|---|---|---|---|
| 1 | Host page ✔ | `https://notebook.google.com/*` (the old `notebooklm.google.com` redirects here and is kept as a fallback) | `content/index.ts` `MATCHES`, `wxt.config.ts` host permissions | Content script never loads |
| 2 | Artifact frame ✔ | `<iframe sandbox="allow-scripts allow-same-origin allow-forms">` in `artifact-viewer .app-frame-container`, `src` = `https://<hash>.scf.usercontent.goog/notebooklm-apps/shim.html?origin=https://notebook.google.com` | `content/index.ts` `ARTIFACT_FRAME_SELECTOR` | Payload never considered "open"; no buttons |
| 3 | Artifact frame URL (Chrome) *inferred* | Sub-frame (`frameId > 0`) with a URL starting `blob:https://` or on `https://*.usercontent.goog/` | `background/index.ts:129-130` | No injection, so no data and no buttons |
| 4 | Artifact frame URL (Firefox prototype) | Contains `usercontent.goog` **and** `shim.html` | `background/index.ts:73-74` | n/a (Firefox not functional) |
| 5 | Sandbox host ✔ | `*.usercontent.goog` | `wxt.config.ts` host permissions | `executeScript` permission errors |
| 6 | Data element *inferred* | `app-root[data-app-data]` in the artifact frame (waited for up to 10 s) | `background/index.ts:143` | Injected function times out silently |
| 7 | Data shape ✔ | `{flashcards:[{f,b,c}],topics}` or `{quiz:[{question,answerOptions:[{text,isCorrect,…}],hint}],topics}`. `f`/`b` are strings on older artifacts, and `{flashcardContentBlock:[{type:"text",content}]}` on artifacts generated since about November 2026 | `src/types.ts`, `utils/typeguards.ts`, `richTextToString`, `toTsv` | Payload ignored; no buttons on some notebooks only |
| 8 | Viewer element ✔ | `<artifact-viewer>` (now has class `luminous-ui`; the old `ng-star-inserted` check was removed) | `content/index.ts` `FOOTER_SELECTOR` | No buttons |
| 9 | Footer element ✔ | `artifact-viewer .artifact-footer`: `display: flex; flex-wrap: nowrap; overflow: hidden; gap: 16px`, fixed height | `content/index.ts` `FOOTER_SELECTOR`, `utils/fitButtonsToFooter` | No buttons, or buttons clipped |
| 10 | Native footer button ✔ | `<nb-button class="feedback-button has-icon nb-button …">` → `button.mdc-button` → `.nb-button-content` → `mat-icon` + label `<span>` (thumbs up / down) | `utils/createStyledButton` (cloned as a template) | Falls back to a plain outlined button that may not match the theme |
| 11 | Icon ligatures ✔ | `content_copy`, `download`, `local_cafe`, `check` exist in the page's "Luminous Symbols" / "Google Symbols" subset font | `content/index.ts` `injectButtons` | Icon shows as letters |
| 12 | Title inputs ✔ | Notebook: `editable-project-title input.title-input` (fallback: `document.title` = `<notebook> - Gemini Notebook`). Artifact: `artifact-viewer .artifact-header input.artifact-title` (`aria-label="Artifact title"`). Both are read via `.value` | `content/index.ts` `getDownloadFilename` | Download falls back to just one title, or to `flashcards.csv` |

## Re-discovering selectors after a Gemini Notebook update

1. Open a notebook and the Flashcards/Quiz artifact in Studio.
2. **Frames:** DevTools → *Application* → *Frames*, or the console context dropdown. Find the frame that renders the cards and note its URL. Update `isArtifactFrame` in `background/index.ts` and `ARTIFACT_FRAME_SELECTOR` in `content/index.ts` if needed.
3. **Data:** switch the console context to that frame and run:
   ```js
   document.querySelector('app-root')?.getAttribute('data-app-data')
   ```
   If that's `null`, search for a large JSON attribute or a `<script type="application/json">` element. Update the injected `func` and, if the shape changed, `src/types.ts`.

   **Without DevTools frame access** (for example from an automation tool that only runs in the top frame): the parent sends the whole artifact document to the shim as `iframe.contentWindow.postMessage({ body: '<!doctype html>…', mimeType, salt })`. Wrap the `HTMLIFrameElement.prototype.contentWindow` getter in the top frame so it returns a `Proxy` that records `postMessage` calls. Then reopen the artifact and read `data-app-data` out of `body`.
4. **Footer:** in the top frame, inspect the bar under the artifact. Update `FOOTER_SELECTOR` in `content/index.ts`, and the native button selector in `createStyledButton`.
5. **Icons:** a ligature exists in the page font if it renders as a ~20 px glyph. In the top frame:
   ```js
   const cs = getComputedStyle(document.querySelector('.artifact-footer mat-icon'));
   const w = (n) => { const s = document.createElement('span'); s.textContent = n;
     s.style.cssText = `position:absolute;white-space:nowrap;font:${cs.fontSize} ${cs.fontFamily}`;
     document.body.append(s); const r = s.getBoundingClientRect().width; s.remove(); return r; };
   ['content_copy', 'download', 'local_cafe', 'check'].map((n) => [n, w(n)]);
   ```
   Names that measure much wider than the icon size are missing.
6. Run `npm run compile`, rebuild, and do the [manual smoke test](getting-started.md#manual-smoke-test).

## Hardening ideas

- Check `event.origin` and `event.source` in the content script.
- Ship inline SVG icons instead of relying on the page's icon font.

---

**Related pages:** [Architecture](architecture.md) · [Background](modules/background.md) · [Content script](modules/content-script.md) · [Known Issues](known-issues.md)
