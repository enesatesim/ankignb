# Troubleshooting

## Symptoms and Fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| Copy/Download buttons missing | Flashcard/quiz not yet generated or opened in Studio | Generate or open the Flashcards/Quiz panel in Studio. The buttons will appear automatically. |
| Copy does nothing | Clipboard permission denied | Allow clipboard access for Gemini Notebook; use Download instead |
| Garbled characters in Anki | Imported without UTF-8 / BOM handling | Re-import forcing UTF-8; keep the BOM emitted by `createCsvBlob` |
| All text lands in one field | Wrong delimiter selected | Select **Tab** as separator (output is tab-delimited) |
| Math shows as raw `\frac{}` | No LaTeX renderer in Anki | Install a MathJax/LaTeX template (e.g. add-on `2100166052`) |

## Reporting

Use the **Report Issue** link in the popup (`https://forms.gle/GaEgRg9tZ9e2EVco9`) or open a GitHub issue at `https://github.com/enesatesim/ankignb`. Include browser + version, extension version (`v1.4.1`), and whether the Studio output was flashcards or quiz type.

