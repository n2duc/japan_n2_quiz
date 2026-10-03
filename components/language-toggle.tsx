"use client";

import { useLanguage } from "@/lib/i18n";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language selection"
      className="relative h-10 w-22 p-1 bg-white border border-slate-200 rounded-full grid grid-cols-2 select-none"
    >
      {/* Sliding active indicator pill */}
      <div
        className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#5368a4] transition-transform duration-200 ease-out will-change-transform pointer-events-none ${language === "ja" ? "translate-x-full" : "translate-x-0"
          }`}
      />

      <button
        type="button"
        onClick={() => setLanguage("vi")}
        title="Tiếng Việt"
        className={`relative z-10 h-full w-full rounded-full text-xs font-bold transition-colors duration-200 cursor-pointer flex items-center justify-center ${language === "vi"
          ? "text-white"
          : "text-slate-500 hover:text-slate-800"
          }`}
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => setLanguage("ja")}
        title="日本語 (Japanese)"
        className={`relative z-10 h-full w-full rounded-full text-xs font-bold transition-colors duration-200 cursor-pointer flex items-center justify-center ${language === "ja"
          ? "text-white"
          : "text-slate-500 hover:text-slate-800"
          }`}
      >
        JA
      </button>
    </div>
  );
}
