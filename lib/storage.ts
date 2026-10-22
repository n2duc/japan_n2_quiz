export interface SectionProgress {
  completed: boolean
  score: number
  total: number
  lastPlayed: number
}

export interface ProgressState {
  answeredCount: number
  correctCount: number
  totalScore: number
  streak: number
  bestStreak: number
  wrongQuestionIds: string[]
  bookmarkedQuestionIds: string[]
  // key: "ch{chapterId}-s{sectionIndex}"
  sectionProgress: Record<string, SectionProgress>
}

const STORAGE_KEY = "n2_quiz_progress_v1"

export const defaultProgress: ProgressState = {
  answeredCount: 0,
  correctCount: 0,
  totalScore: 0,
  streak: 0,
  bestStreak: 0,
  wrongQuestionIds: [],
  bookmarkedQuestionIds: [],
  sectionProgress: {},
}

export function getStoredProgress(): ProgressState {
  if (typeof window === "undefined") return defaultProgress
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress
    return { ...defaultProgress, ...JSON.parse(raw) }
  } catch {
    return defaultProgress
  }
}

export function saveProgress(progress: ProgressState) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    window.dispatchEvent(
      new CustomEvent("n2-progress-updated", { detail: progress })
    )
  } catch {
    // Ignore storage quota error
  }
}

export function recordQuestionResult(
  questionId: string,
  isCorrect: boolean,
  chapterId?: number | string,
  sectionIndex?: number
): ProgressState {
  const current = getStoredProgress()
  const next: ProgressState = { ...current }

  next.answeredCount += 1
  if (isCorrect) {
    next.correctCount += 1
    next.totalScore += 10
    next.streak += 1
    if (next.streak > next.bestStreak) {
      next.bestStreak = next.streak
    }
    // If it was in wrong list, remove it
    next.wrongQuestionIds = next.wrongQuestionIds.filter(
      (id) => id !== questionId
    )
  } else {
    next.streak = 0
    if (!next.wrongQuestionIds.includes(questionId)) {
      next.wrongQuestionIds.push(questionId)
    }
  }

  saveProgress(next)
  return next
}

export function recordSectionCompleted(
  chapterId: number | string,
  sectionIndex: number,
  score: number,
  total: number
): ProgressState {
  const current = getStoredProgress()
  const key = `ch${chapterId}-s${sectionIndex}`
  const existing = current.sectionProgress[key]

  const bestScore = existing ? Math.max(existing.score, score) : score

  const next: ProgressState = {
    ...current,
    sectionProgress: {
      ...current.sectionProgress,
      [key]: {
        completed: true,
        score: bestScore,
        total,
        lastPlayed: Date.now(),
      },
    },
  }

  saveProgress(next)
  return next
}

export function toggleBookmarkQuestion(questionId: string): boolean {
  const current = getStoredProgress()
  const exists = current.bookmarkedQuestionIds.includes(questionId)
  const nextBookmarked = exists
    ? current.bookmarkedQuestionIds.filter((id) => id !== questionId)
    : [...current.bookmarkedQuestionIds, questionId]

  saveProgress({
    ...current,
    bookmarkedQuestionIds: nextBookmarked,
  })

  return !exists
}

export function removeBookmarkQuestion(questionId: string): ProgressState {
  const current = getStoredProgress()
  const next: ProgressState = {
    ...current,
    bookmarkedQuestionIds: current.bookmarkedQuestionIds.filter(
      (id) => id !== questionId
    ),
  }
  saveProgress(next)
  return next
}

export function clearAllBookmarks(): ProgressState {
  const current = getStoredProgress()
  const next: ProgressState = {
    ...current,
    bookmarkedQuestionIds: [],
  }
  saveProgress(next)
  return next
}

export function resetAllProgress() {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(
    new CustomEvent("n2-progress-updated", { detail: defaultProgress })
  )
}

/** Xóa tiến độ, bookmark và câu sai thuộc một chapter (dùng khi xóa đề tự tạo). */
export function removeChapterProgress(chapterId: number | string): ProgressState {
  const current = getStoredProgress()
  const qPrefix = `ch${chapterId}-s`
  const sectionProgress = Object.fromEntries(
    Object.entries(current.sectionProgress).filter(
      ([key]) => !key.startsWith(qPrefix)
    )
  )
  const next: ProgressState = {
    ...current,
    sectionProgress,
    wrongQuestionIds: current.wrongQuestionIds.filter(
      (id) => !id.startsWith(qPrefix)
    ),
    bookmarkedQuestionIds: current.bookmarkedQuestionIds.filter(
      (id) => !id.startsWith(qPrefix)
    ),
  }
  saveProgress(next)
  return next
}
