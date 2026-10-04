"use client"

import { useState, useEffect, useRef } from "react"
import { Navigation2, StopCircle, Truck, Wifi, WifiOff, AlertCircle, Users, Car, CheckCircle2, Sparkles, MapPin } from "lucide-react"
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
  capacity?: number
}

import { DriverKycScreen } from "./driver-kyc-screen"

export function DriverScreen({ onNavigate }: DriverScreenProps) {
  const { routes, fetchRoutes, accessToken, currentUser } = useAppStore()
  const { isDriverTracking, driverGpsError, driverCurrentPos, startDriverTracking, stopDriverTracking, driverGpsCount } = useAppStore()
  const { requestedTrips, fetchRequestedTrips, acceptTrip, startTrip, finishTrip } = useAppStore()
  
  const [myUnit, setMyUnit] = useState<MyUnit | null>(null)
  const [unitError, setUnitError] = useState<string | null>(null)

  // Cargamos las rutas y buscamos la unidad del chofer al montar
  useEffect(() => {
    fetchRoutes()
    fetchMyUnit()
    fetchRequestedTrips()
    const interval = setInterval(() => {
      fetchRequestedTrips()
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchRoutes, fetchRequestedTrips, accessToken])

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

  // Viajes urbanos a demanda asignados al chofer
  const myAssignedTrips = routes.filter(
    (r: any) => (r.driver === currentUser?.id || r.driver_name === currentUser?.name) &&
                (r.estado_viaje === 'ACEPTADO' || r.estado_viaje === 'EN_CURSO')
  )

  const handleStartTracking = () => {
    if (myUnit) {
      startDriverTracking(myUnit.id)
      // Redirigir a rutas poco después
      setTimeout(() => {
        if (onNavigate) onNavigate('rutas-classic')
      }, 1500)
    }
  }

  // Verificar si el chofer necesita KYC
  if (currentUser?.tipo === "CHOFER" && currentUser?.kyc_status !== 'APPROVED') {
    return <DriverKycScreen user={currentUser} onNavigate={onNavigate} />
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

        {/* Panel Viajes Urbanos a Demanda (Tipo Uber) */}
        <div className="bg-card border-2 border-emerald-500/30 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Viajes Urbanos a Demanda</h3>
                <p className="text-[11px] text-muted-foreground">Solicitudes de pasajeros en tiempo real</p>
              </div>
            </div>
            {requestedTrips?.length > 0 && (
              <span className="text-xs font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full animate-pulse">
                {requestedTrips.length} disponibles
              </span>
            )}
          </div>

          {/* Viajes Aceptados / En Curso asignados a este chofer */}
          {myAssignedTrips.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Tu viaje asignado en curso:
              </p>
              {myAssignedTrips.map((trip: any) => {
                const origin = trip.stops?.[0]?.name || "Origen"
                const destination = trip.stops?.[trip.stops?.length - 1]?.name || "Destino"
                const isStarted = trip.estado_viaje === 'EN_CURSO'

                return (
                  <div key={trip.id} className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-foreground">{trip.name}</span>
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                        {trip.estado_viaje}
                      </span>
                    </div>
                    <div className="text-muted-foreground space-y-0.5">
                      <p><strong>Recogida:</strong> {origin}</p>
                      <p><strong>Destino:</strong> {destination}</p>
                    </div>
                    <div className="flex gap-2 pt-1">
                      {!isStarted ? (
                        <Button
                          size="sm"
                          onClick={async () => {
                            const res = await startTrip(trip.id)
                            if (res.success) {
                              fetchRoutes()
                            } else {
                              alert(res.error || "No se pudo iniciar el viaje.")
                            }
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-9 rounded-xl"
                        >
                          ▶ Iniciar Recorrido
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={async () => {
                            const res = await finishTrip(trip.id)
                            if (res.success) {
                              alert("¡Viaje finalizado con éxito! El pasajero podrá calificarte.")
                              fetchRoutes()
                            } else {
                              alert(res.error || "No se pudo finalizar el viaje.")
                            }
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 rounded-xl"
                        >
                          ✓ Finalizar Viaje
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Solicitudes Disponibles para Aceptar */}
          {requestedTrips?.length > 0 ? (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground">Nuevas solicitudes:</p>
              {requestedTrips.map((req: any) => {
                const origin = req.stops?.[0]?.name || "Origen"
                const destination = req.stops?.[req.stops?.length - 1]?.name || "Destino"

                return (
                  <div key={req.id} className="p-3 bg-muted/60 rounded-xl border border-border space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">{req.name}</span>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-200">
                        Esperando chofer
                      </span>
                    </div>
                    <div className="text-muted-foreground space-y-0.5">
                      <p><strong>De:</strong> {origin}</p>
                      <p><strong>A:</strong> {destination}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={async () => {
                        const res = await acceptTrip(req.id)
                        if (res.success) {
                          alert("¡Viaje aceptado! Dirígete a recoger al pasajero.")
                          fetchRequestedTrips()
                          fetchRoutes()
                        } else {
                          alert(res.error || "No se pudo aceptar el viaje.")
                        }
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-xs"
                    >
                      ✓ Aceptar Viaje
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            myAssignedTrips.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No hay solicitudes de viaje pendientes en este momento.
              </p>
            )
          )}
        </div>

        {/* Panel Anti-Fraude (Control de Pasajeros) */}
        {myRoute && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden mt-4 shadow-sm">
            <div className="bg-primary px-4 py-3 border-b border-primary/20 flex justify-between items-center">
              <div className="flex items-center gap-2 text-primary-foreground">
                <Users className="w-5 h-5" />
                <h3 className="font-bold">Control de Pasajeros</h3>
              </div>
              <div className="bg-primary-foreground/20 text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                Plazas Disponibles: {myUnit?.capacity || 20}
              </div>
            </div>
            
            <div className="divide-y divide-border max-h-96 overflow-y-auto custom-scrollbar">
              {myRoute.stops.map((stop: any, index: number) => {
                // Leer datos reales desde la API (calculados en el backend)
                const suben = stop.boarding_count || 0;
                const bajan = stop.alighting_count || 0;
                // Dejamos esto fijo por ahora hasta que se enlace con el GPS real
                const isNext = index === 1; 

                return (
                  <div key={stop.id} className={cn("p-4", isNext ? "bg-primary/5 dark:bg-primary/10" : "")}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", isNext ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                          {stop.order}
                        </div>
                        <p className={cn("font-medium", isNext ? "text-primary font-bold" : "")}>{stop.name}</p>
                      </div>
                      {isNext && <span className="text-xs font-bold text-primary animate-pulse">Próxima Parada</span>}
                    </div>
                    
                    <div className="flex gap-4 ml-8 text-sm mt-1">
                      {suben > 0 ? (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
                          <span className="font-bold bg-green-100 dark:bg-green-900/40 px-1.5 rounded text-xs">+{suben}</span> Suben
                        </div>
                      ) : <div className="text-muted-foreground/50 text-xs mt-1">Nadie sube</div>}
                      
                      {bajan > 0 ? (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
                          <span className="font-bold bg-amber-100 dark:bg-amber-900/40 px-1.5 rounded text-xs">-{bajan}</span> Bajan
                        </div>
                      ) : <div className="text-muted-foreground/50 text-xs mt-1">Nadie baja</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
            <p className="font-semibold text-sm">Paradas de tu ruta (Registro manual)</p>
            {myRoute.stops.map((stop: any) => (
              <div key={stop.order} className="flex items-center gap-3 bg-muted p-3 rounded-xl border border-border">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {stop.order}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{stop.name}</p>
                  {stop.minutes_from_start ? (
                    <p className="text-xs text-muted-foreground">~{stop.minutes_from_start} min desde el inicio</p>
                  ) : null}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  onClick={() => {
                    if (myUnit) {
                      useAppStore.getState().passStop(myUnit.id, stop.id).then((result) => {
                        if (result.ok) {
                          if (result.data?.notified_passengers > 0) {
                            alert("¡Parada marcada con éxito! Se notificó a los pasajeros.");
                          } else {
                            alert("La parada se marcó, pero no había pasajeros activos para notificar (o ya estaba registrada).");
                          }
                        } else {
                          alert(`Error del servidor: ${result.error || 'Desconocido'}`);
                        }
                      });
                    }
                  }}
                >
                  ✓ Marcar Llegada
                </Button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
