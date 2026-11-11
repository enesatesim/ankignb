# Module: Utilities & Types

> **Summary:** `src/utils/utils.ts` has the DOM button factory and the JSON → TSV converter. `src/utils/typeguards.ts` and `src/types.ts` define and detect the two NotebookLM payload shapes (flashcards, quiz).

## `src/types.ts`

```ts
export interface QuizData {
  quiz: {
    question: string;
    answerOptions: { text: string; rationale: string; isCorrect: boolean }[];
  }[];
}

export interface FlashcardData {
  flashcards: { f: string; b: string }[];   // f = front, b = back
}
```

These types are derived from observed NotebookLM payloads, not from an official schema. See [Data Formats](../data-formats.md).

## `src/utils/typeguards.ts`

| Function | Returns `true` when |
|---|---|
| `isFlashcardData(data: unknown)` | `data` is an object with an **array** `flashcards` property |
| `isQuizData(data: unknown)` | `data` is an object with an **array** `quiz` property |

These are shallow checks only. Item fields (`f`, `b`, `question`, …) are not validated, so a malformed item can throw in `escapeCsvField` (for example `undefined.replace`).

## `src/utils/utils.ts`

### `createStyledButton(parentEl, label, matIcon, classes?, styles?)`

```ts
createStyledButton(
  parentEl: Element,   // where the button is appended
  label: string,       // '' → icon-only button
  matIcon: string,     // Material Symbols ligature name, e.g. 'copy_all', 'save_alt', 'coffee'
  classes?: string[],  // extra classes appended to the button
  styles?: string[]    // raw CSS declarations joined into the style attribute, e.g. ['padding: 0']
): HTMLElement
```

- Builds the button from an HTML string that **clones NotebookLM's Angular Material outlined button**: `mdc-button`, `mat-mdc-outlined-button`, `<mat-icon class="material-symbols-outlined google-symbols">`, ripple spans. That way it inherits NotebookLM's styling and icon font without shipping any CSS.
- It always sets `border-color: #37383B` and `aria-label="Copy JSON"` (the latter is a bug for the other buttons).
- It includes Angular-scoped attributes copied from a past NotebookLM build (`_ngcontent-ng-c2304399035`, `_ngcontent-ng-c16875709`). These are tied to a specific build and probably no longer match any style rules.
- `label` and `matIcon` are interpolated into `innerHTML` **unescaped**. Only pass trusted constants.
- It throws `Error('button creation failed')` if parsing yields no element.
- It appends the button to `parentEl` and returns it.

### `createCsvBlob(data)`

```ts
createCsvBlob(data: string): Blob | undefined
```

1. `JSON.parse(data)`. This **throws** on invalid JSON (not caught).
2. If it's flashcards: one row per card, `escape(f) + '\t' + escape(b)`.
3. If it's a quiz: one row per question, `escape(question) + '\t' + escape(correctAnswer.text)`. Questions with no `isCorrect` option are skipped. Rationales and wrong options are dropped.
4. Rows are joined with `\n`, and a UTF-8 BOM (`﻿`) is prepended.
5. It returns `new Blob([...], { type: 'text/csv;charset=utf-8' })`.

In practice it always returns a `Blob`. The `undefined` in the signature is never produced.

#### `escapeCsvField(field)` (inner helper)

- Doubles every `"`.
- Wraps the field in `"…"` if it contains a **tab, newline or double quote**.
- Commas and backslashes are left alone. This is intentional: LaTeX such as `\frac{a}{b}` must survive verbatim (see the v1.2 changelog in the root README).

Full output spec: [Data Formats](../data-formats.md#output-format).

---

**Related pages:** [Content script](content-script.md) · [Data Formats](../data-formats.md)
