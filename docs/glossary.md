# Glossary

> **Summary:** Terms used across the codebase and this wiki.

| Term | Meaning |
|---|---|
| **AnkiGNB** | This extension's product name. The repo folder is `ankignb` |
| **AnkiNLM** | The original extension by lkmss that AnkiGNB is forked from |
| **Gemini Notebook** | Google's AI notebook app at `notebook.google.com`. Formerly **NotebookLM** at `notebooklm.google.com`, which now redirects |
| **Studio** | The Gemini Notebook panel that generates artifacts (flashcards, quizzes, audio overviews, …) from a notebook's sources |
| **Artifact** | One generated Studio output. AnkiGNB handles the *Flashcards* and *Quiz* artifacts |
| **`artifact-viewer`** | Gemini Notebook's Angular component that shows an opened artifact. Its `.artifact-footer` is where the buttons are injected |
| **Artifact iframe / sandbox frame** | The sub-frame Gemini Notebook uses to render artifact content. Its `src` is `*.scf.usercontent.goog/notebooklm-apps/shim.html`; on Chrome the artifact is then shown from a `blob:https://` document |
| **`usercontent.goog`** | Google's sandbox domain for untrusted or user-generated content |
| **`app-root[data-app-data]`** | The root Angular element inside the artifact iframe. Its `data-app-data` attribute holds the artifact JSON |
| **`ANKIGNB_DATA`** | The `type` of the `postMessage` the injected reader sends to the parent frame |
| **`data-ankignb`** | Attribute on every button AnkiGNB injects, used to find, de-duplicate and remove them |
| **`nb-button`** | Gemini Notebook's button component. The footer's thumbs up / down `nb-button`s are cloned as templates for AnkiGNB's buttons |
| **MDC / Angular Material** | Google's Material Design component library. Footer buttons reuse its CSS classes |
| **Luminous / Google Symbols** | The page's subset icon font. Icons are chosen by ligature name (`content_copy`, `download`, `local_cafe`) and only names the page itself uses exist |
| **Anki** | Spaced-repetition flashcard app. It imports delimited text files where each column maps to a note **field** |
| **Front / Back** | The two fields of Anki's *Basic* note type. Column 1 → Front, column 2 → Back |
| **BOM** | Byte Order Mark (`﻿`), prepended so importers detect UTF-8 |
| **TSV** | Tab-separated values. This is what AnkiGNB actually writes, despite the `.csv` name |
| **WXT** | The web-extension framework (Vite-based) used for builds, the manifest, entrypoints and auto-imports |
| **Entrypoint** | A WXT unit (background, content script, popup) under `src/entrypoints/` |
| **MV2 / MV3** | Chrome extension Manifest Version 2 / 3. Chrome builds use MV3, Firefox builds use MV2 |
| **`import.meta.env.FIREFOX`** | WXT build-time flag. It's `true` when building with `-b firefox` |
| **Better Markdown Anki** | A recommended third-party Anki add-on (ID `2100166052`) for rendering LaTeX/Markdown |

---

**Related pages:** [Home](README.md) · [Architecture](architecture.md)
