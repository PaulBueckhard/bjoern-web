import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  loadStoredLogin,
  saveStoredLogin,
  fetchSessionByShortId,
} from "../api"

export default function Login() {
  const navigate = useNavigate()

  const stored = loadStoredLogin()
  const [sessionCode, setSessionCode] = useState(stored?.sessionCode || "")
  const [parentPassword, setParentPassword] = useState(stored?.parentPassword || "")
  const [childName, setChildName] = useState(stored?.childName || "")
  const [remember, setRemember] = useState(Boolean(stored))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError(null)

    const code = sessionCode.trim().toUpperCase()
    const pw = parentPassword.trim()
    const name = childName.trim()

    if (!code) {
      setError("Please enter the session code.")
      return
    }
    if (!/^\d{4}$/.test(pw)) {
      setError("Parent password must be 4 digits.")
      return
    }
    if (!name) {
      setError("Please enter the child's name.")
      return
    }

    setLoading(true)
    try {
      await fetchSessionByShortId(code, pw)

      if (remember) {
        saveStoredLogin({ sessionCode: code, parentPassword: pw, childName: name })
      } else {
        saveStoredLogin(null)
      }

      navigate(`/session/${encodeURIComponent(code)}`)
    } catch (e: any) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <h1>Session Access</h1>

      <div className="card" style={{ display: "grid", gap: 12 }}>
        <input
          value={sessionCode}
          onChange={e => setSessionCode(e.target.value.toUpperCase())}
          placeholder="Session Code (e.g. UFVFU2)"
        />

        <input
          value={parentPassword}
          onChange={e => setParentPassword(e.target.value)}
          placeholder="Parent Password (4 digits)"
          type="password"
          maxLength={4}
        />

        <input
          value={childName}
          onChange={e => setChildName(e.target.value)}
          placeholder="Child's Name"
        />

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
          />
          Remember me
        </label>

        {error && <div className="card">Error: {error}</div>}

        <button className="primary" onClick={handleLogin} disabled={loading}>
          {loading ? "Checking…" : "Open Session"}
        </button>
      </div>
    </div>
  )
}
