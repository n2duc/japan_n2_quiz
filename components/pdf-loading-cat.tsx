"use client"

import { useEffect, useState } from "react"

interface PdfLoadingCatProps {
  messages: string[]
  elapsedLabel: string
}

/** Mèo đọc tài liệu + thông điệp xoay vòng, hiển thị trong lúc chờ AI trích xuất PDF. */
export function PdfLoadingCat({ messages, elapsedLabel }: PdfLoadingCatProps) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const message = messages[Math.floor(seconds / 4) % messages.length]
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0")
  const ss = String(seconds % 60).padStart(2, "0")

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-3 rounded-2xl bg-[#5368a4]/10 px-4 py-5 text-center"
    >
      <svg viewBox="0 0 220 150" className="h-36 w-auto" aria-hidden="true">
        {/* Tờ giấy đang được quét */}
        <g>
          <rect x="128" y="34" width="70" height="92" rx="6" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
          {[50, 62, 74, 86, 98, 110].map((y, i) => (
            <rect key={y} x="138" y={y} width={i % 3 === 2 ? 28 : 50} height="4" rx="2" fill="#cbd5e1" />
          ))}
          <g className="cat-scan">
            <rect x="130" y="46" width="66" height="3" rx="1.5" fill="#5368a4" />
          </g>
        </g>

        <g className="cat-bob">
          {/* Đuôi */}
          <g className="cat-tail">
            <path d="M52 118 C20 118 14 92 30 84" fill="none" stroke="#f59e0b" strokeWidth="9" strokeLinecap="round" />
          </g>
          {/* Thân */}
          <ellipse cx="82" cy="112" rx="38" ry="26" fill="#f59e0b" />
          {/* Chân đưa về phía giấy */}
          <ellipse cx="120" cy="116" rx="14" ry="8" fill="#fbbf24" />
          {/* Đầu */}
          <polygon points="52,52 58,22 78,42" fill="#f59e0b" />
          <polygon points="112,52 106,22 86,42" fill="#f59e0b" />
          <polygon points="58,30 61,40 70,40" fill="#fda4af" />
          <polygon points="106,30 103,40 94,40" fill="#fda4af" />
          <circle cx="82" cy="64" r="32" fill="#f59e0b" />
          {/* Mắt */}
          <ellipse className="cat-blink" cx="70" cy="62" rx="4" ry="6" fill="#1e293b" />
          <ellipse className="cat-blink" cx="94" cy="62" rx="4" ry="6" fill="#1e293b" />
          <circle cx="71.5" cy="60" r="1.4" fill="#fff" />
          <circle cx="95.5" cy="60" r="1.4" fill="#fff" />
          {/* Mũi, miệng, râu */}
          <polygon points="78,72 86,72 82,77" fill="#fb7185" />
          <path d="M82 77 Q78 83 73 80 M82 77 Q86 83 91 80" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M60 74 L44 71 M60 78 L44 80 M104 74 L120 71 M104 78 L120 80" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>

      <p key={message} className="cat-msg min-h-5 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {message}
      </p>
      <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
        {elapsedLabel} {mm}:{ss}
      </p>
    </div>
  )
}
