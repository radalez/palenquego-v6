"use client"

import { useState, useEffect, useRef } from "react"
import { Navigation2, StopCircle, ChevronUp, ChevronDown, Wifi, WifiOff, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface MyUnit {
  id: number
  name: string
  license_plate: string
}

export function DriverGPSWidget() {
  const { accessToken } = useAppStore()
  const [myUnit, setMyUnit] = useState<MyUnit | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null)
  const [lastSent, setLastSent] = useState<Date | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [sendCount, setSendCount] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchMyUnit()
  }, [accessToken])

  const fetchMyUnit = async () => {
    if (!accessToken) return
    try {
      const res = await fetch('/api-proxy/transport/units/my-unit/', {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
      })
      if (res.ok) {
        setMyUnit(await res.json())
      }
    } catch { /* silencioso */ }
  }

  const sendLocation = async (lat: number, lng: number) => {
    if (!myUnit?.id || !accessToken) return
    try {
      const res = await fetch(`/api-proxy/transport/units/${myUnit.id}/update_location/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ lat, lng })
      })
      if (res.ok) {
        setLastSent(new Date())
        setSendCount(c => c + 1)
        setGpsError(null)
      } else {
        setGpsError(`Error: ${res.status}`)
      }
    } catch {
      setGpsError("Sin conexión")
    }
  }

  const startTracking = () => {
    if (!navigator.geolocation || !myUnit) return
    setGpsError(null)
    setIsTracking(true)
    setIsExpanded(true)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        sendLocation(pos.coords.latitude, pos.coords.longitude)
      },
      (err) => setGpsError("GPS: " + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    )

    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          sendLocation(pos.coords.latitude, pos.coords.longitude)
        },
        (err) => setGpsError("GPS: " + err.message),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }, 10000)
  }

  const stopTracking = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsTracking(false)
    sessionStorage.removeItem('chofer-gps-active')
  }

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  // Si no tiene unidad asignada, no mostramos nada
  if (!myUnit) return null

  return (
    <div className="fixed bottom-20 left-2 right-2 z-40 mx-auto max-w-md">
      <div className={cn(
        "rounded-2xl shadow-2xl border overflow-hidden transition-all duration-300",
        isTracking
          ? "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700"
          : "bg-card border-border"
      )}>
        {/* Header - siempre visible, clickeable para expandir */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isTracking ? "bg-green-500" : "bg-muted"
            )}>
              {isTracking
                ? <Wifi className="w-4 h-4 text-white animate-pulse" />
                : <Truck className="w-4 h-4 text-muted-foreground" />
              }
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground font-medium">
                {myUnit.name} • {myUnit.license_plate}
              </p>
              <p className={cn("text-sm font-bold",
                isTracking ? "text-green-700 dark:text-green-300" : "text-foreground"
              )}>
                {isTracking ? `GPS Activo (${sendCount} envíos)` : "GPS Apagado"}
              </p>
            </div>
          </div>
          {isExpanded
            ? <ChevronDown className="w-5 h-5 text-muted-foreground" />
            : <ChevronUp className="w-5 h-5 text-muted-foreground" />
          }
        </button>

        {/* Panel expandido */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3">
            {/* Coordenadas en vivo */}
            {currentPos && isTracking && (
              <div className="text-xs font-mono text-center space-y-0.5 text-muted-foreground">
                <p>{currentPos.lat.toFixed(6)}, {currentPos.lng.toFixed(6)}</p>
                {lastSent && (
                  <p className="text-green-600 dark:text-green-400">
                    ✓ {lastSent.toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
            {gpsError && <p className="text-xs text-red-500 text-center">{gpsError}</p>}

            {/* Botón */}
            {!isTracking ? (
              <Button
                onClick={startTracking}
                className="w-full h-12 font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2"
              >
                <Navigation2 className="w-5 h-5" />
                Iniciar GPS
              </Button>
            ) : (
              <Button
                onClick={stopTracking}
                variant="destructive"
                className="w-full h-12 font-bold rounded-xl gap-2"
              >
                <StopCircle className="w-5 h-5" />
                Detener GPS
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
