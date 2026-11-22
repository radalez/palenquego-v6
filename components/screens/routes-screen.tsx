"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  MapPin,
  Navigation2,
  Clock,
  Users,
  X,
  Ticket,
  ShoppingCart,
  Search,
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Star,
  Send,
  Info,
  Compass,
  Store,
  ChevronRight,
  Check,
  Maximize2,
  Minimize2,
  ThumbsUp,
  ArrowUp,
  ArrowDown,
  Mail,
  Link2,
  ShieldCheck,
  Route as RouteIcon,
  LayoutGrid,
  Shuffle,
  Sparkles,
  ChevronLeft,
  Bus,
} from "lucide-react"
import {
  REACTIONS,
  ReactionBadgeIcon,
  type ReactionKey,
  SmartAppReelStrip,
  type SmartReelDefinition,
} from "./marketplace-screen"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useAppStore,
  type Route,
  type Service,
  DEFAULT_STORE_COVER,
  getProxyImage,
} from "@/lib/store"
import { HeaderWithMenu } from "@/components/header-with-menu"
import dynamic from "next/dynamic"
import { cn, getRouteImageUrl, handleImageFallback } from "@/lib/utils"

const MapPreview = dynamic(() => import("@/components/MapPreview"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-xl" />,
})

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
  startStopId?: number
  endStopId?: number
}

interface RouteCommentItem {
  id: string
  userName: string
  userAvatar?: string
  text: string
  rating: number
  createdAt: string
}

// Distance helper functions
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}

interface RoutesScreenProps {
  onNavigate?: (tab: string) => void
}

const ROUTE_REACTIONS_KEY = "palenquego_route_reactions_v1"
const ROUTE_COMMENTS_KEY = "palenquego_route_comments_v1"

