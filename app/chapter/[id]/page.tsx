import { notFound } from "next/navigation";
import { getChapterById } from "@/lib/chapters-data";
import { ChapterClientPage } from "./chapter-client";

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
