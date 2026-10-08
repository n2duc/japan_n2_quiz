"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RootRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("n2_quiz_lang")
        : null
    if (saved === "ja") {
      router.replace("/ja")
    } else {
      router.replace("/vi")
    }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8fc] dark:bg-[#0f111a]">
      {/* Inline script to trigger instant 0ms redirect before hydration */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              var lang = localStorage.getItem('n2_quiz_lang');
              if (lang === 'ja') {
                window.location.replace('/ja');
              } else {
                window.location.replace('/vi');
              }
            } catch (e) {}
          `,
        }}
      />
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5368a4] border-t-transparent" />
    </div>
  )
}
