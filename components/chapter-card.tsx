"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PlayIcon,
  CheckmarkCircle01Icon,
  StarIcon,
  BookOpen01Icon,
  CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons"
import { Chapter } from "@/lib/types"
import { ProgressState } from "@/lib/storage"

interface ChapterCardProps {
  chapter: Chapter
  progress: ProgressState
  onSelectSection: (chapterId: number | string, sectionIndex: number) => void
  onSelectChapterAll: (chapterId: number | string) => void
}

export function ChapterCard({
  chapter,
  progress,
  onSelectSection,
  onSelectChapterAll,
}: ChapterCardProps) {
  const chapterId = chapter.chapter_id

  // Compute total questions and completion
  const totalChapterQuestions = chapter.sections.reduce(
    (acc, sec) => acc + (sec.questions?.length || 0),
    0
  )

  let chapterCorrect = 0
  let sectionsCompletedCount = 0

  chapter.sections.forEach((_, sIdx) => {
    const key = `ch${chapterId}-s${sIdx}`
    const p = progress.sectionProgress[key]
    if (p && p.completed) {
      sectionsCompletedCount += 1
      chapterCorrect += p.score
    }
  })

  const isAllCompleted =
    sectionsCompletedCount === chapter.sections.length &&
    chapter.sections.length > 0

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
  ]

  return (
    <div className="group rounded-3xl border border-white/5 bg-[#15161c] p-5 transition-all duration-200 hover:border-white/10 sm:p-6">
      {/* Chapter Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-zinc-800/80 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-xl font-black text-white">
            {chapterId}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold tracking-wide text-white">
                Chapter {chapterId} • {chapter.chapter_name}
              </h3>
              {isAllCompleted && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  <HugeiconsIcon icon={CheckmarkBadge01Icon} size={13} />
                  Hoàn thành
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-zinc-400 sm:text-sm">
              3 Sections • {totalChapterQuestions} câu hỏi ngữ pháp
              {sectionsCompletedCount > 0 && (
                <span className="ml-1 text-zinc-500">
                  (Đã làm: {sectionsCompletedCount}/3 phần)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Play entire chapter */}
        <button
          onClick={() => onSelectChapterAll(chapterId)}
          className="flex cursor-pointer items-center gap-1.5 self-start rounded-xl border border-white/5 bg-zinc-800/80 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-[#3e5c8a] hover:text-white sm:self-center sm:text-sm"
        >
          <HugeiconsIcon icon={PlayIcon} size={15} />
          Luyện cả Chapter ({totalChapterQuestions} câu)
        </button>
      </div>

      {/* 3 Sections Grid as in data */}
      <div className="grid grid-cols-1 gap-3 pt-4 md:grid-cols-3">
        {chapter.sections.map((sec, sIdx) => {
          const meta = sectionMeta[sIdx] || {
            title: sec.section_name,
            subtitle: "Luyện ngữ pháp",
            badge: `Phần ${sIdx + 1}`,
            icon: CheckmarkCircle01Icon,
            accent: "text-zinc-400 bg-zinc-800 border-zinc-700",
          }

          const key = `ch${chapterId}-s${sIdx}`
          const sp = progress.sectionProgress[key]
          const isDone = sp?.completed
          const qCount = sec.questions?.length || 0

          return (
            <div
              key={sIdx}
              onClick={() => onSelectSection(chapterId, sIdx)}
              className="group/sec flex cursor-pointer flex-col justify-between rounded-2xl border border-white/5 bg-[#1b1c23] p-4 transition-all duration-200 hover:border-indigo-500/30 hover:bg-[#20222b] active:scale-[0.99]"
            >
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${meta.accent}`}
                  >
                    <HugeiconsIcon icon={meta.icon} size={12} />
                    {meta.badge}
                  </span>
                  <span className="text-xs font-medium text-zinc-400">
                    {qCount} câu
                  </span>
                </div>

                <h4 className="line-clamp-1 text-sm font-bold text-white transition group-hover/sec:text-indigo-300">
                  {sec.section_name}
                </h4>
                <p className="mt-1 line-clamp-1 text-xs text-zinc-400">
                  {meta.subtitle}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-3">
                <div>
                  {isDone ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} />
                      Đúng {sp.score}/{sp.total} câu
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500">
                      Chưa hoàn thành
                    </span>
                  )}
                </div>

                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 transition group-hover/sec:bg-[#3e5c8a] group-hover/sec:text-white">
                  <HugeiconsIcon icon={PlayIcon} size={14} />
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
