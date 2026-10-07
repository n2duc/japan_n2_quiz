"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpen01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  PlayIcon,
  HelpCircleIcon,
  CheckmarkBadge01Icon,
  CheckmarkCircle01Icon,
  StarIcon,
  Note01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import { Chapter } from "@/lib/types"
import { getGrammarChapters, getExamChapters } from "@/lib/chapters-data"
import { ProgressState } from "@/lib/storage"
import { useLanguage } from "@/lib/i18n"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface ChapterSectionsViewProps {
  chapter: Chapter
  progress: ProgressState
  onBack: () => void
  onSelectSection: (chapterId: number | string, sectionIndex: number) => void
  onSelectChapterAll: (chapterId: number | string) => void
  onSwitchChapter?: (chapterId: number | string) => void
}

export function ChapterSectionsView({
  chapter,
  progress,
  onBack,
  onSelectSection,
  onSelectChapterAll,
  onSwitchChapter,
}: ChapterSectionsViewProps) {
  const router = useRouter()
  const { t, formatString, language } = useLanguage()
  const chapterId = chapter.chapter_id
  const isExam = chapter.category === "exam"
  const [sheetOpen, setSheetOpen] = useState(false)
  const activeChapterRef = useRef<HTMLButtonElement | null>(null)
  const [sheetTab, setSheetTab] = useState<"grammar" | "jlpt">(
    isExam ? "jlpt" : "grammar"
  )

  // Sync active tab with current chapter category
  useEffect(() => {
    setSheetTab(chapter.category === "exam" ? "jlpt" : "grammar")
  }, [chapter.chapter_id, chapter.category])

  useEffect(() => {
    if (sheetOpen) {
      // Delay slightly for Sheet transition and portal mount
      const timer = setTimeout(() => {
        if (activeChapterRef.current) {
          activeChapterRef.current.scrollIntoView({
            block: "center",
            behavior: "smooth",
          })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [sheetOpen, chapterId, sheetTab])

  const grammarChapters = useMemo(() => getGrammarChapters(), [])
  const examChapters = useMemo(() => getExamChapters(), [])
  const currentSheetChapters =
    sheetTab === "grammar" ? grammarChapters : examChapters

  const handleSelectChapterFromSheet = (targetChapterId: number | string) => {
    setSheetOpen(false)
    if (onSwitchChapter) {
      onSwitchChapter(targetChapterId)
    } else {
      router.push(`/chapter/${targetChapterId}`)
    }
  }

  const totalChapterQuestions = chapter.sections.reduce(
    (acc, sec) => acc + (sec.questions?.length || 0),
    0
  )

  // Calculate real progress
  const completedSectionsCount = chapter.sections.filter((_, sIdx) => {
    const key = `ch${chapterId}-s${sIdx}`
    return progress.sectionProgress[key]?.completed
  }).length

  const totalScore = chapter.sections.reduce((acc, _, sIdx) => {
    const key = `ch${chapterId}-s${sIdx}`
    return acc + (progress.sectionProgress[key]?.score || 0)
  }, 0)

  const totalPossible = chapter.sections.reduce((acc, _, sIdx) => {
    const key = `ch${chapterId}-s${sIdx}`
    return acc + (progress.sectionProgress[key]?.total || 0)
  }, 0)

  const accuracyPercentage =
    totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : null

  const grammarSectionsConfig = [
    {
      index: 0,
      icon: BookOpen01Icon,
      defaultDesc: t.section1DefaultDesc,
      cardBg:
        "bg-[#e2eaff] dark:bg-[#161d30] hover:bg-[#dbe5fc] dark:hover:bg-[#1b253e] border-[#d4e0fc] dark:border-[#283659]",
      iconBg: "bg-white dark:bg-[#202a45]",
      iconColor: "text-[#4162bc] dark:text-[#7d9eff]",
      accentBar: "bg-[#4162bc] dark:bg-[#5b82e8]",
    },
    {
      index: 1,
      icon: StarIcon,
      defaultDesc: t.section2DefaultDesc,
      cardBg:
        "bg-[#ffebe3] dark:bg-[#291b16] hover:bg-[#fde2d7] dark:hover:bg-[#34221c] border-[#fadbd0] dark:border-[#4d2f24]",
      iconBg: "bg-white dark:bg-[#3a251e]",
      iconColor: "text-[#c85a2b] dark:text-[#f89569]",
      accentBar: "bg-[#c85a2b] dark:bg-[#f27e4e]",
    },
    {
      index: 2,
      icon: Note01Icon,
      defaultDesc: t.section3DefaultDesc,
      cardBg:
        "bg-[#eee9ff] dark:bg-[#221933] hover:bg-[#e7e0fd] dark:hover:bg-[#2c2041] border-[#dfd6fa] dark:border-[#422e66]",
      iconBg: "bg-white dark:bg-[#31234a]",
      iconColor: "text-[#7c4dca] dark:text-[#b491fa]",
      accentBar: "bg-[#7c4dca] dark:bg-[#9a6fee]",
    },
  ]

  const examSectionsConfig = [
    {
      index: 0,
      icon: BookOpen01Icon,
      defaultDesc: language === "ja" ? "漢字の読み方" : "Cách đọc Kanji chuẩn",
      cardBg:
        "bg-[#e2eaff] dark:bg-[#161d30] hover:bg-[#dbe5fc] dark:hover:bg-[#1b253e] border-[#d4e0fc] dark:border-[#283659]",
      iconBg: "bg-white dark:bg-[#202a45]",
      iconColor: "text-[#4162bc] dark:text-[#7d9eff]",
      accentBar: "bg-[#4162bc] dark:bg-[#5b82e8]",
    },
    {
      index: 1,
      icon: Note01Icon,
      defaultDesc: language === "ja" ? "漢字の表記" : "Cách viết chữ Hán đúng",
      cardBg:
        "bg-[#e6f4ea] dark:bg-[#13281c] hover:bg-[#d8edd9] dark:hover:bg-[#173223] border-[#ceead6] dark:border-[#1e462f]",
      iconBg: "bg-white dark:bg-[#1b3b28]",
      iconColor: "text-[#137333] dark:text-[#81c995]",
      accentBar: "bg-[#137333] dark:bg-[#81c995]",
    },
    {
      index: 2,
      icon: SparklesIcon,
      defaultDesc:
        language === "ja"
          ? "派生語・複合語の形成"
          : "Cấu tạo từ ghép & tiền tố/hậu tố",
      cardBg:
        "bg-[#eee9ff] dark:bg-[#221933] hover:bg-[#e7e0fd] dark:hover:bg-[#2c2041] border-[#dfd6fa] dark:border-[#422e66]",
      iconBg: "bg-white dark:bg-[#31234a]",
      iconColor: "text-[#7c4dca] dark:text-[#b491fa]",
      accentBar: "bg-[#7c4dca] dark:bg-[#9a6fee]",
    },
    {
      index: 3,
      icon: CheckmarkCircle01Icon,
      defaultDesc:
        language === "ja"
          ? "文脈に応じた適切な語彙"
          : "Chọn từ phù hợp với ngữ cảnh câu",
      cardBg:
        "bg-[#e3f2fd] dark:bg-[#122436] hover:bg-[#d2eaf9] dark:hover:bg-[#162e45] border-[#bbdefb] dark:border-[#1e3f5e]",
      iconBg: "bg-white dark:bg-[#193753]",
      iconColor: "text-[#0288d1] dark:text-[#4fc3f7]",
      accentBar: "bg-[#0288d1] dark:bg-[#4fc3f7]",
    },
    {
      index: 4,
      icon: SparklesIcon,
      defaultDesc:
        language === "ja"
          ? "同義語・言い換え表現"
          : "Từ đồng nghĩa và cách diễn đạt tương đương",
      cardBg:
        "bg-[#fff8e1] dark:bg-[#2e2612] hover:bg-[#ffecb3] dark:hover:bg-[#3d3215] border-[#ffe082] dark:border-[#54441b]",
      iconBg: "bg-white dark:bg-[#423719]",
      iconColor: "text-[#b26a00] dark:text-[#fdd835]",
      accentBar: "bg-[#f57f17] dark:bg-[#fdd835]",
    },
    {
      index: 5,
      icon: CheckmarkBadge01Icon,
      defaultDesc:
        language === "ja"
          ? "単語の正しい使い方"
          : "Cách dùng từ chính xác trong câu",
      cardBg:
        "bg-[#fbe9e7] dark:bg-[#2d1b18] hover:bg-[#ffccbc] dark:hover:bg-[#3a221e] border-[#ffab91] dark:border-[#522e28]",
      iconBg: "bg-white dark:bg-[#422622]",
      iconColor: "text-[#d84315] dark:text-[#ff8a65]",
      accentBar: "bg-[#d84315] dark:bg-[#ff8a65]",
    },
    {
      index: 6,
      icon: BookOpen01Icon,
      defaultDesc:
        language === "ja" ? "文の文法判断" : "Ngữ pháp câu & mẫu câu N2",
      cardBg:
        "bg-[#e0f2f1] dark:bg-[#102725] hover:bg-[#b2dfdb] dark:hover:bg-[#163432] border-[#80cbc4] dark:border-[#1d4744]",
      iconBg: "bg-white dark:bg-[#183d3a]",
      iconColor: "text-[#00796b] dark:text-[#4db6ac]",
      accentBar: "bg-[#00796b] dark:bg-[#4db6ac]",
    },
    {
      index: 7,
      icon: StarIcon,
      defaultDesc:
        language === "ja"
          ? "並べ替え・★に入るもの"
          : "Sắp xếp trật tự từ tìm vị trí ngôi sao ★",
      cardBg:
        "bg-[#ffebe3] dark:bg-[#291b16] hover:bg-[#fde2d7] dark:hover:bg-[#34221c] border-[#fadbd0] dark:border-[#4d2f24]",
      iconBg: "bg-white dark:bg-[#3a251e]",
      iconColor: "text-[#c85a2b] dark:text-[#f89569]",
      accentBar: "bg-[#c85a2b] dark:bg-[#f27e4e]",
    },
  ]

  const sectionsConfig = isExam ? examSectionsConfig : grammarSectionsConfig

  return (
    <div className="mx-auto w-full max-w-2xl animate-in px-4 py-6 text-slate-800 duration-200 fade-in lg:max-w-6xl xl:max-w-7xl lg:px-8 lg:py-10 dark:text-slate-100">
      {/* Top Header Bar with navigation hierarchy & Chapter Switch Sheet */}
      <header className="mb-6 lg:mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBack}
            aria-label={t.back}
            title={t.back}
            className="flex h-10 w-10 lg:h-11 lg:w-11 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-[#5368a4] focus-visible:outline-none active:scale-95 dark:border-white/10 dark:bg-[#1a1c26] dark:text-slate-300 dark:hover:bg-[#202234] dark:hover:text-white"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
          </button>
          <div>
            <span className="block text-[11px] font-bold tracking-wider text-[#5368a4] uppercase dark:text-[#8ea2db]">
              {isExam
                ? language === "ja"
                  ? "公式過去問"
                  : "Đề thi chính thức JLPT N2"
                : `Chapter ${chapterId}`}
            </span>
            <h1 className="text-lg leading-snug font-bold tracking-tight text-slate-900 sm:text-xl lg:text-2xl dark:text-white">
              {chapter.chapter_name}
            </h1>
          </div>
        </div>

        {/* Change Chapter Button (Sheet Trigger) */}
        <div className="flex items-center gap-2">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  className="flex h-10 lg:h-11 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 lg:px-4 text-xs lg:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-[#5368a4] focus-visible:outline-none active:scale-95 dark:border-white/10 dark:bg-[#1a1c26] dark:text-slate-300 dark:hover:bg-[#202234] dark:hover:text-white"
                >
                  <HugeiconsIcon
                    icon={BookOpen01Icon}
                    size={16}
                    className="text-[#5368a4]"
                  />
                  <span>{t.changeChapter}</span>
                </button>
              }
            />
            <SheetContent
              side="right"
              className="flex w-full flex-col gap-0 border-l border-slate-200 bg-[#f8fafc] p-0 text-slate-800 sm:max-w-md dark:border-white/10 dark:bg-[#12131c] dark:text-slate-100"
            >
              <SheetHeader className="border-b border-slate-200/90 bg-white p-5 pb-4 text-left dark:border-white/10 dark:bg-[#181926]">
                <SheetTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                  <HugeiconsIcon
                    icon={BookOpen01Icon}
                    size={20}
                    className="text-[#5368a4]"
                  />
                  <span>{t.changeChapter}</span>
                </SheetTitle>
                <SheetDescription className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {t.selectChapterDesc}
                </SheetDescription>
              </SheetHeader>

              {/* Data Type Tab Switcher */}
              <div className="border-b border-slate-200/80 bg-slate-100/50 p-3 dark:border-white/5 dark:bg-[#151622]">
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-[#1e202f]">
                  <button
                    type="button"
                    onClick={() => setSheetTab("grammar")}
                    className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${sheetTab === "grammar"
                      ? "bg-white text-slate-900 shadow-xs dark:bg-[#5368a4] dark:text-white"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                      }`}
                  >
                    <HugeiconsIcon icon={BookOpen01Icon} size={15} />
                    <span>{t.tabGrammar}</span>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-white">
                      {grammarChapters.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetTab("jlpt")}
                    className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${sheetTab === "jlpt"
                      ? "bg-white text-slate-900 shadow-xs dark:bg-[#5368a4] dark:text-white"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                      }`}
                  >
                    <HugeiconsIcon icon={CheckmarkBadge01Icon} size={15} />
                    <span>{t.tabJlpt}</span>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-white">
                      {examChapters.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Scrollable Chapter List */}
              <div className="flex-1 scroll-pt-4 space-y-2 overflow-y-auto scroll-smooth p-4">
                {currentSheetChapters.map((ch) => {
                  const isCurrent = ch.chapter_id === chapterId
                  const qCount = ch.sections.reduce(
                    (acc, sec) => acc + (sec.questions?.length || 0),
                    0
                  )
                  const isChapterDone =
                    ch.sections.length > 0 &&
                    ch.sections.every((_, sIdx) => {
                      const key = `ch${ch.chapter_id}-s${sIdx}`
                      return progress.sectionProgress[key]?.completed
                    })

                  return (
                    <button
                      key={ch.chapter_id}
                      ref={isCurrent ? activeChapterRef : null}
                      onClick={() =>
                        handleSelectChapterFromSheet(ch.chapter_id)
                      }
                      className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-all duration-150 active:scale-[0.99] ${isCurrent
                        ? "border-[#5368a4] bg-[#5368a4]/15 text-[#5368a4] dark:text-[#9bb0ea]"
                        : "border-slate-100 bg-white text-slate-700 hover:border-slate-200/40 hover:bg-slate-50 dark:border-white/5 dark:bg-[#181926] dark:text-slate-200 dark:hover:border-white/15 dark:hover:bg-[#202234]"
                        }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${isCurrent
                            ? "bg-[#5368a4] text-white"
                            : ch.category === "exam"
                              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                              : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                            }`}
                        >
                          {ch.category === "exam" ? (
                            <HugeiconsIcon
                              icon={CheckmarkBadge01Icon}
                              size={18}
                            />
                          ) : (
                            ch.chapter_id
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-bold text-slate-800 sm:text-base dark:text-slate-100">
                              {ch.chapter_name}
                            </span>
                          </div>
                          <span className="mt-0.5 block truncate text-xs text-slate-400 dark:text-slate-400">
                            {qCount} {t.questionsUnit} • {ch.sections.length}{" "}
                            {ch.category === "exam"
                              ? language === "ja"
                                ? "大問"
                                : "phần thi"
                              : t.sectionsUnit}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {isChapterDone && (
                          <span className="text-emerald-500">
                            <HugeiconsIcon
                              icon={CheckmarkBadge01Icon}
                              size={18}
                            />
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main 2-Column Responsive Layout on Laptop (Grid on lg+, Linear on mobile) */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
        {/* Left Column on Laptop / Top Block on Mobile */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-8 space-y-4 mb-6 lg:mb-0">
          {/* Subtitle & Headline */}
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-400">
              {t.heroNotice}
            </p>
            <div className="mt-0.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                {t.heroHeading}
              </h2>
            </div>
          </div>

          {/* Stat Pills reflecting accurate chapter progress */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            <div className="rounded-2xl bg-white p-3 text-center transition dark:bg-[#181926]">
              <span className="block text-lg leading-none font-bold text-[#38529a] sm:text-xl dark:text-[#8ea2db]">
                {totalChapterQuestions}
              </span>
              <span className="mt-1 block text-xs font-medium text-slate-400 dark:text-slate-400">
                {t.totalQuestions}
              </span>
            </div>

            <div className="rounded-2xl bg-white p-3 text-center transition dark:bg-[#181926]">
              <span className="block text-lg leading-none font-bold text-[#38529a] sm:text-xl dark:text-[#8ea2db]">
                {completedSectionsCount}/{chapter.sections.length}
              </span>
              <span className="mt-1 block text-xs font-medium text-slate-400 dark:text-slate-400">
                {t.completedBadge}
              </span>
            </div>

            <div className="rounded-2xl bg-white p-3 text-center transition dark:bg-[#181926]">
              <span className="block text-lg leading-none font-bold text-[#38529a] sm:text-xl dark:text-[#8ea2db]">
                {accuracyPercentage !== null ? `${accuracyPercentage}%` : "—"}
              </span>
              <span className="mt-1 block text-xs font-medium text-slate-400 dark:text-slate-400">
                {t.accuracy}
              </span>
            </div>
          </div>

          {/* Primary Action Button: Play All Chapter */}
          <div>
            <button
              onClick={() => onSelectChapterAll(chapterId)}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#5368a4] px-5 py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-[#475a92] hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#5368a4] focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.99]"
            >
              <HugeiconsIcon icon={PlayIcon} size={18} />
              <span>
                {formatString(t.practiceEntireChapter, {
                  chapter: chapter.chapter_name,
                })}
              </span>
            </button>
          </div>
        </div>

        {/* Right Column on Laptop / Main Content: Section Cards */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3.5">
          {/* Section List Header */}
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-sm sm:text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {formatString(t.sectionsInChapter, { chapter: chapter.chapter_name })}
            </h3>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-400">
              {chapter.sections.length} {t.sectionsUnit}
            </span>
          </div>

          {/* Section Cards with responsive 1-column on mobile, 2-column on laptop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-3.5">
            {chapter.sections.map((sec, sIdx) => {
              const cfg = sectionsConfig[sIdx] || {
                index: sIdx,
                icon: BookOpen01Icon,
                defaultDesc: "Chọn đáp án đúng nhất",
                cardBg:
                  "bg-white dark:bg-[#181926] border-slate-200 dark:border-white/10",
                iconBg: "bg-white dark:bg-white/10",
                iconColor: "text-slate-600 dark:text-slate-300",
                accentBar: "bg-slate-400",
              }

              const key = `ch${chapterId}-s${sIdx}`
              const sp = progress.sectionProgress[key]
              const isDone = Boolean(sp?.completed)
              const qCount = sec.questions?.length || 0
              const desc = sec.instruction || cfg.defaultDesc
              const progressPercent =
                isDone && sp ? Math.round((sp.score / sp.total) * 100) : 0

              return (
                <div
                  key={sIdx}
                  onClick={() => onSelectSection(chapterId, sIdx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onSelectSection(chapterId, sIdx)
                    }
                  }}
                  className={`flex cursor-pointer flex-col justify-between rounded-2xl p-4 sm:p-4.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#5368a4] focus-visible:outline-none active:scale-[0.99] ${cfg.cardBg}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Rounded square with distinct icon */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/5 dark:border-white/10 ${cfg.iconBg || "bg-white dark:bg-white/10"
                        }`}
                    >
                      <HugeiconsIcon
                        icon={cfg.icon}
                        size={20}
                        className={cfg.iconColor}
                      />
                    </div>

                    {/* Section title, description and accent bar */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm sm:text-base leading-snug font-semibold text-slate-800 dark:text-slate-100">
                          {sec.section_name}
                        </h4>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {isDone && sp ? (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              {sp.score}/{sp.total}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {qCount} {t.questionsUnit}
                            </span>
                          )}
                          <HugeiconsIcon
                            icon={ArrowRight01Icon}
                            size={16}
                            className="text-slate-400 dark:text-slate-400"
                          />
                        </div>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs font-normal text-slate-500 sm:text-sm dark:text-slate-400">
                        {desc}
                      </p>

                      {/* Real progress track */}
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                        <div
                          className={`h-full ${cfg.accentBar} rounded-full transition-all duration-300`}
                          style={{
                            width: isDone ? `${progressPercent}%` : "0%",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer Info Note matching bottom */}
      <footer className="mt-12 flex items-center justify-center gap-1.5 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
        <HugeiconsIcon
          icon={HelpCircleIcon}
          size={14}
          className="shrink-0 text-slate-400 dark:text-slate-500"
        />
        <span>{t.footerNote}</span>
      </footer>
    </div>
  )
}
