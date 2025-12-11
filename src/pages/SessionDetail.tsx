import { useEffect, useState, useRef } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import {
  fetchSessionByShortId,
  loadStoredLogin,
  saveStoredLogin,
  type LogItem,
  type SessionResponse,
} from "../api"
import { useToast } from "../components/Toast"

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  // Stored login info (session code, parent password, child name) from previous login flow.
  const login = loadStoredLogin()

  // Child name displayed in the header; initialized from stored login, then updated from API.
  const [childName, setChildName] = useState<string>(
    login?.childName || "Your Child"
  )

  // Values derived from stored login for quick access.
  const parentPassword = login?.parentPassword || ""
  const savedCode = login?.sessionCode || ""

  // ---------- SECURITY CHECK ----------
  // Ensure this page can only be accessed with a valid stored login:
  // - user must have a stored login
  // - URL session ID must match stored session code
  // - parent password must be present
  useEffect(() => {
    // No saved login → redirect to front page
    if (!login) {
      navigate("/")
      return
    }

    // URL id must match stored sessionCode (case-insensitive)
    if (!id || id.toUpperCase() !== savedCode.toUpperCase()) {
      navigate("/")
      return
    }

    // Parent password is required
    if (!parentPassword) {
      navigate("/")
      return
    }
  }, [id, login, parentPassword, savedCode, navigate])

  // ---------- STATE ----------
  // Conversation log returned from backend (null = not loaded yet).
  const [items, setItems] = useState<LogItem[] | null>(null)
  // Error message if fetching fails.
  const [err, setErr] = useState<string | null>(null)

  // Scroll container ref for the message list.
  const scrollRef = useRef<HTMLDivElement | null>(null)
  // Polling interval timer id.
  const timer = useRef<number | null>(null)
  // Timestamp of the last message we had before the most recent update.
  const lastTimestamp = useRef<number>(0)
  // Whether we should automatically scroll to bottom when new messages arrive.
  const [autoScroll, setAutoScroll] = useState(true)

  // Fetches the latest session data from the backend.
  async function load() {
    if (!id) return

    const data: SessionResponse = await fetchSessionByShortId(
      id,
      parentPassword
    )

    // -------- Error from backend --------
    if (!("messages" in data)) {
      const msg = data.error || "Unknown error"
      toast.show(msg)
      setErr(msg)
      setItems([])
      return
    }

    // Clear any previous error once we have valid data.
    setErr(null)

    // Child name from backend (fallback if missing).
    const apiChildName = data.child_name || "Your Child"
    setChildName(apiChildName)

    // Update stored login with the real child name so future views show it immediately.
    if (login) {
      saveStoredLogin({
        ...login,
        childName: apiChildName,
      })
    }

    const messages = data.messages || []

    // Track the previous last timestamp for auto-scroll detection.
    setItems(prev => {
      const oldTs = prev && prev.length ? prev[prev.length - 1].ts : 0
      const newTs = messages.length ? messages[messages.length - 1].ts : 0
      // Store the "old last" timestamp so we can tell if new messages were added.
      lastTimestamp.current = oldTs
      return messages
    })
  }

  // ---------- POLLING ----------
  // Start polling the backend for new messages every 2 seconds.
  useEffect(() => {
    load()
    timer.current = window.setInterval(load, 2000)

    // Clean up interval when component unmounts or dependencies change.
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [id, parentPassword])

  // ---------- SCROLL BEHAVIOR ----------
  // Track whether the user is near the bottom of the message list.
  // If they scroll up, we disable auto-scroll to avoid jumping.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onScroll = () => {
      // Consider "at bottom" if within 40px of the end.
      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 40
      setAutoScroll(atBottom)
    }

    el.addEventListener("scroll", onScroll)
    // Initialize autoscroll state based on initial scroll position.
    onScroll()

    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  // Automatically scroll to the bottom when new messages arrive,
  // but only if the user was already at the bottom (autoScroll = true).
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !items) return

    const oldTs = lastTimestamp.current
    const newTs = items.length ? items[items.length - 1].ts : 0
    const hasNewMessages = newTs > oldTs

    if (hasNewMessages && autoScroll) {
      el.scrollTop = el.scrollHeight
    }

    // Update last timestamp so subsequent renders can detect new messages.
    lastTimestamp.current = newTs
  }, [items, autoScroll])

  return (
    <div className="app">
      <div className="toolbar">
        <Link to="/" className="back-btn">
          ← <span className="label">Back</span>
        </Link>

        <h2>Conversation between Björn and {childName}</h2>
      </div>

      {/* Error / loading states */}
      {err && <div className="card">Error: {err}</div>}
      {!items && !err && <div className="card">Loading…</div>}

      {/* Conversation log */}
      {items && (
        <div
          ref={scrollRef}
          className="log"
          style={{
            maxHeight: "85vh",
            overflowY: "auto",
            paddingRight: "6px",
          }}
        >
          {items.length === 0 && !err && (
            <div className="card">No messages yet.</div>
          )}

          {items.map((m, i) => (
            <div className={`msg ${m.role}`} key={i}>
              <div className="meta">
                {m.role === "user" ? childName : "Björn"} •{" "}
                {new Date(m.ts * 1000).toLocaleString()}
              </div>
              <div>{m.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
