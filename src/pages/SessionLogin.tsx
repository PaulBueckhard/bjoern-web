import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function SessionLogin() {
  const nav = useNavigate()

  // User-entered session code.
  const [sessionId, setSessionId] = useState("")

  // PIN is prefilled from localStorage if previously saved.
  const [pin, setPin] = useState(localStorage.getItem("saved_pin") || "")

  // Checkbox determines whether the user wants to remember the PIN.
  const [remember, setRemember] = useState(
    Boolean(localStorage.getItem("saved_pin"))
  )

  // Handles form submission: validates input, persists settings, then navigates.
  function submit(e: React.FormEvent) {
    e.preventDefault()

    const cleanId = sessionId.trim().toUpperCase()
    const cleanPin = pin.trim()

    // Basic validation of session code.
    if (!cleanId || cleanId.length < 4) {
      alert("Please enter a valid session code.")
      return
    }

    // PIN must be exactly 4 digits.
    if (!/^\d{4}$/.test(cleanPin)) {
      alert("PIN must be 4 digits.")
      return
    }

    // Persist or clear the stored PIN.
    if (remember) {
      localStorage.setItem("saved_pin", cleanPin)
    } else {
      localStorage.removeItem("saved_pin")
    }

    // Navigate to the session with encoded parameters.
    nav(`/session/${cleanId}?pin=${cleanPin}`)
  }

  return (
    <div className="app">
      <h1>Access Session</h1>

      <form
        className="card"
        onSubmit={submit}
        style={{ display: "grid", gap: 12 }}
      >
        {/* Session code input */}
        <label>
          Session Code:
          <input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="e.g. M7F4C9"
          />
        </label>

        {/* Parent PIN input */}
        <label>
          Parent PIN:
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={4}
            placeholder="4 digits"
          />
        </label>

        {/* Persist-PIN checkbox */}
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember PIN
        </label>

        <button className="primary" type="submit">
          Open Session
        </button>
      </form>
    </div>
  )
}
