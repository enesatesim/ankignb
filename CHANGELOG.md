# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
