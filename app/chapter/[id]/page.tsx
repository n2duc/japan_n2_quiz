import { notFound } from "next/navigation"
import { getChapterById, getAllChapters } from "@/lib/chapters-data"
import { ChapterClientPage } from "./chapter-client"

export function generateStaticParams() {
  return getAllChapters().map((ch) => ({
    id: String(ch.chapter_id),
  }))
}

interface ChapterPageProps {
  params: Promise<{ id: string }>
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { id } = await params
  const chapter =
    getChapterById(id) ||
    (!isNaN(Number(id)) ? getChapterById(Number(id)) : undefined)

  if (!chapter) {
    notFound()
  }

  return <ChapterClientPage chapter={chapter} />
}
