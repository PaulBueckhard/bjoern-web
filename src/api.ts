export type SessionId = string

export interface LogItem {
  role: "user" | "assistant"
  content: string
  ts: number
  lang?: string
}

export interface SessionSuccess {
  child_name: string
  messages: LogItem[]
}

export interface SessionError {
  error: string
}

export type SessionResponse = SessionSuccess | SessionError

const API_BASE = import.meta.env.VITE_API_BASE || ""
const API_TOKEN = import.meta.env.VITE_API_TOKEN || ""

/** Basic JSON helper that always returns some JSON (never throws on HTTP status) */
async function getJSON(path: string): Promise<any> {
  if (!API_BASE) {
    return { error: "API_BASE not set in .env" }
  }

  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {},
  })

  const text = await res.text()
  let json: any = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = {}
  }

  if (!res.ok) {
    if (json && typeof json === "object" && "error" in json) {
      return { error: String(json.error) }
    }
    return { error: `${res.status} ${res.statusText}` }
  }

  return json
}

/* ---------- Stored login data (for "Remember login") ---------- */

const STORAGE_KEY = "bjorn-login"

export interface StoredLogin {
  sessionCode: string
  parentPassword: string
  childName: string
}

export function loadStoredLogin(): StoredLogin | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredLogin
  } catch {
    return null
  }
}

export function saveStoredLogin(data: StoredLogin | null) {
  if (!data) {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

/* ---------- Backend API ---------- */

export async function fetchSessionByShortId(
  shortId: string,
  parentPassword: string
): Promise<SessionResponse> {
  const params = new URLSearchParams({ pin: parentPassword })
  return getJSON(`/api/session/${encodeURIComponent(shortId)}?${params.toString()}`)
}
