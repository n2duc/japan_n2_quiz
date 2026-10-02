import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body className="bg-[#f6f8fc] text-slate-800 min-h-screen selection:bg-[#5368a4] selection:text-white">
        <LanguageProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            {children}
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
