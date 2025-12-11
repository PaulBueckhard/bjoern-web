import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import Login from "./pages/Login"
import SessionDetail from "./pages/SessionDetail"
import { ToastProvider } from "./components/Toast"

import "./styles.css"

/**
 * Application routes.
 * Each path maps directly to a page component.
 */
const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/session/:id", element: <SessionDetail /> },
])

/**
 * Bootstraps the app:
 * - StrictMode for dev checks
 * - ToastProvider for global toast notifications
 * - RouterProvider for navigation
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </React.StrictMode>
)
