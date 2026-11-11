# Build & Release

> **Summary:** Releases are built with `wxt zip`. The version is hard-coded in more than one place and must be bumped by hand. Store listings depend on `PRIVACY_POLICY.md` matching the extension's actual behavior.

## Version bump checklist

| Location | Current | Notes |
|---|---|---|
| `wxt.config.ts` → `manifest.version` | `'1.3'` | **Source of truth** for the shipped manifest |
| `src/components/Popup.tsx` → `.popup-version` | `v1.3` | Shown in the popup |
| `README.md` → "v1.3 Changelog" | `v1.3` | User-facing changelog |
| `package.json` → `version` | `1.3.0` | Not used by the manifest, because `wxt.config.ts` overrides it. WXT uses it for zip filenames |

Suggested clean-up: remove `version` from `wxt.config.ts` so WXT uses `package.json`, and read it in the popup with `browser.runtime.getManifest().version`. That leaves one source of truth.

`package.json` `name` is `ankignb`. The manifest's `name` (`AnkiGNB`) and `description` come from `wxt.config.ts`. WXT uses the `package.json` `name` for zip filenames.

## Building artifacts

```bash
npm run zip
```

```bash
npm run zip:firefox
```

- Output goes to `.output/`. Chrome gets `<name>-<version>-chrome.zip`. Firefox gets the extension zip plus a `-sources.zip` for AMO review.
- Run `npm run compile` first. The build doesn't type-check.

## Publishing

### Chrome Web Store
- AnkiGNB is **not published yet**. The existing listing (`https://chromewebstore.google.com/detail/ecoealfdeebafjpmhjdlbdgpgegjeaem`) belongs to the original AnkiNLM by lkmss; publish the fork as a new item.
- Upload the Chrome zip in the developer dashboard.
- Permission justifications should match the table in [Browser Support](browser-support.md#chrome-mv3).

### Firefox Add-ons (AMO)
- Not published yet. Firefox is non-functional, see [Browser Support](browser-support.md).
- The gecko ID `ankignb@enesatesim.github.io` must stay stable once published.

## Privacy policy

`PRIVACY_POLICY.md` states: no data collected, nothing transmitted, no cookies or analytics, no third-party services. The only outbound behavior is the user clicking external links (Buy Me a Coffee, the two GitHub links, Google Form). **Any change that adds storage, telemetry or network requests must update this file and the store listings.** The policy links to `https://github.com/enesatesim/ankignb` as the contact repo and credits the original AnkiNLM repo.

## Icons

`public/icon/{16,32,48,64,96,128}.png` are picked up by WXT automatically and written into the manifest `icons`.

---

**Related pages:** [Getting Started](getting-started.md) · [Browser Support](browser-support.md)
