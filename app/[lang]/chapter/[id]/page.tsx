import { notFound } from "next/navigation"
import { getChapterById, getAllChapters } from "@/lib/chapters-data"
import { ChapterClientPage } from "./chapter-client"

export function generateStaticParams() {
  const chapters = getAllChapters()
  const list: { lang: string; id: string }[] = []
  for (const lang of ["vi", "ja"]) {
    for (const ch of chapters) {
      list.push({
        lang,
        id: String(ch.chapter_id),
      })
    }
  }
  return list
}

interface ChapterPageProps {
  params: Promise<{ lang: string; id: string }>
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { lang, id } = await params
  if (lang !== "vi" && lang !== "ja") {
    notFound()
  }

  const chapter =
    getChapterById(id) ||
    (!isNaN(Number(id)) ? getChapterById(Number(id)) : undefined)

  if (!chapter) {
    notFound()
  }

  return <ChapterClientPage chapter={chapter} />
}
