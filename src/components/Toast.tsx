import { createContext, useContext, useState, useCallback } from "react"

interface ToastContextType {
  show: (msg: string) => void
}

const ToastContext = createContext<ToastContextType>({
  show: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)

  const show = useCallback((msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}

      {message && (
        <div
          style={{
            position: "fixed",
            bottom: 26,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#b31212",
            color: "white",
            padding: "14px 20px",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            zIndex: 9999,
            boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  )
}
