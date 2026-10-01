# Development

## Prerequisites

- Node.js (see `../package.json` engines — none pinned; WXT 0.20.x requires Node 18+)
- npm

## Setup

```sh
npm install
```

`postinstall` runs `wxt prepare` to generate `.wxt/` types.

## Scripts (`../package.json`)

| Script | Command |
|---|---|
| `dev` | `wxt` (Chrome, HMR) |
| `dev:firefox` | `wxt -b firefox` |
| `build` | `wxt build` |
| `build:firefox` | `wxt build -b firefox` |
| `zip` / `zip:firefox` | `wxt zip [-b firefox]` (store artifact) |
| `compile` | `tsc --noEmit` (typecheck) |

## Config

- `../wxt.config.ts` — modules (`@wxt-dev/module-react`, `@wxt-dev/webextension-polyfill`), `srcDir: src`, per-browser `manifest()` function.
- `../tsconfig.json` — TypeScript config; `@/*` maps to `src/*` (used in `content/index.ts`, `popup/App.tsx`).
- `../.gitignore` — standard WXT ignores (`.wxt`, `node_modules`, build output).

## Conventions

- Content/background split by `import.meta.env.FIREFOX`; keep Chrome (MV3 `chrome.*`) and Firefox (MV2 `browser.*` polyfill) paths in the same file for now.
- All Gemini Notebook DOM selectors (`artifact-viewer`, `.artifact-footer`, `app-root[data-app-data]`) are coupled to Google's markup — expect breakage on Gemini Notebook redesigns.
- CSV logic stays in `src/utils/utils.ts`; type narrowing in `src/utils/typeguards.ts`.
