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

  const login = loadStoredLogin()

  const [childName, setChildName] = useState<string>(
    login?.childName || "Your Child"
  )
  const parentPassword = login?.parentPassword || ""
  const savedCode = login?.sessionCode || ""

  // ---------- SECURITY CHECK ----------
  useEffect(() => {
    // No saved login → back to login
    if (!login) {
      navigate("/")
      return
    }

    // URL id must match stored sessionCode
    if (!id || id.toUpperCase() !== savedCode.toUpperCase()) {
      navigate("/")
      return
    }

    // Need parent password
    if (!parentPassword) {
      navigate("/")
      return
    }
  }, [id, login, parentPassword, savedCode, navigate])

  // ---------- STATE ----------
  const [items, setItems] = useState<LogItem[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const timer = useRef<number | null>(null)
  const lastTimestamp = useRef<number>(0)
  const [autoScroll, setAutoScroll] = useState(true)

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

    setErr(null)

    // Child name from backend
    const apiChildName = data.child_name || "Your Child"
    setChildName(apiChildName)

    // Update stored login with real child name
    if (login) {
      saveStoredLogin({
        ...login,
        childName: apiChildName,
      })
    }

    const messages = data.messages || []

    setItems(prev => {
      const oldTs = prev && prev.length ? prev[prev.length - 1].ts : 0
      const newTs = messages.length ? messages[messages.length - 1].ts : 0
      lastTimestamp.current = oldTs
      return messages
    })
  }

  // Polling
  useEffect(() => {
    load()
    timer.current = window.setInterval(load, 2000)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [id, parentPassword])

  // Track scroll location
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onScroll = () => {
      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 40
      setAutoScroll(atBottom)
    }

    el.addEventListener("scroll", onScroll)
    onScroll()

    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !items) return

    const oldTs = lastTimestamp.current
    const newTs = items.length ? items[items.length - 1].ts : 0
    const hasNewMessages = newTs > oldTs

    if (hasNewMessages && autoScroll) {
      el.scrollTop = el.scrollHeight
    }

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

      {err && <div className="card">Error: {err}</div>}
      {!items && !err && <div className="card">Loading…</div>}

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
