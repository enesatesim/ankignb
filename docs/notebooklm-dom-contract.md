# NotebookLM DOM Contract

> **Summary:** AnkiNLM depends on undocumented NotebookLM internals: frame URLs, Angular element names, CSS classes and one data attribute. Google can change any of them without notice. When the extension "suddenly stops working", start here.

All entries below are **inferred from the source code**. They are not guaranteed by Google.

## Dependencies

| # | What | Value the code expects | Used in | Breaks → symptom |
|---|---|---|---|---|
| 1 | Host page | `https://notebooklm.google.com/*` | `content/index.ts` `matches`, `wxt.config.ts` host permissions | Content script never loads |
| 2 | Artifact frame URL (Chrome) | Sub-frame (`frameId > 0`) with URL starting `blob:https://` | `background/index.ts:127` | No injection, so no data and no buttons |
| 3 | Artifact frame URL (Firefox prototype) | Contains `usercontent.goog` **and** `shim.html` | `background/index.ts:73-74` | n/a (Firefox not functional) |
| 4 | Sandbox host | `*.usercontent.goog` | `wxt.config.ts` host permissions | `executeScript` permission errors |
| 5 | Data element | `app-root` inside the artifact frame's `document.body` | `background/index.ts:137` | Injected function returns early |
| 6 | Data attribute | `data-app-data` on `app-root`, holding a JSON string | `background/index.ts:140` | No data |
| 7 | Data shape | `{flashcards:[{f,b}]}` or `{quiz:[{question,answerOptions:[{text,isCorrect,…}]}]}` | `src/types.ts`, `utils/typeguards.ts` | Empty file (BOM only) |
| 8 | Viewer element | `<artifact-viewer>` with class `ng-star-inserted`, added dynamically | `content/index.ts:19-22` | `footerContainer` never set, so no buttons |
| 9 | Footer element | `.artifact-viewer-container .artifact-footer` inside the viewer | `content/index.ts:24-26` | No buttons |
| 10 | Button styling | Angular Material MDC classes (`mdc-button`, `mat-mdc-outlined-button`, `mat-icon`, `material-symbols-outlined`, `google-symbols`) and the Google Symbols icon font on the page | `utils/utils.ts:11-37` | Buttons render unstyled, or icon names show as text |
| 11 | Icon ligatures | `copy_all`, `save_alt`, `coffee` | `content/index.ts` | Icon text shown instead of glyph |

## Re-discovering selectors after a NotebookLM update

1. Open a notebook and the Flashcards/Quiz artifact in Studio.
2. **Frames:** DevTools → *Application* → *Frames*, or the console context dropdown. Find the frame that renders the cards and note its URL scheme. Update the filter in `background/index.ts` (Chrome) if it's no longer `blob:https://`.
3. **Data:** switch the console context to that frame and run:
   ```js
   document.querySelector('app-root')?.getAttribute('data-app-data')
   ```
   If that's `null`, search for a large JSON attribute or a `<script type="application/json">` element. Update the injected `func` and, if the shape changed, `src/types.ts`.
4. **Footer:** in the top frame, inspect the bar under the artifact. Update the selector in `content/index.ts`. Also check whether the viewer is still `artifact-viewer`, and whether `ng-star-inserted` still applies.
5. **Styling:** copy the outer HTML of one of NotebookLM's own footer buttons and refresh the template in `createStyledButton`.
6. Run `npm run compile`, rebuild, and do the [manual smoke test](getting-started.md#manual-smoke-test).

## Hardening ideas

- Look up the footer **at click/message time** instead of caching it in the observer. This fixes stale references after resize.
- Wait for `app-root[data-app-data]` in the injected function, using an observer with a timeout.
- Match frames more loosely, but validate the payload shape before posting.
- Check `event.origin` and `event.source` in the content script.

---

**Related pages:** [Architecture](architecture.md) · [Background](modules/background.md) · [Content script](modules/content-script.md) · [Known Issues](known-issues.md)
