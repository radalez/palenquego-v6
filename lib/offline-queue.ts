"use client"

const OFFLINE_QUEUE_KEY = "palenquego_offline_queue_v1"

export interface OfflineQueuedRequest {
  id: string
  url: string
  method: "POST" | "PUT" | "PATCH" | "DELETE"
  body?: string
  headers?: Record<string, string>
  createdAt: number
}

export function getOfflineQueue(): OfflineQueuedRequest[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
    return raw ? (JSON.parse(raw) as OfflineQueuedRequest[]) : []
  } catch {
    return []
  }
}

export function enqueueOfflineRequest(req: Omit<OfflineQueuedRequest, "id" | "createdAt">) {
  if (typeof window === "undefined") return
  try {
    const current = getOfflineQueue()
    const item: OfflineQueuedRequest = {
      ...req,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    }
    const next = [...current.slice(-49), item]
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent("palenquego-offline-queue-updated", { detail: next.length }))
  } catch {
    // Ignorar si localStorage está lleno
  }
}

export async function flushOfflineQueue(): Promise<number> {
  if (typeof window === "undefined" || !navigator.onLine) return 0
  const queue = getOfflineQueue()
  if (queue.length === 0) return 0

  const remaining: OfflineQueuedRequest[] = []
  let syncedCount = 0

  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      })
      if (res.ok || res.status < 500) {
        syncedCount++
      } else {
        remaining.push(item)
      }
    } catch {
      remaining.push(item)
    }
  }

  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining))
    window.dispatchEvent(
      new CustomEvent("palenquego-offline-queue-updated", { detail: remaining.length })
    )
  } catch {
    // ignore
  }

  return syncedCount
}
