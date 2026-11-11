# Module: Utilities & Types

> **Summary:** `src/utils/utils.ts` has the footer button factory, the label-fitting helper and the JSON → TSV converter. `src/utils/typeguards.ts` and `src/types.ts` define and detect the two Gemini Notebook payload shapes (flashcards, quiz).

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

These types are derived from observed payloads (from the NotebookLM era), not from an official schema. See [Data Formats](../data-formats.md).

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

### `toTsv(data)`

```ts
toTsv(data: string): string | null
```

1. `JSON.parse(data)` inside `try/catch`; invalid JSON → `null`.
2. If it's flashcards: one row per card with string `f` and `b`, `escape(f) + '\t' + escape(b)`.
3. If it's a quiz: one row per question with a string `question` and an `isCorrect` option with string `text`, `escape(question) + '\t' + escape(correctAnswer.text)`. Rationales and wrong options are dropped.
4. Invalid items are skipped. Zero rows → `null`.
5. Rows are joined with `\n`. No BOM (that's added for downloads only).

#### `escapeCsvField(field)` (inner helper)

- Doubles every `"`.
- Wraps the field in `"…"` if it contains a **tab, newline or double quote**.
- Commas and backslashes are left alone. This is intentional: LaTeX such as `\frac{a}{b}` must survive verbatim (see the v1.2 changelog in the root README).

### `createCsvBlob(tsv)`

```ts
createCsvBlob(tsv: string): Blob
```

Prepends a UTF-8 BOM (`﻿`) and returns `new Blob([...], { type: 'text/csv;charset=utf-8' })`.

Full output spec: [Data Formats](../data-formats.md#output-format).

---

**Related pages:** [Content script](content-script.md) · [Data Formats](../data-formats.md)
