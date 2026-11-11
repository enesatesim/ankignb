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
  const isText = (value: unknown): value is string => typeof value === 'string';

  function escapeCsvField(field: string) {
    const escaped = field.replace(/"/g, '""');
    if (/[\t\n"]/.test(escaped)) {
      return `"${escaped}"`;
    }
    return escaped;
  }

  if (isFlashcardData(parsedData)) {
    for (const card of parsedData.flashcards) {
      if (!card || !isText(card.f) || !isText(card.b)) continue;
      rows.push(`${escapeCsvField(card.f)}\t${escapeCsvField(card.b)}`);
    }
  }

  if (isQuizData(parsedData)) {
    for (const quiz of parsedData.quiz) {
      if (!quiz || !isText(quiz.question) || !Array.isArray(quiz.answerOptions)) continue;
      const answer = quiz.answerOptions.find((opt) => opt && opt.isCorrect && isText(opt.text));
      if (!answer) continue;
      rows.push(`${escapeCsvField(quiz.question)}\t${escapeCsvField(answer.text)}`);
    }
  }

  return rows.length ? rows.join('\n') : null;
};

/** Wraps TSV text in a UTF-8 (with BOM) blob for download. */
export const createCsvBlob = (tsv: string): Blob => {
  const BOM = '﻿'; // UTF-8
  return new Blob([BOM + tsv], { type: 'text/csv;charset=utf-8' });
};
