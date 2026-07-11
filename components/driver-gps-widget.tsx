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
  const { routes, fetchRoutes, accessToken } = useAppStore()
  const { isDriverTracking, driverGpsError, driverCurrentPos, startDriverTracking, stopDriverTracking, driverGpsCount } = useAppStore()
  
  const [myUnit, setMyUnit] = useState<MyUnit | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    fetchRoutes()
    fetchMyUnit()
  }, [fetchRoutes, accessToken])

  const fetchMyUnit = async () => {
    if (!accessToken) return
    try {
      const res = await fetch('/api-proxy/transport/units/my-unit/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      if (res.ok) {
        const data = await res.json()
        setMyUnit(data)
      }
    } catch {
      console.error("Error al buscar unidad del chofer")
    }
  }

  // Si no tiene unidad asignada, no mostramos nada
  if (!myUnit) return null

  // Encontramos la ruta que usa NUESTRA unidad
  const myRoute = myUnit
    ? routes.find((r: any) => r.unit_id === myUnit.id || r.unit_name === myUnit.name) ?? null
    : null

  return (
    <div className="fixed bottom-20 left-2 right-2 z-40 mx-auto max-w-md">
      <div className={cn(
        "rounded-2xl shadow-2xl border overflow-hidden transition-all duration-300",
        isDriverTracking
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
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              isDriverTracking ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"
            )}>
              {isDriverTracking
                ? <Wifi className="w-5 h-5 animate-pulse" />
                : <Truck className="w-5 h-5" />
              }
            </div>
            <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-left">{myRoute ? myRoute.name : myUnit.name}</p>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              {myRoute ? myUnit.name : "Sin ruta asignada"} • {myUnit.license_plate}
            </p>
            <p className={cn("text-sm font-bold flex items-center gap-1 mt-0.5",
              isDriverTracking ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}>
              {isDriverTracking ? <Wifi className="w-4 h-4 animate-pulse" /> : <WifiOff className="w-4 h-4" />}
              {isDriverTracking ? "GPS En vivo" : "GPS Apagado"}
            </p>
          </div>
          </div>
          {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />}
        </button>

        {/* Detalles expandidos */}
        {isExpanded && (
          <div className="p-3 bg-muted/30 border-t border-border space-y-3">
            {/* Stats en vivo */}
            {driverCurrentPos && isDriverTracking && (
              <div className="flex justify-between items-center text-xs font-mono bg-background p-2 rounded-lg border">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Lat: {driverCurrentPos.lat.toFixed(5)}</span>
                </div>
                <span>Lng: {driverCurrentPos.lng.toFixed(5)}</span>
              </div>
            )}

            {driverGpsError && (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded-lg">
                {driverGpsError}
              </p>
            )}

            {/* Controles */}
            <div className="flex gap-2">
              {!isDriverTracking ? (
                <Button 
                  onClick={() => startDriverTracking(myUnit.id)} 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                  size="sm"
                >
                  <Navigation2 className="w-4 h-4 mr-2" />
                  Iniciar GPS
                </Button>
              ) : (
                <Button 
                  onClick={stopDriverTracking} 
                  variant="destructive"
                  className="flex-1 font-bold"
                  size="sm"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Detener
                </Button>
              )}
            </div>
          </div>
        )}</div>
    </div>
  )
}
