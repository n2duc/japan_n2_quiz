"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlayIcon,
  CheckmarkCircle01Icon,
  StarIcon,
  BookOpen01Icon,
  CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons";
import { Chapter } from "@/lib/types";
import { ProgressState } from "@/lib/storage";

interface ChapterCardProps {
  chapter: Chapter;
  progress: ProgressState;
  onSelectSection: (chapterId: number, sectionIndex: number) => void;
  onSelectChapterAll: (chapterId: number) => void;
}

export function ChapterCard({
  chapter,
  progress,
  onSelectSection,
  onSelectChapterAll,
}: ChapterCardProps) {
  const chapterId = chapter.chapter_id;

  // Compute total questions and completion
  const totalChapterQuestions = chapter.sections.reduce(
    (acc, sec) => acc + (sec.questions?.length || 0),
    0
  );

  let chapterCorrect = 0;
  let sectionsCompletedCount = 0;

  chapter.sections.forEach((_, sIdx) => {
    const key = `ch${chapterId}-s${sIdx}`;
    const p = progress.sectionProgress[key];
    if (p && p.completed) {
      sectionsCompletedCount += 1;
      chapterCorrect += p.score;
    }
  });

  const isAllCompleted =
    sectionsCompletedCount === chapter.sections.length && chapter.sections.length > 0;

  const sectionMeta = [
    {
      title: "問題1 文の文法1",
      subtitle: "Điền vào chỗ trống （ ）",
      badge: "Trắc nghiệm",
      icon: CheckmarkCircle01Icon,
      accent: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "問題2 文の文法2",
      subtitle: "Sắp xếp thứ tự tìm vị trí ★",
      badge: "Ngôi sao ★",
      icon: StarIcon,
      accent: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "問題3 文章の文法",
      subtitle: "Ngữ pháp theo đoạn văn",
      badge: "Đoạn văn",
      icon: BookOpen01Icon,
      accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div className="bg-[#15161c] border border-white/5 hover:border-white/10 rounded-3xl p-5 sm:p-6 transition-all duration-200 group">
      {/* Chapter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-xl text-white">
            {chapterId}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white tracking-wide">
                Chapter {chapterId} • {chapter.chapter_name}
              </h3>
              {isAllCompleted && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <HugeiconsIcon icon={CheckmarkBadge01Icon} size={13} />
                  Hoàn thành
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              3 Sections • {totalChapterQuestions} câu hỏi ngữ pháp
              {sectionsCompletedCount > 0 && (
                <span className="text-zinc-500 ml-1">
                  (Đã làm: {sectionsCompletedCount}/3 phần)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Play entire chapter */}
        <button
          onClick={() => onSelectChapterAll(chapterId)}
          className="self-start sm:self-center px-4 py-2 rounded-xl bg-zinc-800/80 hover:bg-[#3e5c8a] text-zinc-200 hover:text-white font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 border border-white/5 cursor-pointer"
        >
          <HugeiconsIcon icon={PlayIcon} size={15} />
          Luyện cả Chapter ({totalChapterQuestions} câu)
        </button>
      </div>

      {/* 3 Sections Grid as in data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
        {chapter.sections.map((sec, sIdx) => {
          const meta = sectionMeta[sIdx] || {
            title: sec.section_name,
            subtitle: "Luyện ngữ pháp",
            badge: `Phần ${sIdx + 1}`,
            icon: CheckmarkCircle01Icon,
            accent: "text-zinc-400 bg-zinc-800 border-zinc-700",
          };

          const key = `ch${chapterId}-s${sIdx}`;
          const sp = progress.sectionProgress[key];
          const isDone = sp?.completed;
          const qCount = sec.questions?.length || 0;

          return (
            <div
              key={sIdx}
              onClick={() => onSelectSection(chapterId, sIdx)}
              className="bg-[#1b1c23] hover:bg-[#20222b] border border-white/5 hover:border-indigo-500/30 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between cursor-pointer active:scale-[0.99] group/sec"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${meta.accent}`}
                  >
                    <HugeiconsIcon icon={meta.icon} size={12} />
                    {meta.badge}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    {qCount} câu
                  </span>
                </div>

                <h4 className="text-white font-bold text-sm line-clamp-1 group-hover/sec:text-indigo-300 transition">
                  {sec.section_name}
                </h4>
                <p className="text-zinc-400 text-xs mt-1 line-clamp-1">
                  {meta.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <div>
                  {isDone ? (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} />
                      Đúng {sp.score}/{sp.total} câu
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500">Chưa hoàn thành</span>
                  )}
                </div>

                <span className="w-8 h-8 rounded-xl bg-zinc-800 group-hover/sec:bg-[#3e5c8a] text-zinc-300 group-hover/sec:text-white flex items-center justify-center transition">
                  <HugeiconsIcon icon={PlayIcon} size={14} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
