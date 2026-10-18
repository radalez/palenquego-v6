"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion"
import { 
  X, Heart, Info, MapPin, Users, HelpCircle, 
  ChevronLeft, ChevronRight, Share2, 
  RotateCcw, Compass, Check, SlidersHorizontal, Settings,
  Flame, Bed, Waves, Utensils, Coffee, TreePine, Ticket, Bus, Play,
  Search, Navigation, Car, History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, formatImageUrl, getRouteImageUrl, handleImageFallback } from "@/lib/utils"
import { useAppStore, type Service, type Pool } from "@/lib/store"
import { HeaderWithMenu } from "@/components/header-with-menu"
import { CreatePoolModal } from "@/components/create-pool-modal"

interface SwipeGoScreenProps {
  onNavigate?: (tab: string) => void
}

export const OFFICIAL_CATEGORIES = [
  { id: "all", label: "Todo", icon: Flame, iconColor: "text-amber-500" },
  { id: "hotel", label: "Hoteles", icon: Bed, iconColor: "text-indigo-600" },
  { id: "playa", label: "Playa", icon: Waves, iconColor: "text-cyan-600" },
  { id: "surf", label: "Surf", icon: Waves, iconColor: "text-blue-600" },
  { id: "food", label: "Gastronomía", icon: Utensils, iconColor: "text-orange-600" },
  { id: "cafe", label: "Café", icon: Coffee, iconColor: "text-amber-700" },
  { id: "eco", label: "Ecoturismo", icon: TreePine, iconColor: "text-emerald-600" },
  { id: "aventura", label: "Aventura", icon: Ticket, iconColor: "text-teal-600" },
  { id: "transporte", label: "Rutas & Transporte", icon: Bus, iconColor: "text-emerald-700" },
]

export function matchesCategory(service: Service, selectedCategory: string): boolean {
  if (!selectedCategory || selectedCategory === "all") return true

  const catName = (service.category || (service as any).categoria?.nombre || (service as any).categoria_nombre || "").toLowerCase()
  const sName = (service.name || "").toLowerCase()
  const sDesc = (service.description || (service as any).descripcion || "").toLowerCase()
  const sLoc = (service.location || "").toLowerCase()
  const catId = (service as any).categoria?.id

  switch (selectedCategory) {
    case "hotel":
      return catName.includes("hotel") || catName.includes("hospedaj") || sName.includes("hotel") || sDesc.includes("hotel") || catId === 5
    case "surf":
      return catName.includes("surf") || sName.includes("surf") || sDesc.includes("surf") || catId === 7
    case "cafe":
      return catName.includes("café") || catName.includes("cafe") || sName.includes("café") || sDesc.includes("cafe") || catId === 10
    case "eco":
      return catName.includes("eco") || catName.includes("tour") || catName.includes("naturaleza") || catId === 4 || catId === 3
    case "food":
      return catName.includes("gastro") || catName.includes("restauran") || catName.includes("comida") || sName.includes("restauran") || sDesc.includes("comida") || sName.includes("asado") || sName.includes("pizza") || sName.includes("hamburguesa") || catId === 6 || catId === 1
    case "playa":
      return catName.includes("playa") || sName.includes("playa") || sLoc.includes("playa") || sLoc.includes("tunco") || sLoc.includes("sunzal") || sDesc.includes("playa") || sName.includes("tunco") || sName.includes("costa del sol") || catId === 8
    case "aventura":
      return catName.includes("aventura") || sName.includes("aventura") || sDesc.includes("aventura") || sName.includes("caminata") || sName.includes("volcán") || sName.includes("volcan") || catId === 9
    case "transporte":
      return catName.includes("transporte") || catName.includes("ruta") || catName.includes("interurbano") || catName.includes("urbano") || (service as any).id >= 100000 || (service as any).price_one_way !== undefined
    default:
      return catName.includes(selectedCategory.toLowerCase()) || sName.includes(selectedCategory.toLowerCase())
  }
}

export function getRouteContext(routeName: string = ""): {
  isPlaya: boolean;
  isMontana: boolean;
  isPueblo: boolean;
  isCiudad: boolean;
  keywords: string[];
} {
  const text = routeName.toLowerCase();
  const isPlaya = /playa|costa|tunco|sunzal|libertad|zonte|majahual|cuco|taquillo|balsamo|san diego|costa del sol|surf|102/.test(text);
  const isMontana = /monta[ñn]a|volc[aá]n|cr[aá]ter|crater|flores|cerro|ilamatepec|izalco|apaneca|ataco|juayua|senderismo|pinar/.test(text);
  const isPueblo = /suchitoto|colonial|centro hist[oó]rico|joya de ceren|ruinas|pueblo/.test(text);
  const isCiudad = /san salvador|santa tecla|metrocentro|escal[oó]n|zona rosa|antiguo cuscatl[aá]n|aeropuerto|urbano/.test(text);

  const keywords: string[] = [];
  if (isPlaya) keywords.push("playa", "costa", "tunco", "sunzal", "libertad", "surf", "zonte");
  if (isMontana) keywords.push("montaña", "volcan", "volcán", "flores", "apaneca", "ataco", "cráter", "crater", "caminata");
  if (isPueblo) keywords.push("suchitoto", "pueblo", "historia", "colonial");
  if (isCiudad) keywords.push("san salvador", "ciudad", "centro", "tecla");

  return { isPlaya, isMontana, isPueblo, isCiudad, keywords };
}

const PRICE_OPTIONS: { id: "ALL" | "ECO" | "MID" | "PREMIUM"; label: string; desc: string }[] = [
  { id: "ALL", label: "Cualquiera", desc: "Todos los precios" },
  { id: "ECO", label: "Económico", desc: "Hasta $5" },
  { id: "MID", label: "Medio", desc: "$5 a $25" },
  { id: "PREMIUM", label: "Premium / Tours", desc: "Más de $25" },
]

