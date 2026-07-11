"use client"

import { useState, useEffect, useRef } from "react"
import { Navigation2, MapPin, StopCircle, Truck, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { HeaderWithMenu } from "@/components/header-with-menu"
import { cn } from "@/lib/utils"

interface DriverScreenProps {
  onNavigate?: (tab: string) => void
}

export function DriverScreen({ onNavigate }: DriverScreenProps) {
  const { routes, fetchRoutes, accessToken } = useAppStore()
  const [isTracking, setIsTracking] = useState(false)
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null)
  const [lastSent, setLastSent] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sendCount, setSendCount] = useState(0)
  const watchIdRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Obtenemos la ruta del chofer desde el store
  const myRoute = routes[0] // El chofer solo ve su ruta
  const unitId = myRoute ? (myRoute as any).unit_id : null

  useEffect(() => {
    fetchRoutes()
  }, [fetchRoutes])

  // Función que envía las coordenadas al servidor
  const sendLocation = async (lat: number, lng: number) => {
    if (!unitId || !accessToken) return
    try {
      const res = await fetch(`/api-proxy/transport/units/${unitId}/update_location/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ lat, lng })
      })
      if (res.ok) {
        setLastSent(new Date())
        setSendCount(c => c + 1)
        setError(null)
      } else {
        setError(`Error del servidor: ${res.status}`)
      }
    } catch (e) {
      setError("Sin conexión. Reintentando...")
    }
  }

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Este dispositivo no tiene GPS disponible.")
      return
    }
    if (!unitId) {
      setError("No se encontró ningún vehículo asignado a tu cuenta. Pídele al admin que te asigne una unidad.")
      return
    }

    setError(null)
    setIsTracking(true)

    // Obtenemos posición inmediata
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setCurrentPos({ lat: latitude, lng: longitude })
        sendLocation(latitude, longitude)
      },
      (err) => setError("No se pudo obtener el GPS: " + err.message),
      { enableHighAccuracy: true }
    )

    // Enviamos cada 10 segundos
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setCurrentPos({ lat: latitude, lng: longitude })
          sendLocation(latitude, longitude)
        },
        (err) => setError("GPS: " + err.message),
        { enableHighAccuracy: true }
      )
    }, 10000)
  }

  const stopTracking = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    setIsTracking(false)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeaderWithMenu title="Panel del Chofer" onNavigate={onNavigate} />

      <div className="flex-1 p-4 space-y-4">

        {/* Estado de la ruta asignada */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tu ruta asignada</p>
              <p className="font-bold">{myRoute?.name ?? "Sin ruta asignada"}</p>
            </div>
          </div>
          {myRoute && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Vehículo: <span className="text-foreground font-medium">{myRoute.unit_name ?? "Sin vehículo"}</span></p>
              <p>Paradas: <span className="text-foreground font-medium">{myRoute.stops.length}</span></p>
            </div>
          )}
        </div>

        {/* Estado GPS en vivo */}
        <div className={cn(
          "rounded-2xl p-5 border text-center space-y-2 transition-all",
          isTracking
            ? "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700"
            : "bg-muted border-border"
        )}>
          <div className="flex justify-center">
            {isTracking
              ? <Wifi className="w-10 h-10 text-green-600 animate-pulse" />
              : <WifiOff className="w-10 h-10 text-muted-foreground" />
            }
          </div>
          <p className={cn("font-bold text-lg", isTracking ? "text-green-700 dark:text-green-300" : "text-muted-foreground")}>
            {isTracking ? "GPS Activo — Enviando ubicación" : "GPS Inactivo"}
          </p>
          {currentPos && (
            <div className="text-xs font-mono space-y-0.5 text-muted-foreground">
              <p>Lat: <span className="text-foreground">{currentPos.lat.toFixed(6)}</span></p>
              <p>Lng: <span className="text-foreground">{currentPos.lng.toFixed(6)}</span></p>
            </div>
          )}
          {lastSent && (
            <p className="text-xs text-green-600 dark:text-green-400">
              ✓ Última señal: {lastSent.toLocaleTimeString()} ({sendCount} envíos)
            </p>
          )}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>

        {/* Botón principal */}
        {!isTracking ? (
          <Button
            onClick={startTracking}
            className="w-full h-16 text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded-2xl gap-3"
            disabled={!unitId}
          >
            <Navigation2 className="w-6 h-6" />
            Iniciar Viaje y Activar GPS
          </Button>
        ) : (
          <Button
            onClick={stopTracking}
            variant="destructive"
            className="w-full h-16 text-lg font-bold rounded-2xl gap-3"
          >
            <StopCircle className="w-6 h-6" />
            Detener GPS
          </Button>
        )}

        {!unitId && (
          <p className="text-xs text-center text-muted-foreground px-4">
            ⚠️ Pídele al administrador que te asigne un vehículo en el panel de Django Admin.
          </p>
        )}

        {/* Paradas de la ruta */}
        {myRoute && myRoute.stops.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p className="font-semibold text-sm">Paradas de tu ruta</p>
            {myRoute.stops.map((stop) => (
              <div key={stop.order} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {stop.order}
                </div>
                <div>
                  <p className="text-sm font-medium">{stop.name}</p>
                  {stop.minutes_from_start ? (
                    <p className="text-xs text-muted-foreground">~{stop.minutes_from_start} min desde el inicio</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
