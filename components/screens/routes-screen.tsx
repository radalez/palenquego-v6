"use client"

import { useState, useEffect } from "react"
import { MapPin, Navigation2, Clock, Users, AlertCircle, X, Truck, Ticket, ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAppStore, type Route, type Service } from "@/lib/store"
import { HeaderWithMenu } from "@/components/header-with-menu"
import dynamic from 'next/dynamic';
import { cn } from "@/lib/utils"

const MapPreview = dynamic(() => import('@/components/MapPreview'), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-xl" />
});
interface RouteTrackingState {
  routeId: number
  showTracking: boolean
  currentStop: number
}

interface ServiceViewState {
  routeId: number
  showServices: boolean
}

interface TicketPurchaseState {
  routeId: number
  serviceId?: number
  showPayment: boolean
  step: "selection" | "payment" | "success"
}

interface RoutesScreenProps {
  onNavigate?: (tab: string) => void
}

export function RoutesScreen({ onNavigate }: RoutesScreenProps) {
  const { routes, services, fetchRoutes, isLoading } = useAppStore() 
  const [tracking, setTracking] = useState<RouteTrackingState | null>(null)
  const [serviceView, setServiceView] = useState<ServiceViewState | null>(null)
  const [ticketPurchase, setTicketPurchase] = useState<TicketPurchaseState | null>(null)


useEffect(() => {
    // Primera carga inmediata
    fetchRoutes();

    // Establecemos el intervalo de 10 segundos para refrescar el GPS del bus
    const gpsInterval = setInterval(() => {
      console.log("Refrescando posición GPS del bus...");
      fetchRoutes();
    }, 10000);

    // Limpieza al desmontar el componente para evitar fugas de memoria
    return () => {
      clearInterval(gpsInterval);
    };
  }, [fetchRoutes]);


  const handleStartTracking = (route: Route) => {
    setTracking({ routeId: route.id, showTracking: true, currentStop: 1 })
  }

  const handleViewServices = (route: Route) => {
    setServiceView({ routeId: route.id, showServices: true })
  }

  const handleBuyTicket = (route: Route, service?: Service) => {
    setTicketPurchase({
      routeId: route.id,
      serviceId: service?.id,
      showPayment: true,
      step: "selection",
    })
  }

  const handleConfirmTicketPayment = () => {
    setTicketPurchase((prev) => (prev ? { ...prev, step: "payment" } : null))
    setTimeout(() => {
      setTicketPurchase((prev) => (prev ? { ...prev, step: "success" } : null))
    }, 2000)
    setTimeout(() => {
      setTicketPurchase(null)
    }, 3500)
  }

  return (
    <div className="flex flex-col">
      <HeaderWithMenu title="Rutas de Transporte" onNavigate={onNavigate} />

      {/* Tracking Modal with Scroll */}
      {tracking?.showTracking && (() => {
        const trackedRoute = routes.find(r => r.id === tracking.routeId)
        const routeAny = trackedRoute as any
        const hasGPS = routeAny?.unit_lat && routeAny?.unit_lng
        return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl max-w-sm w-full max-h-[85vh] shadow-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-primary px-6 py-4 flex items-center justify-between text-primary-foreground flex-shrink-0">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <div>
                  <h2 className="text-lg font-bold leading-tight">Rastreando Ruta</h2>
                  <p className="text-xs text-primary-foreground/70 leading-tight">{trackedRoute?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setTracking(null)}
                className="p-1 hover:bg-primary-foreground/20 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* GPS Status - REAL */}
              <div className={cn("p-4 rounded-xl space-y-3", hasGPS ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800" : "bg-muted")}>
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", hasGPS ? "bg-green-500 animate-pulse" : "bg-muted-foreground")}></div>
                  <p className="font-semibold">{hasGPS ? "GPS en vivo" : "Sin señal GPS aún"}</p>
                </div>
                {hasGPS ? (
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Lat: <span className="font-mono text-foreground">{routeAny.unit_lat?.toFixed(6)}</span></p>
                    <p className="text-muted-foreground">Lng: <span className="font-mono text-foreground">{routeAny.unit_lng?.toFixed(6)}</span></p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">Actualizado hace unos segundos</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    El chofer aún no ha activado el GPS. Cuando lo haga, verás la posición en vivo aquí.
                  </p>
                )}
              </div>

              {/* Map Preview - real si hay GPS */}
              <div className="rounded-xl h-48 overflow-hidden border border-border shadow-inner">
                <MapPreview
                  stops={trackedRoute?.stops || []}
                  unitLocation={hasGPS ? { lat: routeAny.unit_lat, lng: routeAny.unit_lng } : undefined}
                />
              </div>

              {/* Paradas */}
              <div className="space-y-3">
                <p className="font-semibold text-sm">Paradas de la ruta:</p>
                {(trackedRoute?.stops || []).map((stop) => (
                  <div key={stop.order} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                      "bg-primary/10 text-primary"
                    )}>
                      {stop.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{stop.name || `Parada ${stop.order}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {stop.minutes_from_start ? `~${stop.minutes_from_start} min desde el inicio` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Close Button - Sticky at Bottom */}
            <div className="px-6 py-4 border-t border-border flex-shrink-0 bg-card">
              <Button onClick={() => setTracking(null)} className="w-full bg-primary">
                Cerrar Rastreo
              </Button>
            </div>
          </div>
        </div>
        )
      })()}

      {/* Services Modal */}
      {serviceView?.showServices && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl max-w-md w-full max-h-[85vh] shadow-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-secondary px-6 py-4 flex items-center justify-between text-secondary-foreground flex-shrink-0">
              <h2 className="text-lg font-bold">Servicios en esta ruta</h2>
              <button
                onClick={() => setServiceView(null)}
                className="p-1 hover:bg-secondary-foreground/20 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Services List */}
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {services
                .filter((s) => s.category !== "Hotel" || Math.random() > 0.3) // Mostrar algunos servicios
                .slice(0, 6)
                .map((service) => (
                  <div key={service.id} className="border border-border rounded-xl p-4 hover:bg-muted/50 transition">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-sm line-clamp-1">{service.name}</h3>
                      <Badge className="bg-secondary/20 text-secondary text-xs">${service.price}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{service.location}</p>
                    <Button
                      onClick={() => {
                        handleBuyTicket(routes.find((r) => r.id === serviceView.routeId)!, service)
                        setServiceView(null)
                      }}
                      size="sm"
                      className="w-full bg-primary text-xs"
                    >
                      <Ticket size={14} className="mr-1" />
                      Comprar Boleto + Servicio
                    </Button>
                  </div>
                ))}
            </div>

            {/* Close Button */}
            <div className="px-6 py-4 border-t border-border flex-shrink-0 bg-card">
              <Button onClick={() => setServiceView(null)} variant="outline" className="w-full bg-transparent">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Purchase Modal */}
      {ticketPurchase?.showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl max-w-md w-full shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-primary px-6 py-4 flex items-center justify-between text-primary-foreground">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <h2 className="text-lg font-bold">Comprar Boleto</h2>
              </div>
              {ticketPurchase.step === "selection" && (
                <button
                  onClick={() => setTicketPurchase(null)}
                  className="p-1 hover:bg-primary-foreground/20 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {ticketPurchase.step === "selection" && (
                <>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">Ruta seleccionada</p>
                      <p className="font-bold">{routes.find((r) => r.id === ticketPurchase.routeId)?.name}</p>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition">
                          <input type="radio" name="ticket" defaultChecked className="w-4 h-4" />
                          <div className="flex-1">
                            <p className="font-semibold text-sm">Boleto Sencillo</p>
                            <p className="text-xs text-muted-foreground">Ida a tu destino</p>
                          </div>
                          {/* PRECIO REAL IDA */}
                          <p className="font-bold">${routes.find(r => r.id === ticketPurchase.routeId)?.price_one_way}</p>
                        </label>

                        <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition">
                          <input type="radio" name="ticket" className="w-4 h-4" />
                          <div className="flex-1">
                            <p className="font-semibold text-sm">Boleto de Retorno</p>
                            <p className="text-xs text-muted-foreground">Ida y vuelta incluido</p>
                          </div>
                          {/* PRECIO REAL REDONDO */}
                          <p className="font-bold">${routes.find(r => r.id === ticketPurchase.routeId)?.price_round_trip}</p>
                        </label>
                      </div>

                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-xs text-blue-900 dark:text-blue-100">
                        <strong>Tarifa total:</strong> Tu boleto + acceso al servicio seleccionado
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleConfirmTicketPayment} className="w-full bg-primary text-base font-semibold h-12">
                    Proceder al Pago
                  </Button>
                  <Button onClick={() => setTicketPurchase(null)} variant="outline" className="w-full bg-transparent">
                    Cancelar
                  </Button>
                </>
              )}

              {ticketPurchase.step === "payment" && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                    <ShoppingCart className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">Procesando Compra</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Tu boleto de transporte está siendo procesado de forma segura...
                  </p>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full animate-pulse"></div>
                  </div>
                </div>
              )}

              {ticketPurchase.step === "success" && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Ticket className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-bold text-lg text-green-600 dark:text-green-400">¡Boleto Comprado!</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Tu boleto y código QR serán enviados a tu email en breve.
                  </p>
                  <div className="w-full bg-muted p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Referencia de boleto</p>
                    <p className="font-mono font-bold text-sm">TKT-2025-00847</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 border-b border-border">
        <p className="text-muted-foreground text-sm">Transporte seguro a tus servicios favoritos</p>
      </div>

      <div className="px-4 py-6 space-y-4">
        {routes.map((route) => (
          <div
            key={route.id}
            className={cn(
              "bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition",
              !route.is_active && "opacity-60",
              (route as any).user_has_ticket && "ring-2 ring-primary/40"
            )}
          >
            {/* Route Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={cn("text-lg font-bold", !route.is_active && "text-muted-foreground")}>{route.name}</h3>
                      {(route as any).user_has_ticket && (
                        <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                          ⭐ Mi Ruta
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: route.colorHex }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {route.unit_name ? `Unidad: ${route.unit_name}` : 'Sin unidad asignada'}
                      </span>
                    </div>
                  </div>
                  <Badge className={route.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-muted text-muted-foreground'}>
                    {route.is_active ? 'ACTIVA' : 'INACTIVA'}
                  </Badge>
                </div>

              {/* Route Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted p-2 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Paradas</p>
                  <p className="font-bold text-sm">{route.stops.length}</p>
                </div>
                <div className="bg-muted p-2 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">GPS</p>
                  <p className={`font-bold text-sm ${ (route as any).unit_lat ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {(route as any).unit_lat ? 'En vivo ●' : 'Sin señal'}
                  </p>
                </div>
              </div>
            </div>

            {/* Paradas */}
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold mb-3">Paradas de esta ruta:</p>
              <div className="space-y-2">
                {route.stops.map((stop, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {stop.order}
                    </div>
                    <div className="flex-1">                  
                    <p className="font-medium">{stop.name || `Parada ${stop.order}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                    </p>
                  </div>
                    <Clock size={16} className="text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>

          {/* Route Map Preview */}
            <div className="p-4 h-64 border-b border-border">
              <div className="h-full w-full rounded-xl overflow-hidden border border-border shadow-inner">
                <MapPreview 
                  stops={route.stops} 
                  unitLocation={
                    route.stops[0] 
                      ? { lat: route.stops[0].latitude, lng: route.stops[0].longitude } 
                      : undefined
                  } 
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 flex gap-2">
              <Button
                onClick={() => handleStartTracking(route)}
                variant="outline"
                className="flex-1 gap-2 bg-transparent"
              >
                <Navigation2 size={16} />
                Rastrear
              </Button>
              <Button
                onClick={() => handleViewServices(route)}
                className="flex-1 bg-primary"
              >
                Ver Servicios
              </Button>
            </div>

            {/* Quick Ticket Purchase */}
            <div className="px-4 pb-4">
              <Button
                onClick={() => handleBuyTicket(route)}
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
              >
                <Ticket size={16} />
                Comprar Boleto de Ruta
              </Button>
            </div>
          </div>
        ))}

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
          <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">Nuestras rutas conectan:</p>
            <p>
              Ciudades principales → Paradas intermedias → Servicios turísticos. Transporte seguro, puntual y
              confortable.
            </p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-muted p-6 rounded-xl text-center space-y-2">
          <Users size={32} className="mx-auto text-muted-foreground" />
          <h4 className="font-bold">Más rutas próximamente</h4>
          <p className="text-sm text-muted-foreground">Estamos expandiendo a más ciudades y regiones</p>
          <Button size="sm" variant="outline" className="mt-3 bg-transparent">
            Notificarme
          </Button>
        </div>
      </div>
    </div>
  )
}
