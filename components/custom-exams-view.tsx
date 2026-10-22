"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n"
import { PdfLoadingCat } from "@/components/pdf-loading-cat"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { customExamText } from "@/lib/custom-exams/text"
import { removeChapterProgress } from "@/lib/storage"
import { importExamPdf } from "@/lib/custom-exams/api"
import {
  CustomExamRecord,
  deleteCustomExam,
  exportAllExams,
  importExamsFromJson,
  listCustomExams,
  makeExamId,
  saveCustomExam,
} from "@/lib/custom-exams/store"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const MAX_BYTES = 20 * 1024 * 1024

const card =
  "rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-white/10 dark:bg-[#1a1c26]"
const btnPrimary =
  "inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-[#5368a4] px-4 text-sm font-bold text-white transition hover:bg-[#465a93] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
const btnGhost =
  "inline-flex h-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100 active:scale-95 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
const input =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-[#0f111a]"

function countQuestions(r: CustomExamRecord) {
  return r.chapter.sections.reduce((n, s) => n + s.questions.length, 0)
}

function countFlagged(r: CustomExamRecord) {
  return new Set(r.warnings.map((w) => w.split(":")[0])).size
}

export function CustomExamsView() {
  const router = useRouter()
  const { language } = useLanguage()
  const x = customExamText(language)

  const [exams, setExams] = useState<CustomExamRecord[]>([])
  const [loadError, setLoadError] = useState(false)
  const [examFile, setExamFile] = useState<File | null>(null)
  const [answerFile, setAnswerFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [toDelete, setToDelete] = useState<string | null>(null)
  const restoreRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => {
    try {
      setExams(await listCustomExams())
      setLoadError(false)
    } catch {
      setLoadError(true)
    }
  }, [])

  useEffect(() => {
    let alive = true
    listCustomExams()
      .then((list) => alive && setExams(list))
      .catch(() => alive && setLoadError(true))
    return () => {
      alive = false
    }
  }, [])

  const checkFile = (f: File | null): string => {
    if (!f) return ""
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      return x.notPdf
    }
    if (f.size > MAX_BYTES) return x.tooBig
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotice("")
    if (!examFile) return setError(x.needPdf)
    const problem = checkFile(examFile) || checkFile(answerFile)
    if (problem) return setError(problem)

    setError("")
    setBusy(true)
    try {
      const result = await importExamPdf({ examPdf: examFile, answerPdf: answerFile, title })
      const id = makeExamId(exams.map((r) => String(r.chapter.chapter_id)))
      const now = Date.now()
      await saveCustomExam({
        chapter: { ...result.chapter, chapter_id: id },
        warnings: result.warnings,
        createdAt: now,
        updatedAt: now,
      })
      router.push(`/${language}/my-exams/review/?id=${encodeURIComponent(id)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  const handleBackup = async () => {
    const blob = new Blob([await exportAllExams()], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `n2-my-exams-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    try {
      const n = await importExamsFromJson(await f.text())
      setNotice(x.restored.replace("{n}", String(n)))
      setError("")
      await refresh()
    } catch {
      setError(x.restoreFail)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    await deleteCustomExam(toDelete)
    removeChapterProgress(toDelete)
    setToDelete(null)
    await refresh()
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc] pb-28 text-slate-800 dark:bg-[#0f111a] dark:text-slate-100">
      <div className="mx-auto w-full max-w-3xl px-4 pt-4 sm:px-6">
        <div className="mb-5 flex items-center justify-between gap-2">
          <Link href={`/${language}/`} className={btnGhost}>
            ← {x.back}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">{x.pageTitle}</h1>
        <p className="mt-1 mb-5 text-sm text-slate-500 dark:text-slate-400">{x.pageDesc}</p>

        <form onSubmit={handleSubmit} className={`${card} mb-6 space-y-4`}>
          <h2 className="text-base font-bold">{x.uploadTitle}</h2>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{x.examPdf}</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              disabled={busy}
              onChange={(e) => setExamFile(e.target.files?.[0] ?? null)}
              className={`${input} py-1.5 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-xs file:font-bold dark:file:bg-white/10`}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{x.answerPdf}</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              disabled={busy}
              onChange={(e) => setAnswerFile(e.target.files?.[0] ?? null)}
              className={`${input} py-1.5 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-xs file:font-bold dark:file:bg-white/10`}
            />
            {!answerFile && (
              <span className="block text-xs text-amber-600 dark:text-amber-400">{x.answerHint}</span>
            )}
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{x.examName}</span>
            <input
              type="text"
              maxLength={120}
              value={title}
              disabled={busy}
              onChange={(e) => setTitle(e.target.value)}
              className={input}
            />
            <span className="block text-xs text-slate-400">{x.examNameHint}</span>
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {notice}
            </p>
          )}
          {busy && <PdfLoadingCat messages={x.loadingMessages} elapsedLabel={x.elapsed} />}

          <button type="submit" disabled={busy || !examFile} className={btnPrimary}>
            {x.submit}
          </button>
        </form>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">{x.listTitle}</h2>
          <div className="flex gap-2">
            <button type="button" onClick={handleBackup} disabled={exams.length === 0} className={`${btnGhost} disabled:opacity-40`}>
              {x.backup}
            </button>
            <button type="button" onClick={() => restoreRef.current?.click()} className={btnGhost}>
              {x.restore}
            </button>
            <input ref={restoreRef} type="file" accept="application/json,.json" hidden onChange={handleRestore} />
          </div>
        </div>

        {loadError && <p className="mb-3 text-sm text-rose-600">{x.storageFail}</p>}
        {exams.length === 0 && !loadError && (
          <p className={`${card} text-sm text-slate-500 dark:text-slate-400`}>{x.empty}</p>
        )}

        <ul className="space-y-3">
          {exams.map((r) => {
            const id = String(r.chapter.chapter_id)
            const flagged = countFlagged(r)
            return (
              <li key={id} className={`${card} flex flex-wrap items-center justify-between gap-3`}>
                <div className="min-w-0">
                  <p className="truncate font-bold">{r.chapter.chapter_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {r.chapter.sections.length} {x.sections} • {countQuestions(r)} {x.questions}
                    {flagged > 0 && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                        {flagged} {x.needsReview}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/${language}/my-exams/view/?id=${encodeURIComponent(id)}`} className={btnPrimary}>
                    {x.practice}
                  </Link>
                  <Link href={`/${language}/my-exams/review/?id=${encodeURIComponent(id)}`} className={`${btnGhost} h-10`}>
                    {x.review}
                  </Link>
                  <button type="button" onClick={() => setToDelete(id)} className={`${btnGhost} h-10 text-rose-600 dark:text-rose-400`}>
                    {x.delete}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{x.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{x.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="lg">{x.cancel}</AlertDialogCancel>
            <AlertDialogAction size="lg" onClick={confirmDelete}>
              {x.confirmDelete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
