"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { GoogleMap, useJsApiLoader, Marker, Polyline, OverlayView } from '@react-google-maps/api'
import { Search, ChevronLeft, MapPin, Navigation2, Bookmark, SlidersHorizontal, Menu, LayoutGrid } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useAppStore } from "@/lib/store"

const containerStyle = {
  width: '100%',
  height: '100%',
}

const API_BASE = "https://palenquego.fly.dev/api"

interface ExploreMapScreenProps {
  onBack: () => void
  onNavigate: (tab: string) => void
}

// Helper para renderizar iconos dinámicos
const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.MapPin
  return <IconComponent className={className} />
}

export function ExploreMapScreen({ onBack, onNavigate }: ExploreMapScreenProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null)
  
  const token = useAppStore((state) => state.accessToken)
  
  const getApiBase = () => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
       return 'http://localhost:8000/api'
    }
    return process.env.NEXT_PUBLIC_API_URL || API_BASE
  }

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  })

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${getApiBase()}/transport/categories/`, {
          headers: token ? { Authorization: `Token ${token}` } : {}
        })
        if (res.ok) {
          const data = await res.json()
          setCategories(data)
        }
      } catch (err) {
        console.error("Error fetching categories:", err)
      }
    }
    fetchCategories()
  }, [token])

  // Fetch routes
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        let url = `${getApiBase()}/transport/routes/`
        const params = new URLSearchParams()
        if (activeCategory) params.append('category', activeCategory)
        if (searchQuery) params.append('search', searchQuery)
        
        if (params.toString()) {
          url += `?${params.toString()}`
        }

        const res = await fetch(url, {
          headers: token ? { Authorization: `Token ${token}` } : {}
        })
        if (res.ok) {
          const data = await res.json()
          setRoutes(data)
        }
      } catch (err) {
        console.error("Error fetching routes:", err)
      }
    }
    fetchRoutes()
  }, [token, activeCategory, searchQuery])

  const center = { lat: 13.6893, lng: -89.1872 } // El Salvador

  const pathCoordinates = useMemo(() => {
    return selectedRoute?.stops?.map((stop: any) => ({
      lat: stop.latitude,
      lng: stop.longitude
    })) || []
  }, [selectedRoute])

  return (
    <div className="relative w-full h-full flex flex-col bg-background overflow-hidden">
      
      {/* HEADER DARK VERDE (ESTILO MOCKUP) */}
      <div className="relative z-20 bg-[#0B1F15] w-full pt-12 pb-16 px-4 rounded-b-[32px] shadow-lg flex flex-col gap-4">
        {/* Top bar */}
        <div className="flex items-center justify-between text-white">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onBack}>
            <Menu className="h-6 w-6" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold flex items-center gap-1 justify-center">
              Explora <span className="text-[#4ade80]">El Salvador</span>
            </h1>
            <p className="text-xs text-gray-300">Descubre todas las rutas disponibles</p>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar rutas..."
            className="w-full bg-white/10 border-none text-white placeholder:text-gray-400 rounded-2xl h-12 pl-12 pr-4 focus-visible:ring-1 focus-visible:ring-[#4ade80]"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSelectedRoute(null)
            }}
          />
        </div>
      </div>

      {/* BARRA DE CATEGORÍAS FLOTANTE */}
      <div className="absolute top-[160px] left-0 right-0 z-30 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2">
          <ScrollArea className="w-full">
            <div className="flex gap-4 px-2 items-center">
              {/* Botón TODAS */}
              <button 
                onClick={() => { setActiveCategory(null); setSelectedRoute(null); }}
                className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${
                  activeCategory === null ? 'bg-gray-100 border border-gray-200 shadow-sm' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`p-2 rounded-full ${activeCategory === null ? 'text-[#0B1F15]' : 'text-gray-500'}`}>
                  <LayoutGrid className="h-6 w-6" />
                </div>
                <span className={`text-[10px] font-medium ${activeCategory === null ? 'text-[#0B1F15]' : 'text-gray-500'}`}>
                  Todas
                </span>
              </button>

              {/* Categorías Dinámicas */}
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.slug); setSelectedRoute(null); }}
                  className={`flex flex-col items-center gap-1 min-w-[70px] p-2 rounded-xl transition-all ${
                    activeCategory === cat.slug ? 'bg-gray-100 border border-gray-200 shadow-sm' : 'hover:bg-gray-50'
                  }`}
                >
                  <div 
                    className="p-2 rounded-full" 
                    style={{ color: activeCategory === cat.slug ? (cat.color || '#0B1F15') : '#6B7280' }}
                  >
                    <DynamicIcon name={cat.icon || 'MapPin'} className="h-6 w-6" />
                  </div>
                  <span className={`text-[10px] font-medium ${activeCategory === cat.slug ? 'text-[#0B1F15]' : 'text-gray-500'}`}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>
      </div>

      {/* MAPA */}
      <div className="absolute inset-0 z-0 pt-[100px]">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={selectedRoute && pathCoordinates.length > 0 ? pathCoordinates[0] : center}
            zoom={selectedRoute ? 12 : 9}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                },
                // Un estilo más claro/natural acorde al mockup
                {
                  featureType: "water",
                  elementType: "geometry",
                  stylers: [{ color: "#A8D8F8" }] // Azul agua estilo mockup
                },
                {
                  featureType: "landscape",
                  elementType: "geometry",
                  stylers: [{ color: "#E8F5E9" }] // Verde claro tierra
                }
              ]
            }}
          >
            {/* Si hay una ruta seleccionada, dibujamos su trazo */}
            {selectedRoute && (
              <Polyline
                path={pathCoordinates}
                options={{
                  strokeColor: "#059669",
                  strokeOpacity: 0.8,
                  strokeWeight: 5,
                }}
              />
            )}

            {/* Marcadores */}
            {selectedRoute ? (
              // Modo Detalle de Ruta: Mostramos los números (1, 2, 3...)
              selectedRoute.stops?.map((stop: any, index: number) => (
                <Marker
                  key={stop.id}
                  position={{ lat: stop.latitude, lng: stop.longitude }}
                  label={{
                    text: (index + 1).toString(),
                    color: "white",
                    fontWeight: "bold"
                  }}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: '#059669',
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: 'white',
                    scale: 14,
                  }}
                />
              ))
            ) : (
              // Modo Exploración: Mostramos marcadores con el color e ícono de la categoría
              routes.map(route => {
                if (!route.stops || route.stops.length === 0) return null;
                
                const catColor = route.category?.color || '#059669';
                const catIcon = route.category?.icon || 'MapPin';
                const position = { lat: route.stops[0].latitude, lng: route.stops[0].longitude };

                return (
                  <OverlayView
                    key={route.id}
                    position={position}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  >
                    <div 
                      className="absolute -translate-x-1/2 -translate-y-full cursor-pointer group"
                      onClick={() => setSelectedRoute(route)}
                    >
                      <div className="flex items-center gap-1 bg-white rounded-full p-1 pr-3 shadow-lg border border-gray-100 hover:scale-105 transition-transform">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-inner"
                          style={{ backgroundColor: catColor }}
                        >
                          <DynamicIcon name={catIcon} className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-gray-800 whitespace-nowrap">
                          {route.name}
                        </span>
                      </div>
                      {/* Triangulito del marcador */}
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white absolute left-1/2 -translate-x-1/2 shadow-sm" />
                    </div>
                  </OverlayView>
                )
              })
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-[#E8F5E9] animate-pulse flex items-center justify-center">
            Cargando Mapa...
          </div>
        )}
      </div>

      {/* BADGE FLOTANTE DE CANTIDAD (Solo si no hay ruta seleccionada) */}
      {!selectedRoute && isLoaded && (
        <div className="absolute bottom-24 left-4 z-10">
          <div className="bg-[#0B1F15] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3">
            <div className="text-[#4ade80]">
              <DynamicIcon name="Sparkles" className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-none">{routes.length}</span>
              <span className="text-[10px] text-gray-300">Rutas disponibles</span>
            </div>
          </div>
        </div>
      )}

      {/* CONTROLES DEL MAPA (Zoom, Ubicación) */}
      <div className="absolute bottom-24 right-4 z-10 flex flex-col gap-2">
        <Button variant="secondary" size="icon" className="bg-white rounded-full shadow-lg h-12 w-12 text-gray-600">
          <Navigation2 className="h-5 w-5" />
        </Button>
        <div className="bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
          <Button variant="ghost" size="icon" className="rounded-none h-12 w-12 text-gray-600 border-b border-gray-100">
            <span className="text-xl">+</span>
          </Button>
          <Button variant="ghost" size="icon" className="rounded-none h-12 w-12 text-gray-600">
            <span className="text-xl">-</span>
          </Button>
        </div>
      </div>

      {/* MODAL / BOTTOM SHEET DE DETALLE DE RUTA */}
      {selectedRoute && (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.1)] flex flex-col max-h-[60vh] animate-in slide-in-from-bottom duration-300">
          
          {/* Header del Bottom Sheet */}
          <div className="p-5 pb-3 border-b border-gray-100">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="flex justify-between items-start">
              <div className="flex gap-3 items-center">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: selectedRoute.category?.color || '#059669' }}
                >
                  <DynamicIcon name={selectedRoute.category?.icon || 'MapPin'} className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedRoute.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedRoute.category?.name || 'Ruta'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full text-gray-400" onClick={() => setSelectedRoute(null)}>
                <Menu className="h-5 w-5 rotate-90" />
              </Button>
            </div>
          </div>

          {/* Lista de paradas (Scrollable) */}
          <ScrollArea className="flex-1 p-5">
            <div className="flex flex-col gap-0 relative">
              {/* Línea conectora */}
              <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-200 z-0" />
              
              {selectedRoute.stops?.map((stop: any, idx: number) => (
                <div key={stop.id} className="relative z-10 flex gap-4 items-start py-3 bg-white">
                  <div className="w-8 h-8 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                    {idx + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">{stop.name}</span>
                    <span className="text-xs text-gray-500">
                      {idx === 0 ? "Punto de inicio" : `Aprox. ${idx * 15} min`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Footer del Bottom Sheet (Botones) */}
          <div className="p-5 pt-3 bg-white border-t border-gray-100 grid grid-cols-[1fr_auto] gap-3">
            <Button 
              className="w-full rounded-2xl h-14 bg-[#059669] hover:bg-[#047857] text-white shadow-lg shadow-green-900/20 text-lg font-bold"
              onClick={() => onNavigate('rutas-classic')}
            >
              <Navigation2 className="mr-2 h-5 w-5" />
              Iniciar ruta
            </Button>
            <Button variant="outline" size="icon" className="w-14 h-14 rounded-2xl border-gray-200 text-gray-600">
              <DynamicIcon name="Share2" className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

