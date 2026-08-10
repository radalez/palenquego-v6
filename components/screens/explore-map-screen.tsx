"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api'
import { Search, ChevronLeft, MapPin, Navigation2, MoreVertical, Bookmark } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/store"

const containerStyle = {
  width: '100%',
  height: '100%',
}

const API_BASE = "https://palenquego.fly.dev/api" // Default

interface ExploreMapScreenProps {
  onBack: () => void
  onNavigate: (tab: string) => void
}

export function ExploreMapScreen({ onBack, onNavigate }: ExploreMapScreenProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null)
  
  const token = useAppStore((state) => state.accessToken)
  
  // Use window location to infer backend URL in dev if possible, otherwise rely on env
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

  const center = { lat: 13.6893, lng: -89.1872 } // Default center El Salvador

  // When a route is selected, get its path for the polyline
  const pathCoordinates = selectedRoute?.stops?.map((stop: any) => ({
    lat: stop.latitude,
    lng: stop.longitude
  })) || []

  return (
    <div className="relative w-full h-full flex flex-col bg-background overflow-hidden">
      {/* MAP LAYER */}
      <div className="absolute inset-0 z-0">
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
                }
              ]
            }}
          >
            {/* Draw polyline if route selected */}
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

            {/* If route is selected, show stops, otherwise show route starting points */}
            {selectedRoute ? (
              selectedRoute.stops.map((stop: any, index: number) => (
                <Marker
                  key={stop.id}
                  position={{ lat: stop.latitude, lng: stop.longitude }}
                  label={{
                    text: (index + 1).toString(),
                    color: "white",
                    fontWeight: "bold"
                  }}
                />
              ))
            ) : (
              routes.map(route => {
                if (route.stops && route.stops.length > 0) {
                  return (
                    <Marker
                      key={route.id}
                      position={{ lat: route.stops[0].latitude, lng: route.stops[0].longitude }}
                      onClick={() => setSelectedRoute(route)}
                      icon={{
                        url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
                      }}
                    />
                  )
                }
                return null
              })
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
            Cargando Mapa...
          </div>
        )}
      </div>

      {/* TOP CONTROLS LAYER */}
      <div className="relative z-10 w-full p-4 pointer-events-none flex-1 flex flex-col">
        <div className="pointer-events-auto flex flex-col gap-3">
          {/* Header & Search */}
          <div className="flex items-center gap-2 bg-background/95 backdrop-blur-md p-2 rounded-2xl shadow-lg">
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o parada..."
                className="pl-9 bg-transparent border-none focus-visible:ring-0 shadow-none text-base h-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedRoute(null) // Clear selection when searching
                }}
              />
            </div>
          </div>

          {/* Categories */}
          {!selectedRoute && (
            <ScrollArea className="w-full pointer-events-auto pb-2">
              <div className="flex gap-2 px-1">
                <Button
                  variant={activeCategory === null ? "default" : "secondary"}
                  className="rounded-full shadow-md bg-white/90 text-black hover:bg-white"
                  onClick={() => setActiveCategory(null)}
                >
                  Todas
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.slug ? "default" : "secondary"}
                    className="rounded-full shadow-md bg-white/90 text-black hover:bg-white"
                    onClick={() => setActiveCategory(cat.slug)}
                  >
                    {/* Just text for now, ideally Map the cat.icon to Lucide */}
                    <span className="font-medium text-sm px-1">{cat.name}</span>
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          )}
        </div>

        {/* Search Results List (only if searching and no route selected) */}
        {!selectedRoute && searchQuery && routes.length > 0 && (
            <div className="mt-4 pointer-events-auto bg-background/95 backdrop-blur-md rounded-2xl shadow-lg p-3 max-h-[50%] overflow-y-auto">
                <h3 className="text-sm font-semibold mb-2 px-1">Resultados de búsqueda</h3>
                <div className="flex flex-col gap-2">
                    {routes.map(route => (
                        <div 
                            key={route.id} 
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/50 active:bg-muted cursor-pointer"
                            onClick={() => setSelectedRoute(route)}
                        >
                            <div>
                                <h4 className="font-semibold text-sm">{route.name}</h4>
                                <p className="text-xs text-muted-foreground">{route.stops?.length || 0} paradas • {route.category?.name || 'Ruta'}</p>
                            </div>
                            <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* BOTTOM SHEET / DETAIL LAYER */}
      <div className="relative z-10 pointer-events-none mt-auto">
        {selectedRoute && (
          <div className="pointer-events-auto bg-background rounded-t-3xl p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col gap-4 animate-in slide-in-from-bottom">
            {/* Header info */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{selectedRoute.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedRoute.category?.name || 'Ruta'} • {selectedRoute.stops?.length || 0} Paradas
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4 p-3 bg-muted/50 rounded-2xl text-sm">
              <div className="flex-1 flex flex-col items-center">
                <span className="font-semibold">{selectedRoute.stops?.length || 0}</span>
                <span className="text-muted-foreground text-xs">Paradas</span>
              </div>
              <div className="w-px bg-border" />
              <div className="flex-1 flex flex-col items-center">
                <span className="font-semibold">${selectedRoute.price_one_way}</span>
                <span className="text-muted-foreground text-xs">Precio</span>
              </div>
            </div>

            {/* Stops List (Simplified) */}
            <ScrollArea className="h-32">
              <div className="flex flex-col gap-3 relative pl-4 border-l-2 border-primary/20 ml-2 py-2">
                {selectedRoute.stops?.map((stop: any, idx: number) => (
                  <div key={stop.id} className="relative">
                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    <p className="text-sm font-medium">{stop.name}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Button 
                variant="outline" 
                className="w-full rounded-xl h-12"
                onClick={() => setSelectedRoute(null)}
              >
                Volver
              </Button>
              <Button 
                className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 text-white shadow-lg"
                onClick={() => {
                  // The user requested that this leads to the current behavior.
                  // For now, let's navigate to the classic route screen or pool.
                  onNavigate('rutas-classic')
                }}
              >
                Comprar Boleto
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
