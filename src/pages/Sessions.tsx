import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Sessions() {
  // Stores the user-entered session ID.
  const [id, setId] = useState("")

  // Used to programmatically navigate to a session page.
  const navigate = useNavigate()

  // Navigates to the session page if the input isn't empty or whitespace.
  const open = () => {
    const cleaned = id.trim()
    if (cleaned) {
      navigate(`/session/${encodeURIComponent(cleaned)}`)
    }
  }

  return (
    <div className="app">
      <h1>Open Session</h1>
      <p className="badge">Enter the session ID spoken by the toy</p>

      <div className="toolbar">
        <input
          placeholder="Enter session ID…"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />

        {/* Button triggers navigation when clicked */}
        <button className="primary" onClick={open}>
          Open
        </button>
      </div>
    </div>
  )
}
