"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home01Icon,
  AiChat01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  VolumeHighIcon,
  VolumeMute01Icon,
  RotateRight01Icon,
  StarIcon,
  SparklesIcon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  CheckmarkBadge01Icon,
  BookOpen01Icon,
  FireIcon,
} from "@hugeicons/core-free-icons"
import { QuizQuestionItem } from "@/lib/types"
import { sounds } from "@/lib/sound"
import { useLanguage } from "@/lib/i18n"
import { useQuiz } from "@/lib/quiz-context"
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
  const { t, formatString, language } = useLanguage()
  const { setIsQuizActive } = useQuiz()

  // Track quiz active status for ChatBot and global layout
  useEffect(() => {
    setIsQuizActive(true)
    return () => {
      setIsQuizActive(false)
    }
  }, [setIsQuizActive])

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

  const handleAskAI = () => {
    if (!currentQ) return
    const optionsText = Object.entries(currentQ.options || {})
      .map(([k, v]) => `${k}. ${v}`)
      .join("\n")
    const prompt =
      currentQ.word
        ? language === "ja"
          ? `言葉「${currentQ.word}」の使い方（用法問題）について詳しく解説してください：\n【対象の言葉】\n${currentQ.word}\n\n【選択肢】\n${optionsText}\n\n【正解】: 選択肢 ${currentQ.answer}\nなぜこの選択肢が適切で、他の選択肢での使い方が不自然・誤りなのか、コロケーションや文脈を含めて分かりやすく解説してください。`
          : `Hãy giải thích chi tiết cách dùng từ「${currentQ.word}」trong câu hỏi này giúp tôi:\n【Từ vựng】:\n${currentQ.word}\n\n【Các câu lựa chọn】:\n${optionsText}\n\n【Đáp án đúng】: Lựa chọn ${currentQ.answer}\nGiải thích tại sao cách dùng ở đáp án này là tự nhiên/chính xác, và tại sao các câu còn lại dùng sai từ này (chỉ ra từ nên thay thế nếu có), phân tích sắc thái ngữ nghĩa.`
        : language === "ja"
          ? `この問題について詳しく解説してください：\n【問題】\n${currentQ.questionText}\n\n【選択肢】\n${optionsText}\n\n【正解】: 選択肢 ${currentQ.answer}\nなぜこの選択肢が正解で、他の選択肢が不適切なのか、文法や意味を分かりやすく説明してください。`
          : `Hãy giải thích chi tiết câu hỏi này giúp tôi:\n【Câu hỏi】:\n${currentQ.questionText}\n\n【Các lựa chọn】:\n${optionsText}\n\n【Đáp án đúng】: Lựa chọn ${currentQ.answer}\nGiải thích tại sao đáp án này đúng và các đáp án khác sai, phân tích cấu trúc ngữ pháp và từ vựng liên quan.`
    window.dispatchEvent(
      new CustomEvent("open-n2-ai-chat", {
        detail: {
          prompt,
          autoSend: true,
        },
      })
    )
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
      <div className="m-auto mx-auto my-auto w-full max-w-md sm:max-w-xl lg:max-w-2xl px-4 py-8">
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

  // Helper to render question text with <u> tags and prominent （ ） blanks
  const renderFormattedQuestionText = (text: string) => {
    if (!text) return ""

    const hasFormatting =
      text.includes("<u>") || /[（\(][\s\u3000]*[）\)]/.test(text)
    if (!hasFormatting) return text

    const TOKEN_REGEX = /(<u>.*?<\/u>|[（\(][\s\u3000]*[）\)])/g
    const PAREN_BLANK_REGEX = /^[（\(][\s\u3000]*[）\)]$/

    const parts = text.split(TOKEN_REGEX)

    const correctText = currentQ
      ? (currentQ.options[String(currentQ.answer)] || "").replace(/<\/?u>/g, "")
      : ""
    const pickedText =
      currentQ && currentSelected
        ? (currentQ.options[String(currentSelected)] || "").replace(/<\/?u>/g, "")
        : ""
    const isCorrect = currentSelected === currentQ?.answer

    return (
      <>
        {parts.map((part, idx) => {
          if (part.startsWith("<u>") && part.endsWith("</u>")) {
            const content = part.slice(3, -4)
            return (
              <span
                key={idx}
                className="font-black underline decoration-2 sm:decoration-[2.5px] underline-offset-4 sm:underline-offset-6 decoration-[#5368a4] dark:decoration-indigo-400 text-[#435790] dark:text-[#a5b4fc]"
              >
                {content}
              </span>
            )
          }

          if (PAREN_BLANK_REGEX.test(part)) {
            // State 1: Answered -> reveal the answer filled into the slot
            if (currentAnswered && correctText) {
              if (isCorrect) {
                return (
                  <span
                    key={idx}
                    className="mx-1.5 inline-flex items-center gap-1.5 rounded-xl border-2 border-emerald-500 bg-emerald-500/15 px-3 py-0.5 align-middle text-base sm:text-lg font-black text-emerald-600 shadow-xs transition-all dark:border-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-300 animate-in zoom-in-95 duration-200"
                    title={language === "ja" ? "正解" : "Chính xác"}
                  >
                    <span className="font-mono text-xs opacity-60">（</span>
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      size={16}
                      className="shrink-0 text-emerald-600 dark:text-emerald-400"
                    />
                    <span>{correctText}</span>
                    <span className="font-mono text-xs opacity-60">）</span>
                  </span>
                )
              }

              // Answered incorrectly
              return (
                <span
                  key={idx}
                  className="mx-1.5 inline-flex flex-wrap items-center gap-1.5 rounded-xl border-2 border-rose-400/80 bg-rose-500/10 px-2.5 py-0.5 align-middle text-base sm:text-lg font-bold shadow-xs transition-all dark:border-rose-400/60 dark:bg-rose-500/20 animate-in zoom-in-95 duration-200"
                  title={
                    language === "ja"
                      ? `不正解（正解: ${correctText}）`
                      : `Chưa đúng (Đáp án: ${correctText})`
                  }
                >
                  <span className="font-mono text-xs opacity-50 text-slate-500 dark:text-zinc-400">（</span>
                  {pickedText && (
                    <span className="line-through text-rose-500 dark:text-rose-400 font-semibold text-xs sm:text-sm opacity-85">
                      {pickedText}
                    </span>
                  )}
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">
                    {correctText}
                  </span>
                  <span className="font-mono text-xs opacity-50 text-slate-500 dark:text-zinc-400">）</span>
                </span>
              )
            }

            // State 2: Unanswered -> prominent, clearly visible blank slot
            return (
              <span
                key={idx}
                className="group mx-1.5 inline-flex min-w-15 sm:min-w-19 h-[1.7em] items-center justify-center rounded-xl border-2 border-dashed border-[#5368a4] bg-[#5368a4]/10 px-2.5 py-0.5 align-middle text-sm sm:text-base font-black text-[#5368a4] shadow-xs select-none transition-all hover:bg-[#5368a4]/15 hover:border-[#5368a4]/80 dark:border-indigo-400 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25"
                title={language === "ja" ? "（ ）に入る選択肢を選んでください" : "Chỗ trống cần điền （ ）"}
              >
                <span className="font-mono text-xs sm:text-sm opacity-60">（</span>
                <span className="mx-1.5 inline-block h-0.5 w-4 sm:w-6 rounded-full bg-[#5368a4]/50 group-hover:bg-[#5368a4] transition-colors dark:bg-indigo-400/50 dark:group-hover:bg-indigo-300"></span>
                <span className="font-mono text-xs sm:text-sm opacity-60">）</span>
              </span>
            )
          }

          return <React.Fragment key={idx}>{part}</React.Fragment>
        })}
      </>
    )
  }

  // Helper to render completed sentence with filled answer for feedback
  const renderSentenceWithFilledAnswer = (text: string, answerText: string) => {
    if (!text) return ""
    const cleanText = text.replace(/<\/?u>/g, "")
    const TOKEN_REGEX = /([（\(][\s\u3000]*[）\)])/g
    const PAREN_BLANK_REGEX = /^[（\(][\s\u3000]*[）\)]$/

    if (!TOKEN_REGEX.test(cleanText)) return cleanText

    const parts = cleanText.split(TOKEN_REGEX)
    return (
      <>
        {parts.map((part, idx) => {
          if (PAREN_BLANK_REGEX.test(part)) {
            return (
              <span
                key={idx}
                className="mx-1 inline-flex items-center rounded-md border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300"
              >
                {answerText}
              </span>
            )
          }
          return <React.Fragment key={idx}>{part}</React.Fragment>
        })}
      </>
    )
  }

  // Reusable Question Card Component
  const renderQuestionCard = () => (
    <div className="flex min-h-32 sm:min-h-44 flex-col justify-between rounded-3xl bg-white p-4 sm:p-6 text-center lg:p-6 dark:bg-[#181920]">
      {/* Card Top: Instruction & Action Buttons */}
      <div className="flex items-start justify-between gap-3 text-left">
        {/* Instruction */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-relaxed tracking-wide text-slate-400 dark:text-zinc-400">
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

        {/* Audio & Bookmark Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={handleAskAI}
            title={language === "ja" ? "AIで解説" : "Hỏi AI về câu này"}
            className="flex h-7.5 cursor-pointer items-center gap-1 rounded-full bg-[#5368a4]/10 px-2 text-[#5368a4] transition hover:bg-[#5368a4]/20 active:scale-95 dark:bg-[#5368a4]/25 dark:text-[#93a7e6] dark:hover:bg-[#5368a4]/35"
          >
            <HugeiconsIcon icon={SparklesIcon} size={14} />
            <span className="text-[11px] font-bold">AI</span>
          </button>
          <button
            onClick={() => {
              if (currentQ.word) {
                handleSpeak(currentQ.word)
                return
              }
              const raw = currentQ.questionText || ""
              const clean = raw.replace(/<\/?u>/g, "")
              if (currentAnswered && currentQ.options[String(currentQ.answer)]) {
                handleSpeak(
                  clean.replace(
                    /[（\(][\s\u3000]*[）\)]/g,
                    currentQ.options[String(currentQ.answer)].replace(/<\/?u>/g, "")
                  )
                )
              } else {
                handleSpeak(clean.replace(/[（\(][\s\u3000]*[）\)]/g, " ... "))
              }
            }}
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
      </div>

      {/* Central Prominent Japanese Question Text */}
      <div className="my-auto py-2">
        {currentQ.word ? (
          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#5368a4]/20 bg-[#5368a4]/10 px-3 py-1 text-xs font-semibold text-[#5368a4] dark:border-[#5368a4]/30 dark:bg-[#5368a4]/25 dark:text-[#a5b4fc]">
              <HugeiconsIcon icon={BookOpen01Icon} size={14} />
              <span>
                {language === "ja"
                  ? "言葉の使い方（用法）"
                  : "Cách dùng từ vựng (用法)"}
              </span>
            </div>
            <div className="group inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200/90 bg-linear-to-b from-slate-50 to-white px-6 sm:px-8 py-3 transition-all hover:border-[#5368a4]/40 hover:shadow-md dark:border-zinc-800 dark:from-zinc-900/90 dark:to-zinc-900/50">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-wider text-slate-900 dark:text-white">
                {currentQ.word}
              </h2>
              <button
                onClick={() => handleSpeak(currentQ.word!)}
                title={t.speakQuestion}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-200/60 text-slate-600 transition hover:bg-[#5368a4]/20 hover:text-[#5368a4] active:scale-95 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-[#5368a4]/30 dark:hover:text-[#93a7e6]"
              >
                <HugeiconsIcon icon={VolumeHighIcon} size={17} />
              </button>
            </div>
          </div>
        ) : currentQ.questionText?.includes("★") ? (
          <div
            className={`text-lg leading-relaxed font-bold tracking-wide text-slate-900 sm:text-xl lg:text-2xl dark:text-white whitespace-pre-line ${currentQ.questionText?.includes("\n") ? "inline-block text-left max-w-full" : ""
              }`}
          >
            {currentQ.questionText.split("★").map((chunk, cIdx, arr) => (
              <React.Fragment key={cIdx}>
                <span>{renderFormattedQuestionText(chunk)}</span>
                {cIdx < arr.length - 1 && (
                  <span className="mx-1 inline-flex items-center justify-center rounded-md border border-amber-400/50 bg-amber-400/20 px-1.5 py-0.5 text-xs font-black text-amber-500 dark:text-amber-300">
                    ★
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <h2
            className={`text-lg leading-relaxed font-bold tracking-wide text-slate-900 sm:text-xl lg:text-2xl dark:text-white whitespace-pre-line ${currentQ.questionText?.includes("\n") ? "inline-block text-left max-w-full" : ""
              }`}
          >
            {renderFormattedQuestionText(currentQ.questionText)}
          </h2>
        )}
      </div>

      {/* Card Bottom Tag */}
      <div className="mt-2 flex items-center justify-center gap-2">
        <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
          {currentQ.sectionName}
        </span>
      </div>
    </div>
  )

  // Helper to render option text with <u> tag or fallback to word highlighting
  const renderFormattedOptionText = (text: string, targetWord?: string) => {
    if (!text) return ""

    // 1. If text contains explicit <u>...</u> tags
    if (text.includes("<u>")) {
      const parts = text.split(/(<u>.*?<\/u>)/g)
      return (
        <>
          {parts.map((part, idx) => {
            if (part.startsWith("<u>") && part.endsWith("</u>")) {
              const underlined = part.slice(3, -4)
              return (
                <span
                  key={idx}
                  className="font-extrabold underline decoration-2 underline-offset-4 decoration-amber-300 dark:decoration-amber-400"
                >
                  {underlined}
                </span>
              )
            }
            return <React.Fragment key={idx}>{part}</React.Fragment>
          })}
        </>
      )
    }

    // 2. Fallback: If no <u> tag, highlight targetWord if present
    if (targetWord && text.includes(targetWord)) {
      const parts = text.split(targetWord)
      return (
        <>
          {parts.map((chunk, cIdx, arr) => (
            <React.Fragment key={cIdx}>
              <span>{chunk}</span>
              {cIdx < arr.length - 1 && (
                <span className="font-extrabold underline decoration-2 underline-offset-4 decoration-amber-300 dark:decoration-amber-400">
                  {targetWord}
                </span>
              )}
            </React.Fragment>
          ))}
        </>
      )
    }

    return text
  }

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
            className={`relative flex min-h-12 sm:min-h-14 w-full cursor-pointer items-center justify-between rounded-2xl px-3.5 sm:px-4 py-2 sm:py-3 text-center font-semibold tracking-wide transition-all ${btnClass}`}
          >
            {/* Left Number Badge */}
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/20 text-[11px] font-black backdrop-blur-xs">
              {optNum}
            </span>

            {/* Center text & Vietnamese translation */}
            <div className="flex flex-1 flex-col items-center justify-center px-2">
              <span className="text-sm sm:text-base leading-snug font-semibold">
                {renderFormattedOptionText(valText, currentQ.word)}
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
                    : currentQ.word
                      ? (currentQ.options[currentQ.answer] || "").replace(/<\/?u>/g, "")
                      : (currentQ.questionText || "")
                        .replace(/<\/?u>/g, "")
                        .replace(
                          /[（\(][\s\u3000]*[）\)]/g,
                          (currentQ.options[String(currentQ.answer)] || "").replace(/<\/?u>/g, "")
                        )
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
        ) : currentQ.word ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3 dark:border-zinc-800 dark:bg-zinc-900/90">
            <span className="mb-0.5 block text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              {language === "ja"
                ? `「${currentQ.word}」の適切な使い方：`
                : `Cách dùng đúng của từ「${currentQ.word}」:`}
            </span>
            <p className="text-xs sm:text-sm leading-relaxed font-bold text-slate-900 dark:text-zinc-100">
              {renderFormattedOptionText(
                currentQ.options[currentQ.answer],
                currentQ.word
              )}
            </p>
            {currentQ.optionsVi?.[currentQ.answer] && (
              <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400 leading-normal">
                {currentQ.optionsVi[currentQ.answer]}
              </p>
            )}
          </div>
        ) : /[（\(][\s\u3000]*[）\)]/.test(currentQ.questionText || "") ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3 dark:border-zinc-800 dark:bg-zinc-900/90">
            <span className="mb-0.5 block text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              {formatString(t.completeSentence, {
                order:
                  language === "ja"
                    ? `選択肢 ${currentQ.answer}`
                    : `Đáp án ${currentQ.answer}`,
              })}
            </span>
            <p className="text-xs sm:text-sm leading-relaxed font-medium text-slate-800 dark:text-zinc-200 whitespace-pre-line">
              {renderSentenceWithFilledAnswer(
                currentQ.questionText || "",
                (currentQ.options[String(currentQ.answer)] || "").replace(/<\/?u>/g, "")
              )}
            </p>
            {currentQ.optionsVi?.[String(currentQ.answer)] && (
              <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400 leading-normal">
                <span className="font-semibold text-[#5368a4] dark:text-[#a5b4fc]">
                  {(currentQ.options[String(currentQ.answer)] || "").replace(/<\/?u>/g, "")}:
                </span>{" "}
                {currentQ.optionsVi[String(currentQ.answer)]}
              </p>
            )}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col justify-between pb-3 select-none ${hasPassage
        ? "max-w-md lg:max-w-4xl xl:max-w-5xl"
        : "max-w-md lg:max-w-2xl xl:max-w-3xl"
        }`}
    >
      {/* Top Header */}
      <header className="px-2 lg:px-3 pt-3 pb-2">
        <div className="flex items-center justify-between">
          {/* Home Button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onExit}
              aria-label={t.backHome}
              className="flex h-9 w-9 sm:h-10 sm:w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-white/5 dark:bg-[#1e2026] dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <HugeiconsIcon icon={Home01Icon} size={18} />
            </button>

            {/* Score Counter */}
            <div className="flex h-9 sm:h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 sm:px-4 py-1 dark:border-white/5 dark:bg-[#1e2026]">
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-400">
                {t.score}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                {score}
              </span>
              {streak >= 2 && (
                <span className="ml-0.5 sm:ml-1 flex items-center gap-0.5 text-[11px] font-bold text-amber-500 dark:text-amber-400">
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

          {/* Center Title and Progress */}
          <div className="mx-3 text-center flex-1">
            <h1 className="line-clamp-1 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {displayTitle}
            </h1>
            <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
              {displaySubtitle}
            </p>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            {/* AI Assistant Button */}
            <button
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("open-n2-ai-chat")
                )
              }
              title={language === "ja" ? "AI アシスタント" : "AI Trợ Giảng"}
              className="flex h-9 sm:h-10 cursor-pointer items-center gap-1.5 rounded-full border border-[#5368a4]/30 bg-white px-2.5 sm:px-3 text-[#5368a4] shadow-xs transition hover:bg-[#5368a4]/10 active:scale-95 dark:border-white/10 dark:bg-[#1e2026] dark:text-[#93a7e6] dark:hover:bg-zinc-800"
            >
              <HugeiconsIcon icon={AiChat01Icon} size={15} />
              <span className="hidden sm:inline text-xs font-semibold">
                {language === "ja" ? "AI" : "AI Trợ Giảng"}
              </span>
            </button>
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
