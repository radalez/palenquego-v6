"use client"

import { useEffect } from "react"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registrado exitosamente:", reg.scope)
        })
        .catch((err) => {
          console.warn("[PWA] Error registrando Service Worker:", err)
        })
    }
  }, [])

  return null
}
