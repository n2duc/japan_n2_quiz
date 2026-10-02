export interface RawQuestion {
  question_number: number;
  question_text?: string;
  options: Record<string, string>;
  answer: number;
  ordered_sequence?: number[];
}

export interface RawSection {
  section_name: string;
  instruction?: string;
  context?: string;
  questions: RawQuestion[];
}

export interface Chapter {
  chapter_id: number;
  chapter_name: string;
  sections: RawSection[];
}

export interface QuizQuestionItem {
  id: string;
  chapterId: number;
  chapterName: string;
  sectionIndex: number;
  sectionName: string;
  sectionInstruction?: string;
  context?: string;
  questionNumber: number;
  questionText: string;
  options: Record<string, string>;
  answer: number;
  orderedSequence?: number[];
}

export interface UserStats {
  answeredCount: number;
  correctCount: number;
  chapterProgress: Record<
    number,
    {
      sections: Record<
        number,
        {
          completed: boolean;
          score: number;
          total: number;
          lastPlayed?: string;
        }
      >;
    }
  >;
  wrongQuestionIds: string[];
}
