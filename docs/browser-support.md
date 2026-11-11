# Browser Support

> **Summary:** Chrome and Chromium browsers (Manifest V3) are supported and published on the Chrome Web Store. Firefox (Manifest V2) has a build target and manifest config, but its runtime code is an unfinished prototype and **does not work**.

## Status matrix

| | Chrome / Chromium | Firefox |
|---|---|---|
| Manifest version | 3 | 2 |
| Build output | `.output/chrome-mv3/` | `.output/firefox-mv2/` |
| Background | Service worker, `chrome.scripting.executeScript` | Background page, `browser.tabs.executeScript` (code string) |
| Content script | Full implementation | Empty `main()` |
| Frame detection | URL starts `blob:https://` | URL contains `usercontent.goog` + `shim.html` |
| Status | ✅ Working (store: [Chrome Web Store](https://chromewebstore.google.com/detail/ecoealfdeebafjpmhjdlbdgpgegjeaem)) | ❌ Non-functional ("Soon" in README) |

The branch is chosen at build time with `import.meta.env.FIREFOX` in both `background/index.ts` and `content/index.ts`. The manifest is chosen in `wxt.config.ts` with the `browser` argument.

## Manifest per browser (`wxt.config.ts`)

### Chrome (MV3)

```ts
permissions: ['scripting', 'clipboardWrite', 'webNavigation'],
host_permissions: ['https://notebooklm.google.com/*', 'https://*.usercontent.goog/*'],
```

| Permission | Why |
|---|---|
| `scripting` | Inject the data reader into the artifact iframe |
| `webNavigation` | Detect artifact sub-frame navigations and get their `frameId` |
| `clipboardWrite` | Copy button |
| `notebooklm.google.com` host | Content script and injection into the tab |
| `*.usercontent.goog` host | NotebookLM's sandbox domain |

### Firefox (MV2)

- `permissions` combines API and host permissions (MV2 style): `activeTab`, `tabs`, `clipboardWrite`, `webNavigation`, and several overlapping `usercontent.goog` patterns, including `…/shim.html*`.
- `browser_specific_settings.gecko`: `id: 'ankinlm@lkmss.dev'`, `strict_min_version: '109.0'`.

## What's needed to make Firefox work

1. Fix the injected code in `background/index.ts`. It has a stray `}` and an undefined `found`. Make it read `app-root[data-app-data]` and `postMessage` to the parent, like the Chrome version. Prefer `func`-style injection (`browser.scripting` is available in Firefox 102+ under MV3) over code strings.
2. Implement the Firefox content script. It can most likely reuse the Chrome `main()` unchanged.
3. Consider moving Firefox to MV3 so both branches share one implementation, then delete the `import.meta.env.FIREFOX` split.
4. Confirm how NotebookLM serves the artifact frame in Firefox (blob vs. usercontent.goog shim).
5. Run `npm run dev:firefox` and do the [manual smoke test](getting-started.md#manual-smoke-test).

---

**Related pages:** [Background](modules/background.md) · [Build & Release](build-and-release.md) · [Known Issues](known-issues.md#6-firefox-support-is-non-functional)
