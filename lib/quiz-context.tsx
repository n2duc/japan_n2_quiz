"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface QuizContextType {
  isQuizActive: boolean
  setIsQuizActive: (active: boolean) => void
}

const QuizContext = createContext<QuizContextType>({
  isQuizActive: false,
  setIsQuizActive: () => {},
})

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [isQuizActive, setIsQuizActive] = useState(false)

  useEffect(() => {
    const handleSetQuizActive = (e: Event) => {
      const customEvent = e as CustomEvent<{ active: boolean }>
      if (typeof customEvent.detail?.active === "boolean") {
        setIsQuizActive(customEvent.detail.active)
      }
    }
    window.addEventListener("set-quiz-active", handleSetQuizActive)
    return () => window.removeEventListener("set-quiz-active", handleSetQuizActive)
  }, [])

  return (
    <QuizContext.Provider value={{ isQuizActive, setIsQuizActive }}>
      {children}
    </QuizContext.Provider>
  )
}

export function useQuiz() {
  return useContext(QuizContext)
}
