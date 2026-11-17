"use client"

import { useEffect, useState } from "react"
import { WifiOff, Wifi } from "lucide-react"
import { flushOfflineQueue, getOfflineQueue } from "@/lib/offline-queue"

export function ServiceWorkerRegister() {
  const [isOnline, setIsOnline] = useState(true)
  const [justReconnected, setJustReconnected] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return

    setIsOnline(navigator.onLine)
    setPendingCount(getOfflineQueue().length)

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((reg) => {
          console.log("[PWA] Service Worker registrado exitosamente:", reg.scope)
          reg.update().catch(() => {})
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing
            if (!newWorker) return
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: "SKIP_WAITING" })
              }
            })
          })
        })
        .catch((err) => {
          console.warn("[PWA] Error registrando Service Worker:", err)
        })
    }

    const handleOffline = () => {
      setIsOnline(false)
      setJustReconnected(false)
    }

    const handleOnline = async () => {
      setIsOnline(true)
      setJustReconnected(true)
      await flushOfflineQueue()
      setPendingCount(getOfflineQueue().length)
      setTimeout(() => setJustReconnected(false), 3200)
    }

    const handleQueueUpdate = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail
      setPendingCount(typeof detail === "number" ? detail : getOfflineQueue().length)
    }

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)
    window.addEventListener("palenquego-offline-queue-updated", handleQueueUpdate)

    // Intentar sincronizar cola pendiente al arrancar si hay red
    if (navigator.onLine) {
      flushOfflineQueue().then(() => setPendingCount(getOfflineQueue().length))
    }

    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("palenquego-offline-queue-updated", handleQueueUpdate)
    }
  }, [])

  if (isOnline && !justReconnected) return null

  return (
    <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-[90] pointer-events-none px-3">
      {!isOnline ? (
        <div className="bg-[#105238] text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full shadow-xl border border-[#8ee01a]/40 flex items-center gap-2 whitespace-nowrap animate-in fade-in slide-in-from-top-2">
          <WifiOff className="w-3.5 h-3.5 text-[#8ee01a] shrink-0" />
          <span>
            Sin conexión · Modo offline activo
            {pendingCount > 0 ? ` (${pendingCount} pendiente${pendingCount > 1 ? "s" : ""})` : ""}
          </span>
        </div>
      ) : (
        <div className="bg-[#105238] text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full shadow-xl border border-[#8ee01a]/60 flex items-center gap-2 whitespace-nowrap animate-in fade-in slide-in-from-top-2">
          <Wifi className="w-3.5 h-3.5 text-[#8ee01a] shrink-0" />
          <span>Conexión restaurada · Todo sincronizado</span>
        </div>
      )}
    </div>
  )
}
