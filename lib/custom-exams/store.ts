import type { Chapter } from "@/lib/types"

export interface CustomExamRecord {
  chapter: Chapter
  warnings: string[]
  createdAt: number
  updatedAt: number
}

const DB_NAME = "n2_custom_exams"
const STORE = "exams"
const DEVICE_KEY = "n2_device_id"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB không khả dụng"))
      return
    }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "chapter.chapter_id" })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export async function listCustomExams(): Promise<CustomExamRecord[]> {
  const all = await run<CustomExamRecord[]>("readonly", (s) => s.getAll())
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function getCustomExam(
  id: string
): Promise<CustomExamRecord | undefined> {
  return run<CustomExamRecord | undefined>("readonly", (s) => s.get(id))
}

export async function saveCustomExam(record: CustomExamRecord): Promise<void> {
  await run("readwrite", (s) => s.put(record))
}

export async function deleteCustomExam(id: string): Promise<void> {
  await run("readwrite", (s) => s.delete(id))
}

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    return "anonymous"
  }
}

/** Tạo chapter_id duy nhất cho đề mới. */
export function makeExamId(existing: string[] = []) {
  let id: string
  do {
    id = `custom-${crypto.randomUUID().slice(0, 8)}`
  } while (existing.includes(id))
  return id
}

export async function exportAllExams(): Promise<string> {
  return JSON.stringify(await listCustomExams())
}

export async function importExamsFromJson(text: string): Promise<number> {
  const parsed: unknown = JSON.parse(text)
  if (!Array.isArray(parsed)) throw new Error("File backup không hợp lệ")
  const existing = (await listCustomExams()).map((e) => String(e.chapter.chapter_id))
  let count = 0
  for (const item of parsed as CustomExamRecord[]) {
    const ch = item?.chapter
    if (
      !ch ||
      typeof ch.chapter_name !== "string" ||
      !Array.isArray(ch.sections) ||
      !String(ch.chapter_id).startsWith("custom-")
    ) {
      continue
    }
    const id = String(ch.chapter_id)
    if (existing.includes(id)) {
      // Không ghi đè đề đang có: đổi sang id mới.
      ch.chapter_id = makeExamId(existing)
    }
    existing.push(String(ch.chapter_id))
    await saveCustomExam({
      chapter: ch,
      warnings: Array.isArray(item.warnings) ? item.warnings : [],
      createdAt: item.createdAt || Date.now(),
      updatedAt: Date.now(),
    })
    count++
  }
  return count
}
