import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { fetchSession, type LogItem } from "../api"

export default function SessionDetail() {
  const { id } = useParams()
  const [items, setItems] = useState<LogItem[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const timer = useRef<number | null>(null)

  const load = async () => {
    if (!id) return
    try {
      const data = await fetchSession(id, 0, 500)
      setItems(data)
      setErr(null)
    } catch (e: any) {
      setErr(String(e))
    }
  }

  useEffect(() => {
    load()
    return () => { if (timer.current) window.clearInterval(timer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (timer.current) window.clearInterval(timer.current)
    if (autoRefresh) {
      timer.current = window.setInterval(load, 1500)
    }
    return () => { if (timer.current) window.clearInterval(timer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, id])

  return (
    <div className="app">
      <div className="toolbar">
        <Link to="/" className="button">← Back</Link>
        <h2 style={{ marginLeft: 8 }}>Session: {id}</h2>
      </div>

      <div className="toolbar">
        <button onClick={load}>Refresh</button>
        <label>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={e => setAutoRefresh(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          Live (polling)
        </label>
        <button onClick={() => downloadJSON(id!, items || [])} className="primary">Export .json</button>
      </div>

      {err && <div className="card">Error: {err}</div>}
      {!items && !err && <div className="card">Loading…</div>}

      {items && (
        <div className="log">
          {items.map((m, i) => (
            <div className={`msg ${m.role}`} key={i}>
              <div className="meta">
                {m.role} • {new Date(m.ts * 1000).toLocaleString()} {m.lang ? `• ${m.lang}` : ""}
              </div>
              <div>{m.content}</div>
            </div>
          ))}
          {items.length === 0 && <div className="card">No messages in this session yet.</div>}
        </div>
      )}
    </div>
  )
}

function downloadJSON(id: string, data: LogItem[]) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `session_${id}.json`
  a.click()
  URL.revokeObjectURL(url)
}
