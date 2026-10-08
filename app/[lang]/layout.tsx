import { LanguageProvider, Language } from "@/lib/i18n"

export function generateStaticParams() {
  return [{ lang: "vi" }, { lang: "ja" }]
}

interface LangLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function LangLayout({
  children,
  params,
}: LangLayoutProps) {
  const { lang } = await params
  const validLang: Language = lang === "ja" ? "ja" : "vi"

  return (
    <LanguageProvider initialLanguage={validLang}>
      {children}
    </LanguageProvider>
  )
}
