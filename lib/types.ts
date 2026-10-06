export interface RawQuestion {
  question_number: number
  question_text?: string
  word?: string
  options: Record<string, string>
  options_vi?: Record<string, string>
  answer: number
  ordered_sequence?: number[]
  full_sentence?: string
}

export interface RawSection {
  section_name: string
  instruction?: string
  context?: string
  questions: RawQuestion[]
}

export interface Chapter {
  chapter_id: number | string
  chapter_name: string
  category?: "grammar" | "exam"
  subtitle?: string
  sections: RawSection[]
}

export interface QuizQuestionItem {
  id: string
  chapterId: number | string
  chapterName: string
  sectionIndex: number
  sectionName: string
  sectionInstruction?: string
  context?: string
  questionNumber: number
  questionText: string
  options: Record<string, string>
  optionsVi?: Record<string, string>
  answer: number
  orderedSequence?: number[]
  fullSentence?: string
}

export interface UserStats {
  answeredCount: number
  correctCount: number
  chapterProgress: Record<
    number | string,
    {
      sections: Record<
        number,
        {
          completed: boolean
          score: number
          total: number
          lastPlayed?: string
        }
      >
    }
  >
  wrongQuestionIds: string[]
}
