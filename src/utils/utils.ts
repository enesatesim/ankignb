import { isFlashcardData, isQuizData } from './typeguards';

/** Attribute that marks every element AnkiGNB injects into the page. */
export const INJECTED_ATTR = 'data-ankignb';
const LABEL_CLASS = 'ankignb-label';

/**
 * Creates a footer button that matches Gemini Notebook's own footer buttons and appends it
 * to `parentEl`.
 *
 * It deep-clones one of the page's native `<nb-button class="feedback-button">` elements
 * (the thumbs up/down buttons), so it inherits the current theme and icon font without
 * shipping any CSS. `cloneNode` copies no Angular event listeners. If no native button is
 * found, it falls back to a plain Material outlined button.
 */
export const createStyledButton = (
  parentEl: Element,
  label: string,
  icon: string,
  ariaLabel: string
): HTMLElement => {
  const template = Array.from(parentEl.querySelectorAll('nb-button.feedback-button')).find(
    (el) => !el.hasAttribute(INJECTED_ATTR)
  );

  const element = template ? cloneNativeButton(template, label, icon) : createFallbackButton(label, icon);

  element.setAttribute(INJECTED_ATTR, '');
  element.setAttribute('title', ariaLabel);
  element.setAttribute('aria-label', ariaLabel);
  element.querySelector('button')?.setAttribute('aria-label', ariaLabel);

  parentEl.appendChild(element);
  return element;
};

function cloneNativeButton(template: Element, label: string, icon: string): HTMLElement {
  const clone = template.cloneNode(true) as HTMLElement;

  // Drop Google's analytics hooks and per-instance attributes.
  for (const el of [clone, ...Array.from(clone.querySelectorAll('*'))]) {
    el.removeAttribute('jslog');
    el.removeAttribute('id');
  }
  clone.setAttribute('icon', icon);

  const matIcon = clone.querySelector('mat-icon');
  if (matIcon) matIcon.textContent = icon;

  const content = clone.querySelector('.nb-button-content');
  const labelSpan = content
    ? Array.from(content.children).find((el) => el.tagName === 'SPAN')
    : undefined;
  if (label) {
    if (labelSpan) {
      labelSpan.textContent = label;
      labelSpan.classList.add(LABEL_CLASS);
    } else if (content) {
      const span = document.createElement('span');
      span.className = LABEL_CLASS;
      span.textContent = label;
      content.appendChild(span);
    }
  } else {
    labelSpan?.remove();
  }

  return clone;
}

function createFallbackButton(label: string, icon: string): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className =
    'mdc-button mat-mdc-button-base mdc-button--outlined mat-mdc-outlined-button mat-unthemed';
  button.style.marginLeft = '8px';
  button.style.cursor = 'pointer';

  const matIcon = document.createElement('mat-icon');
  matIcon.className = 'mat-icon notranslate google-symbols mat-icon-no-color';
  matIcon.setAttribute('aria-hidden', 'true');
  matIcon.textContent = icon;
  button.appendChild(matIcon);

  if (label) {
    const span = document.createElement('span');
    span.className = `mdc-button__label ${LABEL_CLASS}`;
    span.textContent = label;
    button.appendChild(span);
  }

  return button;
}

/**
 * The artifact footer is a fixed-height, `overflow: hidden` flex row, so buttons that don't
 * fit are clipped. Show the injected buttons' text labels only when everything fits; otherwise
 * they collapse to icons (the `title` attribute still gives a tooltip).
 */
export const fitButtonsToFooter = (footer: Element) => {
  const labels = footer.querySelectorAll<HTMLElement>(`[${INJECTED_ATTR}] .${LABEL_CLASS}`);
  labels.forEach((el) => (el.style.display = ''));
  if (footer.scrollWidth > footer.clientWidth) labels.forEach((el) => (el.style.display = 'none'));
};

/**
 * Flattens a card or quiz text field to plain text.
 *
 * Older artifacts store plain strings. Artifacts generated since about November 2026 store
 * `{ flashcardContentBlock: [{ type: 'text', content: '…' }] }`. Any `*ContentBlock` array
 * key is accepted, in case quizzes use a sibling key. Blocks without string `content` are
 * dropped, and multiple blocks are joined with newlines. Returns `null` when no text is left.
 */
