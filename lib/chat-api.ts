export interface ChatSourceItem {
  file_name: string
  page?: number | null
  snippet: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: ChatSourceItem[]
  isStreaming?: boolean
  error?: boolean
  createdAt: number
}

const API_BASE =
  process.env.NEXT_PUBLIC_CHAT_API_URL || "http://localhost:8000"

export async function checkChatHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) return false
    const data = await res.json()
    return data.status === "healthy"
  } catch {
    return false
  }
}

export interface StreamChatCallbacks {
  onSources?: (sources: ChatSourceItem[]) => void
  onToken?: (token: string) => void
  onComplete?: (fullText: string) => void
  onError?: (err: Error) => void
}

export async function sendChatMessageStream(
  message: string,
  history: { role: string; content: string }[],
  callbacks: StreamChatCallbacks
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        history,
      }),
    })

    if (!response.ok) {
      throw new Error(`API trả về mã lỗi: ${response.status}`)
    }

    if (!response.body) {
      throw new Error("ReadableStream không được hỗ trợ trong trình duyệt này.")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder("utf-8")
    let buffer = ""
    let fullText = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      let currentEvent = ""
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) {
          currentEvent = ""
          continue
        }

        if (trimmed.startsWith("event: ")) {
          currentEvent = trimmed.slice(7).trim()
        } else if (trimmed.startsWith("data: ")) {
          const rawData = trimmed.slice(6)
          try {
            const parsed = JSON.parse(rawData)
            if (currentEvent === "sources") {
              callbacks.onSources?.(parsed as ChatSourceItem[])
            } else if (currentEvent === "token") {
              const token = parsed.token || ""
              fullText += token
              callbacks.onToken?.(token)
            } else if (currentEvent === "error") {
              callbacks.onError?.(new Error(parsed.error || "Lỗi không xác định"))
            }
          } catch {
            // ignore JSON parse issue
          }
        }
      }
    }

    callbacks.onComplete?.(fullText)
  } catch (err: unknown) {
    callbacks.onError?.(err instanceof Error ? err : new Error(String(err)))
  }
}
