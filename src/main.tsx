import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import Login from "./pages/Login"
import SessionDetail from "./pages/SessionDetail"

import { ToastProvider } from "./components/Toast"

import "./styles.css"

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/session/:id", element: <SessionDetail /> },
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </React.StrictMode>
)
