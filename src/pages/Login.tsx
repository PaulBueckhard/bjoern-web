import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  loadStoredLogin,
  saveStoredLogin,
  type StoredLogin,
  fetchSessionByShortId,
} from "../api"
import { useToast } from "../components/Toast"

export default function Login() {
  const navigate = useNavigate()
  const toast = useToast()

  const [sessionCode, setSessionCode] = useState("")
  const [parentPassword, setParentPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load saved login (for "Remember login")
  useEffect(() => {
    const saved = loadStoredLogin()
    if (saved) {
      setSessionCode(saved.sessionCode)
      setParentPassword(saved.parentPassword)
      setRemember(true)
    }
  }, [])

  // Sanitize inputs
  const cleanSessionCode = (val: string) =>
    val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)

  const cleanPassword = (val: string) =>
    val.replace(/\D/g, "").slice(0, 4)

  const isSessionCodeValid = sessionCode.length === 6
  const isPasswordValid = parentPassword.length === 4

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isSessionCodeValid) {
      toast.show("Session code must be 6 characters.")
      return
    }
    if (!isPasswordValid) {
      toast.show("Parent password must be 4 digits.")
      return
    }

    // ---------- VALIDATE WITH BACKEND ----------
    const resp = await fetchSessionByShortId(sessionCode, parentPassword)

    if ("error" in resp) {
      const msg =
        resp.error === "invalid session id"
          ? "This session code does not exist."
          : resp.error === "invalid pin"
          ? "Incorrect parent password."
          : "Session ID or parent password is incorrect."

      toast.show(msg)
      return // ← stay on page
    }

    // ---------- SUCCESS ----------
    const login: StoredLogin = {
      sessionCode,
      parentPassword,
      childName: resp.child_name || "(unknown)",
    }

    if (remember) saveStoredLogin(login)
    else saveStoredLogin(null)

    navigate(`/session/${sessionCode}`)
  }

  return (
    <div className="app">
      <h1>Björn the AI toy</h1>

      <form className="card" onSubmit={onSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Session Code</label>
          <input
            value={sessionCode}
            maxLength={6}
            onChange={(e) => {
              setSessionCode(cleanSessionCode(e.target.value))
              if (error) setError(null)
            }}
            placeholder="Enter session code (e.g.: ABC123)"
            style={{
              borderColor: !isSessionCodeValid && sessionCode ? "red" : "var(--border)",
              width: "100%",
              marginTop: 4,
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Parent Password</label>
          <input
            value={parentPassword}
            maxLength={4}
            inputMode="numeric"
            onChange={(e) => {
              setParentPassword(cleanPassword(e.target.value))
              if (error) setError(null)
            }}
            placeholder="Enter password (e.g.: 1234)"
            style={{
              borderColor: !isPasswordValid && parentPassword ? "red" : "var(--border)",
              width: "100%",
              marginTop: 4,
            }}
          />
        </div>

        <label
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}
        >
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember me
        </label>

        <button
          type="submit"
          className="primary"
          disabled={!isSessionCodeValid || !isPasswordValid}
          style={{ opacity: isSessionCodeValid && isPasswordValid ? 1 : 0.5 }}
        >
          Login
        </button>
      </form>
    </div>
  )
}
