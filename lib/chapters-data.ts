import { Chapter, QuizQuestionItem } from "./types"
import { grammarChapters, examChapters } from "./chapters-registry"

export { grammarChapters, examChapters }


export const chapters: Chapter[] = [...grammarChapters, ...examChapters]

export function getAllChapters(): Chapter[] {
  return chapters
}

export function getGrammarChapters(): Chapter[] {
  return grammarChapters
}

export function getExamChapters(): Chapter[] {
  return examChapters
}

export function getChapterById(id: number | string): Chapter | undefined {
  return chapters.find(
    (c) =>
      c.chapter_id === id ||
      String(c.chapter_id).toLowerCase() === String(id).toLowerCase() ||
      (id === 31 && c.chapter_id === "jlpt-2010-07")
  )
}

export function getSectionQuestions(
  chapterId: number | string,
  sectionIndex: number
): QuizQuestionItem[] {
  const chapter = getChapterById(chapterId)
  if (!chapter || !chapter.sections[sectionIndex]) return []
  const sec = chapter.sections[sectionIndex]
  return sec.questions.map((q) => ({
    id: `ch${chapter.chapter_id}-s${sectionIndex}-q${q.question_number}`,
    chapterId: chapter.chapter_id,
    chapterName: chapter.chapter_name,
    sectionIndex,
    sectionName: sec.section_name,
    sectionInstruction: sec.instruction,
    context: sec.context,
    questionNumber: q.question_number,
    questionText:
      q.question_text ||
      (sec.context
        ? `（ ${q.question_number} ）に入る最もよいものを選びなさい。`
        : `第${q.question_number}問`),
    options: q.options,
    optionsVi: q.options_vi,
    answer: q.answer,
    orderedSequence: q.ordered_sequence,
    fullSentence: q.full_sentence,
  }))
}

export function getChapterAllQuestions(
  chapterId: number | string
): QuizQuestionItem[] {
  const chapter = getChapterById(chapterId)
  if (!chapter) return []
  const list: QuizQuestionItem[] = []
  chapter.sections.forEach((_, sIdx) => {
    list.push(...getSectionQuestions(chapter.chapter_id, sIdx))
  })
  return list
}

export function getGrammarQuestions(): QuizQuestionItem[] {
  const list: QuizQuestionItem[] = []
  grammarChapters.forEach((c) => {
    list.push(...getChapterAllQuestions(c.chapter_id))
  })
  return list
}

export function getExamQuestions(): QuizQuestionItem[] {
  const list: QuizQuestionItem[] = []
  examChapters.forEach((c) => {
    list.push(...getChapterAllQuestions(c.chapter_id))
  })
  return list
}

export function getAllQuestions(): QuizQuestionItem[] {
  const list: QuizQuestionItem[] = []
  chapters.forEach((c) => {
    list.push(...getChapterAllQuestions(c.chapter_id))
  })
  return list
}