export function RoutesScreen({ onNavigate }: RoutesScreenProps) {
  const {
    routes,
    services,
    fetchRoutes,
    routeSearchQuery,
    setRouteSearchQuery,
    returnToMapRoute,
    myUserRoutes,
    fetchMyUserRoutes,
    activeTrackingRouteId,
    setActiveTrackingRouteId,
    currentUser,
    bookings,
    fetchMyBookings,
  } = useAppStore()

  const [tracking, setTracking] = useState<RouteTrackingState | null>(null)
  const [serviceView, setServiceView] = useState<ServiceViewState | null>(null)
  const [ticketPurchase, setTicketPurchase] = useState<TicketPurchaseState | null>(null)
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"ALL" | "INTERURBANO" | "URBANO" | "TOURS" | "GPS" | "MY_ROUTES">("ALL")
  const [visibleCount, setVisibleCount] = useState(5)
  const [routeSeed, setRouteSeed] = useState(1)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [adRotationIndex, setAdRotationIndex] = useState(0)
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false)
  const [toastText, setToastText] = useState<string | null>(null)

  // Reacciones y comentarios locales por ruta (persistidos en localStorage)
  const [userReactions, setUserReactions] = useState<Record<number, ReactionKey | null>>({})
  const [justReactedRouteId, setJustReactedRouteId] = useState<number | null>(null)
  const [openReactionPickerId, setOpenReactionPickerId] = useState<number | null>(null)
  const reactionCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [openCommentsRouteId, setOpenCommentsRouteId] = useState<number | null>(null)
  const [openShareId, setOpenShareId] = useState<number | null>(null)
  const shareCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const catsTrackRef = useRef<HTMLDivElement | null>(null)
  const experienciasTrackRef = useRef<HTMLDivElement | null>(null)
  const [copiedRouteId, setCopiedRouteId] = useState<number | null>(null)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const [mobileShowInfoDrawer, setMobileShowInfoDrawer] = useState(false)
  const [routeComments, setRouteComments] = useState<Record<number, RouteCommentItem[]>>({})

  useEffect(() => {
    try {
      const savedReacts = localStorage.getItem(ROUTE_REACTIONS_KEY)
      if (savedReacts) setUserReactions(JSON.parse(savedReacts))
      const savedComments = localStorage.getItem(ROUTE_COMMENTS_KEY)
      if (savedComments) setRouteComments(JSON.parse(savedComments))
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [])

  // Mantener la barra de navegación móvil detrás del backdrop cuando el foco 3D de comentarios está activo
  useEffect(() => {
    if (typeof document === "undefined") return
    document.body.classList.toggle("comments-spotlight-open", openCommentsRouteId !== null)
    return () => {
      document.body.classList.remove("comments-spotlight-open")
    }
  }, [openCommentsRouteId])

  const showQuickToast = (msg: string) => {
    setToastText(msg)
    setTimeout(() => setToastText(null), 2600)
  }

  const handleReactionMouseEnter = (routeId: number) => {
    if (reactionCloseTimerRef.current) {
      clearTimeout(reactionCloseTimerRef.current)
      reactionCloseTimerRef.current = null
    }
    setOpenReactionPickerId(routeId)
  }

  const handleReactionMouseLeave = () => {
    reactionCloseTimerRef.current = setTimeout(() => {
      setOpenReactionPickerId(null)
    }, 180)
  }

  const handleShareMouseEnter = (routeId: number) => {
    if (shareCloseTimerRef.current) {
      clearTimeout(shareCloseTimerRef.current)
      shareCloseTimerRef.current = null
    }
    setOpenShareId(routeId)
  }

  const handleShareMouseLeave = () => {
    shareCloseTimerRef.current = setTimeout(() => {
      setOpenShareId(null)
    }, 180)
  }

  const toggleRouteReaction = (routeId: number, reaction: ReactionKey) => {
    setOpenReactionPickerId(null)
    setJustReactedRouteId(routeId)
    setTimeout(() => setJustReactedRouteId((prev) => (prev === routeId ? null : prev)), 500)
    setUserReactions((prev) => {
      const nextVal = prev[routeId] === reaction ? null : reaction
      const next = { ...prev, [routeId]: nextVal }
      try {
        localStorage.setItem(ROUTE_REACTIONS_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const addRouteComment = (routeId: number, text: string, rating: number) => {
    const clean = text.trim()
    if (!clean) return
    const newItem: RouteCommentItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userName: currentUser?.name || "Viajero PalenqueGo",
      userAvatar: (currentUser as any)?.avatar || (currentUser as any)?.foto_perfil,
      text: clean,
      rating,
      createdAt: "Ahora",
    }
    setRouteComments((prev) => {
      const existing = prev[routeId] || []
      const next = { ...prev, [routeId]: [newItem, ...existing] }
      try {
        localStorage.setItem(ROUTE_COMMENTS_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
    showQuickToast("Comentario publicado en la ruta")
  }

  // Rotación tranquila de publicidad cada 18s (igual que Experiencias)
  useEffect(() => {
    if (isHoveringSidebar) return
    const interval = setInterval(() => {
      setAdRotationIndex((prev) => prev + 1)
    }, 18000)
    return () => clearInterval(interval)
  }, [isHoveringSidebar])

  const allRoutes = useMemo(() => {
    const formattedUserRoutes: Route[] = (myUserRoutes || []).map((ur: any) => ({
      id: ur.id,
      name: ur.name,
      colorHex: "#105238",
      price_one_way: String(ur.proposed_price || "0"),
      price_round_trip: String(ur.proposed_price || "0"),
      is_active: true,
      driver_name: ur.driver_name,
      unit_name: ur.driver_name ? "Taxi / Auto" : "Sin asignar",
      stops: (ur.stops || []).map((s: any, idx: number) => ({
        id: s.id || idx + 1,
        name: s.name,
        latitude: Number(s.latitude) || 13.6893,
        longitude: Number(s.longitude) || -89.1872,
        order: s.order || idx + 1,
        minutes_from_start: s.minutes_from_start || idx * 15,
      })),
    }))
    return [...routes, ...formattedUserRoutes]
  }, [routes, myUserRoutes])

  const filteredRoutes = useMemo(() => {
    const query = (routeSearchQuery || "").toLowerCase()
    const base = allRoutes.filter((route: any) => {
      const matchesSearch =
        !query ||
        (route.name || "").toLowerCase().includes(query) ||
        (route.stops || []).some((stop: any) => (stop.name || "").toLowerCase().includes(query))
      if (!matchesSearch) return false
      const rType = String(route.route_type || "").toUpperCase()
      const isTour = rType === "TOUR" || (route.name || "").toLowerCase().startsWith("tour")
      if (activeFilter === "MY_ROUTES") return Boolean(route.user_has_ticket)
      if (activeFilter === "GPS") return Boolean(route.is_active && route.unit_lat && route.unit_lng)
      if (activeFilter === "TOURS") return isTour
      if (activeFilter === "INTERURBANO") return rType === "INTERURBANO"
      if (activeFilter === "URBANO") return rType === "URBANO"
      return true
    })

    // Ordenamiento inteligente estilo Experiencias: Mi Ruta -> GPS en vivo -> mezcla determinística por routeSeed
    return [...base].sort((a: any, b: any) => {
      const aTicket = a.user_has_ticket ? 0 : 1
      const bTicket = b.user_has_ticket ? 0 : 1
      if (aTicket !== bTicket) return aTicket - bTicket

      const aGps = a.is_active && a.unit_lat && a.unit_lng ? 0 : 1
      const bGps = b.is_active && b.unit_lat && b.unit_lng ? 0 : 1
      if (aGps !== bGps) return aGps - bGps

      const scoreA = ((Number(a.id) || 1) * 2654435761 + routeSeed * 37) % 1000
      const scoreB = ((Number(b.id) || 1) * 2654435761 + routeSeed * 37) % 1000
      return scoreA - scoreB
    })
  }, [allRoutes, routeSearchQuery, activeFilter, routeSeed])

  // Reiniciar lote visible al cambiar filtro, búsqueda o barajar
  useEffect(() => {
    setVisibleCount(5)
  }, [activeFilter, routeSearchQuery, routeSeed])

  const visibleRoutes = useMemo(
    () => filteredRoutes.slice(0, visibleCount),
    [filteredRoutes, visibleCount]
  )

  // Scroll infinito progresivo (+5 rutas por lote)
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || visibleCount >= filteredRoutes.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 5, filteredRoutes.length))
        }
      },
      { rootMargin: "240px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visibleCount, filteredRoutes.length])

  // Reels inteligentes intercalados para Modo Rutas (sin mostrar "Tours en mapa", priorizando Chofer, Alianzas y Pools)
  const routeSmartReels = useMemo<SmartReelDefinition[]>(() => {
    const pickRouteImg = (idx: number, fallback: string) => {
      const r = allRoutes[idx % Math.max(1, allRoutes.length)]
      return r ? getRouteImageUrl(r) : fallback
    }
    return [
      {
        id: "routes-modo-chofer",
        badge: "REEL MOVILIDAD · MODO CHOFER",
        heading: "Genera ingresos con tu unidad en rutas y traslados",
        subtitle: "Pasajeros verificados, control de asientos y GPS en vivo",
        ctaLabel: currentUser?.tipo === "CHOFER" ? "Panel de Chofer" : "Quiero ser Chofer",
        icon: Bus,
        onAction: () => onNavigate?.(currentUser?.tipo === "CHOFER" ? "conductor" : "profile"),
        steps: [
          {
            stepBadge: "Paso 1 · Tu Unidad",
            title: "Conecta tu vehículo, microbús o shuttle turístico",
            description: "Atiende rutas turísticas, traslados al aeropuerto y viajes grupales dentro de PalenqueGo.",
            image: pickRouteImg(0, "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80"),
          },
          {
            stepBadge: "Paso 2 · Control QR y GPS",
            title: "Valida boletos QR al abordar y muestra tu ruta en vivo",
            description: "Tus pasajeros ven la ubicación de tu unidad en tiempo real y tú controlas las plazas.",
            image: pickRouteImg(1, "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&q=80"),
          },
          {
            stepBadge: "Paso 3 · Actívate",
            title: "Configura tu perfil de Chofer y empieza a rodar",
            description: "Entra a tu consola de conductor o activa tu interés de Chofer en Mi Perfil.",
            image: pickRouteImg(2, "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80"),
            isActionCard: true,
          },
        ],
      },
      {
        id: "routes-alianzas-b2b",
        badge: "REEL ALIANZAS B2B · SOCIO COMERCIAL",
        heading: "¿Te gustaría colaborar con otros negocios?",
        subtitle: "Conecta tu ruta con hoteles, restaurantes y tours aliados",
        ctaLabel: "Explorar Servicios",
        icon: Store,
        onAction: () => onNavigate?.("marketplace"),
        steps: [
          {
            stepBadge: "Paso 1 · Alianza B2B",
            title: "Conecta tu transporte con hoteles y experiencias",
            description: "Un transportista puede aliarse con hoteles o restaurantes para ofrecer paquetes combinados.",
            image: pickRouteImg(3, "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80"),
          },
          {
            stepBadge: "Paso 2 · Ganancia Mutua",
            title: "Compartan porcentajes llevando viajeros entre sí",
            description: "Acuerden comisiones por referido entre negocios aliados y crezcan juntos en toda la red.",
            image: pickRouteImg(4, "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80"),
          },
          {
            stepBadge: "Paso 3 · Ver Comercios",
            title: "Descubre hoteles y experiencias para conectar",
            description: "Explora el catálogo de Servicios Aliados y arma rutas con paradas recomendadas.",
            image: pickRouteImg(5, "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80"),
            isActionCard: true,
          },
        ],
      },
      {
        id: "routes-pools-grupo",
        badge: "REEL GRUPOS · POOLS DE AHORRO",
        heading: "Viaja en grupo y ahorra hasta 20% en tu ruta",
        subtitle: "Únete a un Pool activo o arma tu propio recorrido grupal",
        ctaLabel: "Ver Pools",
        icon: Users,
        onAction: () => onNavigate?.("pool"),
        steps: [
          {
            stepBadge: "Paso 1 · Elige Ruta",
            title: "Selecciona tu destino o tour favorito",
            description: "Las rutas participantes muestran descuento grupal automático al completar cupos.",
            image: pickRouteImg(6, "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&q=80"),
          },
          {
            stepBadge: "Paso 2 · Comparte",
            title: "Invita a tus amigos o únete a viajeros en la misma ruta",
            description: "Cada integrante paga su parte de forma segura y recibe su boleto QR individual.",
            image: pickRouteImg(7, "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80"),
          },
          {
            stepBadge: "Paso 3 · Ir a Mis Viajes",
            title: "Revisa los Pools activos ahora mismo",
            description: "Consulta horarios de salida y cupos disponibles en la sección Mis Viajes.",
            image: pickRouteImg(8, "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80"),
            isActionCard: true,
          },
        ],
      },
    ]
  }, [allRoutes, currentUser?.tipo, onNavigate])

  useEffect(() => {
    fetchRoutes()
    fetchMyUserRoutes?.()
    fetchMyBookings?.()

    const gpsInterval = setInterval(() => {
      fetchRoutes()
    }, 10000)

    return () => {
      clearInterval(gpsInterval)
    }
  }, [fetchRoutes, fetchMyUserRoutes, fetchMyBookings])

  useEffect(() => {
    if (activeTrackingRouteId) {
      setTracking({ routeId: activeTrackingRouteId, showTracking: true, currentStop: 1 })
      setActiveTrackingRouteId(null)
    }
  }, [activeTrackingRouteId, setActiveTrackingRouteId])

  const handleStartTracking = (route: Route) => {
    setIsMapFullscreen(false)
    setMobileShowInfoDrawer(false)
    setTracking({ routeId: route.id, showTracking: true, currentStop: 1 })
  }

  const handleViewServices = (route: Route) => {
    setServiceView({ routeId: route.id, showServices: true })
  }

  const handleShareRoute = async (route: Route) => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/r/${route.id}` : ""
    try {
      if (navigator.share) {
        await navigator.share({
          title: route.name,
          text: `Explora y rastrea esta ruta en PalenqueGo: ${route.name}`,
          url,
        })
      } else if (navigator.clipboard && url) {
        await navigator.clipboard.writeText(url)
        showQuickToast("Enlace de ruta copiado al portapapeles")
      }
    } catch {
      // Cancelado por el usuario
    }
  }

  const getTicketPrices = () => {
    if (!ticketPurchase) return { oneWay: "0.00", roundTrip: "0.00", startName: null, endName: null }

    const route = allRoutes.find((r) => r.id === ticketPurchase.routeId)
    if (!route || !route.stops || route.stops.length === 0) {
      return {
        oneWay: route?.price_one_way || "0.00",
        roundTrip: route?.price_round_trip || "0.00",
        startName: null,
        endName: null,
      }
    }

    let startStop = route.stops[0]
    let endStop = route.stops[route.stops.length - 1]

    if (ticketPurchase.startStopId) {
      startStop = route.stops.find((s) => s.id === ticketPurchase.startStopId) || startStop
    }
    if (ticketPurchase.endStopId) {
      endStop = route.stops.find((s) => s.id === ticketPurchase.endStopId) || endStop
    }

    if (startStop && endStop && startStop.order < endStop.order) {
      let oneWayTotal = 0
      let roundTripTotal = 0
      const segment = route.stops.filter((s) => s.order >= startStop.order && s.order <= endStop.order)
      segment.forEach((s) => {
        oneWayTotal += parseFloat(s.effective_price_one_way || "0")
        roundTripTotal += parseFloat(s.effective_price_round_trip || "0")
      })
      return {
        oneWay: oneWayTotal.toFixed(2),
        roundTrip: roundTripTotal.toFixed(2),
        startName: startStop.name,
        endName: endStop.name,
      }
    }

    return {
      oneWay: route.price_one_way || "0.00",
      roundTrip: route.price_round_trip || "0.00",
      startName: null,
      endName: null,
    }
  }

  const handleBuyTicket = (route: Route, service?: Service) => {
    const initialStart = route.stops?.[0]?.id
    const initialEnd = route.stops?.[route.stops.length - 1]?.id

    setTicketPurchase({
      routeId: route.id,
      serviceId: service?.id,
      showPayment: true,
      step: "selection",
      startStopId: initialStart,
      endStopId: initialEnd,
    })

    if (navigator.geolocation && route.stops && route.stops.length > 0) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude

        let closestStopId: number | undefined
        let minDistance = 1

        route.stops.forEach((stop) => {
          const distance = getDistanceFromLatLonInKm(userLat, userLng, stop.latitude, stop.longitude)
          if (distance < minDistance) {
            minDistance = distance
            closestStopId = stop.id
          }
        })

        if (closestStopId) {
          setTicketPurchase((prev) => (prev ? { ...prev, startStopId: closestStopId } : null))
        }
      })
    }
  }

  const handleConfirmTicketPayment = () => {
    setTicketPurchase((prev) => (prev ? { ...prev, step: "payment" } : null))
    const route = allRoutes.find((r) => r.id === ticketPurchase?.routeId)
    if (route && ticketPurchase) {
      const redirectUrl = window.location.origin + "/checkout-success"
      useAppStore
        .getState()
        .buyTicketWompi(ticketPurchase.routeId, ticketPurchase.startStopId!, ticketPurchase.endStopId!, "ONE_WAY", redirectUrl)
        .then((wompiUrl) => {
          if (wompiUrl) {
            window.location.href = wompiUrl
          } else {
            alert("Error al iniciar el pago con Wompi. Inténtalo de nuevo.")
            setTicketPurchase(null)
          }
        })
    } else {
      setTicketPurchase(null)
    }
  }

  const primaryBooking = (bookings || []).find(
    (b: any) =>
      (b.status === "PENDIENTE" || b.status === "CONFIRMADA") &&
      (!currentUser || b.userId === currentUser.id || (!b.userId && b.userEmail === currentUser.email))
  )

  return (
    <div className="flex flex-col min-h-full bg-[#f5f6f3] dark:bg-background">
      <HeaderWithMenu
        title="Rutas de Transporte"
        subtitle="Explora recorridos, reacciona y rastrea en tiempo real"
        onNavigate={onNavigate}
      />

      {/* Toast flotante */}
      {toastText && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#105238] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl border border-[#8ee01a]/40 animate-in fade-in slide-in-from-bottom-2">
          {toastText}
        </div>
      )}

      {/* ─── FULL-SCREEN / LIGHTBOX INTERACTIVE MAP TRACKER MODAL ─── */}
      {tracking?.showTracking &&
        (() => {
          const trackedRoute = allRoutes.find((r) => r.id === tracking.routeId)
          const routeAny = trackedRoute as any
          const hasGPS = Boolean(routeAny?.is_active && routeAny?.unit_lat && routeAny?.unit_lng)
          const stops = trackedRoute?.stops || []
          const unitLat = routeAny?.unit_lat
          const unitLng = routeAny?.unit_lng

          const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371e3
            const p1 = (lat1 * Math.PI) / 180
            const p2 = (lat2 * Math.PI) / 180
            const dp = ((lat2 - lat1) * Math.PI) / 180
            const dl = ((lon2 - lon1) * Math.PI) / 180
            const a =
              Math.sin(dp / 2) * Math.sin(dp / 2) +
              Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2)
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          }

          let closestStopOrder = -1
          let minDistance = Infinity
          if (hasGPS) {
            stops.forEach((stop) => {
              const dist = getDistanceMeters(unitLat, unitLng, stop.latitude, stop.longitude)
              if (dist < minDistance) {
                minDistance = dist
                closestStopOrder = stop.order
              }
            })
          }

          const navList = filteredRoutes.length > 0 ? filteredRoutes : allRoutes
          const currentIdx = navList.findIndex((r) => r.id === tracking.routeId)
          const totalNav = navList.length
          const goPrevRoute = () => {
            if (totalNav <= 1) return
            const prevIdx = currentIdx <= 0 ? totalNav - 1 : currentIdx - 1
            setMobileShowInfoDrawer(false)
            setTracking({ routeId: navList[prevIdx].id, showTracking: true, currentStop: 1 })
          }
          const goNextRoute = () => {
            if (totalNav <= 1) return
            const nextIdx = currentIdx >= totalNav - 1 ? 0 : currentIdx + 1
            setMobileShowInfoDrawer(false)
            setTracking({ routeId: navList[nextIdx].id, showTracking: true, currentStop: 1 })
          }
          const isTrackedLiked = Boolean(trackedRoute && userReactions[trackedRoute.id])

          return (
            <>
              {/* ── MÓVIL: REELS FULL-SCREEN 100DVH MAPA INTERACTIVO ── */}
              <div className="sm:hidden fixed inset-0 z-[70] bg-[#0b0c0e] text-white h-[100dvh] w-full flex flex-col overflow-hidden select-none animate-in fade-in duration-150">
                {/* Mapa de fondo a pantalla completa */}
                <div className="absolute inset-0 z-0">
                  <MapPreview
                    stops={stops}
                    unitLocation={hasGPS ? { lat: routeAny.unit_lat, lng: routeAny.unit_lng } : undefined}
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 via-black/30 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/90 via-black/55 to-transparent" />
                </div>

                {/* Top Overlay: Categoría + 1/N + Cerrar */}
                <div className="relative z-20 px-4 pt-3.5 flex items-center justify-between gap-2 pointer-events-none">
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <span className="bg-black/65 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/15 flex items-center gap-1.5">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          hasGPS ? "bg-[#8ee01a] animate-pulse" : "bg-slate-400"
                        )}
                      />
                      {stops.length} paradas
                    </span>
                    {totalNav > 0 && (
                      <span className="bg-black/65 backdrop-blur-md text-white/90 text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/15">
                        {currentIdx >= 0 ? currentIdx + 1 : 1}/{totalNav}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setTracking(null)}
                    className="pointer-events-auto w-9 h-9 rounded-full bg-black/65 backdrop-blur-md text-white border border-white/20 flex items-center justify-center shadow-lg cursor-pointer"
                    aria-label="Cerrar mapa"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Right-side vertical floating action rail (TikTok touch target size) */}
                <div className="absolute right-3 bottom-32 z-20 flex flex-col items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => trackedRoute && toggleRouteReaction(trackedRoute.id, "recomiendo")}
                    className="flex flex-col items-center gap-1 cursor-pointer"
                    aria-label="Recomendar ruta"
                  >
                    <span className="w-12 h-12 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-xl active:scale-90 transition-transform">
                      <Heart
                        className={cn(
                          "w-6 h-6",
                          isTrackedLiked ? "fill-[#105238] text-[#105238]" : "text-slate-800"
                        )}
                      />
                    </span>
                    <span className="text-[11px] font-bold text-white drop-shadow">Like</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileShowInfoDrawer(true)}
                    className="flex flex-col items-center gap-1 cursor-pointer"
                    aria-label="Ver info"
                  >
                    <span className="w-12 h-12 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/25 flex items-center justify-center shadow-xl active:scale-90 transition-transform">
                      <Info className="w-5 h-5" />
                    </span>
                    <span className="text-[11px] font-bold text-white drop-shadow">Ver info</span>
                  </button>

                  {totalNav > 1 && (
                    <div className="flex flex-col items-center gap-2.5 pt-0.5">
                      <button
                        type="button"
                        onClick={goPrevRoute}
                        className="w-12 h-12 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer"
                        aria-label="Ruta anterior"
                      >
                        <ArrowUp className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={goNextRoute}
                        className="w-12 h-12 rounded-full bg-[#105238] text-[#8ee01a] border border-white/25 flex items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer"
                        aria-label="Siguiente ruta"
                      >
                        <ArrowDown className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Overlay: Título, GPS, Precio /p, Más info y Comprar Boleto */}
                <div className="mt-auto relative z-20 px-4 pb-5 pt-3 space-y-3">
                  <div className="pr-14 space-y-1">
                    <p className="text-[11px] font-bold text-[#8ee01a] uppercase tracking-wider">
                      {hasGPS ? "GPS en vivo · En recorrido" : "Ruta verificada"}
                    </p>
                    <h3 className="text-lg font-black text-white leading-tight line-clamp-2">
                      {trackedRoute?.name}
                    </h3>
                    <p className="text-xs text-white/80 truncate">
                      {trackedRoute?.driver_name || "PalenqueGo Transportes"} ·{" "}
                      {trackedRoute?.unit_license_plate || "Unidad oficial"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-white">
                        {Number(trackedRoute?.price_one_way || 0) > 0
                          ? `$${Number(trackedRoute?.price_one_way).toFixed(2)}`
                          : "Gratis"}
                      </span>
                      {Number(trackedRoute?.price_one_way || 0) > 0 && (
                        <span className="text-xs text-white/75 font-semibold">/p</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMobileShowInfoDrawer(true)}
                        className="h-10 px-3.5 rounded-full bg-white/95 text-slate-900 text-xs font-extrabold inline-flex items-center gap-1.5 shadow-lg cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5 text-[#105238]" />
                        Más info
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (trackedRoute) {
                            setTracking(null)
                            handleBuyTicket(trackedRoute)
                          }
                        }}
                        className="h-10 px-4 rounded-full bg-[#105238] text-white border border-[#8ee01a]/40 text-xs font-extrabold inline-flex items-center gap-1.5 shadow-lg cursor-pointer"
                      >
                        <Ticket className="w-3.5 h-3.5 text-[#8ee01a]" />
                        Boleto
                      </button>
                    </div>
                  </div>
                </div>

                {/* Drawer móvil de paradas & detalles ("Ver info" / "Más info") */}
                {mobileShowInfoDrawer && (
                  <div
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs flex items-end"
                    onClick={() => setMobileShowInfoDrawer(false)}
                  >
                    <div
                      className="w-full max-h-[75dvh] bg-white dark:bg-card text-foreground rounded-t-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0">
                        <div className="min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#105238] bg-[#eaf0e2] px-2 py-0.5 rounded-full">
                            Paradas y Detalles
                          </span>
                          <h4 className="text-sm font-black truncate mt-1">{trackedRoute?.name}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMobileShowInfoDrawer(false)}
                          className="w-8 h-8 rounded-full bg-[#f0f2f5] text-gray-700 flex items-center justify-center cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        <div className="p-3 rounded-2xl bg-[#f7f9f5] border border-[#eaf0e2] flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold">{trackedRoute?.driver_name || "Conductor por asignar"}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {trackedRoute?.unit_license_plate || "Unidad oficial"} · {trackedRoute?.unit_capacity || 0} PAX
                            </p>
                          </div>
                          <span className="text-sm font-black text-[#105238]">
                            ${Number(trackedRoute?.price_one_way || 0).toFixed(2)} /p
                          </span>
                        </div>
                        {stops.map((stop) => (
                          <div
                            key={stop.order}
                            className="flex items-center gap-3 p-2.5 rounded-2xl bg-card border border-border/60"
                          >
                            <div className="w-7 h-7 rounded-full bg-[#105238] text-[#8ee01a] flex items-center justify-center text-xs font-black shrink-0">
                              {stop.order}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate">{stop.name || `Parada ${stop.order}`}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {stop.minutes_from_start ? `~${stop.minutes_from_start} min desde inicio` : "Parada verificada"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 border-t border-border flex gap-2 shrink-0">
                        <Button
                          type="button"
                          onClick={() => {
                            if (trackedRoute) {
                              setTracking(null)
                              handleBuyTicket(trackedRoute)
                            }
                          }}
                          className="flex-1 h-11 rounded-xl bg-[#105238] text-white font-bold text-xs gap-1.5 cursor-pointer"
                        >
                          <Ticket className="w-4 h-4 text-[#8ee01a]" />
                          Comprar Boleto
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (trackedRoute) {
                              setTracking(null)
                              handleViewServices(trackedRoute)
                            }
                          }}
                          className="h-11 px-4 rounded-xl font-bold text-xs cursor-pointer"
                        >
                          Servicios
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── ESCRITORIO / TABLET: LIGHTBOX CON EXPANDIR MAPA Y FLECHAS ARRIBA/ABAJO FUERA DEL CARD ── */}
              <div
                className="hidden sm:flex fixed inset-0 bg-black/85 backdrop-blur-md items-center justify-center z-50 p-4 lg:p-6 animate-in fade-in duration-150"
                onClick={() => setTracking(null)}
              >
                <div className="flex items-center justify-center w-full max-w-6xl gap-4" onClick={(e) => e.stopPropagation()}>
                  <div
                    className={cn(
                      "bg-white dark:bg-card rounded-[28px] w-full shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-white/15 transition-all duration-200",
                      isMapFullscreen ? "max-w-[1320px] h-[90vh]" : "max-w-5xl h-[85vh] max-h-[760px]"
                    )}
                  >
                    {/* LEFT / MAIN: FULL INTERACTIVE MAP */}
                    <div
                      className={cn(
                        "relative h-full bg-[#e8f0e6]",
                        isMapFullscreen ? "lg:col-span-12" : "lg:col-span-8"
                      )}
                    >
                      <MapPreview
                        stops={stops}
                        unitLocation={hasGPS ? { lat: routeAny.unit_lat, lng: routeAny.unit_lng } : undefined}
                      />

                      {/* Top-left floating route + GPS pill */}
                      <div className="absolute top-3.5 left-3.5 right-24 flex flex-wrap items-center gap-2 pointer-events-none">
                        <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-border/60 flex items-center gap-2.5 pointer-events-auto max-w-full">
                          <span
                            className={cn(
                              "w-2.5 h-2.5 rounded-full shrink-0",
                              hasGPS ? "bg-[#8ee01a] animate-pulse ring-4 ring-[#8ee01a]/25" : "bg-slate-400"
                            )}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-foreground truncate">{trackedRoute?.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {hasGPS ? "GPS en vivo · Actualizado" : "Sin señal GPS del conductor aún"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Top-right inside map: Expandir a pantalla completa + Cerrar (cuando está expandido) */}
                      <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsMapFullscreen((v) => !v)}
                          className="h-9 px-3 rounded-full bg-white/95 hover:bg-[#eaf0e2] text-[#105238] border border-border/60 shadow-lg flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors"
                          title={isMapFullscreen ? "Mostrar detalles" : "Expandir mapa"}
                        >
                          {isMapFullscreen ? (
                            <>
                              <Minimize2 className="w-3.5 h-3.5" />
                              <span>Ver panel</span>
                            </>
                          ) : (
                            <>
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Pantalla completa</span>
                            </>
                          )}
                        </button>
                        {isMapFullscreen && (
                          <button
                            type="button"
                            onClick={() => setTracking(null)}
                            className="w-9 h-9 rounded-full bg-black/70 hover:bg-black/85 text-white flex items-center justify-center shadow-lg cursor-pointer"
                            aria-label="Cerrar mapa"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* RIGHT PANEL: ROUTE DETAILS & STOPS (oculto cuando mapa está en pantalla completa) */}
                    {!isMapFullscreen && (
                      <div className="lg:col-span-4 flex flex-col h-full bg-white dark:bg-card border-l border-border/60 overflow-hidden">
                        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between shrink-0">
                          <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#105238] bg-[#eaf0e2] px-2 py-0.5 rounded-full">
                              Rastreo de Ruta
                            </span>
                            <h3 className="text-sm font-black text-foreground truncate mt-1">{trackedRoute?.name}</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTracking(null)}
                            className="w-8 h-8 rounded-full bg-[#f0f2f5] hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            aria-label="Cerrar rastreo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          <div className="p-3 rounded-2xl bg-[#f7f9f5] dark:bg-muted/40 border border-[#eaf0e2] dark:border-border flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-[#105238] text-white flex items-center justify-center font-black text-xs shrink-0 overflow-hidden">
                                {trackedRoute?.driver_avatar ? (
                                  <img
                                    src={trackedRoute.driver_avatar}
                                    alt="Chofer"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  (trackedRoute?.driver_name || "PG").slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">
                                  {trackedRoute?.driver_name || "Conductor por asignar"}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {trackedRoute?.unit_license_plate || "Unidad oficial"} ·{" "}
                                  {trackedRoute?.unit_capacity || 0} PAX
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-[#105238] shrink-0">
                              ${Number(trackedRoute?.price_one_way || 0).toFixed(2)} /p
                            </span>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                              Paradas ({stops.length})
                            </p>
                            <div className="space-y-2">
                              {stops.map((stop) => {
                                let isPassed = false
                                let isCurrent = false
                                if (hasGPS) {
                                  const dist = getDistanceMeters(unitLat, unitLng, stop.latitude, stop.longitude)
                                  if (dist <= 50) {
                                    isPassed = true
                                    isCurrent = true
                                  } else if (stop.order < closestStopOrder) {
                                    isPassed = true
                                  }
                                }
                                return (
                                  <div
                                    key={stop.order}
                                    className={cn(
                                      "flex items-center gap-3 p-2.5 rounded-2xl border transition-colors",
                                      isPassed
                                        ? "bg-[#eaf0e2]/70 border-[#8ee01a]/60"
                                        : "bg-card border-border/60"
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0",
                                        isPassed ? "bg-[#105238] text-[#8ee01a]" : "bg-[#eaf0e2] text-[#105238]"
                                      )}
                                    >
                                      {isPassed ? <Check className="w-3.5 h-3.5" /> : stop.order}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-foreground truncate">
                                        {stop.name || `Parada ${stop.order}`}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground">
                                        {isCurrent
                                          ? "Unidad aquí ahora"
                                          : stop.minutes_from_start
                                            ? `~${stop.minutes_from_start} min desde inicio`
                                            : `${Number(stop.latitude).toFixed(4)}, ${Number(stop.longitude).toFixed(4)}`}
                                      </p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 border-t border-border/60 bg-white dark:bg-card space-y-2 shrink-0">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={() => {
                                if (trackedRoute) {
                                  setTracking(null)
                                  handleBuyTicket(trackedRoute)
                                }
                              }}
                              className="flex-1 h-11 rounded-xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold text-xs gap-1.5 cursor-pointer"
                            >
                              <Ticket className="w-4 h-4 text-[#8ee01a]" />
                              Comprar Boleto
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                if (trackedRoute) {
                                  setTracking(null)
                                  handleViewServices(trackedRoute)
                                }
                              }}
                              className="h-11 px-3.5 rounded-xl border-border font-bold text-xs cursor-pointer"
                            >
                              Servicios
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setTracking(null)
                              onNavigate?.("safeflow")
                            }}
                            className="w-full h-9 rounded-xl bg-[#eaf0e2]/70 hover:bg-[#eaf0e2] text-[#105238] font-bold text-xs gap-1.5 cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#105238]" />
                            Seguimiento con Safe-Flow
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FLECHAS ARRIBA / 1/N / ABAJO FUERA DEL CARD (EXACTAMENTE COMO EXPERIENCIAS) */}
                  {totalNav > 1 && (
                    <div className="flex flex-col items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={goPrevRoute}
                        className="w-11 h-11 rounded-full bg-white/95 hover:bg-white text-slate-900 shadow-2xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                        aria-label="Ruta anterior"
                      >
                        <ArrowUp className="w-5 h-5" />
                      </button>
                      <span className="px-2.5 py-1 rounded-full bg-black/75 border border-white/15 text-white text-xs font-extrabold">
                        {currentIdx >= 0 ? currentIdx + 1 : 1}/{totalNav}
                      </span>
                      <button
                        type="button"
                        onClick={goNextRoute}
                        className="w-11 h-11 rounded-full bg-white/95 hover:bg-white text-slate-900 shadow-2xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                        aria-label="Siguiente ruta"
                      >
                        <ArrowDown className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )
        })()}

      {/* Services Modal */}
      {serviceView?.showServices && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-3xl max-w-md w-full max-h-[85vh] shadow-2xl overflow-hidden flex flex-col border border-border">
            <div className="bg-[#105238] px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
              <h2 className="text-base font-bold">Servicios en esta ruta</h2>
              <button
                onClick={() => setServiceView(null)}
                className="p-1.5 hover:bg-white/15 rounded-full transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {services.slice(0, 6).map((service) => (
                <div
                  key={service.id}
                  className="border border-border rounded-2xl p-4 hover:bg-muted/40 transition space-y-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-sm line-clamp-1">{service.name}</h3>
                    <Badge className="bg-[#eaf0e2] text-[#105238] font-bold text-xs shrink-0">
                      ${service.price} /p
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{service.location}</p>
                  <Button
                    onClick={() => {
                      handleBuyTicket(allRoutes.find((r) => r.id === serviceView.routeId)!, service)
                      setServiceView(null)
                    }}
                    size="sm"
                    className="w-full bg-[#105238] hover:bg-[#0c3e2b] text-white text-xs rounded-xl h-9 cursor-pointer"
                  >
                    <Ticket size={14} className="mr-1.5 text-[#8ee01a]" />
                    Comprar Boleto + Servicio
                  </Button>
                </div>
              ))}
            </div>

            <div className="px-6 py-3.5 border-t border-border flex-shrink-0 bg-card">
              <Button onClick={() => setServiceView(null)} variant="outline" className="w-full rounded-xl bg-transparent">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Purchase Modal */}
      {ticketPurchase?.showPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-3xl max-w-md w-full max-h-[85vh] shadow-2xl overflow-hidden flex flex-col border border-border">
            <div className="bg-[#105238] px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#8ee01a]" />
                <h2 className="text-base font-bold">Comprar Boleto</h2>
              </div>
              {ticketPurchase.step === "selection" && (
                <button
                  onClick={() => setTicketPurchase(null)}
                  className="p-1.5 hover:bg-white/15 rounded-full transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              {ticketPurchase.step === "selection" && (
                <>
                  <div className="space-y-4">
                    <div className="bg-[#eaf0e2]/60 border border-[#aeb6a1]/40 p-4 rounded-2xl">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#105238] mb-1">
                        Ruta seleccionada
                      </p>
                      <p className="font-extrabold text-sm text-foreground">
                        {allRoutes.find((r) => r.id === ticketPurchase.routeId)?.name}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold mb-1.5">Parada de Origen</label>
                        <select
                          className="w-full p-2.5 text-sm rounded-xl border border-border bg-background"
                          value={ticketPurchase.startStopId || ""}
                          onChange={(e) =>
                            setTicketPurchase((prev) =>
                              prev ? { ...prev, startStopId: Number(e.target.value) } : null
                            )
                          }
                        >
                          {allRoutes
                            .find((r) => r.id === ticketPurchase.routeId)
                            ?.stops?.filter((s) => {
                              const endStop = allRoutes
                                .find((r) => r.id === ticketPurchase.routeId)
                                ?.stops?.find((es) => es.id === ticketPurchase.endStopId)
                              return !endStop || s.order < endStop.order
                            })
                            .map((stop) => (
                              <option key={stop.id} value={stop.id}>
                                {stop.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1.5">Parada de Destino</label>
                        <select
                          className="w-full p-2.5 text-sm rounded-xl border border-border bg-background"
                          value={ticketPurchase.endStopId || ""}
                          onChange={(e) =>
                            setTicketPurchase((prev) =>
                              prev ? { ...prev, endStopId: Number(e.target.value) } : null
                            )
                          }
                        >
                          {allRoutes
                            .find((r) => r.id === ticketPurchase.routeId)
                            ?.stops?.filter((s) => {
                              const startStop = allRoutes
                                .find((r) => r.id === ticketPurchase.routeId)
                                ?.stops?.find((ss) => ss.id === ticketPurchase.startStopId)
                              return startStop && s.order > startStop.order
                            })
                            .map((stop) => (
                              <option key={stop.id} value={stop.id}>
                                {stop.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      {getTicketPrices().startName && getTicketPrices().endName && (
                        <p className="text-xs text-[#105238] bg-[#eaf0e2] p-2.5 rounded-xl font-medium">
                          Viaje: <strong>{getTicketPrices().startName}</strong> ➔{" "}
                          <strong>{getTicketPrices().endName}</strong>
                        </p>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <label className="flex items-center gap-3 p-3 border border-border rounded-2xl cursor-pointer hover:bg-muted/40 transition">
                        <input type="radio" name="ticket" defaultChecked className="w-4 h-4 accent-[#105238]" />
                        <div className="flex-1">
                          <p className="font-bold text-sm">Boleto Sencillo</p>
                          <p className="text-xs text-muted-foreground">Ida a tu destino</p>
                        </div>
                        <p className="font-black text-[#105238]">${getTicketPrices().oneWay} /p</p>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border rounded-2xl cursor-pointer hover:bg-muted/40 transition">
                        <input type="radio" name="ticket" className="w-4 h-4 accent-[#105238]" />
                        <div className="flex-1">
                          <p className="font-bold text-sm">Boleto de Retorno</p>
                          <p className="text-xs text-muted-foreground">Ida y vuelta incluido</p>
                        </div>
                        <p className="font-black text-[#105238]">${getTicketPrices().roundTrip} /p</p>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={handleConfirmTicketPayment}
                      className="w-full bg-[#105238] hover:bg-[#0c3e2b] text-white text-sm font-bold h-11 rounded-xl cursor-pointer"
                    >
                      Proceder al Pago
                    </Button>
                    <Button
                      onClick={() => setTicketPurchase(null)}
                      variant="outline"
                      className="w-full rounded-xl bg-transparent"
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              )}

              {ticketPurchase.step === "payment" && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-[#eaf0e2] rounded-full flex items-center justify-center animate-pulse">
                    <ShoppingCart className="w-8 h-8 text-[#105238]" />
                  </div>
                  <h3 className="font-bold text-lg">Procesando Compra</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Tu boleto de transporte está siendo procesado de forma segura...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN EXPERIENCIAS-STYLE 2-COLUMN LAYOUT ─── */}
      <div className="max-w-[1380px] mx-auto w-full px-4 sm:px-6 lg:px-5 pt-5 pb-28">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:gap-8 items-start">
          {/* LEFT / CENTER COLUMN: SOCIAL ROUTE FEED */}
          <div className="w-full max-w-[650px] mx-auto space-y-4">
            {/* Selector estilo Facebook: Iconos centrados con línea verde inferior */}
            <div className="bg-white dark:bg-card border border-border/70 rounded-2xl px-2 flex items-center gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => onNavigate?.("marketplace")}
                aria-label="Servicios"
                className="group relative flex-1 h-10 my-1 flex items-center justify-center rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-white/10 text-slate-500 transition-colors cursor-pointer"
              >
                <LayoutGrid className="w-6 h-6" />
                <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute top-full mt-2.5 bg-neutral-900/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg z-40">
                  Servicios
                </span>
              </button>
              <button
                type="button"
                aria-label="Rutas"
                className="group relative flex-1 h-12 flex items-center justify-center text-[#105238] cursor-default"
              >
                <RouteIcon className="w-6 h-6" />
                <span className="absolute bottom-0 inset-x-3 h-[3px] rounded-t-full bg-[#105238]" />
                <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute top-full mt-1.5 bg-neutral-900/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg z-40">
                  Rutas
                </span>
              </button>
            </div>

            {/* Search & Categories Sticky Bar (pegado arriba sin rendija transparente) */}
            <div className="sticky top-0 z-20 bg-[#f5f6f3] dark:bg-background pt-2 pb-1 -mx-1 px-1">
              <div className="bg-white dark:bg-card border border-border/80 rounded-3xl p-3 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar rutas, destinos o paradas..."
                    className="pl-10 pr-9 h-10 bg-[#f0f2f5] dark:bg-muted border-0 rounded-full text-sm focus-visible:ring-1 focus-visible:ring-[#105238]"
                    value={routeSearchQuery}
                    onChange={(e) => setRouteSearchQuery(e.target.value)}
                  />
                  {routeSearchQuery && (
                    <button
                      onClick={() => setRouteSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRouteSeed((s) => s + 1)
                    showQuickToast("Feed de rutas actualizado")
                  }}
                  className="h-10 w-10 rounded-full bg-[#f0f2f5] hover:bg-[#eaf0e2] text-foreground/80 hover:text-[#105238] transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                  title="Mezclar orden de rutas"
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate?.("map-explorer")}
                  className="h-10 px-3.5 rounded-full text-xs font-bold whitespace-nowrap bg-[#eaf0e2] hover:bg-[#105238] text-[#105238] hover:text-white transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {returnToMapRoute ? (
                    <>
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span className="max-w-[110px] truncate hidden sm:inline">Volver a {returnToMapRoute}</span>
                      <span className="sm:hidden">Mapa</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-3.5 h-3.5" />
                      <span>Explorar Mapa</span>
                    </>
                  )}
                </button>
              </div>

              {/* Category Pills with Desktop < / > Scroll Arrows */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => catsTrackRef.current?.scrollBy({ left: -180, behavior: "smooth" })}
                  className="hidden sm:flex w-7 h-7 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] text-slate-600 items-center justify-center shrink-0 cursor-pointer"
                  aria-label="Categorías anteriores"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div ref={catsTrackRef} className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1 py-0.5">
                  {[
                    { id: "ALL", label: "Todas" },
                    { id: "INTERURBANO", label: "Interurbano" },
                    { id: "URBANO", label: "Urbano" },
                    { id: "TOURS", label: "Tours" },
                    { id: "GPS", label: "GPS en vivo" },
                    ...(allRoutes.some((r: any) => r.user_has_ticket)
                      ? [{ id: "MY_ROUTES", label: "Mis Rutas" }]
                      : []),
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActiveFilter(f.id as any)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0",
                        activeFilter === f.id
                          ? "bg-[#105238] text-white border-[#105238] shadow-xs"
                          : "bg-[#f0f2f5] dark:bg-muted text-foreground/80 border-transparent hover:bg-[#eaf0e2] hover:text-[#105238]"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => catsTrackRef.current?.scrollBy({ left: 180, behavior: "smooth" })}
                  className="hidden sm:flex w-7 h-7 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] text-slate-600 items-center justify-center shrink-0 cursor-pointer"
                  aria-label="Siguientes categorías"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              </div>
            </div>

            {/* Backdrop global blur cuando una tarjeta tiene los comentarios en foco 3D */}
            {openCommentsRouteId !== null && (
              <div
                id="routes-comments-soft-backdrop"
                onClick={() => setOpenCommentsRouteId(null)}
                onWheel={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                className="fixed inset-0 w-screen h-screen bg-black/45 backdrop-blur-xs z-30 animate-in fade-in duration-150"
              />
            )}

            {/* FEED CARDS PROGRESIVO + REELS INTELIGENTES INTERCALADOS */}
            {visibleRoutes.map((route, idx) => {
              const shouldShowExperienciasStrip = idx === 3 && (services || []).length > 0
              const reelToShow =
                idx === 1
                  ? routeSmartReels[0]
                  : idx === 5
                    ? routeSmartReels[1]
                    : idx === 7
                      ? routeSmartReels[2]
                      : idx > 7 && (idx + 1) % 4 === 0
                        ? routeSmartReels[Math.floor((idx + 1) / 4) % routeSmartReels.length]
                        : null

              return (
                <div key={route.id} className="space-y-4">
                  <RouteFeedCard
                    route={route}
                    userReaction={userReactions[route.id] || null}
                    isJustReacted={justReactedRouteId === route.id}
                    isReactionPickerOpen={openReactionPickerId === route.id}
                    isCommentsOpen={openCommentsRouteId === route.id}
                    isShareOpen={openShareId === route.id}
                    isCopied={copiedRouteId === route.id}
                    comments={routeComments[route.id] || []}
                    currentUser={currentUser}
                    onReactionMouseEnter={() => handleReactionMouseEnter(route.id)}
                    onReactionMouseLeave={handleReactionMouseLeave}
                    onTogglePicker={() =>
                      setOpenReactionPickerId((prev) => (prev === route.id ? null : route.id))
                    }
                    onSelectReaction={(r) => toggleRouteReaction(route.id, r)}
                    onToggleComments={() =>
                      setOpenCommentsRouteId((prev) => (prev === route.id ? null : route.id))
                    }
                    onCloseComments={() => setOpenCommentsRouteId(null)}
                    onToggleShare={() =>
                      setOpenShareId((prev) => (prev === route.id ? null : route.id))
                    }
                    onShareMouseEnter={() => handleShareMouseEnter(route.id)}
                    onShareMouseLeave={handleShareMouseLeave}
                    onCloseShare={() => setOpenShareId(null)}
                    onCopyShare={async (url) => {
                      await navigator.clipboard.writeText(url)
                      setCopiedRouteId(route.id)
                      showQuickToast("Enlace de ruta copiado al portapapeles")
                      setTimeout(() => setCopiedRouteId(null), 1500)
                      setOpenShareId(null)
                    }}
                    onAddComment={(text, rating) => addRouteComment(route.id, text, rating)}
                    onTrack={() => handleStartTracking(route)}
                    onServices={() => handleViewServices(route)}
                    onBuy={() => handleBuyTicket(route)}
                  />

                  {/* Reel inteligente intercalado (Modo Chofer, Alianzas B2B, Pools) */}
                  {reelToShow && <SmartAppReelStrip reel={reelToShow} />}

                  {/* Carrusel cruzado de Experiencias & Servicios (en lugar de Tours en mapa) */}
                  {shouldShowExperienciasStrip && (
                    <div className="bg-card border border-border rounded-3xl p-4 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-8 h-8 rounded-full bg-[#105238] text-[#8ee01a] flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-[#105238]">
                              Experiencias en tu ruta
                            </p>
                            <h4 className="text-sm font-extrabold text-foreground truncate">
                              Hoteles, cafés y lugares para visitar
                            </h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => experienciasTrackRef.current?.scrollBy({ left: -240, behavior: "smooth" })}
                            className="hidden sm:flex w-7 h-7 rounded-full bg-white dark:bg-card border border-slate-200/90 items-center justify-center text-slate-600 hover:bg-[#f0f2f5] hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
                            aria-label="Anteriores experiencias"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => experienciasTrackRef.current?.scrollBy({ left: 240, behavior: "smooth" })}
                            className="hidden sm:flex w-7 h-7 rounded-full bg-white dark:bg-card border border-slate-200/90 items-center justify-center text-slate-600 hover:bg-[#f0f2f5] hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
                            aria-label="Siguientes experiencias"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate?.("marketplace")}
                            className="text-xs font-bold bg-[#105238] text-white px-3.5 py-1.5 rounded-full hover:bg-[#0c3e2b] transition-colors shrink-0 cursor-pointer"
                          >
                            Ver Servicios
                          </button>
                        </div>
                      </div>
                      <div ref={experienciasTrackRef} className="flex items-stretch gap-3 overflow-x-auto scrollbar-hide py-1">
                        {(services || []).slice(0, 8).map((svc) => (
                          <button
                            key={svc.id}
                            type="button"
                            onClick={() => onNavigate?.("marketplace")}
                            className="w-[140px] shrink-0 text-left rounded-2xl border border-border/70 bg-white dark:bg-card overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                          >
                            <div className="relative h-24 w-full bg-muted overflow-hidden">
                              <img
                                src={getProxyImage(svc.image || "") || DEFAULT_STORE_COVER}
                                alt={svc.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.src = DEFAULT_STORE_COVER
                                }}
                              />
                              <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                ${svc.price} /p
                              </span>
                            </div>
                            <div className="p-2">
                              <p className="text-xs font-bold text-foreground line-clamp-1">{svc.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {svc.category || "Experiencia"}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Sentinel de carga progresiva al hacer scroll */}
            {visibleCount < filteredRoutes.length && (
              <div ref={loadMoreRef} className="flex flex-col items-center py-4 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 5, filteredRoutes.length))}
                  className="px-5 py-2.5 rounded-full bg-white dark:bg-card border border-border text-xs font-bold text-[#105238] hover:bg-[#eaf0e2] shadow-2xs transition-colors cursor-pointer"
                >
                  Cargar más rutas ({filteredRoutes.length - visibleCount} restantes)
                </button>
              </div>
            )}

            {/* Tarjeta de cierre del ciclo cuando ya vio todas las rutas */}
            {filteredRoutes.length > 0 && visibleCount >= filteredRoutes.length && (
              <div className="bg-white dark:bg-card border border-border rounded-3xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#105238]" />
                    ¿Quieres explorar otro orden de rutas?
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mezcla el feed o cambia a otra categoría para descubrir nuevos recorridos.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRouteSeed((s) => s + 1)
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                  className="h-9 px-4 rounded-full border-[#aeb6a1] text-[#105238] hover:bg-[#eaf0e2] font-bold text-xs gap-1.5 shrink-0 cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Nuevo orden</span>
                </Button>
              </div>
            )}

            {filteredRoutes.length === 0 && (
              <div className="bg-white dark:bg-card border border-border rounded-3xl text-center py-12 px-6 shadow-2xs">
                <div className="bg-[#eaf0e2] w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="h-6 w-6 text-[#105238]" />
                </div>
                <p className="text-foreground font-bold text-sm">No se encontraron rutas</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Intenta con otros términos de búsqueda o cambia el filtro
                </p>
              </div>
            )}
          </div>

          {/* RIGHT STICKY SIDEBAR ON DESKTOP (Same Experiencias aesthetic) */}
          <aside
            onMouseEnter={() => setIsHoveringSidebar(true)}
            onMouseLeave={() => setIsHoveringSidebar(false)}
            className="hidden lg:block lg:w-[300px] xl:w-[320px] shrink-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto hover-scrollbar pr-1 space-y-4"
          >
            {/* 1. Publicidad (Experiencias destacadas) */}
            {(() => {
              const hasRealPhoto = (s: Service) =>
                Boolean(s.image && !s.image.includes("placeholder") && s.image !== DEFAULT_STORE_COVER)
              const adPool = (services || []).filter(hasRealPhoto).slice(0, 10)
              if (adPool.length === 0) return null
              const firstIdx = (adRotationIndex * 2) % adPool.length
              const secondIdx = (firstIdx + 1) % adPool.length
              const visibleAds = adPool.length > 1 ? [adPool[firstIdx], adPool[secondIdx]] : [adPool[firstIdx]]
              return (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-extrabold text-muted-foreground tracking-tight">Publicidad</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#105238] bg-[#eaf0e2] px-2 py-0.5 rounded-full">
                      Destacado
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {visibleAds.map((ad, idx) => {
                      const baseP = Number(ad.price) || 15
                      const discPct = ad.oferta_flash?.descuento_porcentaje || (idx === 0 ? 20 : 15)
                      const promoP = ad.oferta_flash?.precio_promocional ?? +(baseP * (1 - discPct / 100)).toFixed(2)
                      return (
                        <button
                          key={`${ad.id}-${firstIdx}-${idx}`}
                          type="button"
                          onClick={() => onNavigate?.("marketplace")}
                          className="w-full flex items-center gap-3 p-2 rounded-2xl bg-card/80 hover:bg-card hover:shadow-xs border border-border/60 hover:border-[#aeb6a1] transition-all text-left cursor-pointer group/ad"
                        >
                          <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-muted border border-border/50">
                            <img
                              src={getProxyImage(ad.image || "") || DEFAULT_STORE_COVER}
                              alt={ad.name}
                              className="w-full h-full object-cover group-hover/ad:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_STORE_COVER
                              }}
                            />
                            <span className="absolute top-1.5 left-1.5 bg-black/75 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                              -{discPct}%
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-[13px] font-extrabold text-foreground leading-snug line-clamp-2 group-hover/ad:underline">
                              {ad.name}
                            </p>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-sm font-black text-[#105238]">${promoP}</span>
                              <span className="text-[11px] line-through text-muted-foreground">${baseP}</span>
                              <span className="text-[10px] text-muted-foreground">/p</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                              palenquego.com · {ad.category || "Experiencia"}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* 2. Reserva pendiente / próxima */}
            {primaryBooking && (
              <div className="bg-white dark:bg-card border border-border/80 rounded-3xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#105238]">
                    <Ticket className="w-3.5 h-3.5" />
                    {primaryBooking.status === "PENDIENTE" ? "Reserva pendiente" : "Mi próxima reserva"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate?.("pool")}
                    className="text-[11px] font-bold text-[#105238] hover:underline cursor-pointer"
                  >
                    Ver todas
                  </button>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#f7f9f5] dark:bg-muted/40 border border-[#eaf0e2]">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0">
                    <img
                      src={getProxyImage(primaryBooking.service?.image || "") || DEFAULT_STORE_COVER}
                      alt={primaryBooking.service?.name || "Reserva"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_STORE_COVER
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-foreground truncate">
                      {primaryBooking.service?.name || "Experiencia"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Total: <strong className="text-[#105238]">${primaryBooking.totalPrice}</strong>
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onNavigate?.("pool")}
                  className="w-full h-9 rounded-xl bg-[#f0f2f5] hover:bg-[#eaf0e2] text-[#105238] font-bold text-xs border-0 shadow-none cursor-pointer"
                >
                  Ver Voucher / Pagar
                </Button>
              </div>
            )}

            {/* 3. Tiendas y Experiencias Aliadas */}
            {(services || []).length > 0 && (
              <div className="bg-white dark:bg-card border border-border/80 rounded-3xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-foreground">
                    <Store className="w-3.5 h-3.5 text-[#105238]" />
                    Experiencias Aliadas
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate?.("marketplace")}
                    className="text-[11px] font-bold text-[#105238] hover:underline cursor-pointer"
                  >
                    Explorar
                  </button>
                </div>
                <div className="space-y-2">
                  {(services || []).slice(0, 3).map((svc) => (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => onNavigate?.("marketplace")}
                      className="w-full flex items-center gap-2.5 p-2 rounded-2xl hover:bg-[#f0f2f5] dark:hover:bg-muted transition-colors text-left cursor-pointer"
                    >
                      <img
                        src={getProxyImage(svc.image || "") || DEFAULT_STORE_COVER}
                        alt={svc.name}
                        className="w-10 h-10 rounded-full object-cover border border-border/60 shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_STORE_COVER
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{svc.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {svc.category || "Turismo"} · ${svc.price} /p
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Floating Ticket Button */}
      {(useAppStore.getState().activeTickets?.length || 0) > 0 && (
        <button
          onClick={() => setTicketModalOpen(true)}
          className="fixed bottom-20 lg:bottom-6 right-5 bg-[#105238] text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center justify-center z-40 cursor-pointer border border-[#8ee01a]/40"
        >
          <Ticket className="w-5 h-5 mr-2 text-[#8ee01a]" />
          <span className="font-bold text-xs">Ver Ticket</span>
        </button>
      )}

      {/* Ticket Modal */}
      {ticketModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative border border-border">
            <button
              onClick={() => setTicketModalOpen(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-7 text-center bg-[#105238] border-b border-border">
              <Ticket className="w-12 h-12 mx-auto text-[#8ee01a] mb-3" />
              <h2 className="text-xl font-bold text-white">Ticket Inteligente</h2>
              <p className="text-xs text-white/80 mt-1">Muestra esta pantalla al chofer</p>
            </div>

            <div className="p-5 space-y-3 bg-card max-h-[60vh] overflow-y-auto">
              {useAppStore.getState().activeTickets?.map((t: any) => (
                <div key={t.id} className="border border-[#aeb6a1]/50 rounded-2xl p-4 bg-background shadow-2xs">
                  <h3 className="font-bold text-sm mb-2 text-[#105238]">{t.route_name}</h3>
                  <div className="flex justify-between items-center text-xs mb-3">
                    <span className="font-semibold">{t.start_stop_name || "Origen"}</span>
                    <span className="text-muted-foreground mx-2">➔</span>
                    <span className="font-semibold">{t.end_stop_name || "Destino"}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-border pt-3">
                    <span className="text-[11px] font-bold text-[#105238] bg-[#eaf0e2] px-2.5 py-0.5 rounded-full">
                      Pago Confirmado
                    </span>
                    <span className="font-black text-base text-[#105238]">${t.total_paid}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Experiencias-style Route Post Card ───────────────────────────────────────
function RouteFeedCard({
  route,
  userReaction,
  isJustReacted,
  isReactionPickerOpen,
  isCommentsOpen,
  isShareOpen,
  isCopied,
  comments,
  currentUser,
  onReactionMouseEnter,
  onReactionMouseLeave,
  onTogglePicker,
  onSelectReaction,
  onToggleComments,
  onCloseComments,
  onToggleShare,
  onShareMouseEnter,
  onShareMouseLeave,
  onCloseShare,
  onCopyShare,
  onAddComment,
  onTrack,
  onServices,
  onBuy,
}: {
  route: Route
  userReaction: ReactionKey | null
  isJustReacted: boolean
  isReactionPickerOpen: boolean
  isCommentsOpen: boolean
  isShareOpen: boolean
  isCopied: boolean
  comments: RouteCommentItem[]
  currentUser: any
  onReactionMouseEnter: () => void
  onReactionMouseLeave: () => void
  onTogglePicker: () => void
  onSelectReaction: (r: ReactionKey) => void
  onToggleComments: () => void
  onCloseComments: () => void
  onToggleShare: () => void
  onShareMouseEnter: () => void
  onShareMouseLeave: () => void
  onCloseShare: () => void
  onCopyShare: (url: string) => void
  onAddComment: (text: string, rating: number) => void
  onTrack: () => void
  onServices: () => void
  onBuy: () => void
}) {
  const r = route as any
  const hasGPS = Boolean(r.is_active && r.unit_lat && r.unit_lng)
  const [showMoreInfo, setShowMoreInfo] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [commentRating, setCommentRating] = useState(5)
  const cardRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)

  const coverUrl = getRouteImageUrl(route)
  const stops = route.stops || []
  const stopsSummary =
    stops.length > 0
      ? stops
          .slice(0, 3)
          .map((s) => s.name)
          .filter(Boolean)
          .join(" ➔ ") + (stops.length > 3 ? ` (+${stops.length - 3})` : "")
      : "Recorrido verificado"

  const avgRating =
    comments.length > 0
      ? (comments.reduce((acc, c) => acc + c.rating, 0) / comments.length).toFixed(1)
      : "5.0"

  const priceNum = Number(route.price_one_way || 0)
  const activeReactMeta = userReaction ? REACTIONS.find((rx) => rx.id === userReaction) : null

  // Alinear suavemente arriba al abrir comentarios en foco 3D
  useEffect(() => {
    if (isCommentsOpen && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 60)
    }
  }, [isCommentsOpen])

  // Bloquear wheel en cabecera y composer fijos cuando los comentarios están en foco 3D
  useEffect(() => {
    if (!isCommentsOpen) return
    const stopWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }
    const hdr = headerRef.current
    const ftr = footerRef.current
    hdr?.addEventListener("wheel", stopWheel, { passive: false })
    ftr?.addEventListener("wheel", stopWheel, { passive: false })
    return () => {
      hdr?.removeEventListener("wheel", stopWheel)
      ftr?.removeEventListener("wheel", stopWheel)
    }
  }, [isCommentsOpen])

  const handleSubmitComment = () => {
    if (!commentText.trim()) return
    onAddComment(commentText, commentRating)
    setCommentText("")
  }

  return (
    <article
      ref={cardRef}
      className={cn(
        "bg-white dark:bg-card border border-border/80 rounded-3xl transition-all duration-300 scroll-mt-2",
        isCommentsOpen
          ? "relative z-40 scale-[1.02] shadow-[0_25px_60px_-10px_rgba(0,0,0,0.35)] ring-2 ring-black/10 dark:ring-white/10 h-[calc(100vh-18px)] sm:h-[calc(100dvh-18px)] max-h-[calc(100vh-18px)] sm:max-h-[calc(100dvh-18px)] flex flex-col overflow-hidden"
          : "relative z-10 shadow-2xs overflow-hidden hover:shadow-md",
        r.user_has_ticket && !isCommentsOpen && "ring-2 ring-[#105238]/30"
      )}
    >
      {/* 1. CABECERA FIJA ESTILO EXPERIENCIAS */}
      <div
        ref={headerRef}
        className={cn(
          "px-4 pt-4 pb-2.5 flex items-start justify-between gap-3 bg-white dark:bg-card",
          isCommentsOpen && "shrink-0 border-b border-border/40 z-10"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 rounded-full overflow-hidden border border-border/70 bg-[#eaf0e2] shrink-0">
            <img
              src={route.driver_avatar || coverUrl}
              alt={route.name}
              className="w-full h-full object-cover"
              onError={handleImageFallback}
            />
            {hasGPS && (
              <span
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#8ee01a] border-2 border-white animate-pulse"
                title="GPS en vivo"
              />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-[15px] font-extrabold text-foreground leading-tight truncate">
                {route.name}
              </h3>
              {r.user_has_ticket && (
                <span className="text-[10px] font-black bg-[#105238] text-[#8ee01a] px-2 py-0.5 rounded-full shrink-0">
                  Mi Ruta
                </span>
              )}
            </div>
            <p className="text-[12px] text-muted-foreground truncate mt-0.5">
              {route.driver_name || "PalenqueGo Transportes"} · {stops.length} paradas ·{" "}
              <span className={cn("font-semibold", hasGPS ? "text-[#105238]" : "text-muted-foreground")}>
                {hasGPS ? "GPS en vivo" : route.unit_license_plate || "Unidad oficial"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-0.5">
              <span className="text-base font-black text-foreground">
                {priceNum > 0 ? `$${priceNum.toFixed(2)}` : "Gratis"}
              </span>
              {priceNum > 0 && <span className="text-[11px] font-semibold text-muted-foreground">/p</span>}
            </div>
            {route.unit_capacity ? (
              <span className="text-[10px] font-bold text-[#105238] bg-[#eaf0e2] px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5">
                <Users className="w-2.5 h-2.5" />
                {route.unit_capacity} PAX
              </span>
            ) : null}
          </div>

          {isCommentsOpen && (
            <button
              type="button"
              onClick={onCloseComments}
              className="w-8 h-8 rounded-full bg-[#f0f2f5] hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Cerrar comentarios"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. CUERPO CENTRAL (con scroll interno cuando los comentarios están abiertos) */}
      <div
        className={cn(
          isCommentsOpen ? "flex-1 overflow-y-auto scrollbar-hide overscroll-contain min-h-0" : ""
        )}
      >
        {/* DESCRIPCIÓN Y PARADAS EXPANDIBLES */}
        <div className={cn("px-4 pb-3 space-y-2", isCommentsOpen && "pt-2.5")}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[13px] text-foreground/85 font-medium truncate flex-1 min-w-[180px]">
              {stopsSummary}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowMoreInfo((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#105238] bg-[#eaf0e2]/80 hover:bg-[#eaf0e2] px-2.5 py-1 rounded-full transition-colors cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                {showMoreInfo ? "Ocultar detalles" : "Más información"}
              </button>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground bg-[#f0f2f5] dark:bg-muted px-2 py-1 rounded-full">
                <Star className="w-3.5 h-3.5 fill-[#105238] text-[#105238]" />
                {avgRating} <span className="text-muted-foreground font-normal">({comments.length})</span>
              </span>
            </div>
          </div>

          {r.descripcion && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{r.descripcion}</p>
          )}

          {showMoreInfo && (
            <div className="mt-2 p-3.5 rounded-2xl bg-[#f7f9f5] dark:bg-muted/40 border border-[#eaf0e2] dark:border-border space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white dark:bg-card p-2.5 rounded-xl border border-border/50">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">Conductor</span>
                  <span className="font-bold text-foreground truncate block">{route.driver_name || "Por asignar"}</span>
                </div>
                <div className="bg-white dark:bg-card p-2.5 rounded-xl border border-border/50">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">Vehículo / Placa</span>
                  <span className="font-bold text-foreground truncate block">
                    {route.unit_license_plate || route.unit_name || "Oficial"}
                  </span>
                </div>
                <div className="bg-white dark:bg-card p-2.5 rounded-xl border border-border/50 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">Estado GPS</span>
                  <span className={cn("font-bold block", hasGPS ? "text-[#105238]" : "text-muted-foreground")}>
                    {hasGPS ? "En vivo ●" : "Sin señal"}
                  </span>
                </div>
              </div>

              {stops.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#105238]">
                    Paradas del recorrido
                  </p>
                  <div className="space-y-1.5">
                    {stops.map((stop, idx) => (
                      <div key={stop.id || idx} className="flex items-center gap-2.5 text-xs">
                        <span className="w-5 h-5 rounded-full bg-[#105238] text-[#8ee01a] font-black text-[10px] flex items-center justify-center shrink-0">
                          {stop.order || idx + 1}
                        </span>
                        <span className="font-semibold text-foreground truncate flex-1">
                          {stop.name || `Parada ${idx + 1}`}
                        </span>
                        {stop.minutes_from_start ? (
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            <Clock className="w-3 h-3 inline mr-0.5" />
                            {stop.minutes_from_start}m
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* IMAGEN DE LA RUTA (Click abre el mapa completo igual que el lightbox de Experiencias) */}
        <div className="px-4">
          <div
            onClick={onTrack}
            className="relative h-[260px] sm:h-[310px] w-full rounded-2xl overflow-hidden bg-muted cursor-pointer group border border-border/50"
            title="Haz clic para abrir el mapa completo y rastrear esta ruta"
          >
            <img
              src={coverUrl}
              alt={route.name}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              onError={handleImageFallback}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20 pointer-events-none" />

            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="bg-black/65 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#8ee01a]" />
                {stops.length} paradas
              </span>
              {hasGPS && (
                <span className="bg-[#105238]/90 backdrop-blur-md text-[#8ee01a] text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8ee01a] animate-pulse" />
                  En vivo
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelectReaction("recomiendo")
              }}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-foreground flex items-center justify-center shadow-md transition-transform active:scale-90 cursor-pointer"
              aria-label="Recomendar esta ruta"
            >
              <Heart className={cn("w-4 h-4", userReaction ? "fill-[#105238] text-[#105238]" : "text-gray-700")} />
            </button>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
              <span className="text-white text-xs font-bold drop-shadow-sm truncate">
                {r.duracion || `${Math.max(1, stops.length - 1) * 20} min estimados`}
              </span>
              <span className="bg-white/95 hover:bg-white text-[#105238] text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg inline-flex items-center gap-1.5 shrink-0">
                <Maximize2 className="w-3.5 h-3.5" />
                Ver mapa completo
              </span>
            </div>
          </div>
        </div>

        {/* BARRA DE ACCIONES SOCIALES CON PICKER 3D ESTILO EXPERIENCIAS */}
        <div className="px-4 py-3 flex items-center justify-between gap-1.5 flex-wrap sm:flex-nowrap relative">
          <div className="flex items-center gap-1">
            {/* Reaccionar + Tray flotante con "Me trataron bien", "Me divertí", "Me fascinó", "Quiero ir", "Lo recomiendo" */}
            <div
              className="relative"
              onMouseEnter={onReactionMouseEnter}
              onMouseLeave={onReactionMouseLeave}
            >
              {isReactionPickerOpen && (
                <div
                  onMouseEnter={onReactionMouseEnter}
                  onMouseLeave={onReactionMouseLeave}
                  className="absolute bottom-full left-0 pb-2.5 z-50"
                >
                  <div className="bg-white dark:bg-card border border-border rounded-full shadow-2xl px-2.5 py-2 flex items-center gap-2 animate-fb-tray">
                    {REACTIONS.map((rx) => {
                      const selected = userReaction === rx.id
                      return (
                        <button
                          key={rx.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectReaction(rx.id)
                          }}
                          className={cn(
                            "group/emoji relative flex flex-col items-center justify-center rounded-full transition-transform duration-200 hover:scale-135 hover:-translate-y-2.5 cursor-pointer focus:outline-none",
                            selected && "ring-2 ring-[#8ee01a] ring-offset-2 ring-offset-white dark:ring-offset-card"
                          )}
                          aria-label={rx.label}
                        >
                          <span className="pointer-events-none opacity-0 group-hover/emoji:opacity-100 transition-opacity duration-150 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg">
                            {rx.label}
                          </span>
                          <ReactionBadgeIcon type={rx.id} size="lg" animated />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (userReaction) {
                    onSelectReaction(userReaction)
                  } else {
                    onTogglePicker()
                  }
                }}
                className={cn(
                  "h-9 px-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer",
                  activeReactMeta
                    ? "bg-[#f0f2f5] text-slate-800"
                    : "text-muted-foreground hover:bg-[#f0f2f5] hover:text-foreground"
                )}
              >
                {activeReactMeta ? (
                  <>
                    <span className={cn(isJustReacted && "animate-fb-pop")}>
                      <ReactionBadgeIcon type={activeReactMeta.id} size="md" />
                    </span>
                    <span className="truncate max-w-[110px]">{activeReactMeta.label}</span>
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4 shrink-0" />
                    <span>Reaccionar</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={onToggleComments}
              className={cn(
                "h-9 px-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer",
                isCommentsOpen
                  ? "bg-[#eaf0e2] text-[#105238]"
                  : "text-muted-foreground hover:bg-[#f0f2f5] hover:text-foreground"
              )}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Comentar{comments.length > 0 ? ` (${comments.length})` : ""}</span>
            </button>

            {/* Compartir con Popover estilo Experiencias (hover en escritorio + clic en móvil) */}
            <div
              className="relative"
              onMouseEnter={onShareMouseEnter}
              onMouseLeave={onShareMouseLeave}
            >
              {isShareOpen && (
                <div
                  onMouseEnter={onShareMouseEnter}
                  onMouseLeave={onShareMouseLeave}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="bg-white dark:bg-card border border-border rounded-full shadow-2xl px-2.5 py-2 flex items-center gap-2">
                    {(() => {
                      const shareUrl =
                        typeof window !== "undefined" ? `${window.location.origin}/r/${route.id}` : ""
                      return (
                        <>
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(`${route.name} en PalenqueGo: ${shareUrl}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onCloseShare}
                            className="group/sharebtn relative w-9 h-9 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] border border-slate-200/80 flex items-center justify-center text-slate-800 shadow-sm transition-transform duration-200 hover:scale-120 hover:-translate-y-1.5"
                            aria-label="WhatsApp"
                          >
                            <span className="pointer-events-none opacity-0 group-hover/sharebtn:opacity-100 transition-opacity duration-150 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                              WhatsApp
                            </span>
                            <MessageCircle className="w-4 h-4 text-[#25D366]" />
                          </a>
                          <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onCloseShare}
                            className="group/sharebtn relative w-9 h-9 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] border border-slate-200/80 flex items-center justify-center text-[#1877F2] text-sm font-black shadow-sm transition-transform duration-200 hover:scale-120 hover:-translate-y-1.5"
                            aria-label="Facebook"
                          >
                            <span className="pointer-events-none opacity-0 group-hover/sharebtn:opacity-100 transition-opacity duration-150 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                              Facebook
                            </span>
                            f
                          </a>
                          <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${route.name} en PalenqueGo`)}&url=${encodeURIComponent(shareUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onCloseShare}
                            className="group/sharebtn relative w-9 h-9 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] border border-slate-200/80 flex items-center justify-center text-slate-900 text-xs font-black shadow-sm transition-transform duration-200 hover:scale-120 hover:-translate-y-1.5"
                            aria-label="X"
                          >
                            <span className="pointer-events-none opacity-0 group-hover/sharebtn:opacity-100 transition-opacity duration-150 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                              X
                            </span>
                            X
                          </a>
                          <a
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onCloseShare}
                            className="group/sharebtn relative w-9 h-9 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] border border-slate-200/80 flex items-center justify-center text-[#0A66C2] text-xs font-black shadow-sm transition-transform duration-200 hover:scale-120 hover:-translate-y-1.5"
                            aria-label="LinkedIn"
                          >
                            <span className="pointer-events-none opacity-0 group-hover/sharebtn:opacity-100 transition-opacity duration-150 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                              LinkedIn
                            </span>
                            in
                          </a>
                          <a
                            href={`mailto:?subject=${encodeURIComponent(route.name)}&body=${encodeURIComponent(shareUrl)}`}
                            onClick={onCloseShare}
                            className="group/sharebtn relative w-9 h-9 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-sm transition-transform duration-200 hover:scale-120 hover:-translate-y-1.5"
                            aria-label="Correo"
                          >
                            <span className="pointer-events-none opacity-0 group-hover/sharebtn:opacity-100 transition-opacity duration-150 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                              Correo
                            </span>
                            <Mail className="w-4 h-4 text-slate-700" />
                          </a>
                          <button
                            type="button"
                            onClick={() => onCopyShare(shareUrl)}
                            className="group/sharebtn relative w-9 h-9 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-sm transition-transform duration-200 hover:scale-120 hover:-translate-y-1.5 cursor-pointer"
                            aria-label="Copiar enlace"
                          >
                            <span className="pointer-events-none opacity-0 group-hover/sharebtn:opacity-100 transition-opacity duration-150 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                              Copiar
                            </span>
                            {isCopied ? (
                              <Check className="w-4 h-4 text-[#105238]" />
                            ) : (
                              <Link2 className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onToggleShare}
                className={cn(
                  "h-9 px-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer",
                  isShareOpen
                    ? "bg-[#eaf0e2] text-[#105238]"
                    : "text-muted-foreground hover:bg-[#f0f2f5] hover:text-foreground"
                )}
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Compartir</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <Button
              type="button"
              size="sm"
              onClick={onServices}
              variant="ghost"
              className="h-9 px-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-[#105238] hover:bg-[#eaf0e2]/70 cursor-pointer"
            >
              Servicios
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onTrack}
              className="h-9 px-3.5 rounded-xl bg-[#eaf0e2] hover:bg-[#105238] text-[#105238] hover:text-white font-bold text-xs gap-1.5 border-0 shadow-none transition-colors cursor-pointer"
            >
              <Navigation2 className="w-3.5 h-3.5" />
              Rastrear
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onBuy}
              className="h-9 px-3.5 rounded-xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold text-xs gap-1.5 shadow-2xs cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5 text-[#8ee01a]" />
              Boleto
            </Button>
          </div>
        </div>

        {/* LISTA DE COMENTARIOS DENTRO DEL CUERPO CON SCROLL */}
        {isCommentsOpen && (
          <div className="border-t border-border/50 px-4 py-3 space-y-2.5 bg-[#fafaf8]/60 dark:bg-muted/10">
            {comments.length > 0 ? (
              comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#105238] text-white text-[10px] font-black flex items-center justify-center shrink-0 overflow-hidden">
                    {c.userAvatar ? (
                      <img src={c.userAvatar} alt={c.userName} className="w-full h-full object-cover" />
                    ) : (
                      c.userName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 bg-white dark:bg-card border border-border/60 rounded-2xl px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-foreground">{c.userName}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-3 h-3",
                              i < c.rating ? "fill-[#105238] text-[#105238]" : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-foreground/90 mt-1">{c.text}</p>
                    <span className="text-[10px] text-muted-foreground">{c.createdAt}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-3">
                Sé el primero en opinar y calificar esta ruta.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 3. BARRA DE COMENTARIOS FIJA ABAJO (FOCO 3D) */}
      {isCommentsOpen && (
        <div
          ref={footerRef}
          className="shrink-0 border-t border-border/50 bg-[#fafaf8] dark:bg-[#1e1e1e] p-3 rounded-b-3xl z-10 space-y-2"
        >
          {/* Fila unificada en 1 línea: Avatar + 3 plantillas + 5 estrellas completas */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-hide py-0.5 flex-nowrap w-full">
            <div className="flex items-center gap-1 shrink-0 flex-nowrap">
              <div className="w-7 h-7 rounded-full bg-[#105238] text-white text-[10px] font-black flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-black/10">
                {(currentUser as any)?.avatar ? (
                  <img src={(currentUser as any).avatar} alt="Tú" className="w-full h-full object-cover" />
                ) : (
                  (currentUser?.name || "TU").slice(0, 2).toUpperCase()
                )}
              </div>
              {["Ya tomé esta ruta", "Excelente recorrido", "¿Horario de salida?"].map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setCommentText(tpl)}
                  className="px-2 py-0.5 rounded-full bg-white dark:bg-card border border-border text-[10px] font-bold text-foreground/80 hover:border-[#105238] hover:text-[#105238] whitespace-nowrap shrink-0 shadow-2xs cursor-pointer"
                >
                  {tpl}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white dark:bg-card border border-border shrink-0 ml-auto flex-nowrap">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setCommentRating(star)}
                  className="cursor-pointer p-0.5"
                  aria-label={`Calificar ${star} estrellas`}
                >
                  <Star
                    className={cn(
                      "w-3 h-3",
                      star <= commentRating ? "fill-[#105238] text-[#105238]" : "text-gray-300"
                    )}
                  />
                </button>
              ))}
              <span className="text-[10px] font-bold text-[#105238] ml-0.5">{commentRating}/5</span>
            </div>
          </div>

          {/* Textarea compacta 1 línea auto-expandible + botón enviar verde */}
          <div className="flex items-end gap-2 bg-white dark:bg-card border border-border rounded-2xl px-3 py-2">
            <textarea
              rows={1}
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value)
                e.target.style.height = "auto"
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmitComment()
                }
              }}
              placeholder="Comparte tu experiencia, opina, califica..."
              className="flex-1 bg-transparent text-xs outline-none resize-none min-h-[22px] max-h-[120px] leading-relaxed text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="button"
              disabled={!commentText.trim()}
              onClick={handleSubmitComment}
              className={cn(
                "p-1.5 rounded-full transition-all cursor-pointer shrink-0",
                commentText.trim()
                  ? "text-[#105238] dark:text-[#8ee01a] hover:bg-[#f0f2f5] dark:hover:bg-white/10 active:scale-95 bg-transparent"
                  : "text-neutral-400/50 bg-transparent cursor-not-allowed"
              )}
              aria-label="Publicar comentario"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
