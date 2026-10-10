"use client"

import React, { useState, useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiChat01Icon,
  Robot01Icon,
  SparklesIcon,
  Cancel01Icon,
  RotateRight01Icon,
  ArrowRight01Icon,
  Copy01Icon,
  CheckmarkCircle01Icon,
  BookOpen01Icon,
  Maximize01Icon,
  Minimize01Icon,
} from "@hugeicons/core-free-icons"
import {
  ChatMessage,
  ChatSourceItem,
  checkChatHealth,
  sendChatMessageStream,
} from "@/lib/chat-api"
import { useLanguage } from "@/lib/i18n"
import { cn } from "@/lib/utils"

function FormattedContent({ text }: { text: string }) {
  // Simple markdown renderer for bold, lists, and linebreaks
  const lines = text.split("\n")
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        if (!line.trim()) {
          return <div key={idx} className="h-1.5" />
        }

        // Parse bold **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g)
        const renderedLine = parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="font-semibold text-slate-900 dark:text-white">
                {part.slice(2, -2)}
              </strong>
            )
          }
          return <span key={pIdx}>{part}</span>
        })

        // Check if list item
        if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-2">
              <span className="text-[#5368a4] dark:text-[#889be0]">•</span>
              <span>{renderedLine}</span>
            </div>
          )
        }

        return <p key={idx}>{renderedLine}</p>
      })}
    </div>
  )
}

