"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  getSectionQuestions,
  getChapterAllQuestions,
} from "@/lib/chapters-data"
import { Chapter, QuizQuestionItem } from "@/lib/types"
import { getStoredProgress, ProgressState } from "@/lib/storage"
import { ChapterSectionsView } from "@/components/chapter-sections-view"
import { QuizPlayer } from "@/components/quiz-player"
import { useLanguage } from "@/lib/i18n"

interface ChapterClientPageProps {
  chapter: Chapter
}

export function ChapterClientPage({ chapter }: ChapterClientPageProps) {
  const router = useRouter()
  const { t, formatString, language } = useLanguage()
  const chapterId = chapter.chapter_id

  const [activeQuizQuestions, setActiveQuizQuestions] = useState<
    QuizQuestionItem[] | null
  >(null)
  const [quizTitle, setQuizTitle] = useState("")
  const [quizSubtitle, setQuizSubtitle] = useState<string | undefined>()
  const [activeSectionIndex, setActiveSectionIndex] = useState<
    number | undefined
  >()
  const [progress, setProgress] = useState<ProgressState>({
    answeredCount: 0,
    correctCount: 0,
    totalScore: 0,
    streak: 0,
    bestStreak: 0,
    wrongQuestionIds: [],
    bookmarkedQuestionIds: [],
    sectionProgress: {},
  })

  const refreshProgress = () => {
    setProgress(getStoredProgress())
  }

  useEffect(() => {
    refreshProgress()
  }, [])

  const handleSelectSection = (cId: number | string, sIdx: number) => {
    const list = getSectionQuestions(cId, sIdx)
    const sec = chapter.sections[sIdx]
    setQuizTitle(
      `${chapter.chapter_name} • ${sec?.section_name || `Section ${sIdx + 1}`}`
    )
    setQuizSubtitle(
      chapter.category === "exam"
        ? chapter.subtitle || "JLPT N2"
        : `Chapter ${cId}`
    )
    setActiveSectionIndex(sIdx)
    setActiveQuizQuestions(list)
  }

  const handleSelectChapterAll = (cId: number | string) => {
    const list = getChapterAllQuestions(cId)
    if (chapter.category === "exam") {
      setQuizTitle(`${chapter.chapter_name} • ${chapter.subtitle || ""}`)
      setQuizSubtitle(
        `${chapter.sections.length} phần thi • ${list.length} câu hỏi`
      )
    } else {
      setQuizTitle(
        formatString(t.chapterQuizTitle, {
          chapterId: cId,
          chapterName: chapter.chapter_name,
        })
      )
      setQuizSubtitle(t.all3Sections)
    }
    setActiveSectionIndex(undefined)
    setActiveQuizQuestions(list)
  }

  const handleExitQuiz = () => {
    setActiveQuizQuestions(null)
    refreshProgress()
  }

  if (activeQuizQuestions && activeQuizQuestions.length > 0) {
    return (
      <main className="flex h-dvh max-h-dvh w-full flex-col items-center justify-between overflow-y-auto bg-[#f6f8fc] p-2.5 sm:p-4 lg:p-8 text-slate-800 transition-colors duration-150 dark:bg-[#0f111a] dark:text-slate-100">
        <QuizPlayer
          key={`quiz-${chapterId}-${activeSectionIndex ?? "all"}`}
          questions={activeQuizQuestions}
          title={quizTitle}
          subtitle={quizSubtitle}
          onExit={handleExitQuiz}
          chapterId={chapterId}
          sectionIndex={activeSectionIndex}
          onNextSection={(cId, nextIdx) => handleSelectSection(cId, nextIdx)}
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc] pb-12 text-slate-800 transition-colors duration-150 dark:bg-[#0f111a] dark:text-slate-100">
      <ChapterSectionsView
        chapter={chapter}
        progress={progress}
        onBack={() => router.push(`/${language}`)}
        onSelectSection={handleSelectSection}
        onSelectChapterAll={handleSelectChapterAll}
        onSwitchChapter={(newId) => router.push(`/${language}/chapter/${newId}`)}
      />
    </main>
  )
}
