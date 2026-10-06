"use client"

import React, { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sun01Icon, Moon02Icon } from "@hugeicons/core-free-icons"
import { useLanguage } from "@/lib/i18n"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className={
          className ||
          "h-10 w-10 rounded-full border border-slate-200 bg-white dark:border-white/10 dark:bg-[#1a1c26]"
        }
      />
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? t.themeTooltipLight : t.themeTooltipDark}
      aria-label={isDark ? t.themeTooltipLight : t.themeTooltipDark}
      className={
        className ||
        "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-800 active:scale-95 dark:border-white/10 dark:bg-[#1a1c26] dark:text-slate-300 dark:hover:text-white"
      }
    >
      <HugeiconsIcon icon={isDark ? Sun01Icon : Moon02Icon} size={18} />
    </button>
  )
}
