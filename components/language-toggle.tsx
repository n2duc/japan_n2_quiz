"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { TranslateIcon } from "@hugeicons/core-free-icons";
import { useLanguage } from "@/lib/i18n";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center bg-white border border-slate-200/90 rounded-full p-0.5">
      <button
        onClick={() => setLanguage("vi")}
        title="Tiếng Việt"
        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
          language === "vi"
            ? "bg-[#5368a4] text-white"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        VI
      </button>
      <button
        onClick={() => setLanguage("ja")}
        title="日本語 (Japanese)"
        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
          language === "ja"
            ? "bg-[#5368a4] text-white"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        JA
      </button>
    </div>
  );
}