export const richTextToString = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return null;

  const blocks = Object.entries(value).find(
    ([key, v]) => key.endsWith('ContentBlock') && Array.isArray(v)
  )?.[1] as unknown[] | undefined;
  if (!blocks) return null;

  const text = blocks
    .map((block) =>
      block && typeof block === 'object' && 'content' in block && typeof block.content === 'string'
        ? block.content
        : ''
    )
    .filter(Boolean)
    .join('\n');
  return text || null;
};

/** `$$…$$` that isn't escaped. May span lines. */
const DISPLAY_MATH = /(?<!\\)\$\$([\s\S]+?)(?<!\\)\$\$/g;
/**
 * `$…$` following Pandoc's rules: the opening `$` isn't escaped and is followed by a
 * non-space, the closing `$` is preceded by a non-space and not followed by a digit, and
 * there's no newline inside. This leaves prices such as `$5 and $10` alone.
 */
const INLINE_MATH = /(?<!\\)\$(?!\s)((?:\\.|[^$\\\n])+?)(?<!\s)\$(?!\d)/g;

/**
 * Rewrites Markdown-style math delimiters to the ones Anki's built-in MathJax understands:
 * `$$…$$` → `\[…\]` and `$…$` → `\(…\)`. Escaped `\$` and unmatched `$` are left as they are.
 */
export const convertMathDelimiters = (text: string): string => {
  if (!text.includes('$')) return text;
  return text
    .replace(DISPLAY_MATH, (_, math: string) => `\\[${math}\\]`)
    .replace(INLINE_MATH, (_, math: string) => `\\(${math}\\)`);
};

/**
 * Converts the artifact JSON (flashcards or quiz) into tab-separated Front/Back rows.
 * Returns `null` when the payload can't be parsed or yields no rows.
 */
export const toTsv = (data: string): string | null => {
  let parsedData: unknown;
  try {
    parsedData = JSON.parse(data);
  } catch {
    return null;
  }

  const rows: string[] = [];

  function escapeCsvField(field: string) {
    const escaped = field.replace(/"/g, '""');
    if (/[\t\n"]/.test(escaped)) {
      return `"${escaped}"`;
    }
    return escaped;
  }

  const formatField = (field: string) => escapeCsvField(convertMathDelimiters(field));

  if (isFlashcardData(parsedData)) {
    for (const card of parsedData.flashcards) {
      if (!card) continue;
      const front = richTextToString(card.f);
      const back = richTextToString(card.b);
      if (!front || !back) continue;
      rows.push(`${formatField(front)}\t${formatField(back)}`);
    }
  }

  if (isQuizData(parsedData)) {
    for (const quiz of parsedData.quiz) {
      if (!quiz || !Array.isArray(quiz.answerOptions)) continue;
      const question = richTextToString(quiz.question);
      if (!question) continue;
      const answer = quiz.answerOptions
        .filter((opt) => opt && opt.isCorrect)
        .map((opt) => richTextToString(opt.text))
        .find(Boolean);
      if (!answer) continue;
      rows.push(`${formatField(question)}\t${formatField(answer)}`);
    }
  }

  return rows.length ? rows.join('\n') : null;
};

/**
 * Builds the download filename `<notebook> - <artifact>.csv` from the two titles.
 *
 * Characters that Windows, macOS or Linux reject in filenames are replaced, whitespace is
 * collapsed, and each part is capped so the full name stays well under OS limits. If one
 * title is missing (or both are the same) only the other is used. If both are missing it
 * falls back to `flashcards.csv`.
 */
export const buildDownloadFilename = (
  notebookTitle: string | null | undefined,
  artifactTitle: string | null | undefined
): string => {
  const clean = (title: string | null | undefined) =>
    (title ?? '')
      .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^\.+|\.+$/g, '') // No leading dots (hidden files) or trailing dots (Windows).
      .trim()
      .slice(0, 100)
      .trim();

  const notebook = clean(notebookTitle);
  const artifact = clean(artifactTitle);
  const parts = notebook && artifact && notebook !== artifact ? [notebook, artifact] : [notebook || artifact];
  const base = parts.filter(Boolean).join(' - ') || 'flashcards';
  return `${base}.csv`;
};

/** Wraps TSV text in a UTF-8 (with BOM) blob for download. */
export const createCsvBlob = (tsv: string): Blob => {
  const BOM = '﻿'; // UTF-8
  return new Blob([BOM + tsv], { type: 'text/csv;charset=utf-8' });
};
