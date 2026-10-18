"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { GoogleMap, useJsApiLoader, Marker, Polyline, OverlayView } from '@react-google-maps/api'
import {
  Search, MapPin, Navigation2, SlidersHorizontal, ChevronLeft, ChevronRight,
  LayoutGrid, ChevronUp, X, Bookmark, Clock, Share2,
  ArrowUpDown, Calendar, Users, Bus, Building2, Camera, ChevronDown,
  Map, Filter, Palmtree, Utensils, Home, Landmark, Leaf, Sparkles, Car, Star,
  Compass, Plane, Mountain, Sun, Menu, List, Image as ImageIcon
} from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import * as LucideIcons from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAppStore, fetchWithAuth } from "@/lib/store"
import { UserRoutesModal } from "@/components/user-routes-modal"
import { CreatePoolModal } from "@/components/create-pool-modal"
import { formatImageUrl, getRouteImageUrl, handleImageFallback } from "@/lib/utils"

const containerStyle = { width: '100%', height: '100%' }
const API_BASE = "/api-proxy"
const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"]

type ViewState = 'map' | 'list' | 'detail'

const STRATEGIC_HUBS = [
  {
    id: 'san-salvador',
    name: 'San Salvador',
    category: 'URBANO',
    icon: 'Bus',
    color: '#059669',
    lat: 13.6929,
    lng: -89.2182,
    routesCount: 28,
    desc: 'Centro Histórico, BINAES y Terminales'
  },
  {
    id: 'santa-ana',
    name: 'Santa Ana',
    category: 'INTERURBANO',
    icon: 'Bus',
    color: '#059669',
    lat: 13.9942,
    lng: -89.5597,
    routesCount: 8,
    desc: 'Catedral, Volcán de Santa Ana y Conexión Occidente'
  },
  {
    id: 'la-libertad',
    name: 'La Libertad',
    category: 'TOUR',
    icon: 'Palmtree',
    color: '#f97316',
    lat: 13.4883,
    lng: -89.3222,
    routesCount: 6,
    desc: 'Surf City, El Tunco, El Sunzal y Playas'
  },
  {
    id: 'suchitoto',
    name: 'Suchitoto',
    category: 'TOUR',
    icon: 'Camera',
    color: '#ea580c',
    lat: 13.9378,
    lng: -89.0278,
    routesCount: 4,
    desc: 'Pueblo Histórico Colonial y Lago Suchitlán'
  },
  {
    id: 'san-vicente',
    name: 'San Vicente',
    category: 'INTERURBANO',
    icon: 'Mountain',
    color: '#15803d',
    lat: 13.6444,
    lng: -88.8028,
    routesCount: 5,
    desc: 'Volcán Chinchontepec y Corredor Panamericano'
  },
  {
    id: 'aeropuerto',
    name: 'Aeropuerto SAL',
    category: 'INTERURBANO',
    icon: 'Plane',
    color: '#0284c7',
    lat: 13.4409,
    lng: -89.0557,
    routesCount: 4,
    desc: 'Aeropuerto Int. San Óscar Arnulfo Romero'
  }
]

const FEATURED_DESTINATIONS = [
  {
    id: 'la-libertad',
    name: 'La Libertad',
    subtitle: 'Surf City, Playas & Olas',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    lat: 13.4883,
    lng: -89.3222,
    zoom: 13,
    category: 'TOUR',
  },
  {
    id: 'suchitoto',
    name: 'Suchitoto',
    subtitle: 'Arquitectura Colonial & Lago',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    lat: 13.9378,
    lng: -89.0278,
    zoom: 14,
    category: 'TOUR',
  },
  {
    id: 'santa-ana',
    name: 'Santa Ana',
    subtitle: 'Catedral & Volcán Ilamatepec',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
    lat: 13.9942,
    lng: -89.5597,
    zoom: 13,
    category: 'INTERURBANO',
  },
  {
    id: 'san-salvador',
    name: 'San Salvador',
    subtitle: 'Centro Histórico & BINAES',
    image: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80',
    lat: 13.6929,
    lng: -89.2182,
    zoom: 13,
    category: 'URBANO',
  }
]

const DEFAULT_PROMO_SLIDES = [
  {
    id: 1,
    title: "Rutas Interurbanas & Montañas",
    subtitle: "Viaja cómodo y seguro entre departamentos y miradores.",
    category: "INTERURBANO",
    image: "https://res.cloudinary.com/dacanh1gn/image/upload/v1791135828/palenque_banners/slide_1_interurbano_montanas.webp"
  },
  {
    id: 2,
    title: "Taxi & Rutas Urbanas",
    subtitle: "Muévete por la ciudad a tu propio precio con choferes cercanos.",
    category: "URBANO",
    image: "https://res.cloudinary.com/dacanh1gn/image/upload/v1791135830/palenque_banners/slide_2_urbano_ciudad.webp"
  },
  {
    id: 3,
    title: "Costa del Bálsamo & Tours",
    subtitle: "Disfruta de playas, surf, gastronomía y experiencias inolvidables.",
    category: "TOUR",
    image: "https://res.cloudinary.com/dacanh1gn/image/upload/v1791135831/palenque_banners/slide_3_tours_costa.webp"
  }
]

const DEFAULT_TOUR_CATEGORIES = [
  { id: 'cat-playa', name: 'Playa', slug: 'playa', icon: 'Palmtree' },
  { id: 'cat-gastro', name: 'Gastronomía', slug: 'gastronomia', icon: 'Utensils' },
  { id: 'cat-pueblos', name: 'Pueblos', slug: 'pueblos', icon: 'Home' },
  { id: 'cat-historia', name: 'Historia', slug: 'historia', icon: 'Landmark' },
  { id: 'cat-naturaleza', name: 'Naturaleza', slug: 'naturaleza', icon: 'Leaf' },
]

const POPULAR_SALVADOR_PLACES = [
  { name: "Aeropuerto Int. San Óscar Romero", category: "Aeropuerto (San Luis Talpa)", icon: "Plane" },
  { name: "El Tunco / Sunzal", category: "Playa & Surf (La Libertad)", icon: "Palmtree" },
  { name: "Planes de Renderos / Puerta del Diablo", category: "Montaña & Mirador", icon: "Mountain" },
  { name: "Metrocentro San Salvador", category: "Centro Comercial", icon: "ShoppingBag" },
  { name: "Terminal de Occidente", category: "Terminal de Buses Interurbanos", icon: "Bus" },
  { name: "Terminal de Oriente Fenadesal", category: "Terminal de Buses Interurbanos", icon: "Bus" },
  { name: "Multiplaza & Las Cascadas", category: "Zona Rosa / Antiguo Cuscatlán", icon: "ShoppingBag" },
  { name: "Suchitoto", category: "Pueblo Histórico (Cuscatlán)", icon: "Landmark" },
  { name: "Santa Tecla / El Cafetalón", category: "Ciudad (La Libertad)", icon: "Building2" },
  { name: "Hospital Rosales / Zona Médica", category: "Salud / Centro SS", icon: "Cross" },
  { name: "Universidad de El Salvador (UES)", category: "Educación / Campus Central", icon: "GraduationCap" },
  { name: "Costa del Sol", category: "Playas (La Paz)", icon: "Palmtree" },
  { name: "Santa Ana / Centro Histórico", category: "Ciudad de Occidente", icon: "Landmark" },
]

