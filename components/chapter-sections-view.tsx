"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BookOpen01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  PlayIcon,
  HelpCircleIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { Chapter } from "@/lib/types";
import { ProgressState } from "@/lib/storage";
import { useLanguage } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";

interface ChapterSectionsViewProps {
  chapter: Chapter;
  progress: ProgressState;
  onBack: () => void;
  onSelectSection: (chapterId: number, sectionIndex: number) => void;
  onSelectChapterAll: (chapterId: number) => void;
}

export function ChapterSectionsView({
  chapter,
  progress,
  onBack,
  onSelectSection,
  onSelectChapterAll,
}: ChapterSectionsViewProps) {
  const { t, formatString, language } = useLanguage();
  const chapterId = chapter.chapter_id;
  const totalChapterQuestions = chapter.sections.reduce(
    (acc, sec) => acc + (sec.questions?.length || 0),
    0
  );

  const sectionsConfig = [
    {
      index: 0,
      title: "問題1 文の文法1",
      defaultDesc: t.section1DefaultDesc,
      cardBg: "bg-[#e2eaff] hover:bg-[#e2ecfe] border-[#d7e2ff]",
      iconColor: "text-[#4162bc]",
      accentBar: "bg-[#4162bc]",
    },
    {
      index: 1,
      title: "問題2 文の文法2",
      defaultDesc: t.section2DefaultDesc,
      cardBg: "bg-[#ffebe3] hover:bg-[#faeae1] border-[#ffe1d5]",
      iconColor: "text-[#c85a2b]",
      accentBar: "bg-[#4162bc]",
    },
    {
      index: 2,
      title: "問題3 文章の文法",
      defaultDesc: t.section3DefaultDesc,
      cardBg: "bg-[#eee9ff] hover:bg-[#eee6fd] border-[#e5ddfc]",
      iconColor: "text-[#7c4dca]",
      accentBar: "bg-[#4162bc]",
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 text-slate-800 animate-in fade-in duration-200">
      {/* Top Header Bar matching the image */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBack}
            title={t.changeChapter}
            className="w-12 h-12 rounded-2xl bg-[#5368a4] hover:bg-[#475b94] text-white flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
          >
            <HugeiconsIcon icon={BookOpen01Icon} size={24} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />

          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
            {t.changeChapter}
          </button>
        </div>
      </div>

      {/* Subtitle */}
      <div className="mb-6">
        <p className="text-xs font-medium text-slate-400">{t.heroNotice}</p>
        <div className="flex items-center justify-between mt-1">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-600 tracking-tight">
            {t.heroHeading}
          </h2>
        </div>
      </div>

      {/* Summary Stat Pills in a Row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 text-center">
          <span className="text-xl sm:text-2xl font-bold text-[#38529a] block leading-none mb-1.5">
            {totalChapterQuestions}
          </span>
          <span className="text-xs font-medium text-slate-400">{t.totalQuestions}</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 text-center">
          <span className="text-xl sm:text-2xl font-bold text-[#38529a] block leading-none mb-1.5">
            {chapterId}
          </span>
          <span className="text-xs font-medium text-slate-400">{t.totalChapters}</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 text-center">
          <span className="text-xl sm:text-2xl font-bold text-[#38529a] block leading-none mb-1.5">
            3
          </span>
          <span className="text-xs font-medium text-slate-400">{t.sectionsCount}</span>
        </div>
      </div>

      {/* Quick Play All Chapter Button */}
      <div className="mb-8">
        <button
          onClick={() => onSelectChapterAll(chapterId)}
          className="w-full py-3.5 px-6 rounded-2xl bg-[#5368a4] hover:bg-[#475a92] text-white font-bold text-sm sm:text-base transition flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
        >
          <HugeiconsIcon icon={PlayIcon} size={18} />
          {formatString(t.practiceEntireChapter, {
            chapter: chapter.chapter_name,
            count: totalChapterQuestions,
          })}
        </button>
      </div>

      {/* Section List Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">
          {formatString(t.sectionsInChapter, { chapter: chapter.chapter_name })}
        </h3>
        <span className="text-xs font-semibold text-slate-400">
          {chapter.sections.length} {t.sectionsUnit}
        </span>
      </div>

      {/* 3 Section Cards matching screenshot */}
      <div className="space-y-3.5 mb-8">
        {chapter.sections.map((sec, sIdx) => {
          const cfg = sectionsConfig[sIdx] || {
            index: sIdx,
            title: sec.section_name,
            defaultDesc: "Chọn đáp án đúng nhất",
            cardBg: "bg-white border-slate-200",
            iconColor: "text-slate-600",
            accentBar: "bg-slate-400",
          };

          const key = `ch${chapterId}-s${sIdx}`;
          const sp = progress.sectionProgress[key];
          const isDone = sp?.completed;
          const qCount = sec.questions?.length || 0;
          const desc = sec.instruction || cfg.defaultDesc;

          return (
            <div
              key={sIdx}
              onClick={() => onSelectSection(chapterId, sIdx)}
              className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer active:scale-[0.99] flex items-center justify-between gap-4 ${cfg.cardBg}`}
            >
              <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                {/* White rounded square icon */}
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={BookOpen01Icon} size={22} className={cfg.iconColor} />
                </div>

                {/* Section title, description and accent bar */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-700 leading-snug">
                    {sec.section_name}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 line-clamp-1 mt-0.5 font-normal">
                    {qCount} {t.questionsUnit} · {desc}
                  </p>

                  {/* Accent line like in the image */}
                  <div className="mt-2.5 w-full max-w-35 bg-slate-300/40 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cfg.accentBar} rounded-full`}
                      style={{
                        width: isDone ? `${Math.round((sp.score / sp.total) * 100)}%` : "35%",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right side: count + arrow */}
              <div className="flex items-center gap-1.5 shrink-0 text-slate-600">
                <span className="text-xs sm:text-sm font-semibold text-primary">
                  {qCount} <span className="text-slate-700">{t.questionsUnit}</span>
                </span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-slate-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info Note matching bottom of image */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 text-center py-4">
        <HugeiconsIcon icon={HelpCircleIcon} size={14} className="shrink-0 text-slate-400" />
        <span>{t.footerNote}</span>
      </div>
    </div>
  );
}