export function SwipeGoScreen({ onNavigate }: SwipeGoScreenProps) {
  const router = useRouter()
  const [deckSeed, setDeckSeed] = useState(1)
  const { 
    services, 
    pools, 
    addSwipeLike, 
    registerPoolInterest, 
    accessToken, 
    fetchServices, 
    fetchPools,
    registeredPoolInterests = [],
    fetchMyPoolInterests,
    routes,
    fetchRoutes,
    lastMapCategory,
    lastMapSuperCategory,
    lastMapDestination,
    setLastMapInteraction,
    resetMapInteraction,
    userIntentions,
    favorites = [],
  } = useAppStore()

  // Maintain deck state — con servicios y experiencias del mapa
  const [deck, setDeck] = useState<Service[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const registeredPools = useMemo(() => new Set(registeredPoolInterests), [registeredPoolInterests])
  const [deckFilter, setDeckFilter] = useState<"MAP_MATCH" | "ALL">("MAP_MATCH")
  const [poolModalService, setPoolModalService] = useState<Service | null>(null)

  // Modales/Tooltips
  const [showPoolTooltip, setShowPoolTooltip] = useState(false)

  // Estados de Onboarding / Cuestionario interactivo
  const [hasConfirmedPreference, setHasConfirmedPreference] = useState(false)
  const [showPreferenceModal, setShowPreferenceModal] = useState(false)
  const [showPriorInteractionPrompt, setShowPriorInteractionPrompt] = useState(false)

  // Filtros interactivos de usuario (categoría oficial, ruta y precio)
  const [selectedPrefCategory, setSelectedPrefCategory] = useState<string>("all")
  const [selectedPrefRoute, setSelectedPrefRoute] = useState<string>("ALL")
  const [selectedPriceRange, setSelectedPriceRange] = useState<"ALL" | "ECO" | "MID" | "PREMIUM">("ALL")
 
  // Cargar servicios, pools y rutas del API al montar
  useEffect(() => {
    fetchServices()
    fetchPools()
    fetchMyPoolInterests()
    if (fetchRoutes) fetchRoutes()
  }, [fetchServices, fetchPools, fetchRoutes])

  // Integrar servicios reales + tours y rutas del mapa para jugar en Go
  const allPlayableItems: Service[] = useMemo(() => {
    const routeServices: Service[] = (routes || [])
      .filter((r) => r.route_type === 'TOUR' || r.price_one_way)
      .map((r) => ({
        id: 100000 + r.id,
        name: r.name,
        category: r.category?.name || (r.route_type === 'TOUR' ? 'Tours & Experiencias' : 'Rutas Interurbanas'),
        location: 'El Salvador',
        price: Number(r.price_one_way) || 20,
        image: getRouteImageUrl(r),
        rating: 4.9,
        reviews: 12,
        allowsPool: true,
        spotsLeft: 14,
        poolDiscount: (r as any).descuento_pool || 20,
        description: (r as any).descripcion || r.name,
        features: ['Transporte Seguro', 'Grupo Pool', 'Ruta Verificada'],
      } as Service))

    return [...services, ...routeServices]
  }, [services, routes])

  // Detectar al inicio si tiene interacción previa en el mapa o abrir el cuestionario "¿Qué te gustaría?"
  useEffect(() => {
    if (hasConfirmedPreference) return

    const hasPrior = Boolean(lastMapCategory || lastMapSuperCategory || lastMapDestination)
    if (hasPrior) {
      setShowPriorInteractionPrompt(true)
    } else {
      setShowPreferenceModal(true)
    }
  }, [])

  // Estados para el buscador interactivo y filtro por modalidad de rutas en el cuestionario
  const [routeSearchTerm, setRouteSearchTerm] = useState("")
  const [routeTypeFilter, setRouteTypeFilter] = useState<"ALL" | "INTERURBANO" | "URBANO" | "TOUR">("ALL")
  const [recentMapRoutes, setRecentMapRoutes] = useState<string[]>([])

  // Cargar rutas exploradas recientemente desde localStorage / mapa
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("palenque_recent_map_routes")
        const arr: string[] = raw ? JSON.parse(raw) : []
        if (lastMapDestination && !arr.includes(lastMapDestination)) {
          arr.unshift(lastMapDestination)
        }
        setRecentMapRoutes(arr.slice(0, 6))
      } catch (e) {}
    }
  }, [lastMapDestination])

  // Filtrado reactivo de rutas según término de búsqueda y modalidad (Urbana, Interurbana, Turística)
  const filteredRoutes = useMemo(() => {
    const list = routes || []
    return list.filter((r) => {
      // 1. Filtro por tipo/modalidad
      if (routeTypeFilter !== "ALL") {
        if (routeTypeFilter === "TOUR") {
          const isTour = r.route_type === "TOUR" || (r.category?.name || "").toLowerCase().includes("tour") || (r.name || "").toLowerCase().includes("tour")
          if (!isTour) return false
        } else if (r.route_type !== routeTypeFilter) {
          return false
        }
      }

      // 2. Filtro por texto de búsqueda
      if (routeSearchTerm.trim()) {
        const term = routeSearchTerm.toLowerCase().trim()
        const nameMatch = (r.name || "").toLowerCase().includes(term)
        const catMatch = (r.category?.name || "").toLowerCase().includes(term)
        const stopMatch = (r.stops || []).some((s) => (s.name || "").toLowerCase().includes(term))
        return nameMatch || catMatch || stopMatch
      }

      return true
    })
  }, [routes, routeTypeFilter, routeSearchTerm])

  // Generar mazo dinámico según modo: "Para ti" (afinidades personales y de mapa) o "Todos" (catálogo completo)
  const dynamicDeck = useMemo(() => {
    let list = [...allPlayableItems]

    // ==========================================
    // MODO "TODOS": Explorar todo el catálogo libremente
    // ==========================================
    if (deckFilter === "ALL") {
      if (selectedPriceRange === "ECO") {
        list = list.filter((s) => (s.price || 0) <= 5)
      } else if (selectedPriceRange === "MID") {
        list = list.filter((s) => (s.price || 0) > 5 && (s.price || 0) <= 25)
      } else if (selectedPriceRange === "PREMIUM") {
        list = list.filter((s) => (s.price || 0) > 25)
      }

      // Barajado dinámico para exploración amplia de todo El Salvador
      const scoredAll = list.map((s) => {
        let score = (s.rating || 4) * 5
        const hashKey = `${s.id}-${s.name}-${deckSeed}`
        let hash = 0
        for (let i = 0; i < hashKey.length; i++) {
          hash = (hash << 5) - hash + hashKey.charCodeAt(i)
          hash |= 0
        }
        score += Math.abs(hash % 100)
        return { service: s, score }
      })

      scoredAll.sort((a, b) => b.score - a.score)
      return scoredAll.map((item) => item.service)
    }

    // ==========================================
    // MODO "PARA TI" (Personalizado & Afinidad del Mapa)
    // ==========================================

    // 1. Filtrar por categoría oficial seleccionada de manera ESTRICTA si se eligió una
    if (selectedPrefCategory && selectedPrefCategory !== "all") {
      list = list.filter((s) => matchesCategory(s, selectedPrefCategory))
    }

    // 2. Filtrar por rango de precio de manera ESTRICTA
    if (selectedPriceRange === "ECO") {
      list = list.filter((s) => (s.price || 0) <= 5)
    } else if (selectedPriceRange === "MID") {
      list = list.filter((s) => (s.price || 0) > 5 && (s.price || 0) <= 25)
    } else if (selectedPriceRange === "PREMIUM") {
      list = list.filter((s) => (s.price || 0) > 25)
    }

    // 3. Ruta contextual seleccionada
    const hasRouteSelected = selectedPrefRoute && selectedPrefRoute !== "ALL"
    const rCtx = hasRouteSelected ? getRouteContext(selectedPrefRoute) : null

    // Si la ruta seleccionada es playera (ej. Ruta 102 al Tunco, Costa del Bálsamo):
    if (rCtx?.isPlaya) {
      const beachMatches = list.filter((s) => {
        const sLoc = (s.location || "").toLowerCase()
        const sCat = (s.category || "").toLowerCase()
        const sName = (s.name || "").toLowerCase()
        const sDesc = (s.description || (s as any).descripcion || "").toLowerCase()
        return (
          sLoc.includes("playa") || sLoc.includes("tunco") || sLoc.includes("sunzal") || 
          sLoc.includes("libertad") || sLoc.includes("costa") || sLoc.includes("zonte") ||
          sCat.includes("surf") || sCat.includes("playa") || sName.includes("surf") || 
          sName.includes("playa") || sName.includes("tunco") || sDesc.includes("playa") || sDesc.includes("surf")
        )
      })
      if (beachMatches.length > 0) list = beachMatches
    } else if (rCtx?.isMontana) {
      const mountainMatches = list.filter((s) => {
        const sLoc = (s.location || "").toLowerCase()
        const sCat = (s.category || "").toLowerCase()
        const sName = (s.name || "").toLowerCase()
        const sDesc = (s.description || (s as any).descripcion || "").toLowerCase()
        return (
          sLoc.includes("montaña") || sLoc.includes("volcan") || sLoc.includes("volcán") || 
          sLoc.includes("flores") || sLoc.includes("ataco") || sLoc.includes("apaneca") ||
          sCat.includes("eco") || sCat.includes("aventura") || sDesc.includes("montaña") || sDesc.includes("volcan")
        )
      })
      if (mountainMatches.length > 0) list = mountainMatches
    } else if (hasRouteSelected) {
      const target = selectedPrefRoute.toLowerCase()
      const directMatches = list.filter((s) => {
        return (s.name || "").toLowerCase().includes(target) || (s.location || "").toLowerCase().includes(target)
      })
      if (directMatches.length > 0) list = directMatches
    }

    // 4. Si el usuario está en "all" y tiene interacción previa en el mapa
    if (selectedPrefCategory === "all" && (lastMapCategory || lastMapSuperCategory || lastMapDestination)) {
      const cat = (lastMapCategory || "").toLowerCase()
      const superCat = (lastMapSuperCategory || "").toLowerCase()
      const dest = (lastMapDestination || "").toLowerCase()

      const isMatch = (s: Service) => {
        const sCat = (s.category || "").toLowerCase()
        const sName = (s.name || "").toLowerCase()
        const sLoc = (s.location || "").toLowerCase()
        const sDesc = (s.description || (s as any).descripcion || "").toLowerCase()

        if (cat && (sCat.includes(cat) || sName.includes(cat) || sLoc.includes(cat) || sDesc.includes(cat))) return true
        if (dest && (sLoc.includes(dest) || sName.includes(dest))) return true
        if (superCat === "tour" && (sCat.includes("tour") || sCat.includes("experiencia") || sDesc.includes("tour"))) return true
        if (superCat === "urbano" && (sCat.includes("urbano") || sCat.includes("ciudad") || sCat.includes("centro"))) return true
        if (superCat === "interurbano" && (sCat.includes("interurbano") || sCat.includes("playa") || sCat.includes("montaña") || sCat.includes("ruta"))) return true
        return false
      }

      const matched = list.filter(isMatch)
      const remaining = list.filter((s) => !isMatch(s))
      list = matched.length > 0 ? [...matched, ...remaining] : list
    }

    // 5. Algoritmo de puntuación de afinidad para "Para ti":
    const scoredList = list.map((s) => {
      let score = 0
      const sName = (s.name || "").toLowerCase()
      const sLoc = (s.location || "").toLowerCase()
      const sCat = (s.category || "").toLowerCase()
      const sDesc = (s.description || (s as any).descripcion || "").toLowerCase()

      // Prioridad máxima: lo que el usuario exploró en el mapa recientemente
      if (lastMapDestination) {
        const dest = lastMapDestination.toLowerCase()
        if (sLoc.includes(dest) || sName.includes(dest) || sDesc.includes(dest)) score += 300
      }
      if (lastMapCategory) {
        const cat = lastMapCategory.toLowerCase()
        if (sCat.includes(cat) || sName.includes(cat) || sDesc.includes(cat)) score += 200
      }

      // Afinidad con ruta
      if (hasRouteSelected) {
        if (sName.includes(selectedPrefRoute.toLowerCase()) || sLoc.includes(selectedPrefRoute.toLowerCase())) score += 200
        if (rCtx?.isPlaya && (sLoc.includes("playa") || sLoc.includes("tunco") || sCat.includes("surf"))) score += 180
        if (rCtx?.isMontana && (sLoc.includes("montaña") || sLoc.includes("volcan"))) score += 180
      }

      // Favoritos y likes previos
      if (favorites.includes(s.id)) score += 100

      // Rating
      score += (s.rating || 4) * 5

      // Entropía de sesión con deckSeed para variación aleatoria reactiva
      const hashKey = `${s.id}-${s.name}-${deckSeed}`
      let hash = 0
      for (let i = 0; i < hashKey.length; i++) {
        hash = (hash << 5) - hash + hashKey.charCodeAt(i)
        hash |= 0
      }
      score += Math.abs(hash % 90)

      return { service: s, score }
    })

    scoredList.sort((a, b) => b.score - a.score)
    return scoredList.map((item) => item.service)
  }, [allPlayableItems, lastMapCategory, lastMapSuperCategory, lastMapDestination, deckFilter, selectedPrefCategory, selectedPrefRoute, selectedPriceRange, favorites, deckSeed])

  // Cargar servicios en el deck cuando se calcule o cambie el mazo dinámico
  useEffect(() => {
    if (dynamicDeck.length > 0) {
      setDeck(dynamicDeck)
      setCurrentIndex(0)
    } else {
      setDeck([])
      setCurrentIndex(0)
    }
  }, [dynamicDeck])

  // Aplicar preferencias del cuestionario y grabar en el mapa / store
  const handleApplyPreferences = () => {
    setShowPreferenceModal(false)
    setHasConfirmedPreference(true)
    setDeckFilter("MAP_MATCH")
    setDeckSeed((prev) => prev + 1)
    setCurrentIndex(0)

    // Grabar interacción en el store y localStorage
    const activeCat = OFFICIAL_CATEGORIES.find(c => c.id === selectedPrefCategory)
    const catToSave = selectedPrefCategory !== "all" && activeCat ? activeCat.label : null
    const routeToSave = selectedPrefRoute !== "ALL" ? selectedPrefRoute : null
    setLastMapInteraction(catToSave, null, routeToSave)
  }

  // Alternar entre modo personalizado ("Para ti") y catálogo amplio ("Todos")
  const handleToggleDeckFilter = (mode: "MAP_MATCH" | "ALL") => {
    // Si pulsa "Para ti" y no tiene interacción previa ni preferencias configuradas, abrir cuestionario
    const hasPrior = Boolean(lastMapCategory || lastMapSuperCategory || lastMapDestination || recentMapRoutes.length > 0)
    if (mode === "MAP_MATCH" && !hasPrior && selectedPrefCategory === "all" && selectedPrefRoute === "ALL") {
      setShowPreferenceModal(true)
      return
    }

    setDeckFilter(mode)
    setDeckSeed((prev) => prev + 1)
    setCurrentIndex(0)
  }

  // Reiniciar preferencias a cero y reabrir el selector con nuevo orden dinámico
  const handleResetPreferences = () => {
    setDeckSeed((prev) => prev + 1)
    resetMapInteraction()
    setSelectedPrefCategory("all")
    setSelectedPrefRoute("ALL")
    setSelectedPriceRange("ALL")
    setRouteSearchTerm("")
    setRouteTypeFilter("ALL")
    setDeckFilter("MAP_MATCH")
    setCurrentIndex(0)
    setHasConfirmedPreference(false)
    setShowPriorInteractionPrompt(false)
    setShowPreferenceModal(true)
  }

  // Swipe logic
  const handleSwipe = (direction: "left" | "right") => {
    if (currentIndex >= deck.length) return
    
    const currentService = deck[currentIndex]
    
    if (direction === "right") {
      console.log(`Liked ${currentService.name} (service ID: ${currentService.id}) - registrando en favoritos`)
      addSwipeLike(currentService.id)
      
      const token = accessToken || localStorage.getItem('access_token')
      fetch(`/api-proxy/catalog/${currentService.id}/swipe/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ es_like: true })
      }).then(r => {
        if (!r.ok) console.warn(`Swipe backend error: ${r.status}`)
        else console.log(`✅ Swipe like registrado en backend para servicio ${currentService.id}`)
      }).catch(e => console.error("Swipe fetch error:", e))
    } else {
      const token = accessToken || localStorage.getItem('access_token')
      fetch(`/api-proxy/catalog/${currentService.id}/swipe/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ es_like: false })
      }).then(r => {
        if (!r.ok) console.warn(`Swipe backend error: ${r.status}`)
      }).catch(e => console.error("Swipe fetch error:", e))
    }

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1)
      setShowPoolTooltip(false)
    }, 200)
  }

  if (currentIndex >= deck.length || deck.length === 0) {
    return (
      <div className="flex flex-col h-full bg-background">
        <HeaderWithMenu title="Palenque Go" onNavigate={onNavigate} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-2 text-emerald-700">
            <Compass className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {deck.length === 0 ? "No hay servicios con estos filtros" : "¡Has visto todo en esta selección!"}
          </h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            {deck.length === 0 
              ? "Prueba cambiando de categoría, ruta o rango de precios para ver más opciones disponibles."
              : deckFilter === "MAP_MATCH" && (lastMapCategory || selectedPrefCategory !== "ALL")
              ? `Has explorado los servicios relacionados a ${selectedPrefCategory !== "ALL" ? selectedPrefCategory : lastMapCategory}. Puedes cambiar a "Todos" o reiniciar tus preferencias.`
              : "Vuelve más tarde para descubrir nuevos servicios, o revisa tus favoritos."}
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Button 
              onClick={handleResetPreferences}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reiniciar y Elegir Nuevos Filtros</span>
            </Button>
            {deckFilter === "MAP_MATCH" && (
              <Button variant="outline" onClick={() => setDeckFilter("ALL")}>Ver Todos los Servicios</Button>
            )}
            {deck.length > 0 && (
              <Button variant="ghost" onClick={() => setCurrentIndex(0)}>Volver a ver</Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] overflow-hidden relative">
      <HeaderWithMenu title="Explorar Go" onNavigate={onNavigate} />

      {/* Barra de Filtros Activos, Afinidades y Botón de Reiniciar */}
      <div className="px-4 pt-2.5 pb-1 flex items-center justify-between z-20 shrink-0 gap-2">
        <div className="flex items-center gap-1.5 bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-1 rounded-full text-xs text-emerald-950 font-medium shadow-2xs min-w-0">
          <Compass className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">
            {(() => {
              if (deckFilter === "ALL") {
                return "Explorando todo el catálogo"
              }
              const activeCat = OFFICIAL_CATEGORIES.find(c => c.id === selectedPrefCategory)
              const catLabel = selectedPrefCategory !== "all" && activeCat ? activeCat.label : null
              if (catLabel || selectedPrefRoute !== "ALL" || selectedPriceRange !== "ALL") {
                const parts = []
                if (catLabel) parts.push(catLabel)
                if (selectedPrefRoute !== "ALL") parts.push(selectedPrefRoute)
                if (selectedPriceRange !== "ALL") {
                  parts.push(selectedPriceRange === "ECO" ? "<$5" : selectedPriceRange === "MID" ? "$5-$25" : ">$25")
                }
                return `Para ti: ${parts.join(" · ")}`
              }
              if (lastMapCategory || lastMapDestination) {
                return `Para ti: ${lastMapCategory || lastMapDestination}`
              }
              return "Para ti: Recomendado"
            })()}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] shrink-0">
          <button
            type="button"
            onClick={handleResetPreferences}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-white border border-gray-200 text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-2xs active:scale-95"
            title="Configurar qué te gustaría ver"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Configurar</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleDeckFilter("MAP_MATCH")}
            className={`px-3 py-1 rounded-full font-bold transition-all text-xs flex items-center gap-1 active:scale-95 ${
              deckFilter === "MAP_MATCH"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Para ti
          </button>
          <button
            type="button"
            onClick={() => handleToggleDeckFilter("ALL")}
            className={`px-3 py-1 rounded-full font-bold transition-all text-xs flex items-center gap-1 active:scale-95 ${
              deckFilter === "ALL"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Todos
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <AnimatePresence>
          {deck.slice(currentIndex, currentIndex + 2).map((service, index) => {
            const isFront = index === 0
            return (
              <SwipeableServiceCard
                key={service.id}
                service={service}
                isFront={isFront}
                onSwipe={handleSwipe}
                onInfoClick={() => router.push(`/s/${service.id}`)}
                showPoolTooltip={isFront ? showPoolTooltip : false}
                setShowPoolTooltip={setShowPoolTooltip}
                pools={pools}
                onNavigate={onNavigate}
                registerPoolInterest={registerPoolInterest}
                registeredPools={registeredPools}
                onOpenCreatePool={(svc) => setPoolModalService(svc)}
                userIntentions={userIntentions}
              />
            )
          })}
        </AnimatePresence>
      </div>

      {/* Modal de Creación de Pool para el Servicio jugado */}
      {poolModalService && (
        <CreatePoolModal
          service={poolModalService}
          onClose={() => setPoolModalService(null)}
          onSuccess={() => setPoolModalService(null)}
        />
      )}

      {/* Manual Actions (only visible if there are cards) */}
      {currentIndex < deck.length && (
        <div className="h-[100px] flex items-center justify-center gap-6 pb-6 px-4 shrink-0 z-10 bg-gradient-to-t from-background via-background/80 to-transparent">
          <button
            onClick={() => handleSwipe("left")}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-red-100 hover:scale-105 active:scale-95 transition-all group"
          >
            <X className="w-8 h-8 text-red-500 group-hover:text-red-600" />
          </button>
          
          <button
            onClick={() => router.push(`/s/${deck[currentIndex].id}`)}
            className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100 hover:scale-105 active:scale-95 transition-all text-blue-500"
          >
            <Info className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => handleSwipe("right")}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-emerald-100 hover:scale-105 active:scale-95 transition-all group"
          >
            <Heart className="w-8 h-8 text-emerald-500 fill-emerald-100 group-hover:fill-emerald-200" />
          </button>
        </div>
      )}

      {/* Modal / Diálogo: Preguntar si desea continuar con la interacción previa del mapa */}
      <AnimatePresence>
        {showPriorInteractionPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-emerald-100 text-center relative overflow-hidden"
            >
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-100/80 flex items-center justify-center text-emerald-700 shadow-inner">
                <Compass className="w-7 h-7" />
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider inline-block mb-1.5">
                ¡Bienvenido a Go!
              </span>

              <h3 className="text-lg font-extrabold text-gray-900 leading-snug mb-2">
                ¿Deseas continuar explorando tu búsqueda?
              </h3>

              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Detectamos que antes estuviste interactuando en el mapa con:
              </p>

              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 mb-5 text-left flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide block">
                    Interacción previa
                  </span>
                  <span className="text-sm font-extrabold text-emerald-950 truncate block">
                    {lastMapCategory || lastMapDestination || "Rutas & Experiencias"}
                  </span>
                  {lastMapDestination && lastMapCategory && (
                    <span className="text-[11px] text-emerald-800 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span className="truncate">{lastMapDestination}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={() => {
                    setShowPriorInteractionPrompt(false)
                    setHasConfirmedPreference(true)
                    setDeckFilter("MAP_MATCH")
                    setCurrentIndex(0)
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl py-3 text-sm shadow-md flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Sí, ver lo relacionado</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPriorInteractionPrompt(false)
                    setShowPreferenceModal(true)
                  }}
                  className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 font-bold rounded-2xl py-2.5 text-xs"
                >
                  No, elegir qué me gustaría ver
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: ¿Qué te gustaría descubrir hoy en Palenque Go? */}
      <AnimatePresence>
        {showPreferenceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-emerald-100 relative"
            >
              {/* Botón cerrar */}
              <button
                type="button"
                onClick={() => setShowPreferenceModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-inner shrink-0">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 leading-tight">
                    ¿Qué te gustaría descubrir hoy?
                  </h3>
                  <p className="text-xs text-gray-500">
                    Personaliza tu mazo de cartas antes de empezar a jugar
                  </p>
                </div>
              </div>

              {/* Paso 1: Categorías */}
              <div className="mb-4">
                <label className="text-xs font-extrabold text-gray-800 uppercase tracking-wider block mb-2">
                  1. Elige una categoría o experiencia
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {OFFICIAL_CATEGORIES.map((cat) => {
                    const isSelected = selectedPrefCategory === cat.id
                    const IconComp = cat.icon
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedPrefCategory(cat.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95",
                          isSelected
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <IconComp className={cn("w-3.5 h-3.5", cat.iconColor)} />
                        )}
                        <span>{cat.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Paso 2: Rutas & Destinos Dinámicos */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold text-gray-800 uppercase tracking-wider block">
                    2. ¿Tienes una ruta o destino en mente?
                  </label>
                  {selectedPrefRoute !== "ALL" && (
                    <button
                      type="button"
                      onClick={() => setSelectedPrefRoute("ALL")}
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      Quitar ruta
                    </button>
                  )}
                </div>

                {/* Sub-bloque 2.1: Rutas con las que interactuó recientemente en el mapa */}
                {recentMapRoutes.length > 0 && (
                  <div className="mb-2.5 p-2 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl">
                    <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5">
                      <History className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Tus rutas exploradas en el mapa:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {recentMapRoutes.map((routeName) => {
                        const isSelected = selectedPrefRoute === routeName
                        return (
                          <button
                            key={`recent-${routeName}`}
                            type="button"
                            onClick={() => setSelectedPrefRoute(routeName)}
                            className={cn(
                              "px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border",
                              isSelected
                                ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                                : "bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-100/70"
                            )}
                          >
                            {isSelected ? (
                              <Check className="w-3 h-3 text-white shrink-0" />
                            ) : (
                              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                            )}
                            <span className="truncate max-w-[200px]">{routeName}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-bloque 2.2: Pestañas de modalidad / tipo de ruta */}
                <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: "ALL", label: "Todas", icon: Navigation },
                    { id: "INTERURBANO", label: "Interurbanas", icon: Bus },
                    { id: "URBANO", label: "Urbanas", icon: Car },
                    { id: "TOUR", label: "Tours & Playas", icon: Compass },
                  ].map((mode) => {
                    const isSelected = routeTypeFilter === mode.id
                    const IconComp = mode.icon
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setRouteTypeFilter(mode.id as any)}
                        className={cn(
                          "px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 border",
                          isSelected
                            ? "bg-gray-900 text-white border-gray-900 shadow-2xs"
                            : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                        )}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        <span>{mode.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Sub-bloque 2.3: Buscador predictivo en vivo */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={routeSearchTerm}
                    onChange={(e) => setRouteSearchTerm(e.target.value)}
                    placeholder="Buscar ruta o destino... ej. 102, Tunco, Santa Ana, Suchitoto"
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-gray-800 placeholder:text-gray-400 transition-all"
                  />
                  {routeSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setRouteSearchTerm("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sub-bloque 2.4: Lista dinámica de resultados */}
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-gray-50/70 rounded-2xl border border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSelectedPrefRoute("ALL")}
                    className={cn(
                      "px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 active:scale-95 border",
                      selectedPrefRoute === "ALL"
                        ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                        : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"
                    )}
                  >
                    {selectedPrefRoute === "ALL" ? (
                      <Check className="w-3 h-3 text-white shrink-0" />
                    ) : (
                      <Navigation className="w-3 h-3 text-gray-400 shrink-0" />
                    )}
                    <span>Cualquier ruta (Todas)</span>
                  </button>

                  {filteredRoutes.length === 0 ? (
                    <div className="w-full py-4 text-center text-xs text-gray-500">
                      No se encontraron rutas con "{routeSearchTerm}". Prueba con otro nombre o cambia la modalidad.
                    </div>
                  ) : (
                    filteredRoutes.slice(0, 30).map((r) => {
                      const isSelected = selectedPrefRoute === r.name
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedPrefRoute(r.name)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all text-left truncate max-w-full flex items-center gap-1.5 active:scale-95 border",
                            isSelected
                              ? "bg-emerald-700 text-white font-bold border-emerald-800 shadow-xs"
                              : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"
                          )}
                        >
                          {isSelected ? (
                            <Check className="w-3 h-3 shrink-0 text-white" />
                          ) : (
                            <MapPin className="w-3 h-3 shrink-0 text-emerald-600" />
                          )}
                          <span className="truncate">{r.name}</span>
                          {r.route_type && (
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0",
                              isSelected ? "bg-emerald-800 text-white" : "bg-gray-100 text-gray-500"
                            )}>
                              {r.route_type === "TOUR" ? "Tour" : r.route_type === "URBANO" ? "Urbana" : "Interurbana"}
                            </span>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Paso 3: Rango de Precios */}
              <div className="mb-6">
                <label className="text-xs font-extrabold text-gray-800 uppercase tracking-wider block mb-2">
                  3. Presupuesto estimado
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRICE_OPTIONS.map((p) => {
                    const isSelected = selectedPriceRange === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPriceRange(p.id)}
                        className={cn(
                          "p-2.5 rounded-2xl text-left border transition-all active:scale-98 flex flex-col justify-between",
                          isSelected
                            ? "bg-emerald-50/90 border-emerald-500 shadow-xs"
                            : "bg-white border-gray-200 hover:border-emerald-200"
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-0.5">
                          <span className={cn("text-xs font-extrabold", isSelected ? "text-emerald-950" : "text-gray-800")}>
                            {p.label}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <span className="text-[10px] text-gray-500 line-clamp-1">
                          {p.desc}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetPreferences}
                  className="rounded-2xl border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-3 font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Reiniciar
                </Button>
                <Button
                  type="button"
                  onClick={handleApplyPreferences}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-[#064e3b] hover:from-emerald-700 hover:to-[#043324] text-white font-extrabold rounded-2xl py-3 text-sm shadow-md flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>¡Empezar a explorar en Go!</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface SwipeableServiceCardProps {
  service: Service
  isFront: boolean
  onSwipe: (direction: "left" | "right") => void
  onInfoClick: () => void
  showPoolTooltip: boolean
  setShowPoolTooltip: (val: boolean) => void
  pools: Pool[]
  onNavigate?: (tab: string) => void
  registerPoolInterest: (serviceId: number) => Promise<boolean>
  registeredPools: Set<number>
  onOpenCreatePool?: (service: Service) => void
  userIntentions?: any
}

function SwipeableServiceCard({
  service,
  isFront,
  onSwipe,
  onInfoClick,
  showPoolTooltip,
  setShowPoolTooltip,
  pools,
  onNavigate,
  registerPoolInterest,
  registeredPools,
  onOpenCreatePool,
  userIntentions,
}: SwipeableServiceCardProps) {
  const x = useMotionValue(0)
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375

  const displayCapacity = service.capacityMax || 10
  const displayPrice = service.price || 0
  const discountPct = service.poolDiscount || service.discount || 20

  // Buscar pool activo asociado al servicio
  const activePool = service.allowsPool
    ? pools.find(p => p.serviceId === service.id && p.status === "ABIERTO")
    : undefined

  const spotsRemaining = activePool
    ? (activePool.targetMembers || 0) - (activePool.currentMembers || 0)
    : 0
  
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])
  
  // Like/Nope Overlay Opacities
  const likeOpacity = useTransform(x, [20, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-20, -100], [0, 1])

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100
    if (info.offset.x > threshold) {
      onSwipe("right")
    } else if (info.offset.x < -threshold) {
      onSwipe("left")
    }
  }

  // Galería de imágenes del servicio con saneamiento
  const gallery = service.galleryImages && service.galleryImages.length > 0
    ? service.galleryImages
    : [service.image || "/placeholder.svg"]
  const [photoIndex, setPhotoIndex] = useState(0)

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPhotoIndex((prev) => (prev + 1) % gallery.length)
  }
  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPhotoIndex((prev) => (prev - 1 + gallery.length) % gallery.length)
  }

  return (
    <motion.div
      style={{ x, rotate, opacity: isFront ? 1 : 0.8, scale: isFront ? 1 : 0.95 }}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ scale: isFront ? 1 : 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`absolute w-full max-w-[360px] h-full max-h-[600px] bg-white rounded-3xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing border border-border/50 ${isFront ? 'z-20' : 'z-10'}`}
    >
      {/* Photo Gallery Area */}
      <div className="relative w-full h-[48%] bg-zinc-900 group" onClick={onInfoClick}>
        <img 
          src={formatImageUrl(gallery[photoIndex])} 
          alt={service.name} 
          className="w-full h-full object-cover select-none pointer-events-none" 
          onError={handleImageFallback}
        />
        
        {/* Photo Navigation Overlays */}
        <div className="absolute top-0 left-0 w-1/2 h-full z-10" onClick={prevPhoto} />
        <div className="absolute top-0 right-0 w-1/2 h-full z-10" onClick={nextPhoto} />
        
        {/* Indicators */}
        <div className="absolute top-3 left-0 right-0 flex gap-1 px-3 z-20">
          {gallery.map((_, idx) => (
            <div key={idx} className={`h-1 flex-1 rounded-full bg-white transition-opacity ${idx === photoIndex ? 'opacity-100' : 'opacity-40 shadow-sm'}`} />
          ))}
        </div>
 
        {/* Badges superiores: Ubicación y Categoría */}
        <div className="absolute top-6 left-3 right-3 flex justify-between items-center z-20 pointer-events-none gap-2">
          <div className="bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1 border border-white/20 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[130px]">{service.location}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <div className="bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-bold border border-white/20 truncate max-w-[120px]">
              {service.category || "Experiencia"}
            </div>
            {service.isRemate && service.discount && (
              <div className="bg-red-500/90 backdrop-blur-md px-2 py-1 rounded-full text-white text-[10px] font-black border border-white/20">
                -{service.discount}%
              </div>
            )}
          </div>
        </div>
 
        {/* Swipe Overlays */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 left-6 z-30 pointer-events-none rotate-[-15deg]">
          <div className="border-4 border-emerald-400 text-emerald-400 font-black text-4xl px-4 py-1 rounded-lg uppercase tracking-widest shadow-sm bg-white/10 backdrop-blur-sm">
            LIKE
          </div>
        </motion.div>
        <motion.div style={{ opacity: nopeOpacity }} className="absolute top-10 right-6 z-30 pointer-events-none rotate-[15deg]">
          <div className="border-4 border-red-500 text-red-500 font-black text-4xl px-4 py-1 rounded-lg uppercase tracking-widest shadow-sm bg-white/10 backdrop-blur-sm">
            NOPE
          </div>
        </motion.div>
 
        {/* Gradient Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
        
        {/* Title Info overlay inside image */}
        <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
          <div className="flex justify-between items-end gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-extrabold leading-tight drop-shadow-md line-clamp-2">{service.name}</h2>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <p className="text-white/95 font-semibold drop-shadow-sm flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Ideal para {displayCapacity} pers.
                </p>
                {service.businessName && (
                  <span className="text-white/80 drop-shadow-sm truncate">
                    • por {service.businessName}
                  </span>
                )}
              </div>
            </div>
            {/* Precio */}
            <div className="flex-shrink-0">
               <span className="bg-emerald-600 text-white px-3 py-1 rounded-xl text-sm font-black shadow-lg border border-white/20">
                 ${displayPrice}
               </span>
            </div>
          </div>
        </div>
      </div>
 
      {/* Info Card Content Bottom */}
      <div className="p-3.5 h-[52%] flex flex-col justify-between">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 leading-relaxed">
            {service.description || service.descripcion || "Sin descripción disponible"}
          </p>
          {service.features && service.features.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {service.features.slice(0, 3).map((f, i) => (
                <span key={i} className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded-full font-medium">{f}</span>
              ))}
            </div>
          )}
        </div>
 
        {/* Pool Gamification Status */}
        <div className="mt-auto relative z-30" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-300/60 p-2.5 rounded-2xl relative overflow-visible">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-extrabold text-emerald-950 block leading-tight truncate">
                {activePool && spotsRemaining > 0
                  ? (spotsRemaining === 1 || spotsRemaining === 2
                      ? `¡Falta${spotsRemaining === 1 ? "" : "n"} ${spotsRemaining}! Únete ya`
                      : `Pool Activo (${activePool.currentMembers}/${activePool.targetMembers})`)
                  : `Ahorra hasta -${discountPct}% en grupo`}
              </span>
              <span className="text-[10px] text-emerald-700 block truncate">
                {activePool ? "Viaje grupal confirmado" : "Comparte gastos o arma tu grupo"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Botón de unirse a pool existente */}
              {activePool && spotsRemaining > 0 ? (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate?.("pool");
                  }}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Únete aquí
                </button>
              ) : null}

              {/* Botón de Líder (si tiene intención de crear/liderar pools) */}
              {userIntentions?.wantsToLeadPools ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCreatePool?.(service);
                  }}
                  className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-700 to-[#064e3b] hover:from-emerald-800 hover:to-[#043324] text-white text-[10px] font-extrabold rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1"
                >
                  <Users className="w-3 h-3" />
                  <span>Armar Pool</span>
                </button>
              ) : null}

              {/* Botón de Pasajero / Interés (si no hay pool activo y es viajero) */}
              {(!activePool || spotsRemaining <= 0) && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (service) {
                      registerPoolInterest(service.id);
                    }
                  }}
                  className={cn(
                    "px-2.5 py-1.5 text-[10px] font-bold rounded-xl transition-all shadow-sm active:scale-95",
                    service && registeredPools.has(service.id)
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-emerald-600 text-emerald-900 hover:bg-emerald-50"
                  )}
                >
                  {service && registeredPools.has(service.id) ? "✓ Te avisaremos" : "Me interesa"}
                </button>
              )}

              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPoolTooltip(!showPoolTooltip);
                }}
                className="p-1 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors shrink-0"
                title="¿Qué es un Pool?"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tooltip Gamificado */}
            <AnimatePresence>
              {showPoolTooltip && (
                <motion.div 
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 3, scale: 0.95 }}
                  className="absolute bottom-full mb-2 right-0 w-[240px] bg-[#064e3b] text-white p-3 rounded-2xl shadow-xl z-50 text-xs"
                >
                  <div className="absolute -bottom-1 right-4 w-3 h-3 bg-[#064e3b] rotate-45" />
                  <p className="font-bold mb-1 flex items-center gap-1.5 text-emerald-200">
                    <Users className="w-3.5 h-3.5"/> ¿Qué es un Pool?
                  </p>
                  <p className="opacity-90 leading-snug">
                    Un pool es una compra grupal para ahorrar hasta un {discountPct}%. ¡Puedes unirte o armar el grupo tú mismo!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