interface ExploreMapScreenProps {
  onBack: () => void
  onNavigate: (tab: string) => void
  onToggleDesktopSidebar?: () => void
  isDesktopSidebarCollapsed?: boolean
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

export function ExploreMapScreen({ onBack, onNavigate, onToggleDesktopSidebar, isDesktopSidebarCollapsed }: ExploreMapScreenProps) {
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
  const myUserRoutes = useAppStore((state) => state.myUserRoutes)
  const requestedTrips = useAppStore((state) => state.requestedTrips)
  const setMobileMenuOpen = useAppStore((state) => state.setMobileMenuOpen)
  const fetchMyUserRoutes = useAppStore((state) => state.fetchMyUserRoutes)
  const fetchRequestedTrips = useAppStore((state) => state.fetchRequestedTrips)
  const homeSlides = useAppStore((state) => state.homeSlides)
  const fetchHomeSlides = useAppStore((state) => state.fetchHomeSlides)
  const userIntentions = useAppStore((state) => state.userIntentions)
  const registeredRouteInterests = useAppStore((state) => state.registeredRouteInterests) || []
  const registerRouteInterest = useAppStore((state) => state.registerRouteInterest)
  const setLastMapInteraction = useAppStore((state) => state.setLastMapInteraction)

  const [isUserRoutesModalOpen, setIsUserRoutesModalOpen] = useState(false)
  const [poolRouteForModal, setPoolRouteForModal] = useState<any | null>(null)
  const [showPoolDetailModal, setShowPoolDetailModal] = useState(false)
  const [mapPickMode, setMapPickMode] = useState<'origin' | 'destination' | null>(null)
  const [currentPickedOrigin, setCurrentPickedOrigin] = useState<{ name: string; lat: number; lng: number } | null>(null)
  const [currentPickedDestination, setCurrentPickedDestination] = useState<{ name: string; lat: number; lng: number } | null>(null)
  
  // Estado para Nivel de Detalle (LOD) y Cartita Flotante de Ruta
  const [mapZoom, setMapZoom] = useState<number>(9)
  const [previewRoute, setPreviewRoute] = useState<any | null>(null)
  const [previewImageIdx, setPreviewImageIdx] = useState<number>(0)
  const [hoveredRouteId, setHoveredRouteId] = useState<any | null>(null)
  const [activeCampaign, setActiveCampaign] = useState<{ id: string; name: string; target: string } | null>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  // Resetear índice de imagen al cambiar de ruta en preview
  useEffect(() => {
    setPreviewImageIdx(0)
  }, [previewRoute?.id])

  // Detector de campañas publicitarias & procedencia de enlaces (?campaign=..., ?tour=..., ?category=...)
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const camp = params.get("campaign") || params.get("utm_campaign")
    const tour = params.get("tour")
    const cat = params.get("category") || params.get("cat")
    const dest = params.get("dest") || params.get("destino")

    if (camp || tour || cat || dest) {
      let name = "Campaña Activa"
      let targetCat: 'INTERURBANO' | 'URBANO' | 'TOUR' | null = null

      if (tour || (camp && camp.toLowerCase().includes("tour")) || (cat && cat.toLowerCase().includes("tour"))) {
        name = tour ? `Tour: ${tour.replace(/[-_]/g, ' ')}` : "Tours & Experiencias"
        targetCat = "TOUR"
      } else if (cat && cat.toLowerCase().includes("urban")) {
        name = "Transporte Urbano & Taxi"
        targetCat = "URBANO"
      } else if (cat && cat.toLowerCase().includes("inter")) {
        name = "Rutas Interurbanas"
        targetCat = "INTERURBANO"
      } else if (camp) {
        name = `Campaña: ${camp.replace(/[-_]/g, ' ')}`
      }

      if (dest) {
        setSearchQuery(dest)
        setDestination(dest)
      }
      if (targetCat) {
        setSuperCategory(targetCat)
      }
      setActiveCampaign({
        id: camp || tour || cat || "ad",
        name: name,
        target: dest || tour || "El Salvador"
      })
    }
  }, [])

  const handleSelectDestination = (dest: any) => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat: dest.lat, lng: dest.lng })
      mapRef.current.setZoom(dest.zoom || 13)
    }
    setDestination(dest.name)
    setSearchQuery(dest.name)
    if (dest.category) {
      setSuperCategory(dest.category as any)
    }
  }

  const handleHubClick = (hub: any) => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat: hub.lat, lng: hub.lng })
      mapRef.current.setZoom(13)
    }
    setDestination(hub.name)
    if (hub.category) {
      setSuperCategory(hub.category as any)
    }
  }

  const handleExploreCurrentZone = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter()
      if (center) {
        const lat = center.lat()
        const lng = center.lng()
        const sorted = [...filteredRoutes].sort((a, b) => {
          const distA = a.stops?.[0] ? getDistanceInKm(lat, lng, a.stops[0].latitude, a.stops[0].longitude) : 9999
          const distB = b.stops?.[0] ? getDistanceInKm(lat, lng, b.stops[0].latitude, b.stops[0].longitude) : 9999
          return distA - distB
        })
        if (sorted.length > 0) {
          setPreviewRoute(sorted[0])
        }
      }
    }
  }

  useEffect(() => {
    fetchMyUserRoutes()
    fetchHomeSlides()
    if (currentUser?.tipo === 'CHOFER') {
      fetchRequestedTrips()
    }
  }, [fetchMyUserRoutes, fetchRequestedTrips, fetchHomeSlides, currentUser?.tipo])

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!mapPickMode || !e.latLng) return
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    let placeName = `Punto (${lat.toFixed(4)}, ${lng.toFixed(4)})`

    try {
      if (window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder()
        const res = await geocoder.geocode({ location: { lat, lng } })
        if (res.results && res.results[0]) {
          placeName = res.results[0].formatted_address
        }
      }
    } catch (err) {
      console.warn("Geocoder error:", err)
    }

    if (mapPickMode === 'origin') {
      setCurrentPickedOrigin({ name: placeName, lat, lng })
    } else if (mapPickMode === 'destination') {
      setCurrentPickedDestination({ name: placeName, lat, lng })
    }

    setMapPickMode(null)
    setIsUserRoutesModalOpen(true)
  }

  const [superCategory, setSuperCategory] = useState<'INTERURBANO' | 'URBANO' | 'TOUR' | null>(null)
  const [panelMode, setPanelMode] = useState<'none' | 'categories' | 'search'>('none')
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")

  // Sincronizar interacción del usuario en el mapa (categoría, ruta o destino) para Pools dinámicos
  useEffect(() => {
    if (activeCategory || superCategory || destination || selectedRoute || previewRoute) {
      const activeObj = selectedRoute || previewRoute;
      const catName = activeCategory 
        || activeObj?.category?.name 
        || (superCategory === 'TOUR' ? 'Tours & Experiencias' : superCategory === 'URBANO' ? 'Taxi & Rutas Urbanas' : superCategory === 'INTERURBANO' ? 'Rutas Interurbanas' : null);
      const destName = destination || activeObj?.name || null;
      setLastMapInteraction(catName, superCategory, destName);

      if (typeof window !== "undefined" && destName) {
        try {
          const raw = localStorage.getItem("palenque_recent_map_routes");
          const arr: string[] = raw ? JSON.parse(raw) : [];
          if (!arr.includes(destName)) {
            arr.unshift(destName);
            localStorage.setItem("palenque_recent_map_routes", JSON.stringify(arr.slice(0, 10)));
          }
        } catch (e) {}
      }
    }
  }, [activeCategory, superCategory, destination, selectedRoute, previewRoute, setLastMapInteraction]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false)
  const [showDestSuggestions, setShowDestSuggestions] = useState(false)
  const [gpsNotice, setGpsNotice] = useState<{
    type: 'outside' | 'error'
    title: string
    message: string
  } | null>(null)
  const [showPromoBanner, setShowPromoBanner] = useState(true)
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0)

  // Slides dinámicos del backend (con fallback a Cloudinary por defecto)
  const promoSlides = (homeSlides && homeSlides.length > 0) ? homeSlides : DEFAULT_PROMO_SLIDES
  const currentPromoSlide = promoSlides[currentPromoIndex % promoSlides.length]

  const handlePromoSlideClick = (slide: any) => {
    if (slide.category === 'TOUR') {
      setSuperCategory('TOUR')
      setPanelMode('categories')
    } else if (slide.category === 'URBANO') {
      setSuperCategory('URBANO')
      setPanelMode('categories')
    } else if (slide.category === 'INTERURBANO') {
      setSuperCategory('INTERURBANO')
      setPanelMode('categories')
    }
  }

  // Ciclo de 3 estados: 'none' (arranca sin nada) -> 'categories' -> 'search' -> 'none'
  const handleToggleClick = () => {
    if (panelMode === 'none') {
      setPanelMode('categories')
    } else if (panelMode === 'categories') {
      setPanelMode('search')
      setCategoryPanelOpen(false)
    } else {
      setPanelMode('none')
      setCategoryPanelOpen(false)
    }
  }

  // Estados para Modal de Filtros (media_1791123281831.jpg)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [filterService, setFilterService] = useState<'todos' | 'directo' | 'con_paradas'>('todos')
  const [filterTime, setFilterTime] = useState<'cualquiera' | 'manana' | 'tarde' | 'noche'>('cualquiera')
  const [filterLine, setFilterLine] = useState('todas')

  // Rotación del carrusel de banners
  useEffect(() => {
    if (!showPromoBanner) return
    const timer = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promoSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [showPromoBanner, promoSlides.length])

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
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  useEffect(() => {
    if (mapRef.current && routes.length > 0 && isLoaded) {
      const bounds = new window.google.maps.LatLngBounds()
      let validCount = 0
      routes.forEach(route => {
        if (route.stops?.length) {
          const lat = route.stops[0].latitude
          const lng = route.stops[0].longitude
          // Filtrar estrictamente coordenadas reales dentro de El Salvador
          if (lat >= 13.1 && lat <= 14.5 && lng >= -90.1 && lng <= -87.6) {
            bounds.extend({ lat, lng })
            validCount++
          }
        }
      })
      if (validCount > 3) {
        mapRef.current.fitBounds(bounds, { top: 60, bottom: 60, left: 40, right: 40 })
        const listener = google.maps.event.addListenerOnce(mapRef.current, 'idle', () => {
          if (mapRef.current) {
            const z = mapRef.current.getZoom()
            if (typeof z === 'number' && (z < 9 || z > 14)) {
              mapRef.current.setCenter({ lat: 13.6929, lng: -89.2182 })
              mapRef.current.setZoom(10)
            }
          }
        })
      } else {
        mapRef.current.setCenter({ lat: 13.6929, lng: -89.2182 })
        mapRef.current.setZoom(10)
      }
    }
  }, [routes, isLoaded])

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

    const isSpecialOrigin = 
      !origin.trim() || 
      origin === 'Mi ubicación actual' || 
      origin.toLowerCase().includes('ubicación') ||
      origin.toLowerCase().includes('fuera de el salvador')

    if (!isSpecialOrigin) {
      const orig = origin.toLowerCase()
      result = result.filter(r =>
        r.name?.toLowerCase().includes(orig) ||
        r.stops?.some((s: any) => s.name?.toLowerCase().includes(orig))
      )
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
  }, [routes, superCategory, activeCategory, filterService, filterLine, destination, origin, searchQuery])

  // Parser para extraer número/código corto de ruta y separar origen/destino
  const parseRouteDisplay = (routeName: string) => {
    let badge = ''
    let destination = ''
    let origin = ''

    // Detectar si es un Tour turístico
    if (routeName.toLowerCase().startsWith('tour')) {
      return {
        badge: 'Tour',
        origin: 'San Salvador',
        destination: routeName.replace(/^Tour\s+/i, '').trim(),
      }
    }

    // Detectar patrones como "Ruta 117-A", "Ruta 2-A", "Ruta 900-1", "Ruta 12", etc.
    const routeNumMatch = routeName.match(/Ruta\s+([0-9]+[A-Za-z0-9\-\/]*)/i)
    if (routeNumMatch) {
      badge = routeNumMatch[1]
    } else {
      const parts = routeName.split(/[:\-|➔]/)[0].trim()
      badge = parts.replace(/^Ruta\s+/i, '').trim().slice(0, 8)
    }

    if (routeName.includes('->')) {
      const splitArr = routeName.split('->')
      destination = splitArr[1]?.trim() || ''
      const originPart = splitArr[0]?.split(':')
      origin = originPart.length > 1 ? originPart[1]?.trim() : originPart[0]?.trim()
    } else if (routeName.includes(' - ')) {
      const splitArr = routeName.split(' - ')
      origin = splitArr[0]?.replace(/^Ruta\s+[^:]*:\s*/i, '').trim()
      destination = splitArr[1]?.trim() || ''
    } else {
      destination = routeName
    }

    destination = destination.replace(/^Punto Final/i, '').replace(/Centro SS/i, 'San Salvador').trim()
    origin = origin.replace(/^Punto Inicial/i, '').trim()

    return {
      badge: badge || 'Bus',
      origin: origin || 'Origen',
      destination: destination || 'Destino',
    }
  }

  // Sugerencias predictivas en vivo para Origen
  const originSuggestions = useMemo(() => {
    if (!origin || origin.trim().length === 0) {
      return POPULAR_SALVADOR_PLACES
    }
    const q = origin.toLowerCase()
    const matches: any[] = []
    for (const p of POPULAR_SALVADOR_PLACES) {
      if (p.name.toLowerCase().includes(q)) matches.push(p)
    }
    for (const r of routes) {
      const disp = parseRouteDisplay(r.name)
      if (disp.origin.toLowerCase().includes(q) && !matches.some(m => m.name === disp.origin)) {
        matches.push({ name: disp.origin, category: `Ruta ${disp.badge}`, icon: "Bus", route: r })
      }
    }
    return matches.slice(0, 20)
  }, [origin, routes])

  // Lista memoizada de tours turísticos oficiales
  const tourRoutes = useMemo(() => {
    return routes.filter(r => r.route_type === 'TOUR' || r.name?.toLowerCase().startsWith('tour'))
  }, [routes])

  // Sugerencias predictivas en vivo para Destino
  const destSuggestions = useMemo(() => {
    if (!destination || destination.trim().length === 0) {
      if (superCategory === 'TOUR') {
        const tourMatches = routes
          .filter(r => r.route_type === 'TOUR' || r.name?.toLowerCase().startsWith('tour'))
          .slice(0, 10)
          .map(r => ({
            name: r.name,
            category: r.duracion ? `Tour Oficial • ${r.duracion}` : 'Tour Oficial',
            icon: "Camera",
            route: r
          }))
        if (tourMatches.length > 0) return tourMatches
      }
      return POPULAR_SALVADOR_PLACES
    }
    const q = destination.toLowerCase()
    const matches: any[] = []
    for (const p of POPULAR_SALVADOR_PLACES) {
      if (p.name.toLowerCase().includes(q)) matches.push(p)
    }
    for (const r of routes) {
      const isTour = r.route_type === 'TOUR' || r.name?.toLowerCase().startsWith('tour')
      const disp = parseRouteDisplay(r.name)
      const label = isTour ? r.name : disp.destination
      const matchCriteria = label.toLowerCase().includes(q) || 
                            r.name?.toLowerCase().includes(q) || 
                            r.stops?.some((s: any) => s.name?.toLowerCase().includes(q))
      if (matchCriteria && !matches.some(m => m.name === label)) {
        matches.push({
          name: label,
          category: isTour ? (r.duracion ? `Tour Oficial • ${r.duracion} • $${r.price_one_way || 0}` : `Tour Oficial • $${r.price_one_way || 0}`) : `Ruta ${disp.badge}`,
          icon: isTour ? "Camera" : "Bus",
          route: r
        })
      }
    }
    return matches.slice(0, 20)
  }, [destination, routes, superCategory])

  const handleUseCurrentLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          const isInsideElSalvador = lat >= 13.1 && lat <= 14.5 && lng >= -90.2 && lng <= -87.6

          if (isInsideElSalvador) {
            setOrigin("Mi ubicación actual")
            setGpsNotice(null)
            if (mapRef.current) {
              mapRef.current.panTo({ lat, lng })
              mapRef.current.setZoom(14)
            }
          } else {
            // Usuario en el extranjero (turista o explorando desde otro país)
            // No sobreescribir falsamente con "San Salvador". Identificar ubicación real:
            if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
              const geocoder = new (window as any).google.maps.Geocoder()
              geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
                if (status === 'OK' && results && results[0]) {
                  const countryComp = results[0].address_components?.find((c: any) => c.types.includes('country'))
                  const cityComp = results[0].address_components?.find((c: any) => c.types.includes('locality') || c.types.includes('administrative_area_level_1'))
                  const locLabel = cityComp ? `${cityComp.long_name}, ${countryComp?.short_name || ''}` : countryComp?.long_name || "Fuera de El Salvador"
                  setOrigin(`Mi ubicación (${locLabel})`)
                } else {
                  setOrigin("Mi ubicación (Fuera de El Salvador)")
                }
              })
            } else {
              setOrigin("Mi ubicación (Fuera de El Salvador)")
            }

            setGpsNotice({
              type: 'outside',
              title: '📍 Modo Viajero Internacional',
              message: 'Detectamos tu GPS en el extranjero. Nuestras rutas de transporte operan dentro de El Salvador. Para planear tu recorrido, elige tu punto de llegada o terminal:'
            })

            // Centrar el mapa en El Salvador para que pueda explorar las rutas
            if (mapRef.current) {
              mapRef.current.panTo({ lat: 13.6929, lng: -89.2182 })
              mapRef.current.setZoom(12)
            }
          }
          setShowOriginSuggestions(false)
        },
        (err) => {
          console.warn("Geolocalización error:", err)
          setGpsNotice({
            type: 'error',
            title: 'GPS no disponible',
            message: 'No pudimos acceder a tu ubicación actual. Puedes escribir tu punto de partida directamente.'
          })
          setShowOriginSuggestions(false)
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    } else {
      setGpsNotice({
        type: 'error',
        title: 'GPS no compatible',
        message: 'Tu navegador no soporta geolocalización. Escribe tu punto de partida.'
      })
      setShowOriginSuggestions(false)
    }
  }

  // Precalcular micro-dispersión orbital para evitar amontonamiento en terminales o destinos con coordenadas idénticas
  const routePositions = useMemo(() => {
    const coordGroups: { [key: string]: number[] } = {}
    filteredRoutes.forEach((route, i) => {
      if (!route.stops?.length) return
      // Para tours turísticos, posicionar el marcador en la parada 2 (destino emblemático)
      // para evitar que los 69 tours se amontonen en el punto de recogida general de San Salvador (parada 1)
      const primaryStop = (route.route_type === 'TOUR' && route.stops.length > 1) 
        ? route.stops[1] 
        : route.stops[0]
      const lat = primaryStop.latitude
      const lng = primaryStop.longitude
      // Agrupar rutas en un radio estrecho (~150m)
      const key = `${lat.toFixed(3)},${lng.toFixed(3)}`
      if (!coordGroups[key]) coordGroups[key] = []
      coordGroups[key].push(i)
    })

    return filteredRoutes.map((route, i) => {
      if (!route.stops?.length) return { pos: { lat: 13.6893, lng: -89.1872 }, offsetX: 0, offsetY: 0 }
      const primaryStop = (route.route_type === 'TOUR' && route.stops.length > 1) 
        ? route.stops[1] 
        : route.stops[0]
      const lat = primaryStop.latitude
      const lng = primaryStop.longitude
      const key = `${lat.toFixed(3)},${lng.toFixed(3)}`
      const group = coordGroups[key] || [i]
      const indexInGroup = group.indexOf(i)
      const countInGroup = group.length

      let offsetX = 0
      let offsetY = 0
      if (countInGroup > 1) {
        // Dispersión radial limpia y estética solo para las que comparten el mismo punto de origen o destino
        const radius = Math.min(26, 14 + countInGroup * 2)
        const angle = (indexInGroup / countInGroup) * 2 * Math.PI
        offsetX = Math.round(Math.cos(angle) * radius)
        offsetY = Math.round(Math.sin(angle) * radius)
      }

      return {
        pos: { lat, lng },
        offsetX,
        offsetY,
      }
    })
  }, [filteredRoutes])

  const previewPathCoordinates = useMemo(() =>
    previewRoute?.stops?.map((s: any) => ({ lat: s.latitude, lng: s.longitude })) || []
  , [previewRoute])

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

  // Componente reutilizable para las 3 tarjetas de acción rápida
  const renderQuickActions = () => (
    <div className="grid grid-cols-3 gap-2 shrink-0">
      <button
        type="button"
        onClick={() => {
          setSuperCategory('INTERURBANO')
          setView('list')
        }}
        className={`border rounded-2xl p-2.5 flex items-center justify-between text-left transition-all active:scale-95 shadow-2xs group ${
          superCategory === 'INTERURBANO' ? 'bg-[#d1fae5] border-emerald-300 ring-2 ring-emerald-200' : 'bg-[#ecfdf5] hover:bg-[#d1fae5] border-emerald-100'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-emerald-600/10 text-[#064e3b] flex items-center justify-center shrink-0">
            <Bus className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold text-gray-800 leading-tight">Viaja entre ciudades</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-emerald-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </button>

      <button
        type="button"
        onClick={() => {
          setSuperCategory('URBANO')
          setIsUserRoutesModalOpen(true)
        }}
        className={`border rounded-2xl p-2.5 flex items-center justify-between text-left transition-all active:scale-95 shadow-2xs group ${
          superCategory === 'URBANO' ? 'bg-[#ecfccb] border-lime-300 ring-2 ring-lime-200' : 'bg-[#f7fee7] hover:bg-[#ecfccb] border-lime-100'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-lime-600/10 text-lime-800 flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold text-gray-800 leading-tight">Muévete en la ciudad</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-lime-800 shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </button>

      <button
        type="button"
        onClick={() => {
          setSuperCategory('TOUR')
          if (view !== 'map') setView('map')
        }}
        className={`border rounded-2xl p-2.5 flex items-center justify-between text-left transition-all active:scale-95 shadow-2xs group ${
          superCategory === 'TOUR' ? 'bg-[#fef3c7] border-amber-300 ring-2 ring-amber-200' : 'bg-[#fffbeb] hover:bg-[#fef3c7] border-amber-100'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-amber-600/10 text-amber-800 flex items-center justify-center shrink-0">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold text-gray-800 leading-tight">Explora tours</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-amber-800 shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  )

  // Componente reutilizable para los destinos destacados / tours reales
  const renderFeaturedDestinations = () => {
    const isTourCategory = superCategory === 'TOUR'
    const tourCards = tourRoutes.slice(0, 4)

    return (
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-black text-gray-900 tracking-tight">
              {isTourCategory ? 'Tours para explorar' : 'Destinos para explorar'}
            </h3>
            {isTourCategory && tourRoutes.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                {tourRoutes.length}
              </span>
            )}
          </div>
          <button 
            type="button"
            onClick={() => setView('list')} 
            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
            title="Ver en lista"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isTourCategory && tourCards.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {tourCards.map((tour) => {
              const targetStop = (tour.stops && tour.stops.length > 1) ? tour.stops[1] : tour.stops?.[0]
              const coverImg = getRouteImageUrl(tour)
              return (
                <div
                  key={tour.id}
                  className="relative h-36 lg:h-40 rounded-2xl overflow-hidden shadow-md group cursor-pointer border border-amber-100/70 bg-gray-900 transition-all hover:shadow-lg hover:border-amber-400"
                  onClick={() => {
                    setSelectedRoute(tour)
                    setPreviewRoute(tour)
                    if (view !== 'map') setView('map')
                    if (mapRef.current && targetStop) {
                      mapRef.current.panTo({ lat: targetStop.latitude, lng: targetStop.longitude })
                      mapRef.current.setZoom(13)
                    }
                  }}
                >
                  <img
                    src={coverImg}
                    alt={tour.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={handleImageFallback}
                  />
                  {/* Badges superiores: Precio y Duración */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none z-10">
                    {tour.price_one_way ? (
                      <span className="bg-black/75 backdrop-blur-md text-amber-300 font-black text-[10px] px-2 py-0.5 rounded-full border border-amber-400/30 shadow-xs">
                        ${tour.price_one_way}
                      </span>
                    ) : <span />}
                    {tour.duracion ? (
                      <span className="bg-black/60 backdrop-blur-md text-white/90 font-bold text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-white/20">
                        <Clock className="w-2.5 h-2.5 text-amber-300" />
                        {tour.duracion}
                      </span>
                    ) : null}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent p-2.5 flex flex-col justify-end text-white z-0">
                    <span className="text-[11px] sm:text-xs font-black text-white leading-tight mb-1.5 drop-shadow-sm line-clamp-2">
                      {tour.name.replace(/^Tour\s+/i, '')}
                    </span>
                    <button
                      type="button"
                      className="bg-[#a3e635] hover:bg-[#86efac] text-[#064e3b] font-black text-[10px] py-1 px-2.5 rounded-full flex items-center justify-center gap-1 shadow-xs transition-transform active:scale-95 w-fit"
                    >
                      <span>Ver tour</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {FEATURED_DESTINATIONS.slice(0, 2).map((dest) => (
              <div
                key={dest.id}
                className="relative h-32 lg:h-36 rounded-2xl overflow-hidden shadow-md group cursor-pointer border border-gray-100"
                onClick={() => handleSelectDestination(dest)}
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-2.5 flex flex-col justify-end text-white">
                  <span className="text-xs font-black text-white leading-tight mb-1.5 drop-shadow-sm">{dest.name}</span>
                  <button
                    type="button"
                    className="bg-[#a3e635] hover:bg-[#86efac] text-[#064e3b] font-black text-[10px] py-1 px-2.5 rounded-full flex items-center justify-center gap-1 shadow-xs transition-transform active:scale-95 w-fit"
                  >
                    <span>Ver opciones</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-gray-400 text-[11px] font-medium mt-0.5">
          {isTourCategory ? (
            <>
              <span className="flex items-center gap-1 text-emerald-800 font-semibold text-[10px]">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Tours oficiales con fotos reales y precios USD
              </span>
              <button
                type="button"
                onClick={() => setView('list')}
                className="text-emerald-700 font-bold text-[10px] hover:underline"
              >
                Ver los {tourRoutes.length} tours ›
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Vista de ejemplo</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Componente reutilizable para el slider de publicidad
  const renderPromoSliderBanner = () => {
    if (!showPromoBanner) return null;
    return (
      <div className="shrink-0 pt-1">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Promociones & Experiencias</span>
          <button
            type="button"
            onClick={() => setShowPromoBanner(false)}
            className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
            title="Ocultar publicidad"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <div 
          onClick={() => handlePromoSlideClick(currentPromoSlide)}
          className="relative w-full h-[95px] rounded-2xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer bg-gray-100"
        >
          <img 
            src={currentPromoSlide.image} 
            alt={currentPromoSlide.title || "Banner Publicidad"}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent p-3 flex flex-col justify-end text-white pointer-events-none">
            <h4 className="text-xs sm:text-sm font-black tracking-tight leading-tight drop-shadow-sm">
              {currentPromoSlide.title}
            </h4>
            <p className="text-[10px] text-white/90 line-clamp-1 font-medium drop-shadow-xs">
              {currentPromoSlide.subtitle}
            </p>
          </div>
          {/* Indicadores de slides */}
          <div className="absolute bottom-2 right-3 z-20 flex gap-1 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
            {promoSlides.map((_, i) => (
              <button 
                key={i} 
                type="button"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setCurrentPromoIndex(i); 
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === (currentPromoIndex % promoSlides.length) ? 'w-4 bg-[#a3e635]' : 'w-1.5 bg-white/60'
                }`} 
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Componente reutilizable para la tarjeta de búsqueda
  const renderSearchCardUnified = () => (
    <div className="bg-white rounded-3xl shadow-md p-2.5 border border-gray-100 flex flex-col gap-2 relative">
      {/* Input de Búsqueda de Destino */}
      <div className="relative flex items-center px-2 py-1">
        <Search className="w-4 h-4 text-gray-400 shrink-0 mr-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setDestination(e.target.value)
            setIsSearchFocused(true)
          }}
          onFocus={() => setIsSearchFocused(true)}
          placeholder="¿Cuál es tu destino?"
          className="w-full text-xs sm:text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none bg-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("")
              setDestination("")
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Separador sutil */}
      <div className="h-px bg-gray-100 w-full" />

      {/* Fila con las 3 Categorías: Interurbano, Urbano, Tours */}
      <div className="flex items-center justify-between gap-1">
        {/* 1. Interurbano */}
        <button
          type="button"
          onClick={() => setSuperCategory(prev => prev === 'INTERURBANO' ? null : 'INTERURBANO')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
            superCategory === 'INTERURBANO'
              ? 'bg-[#dcfce7] text-[#064e3b] shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Bus className="h-3.5 w-3.5" />
          <span>Interurbano</span>
        </button>

        <div className="w-px h-4 bg-gray-200 shrink-0" />

        {/* 2. Urbano */}
        <button
          type="button"
          onClick={() => setSuperCategory(prev => prev === 'URBANO' ? null : 'URBANO')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
            superCategory === 'URBANO'
              ? 'bg-[#f7fee7] text-lime-800 shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Urbano</span>
        </button>

        <div className="w-px h-4 bg-gray-200 shrink-0" />

        {/* 3. Tours */}
        <button
          type="button"
          onClick={() => setSuperCategory(prev => prev === 'TOUR' ? null : 'TOUR')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
            superCategory === 'TOUR'
              ? 'bg-[#fffbeb] text-amber-800 shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Camera className="h-3.5 w-3.5" />
          <span>Tours</span>
        </button>
      </div>

      {/* Dropdown flotante predictivo */}
      {isSearchFocused && destSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[100] max-h-[300px] overflow-y-auto divide-y divide-gray-100 p-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50/90 rounded-lg mb-1 flex items-center justify-between">
            <span>Sugerencias para El Salvador</span>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setIsSearchFocused(false); }}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {destSuggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                setDestination(item.name)
                setSearchQuery(item.name)
                setIsSearchFocused(false)
                if (item.route) {
                  setSelectedRoute(item.route)
                  setPreviewRoute(item.route)
                  if (view !== 'map') setView('map')
                  const targetStop = (item.route.route_type === 'TOUR' && item.route.stops?.length > 1)
                    ? item.route.stops[1]
                    : item.route.stops?.[0]
                  if (mapRef.current && targetStop) {
                    mapRef.current.panTo({ lat: targetStop.latitude, lng: targetStop.longitude })
                    mapRef.current.setZoom(13)
                  }
                } else {
                  if (view !== 'map') setView('map')
                }
              }}
              className="w-full text-left px-3 py-2 hover:bg-emerald-50/80 active:bg-emerald-100 flex items-center gap-2.5 transition-colors rounded-xl group"
            >
              <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-[#059669]/15 text-gray-600 group-hover:text-[#059669] shrink-0">
                <DynamicIcon name={item.icon || 'MapPin'} className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-gray-900 block truncate group-hover:text-[#064e3b]">
                  {item.name}
                </span>
                <span className="text-[10px] text-gray-500 block truncate">
                  {item.category}
                </span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-emerald-500 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // ─────────────────────────────────────────────
  // PANTALLA 1 — MAPA
  // ─────────────────────────────────────────────
  if (view === 'map' || view === 'list') {
    return (
      <div className="relative w-full h-full flex flex-col lg:flex-row bg-[#F8FAF9] overflow-hidden">

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* COLUMNA IZQUIERDA: PANEL LATERAL ELEGANTE */}
        {/* Desktop (lg:): Siempre visible (w-[420px] xl:w-[450px] 2xl:w-[480px]) */}
        {/* Mobile: Visible solo si view === 'list' (w-full h-full) */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <aside className={`${view === 'list' ? 'flex w-full' : 'hidden lg:flex'} lg:w-[420px] xl:w-[450px] 2xl:w-[480px] h-full flex-col bg-white border-r border-gray-200 shrink-0 z-20 shadow-xl overflow-y-auto p-4 gap-3.5 custom-scrollbar`}>
          {/* Fila Superior: Breadcrumb y Badge Movilidad El Salvador (INMUTABLE Y PERMANENTE) */}
          <div className="flex items-center justify-between shrink-0">
            <button
              onClick={() => {
                if (view === 'list' && typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setView('map')
                } else if (onBack) {
                  onBack()
                } else {
                  setView('map')
                }
              }}
              className="flex items-center gap-1.5 text-xs font-black text-gray-900 hover:text-[#064e3b] transition-all py-1.5 px-3 rounded-xl bg-gray-100/90 hover:bg-emerald-50 border border-gray-200/90 shadow-2xs group"
            >
              <ChevronLeft className="w-4 h-4 text-emerald-700 group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-extrabold tracking-tight">Inicio / Explorar</span>
            </button>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300/50 shadow-2xs">
              Movilidad El Salvador
            </span>
          </div>

          {/* Tarjeta Selva & Panda (Diseño Oficial PalenqueGo) */}
          <div className="relative bg-[#063b27] bg-gradient-to-b from-[#04281a] via-[#064e3b] to-[#043324] rounded-3xl p-4 text-white shadow-lg overflow-hidden shrink-0">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-85 z-0"
              style={{ backgroundImage: `url('/banner-panda.png')` }}
            />
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-center justify-between">
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
              <div>
                <h1 className="text-xl xl:text-2xl font-black text-white leading-tight">
                  ¿A dónde <span className="text-[#a3e635]">vamos?</span>
                </h1>
                <p className="text-xs text-white/85 mt-0.5 font-medium">
                  {view === 'list' ? 'Tu próxima ruta empieza aquí.' : 'Explora rutas, traslados y experiencias'}
                </p>
              </div>
            </div>
          </div>

          {/* ─── VISTA MAPA: BUSCADOR UNIFICADO Y DESCUBRE PALENQUE ─── */}
          {view === 'map' && (
            <>
              {/* Tarjeta Unificada de Búsqueda */}
              <div className="shrink-0">
                {renderSearchCardUnified()}
              </div>

              {/* Chip de Campaña Activa si proviene de Publicidad */}
              {activeCampaign && (
                <div className="shrink-0 bg-gradient-to-r from-emerald-600/90 to-teal-700/90 text-white p-2 px-3 rounded-2xl border border-emerald-300/30 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#a3e635] shrink-0" />
                    <div>
                      <span className="text-xs font-black block leading-none">{activeCampaign.name}</span>
                      <span className="text-[10px] text-white/80 block mt-0.5">Mostrando experiencias para {activeCampaign.target}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveCampaign(null)} 
                    className="p-1 hover:bg-white/20 rounded-full text-white/80 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Banner Dinámico Modo Urbano / Taxi */}
              {superCategory === 'URBANO' && (
                <div className="shrink-0 bg-gradient-to-r from-[#04281a] to-[#064e3b] text-white p-2.5 px-3 rounded-2xl border border-emerald-400/30 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-[#a3e635]">
                      <Car className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white leading-tight">Taxi & Rutas Urbanas</p>
                      <p className="text-[9px] text-white/70">Pide a demanda o propón tu tarifa</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsUserRoutesModalOpen(true)}
                    className="bg-[#a3e635] hover:bg-[#86efac] text-[#064e3b] font-black text-[11px] h-7 px-2.5 rounded-xl shadow-xs"
                  >
                    + Pedir Viaje
                  </Button>
                </div>
              )}

              {/* Sección: Descubre Palenque (3 Cards) */}
              <div className="flex flex-col gap-2 shrink-0">
                <div>
                  <h2 className="text-base font-black text-gray-900 tracking-tight leading-none">
                    Descubre <span className="text-[#16a34a]">Palenque</span>
                  </h2>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">Servicios de movilidad y turismo</p>
                </div>
                {renderQuickActions()}
              </div>

              {/* Sección: Destinos para Explorar */}
              {renderFeaturedDestinations()}

              {/* Banner Promocional Slider */}
              {renderPromoSliderBanner()}
            </>
          )}

          {/* ─── VISTA LISTA: CATEGORÍAS, RUTAS PARA TU VIAJE, FILTROS Y TARJETAS ─── */}
          {view === 'list' && (
            <>
              {/* BARRA DE LAS 3 SUPER CATEGORÍAS */}
              <div className="bg-gray-100/90 rounded-2xl p-1.5 flex items-center justify-between gap-1 border border-gray-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setSuperCategory(prev => prev === 'INTERURBANO' ? null : 'INTERURBANO')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                    superCategory === 'INTERURBANO'
                      ? 'bg-white text-[#064e3b] shadow-xs border border-emerald-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                  }`}
                >
                  <Bus className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Interurbano</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSuperCategory(prev => prev === 'URBANO' ? null : 'URBANO')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                    superCategory === 'URBANO'
                      ? 'bg-white text-[#064e3b] shadow-xs border border-emerald-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Urbano</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSuperCategory(prev => prev === 'TOUR' ? null : 'TOUR')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                    superCategory === 'TOUR'
                      ? 'bg-white text-[#064e3b] shadow-xs border border-emerald-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                  }`}
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Tours</span>
                </button>
              </div>

              {/* BARRA: "Rutas para tu viaje" + Botones Filtros & Mapa */}
              <div className="flex items-center justify-between pt-1 pb-1 shrink-0">
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">Rutas para tu viaje</h2>
                  <span className="inline-block text-[11px] font-bold text-[#064e3b] bg-emerald-100/70 px-2 py-0.5 rounded-md mt-0.5">
                    {superCategory === 'INTERURBANO' ? 'Interurbano' : superCategory === 'URBANO' ? 'Urbano' : 'Tours'}
                    {activeCategory && ` · ${activeCategory}`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsUserRoutesModalOpen(true)}
                    className="flex items-center gap-1 bg-white hover:bg-gray-50 text-[#064e3b] font-bold text-xs px-2.5 py-1.5 rounded-xl shadow-xs border border-emerald-100 transition-all active:scale-95"
                  >
                    <Car className="h-3.5 w-3.5 text-[#059669]" />
                    <span>Mis Rutas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFilterModalOpen(true)}
                    className="flex items-center gap-1 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs px-2.5 py-1.5 rounded-xl shadow-xs border border-gray-200 transition-all active:scale-95"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-[#059669]" />
                    <span>Filtros</span>
                  </button>

                  {/* Botón Mapa solo en móvil para regresar */}
                  <button
                    type="button"
                    onClick={() => setView('map')}
                    className="lg:hidden flex items-center gap-1 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs px-2.5 py-1.5 rounded-xl shadow-xs border border-gray-200 transition-all active:scale-95"
                  >
                    <Map className="h-3.5 w-3.5 text-[#059669]" />
                    <span>Mapa</span>
                  </button>
                </div>
              </div>

              {/* Buscador Rápido de Rutas */}
              <div className="relative shrink-0">
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
              <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto min-h-0 pr-1">
                {filteredRoutes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <MapPin className="h-10 w-10 mb-2 opacity-30 text-gray-400" />
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
                      className="mt-3 rounded-xl text-xs font-bold"
                    >
                      Restablecer filtros
                    </Button>
                  </div>
                ) : (
                  filteredRoutes.map((route) => {
                    const rColor = route.category?.color || '#059669';
                    const isPreview = previewRoute?.id === route.id;
                    return (
                      <div
                        key={route.id}
                        onMouseEnter={() => setHoveredRouteId(route.id)}
                        onMouseLeave={() => setHoveredRouteId(null)}
                        onClick={() => {
                          setPreviewRoute(route);
                          const targetStop = (route.route_type === 'TOUR' && route.stops?.length > 1) 
                            ? route.stops[1] 
                            : route.stops?.[0];
                          if (mapRef.current && targetStop) {
                            mapRef.current.panTo({ lat: targetStop.latitude, lng: targetStop.longitude });
                            mapRef.current.setZoom(13);
                          }
                        }}
                        className={`bg-white rounded-2xl p-3 shadow-xs border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isPreview ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative border border-gray-100 shadow-2xs"
                            style={{ backgroundColor: `${rColor}15` }}
                          >
                            {route.imagen_portada ? (
                              <img
                                src={formatImageUrl(route.imagen_portada)}
                                alt={route.name}
                                className="w-full h-full object-cover"
                                onError={handleImageFallback}
                              />
                            ) : (
                              <DynamicIcon name={route.category?.icon || (route.route_type === 'TOUR' ? 'Camera' : 'Bus')} className="h-5 w-5" style={{ color: rColor }} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-extrabold text-gray-900 text-sm leading-tight truncate">
                              {route.name}
                            </h3>
                            <p className="text-[11px] text-gray-500 mt-0.5 truncate flex items-center gap-1.5 flex-wrap">
                              {route.duracion && (
                                <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                                  ⏱️ {route.duracion}
                                </span>
                              )}
                              <span>
                                {route.route_type === 'TOUR' ? 'Tour oficial' : `Ruta ${route.route_type ? route.route_type.toLowerCase() : 'interurbana'}`} · {route.stops?.length || 0} paradas {route.price_one_way ? `· $${route.price_one_way}` : ''}
                              </span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRoute(route);
                            setView('detail');
                          }}
                          className="shrink-0 flex items-center gap-1 border border-[#064e3b] text-[#064e3b] hover:bg-emerald-50 active:scale-95 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs"
                        >
                          <span>Ver {route.route_type === 'TOUR' ? 'tour' : 'ruta'}</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* SLIDER PUBLICITARIO AL FONDO DE LA LISTA */}
              {renderPromoSliderBanner()}
            </>
          )}
        </aside>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* CABECERA COMPACTA MOBILE (SOLO PANTALLAS PEQUEÑAS CUANDO VIEW === 'MAP') */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {view === 'map' && (
          <div className="lg:hidden relative z-20 bg-[#063b27] bg-gradient-to-b from-[#04281a] via-[#064e3b] to-[#043324] w-full pt-3 pb-3 px-3.5 shadow-xl shrink-0 rounded-b-[24px]">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-85 z-0 rounded-b-[24px] overflow-hidden"
              style={{ backgroundImage: `url('/banner-panda.png')` }}
            />
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    title="Abrir menú"
                    className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 border border-white/30 flex items-center justify-center transition-all shadow-xs shrink-0"
                  >
                    <Menu className="w-4 h-4 text-white stroke-[2.5]" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shadow-xs">
                      <Navigation2 className="h-3.5 w-3.5 text-[#a3e635] rotate-45" />
                    </div>
                    <span className="text-base font-black tracking-tight text-white flex items-center">
                      Palenque<span className="text-[#a3e635]">Go</span>
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => onNavigate('profile')} 
                  className="w-7 h-7 rounded-full bg-amber-700/80 border border-amber-500/40 flex items-center justify-center text-[11px] font-bold text-white shadow-sm overflow-hidden"
                  title="Mi Perfil"
                >
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    currentUser?.name?.[0]?.toUpperCase() || 'M'
                  )}
                </button>
              </div>
              {renderSearchCardUnified()}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* ÁREA CENTRAL: MAPA COMPLETO INTERACTIVO (100% VISIBILIDAD) */}
        {/* En Desktop: Siempre visible y activo */}
        {/* En Mobile: Visible solo si view === 'map' */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <div className={`relative flex-1 h-full w-full overflow-hidden z-0 min-h-[220px] ${view === 'list' ? 'hidden lg:block' : 'block'}`}>
          {isLoaded ? (
            <GoogleMap 
              mapContainerStyle={containerStyle} 
              center={mapCenter} 
              zoom={mapZoom}
              options={{ disableDefaultUI: true, zoomControl: false, styles: MAP_STYLES }}
              onLoad={(map) => { mapRef.current = map }}
              onZoomChanged={() => {
                if (mapRef.current) {
                  const z = mapRef.current.getZoom()
                  if (typeof z === 'number') setMapZoom(z)
                }
              }}
              onClick={(e) => {
                setPreviewRoute(null)
                handleMapClick(e)
              }}
            >
              {currentPickedOrigin && (
                <Marker
                  position={{ lat: currentPickedOrigin.lat, lng: currentPickedOrigin.lng }}
                  label={{ text: "A", color: "white", fontWeight: "bold" }}
                  title="Punto de Origen"
                />
              )}
              {currentPickedDestination && (
                <Marker
                  position={{ lat: currentPickedDestination.lat, lng: currentPickedDestination.lng }}
                  label={{ text: "B", color: "white", fontWeight: "bold" }}
                  title="Destino"
                />
              )}

              {/* Trazado Vectorial GPS de la Ruta Previsualizada */}
              {previewPathCoordinates.length > 1 && (
                <Polyline
                  path={previewPathCoordinates}
                  options={{
                    strokeColor: previewRoute?.category?.color || '#059669',
                    strokeOpacity: 0.9,
                    strokeWeight: 5,
                  }}
                />
              )}

              {/* PINES ESTRATÉGICOS DESTACADOS (Santa Ana, San Salvador, La Libertad, Suchitoto, San Vicente, Aeropuerto) */}
              {mapZoom < 12 && !activeCategory && !searchQuery && STRATEGIC_HUBS.map((hub) => (
                <OverlayView key={hub.id} position={{ lat: hub.lat, lng: hub.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      handleHubClick(hub)
                    }}
                    className="absolute -translate-x-1/2 -translate-y-full cursor-pointer group transition-transform hover:scale-110 active:scale-95 z-20"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white transition-all group-hover:ring-4 group-hover:ring-emerald-300"
                        style={{ backgroundColor: hub.color }}
                      >
                        <DynamicIcon name={hub.icon} className="w-4 h-4" />
                      </div>
                      <div
                        className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px]"
                        style={{ borderTopColor: hub.color }}
                      />
                      <div className="mt-0.5 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-md border border-gray-100 flex items-center gap-1">
                        <span className="text-[10px] font-black text-gray-800 whitespace-nowrap">{hub.name}</span>
                      </div>
                    </div>
                  </div>
                </OverlayView>
              ))}

              {/* Marcadores de Rutas Detalladas (al hacer zoom o filtrar) */}
              {(mapZoom >= 12 || activeCategory || searchQuery || superCategory) && filteredRoutes.map((route, idx) => {
                if (!route.stops?.length) return null
                const { pos, offsetX, offsetY } = routePositions[idx] || { pos: { lat: route.stops[0].latitude, lng: route.stops[0].longitude }, offsetX: 0, offsetY: 0 }
                const isTour = route.route_type === 'TOUR' || route.name?.toLowerCase().startsWith('tour')
                const rColor = isTour ? '#ea580c' : (route.category?.color || '#059669')
                const rIcon  = isTour ? 'Camera' : (route.category?.icon  || 'Bus')
                const info   = parseRouteDisplay(route.name)
                const isPreview = previewRoute?.id === route.id
                const isHovered = hoveredRouteId === route.id
                const isHighlighted = isPreview || isHovered

                return (
                  <OverlayView key={route.id} position={pos} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                    <div
                      className={`absolute -translate-x-1/2 -translate-y-full cursor-pointer transition-all duration-200 ${
                        isHighlighted ? 'z-50 scale-110' : 'z-10 hover:scale-105 hover:z-40'
                      }`}
                      style={{ marginLeft: `${offsetX}px`, marginTop: `${offsetY}px` }}
                      onMouseEnter={() => setHoveredRouteId(route.id)}
                      onMouseLeave={() => setHoveredRouteId(null)}
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewRoute(route)
                        const primaryStop = (route.route_type === 'TOUR' && route.stops?.length > 1) 
                          ? route.stops[1] 
                          : route.stops[0]
                        if (mapRef.current && primaryStop) {
                          mapRef.current.panTo({ lat: primaryStop.latitude, lng: primaryStop.longitude })
                        }
                      }}
                    >
                      {mapZoom < 12 ? (
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-white font-extrabold text-[11px] shadow-md border-2 transition-all ${
                              isHighlighted ? 'ring-4 ring-orange-300 scale-110' : 'border-white'
                            }`}
                            style={{ backgroundColor: rColor }}
                          >
                            <DynamicIcon name={rIcon} className="h-3 w-3 shrink-0" />
                            <span className="leading-tight tracking-tight">{isTour ? 'Tour' : info.badge}</span>
                          </div>
                          <div
                            className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px]"
                            style={{ borderTopColor: rColor }}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex items-center gap-1.5 bg-white rounded-full p-1 pr-2.5 shadow-lg border transition-all ${
                              isHighlighted ? 'ring-2 ring-orange-400 border-orange-500 scale-105' : 'border-gray-200'
                            }`}
                          >
                            <div
                              className="h-6 px-2 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-xs"
                              style={{ backgroundColor: rColor }}
                            >
                              <span>{isTour ? 'Tour' : info.badge}</span>
                            </div>
                            <div className="flex flex-col text-left leading-none">
                              <span className="text-[11px] font-bold text-gray-800 whitespace-nowrap max-w-[130px] truncate">
                                {isTour ? (route.stops?.[1]?.name || info.destination) : (info.destination || info.origin)}
                              </span>
                              {route.price_one_way ? (
                                <span className="text-[9px] font-semibold text-emerald-600">
                                  ${route.price_one_way}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white shadow-sm" />
                        </div>
                      )}
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

          {/* CONTROLES FLOTANTES SUPERIORES */}
          <div className="absolute top-3.5 right-3.5 z-20 flex items-center pointer-events-none">
            {/* Toggle Flotante Mapa / Lista */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-lg border border-gray-200/80 flex items-center gap-0.5 pointer-events-auto">
              <button
                type="button"
                onClick={() => setView('map')}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 ${
                  view === 'map'
                    ? 'bg-[#dcfce7] text-[#064e3b] font-black shadow-xs'
                    : 'font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>Mapa</span>
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 ${
                  view === 'list'
                    ? 'bg-[#dcfce7] text-[#064e3b] font-black shadow-xs'
                    : 'font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Lista</span>
              </button>
            </div>
          </div>

          {/* BOTÓN FLOTANTE INFERIOR: EXPLORAR ESTA ZONA */}
          <div className="absolute bottom-32 lg:bottom-6 left-0 right-0 z-20 flex items-center justify-center pointer-events-none px-4">
            <button
              type="button"
              onClick={handleExploreCurrentZone}
              className="bg-[#064e3b] hover:bg-[#043324] text-white font-bold text-xs py-2.5 px-4 rounded-full shadow-xl flex items-center gap-2 transition-all active:scale-95 border border-emerald-400/40 pointer-events-auto"
            >
              <Navigation2 className="w-3.5 h-3.5 text-[#a3e635] rotate-45" />
              <span>Explorar esta zona</span>
            </button>
          </div>

          {/* BOTÓN FLOTANTE INFERIOR: BRÚJULA RE-CENTRADORA */}
          <div className="absolute bottom-32 lg:bottom-6 right-4 z-20 pointer-events-auto">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="bg-white hover:bg-gray-50 text-[#064e3b] w-10 h-10 rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-all active:scale-95"
              title="Mi ubicación actual"
            >
              <Compass className="w-5 h-5 text-emerald-700" />
            </button>
          </div>

          {/* TARJETA FLOTANTE DE RUTA SELECCIONADA / PREVIEW */}
          {previewRoute && (() => {
            // Extraer todas las imágenes disponibles (múltiples separadas por coma, campo imagenes, o paradas)
            const previewImages: string[] = [];
            if (previewRoute.imagenes && Array.isArray(previewRoute.imagenes)) {
              previewImages.push(...previewRoute.imagenes);
            } else if (previewRoute.imagen_portada) {
              const parts = previewRoute.imagen_portada.split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean);
              previewImages.push(...parts);
            }
            if (previewRoute.stops && Array.isArray(previewRoute.stops)) {
              previewRoute.stops.forEach((s: any) => {
                if (s.imagen && !previewImages.includes(s.imagen)) previewImages.push(s.imagen);
                if (s.image && !previewImages.includes(s.image)) previewImages.push(s.image);
              });
            }

            const currentImage = previewImages[previewImageIdx] || previewImages[0];

            return (
              <div className="absolute top-3 sm:top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-88 md:w-92 z-30 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-gray-200 flex flex-col gap-2 relative overflow-hidden max-h-[calc(100vh-2.5rem)] overflow-y-auto">
                  
                  {/* CARRUSEL / SLIDER DE IMÁGENES */}
                  {previewImages.length > 0 && (
                    <div className="relative -mx-3 sm:-mx-3.5 -mt-3 sm:-mt-3.5 h-26 sm:h-28 overflow-hidden group bg-gray-900">
                      <img 
                        src={formatImageUrl(currentImage)} 
                        alt={previewRoute.name} 
                        className="w-full h-full object-cover transition-all duration-300 select-none"
                        onError={handleImageFallback}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />
                      
                      {/* Botones Prev / Next del Slider */}
                      {previewImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImageIdx((prev) => (prev > 0 ? prev - 1 : previewImages.length - 1));
                            }}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all active:scale-90 shadow-md z-10"
                            title="Foto anterior"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImageIdx((prev) => (prev < previewImages.length - 1 ? prev + 1 : 0));
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all active:scale-90 shadow-md z-10"
                            title="Siguiente foto"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>

                          {/* Dots indicadores */}
                          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                            {previewImages.map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImageIdx(i);
                                }}
                                className={`transition-all rounded-full ${
                                  i === (previewImageIdx % previewImages.length)
                                    ? 'w-4 h-1.5 bg-white shadow-sm'
                                    : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/80'
                                }`}
                              />
                            ))}
                          </div>

                          {/* Contador de fotos */}
                          <span className="absolute top-2.5 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20 z-10">
                            📷 {(previewImageIdx % previewImages.length) + 1}/{previewImages.length}
                          </span>
                        </>
                      )}

                      {previewRoute.duracion && (
                        <span className="absolute bottom-2.5 left-3 bg-black/65 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20 flex items-center gap-1 z-10">
                          ⏱️ {previewRoute.duracion}
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setPreviewRoute(null)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-700 shadow-xs z-20 transition-colors"
                    title="Cerrar vista previa"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-2 pr-8">
                    <div
                      className="px-2.5 py-1 rounded-full text-white text-xs font-black flex items-center gap-1.5 shadow-sm"
                      style={{ backgroundColor: previewRoute.category?.color || (previewRoute.route_type === 'TOUR' ? '#d97706' : '#059669') }}
                    >
                      <DynamicIcon name={previewRoute.category?.icon || (previewRoute.route_type === 'TOUR' ? 'Camera' : 'Bus')} className="h-3.5 w-3.5" />
                      <span>{parseRouteDisplay(previewRoute.name).badge}</span>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 truncate">
                      {previewRoute.category?.name || (previewRoute.route_type === 'TOUR' ? 'Tours & Experiencias' : 'Transporte Colectivo')}
                    </span>
                  </div>

                  {/* Origen y Destino */}
                  <div className="flex flex-col gap-1 bg-gray-50/80 rounded-xl p-2 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0" />
                      <span className="text-xs font-bold text-gray-800 truncate">
                        {parseRouteDisplay(previewRoute.name).origin}
                      </span>
                    </div>
                    <div className="w-0.5 h-2.5 bg-gray-300 ml-1 rounded-full" />
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-200 shrink-0 mt-0.5" />
                      <span className="text-xs font-bold text-gray-800 leading-tight line-clamp-1">
                        {parseRouteDisplay(previewRoute.name).destination}
                      </span>
                    </div>
                  </div>

                  {/* Descripción Completa con Scroll Limpio */}
                  {previewRoute.descripcion && (
                    <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-2 max-h-16 overflow-y-auto pr-1">
                      <p className="text-[11px] text-gray-700 leading-snug font-normal">
                        {previewRoute.descripcion}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 py-0.5 text-center border-y border-gray-100">
                    <div>
                      <span className="text-[9px] text-gray-500 block uppercase font-medium">
                        {previewRoute.route_type === 'TOUR' ? 'Tarifa Tour' : 'Tarifa Ida'}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-emerald-600">
                        ${previewRoute.price_one_way || '0.25'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 block uppercase font-medium">
                        {previewRoute.route_type === 'TOUR' ? 'Duración' : 'Tarifa Vuelta'}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-gray-700">
                        {previewRoute.route_type === 'TOUR' ? (previewRoute.duracion || '-') : `$${previewRoute.price_round_trip || '0.50'}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 block uppercase font-medium">Paradas</span>
                      <span className="text-xs sm:text-sm font-black text-gray-700">
                        {previewRoute.stops?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* CINTILLO Y ACCIONES DE POOL SEGÚN INTENCIÓN DEL USUARIO */}
                  {(() => {
                    const isInterestMarked = registeredRouteInterests.includes(previewRoute.id);
                    const discountPct = (previewRoute as any).descuento_pool || (previewRoute.route_type === 'TOUR' ? 20 : 15);
                    const isLeader = userIntentions?.wantsToLeadPools;
                    const isTraveler = userIntentions?.isTraveler ?? true;

                    return (
                      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            Ahorra hasta {discountPct}% en grupo
                          </span>
                          <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded-full">
                            Tarifa Pool
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isTraveler && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                registerRouteInterest(previewRoute.id);
                              }}
                              className={`flex-1 text-[11px] font-bold py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-95 ${
                                isInterestMarked
                                  ? "bg-emerald-600 text-white"
                                  : "bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100/50"
                              }`}
                            >
                              <span>{isInterestMarked ? "✓ Te avisaremos" : "🔔 Me interesa"}</span>
                            </button>
                          )}

                          {isLeader && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPoolRouteForModal(previewRoute);
                              }}
                              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>Armar viaje</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <Button
                    onClick={() => {
                      setSelectedRoute(previewRoute);
                      setIsSheetExpanded(false);
                      setView('detail');
                    }}
                    className="w-full bg-[#064e3b] hover:bg-[#043324] text-white font-bold text-xs h-9 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <span>Ver Recorrido & Paradas</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* BOTTOM SHEET INFERIOR COLAPSABLE (SOLO MOBILE EN MODO MAPA) */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {view === 'map' && (
            <div 
              className={`lg:hidden absolute bottom-16 left-0 right-0 z-30 bg-white shadow-2xl border-t border-gray-200 transition-all duration-300 ease-out flex flex-col ${
                isSheetExpanded 
                  ? 'max-h-[55vh] rounded-t-[28px] overflow-y-auto px-4 pt-2.5 pb-6' 
                  : 'h-14 rounded-t-2xl overflow-hidden px-4 py-2 cursor-pointer'
              }`}
            >
              {/* Barra Handle / Toggle */}
              <div 
                onClick={() => setIsSheetExpanded(prev => !prev)}
                className="w-full flex items-center justify-between py-1 cursor-pointer select-none shrink-0"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-gray-300 rounded-full" />
                  <h2 className="text-sm font-black text-gray-900 tracking-tight leading-none">
                    Descubre <span className="text-[#16a34a]">Palenque</span>
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsSheetExpanded(prev => !prev)
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 transition-colors"
                >
                  <span>{isSheetExpanded ? 'Ocultar' : 'Ver opciones'}</span>
                  {isSheetExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Contenido Completo del Sheet cuando está Expandido */}
              {isSheetExpanded && (
                <div className="flex flex-col gap-3.5 mt-2 animate-in fade-in duration-200">
                  {renderQuickActions()}
                  {renderFeaturedDestinations()}
                  {renderPromoSliderBanner()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL / DRAWER DE FILTROS */}
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

        {/* MODAL DE MIS RUTAS Y TAXI URBANO */}
        <UserRoutesModal
          isOpen={isUserRoutesModalOpen}
          onClose={() => setIsUserRoutesModalOpen(false)}
          onSelectRouteOnMap={(route) => {
            setSelectedRoute(route)
            setView('detail')
          }}
          onStartMapPickMode={(mode, center) => {
            setMapPickMode(mode)
            if (center && mapRef.current) {
              mapRef.current.panTo(center)
              mapRef.current.setZoom(15)
            }
          }}
          currentPickedOrigin={currentPickedOrigin}
          currentPickedDestination={currentPickedDestination}
        />

        {/* MODAL DE CREACIÓN DE POOL PARA RUTA/TOUR */}
        {poolRouteForModal && (
          <CreatePoolModal
            service={{
              id: poolRouteForModal.id,
              name: poolRouteForModal.name,
              price: Number(poolRouteForModal.price_one_way) || 20,
              image: getRouteImageUrl(poolRouteForModal),
              category: poolRouteForModal.category?.name || 'Ruta Turística',
              rating: 4.9,
              reviewsCount: 12,
              businessId: 1,
              businessName: 'PalenqueGo Transportes',
              allowsPool: true,
              maxPoolMembers: 14,
              poolDiscount: poolRouteForModal.descuento_pool || 20,
              description: poolRouteForModal.descripcion || poolRouteForModal.name,
              location: 'El Salvador',
              badge: 'Transporte Oficial',
              featured: true,
            } as any}
            onClose={() => setPoolRouteForModal(null)}
            onSuccess={() => {
              setPoolRouteForModal(null)
            }}
          />
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
      <div className="relative z-20 bg-[#0B1F15] px-4 pt-12 pb-4 flex items-center gap-3 overflow-hidden">
        {selectedRoute && (
          <div className="absolute inset-0 pointer-events-none z-0">
            <img 
              src={getRouteImageUrl(selectedRoute)} 
              alt={selectedRoute.name} 
              className="w-full h-full object-cover opacity-30"
              onError={handleImageFallback}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F15] via-[#0B1F15]/80 to-transparent" />
          </div>
        )}
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 shrink-0 relative z-10" onClick={() => setView('list')}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 overflow-hidden" style={{ backgroundColor: catColor }}>
            <img 
              src={getRouteImageUrl(selectedRoute)} 
              alt={selectedRoute?.name || 'Ruta'} 
              className="w-full h-full object-cover" 
              onError={handleImageFallback}
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-bold text-base leading-tight truncate">{selectedRoute?.name}</h2>
            <p className="text-gray-300 text-xs">{selectedRoute?.category?.name || (selectedRoute?.route_type === 'TOUR' ? 'Tours & Experiencias' : 'Ruta turística')}</p>
          </div>
        </div>
        {/* BOTÓN ATRACTIVO DE POOL Y AHORRO GRUPAL EN CABECERA */}
        <button
          type="button"
          onClick={() => setShowPoolDetailModal(true)}
          className="relative z-10 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg border border-emerald-400/40 transition-all active:scale-95 shrink-0"
          title="Viaja en grupo y ahorra (Pool)"
        >
          <Users className="w-3.5 h-3.5 text-emerald-100" />
          <span className="tracking-wide">Pool</span>
          <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full font-black">
            -{(selectedRoute as any)?.descuento_pool || (selectedRoute?.route_type === 'TOUR' ? 20 : 15)}%
          </span>
        </button>
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
            {selectedRoute?.duracion
              ? selectedRoute.duracion
              : (selectedRoute?.stops?.length > 1
                ? `${(selectedRoute.stops.length - 1) * 20} min`
                : '—')}
          </span>
          <span className="text-[10px] text-gray-500">{selectedRoute?.duracion ? 'Duración' : 'Estimado'}</span>
        </div>
      </div>

      {/* TARJETA DE ESTADO DE VIAJE SI ES RUTA A DEMANDA */}
      {selectedRoute?.estado_viaje && (
        <div className="relative z-20 mx-4 mt-2 bg-white rounded-2xl shadow-lg p-3.5 flex items-center justify-between border border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">
                {selectedRoute.estado_viaje === 'SOLICITADO' && '🟡 Esperando conductor...'}
                {selectedRoute.estado_viaje === 'ACEPTADO' && '🟢 Chofer en camino'}
                {selectedRoute.estado_viaje === 'EN_CURSO' && '🔵 Viaje en curso'}
                {selectedRoute.estado_viaje === 'FINALIZADO' && '🏁 Viaje completado'}
                {selectedRoute.estado_viaje === 'BORRADOR' && '⚪ Ruta guardada'}
              </p>
              {selectedRoute.driver_name && (
                <p className="text-[10px] text-gray-500">Conductor: {selectedRoute.driver_name}</p>
              )}
            </div>
          </div>

          {selectedRoute.calificacion ? (
            <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{selectedRoute.calificacion}.0</span>
            </div>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              {selectedRoute.estado_viaje}
            </span>
          )}
        </div>
      )}

      {/* BOTTOM SHEET — lista de paradas + botones */}
      <div 
        className="absolute bottom-16 lg:bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex flex-col transition-all duration-300" 
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
              {selectedRoute?.descripcion && (
                <div className="mb-4 bg-emerald-50/80 border border-emerald-100 rounded-2xl p-3.5 text-xs text-emerald-950 leading-relaxed shadow-2xs">
                  <p className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    Descripción de la Experiencia
                  </p>
                  {selectedRoute.descripcion}
                </div>
              )}
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

      {/* MODAL / DIÁLOGO DE DETALLE DE POOL (ACTIVADO DESDE CABECERA) */}
      {showPoolDetailModal && selectedRoute && (() => {
        const isInterestMarked = registeredRouteInterests.includes(selectedRoute.id);
        const discountPct = (selectedRoute as any).descuento_pool || (selectedRoute.route_type === 'TOUR' ? 20 : 15);
        const isLeader = userIntentions?.wantsToLeadPools;
        const isTraveler = userIntentions?.isTraveler ?? true;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-emerald-100 flex flex-col gap-4 relative animate-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => setShowPoolDetailModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 pr-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-[#064e3b] text-white flex items-center justify-center shadow-md shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-gray-900 text-base leading-tight">Pool Palenque</h3>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      -{discountPct}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Viaje grupal y división de costos</p>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-3 text-xs text-emerald-950 space-y-1.5">
                <p className="font-bold text-emerald-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  ¿Cómo funciona para esta ruta?
                </p>
                <p className="text-[11px] leading-relaxed text-emerald-800">
                  Ahorra hasta un <strong>{discountPct}%</strong> en tu traslado viajando en grupo con amigos o turistas verificados.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {isTraveler && (
                  <button
                    type="button"
                    onClick={() => {
                      registerRouteInterest(selectedRoute.id);
                    }}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 ${
                      isInterestMarked
                        ? "bg-emerald-600 text-white"
                        : "bg-white border-2 border-emerald-600 text-emerald-900 hover:bg-emerald-50"
                    }`}
                  >
                    <span>{isInterestMarked ? "✓ Te avisaremos cuando salga viaje" : "🔔 Me interesa este viaje"}</span>
                  </button>
                )}

                {isLeader && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPoolDetailModal(false);
                      setPoolRouteForModal(selectedRoute);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-[#064e3b] hover:from-emerald-800 hover:to-[#043324] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95"
                  >
                    <Users className="w-4 h-4" />
                    <span>Armar este viaje (Líder)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL DE CREACIÓN DE POOL EN DETALLE DE RUTA */}
      {poolRouteForModal && (
        <CreatePoolModal
          service={{
            id: poolRouteForModal.id,
            name: poolRouteForModal.name,
            price: Number(poolRouteForModal.price_one_way) || 20,
            image: getRouteImageUrl(poolRouteForModal),
            category: poolRouteForModal.category?.name || 'Ruta Turística',
            rating: 4.9,
            reviewsCount: 12,
            businessId: 1,
            businessName: 'PalenqueGo Transportes',
            allowsPool: true,
            maxPoolMembers: 14,
            poolDiscount: poolRouteForModal.descuento_pool || 20,
            description: poolRouteForModal.descripcion || poolRouteForModal.name,
            location: 'El Salvador',
            badge: 'Transporte Oficial',
            featured: true,
          } as any}
          onClose={() => setPoolRouteForModal(null)}
          onSuccess={() => {
            setPoolRouteForModal(null)
          }}
        />
      )}
    </div>
  )
}
