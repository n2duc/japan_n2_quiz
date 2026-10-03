import { Chapter, QuizQuestionItem } from "./types";
import ch01 from "@/data/chapter_01.json";
import ch02 from "@/data/chapter_02.json";
import ch03 from "@/data/chapter_03.json";
import ch04 from "@/data/chapter_04.json";
import ch05 from "@/data/chapter_05.json";
import ch06 from "@/data/chapter_06.json";
import ch07 from "@/data/chapter_07.json";
import ch08 from "@/data/chapter_08.json";
import ch09 from "@/data/chapter_09.json";
import ch10 from "@/data/chapter_10.json";
import ch11 from "@/data/chapter_11.json";
import ch12 from "@/data/chapter_12.json";
import ch13 from "@/data/chapter_13.json";
import ch14 from "@/data/chapter_14.json";
import ch15 from "@/data/chapter_15.json";
import ch16 from "@/data/chapter_16.json";
import ch17 from "@/data/chapter_17.json";
import ch18 from "@/data/chapter_18.json";
import ch19 from "@/data/chapter_19.json";
import ch20 from "@/data/chapter_20.json";
import ch21 from "@/data/chapter_21.json";
import ch22 from "@/data/chapter_22.json";
import ch23 from "@/data/chapter_23.json";
import ch24 from "@/data/chapter_24.json";
import ch25 from "@/data/chapter_25.json";
import ch26 from "@/data/chapter_26.json";
import ch27 from "@/data/chapter_27.json";
import ch28 from "@/data/chapter_28.json";
import ch29 from "@/data/chapter_29.json";
import ch30 from "@/data/chapter_30.json";

export const chapters: Chapter[] = [
  ch01 as Chapter,
  ch02 as Chapter,
  ch03 as Chapter,
  ch04 as Chapter,
  ch05 as Chapter,
  ch06 as Chapter,
  ch07 as Chapter,
  ch08 as Chapter,
  ch09 as Chapter,
  ch10 as Chapter,
  ch11 as Chapter,
  ch12 as Chapter,
  ch13 as Chapter,
  ch14 as Chapter,
  ch15 as Chapter,
  ch16 as Chapter,
  ch17 as Chapter,
  ch18 as Chapter,
  ch19 as Chapter,
  ch20 as Chapter,
  ch21 as Chapter,
  ch22 as Chapter,
  ch23 as Chapter,
  ch24 as Chapter,
  ch25 as Chapter,
  ch26 as Chapter,
  ch27 as Chapter,
  ch28 as Chapter,
  ch29 as Chapter,
  ch30 as Chapter
];

export function getAllChapters(): Chapter[] {
  return chapters;
}

export function getChapterById(id: number): Chapter | undefined {
  return chapters.find((c) => c.chapter_id === id);
}

export function getSectionQuestions(
  chapterId: number,
  sectionIndex: number
): QuizQuestionItem[] {
  const chapter = getChapterById(chapterId);
  if (!chapter || !chapter.sections[sectionIndex]) return [];
  const sec = chapter.sections[sectionIndex];
  return sec.questions.map((q) => ({
    id: `ch${chapterId}-s${sectionIndex}-q${q.question_number}`,
    chapterId,
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
  }));
}

export function getChapterAllQuestions(chapterId: number): QuizQuestionItem[] {
  const chapter = getChapterById(chapterId);
  if (!chapter) return [];
  const list: QuizQuestionItem[] = [];
  chapter.sections.forEach((_, sIdx) => {
    list.push(...getSectionQuestions(chapterId, sIdx));
  });
  return list;
}

export function getAllQuestions(): QuizQuestionItem[] {
  const list: QuizQuestionItem[] = [];
  chapters.forEach((c) => {
    list.push(...getChapterAllQuestions(c.chapter_id));
  });
  return list;
}
