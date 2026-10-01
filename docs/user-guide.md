# User Guide

## Install

- **Chrome Web Store:** linked in `../README.md`
- **Firefox Add-ons:** pending (see manifest `gecko` block in `../wxt.config.ts`)
- **From source:** `npm install && npm run build`, then load the output folder as an unpacked extension.

## Export from NotebookLM

1. Open a NotebookLM Studio with generated flashcards.
2. Scroll to the flashcard section footer.
3. Click **Download CSV** (saves `flashcards.csv`) or **Copy CSV** (copies to clipboard).
4. Optional coffee/donate button opens `https://buymeacoffee.com/lkmss`.

Popup (`src/components/Popup.tsx`) is informational only — export buttons live on the NotebookLM page, not in the popup.

## Import into Anki

Map fields as **Field 1 → Front**, **Field 2 → Back**.

### Anki Desktop (Windows / macOS / Linux)

1. **File → Import**
2. Select the CSV
3. Set Field 1 = Front, Field 2 = Back
4. Confirm

### AnkiMobile / AnkiDroid

Transfer/paste the CSV to the device, then import directly or via AnkiWeb sync.

### AnkiWeb

Open/create a deck → **Add → Import File**.

## Math Rendering

For LaTeX/MathJax output install a renderer. Recommended in `../README.md`: **Better Markdown Anki**, add-on ID `2100166052`. AnkiNLM is not affiliated with it — any LaTeX-compatible template works.
