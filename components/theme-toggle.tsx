"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sun01Icon, Moon02Icon } from "@hugeicons/core-free-icons";
import { useLanguage } from "@/lib/i18n";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={
          className ||
          "w-10 h-10 rounded-full bg-white dark:bg-[#1a1c26] border border-slate-200 dark:border-white/10"
        }
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? t.themeTooltipLight : t.themeTooltipDark}
      aria-label={isDark ? t.themeTooltipLight : t.themeTooltipDark}
      className={
        className ||
        "w-10 h-10 rounded-full bg-white dark:bg-[#1a1c26] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
      }
    >
      <HugeiconsIcon icon={isDark ? Sun01Icon : Moon02Icon} size={18} />
    </button>
  );
}
