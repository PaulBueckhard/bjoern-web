import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Sessions() {
  const [id, setId] = useState("")
  const navigate = useNavigate()

  const open = () => {
    if (id.trim()) navigate(`/session/${encodeURIComponent(id.trim())}`)
  }

  return (
    <div className="app">
      <h1>Open Session</h1>
      <p className="badge">Enter the session ID spoken by the toy</p>

      <div className="toolbar">
        <input
          placeholder="Enter session ID…"
          value={id}
          onChange={e => setId(e.target.value)}
        />
        <button className="primary" onClick={open}>Open</button>
      </div>
    </div>
  )
}
