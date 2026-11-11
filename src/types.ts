export interface ContentBlock {
  type: string;
  content?: string;
}

/**
 * A card or quiz text field. Older artifacts use a plain string. Artifacts generated since
 * about November 2026 wrap the text in content blocks (see `richTextToString`).
 */
export type RichText = string | { flashcardContentBlock: ContentBlock[] };

export interface QuizData {
  quiz: {
    question: RichText;
    answerOptions: { text: RichText; rationale: string; isCorrect: boolean }[];
  }[];
}

export interface FlashcardData {
  flashcards: {
    f: RichText;
    b: RichText;
  }[];
}
