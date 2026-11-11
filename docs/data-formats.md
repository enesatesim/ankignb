# Data Formats

> **Summary:** Input is the JSON string from NotebookLM's `app-root[data-app-data]` attribute, in either flashcard or quiz shape. Output is a UTF-8 (with BOM), **tab-separated**, two-column file named `flashcards.csv`, ready for Anki import as Front/Back.

## Input: NotebookLM artifact JSON

Source: the `data-app-data` attribute on `<app-root>` inside the artifact iframe (see [NotebookLM DOM Contract](notebooklm-dom-contract.md)). Shapes are defined in `src/types.ts`, derived from observation. **The payload may contain other fields that the extension ignores.**

### Flashcards

```json
{
  "flashcards": [
    { "f": "What is the derivative of \\sin(x)?", "b": "\\cos(x)" },
    { "f": "Define a group.", "b": "A set with an associative operation, identity, and inverses." }
  ]
}
```

| Field | Meaning |
|---|---|
| `f` | Front (question) |
| `b` | Back (answer) |

### Quiz

```json
{
  "quiz": [
    {
      "question": "Which is a prime?",
      "answerOptions": [
        { "text": "4", "rationale": "Divisible by 2.", "isCorrect": false },
        { "text": "7", "rationale": "Only divisible by 1 and 7.", "isCorrect": true }
      ]
    }
  ]
}
```

Only `question` and the **first** option with `isCorrect: true` are exported. Questions without a correct option are skipped.

Detection order in `createCsvBlob`: the flashcard check runs first, then the quiz check. Both checks are independent `if` blocks, so a payload with both keys would export both sets of rows.

## Output format

| Property | Value |
|---|---|
| Encoding | UTF-8 with BOM (`﻿` prefix), which helps Excel and Anki detect UTF-8 |
| MIME | `text/csv;charset=utf-8` |
| Filename | `flashcards.csv` (also for quizzes) |
| Field delimiter | **Tab** (`\t`), not comma |
| Record delimiter | `\n` (LF), no trailing newline |
| Header row | None |
| Columns | 1 = Front / Question, 2 = Back / Correct answer |
| Quoting | A field is wrapped in `"` **only** if it contains a tab, newline or `"` |
| Escaping | `"` → `""` (RFC 4180 style) |
| Commas, backslashes, `$`, braces | Left verbatim, so LaTeX is preserved |

### Example

Input:

```json
{"flashcards":[
  {"f":"Area of a circle","b":"\\pi r^2"},
  {"f":"Quote: \"to be\"","b":"Hamlet"},
  {"f":"Two\nlines","b":"ok"}
]}
```

Output (`⇥` = tab):

```
﻿Area of a circle⇥\pi r^2
"Quote: ""to be"""⇥Hamlet
"Two
lines"⇥ok
```

### Copy button output

The **Copy** button currently writes the **raw input JSON** to the clipboard, not the TSV above. See [Known Issues #1](known-issues.md#1-copy-button-copies-raw-json-not-the-csv).

## Importing into Anki

1. **File → Import**, then pick `flashcards.csv`.
2. Anki should auto-detect the **Tab** separator. If it doesn't, set *Field separator: Tab*.
3. Map **Field 1 → Front** and **Field 2 → Back**.
4. Turn on *Allow HTML in fields* if the cards contain HTML.
5. For math rendering, use a LaTeX/MathJax-capable note type or add-on. The root README recommends *Better Markdown Anki* (add-on ID `2100166052`).

## Changing the format

All formatting lives in `createCsvBlob` (`src/utils/utils.ts:44-78`). If you change the delimiter or quoting, update:
- this page,
- the root `README.md` import instructions,
- the `link.download` filename in `src/entrypoints/content/index.ts:41` if the extension changes.

See [Contributing → Adding a new data type or export format](contributing.md#recipe-add-a-new-artifact-type-or-export-format).

---

**Related pages:** [Utilities](modules/utils.md) · [NotebookLM DOM Contract](notebooklm-dom-contract.md)
