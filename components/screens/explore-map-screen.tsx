"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { GoogleMap, useJsApiLoader, Marker, Polyline, OverlayView } from '@react-google-maps/api'
import {
  Search, MapPin, Navigation2, SlidersHorizontal, ChevronLeft, ChevronRight,
  LayoutGrid, ChevronUp, X, Bookmark, Clock, Share2,
  ArrowUpDown, Calendar, Users, Bus, Building2, Camera, ChevronDown,
  Map, Filter, Palmtree, Utensils, Home, Landmark, Leaf, Sparkles
} from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import * as LucideIcons from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAppStore, fetchWithAuth } from "@/lib/store"

const containerStyle = { width: '100%', height: '100%' }
const API_BASE = "/api-proxy"

type ViewState = 'map' | 'list' | 'detail'

const PROMO_SLIDES = [
  {
    id: 1,
    title: "¿Buscas una experiencia?",
    subtitle: "Descubre tours y lugares mágicos de El Salvador.",
    tag: "Tours y Destinos",
    category: "TOUR",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80"
  },
  {
    id: 2,
    title: "Costa del Bálsamo & Surf",
    subtitle: "Rutas exprés hacia El Tunco, El Zonte y Punta Roca.",
    tag: "Playas",
    category: "TOUR",
    image: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1000&q=80"
  },
  {
    id: 3,
    title: "Ruta de las Flores & Volcanes",
    subtitle: "Café de altura, gastronomía típica y pueblos coloniales.",
    tag: "Aventura y Naturaleza",
    category: "TOUR",
    image: "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1000&q=80"
  }
]

