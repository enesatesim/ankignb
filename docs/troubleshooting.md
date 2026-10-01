# Troubleshooting

Known issue surfaced in `src/components/Popup.tsx:26`:

> Resizing the window may cause the buttons to disappear. If this happens, refresh the page.

## Symptoms and Fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| Copy/Download buttons missing | Footer re-rendered (resize / Studio navigation); `footerContainer` reference stale (`src/entrypoints/content/index.ts:15`) | Refresh the Gemini Notebook page |
| Copy does nothing | Clipboard permission denied | Allow clipboard access for Gemini Notebook; use Download instead |
| Garbled characters in Anki | Imported without UTF-8 / BOM handling | Re-import forcing UTF-8; keep the BOM emitted by `createCsvBlob` |
| All text lands in one field | Wrong delimiter selected | Select **Tab** as separator (output is tab-delimited) |
| Math shows as raw `\frac{}` | No LaTeX renderer in Anki | Install a MathJax/LaTeX template (e.g. add-on `2100166052`) |
| Nothing happens (Firefox) | Firefox extraction path incomplete (`src/entrypoints/background/index.ts:6`) | Use Chrome for now |

## Reporting

Use the **Report Issue** link in the popup (`https://forms.gle/GaEgRg9tZ9e2EVco9`) or open a GitHub issue at `https://github.com/enesatesim/ankignb`. Include browser + version, extension version (`v1.3.0` in `src/components/Popup.tsx:9`), and whether the Studio output was flashcards or quiz type.
