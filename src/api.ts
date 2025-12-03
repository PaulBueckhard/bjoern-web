export type SessionId = string

export interface LogItem {
  role: "user" | "assistant"
  content: string
  ts: number
  lang?: string
}

const API_BASE = import.meta.env.VITE_API_BASE || ""
const API_TOKEN = import.meta.env.VITE_API_TOKEN || ""

async function getJSON<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {},
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

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
    return JSON.parse(raw)
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
): Promise<LogItem[]> {
  if (!API_BASE) throw new Error("API_BASE not set")
  const params = new URLSearchParams({ pin: parentPassword })
  return getJSON<LogItem[]>(`/api/session/${encodeURIComponent(shortId)}?${params}`)
}
