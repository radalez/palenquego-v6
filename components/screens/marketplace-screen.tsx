"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  MapPin,
  Star,
  X,
  Heart,
  Filter,
  Flame,
  Bed,
  Waves,
  Coffee,
  TreePine,
  Utensils,
  Ticket,
  Users,
  Zap,
  Compass,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAppStore, type Service } from "@/lib/store"
import { BookingModal } from "@/components/booking-modal"
import { HeaderWithMenu } from "@/components/header-with-menu"
import { RatingModal } from "@/components/rating-modal"
import { AdvancedFilterPanel, type FilterOptions } from "@/components/advanced-filter-panel"
import { PriceComparisonModal } from "@/components/price-comparison-modal"
import { BusinessCarousel } from "@/components/business-carousel"

function FlashCountdown({ fechaFin }: { fechaFin: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [isExpired, setIsExpired] = useState<boolean>(false)

  useEffect(() => {
    const calculateTime = () => {
      const diff = new Date(fechaFin).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft("00:00:00")
        setIsExpired(true)
        return
      }

      const totalSeconds = Math.floor(diff / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60

      const pad = (n: number) => String(n).padStart(2, "0")
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`)
    }

    calculateTime()
    const timer = setInterval(calculateTime, 1000)
    return () => clearInterval(timer)
  }, [fechaFin])

  if (isExpired) return null

  return (
    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-[#105238]/95 backdrop-blur-md text-white border border-[#8ee01a]/60 px-2.5 py-0.5 rounded-full shadow-lg">
      <Zap className="w-3.5 h-3.5 text-[#8ee01a] fill-[#8ee01a] animate-pulse shrink-0" />
      <span className="text-[11px] font-black font-mono tracking-wider leading-none text-white">
        {timeLeft || "00:00:00"}
      </span>
    </div>
  )
}

const categories = [
  { id: "all", label: "Todo", icon: Flame },
  { id: "flash", label: "Ofertas Flash", icon: Zap, isSpecial: true },
  { id: "hotel", label: "Hoteles", icon: Bed },
  { id: "restaurante", label: "Restaurantes", icon: Utensils },
  { id: "surf", label: "Surf", icon: Waves },
  { id: "cafe", label: "Café", icon: Coffee },
  { id: "eco", label: "Ecoturismo", icon: TreePine },
  { id: "food", label: "Gastronomía", icon: Utensils },
  { id: "playa", label: "Playa", icon: Waves },
  { id: "spa", label: "Spa", icon: Heart },
  { id: "aventura", label: "Aventura", icon: Ticket },
  { id: "tours", label: "Tours", icon: Compass },
]

function matchesCategory(service: Service, selectedCategory: string): boolean {
  if (selectedCategory === "all") return true

  if (selectedCategory === "flash") {
    return Boolean(service.oferta_flash && (service.oferta_flash.cupos_disponibles ?? 0) > 0)
  }

  const catName = (service.category || service.categoria?.nombre || "").toLowerCase()
  const catId = service.categoria?.id

  switch (selectedCategory) {
    case "hotel":
      return catName.includes("hotel") || catName.includes("hospedaj") || catId === 5
    case "restaurante":
      return catName.includes("restauran") || catId === 1
    case "surf":
      return catName.includes("surf") || catId === 7
    case "cafe":
      return catName.includes("café") || catName.includes("cafe") || catId === 10
    case "eco":
      return catName.includes("eco") || catName.includes("tour") || catId === 4 || catId === 3
    case "food":
      return catName.includes("gastro") || catName.includes("restauran") || catName.includes("comida") || catId === 6 || catId === 1
    case "playa":
      return catName.includes("playa") || catId === 8
    case "spa":
      return catName.includes("spa") || catId === 2
    case "aventura":
      return catName.includes("aventura") || catId === 9
    case "tours":
      return catName.includes("tour") || catId === 3
    default:
      return catName.includes(selectedCategory.toLowerCase())
  }
}

interface MarketplaceScreenProps {
  onNavigate?: (tab: string) => void
  onViewServiceDetail?: (service: Service) => void
}

export function MarketplaceScreen({ onNavigate, onViewServiceDetail }: MarketplaceScreenProps) {
  const router = useRouter()
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [serviceForRoutes, setServiceForRoutes] = useState<Service | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [serviceToRate, setServiceToRate] = useState<Service | null>(null)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showComparisonModal, setShowComparisonModal] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    ratingMin: 0,
    priceMin: 0,
    priceMax: 500,
    searchQuery: "",
  })

  const [visibleCount, setVisibleCount] = useState(24)
  const [activePoolTooltipId, setActivePoolTooltipId] = useState<number | null>(null)
  const observerRef = useRef<HTMLDivElement | null>(null)

  // Reset pagination when category or search changes
  useEffect(() => {
    setVisibleCount(24)
  }, [selectedCategory, searchQuery, filters])

  // Automatic Infinite Scroll 100% fluido en Celular y Escritorio (IntersectionObserver + Scroll Listener en contenedor real)
  useEffect(() => {
    const el = observerRef.current
    if (!el) return

    // Buscar el contenedor padre real que tiene el scroll
    const scrollParent = el.closest(".overflow-y-auto") || document.querySelector(".overflow-y-auto")

    // 1. IntersectionObserver vinculado al scrollParent real
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 24)
        }
      },
      { 
        root: scrollParent || null, 
        rootMargin: "800px" // Carga con 800px de anticipación para que nunca se quede trabado
      }
    )

    observer.observe(el)

    // 2. Listener de scroll nativo de respaldo tanto en contenedor como en window
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (scrollParent) {
            const { scrollTop, scrollHeight, clientHeight } = scrollParent as HTMLElement
            if (scrollTop + clientHeight >= scrollHeight - 800) {
              setVisibleCount((prev) => prev + 24)
            }
          } else {
            const scrollTop = window.scrollY || document.documentElement.scrollTop
            const scrollHeight = document.documentElement.scrollHeight
            const clientHeight = window.innerHeight
            if (scrollTop + clientHeight >= scrollHeight - 800) {
              setVisibleCount((prev) => prev + 24)
            }
          }
          ticking = false
        })
        ticking = true
      }
    }

    if (scrollParent) {
      scrollParent.addEventListener("scroll", handleScroll, { passive: true })
    }
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      observer.disconnect()
      if (scrollParent) {
        scrollParent.removeEventListener("scroll", handleScroll)
      }
      window.removeEventListener("scroll", handleScroll)
    }
  }, [visibleCount])

  // --- CONEXIÓN A TU API REAL ---
  const { 
    services, 
    businesses, 
    toggleFavoritePreference, 
    registerPoolInterest,
    userFavorites,
    fetchServices,
    fetchBusinesses,
    isLoading,
    bookings,
  } = useAppStore()

  useEffect(() => {
    fetchServices() // Jala servicios desde 157.245.181.207
    fetchBusinesses() // Jala tiendas de tu servidor
  }, [])

  const pendingBookings = bookings.filter((b) => b.status === "PENDIENTE")

  const filteredServices = services.filter((service) => {
    // Filtro de categoría flexible
    if (selectedCategory !== "all" && !matchesCategory(service, selectedCategory)) {
      return false
    }

    // Filtro de búsqueda combinado
    const combinedSearch = searchQuery || filters.searchQuery
    if (combinedSearch && !service.name.toLowerCase().includes(combinedSearch.toLowerCase())) {
      return false
    }

    // Filtro de calificación
    if (service.rating < filters.ratingMin) {
      return false
    }

    // Filtro de rango de precio
    if (service.price < filters.priceMin || service.price > filters.priceMax) {
      return false
    }

    return true
  })

  return (
    <div className="flex flex-col">
      <HeaderWithMenu title="Palenque Go" onNavigate={onNavigate} />

      {/* Banner de Reservas Pendientes de Pago */}
      {pendingBookings.length > 0 && (
        <div className="mx-4 mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 font-bold shrink-0">
              <Ticket className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                Tienes {pendingBookings.length} reserva{pendingBookings.length > 1 ? "s" : ""} pendiente{pendingBookings.length > 1 ? "s" : ""} de pago
              </p>
              <p className="text-[11px] text-muted-foreground line-clamp-1">
                {pendingBookings[0].service?.name || "Servicio"} (${pendingBookings[0].totalPrice})
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 px-3 rounded-lg font-semibold shrink-0"
            onClick={() => onNavigate?.("profile")}
          >
            Pagar / Ver
          </Button>
        </div>
      )}

      <div className="flex justify-between items-center px-4 py-4">
        <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
          <span className="text-primary-foreground font-semibold">JD</span>
        </div>
        
        {/* Barra de Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar experiencias..."
            className="pl-10 pr-12 bg-card border-0 h-12 rounded-xl text-foreground placeholder:text-muted-foreground"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowFilterPanel(true)}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 bg-secondary hover:bg-secondary/90"
          >
            <Filter className="w-5 h-5 text-secondary-foreground" />
          </Button>
        </div>
      </div>

      {/* Categorías */}
      <div className="px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = selectedCategory === cat.id
            const isSpecial = (cat as any).isSpecial
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all text-xs font-semibold cursor-pointer",
                  isActive
                    ? isSpecial
                      ? "bg-[#105238] text-white shadow-md font-bold ring-2 ring-[#8ee01a]/50"
                      : "bg-[#105238] text-white shadow-sm font-semibold"
                    : isSpecial
                      ? "bg-[#eaf0e2] text-[#105238] border border-[#8ee01a]/60 hover:bg-[#eaf0e2]/80 font-bold"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isSpecial ? "text-[#8ee01a] fill-[#8ee01a]" : "")} />
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Carousel de Negocios Reales */}
      <div className="px-4 py-4">
        <BusinessCarousel
          businesses={businesses}
          onViewProfile={(business) => router.push(`/b/${business.id}`)}
          onViewMore={() => onNavigate?.("businesses")}
        />
      </div>

      {/* Botón de Mapa Interactivo */}
      <div className="px-4 pb-4">
        <div 
          onClick={() => onNavigate?.("map-explorer")}
          className="group bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-300"
        >
          <div className="relative">
            {/* Animación delicada de "onda" (ping) detrás del icono */}
            <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping opacity-75" style={{ animationDuration: '2s' }}></div>
            {/* Contenedor del icono que se eleva suavemente al pasar el mouse */}
            <div className="relative bg-primary/20 p-3 rounded-full flex-shrink-0 group-hover:-translate-y-1 transition-transform duration-300">
              <MapPin className="w-6 h-6 text-primary drop-shadow-sm" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors duration-300">Ver rutas en mapa</h3>
            <p className="text-sm text-muted-foreground leading-tight mt-0.5">Explora destinos, descubre rutas y encuéntralas cerca de ti.</p>
          </div>
        </div>
      </div>

      {/* Sección de Remates Flow Destacada */}
      <div className="px-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#105238]/10 via-[#eaf0e2]/60 to-transparent p-3.5 rounded-2xl border border-[#105238]/20 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#105238] flex items-center justify-center text-[#8ee01a] shadow-sm">
              <Zap className="w-5 h-5 fill-[#8ee01a]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg text-[#105238] dark:text-[#8ee01a] tracking-tight">Remates Flow</h2>
                <span className="bg-[#105238] text-[#8ee01a] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Última hora
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">Ofertas activas con cupos limitados y cuenta regresiva</p>
            </div>
          </div>
          {filteredServices.length > 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowComparisonModal(true)}
              className="text-xs font-bold border-[#105238]/30 text-[#105238] hover:bg-[#eaf0e2] rounded-xl h-8"
            >
              Comparar precios
            </Button>
          )}
        </div>
      </div>

      {/* Listado de Tarjetas */}
      <div className="px-4 pb-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-10 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground italic">Sincronizando con Palenque...</p>
          </div>
        ) : (
          <>
            {filteredServices.slice(0, visibleCount).map((service) => {
              const hasFlashOffer = Boolean(service.oferta_flash && (service.oferta_flash.cupos_disponibles ?? 0) > 0)
              const basePrice = Number(service.price) || 0
              const flashDiscount = service.oferta_flash?.descuento_porcentaje || service.discount || 0
              const flashPrice = service.oferta_flash?.precio_promocional 
                ? Number(service.oferta_flash.precio_promocional) 
                : (basePrice * (1 - flashDiscount / 100))
              const flashSpots = service.oferta_flash?.cupos_disponibles ?? service.spotsLeft ?? 0

              return (
              <div key={service.id} className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border flex flex-col">
                <div className="relative h-40">
                  <img
                    src={service.image || "/placeholder.svg"}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => toggleFavoritePreference(service.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-sm z-20"
                  >
                    <Heart
                      className={cn(
                        "w-5 h-5 transition-colors",
                        userFavorites.some((f) => f.serviceId === service.id)
                          ? "fill-red-500 text-red-500"
                          : "text-foreground",
                      )}
                    />
                  </button>
                  {/* Cuenta Regresiva de Oferta Flash al lado contrario del corazón */}
                  {hasFlashOffer && service.oferta_flash?.fecha_fin ? (
                    <FlashCountdown fechaFin={service.oferta_flash.fecha_fin} />
                  ) : service.isRemate && (
                    <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-xs font-bold shadow-md z-20">
                      <Flame className="w-3 h-3 mr-1" />-{service.discount}%
                    </Badge>
                  )}

                  {/* Badge de Pool en Tarjeta */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-1 z-20">
                    <Badge className="bg-primary/95 text-primary-foreground backdrop-blur-sm shadow-md py-1 px-2.5 flex items-center gap-1.5 max-w-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="text-[10px] font-bold truncate">
                        {service.hasActivePool
                          ? `Pool disponible • ${service.spotsLeft || 3} cupos`
                          : "Ahorra desde 10% en tu viaje"}
                      </span>
                    </Badge>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePoolTooltipId(activePoolTooltipId === service.id ? null : service.id);
                      }}
                      className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold shadow-md hover:bg-primary/90 shrink-0"
                    >
                      ?
                    </button>
                  </div>

                  {/* Tooltip Popover despegable superpuesto */}
                  {activePoolTooltipId === service.id && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-0 bg-primary/95 text-primary-foreground p-4 flex flex-col justify-between z-30 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs flex items-center gap-1">
                            <Users className="w-4 h-4" /> ¿Qué es un Pool?
                          </span>
                          <button 
                            onClick={() => setActivePoolTooltipId(null)}
                            className="text-xs bg-white/20 px-2 py-0.5 rounded-full hover:bg-white/30"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-xs leading-relaxed opacity-95">
                          Un pool es un pago grupal. Si aceptas, serás invitado al pool de este servicio cuando esté disponible.
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs font-bold mt-2"
                        onClick={() => {
                          registerPoolInterest(service.id);
                          setActivePoolTooltipId(null);
                        }}
                      >
                        Avisarme e invitarme
                      </Button>
                    </div>
                  )}
                </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div 
                    className="flex-1 cursor-pointer" 
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        sessionStorage.setItem("palenque_return_tab", "marketplace");
                      }
                      router.push(`/s/${service.id}?from=marketplace`);
                    }}
                  >
                    {/* Usamos el nombre unificado */}
                    <h3 className="font-bold text-foreground hover:text-primary transition-colors text-lg">
                      {service.name}
                    </h3>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>{service.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-amber-700 text-sm">{service.rating}</span>
                    </div>
                    <span className="text-muted-foreground text-xs font-medium">({service.reviews} reseñas)</span>
                  </div>
                  <button
                    onClick={() => setServiceToRate(service)}
                    className="text-xs font-bold text-primary hover:bg-primary/5 px-2 py-1 rounded-lg transition-colors"
                  >
                    Calificar
                  </button>
                </div>

                <div className="flex flex-col gap-2 mt-3">
                  <div className="flex items-center justify-between gap-2">
                    {/* Precio Base vs Precio Flash (Paleta PalenqueGo: #105238 + #8ee01a) */}
                    <div className="min-w-0">
                      {hasFlashOffer ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground line-through font-semibold">
                              ${basePrice.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-extrabold bg-[#eaf0e2] text-[#105238] border border-[#8ee01a]/60 px-1.5 py-0.5 rounded-md">
                              -{flashDiscount}% OFF
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-[#105238] dark:text-[#8ee01a]">
                              ${flashPrice.toFixed(2)}
                            </span>
                            <span className="text-xs text-muted-foreground font-semibold">/p</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-foreground">${basePrice.toFixed(2)}</span>
                          <span className="text-muted-foreground text-xs font-semibold">/p</span>
                        </div>
                      )}
                    </div>

                    {/* Botón Compacto de Rutas Disponibles */}
                    {service.routes && service.routes.length > 0 && (
                      <button 
                        onClick={() => setServiceForRoutes(service)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#eaf0e2] hover:bg-[#eaf0e2]/80 text-[#105238] px-2.5 py-1.5 rounded-xl border border-[#105238]/20 transition-colors shrink-0 cursor-pointer"
                        title={`Ver ${service.routes.length} ruta${service.routes.length !== 1 ? 's' : ''} disponible${service.routes.length !== 1 ? 's' : ''}`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#105238] shrink-0" /> 
                        <span>{service.routes.length} ruta{service.routes.length !== 1 ? 's' : ''}</span>
                      </button>
                    )}
                  </div>

                  {/* Cupos Flash Restantes con Paleta de Marca */}
                  {hasFlashOffer && flashSpots > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#105238] bg-[#eaf0e2] border border-[#aeb6a1]/50 px-2 py-0.5 rounded-lg w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8ee01a] animate-pulse" />
                      <span>¡Solo quedan {flashSpots} cupo{flashSpots !== 1 ? 's' : ''} flash!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5 w-full pt-1">
                    <Button
                      variant="outline"
                      className="w-full h-9 rounded-xl text-xs font-bold border-border/80 hover:bg-muted text-foreground cursor-pointer flex items-center justify-center"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          sessionStorage.setItem("palenque_return_tab", "marketplace");
                        }
                        router.push(`/s/${service.id}?from=marketplace`);
                      }}
                    >
                      Ver Detalles
                    </Button>
                    <Button
                      className="w-full h-9 bg-[#105238] hover:bg-[#0c3e2a] text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs flex items-center justify-center"
                      onClick={() => setSelectedService(service)}
                    >
                      Reservar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )})}

          {visibleCount < filteredServices.length && (
            <div ref={observerRef} className="col-span-full py-6 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-[#105238] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </>
      )}
    </div>

      {/* Modales */}
      {selectedService && (
        <BookingModal service={selectedService} onClose={() => setSelectedService(null)} />
      )}

      {serviceToRate && (
        <RatingModal
          serviceId={serviceToRate.id}
          serviceName={serviceToRate.name}
          currentRating={serviceToRate.rating}
          currentReviews={serviceToRate.reviews}
          onClose={() => setServiceToRate(null)}
        />
      )}

      {showFilterPanel && (
        <AdvancedFilterPanel
          onFilter={(newFilters) => setFilters(newFilters)}
          onClose={() => setShowFilterPanel(false)}
          maxPrice={500}
        />
      )}

      {showComparisonModal && (
        <PriceComparisonModal
          services={filteredServices}
          onClose={() => setShowComparisonModal(false)}
        />
      )}

      {/* Routes Modal */}
      {serviceForRoutes && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Rutas Disponibles</h3>
              </div>
              <button 
                onClick={() => setServiceForRoutes(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground mb-4">
                "{typeof serviceForRoutes.name === 'object' ? (serviceForRoutes.name as any).nombre : serviceForRoutes.name}" está disponible en las siguientes rutas turísticas:
              </p>
              
              <div className="flex flex-col gap-3">
                {serviceForRoutes.routes?.map((route: any) => (
                  <button 
                    key={route.id}
                    onClick={() => {
                      setServiceForRoutes(null);
                      useAppStore.getState().setReturnToMapRoute(route.name);
                      onNavigate?.('map-explorer');
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group text-left"
                  >
                    <span className="font-semibold text-primary">{route.name}</span>
                    <MapPin className="w-4 h-4 text-primary/50 group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}