const DEFAULT_TOUR_CATEGORIES = [
  { id: 'cat-playa', name: 'Playa', slug: 'playa', icon: 'Palmtree' },
  { id: 'cat-gastro', name: 'Gastronomía', slug: 'gastronomia', icon: 'Utensils' },
  { id: 'cat-pueblos', name: 'Pueblos', slug: 'pueblos', icon: 'Home' },
  { id: 'cat-historia', name: 'Historia', slug: 'historia', icon: 'Landmark' },
  { id: 'cat-naturaleza', name: 'Naturaleza', slug: 'naturaleza', icon: 'Leaf' },
]

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
  const [closestRoutesMenu, setClosestRoutesMenu] = useState<{ city: string, routes: any[] } | null>(null)
  const [locationAlert, setLocationAlert] = useState<{ type: 'near' | 'far', distance: number, route: any, city: string, topRoutes: any[] } | null>(null)

  // Estados de Super Categorías y Modo de Cabecera
  const currentUser = useAppStore((state) => state.currentUser)
  const [superCategory, setSuperCategory] = useState<'INTERURBANO' | 'URBANO' | 'TOUR'>('INTERURBANO')
  const [headerMode, setHeaderMode] = useState<'search' | 'categories'>('search')
  const [origin, setOrigin] = useState("San Salvador")
  const [destination, setDestination] = useState("")
  const [showPromoBanner, setShowPromoBanner] = useState(true)
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0)

  // Estados para Modal de Filtros (media_1791123281831.jpg)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [filterService, setFilterService] = useState<'todos' | 'directo' | 'con_paradas'>('todos')
  const [filterTime, setFilterTime] = useState<'cualquiera' | 'manana' | 'tarde' | 'noche'>('cualquiera')
  const [filterLine, setFilterLine] = useState('todas')

  // Rotación del carrusel de banners
  useEffect(() => {
    if (!showPromoBanner) return
    const timer = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % PROMO_SLIDES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [showPromoBanner])

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
        const params = new URLSearchParams()
        if (superCategory) params.append('route_type', superCategory)
        if (activeCategory) params.append('category', activeCategory)
        const qs = params.toString()
        if (qs) url += `?${qs}`

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
            useAppStore.getState().setReturnToMapRoute(null);
          }
        }
      } catch (err) { console.error("Error fetching routes:", err) }
    }
    fetchRoutes()
  }, [token, superCategory, activeCategory])

  // Filtrado local por super-categoría, categoría, destino y búsqueda
  const filteredRoutes = useMemo(() => {
    let result = routes

    if (superCategory) {
      result = result.filter(r => {
        if (!r.route_type) return true
        return r.route_type.toUpperCase() === superCategory
      })
    }

    if (activeCategory) {
      result = result.filter(r => r.category?.slug === activeCategory)
    }

    if (filterService === 'directo') {
      result = result.filter(r => !r.stops || r.stops.length <= 2)
    } else if (filterService === 'con_paradas') {
      result = result.filter(r => r.stops && r.stops.length > 2)
    }

    if (filterLine !== 'todas') {
      result = result.filter(r => r.company_name === filterLine || r.unit?.plate_number === filterLine)
    }

    if (destination.trim()) {
      const dest = destination.toLowerCase()
      result = result.filter(r =>
        r.name?.toLowerCase().includes(dest) ||
        r.stops?.some((s: any) => s.name?.toLowerCase().includes(dest))
      )
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.stops?.some((s: any) => s.name?.toLowerCase().includes(q))
      )
    }

    return result
  }, [routes, superCategory, activeCategory, filterService, filterLine, destination, searchQuery])

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
  // ─────────────────────────────────────────────
  // PANTALLA 1 — MAPA
  // ─────────────────────────────────────────────
  if (view === 'map') {
    return (
      <div className="relative w-full h-full flex flex-col bg-background overflow-hidden">

        {/* HEADER PRINCIPAL VERDE / SELVA */}
        <div className="relative z-30 bg-[#063b27] bg-gradient-to-b from-[#04281a] via-[#064e3b] to-[#043324] w-full pt-4 pb-4 px-4 shadow-xl shrink-0 rounded-b-[28px]">
          {/* Fila superior: Logo y Avatar */}
          <div className="flex items-center justify-between text-white mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shadow-xs">
                <Navigation2 className="h-4 w-4 text-[#a3e635] rotate-45" />
              </div>
              <span className="text-lg font-black tracking-tight text-white flex items-center">
                Palenque<span className="text-[#a3e635]">Go</span>
              </span>
            </div>

            <button 
              onClick={() => onNavigate('profile')} 
              className="w-8 h-8 rounded-full bg-amber-700/80 border border-amber-500/40 flex items-center justify-center text-xs font-bold text-white shadow-sm hover:scale-105 transition-transform overflow-hidden"
              title="Mi Perfil"
            >
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                currentUser?.name?.[0]?.toUpperCase() || 'M'
              )}
            </button>
          </div>

          {/* Saludo y Pregunta */}
          <div className="mb-3">
            <h1 className="text-xl font-black text-white leading-tight">
              ¿A dónde <span className="text-[#a3e635]">vamos?</span>
            </h1>
            <p className="text-xs text-white/75 mt-0.5 font-medium">
              Tu próxima ruta empieza aquí.
            </p>
          </div>

          {/* BARRA DE LAS 3 SUPER CATEGORÍAS + BOTÓN FLECHITA */}
          <div className="bg-white rounded-2xl shadow-md p-1.5 flex items-center justify-between gap-1 border border-gray-100">
            {/* 1. Interurbano */}
            <button
              type="button"
              onClick={() => setSuperCategory('INTERURBANO')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                superCategory === 'INTERURBANO'
                  ? 'bg-[#dcfce7] text-[#064e3b] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Bus className="h-3.5 w-3.5" />
              <span className="text-[11px]">Interurbano</span>
            </button>

            {/* 2. Urbano */}
            <button
              type="button"
              onClick={() => setSuperCategory('URBANO')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                superCategory === 'URBANO'
                  ? 'bg-[#dcfce7] text-[#064e3b] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span className="text-[11px]">Urbano</span>
            </button>

            {/* 3. BOTÓN FLECHITA CIRCULAR (Alterna entre Buscador y Categorías) */}
            <button
              type="button"
              onClick={() => setHeaderMode(prev => prev === 'search' ? 'categories' : 'search')}
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                headerMode === 'categories' 
                  ? 'bg-[#a3e635] text-[#064e3b] shadow-sm rotate-180' 
                  : 'bg-[#dcfce7] text-[#064e3b] hover:bg-emerald-200 shadow-xs'
              }`}
              title={headerMode === 'search' ? 'Ver categorías' : 'Ver buscador'}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {/* 4. Tours */}
            <button
              type="button"
              onClick={() => setSuperCategory('TOUR')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                superCategory === 'TOUR'
                  ? 'bg-[#dcfce7] text-[#064e3b] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              <span className="text-[11px]">Tours</span>
            </button>
          </div>

          {/* CONTENIDO INTERCAMBIABLE: MODO A (BUSCADOR) vs MODO B (CATEGORÍAS) */}
          {headerMode === 'search' ? (
            /* MODO A: TARJETA DE BÚSQUEDA Y RESERVA */
            <div className="bg-white rounded-2xl shadow-xl mt-2.5 p-3.5 border border-gray-100 animate-in fade-in duration-200">
              {/* Origen y Destino */}
              <div className="relative flex items-center">
                <div className="flex-1 space-y-2">
                  {/* Origen */}
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-[#059669] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block leading-none">Origen</span>
                      <input 
                        type="text" 
                        value={origin} 
                        onChange={(e) => setOrigin(e.target.value)}
                        className="text-xs font-bold text-gray-900 bg-transparent w-full border-none p-0 focus:ring-0 focus:outline-none"
                        placeholder="San Salvador"
                      />
                    </div>
                  </div>

                  <div className="h-px bg-gray-100 ml-6" />

                  {/* Destino */}
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block leading-none">Destino</span>
                      <input 
                        type="text" 
                        value={destination} 
                        onChange={(e) => setDestination(e.target.value)}
                        className="text-xs font-semibold text-gray-800 bg-transparent w-full border-none p-0 focus:ring-0 focus:outline-none placeholder:text-gray-400"
                        placeholder="¿A dónde quieres ir?"
                      />
                    </div>
                  </div>
                </div>

                {/* Botón Swap / Invertir Origen y Destino */}
                <button
                  type="button"
                  onClick={() => {
                    const temp = origin;
                    setOrigin(destination || "San Salvador");
                    setDestination(temp);
                  }}
                  className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 shadow-sm ml-2 active:scale-95 transition-transform shrink-0"
                  title="Intercambiar origen y destino"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Fila Fecha y Pasajeros */}
              <div className="flex items-center justify-between border-t border-gray-100 mt-2.5 pt-2.5 text-xs text-gray-700">
                <button type="button" className="flex items-center gap-1.5 font-bold hover:text-gray-900">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  <span>Hoy</span>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>

                <div className="h-4 w-px bg-gray-200" />

                <button type="button" className="flex items-center gap-1.5 font-bold hover:text-gray-900">
                  <Users className="h-3.5 w-3.5 text-gray-500" />
                  <span>1 pasajero</span>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>
              </div>

              {/* Botón Buscar Rutas */}
              <Button
                onClick={() => {
                  if (filteredRoutes.length > 0 && mapRef.current) {
                    const r = filteredRoutes[0];
                    if (r.stops?.length) {
                      mapRef.current.panTo({ lat: r.stops[0].latitude, lng: r.stops[0].longitude });
                      mapRef.current.setZoom(12);
                    }
                  } else {
                    setView('list');
                  }
                }}
                className="w-full mt-3 h-10 rounded-xl bg-[#064e3b] hover:bg-[#043324] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all"
              >
                <Search className="h-3.5 w-3.5" />
                Buscar rutas
              </Button>
            </div>
          ) : (
            /* MODO B: FILTRO DE CATEGORÍAS TEMÁTICAS (PLAYAS, PUEBLOS, HISTORIA, ETC) */
            <div className="bg-white rounded-2xl shadow-xl mt-2.5 p-2 border border-gray-100 animate-in fade-in duration-200">
              <div className="flex items-center gap-1">
                {/* Todas */}
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className={`flex flex-col items-center gap-1 min-w-[56px] p-2 rounded-xl transition-all shrink-0 ${
                    activeCategory === null ? 'bg-emerald-50 text-[#064e3b] border border-emerald-200 font-bold' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="text-[10px] font-bold">Todas</span>
                </button>

                <div className="w-px h-8 bg-gray-200 shrink-0" />

                {/* Categorías dinámicas en scroll */}
                <div className="flex-1 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-1.5 px-1" style={{ width: 'max-content' }}>
                    {(categories.length > 0 ? categories : DEFAULT_TOUR_CATEGORIES).map(cat => (
                      <button
                        key={cat.id || cat.slug}
                        type="button"
                        onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}
                        className={`flex flex-col items-center gap-1 min-w-[58px] p-2 rounded-xl transition-all ${
                          activeCategory === cat.slug 
                            ? 'bg-emerald-50 text-[#064e3b] border border-emerald-200 font-bold' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <DynamicIcon name={cat.icon || 'MapPin'} className="h-4 w-4" style={{ color: activeCategory === cat.slug ? '#059669' : '#6b7280' }} />
                        <span className="text-[10px] text-center leading-tight truncate max-w-[55px]">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MAPA PRINCIPAL (OCUPA EL ESPACIO RESTANTE Y SE ADAPTA AL 100%) */}
        <div className="relative flex-1 w-full overflow-hidden z-0">
          {isLoaded ? (
            <GoogleMap 
              mapContainerStyle={containerStyle} 
              center={mapCenter} 
              zoom={9}
              options={{ disableDefaultUI: true, zoomControl: false, styles: MAP_STYLES }}
              onLoad={(map) => { mapRef.current = map }}
            >
              {filteredRoutes.map((route, idx) => {
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

          {/* Botón flotante para ver lista */}
          <div className="absolute top-3 right-3 z-10">
            <Button
              size="sm"
              onClick={() => setView('list')}
              className="bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs h-9 px-3 rounded-xl shadow-md border border-gray-200 flex items-center gap-1.5"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#059669]" />
              <span>Lista</span>
            </Button>
          </div>

          {/* Badge de rutas disponibles */}
          <div className="absolute bottom-4 left-3 z-10">
            <div className="bg-[#064e3b] text-white px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2">
              <DynamicIcon name="Sparkles" className="h-3.5 w-3.5 text-[#a3e635]" />
              <span className="text-xs font-bold">{filteredRoutes.length} rutas</span>
            </div>
          </div>

          {/* Location Alert */}
          {locationAlert && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-sm">
              <div className="bg-white rounded-2xl shadow-2xl p-4 border border-gray-100 flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
                <div className="bg-[#059669]/10 p-2.5 rounded-full text-[#059669] shrink-0">
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
                      onClick={() => {
                        setClosestRoutesMenu({ city: locationAlert.city, routes: locationAlert.topRoutes });
                        setLocationAlert(null);
                      }}
                    >
                      Ver más rutas
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Zoom & Geolocate controls DENTRO DEL MAPA */}
          <div className="absolute bottom-4 right-3 z-10 flex flex-col gap-2">
            <Button 
              variant="secondary" 
              size="icon" 
              className="bg-white rounded-full shadow-lg h-10 w-10 text-gray-700 hover:text-[#059669]"
              onClick={() => {
                if (navigator.geolocation && mapRef.current) {
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      const lat = position.coords.latitude;
                      const lng = position.coords.longitude;
                      
                      mapRef.current?.panTo({ lat, lng });
                      mapRef.current?.setZoom(14);

                      let cityName = "tu ubicación";
                      try {
                        const geocoder = new window.google.maps.Geocoder();
                        const res = await geocoder.geocode({ location: { lat, lng } });
                        if (res.results[0]) {
                          const addressComponents = res.results[0].address_components;
                          const locality = addressComponents.find((c: any) => c.types.includes('locality'));
                          const sublocality = addressComponents.find((c: any) => c.types.includes('sublocality'));
                          cityName = locality?.long_name || sublocality?.long_name || "tu ubicación";
                        }
                      } catch (e) { console.error("Geocoder failed", e); }

                      const routesWithDist = filteredRoutes.map(route => {
                        let dist = Infinity;
                        if (route.stops && route.stops.length > 0) {
                          dist = getDistanceInKm(lat, lng, route.stops[0].latitude, route.stops[0].longitude);
                        }
                        return { ...route, __dist: dist };
                      }).filter(r => r.__dist !== Infinity);

                      routesWithDist.sort((a, b) => a.__dist - b.__dist);
                      const topRoutes = routesWithDist.slice(0, 3);

                      if (topRoutes.length > 0) {
                        const closestRoute = topRoutes[0];
                        const minDistance = closestRoute.__dist;
                        
                        if (minDistance <= 10) {
                          setLocationAlert({ type: 'near', distance: minDistance, route: closestRoute, city: cityName, topRoutes });
                        } else {
                          setLocationAlert({ type: 'far', distance: minDistance, route: closestRoute, city: cityName, topRoutes });
                        }
                      }
                    },
                    (error) => console.error("Error getting location:", error)
                  );
                }
              }}
            >
              <Navigation2 className="h-4 w-4 text-[#059669]" />
            </Button>
            <div className="bg-white rounded-xl shadow-lg flex flex-col overflow-hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-none h-9 w-9 text-gray-700 border-b border-gray-100 font-bold text-base"
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.setZoom((mapRef.current.getZoom() || 9) + 1)
                  }
                }}
              >
                +
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-none h-9 w-9 text-gray-700 font-bold text-base"
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.setZoom((mapRef.current.getZoom() || 9) - 1)
                  }
                }}
              >
                −
              </Button>
            </div>
          </div>
        </div>

        {/* SLIDER PUBLICITARIO DEBAJO DEL MAPA (CON BOTÓN 'X' PARA OCULTARLO Y EXPANDIR EL MAPA AL 100%) */}
        {showPromoBanner && (
          <div className="relative z-10 w-full px-3 py-2 bg-white shrink-0 border-t border-gray-100 shadow-sm animate-in slide-in-from-bottom duration-300">
            <div 
              onClick={() => {
                if (PROMO_SLIDES[currentPromoIndex].category === 'TOUR') {
                  setSuperCategory('TOUR');
                  setHeaderMode('categories');
                }
              }}
              className="relative w-full h-[90px] rounded-2xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer bg-gray-100"
            >
              {/* Imagen limpia del banner publicitario (sin textos superpuestos) */}
              <img 
                src={PROMO_SLIDES[currentPromoIndex].image} 
                alt="Banner Publicidad"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Botón 'X' para descartar el slider */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPromoBanner(false);
                }}
                className="absolute top-2 right-2 z-30 w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all shadow-md active:scale-95"
                title="Cerrar publicidad"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Indicadores de slides (puntos) */}
              <div className="absolute bottom-2 right-3 z-10 flex gap-1 bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-xs">
                {PROMO_SLIDES.map((_, i) => (
                  <button 
                    key={i} 
                    type="button"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setCurrentPromoIndex(i); 
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentPromoIndex ? 'w-4 bg-[#a3e635]' : 'w-1.5 bg-white/60'
                    }`} 
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // PANTALLA 2 — LISTA DE RUTAS
  // ─────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="w-full h-full flex flex-col bg-[#F8FAF9] overflow-hidden">
        {/* HEADER SUPERIOR VERDE CON LOGO Y AVATAR */}
        <div className="relative z-20 bg-[#063b27] bg-gradient-to-b from-[#04281a] via-[#064e3b] to-[#043324] w-full pt-4 pb-4 px-4 shadow-xl shrink-0 rounded-b-[28px]">
          {/* Fila superior: Logo y Avatar */}
          <div className="flex items-center justify-between text-white mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shadow-xs">
                <Navigation2 className="h-4 w-4 text-[#a3e635] rotate-45" />
              </div>
              <span className="text-lg font-black tracking-tight text-white flex items-center">
                Palenque<span className="text-[#a3e635]">Go</span>
              </span>
            </div>

            <button 
              onClick={() => onNavigate('profile')} 
              className="w-8 h-8 rounded-full bg-amber-700/80 border border-amber-500/40 flex items-center justify-center text-xs font-bold text-white shadow-sm hover:scale-105 transition-transform overflow-hidden"
              title="Mi Perfil"
            >
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                currentUser?.name?.[0]?.toUpperCase() || 'M'
              )}
            </button>
          </div>

          {/* Saludo y Pregunta */}
          <div className="mb-3">
            <h1 className="text-xl font-black text-white leading-tight">
              ¿A dónde <span className="text-[#a3e635]">vamos?</span>
            </h1>
            <p className="text-xs text-white/75 mt-0.5 font-medium">
              Tu próxima ruta empieza aquí.
            </p>
          </div>

          {/* BARRA DE LAS 3 SUPER CATEGORÍAS */}
          <div className="bg-white rounded-2xl shadow-md p-1.5 flex items-center justify-between gap-1 border border-gray-100">
            <button
              type="button"
              onClick={() => setSuperCategory('INTERURBANO')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                superCategory === 'INTERURBANO'
                  ? 'bg-[#dcfce7] text-[#064e3b] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Bus className="h-3.5 w-3.5" />
              <span className="text-[11px]">Interurbano</span>
            </button>

            <button
              type="button"
              onClick={() => setSuperCategory('URBANO')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                superCategory === 'URBANO'
                  ? 'bg-[#dcfce7] text-[#064e3b] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span className="text-[11px]">Urbano</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setHeaderMode(prev => prev === 'search' ? 'categories' : 'search');
                setView('map');
              }}
              className="w-7 h-7 rounded-full bg-[#dcfce7] text-[#064e3b] hover:bg-emerald-200 flex items-center justify-center shrink-0 shadow-xs transition-all"
              title="Ver categorías en mapa"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setSuperCategory('TOUR')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                superCategory === 'TOUR'
                  ? 'bg-[#dcfce7] text-[#064e3b] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              <span className="text-[11px]">Tours</span>
            </button>
          </div>
        </div>

        {/* CONTENIDO DE LA LISTA */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">
          {/* BARRA: "Rutas para tu viaje" + Botones Filtros & Mapa */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Rutas para tu viaje</h2>
              <span className="inline-block text-[11px] font-bold text-[#064e3b] bg-emerald-100/70 px-2 py-0.5 rounded-md mt-0.5">
                {superCategory === 'INTERURBANO' ? 'Interurbano' : superCategory === 'URBANO' ? 'Urbano' : 'Tours'}
                {activeCategory && ` · ${activeCategory}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Botón Filtros */}
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs border border-gray-200 transition-all active:scale-95"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#059669]" />
                <span>Filtros</span>
              </button>

              {/* Botón Mapa */}
              <button
                type="button"
                onClick={() => setView('map')}
                className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs border border-gray-200 transition-all active:scale-95"
              >
                <Map className="h-3.5 w-3.5 text-[#059669]" />
                <span>Mapa</span>
              </button>
            </div>
          </div>

          {/* Buscador Rápido de Rutas */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Buscar rutas o destinos..."
              className="w-full bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 rounded-xl h-10 pl-10 pr-10 shadow-2xs text-xs focus-visible:ring-1 focus-visible:ring-[#059669]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setSearchQuery('')}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* LISTA DE RUTAS DISPONIBLES */}
          {filteredRoutes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <MapPin className="h-12 w-12 mb-3 opacity-30 text-gray-400" />
              <p className="text-sm font-bold text-gray-700">No se encontraron rutas</p>
              <p className="text-xs text-gray-500 mt-1">Prueba cambiando los filtros o la búsqueda</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveCategory(null);
                  setDestination("");
                  setSearchQuery("");
                  setFilterService('todos');
                }}
                className="mt-4 rounded-xl text-xs font-bold"
              >
                Restablecer filtros
              </Button>
            </div>
          ) : (
            filteredRoutes.map((route) => {
              const rColor = route.category?.color || '#059669';
              return (
                <div
                  key={route.id}
                  className="bg-white rounded-2xl p-3.5 shadow-xs border border-gray-100 flex items-center justify-between gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${rColor}15` }}
                    >
                      <Bus className="h-5 w-5" style={{ color: rColor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-gray-900 text-sm leading-tight truncate">
                        {route.name}
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                        Ruta {route.route_type ? route.route_type.toLowerCase() : 'interurbana'} · {route.stops?.length || 0} paradas y horarios
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoute(route);
                      setView('detail');
                    }}
                    className="shrink-0 flex items-center gap-1 border border-[#064e3b] text-[#064e3b] hover:bg-emerald-50 active:scale-95 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs"
                  >
                    <span>Ver ruta</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* SLIDER PUBLICITARIO AL FONDO */}
        {showPromoBanner && (
          <div className="relative z-10 w-full px-3 py-2 bg-white shrink-0 border-t border-gray-100 shadow-sm animate-in slide-in-from-bottom duration-300">
            <div 
              onClick={() => {
                if (PROMO_SLIDES[currentPromoIndex].category === 'TOUR') {
                  setSuperCategory('TOUR');
                  setHeaderMode('categories');
                  setView('map');
                }
              }}
              className="relative w-full h-[84px] rounded-2xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer bg-gray-100"
            >
              <img 
                src={PROMO_SLIDES[currentPromoIndex].image} 
                alt="Banner Publicidad"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPromoBanner(false);
                }}
                className="absolute top-2 right-2 z-30 w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all shadow-md active:scale-95"
                title="Cerrar publicidad"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="absolute bottom-2 right-3 z-10 flex gap-1 bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-xs">
                {PROMO_SLIDES.map((_, i) => (
                  <button 
                    key={i} 
                    type="button"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setCurrentPromoIndex(i); 
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentPromoIndex ? 'w-4 bg-[#a3e635]' : 'w-1.5 bg-white/60'
                    }`} 
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL / DRAWER DE FILTROS (Wireframe media_1791123281831.jpg) */}
        {isFilterModalOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-200"
            onClick={() => setIsFilterModalOpen(false)}
          >
            <div 
              className="bg-white rounded-t-[28px] p-5 w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-black text-gray-900">Filtrar rutas</h3>
                <span className="text-xs font-bold bg-[#dcfce7] text-[#064e3b] px-2.5 py-1 rounded-lg">
                  {superCategory === 'INTERURBANO' ? 'Interurbano' : superCategory === 'URBANO' ? 'Urbano' : 'Tours'}
                </span>
              </div>

              {/* SERVICIO: Todos | Directo | Con paradas */}
              <div className="mt-4">
                <label className="text-xs font-extrabold text-gray-700 block mb-2">Servicio</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'directo', label: 'Directo' },
                    { id: 'con_paradas', label: 'Con paradas' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFilterService(s.id as any)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                        filterService === s.id
                          ? 'bg-[#dcfce7] border-[#86efac] text-[#064e3b] shadow-2xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SALIDA: Cualquier hora | Mañana | Tarde | Noche */}
              <div className="mt-4">
                <label className="text-xs font-extrabold text-gray-700 block mb-2">Salida</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'cualquiera', label: 'Cualquier hora' },
                    { id: 'manana', label: 'Mañana' },
                    { id: 'tarde', label: 'Tarde' },
                    { id: 'noche', label: 'Noche' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFilterTime(t.id as any)}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all text-center ${
                        filterTime === t.id
                          ? 'bg-[#dcfce7] border-[#86efac] text-[#064e3b] shadow-2xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ACCIONES AL FONDO */}
              <div className="flex items-center justify-between gap-3 mt-6 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setFilterService('todos');
                    setFilterTime('cualquiera');
                    setFilterLine('todas');
                  }}
                  className="text-xs font-bold text-gray-500 hover:text-gray-800 py-2.5 px-4"
                >
                  Limpiar
                </button>
                <Button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="flex-1 bg-[#064e3b] hover:bg-[#043324] text-white font-bold text-xs h-11 rounded-xl shadow-md"
                >
                  Aplicar filtros
                </Button>
              </div>
            </div>
          </div>
        )}
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
