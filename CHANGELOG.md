# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.1]

### Fixed

- Fixed missing buttons in Gemini Notebook by adding support for both `notebook.google.com` and `notebooklm.google.com` (and `.google` top-level domains) in content script matches and host permissions.
- Fixed race condition where iframe flashcard data was dropped if the footer DOM container had not rendered yet.
- Fixed button disappearance upon window resize, tab switching, or Angular re-renders with reactive DOM injection.
- Fixed "Copy CSV" copying raw JSON instead of formatted tab-separated CSV text.
- Added visual "Copied!" feedback on the Copy button.

### Changed

- Made subframe data extraction resilient with `MutationObserver` and periodic polling in background script injection.
- Added full Firefox support in content script and background subframe extractor.
- Bumped extension version to `1.4.1`.

## [1.4.0]

### Changed

- Upgraded WXT `0.20.11` → `0.21.4` (plus `vite ^7`, `web-ext`, `@wxt-dev/module-react ^1.2.2` peer/dep alignment). Requires Node 22+.
- Removed manual `manifest_version` from `wxt.config.ts` — WXT 0.21 ignores it and targets MV3/MV2 defaults automatically.
- Bumped extension version to `1.4.0`.

### Security

- `npm audit` now reports 0 vulnerabilities (was 24: 1 low, 3 moderate, 17 high, 3 critical — all transitive build-time via `wxt`/`vite`, none in shipped runtime deps).


## [1.3.0]

### Changed

- Rebranded from NotebookLM to Gemini Notebook following Google's July 2026 rename.
- Renamed extension from AnkiNLM to AnkiGNB.
- Updated matches, permissions, and host permissions from `notebooklm.google.com` to `notebook.google.com`.
- Renamed `NOTEBOOKLM_DATA` message to `GEMINI_NOTEBOOK_DATA` and `handleNotebookLMData` to `handleGeminiNotebookData`.

## [1.2.0]

### Fixed

- Improved LaTeX compatibility — CSV formatting now preserves LaTeX expressions (`\sin(x)`, `\frac{a}{b}`, etc.) for correct rendering in Anki.
- Better handling of math-dense cards — formulas and equations display accurately after import.

### Changed

- Cleaner CSV output — small refinements for consistency and readability.

[Unreleased]: https://github.com/enesatesim/ankignb/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/enesatesim/ankignb/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/enesatesim/ankignb/releases/tag/v1.2.0
