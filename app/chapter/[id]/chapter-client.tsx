"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSectionQuestions, getChapterAllQuestions } from "@/lib/chapters-data";
import { Chapter, QuizQuestionItem } from "@/lib/types";
import { getStoredProgress, ProgressState } from "@/lib/storage";
import { ChapterSectionsView } from "@/components/chapter-sections-view";
import { QuizPlayer } from "@/components/quiz-player";
import { useLanguage } from "@/lib/i18n";

interface ChapterClientPageProps {
  chapter: Chapter;
}

export function ChapterClientPage({ chapter }: ChapterClientPageProps) {
  const router = useRouter();
  const { t, formatString } = useLanguage();
  const chapterId = chapter.chapter_id;

  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestionItem[] | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizSubtitle, setQuizSubtitle] = useState<string | undefined>();
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | undefined>();
  const [progress, setProgress] = useState<ProgressState>({
    answeredCount: 0,
    correctCount: 0,
    totalScore: 0,
    streak: 0,
    bestStreak: 0,
    wrongQuestionIds: [],
    bookmarkedQuestionIds: [],
    sectionProgress: {},
  });

  const refreshProgress = () => {
    setProgress(getStoredProgress());
  };

  useEffect(() => {
    refreshProgress();
  }, []);

  const handleSelectSection = (cId: number, sIdx: number) => {
    const list = getSectionQuestions(cId, sIdx);
    const sec = chapter.sections[sIdx];
    setQuizTitle(`${chapter.chapter_name} • ${sec?.section_name || `Section ${sIdx + 1}`}`);
    setQuizSubtitle(`Chapter ${cId}`);
    setActiveSectionIndex(sIdx);
    setActiveQuizQuestions(list);
  };

  const handleSelectChapterAll = (cId: number) => {
    const list = getChapterAllQuestions(cId);
    setQuizTitle(
      formatString(t.chapterQuizTitle, {
        chapterId: cId,
        chapterName: chapter.chapter_name,
      })
    );
    setQuizSubtitle(t.all3Sections);
    setActiveSectionIndex(undefined);
    setActiveQuizQuestions(list);
  };

  const handleExitQuiz = () => {
    setActiveQuizQuestions(null);
    refreshProgress();
  };

  if (activeQuizQuestions && activeQuizQuestions.length > 0) {
    return (
      <main className="min-h-dvh bg-black text-white p-3 flex flex-col justify-center items-center">
        <QuizPlayer
          questions={activeQuizQuestions}
          title={quizTitle}
          subtitle={quizSubtitle}
          onExit={handleExitQuiz}
          chapterId={chapterId}
          sectionIndex={activeSectionIndex}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc] pb-12">
      <ChapterSectionsView
        chapter={chapter}
        progress={progress}
        onBack={() => router.push("/")}
        onSelectSection={handleSelectSection}
        onSelectChapterAll={handleSelectChapterAll}
        onSwitchChapter={(newId) => router.push(`/chapter/${newId}`)}
      />
    </main>
  );
}