export function ChatBot() {
  const { language } = useLanguage()
  const isJa = language === "ja"

  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null)
  const [expandedSourceIndex, setExpandedSourceIndex] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Escape key to minimize or close chat
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (isExpanded) {
          setIsExpanded(false)
        } else {
          setIsOpen(false)
        }
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [isOpen, isExpanded])

  // Quick suggestions
  const suggestions = isJa
    ? [
      "「〜にほかならない」の意味と例文を教えて",
      "「〜にあたって」と「〜に際して」の違いは？",
      "2025年7月のN2問題1で「才能」の読み方は？",
    ]
    : [
      "Giải thích ngữ pháp 〜にほかならない và cho ví dụ",
      "Phân biệt 〜にあたって và 〜に際して",
      "Từ 才能 trong đề thi N2 07/2025 đọc là gì?",
    ]

  // Check health periodically or on open
  useEffect(() => {
    checkChatHealth().then(setIsServerHealthy)
    const interval = setInterval(() => {
      checkChatHealth().then(setIsServerHealthy)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isStreaming])

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  // Global listener for "open-n2-ai-chat" event
  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent<{
        prompt?: string
        autoSend?: boolean
      }>
      setIsOpen(true)
      if (customEvent.detail?.prompt) {
        if (customEvent.detail.autoSend) {
          handleSendMessage(customEvent.detail.prompt)
        } else {
          setInput(customEvent.detail.prompt)
        }
      }
    }

    window.addEventListener("open-n2-ai-chat", handleOpenChat)
    return () => window.removeEventListener("open-n2-ai-chat", handleOpenChat)
  }, [messages, isStreaming])

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim()
    if (!query || isStreaming) return

    const userMessage: ChatMessage = {
      id: "u_" + Date.now(),
      role: "user",
      content: query,
      createdAt: Date.now(),
    }

    const assistantId = "a_" + Date.now()
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
      sources: [],
      createdAt: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput("")
    setIsStreaming(true)

    // Build history (excluding error messages)
    const historyPayload = messages
      .filter((m) => !m.error)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }))

    let accumulatedText = ""
    let capturedSources: ChatSourceItem[] = []

    await sendChatMessageStream(query, historyPayload, {
      onSources: (sources) => {
        capturedSources = sources
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, sources } : msg
          )
        )
      },
      onToken: (token) => {
        accumulatedText += token
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: accumulatedText }
              : msg
          )
        )
      },
      onComplete: (fullText) => {
        setIsStreaming(false)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                ...msg,
                content: fullText || accumulatedText,
                sources: capturedSources,
                isStreaming: false,
              }
              : msg
          )
        )
      },
      onError: (err) => {
        setIsStreaming(false)
        const errorMsg = isJa
          ? `エラーが発生しました: ${err.message}. バックエンドAPI (http://localhost:8000) が起動しているか確認してください。`
          : `Không thể kết nối đến AI server (${err.message}). Bạn hãy đảm bảo API đã được khởi động tại http://localhost:8000.`;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                ...msg,
                content: errorMsg,
                isStreaming: false,
                error: true,
              }
              : msg
          )
        )
      },
    })
  }

  const handleClearHistory = () => {
    setMessages([])
    setExpandedSourceIndex(null)
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 rounded-full border border-[#5368a4]/30 bg-gradient-to-r from-[#5368a4] to-[#687db8] px-4 py-3 text-white shadow-xl shadow-[#5368a4]/30 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-[#5368a4]/50 active:scale-95"
          >
            <div className="relative flex items-center justify-center">
              <HugeiconsIcon icon={AiChat01Icon} size={22} />
              {isServerHealthy && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
              )}
            </div>
            <span className="text-sm font-semibold tracking-wide">
              {isJa ? "AI アシスタント" : "AI Trợ Giảng"}
            </span>
          </button>
        )}
      </div>

      {/* Backdrop overlay when expanded */}
      {isOpen && isExpanded && (
        <div
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 dark:bg-black/60"
        />
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-in-out",
            "dark:border-zinc-800/90 dark:bg-[#121420]/95",
            isExpanded
              ? "bottom-2 right-2 left-2 top-2 md:bottom-5 md:right-5 md:left-auto md:top-auto md:h-[min(880px,calc(100vh-40px))] md:w-[min(860px,calc(100vw-40px))]"
              : "bottom-3 right-3 left-3 top-20 md:bottom-5 md:right-5 md:left-auto md:top-auto md:h-[620px] md:w-[440px]"
          )}
        >
          {/* Header */}
          <div
            onDoubleClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-3.5 select-none dark:border-zinc-800/80 dark:from-[#161928] dark:via-[#121420] dark:to-[#161928]"
            title={
              isJa
                ? "ダブルクリックで拡大/縮小"
                : "Nhấn đúp chuột để phóng to/thu nhỏ"
            }
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#5368a4] to-[#7388c4] text-white shadow-md shadow-[#5368a4]/30">
                <HugeiconsIcon icon={SparklesIcon} size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isJa ? "JLPT N2 AI アシスタント" : "JLPT N2 AI Trợ Giảng"}
                  </h3>
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      isServerHealthy
                        ? "bg-emerald-500"
                        : isServerHealthy === false
                          ? "bg-rose-500"
                          : "bg-amber-400"
                    )}
                    title={
                      isServerHealthy
                        ? "Server online"
                        : "Không tìm thấy server backend"
                    }
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {isJa
                    ? "公式過去問・文法検索 (RAG)"
                    : "Tra cứu đề thi & ngữ pháp chuẩn"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                title={isJa ? "会話をクリア" : "Xóa lịch sử chat"}
                disabled={messages.length === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <HugeiconsIcon icon={RotateRight01Icon} size={16} />
              </button>
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                title={
                  isExpanded
                    ? (isJa ? "縮小 (元のサイズに戻す)" : "Thu nhỏ (kích thước mặc định)")
                    : (isJa ? "拡大 (Mở rộng panel)" : "Mở rộng panel chat")
                }
                aria-label={isExpanded ? "Collapse chat panel" : "Expand chat panel"}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <HugeiconsIcon
                  icon={isExpanded ? Minimize01Icon : Maximize01Icon}
                  size={16}
                />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title={isJa ? "閉じる" : "Đóng"}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>
          </div>

          {/* Warning banner if backend is not detected */}
          {isServerHealthy === false && (
            <div className="bg-amber-500/10 px-3 py-1.5 text-center text-xs text-amber-600 dark:text-amber-400">
              ⚠️{" "}
              {isJa
                ? "APIサーバー (localhost:8000) に接続できません。`python server.py` を実行してください。"
                : "Chưa kết nối được RAG API. Bạn hãy chạy `python server.py` tại rag_jp nhé!"}
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-2">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5368a4]/10 text-[#5368a4] dark:bg-[#5368a4]/20 dark:text-[#889be0]">
                  <HugeiconsIcon icon={Robot01Icon} size={30} />
                </div>
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                  {isJa
                    ? "何か質問はありますか？"
                    : "Bạn cần giải đáp điều gì về N2?"}
                </h4>
                <p className="mt-1 max-w-[280px] text-xs text-slate-500 dark:text-zinc-400">
                  {isJa
                    ? "文法の解説、選択肢の理由、公式過去問の内容をいつでも質問してください。"
                    : "Hỏi ngữ pháp, tra cứu đề thi, giải thích đáp án câu hỏi hoặc cấu trúc câu."}
                </p>

                {/* Suggestions */}
                <div
                  className={cn(
                    "mt-4 flex w-full flex-col gap-2",
                    isExpanded && "md:grid md:grid-cols-3 md:gap-3 md:max-w-3xl"
                  )}
                >
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item)}
                      className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 text-left text-xs text-slate-700 transition hover:border-[#5368a4]/40 hover:bg-[#5368a4]/5 hover:text-[#5368a4] dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-[#5368a4]/60 dark:hover:bg-[#5368a4]/10"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) =>
                msg.role === "user" ? (
                  <div key={msg.id} className="flex justify-end w-full">
                    <div
                      className={cn(
                        "rounded-2xl bg-gradient-to-r from-[#5368a4] to-[#637ab8] px-4 py-2.5 text-sm text-white shadow-xs",
                        isExpanded ? "max-w-[75%]" : "max-w-[85%]"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex items-start gap-3 w-full py-1.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#5368a4]/15 text-[#5368a4] dark:bg-[#5368a4]/25 dark:text-[#9bb0f0] mt-0.5">
                      <HugeiconsIcon icon={SparklesIcon} size={13} />
                    </div>
                    <div className="flex-1 min-w-0 text-sm text-slate-800 dark:text-zinc-200">
                      {msg.content ? (
                        <FormattedContent text={msg.content} />
                      ) : msg.isStreaming ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 py-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#5368a4]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#5368a4] [animation-delay:0.2s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#5368a4] [animation-delay:0.4s]" />
                          <span className="ml-1 text-[11px]">
                            {isJa ? "検索中..." : "Đang tra cứu tài liệu..."}
                          </span>
                        </div>
                      ) : null}

                      {/* Streaming cursor */}
                      {msg.isStreaming && msg.content && (
                        <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-[#5368a4]" />
                      )}

                      {/* Sources section */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2.5 border-t border-slate-100 pt-2 dark:border-zinc-800/60">
                          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                            <HugeiconsIcon icon={BookOpen01Icon} size={12} />
                            <span>{isJa ? "参照文献:" : "Nguồn tham chiếu:"}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {msg.sources.map((source, sIdx) => {
                              const key = `${msg.id}_${sIdx}`
                              const isExpanded = expandedSourceIndex === key
                              return (
                                <div key={sIdx} className="w-full">
                                  <button
                                    onClick={() =>
                                      setExpandedSourceIndex(
                                        isExpanded ? null : key
                                      )
                                    }
                                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-zinc-800/70 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                  >
                                    <span>📄</span>
                                    <span
                                      className={cn(
                                        "truncate",
                                        isExpanded ? "max-w-[420px]" : "max-w-[220px]"
                                      )}
                                    >
                                      {source.file_name}
                                    </span>
                                    {source.page && (
                                      <span className="text-slate-400 dark:text-zinc-500">
                                        (Trang {source.page})
                                      </span>
                                    )}
                                  </button>

                                  {/* Snippet dropdown */}
                                  {isExpanded && (
                                    <div className="mt-1 rounded-md border border-slate-200/60 bg-slate-50/80 p-2 text-[11px] text-slate-600 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:text-zinc-300">
                                      <p className="font-mono whitespace-pre-wrap">
                                        {source.snippet}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Message actions (copy) */}
                      {msg.content && !msg.isStreaming && (
                        <div className="mt-2 flex items-center gap-1">
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                          >
                            <HugeiconsIcon
                              icon={
                                copiedId === msg.id
                                  ? CheckmarkCircle01Icon
                                  : Copy01Icon
                              }
                              size={12}
                            />
                            <span>{copiedId === msg.id ? (isJa ? "コピー済み" : "Đã chép") : (isJa ? "コピー" : "Sao chép")}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="border-t border-slate-100 bg-white p-3 dark:border-zinc-800/80 dark:bg-[#121420]">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2 transition focus-within:border-[#5368a4] focus-within:ring-2 focus-within:ring-[#5368a4]/20 dark:border-zinc-800 dark:bg-zinc-900/60 dark:focus-within:border-[#5368a4]"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={
                  isJa
                    ? "質問を入力... (Shift+Enterで改行)"
                    : "Hỏi ngữ pháp hoặc câu hỏi N2... (Shift+Enter để xuống dòng)"
                }
                className={cn(
                  "min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-zinc-100 dark:placeholder:text-zinc-500",
                  isExpanded ? "max-h-36" : "max-h-24"
                )}
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#5368a4] text-white transition hover:bg-[#435588] active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </button>
            </form>
            <p className="mt-1.5 text-center text-[10px] text-slate-400 dark:text-zinc-500">
              {isJa
                ? "AIは公式教材に基づいて回答します。重要な情報は元資料を確認してください。"
                : "AI trả lời đối chiếu theo tài liệu & đề thi chính thức N2."}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
