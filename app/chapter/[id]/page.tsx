import { notFound } from "next/navigation";
import { getChapterById, getAllChapters } from "@/lib/chapters-data";
import { ChapterClientPage } from "./chapter-client";

export function generateStaticParams() {
  return getAllChapters().map((ch) => ({
    id: String(ch.chapter_id),
  }));
}

interface ChapterPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { id } = await params;
  const chapterId = parseInt(id, 10);
  const chapter = getChapterById(chapterId);

  if (!chapter) {
    notFound();
  }

  return <ChapterClientPage chapter={chapter} />;
}
