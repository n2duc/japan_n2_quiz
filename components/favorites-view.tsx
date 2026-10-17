"use client"

import { useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  StarIcon,
  PlayIcon,
  Search01Icon,
  VolumeHighIcon,
  Delete02Icon,
  BookOpen01Icon,
  CheckmarkBadge01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons"
import { QuizQuestionItem } from "@/lib/types"
import { useLanguage } from "@/lib/i18n"
import { sounds } from "@/lib/sound"
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

export interface FavoritesViewProps {
  questions: QuizQuestionItem[]
  onPracticeAll: (questions?: QuizQuestionItem[]) => void
  onPracticeSingle: (q: QuizQuestionItem) => void
  onToggleBookmark: (questionId: string) => void
  onClearAll: () => void
  onExploreGrammar: () => void
  onExploreExams: () => void
}

interface QuestionGroup {
  chapterId: string | number
  chapterName: string
  category: string
  questions: QuizQuestionItem[]
}

export function FavoritesView({
  questions,
  onPracticeAll,
  onPracticeSingle,
  onToggleBookmark,
  onClearAll,
  onExploreGrammar,
  onExploreExams,
}: FavoritesViewProps) {
  const { t, formatString, language } = useLanguage()

  const [activeFilter, setActiveFilter] = useState<"all" | "grammar" | "exam">(
    "all"
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedOptions, setExpandedOptions] = useState<
    Record<string, boolean>
  >({})
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  const toggleOptions = (id: string) => {
    setExpandedOptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const grammarCount = useMemo(
    () => questions.filter((q) => q.category !== "exam").length,
    [questions]
  )
  const examCount = useMemo(
    () => questions.filter((q) => q.category === "exam").length,
    [questions]
  )

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // 1. Filter by category
      if (activeFilter === "grammar" && q.category === "exam") return false
      if (activeFilter === "exam" && q.category !== "exam") return false

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const textMatch = q.questionText?.toLowerCase().includes(query)
        const wordMatch = q.word?.toLowerCase().includes(query)
        const chapterMatch = q.chapterName?.toLowerCase().includes(query)
        const sectionMatch = q.sectionName?.toLowerCase().includes(query)
        const optionsMatch = Object.values(q.options || {}).some((opt) =>
          opt.toLowerCase().includes(query)
        )
        const optionsViMatch = Object.values(q.optionsVi || {}).some((optVi) =>
          optVi.toLowerCase().includes(query)
        )

        return (
          textMatch ||
          wordMatch ||
          chapterMatch ||
          sectionMatch ||
          optionsMatch ||
          optionsViMatch
        )
      }

      return true
    })
  }, [questions, activeFilter, searchQuery])

  // Group filtered questions by Chapter / Exam
  const groupedQuestions = useMemo(() => {
    const groups: QuestionGroup[] = []
    const groupMap = new Map<string | number, QuestionGroup>()

    for (const q of filteredQuestions) {
      let group = groupMap.get(q.chapterId)
      if (!group) {
        group = {
          chapterId: q.chapterId,
          chapterName: q.chapterName || String(q.chapterId),
          category: q.category || "grammar",
          questions: [],
        }
        groupMap.set(q.chapterId, group)
        groups.push(group)
      }
      group.questions.push(q)
    }

    return groups
  }, [filteredQuestions])

  const handleSpeak = (text: string) => {
    sounds.speakJapanese(text.replace(/<\/?u>/g, ""))
  }

  // Format question text cleanly (underline, blanks)
  const renderQuestionText = (text: string) => {
    if (!text) return null
    if (!text.includes("<u>")) {
      return <span>{text}</span>
    }
    const parts = text.split(/(<\/?u>)/g)
    let isUnderlined = false
    return (
      <span>
        {parts.map((part, idx) => {
          if (part === "<u>") {
            isUnderlined = true
            return null
          }
          if (part === "</u>") {
            isUnderlined = false
            return null
          }
          if (isUnderlined) {
            return (
              <span
                key={idx}
                className="mx-0.5 underline decoration-[#5368a4] decoration-2 underline-offset-4 font-bold text-[#5368a4] dark:text-[#8ea2db]"
              >
                {part}
              </span>
            )
          }
          return <span key={idx}>{part}</span>
        })}
      </span>
    )
  }

  // EMPTY STATE: No questions bookmarked at all
  if (questions.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-14 text-center backdrop-blur-xs dark:border-white/10 dark:bg-[#181926]/70">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 dark:bg-amber-500/20">
          <HugeiconsIcon icon={StarIcon} size={32} className="fill-amber-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {t.noFavoritesTitle}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-400 dark:text-slate-400">
          {t.noFavoritesDesc}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onExploreGrammar}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#5368a4] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#475b94] active:scale-95"
          >
            <HugeiconsIcon icon={BookOpen01Icon} size={16} />
            <span>{t.exploreGrammarBtn}</span>
          </button>
          <button
            onClick={onExploreExams}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-white/10 dark:bg-[#202234] dark:text-slate-200 dark:hover:bg-[#282a40]"
          >
            <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} />
            <span>{t.exploreExamsBtn}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col gap-3">
        {/* Search input */}
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            type="text"
            placeholder={t.searchFavoritesPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl bg-white py-2.5 lg:py-3 pr-4 pl-10 text-sm lg:text-base text-slate-800 placeholder-slate-400 transition focus:outline-none dark:bg-[#181926] dark:text-slate-100 dark:placeholder-slate-500"
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

        {/* Categories Pill Switcher + Clear All Button */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex scrollbar-none items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveFilter("all")}
              className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs lg:text-sm font-semibold whitespace-nowrap transition ${
                activeFilter === "all"
                  ? "bg-[#5368a4] text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-[#181926] dark:text-slate-300 dark:hover:bg-[#202234]"
              }`}
            >
              {t.filterAllFavorites} ({questions.length})
            </button>

            <button
              onClick={() => setActiveFilter("grammar")}
              className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs lg:text-sm font-semibold whitespace-nowrap transition ${
                activeFilter === "grammar"
                  ? "bg-[#5368a4] text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-[#181926] dark:text-slate-300 dark:hover:bg-[#202234]"
              }`}
            >
              {t.filterGrammarFavorites} ({grammarCount})
            </button>

            <button
              onClick={() => setActiveFilter("exam")}
              className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs lg:text-sm font-semibold whitespace-nowrap transition ${
                activeFilter === "exam"
                  ? "bg-[#5368a4] text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-[#181926] dark:text-slate-300 dark:hover:bg-[#202234]"
              }`}
            >
              {t.filterExamFavorites} ({examCount})
            </button>
          </div>

          {/* Clear all bookmarks button */}
          <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
            <AlertDialogTrigger
              render={
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:bg-[#181926] dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={14} />
                  <span>{t.clearAllFavorites}</span>
                </button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t.clearAllFavoritesConfirmTitle}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t.clearAllFavoritesConfirmDesc}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel size="lg">{t.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  size="lg"
                  onClick={() => {
                    onClearAll()
                    setClearDialogOpen(false)
                  }}
                  className="bg-rose-600 text-white hover:bg-rose-700"
                >
                  {t.clearAllFavorites}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Global Questions Count & Practice Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm lg:text-base font-bold tracking-tight text-slate-700 dark:text-slate-300">
          {language === "ja"
            ? `保存済み問題一覧 (${filteredQuestions.length}問 · ${groupedQuestions.length}項目)`
            : `Danh sách câu hỏi đã lưu (${filteredQuestions.length} câu · ${groupedQuestions.length} đề/bài)`}
        </h3>

        {filteredQuestions.length > 0 && (
          <button
            onClick={() => onPracticeAll(filteredQuestions)}
            className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#5368a4] transition hover:underline dark:text-[#8ea2db]"
          >
            <HugeiconsIcon icon={PlayIcon} size={14} />
            <span>
              {language === "ja"
                ? `すべて練習 (${filteredQuestions.length})`
                : `Luyện tất cả (${filteredQuestions.length})`}
            </span>
          </button>
        )}
      </div>

      {/* EMPTY FILTER STATE */}
      {filteredQuestions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-8 text-center dark:border-white/10 dark:bg-[#181926]/50">
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400">
            {language === "ja"
              ? "条件に一致するお気に入り問題が見つかりませんでした。"
              : "Không tìm thấy câu hỏi yêu thích nào phù hợp với bộ lọc."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-3 inline-flex cursor-pointer items-center gap-1 rounded-xl bg-slate-200/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
            >
              {t.clear}
            </button>
          )}
        </div>
      )}

      {/* Grouped Questions List by Exam/Chapter */}
      <div className="space-y-4 sm:space-y-5">
        {groupedQuestions.map((group) => {
          const isExam = group.category === "exam"

          return (
            <div
              key={String(group.chapterId)}
              className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 dark:bg-[#181926]"
            >
              {/* Group Header: Exam / Chapter Info & Practice Exam Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <span
                    className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold tracking-wide ${
                      isExam
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                        : "bg-slate-100 text-[#5368a4] dark:bg-white/10 dark:text-[#8ea2db]"
                    }`}
                  >
                    {isExam ? "JLPT N2" : `Chapter ${group.chapterId}`}
                  </span>

                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    {group.chapterName}
                  </h4>

                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    ({group.questions.length}{" "}
                    {language === "ja" ? "問" : "câu"})
                  </span>
                </div>

                {/* Practice this specific Exam/Chapter */}
                <button
                  onClick={() => onPracticeAll(group.questions)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#5368a4]/10 text-[#5368a4] hover:bg-[#5368a4] hover:text-white dark:bg-[#8ea2db]/15 dark:text-[#8ea2db] dark:hover:bg-[#5368a4] dark:hover:text-white px-3 py-1.5 text-xs font-bold transition-all active:scale-95"
                >
                  <HugeiconsIcon icon={PlayIcon} size={13} />
                  <span>
                    {formatString(t.practiceGroupFavorites, {
                      count: group.questions.length,
                    })}
                  </span>
                </button>
              </div>

              {/* Questions inside this Group */}
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {group.questions.map((q) => {
                  const isExpanded = Boolean(expandedOptions[q.id])

                  return (
                    <div
                      key={q.id}
                      className="py-4 first:pt-3.5 last:pb-1"
                    >
                      {/* Question Top Row: Meta info & Bookmark Star */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                            Câu {q.questionNumber}
                          </span>
                          {q.sectionName && q.sectionName !== group.chapterName && (
                            <>
                              <span className="text-xs text-slate-300 dark:text-slate-600">
                                •
                              </span>
                              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                {q.sectionName}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Unbookmark button */}
                        <button
                          onClick={() => onToggleBookmark(q.id)}
                          title={
                            language === "ja"
                              ? "お気に入りから削除"
                              : "Bỏ lưu câu hỏi này"
                          }
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-amber-500 transition hover:bg-amber-50 active:scale-95 dark:hover:bg-amber-950/30"
                        >
                          <HugeiconsIcon
                            icon={StarIcon}
                            size={18}
                            className="fill-amber-500"
                          />
                        </button>
                      </div>

                      {/* Question Text */}
                      <div className="mt-2 text-base sm:text-lg font-medium leading-relaxed text-slate-900 dark:text-slate-100">
                        {renderQuestionText(q.questionText || q.word || "")}
                      </div>

                      {/* Collapsible Options Section */}
                      {isExpanded && (
                        <div className="mt-3 space-y-2 rounded-xl bg-slate-50/90 p-3.5 dark:bg-[#12131d]/90 animate-in duration-200 fade-in">
                          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-400">
                            <span>{t.correctAnswerLabel}:</span>
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-600 font-bold dark:text-emerald-400">
                              #{q.answer}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(q.options || {}).map(([key, optText]) => {
                              const optNum = Number(key)
                              const isCorrect = optNum === q.answer
                              const viText = q.optionsVi?.[key]

                              return (
                                <div
                                  key={key}
                                  className={`flex items-start gap-2.5 rounded-xl p-2.5 text-xs sm:text-sm transition ${
                                    isCorrect
                                      ? "bg-emerald-50 text-emerald-950 font-bold dark:bg-emerald-950/40 dark:text-emerald-200"
                                      : "bg-white text-slate-700 dark:bg-[#1a1c26] dark:text-slate-300"
                                  }`}
                                >
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                      isCorrect
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-400"
                                    }`}
                                  >
                                    {key}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div>{optText}</div>
                                    {viText && (
                                      <div className="mt-0.5 text-[11px] font-normal text-slate-400 dark:text-slate-400">
                                        {viText}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {q.fullSentence && (
                            <div className="mt-2 rounded-lg bg-white/70 p-2 text-xs text-slate-600 dark:bg-[#1a1c26]/70 dark:text-slate-300">
                              <span className="font-semibold text-slate-400">
                                {language === "ja" ? "完成文: " : "Câu hoàn chỉnh: "}
                              </span>
                              {q.fullSentence}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Question Actions Toolbar (No AI Tutor, No Border/Shadow) */}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {/* TTS Speech Button */}
                          <button
                            onClick={() =>
                              handleSpeak(q.questionText || q.word || "")
                            }
                            title={t.speakQuestion}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 active:scale-95 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            <HugeiconsIcon icon={VolumeHighIcon} size={16} />
                          </button>

                          {/* Toggle Options Button */}
                          <button
                            onClick={() => toggleOptions(q.id)}
                            className="flex h-8 cursor-pointer items-center gap-1 rounded-xl bg-slate-100 px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 active:scale-95 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            <span>{isExpanded ? t.hideOptions : t.showOptions}</span>
                            <HugeiconsIcon
                              icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
                              size={14}
                            />
                          </button>
                        </div>

                        {/* Practice This Question */}
                        <button
                          onClick={() => onPracticeSingle(q)}
                          className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#5368a4] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#475b94] active:scale-95"
                        >
                          <HugeiconsIcon icon={PlayIcon} size={14} />
                          <span>{t.practiceThisQuestion}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
