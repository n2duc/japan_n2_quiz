"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
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
} from "@hugeicons/core-free-icons";
import { QuizQuestionItem } from "@/lib/types";
import { sounds } from "@/lib/sound";
import { useLanguage } from "@/lib/i18n";
import {
  getStoredProgress,
  recordQuestionResult,
  recordSectionCompleted,
  toggleBookmarkQuestion,
} from "@/lib/storage";

interface QuizPlayerProps {
  questions: QuizQuestionItem[];
  title?: string;
  subtitle?: string;
  onExit: () => void;
  chapterId?: number;
  sectionIndex?: number;
}

export function QuizPlayer({
  questions,
  title,
  subtitle,
  onExit,
  chapterId,
  sectionIndex,
}: QuizPlayerProps) {
  const { t, formatString } = useLanguage();
  const activeTitle = title || t.allQuestionsTitle;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isAnswered, setIsAnswered] = useState<Record<number, boolean>>({});
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [soundActive, setSoundActive] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [showPassage, setShowPassage] = useState(true);

  // Initialize sound & bookmarks
  useEffect(() => {
    setSoundActive(sounds.isEnabled());
    const progress = getStoredProgress();
    const bookmarkMap: Record<string, boolean> = {};
    progress.bookmarkedQuestionIds.forEach((id) => {
      bookmarkMap[id] = true;
    });
    setBookmarked(bookmarkMap);
  }, []);

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;

  const currentSelected = selectedAnswers[currentIndex];
  const currentAnswered = isAnswered[currentIndex] || false;

  const handleToggleSound = () => {
    const newState = sounds.toggle();
    setSoundActive(newState);
  };

  const handleToggleBookmark = () => {
    if (!currentQ) return;
    const isNowBookmarked = toggleBookmarkQuestion(currentQ.id);
    setBookmarked((prev) => ({
      ...prev,
      [currentQ.id]: isNowBookmarked,
    }));
  };

  const handleSpeak = (text: string) => {
    sounds.speakJapanese(text);
  };

  const handleSelectOption = (optKey: number) => {
    if (currentAnswered || !currentQ) return;

    const isCorrect = optKey === currentQ.answer;

    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optKey }));
    setIsAnswered((prev) => ({ ...prev, [currentIndex]: true }));

    if (isCorrect) {
      sounds.playCorrect();
      setScore((s) => s + 10);
      setStreak((st) => st + 1);
    } else {
      sounds.playIncorrect();
      setStreak(0);
    }

    // Persist result
    recordQuestionResult(
      currentQ.id,
      isCorrect,
      currentQ.chapterId,
      currentQ.sectionIndex
    );

    // Auto-advance if enabled
    if (autoAdvance) {
      setTimeout(() => {
        handleNext();
      }, 1400);
    }
  };

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Completed quiz
      setIsCompleted(true);
      if (chapterId !== undefined && sectionIndex !== undefined) {
        // Calculate total correct
        let correctCount = 0;
        questions.forEach((q, idx) => {
          if (selectedAnswers[idx] === q.answer) correctCount += 1;
        });
        recordSectionCompleted(chapterId, sectionIndex, correctCount, totalQuestions);
      }
    }
  }, [currentIndex, totalQuestions, chapterId, sectionIndex, questions, selectedAnswers]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsAnswered({});
    setScore(0);
    setStreak(0);
    setIsCompleted(false);
  };

  // Reconstructed sentence for Section 2 (ordered sequence)
  const starSentence = useMemo(() => {
    if (!currentQ || !currentQ.orderedSequence || !currentQ.questionText) return null;
    const seq = currentQ.orderedSequence;
    const parts = seq.map((optNum) => {
      const text = currentQ.options[String(optNum)] || "";
      const isStar = optNum === currentQ.answer;
      return { text, isStar, num: optNum };
    });

    const regex = /___\s*___\s*★\s*___/;
    const rawTemplate = currentQ.questionText;

    if (regex.test(rawTemplate)) {
      const [before, after] = rawTemplate.split(regex);
      return { before, parts, after };
    }
    return { before: "", parts, after: "" };
  }, [currentQ]);

  // Section 3: Highlight active blank in passage
  const formattedPassage = useMemo(() => {
    if (!currentQ || !currentQ.context) return null;
    const blankNum = currentQ.questionNumber;
    const lines = currentQ.context.split("\n");
    return lines;
  }, [currentQ]);

  if (!currentQ && !isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 text-slate-600 dark:text-zinc-300">
        <p className="text-lg">{t.questionNotFound}</p>
        <button
          onClick={onExit}
          className="mt-4 px-6 py-2.5 rounded-full bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-white font-medium transition cursor-pointer"
        >
          {t.back}
        </button>
      </div>
    );
  }

  // Completion Screen
  if (isCompleted) {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) correctCount += 1;
    });
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    return (
      <div className="w-full max-w-md mx-auto px-4 py-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white dark:bg-[#181920] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
            <HugeiconsIcon
              icon={CheckmarkBadge01Icon}
              size={44}
              className="text-emerald-500 dark:text-emerald-400"
            />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t.quizCompletedTitle}</h2>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6">
            {activeTitle} {subtitle ? `• ${subtitle}` : ""}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-50 dark:bg-zinc-900/80 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800">
              <span className="text-xs text-slate-400 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                {t.score}
              </span>
              <span className="text-2xl font-black text-amber-500 dark:text-amber-400">
                {score} <span className="text-xs text-slate-400 dark:text-zinc-400">{t.pointsUnit}</span>
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-zinc-900/80 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800">
              <span className="text-xs text-slate-400 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                {t.accuracy}
              </span>
              <span className="text-2xl font-black text-emerald-500 dark:text-emerald-400">
                {percentage}%
              </span>
            </div>
          </div>

          <div className="bg-slate-50/70 dark:bg-zinc-900/50 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800/80 mb-6 text-left text-sm text-slate-700 dark:text-zinc-300">
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-800">
              <span className="text-slate-500 dark:text-zinc-400">{t.correct}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {correctCount} / {totalQuestions}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-800">
              <span className="text-slate-500 dark:text-zinc-400">{t.wrong}</span>
              <span className="font-bold text-rose-500 dark:text-rose-400">
                {totalQuestions - correctCount} {t.questionsUnit}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 dark:text-zinc-400">{t.streak}</span>
              <span className="font-bold text-amber-500 dark:text-amber-300 flex items-center gap-1">
                {streak}
                <HugeiconsIcon icon={FireIcon} size={15} className="text-amber-500 dark:text-amber-400" />
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleRestart}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#5368a4] hover:bg-[#475b94] text-white font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <HugeiconsIcon icon={RotateRight01Icon} size={20} />
              {t.retrySection}
            </button>
            <button
              onClick={onExit}
              className="w-full py-3.5 px-6 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-transparent font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <HugeiconsIcon icon={Home01Icon} size={20} />
              {t.backHome}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Header Title Text
  const displayTitle = activeTitle || currentQ.chapterName;
  const displaySubtitle = `${currentIndex + 1} / ${totalQuestions}`;

  return (
    <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-between pb-4 select-none">
      {/* Top Header matching the screenshot */}
      <header className="pt-3 pb-2 px-2">
        <div className="flex items-center justify-between">
          {/* Home Button */}
          <button
            onClick={onExit}
            aria-label={t.backHome}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#1e2026] hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 flex items-center justify-center transition active:scale-95 border border-slate-200 dark:border-white/5 cursor-pointer"
          >
            <HugeiconsIcon icon={Home01Icon} size={20} />
          </button>

          {/* Center Title and Progress */}
          <div className="text-center flex-1 mx-3">
            <h1 className="text-slate-900 dark:text-white font-bold text-base sm:text-lg leading-tight line-clamp-1">
              {displayTitle}
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 text-xs sm:text-sm font-medium mt-0.5">
              {displaySubtitle}
            </p>
          </div>

          {/* Score Counter */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#1e2026] border border-slate-200 dark:border-white/5 px-3 py-1.5 rounded-full">
            <span className="text-xs text-slate-400 dark:text-zinc-400 font-medium">{t.score}</span>
            <span className="text-sm font-bold text-slate-800 dark:text-white">{score}</span>
            {streak >= 2 && (
              <span className="text-xs text-amber-500 dark:text-amber-400 font-bold ml-1 flex items-center gap-0.5">
                <HugeiconsIcon icon={FireIcon} size={14} className="text-amber-500 dark:text-amber-400" />
                {streak}
              </span>
            )}
          </div>
        </div>

        {/* Thin progress bar */}
        <div className="w-full bg-slate-200 dark:bg-zinc-800/80 h-1.5 rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center my-3 space-y-4">
        {/* Section 3 Context Passage (Reading Passage) */}
        {currentQ.context && (
          <div className="bg-white dark:bg-[#14151a] border border-slate-200 dark:border-zinc-800/90 rounded-2xl p-4 text-slate-800 dark:text-zinc-200 transition-all">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-semibold text-[#4162bc] dark:text-indigo-400 flex items-center gap-1.5">
                <HugeiconsIcon icon={BookOpen01Icon} size={15} />
                {t.passageTitle}
              </span>
              <button
                onClick={() => setShowPassage(!showPassage)}
                className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-transparent cursor-pointer"
              >
                {showPassage ? t.collapsePassage : t.expandPassage}
              </button>
            </div>

            {showPassage && (
              <div className="text-sm sm:text-base leading-relaxed space-y-2 pr-1">
                {formattedPassage?.map((paragraph, pIdx) => {
                  // Render paragraph and highlight blanks like " 1 ", " 2 ", " 3 "
                  const parts = paragraph.split(/(\s[1-9]\s)/g);
                  return (
                    <p key={pIdx}>
                      {parts.map((part, partIdx) => {
                        const match = part.match(/^\s([1-9])\s$/);
                        if (match) {
                          const num = parseInt(match[1]);
                          const isCurrent = num === currentQ.questionNumber;
                          return (
                            <span
                              key={partIdx}
                              className={`inline-block font-bold px-2 py-0.5 mx-1 rounded text-xs transition ${isCurrent
                                ? "bg-amber-400 text-black ring-2 ring-amber-300 font-extrabold animate-pulse"
                                : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700"
                                }`}
                            >
                              （ {num} ）
                            </span>
                          );
                        }
                        return <span key={partIdx}>{part}</span>;
                      })}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Central Question Card matching screenshot aesthetics */}
        <div className="bg-white dark:bg-[#181920] border border-slate-200/90 dark:border-white/5 rounded-3xl p-6 sm:p-8 min-h-55 flex flex-col justify-between text-center relative">
          {/* Audio & Bookmark Actions */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => handleSpeak(currentQ.questionText || "")}
              title={t.speakQuestion}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <HugeiconsIcon icon={VolumeHighIcon} size={16} />
            </button>
            <button
              onClick={handleToggleBookmark}
              title={t.bookmark}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer ${bookmarked[currentQ.id]
                ? "bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-400/40"
                : "bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 dark:text-zinc-400"
                }`}
            >
              <HugeiconsIcon icon={StarIcon} size={16} />
            </button>
          </div>

          {/* Card Top Instruction */}
          <div className="mb-4 pr-16">
            <p className="text-slate-400 dark:text-zinc-400 text-xs sm:text-sm font-medium tracking-wide">
              {currentQ.sectionInstruction ||
                (currentQ.sectionIndex === 1
                  ? t.section2Instruction
                  : currentQ.sectionIndex === 2
                    ? formatString(t.section3Instruction, { num: currentQ.questionNumber })
                    : t.section1Instruction)}
            </p>
          </div>

          {/* Central Prominent Japanese Question Text */}
          <div className="my-auto py-2">
            {currentQ.sectionIndex === 1 && currentQ.questionText?.includes("★") ? (
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-wide leading-relaxed">
                {currentQ.questionText.split("★").map((chunk, cIdx, arr) => (
                  <React.Fragment key={cIdx}>
                    <span>{chunk}</span>
                    {cIdx < arr.length - 1 && (
                      <span className="inline-flex items-center justify-center mx-1.5 px-2 py-0.5 rounded-lg bg-amber-400/20 border border-amber-400/50 text-amber-500 dark:text-amber-300 font-black">
                        ★
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-wide leading-relaxed">
                {currentQ.questionText}
              </h2>
            )}
          </div>

          {/* Card Bottom Tag */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-zinc-800">
              {currentQ.sectionName}
            </span>
          </div>
        </div>

        {/* 4 Options matching the screenshot */}
        <div className="flex flex-col gap-3">
          {Object.entries(currentQ.options).map(([keyStr, valText]) => {
            const optNum = parseInt(keyStr);
            const isPicked = currentSelected === optNum;
            const isCorrectAnswer = optNum === currentQ.answer;

            // Visual State Colors
            let btnClass =
              "bg-[#5368a4] hover:bg-[#475b94] dark:bg-[#3e5c8a] dark:hover:bg-[#4a6da1] text-white active:scale-[0.99]";

            if (currentAnswered) {
              if (isPicked && isCorrectAnswer) {
                // Picked Correct
                btnClass =
                  "bg-emerald-600 text-white scale-[1.01]";
              } else if (isPicked && !isCorrectAnswer) {
                // Picked Wrong
                btnClass =
                  "bg-rose-600 text-white";
              } else if (isCorrectAnswer) {
                // Reveal Correct
                btnClass =
                  "bg-emerald-600/90 text-white";
              } else {
                // Inactive others
                btnClass = "bg-slate-200/80 dark:bg-[#253752]/70 text-slate-400 dark:text-zinc-400 opacity-60";
              }
            }

            const viMeaning = currentQ.optionsVi?.[keyStr];

            return (
              <button
                key={optNum}
                onClick={() => handleSelectOption(optNum)}
                disabled={currentAnswered}
                className={`w-full py-3.5 sm:py-4 px-6 rounded-2xl font-bold tracking-wide text-center cursor-pointer flex items-center justify-center relative min-h-15 ${btnClass}`}
              >
                {/* Option text & Vietnamese translation */}
                <div className="flex flex-col items-center justify-center px-4">
                  <span className="font-semibold text-lg sm:text-xl leading-snug">{valText}</span>
                  {currentAnswered && viMeaning && (
                    <span className="text-xs sm:text-sm font-normal mt-1 opacity-90 leading-tight">
                      {viMeaning}
                    </span>
                  )}
                </div>

                {/* Status icon badge */}
                {currentAnswered && isPicked && isCorrectAnswer && (
                  <span className="absolute right-4 text-emerald-200">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} />
                  </span>
                )}
                {currentAnswered && isPicked && !isCorrectAnswer && (
                  <span className="absolute right-4 text-rose-200">
                    <HugeiconsIcon icon={CancelCircleIcon} size={22} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation & Sentence Reconstruction (Section 2) */}
        {currentAnswered && (
          <div className="bg-white dark:bg-[#171922] border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 text-left animate-in fade-in slide-in-from-bottom-2 duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentSelected === currentQ.answer ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} />
                    <span>{t.correctFeedback}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-sm">
                    <HugeiconsIcon icon={CancelCircleIcon} size={18} />
                    <span>{formatString(t.wrongFeedback, { ans: currentQ.answer })}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() =>
                  handleSpeak(
                    starSentence
                      ? `${starSentence.before}${starSentence.parts.map((p) => p.text).join("")}${starSentence.after}`
                      : currentQ.questionText || ""
                  )
                }
                className="text-xs text-[#5368a4] dark:text-indigo-400 hover:text-[#45578a] dark:hover:text-indigo-300 flex items-center gap-1 bg-[#5368a4]/10 dark:bg-indigo-500/10 px-2 py-1 rounded-lg cursor-pointer"
              >
                <HugeiconsIcon icon={VolumeHighIcon} size={14} />
                {t.speakSentence}
              </button>
            </div>

            {/* If Section 2 (Star Question), display full reconstructed sentence */}
            {starSentence && starSentence.parts.length > 0 && (
              <div className="bg-slate-50 dark:bg-zinc-900/90 rounded-xl p-3 border border-slate-200 dark:border-zinc-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 block mb-1">
                  {formatString(t.completeSentence, {
                    order: currentQ.orderedSequence?.join(" → ") || "",
                  })}
                </span>
                <p className="text-sm sm:text-base text-slate-800 dark:text-zinc-200 leading-relaxed">
                  {starSentence.before}
                  {starSentence.parts.map((p, idx) => (
                    <span
                      key={idx}
                      className={`inline-block font-semibold px-1.5 py-0.5 mx-0.5 rounded ${p.isStar
                        ? "bg-amber-400 text-black font-bold ring-2 ring-amber-300"
                        : "bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-300"
                        }`}
                    >
                      {p.isStar && "★ "}
                      {p.text}
                    </span>
                  ))}
                  {starSentence.after}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      <footer className="pt-2 px-1">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex-1 py-3 px-4 rounded-xl bg-white dark:bg-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none text-slate-700 dark:text-zinc-300 font-semibold text-sm transition flex items-center justify-center gap-1.5 border border-slate-200 dark:border-white/5 cursor-pointer"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            {t.prevQuestion}
          </button>
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundActive ? t.soundTooltipOn : t.soundTooltipOff}
            className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 flex items-center justify-center transition border border-slate-200 dark:border-white/5 cursor-pointer"
          >
            <HugeiconsIcon
              icon={soundActive ? VolumeHighIcon : VolumeMute01Icon}
              size={18}
            />
          </button>

          <button
            onClick={handleNext}
            className="flex-1 py-3 px-4 rounded-xl bg-[#5368a4] hover:bg-[#475b94] text-white font-semibold text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {currentIndex === totalQuestions - 1 ? t.viewResult : t.nextQuestion}
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}
