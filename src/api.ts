export type SessionId = string

/**
 * A single log message in the conversation.
 */
export interface LogItem {
  role: "user" | "assistant"
  content: string
  ts: number          // Unix timestamp (seconds)
  lang?: string       // Optional language code
}

/**
 * Successful session fetch.
 */
export interface SessionSuccess {
  child_name: string
  messages: LogItem[]
}

/**
 * Error shape returned by the backend.
 */
export interface SessionError {
  error: string
}

/**
 * Union type for session responses.
 */
export type SessionResponse = SessionSuccess | SessionError

// Base API URL + optional auth token from environment configuration.
const API_BASE = import.meta.env.VITE_API_BASE || ""
const API_TOKEN = import.meta.env.VITE_API_TOKEN || ""

/**
 * Fetch JSON from the backend, gracefully handling:
 * - missing API_BASE
 * - invalid JSON
 * - non-200 responses
 *
 * This function NEVER throws — it always resolves to some JSON.
 */
async function getJSON(path: string): Promise<any> {
  if (!API_BASE) {
    return { error: "API_BASE not set in .env" }
  }

  const url = `${API_BASE}${path}`

  const res = await fetch(url, {
    headers: API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {},
  })

  // Always attempt to decode JSON, even on error responses.
  const text = await res.text()
  let json: any = {}

  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = {}
  }

  // Normalize error handling for non-OK responses.
  if (!res.ok) {
    if (json && typeof json === "object" && "error" in json) {
      return { error: String(json.error) }
    }
    return { error: `${res.status} ${res.statusText}` }
  }

  return json
}

/* ------------------------------------------------------------------
   STORED LOGIN (Remember me)
------------------------------------------------------------------- */

const STORAGE_KEY = "bjorn-login"

export interface StoredLogin {
  sessionCode: string
  parentPassword: string
  childName: string
}

/**
 * Load "remembered" login info from localStorage.
 */
export function loadStoredLogin(): StoredLogin | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredLogin
  } catch {
    return null
  }
}

/**
 * Save or clear stored login information.
 */
export function saveStoredLogin(data: StoredLogin | null) {
  if (!data) {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

/* ------------------------------------------------------------------
   BACKEND API
------------------------------------------------------------------- */

/**
 * Fetch a session using its human-friendly short code.
 * Includes parent password as `pin` query parameter.
 */
export async function fetchSessionByShortId(
  shortId: string,
  parentPassword: string
): Promise<SessionResponse> {
  const params = new URLSearchParams({ pin: parentPassword })
  return getJSON(
    `/api/session/${encodeURIComponent(shortId)}?${params.toString()}`
  )
}
