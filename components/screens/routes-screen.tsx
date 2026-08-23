"use client"

import { useState, useEffect } from "react"
import { MapPin, Navigation2, Clock, Users, AlertCircle, X, Truck, Ticket, ShoppingCart, Search, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  closestStopId?: number
}

// Distance helper functions
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2-lat1);
  const dLon = deg2rad(lon2-lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180)
}

interface RoutesScreenProps {
  onNavigate?: (tab: string) => void
}

export function RoutesScreen({ onNavigate }: RoutesScreenProps) {
  const { routes, services, fetchRoutes, isLoading, routeSearchQuery, setRouteSearchQuery, returnToMapRoute, setReturnToMapRoute } = useAppStore() 
  const [tracking, setTracking] = useState<RouteTrackingState | null>(null)
  const [serviceView, setServiceView] = useState<ServiceViewState | null>(null)
  const [ticketPurchase, setTicketPurchase] = useState<TicketPurchaseState | null>(null)

  const filteredRoutes = routes.filter((route) => {
    const query = routeSearchQuery.toLowerCase()
    return (
      route.name.toLowerCase().includes(query) ||
      route.stops.some((stop) => stop.name?.toLowerCase().includes(query))
    )
  })

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

  const getTicketPrices = () => {
    if (!ticketPurchase) return { oneWay: "0.00", roundTrip: "0.00", stopName: null };
    
    const route = routes.find(r => r.id === ticketPurchase.routeId);
    if (!route) return { oneWay: "0.00", roundTrip: "0.00", stopName: null };
    
    if (ticketPurchase.closestStopId) {
      const stop = route.stops?.find(s => s.id === ticketPurchase.closestStopId);
      if (stop) {
        return {
          oneWay: stop.effective_price_one_way || route.price_one_way || "0.00",
          roundTrip: stop.effective_price_round_trip || route.price_round_trip || "0.00",
          stopName: stop.name
        };
      }
    }
    
    return {
      oneWay: route.price_one_way || "0.00",
      roundTrip: route.price_round_trip || "0.00",
      stopName: null
    };
  };

  const handleBuyTicket = (route: Route, service?: Service) => {
    // Initial state
    setTicketPurchase({
      routeId: route.id,
      serviceId: service?.id,
      showPayment: true,
      step: "selection",
    })

    // Find closest stop asynchronously
    if (navigator.geolocation && route.stops && route.stops.length > 0) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        let closestStopId: number | undefined;
        let minDistance = 1; // 1km threshold
        
        route.stops.forEach(stop => {
          const distance = getDistanceFromLatLonInKm(userLat, userLng, stop.latitude, stop.longitude);
          if (distance < minDistance) {
            minDistance = distance;
            closestStopId = stop.id;
          }
        });
        
        if (closestStopId) {
          setTicketPurchase(prev => prev ? { ...prev, closestStopId } : null);
        }
      });
    }
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
        const hasGPS = routeAny?.is_active && routeAny?.unit_lat && routeAny?.unit_lng
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
                {(() => {
                  const stops = trackedRoute?.stops || [];
                  const unitLat = routeAny.unit_lat;
                  const unitLng = routeAny.unit_lng;

                  // Función para calcular distancia (Haversine) en metros
                  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                    const R = 6371e3; // Radio de la tierra en metros
                    const p1 = lat1 * Math.PI/180;
                    const p2 = lat2 * Math.PI/180;
                    const dp = (lat2-lat1) * Math.PI/180;
                    const dl = (lon2-lon1) * Math.PI/180;
                    const a = Math.sin(dp/2) * Math.sin(dp/2) +
                              Math.cos(p1) * Math.cos(p2) *
                              Math.sin(dl/2) * Math.sin(dl/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    return R * c;
                  };

                  let closestStopOrder = -1;
                  let minDistance = Infinity;

                  if (hasGPS) {
                    stops.forEach(stop => {
                      const dist = getDistance(unitLat, unitLng, stop.latitude, stop.longitude);
                      if (dist < minDistance) {
                        minDistance = dist;
                        closestStopOrder = stop.order;
                      }
                    });
                  }

                  return stops.map((stop) => {
                    // Si el GPS está activo, evaluamos.
                    // Si está a < 50m de la parada actual, o si la parada es anterior a la más cercana, está "pasada"
                    let isPassed = false;
                    let isCurrent = false;

                    if (hasGPS) {
                      const dist = getDistance(unitLat, unitLng, stop.latitude, stop.longitude);
                      if (dist <= 10) {
                        isPassed = true; // Está justo en la parada o pasó hace poco (dentro de 10m)
                        isCurrent = true;
                      } else if (stop.order < closestStopOrder) {
                        isPassed = true; // Ya la pasó porque la más cercana es una posterior
                      }
                    }

                    return (
                      <div key={stop.order} className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-colors",
                        isPassed ? "bg-green-50 dark:bg-green-950/30" : "bg-muted/50"
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                          isPassed ? "bg-green-500 text-white" : "bg-primary/10 text-primary"
                        )}>
                          {isPassed ? "✓" : stop.order}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            isPassed ? "text-green-700 dark:text-green-400" : ""
                          )}>
                            {stop.name || `Parada ${stop.order}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isCurrent 
                              ? <span className="text-green-600 font-semibold">¡Autobús aquí! (A menos de 50m)</span>
                              : stop.minutes_from_start ? `~${stop.minutes_from_start} min desde el inicio` : ""
                            }
                          </p>
                        </div>
                      </div>
                    );
                  });
                })()}
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
                      {getTicketPrices().stopName && (
                        <p className="text-xs text-[#059669] bg-[#059669]/10 p-2 rounded-lg mb-2">
                          📍 Precio ajustado desde tu parada más cercana: <strong>{getTicketPrices().stopName}</strong>
                        </p>
                      )}
                        <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition">
                          <input type="radio" name="ticket" defaultChecked className="w-4 h-4" />
                          <div className="flex-1">
                            <p className="font-semibold text-sm">Boleto Sencillo</p>
                            <p className="text-xs text-muted-foreground">Ida a tu destino</p>
                          </div>
                          {/* PRECIO REAL IDA */}
                          <p className="font-bold">${getTicketPrices().oneWay}</p>
                        </label>

                        <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition">
                          <input type="radio" name="ticket" className="w-4 h-4" />
                          <div className="flex-1">
                            <p className="font-semibold text-sm">Boleto de Retorno</p>
                            <p className="text-xs text-muted-foreground">Ida y vuelta incluido</p>
                          </div>
                          {/* PRECIO REAL REDONDO */}
                          <p className="font-bold">${getTicketPrices().roundTrip}</p>
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

      <div className="px-4 py-4 border-b border-border bg-card">
        <p className="text-muted-foreground text-sm mb-4">Transporte seguro a tus servicios favoritos</p>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar por nombre o parada..." 
            className="pl-9 h-11 bg-white border-gray-200 rounded-full text-[15px]"
            value={routeSearchQuery}
            onChange={(e) => setRouteSearchQuery(e.target.value)}
          />
          {routeSearchQuery && (
            <button 
              onClick={() => setRouteSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Botón de Mapa Interactivo (Debajo del buscador, arriba de las rutas) */}
      <div className="px-4 pt-4">
        <div 
          onClick={() => {
            onNavigate?.("map-explorer")
          }}
          className={cn("group border rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-300", 
            returnToMapRoute ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:shadow-lg" : "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40 hover:shadow-md"
          )}
        >
          <div className="relative">
            {!returnToMapRoute && <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping opacity-75" style={{ animationDuration: '2s' }}></div>}
            <div className={cn("relative p-3 rounded-full flex-shrink-0 group-hover:-translate-y-1 transition-transform duration-300", returnToMapRoute ? "bg-white/20" : "bg-primary/20")}>
              {returnToMapRoute ? <ArrowLeft className="w-6 h-6 text-white drop-shadow-sm" /> : <MapPin className="w-6 h-6 text-primary drop-shadow-sm" />}
            </div>
          </div>
          <div className="flex-1">
            <h3 className={cn("font-bold text-base transition-colors duration-300", returnToMapRoute ? "text-white" : "text-foreground group-hover:text-primary")}>
              {returnToMapRoute ? `Volver a ${returnToMapRoute}` : "Ver rutas en mapa interactivo"}
            </h3>
            <p className={cn("text-sm leading-tight mt-0.5", returnToMapRoute ? "text-white/80" : "text-muted-foreground")}>
              {returnToMapRoute ? "Regresar a la vista detallada del mapa" : "Explora destinos y encuentra paradas cerca de ti."}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">

        {/* --- MI RUTA (rutas con boleto activo) --- */}
        {filteredRoutes.some((r: any) => r.user_has_ticket) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <h2 className="font-bold text-base">Mi Ruta</h2>
              <div className="flex-1 h-px bg-primary/20" />
            </div>
            {filteredRoutes.filter((r: any) => r.user_has_ticket).map((route) => (
              <RouteCardItem
                key={route.id} route={route}
                onTrack={handleStartTracking}
                onServices={handleViewServices}
                onBuy={handleBuyTicket}
              />
            ))}
          </div>
        )}

        {/* --- OTRAS RUTAS --- */}
        <div className="space-y-3">
          {filteredRoutes.some((r: any) => r.user_has_ticket) && (
            <div className="flex items-center gap-2">
              <span className="text-lg">🚌</span>
              <h2 className="font-bold text-base">Otras Rutas</h2>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}
          {filteredRoutes.filter((r: any) => !r.user_has_ticket).map((route) => (
            <RouteCardItem
              key={route.id} route={route}
              onTrack={handleStartTracking}
              onServices={handleViewServices}
              onBuy={handleBuyTicket}
            />
          ))}
          {filteredRoutes.length === 0 && (
            <div className="text-center py-8">
              <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No se encontraron rutas</p>
              <p className="text-xs text-muted-foreground mt-1">Intenta con otros términos de búsqueda</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Componente de tarjeta de ruta ───────────────────────────────────────────
function RouteCardItem({
  route,
  onTrack,
  onServices,
  onBuy,
}: {
  route: Route
  onTrack: (r: Route) => void
  onServices: (r: Route) => void
  onBuy: (r: Route) => void
}) {
  const r = route as any
  const hasGPS = r.is_active && r.unit_lat && r.unit_lng

  return (
    <div className={cn(
      "bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition",
      !route.is_active && "opacity-60",
      r.user_has_ticket && "ring-2 ring-primary/40"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn("text-lg font-bold", !route.is_active && "text-muted-foreground")}>
                {route.name}
              </h3>
              {r.user_has_ticket && (
                <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                  ⭐ Mi Ruta
                </span>
              )}
            </div>
          </div>
          <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs font-bold px-2.5 py-1 rounded-full border border-border shadow-sm shrink-0 ml-2">
            <Users className="w-3.5 h-3.5" />
            {route.unit_capacity || 0} PAX
          </span>
        </div>
            {/* Información del Chofer y Unidad */}
            <div className="mt-4 flex flex-col gap-4 p-4 bg-muted/10 rounded-xl border border-border/50 shadow-sm">
              
              {/* Chofer */}
              <div className="flex items-center gap-4">
                {route.driver_avatar ? (
                  <div className="relative shrink-0">
                     <img src={route.driver_avatar} alt="Chofer" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                     <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full" style={{ backgroundColor: route.colorHex, border: '2px solid white' }} />
                  </div>
                ) : (
                  <div className="relative shrink-0 w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-white shadow-sm">
                    <span className="text-sm font-bold text-muted-foreground uppercase">{route.driver_name ? route.driver_name.substring(0, 3) : 'DRV'}</span>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full" style={{ backgroundColor: route.colorHex, border: '2px solid white' }} />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Conductor
                  </span>
                  <span className="text-base font-semibold text-foreground leading-none">
                    {route.driver_name || 'Sin chofer'}
                  </span>
                </div>
              </div>

              <div className="h-px bg-border/40 w-full" />

              {/* Unidad */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Placa del Vehículo
                  </span>
                  <span className="text-xl font-black tracking-widest text-foreground leading-none">
                    {route.unit_license_plate ? route.unit_license_plate : 'SIN PLACA'}
                  </span>
                  <span className="text-sm text-muted-foreground mt-1.5">
                    {route.unit_name || 'Unidad'}
                  </span>
                </div>
                
                {route.unit_color && (
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Color del Vehículo
                    </span>
                    <div 
                      className="w-[50px] h-[50px] rounded-full shadow-md border border-black/10 mt-0.5"
                      title={route.unit_color}
                      style={{ 
                        backgroundColor: route.unit_color.startsWith('#') ? route.unit_color : (
                          {
                            'Blanco': '#ffffff',
                            'Negro': '#111111',
                            'Gris': '#808080',
                            'Plata': '#c0c0c0',
                            'Azul': '#3b82f6',
                            'Rojo': '#ef4444',
                            'Verde': '#22c55e',
                            'Amarillo': '#eab308',
                            'Naranja': '#f97316',
                            'Beige': '#f5f5dc',
                            'Marrón': '#8b4513'
                          }[route.unit_color] || '#cccccc'
                        )
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="bg-muted p-2 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Paradas</p>
            <p className="font-bold text-sm">{route.stops.length}</p>
          </div>
          <div className="bg-muted p-2 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">GPS</p>
            <p className={cn("font-bold text-sm", hasGPS ? "text-green-600" : "text-muted-foreground")}>
              {hasGPS ? "En vivo ●" : "Sin señal"}
            </p>
          </div>
        </div>
      </div>

      {/* Paradas */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold mb-2">Paradas de esta ruta:</p>
        <div className="space-y-2">
          {route.stops.map((stop, idx) => (
            <div key={idx} className="flex items-center gap-3 text-sm">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex-shrink-0">
                {stop.order}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{stop.name || `Parada ${stop.order}`}</p>
                <p className="text-xs text-muted-foreground">{stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mapa */}
      <div className="p-4 h-56 border-b border-border">
        <div className="h-full w-full rounded-xl overflow-hidden border border-border">
          <MapPreview
            stops={route.stops}
            unitLocation={hasGPS ? { lat: r.unit_lat, lng: r.unit_lng } : undefined}
          />
        </div>
      </div>

      {/* Botones */}
      <div className="p-4 flex gap-2">
        <Button onClick={() => onTrack(route)} variant="outline" className="flex-1 gap-2 bg-transparent">
          <Navigation2 size={16} /> Rastrear
        </Button>
        <Button onClick={() => onServices(route)} className="flex-1 bg-primary">
          Ver Servicios
        </Button>
      </div>
      <div className="px-4 pb-4">
        <Button
          onClick={() => onBuy(route)}
          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
        >
          <Ticket size={16} /> Comprar Boleto
        </Button>
      </div>
    </div>
  )
}
