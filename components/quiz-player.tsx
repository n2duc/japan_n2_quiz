"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  VolumeHighIcon,
  VolumeMute01Icon,
  RotateRight01Icon,
  StarIcon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  CheckmarkBadge01Icon,
  BookOpen01Icon,
  FireIcon,
} from "@hugeicons/core-free-icons"
import { QuizQuestionItem } from "@/lib/types"
import { sounds } from "@/lib/sound"
import { useLanguage } from "@/lib/i18n"
import { getChapterById } from "@/lib/chapters-data"
import {
  getStoredProgress,
  recordQuestionResult,
  recordSectionCompleted,
  toggleBookmarkQuestion,
} from "@/lib/storage"

interface QuizPlayerProps {
  questions: QuizQuestionItem[]
  title?: string
  subtitle?: string
  onExit: () => void
  chapterId?: number | string
  sectionIndex?: number
  onNextSection?: (chapterId: number | string, nextSectionIndex: number) => void
}

export function QuizPlayer({
  questions,
  title,
  subtitle,
  onExit,
  chapterId,
  sectionIndex,
  onNextSection,
}: QuizPlayerProps) {
  const { t, formatString } = useLanguage()
  const activeTitle = title || t.allQuestionsTitle
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({})
  const [isAnswered, setIsAnswered] = useState<Record<number, boolean>>({})
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [soundActive, setSoundActive] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({})
  const [showPassage, setShowPassage] = useState(true)

  // Initialize sound & bookmarks
  useEffect(() => {
    setSoundActive(sounds.isEnabled())
    const progress = getStoredProgress()
    const bookmarkMap: Record<string, boolean> = {}
    progress.bookmarkedQuestionIds.forEach((id) => {
      bookmarkMap[id] = true
    })
    setBookmarked(bookmarkMap)
  }, [])

  // Reset quiz state whenever questions or section change
  useEffect(() => {
    setCurrentIndex(0)
    setSelectedAnswers({})
    setIsAnswered({})
    setScore(0)
    setStreak(0)
    setIsCompleted(false)
    setShowPassage(true)
  }, [questions, sectionIndex])

  const currentChapter =
    chapterId !== undefined ? getChapterById(chapterId) : undefined
  const nextSectionIndex =
    sectionIndex !== undefined ? sectionIndex + 1 : undefined
  const nextSection =
    currentChapter &&
      nextSectionIndex !== undefined &&
      nextSectionIndex < currentChapter.sections.length
      ? currentChapter.sections[nextSectionIndex]
      : undefined

  const currentQ = questions[currentIndex]
  const totalQuestions = questions.length

  const currentSelected = selectedAnswers[currentIndex]
  const currentAnswered = isAnswered[currentIndex] || false

  const handleToggleSound = () => {
    const newState = sounds.toggle()
    setSoundActive(newState)
  }

  const handleToggleBookmark = () => {
    if (!currentQ) return
    const isNowBookmarked = toggleBookmarkQuestion(currentQ.id)
    setBookmarked((prev) => ({
      ...prev,
      [currentQ.id]: isNowBookmarked,
    }))
  }

  const handleSpeak = (text: string) => {
    sounds.speakJapanese(text)
  }

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
    }
  }, [currentIndex])

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      // Completed quiz
      setIsCompleted(true)
      if (chapterId !== undefined && sectionIndex !== undefined) {
        // Calculate total correct
        let correctCount = 0
        questions.forEach((q, idx) => {
          if (selectedAnswers[idx] === q.answer) correctCount += 1
        })
        recordSectionCompleted(
          chapterId,
          sectionIndex,
          correctCount,
          totalQuestions
        )
      }
    }
  }, [
    currentIndex,
    totalQuestions,
    chapterId,
    sectionIndex,
    questions,
    selectedAnswers,
  ])

  const handleSelectOption = useCallback(
    (optKey: number) => {
      if (isAnswered[currentIndex] || !currentQ) return

      const isCorrect = optKey === currentQ.answer

      setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optKey }))
      setIsAnswered((prev) => ({ ...prev, [currentIndex]: true }))

      if (isCorrect) {
        sounds.playCorrect()
        setScore((s) => s + 10)
        setStreak((st) => st + 1)
      } else {
        sounds.playIncorrect()
        setStreak(0)
      }

      // Persist result
      recordQuestionResult(
        currentQ.id,
        isCorrect,
        currentQ.chapterId,
        currentQ.sectionIndex
      )

      // Auto-advance if enabled
      if (autoAdvance) {
        setTimeout(() => {
          handleNext()
        }, 1400)
      }
    },
    [isAnswered, currentIndex, currentQ, autoAdvance, handleNext]
  )

  // Keyboard navigation support for desktop/laptop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return
      }

      if (isCompleted || !currentQ) return

      if (["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault()
        const optNum = parseInt(e.key)
        if (!currentAnswered) {
          handleSelectOption(optNum)
        }
      } else if (
        e.key === "ArrowRight" ||
        (e.key === "Enter" && currentAnswered) ||
        (e.key === " " && currentAnswered)
      ) {
        e.preventDefault()
        handleNext()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        handlePrev()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    currentAnswered,
    isCompleted,
    currentQ,
    handleSelectOption,
    handleNext,
    handlePrev,
  ])

  const handleRestart = () => {
    setCurrentIndex(0)
    setSelectedAnswers({})
    setIsAnswered({})
    setScore(0)
    setStreak(0)
    setIsCompleted(false)
  }

  // Reconstructed sentence for Section 2 (ordered sequence)
  const starSentence = useMemo(() => {
    if (!currentQ || !currentQ.orderedSequence || !currentQ.questionText)
      return null
    const seq = currentQ.orderedSequence
    const parts = seq.map((optNum) => {
      const text = currentQ.options[String(optNum)] || ""
      const isStar = optNum === currentQ.answer
      return { text, isStar, num: optNum }
    })

    const regex = /___\s*___\s*★\s*___/
    const rawTemplate = currentQ.questionText

    if (regex.test(rawTemplate)) {
      const [before, after] = rawTemplate.split(regex)
      return { before, parts, after }
    }
    return { before: "", parts, after: "" }
  }, [currentQ])

  // Section 3: Highlight active blank in passage
  const formattedPassage = useMemo(() => {
    if (!currentQ || !currentQ.context) return null
    const blankNum = currentQ.questionNumber
    const lines = currentQ.context.split("\n")
    return lines
  }, [currentQ])

  if (!currentQ && !isCompleted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center text-slate-600 dark:text-zinc-300">
        <p className="text-lg">{t.questionNotFound}</p>
        <button
          onClick={onExit}
          className="mt-4 cursor-pointer rounded-full bg-slate-200 px-6 py-2.5 font-medium text-slate-800 transition hover:bg-slate-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
        >
          {t.back}
        </button>
      </div>
    )
  }

  // Completion Screen
  if (isCompleted) {
    let correctCount = 0
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) correctCount += 1
    })
    const percentage = Math.round((correctCount / totalQuestions) * 100)

    return (
      <div className="mx-auto w-full max-w-md sm:max-w-xl lg:max-w-2xl animate-in px-4 py-8 duration-300 zoom-in-95 fade-in">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-xl shadow-slate-200/40 dark:border-zinc-800 dark:bg-[#181920] dark:shadow-none">
          {/* Badge Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border-2 border-emerald-500/20 bg-emerald-500/10 shadow-sm">
            <HugeiconsIcon
              icon={CheckmarkBadge01Icon}
              size={38}
              className="text-emerald-500 dark:text-emerald-400"
            />
          </div>

          <h2 className="mb-2 text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {t.quizCompletedTitle}
          </h2>
          <p className="mx-auto mb-6 max-w-lg text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
            {activeTitle} {subtitle ? ` • ${subtitle}` : ""}
          </p>

          {/* 4 Stats Cards */}
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="flex flex-col items-center rounded-2xl bg-slate-50/80 p-3 sm:p-3.5 dark:bg-zinc-900/80">
              <span className="min-h-7 flex items-center justify-center text-center text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-400 uppercase dark:text-zinc-400 leading-tight">
                {t.score}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400 tracking-tight">
                {score}
                <span className="ml-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-400">
                  {t.pointsUnit}
                </span>
              </span>
            </div>

            <div className="flex flex-col items-center rounded-2xl bg-slate-50/80 p-3 sm:p-3.5 dark:bg-zinc-900/80">
              <span className="min-h-7 flex items-center justify-center text-center text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-400 uppercase dark:text-zinc-400 leading-tight">
                {t.accuracy}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-500 dark:text-emerald-400 tracking-tight">
                {percentage}%
              </span>
            </div>

            <div className="flex flex-col items-center rounded-2xl bg-slate-50/80 p-3 sm:p-3.5 dark:bg-zinc-900/80">
              <span className="min-h-7 flex items-center justify-center text-center text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-400 uppercase dark:text-zinc-400 leading-tight">
                {t.correct}
              </span>
              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {correctCount}/{totalQuestions}
                </span>
                {totalQuestions - correctCount > 0 && (
                  <span className="text-[10px] font-semibold text-rose-500 dark:text-rose-400">
                    {totalQuestions - correctCount} {t.wrong.toLowerCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center rounded-2xl bg-slate-50/80 p-3 sm:p-3.5 dark:bg-zinc-900/80">
              <span className="min-h-7 flex items-center justify-center text-center text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-400 uppercase dark:text-zinc-400 leading-tight">
                {t.streak}
              </span>
              <span className="inline-flex items-center justify-center gap-1 text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400 tracking-tight">
                {streak}
                <HugeiconsIcon icon={FireIcon} size={18} />
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {nextSection &&
              onNextSection &&
              chapterId !== undefined &&
              nextSectionIndex !== undefined && (
                <button
                  onClick={() => onNextSection(chapterId, nextSectionIndex)}
                  className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#5368a4] px-5 py-3.5 text-sm sm:text-base font-bold text-white shadow-md shadow-[#5368a4]/20 transition-all hover:bg-[#475b94] hover:shadow-lg hover:shadow-[#5368a4]/30 active:scale-[0.99]"
                >
                  <span className="truncate">
                    {t.nextSection}: {nextSection.section_name}
                  </span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={20}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              )}

            <div
              className="grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2"
            >
              <button
                onClick={handleRestart}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold transition-all active:scale-[0.99] ${nextSection && onNextSection
                  ? "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-transparent dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  : "bg-[#5368a4] text-white shadow-md shadow-[#5368a4]/20 hover:bg-[#475b94]"
                  }`}
              >
                <HugeiconsIcon icon={RotateRight01Icon} size={18} />
                <span>{t.retrySection}</span>
              </button>
              <button
                onClick={onExit}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-xs sm:text-sm font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-[0.99] dark:border-transparent dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                <HugeiconsIcon icon={Home01Icon} size={18} />
                <span>{t.backHome}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Header Title Text
  const displayTitle = activeTitle || currentQ.chapterName
  const displaySubtitle = `${currentIndex + 1} / ${totalQuestions}`
  const hasPassage = Boolean(currentQ.context)

  // Reusable Question Card Component
  const renderQuestionCard = () => (
    <div className="relative flex min-h-40 sm:min-h-44 flex-col justify-between rounded-3xl bg-white p-5 text-center sm:p-6 lg:p-6 dark:bg-[#181920]">
      {/* Audio & Bookmark Actions */}
      <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
        <button
          onClick={() => handleSpeak(currentQ.questionText || "")}
          title={t.speakQuestion}
          className="flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          <HugeiconsIcon icon={VolumeHighIcon} size={15} />
        </button>
        <button
          onClick={handleToggleBookmark}
          title={t.bookmark}
          className={`flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-full transition active:scale-95 ${bookmarked[currentQ.id]
            ? "border border-amber-400/40 bg-amber-500/20 text-amber-500 dark:text-amber-400"
            : "bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
        >
          <HugeiconsIcon icon={StarIcon} size={15} />
        </button>
      </div>

      {/* Card Top Instruction */}
      <div className="mb-3 pr-16 text-left sm:text-center">
        <p className="text-xs font-medium tracking-wide text-slate-400 dark:text-zinc-400">
          {currentQ.sectionInstruction ||
            (currentQ.sectionIndex === 1
              ? t.section2Instruction
              : currentQ.sectionIndex === 2
                ? formatString(t.section3Instruction, {
                  num: currentQ.questionNumber,
                })
                : t.section1Instruction)}
        </p>
      </div>

      {/* Central Prominent Japanese Question Text */}
      <div className="my-auto py-1.5">
        {currentQ.questionText?.includes("★") ? (
          <div className="text-lg leading-relaxed font-bold tracking-wide text-slate-900 sm:text-xl lg:text-2xl dark:text-white">
            {currentQ.questionText.split("★").map((chunk, cIdx, arr) => (
              <React.Fragment key={cIdx}>
                <span>{chunk}</span>
                {cIdx < arr.length - 1 && (
                  <span className="mx-1 inline-flex items-center justify-center rounded-md border border-amber-400/50 bg-amber-400/20 px-1.5 py-0.5 text-xs font-black text-amber-500 dark:text-amber-300">
                    ★
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <h2 className="text-lg leading-relaxed font-bold tracking-wide text-slate-900 sm:text-xl lg:text-2xl dark:text-white">
            {currentQ.questionText}
          </h2>
        )}
      </div>

      {/* Card Bottom Tag */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
          {currentQ.sectionName}
        </span>
      </div>
    </div>
  )

  // Reusable Options Component (supports 1 column or 2 columns)
  const renderOptions = (isTwoColumn: boolean) => (
    <div
      className={
        isTwoColumn
          ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5 lg:gap-3"
          : "grid grid-cols-1 gap-2.5"
      }
    >
      {Object.entries(currentQ.options).map(([keyStr, valText]) => {
        const optNum = parseInt(keyStr)
        const isPicked = currentSelected === optNum
        const isCorrectAnswer = optNum === currentQ.answer

        // Visual State Colors
        let btnClass =
          "bg-[#5368a4] hover:bg-[#475b94] dark:bg-[#3e5c8a] dark:hover:bg-[#4a6da1] text-white active:scale-[0.99] hover:shadow-xs"

        if (currentAnswered) {
          if (isPicked && isCorrectAnswer) {
            btnClass = "bg-emerald-600 text-white scale-[1.005] shadow-xs"
          } else if (isPicked && !isCorrectAnswer) {
            btnClass = "bg-rose-600 text-white"
          } else if (isCorrectAnswer) {
            btnClass = "bg-emerald-600/90 text-white"
          } else {
            btnClass =
              "bg-slate-200/80 dark:bg-[#253752]/70 text-slate-400 dark:text-zinc-400 opacity-60"
          }
        }

        const viMeaning = currentQ.optionsVi?.[keyStr]

        return (
          <button
            key={optNum}
            onClick={() => handleSelectOption(optNum)}
            disabled={currentAnswered}
            className={`relative flex min-h-13 sm:min-h-14 w-full cursor-pointer items-center justify-between rounded-2xl px-4 py-2.5 sm:py-3 text-center font-semibold tracking-wide transition-all ${btnClass}`}
          >
            {/* Left Number Badge */}
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/20 text-[11px] font-black backdrop-blur-xs">
              {optNum}
            </span>

            {/* Center text & Vietnamese translation */}
            <div className="flex flex-1 flex-col items-center justify-center px-2">
              <span className="text-sm sm:text-base leading-snug font-semibold">
                {valText}
              </span>
              {currentAnswered && viMeaning && (
                <span className="mt-0.5 text-xs leading-tight font-normal opacity-85">
                  {viMeaning}
                </span>
              )}
            </div>

            {/* Right Status Icon or Keyboard Shortcut on desktop */}
            <div className="flex h-6 w-6 shrink-0 items-center justify-center">
              {currentAnswered && isPicked && isCorrectAnswer && (
                <span className="text-emerald-200">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} />
                </span>
              )}
              {currentAnswered && isPicked && !isCorrectAnswer && (
                <span className="text-rose-200">
                  <HugeiconsIcon icon={CancelCircleIcon} size={20} />
                </span>
              )}
              {!currentAnswered && (
                <span className="hidden items-center justify-center rounded border border-white/25 px-1.5 py-0.5 text-[10px] font-mono text-white/70 lg:inline-flex">
                  {optNum}
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )

  // Reusable Feedback & Sentence Component
  const renderFeedback = () => {
    if (!currentAnswered) return null

    return (
      <div className="animate-in space-y-2.5 rounded-2xl bg-white p-3.5 sm:p-4 text-left duration-200 fade-in slide-in-from-bottom-2 dark:bg-[#171922]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {currentSelected === currentQ.answer ? (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                <span>{t.correctFeedback}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
                <HugeiconsIcon icon={CancelCircleIcon} size={16} />
                <span>
                  {formatString(t.wrongFeedback, { ans: currentQ.answer })}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() =>
              handleSpeak(
                currentQ.fullSentence
                  ? currentQ.fullSentence.replace(/\[|\]|\*/g, "")
                  : starSentence
                    ? `${starSentence.before}${starSentence.parts.map((p) => p.text).join("")}${starSentence.after}`
                    : currentQ.questionText || ""
              )
            }
            className="flex cursor-pointer items-center gap-1 rounded-lg bg-[#5368a4]/10 px-2 py-1 text-xs font-medium text-[#5368a4] hover:bg-[#5368a4]/15 hover:text-[#45578a] dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
          >
            <HugeiconsIcon icon={VolumeHighIcon} size={13} />
            {t.speakSentence}
          </button>
        </div>

        {/* If fullSentence or Section 2 Star Question, display full reconstructed sentence */}
        {currentQ.fullSentence ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3 dark:border-zinc-800 dark:bg-zinc-900/90">
            <span className="mb-0.5 block text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              {formatString(t.completeSentence, {
                order: `Đáp án ${currentQ.answer}`,
              })}
            </span>
            <p className="text-xs sm:text-sm leading-relaxed font-medium text-slate-800 dark:text-zinc-200">
              {currentQ.fullSentence}
            </p>
          </div>
        ) : starSentence && starSentence.parts.length > 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3 dark:border-zinc-800 dark:bg-zinc-900/90">
            <span className="mb-0.5 block text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              {formatString(t.completeSentence, {
                order: currentQ.orderedSequence?.join(" → ") || "",
              })}
            </span>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-zinc-200">
              {starSentence.before}
              {starSentence.parts.map((p, idx) => (
                <span
                  key={idx}
                  className={`mx-0.5 inline-block rounded px-1.5 py-0.5 font-semibold ${p.isStar
                    ? "bg-amber-400 font-bold text-black ring-2 ring-amber-300"
                    : "bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                >
                  {p.isStar && "★ "}
                  {p.text}
                </span>
              ))}
              {starSentence.after}
            </p>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col justify-between pb-4 select-none ${hasPassage
        ? "max-w-md lg:max-w-4xl xl:max-w-5xl"
        : "max-w-md lg:max-w-2xl xl:max-w-3xl"
        }`}
    >
      {/* Top Header */}
      <header className="px-2 lg:px-3 pt-3 pb-2">
        <div className="flex items-center justify-between">
          {/* Home Button */}
          <button
            onClick={onExit}
            aria-label={t.backHome}
            className="flex h-9 w-9 sm:h-10 sm:w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-white/5 dark:bg-[#1e2026] dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <HugeiconsIcon icon={Home01Icon} size={18} />
          </button>

          {/* Center Title and Progress */}
          <div className="mx-3 flex-1 text-center">
            <h1 className="line-clamp-1 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {displayTitle}
            </h1>
            <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
              {displaySubtitle}
            </p>
          </div>

          {/* Score Counter */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 dark:border-white/5 dark:bg-[#1e2026]">
            <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-400">
              {t.score}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
              {score}
            </span>
            {streak >= 2 && (
              <span className="ml-1 flex items-center gap-0.5 text-[11px] font-bold text-amber-500 dark:text-amber-400">
                <HugeiconsIcon
                  icon={FireIcon}
                  size={13}
                  className="text-amber-500 dark:text-amber-400"
                />
                {streak}
              </span>
            )}
          </div>
        </div>

        {/* Thin progress bar */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800/80">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="my-2.5 flex flex-1 flex-col justify-center">
        {hasPassage ? (
          /* Split Layout for Reading Passage on Laptop Screens */
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-5 lg:items-start">
            {/* Left Column: Sticky Reading Passage Reader */}
            <div className="lg:col-span-6 xl:col-span-6 mb-3 lg:mb-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 text-slate-800 transition-all dark:border-white/5 dark:bg-[#181920] dark:text-zinc-200 shadow-xs">
              <div className="mb-2.5 flex items-center justify-between border-b border-slate-200 pb-2 dark:border-zinc-800">
                <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#4162bc] dark:text-indigo-400">
                  <HugeiconsIcon icon={BookOpen01Icon} size={15} />
                  {t.passageTitle}
                </span>
                <button
                  onClick={() => setShowPassage(!showPassage)}
                  className="lg:hidden cursor-pointer rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:text-slate-900 dark:border-transparent dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                >
                  {showPassage ? t.collapsePassage : t.expandPassage}
                </button>
              </div>

              <div
                className={`space-y-2.5 pr-1 text-xs sm:text-sm leading-relaxed ${showPassage ? "block" : "hidden lg:block"
                  }`}
              >
                {formattedPassage?.map((paragraph, pIdx) => {
                  const parts = paragraph.split(/(\s[1-9]\s)/g)
                  return (
                    <p key={pIdx}>
                      {parts.map((part, partIdx) => {
                        const match = part.match(/^\s([1-9])\s$/)
                        if (match) {
                          const num = parseInt(match[1])
                          const isCurrent = num === currentQ.questionNumber
                          return (
                            <span
                              key={partIdx}
                              className={`mx-1 inline-block rounded px-1.5 py-0.5 text-xs font-bold transition ${isCurrent
                                ? "animate-pulse bg-amber-400 font-extrabold text-black ring-2 ring-amber-300"
                                : "border border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                }`}
                            >
                              （ {num} ）
                            </span>
                          )
                        }
                        return <span key={partIdx}>{part}</span>
                      })}
                    </p>
                  )
                })}
              </div>
            </div>

            {/* Right Column: Question + Options + Explanation */}
            <div className="lg:col-span-6 xl:col-span-6 flex flex-col space-y-3">
              {renderQuestionCard()}
              {renderOptions(false)}
              {renderFeedback()}
            </div>
          </div>
        ) : (
          /* Standard Quiz Layout: Refined Question Card + 2-Column Options Grid */
          <div className="flex flex-col space-y-3 sm:space-y-3.5">
            {renderQuestionCard()}
            {renderOptions(true)}
            {renderFeedback()}
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      <footer className="px-1 lg:px-2 pt-2">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-white/5 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            <span>{t.prevQuestion}</span>
            <kbd className="hidden lg:inline ml-1 font-mono text-[10px] text-slate-400 dark:text-zinc-500">
              ←
            </kbd>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundActive ? t.soundTooltipOn : t.soundTooltipOff}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-white/5 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <HugeiconsIcon
              icon={soundActive ? VolumeHighIcon : VolumeMute01Icon}
              size={18}
            />
          </button>

          <button
            onClick={handleNext}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#5368a4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#475b94]"
          >
            <span>
              {currentIndex === totalQuestions - 1
                ? t.viewResult
                : t.nextQuestion}
            </span>
            <kbd className="hidden lg:inline ml-1 font-mono text-[10px] text-white/70">
              Enter ↵
            </kbd>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </button>
        </div>
      </footer>
    </div>
  )
}
