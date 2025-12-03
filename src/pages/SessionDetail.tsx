import { useEffect, useState, useRef } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { fetchSessionByShortId, loadStoredLogin, type LogItem } from "../api"

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const login = loadStoredLogin()
  const parentPassword = login?.parentPassword || ""
  const childName = login?.childName || "Your Child"

  const [items, setItems] = useState<LogItem[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const timer = useRef<number | null>(null)

  const [autoScroll, setAutoScroll] = useState(true)

  const lastTimestamp = useRef<number>(0)

  async function load() {
    try {
      if (!id || !parentPassword) {
        navigate("/")
        return
      }

      const data = await fetchSessionByShortId(id, parentPassword)

      setItems(prev => {
        const oldLast = prev && prev.length > 0 ? prev[prev.length - 1].ts : 0
        const newLast = data.length > 0 ? data[data.length - 1].ts : 0

        lastTimestamp.current = oldLast

        return data
      })

      setErr(null)
    } catch (e: any) {
      setErr(String(e))
    }
  }

  useEffect(() => {
    load()
    timer.current = window.setInterval(load, 2000)
    return () => timer.current && window.clearInterval(timer.current)
  }, [id])

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

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !items || items.length === 0) return

    const oldTs = lastTimestamp.current
    const newTs = items[items.length - 1].ts

    const newMessagesArrived = newTs > oldTs

    if (newMessagesArrived && autoScroll) {
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
          className="log"
          ref={scrollRef}
          style={{
            maxHeight: "85vh",
            overflowY: "auto",
            paddingRight: "6px"
          }}
        >
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
