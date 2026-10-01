import { isFlashcardData, isQuizData } from './typeguards';

export const createStyledButton = (
  parentEl: Element,
  label: string,
  matIcon: string,
  classes?: string[],
  styles?: string[]
) => {
  const buttonWrapper = document.createElement('div');
  buttonWrapper.innerHTML = `<button style='${
    styles ? styles.join(' ') : ''
  } border-color: #37383B; cursor: pointer;'
  aria-label="${label || 'Action'}"
  mat-stroked-button=""
  class="mdc-button mat-mdc-button-base feedback-button mdc-button--outlined mat-mdc-outlined-button mat-unthemed ankignb-button ${
    classes ? classes.join(' ') : ''
  }"
  mat-ripple-loader-class-name="mat-mdc-button-ripple"
>
  <span class="mat-mdc-button-persistent-ripple mdc-button__ripple"></span
  ><mat-icon
    role="img"
    aria-hidden="true"
    class="mat-icon notranslate material-symbols-outlined google-symbols mat-icon-no-color"
    data-mat-icon-type="font"
    style="font-size: 18px; width: 18px; height: 18px; line-height: 18px; vertical-align: middle; margin-right: ${
      label.length ? '6px' : '0px'
    };"
    >${matIcon}</mat-icon
  >${
    label.length
      ? `<span class="mdc-button__label" style="vertical-align: middle;">${label}</span><span class="mat-focus-indicator"></span>`
      : ''
  }<span class="mat-mdc-button-touch-target" style="cursor: pointer"></span
  ><span class="mat-ripple mat-mdc-button-ripple"></span>
</button>
`;
  const button = buttonWrapper.firstElementChild;
  if (!button) throw new Error('button creation failed');
  parentEl.appendChild(button);
  return button as HTMLElement;
};

export function escapeCsvField(field: string): string {
  if (typeof field !== 'string') return '';
  const escaped = field.replace(/"/g, '""');
  if (/[\t\n\r"]/.test(escaped)) {
    return `"${escaped}"`;
  }
  return escaped;
}

export const generateCsvString = (data: string): string | undefined => {
  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    const rows: string[] = [];

    if (isFlashcardData(parsedData)) {
      for (const card of parsedData.flashcards) {
        const front = escapeCsvField(card.f);
        const back = escapeCsvField(card.b);
        rows.push(`${front}\t${back}`);
      }
    } else if (isQuizData(parsedData)) {
      for (const quiz of parsedData.quiz) {
        const answer = quiz.answerOptions?.find((opt) => opt.isCorrect);
        if (!answer) continue;
        const question = escapeCsvField(quiz.question);
        const correct = escapeCsvField(answer.text);
        rows.push(`${question}\t${correct}`);
      }
    } else if (Array.isArray(parsedData)) {
      for (const item of parsedData) {
        if (item && typeof item === 'object') {
          if ('f' in item && 'b' in item) {
            const front = escapeCsvField(String(item.f));
            const back = escapeCsvField(String(item.b));
            rows.push(`${front}\t${back}`);
          } else if ('question' in item && Array.isArray((item as any).answerOptions)) {
            const answer = (item as any).answerOptions.find((opt: any) => opt.isCorrect);
            if (answer) {
              const question = escapeCsvField(String(item.question));
              const correct = escapeCsvField(String(answer.text));
              rows.push(`${question}\t${correct}`);
            }
          }
        }
      }
    }

    if (rows.length === 0) return undefined;
    return rows.join('\n');
  } catch (error) {
    console.error('AnkiGNB: Error parsing flashcard data', error);
    return undefined;
  }
};

export const createCsvBlob = (data: string): Blob | undefined => {
  const csv = generateCsvString(data);
  if (csv === undefined) return undefined;

  const BOM = '\uFEFF'; // UTF-8
  return new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
};
