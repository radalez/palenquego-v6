"use client"

import { useState, useEffect } from "react"
import { Navigation2, StopCircle, Wifi, WifiOff, Car, LayoutDashboard, X, ChevronRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface MyUnit {
  id: number
  name: string
  license_plate: string
}

interface DriverGPSWidgetProps {
  onNavigate?: (tab: string) => void
}

export function DriverGPSWidget({ onNavigate }: DriverGPSWidgetProps) {
  const { routes, fetchRoutes, accessToken, currentUser } = useAppStore()
  const { isDriverTracking, driverGpsError, driverCurrentPos, startDriverTracking, stopDriverTracking, driverGpsCount } = useAppStore()
  
  const [myUnit, setMyUnit] = useState<MyUnit | null>(null)
  const [isOpen, setIsOpen] = useState(false)

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

  // Si no tiene unidad asignada, no mostramos el widget
  if (!myUnit) return null

  // Encontramos la ruta que usa la unidad del conductor
  const myRoute = myUnit
    ? routes.find((r: any) => r.unit_id === myUnit.id || r.unit_name === myUnit.name) ?? null
    : null

  const isApproved = currentUser?.kyc_status === 'APPROVED'

  return (
    <>
      {/* 1. MODO MINIMIZADO: BOTÓN CIRCULAR FLOTANTE (FAB) */}
      {!isOpen && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 group animate-in fade-in duration-200">
          {/* Tooltip visible en desktop al pasar el mouse */}
          <div className="hidden md:group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900/90 text-white text-xs font-bold shadow-lg backdrop-blur-sm pointer-events-none transition-all">
            <span>Panel de Chofer</span>
            {isDriverTracking && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className={cn(
              "relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 border-2",
              isDriverTracking
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-white dark:border-emerald-400 shadow-emerald-600/30"
                : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 border-emerald-500/40 shadow-black/10"
            )}
            title="Consola de Chofer (GPS y Paradas)"
          >
            {isDriverTracking ? (
              <>
                {/* Radar beacon activo */}
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                </span>
                <Wifi className="w-6 h-6 animate-pulse text-white" />
              </>
            ) : (
              <>
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-800" />
                <Car className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </>
            )}
          </button>
        </div>
      )}

      {/* 2. MODO EXPANDIDO: TARJETA FLOTANTE CON CONTROL DE CIERRE */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 md:bottom-6 md:right-6 z-40 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="bg-card/95 backdrop-blur-md rounded-3xl shadow-2xl border border-border overflow-hidden">
            {/* Cabecera de la tarjeta */}
            <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border",
                  isDriverTracking 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" 
                    : "bg-muted border-border text-muted-foreground"
                )}>
                  {isDriverTracking ? <Wifi className="w-5 h-5 animate-pulse text-emerald-600" /> : <Car className="w-5 h-5 text-emerald-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-extrabold truncate text-foreground">
                      {myRoute ? myRoute.name : myUnit.name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {myUnit.name} &bull; <span className="font-mono font-bold">{myUnit.license_plate}</span>
                  </p>
                </div>
              </div>

              {/* Botón Minimizar */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2"
                title="Minimizar a botón flotante"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo de la tarjeta */}
            <div className="p-4 space-y-3">
              {/* Estado GPS */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border text-xs">
                <span className="text-muted-foreground font-medium">Estado GPS:</span>
                <span className={cn(
                  "font-bold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px]",
                  isDriverTracking 
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" 
                    : "bg-muted text-muted-foreground"
                )}>
                  <span className={cn("w-2 h-2 rounded-full", isDriverTracking ? "bg-emerald-500 animate-pulse" : "bg-gray-400")} />
                  {isDriverTracking ? "Transmitiendo en Vivo" : "GPS Inactivo"}
                </span>
              </div>

              {/* Coordenadas en vivo si está transmitiendo */}
              {driverCurrentPos && isDriverTracking && (
                <div className="flex justify-between items-center text-[11px] font-mono bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-emerald-700 dark:text-emerald-300">Lat: {driverCurrentPos.lat.toFixed(5)}</span>
                  <span className="text-emerald-700 dark:text-emerald-300">Lng: {driverCurrentPos.lng.toFixed(5)}</span>
                  <span className="text-[10px] font-bold text-emerald-600">({driverGpsCount} envíos)</span>
                </div>
              )}

              {driverGpsError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950 p-2.5 rounded-xl border border-red-200">
                  {driverGpsError}
                </p>
              )}

              {/* Botón principal: Consola de Conducción */}
              <Button
                onClick={() => {
                  setIsOpen(false)
                  if (onNavigate) onNavigate('conductor')
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl h-11 shadow-md shadow-emerald-600/20 flex items-center justify-between px-4"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Abrir Panel del Chofer</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Button>

              {/* Controles de GPS */}
              <div className="flex gap-2">
                {!isDriverTracking ? (
                  <Button 
                    onClick={() => startDriverTracking(myUnit.id)} 
                    disabled={!isApproved}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-10 rounded-xl"
                    size="sm"
                  >
                    <Navigation2 className="w-4 h-4 mr-1.5" />
                    Iniciar GPS
                  </Button>
                ) : (
                  <Button 
                    onClick={stopDriverTracking} 
                    variant="destructive"
                    className="flex-1 font-bold h-10 rounded-xl"
                    size="sm"
                  >
                    <StopCircle className="w-4 h-4 mr-1.5" />
                    Detener GPS
                  </Button>
                )}
              </div>

              {/* Aviso si no está aprobado */}
              {!isApproved && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                  Aún no puedes iniciar el GPS. Tu empresa o aliado debe validar tu cuenta en su panel administrativo.
                </div>
              )}

              {/* Botón para minimizar */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center text-[11px] font-semibold text-muted-foreground hover:text-foreground pt-1 transition-colors"
              >
                Minimizar a botón flotante
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
