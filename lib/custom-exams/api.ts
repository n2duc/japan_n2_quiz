import { API_BASE } from "@/lib/chat-api"
import type { Chapter } from "@/lib/types"
import { getDeviceId } from "./store"

export interface ImportResult {
  chapter: Chapter
  warnings: string[]
}

export async function importExamPdf(opts: {
  examPdf: File
  answerPdf?: File | null
  title?: string
}): Promise<ImportResult> {
  const form = new FormData()
  form.append("exam_pdf", opts.examPdf)
  if (opts.answerPdf) form.append("answer_pdf", opts.answerPdf)
  if (opts.title?.trim()) form.append("title", opts.title.trim())

  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/exams/import`, {
      method: "POST",
      headers: { "X-Device-Id": getDeviceId() },
      body: form,
    })
  } catch {
    throw new Error("Không kết nối được máy chủ. Kiểm tra backend đang chạy.")
  }

  if (!res.ok) {
    let detail = `Lỗi máy chủ (${res.status})`
    try {
      const body = await res.json()
      if (typeof body?.detail === "string") detail = body.detail
    } catch {
      // giữ thông báo mặc định
    }
    throw new Error(detail)
  }
  return (await res.json()) as ImportResult
}
