"use client"

import React, { useEffect, useState, useRef } from "react"
import { flushSync } from "react-dom"
import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sun01Icon, Moon02Icon } from "@hugeicons/core-free-icons"
import { useLanguage } from "@/lib/i18n"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

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

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const newTheme = isDark ? "light" : "dark"

    // Trigger icon bounce/pulse animation
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 500)

    // Check if View Transition API is supported and user doesn't prefer reduced motion
    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => {
        ready: Promise<void>
        finished: Promise<void>
      }
    }

    if (
      !doc.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(newTheme)
      return
    }

    // Determine circular wave origin coordinates (center of button or click point)
    const rect = buttonRef.current?.getBoundingClientRect()
    const x =
      event.clientX && event.clientX > 0
        ? event.clientX
        : rect
          ? rect.left + rect.width / 2
          : window.innerWidth / 2
    const y =
      event.clientY && event.clientY > 0
        ? event.clientY
        : rect
          ? rect.top + rect.height / 2
          : 40

    // Compute distance to furthest corner of screen
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    const transition = doc.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme)
      })
    })

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ]

      document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 480,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      )
    })
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggleTheme}
      title={isDark ? t.themeTooltipLight : t.themeTooltipDark}
      aria-label={isDark ? t.themeTooltipLight : t.themeTooltipDark}
      className={
        className ||
        `group relative flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border transition-all duration-300 active:scale-90 hover:scale-105 ${
          isDark
            ? "border-amber-400/20 bg-[#1a1c26] text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.18)] hover:border-amber-400/40 hover:bg-[#202230]"
            : "border-slate-200/90 bg-white text-indigo-500 shadow-[0_2px_8px_rgba(99,102,241,0.08)] hover:border-indigo-200 hover:bg-slate-50 hover:text-indigo-600"
        } ${isAnimating ? "ring-2 ring-amber-400/30 dark:ring-amber-400/40" : ""}`
      }
    >
      {/* Sun icon (visible in dark mode to switch to light) */}
      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
          isDark
            ? "rotate-0 scale-100 opacity-100 text-amber-400"
            : "-rotate-90 scale-0 opacity-0 text-amber-500"
        }`}
      >
        <HugeiconsIcon
          icon={Sun01Icon}
          size={19}
          className="transition-transform duration-300 group-hover:rotate-45"
        />
      </span>

      {/* Moon icon (visible in light mode to switch to dark) */}
      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
          isDark
            ? "rotate-90 scale-0 opacity-0 text-indigo-400"
            : "rotate-0 scale-100 opacity-100 text-indigo-600"
        }`}
      >
        <HugeiconsIcon
          icon={Moon02Icon}
          size={19}
          className="transition-transform duration-300 group-hover:-rotate-12"
        />
      </span>
    </button>
  )
}
