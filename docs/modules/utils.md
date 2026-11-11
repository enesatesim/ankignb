# Module: Utilities & Types

> **Summary:** `src/utils/utils.ts` has the footer button factory, the label-fitting helper and the JSON → TSV converter. `src/utils/typeguards.ts` and `src/types.ts` define and detect the two Gemini Notebook payload shapes (flashcards, quiz).

## `src/types.ts`

```ts
export interface ContentBlock { type: string; content?: string }
export type RichText = string | { flashcardContentBlock: ContentBlock[] };

export interface QuizData {
  quiz: {
    question: RichText;
    answerOptions: { text: RichText; rationale: string; isCorrect: boolean }[];
  }[];
}

export interface FlashcardData {
  flashcards: { f: RichText; b: RichText }[];   // f = front, b = back
}
```

These types come from observed payloads, not an official schema. `RichText` covers both the legacy plain string and the content-block object used by artifacts generated since about November 2026. See [Data Formats](../data-formats.md).

## `src/utils/typeguards.ts`

| Function | Returns `true` when |
|---|---|
| `isFlashcardData(data: unknown)` | `data` is an object with an **array** `flashcards` property |
| `isQuizData(data: unknown)` | `data` is an object with an **array** `quiz` property |

These are shallow checks. `toTsv` validates each item's fields itself.

## `src/utils/utils.ts`

### `INJECTED_ATTR`

`'data-ankignb'`. Every element the extension injects carries it, so the content script can find, de-duplicate and remove its own buttons.

### `createStyledButton(parentEl, label, icon, ariaLabel)`

```ts
createStyledButton(
  parentEl: Element,   // the artifact footer; the button is appended here
  label: string,       // '' → icon-only button
  icon: string,        // icon ligature name, e.g. 'content_copy', 'download', 'local_cafe'
  ariaLabel: string    // set as aria-label and title (tooltip)
): HTMLElement
```

- **Clones the page's own footer button.** It finds a native `nb-button.feedback-button` in `parentEl` (the thumbs up/down buttons), deep-clones it, strips `jslog` and `id` attributes, replaces the `mat-icon` text and the label `<span>` inside `.nb-button-content` (or removes the span for icon-only buttons). The clone keeps Google's classes and Angular scoped attributes, so it matches the current theme with no CSS of our own. `cloneNode` copies no event listeners, so clicking it doesn't trigger Google's rating handlers.
- **Fallback:** if no native button is found, it builds a plain `button.mdc-button.mdc-button--outlined` with `document.createElement`.
- Label spans get the class `ankignb-label` so `fitButtonsToFooter` can hide them.
- Sets `data-ankignb`, `title` and `aria-label`, appends to `parentEl` and returns the element.
- No `innerHTML`: labels and icon names are set with `textContent`.

### `fitButtonsToFooter(footer)`

The footer is a fixed-height, `overflow: hidden`, `nowrap` flex row, so extra buttons get clipped in a narrow Studio panel. This shows all `.ankignb-label` spans, and if `footer.scrollWidth > footer.clientWidth` hides them again so the buttons collapse to icons. The content script calls it after injecting and from a `ResizeObserver`.

### `richTextToString(value)`

```ts
richTextToString(value: unknown): string | null
```

Flattens one text field to plain text. A string is returned as is. For an object, it takes the first own key ending in `ContentBlock` whose value is an array (in practice `flashcardContentBlock`), keeps each block's string `content`, drops blocks with none (e.g. a hypothetical image block), and joins what is left with `\n`. Anything else, or no text left, gives `null`.

### `convertMathDelimiters(text)`

```ts
convertMathDelimiters(text: string): string
```

Rewrites Markdown-style math to the delimiters Anki's built-in MathJax renders. `$$…$$` → `\[…\]` runs first (may span lines), then `$…$` → `\(…\)`. Inline matches follow Pandoc's rules: the opening `$` isn't escaped and is followed by a non-space, the closing `$` is preceded by a non-space and not followed by a digit, and there's no newline inside. That keeps prices such as `$5 and $10` unchanged. Escaped `\$`, unmatched `$` and existing `\(…\)` / `\[…\]` are left alone. Text without `$` is returned as is.

### `toTsv(data)`

```ts
toTsv(data: string): string | null
```

1. `JSON.parse(data)` inside `try/catch`; invalid JSON → `null`.
2. If it's flashcards: one row per card whose `f` and `b` both flatten to text with `richTextToString`, `format(front) + '\t' + format(back)`, where `format` is `convertMathDelimiters` followed by `escapeCsvField`.
3. If it's a quiz: one row per question whose `question` flattens to text and that has an `isCorrect` option whose `text` flattens to text, `format(question) + '\t' + format(correctAnswer)`. Rationales and wrong options are dropped.
4. Invalid items are skipped. Zero rows → `null`.
5. Rows are joined with `\n`. No BOM (that's added for downloads only).

#### `escapeCsvField(field)` (inner helper)

- Doubles every `"`.
- Wraps the field in `"…"` if it contains a **tab, newline or double quote**.
- Commas and backslashes are left alone. This is intentional: LaTeX such as `\frac{a}{b}` must survive verbatim (see the v1.2 changelog in the root README). Only the `$` delimiters are changed, by `convertMathDelimiters` before escaping.

### `buildDownloadFilename(notebookTitle, artifactTitle)`

```ts
buildDownloadFilename(notebookTitle?: string | null, artifactTitle?: string | null): string
```

Returns `<notebook> - <artifact>.csv`. Each title has characters that are invalid in Windows/macOS/Linux filenames (`\ / : * ? " < > |` and control characters) replaced with spaces, whitespace collapsed, leading/trailing dots removed, and is capped at 100 characters. If only one title is present, or both are the same, only that one is used. If neither is present the result is `flashcards.csv`. The DOM lookups live in the content script's `getDownloadFilename`.

### `createCsvBlob(tsv)`

```ts
createCsvBlob(tsv: string): Blob
```

Prepends a UTF-8 BOM (`﻿`) and returns `new Blob([...], { type: 'text/csv;charset=utf-8' })`.

Full output spec: [Data Formats](../data-formats.md#output-format).

---

**Related pages:** [Content script](content-script.md) · [Data Formats](../data-formats.md)
