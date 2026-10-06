"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SparklesIcon,
  PlayIcon,
  RotateRight01Icon,
  StarIcon,
  BookOpen01Icon,
  CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons"
import { ProgressState } from "@/lib/storage"

interface StatsOverviewProps {
  progress: ProgressState
  totalQuestions: number
  totalChapters: number
  onPlayAll: () => void
  onPlayRandom: () => void
  onPlayMistakes: () => void
}

export function StatsOverview({
  progress,
  totalQuestions,
  totalChapters,
  onPlayAll,
  onPlayRandom,
  onPlayMistakes,
}: StatsOverviewProps) {
  const answered = progress.answeredCount
  const correct = progress.correctCount
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0
  const mistakesCount = progress.wrongQuestionIds.length

  return (
    <div className="w-full space-y-4">
      {/* Hero Stats Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-[#161822] via-[#12131a] to-[#0c0d12] p-6 sm:p-8">
        <div className="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-indigo-400 uppercase">
              <HugeiconsIcon icon={SparklesIcon} size={14} />
              JLPT N2 Grammar Master
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Luyện Thi Ngữ Pháp N2
            </h1>
            <p className="mt-1 max-w-xl text-xs text-zinc-400 sm:text-sm">
              Kho đề gồm {totalChapters} Chapters, mỗi chapter chuẩn 3 dạng bài:
              文の文法1, 文の文法2 (★), và 文章の文法 với tổng cộng{" "}
              {totalQuestions} câu hỏi.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 self-stretch md:self-auto">
            <div className="min-w-[90px] rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 text-center sm:p-4">
              <span className="mb-0.5 block text-[11px] font-medium text-zinc-400">
                Đã làm
              </span>
              <span className="text-lg font-black text-white sm:text-2xl">
                {answered}
              </span>
              <span className="block text-[10px] text-zinc-500">
                / {totalQuestions}
              </span>
            </div>

            <div className="min-w-[90px] rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 text-center sm:p-4">
              <span className="mb-0.5 block text-[11px] font-medium text-zinc-400">
                Chính xác
              </span>
              <span className="text-lg font-black text-emerald-400 sm:text-2xl">
                {accuracy}%
              </span>
              <span className="block text-[10px] text-zinc-500">
                {correct} đúng
              </span>
            </div>

            <div className="min-w-[90px] rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 text-center sm:p-4">
              <span className="mb-0.5 block text-[11px] font-medium text-zinc-400">
                Điểm tích luỹ
              </span>
              <span className="text-lg font-black text-amber-400 sm:text-2xl">
                {progress.totalScore}
              </span>
              <span className="block text-[10px] text-zinc-500">pts</span>
            </div>
          </div>
        </div>

        {/* Quick Launch Buttons */}
        <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3 border-t border-zinc-800/80 pt-6">
          <button
            onClick={onPlayAll}
            className="flex min-w-[170px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#3e5c8a] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#4a6da1] active:scale-[0.98]"
          >
            <HugeiconsIcon icon={PlayIcon} size={18} />
            Luyện tất cả câu hỏi ({totalQuestions})
          </button>

          <button
            onClick={onPlayRandom}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/5 bg-zinc-800/90 px-5 py-3.5 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-700 active:scale-[0.98]"
          >
            <HugeiconsIcon
              icon={SparklesIcon}
              size={18}
              className="text-indigo-400"
            />
            Luyện nhanh ngẫu nhiên (20 câu)
          </button>

          {mistakesCount > 0 && (
            <button
              onClick={onPlayMistakes}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 active:scale-[0.98]"
            >
              <HugeiconsIcon icon={RotateRight01Icon} size={17} />
              Ôn lại {mistakesCount} câu đã làm sai
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
