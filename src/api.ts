export type SessionId = string

export interface LogItem {
  role: "user" | "assistant"
  content: string
  ts: number
  lang?: string
}

const API_BASE = import.meta.env.VITE_API_BASE || ""
const API_TOKEN = import.meta.env.VITE_API_TOKEN || ""

/** Basic GET helper with bearer token */
async function getJSON<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {},
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export async function fetchSession(id: SessionId, offset = 0, limit = 200): Promise<LogItem[]> {
  if (!API_BASE) return mockFetchSession(id)
  const q = new URLSearchParams({ offset: String(offset), limit: String(limit) })
  return getJSON<LogItem[]>(`/api/sessions/${encodeURIComponent(id)}?${q.toString()}`)
}

function mockFetchSession(id: SessionId): LogItem[] {
  const now = Date.now() / 1000
  return [
    { role: "user", content: "What's the biggest planet?", ts: now - 60, lang: "en" },
    { role: "assistant", content: "Jupiter is the biggest. What do you think makes it so large?", ts: now - 58, lang: "en" },
    { role: "user", content: "Is it gas?", ts: now - 50, lang: "en" },
    { role: "assistant", content: "Yes, mostly hydrogen and helium. Want a quick planet quiz?", ts: now - 48, lang: "en" },
  ]
}

