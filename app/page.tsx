"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpen01Icon,
  PlayIcon,
  SparklesIcon,
  RotateRight01Icon,
  Search01Icon,
  CheckmarkBadge01Icon,
  HelpCircleIcon,
  VolumeHighIcon,
  VolumeMute01Icon,
} from "@hugeicons/core-free-icons"
import {
  getAllChapters,
  getGrammarChapters,
  getExamChapters,
  getSectionQuestions,
  getChapterAllQuestions,
  getGrammarQuestions,
  getExamQuestions,
} from "@/lib/chapters-data"
import { QuizQuestionItem, Chapter } from "@/lib/types"
import {
  getStoredProgress,
  ProgressState,
  resetAllProgress,
} from "@/lib/storage"
import { sounds } from "@/lib/sound"
import { useLanguage } from "@/lib/i18n"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { QuizPlayer } from "@/components/quiz-player"
import { ChapterSectionsView } from "@/components/chapter-sections-view"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function HomePage() {
  const { t, formatString, language } = useLanguage()
  const [mainTab, setMainTab] = useState<"grammar" | "jlpt">("grammar")
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<
    QuizQuestionItem[] | null
  >(null)
  const [quizTitle, setQuizTitle] = useState("All Questions")
  const [quizSubtitle, setQuizSubtitle] = useState<string | undefined>()
  const [activeChapterId, setActiveChapterId] = useState<
    number | string | undefined
  >()
  const [activeSectionIndex, setActiveSectionIndex] = useState<
    number | undefined
  >()

  // Selected chapter for the dedicated sections page
  const [selectedChapterForSections, setSelectedChapterForSections] =
    useState<Chapter | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [grammarFilter, setGrammarFilter] = useState<
    "all" | "1-10" | "11-20" | "21-30" | "incomplete"
  >("all")

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
  const [soundEnabled, setSoundEnabled] = useState(true)

  const refreshProgress = () => {
    setProgress(getStoredProgress())
    setSoundEnabled(sounds.isEnabled())
  }

  useEffect(() => {
    refreshProgress()
  }, [])

  const allChapters = useMemo(() => getAllChapters(), [])
  const grammarChapters = useMemo(() => getGrammarChapters(), [])
  const examChapters = useMemo(() => getExamChapters(), [])
  const grammarQuestions = useMemo(() => getGrammarQuestions(), [])
  const examQuestions = useMemo(() => getExamQuestions(), [])

  // Active tab questions and chapters
  const currentTabQuestions = useMemo(
    () => (mainTab === "grammar" ? grammarQuestions : examQuestions),
    [mainTab, grammarQuestions, examQuestions]
  )

  const currentTabChapters = useMemo(
    () => (mainTab === "grammar" ? grammarChapters : examChapters),
    [mainTab, grammarChapters, examChapters]
  )

  // Filter grammar chapters
  const filteredGrammarChapters = useMemo(() => {
    return grammarChapters.filter((ch) => {
      const numId = typeof ch.chapter_id === "number" ? ch.chapter_id : NaN

      if (grammarFilter === "1-10" && (isNaN(numId) || numId < 1 || numId > 10))
        return false
      if (
        grammarFilter === "11-20" &&
        (isNaN(numId) || numId < 11 || numId > 20)
      )
        return false
      if (
        grammarFilter === "21-30" &&
        (isNaN(numId) || numId < 21 || numId > 30)
      )
        return false
      if (grammarFilter === "incomplete") {
        const completedCount = ch.sections.filter((_, sIdx) => {
          const key = `ch${ch.chapter_id}-s${sIdx}`
          return progress.sectionProgress[key]?.completed
        }).length
        if (completedCount === ch.sections.length && ch.sections.length > 0)
          return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName =
          ch.chapter_name.toLowerCase().includes(q) ||
          `chapter ${ch.chapter_id}`.toLowerCase().includes(q) ||
          `chương ${ch.chapter_id}`.toLowerCase().includes(q)

        if (matchesName) return true

        return ch.sections.some(
          (sec) =>
            sec.section_name.toLowerCase().includes(q) ||
            sec.questions.some(
              (item) =>
                item.question_text?.toLowerCase().includes(q) ||
                Object.values(item.options).some((opt) =>
                  opt.toLowerCase().includes(q)
                )
            )
        )
      }

      return true
    })
  }, [grammarChapters, grammarFilter, searchQuery, progress])

  // Filter exam chapters
  const filteredExamChapters = useMemo(() => {
    return examChapters.filter((exam) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName =
          exam.chapter_name.toLowerCase().includes(q) ||
          (exam.subtitle && exam.subtitle.toLowerCase().includes(q))

        if (matchesName) return true

        return exam.sections.some(
          (sec) =>
            sec.section_name.toLowerCase().includes(q) ||
            sec.questions.some(
              (item) =>
                item.question_text?.toLowerCase().includes(q) ||
                (item.word && item.word.toLowerCase().includes(q)) ||
                Object.values(item.options).some((opt) =>
                  opt.toLowerCase().includes(q)
                )
            )
        )
      }

      return true
    })
  }, [examChapters, searchQuery])

  // Practiced count for current tab
  const currentTabPracticedCount = useMemo(() => {
    const chapterIdSet = new Set(
      currentTabChapters.map((c) => String(c.chapter_id))
    )
    let answered = 0
    Object.entries(progress.sectionProgress).forEach(([key, sp]) => {
      const match = key.match(/^ch(.+)-s\d+$/)
      if (match && chapterIdSet.has(match[1])) {
        answered += sp.score
      }
    })
    return answered
  }, [currentTabChapters, progress])

  // Mistakes for current tab
  const currentTabMistakes = useMemo(() => {
    const idSet = new Set(currentTabQuestions.map((q) => q.id))
    return currentTabQuestions.filter(
      (q) => progress.wrongQuestionIds.includes(q.id) && idSet.has(q.id)
    )
  }, [currentTabQuestions, progress.wrongQuestionIds])

  const router = useRouter()

  // Launch Handlers
  const handleSelectChapter = (chapter: Chapter) => {
    router.push(`/chapter/${chapter.chapter_id}`)
  }

  const handleStartSection = (
    chapterId: number | string,
    sectionIndex: number
  ) => {
    const list = getSectionQuestions(chapterId, sectionIndex)
    const chapter = allChapters.find((c) => c.chapter_id === chapterId)
    const sec = chapter?.sections[sectionIndex]

    setQuizTitle(
      `${chapter?.chapter_name} • ${sec?.section_name || `Section ${sectionIndex + 1}`}`
    )
    setQuizSubtitle(
      chapter?.category === "exam"
        ? chapter.subtitle || "JLPT N2"
        : `Chapter ${chapterId}`
    )
    setActiveChapterId(chapterId)
    setActiveSectionIndex(sectionIndex)
    setActiveQuizQuestions(list)
  }

  const handleStartChapterAll = (chapterId: number | string) => {
    const list = getChapterAllQuestions(chapterId)
    const chapter = allChapters.find((c) => c.chapter_id === chapterId)

    if (chapter?.category === "exam") {
      setQuizTitle(`${chapter.chapter_name} • ${chapter.subtitle || ""}`)
      setQuizSubtitle(
        `${chapter.sections.length} phần thi • ${list.length} câu hỏi`
      )
    } else {
      setQuizTitle(
        formatString(t.chapterQuizTitle, {
          chapterId: typeof chapterId === "number" ? chapterId : "",
          chapterName: chapter?.chapter_name || "",
        })
      )
      setQuizSubtitle(t.all3Sections)
    }
    setActiveChapterId(chapterId)
    setActiveSectionIndex(undefined)
    setActiveQuizQuestions(list)
  }

  // Play All for active tab
  const handlePlayAll = () => {
    if (mainTab === "grammar") {
      setQuizTitle(
        language === "ja" ? "文法全問題" : "Toàn bộ câu hỏi ngữ pháp"
      )
      setQuizSubtitle(
        formatString(t.allQuestionsSubtitle, {
          count: grammarQuestions.length,
        })
      )
      setActiveChapterId(undefined)
      setActiveSectionIndex(undefined)
      setActiveQuizQuestions(grammarQuestions)
    } else {
      setQuizTitle(
        language === "ja" ? "JLPT 過去問全問題" : "Toàn bộ câu hỏi đề thi JLPT"
      )
      setQuizSubtitle(
        formatString(t.allQuestionsSubtitle, { count: examQuestions.length })
      )
      setActiveChapterId(undefined)
      setActiveSectionIndex(undefined)
      setActiveQuizQuestions(examQuestions)
    }
  }

  const handlePlayRandom = () => {
    const list = mainTab === "grammar" ? grammarQuestions : examQuestions
    const shuffled = [...list].sort(() => 0.5 - Math.random())
    const subset = shuffled.slice(0, Math.min(20, list.length))

    setQuizTitle(
      mainTab === "grammar"
        ? language === "ja"
          ? "文法スピード練習"
          : "Luyện nhanh ngữ pháp"
        : language === "ja"
          ? "JLPT スピード練習"
          : "Luyện nhanh đề thi JLPT"
    )
    setQuizSubtitle(t.quickQuizSubtitle)
    setActiveChapterId(undefined)
    setActiveSectionIndex(undefined)
    setActiveQuizQuestions(subset)
  }

  const handlePlayMistakes = () => {
    if (currentTabMistakes.length === 0) return

    setQuizTitle(t.mistakesReviewTitle)
    setQuizSubtitle(
      formatString(t.mistakesReviewSubtitle, {
        count: currentTabMistakes.length,
      })
    )
    setActiveChapterId(undefined)
    setActiveSectionIndex(undefined)
    setActiveQuizQuestions(currentTabMistakes)
  }

  const handleExitQuiz = () => {
    setActiveQuizQuestions(null)
    refreshProgress()
  }

  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  const handleConfirmReset = () => {
    resetAllProgress()
    refreshProgress()
    setResetDialogOpen(false)
  }

  // 1. If currently in Quiz Mode: Render QuizPlayer
  if (activeQuizQuestions && activeQuizQuestions.length > 0) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[#f6f8fc] p-3 text-slate-800 transition-colors duration-150 dark:bg-[#0d0e14] dark:text-slate-100">
        <QuizPlayer
          key={`quiz-${activeChapterId ?? "custom"}-${activeSectionIndex ?? "all"}`}
          questions={activeQuizQuestions}
          title={quizTitle}
          subtitle={quizSubtitle}
          onExit={handleExitQuiz}
          chapterId={activeChapterId}
          sectionIndex={activeSectionIndex}
          onNextSection={(cId, nextIdx) => handleStartSection(cId, nextIdx)}
        />
      </main>
    )
  }

  // 2. If a Chapter is selected: Render the dedicated Sections List page
  if (selectedChapterForSections) {
    return (
      <main className="min-h-screen bg-[#f6f8fc] pb-12 text-slate-800 transition-colors duration-150 dark:bg-[#0f111a] dark:text-slate-100">
        <ChapterSectionsView
          chapter={selectedChapterForSections}
          progress={progress}
          onBack={() => {
            setSelectedChapterForSections(null)
            refreshProgress()
          }}
          onSelectSection={handleStartSection}
          onSelectChapterAll={handleStartChapterAll}
          onSwitchChapter={(newId) => {
            const nextCh = allChapters.find((c) => c.chapter_id === newId)
            if (nextCh) {
              setSelectedChapterForSections(nextCh)
            }
          }}
        />
      </main>
    )
  }

  // 3. Home Screen
  const mistakesCount = currentTabMistakes.length

  return (
    <main className="min-h-screen bg-[#f6f8fc] pb-16 text-slate-800 transition-colors duration-150 dark:bg-[#0f111a] dark:text-slate-100">
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        {/* Top Header Bar */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5368a4] text-white">
              <HugeiconsIcon icon={BookOpen01Icon} size={24} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />

            <button
              onClick={() => {
                const s = sounds.toggle()
                setSoundEnabled(s)
              }}
              title={soundEnabled ? t.soundTooltipOn : t.soundTooltipOff}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-800 active:scale-95 dark:border-white/10 dark:bg-[#1a1c26] dark:text-slate-300 dark:hover:text-white"
            >
              <HugeiconsIcon
                icon={soundEnabled ? VolumeHighIcon : VolumeMute01Icon}
                size={18}
              />
            </button>

            <AlertDialog
              open={resetDialogOpen}
              onOpenChange={setResetDialogOpen}
            >
              <AlertDialogTrigger
                render={
                  <button
                    type="button"
                    title={t.resetTooltip}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:text-rose-500 active:scale-95 dark:border-white/10 dark:bg-[#1a1c26] dark:text-slate-400 dark:hover:text-rose-400"
                  >
                    <HugeiconsIcon icon={RotateRight01Icon} size={16} />
                  </button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.resetTitle}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.resetConfirm}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel size="lg">{t.cancel}</AlertDialogCancel>
                  <AlertDialogAction size="lg" onClick={handleConfirmReset}>
                    {t.resetConfirmAction}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Subtitle & Main Headline */}
        <div className="mb-6">
          <p className="text-xs font-medium text-slate-400 dark:text-slate-400">
            {t.heroNotice}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-600 sm:text-3xl dark:text-slate-200">
            {t.heroHeading}
          </h2>
        </div>

        {/* Main 2 Tabs Switcher: Grammar vs JLPT */}
        <div className="mb-3 grid grid-cols-2 rounded-2xl bg-slate-200/60 p-1.5 dark:bg-[#181926]">
          <button
            onClick={() => {
              setMainTab("grammar")
              setSearchQuery("")
            }}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition-all duration-200 sm:px-4 sm:text-base ${mainTab === "grammar"
              ? "bg-white text-slate-900 shadow-sm dark:bg-[#5368a4] dark:text-white"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
          >
            <HugeiconsIcon icon={BookOpen01Icon} size={18} />
            <span>{t.tabGrammar}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold transition ${mainTab === "grammar"
                ? "bg-slate-100 text-[#5368a4] dark:bg-white/20 dark:text-white"
                : "bg-slate-300/60 text-slate-600 dark:bg-white/10 dark:text-slate-400"
                }`}
            >
              {grammarChapters.length}
            </span>
          </button>

          <button
            onClick={() => {
              setMainTab("jlpt")
              setSearchQuery("")
            }}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition-all duration-200 sm:px-4 sm:text-base ${mainTab === "jlpt"
              ? "bg-white text-slate-900 shadow-sm dark:bg-[#5368a4] dark:text-white"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
          >
            <HugeiconsIcon icon={CheckmarkBadge01Icon} size={18} />
            <span>{t.tabJlpt}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold transition ${mainTab === "jlpt"
                ? "bg-indigo-100 text-indigo-600 dark:bg-white/20 dark:text-white"
                : "bg-slate-300/60 text-slate-600 dark:bg-white/10 dark:text-slate-400"
                }`}
            >
              {examChapters.length}
            </span>
          </button>
        </div>

        {/* 3 Stats Cards in a Row reflecting current tab */}
        <div className="mb-3 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-2xl bg-white p-4 text-center transition dark:bg-[#181926]">
            <span className="block text-xl leading-none font-bold text-[#38529a] sm:text-2xl dark:text-[#8ea2db]">
              {currentTabQuestions.length}
            </span>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-400">
              {t.totalQuestions}
            </span>
          </div>

          <div className="rounded-2xl bg-white p-4 text-center transition dark:bg-[#181926]">
            <span className="block text-xl leading-none font-bold text-[#38529a] sm:text-2xl dark:text-[#8ea2db]">
              {currentTabChapters.length}
            </span>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-400">
              {mainTab === "grammar"
                ? t.totalChapters
                : language === "ja"
                  ? "回分"
                  : "Bộ đề"}
            </span>
          </div>

          <div className="rounded-2xl bg-white p-4 text-center transition dark:bg-[#181926]">
            <span className="block text-xl leading-none font-bold text-[#38529a] sm:text-2xl dark:text-[#8ea2db]">
              {currentTabPracticedCount > 0
                ? currentTabPracticedCount
                : mainTab === "grammar"
                  ? "10"
                  : examQuestions.length}
            </span>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-400">
              {currentTabPracticedCount > 0
                ? t.questionsPracticed
                : t.questionsPerSession}
            </span>
          </div>
        </div>

        {/* Quick Launch Action reflecting current tab */}
        <div className="mb-5 flex flex-col gap-3">
          <button
            onClick={handlePlayAll}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#5368a4] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#475b94] active:scale-[0.99] sm:text-base"
          >
            <HugeiconsIcon icon={PlayIcon} size={18} />
            {mainTab === "grammar"
              ? `${t.practiceAll} (${currentTabQuestions.length} ${t.questionsUnit})`
              : formatString(t.practiceEntireExam, {
                count: currentTabQuestions.length,
              })}
          </button>

          <button
            onClick={handlePlayRandom}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99] sm:text-sm dark:border-white/10 dark:bg-[#181926] dark:text-slate-200 dark:hover:bg-[#202234]"
          >
            <HugeiconsIcon
              icon={SparklesIcon}
              size={16}
              className="text-[#5368a4]"
            />
            {t.practiceRandom}
          </button>

          {mistakesCount > 0 && (
            <button
              onClick={handlePlayMistakes}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 active:scale-[0.99] sm:text-sm dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-900/40"
            >
              <HugeiconsIcon icon={RotateRight01Icon} size={15} />
              {formatString(t.reviewMistakes, { count: mistakesCount })}
            </button>
          )}
        </div>

        {/* Tab 1 Content: GRAMMAR */}
        {mainTab === "grammar" && (
          <div className="animate-in duration-200 fade-in">
            {/* Search & Range Filters */}
            <div className="mb-5 space-y-3">
              <div className="relative">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={18}
                  className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200/90 bg-white py-2.5 pr-4 pl-10 text-sm text-slate-800 placeholder-slate-400 transition focus:border-[#5368a4] focus:outline-none dark:border-white/10 dark:bg-[#181926] dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-[#7189d1]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {t.clear}
                  </button>
                )}
              </div>

              <div className="flex scrollbar-none items-center gap-1.5 overflow-x-auto pb-1">
                {(
                  [
                    {
                      id: "all",
                      label: `${t.filterAll} (${grammarChapters.length})`,
                    },
                    {
                      id: "1-10",
                      label: language === "ja" ? "第1〜10回" : "Ch. 1 - 10",
                    },
                    {
                      id: "11-20",
                      label: language === "ja" ? "第11〜20回" : "Ch. 11 - 20",
                    },
                    {
                      id: "21-30",
                      label: language === "ja" ? "第21〜30回" : "Ch. 21 - 30",
                    },
                    { id: "incomplete", label: t.filterIncomplete },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setGrammarFilter(tab.id)}
                    className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${grammarFilter === tab.id
                      ? "border-[#5368a4] bg-[#5368a4] text-white"
                      : "border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-[#181926] dark:text-slate-300 dark:hover:bg-[#202234]"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section List / Chapter Grid: 2 Columns */}
            <div className="mb-3.5 flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300">
                {`${t.chapterListTitle} (${filteredGrammarChapters.length})`}
              </h3>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-2">
              {filteredGrammarChapters.map((ch) => {
                const qCount = ch.sections.reduce(
                  (acc, sec) => acc + (sec.questions?.length || 0),
                  0
                )

                // Check if completed
                const allSecCompleted =
                  ch.sections.length > 0 &&
                  ch.sections.every((_, sIdx) => {
                    const key = `ch${ch.chapter_id}-s${sIdx}`
                    return progress.sectionProgress[key]?.completed
                  })

                return (
                  <button
                    key={ch.chapter_id}
                    onClick={() => handleSelectChapter(ch)}
                    className="group flex min-h-23 cursor-pointer flex-col justify-between rounded-xl bg-white p-4 text-left transition-all duration-200 hover:bg-[#5368a4] hover:text-white active:scale-[0.98] sm:p-4 dark:bg-[#181926] dark:hover:bg-[#5368a4]"
                  >
                    <div className="flex w-full items-center justify-between">
                      <h4 className="line-clamp-1 text-base font-bold text-slate-600 transition group-hover:text-white sm:text-lg dark:text-slate-200">
                        {ch.chapter_name}
                      </h4>
                      {allSecCompleted && (
                        <span className="text-emerald-500 transition group-hover:text-white">
                          <HugeiconsIcon
                            icon={CheckmarkBadge01Icon}
                            size={16}
                          />
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-400 transition group-hover:text-white/80 dark:text-slate-400">
                      {qCount} {t.questionsUnit}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Tab 2 Content: JLPT */}
        {mainTab === "jlpt" && (
          <div className="animate-in duration-200 fade-in">
            {/* Search Bar for JLPT */}
            <div className="mb-5">
              <div className="relative">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={18}
                  className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                />
                <input
                  type="text"
                  placeholder={
                    language === "ja"
                      ? "問題文、語彙、漢字で検索..."
                      : "Tìm theo câu hỏi, từ vựng, chữ Hán trong đề..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200/90 bg-white py-2.5 pr-4 pl-10 text-sm text-slate-800 placeholder-slate-400 transition focus:border-[#5368a4] focus:outline-none dark:border-white/10 dark:bg-[#181926] dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-[#7189d1]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {t.clear}
                  </button>
                )}
              </div>
            </div>

            {/* List of JLPT Exams */}
            <div className="mb-3.5 flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300">
                {t.filterExams} ({filteredExamChapters.length})
              </h3>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-2">
              {filteredExamChapters.map((exam) => {
                const examQCount = exam.sections.reduce(
                  (acc, s) => acc + (s.questions?.length || 0),
                  0
                )
                const completedCount = exam.sections.filter((_, sIdx) => {
                  const key = `ch${exam.chapter_id}-s${sIdx}`
                  return progress.sectionProgress[key]?.completed
                }).length
                const isExamCompleted =
                  completedCount === exam.sections.length &&
                  exam.sections.length > 0

                return (
                  <div
                    key={exam.chapter_id}
                    className="flex flex-col justify-between gap-3.5 rounded-2xl bg-white px-4 py-3.5 transition-all duration-200 sm:flex-row sm:items-center sm:p-5 dark:bg-[#181926] dark:hover:border-white/20"
                  >
                    <div
                      onClick={() => handleSelectChapter(exam)}
                      className="group min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-slate-600 transition group-hover:text-[#5368a4] sm:text-lg dark:text-white dark:group-hover:text-[#8ea2db]">
                          {exam.chapter_name}
                        </h4>
                        {isExamCompleted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500">
                            <HugeiconsIcon
                              icon={CheckmarkBadge01Icon}
                              size={14}
                            />
                            {t.completedBadge}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-400">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {examQCount} {t.questionsUnit}
                        </span>
                        <span>•</span>
                        <span>
                          {exam.sections.length}{" "}
                          {language === "ja" ? "大問" : "phần thi"}
                        </span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Bottom Note */}
        <div className="flex items-center justify-center gap-1.5 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
          <HugeiconsIcon
            icon={HelpCircleIcon}
            size={14}
            className="shrink-0 text-slate-400 dark:text-slate-500"
          />
          <span>{t.footerNote}</span>
        </div>
      </div>
    </main>
  )
}
