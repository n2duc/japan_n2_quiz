"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BookOpen01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  PlayIcon,
  HelpCircleIcon,
  CheckmarkBadge01Icon,
  StarIcon,
  Note01Icon,
} from "@hugeicons/core-free-icons";
import { Chapter } from "@/lib/types";
import { getAllChapters } from "@/lib/chapters-data";
import { ProgressState } from "@/lib/storage";
import { useLanguage } from "@/lib/i18n";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ChapterSectionsViewProps {
  chapter: Chapter;
  progress: ProgressState;
  onBack: () => void;
  onSelectSection: (chapterId: number, sectionIndex: number) => void;
  onSelectChapterAll: (chapterId: number) => void;
  onSwitchChapter?: (chapterId: number) => void;
}

export function ChapterSectionsView({
  chapter,
  progress,
  onBack,
  onSelectSection,
  onSelectChapterAll,
  onSwitchChapter,
}: ChapterSectionsViewProps) {
  const router = useRouter();
  const { t, formatString } = useLanguage();
  const chapterId = chapter.chapter_id;
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeChapterRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (sheetOpen) {
      // Delay slightly for Sheet transition and portal mount
      const timer = setTimeout(() => {
        if (activeChapterRef.current) {
          activeChapterRef.current.scrollIntoView({
            block: "start",
            behavior: "smooth",
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sheetOpen, chapterId]);

  const allChapters = useMemo(() => getAllChapters(), []);

  const handleSelectChapterFromSheet = (targetChapterId: number) => {
    setSheetOpen(false);
    if (onSwitchChapter) {
      onSwitchChapter(targetChapterId);
    } else {
      router.push(`/chapter/${targetChapterId}`);
    }
  };

  const totalChapterQuestions = chapter.sections.reduce(
    (acc, sec) => acc + (sec.questions?.length || 0),
    0
  );

  // Calculate real progress
  const completedSectionsCount = chapter.sections.filter((_, sIdx) => {
    const key = `ch${chapterId}-s${sIdx}`;
    return progress.sectionProgress[key]?.completed;
  }).length;

  const totalScore = chapter.sections.reduce((acc, _, sIdx) => {
    const key = `ch${chapterId}-s${sIdx}`;
    return acc + (progress.sectionProgress[key]?.score || 0);
  }, 0);

  const totalPossible = chapter.sections.reduce((acc, _, sIdx) => {
    const key = `ch${chapterId}-s${sIdx}`;
    return acc + (progress.sectionProgress[key]?.total || 0);
  }, 0);

  const accuracyPercentage =
    totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : null;

  const sectionsConfig = [
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
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 text-slate-800 dark:text-slate-100 animate-in fade-in duration-200">
      {/* Top Header Bar with clear navigation hierarchy & Chapter Switch Sheet */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label={t.back}
            title={t.back}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#1a1c26] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#202234] flex items-center justify-center transition active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5368a4]"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </button>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
              Chapter {chapterId}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
              {chapter.chapter_name}
            </h1>
          </div>
        </div>

        {/* Theme Switcher & Change Chapter Button */}
        <div className="flex items-center gap-2">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  className="h-10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 px-3 rounded-full bg-white dark:bg-[#1a1c26] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#202234] transition cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5368a4]"
                >
                  <HugeiconsIcon icon={BookOpen01Icon} size={15} className="text-[#5368a4]" />
                  <span>{t.changeChapter}</span>
                </button>
              }
            />
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-[#f8fafc] dark:bg-[#12131c] text-slate-800 dark:text-slate-100 border-l border-slate-200 dark:border-white/10 gap-0">
              <SheetHeader className="p-5 pb-4 bg-white dark:bg-[#181926] border-b border-slate-200/90 dark:border-white/10 text-left">
                <SheetTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HugeiconsIcon icon={BookOpen01Icon} size={20} className="text-[#5368a4]" />
                  <span>{t.changeChapter}</span>
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.selectChapterDesc}
                </SheetDescription>
              </SheetHeader>

              {/* Scrollable Chapter List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scroll-pt-4 scroll-smooth">
                {allChapters.map((ch) => {
                  const isCurrent = ch.chapter_id === chapterId;
                  const qCount = ch.sections.reduce(
                    (acc, sec) => acc + (sec.questions?.length || 0),
                    0
                  );
                  const isChapterDone =
                    ch.sections.length > 0 &&
                    ch.sections.every((_, sIdx) => {
                      const key = `ch${ch.chapter_id}-s${sIdx}`;
                      return progress.sectionProgress[key]?.completed;
                    });

                  return (
                    <button
                      key={ch.chapter_id}
                      ref={isCurrent ? activeChapterRef : null}
                      onClick={() => handleSelectChapterFromSheet(ch.chapter_id)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] ${isCurrent
                        ? "bg-[#5368a4]/15 border-[#5368a4] text-[#5368a4] dark:text-[#9bb0ea]"
                        : "bg-white dark:bg-[#181926] hover:bg-slate-50 dark:hover:bg-[#202234] border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 hover:border-slate-200/40 dark:hover:border-white/15"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${isCurrent
                            ? "bg-[#5368a4] text-white"
                            : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                            }`}
                        >
                          {ch.chapter_id}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                              {ch.chapter_name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#5368a4] text-white uppercase tracking-wider">
                                {t.currentChapterBadge}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 block">
                            {qCount} {t.questionsUnit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isChapterDone && (
                          <span className="text-emerald-500">
                            <HugeiconsIcon icon={CheckmarkBadge01Icon} size={18} />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Subtitle & Headline */}
      <div className="mb-6">
        <p className="text-xs font-medium text-slate-400 dark:text-slate-400">{t.heroNotice}</p>
        <div className="flex items-center justify-between mt-1">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-700 dark:text-slate-200 tracking-tight">
            {t.heroHeading}
          </h2>
        </div>
      </div>

      {/* Stat Pills with accurate progress reflection */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        <div className="bg-white dark:bg-[#181926] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 text-center transition">
          <span className="text-xl sm:text-2xl font-bold text-[#38529a] dark:text-[#8ea2db] block leading-none">
            {totalChapterQuestions}
          </span>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-400">{t.totalQuestions}</span>
        </div>

        <div className="bg-white dark:bg-[#181926] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 text-center transition">
          <span className="text-xl sm:text-2xl font-bold text-[#38529a] dark:text-[#8ea2db] block leading-none">
            {completedSectionsCount}/3
          </span>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-400">{t.completedBadge}</span>
        </div>

        <div className="bg-white dark:bg-[#181926] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 text-center transition">
          <span className="text-xl sm:text-2xl font-bold text-[#38529a] dark:text-[#8ea2db] block leading-none">
            {accuracyPercentage !== null ? `${accuracyPercentage}%` : "—"}
          </span>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-400">{t.accuracy}</span>
        </div>
      </div>

      {/* Quick Play All Chapter Button */}
      <div className="mb-8">
        <button
          onClick={() => onSelectChapterAll(chapterId)}
          className="w-full py-4 px-6 rounded-2xl bg-[#5368a4] hover:bg-[#475a92] text-white font-bold text-sm sm:text-base transition flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5368a4] focus-visible:ring-offset-2"
        >
          <HugeiconsIcon icon={PlayIcon} size={20} />
          <span>
            {formatString(t.practiceEntireChapter, {
              chapter: chapter.chapter_name,
              count: totalChapterQuestions,
            })}
          </span>
        </button>
      </div>

      {/* Section List Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          {formatString(t.sectionsInChapter, { chapter: chapter.chapter_name })}
        </h3>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-400">
          {chapter.sections.length} {t.sectionsUnit}
        </span>
      </div>

      {/* 3 Section Cards with distinctive icons and progress feedback */}
      <div className="space-y-3.5 mb-8">
        {chapter.sections.map((sec, sIdx) => {
          const cfg = (sectionsConfig as any)[sIdx] || {
            index: sIdx,
            icon: BookOpen01Icon,
            defaultDesc: "Chọn đáp án đúng nhất",
            cardBg: "bg-white dark:bg-[#181926] border-slate-200 dark:border-white/10",
            iconBg: "bg-white dark:bg-white/10",
            iconColor: "text-slate-600 dark:text-slate-300",
            accentBar: "bg-slate-400",
          };

          const key = `ch${chapterId}-s${sIdx}`;
          const sp = progress.sectionProgress[key];
          const isDone = Boolean(sp?.completed);
          const qCount = sec.questions?.length || 0;
          const desc = sec.instruction || cfg.defaultDesc;
          const progressPercent = isDone && sp ? Math.round((sp.score / sp.total) * 100) : 0;

          return (
            <div
              key={sIdx}
              onClick={() => onSelectSection(chapterId, sIdx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectSection(chapterId, sIdx);
                }
              }}
              className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer active:scale-[0.99] flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5368a4] ${cfg.cardBg}`}
            >
              <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                {/* Rounded square with distinct icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-black/5 dark:border-white/10 ${cfg.iconBg || "bg-white dark:bg-white/10"
                    }`}
                >
                  <HugeiconsIcon icon={cfg.icon} size={22} className={cfg.iconColor} />
                </div>

                {/* Section title, description and accent bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                      {sec.section_name}
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-normal">
                    {qCount} {t.questionsUnit} · {desc}
                  </p>

                  {/* Real progress track */}
                  <div className="mt-2.5 w-full max-w-36 bg-black/5 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cfg.accentBar} rounded-full transition-all duration-300`}
                      style={{
                        width: isDone ? `${progressPercent}%` : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right side: count, completion badge & arrow */}
              <div className="flex items-center gap-2 shrink-0">
                {isDone && sp ? (
                  <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {sp.score}/{sp.total} <span className="text-slate-400 dark:text-slate-400 font-normal">{t.questionsUnit}</span>
                  </span>
                ) : (
                  <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {qCount} <span className="text-slate-400 dark:text-slate-400 font-normal">{t.questionsUnit}</span>
                  </span>
                )}
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-slate-400 dark:text-slate-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info Note matching bottom */}
      <footer className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 text-center py-4">
        <HugeiconsIcon icon={HelpCircleIcon} size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />
        <span>{t.footerNote}</span>
      </footer>
    </div>
  );
}

