"use client"

import { useLanguage, Language } from "@/lib/i18n"
import { usePathname } from "next/navigation"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  const pathname = usePathname()

  const handleSelectLanguage = (targetLang: Language) => {
    if (targetLang === language) return
    setLanguage(targetLang)

    const currentPath =
      typeof window !== "undefined"
        ? window.location.pathname
        : pathname || ""

    if (currentPath) {
      let targetPath = currentPath
      if (currentPath.startsWith("/vi")) {
        targetPath = currentPath.replace(/^\/vi/, `/${targetLang}`)
      } else if (currentPath.startsWith("/ja")) {
        targetPath = currentPath.replace(/^\/ja/, `/${targetLang}`)
      } else {
        targetPath = `/${targetLang}${currentPath === "/" ? "" : currentPath}`
      }

      if (typeof window !== "undefined" && window.history) {
        window.history.replaceState(null, "", targetPath)
      }
    }
  }

  return (
    <div
      role="group"
      aria-label="Language selection"
      className="relative grid h-10 w-22 grid-cols-2 rounded-full border border-slate-200 bg-white p-1 select-none dark:border-white/10 dark:bg-[#1a1c26]"
    >
      {/* Sliding active indicator pill */}
      <div
        className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#5368a4] transition-transform duration-200 ease-out will-change-transform ${language === "ja" ? "translate-x-full" : "translate-x-0"
          }`}
      />

      <button
        type="button"
        onClick={() => handleSelectLanguage("vi")}
        title="Tiếng Việt"
        className={`relative z-10 flex h-full w-full cursor-pointer items-center justify-center rounded-full text-xs font-bold transition-colors duration-200 ${language === "vi"
            ? "text-white"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => handleSelectLanguage("ja")}
        title="日本語 (Japanese)"
        className={`relative z-10 flex h-full w-full cursor-pointer items-center justify-center rounded-full text-xs font-bold transition-colors duration-200 ${language === "ja"
            ? "text-white"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
      >
        JA
      </button>
    </div>
  )
}
