# Data Formats

> **Summary:** Input is the JSON string from Gemini Notebook's `app-root[data-app-data]` attribute, in either flashcard or quiz shape. Output is a UTF-8 (with BOM), **tab-separated**, two-column file named `<notebook> - <artifact>.csv`, ready for Anki import as Front/Back. The Copy button puts the same text on the clipboard without the BOM.

## Input: Gemini Notebook artifact JSON

Source: the `data-app-data` attribute on `<app-root>` inside the artifact iframe (see [Gemini Notebook DOM Contract](gemini-notebook-dom-contract.md)). Shapes are defined in `src/types.ts`, derived from observation. **The payload may contain other fields that the extension ignores.**

### Flashcards

There are two shapes, and both are seen live. Older artifacts keep the legacy shape, and artifacts generated since about November 2026 use content blocks. Each artifact uses one shape throughout.

Legacy (plain strings):

```json
{
  "flashcards": [
    { "f": "What is the derivative of \\sin(x)?", "b": "\\cos(x)", "c": 1 },
    { "f": "Define a group.", "b": "A set with an associative operation, identity, and inverses.", "c": 2 }
  ],
  "topics": { "covered": ["…"], "followUp": ["…"] }
}
```

Content blocks (checked November 2026):

```json
{
  "flashcards": [
    {
      "f": { "flashcardContentBlock": [{ "type": "text", "content": "What is the derivative of \\sin(x)?" }] },
      "b": { "flashcardContentBlock": [{ "type": "text", "content": "\\cos(x)" }] },
      "c": 1
    }
  ],
  "topics": { "covered": ["…"], "followUp": ["…"] }
}
```

| Field | Meaning |
|---|---|
| `f` | Front (question): a string, or `{ flashcardContentBlock: [{ type, content }] }` |
| `b` | Back (answer): same as `f` |
| `c` | Card number (ignored) |
| `topics` | Topic lists shown by the viewer (ignored) |

`richTextToString` (`src/utils/utils.ts`) flattens both shapes. Only `type: "text"` blocks have been seen so far. Blocks without a string `content` are dropped, and multiple blocks are joined with a newline (so the field gets quoted in the output). Any `*ContentBlock` array key is accepted, in case quiz payloads adopt a sibling key.

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

Only checked in the legacy string shape: no quiz generated after the content-block change has been seen yet. `question` and option `text` also go through `richTextToString`, so a content-block quiz should work too.

Only `question` and the **first** correct option (`isCorrect: true`) with usable text are exported. Questions without one are skipped. Items whose text fields can't be flattened to text are skipped too, and a payload that yields zero rows is ignored (no buttons).

Detection order in `toTsv`: the flashcard check runs first, then the quiz check. Both checks are independent `if` blocks, so a payload with both keys would export both sets of rows.

## Output format

| Property | Value |
|---|---|
| Encoding | UTF-8 with BOM (`﻿` prefix), which helps Excel and Anki detect UTF-8 |
| MIME | `text/csv;charset=utf-8` |
| Filename | `<notebook> - <artifact>.csv` (e.g. `Biology 101 - Cell Biology Flashcards.csv`), from the titles shown in Gemini Notebook. Falls back to `flashcards.csv` if neither title is found |
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

The **Copy** button writes the same TSV text to the clipboard, **without** the BOM.

## Importing into Anki

1. **File → Import**, then pick the downloaded `.csv` file.
2. Anki should auto-detect the **Tab** separator. If it doesn't, set *Field separator: Tab*.
3. Map **Field 1 → Front** and **Field 2 → Back**.
4. Turn on *Allow HTML in fields* if the cards contain HTML.
5. For math rendering, use a LaTeX/MathJax-capable note type or add-on. The root README recommends *Better Markdown Anki* (add-on ID `2100166052`).

## Changing the format

All formatting lives in `toTsv` (`src/utils/utils.ts:138-181`); `createCsvBlob` only adds the BOM. If you change the delimiter or quoting, update:
- this page,
- the root `README.md` import instructions,
- the `.csv` extension in `buildDownloadFilename` (`src/utils/utils.ts`) if the extension changes.

See [Contributing → Adding a new data type or export format](contributing.md#recipe-add-a-new-artifact-type-or-export-format).

---

**Related pages:** [Utilities](modules/utils.md) · [Gemini Notebook DOM Contract](gemini-notebook-dom-contract.md)
