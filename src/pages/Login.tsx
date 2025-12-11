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

  // Raw form state
  const [sessionCode, setSessionCode] = useState("")
  const [parentPassword, setParentPassword] = useState("")

  // Whether to keep login details in localStorage for next time.
  const [remember, setRemember] = useState(true)

  // Currently unused in the UI, but cleared on input change.
  const [error, setError] = useState<string | null>(null)

  // Load saved login (for "Remember me" behavior).
  useEffect(() => {
    const saved = loadStoredLogin()
    if (saved) {
      setSessionCode(saved.sessionCode)
      setParentPassword(saved.parentPassword)
      setRemember(true)
    }
  }, [])

  // ---------- INPUT SANITIZATION ----------

  // Only allow A–Z and 0–9, force uppercase, max 6 characters.
  const cleanSessionCode = (val: string) =>
    val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)

  // Only allow digits, max 4 characters.
  const cleanPassword = (val: string) => val.replace(/\D/g, "").slice(0, 4)

  // Simple validity flags used for validation and UI.
  const isSessionCodeValid = sessionCode.length === 6
  const isPasswordValid = parentPassword.length === 4

  // ---------- SUBMIT HANDLER ----------

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Client-side validation before hitting the backend.
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
        resp.error === "invalid_session"
          ? "This session code does not exist."
          : resp.error === "invalid_password"
          ? "Incorrect parent password."
          : "Session ID or parent password is incorrect."

      toast.show(msg)
      return
    }

    // ---------- SUCCESS ----------
    const login: StoredLogin = {
      sessionCode,
      parentPassword,
      childName: resp.child_name || "(unknown)",
    }

    // Either persist login or clear stored login.
    if (remember) saveStoredLogin(login)
    else saveStoredLogin(null)

    // Go to session detail view.
    navigate(`/session/${sessionCode}`)
  }

  return (
    <div className="app">
      <h1>Björn the AI toy</h1>

      <form className="card" onSubmit={onSubmit}>
        {/* Session code input */}
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
              borderColor:
                !isSessionCodeValid && sessionCode
                  ? "red"
                  : "var(--border)",
              width: "100%",
              marginTop: 4,
            }}
          />
        </div>

        {/* Parent password input */}
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
              borderColor:
                !isPasswordValid && parentPassword
                  ? "red"
                  : "var(--border)",
              width: "100%",
              marginTop: 4,
            }}
          />
        </div>

        {/* Remember-me toggle */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember me
        </label>

        {/* Submit button: disabled until both inputs look valid */}
        <button
          type="submit"
          className="primary"
          disabled={!isSessionCodeValid || !isPasswordValid}
          style={{
            opacity: isSessionCodeValid && isPasswordValid ? 1 : 0.5,
          }}
        >
          Login
        </button>
      </form>
    </div>
  )
}
