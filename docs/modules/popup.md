# Module: Popup

> **Summary:** The toolbar popup is a static React page. It shows usage help, a known-issue warning, and links (Support, GitHub, Report Issue). It has no state, messaging or extension API calls.

## Files

| File | Role |
|---|---|
| `src/entrypoints/popup/index.html` | HTML shell. `<meta name="manifest.type" content="browser_action">` tells WXT to register it as the action popup on both MV2 and MV3. `<title>` is still `Default Popup Title` |
| `src/entrypoints/popup/main.tsx` | `ReactDOM.createRoot(#root)` in `StrictMode`. Imports `style.css` |
| `src/entrypoints/popup/App.tsx` | Wraps `<Popup />` in `.app-container`. Imports `App.css` |
| `src/components/Popup.tsx` | The actual UI |
| `src/entrypoints/popup/style.css` | Real popup styling: dark theme, 380 px wide, `.popup-*`, `.link-button`, `.highlight` |
| `src/entrypoints/popup/App.css` | Mostly **leftover Vite/WXT starter CSS** (`.logo`, `.card`, `.read-the-docs`, and `#root { max-width; padding: 2rem; text-align:center }`). `style.css` is imported after it and overrides `#root` padding |

## UI content (`Popup.tsx`)

- Header: **AnkiNLM** and a hard-coded version badge `v1.2`. Keep it in sync with `wxt.config.ts` (see [Build & Release](../build-and-release.md#version-bump-checklist)).
- Info: the Copy and Download buttons appear in the NotebookLM Studio footer.
- Warning: resizing the window may make the buttons disappear; refresh the page. A "history section" is planned.
- Links (all `target="_blank" rel="noopener noreferrer"`):
  - Support: `https://www.buymeacoffee.com/lkmss`
  - GitHub: `https://github.com/maialks`
  - Report Issue: a Google Form
- Footer: `by lkmss`

Icons come from `lucide-react`: `CoffeeIcon`, `GithubIcon`, `InfoIcon`, `AlertCircleIcon`, `Bug`.

## Extending

- If you add settings (for example a filename or delimiter choice), you'll need `storage` permission plus a way for the content script to read it (`browser.storage`). Update `PRIVACY_POLICY.md` if anything new is stored.
- Consider reading the version from `browser.runtime.getManifest().version` instead of hard-coding it.

---

**Related pages:** [Architecture](../architecture.md) · [Known Issues](../known-issues.md)
