"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
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
} from "@hugeicons/core-free-icons";
import {
  getAllChapters,
  getSectionQuestions,
  getChapterAllQuestions,
  getAllQuestions,
} from "@/lib/chapters-data";
import { QuizQuestionItem, Chapter } from "@/lib/types";
import {
  getStoredProgress,
  ProgressState,
  resetAllProgress,
} from "@/lib/storage";
import { sounds } from "@/lib/sound";
import { useLanguage } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";
import { QuizPlayer } from "@/components/quiz-player";
import { ChapterSectionsView } from "@/components/chapter-sections-view";
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
} from "@/components/ui/alert-dialog";

export default function HomePage() {
  const { t, formatString, language } = useLanguage();
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestionItem[] | null>(null);
  const [quizTitle, setQuizTitle] = useState("All Questions");
  const [quizSubtitle, setQuizSubtitle] = useState<string | undefined>();
  const [activeChapterId, setActiveChapterId] = useState<number | undefined>();
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | undefined>();

  // Selected chapter for the dedicated sections page
  const [selectedChapterForSections, setSelectedChapterForSections] = useState<Chapter | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [chapterFilter, setChapterFilter] = useState<"all" | "1-10" | "11-20" | "21-30" | "incomplete">("all");
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
  const [soundEnabled, setSoundEnabled] = useState(true);

  const refreshProgress = () => {
    setProgress(getStoredProgress());
    setSoundEnabled(sounds.isEnabled());
  };

  useEffect(() => {
    refreshProgress();
  }, []);

  const allChapters = useMemo(() => getAllChapters(), []);
  const allQuestions = useMemo(() => getAllQuestions(), []);

  // Filter chapters based on range and search query
  const filteredChapters = useMemo(() => {
    return allChapters.filter((ch) => {
      if (chapterFilter === "1-10" && (ch.chapter_id < 1 || ch.chapter_id > 10)) return false;
      if (chapterFilter === "11-20" && (ch.chapter_id < 11 || ch.chapter_id > 20)) return false;
      if (chapterFilter === "21-30" && (ch.chapter_id < 21 || ch.chapter_id > 30)) return false;
      if (chapterFilter === "incomplete") {
        const completedCount = ch.sections.filter((_, sIdx) => {
          const key = `ch${ch.chapter_id}-s${sIdx}`;
          return progress.sectionProgress[key]?.completed;
        }).length;
        if (completedCount === ch.sections.length) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName =
          ch.chapter_name.toLowerCase().includes(q) ||
          `chapter ${ch.chapter_id}`.includes(q) ||
          `chương ${ch.chapter_id}`.includes(q);

        if (matchesName) return true;

        return ch.sections.some((sec) =>
          sec.questions.some(
            (item) =>
              item.question_text?.toLowerCase().includes(q) ||
              Object.values(item.options).some((opt) => opt.toLowerCase().includes(q))
          )
        );
      }

      return true;
    });
  }, [allChapters, chapterFilter, searchQuery, progress]);

  const router = useRouter();

  // Launch Handlers
  const handleSelectChapter = (chapter: Chapter) => {
    router.push(`/chapter/${chapter.chapter_id}`);
  };

  const handleStartSection = (chapterId: number, sectionIndex: number) => {
    const list = getSectionQuestions(chapterId, sectionIndex);
    const chapter = allChapters.find((c) => c.chapter_id === chapterId);
    const sec = chapter?.sections[sectionIndex];

    setQuizTitle(`${chapter?.chapter_name} • ${sec?.section_name || `Section ${sectionIndex + 1}`}`);
    setQuizSubtitle(`Chapter ${chapterId}`);
    setActiveChapterId(chapterId);
    setActiveSectionIndex(sectionIndex);
    setActiveQuizQuestions(list);
  };

  const handleStartChapterAll = (chapterId: number) => {
    const list = getChapterAllQuestions(chapterId);
    const chapter = allChapters.find((c) => c.chapter_id === chapterId);

    setQuizTitle(
      formatString(t.chapterQuizTitle, {
        chapterId,
        chapterName: chapter?.chapter_name || "",
      })
    );
    setQuizSubtitle(t.all3Sections);
    setActiveChapterId(chapterId);
    setActiveSectionIndex(undefined);
    setActiveQuizQuestions(list);
  };

  // Preserve All Questions practice feature
  const handlePlayAll = () => {
    setQuizTitle(t.allQuestionsTitle);
    setQuizSubtitle(
      formatString(t.allQuestionsSubtitle, { count: allQuestions.length })
    );
    setActiveChapterId(undefined);
    setActiveSectionIndex(undefined);
    setActiveQuizQuestions(allQuestions);
  };

  const handlePlayRandom = () => {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const subset = shuffled.slice(0, 20);

    setQuizTitle(t.quickQuizTitle);
    setQuizSubtitle(t.quickQuizSubtitle);
    setActiveChapterId(undefined);
    setActiveSectionIndex(undefined);
    setActiveQuizQuestions(subset);
  };

  const handlePlayMistakes = () => {
    const mistakeSet = new Set(progress.wrongQuestionIds);
    const mistakeQuestions = allQuestions.filter((q) => mistakeSet.has(q.id));
    if (mistakeQuestions.length === 0) return;

    setQuizTitle(t.mistakesReviewTitle);
    setQuizSubtitle(
      formatString(t.mistakesReviewSubtitle, { count: mistakeQuestions.length })
    );
    setActiveChapterId(undefined);
    setActiveSectionIndex(undefined);
    setActiveQuizQuestions(mistakeQuestions);
  };

  const handleExitQuiz = () => {
    setActiveQuizQuestions(null);
    refreshProgress();
  };

  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleConfirmReset = () => {
    resetAllProgress();
    refreshProgress();
    setResetDialogOpen(false);
  };

  // 1. If currently in Quiz Mode: Render QuizPlayer
  if (activeQuizQuestions && activeQuizQuestions.length > 0) {
    return (
      <main className="min-h-screen bg-black text-white p-3 flex flex-col justify-center items-center">
        <QuizPlayer
          questions={activeQuizQuestions}
          title={quizTitle}
          subtitle={quizSubtitle}
          onExit={handleExitQuiz}
          chapterId={activeChapterId}
          sectionIndex={activeSectionIndex}
        />
      </main>
    );
  }

  // 2. If a Chapter is selected: Render the dedicated Sections List page
  if (selectedChapterForSections) {
    return (
      <main className="min-h-screen bg-[#f6f8fc] pb-12">
        <ChapterSectionsView
          chapter={selectedChapterForSections}
          progress={progress}
          onBack={() => {
            setSelectedChapterForSections(null);
            refreshProgress();
          }}
          onSelectSection={handleStartSection}
          onSelectChapterAll={handleStartChapterAll}
        />
      </main>
    );
  }

  // 3. Home Screen: Matching the provided design with stats, All Questions feature, and Chapter grid
  const mistakesCount = progress.wrongQuestionIds.length;

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-800 pb-16">
      <div className="w-full max-w-2xl mx-auto px-4 py-6">
        {/* Top Header Bar matching the image */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#5368a4] text-white flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={BookOpen01Icon} size={24} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <LanguageToggle />

            <button
              onClick={() => {
                const s = sounds.toggle();
                setSoundEnabled(s);
              }}
              title={soundEnabled ? t.soundTooltipOn : t.soundTooltipOff}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <HugeiconsIcon
                icon={soundEnabled ? VolumeHighIcon : VolumeMute01Icon}
                size={18}
              />
            </button>

            <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <AlertDialogTrigger
                render={
                  <button
                    type="button"
                    title={t.resetTooltip}
                    className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-rose-500 flex items-center justify-center transition active:scale-95 cursor-pointer"
                  >
                    <HugeiconsIcon icon={RotateRight01Icon} size={16} />
                  </button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.resetTitle}</AlertDialogTitle>
                  <AlertDialogDescription>{t.resetConfirm}</AlertDialogDescription>
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
          <p className="text-xs font-medium text-slate-400">{t.heroNotice}</p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-600 tracking-tight mt-1">
            {t.heroHeading}
          </h2>
        </div>

        {/* 3 Stats Cards in a Row matching the image */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 text-center">
            <span className="text-xl sm:text-2xl font-bold text-[#38529a] block leading-none mb-1.5">
              {allQuestions.length}
            </span>
            <span className="text-xs font-medium text-slate-400">{t.totalQuestions}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 text-center">
            <span className="text-xl sm:text-2xl font-bold text-[#38529a] block leading-none mb-1.5">
              {allChapters.length}
            </span>
            <span className="text-xs font-medium text-slate-400">{t.totalChapters}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 text-center">
            <span className="text-xl sm:text-2xl font-bold text-[#38529a] block leading-none mb-1.5">
              {progress.answeredCount > 0 ? progress.answeredCount : "10"}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {progress.answeredCount > 0 ? t.questionsPracticed : t.questionsPerSession}
            </span>
          </div>
        </div>

        {/* Quick Launch Action: Feature Luyện tập tất cả câu hỏi */}
        <div className="flex flex-col gap-3 mb-5">
          <button
            onClick={handlePlayAll}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-[#5368a4] hover:bg-[#475b94] text-white font-bold text-sm sm:text-base transition flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
          >
            <HugeiconsIcon icon={PlayIcon} size={18} />
            {t.practiceAll} ({allQuestions.length} {t.questionsUnit})
          </button>

          <button
            onClick={handlePlayRandom}
            className="py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm border border-slate-200/80 transition flex items-center justify-center gap-1.5 active:scale-[0.99] cursor-pointer"
          >
            <HugeiconsIcon icon={SparklesIcon} size={16} className="text-[#5368a4]" />
            {t.practiceRandom}
          </button>

          {mistakesCount > 0 && (
            <button
              onClick={handlePlayMistakes}
              className="py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs sm:text-sm border border-rose-200 transition flex items-center justify-center gap-1.5 active:scale-[0.99] cursor-pointer"
            >
              <HugeiconsIcon icon={RotateRight01Icon} size={15} />
              {formatString(t.reviewMistakes, { count: mistakesCount })}
            </button>
          )}
        </div>

        {/* Search & Range Filters */}
        <div className="space-y-3 mb-5">
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200/90 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5368a4] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {t.clear}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(
              [
                { id: "all", label: `${t.filterAll} (30)` },
                { id: "1-10", label: language === "ja" ? "第1〜10回" : "Ch. 1 - 10" },
                { id: "11-20", label: language === "ja" ? "第11〜20回" : "Ch. 11 - 20" },
                { id: "21-30", label: language === "ja" ? "第21〜30回" : "Ch. 21 - 30" },
                { id: "incomplete", label: t.filterIncomplete },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setChapterFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${chapterFilter === tab.id
                  ? "bg-[#5368a4] text-white border-[#5368a4]"
                  : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200/80"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section List / Chapter Grid: 2 Columns as in the image */}
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-bold text-slate-700 tracking-tight">
            {t.chapterListTitle} ({filteredChapters.length})
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-8">
          {filteredChapters.map((ch) => {
            const qCount = ch.sections.reduce(
              (acc, sec) => acc + (sec.questions?.length || 0),
              0
            );

            // Check if completed
            const allSecCompleted =
              ch.sections.length > 0 &&
              ch.sections.every((_, sIdx) => {
                const key = `ch${ch.chapter_id}-s${sIdx}`;
                return progress.sectionProgress[key]?.completed;
              });

            return (
              <button
                key={ch.chapter_id}
                onClick={() => handleSelectChapter(ch)}
                className="bg-white hover:bg-[#5368a4] hover:text-white group border border-slate-200/90 rounded-xl p-4 sm:p-4 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-23 active:scale-[0.98]"
              >
                <div className="flex items-center justify-between w-full">
                  <h4 className="text-base sm:text-lg font-bold text-slate-500 group-hover:text-white transition">
                    {ch.chapter_name}
                  </h4>
                  {allSecCompleted && (
                    <span className="text-emerald-500 group-hover:text-white transition">
                      <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 group-hover:text-white/80 transition mt-1">
                  {qCount} {t.questionsUnit}
                </p>
              </button>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 text-center py-4">
          <HugeiconsIcon icon={HelpCircleIcon} size={14} className="shrink-0 text-slate-400" />
          <span>{t.footerNote}</span>
        </div>
      </div>
    </main>
  );
}
