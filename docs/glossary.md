# Glossary

> **Summary:** Terms used across the codebase and this wiki.

| Term | Meaning |
|---|---|
| **AnkiNLM** | This extension's product name. The repo folder is `ankignb` |
| **NotebookLM** | Google's AI notebook app at `notebooklm.google.com` |
| **Studio** | The NotebookLM panel that generates artifacts (flashcards, quizzes, audio overviews, …) from a notebook's sources |
| **Artifact** | One generated Studio output. AnkiNLM handles the *Flashcards* and *Quiz* artifacts |
| **`artifact-viewer`** | NotebookLM's Angular component that shows an opened artifact. Its `.artifact-footer` is where the buttons are injected |
| **Artifact iframe / sandbox frame** | The sub-frame NotebookLM uses to render artifact content. It's observed as a `blob:https://` URL on Chrome, or a `*.usercontent.goog/.../shim.html` URL (the Firefox code's assumption) |
| **`usercontent.goog`** | Google's sandbox domain for untrusted or user-generated content |
| **`app-root[data-app-data]`** | The root Angular element inside the artifact iframe. Its `data-app-data` attribute holds the artifact JSON |
| **`NOTEBOOKLM_DATA`** | The `type` of the `postMessage` the injected reader sends to the parent frame |
| **`ng-star-inserted`** | A class Angular adds to elements inserted by structural directives (`*ngIf`, `*ngFor`). Used as a "freshly rendered" marker |
| **MDC / Angular Material** | Google's Material Design component library. Footer buttons reuse its CSS classes |
| **Material Symbols** | The icon font. Icons are chosen by ligature name (`copy_all`, `save_alt`, `coffee`) |
| **Anki** | Spaced-repetition flashcard app. It imports delimited text files where each column maps to a note **field** |
| **Front / Back** | The two fields of Anki's *Basic* note type. Column 1 → Front, column 2 → Back |
| **BOM** | Byte Order Mark (`﻿`), prepended so importers detect UTF-8 |
| **TSV** | Tab-separated values. This is what AnkiNLM actually writes, despite the `.csv` name |
| **WXT** | The web-extension framework (Vite-based) used for builds, the manifest, entrypoints and auto-imports |
| **Entrypoint** | A WXT unit (background, content script, popup) under `src/entrypoints/` |
| **MV2 / MV3** | Chrome extension Manifest Version 2 / 3. Chrome builds use MV3, Firefox builds use MV2 |
| **`import.meta.env.FIREFOX`** | WXT build-time flag. It's `true` when building with `-b firefox` |
| **Better Markdown Anki** | A recommended third-party Anki add-on (ID `2100166052`) for rendering LaTeX/Markdown |

---

**Related pages:** [Home](README.md) · [Architecture](architecture.md)
