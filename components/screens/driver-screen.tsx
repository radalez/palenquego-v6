"use client"

import { useState, useEffect, useRef } from "react"
import { Navigation2, StopCircle, Truck, Wifi, WifiOff, AlertCircle, Users, Car, CheckCircle2, Sparkles, MapPin, Repeat, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  const { requestedTrips, fetchRequestedTrips, acceptTrip, startTrip, finishTrip, contraofertarTrip } = useAppStore()
  
  const [myUnit, setMyUnit] = useState<MyUnit | null>(null)
  const [unitError, setUnitError] = useState<string | null>(null)
  const [activeCounterTripId, setActiveCounterTripId] = useState<number | null>(null)
  const [counterPrice, setCounterPrice] = useState<string>("")
  const [isSubmittingCounter, setIsSubmittingCounter] = useState<boolean>(false)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg(null), 3800)
  }

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
    <div className="flex flex-col min-h-screen bg-background relative">
      <HeaderWithMenu title="Panel del Chofer" onNavigate={onNavigate} />

      {/* Toast Flotante */}
      {toastMsg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top duration-300 ${
          toastMsg.type === 'success' ? 'bg-emerald-600 text-white' :
          toastMsg.type === 'error' ? 'bg-red-600 text-white' :
          'bg-gray-900 text-white'
        }`}>
          {toastMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {toastMsg.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
          {toastMsg.type === 'info' && <Sparkles className="w-4 h-4 shrink-0" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

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
                              showToast('success', "Viaje iniciado. El pasajero puede rastrear tu recorrido en tiempo real.")
                              fetchRoutes()
                            } else {
                              showToast('error', res.error || "No se pudo iniciar el viaje.")
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
                              showToast('success', "¡Viaje finalizado con éxito! El pasajero podrá calificarte.")
                              fetchRoutes()
                            } else {
                              showToast('error', res.error || "No se pudo finalizar el viaje.")
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
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Nuevas solicitudes de pasajeros ({requestedTrips.length}):
              </p>
              {requestedTrips.map((req: any) => {
                const origin = req.stops?.[0]?.name || "Origen"
                const destination = req.stops?.[req.stops?.length - 1]?.name || "Destino"
                const isIdaVuelta = req.tipo_viaje === 'IDA_Y_VUELTA'
                const clientPrice = req.precio_ofertado || req.price_one_way || '2.50'
                const isCounterActive = activeCounterTripId === req.id

                return (
                  <div key={req.id} className="p-3.5 bg-muted/70 rounded-2xl border border-border space-y-2.5 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-foreground text-sm">{req.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isIdaVuelta
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {isIdaVuelta ? <Repeat className="w-2.5 h-2.5" /> : <Car className="w-2.5 h-2.5" />}
                            {isIdaVuelta ? 'Ida y Retorno' : 'Solo Ida'}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">Tarifa ofrecida:</span>
                          <span className="font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                            ${clientPrice}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 rounded-full shrink-0">
                        Esperando
                      </span>
                    </div>

                    <div className="text-muted-foreground space-y-1 bg-background/60 p-2 rounded-xl">
                      <p><strong>De:</strong> {origin}</p>
                      <p><strong>A:</strong> {destination}</p>
                    </div>

                    {/* CAJA DE CONTRAOFERTA */}
                    {isCounterActive ? (
                      <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-bold text-amber-800 dark:text-amber-300">
                          <span>Tu Contraoferta:</span>
                          <span className="text-muted-foreground font-normal">Ofreció: ${clientPrice}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">$</span>
                            <Input
                              type="number"
                              step="0.25"
                              value={counterPrice}
                              onChange={(e) => setCounterPrice(e.target.value)}
                              className="pl-5 h-8 text-xs font-bold rounded-lg bg-background"
                              placeholder="Monto"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseFloat(counterPrice) || parseFloat(clientPrice) || 0
                              setCounterPrice((curr + 0.50).toFixed(2))
                            }}
                            className="px-2 py-1 bg-background border border-border rounded-lg text-[10px] font-bold"
                          >
                            +$0.50
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseFloat(counterPrice) || parseFloat(clientPrice) || 0
                              setCounterPrice((curr + 1.00).toFixed(2))
                            }}
                            className="px-2 py-1 bg-background border border-border rounded-lg text-[10px] font-bold"
                          >
                            +$1.00
                          </button>
                        </div>
                        <div className="flex gap-1.5 pt-0.5">
                          <Button
                            size="sm"
                            disabled={isSubmittingCounter}
                            onClick={async () => {
                              const p = parseFloat(counterPrice)
                              if (!p || p <= 0) {
                                showToast('error', "Monto inválido.")
                                return
                              }
                              setIsSubmittingCounter(true)
                              const res = await contraofertarTrip(req.id, p)
                              setIsSubmittingCounter(false)
                              if (res.success) {
                                showToast('success', `Contraoferta de $${p.toFixed(2)} enviada al pasajero.`)
                                setActiveCounterTripId(null)
                                fetchRequestedTrips()
                              } else {
                                showToast('error', res.error || "No se pudo enviar la oferta.")
                              }
                            }}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 rounded-lg shadow-xs"
                          >
                            {isSubmittingCounter ? "Enviando..." : `Enviar Oferta ($${counterPrice})`}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveCounterTripId(null)}
                            className="text-xs h-8 rounded-lg px-2"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            const res = await acceptTrip(req.id)
                            if (res.success) {
                              showToast('success', "¡Viaje aceptado! Dirígete a recoger al pasajero.")
                              fetchRequestedTrips()
                              fetchRoutes()
                            } else {
                              showToast('error', res.error || "No se pudo aceptar el viaje.")
                            }
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-xs gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aceptar ${clientPrice}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActiveCounterTripId(req.id)
                            const base = parseFloat(clientPrice) || 2.50
                            setCounterPrice((base + 1.00).toFixed(2))
                          }}
                          className="text-xs font-bold text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 h-9 rounded-xl px-3 flex items-center gap-1"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Contraofertar
                        </Button>
                      </div>
                    )}
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
                            showToast('success', "¡Parada marcada con éxito! Se notificó a los pasajeros.");
                          } else {
                            showToast('info', "La parada se marcó, pero no había pasajeros activos para notificar.");
                          }
                        } else {
                          showToast('error', `Error del servidor: ${result.error || 'Desconocido'}`);
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
