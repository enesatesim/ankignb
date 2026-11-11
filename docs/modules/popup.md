# Module: Popup

> **Summary:** The toolbar popup is a static React page. It shows usage help and links (Support, AnkiGNB and AnkiNLM GitHub, Report Issue). It has no state, messaging or extension API calls.

## Files

| File | Role |
|---|---|
| `src/entrypoints/popup/index.html` | HTML shell. `<meta name="manifest.type" content="browser_action">` tells WXT to register it as the action popup on both MV2 and MV3. `<title>` is `AnkiGNB` |
| `src/entrypoints/popup/main.tsx` | `ReactDOM.createRoot(#root)` in `StrictMode`. Imports `style.css` |
| `src/entrypoints/popup/App.tsx` | Wraps `<Popup />` in `.app-container`. Imports `App.css` |
| `src/components/Popup.tsx` | The actual UI |
| `src/entrypoints/popup/style.css` | Real popup styling: dark theme, 380 px wide, `.popup-*`, `.link-button` (wrapping flex row), `.highlight` |
| `src/entrypoints/popup/App.css` | Mostly **leftover Vite/WXT starter CSS** (`.logo`, `.card`, `.read-the-docs`, and `#root { max-width; padding: 2rem; text-align:center }`). `style.css` is imported after it and overrides `#root` padding |

## UI content (`Popup.tsx`)

- Header: **AnkiGNB** and a hard-coded version badge `v1.3`. Keep it in sync with `wxt.config.ts` (see [Build & Release](../build-and-release.md#version-bump-checklist)).
- Info: the Copy and Download buttons appear in the footer of a Flashcards or Quiz artifact in the Gemini Notebook Studio panel.
- Links (all `target="_blank" rel="noopener noreferrer"`):
  - Support: `https://www.buymeacoffee.com/lkmss` (original author)
  - AnkiGNB: `https://github.com/enesatesim/ankignb` (this fork)
  - AnkiNLM: `https://github.com/maialks` (original author)
  - Report Issue: the original author's Google Form
- Footer: `by lkmss · fork by enesatesim`

Icons come from `lucide-react`: `CoffeeIcon`, `GithubIcon`, `InfoIcon`, `Bug`.

## Extending

- If you add settings (for example a filename or delimiter choice), you'll need `storage` permission plus a way for the content script to read it (`browser.storage`). Update `PRIVACY_POLICY.md` if anything new is stored.
- Consider reading the version from `browser.runtime.getManifest().version` instead of hard-coding it.

---

**Related pages:** [Architecture](../architecture.md) · [Known Issues](../known-issues.md)
