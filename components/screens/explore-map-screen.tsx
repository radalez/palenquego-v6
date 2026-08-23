"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { GoogleMap, useJsApiLoader, Marker, Polyline, OverlayView } from '@react-google-maps/api'
import {
  Search, MapPin, Navigation2, SlidersHorizontal, ChevronLeft,
  LayoutGrid, ChevronUp, X, Bookmark, Clock, Share2
} from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import * as LucideIcons from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAppStore, fetchWithAuth } from "@/lib/store"

const containerStyle = { width: '100%', height: '100%' }
const API_BASE = "/api-proxy"

type ViewState = 'map' | 'list' | 'detail'

interface ExploreMapScreenProps {
  onBack: () => void
  onNavigate: (tab: string) => void
}

const DynamicIcon = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.MapPin
  return <IconComponent className={className} style={style} />
}

const MAP_STYLES = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#A8D8F8" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#E8F5E9" }] },
]

export function ExploreMapScreen({ onBack, onNavigate }: ExploreMapScreenProps) {
  const [view, setView] = useState<ViewState>('map')
  const [categories, setCategories] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null)
  const [isSheetExpanded, setIsSheetExpanded] = useState(true)
  const [locationAlert, setLocationAlert] = useState<{ type: 'near' | 'far', distance: number, route: any } | null>(null)

  // Función para calcular distancia (Haversine formula)
  const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const token = useAppStore((state) => state.accessToken)
  const mapRef = useRef<google.maps.Map | null>(null)


  const getApiBase = () => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:8000/api/v1'
    }
    return API_BASE
  }

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  useEffect(() => {
    if (mapRef.current && routes.length > 0 && isLoaded) {
      const bounds = new window.google.maps.LatLngBounds()
      let hasValidStops = false
      routes.forEach(route => {
        if (route.stops?.length) {
          bounds.extend({ lat: route.stops[0].latitude, lng: route.stops[0].longitude })
          hasValidStops = true
        }
      })
      if (hasValidStops) {
        mapRef.current.fitBounds(bounds, { top: 120, bottom: 80, left: 40, right: 40 })
      }
    }
  }, [routes, isLoaded, view])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetchWithAuth(`${getApiBase()}/transport/categories/`)
        if (res.ok) setCategories(await res.json())
      } catch (err) { console.error("Error fetching categories:", err) }
    }
    fetchCategories()
  }, [token])

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        let url = `${getApiBase()}/transport/routes/`
        if (activeCategory) url += `?category=${activeCategory}`
        const res = await fetchWithAuth(url)
        if (res.ok) {
          const data = await res.json()
          setRoutes(data)
          
          // Restaurar la ruta si venimos de la pantalla clásica
          const returnRouteName = useAppStore.getState().returnToMapRoute;
          if (returnRouteName) {
            const found = data.find((r: any) => r.name === returnRouteName);
            if (found) {
              setSelectedRoute(found);
              setView('detail');
            }
            // Limpiamos el estado para que no se vuelva a abrir automáticamente en el futuro
            useAppStore.getState().setReturnToMapRoute(null);
          }
        }
      } catch (err) { console.error("Error fetching routes:", err) }
    }
    fetchRoutes()
  }, [token, activeCategory])

  // Filtrado local por nombre y parada
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routes
    const q = searchQuery.toLowerCase()
    return routes.filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.stops?.some((s: any) => s.name?.toLowerCase().includes(q))
    )
  }, [routes, searchQuery])

  const pathCoordinates = useMemo(() =>
    selectedRoute?.stops?.map((s: any) => ({ lat: s.latitude, lng: s.longitude })) || []
  , [selectedRoute])

  const mapCenter = useMemo(() => {
    if (selectedRoute && pathCoordinates.length > 0) {
      return pathCoordinates[Math.floor(pathCoordinates.length / 2)]
    }
    return { lat: 13.6893, lng: -89.1872 }
  }, [selectedRoute, pathCoordinates])

  const catColor = selectedRoute?.category?.color || '#059669'
  const catIcon  = selectedRoute?.category?.icon  || 'MapPin'

  // ─────────────────────────────────────────────
  // PANTALLA 1 — MAPA
  // ─────────────────────────────────────────────
  if (view === 'map') {
    return (
      <div className="relative w-full h-full flex flex-col bg-background overflow-hidden">

        {/* HEADER VERDE */}
        <div className="relative z-20 bg-[#0B1F15] w-full pt-6 pb-14 px-4 rounded-b-[32px] shadow-lg">
          <div className="flex items-center justify-between text-white">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 shrink-0" onClick={onBack}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-base font-bold flex-1 text-center">
              Explora <span className="text-[#4ade80]">El Salvador</span>
            </h1>
            <Button
              variant="ghost" size="icon"
              className="text-white hover:bg-white/10 shrink-0"
              onClick={() => setView('list')}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* BARRA DE CATEGORÍAS */}
        <div className="absolute top-[80px] left-0 right-0 z-30 px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 transition-all duration-300">
            
            {/* Vista 1: Scroll Horizontal */}
            {!categoryPanelOpen && (
              <div className="flex items-center gap-1 animate-in fade-in duration-200">
                {/* Botón Todas (Abre Modal) */}
                <button
                  onClick={() => { setCategoryPanelOpen(true); setActiveCategory(null) }}
                  className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all shrink-0 ${
                    activeCategory === null ? 'bg-gray-100 border border-gray-200 shadow-sm' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-full ${activeCategory === null ? 'text-[#0B1F15]' : 'text-gray-500'}`}>
                    <LayoutGrid className="h-6 w-6" />
                  </div>
                  <span className={`text-[10px] font-medium ${activeCategory === null ? 'text-[#0B1F15]' : 'text-gray-500'}`}>
                    Todas
                  </span>
                </button>

                <div className="w-px h-10 bg-gray-100 shrink-0" />

                {/* Scroll horizontal */}
                <div className="flex-1 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-2 px-1" style={{ width: 'max-content' }}>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { setActiveCategory(cat.slug); setCategoryPanelOpen(false) }}
                        className={`flex flex-col items-center gap-1 min-w-[62px] p-2 rounded-xl transition-all ${
                          activeCategory === cat.slug ? 'bg-gray-100 border border-gray-200 shadow-sm' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="p-1.5 rounded-full" style={{ color: activeCategory === cat.slug ? (cat.color || '#0B1F15') : '#6B7280' }}>
                          <DynamicIcon name={cat.icon || 'MapPin'} className="h-6 w-6" />
                        </div>
                        <span className={`text-[10px] font-medium text-center leading-tight ${activeCategory === cat.slug ? 'text-[#0B1F15]' : 'text-gray-500'}`}>
                          {cat.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Vista 2: Grilla Expandible */}
            {categoryPanelOpen && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200 p-1">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {/* Botón Todas (Cierra Modal) integrado en la grilla */}
                  <button
                    onClick={() => { setCategoryPanelOpen(false); setActiveCategory(null) }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all"
                    style={activeCategory === null ? {
                      backgroundColor: '#05966915',
                      borderWidth: 1.5, borderStyle: 'solid', borderColor: '#059669',
                    } : {}}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#05966920' }}>
                      <ChevronUp className="h-5 w-5" style={{ color: '#059669' }} />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-700 text-center leading-tight">Ocultar Todas</span>
                  </button>

                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setActiveCategory(cat.slug); setCategoryPanelOpen(false) }}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all"
                      style={activeCategory === cat.slug ? {
                        backgroundColor: (cat.color || '#059669') + '15',
                        borderWidth: 1.5, borderStyle: 'solid', borderColor: cat.color || '#059669',
                      } : {}}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: (cat.color || '#059669') + '20' }}>
                        <DynamicIcon name={cat.icon || 'MapPin'} className="h-5 w-5" style={{ color: cat.color || '#059669' }} />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-700 text-center leading-tight">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MAPA */}
        <div className="absolute inset-0 z-0 pt-[80px]">
          {isLoaded ? (
            <GoogleMap mapContainerStyle={containerStyle} center={{ lat: 13.6893, lng: -89.1872 }} zoom={9}
              options={{ disableDefaultUI: true, zoomControl: false, styles: MAP_STYLES }}
              onLoad={(map) => { mapRef.current = map }}
            >
              {routes.map((route, idx) => {
                if (!route.stops?.length) return null
                const rColor = route.category?.color || '#059669'
                const rIcon  = route.category?.icon  || 'MapPin'
                const pos    = { lat: route.stops[0].latitude, lng: route.stops[0].longitude }
                
                // Desplazamiento visual para evitar que pines en la misma ciudad se tapen entre sí
                const offsetX = (idx % 3) * 20 - 20; 
                const offsetY = Math.floor(idx / 3) * 20 - 20;

                return (
                  <OverlayView key={route.id} position={pos} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                    <div className="absolute -translate-x-1/2 -translate-y-full cursor-pointer transition-transform hover:scale-110 hover:z-50 z-10"
                      style={{ marginLeft: `${offsetX}px`, marginTop: `${offsetY}px` }}
                      onClick={() => { setSelectedRoute(route); setView('detail') }}>
                      <div className="flex items-center gap-1 bg-white rounded-full p-1 pr-3 shadow-lg border border-gray-100">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: rColor }}>
                          <DynamicIcon name={rIcon} className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-gray-800 whitespace-nowrap">{route.name}</span>
                      </div>
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white absolute left-1/2 -translate-x-1/2" />
                    </div>
                  </OverlayView>
                )
              })}
            </GoogleMap>
          ) : (
            <div className="w-full h-full bg-[#E8F5E9] animate-pulse flex items-center justify-center text-gray-500 text-sm">
              Cargando mapa...
            </div>
          )}
        </div>

        {/* Location Alert */}
        {locationAlert && (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-4 border border-gray-100 flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
              <div className="bg-[#059669]/10 p-2.5 rounded-full text-[#059669] flex-shrink-0">
                 <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900">
                  {locationAlert.type === 'near' ? 'Ruta cerca de ti' : 'Estás un poco lejos'}
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {locationAlert.type === 'near' 
                    ? `La ruta "${locationAlert.route.name}" está a solo ${locationAlert.distance.toFixed(1)}km. ¿Quieres explorarla?`
                    : `No hay rutas cerca de tu zona. La más cercana es "${locationAlert.route.name}" a ${locationAlert.distance.toFixed(0)}km.`}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    className="flex-1 bg-[#059669] hover:bg-[#047857] text-white rounded-xl h-9 text-xs font-semibold"
                    onClick={() => {
                      if (mapRef.current && locationAlert.route.stops?.length > 0) {
                        mapRef.current.panTo({
                          lat: locationAlert.route.stops[0].latitude,
                          lng: locationAlert.route.stops[0].longitude
                        });
                        mapRef.current.setZoom(13);
                      }
                      setSelectedRoute(locationAlert.route);
                      setView('detail');
                      setLocationAlert(null);
                    }}
                  >
                     {locationAlert.type === 'near' ? 'Ver ruta' : 'Llévame allí'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-9 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl"
                    onClick={() => setLocationAlert(null)}
                  >
                    Ignorar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Badge */}
        <div className="absolute bottom-6 left-4 z-10">
          <div className="bg-[#0B1F15] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3">
            <DynamicIcon name="Sparkles" className="h-5 w-5 text-[#4ade80]" />
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-none">{routes.length}</span>
              <span className="text-[10px] text-gray-300">Rutas disponibles</span>
            </div>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-2">
          <Button 
            variant="secondary" 
            size="icon" 
            className="bg-white rounded-full shadow-lg h-12 w-12 text-gray-600"
            onClick={() => {
              if (navigator.geolocation && mapRef.current) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    mapRef.current?.panTo({ lat, lng });
                    mapRef.current?.setZoom(14);

                    // Buscar la ruta más cercana
                    if (filteredRoutes.length > 0) {
                      let closestRoute: any = null;
                      let minDistance = Infinity;

                      filteredRoutes.forEach(route => {
                        if (route.stops && route.stops.length > 0) {
                          const stopLat = route.stops[0].latitude;
                          const stopLng = route.stops[0].longitude;
                          const dist = getDistanceInKm(lat, lng, stopLat, stopLng);
                          if (dist < minDistance) {
                            minDistance = dist;
                            closestRoute = route;
                          }
                        }
                      });

                      if (closestRoute) {
                        if (minDistance <= 1) {
                          // OPCIÓN 2: Auto-abrir si está muy cerca (< 1km)
                          mapRef.current?.panTo({
                            lat: closestRoute.stops[0].latitude,
                            lng: closestRoute.stops[0].longitude
                          });
                          mapRef.current?.setZoom(15);
                          setSelectedRoute(closestRoute);
                          setView('detail');
                        } else if (minDistance <= 10) {
                          // OPCIÓN 1: Preguntar si quiere verla si está a menos de 10km
                          setLocationAlert({ type: 'near', distance: minDistance, route: closestRoute });
                          setTimeout(() => setLocationAlert(null), 10000);
                        } else {
                          // OPCIÓN 3: Lejos, ofrecer llevarlo
                          setLocationAlert({ type: 'far', distance: minDistance, route: closestRoute });
                          setTimeout(() => setLocationAlert(null), 10000);
                        }
                      }
                    }
                  },
                  (error) => console.error("Error getting location:", error)
                );
              }
            }}
          >
            <Navigation2 className="h-5 w-5" />
          </Button>
          <div className="bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-none h-12 w-12 text-gray-600 border-b border-gray-100"
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.setZoom((mapRef.current.getZoom() || 9) + 1)
                }
              }}
            >
              <span className="text-xl font-light">+</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-none h-12 w-12 text-gray-600"
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.setZoom((mapRef.current.getZoom() || 9) - 1)
                }
              }}
            >
              <span className="text-xl font-light">−</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // PANTALLA 2 — LISTA DE RUTAS
  // ─────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="w-full h-full flex flex-col bg-[#0B1F15]">

        {/* Header */}
        <div className="px-4 pt-12 pb-4 shrink-0">
          <div className="flex items-start gap-3 text-white mb-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 shrink-0 mt-0.5" onClick={() => setView('map')}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Explora <span className="text-[#4ade80]">El Salvador</span></h1>
              <p className="text-xs text-gray-400">Elige tu ruta y comienza la aventura</p>
            </div>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Buscar rutas o paradas..."
              className="w-full bg-white/10 border-none text-white placeholder:text-gray-400 rounded-2xl h-12 pl-12 pr-12 focus-visible:ring-1 focus-visible:ring-[#4ade80]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" onClick={() => setSearchQuery('')}>
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-3">
          {filteredRoutes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <MapPin className="h-14 w-14 mb-4 opacity-20" />
              <p className="text-sm font-medium">No se encontraron rutas</p>
              <p className="text-xs text-gray-600 mt-1">Intenta otro nombre o parada</p>
            </div>
          ) : (
            filteredRoutes.map(route => {
              const rColor = route.category?.color || '#059669'
              const rIcon  = route.category?.icon  || 'MapPin'
              return (
                <button
                  key={route.id}
                  onClick={() => { setSelectedRoute(route); setView('detail') }}
                  className="w-full bg-white/10 hover:bg-white/15 active:scale-[0.98] transition-all rounded-2xl p-4 flex items-center gap-4 text-left border border-white/10"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md" style={{ backgroundColor: rColor }}>
                    <DynamicIcon name={rIcon} className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm leading-tight">{route.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                      {route.category?.name || 'Ruta turística'}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <MapPin className="h-3 w-3 text-[#4ade80]" />
                      <span className="text-[10px] text-gray-400">{route.stops?.length || 0} paradas</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <ChevronLeft className="h-4 w-4 text-white rotate-180" />
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // PANTALLA 3 — DETALLE DE RUTA
  // ─────────────────────────────────────────────
  return (
    <div className="relative w-full h-full flex flex-col bg-background overflow-hidden">

      {/* MAPA — fondo completo */}
      <div className="absolute inset-0 z-0">
        {isLoaded && selectedRoute ? (
          <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={10}
            options={{ disableDefaultUI: true, zoomControl: false, styles: MAP_STYLES }}
          >
            <Polyline path={pathCoordinates} options={{ strokeColor: catColor, strokeOpacity: 0.9, strokeWeight: 5 }} />
            {selectedRoute.stops?.map((stop: any, idx: number) => (
              <Marker
                key={stop.id || idx}
                position={{ lat: stop.latitude, lng: stop.longitude }}
                label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold', fontSize: '12px' }}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: catColor,
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: 'white',
                  scale: 14,
                }}
              />
            ))}
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-[#E8F5E9] animate-pulse" />
        )}
      </div>

      {/* HEADER OVERLAY sobre el mapa */}
      <div className="relative z-20 bg-[#0B1F15] px-4 pt-12 pb-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 shrink-0" onClick={() => setView('list')}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md shrink-0" style={{ backgroundColor: catColor }}>
            <DynamicIcon name={catIcon} className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-bold text-base leading-tight truncate">{selectedRoute?.name}</h2>
            <p className="text-gray-400 text-xs">{selectedRoute?.category?.name || 'Ruta turística'}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 shrink-0">
          <Bookmark className="h-5 w-5" />
        </Button>
      </div>

      {/* STATS BAR */}
      <div className="relative z-20 mx-4 mt-2 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center justify-around">
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-gray-900">{selectedRoute?.stops?.length || 0}</span>
          <span className="text-[10px] text-gray-500">Paradas</span>
        </div>
        <div className="w-px h-8 bg-gray-100" />
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-gray-900">
            {selectedRoute?.price_one_way ? `$${selectedRoute.price_one_way}` : '—'}
          </span>
          <span className="text-[10px] text-gray-500">Por persona</span>
        </div>
        <div className="w-px h-8 bg-gray-100" />
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-gray-900">
            {selectedRoute?.stops?.length > 1
              ? `${(selectedRoute.stops.length - 1) * 20} min`
              : '—'}
          </span>
          <span className="text-[10px] text-gray-500">Estimado</span>
        </div>
      </div>

      {/* BOTTOM SHEET — lista de paradas + botones */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex flex-col transition-all duration-300" 
        style={{ maxHeight: isSheetExpanded ? '55vh' : 'auto' }}
      >
        <div 
          className="w-full pt-3 pb-4 cursor-pointer flex justify-center items-center flex-col gap-1"
          onClick={() => setIsSheetExpanded(!isSheetExpanded)}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full shrink-0" />
          {!isSheetExpanded && <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">Ver detalles</span>}
        </div>

        {isSheetExpanded && (
          <>
            <div className="flex-1 overflow-y-auto px-5 pb-2 min-h-0">
              <div className="relative flex flex-col">
            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-200 z-0" />
            {selectedRoute?.stops?.map((stop: any, idx: number) => (
              <div key={stop.id || idx} className="relative z-10 flex gap-4 items-start py-3 bg-white">
                <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md" style={{ backgroundColor: catColor }}>
                  {idx + 1}
                </div>
                <div className="flex-1 flex justify-between items-start">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-gray-900 text-sm leading-tight">{stop.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {idx === 0 ? 'Punto de inicio de la ruta' : (stop.description || `Parada ${idx + 1}`)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 shrink-0">
                    <Clock className="h-3 w-3" />
                    <span className="text-[10px]">
                      {stop.minutes_from_start != null
                        ? `${stop.minutes_from_start} min`
                        : idx === 0 ? '0 min' : `${idx * 20} min`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

            {/* Botones */}
            <div className="px-5 py-4 pb-6 sm:pb-4 border-t border-gray-100 flex gap-3 shrink-0 bg-white">
              <Button
                className="flex-1 rounded-2xl h-14 bg-[#059669] hover:bg-[#047857] text-white font-bold text-base shadow-lg"
                onClick={() => {
                  if (selectedRoute) {
                    useAppStore.getState().setRouteSearchQuery(selectedRoute.name);
                    useAppStore.getState().setReturnToMapRoute(selectedRoute.name);
                  }
                  onNavigate('rutas-classic')
                }}
              >
                <Navigation2 className="mr-2 h-5 w-5" />
                Iniciar ruta
              </Button>
              <Button variant="outline" size="icon" className="w-14 h-14 rounded-2xl bg-gray-100 hover:bg-gray-200 border-transparent text-gray-700 transition-colors">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
