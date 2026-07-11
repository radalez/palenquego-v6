"use client"

import { useState, useEffect, useRef } from "react"
import { Navigation2, StopCircle, Truck, Wifi, WifiOff, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { HeaderWithMenu } from "@/components/header-with-menu"
import { cn } from "@/lib/utils"

interface DriverScreenProps {
  onNavigate?: (tab: string) => void
}

interface MyUnit {
  id: number
  name: string
  license_plate: string
  current_lat: number | null
  current_lng: number | null
}

export function DriverScreen({ onNavigate }: DriverScreenProps) {
  const { routes, fetchRoutes, accessToken } = useAppStore()
  const { isDriverTracking, driverGpsError, driverCurrentPos, startDriverTracking, stopDriverTracking, driverGpsCount } = useAppStore()
  
  const [myUnit, setMyUnit] = useState<MyUnit | null>(null)
  const [unitError, setUnitError] = useState<string | null>(null)

  // Cargamos las rutas y buscamos la unidad del chofer al montar
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
        setUnitError(null)
      } else {
        setUnitError("Sin vehículo asignado aún.")
      }
    } catch {
      setUnitError("Error al buscar tu vehículo.")
    }
  }

  // Encontramos la ruta que usa NUESTRA unidad
  const myRoute = myUnit
    ? routes.find((r: any) => r.unit_id === myUnit.id || r.unit_name === myUnit.name) ?? null
    : null

  const handleStartTracking = () => {
    if (myUnit) {
      startDriverTracking(myUnit.id)
      // Redirigir a rutas poco después
      setTimeout(() => {
        if (onNavigate) onNavigate('rutas-classic')
      }, 1500)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeaderWithMenu title="Panel del Chofer" onNavigate={onNavigate} />

      <div className="flex-1 p-4 space-y-4 pb-8">

        {/* Tarjeta: vehículo y ruta */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tu vehículo</p>
              <p className="font-bold">{myUnit?.name ?? "Buscando vehículo…"}</p>
              {myUnit?.license_plate && (
                <p className="text-xs text-muted-foreground font-mono">{myUnit.license_plate}</p>
              )}
            </div>
          </div>
          {myRoute && (
            <div className="bg-muted rounded-xl p-3 text-sm space-y-1">
              <p className="text-xs text-muted-foreground">Ruta asignada</p>
              <p className="font-semibold">{myRoute.name}</p>
              <p className="text-xs text-muted-foreground">{myRoute.stops.length} paradas</p>
            </div>
          )}
          {unitError && !myUnit && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{unitError} Pídele al admin que te asigne en <strong>Transport → Units</strong>.</p>
            </div>
          )}
        </div>

        {/* Estado GPS */}
        <div className={cn(
          "rounded-2xl p-5 border text-center space-y-2 transition-all",
          isDriverTracking
            ? "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700"
            : "bg-muted border-border"
        )}>
          <div className="flex justify-center">
            {isDriverTracking
              ? <Wifi className="w-10 h-10 text-green-600 animate-pulse" />
              : <WifiOff className="w-10 h-10 text-muted-foreground" />
            }
          </div>
          <p className={cn("font-bold text-lg",
            isDriverTracking ? "text-green-700 dark:text-green-300" : "text-muted-foreground"
          )}>
            {isDriverTracking ? "Enviando ubicación en vivo" : "GPS Inactivo"}
          </p>
          {driverCurrentPos && (
            <div className="text-xs font-mono space-y-0.5 text-muted-foreground">
              <p>Lat: <span className="text-foreground">{driverCurrentPos.lat.toFixed(6)}</span></p>
              <p>Lng: <span className="text-foreground">{driverCurrentPos.lng.toFixed(6)}</span></p>
            </div>
          )}
          {isDriverTracking && (
            <p className="text-xs text-green-600 dark:text-green-400">
              ✓ ({driverGpsCount} envíos)
            </p>
          )}
          {driverGpsError && <p className="text-xs text-red-500">{driverGpsError}</p>}
        </div>

        {/* Botón principal */}
        {!isDriverTracking ? (
          <Button
            onClick={handleStartTracking}
            disabled={!myUnit}
            className="w-full h-16 text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded-2xl gap-3 disabled:opacity-50"
          >
            <Navigation2 className="w-6 h-6" />
            Iniciar Viaje y Activar GPS
          </Button>
        ) : (
          <Button
            onClick={stopDriverTracking}
            variant="destructive"
            className="w-full h-16 text-lg font-bold rounded-2xl gap-3"
          >
            <StopCircle className="w-6 h-6" />
            Detener GPS
          </Button>
        )}

        {/* Paradas */}
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
