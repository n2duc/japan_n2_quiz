"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  PlayIcon,
  RotateRight01Icon,
  StarIcon,
  BookOpen01Icon,
  CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons";
import { ProgressState } from "@/lib/storage";

interface StatsOverviewProps {
  progress: ProgressState;
  totalQuestions: number;
  totalChapters: number;
  onPlayAll: () => void;
  onPlayRandom: () => void;
  onPlayMistakes: () => void;
}

export function StatsOverview({
  progress,
  totalQuestions,
  totalChapters,
  onPlayAll,
  onPlayRandom,
  onPlayMistakes,
}: StatsOverviewProps) {
  const answered = progress.answeredCount;
  const correct = progress.correctCount;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const mistakesCount = progress.wrongQuestionIds.length;

  return (
    <div className="w-full space-y-4">
      {/* Hero Stats Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#161822] via-[#12131a] to-[#0c0d12] border border-white/8 p-6 sm:p-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <HugeiconsIcon icon={SparklesIcon} size={14} />
              JLPT N2 Grammar Master
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Luyện Thi Ngữ Pháp N2
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-xl">
              Kho đề gồm {totalChapters} Chapters, mỗi chapter chuẩn 3 dạng bài: 文の文法1, 文の文法2 (★), và 文章の文法 với tổng cộng {totalQuestions} câu hỏi.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 self-stretch md:self-auto">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 sm:p-4 text-center min-w-[90px]">
              <span className="text-[11px] font-medium text-zinc-400 block mb-0.5">
                Đã làm
              </span>
              <span className="text-lg sm:text-2xl font-black text-white">
                {answered}
              </span>
              <span className="text-[10px] text-zinc-500 block">/ {totalQuestions}</span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 sm:p-4 text-center min-w-[90px]">
              <span className="text-[11px] font-medium text-zinc-400 block mb-0.5">
                Chính xác
              </span>
              <span className="text-lg sm:text-2xl font-black text-emerald-400">
                {accuracy}%
              </span>
              <span className="text-[10px] text-zinc-500 block">{correct} đúng</span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 sm:p-4 text-center min-w-[90px]">
              <span className="text-[11px] font-medium text-zinc-400 block mb-0.5">
                Điểm tích luỹ
              </span>
              <span className="text-lg sm:text-2xl font-black text-amber-400">
                {progress.totalScore}
              </span>
              <span className="text-[10px] text-zinc-500 block">pts</span>
            </div>
          </div>
        </div>

        {/* Quick Launch Buttons */}
        <div className="relative z-10 pt-6 mt-6 border-t border-zinc-800/80 flex flex-wrap items-center gap-3">
          <button
            onClick={onPlayAll}
            className="flex-1 min-w-[170px] py-3.5 px-5 rounded-2xl bg-[#3e5c8a] hover:bg-[#4a6da1] text-white font-bold text-sm transition flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
          >
            <HugeiconsIcon icon={PlayIcon} size={18} />
            Luyện tất cả câu hỏi ({totalQuestions})
          </button>

          <button
            onClick={onPlayRandom}
            className="py-3.5 px-5 rounded-2xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm transition flex items-center justify-center gap-2 border border-white/5 active:scale-[0.98] cursor-pointer"
          >
            <HugeiconsIcon icon={SparklesIcon} size={18} className="text-indigo-400" />
            Luyện nhanh ngẫu nhiên (20 câu)
          </button>

          {mistakesCount > 0 && (
            <button
              onClick={onPlayMistakes}
              className="py-3.5 px-5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold text-sm transition flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              <HugeiconsIcon icon={RotateRight01Icon} size={17} />
              Ôn lại {mistakesCount} câu đã làm sai
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
