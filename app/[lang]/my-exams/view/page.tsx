"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ChapterClientPage } from "../../chapter/[id]/chapter-client"
import { setCustomChapters } from "@/lib/chapters-data"
import { getCustomExam } from "@/lib/custom-exams/store"
import { customExamText } from "@/lib/custom-exams/text"
import { useLanguage } from "@/lib/i18n"
import type { Chapter } from "@/lib/types"

function ViewContent() {
  const id = useSearchParams().get("id") ?? ""
  const { language } = useLanguage()
  const x = customExamText(language)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let alive = true
    getCustomExam(id)
      .then((r) => {
        if (!alive) return
        if (!r) return setMissing(true)
        // Đăng ký để getSectionQuestions/getChapterAllQuestions tìm thấy đề này.
        setCustomChapters([r.chapter])
        setChapter(r.chapter)
      })
      .catch(() => alive && setMissing(true))
    return () => {
      alive = false
      setCustomChapters([])
    }
  }, [id])

  if (missing) {
    return (
      <main className="p-6 text-sm">
        {x.notFound}{" "}
        <Link className="underline" href={`/${language}/my-exams/`}>
          {x.back}
        </Link>
      </main>
    )
  }
  if (!chapter) return <main className="p-6 text-sm">{x.loading}</main>
  return <ChapterClientPage chapter={chapter} backHref={`/${language}/my-exams/`} />
}

export default function ViewPage() {
  return (
    <Suspense fallback={null}>
      <ViewContent />
    </Suspense>
  )
}
