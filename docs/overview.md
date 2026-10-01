# Overview

**AnkiNLM** is a lightweight browser extension that adds **Copy CSV** and **Download CSV** buttons to the NotebookLM Studio flashcard panel footer. One click produces a file ready for Anki import.

## Features

- One-click CSV export from NotebookLM Studio
- Copy to clipboard or download as `flashcards.csv`
- Anki-compatible field mapping (Front / Back)
- Preserves LaTeX (`\sin(x)`, `\frac{a}{b}`, etc.)
- Handles math-dense cards and quiz-type outputs
- No data collection — runs locally in the browser

## Stack

- [WXT](https://wxt.dev/) `^0.20.11` (extension framework, `srcDir: src`)
- React `^19.1.1` + `@wxt-dev/module-react`
- TypeScript `^5.9.2`
- `webextension-polyfill` / `@wxt-dev/webextension-polyfill`
- `lucide-react` (popup icons)

See `../package.json` and `../wxt.config.ts`.

## Project Layout

```text
src/
  app.config.ts            # currently empty
  types.ts                 # FlashcardData, QuizData
  utils/
    utils.ts               # createStyledButton, createCsvBlob
    typeguards.ts           # isFlashcardData, isQuizData
  components/
    Popup.tsx              # popup UI
  entrypoints/
    background/index.ts    # webNavigation + iframe injection
    content/index.ts        # footer buttons + CSV handling
    popup/                 # App.tsx, main.tsx, index.html, style.css, App.css
public/                    # static assets
.wxt/                      # WXT generated types / build output
```

## Manifest Summary

Defined in `../wxt.config.ts`:

- Name: `AnkiNLM`, version `1.2`
- Chrome: `manifest_version` 3, permissions `scripting`, `clipboardWrite`, `webNavigation`, host permissions for `notebooklm.google.com` and `*.usercontent.goog`
- Firefox: `manifest_version` 2, permissions `activeTab`, `tabs`, `clipboardWrite`, `webNavigation` + NotebookLM/usercontent hosts, `gecko.id: ankinlm@lkmss.dev`
