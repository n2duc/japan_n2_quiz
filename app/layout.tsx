import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "JLPT N2 文法マスター - Ôn Tập Ngữ Pháp N2",
  description:
    "Ứng dụng ôn tập ngữ pháp tiếng Nhật JLPT N2 với 30 Chapters, 480 câu hỏi phân loại theo 3 dạng đề thi: 文の文法1, 文の文法2 (★), và 文章の文法.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JLPT N2 文法マスター",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/192.png", sizes: "192x192", type: "image/png" },
      { url: "/512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/192.png", sizes: "192x192", type: "image/png" },
    ],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        "bg-[#f6f8fc] dark:bg-[#0f111a]",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var isDark = theme === 'dark' || ((!theme || theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  var meta = document.createElement('meta');
                  meta.name = 'theme-color';
                  meta.content = isDark ? '#0f111a' : '#f6f8fc';
                  document.head.appendChild(meta);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-dvh bg-[#f6f8fc] text-slate-800 transition-colors duration-150 selection:bg-[#5368a4] selection:text-white dark:bg-[#0f111a] dark:text-slate-100">
        <LanguageProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
