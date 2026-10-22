"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { customExamText } from "@/lib/custom-exams/text"
import {
  CustomExamRecord,
  getCustomExam,
  saveCustomExam,
} from "@/lib/custom-exams/store"
import { removeChapterProgress } from "@/lib/storage"
import { useQuiz } from "@/lib/quiz-context"
import type { Chapter, RawQuestion, RawSection } from "@/lib/types"

const btnPrimary =
  "inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-[#5368a4] px-4 text-sm font-bold text-white transition hover:bg-[#465a93] active:scale-95 disabled:opacity-50"
const btnGhost =
  "inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
const field =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm dark:border-white/10 dark:bg-[#0f111a]"
const label = "block text-xs font-semibold text-slate-500 dark:text-slate-400"

const MAX_OPTIONS = 4
const MIN_OPTIONS = 2

const warnKey = (sectionName: string, n: number) => `${sectionName} câu ${n}`
const optionKeys = (q: RawQuestion) =>
  Object.keys(q.options).sort((a, b) => Number(a) - Number(b))

function nextQuestionNumber(chapter: Chapter) {
  return (
    chapter.sections.reduce(
      (max, s) => s.questions.reduce((m, q) => Math.max(m, q.question_number), max),
      0
    ) + 1
  )
}

function blankQuestion(n: number): RawQuestion {
  return {
    question_number: n,
    question_text: "",
    options: { "1": "", "2": "", "3": "", "4": "" },
    answer: 1,
  }
}

/** Xóa lựa chọn thứ k và đánh số lại options, options_vi, answer. */
function removeOptionAt(q: RawQuestion, k: string) {
  const keys = optionKeys(q)
  const idx = keys.indexOf(k)
  const reindex = (rec: Record<string, string>) =>
    Object.fromEntries(
      keys.filter((x) => x !== k).map((x, i) => [String(i + 1), rec[x] ?? ""])
    )
  const answerIdx = q.answer - 1
  q.options = reindex(q.options)
  if (q.options_vi) q.options_vi = reindex(q.options_vi)
  q.answer = answerIdx === idx ? 1 : answerIdx > idx ? q.answer - 1 : q.answer
  delete q.ordered_sequence
}

function parseSequence(text: string): number[] | null {
  const parts = text.split(/[\s,→]+/).filter(Boolean)
  if (parts.length === 0) return []
  const nums = parts.map(Number)
  return nums.every((n) => Number.isInteger(n)) ? nums : null
}

function validate(
  chapter: Chapter,
  x: ReturnType<typeof customExamText>
): string[] {
  const errors: string[] = []
  const total = chapter.sections.reduce((n, s) => n + s.questions.length, 0)
  if (total === 0) errors.push(x.errNoQuestions)
  for (const sec of chapter.sections) {
    for (const q of sec.questions) {
      const tag = `${sec.section_name} #${q.question_number}`
      const keys = optionKeys(q)
      if (
        keys.length < MIN_OPTIONS ||
        keys.length > MAX_OPTIONS ||
        keys.some((k) => !q.options[k].trim())
      ) {
        errors.push(`${tag}: ${x.errNeedOptions}`)
      }
      if (!(q.question_text ?? q.word ?? "").trim()) {
        errors.push(`${tag}: ${x.errNeedText}`)
      }
      if (q.ordered_sequence?.length) {
        const sorted = [...q.ordered_sequence].sort((a, b) => a - b)
        if (sorted.join() !== keys.map(Number).join()) {
          errors.push(`${tag}: ${x.errSequence}`)
        }
      }
    }
  }
  return errors
}

/** Chuẩn hóa trước khi lưu: cắt khoảng trắng, bỏ options_vi/ordered_sequence rỗng. */
function normalize(chapter: Chapter): Chapter {
  const c = structuredClone(chapter)
  c.chapter_name = c.chapter_name.trim() || "Đề không tên"
  for (const sec of c.sections) {
    sec.section_name = sec.section_name.trim()
    if (sec.instruction !== undefined && !sec.instruction.trim()) delete sec.instruction
    for (const q of sec.questions) {
      for (const k of Object.keys(q.options)) q.options[k] = q.options[k].trim()
      if (q.question_text !== undefined) q.question_text = q.question_text.trim()
      if (q.options_vi) {
        if (Object.values(q.options_vi).every((v) => !v.trim())) delete q.options_vi
        else for (const k of Object.keys(q.options_vi)) q.options_vi[k] = q.options_vi[k].trim()
      }
      if (!q.ordered_sequence?.length) delete q.ordered_sequence
      if (!q.full_sentence?.trim()) delete q.full_sentence
    }
  }
  return c
}

export function CustomExamReview({ id }: { id: string }) {
  const { language } = useLanguage()
  const x = customExamText(language)
  const { setIsQuizActive } = useQuiz()
  const [record, setRecord] = useState<CustomExamRecord | null>(null)
  const [state, setState] = useState<"loading" | "missing" | "ready">("loading")
  const [onlyFlagged, setOnlyFlagged] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [savedAt, setSavedAt] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  // Ô nhập thứ tự ★ giữ dạng chữ để gõ dở không bị mất.
  const [seqText, setSeqText] = useState<Record<string, string>>({})

  useEffect(() => {
    let alive = true
    getCustomExam(id)
      .then((r) => {
        if (!alive) return
        if (r) {
          setRecord(r)
          setState("ready")
        } else setState("missing")
      })
      .catch(() => alive && setState("missing"))
    return () => {
      alive = false
    }
  }, [id])

  // Ẩn bong bóng AI (dùng cơ chế sẵn có của quiz) vì nó che thanh Lưu/Luyện tập ở đáy trang.
  useEffect(() => {
    setIsQuizActive(true)
    return () => setIsQuizActive(false)
  }, [setIsQuizActive])

  // Cảnh báo khi rời trang mà chưa lưu.
  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", h)
    return () => window.removeEventListener("beforeunload", h)
  }, [dirty])

  const flaggedKeys = useMemo(
    () => new Set((record?.warnings ?? []).map((w) => w.split(":")[0])),
    [record?.warnings]
  )

  const update = (fn: (draft: CustomExamRecord) => void) => {
    setRecord((prev) => {
      if (!prev) return prev
      const draft = structuredClone(prev)
      fn(draft)
      return draft
    })
    setDirty(true)
  }

  const patchQuestion = (si: number, qi: number, fn: (q: RawQuestion) => void) =>
    update((d) => fn(d.chapter.sections[si].questions[qi]))

  const patchSection = (si: number, fn: (s: RawSection) => void) =>
    update((d) => fn(d.chapter.sections[si]))

  const dropWarnings = (d: CustomExamRecord, key: string) => {
    d.warnings = d.warnings.filter((w) => w.split(":")[0] !== key)
  }

  const removeQuestion = (si: number, qi: number) =>
    update((d) => {
      const sec = d.chapter.sections[si]
      const [q] = sec.questions.splice(qi, 1)
      dropWarnings(d, warnKey(sec.section_name, q.question_number))
      if (sec.questions.length === 0) d.chapter.sections.splice(si, 1)
    })

  const removeSection = (si: number) =>
    update((d) => {
      const [sec] = d.chapter.sections.splice(si, 1)
      for (const q of sec.questions) dropWarnings(d, warnKey(sec.section_name, q.question_number))
    })

  const addQuestion = (si: number) =>
    update((d) => {
      d.chapter.sections[si].questions.push(blankQuestion(nextQuestionNumber(d.chapter)))
    })

  const addSection = () =>
    update((d) => {
      d.chapter.sections.push({
        section_name: `${x.newSection} ${d.chapter.sections.length + 1}`,
        questions: [blankQuestion(nextQuestionNumber(d.chapter))],
      })
    })

  const handleSave = async () => {
    if (!record) return
    const found = validate(record.chapter, x)
    setErrors(found)
    if (found.length > 0) return
    const next: CustomExamRecord = {
      ...record,
      chapter: normalize(record.chapter),
      updatedAt: Date.now(),
    }
    await saveCustomExam(next)
    // Đáp án có thể đã đổi nên kết quả làm bài cũ không còn đáng tin.
    removeChapterProgress(next.chapter.chapter_id)
    setRecord(next)
    setDirty(false)
    setSavedAt(Date.now())
  }

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen bg-[#f6f8fc] pb-40 text-slate-800 dark:bg-[#0f111a] dark:text-slate-100">
      <div className="mx-auto w-full max-w-3xl px-4 pt-4 sm:px-6">
        <div className="mb-5 flex items-center justify-between gap-2">
          <Link href={`/${language}/my-exams/`} className={btnGhost}>
            ← {x.back}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
        {children}
      </div>
    </main>
  )

  if (state === "loading") return shell(<p className="text-sm">{x.loading}</p>)
  if (state === "missing" || !record) return shell(<p className="text-sm">{x.notFound}</p>)

  return shell(
    <>
      <h1 className="text-2xl font-bold tracking-tight">{x.reviewTitle}</h1>
      <p className="mt-1 mb-4 text-sm text-slate-500 dark:text-slate-400">{x.reviewDesc}</p>

      <label className={`${label} mb-4`}>
        {x.examTitle}
        <input
          className={`${field} mt-1 text-base font-bold`}
          maxLength={120}
          value={record.chapter.chapter_name}
          onChange={(e) => update((d) => void (d.chapter.chapter_name = e.target.value))}
        />
      </label>

      <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={onlyFlagged}
          onChange={(e) => setOnlyFlagged(e.target.checked)}
        />
        {x.onlyFlagged} ({flaggedKeys.size})
      </label>

      <div className="space-y-8">
        {record.chapter.sections.map((sec, si) => (
          <section key={si} className="space-y-3">
            <div className="grid gap-2 rounded-2xl border border-[#5368a4]/30 bg-[#5368a4]/5 p-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
              <label className={label}>
                {x.sectionName}
                <input
                  className={`${field} mt-1 font-bold`}
                  value={sec.section_name}
                  onChange={(e) =>
                    update((d) => {
                      // Cảnh báo gắn theo tên phần nên phải đổi theo.
                      const s = d.chapter.sections[si]
                      const old = `${s.section_name} câu `
                      d.warnings = d.warnings.map((w) =>
                        w.startsWith(old) ? `${e.target.value} câu ${w.slice(old.length)}` : w
                      )
                      s.section_name = e.target.value
                    })
                  }
                />
              </label>
              <label className={label}>
                {x.sectionInstruction}
                <input
                  className={`${field} mt-1 font-normal`}
                  value={sec.instruction ?? ""}
                  onChange={(e) => patchSection(si, (s) => void (s.instruction = e.target.value))}
                />
              </label>
              <button
                type="button"
                className={`${btnGhost} text-rose-600 dark:text-rose-400`}
                onClick={() => removeSection(si)}
              >
                {x.removeSection}
              </button>
            </div>

            {sec.questions.map((q, qi) => {
              const key = warnKey(sec.section_name, q.question_number)
              const flagged = flaggedKeys.has(key)
              if (onlyFlagged && !flagged) return null
              const keys = optionKeys(q)
              const isOrdering = Boolean(q.ordered_sequence?.length || q.full_sentence)
              const seqKey = `${si}-${qi}`
              return (
                <div
                  key={q.question_number}
                  className={`rounded-2xl border p-4 ${
                    flagged
                      ? "border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-950/20"
                      : "border-slate-200 bg-white dark:border-white/10 dark:bg-[#1a1c26]"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">
                      #{q.question_number}
                      {flagged && (
                        <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                          {x.flagged}
                        </span>
                      )}
                    </span>
                    <div className="flex gap-2">
                      {flagged && (
                        <button
                          type="button"
                          className={btnGhost}
                          onClick={() => update((d) => dropWarnings(d, key))}
                        >
                          {x.markChecked}
                        </button>
                      )}
                      <button
                        type="button"
                        className={`${btnGhost} text-rose-600 dark:text-rose-400`}
                        onClick={() => removeQuestion(si, qi)}
                      >
                        {x.removeQuestion}
                      </button>
                    </div>
                  </div>

                  {flagged && (
                    <ul className="mb-2 list-disc pl-5 text-xs text-amber-700 dark:text-amber-300">
                      {record.warnings
                        .filter((w) => w.split(":")[0] === key)
                        .map((w) => (
                          <li key={w}>{w.slice(key.length + 1).trim()}</li>
                        ))}
                    </ul>
                  )}

                  <label className={`${label} mb-2`}>
                    {x.questionText}
                    <textarea
                      rows={2}
                      className={`${field} mt-1 font-normal`}
                      value={q.question_text ?? q.word ?? ""}
                      onChange={(e) =>
                        patchQuestion(si, qi, (qq) => {
                          if (qq.word && !qq.question_text) qq.word = e.target.value
                          else qq.question_text = e.target.value
                        })
                      }
                    />
                  </label>

                  <div className="space-y-2">
                    {keys.map((k) => (
                      <div key={k} className="flex items-start gap-2">
                        <input
                          type="radio"
                          className="mt-2.5"
                          name={`ans-${si}-${qi}`}
                          aria-label={`${x.correctAnswer} ${k}`}
                          checked={q.answer === Number(k)}
                          onChange={() => patchQuestion(si, qi, (qq) => void (qq.answer = Number(k)))}
                        />
                        <span className="mt-2 w-4 text-xs font-bold">{k}</span>
                        <div className="grid flex-1 gap-1.5 sm:grid-cols-2">
                          <input
                            className={field}
                            value={q.options[k] ?? ""}
                            onChange={(e) =>
                              patchQuestion(si, qi, (qq) => void (qq.options[k] = e.target.value))
                            }
                          />
                          <input
                            className={`${field} text-slate-500`}
                            placeholder={x.translation}
                            value={q.options_vi?.[k] ?? ""}
                            onChange={(e) =>
                              patchQuestion(si, qi, (qq) => {
                                const vi = Object.fromEntries(
                                  optionKeys(qq).map((kk) => [kk, qq.options_vi?.[kk] ?? ""])
                                )
                                vi[k] = e.target.value
                                qq.options_vi = vi
                              })
                            }
                          />
                        </div>
                        <button
                          type="button"
                          className={btnGhost}
                          disabled={keys.length <= MIN_OPTIONS}
                          aria-label={`${x.removeOption} ${k}`}
                          title={x.removeOption}
                          onClick={() => patchQuestion(si, qi, (qq) => removeOptionAt(qq, k))}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className={`${btnGhost} mt-2`}
                    disabled={keys.length >= MAX_OPTIONS}
                    onClick={() =>
                      patchQuestion(si, qi, (qq) => {
                        const n = String(optionKeys(qq).length + 1)
                        qq.options[n] = ""
                        if (qq.options_vi) qq.options_vi[n] = ""
                        delete qq.ordered_sequence
                      })
                    }
                  >
                    + {x.addOption}
                  </button>

                  {isOrdering && (
                    <div className="mt-3 space-y-2">
                      <label className={label}>
                        {x.fullSentence}
                        <input
                          className={`${field} mt-1 font-normal`}
                          value={q.full_sentence ?? ""}
                          onChange={(e) =>
                            patchQuestion(si, qi, (qq) => void (qq.full_sentence = e.target.value))
                          }
                        />
                      </label>
                      <label className={label}>
                        {x.orderedSequence}
                        <input
                          className={`${field} mt-1 font-normal`}
                          value={seqText[seqKey] ?? q.ordered_sequence?.join(",") ?? ""}
                          onChange={(e) => {
                            setSeqText((p) => ({ ...p, [seqKey]: e.target.value }))
                            const parsed = parseSequence(e.target.value)
                            if (parsed) patchQuestion(si, qi, (qq) => void (qq.ordered_sequence = parsed))
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              )
            })}

            <button type="button" className={btnGhost} onClick={() => addQuestion(si)}>
              + {x.addQuestion}
            </button>
          </section>
        ))}

        <button type="button" className={btnGhost} onClick={addSection}>
          + {x.addSection}
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/90 p-3 backdrop-blur dark:border-white/10 dark:bg-[#0f111a]/90">
        <div className="mx-auto max-w-3xl px-1">
          {errors.length > 0 && (
            <div role="alert" className="mb-2 max-h-28 overflow-y-auto rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <p className="font-bold">{x.fixErrors}</p>
              <ul className="list-disc pl-4">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex items-center justify-start gap-3">
            <button type="button" className={btnPrimary} disabled={!dirty} onClick={handleSave}>
              {x.save}
            </button>
            <Link
              href={`/${language}/my-exams/view/?id=${encodeURIComponent(id)}`}
              className={`${btnPrimary} ${dirty ? "pointer-events-none opacity-50" : ""}`}
            >
              {x.practice}
            </Link>
            {dirty ? (
              <span className="text-sm text-amber-600 dark:text-amber-400">{x.unsaved}</span>
            ) : (
              savedAt > 0 && <span className="text-sm text-emerald-600 dark:text-emerald-400">{x.saved}</span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
