"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
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
  Route as RouteIcon,
  LayoutGrid,
  ThumbsUp,
  Smile,
  Sparkles,
  MessageSquare,
  Share2,
  Send,
  SlidersHorizontal,
  Calendar,
  Store as StoreIcon,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  Info,
  Check,
  Mail,
  Link2,
  MessageCircle,
  Loader2,
  Shuffle,
  Award,
  Flag,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useAppStore, type Service, DEFAULT_STORE_COVER, API_BASE, fetchWithAuth, getProxyImage } from "@/lib/store"
import { BookingModal } from "@/components/booking-modal"
import { HeaderWithMenu } from "@/components/header-with-menu"
import { RatingModal } from "@/components/rating-modal"
import { AdvancedFilterPanel, type FilterOptions } from "@/components/advanced-filter-panel"
import { PriceComparisonModal } from "@/components/price-comparison-modal"
import { MobileExperienceReelsModal } from "@/components/mobile-experience-reels-modal"

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
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-[#105238]/95 backdrop-blur-md text-white border border-[#8ee01a]/60 px-2.5 py-0.5 rounded-full shadow-lg">
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

export type ReactionKey = "trato" | "divertido" | "fascino" | "quiero_ir" | "recomiendo"

export const REACTIONS: Array<{ id: ReactionKey; label: string; icon: any }> = [
  { id: "trato", label: "Me trataron bien", icon: ThumbsUp },
  { id: "divertido", label: "Me divertí", icon: Smile },
  { id: "fascino", label: "Me fascinó", icon: Sparkles },
  { id: "quiero_ir", label: "Quiero ir", icon: Compass },
  { id: "recomiendo", label: "Lo recomiendo", icon: Award },
]

export function ReactionBadgeIcon({
  type,
  size = "md",
  animateOnHover = false,
  animated = false,
}: {
  type: ReactionKey
  size?: "xs" | "sm" | "md" | "lg"
  animateOnHover?: boolean
  animated?: boolean
}) {
  const sizeClass =
    size === "lg"
      ? "w-11 h-11"
      : size === "md"
        ? "w-5 h-5"
        : size === "sm"
          ? "w-4 h-4"
          : "w-3.5 h-3.5"

  const innerSize =
    size === "lg"
      ? "w-6 h-6"
      : size === "md"
        ? "w-3.5 h-3.5"
        : "w-2.5 h-2.5"

  const base3D =
    size === "lg"
      ? "relative overflow-hidden shadow-[0_8px_18px_rgba(15,23,42,0.25),inset_0_2px_4px_rgba(255,255,255,0.55),inset_0_-3px_5px_rgba(0,0,0,0.28)]"
      : "relative overflow-hidden shadow-[0_2px_6px_rgba(15,23,42,0.22),inset_0_1px_2px_rgba(255,255,255,0.45)]"

  const glossOverlay = (
    <span className="pointer-events-none absolute inset-x-1 top-0.5 h-[42%] rounded-full bg-gradient-to-b from-white/55 to-transparent" />
  )

  if (type === "trato") {
    return (
      <span
        className={cn(
          sizeClass,
          base3D,
          "rounded-full bg-gradient-to-br from-[#1877F2] via-[#166fe5] to-[#0e5a9e] border border-[#60a5fa] flex items-center justify-center shrink-0",
        )}
      >
        {glossOverlay}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn(
            innerSize,
            "relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
            animated && "animate-fb-thumb",
            animateOnHover && "group-hover/emoji:animate-fb-thumb",
          )}
        >
          <path
            d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Zm2 9h7.5a2 2 0 0 0 1.94-1.52l1.2-4.8A2 2 0 0 0 17.7 11H14V6.5A2.5 2.5 0 0 0 11.5 4l-.4.02a.5.5 0 0 0-.45.38L9 11v9Z"
            fill="#ffffff"
          />
        </svg>
      </span>
    )
  }

  if (type === "divertido") {
    return (
      <span
        className={cn(
          sizeClass,
          base3D,
          "rounded-full bg-gradient-to-br from-[#fbbd23] via-[#f59e0b] to-[#d97706] border border-[#fef08a] flex items-center justify-center shrink-0",
        )}
      >
        {glossOverlay}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn(
            innerSize,
            "relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]",
            animated && "animate-fb-laugh",
            animateOnHover && "group-hover/emoji:animate-fb-laugh",
          )}
        >
          <circle cx="8.5" cy="9.5" r="1.5" fill="#1f2937" />
          <circle cx="15.5" cy="9.5" r="1.5" fill="#1f2937" />
          <path
            d="M7 13.5c1.2 2.8 3.3 4 5 4s3.8-1.2 5-4h-10Z"
            fill="#1f2937"
          />
        </svg>
      </span>
    )
  }

  if (type === "fascino") {
    return (
      <span
        className={cn(
          sizeClass,
          base3D,
          "rounded-full bg-gradient-to-br from-[#2dd4bf] via-[#0d9488] to-[#115e59] border border-[#99f6e4] flex items-center justify-center shrink-0",
        )}
      >
        {glossOverlay}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn(
            innerSize,
            "relative z-10 drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)]",
            animated && "animate-fb-sparkle",
            animateOnHover && "group-hover/emoji:animate-fb-sparkle",
          )}
        >
          <path
            d="M12 2.5l2.4 5.9 6.1.6-4.6 4.1 1.4 6-5.3-3.2-5.3 3.2 1.4-6L3.5 9l6.1-.6L12 2.5Z"
            fill="#fef08a"
          />
        </svg>
      </span>
    )
  }

  if (type === "quiero_ir") {
    return (
      <span
        className={cn(
          sizeClass,
          base3D,
          "rounded-full bg-gradient-to-br from-[#38bdf8] via-[#0284c7] to-[#075985] border border-[#bae6fd] flex items-center justify-center shrink-0",
        )}
      >
        {glossOverlay}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn(
            innerSize,
            "relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]",
            animated && "animate-fb-compass",
            animateOnHover && "group-hover/emoji:animate-fb-compass",
          )}
        >
          <circle cx="12" cy="12" r="8.5" stroke="#ffffff" strokeWidth="1.9" />
          <path d="M15.5 8.5l-2.2 5.2-5.2 2.2 2.2-5.2 5.2-2.2Z" fill="#fde047" />
        </svg>
      </span>
    )
  }

  return (
    <span
      className={cn(
        sizeClass,
        base3D,
        "rounded-full bg-gradient-to-br from-[#818cf8] via-[#4f46e5] to-[#3730a3] border border-[#c7d2fe] flex items-center justify-center shrink-0",
      )}
    >
      {glossOverlay}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={cn(
          innerSize,
          "relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
          animated && "animate-fb-laugh",
          animateOnHover && "group-hover/emoji:animate-fb-laugh",
        )}
      >
        <circle cx="12" cy="9.5" r="5.5" fill="#8ee01a" />
        <path d="M9 14l-1.5 7 4.5-2.2 4.5 2.2-1.5-7" fill="#ffffff" />
      </svg>
    </span>
  )
}

function CategoryCarouselStrip({
  categoryLabel,
  categoryId,
  icon: CatIcon,
  items,
  onSelectCategory,
  onOpenService,
}: {
  categoryLabel: string
  categoryId: string
  icon: any
  items: Service[]
  onSelectCategory: (id: string) => void
  onOpenService: (id: number) => void
}) {
  const trackRef = useRef<HTMLDivElement | null>(null)

  const scrollTrack = (dir: "left" | "right") => {
    if (!trackRef.current) return
    trackRef.current.scrollBy({ left: dir === "right" ? 260 : -260, behavior: "smooth" })
  }

  return (
    <div className="bg-gradient-to-br from-[#eaf0e2] via-[#f4f7ef] to-white dark:from-card dark:to-card border border-[#aeb6a1]/60 rounded-3xl p-4 shadow-[0_8px_24px_rgba(16,82,56,0.08)] space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#1b7a53] to-[#105238] text-[#8ee01a] flex items-center justify-center shadow-[0_4px_10px_rgba(16,82,56,0.3)] shrink-0">
            <CatIcon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#105238]/75">
              Colección PalenqueGo
            </p>
            <h4 className="text-sm sm:text-base font-extrabold text-[#105238] dark:text-foreground truncate">
              Explora {categoryLabel}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => scrollTrack("left")}
            className="hidden sm:flex w-7 h-7 rounded-full bg-white dark:bg-card border border-slate-200/90 items-center justify-center text-slate-600 hover:bg-[#f0f2f5] hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollTrack("right")}
            className="hidden sm:flex w-7 h-7 rounded-full bg-white dark:bg-card border border-slate-200/90 items-center justify-center text-slate-600 hover:bg-[#f0f2f5] hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectCategory(categoryId)}
            className="text-xs font-bold bg-[#105238] text-[#8ee01a] px-3 py-1.5 rounded-full hover:bg-[#0c3e2b] transition-colors cursor-pointer"
          >
            Ver todo
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide snap-x pb-1"
      >
        {items.slice(0, 10).map((cs) => (
          <div
            key={cs.id}
            onClick={() => onOpenService(cs.id)}
            className="w-44 sm:w-48 shrink-0 snap-start bg-white dark:bg-background border border-border/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-[#105238]/40 transition-all cursor-pointer flex flex-col"
          >
            <div className="relative h-28 bg-muted overflow-hidden">
              <img
                src={cs.image || DEFAULT_STORE_COVER}
                alt={cs.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 right-2 bg-white/95 text-[#105238] text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 shadow-xs">
                <Star className="w-2.5 h-2.5 fill-[#105238]" /> {cs.rating}
              </span>
            </div>
            <div className="p-2.5 flex-1 flex flex-col justify-between gap-2">
              <div>
                <p className="text-xs font-extrabold text-foreground line-clamp-1">{cs.name}</p>
                <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5 text-[#105238] shrink-0" />
                  <span className="truncate">{cs.location}</span>
                </p>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <span className="text-xs font-black text-[#105238]">
                  ${Number(cs.price || 0).toFixed(0)} <span className="text-[10px] font-normal text-muted-foreground">/p</span>
                </span>
                <span className="text-[10px] font-bold text-[#105238] bg-[#eaf0e2] px-2 py-0.5 rounded-full">
                  Explorar
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Final "Ver más" card at the end of the 10-card carousel */}
        <button
          type="button"
          onClick={() => onSelectCategory(categoryId)}
          className="w-36 shrink-0 snap-start bg-[#105238] text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 hover:bg-[#0c3e2b] transition-colors cursor-pointer"
        >
          <span className="w-10 h-10 rounded-full bg-[#8ee01a] text-[#105238] flex items-center justify-center">
            <ChevronRight className="w-5 h-5" />
          </span>
          <span className="text-xs font-black text-center leading-snug">
            Ver más en {categoryLabel}
          </span>
        </button>
      </div>
    </div>
  )
}

function RoutesCarouselStrip({
  routes,
  routeType,
  onSelectRoute,
  onViewAllRoutes,
}: {
  routes: any[]
  routeType?: "TOUR" | "URBANO" | "INTERURBANO"
  onSelectRoute: (routeName: string) => void
  onViewAllRoutes: () => void
}) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const scrollTrack = (dir: "left" | "right") => {
    if (!trackRef.current) return
    trackRef.current.scrollBy({ left: dir === "right" ? 260 : -260, behavior: "smooth" })
  }
  const filteredRoutes = useMemo(() => {
    if (!routes || routes.length === 0) return []
    if (!routeType) return routes
    const matches = routes.filter((r) => (r.category || r.route_type || "").toUpperCase() === routeType)
    return matches.length > 0 ? matches : routes
  }, [routes, routeType])

  if (filteredRoutes.length === 0) return null

  const badgeLabel =
    routeType === "TOUR"
      ? "Tours Turísticos Go"
      : routeType === "URBANO"
        ? "Transporte Urbano Go"
        : routeType === "INTERURBANO"
          ? "Transporte Interurbano Go"
          : "Tours y Transporte Go"
  const headingLabel =
    routeType === "TOUR"
      ? "Tours guiados en el mapa"
      : routeType === "URBANO"
        ? "Rutas urbanas en el mapa"
        : routeType === "INTERURBANO"
          ? "Rutas interurbanas en el mapa"
          : "Rutas guiadas en el mapa"

  return (
    <div className="bg-gradient-to-br from-[#105238]/10 via-[#eaf0e2]/70 to-white dark:from-card dark:to-card border border-[#105238]/25 rounded-3xl p-4 shadow-[0_8px_24px_rgba(16,82,56,0.08)] space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-2xl bg-[#105238] text-[#8ee01a] flex items-center justify-center shadow-sm shrink-0">
            <Compass className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#105238]/80">
              {badgeLabel}
            </p>
            <h4 className="text-sm sm:text-base font-extrabold text-[#105238] dark:text-foreground truncate">
              {headingLabel}
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => scrollTrack("left")}
            className="hidden sm:flex w-7 h-7 rounded-full bg-white dark:bg-card border border-slate-200/90 items-center justify-center text-slate-600 hover:bg-[#f0f2f5] hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollTrack("right")}
            className="hidden sm:flex w-7 h-7 rounded-full bg-white dark:bg-card border border-slate-200/90 items-center justify-center text-slate-600 hover:bg-[#f0f2f5] hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onViewAllRoutes}
            className="text-xs font-bold bg-[#105238] text-[#8ee01a] px-3 py-1.5 rounded-full hover:bg-[#0c3e2b] transition-colors cursor-pointer"
          >
            Ver mapa
          </button>
        </div>
      </div>

      <div ref={trackRef} className="flex items-start gap-4 overflow-x-auto scrollbar-hide snap-x py-1 px-0.5">
        {filteredRoutes.slice(0, 12).map((route: any) => {
          const rawThumb = route.image || route.imagen_portada || ""
          const thumb = getProxyImage(rawThumb) || DEFAULT_STORE_COVER
          return (
            <button
              key={route.id}
              type="button"
              onClick={() => onSelectRoute(route.name)}
              className="w-28 sm:w-32 shrink-0 snap-start flex flex-col items-center text-center gap-2 group cursor-pointer"
            >
              <div className="relative">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full p-[3px] bg-gradient-to-tr from-[#105238] via-[#91c44a] to-[#8ee01a] shadow-md group-hover:scale-105 transition-transform duration-200">
                  <img
                    src={thumb}
                    alt={route.name}
                    className="w-full h-full rounded-full object-cover border-2 border-white dark:border-card"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_STORE_COVER
                    }}
                  />
                </div>
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#105238] text-[#8ee01a] text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap border border-white/80">
                  {route.price ? `$${route.price}` : "Ruta Go"}
                </span>
              </div>
              <div className="space-y-0.5 pt-1 w-full">
                <p className="text-xs font-extrabold text-foreground line-clamp-2 leading-tight group-hover:text-[#105238] transition-colors">
                  {route.name}
                </p>
                {route.duration && (
                  <p className="text-[10px] font-semibold text-muted-foreground truncate">
                    {route.duration}
                  </p>
                )}
              </div>
            </button>
          )
        })}

        <button
          type="button"
          onClick={onViewAllRoutes}
          className="w-28 shrink-0 snap-start flex flex-col items-center text-center gap-2 group cursor-pointer"
        >
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-[#105238] text-[#8ee01a] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border-4 border-[#eaf0e2]">
            <Compass className="w-7 h-7" />
          </div>
          <span className="text-xs font-black text-[#105238] dark:text-[#8ee01a] leading-tight pt-1">
            Ver todas en mapa
          </span>
        </button>
      </div>
    </div>
  )
}

interface SmartReelStep {
  stepBadge: string
  title: string
  description: string
  image: string
  isActionCard?: boolean
}

interface SmartReelDefinition {
  id: string
  badge: string
  heading: string
  subtitle: string
  ctaLabel: string
  icon: any
  steps: SmartReelStep[]
  onAction: () => void
}

function SmartAppReelStrip({ reel }: { reel: SmartReelDefinition }) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const ReelIcon = reel.icon

  useEffect(() => {
    if (reel.id === "upgrade-plan-10dias" && typeof window !== "undefined") {
      try {
        localStorage.setItem("palenque_upgrade_reel_shown_at", String(Date.now()))
      } catch {
        // ignore
      }
    }
  }, [reel.id])

  const scrollTrack = (dir: "left" | "right") => {
    if (!trackRef.current) return
    trackRef.current.scrollBy({ left: dir === "right" ? 240 : -240, behavior: "smooth" })
  }

  return (
    <div className="bg-card border border-[#105238]/25 rounded-3xl p-4 shadow-[0_8px_24px_rgba(16,82,56,0.07)] space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-2xl bg-[#105238] text-[#8ee01a] flex items-center justify-center shadow-sm shrink-0">
            <ReelIcon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#105238] dark:text-[#8ee01a]">
              {reel.badge}
            </p>
            <h4 className="text-sm sm:text-base font-extrabold text-foreground truncate">
              {reel.heading}
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => scrollTrack("left")}
            className="hidden sm:flex w-7 h-7 rounded-full bg-white dark:bg-card border border-slate-200/90 items-center justify-center text-slate-600 hover:bg-[#f0f2f5] hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollTrack("right")}
            className="hidden sm:flex w-7 h-7 rounded-full bg-white dark:bg-card border border-slate-200/90 items-center justify-center text-slate-600 hover:bg-[#f0f2f5] hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={reel.onAction}
            className="text-xs font-black bg-[#105238] text-[#8ee01a] px-3.5 py-1.5 rounded-full hover:bg-[#0c3e2b] transition-colors cursor-pointer"
          >
            {reel.ctaLabel}
          </button>
        </div>
      </div>

      <div ref={trackRef} className="flex items-stretch gap-3 overflow-x-auto scrollbar-hide snap-x py-1">
        {reel.steps.map((step, idx) => {
          const isLast = idx === reel.steps.length - 1 || step.isActionCard
          return (
            <div
              key={`${reel.id}-step-${idx}`}
              onClick={reel.onAction}
              className="w-[210px] sm:w-[225px] h-[300px] sm:h-[315px] shrink-0 snap-start rounded-2xl overflow-hidden relative group border border-[#105238]/20 shadow-sm flex flex-col justify-between p-3.5 text-left cursor-pointer select-none"
            >
              <img
                src={step.image || DEFAULT_STORE_COVER}
                alt={step.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_STORE_COVER
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#072619] via-[#105238]/75 to-black/30" />

              <div className="relative z-10 flex items-center justify-between gap-1.5">
                <span
                  className={cn(
                    "text-[10px] font-black px-2.5 py-1 rounded-full shadow-xs",
                    isLast
                      ? "bg-[#8ee01a] text-[#105238]"
                      : "bg-[#eaf0e2]/95 text-[#105238]",
                  )}
                >
                  {step.stepBadge}
                </span>
                <span className="w-6 h-6 rounded-full bg-black/40 text-white text-[10px] font-bold flex items-center justify-center border border-white/20">
                  {idx + 1}/{reel.steps.length}
                </span>
              </div>

              <div className="relative z-10 space-y-2">
                <h5 className="text-sm font-extrabold text-white leading-snug line-clamp-3">
                  {step.title}
                </h5>
                <p className="text-[11px] text-white/85 leading-relaxed line-clamp-4">
                  {step.description}
                </p>
                {isLast ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      reel.onAction()
                    }}
                    className="w-full mt-1.5 h-9 rounded-xl bg-[#8ee01a] hover:bg-[#8ee01a]/90 text-[#105238] font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer"
                  >
                    <span>{reel.ctaLabel}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-[#8ee01a]">
                    <span>Desliza para ver más</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FeedIntentSurveyCard({
  selectedIntent,
  onSelectIntent,
}: {
  selectedIntent: string | null
  onSelectIntent: (intent: "group" | "flash" | "business" | "driver") => void
}) {
  const options: Array<{
    id: "group" | "flash" | "business" | "driver"
    title: string
    subtitle: string
    icon: any
  }> = [
    {
      id: "group",
      title: "Viajar en grupo o familia",
      subtitle: "Ver Pools grupales y dividir gastos",
      icon: Users,
    },
    {
      id: "flash",
      title: "Cazar Ofertas Flash hoy",
      subtitle: "Descuentos relámpago y Palenque Go",
      icon: Zap,
    },
    {
      id: "business",
      title: "Tengo negocio o quiero ganar",
      subtitle: "Plan Bronce gratis, equipos y comisiones",
      icon: StoreIcon,
    },
    {
      id: "driver",
      title: "Soy Chofer / Tengo transporte",
      subtitle: "Rutas, boletos QR y pasajeros en vivo",
      icon: Compass,
    },
  ]

  return (
    <div className="bg-gradient-to-br from-[#105238] to-[#0b3b28] text-white rounded-3xl p-4 sm:p-5 shadow-md space-y-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-[#8ee01a] text-[#105238] px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3" /> Personaliza tu Feed
          </span>
          <h4 className="text-sm sm:text-base font-extrabold text-white pt-1">
            ¿Cuál es tu objetivo principal en PalenqueGo?
          </h4>
          <p className="text-[11px] text-white/80">
            Elige una opción para adaptar tus Reels, Pools y recomendaciones en tiempo real:
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const OptIcon = opt.icon
          const isSelected = selectedIntent === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectIntent(opt.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-2xl text-left transition-all border cursor-pointer",
                isSelected
                  ? "bg-[#8ee01a] text-[#105238] border-[#8ee01a] shadow-sm"
                  : "bg-white/10 hover:bg-white/15 text-white border-white/15",
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  isSelected ? "bg-[#105238] text-[#8ee01a]" : "bg-[#eaf0e2]/15 text-[#8ee01a]",
                )}
              >
                <OptIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold truncate">{opt.title}</p>
                <p
                  className={cn(
                    "text-[10px] truncate",
                    isSelected ? "text-[#105238]/85 font-semibold" : "text-white/75",
                  )}
                >
                  {opt.subtitle}
                </p>
              </div>
              {isSelected && <Check className="w-4 h-4 shrink-0 text-[#105238]" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StoresReelStrip({
  businesses,
  onOpenStore,
  onViewAllStores,
}: {
  businesses: any[]
  onOpenStore: (id: number) => void
  onViewAllStores: () => void
}) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  if (!businesses || businesses.length === 0) return null

  const scrollTrack = (dir: "left" | "right") => {
    trackRef.current?.scrollBy({ left: dir === "left" ? -260 : 260, behavior: "smooth" })
  }

  return (
    <div className="bg-card border border-[#aeb6a1]/70 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-[#105238] text-[#8ee01a] flex items-center justify-center shrink-0 shadow-xs">
            <StoreIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#105238]/80 dark:text-[#8ee01a]">
              REEL DE COMERCIOS · TIENDAS DESTACADAS
            </p>
            <h4 className="text-sm sm:text-base font-extrabold text-foreground truncate">
              Conoce los negocios aliados de PalenqueGo
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => scrollTrack("left")}
            className="hidden sm:flex w-7 h-7 rounded-full bg-white dark:bg-card border border-slate-200/90 items-center justify-center text-slate-600 hover:bg-[#f0f2f5] hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollTrack("right")}
            className="hidden sm:flex w-7 h-7 rounded-full bg-white dark:bg-card border border-slate-200/90 items-center justify-center text-slate-600 hover:bg-[#f0f2f5] hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onViewAllStores}
            className="text-xs font-black bg-[#105238] text-[#8ee01a] px-3.5 py-1.5 rounded-full hover:bg-[#0c3e2b] transition-colors cursor-pointer"
          >
            Ver tiendas
          </button>
        </div>
      </div>

      <div ref={trackRef} className="flex items-stretch gap-3 overflow-x-auto scrollbar-hide snap-x py-1">
        {businesses.slice(0, 10).map((biz) => {
          const cover = getProxyImage(biz.coverImage || biz.banner || biz.logo || "") || DEFAULT_STORE_COVER
          const logo = getProxyImage(biz.logo || "") || DEFAULT_STORE_COVER
          return (
            <button
              key={biz.id}
              type="button"
              onClick={() => onOpenStore(biz.id)}
              className="w-[205px] sm:w-[218px] h-[285px] shrink-0 snap-start rounded-2xl overflow-hidden relative group border border-[#105238]/20 shadow-sm flex flex-col justify-between p-3.5 text-left cursor-pointer"
            >
              <img
                src={cover}
                alt={biz.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_STORE_COVER
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#072619] via-[#105238]/65 to-black/25" />

              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#eaf0e2]/95 text-[#105238] truncate max-w-[130px]">
                  {biz.category || "Comercio Aliado"}
                </span>
                <span className="inline-flex items-center gap-0.5 bg-[#105238]/90 text-[#8ee01a] text-[10px] font-black px-2 py-0.5 rounded-full">
                  <Star className="w-2.5 h-2.5 fill-[#8ee01a]" /> {biz.rating || 5.0}
                </span>
              </div>

              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src={logo}
                    alt={biz.name}
                    className="w-10 h-10 rounded-xl object-cover border-2 border-[#8ee01a] bg-white shrink-0 shadow-sm"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_STORE_COVER
                    }}
                  />
                  <div className="min-w-0">
                    <h5 className="text-sm font-black text-white leading-tight truncate">{biz.name}</h5>
                    <p className="text-[10px] text-white/80 truncate">{biz.location || "El Salvador"}</p>
                  </div>
                </div>
                {biz.description && (
                  <p className="text-[11px] text-white/85 line-clamp-2 leading-snug">{biz.description}</p>
                )}
                <div className="pt-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-black bg-[#8ee01a] text-[#105238] px-3 py-1 rounded-full shadow-xs">
                    <span>Visitar tienda</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TravelerDestinationSurveyCard({
  currentCraving,
  onRequestRecommendations,
}: {
  currentCraving: string
  onRequestRecommendations: (craving: string, catHint: string) => void
}) {
  const [customInput, setCustomInput] = useState(currentCraving || "")
  const [selectedPreset, setSelectedPreset] = useState<{ label: string; cat: string } | null>(null)

  const presets = [
    { label: "Playa & Sol", cat: "playa" },
    { label: "Hoteles & Estancias", cat: "hotel" },
    { label: "Gastronomía & Café", cat: "restaurante" },
    { label: "Relax & Spa Termal", cat: "spa" },
    { label: "Naturaleza & Ecoturismo", cat: "eco" },
    { label: "Aventura & Surf", cat: "aventura" },
  ]

  const handleConfirm = () => {
    const chosenText = customInput.trim() || selectedPreset?.label || "Experiencias recomendadas"
    const chosenCat = selectedPreset?.cat || "all"
    onRequestRecommendations(chosenText, chosenCat)
  }

  return (
    <div className="bg-gradient-to-br from-[#eaf0e2] via-white to-[#eaf0e2]/60 dark:from-card dark:to-card border border-[#8ee01a] rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-[#105238] text-[#8ee01a] px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3" /> Radar de Viajero · Según tus Likes
          </span>
          <h4 className="text-sm sm:text-base font-black text-[#105238] dark:text-foreground pt-0.5">
            Vimos que te gustaron varias experiencias, ¿a dónde quieres viajar?
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Aún no tienes una reserva activa. Cuéntanos qué destino o plan tienes en mente y armaremos un Reel a tu medida:
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const active = selectedPreset?.label === p.label
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setSelectedPreset(p)
                setCustomInput(p.label)
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border",
                active
                  ? "bg-[#105238] text-[#8ee01a] border-[#105238] shadow-xs"
                  : "bg-white dark:bg-background text-[#105238] border-[#aeb6a1]/70 hover:bg-[#105238]/10",
              )}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          placeholder="Escribe un destino, playa, volcán, hotel o comida que te provoque..."
          className="flex-1 h-10 px-3.5 rounded-2xl border border-[#aeb6a1] bg-white dark:bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#105238]"
        />
        <Button
          type="button"
          onClick={handleConfirm}
          className="h-10 px-4 rounded-2xl bg-[#105238] hover:bg-[#0c3e2b] text-[#8ee01a] font-black text-xs gap-1.5 shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quiero recomendaciones</span>
        </Button>
      </div>
    </div>
  )
}

function PersonalizedTasteReelStrip({
  cravingLabel,
  items,
  onOpenService,
  onResetCraving,
}: {
  cravingLabel: string
  items: Service[]
  onOpenService: (svc: Service) => void
  onResetCraving: () => void
}) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  if (!items || items.length === 0) return null

  const scrollTrack = (dir: "left" | "right") => {
    trackRef.current?.scrollBy({ left: dir === "left" ? -260 : 260, behavior: "smooth" })
  }

  return (
    <div className="bg-gradient-to-b from-[#105238]/8 via-[#eaf0e2]/45 to-card border border-[#8ee01a]/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-[#105238] text-[#8ee01a] flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 fill-[#8ee01a]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#105238]">
              BASADO EN TUS GUSTOS · SELECCIÓN PERSONALIZADA
            </p>
            <h4 className="text-sm sm:text-base font-extrabold text-foreground truncate">
              Te recomendamos esto: {cravingLabel}
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => scrollTrack("left")}
            className="hidden sm:flex w-7 h-7 rounded-full bg-white dark:bg-card border border-slate-200/90 items-center justify-center text-slate-600 hover:bg-[#f0f2f5] hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollTrack("right")}
            className="hidden sm:flex w-7 h-7 rounded-full bg-white dark:bg-card border border-slate-200/90 items-center justify-center text-slate-600 hover:bg-[#f0f2f5] hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onResetCraving}
            className="text-[11px] font-bold bg-[#eaf0e2] text-[#105238] px-3 py-1 rounded-full hover:bg-[#105238] hover:text-[#8ee01a] transition-colors cursor-pointer"
          >
            Cambiar destino
          </button>
        </div>
      </div>

      <div ref={trackRef} className="flex items-stretch gap-3 overflow-x-auto scrollbar-hide snap-x py-1">
        {items.slice(0, 10).map((item) => {
          const thumb = getProxyImage(item.image || "") || DEFAULT_STORE_COVER
          return (
            <button
              key={`taste-${item.id}`}
              type="button"
              onClick={() => onOpenService(item)}
              className="w-[210px] sm:w-[225px] h-[295px] shrink-0 snap-start rounded-2xl overflow-hidden relative group border border-[#105238]/20 shadow-sm flex flex-col justify-between p-3.5 text-left cursor-pointer"
            >
              <img
                src={thumb}
                alt={item.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_STORE_COVER
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#072619] via-[#105238]/60 to-black/25" />

              <div className="relative z-10 flex items-center justify-between gap-1.5">
                <span className="bg-[#8ee01a] text-[#105238] text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  Para tu viaje
                </span>
                <span className="bg-black/50 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full border border-white/20">
                  ${item.price} /p
                </span>
              </div>

              <div className="relative z-10 space-y-1.5">
                <span className="inline-block text-[10px] font-bold text-[#8ee01a]">
                  {item.category || "Experiencia"}
                </span>
                <h5 className="text-sm font-black text-white leading-snug line-clamp-2">{item.name}</h5>
                <p className="text-[11px] text-white/80 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#8ee01a] shrink-0" />
                  <span className="truncate">{item.location}</span>
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-black bg-white/95 text-[#105238] px-3 py-1 rounded-full">
                    <span>Ver experiencia</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface ServiceComment {
  id: string
  author: string
  authorAvatar?: string
  text: string
  rating?: number
  createdAt: string
  location?: string
  flag?: string
  countryCode?: string
}

function CountryFlagBadge({ code, name, className }: { code: string; name?: string; className?: string }) {
  const [hasError, setHasError] = useState(false)
  const lower = (code || "").toLowerCase()
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {!hasError && lower ? (
        <img
          src={`https://flagcdn.com/w40/${lower}.png`}
          alt={name || code}
          onError={() => setHasError(true)}
          className="w-4 h-3 object-cover rounded-xs shadow-2xs shrink-0 border border-black/10 inline-block"
        />
      ) : (
        <span className="text-[10px] font-bold uppercase">{code}</span>
      )}
      {name && <span className="truncate">{name}</span>}
    </span>
  )
}

function RoundFlagIcon({
  code,
  className,
  isSelected,
}: {
  code: string
  className?: string
  isSelected?: boolean
}) {
  const [hasError, setHasError] = useState(false)
  const lower = (code || "").toLowerCase()
  return (
    <div className={cn("relative inline-flex items-center justify-center shrink-0", className)}>
      {!hasError && lower ? (
        <img
          src={`https://flagcdn.com/w80/${lower}.png`}
          alt={code}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover rounded-full shadow-2xs border border-black/10"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold uppercase text-slate-700 dark:text-slate-200">
          {code}
        </div>
      )}
      {isSelected && (
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#105238] text-white flex items-center justify-center text-[8px] font-black shadow-xs ring-1 ring-white">
          ✓
        </span>
      )}
    </div>
  )
}

interface WorldFlag {
  code: string
  name: string
  continent: "América" | "Europa" | "Asia" | "África" | "Oceanía"
}

const WORLD_FLAGS: WorldFlag[] = [
  // América
  { code: "sv", name: "El Salvador", continent: "América" },
  { code: "gt", name: "Guatemala", continent: "América" },
  { code: "hn", name: "Honduras", continent: "América" },
  { code: "ni", name: "Nicaragua", continent: "América" },
  { code: "cr", name: "Costa Rica", continent: "América" },
  { code: "pa", name: "Panamá", continent: "América" },
  { code: "mx", name: "México", continent: "América" },
  { code: "us", name: "Estados Unidos", continent: "América" },
  { code: "ca", name: "Canadá", continent: "América" },
  { code: "co", name: "Colombia", continent: "América" },
  { code: "br", name: "Brasil", continent: "América" },
  { code: "ar", name: "Argentina", continent: "América" },
  { code: "cl", name: "Chile", continent: "América" },
  { code: "pe", name: "Perú", continent: "América" },
  { code: "ec", name: "Ecuador", continent: "América" },
  { code: "do", name: "República Dominicana", continent: "América" },
  // Europa
  { code: "es", name: "España", continent: "Europa" },
  { code: "it", name: "Italia", continent: "Europa" },
  { code: "de", name: "Alemania", continent: "Europa" },
  { code: "fr", name: "Francia", continent: "Europa" },
  { code: "gb", name: "Reino Unido", continent: "Europa" },
  { code: "pt", name: "Portugal", continent: "Europa" },
  { code: "nl", name: "Países Bajos", continent: "Europa" },
  { code: "ch", name: "Suiza", continent: "Europa" },
  // Asia
  { code: "cn", name: "China", continent: "Asia" },
  { code: "jp", name: "Japón", continent: "Asia" },
  { code: "kr", name: "Corea del Sur", continent: "Asia" },
  { code: "in", name: "India", continent: "Asia" },
  { code: "il", name: "Israel", continent: "Asia" },
  { code: "ae", name: "Emiratos Árabes", continent: "Asia" },
  // África
  { code: "za", name: "Sudáfrica", continent: "África" },
  { code: "eg", name: "Egipto", continent: "África" },
  { code: "ma", name: "Marruecos", continent: "África" },
  { code: "ke", name: "Kenia", continent: "África" },
  // Oceanía
  { code: "au", name: "Australia", continent: "Oceanía" },
  { code: "nz", name: "Nueva Zelanda", continent: "Oceanía" },
]

const EMOJI_CATEGORIES = {
  emociones: ["😊", "😍", "🤩", "😎", "🥳", "🙌", "❤️", "🔥", "✨", "💯", "👍", "👏", "😃", "🥰", "🤙", "✌️", "💪", "🌟"],
  naturaleza: ["🌴", "🌊", "🌅", "🌋", "🏖️", "🌺", "🌲", "☀️", "🌙", "⭐", "🥑", "🥥", "🍍", "🐬", "🐢", "🦜", "🐚", "🌈"],
  viaje: ["✈️", "🚗", "🎒", "🥾", "🏄", "🛶", "🚴", "🧭", "🗺️", "🎫", "🏕️", "📸", "🏨", "⚓", "🛳️", "🛵", "🧳", "🥂"],
}

const TRAVEL_EMOJIS = [
  {
    category: "Playa y Naturaleza",
    emojis: ["🌴", "🏖️", "🌊", "🌋", "🌅", "⛰️", "🌲", "🌞", "🌺", "🐚", "🐬", "🐢"],
  },
  {
    category: "Aventura y Rutas",
    emojis: ["✈️", "🚗", "🎒", "🥾", "🏄", "🛶", "🚴", "🧭", "🗺️", "🎫", "🏕️", "📸"],
  },
  {
    category: "Gastronomía y Brindis",
    emojis: ["☕", "🍕", "🍹", "🌮", "🍔", "🥑", "🥥", "🍍", "🍻", "🥂", "🍽️", "🍦"],
  },
  {
    category: "Estancia y Vibes",
    emojis: ["🏨", "⛺", "🌙", "⭐", "🔥", "❤️", "👍", "✨", "🎉", "🕶️", "💯", "🙌"],
  },
]

const TRAVELER_COUNTRIES = [
  { code: "SV", name: "El Salvador" },
  { code: "US", name: "Estados Unidos" },
  { code: "GT", name: "Guatemala" },
  { code: "HN", name: "Honduras" },
  { code: "NI", name: "Nicaragua" },
  { code: "CR", name: "Costa Rica" },
  { code: "PA", name: "Panamá" },
  { code: "MX", name: "México" },
  { code: "CA", name: "Canadá" },
  { code: "CO", name: "Colombia" },
  { code: "ES", name: "España" },
  { code: "DE", name: "Alemania" },
  { code: "FR", name: "Francia" },
  { code: "IT", name: "Italia" },
  { code: "GB", name: "Reino Unido" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "PE", name: "Perú" },
  { code: "BR", name: "Brasil" },
]

const POPULAR_TRAVEL_LOCATIONS = [
  "Playa El Tunco",
  "San Salvador",
  "Lago de Coatepeque",
  "Santa Ana",
  "Ruta de las Flores",
  "Suchitoto",
  "Playa El Zonte",
  "Volcán de Santa Ana",
  "La Palma",
  "Puerto de La Libertad",
  "Playa Las Flores",
  "Apaneca",
  "Juayúa",
  "El Cuco",
]

interface TravelerPost {
  id: string
  author: string
  avatar?: string
  text: string
  rating?: number
  taggedServiceId?: number
  taggedServiceName?: string
  taggedServiceImage?: string
  createdAt: string
  createdAtMs?: number
  reactions: Record<ReactionKey, number>
  userReaction?: ReactionKey | null
  comments: ServiceComment[]
}

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
    case "food":
      return (
        catName.includes("gastro") ||
        catName.includes("restauran") ||
        catName.includes("comida") ||
        catId === 1 ||
        catId === 6
      )
    case "surf":
      return catName.includes("surf") || catId === 7
    case "cafe":
      return catName.includes("café") || catName.includes("cafe") || catId === 10
    case "eco":
      return catName.includes("eco") || catName.includes("tour") || catId === 4 || catId === 3
    case "playa":
      return catName.includes("playa") || catId === 8
    case "spa": {
      const text = `${service.name || ""} ${service.description || ""} ${catName}`.toLowerCase()
      return (
        catId === 2 ||
        text.includes("spa") ||
        text.includes("termal") ||
        text.includes("relax") ||
        text.includes("zen")
      )
    }
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

let cachedMarketplaceSession: {
  selectedCategory: string
  searchQuery: string
  onlyPreferred: boolean
  feedSeed: number
  batchNumber: number
  currentBatchIds: number[]
  servicesSnapshot: Service[]
  globalPoolSnapshot: Service[]
  scrollY: number
  shouldRestoreOnMount: boolean
} | null = null

export function MarketplaceScreen({ onNavigate }: MarketplaceScreenProps) {
  const router = useRouter()
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [serviceForRoutes, setServiceForRoutes] = useState<Service | null>(null)
  const [lightboxServiceId, setLightboxServiceId] = useState<number | null>(null)
  const [lightboxPhotoIdx, setLightboxPhotoIdx] = useState<number>(0)
  const [isLightboxPhotoFullscreen, setIsLightboxPhotoFullscreen] = useState<boolean>(false)
  const [enrichedLightboxService, setEnrichedLightboxService] = useState<Service | null>(null)
  const [expandLightboxDesc, setExpandLightboxDesc] = useState<boolean>(false)
  const [selectedCategory, setSelectedCategory] = useState(() =>
    cachedMarketplaceSession?.shouldRestoreOnMount ? cachedMarketplaceSession.selectedCategory : "all",
  )
  const [searchQuery, setSearchQuery] = useState(() =>
    cachedMarketplaceSession?.shouldRestoreOnMount ? cachedMarketplaceSession.searchQuery : "",
  )
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 280)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const [isCategoriesStuck, setIsCategoriesStuck] = useState(false)
  const isCategoriesStuckRef = useRef(false)
  const lastScrollYRef = useRef(0)
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null)
  const stickySearchRowRef = useRef<HTMLDivElement | null>(null)
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false)
  const [isMobileInlineSearchOpen, setIsMobileInlineSearchOpen] = useState(false)
  const [isMobileInlineInputFocused, setIsMobileInlineInputFocused] = useState(false)
  const isMobileInlineSearchOpenRef = useRef(false)
  const mobileInlineSearchScrollStartRef = useRef(0)
  const [serviceToRate, setServiceToRate] = useState<Service | null>(null)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showComparisonModal, setShowComparisonModal] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    ratingMin: 0,
    priceMin: 0,
    priceMax: 500,
    searchQuery: "",
  })

  // Preferences Modal state (initialized synchronously to prevent post-mount re-sort & double fetch)
  const [preferredCategories, setPreferredCategories] = useState<string[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const savedPrefs = localStorage.getItem("palenque_experiencias_prefs")
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      // ignore
    }
    return []
  })
  const [showPreferencesModal, setShowPreferencesModal] = useState(false)
  const [onlyPreferred, setOnlyPreferred] = useState(() =>
    cachedMarketplaceSession?.shouldRestoreOnMount ? cachedMarketplaceSession.onlyPreferred : false,
  )
  const [feedSeed, setFeedSeed] = useState<number>(() =>
    cachedMarketplaceSession?.shouldRestoreOnMount
      ? cachedMarketplaceSession.feedSeed
      : Math.floor(Math.random() * 99999),
  )

  // Social Feed state (reactions, inline comments, traveler posts, share popover)
  const [openReactionPickerId, setOpenReactionPickerId] = useState<number | null>(null)
  const [justReactedServiceId, setJustReactedServiceId] = useState<number | null>(null)
  const reactionCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [serviceReactions, setServiceReactions] = useState<Record<number, { counts: Record<ReactionKey, number>; userReaction: ReactionKey | null }>>({})
  const [openCommentsId, setOpenCommentsId] = useState<number | null>(null)
  const [serviceComments, setServiceComments] = useState<Record<number, ServiceComment[]>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({})
  const [commentRatings, setCommentRatings] = useState<Record<number, number>>({})
  const [commentLocations, setCommentLocations] = useState<Record<number, string>>({})
  const [commentCountries, setCommentCountries] = useState<Record<number, { code: string; flag: string; name: string }>>({})
  const [commentPickerMode, setCommentPickerMode] = useState<"emojis" | "location" | "country" | null>(null)
  const [customCommentLocation, setCustomCommentLocation] = useState("")

  const [flagSearchQuery, setFlagSearchQuery] = useState("")
  const [flagContinent, setFlagContinent] = useState<string>("Todas")
  const [flagCarouselPage, setFlagCarouselPage] = useState(0)
  const flagContinentTrackRef = useRef<HTMLDivElement | null>(null)

  const [emojiSearchQuery, setEmojiSearchQuery] = useState("")
  const [emojiCategory, setEmojiCategory] = useState<string>("todo")

  const [locationSearchQuery, setLocationSearchQuery] = useState("")

  // Click-outside listener to dismiss emojis, flags, or location popovers
  useEffect(() => {
    if (!commentPickerMode) return

    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest(".comment-picker-popover") || target.closest(".comment-picker-trigger")) {
        return
      }
      setCommentPickerMode(null)
    }

    document.addEventListener("mousedown", handlePointerDownOutside)
    document.addEventListener("touchstart", handlePointerDownOutside)

    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside)
      document.removeEventListener("touchstart", handlePointerDownOutside)
    }
  }, [commentPickerMode])

  const filteredFlags = useMemo(() => {
    let list = WORLD_FLAGS
    if (flagContinent !== "Todas") {
      list = list.filter((f) => f.continent === flagContinent)
    }
    if (flagSearchQuery.trim()) {
      const q = flagSearchQuery.toLowerCase().trim()
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q))
    }
    return list
  }, [flagContinent, flagSearchQuery])

  const FLAGS_PER_PAGE = 7
  const totalFlagPages = Math.max(1, Math.ceil(filteredFlags.length / FLAGS_PER_PAGE))
  const paginatedFlags = useMemo(() => {
    const start = flagCarouselPage * FLAGS_PER_PAGE
    return filteredFlags.slice(start, start + FLAGS_PER_PAGE)
  }, [filteredFlags, flagCarouselPage])

  const filteredEmojis = useMemo(() => {
    let list: string[] = []
    if (emojiCategory === "todo") {
      list = [
        ...EMOJI_CATEGORIES.emociones,
        ...EMOJI_CATEGORIES.naturaleza,
        ...EMOJI_CATEGORIES.viaje,
      ]
    } else if (emojiCategory === "emociones") {
      list = EMOJI_CATEGORIES.emociones
    } else if (emojiCategory === "naturaleza") {
      list = EMOJI_CATEGORIES.naturaleza
    } else if (emojiCategory === "viaje") {
      list = EMOJI_CATEGORIES.viaje
    }
    return list
  }, [emojiCategory])
  const [openShareId, setOpenShareId] = useState<number | null>(null)
  const shareCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [copiedServiceId, setCopiedServiceId] = useState<number | null>(null)

  // Traveler Post Composer Modal state (requires selecting a lived experience + rating)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [composerText, setComposerText] = useState("")
  const [publishSearchQuery, setPublishSearchQuery] = useState("")
  const [publishSearchResults, setPublishSearchResults] = useState<Array<{ id: number; name: string; image: string; location: string; category: string }>>([])
  const [isSearchingPublish, setIsSearchingPublish] = useState(false)
  const [selectedPublishService, setSelectedPublishService] = useState<{ id: number; name: string; image: string; location: string } | null>(null)
  const [publishRating, setPublishRating] = useState<number>(5)
  const [publishReaction, setPublishReaction] = useState<ReactionKey | null>("fascino")
  const [isPublishingExperience, setIsPublishingExperience] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [travelerPosts, setTravelerPosts] = useState<TravelerPost[]>([])
  const [openTravelerCommentsId, setOpenTravelerCommentsId] = useState<string | null>(null)
  const [travelerCommentDrafts, setTravelerCommentDrafts] = useState<Record<string, string>>({})
  const [adRotationIndex, setAdRotationIndex] = useState(0)
  const [rightCompanionIndex, setRightCompanionIndex] = useState(0)
  const [isHoveringRightSidebar, setIsHoveringRightSidebar] = useState(false)
  const lastCompanionScrollYRef = useRef(0)
  const lastCompanionSwitchAtRef = useRef(0)

  // 40-item persistent seen-tracking reload cycle (never repeats seen items, never jumps to top)
  const BATCH_SIZE = 40
  const [batchNumber, setBatchNumber] = useState(() =>
    cachedMarketplaceSession?.shouldRestoreOnMount ? cachedMarketplaceSession.batchNumber : 1,
  )
  const [currentBatchIds, setCurrentBatchIds] = useState<number[]>(() =>
    cachedMarketplaceSession?.shouldRestoreOnMount ? cachedMarketplaceSession.currentBatchIds : [],
  )
  const [isLoadingFeed, setIsLoadingFeed] = useState(false)
  const [isReloadingBatch, setIsReloadingBatch] = useState(false)
  const [allUnseenExhausted, setAllUnseenExhausted] = useState(false)
  const seenInCurrentBatchRef = useRef<Set<number>>(new Set())
  const seenIdsRef = useRef<Set<number>>(
    (() => {
      if (typeof window === "undefined") return new Set<number>()
      try {
        localStorage.removeItem("palenque_seen_experience_ids_v2")
        const raw = localStorage.getItem("palenque_seen_ids_v3")
        const parsed = raw ? JSON.parse(raw) : []
        return new Set<number>(Array.isArray(parsed) ? parsed : [])
      } catch {
        return new Set<number>()
      }
    })(),
  )
  const cardObserverRef = useRef<IntersectionObserver | null>(null)
  const lastAdvanceRef = useRef<number>(0)
  const routesTrackRef = useRef<HTMLDivElement | null>(null)
  const categoriesTrackRef = useRef<HTMLDivElement | null>(null)
  const feedTopRef = useRef<HTMLDivElement | null>(null)

  const [activePoolTooltipId, setActivePoolTooltipId] = useState<number | null>(null)
  const observerInstance = useRef<IntersectionObserver | null>(null)
  const [globalCatalogPool, setGlobalCatalogPool] = useState<Service[]>(
    () => cachedMarketplaceSession?.globalPoolSnapshot || [],
  )
  const [feedSurveyIntent, setFeedSurveyIntent] = useState<"group" | "flash" | "business" | "driver" | null>(null)
  const [canShowUpgradeReel, setCanShowUpgradeReel] = useState(false)
  const [travelerCraving, setTravelerCraving] = useState<string>("")
  const [travelerCravingCat, setTravelerCravingCat] = useState<string>("all")
  const [hasSubmittedTravelerCraving, setHasSubmittedTravelerCraving] = useState<boolean>(false)

  const {
    services,
    businesses,
    routes,
    currentUser,
    userPlan,
    userIntentions,
    setUserIntentions,
    toggleFavoritePreference,
    registerPoolInterest,
    userFavorites,
    fetchServices,
    fetchMoreServices,
    fetchRoutes,
    catalogHasMore,
    isFetchingMoreCatalog,
    fetchBusinesses,
    isLoading,
    bookings,
  } = useAppStore()

  // Load saved preferences, reactions, comments, traveler posts from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const savedPrefs = localStorage.getItem("palenque_experiencias_prefs")
      if (!savedPrefs) {
        setShowPreferencesModal(true)
      }

      const savedReacts = localStorage.getItem("palenque_service_reactions")
      if (savedReacts) setServiceReactions(JSON.parse(savedReacts))

      const savedComments = localStorage.getItem("palenque_service_comments")
      if (savedComments) setServiceComments(JSON.parse(savedComments))

      const savedPosts = localStorage.getItem("palenque_traveler_posts")
      if (savedPosts) {
        const parsed: TravelerPost[] = JSON.parse(savedPosts)
        const now = Date.now()
        const twentyFourHours = 24 * 60 * 60 * 1000
        const freshPosts = parsed.filter(
          (p) => typeof p.createdAtMs === "number" && now - p.createdAtMs < twentyFourHours,
        )
        setTravelerPosts(freshPosts)
        if (freshPosts.length !== parsed.length) {
          localStorage.setItem("palenque_traveler_posts", JSON.stringify(freshPosts))
        }
      }

      localStorage.removeItem("palenque_seen_experience_ids_v2")
      const savedSeen = localStorage.getItem("palenque_seen_ids_v3")
      if (savedSeen) {
        const parsedIds: number[] = JSON.parse(savedSeen)
        if (Array.isArray(parsedIds)) {
          seenIdsRef.current = new Set(parsedIds)
        }
      }

      const savedIntent = localStorage.getItem("palenque_feed_survey_intent_v1")
      if (savedIntent === "group" || savedIntent === "flash" || savedIntent === "business" || savedIntent === "driver") {
        setFeedSurveyIntent(savedIntent)
      }

      const savedCravingRaw = localStorage.getItem("palenque_traveler_craving_v1")
      if (savedCravingRaw) {
        const parsedCraving = JSON.parse(savedCravingRaw)
        if (parsedCraving?.text) {
          setTravelerCraving(parsedCraving.text)
          setTravelerCravingCat(parsedCraving.cat || "all")
          setHasSubmittedTravelerCraving(true)
        }
      }

      // 10-day cooldown check for Plan Bronce -> Plan Oro/Platino upgrade reel
      const lastUpgradePromoRaw = localStorage.getItem("palenque_upgrade_reel_shown_at")
      const lastUpgradePromoMs = lastUpgradePromoRaw ? Number(lastUpgradePromoRaw) : 0
      const tenDaysMs = 10 * 24 * 60 * 60 * 1000
      if (!lastUpgradePromoMs || Date.now() - lastUpgradePromoMs >= tenDaysMs) {
        setCanShowUpgradeReel(true)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  // Keep a rich cross-category pool so CategoryCarouselStrip can recommend other categories even inside a filtered category
  useEffect(() => {
    if (services.length > 0) {
      setGlobalCatalogPool((prev) => {
        const byId = new Map(prev.map((s) => [s.id, s]))
        for (const s of services) byId.set(s.id, s)
        return Array.from(byId.values()).slice(0, 160)
      })
    }
  }, [services])

  useEffect(() => {
    let active = true
    fetch("/api-proxy/catalog/?page_size=80&random=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data) return
        const rawList = Array.isArray(data) ? data : data.results || []
        const mapped: Service[] = rawList.map((s: any) => ({
          ...s,
          id: s.id,
          name: s.nombre || s.name || "Experiencia PalenqueGo",
          description: s.descripcion || s.description || "",
          location: s.ubicacion || s.location || "El Salvador",
          price: parseFloat(s.precio_base) || parseFloat(s.price) || 0,
          image: getProxyImage(s.imagen_principal || s.imagen_url || s.image || ""),
          rating: parseFloat(s.calificacion) || s.rating || 5.0,
          category: s.categoria?.nombre || s.category || "General",
          oferta_flash: s.oferta_flash || null,
        }))
        setGlobalCatalogPool((prev) => {
          const byId = new Map(prev.map((item) => [item.id, item]))
          for (const item of mapped) byId.set(item.id, item)
          return Array.from(byId.values()).slice(0, 160)
        })
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const handleSelectSurveyIntent = useCallback(
    (intent: "group" | "flash" | "business" | "driver") => {
      setFeedSurveyIntent(intent)
      if (typeof window !== "undefined") {
        localStorage.setItem("palenque_feed_survey_intent_v1", intent)
      }
      if (intent === "group") {
        setUserIntentions({ isTraveler: true, wantsToLeadPools: true })
      } else if (intent === "business") {
        setUserIntentions({ isBusinessOwner: true })
      } else if (intent === "driver") {
        setUserIntentions({ wantsToDrive: true })
      }
    },
    [setUserIntentions],
  )

  const handleRequestTravelerRecommendations = useCallback((craving: string, catHint: string) => {
    setTravelerCraving(craving)
    setTravelerCravingCat(catHint || "all")
    setHasSubmittedTravelerCraving(true)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("palenque_traveler_craving_v1", JSON.stringify({ text: craving, cat: catHint || "all" }))
      } catch {
        // ignore
      }
    }
  }, [])

  const handleSelectCategorySmooth = useCallback((catId: string) => {
    setOnlyPreferred(false)
    setSelectedCategory(catId)
    setSearchQuery("")
    setCurrentBatchIds([])
    setAllUnseenExhausted(false)
    setFeedSeed(Math.floor(Math.random() * 99999) + 1)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
      const scrollEl = document.querySelector(".overflow-y-auto") as HTMLElement | null
      if (scrollEl) {
        scrollEl.scrollTo({ top: 0, behavior: "smooth" })
      }
    }
  }, [])

  // Rotate Facebook-style Publicidad Flash Ads calmly every 18 seconds (pauses while hovering right panel)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHoveringRightSidebar) {
        setAdRotationIndex((prev) => prev + 1)
      }
    }, 18000)
    return () => clearInterval(timer)
  }, [isHoveringRightSidebar])

  // Calm, imperceptible Right-Sidebar Companion Alternation:
  // NEVER switches while the user is actively scrolling! Only switches 700ms AFTER scroll stops,
  // and only when the user has scrolled >= 2200px AND >= 30 seconds have elapsed.
  useEffect(() => {
    if (typeof window === "undefined") return
    let settleTimer: ReturnType<typeof setTimeout> | null = null

    const getScrollPosition = (target?: EventTarget | null) => {
      if (target && target instanceof HTMLElement && target.scrollTop > 0) {
        return target.scrollTop
      }
      const mainContainer = document.querySelector(".overflow-y-auto") as HTMLElement | null
      if (mainContainer && mainContainer.scrollTop > 0) {
        return mainContainer.scrollTop
      }
      return window.scrollY || document.documentElement.scrollTop || 0
    }

    const handleScrollCompanion = (e: Event) => {
      if (isHoveringRightSidebar) return
      const currentY = getScrollPosition(e.target)
      if (settleTimer) clearTimeout(settleTimer)
      settleTimer = setTimeout(() => {
        if (isHoveringRightSidebar) return
        const delta = Math.abs(currentY - lastCompanionScrollYRef.current)
        const now = Date.now()
        if (delta >= 2200 && now - lastCompanionSwitchAtRef.current >= 30000) {
          lastCompanionScrollYRef.current = currentY
          lastCompanionSwitchAtRef.current = now
          setRightCompanionIndex((prev) => prev + 1)
        }
      }, 700)
    }

    window.addEventListener("scroll", handleScrollCompanion, { capture: true, passive: true })
    return () => {
      if (settleTimer) clearTimeout(settleTimer)
      window.removeEventListener("scroll", handleScrollCompanion, { capture: true } as EventListenerOptions)
    }
  }, [isHoveringRightSidebar])

  // Track when the sticky category bar is pinned at the top edge (so mobile lupita appears only after search box scrolls off)
  useEffect(() => {
    if (typeof window === "undefined") return

    const getMainScrollContainer = () =>
      document.getElementById("main-scroll-container") as HTMLElement | null

    const getScrollY = () => {
      const mainContainer = getMainScrollContainer()
      if (mainContainer && mainContainer.scrollTop > 0) {
        return mainContainer.scrollTop
      }
      return window.scrollY || document.documentElement.scrollTop || 0
    }

    const handleScrollHeader = (e: Event) => {
      const mainContainer = getMainScrollContainer()
      // Ignore horizontal/nested scroll events (e.g. category pills track, carousels, sidebars)
      if (
        e.target instanceof HTMLElement &&
        e.target !== mainContainer &&
        e.target !== document.documentElement &&
        e.target !== document.body
      ) {
        return
      }

      const isMobileViewport = window.innerWidth < 640
      const activeEl = document.activeElement
      const currentY = getScrollY()

      const searchEl = stickySearchRowRef.current
      const containerTop = mainContainer ? mainContainer.getBoundingClientRect().top : 0
      const stuck = searchEl ? searchEl.getBoundingClientRect().bottom <= containerTop + 8 : currentY > 240

      if (stuck !== isCategoriesStuckRef.current) {
        isCategoriesStuckRef.current = stuck
        setIsCategoriesStuck(stuck)
      }

      if (!stuck && isMobileInlineSearchOpenRef.current) {
        isMobileInlineSearchOpenRef.current = false
        setIsMobileInlineSearchOpen(false)
        setIsMobileInlineInputFocused(false)
      }

      // If mobile inline search is open and user scrolls down enough (~2 swipes / > 280px), return to categories
      if (
        isMobileViewport &&
        isMobileInlineSearchOpenRef.current &&
        currentY > mobileInlineSearchScrollStartRef.current + 280
      ) {
        isMobileInlineSearchOpenRef.current = false
        setIsMobileInlineSearchOpen(false)
        setIsMobileInlineInputFocused(false)
        if (activeEl && activeEl instanceof HTMLElement && activeEl.closest(".mobile-inline-search")) {
          activeEl.blur()
        }
      }

      lastScrollYRef.current = currentY
    }

    window.addEventListener("scroll", handleScrollHeader, { capture: true, passive: true })
    return () => {
      window.removeEventListener("scroll", handleScrollHeader, { capture: true } as EventListenerOptions)
    }
  }, [])

  const buildUnseenCatalogQuery = useCallback(() => {
    const params = new URLSearchParams()
    params.set("page_size", String(BATCH_SIZE))
    params.set("random", "1")
    if (selectedCategory && selectedCategory !== "all") {
      params.set("cat", selectedCategory)
    } else if (onlyPreferred && preferredCategories.length > 0) {
      params.set("cats", preferredCategories.join(","))
    }
    if (debouncedSearchQuery.trim()) {
      params.set("search", debouncedSearchQuery.trim())
    }
    // Only send exclude_ids in the general "all" feed and ONLY when NOT searching
    if ((!selectedCategory || selectedCategory === "all") && !debouncedSearchQuery.trim()) {
      const seenArr = Array.from(seenIdsRef.current)
      if (seenArr.length > 0) {
        params.set("exclude_ids", seenArr.slice(-600).join(","))
      }
    }
    return `?${params.toString()}`
  }, [selectedCategory, onlyPreferred, preferredCategories, debouncedSearchQuery])

  // Single-request 40-item random unseen catalog fetch (or instant 0ms restore when returning from a service detail!)
  useEffect(() => {
    if (cachedMarketplaceSession?.shouldRestoreOnMount) {
      const snap = cachedMarketplaceSession
      snap.shouldRestoreOnMount = false
      if (snap.servicesSnapshot.length > 0) {
        useAppStore.setState({ services: snap.servicesSnapshot, isLoading: false })
      }
      setCurrentBatchIds(snap.currentBatchIds)
      setBatchNumber(snap.batchNumber)
      setAllUnseenExhausted(false)
      setIsLoadingFeed(false)
      if (typeof window !== "undefined" && snap.scrollY > 0) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: snap.scrollY, behavior: "instant" as ScrollBehavior })
        })
      }
      return
    }

    let cancelled = false
    const previousServices = useAppStore.getState().services
    const hasCachedServices = previousServices.length > 0

    // Pin initial visible cards immediately so nothing swaps underneath the user while fetching
    if (hasCachedServices && orderedServicesRef.current.length > 0) {
      setCurrentBatchIds((prev) =>
        prev.length > 0 ? prev : orderedServicesRef.current.slice(0, BATCH_SIZE).map((s) => s.id),
      )
    }

    if (!hasCachedServices) {
      setIsLoadingFeed(true)
    }
    const safetyTimer = setTimeout(() => {
      if (!cancelled) setIsLoadingFeed(false)
    }, 6000)

    fetchServices(buildUnseenCatalogQuery(), hasCachedServices).finally(() => {
      clearTimeout(safetyTimer)
      if (cancelled) return
      seenInCurrentBatchRef.current.clear()
      lastAdvanceRef.current = Date.now()

      const activeStoreServices = useAppStore.getState().services
      if (activeStoreServices.length > 0) {
        let clearedAny = false
        for (const item of activeStoreServices) {
          if (seenIdsRef.current.has(item.id)) {
            seenIdsRef.current.delete(item.id)
            clearedAny = true
          }
        }
        if (clearedAny && typeof window !== "undefined") {
          try {
            localStorage.setItem("palenque_seen_ids_v3", JSON.stringify(Array.from(seenIdsRef.current)))
          } catch {
            // ignore
          }
        }
        // ONLY initialize currentBatchIds if it's currently empty!
        // If the user already has cards on screen, keep them 100% locked!
        setCurrentBatchIds((prev) => {
          if (prev.length > 0) return prev
          const source = orderedServicesRef.current.length > 0 ? orderedServicesRef.current : activeStoreServices
          return source.slice(0, BATCH_SIZE).map((s) => s.id)
        })
        setAllUnseenExhausted(false)
      } else {
        setCurrentBatchIds((prev) => (prev.length > 0 ? prev : []))
        setAllUnseenExhausted(true)
      }
      setBatchNumber(1)
      setIsLoadingFeed(false)
    })

    return () => {
      cancelled = true
      clearTimeout(safetyTimer)
    }
  }, [buildUnseenCatalogQuery, feedSeed, fetchServices])

  const openServiceDetailInstant = useCallback(
    (serviceOrId: Service | number, hash = "") => {
      const targetId = typeof serviceOrId === "number" ? serviceOrId : serviceOrId.id
      const currentStoreServices = useAppStore.getState().services
      const svcObj =
        typeof serviceOrId === "object"
          ? serviceOrId
          : currentStoreServices.find((s) => s.id === targetId) ||
            globalCatalogPool.find((s) => s.id === targetId) ||
            null

      if (svcObj && !currentStoreServices.some((s) => s.id === svcObj.id)) {
        useAppStore.setState({ services: [...currentStoreServices, svcObj] })
      }

      cachedMarketplaceSession = {
        selectedCategory,
        searchQuery,
        onlyPreferred,
        feedSeed,
        batchNumber,
        currentBatchIds,
        servicesSnapshot: useAppStore.getState().services,
        globalPoolSnapshot: globalCatalogPool,
        scrollY: typeof window !== "undefined" ? window.scrollY : 0,
        shouldRestoreOnMount: true,
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("palenque_return_tab", "marketplace")
        sessionStorage.setItem("palenque_last_viewed_service_id", String(targetId))
        if (svcObj) {
          try {
            sessionStorage.setItem("palenque_instant_service", JSON.stringify(svcObj))
          } catch {
            // ignore storage errors
          }
        }
      }

      router.push(`/s/${targetId}?from=marketplace${hash}`)
    },
    [
      selectedCategory,
      searchQuery,
      onlyPreferred,
      feedSeed,
      batchNumber,
      currentBatchIds,
      globalCatalogPool,
      router,
    ],
  )

  useEffect(() => {
    fetchBusinesses()
    fetchRoutes()
    useAppStore.getState().fetchUserLikes()
    useAppStore.getState().fetchMyBookings?.()

    const refreshBookings = () => {
      if (document.visibilityState === "visible") {
        useAppStore.getState().fetchMyBookings?.()
      }
    }
    window.addEventListener("focus", refreshBookings)
    document.addEventListener("visibilitychange", refreshBookings)
    return () => {
      window.removeEventListener("focus", refreshBookings)
      document.removeEventListener("visibilitychange", refreshBookings)
    }
  }, [])

  // Restore last viewed card position
  useEffect(() => {
    if (typeof window === "undefined") return
    const lastId = sessionStorage.getItem("palenque_last_viewed_service_id")
    if (lastId && services.length > 0) {
      sessionStorage.removeItem("palenque_last_viewed_service_id")
      setTimeout(() => {
        const el = document.getElementById(`service-card-${lastId}`)
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 200)
    }
  }, [services.length])

  const persistSeenIds = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem("palenque_seen_ids_v3", JSON.stringify(Array.from(seenIdsRef.current)))
    } catch {
      // ignore quota errors
    }
  }, [])

  const markServiceSeen = useCallback(
    (id: number) => {
      seenInCurrentBatchRef.current.add(id)
      if (!seenIdsRef.current.has(id)) {
        seenIdsRef.current.add(id)
        persistSeenIds()
      }
    },
    [persistSeenIds],
  )

  // Track individual cards as seen as soon as they enter viewport (persists across reloads & route changes)
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      (entries) => {
        let added = false
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const rawId = (entry.target as HTMLElement).dataset.serviceId
            const id = rawId ? Number(rawId) : NaN
            if (!Number.isNaN(id)) {
              seenInCurrentBatchRef.current.add(id)
              if (!seenIdsRef.current.has(id)) {
                seenIdsRef.current.add(id)
                added = true
              }
            }
            observer.unobserve(entry.target)
          }
        }
        if (added) persistSeenIds()
      },
      { threshold: 0.25 },
    )
    cardObserverRef.current = observer
    document.querySelectorAll<HTMLElement>("[data-service-id]").forEach((el) => {
      observer.observe(el)
    })
    return () => {
      observer.disconnect()
      cardObserverRef.current = null
    }
  }, [persistSeenIds, currentBatchIds])

  const observeCardRef = useCallback((el: HTMLElement | null) => {
    if (el && cardObserverRef.current) {
      cardObserverRef.current.observe(el)
    }
  }, [])

  const advanceBatchAutomatically = useCallback(async () => {
    const now = Date.now()
    if (now - lastAdvanceRef.current < 1800 || isReloadingBatch || isLoadingFeed) return
    lastAdvanceRef.current = now

    for (const id of currentBatchIds) {
      seenIdsRef.current.add(id)
    }
    persistSeenIds()
    seenInCurrentBatchRef.current.clear()

    const previousServices = useAppStore.getState().services
    setIsReloadingBatch(true)
    const safetyTimer = setTimeout(() => setIsReloadingBatch(false), 6000)
    try {
      await fetchServices(buildUnseenCatalogQuery(), true)
      const newlyFetched = useAppStore.getState().services

      // Merge previous + newlyFetched so the feed grows downward like Facebook and NEVER shrinks above the user's scroll position
      const mergedMap = new Map<number, Service>()
      for (const s of previousServices) mergedMap.set(s.id, s)
      for (const s of newlyFetched) mergedMap.set(s.id, s)
      const mergedServices = Array.from(mergedMap.values())
      useAppStore.setState({ services: mergedServices })

      const strictlyUnseen = newlyFetched.filter((s) => !seenIdsRef.current.has(s.id) && !currentBatchIds.includes(s.id))
      if (strictlyUnseen.length > 0) {
        const nextIds = strictlyUnseen.slice(0, BATCH_SIZE).map((s) => s.id)
        setCurrentBatchIds((prev) => Array.from(new Set([...prev, ...nextIds])))
        setBatchNumber((prev) => prev + 1)
        setAllUnseenExhausted(false)
      } else if (newlyFetched.length > 0) {
        const freshCycleIds = newlyFetched
          .map((s) => s.id)
          .filter((id) => !currentBatchIds.includes(id))
        if (freshCycleIds.length > 0) {
          setCurrentBatchIds((prev) => Array.from(new Set([...prev, ...freshCycleIds.slice(0, BATCH_SIZE)])))
          setBatchNumber((prev) => prev + 1)
          setAllUnseenExhausted(false)
        } else {
          setAllUnseenExhausted(true)
        }
      } else {
        setAllUnseenExhausted(true)
      }
    } finally {
      clearTimeout(safetyTimer)
      setTimeout(() => setIsReloadingBatch(false), 260)
    }
  }, [
    buildUnseenCatalogQuery,
    currentBatchIds,
    fetchServices,
    isLoadingFeed,
    isReloadingBatch,
    persistSeenIds,
  ])

  // Infinite batch-reload sentinel (triggers right at the end of the 40 cards, NO jump to top)
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerInstance.current) {
        observerInstance.current.disconnect()
        observerInstance.current = null
      }
      if (!node) return
      observerInstance.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            advanceBatchAutomatically()
          }
        },
        { root: null, rootMargin: "20px", threshold: 0.1 },
      )
      observerInstance.current.observe(node)
    },
    [advanceBatchAutomatically],
  )

  useEffect(() => {
    return () => {
      if (observerInstance.current) observerInstance.current.disconnect()
    }
  }, [])

  const savePreferences = (prefs: string[]) => {
    setPreferredCategories(prefs)
    if (typeof window !== "undefined") {
      localStorage.setItem("palenque_experiencias_prefs", JSON.stringify(prefs))
    }
    setShowPreferencesModal(false)
    if (prefs.length > 0) setOnlyPreferred(true)
  }

  const handleReactionMouseEnter = (serviceId: number) => {
    if (reactionCloseTimerRef.current) {
      clearTimeout(reactionCloseTimerRef.current)
      reactionCloseTimerRef.current = null
    }
    setOpenReactionPickerId(serviceId)
  }

  const handleReactionMouseLeave = () => {
    if (reactionCloseTimerRef.current) {
      clearTimeout(reactionCloseTimerRef.current)
    }
    reactionCloseTimerRef.current = setTimeout(() => {
      setOpenReactionPickerId(null)
    }, 220)
  }

  const handleShareMouseEnter = (serviceId: number) => {
    if (shareCloseTimerRef.current) {
      clearTimeout(shareCloseTimerRef.current)
      shareCloseTimerRef.current = null
    }
    setOpenShareId(serviceId)
  }

  const handleShareMouseLeave = () => {
    if (shareCloseTimerRef.current) {
      clearTimeout(shareCloseTimerRef.current)
    }
    shareCloseTimerRef.current = setTimeout(() => {
      setOpenShareId(null)
    }, 220)
  }

  // Hydrate real backend reactions & reviews from catalog payload
  useEffect(() => {
    if (!services || services.length === 0) return
    setServiceReactions((prev) => {
      const next = { ...prev }
      for (const s of services) {
        if (s.reactions_summary) {
          const totalSrv = Object.values(s.reactions_summary.counts || {}).reduce((a, b) => a + b, 0)
          if (totalSrv > 0 || s.reactions_summary.user_reaction) {
            next[s.id] = {
              counts: {
                trato: s.reactions_summary.counts?.trato || 0,
                divertido: s.reactions_summary.counts?.divertido || 0,
                fascino: s.reactions_summary.counts?.fascino || 0,
                quiero_ir: s.reactions_summary.counts?.quiero_ir || 0,
                recomiendo: s.reactions_summary.counts?.recomiendo || 0,
              },
              userReaction: (s.reactions_summary.user_reaction as ReactionKey) || null,
            }
          }
        }
      }
      return next
    })
    setServiceComments((prev) => {
      const next = { ...prev }
      for (const s of services) {
        if (s.recent_reviews && s.recent_reviews.length > 0) {
          next[s.id] = s.recent_reviews.map((r) => ({
            id: String(r.id),
            author: r.autor_nombre || "Viajero PalenqueGo",
            text: r.comentario,
            rating: r.calificacion,
            createdAt: new Date(r.creado_el).toLocaleDateString("es-SV", {
              day: "2-digit",
              month: "short",
            }),
          }))
        }
      }
      return next
    })
  }, [services])

  const toggleServiceReaction = async (serviceId: number, reaction: ReactionKey) => {
    if (reactionCloseTimerRef.current) {
      clearTimeout(reactionCloseTimerRef.current)
      reactionCloseTimerRef.current = null
    }
    setServiceReactions((prev) => {
      const current = prev[serviceId] || {
        counts: { trato: 0, divertido: 0, fascino: 0, quiero_ir: 0, recomiendo: 0 },
        userReaction: null,
      }
      const nextCounts = { ...current.counts }
      let nextUserReaction: ReactionKey | null = reaction
      if (current.userReaction === reaction) {
        nextCounts[reaction] = Math.max(0, (nextCounts[reaction] || 0) - 1)
        nextUserReaction = null
      } else {
        if (current.userReaction) {
          nextCounts[current.userReaction] = Math.max(0, (nextCounts[current.userReaction] || 0) - 1)
        }
        nextCounts[reaction] = (nextCounts[reaction] || 0) + 1
      }
      const updated = { ...prev, [serviceId]: { counts: nextCounts, userReaction: nextUserReaction } }
      if (typeof window !== "undefined") {
        localStorage.setItem("palenque_service_reactions", JSON.stringify(updated))
      }
      return updated
    })
    setJustReactedServiceId(serviceId)
    setTimeout(() => {
      setJustReactedServiceId((curr) => (curr === serviceId ? null : curr))
    }, 450)
    setOpenReactionPickerId(null)

    try {
      const res = await fetchWithAuth(`${API_BASE}/catalog/${serviceId}/react/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: reaction }),
      })
      if (res.ok) {
        const data = await res.json()
        setServiceReactions((prev) => ({
          ...prev,
          [serviceId]: {
            counts: {
              trato: data.counts?.trato || 0,
              divertido: data.counts?.divertido || 0,
              fascino: data.counts?.fascino || 0,
              quiero_ir: data.counts?.quiero_ir || 0,
              recomiendo: data.counts?.recomiendo || 0,
            },
            userReaction: (data.user_reaction as ReactionKey) || null,
          },
        }))
      }
    } catch {
      // Optimistic local state already applied
    }
  }

  const handleAddServiceComment = async (serviceId: number) => {
    const text = (commentDrafts[serviceId] || "").trim()
    const loc = commentLocations[serviceId] || undefined
    const country = commentCountries[serviceId]
    const flagStr = country ? `${country.flag} ${country.name}` : undefined

    if (!text && !loc) return
    const rating = commentRatings[serviceId] || 5

    try {
      const res = await fetchWithAuth(`${API_BASE}/catalog/${serviceId}/reviews/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calificacion: rating,
          comentario: text,
          ubicacion: loc,
          pais: country?.name,
        }),
      })
      if (res.status === 401) {
        alert("Inicia sesión para publicar tu reseña y comentario.")
        return
      }
      if (res.ok) {
        const data = await res.json()
        const r = data.review
        const savedComment: ServiceComment = {
          id: String(r?.id || Date.now()),
          author: r?.autor_nombre || currentUser?.name || "Viajero PalenqueGo",
          authorAvatar: currentUser?.avatar || undefined,
          text: r?.comentario || text,
          rating: r?.calificacion || rating,
          location: loc,
          flag: flagStr,
          countryCode: country?.code,
          createdAt: "Ahora",
        }
        setServiceComments((prev) => {
          const updated = {
            ...prev,
            [serviceId]: [savedComment, ...(prev[serviceId] || [])],
          }
          if (typeof window !== "undefined") {
            localStorage.setItem("palenque_service_comments", JSON.stringify(updated))
          }
          return updated
        })
        setCommentDrafts((prev) => ({ ...prev, [serviceId]: "" }))
        setCommentLocations((prev) => {
          const next = { ...prev }
          delete next[serviceId]
          return next
        })
        setCommentCountries((prev) => {
          const next = { ...prev }
          delete next[serviceId]
          return next
        })
        setCommentPickerMode(null)
        return
      }
    } catch {
      // Fallback local
    }

    const newComment: ServiceComment = {
      id: `${Date.now()}`,
      author: currentUser?.name || "Viajero PalenqueGo",
      authorAvatar: currentUser?.avatar || undefined,
      text,
      rating,
      location: loc,
      flag: flagStr,
      countryCode: country?.code,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setServiceComments((prev) => {
      const updated = { ...prev, [serviceId]: [newComment, ...(prev[serviceId] || [])] }
      if (typeof window !== "undefined") {
        localStorage.setItem("palenque_service_comments", JSON.stringify(updated))
      }
      return updated
    })
    setCommentDrafts((prev) => ({ ...prev, [serviceId]: "" }))
    setCommentLocations((prev) => {
      const next = { ...prev }
      delete next[serviceId]
      return next
    })
    setCommentCountries((prev) => {
      const next = { ...prev }
      delete next[serviceId]
      return next
    })
    setCommentPickerMode(null)
  }

  // Live search for lived experiences inside the Publish Modal
  useEffect(() => {
    if (!showPublishModal) return
    const q = publishSearchQuery.trim()
    const localMatches = (q
      ? services.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
      : services
    )
      .slice(0, 8)
      .map((s) => ({
        id: s.id,
        name: s.name,
        image: getProxyImage(s.image || "") || DEFAULT_STORE_COVER,
        location: s.location || "El Salvador",
        category: s.category || "Experiencia",
      }))
    setPublishSearchResults(localMatches)

    if (q.length < 2) return
    let active = true
    const timer = setTimeout(async () => {
      setIsSearchingPublish(true)
      try {
        const res = await fetch(`${API_BASE}/catalog/?search=${encodeURIComponent(q)}&page_size=8`)
        if (!res.ok || !active) return
        const data = await res.json()
        const rows = Array.isArray(data) ? data : data.results || []
        if (active && rows.length > 0) {
          setPublishSearchResults(
            rows.slice(0, 8).map((r: any) => ({
              id: r.id,
              name: r.nombre || r.name,
              image:
                getProxyImage(
                  r.imagen_principal || r.imagen_url || r.image || r.images?.[0]?.imagen || "",
                ) || DEFAULT_STORE_COVER,
              location: r.tienda?.nombre_comercial || "El Salvador",
              category: r.categoria?.nombre || "Experiencia",
            })),
          )
        }
      } catch {
        // Keep local matches
      } finally {
        if (active) setIsSearchingPublish(false)
      }
    }, 260)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [publishSearchQuery, showPublishModal, services])

  const handlePublishTravelerPost = async (e: React.FormEvent) => {
    e.preventDefault()
    setPublishError(null)
    if (!selectedPublishService) {
      setPublishError("Debes buscar y seleccionar una experiencia que hayas vivido para publicar.")
      return
    }
    if (!composerText.trim()) {
      setPublishError("Cuéntanos cómo te fue en esa experiencia.")
      return
    }

    setIsPublishingExperience(true)
    const cleanText = composerText.trim()
    let savedToServer = false

    try {
      const res = await fetchWithAuth(`${API_BASE}/catalog/${selectedPublishService.id}/reviews/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calificacion: publishRating,
          comentario: cleanText,
        }),
      })
      if (res.status === 401) {
        setPublishError("Inicia sesión en PalenqueGo para publicar tu calificación y comentario real.")
        setIsPublishingExperience(false)
        return
      }
      if (res.ok) {
        const data = await res.json()
        savedToServer = true
        const r = data.review
        const savedComment: ServiceComment = {
          id: String(r?.id || Date.now()),
          author: r?.autor_nombre || currentUser?.name || "Viajero PalenqueGo",
          text: r?.comentario || cleanText,
          rating: r?.calificacion || publishRating,
          createdAt: "Ahora",
        }
        setServiceComments((prev) => ({
          ...prev,
          [selectedPublishService.id]: [savedComment, ...(prev[selectedPublishService.id] || [])],
        }))
      }
    } catch {
      // Fallback handled below
    }

    if (publishReaction) {
      await toggleServiceReaction(selectedPublishService.id, publishReaction)
    }

    const newPost: TravelerPost = {
      id: `post-${Date.now()}`,
      author: currentUser?.name || "Viajero PalenqueGo",
      avatar: currentUser?.avatar,
      text: cleanText,
      rating: publishRating,
      taggedServiceId: selectedPublishService.id,
      taggedServiceName: selectedPublishService.name,
      taggedServiceImage: selectedPublishService.image || DEFAULT_STORE_COVER,
      createdAt: savedToServer ? "Publicado ahora" : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAtMs: Date.now(),
      reactions: {
        trato: publishReaction === "trato" ? 1 : 0,
        divertido: publishReaction === "divertido" ? 1 : 0,
        fascino: publishReaction === "fascino" ? 1 : 0,
        quiero_ir: publishReaction === "quiero_ir" ? 1 : 0,
        recomiendo: publishReaction === "recomiendo" ? 1 : 0,
      },
      userReaction: publishReaction,
      comments: [],
    }
    setTravelerPosts((prev) => {
      const updated = [newPost, ...prev]
      if (typeof window !== "undefined") {
        localStorage.setItem("palenque_traveler_posts", JSON.stringify(updated))
      }
      return updated
    })

    setComposerText("")
    setPublishSearchQuery("")
    setSelectedPublishService(null)
    setPublishRating(5)
    setIsPublishingExperience(false)
    setShowPublishModal(false)
  }

  const handleReactTravelerPost = (postId: string, reaction: ReactionKey) => {
    setTravelerPosts((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== postId) return p
        const counts = { ...p.reactions }
        let nextUserReaction: ReactionKey | null = reaction
        if (p.userReaction === reaction) {
          counts[reaction] = Math.max(0, (counts[reaction] || 0) - 1)
          nextUserReaction = null
        } else {
          if (p.userReaction) counts[p.userReaction] = Math.max(0, (counts[p.userReaction] || 0) - 1)
          counts[reaction] = (counts[reaction] || 0) + 1
        }
        return { ...p, reactions: counts, userReaction: nextUserReaction }
      })
      if (typeof window !== "undefined") {
        localStorage.setItem("palenque_traveler_posts", JSON.stringify(updated))
      }
      return updated
    })
  }

  const handleAddTravelerComment = (postId: string) => {
    const text = (travelerCommentDrafts[postId] || "").trim()
    if (!text) return
    const newComment: ServiceComment = {
      id: `${Date.now()}`,
      author: currentUser?.name || "Viajero PalenqueGo",
      text,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setTravelerPosts((prev) => {
      const updated = prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p))
      if (typeof window !== "undefined") {
        localStorage.setItem("palenque_traveler_posts", JSON.stringify(updated))
      }
      return updated
    })
    setTravelerCommentDrafts((prev) => ({ ...prev, [postId]: "" }))
  }

  const handleShareService = (service: Service) => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/s/${service.id}` : ""
    if (typeof window !== "undefined" && window.innerWidth < 1024 && navigator.share) {
      navigator.share({ title: service.name, text: service.description, url })
      return
    }
    setOpenShareId((prev) => (prev === service.id ? null : service.id))
  }

  const userBookings = useMemo(() => {
    if (!currentUser) return bookings
    return bookings.filter((b) => b.userId === currentUser.id || (!b.userId && b.userEmail === currentUser.email))
  }, [bookings, currentUser])
  const pendingBookings = userBookings.filter((b) => b.status === "PENDIENTE")
  const primaryBooking = pendingBookings[0] || userBookings[0] || null

  const flashServices = useMemo(() => {
    const byId = new Map<number, Service>()
    for (const s of globalCatalogPool) byId.set(s.id, s)
    for (const s of services) byId.set(s.id, s)
    const now = Date.now()
    return Array.from(byId.values()).filter((s) => {
      if (!s.oferta_flash || (s.oferta_flash.cupos_disponibles ?? 0) <= 0) return false
      const expStr = (s.oferta_flash as any).fecha_expiracion || s.oferta_flash.fecha_fin
      if (expStr) {
        const exp = new Date(expStr).getTime()
        if (!Number.isNaN(exp) && exp <= now) return false
      }
      return true
    })
  }, [services, globalCatalogPool])
  const topRatedServices = [...services]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5)

  const effectiveSearchQuery = (searchQuery || filters.searchQuery || "").trim().toLowerCase()

  const filteredServices = useMemo(() => {
    // When searching, use all available loaded services across current feed and global pool
    const source = effectiveSearchQuery && globalCatalogPool.length > 0
      ? Array.from(new Map([...services, ...globalCatalogPool].map((s) => [s.id, s])).values())
      : services

    return source.filter((service) => {
      if (effectiveSearchQuery) {
        const name = (service.name || "").toLowerCase()
        const cat = (service.category || service.categoria?.nombre || "").toLowerCase()
        const loc = (service.location || "").toLowerCase()
        const desc = (service.description || "").toLowerCase()
        const storeName = ((service as any).store?.name || (service as any).tienda?.nombre_comercial || "").toLowerCase()

        const matches =
          name.includes(effectiveSearchQuery) ||
          cat.includes(effectiveSearchQuery) ||
          loc.includes(effectiveSearchQuery) ||
          desc.includes(effectiveSearchQuery) ||
          storeName.includes(effectiveSearchQuery)

        if (!matches) return false
      }
      if (filters.ratingMin > 0 && service.rating < filters.ratingMin) return false
      if (filters.priceMin > 0 && service.price < filters.priceMin) return false
      if (filters.priceMax < 500 && service.price > filters.priceMax) return false
      return true
    })
  }, [services, globalCatalogPool, effectiveSearchQuery, filters])

  // Dynamic, category-interleaved ordering so the feed never feels repetitive
  const orderedServices = useMemo(() => {
    if (filteredServices.length <= 1) return filteredServices

    // When actively searching, sort by relevance (name starting with search first)
    if (effectiveSearchQuery) {
      return [...filteredServices].sort((a, b) => {
        const aName = (a.name || "").toLowerCase()
        const bName = (b.name || "").toLowerCase()
        const aStarts = aName.startsWith(effectiveSearchQuery) ? 2 : aName.includes(effectiveSearchQuery) ? 1 : 0
        const bStarts = bName.startsWith(effectiveSearchQuery) ? 2 : bName.includes(effectiveSearchQuery) ? 1 : 0
        if (aStarts !== bStarts) return bStarts - aStarts
        return (b.rating || 0) - (a.rating || 0)
      })
    }

    const pseudoScore = (id: number) => {
      const x = Math.sin(id * 9301 + feedSeed * 49297) * 233280
      return x - Math.floor(x)
    }

    const buckets = new Map<string, Service[]>()
    for (const s of filteredServices) {
      const catKey = (s.category || s.categoria?.nombre || "general").toLowerCase().trim()
      if (!buckets.has(catKey)) buckets.set(catKey, [])
      buckets.get(catKey)!.push(s)
    }

    // Shuffle inside each category bucket with feedSeed, keeping flash offers near top
    const bucketKeys = Array.from(buckets.keys()).sort((a, b) => {
      const aPref = preferredCategories.some((p) => a.includes(p)) ? 1 : 0
      const bPref = preferredCategories.some((p) => b.includes(p)) ? 1 : 0
      if (aPref !== bPref) return bPref - aPref
      return pseudoScore(a.charCodeAt(0) + a.length) - pseudoScore(b.charCodeAt(0) + b.length)
    })

    for (const key of bucketKeys) {
      buckets.get(key)!.sort((a, b) => pseudoScore(a.id) - pseudoScore(b.id))
    }

    // Interleave round-robin across categories
    const result: Service[] = []
    let remaining = true
    let round = 0
    while (remaining) {
      remaining = false
      for (const key of bucketKeys) {
        const arr = buckets.get(key)!
        if (round < arr.length) {
          result.push(arr[round])
          remaining = true
        }
      }
      round++
    }
    return result
  }, [filteredServices, feedSeed, preferredCategories, effectiveSearchQuery])

  const discoveryCategories = useMemo(
    () => categories.filter((c) => c.id !== "all" && c.id !== "flash"),
    [],
  )

  // Intelligent contextual prioritization of the 8 App Reels (Traveler + Business + Driver)
  const prioritizedSmartReels = useMemo<SmartReelDefinition[]>(() => {
    const sampleSource = globalCatalogPool.length > 0 ? globalCatalogPool : services
    const pickImage = (index: number, fallback: string) => {
      if (sampleSource.length > 0) {
        const candidate = sampleSource[(index * 7 + feedSeed) % sampleSource.length]
        if (candidate?.image) return getProxyImage(candidate.image)
      }
      return fallback
    }

    const hasLikedOrReacted =
      userFavorites.length > 0 ||
      Object.values(serviceReactions).some((r) => Boolean(r?.userReaction))
    const isBusinessUser =
      Boolean(currentUser?.es_aliado) ||
      currentUser?.tipo === "ALIADO" ||
      Boolean(userIntentions?.isBusinessOwner) ||
      feedSurveyIntent === "business"
    const isDriverUser =
      Boolean(currentUser?.es_chofer) ||
      currentUser?.tipo === "CHOFER" ||
      Boolean(userIntentions?.wantsToDrive) ||
      feedSurveyIntent === "driver"
    const hasTeamConfigured = (currentUser?.reception_stores?.length ?? 0) > 1
    const isOnBronzeFreePlan = !userPlan || userPlan === "FREE"

    const openBusinessPanelOrPlans = () => {
      const token = useAppStore.getState().accessToken
      if (currentUser?.tipo === "ALIADO" || currentUser?.es_aliado) {
        const url = token
          ? `https://palenquego.com/admin/sso/?token=${token}`
          : "https://palenquego.com/admin/"
        if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer")
      } else {
        onNavigate?.("planes")
      }
    }

    const reelPools: SmartReelDefinition = {
      id: "pools-ahorro",
      badge: "REEL VIAJEROS · LÍDER DE POOL",
      heading: "Viaja en grupo con Pools y paga menos",
      subtitle: "Organiza grupos para tours, traslados o estancias con tarifas de descuento",
      ctaLabel: "Ver / Crear Pool",
      icon: Users,
      onAction: () => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("palenque_pool_subtab", "POOLS")
        }
        onNavigate?.("pool")
      },
      steps: [
        {
          stepBadge: "Paso 1 · Elige tu destino",
          title: "¿Te gustó una experiencia? No pagues tarifa completa solo",
          description:
            "Cuando viajas en grupo o te sumas a otros viajeros, el costo por persona baja automáticamente.",
          image: pickImage(1, "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=600&q=80"),
        },
        {
          stepBadge: "Paso 2 · Únete o crea",
          title: "Participa en Pools abiertos o arma el tuyo sin plan de pago",
          description:
            "Revisa qué Pools tienen cupos disponibles para este fin de semana o inicia uno nuevo con tu fecha ideal.",
          image: pickImage(2, "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=600&q=80"),
        },
        {
          stepBadge: "Paso 3 · Ver / Crear Pool",
          title: "Entra directo a la pestaña de Pools y gana hasta 7% como líder",
          description:
            "Toca aquí para ir directo a Pools en Mis Viajes, unirte a un grupo o crear el tuyo.",
          image: pickImage(3, "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80"),
          isActionCard: true,
        },
      ],
    }

    const reelEmbajador: SmartReelDefinition = {
      id: "embajador-comisiones",
      badge: "REEL INGRESOS · EMBAJADOR PALENQUEGO",
      heading: "Gana comisiones promocionando servicios y negocios",
      subtitle: "Recibe dinero en efectivo por cada viajero que reserve con tus enlaces",
      ctaLabel: (currentUser as any)?.is_ambassador ? "Mis Enlaces y Comisiones" : "Elegir Comercio",
      icon: Sparkles,
      onAction: () => {
        if ((currentUser as any)?.is_ambassador) {
          onNavigate?.("recomendaciones")
          return
        }
        if (typeof window !== "undefined") {
          sessionStorage.setItem("palenque_promoter_mode", "true")
          sessionStorage.removeItem("palenque_b2b_mode")
        }
        onNavigate?.("businesses")
      },
      steps: [
        {
          stepBadge: "Paso 1 · Sé Embajador",
          title: "¿Te gustaría ganar dinero promocionando otros negocios?",
          description:
            "Selecciona los hoteles, tours o restaurantes aliados que más te gusten dentro de la red.",
          image: pickImage(25, "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80"),
        },
        {
          stepBadge: "Paso 2 · Tu Enlace Único",
          title: "Comparte tu enlace exclusivo en redes, WhatsApp o con tus amigos",
          description:
            "Cada vez que un viajero reserva usando tu recomendación, el sistema registra tu comisión.",
          image: pickImage(26, "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"),
        },
        {
          stepBadge: "Paso 3 · Cobra Comisiones",
          title: "Elige un comercio para promocionar o revisa tus enlaces activos",
          description:
            "Haz clic para ir al directorio de comercios y activar tus enlaces de embajador.",
          image: pickImage(27, "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=80"),
          isActionCard: true,
        },
      ],
    }

    const reelGoSwiper: SmartReelDefinition = {
      id: "palenque-go-swiper",
      badge: "REEL INTERACTIVO · PALENQUE GO",
      heading: "Descubre en segundos con Palenque Go",
      subtitle: "Desliza, guarda tus favoritos y recibe alertas de Pools",
      ctaLabel: "Visitar Go",
      icon: Sparkles,
      onAction: () => onNavigate?.("rutas"),
      steps: [
        {
          stepBadge: "Paso 1 · Explora rápido",
          title: "¿No sabes a dónde ir? Juega con el descubridor visual",
          description:
            "En Palenque Go ves tarjetas ágiles de hoteles, tours, playas y gastronomía para decidir sin esfuerzo.",
          image: pickImage(4, "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80"),
        },
        {
          stepBadge: "Paso 2 · Dale Like",
          title: "Marca lo que te encanta y entrena tus recomendaciones",
          description:
            "Cada Like guarda la experiencia en tu radar personal para que nunca pierdas de vista ese lugar.",
          image: pickImage(5, "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80"),
        },
        {
          stepBadge: "Paso 3 · Alerta automática",
          title: "Si se crea un Pool de tus Likes, te avisamos al instante",
          description:
            "Así aprovechas el descuento grupal apenas se abre un grupo hacia el destino que te gustó.",
          image: pickImage(6, "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80"),
          isActionCard: true,
        },
      ],
    }

    const reelAlianzas: SmartReelDefinition = {
      id: "alianzas-comisiones",
      badge: "REEL ALIANZAS B2B · SOCIO COMERCIAL",
      heading: "¿Te gustaría colaborar con otros negocios como Aliado Comercial?",
      subtitle: "Forma alianzas B2B con hoteles, tours y transporte para compartir ganancias",
      ctaLabel: "Elegir Socio en Comercios",
      icon: StoreIcon,
      onAction: () => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("palenque_b2b_mode", "true")
          sessionStorage.removeItem("palenque_promoter_mode")
        }
        onNavigate?.("businesses")
      },
      steps: [
        {
          stepBadge: "Paso 1 · Alianza B2B",
          title: "¿Aún no eres socio comercial de otros negocios en PalenqueGo?",
          description:
            "Un hotel puede aliarse con una agencia de tours, restaurante o transporte para ofrecer servicios combinados.",
          image: pickImage(7, "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80"),
        },
        {
          stepBadge: "Paso 2 · Ganancia Mutua",
          title: "Compartan porcentajes de ganancia llevando clientes el uno al otro",
          description:
            "Acuerden comisiones por referido entre negocios aliados y crezcan juntos en toda la red.",
          image: pickImage(8, "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80"),
        },
        {
          stepBadge: "Paso 3 · Elegir Socio",
          title: "Haz clic en 'Elegir como socio comercial' en el directorio",
          description:
            "Te llevamos directo a Comercios con el selector de Socio Comercial activo para enviar tu propuesta.",
          image: pickImage(9, "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80"),
          isActionCard: true,
        },
      ],
    }

    const reelEquipo: SmartReelDefinition = {
      id: "equipo-negocio",
      badge: "REEL GESTIÓN · EQUIPO DE RECEPCIÓN",
      heading: "¿Aún no tienes un equipo en tu negocio?",
      subtitle: "Agrega personal en Validar QR / Recepción -> Equipo sin compartir tu clave",
      ctaLabel: "Ir a Equipo",
      icon: Users,
      onAction: () => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("palenque_reception_subtab", "TEAM")
        }
        onNavigate?.("reception")
      },
      steps: [
        {
          stepBadge: "Paso 1 · Delega seguro",
          title: "No atiendas todas las reservas y validaciones QR tú solo",
          description:
            "Habilita a un empleado registrado en PalenqueGo para escanear Voucher QR y confirmar pagos en puerta.",
          image: pickImage(10, "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80"),
        },
        {
          stepBadge: "Paso 2 · Control Total",
          title: "Tu personal valida llegadas sin acceso a tus finanzas ni configuración",
          description:
            "Cada miembro opera desde la sección Validar QR / Recepción con los permisos que tú decidas.",
          image: pickImage(11, "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=600&q=80"),
        },
        {
          stepBadge: "Paso 3 · Agregar Personal",
          title: "Abre la pestaña Equipo en Recepción y habilita a tu personal",
          description:
            "Toca aquí para ir directo a Recepción -> Equipo e ingresar el correo o teléfono de tu colaborador.",
          image: pickImage(12, "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&q=80"),
          isActionCard: true,
        },
      ],
    }

    const reelPlanBronce: SmartReelDefinition = {
      id: "plan-bronce-gratis",
      badge: "REEL NEGOCIOS · EMPIEZA GRATIS",
      heading: "Publica tu negocio gratis con el Plan Bronce",
      subtitle: "Recibe reservas, lanza Ofertas Flash y gestiona tu equipo",
      ctaLabel: "Empezar con Bronce",
      icon: Zap,
      onAction: () => onNavigate?.("planes"),
      steps: [
        {
          stepBadge: "Paso 1 · Visibilidad",
          title: "¿Tienes un hotel, restaurante, tour o transporte?",
          description:
            "Conecta tu negocio frente a miles de viajeros que buscan experiencias reales todos los días.",
          image: pickImage(13, "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80"),
        },
        {
          stepBadge: "Paso 2 · Herramientas",
          title: "Ofertas Flash, vouchers QR, Pools y equipo de trabajo",
          description:
            "Todo incluido para que gestiones cupos, fechas, promociones con reloj y cobros seguros.",
          image: pickImage(14, "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80"),
        },
        {
          stepBadge: "Paso 3 · 100% Gratis",
          title: "Activa hoy tu Plan Bronce sin costo de inscripción",
          description:
            "Empieza gratis con Bronce y crece a tu propio ritmo dentro del ecosistema PalenqueGo.",
          image: pickImage(15, "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80"),
          isActionCard: true,
        },
      ],
    }

    const reelUpgradePlan: SmartReelDefinition = {
      id: "upgrade-plan-10dias",
      badge: "REEL SOCIOS · SIGUIENTE NIVEL",
      heading: "Lleva tu negocio al siguiente nivel con Oro y Platino",
      subtitle: "Más Ofertas Flash simultáneas y prioridad máxima en el feed",
      ctaLabel: "Ver Ventajas",
      icon: Star,
      onAction: () => {
        if (typeof window !== "undefined") {
          localStorage.setItem("palenque_upgrade_reel_shown_at", String(Date.now()))
        }
        setCanShowUpgradeReel(false)
        onNavigate?.("planes")
      },
      steps: [
        {
          stepBadge: "Paso 1 · Crecimiento",
          title: "Tu negocio ya está en marcha con el Plan Bronce",
          description:
            "Cuando quieras escalar tus reservas, los planes Oro y Platino multiplican tu alcance comercial.",
          image: pickImage(16, "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80"),
        },
        {
          stepBadge: "Paso 2 · Prioridad VIP",
          title: "Más Ofertas Flash activas y destaque en publicidad del feed",
          description:
            "Tus promociones rotan en los bloques destacados y accedes a condiciones preferenciales en toda la red.",
          image: pickImage(17, "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80"),
        },
        {
          stepBadge: "Paso 3 · Compara planes",
          title: "Descubre todas las ventajas de subir de nivel",
          description:
            "Revisa los beneficios de Partner Oro, Platino y Pro cuando estés listo para dar el salto.",
          image: pickImage(18, "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80"),
          isActionCard: true,
        },
      ],
    }

    const reelChofer: SmartReelDefinition = {
      id: "modo-chofer",
      badge: "REEL MOVILIDAD · MODO CHOFER",
      heading: "Genera ingresos con tu unidad en rutas y traslados",
      subtitle: "Pasajeros verificados, control de asientos y GPS en vivo",
      ctaLabel: "Panel de Chofer",
      icon: Compass,
      onAction: () => onNavigate?.(currentUser?.tipo === "CHOFER" ? "conductor" : "profile"),
      steps: [
        {
          stepBadge: "Paso 1 · Tu Unidad",
          title: "Conecta tu vehículo, microbús o shuttle turístico",
          description:
            "Atiende rutas turísticas, traslados al aeropuerto y viajes grupales dentro de la red PalenqueGo.",
          image: pickImage(19, "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80"),
        },
        {
          stepBadge: "Paso 2 · Control QR y GPS",
          title: "Valida boletos QR al abordar y muestra tu ruta en vivo",
          description:
            "Tus pasajeros ven la ubicación de tu unidad en tiempo real y tú controlas las plazas disponibles.",
          image: pickImage(20, "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&q=80"),
        },
        {
          stepBadge: "Paso 3 · Actívate",
          title: "Configura tu perfil de Chofer y empieza a rodar",
          description:
            "Entra a tu consola de conductor o activa tu interés de Chofer en Mi Perfil.",
          image: pickImage(21, "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80"),
          isActionCard: true,
        },
      ],
    }

    const reelFlashMapas: SmartReelDefinition = {
      id: "ofertas-flash-mapas",
      badge: "REEL PROMOCIONES · OFERTAS FLASH & MAPA",
      heading: "Caza Ofertas Flash antes de que expire el reloj",
      subtitle: "Descuentos directos con cupos limitados y exploración en mapa",
      ctaLabel: "Ver Ofertas Flash",
      icon: Zap,
      onAction: () => {
        setOnlyPreferred(false)
        setSelectedCategory("flash")
        setFeedSeed(Math.floor(Math.random() * 99999) + 1)
      },
      steps: [
        {
          stepBadge: "Paso 1 · Reloj en vivo",
          title: "Descuentos reales por tiempo limitado en experiencias top",
          description:
            "Los comercios aliados lanzan cupos promocionales con ahorro directo sobre la tarifa base.",
          image: pickImage(22, "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80"),
        },
        {
          stepBadge: "Paso 2 · Cupos contados",
          title: "Asegura tus lugares antes de que se agoten",
          description:
            "Cada tarjeta muestra el reloj regresivo y cuántos cupos flash quedan disponibles en este instante.",
          image: pickImage(23, "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80"),
        },
        {
          stepBadge: "Paso 3 · Filtra en 1 clic",
          title: "Explora todas las Ofertas Flash activas ahora mismo",
          description:
            "Toca aquí para filtrar únicamente las promociones relámpago vigentes hoy.",
          image: pickImage(24, "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=600&q=80"),
          isActionCard: true,
        },
      ],
    }

    const queue: SmartReelDefinition[] = []

    // Dynamic ordering based on user actions, survey choice, and roles
    if (feedSurveyIntent === "group" || hasLikedOrReacted || userIntentions?.wantsToLeadPools) {
      queue.push(reelPools, reelEmbajador, reelGoSwiper)
    } else if (feedSurveyIntent === "flash") {
      queue.push(reelFlashMapas, reelGoSwiper, reelPools)
    } else if (feedSurveyIntent === "driver" || isDriverUser) {
      queue.push(reelChofer, reelAlianzas, reelPools)
    } else if (feedSurveyIntent === "business" || isBusinessUser) {
      if (!currentUser?.es_aliado && currentUser?.tipo !== "ALIADO" && isOnBronzeFreePlan) {
        queue.push(reelPlanBronce)
      }
      if (!hasTeamConfigured) {
        queue.push(reelEquipo)
      }
      queue.push(reelAlianzas)
      if ((currentUser?.es_aliado || currentUser?.tipo === "ALIADO") && isOnBronzeFreePlan && canShowUpgradeReel) {
        queue.push(reelUpgradePlan)
      }
    }

    // Ensure every user (since anyone can be both traveler and business/ally/driver) gets a balanced rotation
    const allCandidates = [
      reelPools,
      reelEmbajador,
      reelGoSwiper,
      reelAlianzas,
      reelFlashMapas,
      ...(hasTeamConfigured ? [] : [reelEquipo]),
      ...(isOnBronzeFreePlan ? [reelPlanBronce] : []),
      ...(isOnBronzeFreePlan && canShowUpgradeReel ? [reelUpgradePlan] : []),
      reelChofer,
    ]
    for (const candidate of allCandidates) {
      if (!queue.some((r) => r.id === candidate.id)) {
        queue.push(candidate)
      }
    }

    return queue
  }, [
    globalCatalogPool,
    services,
    feedSeed,
    userFavorites.length,
    serviceReactions,
    currentUser,
    userIntentions,
    feedSurveyIntent,
    userPlan,
    canShowUpgradeReel,
    onNavigate,
  ])

  const orderedServicesRef = useRef<Service[]>(orderedServices)
  orderedServicesRef.current = orderedServices

  // Sync batch IDs when orderedServices updates
  useEffect(() => {
    if (isLoadingFeed || isReloadingBatch || allUnseenExhausted) return
    if (orderedServices.length === 0) return
    if (currentBatchIds.length === 0) {
      const unseen = orderedServices.filter((s) => !seenIdsRef.current.has(s.id))
      const pool = unseen.length > 0 ? unseen : orderedServices
      setCurrentBatchIds(pool.slice(0, BATCH_SIZE).map((s) => s.id))
    }
  }, [orderedServices, currentBatchIds.length, isLoadingFeed, isReloadingBatch, allUnseenExhausted])

  const handleRestartCycle = useCallback(() => {
    seenIdsRef.current.clear()
    seenInCurrentBatchRef.current.clear()
    cachedMarketplaceSession = null
    persistSeenIds()
    setAllUnseenExhausted(false)
    setBatchNumber(1)
    setCurrentBatchIds([])
    if ((selectedCategory === "flash" && flashServices.length === 0) || orderedServicesRef.current.length === 0) {
      setOnlyPreferred(false)
      setSelectedCategory("all")
      setSearchQuery("")
    }
    setFeedSeed(Math.floor(Math.random() * 99999) + 1)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
      const scrollEl = document.querySelector(".overflow-y-auto") as HTMLElement | null
      if (scrollEl) {
        scrollEl.scrollTo({ top: 0, behavior: "smooth" })
      }
    }
  }, [persistSeenIds, selectedCategory, flashServices.length])

  const visibleBatchServices = useMemo(() => {
    // When actively searching, return all matched services directly
    if (effectiveSearchQuery) {
      return orderedServices
    }
    let list: Service[] = []
    if (currentBatchIds.length > 0) {
      const byId = new Map(orderedServices.map((s) => [s.id, s]))
      const mapped = currentBatchIds.map((id) => byId.get(id)).filter((s): s is Service => Boolean(s))
      if (mapped.length > 0) list = mapped
    }
    if (list.length === 0 && !allUnseenExhausted && orderedServices.length > 0) {
      list = orderedServices.slice(0, BATCH_SIZE)
    }

    // GUARANTEE: If comments are open for a service, that service MUST be present in visibleBatchServices!
    if (openCommentsId !== null && !list.some((s) => s.id === openCommentsId)) {
      const openSvc =
        orderedServices.find((s) => s.id === openCommentsId) ||
        services.find((s) => s.id === openCommentsId) ||
        globalCatalogPool.find((s) => s.id === openCommentsId)
      if (openSvc) {
        list = [openSvc, ...list]
      }
    }

    return list
  }, [orderedServices, currentBatchIds, allUnseenExhausted, effectiveSearchQuery, openCommentsId, services, globalCatalogPool])

  // Active service for the Interactive Experience Lightbox Modal
  const lightboxActiveService = useMemo(() => {
    if (lightboxServiceId === null) return null
    if (enrichedLightboxService && enrichedLightboxService.id === lightboxServiceId) {
      return enrichedLightboxService
    }
    return (
      visibleBatchServices.find((s) => s.id === lightboxServiceId) ||
      services.find((s) => s.id === lightboxServiceId) ||
      globalCatalogPool.find((s) => s.id === lightboxServiceId) ||
      null
    )
  }, [lightboxServiceId, enrichedLightboxService, visibleBatchServices, services, globalCatalogPool])

  // Active service for the Elevated 3D Spotlight Comments Modal
  const activeCommentService = useMemo(() => {
    if (openCommentsId === null) return null
    return (
      visibleBatchServices.find((s) => s.id === openCommentsId) ||
      services.find((s) => s.id === openCommentsId) ||
      globalCatalogPool.find((s) => s.id === openCommentsId) ||
      null
    )
  }, [openCommentsId, visibleBatchServices, services, globalCatalogPool])

  // Escape key handler + body spotlight class when comments spotlight is open
  useEffect(() => {
    if (openCommentsId === null) {
      document.body.classList.remove("comments-spotlight-open")
      return
    }
    document.body.classList.add("comments-spotlight-open")
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenCommentsId(null)
        setCommentPickerMode(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.classList.remove("comments-spotlight-open")
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [openCommentsId])

  // Prevent wheel movement on header/composer/backdrop when comments spotlight is active
  useEffect(() => {
    if (openCommentsId === null) return

    const cardEl = document.getElementById(`service-card-${openCommentsId}`)
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const headerEl = cardEl?.querySelector("[data-card-header='true']")
    const footerEl = cardEl?.querySelector("[data-card-footer='true']")
    const backdropEl = document.getElementById("comments-soft-backdrop")

    headerEl?.addEventListener("wheel", preventScroll as any, { passive: false })
    footerEl?.addEventListener("wheel", preventScroll as any, { passive: false })
    backdropEl?.addEventListener("wheel", preventScroll as any, { passive: false })

    return () => {
      headerEl?.removeEventListener("wheel", preventScroll as any)
      footerEl?.removeEventListener("wheel", preventScroll as any)
      backdropEl?.removeEventListener("wheel", preventScroll as any)
    }
  }, [openCommentsId])

  // Toggle comments and smoothly bring card to the top of the feed
  const handleToggleComments = useCallback((serviceId: number) => {
    setOpenCommentsId((prev) => {
      const isOpening = prev !== serviceId
      if (isOpening) {
        setCurrentBatchIds((current) => {
          if (current.includes(serviceId)) return current
          return [serviceId, ...current]
        })
        setTimeout(() => {
          const el = document.getElementById(`service-card-${serviceId}`)
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        }, 50)
      }
      return isOpening ? serviceId : null
    })
  }, [])

  // Promo Video Stories from Followed Businesses (only shown in feed when a followed business has active stories)
  const [followedStoreIdsLocal, setFollowedStoreIdsLocal] = useState<number[]>([])
  const [activeFeedStoryItem, setActiveFeedStoryItem] = useState<{
    businessId: number
    businessName: string
    businessLogo: string
    stories: Array<{
      id: number
      titulo: string
      video_cloudinary_url: string
      thumbnail_url?: string
      vistas?: number
    }>
    storyIdx: number
  } | null>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("palenque_followed_stores_v1") || "[]")
      if (Array.isArray(saved)) {
        setFollowedStoreIdsLocal(saved.map((n) => Number(n)).filter(Boolean))
      }
    } catch {
      // ignore
    }
  }, [businesses])

  const followedBusinessesWithPromos = useMemo(() => {
    return (businesses || []).filter((b: any) => {
      const isFollowed = Boolean(b.is_following) || followedStoreIdsLocal.includes(Number(b.id))
      const hasPromos = Array.isArray(b.promo_stories) && b.promo_stories.length > 0
      return isFollowed && hasPromos
    })
  }, [businesses, followedStoreIdsLocal])

  // Silently fetch full galleryImages, features, extras, and routes when a service is opened in the Lightbox
  useEffect(() => {
    if (lightboxServiceId === null) {
      setEnrichedLightboxService(null)
      return
    }
    setLightboxPhotoIdx(0)
    setExpandLightboxDesc(false)
    let cancelled = false
    useAppStore
      .getState()
      .fetchServiceById(lightboxServiceId)
      .then((full) => {
        if (!cancelled && full) {
          setEnrichedLightboxService(full)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [lightboxServiceId])

  const handleStepLightboxService = useCallback(
    (dir: "prev" | "next") => {
      if (lightboxServiceId === null || visibleBatchServices.length === 0) return
      const currentIdx = visibleBatchServices.findIndex((s) => s.id === lightboxServiceId)
      if (currentIdx === -1) {
        setLightboxServiceId(visibleBatchServices[0].id)
        return
      }
      if (dir === "next") {
        const nextIdx = (currentIdx + 1) % visibleBatchServices.length
        setLightboxServiceId(visibleBatchServices[nextIdx].id)
        markServiceSeen(visibleBatchServices[nextIdx].id)
        if (currentIdx >= visibleBatchServices.length - 3) {
          advanceBatchAutomatically()
        }
      } else {
        const prevIdx = (currentIdx - 1 + visibleBatchServices.length) % visibleBatchServices.length
        setLightboxServiceId(visibleBatchServices[prevIdx].id)
      }
    },
    [lightboxServiceId, visibleBatchServices, markServiceSeen, advanceBatchAutomatically],
  )

  useEffect(() => {
    if (lightboxServiceId === null) return
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return
      if (e.key === "Escape") {
        setLightboxServiceId(null)
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        handleStepLightboxService("next")
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        handleStepLightboxService("prev")
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [lightboxServiceId, handleStepLightboxService])

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8] dark:bg-background">
      <HeaderWithMenu
        title="Experiencias"
        subtitle="Descubre, reacciona y reserva con la comunidad"
        onNavigate={onNavigate}
      />

      {/* Main Responsive Layout: Wider Centered Social Feed + Right Sidebar hugged near right edge on Desktop */}
      <div className="max-w-[1380px] mx-auto w-full px-4 sm:px-6 lg:px-5 pt-5 pb-28">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:gap-8 items-start">
          {/* LEFT / CENTER COLUMN: SOCIAL FEED */}
          <div ref={feedTopRef} className="w-full max-w-[650px] mx-auto space-y-5">
            {/* Selector estilo Facebook: Iconos centrados con línea verde inferior */}
            <div className="bg-white dark:bg-card border border-border/70 rounded-2xl px-2 flex items-center gap-1 shadow-2xs">
              <button
                type="button"
                aria-label="Servicios"
                className="group relative flex-1 h-12 flex items-center justify-center text-[#105238] cursor-default"
              >
                <LayoutGrid className="w-6 h-6" />
                <span className="absolute bottom-0 inset-x-3 h-[3px] rounded-t-full bg-[#105238]" />
                <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute top-full mt-1.5 bg-neutral-900/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg z-40">
                  Servicios
                </span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.("rutas-classic")}
                aria-label="Rutas"
                className="group relative flex-1 h-10 my-1 flex items-center justify-center rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-white/10 text-slate-500 transition-colors cursor-pointer"
              >
                <RouteIcon className="w-6 h-6" />
                <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute top-full mt-2.5 bg-neutral-900/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg z-40">
                  Rutas
                </span>
              </button>
            </div>

            {/* Followed Businesses Video Promo Stories Strip (only visible when followed stores have active promos) */}
            {followedBusinessesWithPromos.length > 0 && (
              <div className="bg-card border border-border rounded-3xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#105238]" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
                      Promos de Negocios que Sigues
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold text-[#105238] bg-[#eaf0e2] px-2.5 py-0.5 rounded-full">
                    {followedBusinessesWithPromos.length} negocio{followedBusinessesWithPromos.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-4 overflow-x-auto pb-1 no-scrollbar">
                  {followedBusinessesWithPromos.map((biz: any) => {
                    const firstStory = biz.promo_stories[0]
                    return (
                      <button
                        key={biz.id}
                        type="button"
                        onClick={() =>
                          setActiveFeedStoryItem({
                            businessId: biz.id,
                            businessName: biz.name,
                            businessLogo: biz.logo || biz.banner || "",
                            stories: biz.promo_stories,
                            storyIdx: 0,
                          })
                        }
                        className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
                      >
                        <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-[#105238] via-[#8ee01a] to-[#105238] shadow-sm group-hover:scale-105 transition-transform">
                          <div className="w-full h-full rounded-full overflow-hidden bg-black border-2 border-white relative">
                            {firstStory?.thumbnail_url || biz.logo || biz.banner ? (
                              <img
                                src={firstStory?.thumbnail_url || biz.logo || biz.banner}
                                alt={biz.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#105238] flex items-center justify-center text-white font-black text-xs">
                                {biz.name?.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-foreground max-w-[74px] truncate">
                          {biz.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TOP SEARCH ROW (Natural scroll flow — never fights or clips with feed cards) */}
            <div ref={stickySearchRowRef} className="sticky-search-container">
                <div className="bg-card border border-border rounded-3xl p-2.5 sm:p-3.5 shadow-2xs">
                  <div className="flex flex-nowrap sm:flex-wrap items-center gap-1.5 sm:gap-2">
                    <div className="relative flex-1 min-w-0 sm:min-w-[180px]">
                      <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        placeholder="Buscar experiencias, tours, restaurantes..."
                        className="pl-9 sm:pl-10 pr-9 sm:pr-10 bg-[#f0f2f5]/70 dark:bg-background border border-slate-200/80 dark:border-border focus:border-slate-300 focus-visible:border-slate-300 focus-visible:ring-0 focus:outline-none h-9 sm:h-10 rounded-2xl text-xs sm:text-sm"
                        onFocus={() => setIsMobileSearchFocused(true)}
                        onBlur={() => setTimeout(() => setIsMobileSearchFocused(false), 150)}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {(searchQuery || isMobileSearchFocused) && (
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            if (searchQuery) {
                              setSearchQuery("")
                            } else {
                              setIsMobileSearchFocused(false)
                              if (document.activeElement instanceof HTMLElement) {
                                document.activeElement.blur()
                              }
                            }
                          }}
                          className={cn(
                            "absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer",
                            !searchQuery && "sm:hidden",
                          )}
                          aria-label={searchQuery ? "Limpiar búsqueda" : "Cerrar enfoque de búsqueda"}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowFilterPanel(true)}
                      className={cn(
                        "h-9 w-9 p-0 sm:h-10 sm:w-auto sm:px-3.5 rounded-2xl border-transparent bg-[#f0f2f5] hover:bg-[#e4e6eb] text-slate-800 text-xs font-bold gap-1.5 cursor-pointer shadow-none shrink-0",
                        isMobileSearchFocused ? "hidden sm:inline-flex" : "inline-flex",
                      )}
                      aria-label="Filtros"
                    >
                      <Filter className="w-4 h-4 text-slate-700" />
                      <span className="hidden sm:inline">Filtros</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPreferencesModal(true)}
                      className={cn(
                        "h-9 w-9 p-0 sm:h-10 sm:w-auto sm:px-3.5 rounded-2xl border-transparent bg-[#f0f2f5] hover:bg-[#e4e6eb] text-slate-800 text-xs font-bold gap-1.5 cursor-pointer shadow-none shrink-0",
                        isMobileSearchFocused ? "hidden sm:inline-flex" : "inline-flex",
                      )}
                      aria-label="Preferencias"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-slate-700" />
                      <span className="hidden sm:inline">Preferencias</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRestartCycle}
                      title="Mezclar orden del feed"
                      className={cn(
                        "h-9 w-9 p-0 sm:h-10 sm:w-auto sm:px-3 rounded-2xl border-transparent bg-[#f0f2f5] hover:bg-[#e4e6eb] text-slate-800 text-xs font-bold gap-1 cursor-pointer shadow-none shrink-0",
                        isMobileSearchFocused ? "hidden sm:inline-flex" : "inline-flex",
                      )}
                      aria-label="Mezclar orden del feed"
                    >
                      <Shuffle className="w-4 h-4 text-slate-700" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* STICKY CATEGORY PILLS BAR (with preferred categories first + scroll arrows + mobile inline search swap) */}
              <div
                ref={stickyHeaderRef}
                className="sticky top-0 z-30 bg-[#fafaf8]/95 dark:bg-background/95 backdrop-blur-md -mx-1 px-1 py-2"
              >
                {isMobileInlineSearchOpen && (
                  <div className="mobile-inline-search flex sm:hidden w-full animate-in fade-in duration-150">
                    <div className="bg-card border border-border rounded-3xl p-2 shadow-2xs w-full">
                      <div className="flex flex-nowrap items-center gap-1.5">
                        <div className="relative flex-1 min-w-0">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={searchQuery}
                            placeholder="Buscar experiencias, tours, restaurantes..."
                            className="pl-9 pr-9 bg-[#f0f2f5]/70 dark:bg-background border border-slate-200/80 dark:border-border focus:border-slate-300 focus-visible:border-slate-300 focus-visible:ring-0 focus:outline-none h-9 rounded-2xl text-xs"
                            onFocus={() => setIsMobileInlineInputFocused(true)}
                            onBlur={() => setTimeout(() => setIsMobileInlineInputFocused(false), 150)}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          {(searchQuery || isMobileInlineInputFocused) && (
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                if (searchQuery) {
                                  setSearchQuery("")
                                } else {
                                  setIsMobileInlineInputFocused(false)
                                  if (document.activeElement instanceof HTMLElement) {
                                    document.activeElement.blur()
                                  }
                                }
                              }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                              aria-label={searchQuery ? "Limpiar búsqueda" : "Volver a iconos"}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowFilterPanel(true)}
                          className={cn(
                            "h-9 w-9 p-0 rounded-2xl border-transparent bg-[#f0f2f5] hover:bg-[#e4e6eb] text-slate-800 text-xs font-bold cursor-pointer shadow-none shrink-0",
                            isMobileInlineInputFocused ? "hidden" : "inline-flex",
                          )}
                          aria-label="Filtros"
                        >
                          <Filter className="w-4 h-4 text-slate-700" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowPreferencesModal(true)}
                          className={cn(
                            "h-9 w-9 p-0 rounded-2xl border-transparent bg-[#f0f2f5] hover:bg-[#e4e6eb] text-slate-800 text-xs font-bold cursor-pointer shadow-none shrink-0",
                            isMobileInlineInputFocused ? "hidden" : "inline-flex",
                          )}
                          aria-label="Preferencias"
                        >
                          <SlidersHorizontal className="w-4 h-4 text-slate-700" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRestartCycle}
                          title="Mezclar orden del feed"
                          className={cn(
                            "h-9 w-9 p-0 rounded-2xl border-transparent bg-[#f0f2f5] hover:bg-[#e4e6eb] text-slate-800 text-xs font-bold cursor-pointer shadow-none shrink-0",
                            isMobileInlineInputFocused ? "hidden" : "inline-flex",
                          )}
                          aria-label="Mezclar orden del feed"
                        >
                          <Shuffle className="w-4 h-4 text-slate-700" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className={cn("flex items-center gap-1.5", isMobileInlineSearchOpen && "hidden sm:flex")}>
                  <button
                    type="button"
                    onClick={() => categoriesTrackRef.current?.scrollBy({ left: -220, behavior: "smooth" })}
                    className="hidden sm:flex w-7 h-7 rounded-full bg-white dark:bg-card border border-slate-200/90 items-center justify-center text-slate-600 hover:bg-[#f0f2f5] hover:text-slate-900 transition-all shrink-0 shadow-2xs cursor-pointer"
                    aria-label="Categorías anteriores"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div ref={categoriesTrackRef} className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide">
                    {preferredCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory("all")
                          setOnlyPreferred((prev) => !prev)
                          setFeedSeed(Math.floor(Math.random() * 99999) + 1)
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all text-xs font-bold cursor-pointer shrink-0 border",
                          onlyPreferred && selectedCategory === "all"
                            ? "bg-[#f8faf7] text-[#105238] border-[#105238] shadow-xs"
                            : "bg-[#f0f2f5] hover:bg-[#e4e6eb] text-slate-700 border-transparent",
                        )}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Para ti ({preferredCategories.length})</span>
                      </button>
                    )}

                    {[
                      ...categories.filter((c) => c.id === "all" || (c.id === "flash" && flashServices.length > 0)),
                      ...categories.filter((c) => c.id !== "all" && c.id !== "flash" && preferredCategories.includes(c.id)),
                      ...categories.filter((c) => c.id !== "all" && c.id !== "flash" && !preferredCategories.includes(c.id)),
                    ].map((cat) => {
                      const Icon = cat.icon
                      const isActive = selectedCategory === cat.id && !(onlyPreferred && cat.id === "all")
                      const isSpecial = (cat as any).isSpecial
                      return (
                        <button
                          key={cat.id}
                          onClick={() => handleSelectCategorySmooth(cat.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all text-xs font-bold cursor-pointer shrink-0 border",
                            isActive
                              ? "bg-[#f8faf7] text-[#105238] border-[#105238] shadow-xs"
                              : "bg-[#f0f2f5] hover:bg-[#e4e6eb] text-slate-700 border-transparent",
                          )}
                        >
                          <Icon className={cn("w-3.5 h-3.5", isActive ? "text-[#105238]" : (isSpecial ? "text-amber-500" : "text-slate-600"))} />
                          <span>{cat.label}</span>
                        </button>
                      )
                    })}
                  </div>
                  {isCategoriesStuck && (
                    <button
                      type="button"
                      onClick={() => {
                        const mainContainer = document.getElementById("main-scroll-container") as HTMLElement | null
                        const currentY =
                          mainContainer && mainContainer.scrollTop > 0
                            ? mainContainer.scrollTop
                            : window.scrollY || document.documentElement.scrollTop || 0
                        mobileInlineSearchScrollStartRef.current = currentY
                        isMobileInlineSearchOpenRef.current = true
                        setIsMobileInlineSearchOpen(true)
                      }}
                      className="flex sm:hidden w-8 h-8 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] border border-slate-200/80 items-center justify-center text-slate-700 shrink-0 shadow-2xs cursor-pointer transition-all active:scale-95"
                      aria-label="Buscar"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => categoriesTrackRef.current?.scrollBy({ left: 220, behavior: "smooth" })}
                    className="hidden sm:flex w-7 h-7 rounded-full bg-white dark:bg-card border border-slate-200/90 items-center justify-center text-slate-600 hover:bg-[#f0f2f5] hover:text-slate-900 transition-all shrink-0 shadow-2xs cursor-pointer"
                    aria-label="Más categorías"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            {/* TRAVELER EXPERIENCE TRIGGER (Opens Blurred-Backdrop Modal) */}
            <div
              onClick={() => {
                setPublishError(null)
                setShowPublishModal(true)
              }}
              className="bg-card border border-border rounded-3xl p-4 shadow-2xs space-y-3 cursor-pointer hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-slate-200 shrink-0">
                  <AvatarImage src={currentUser?.avatar} alt={currentUser?.name || "Viajero"} />
                  <AvatarFallback className="bg-slate-200 text-slate-700 font-bold text-xs">
                    {(currentUser?.name || "PG").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-[#f0f2f5]/80 dark:bg-background border border-transparent rounded-full px-4 py-2.5 text-xs sm:text-sm text-slate-500 hover:bg-[#e4e6eb]/80 transition-colors">
                  ¿Viviste una experiencia increíble? Cuéntala y califica el lugar...
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs font-bold text-slate-700">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#f0f2f5] hover:bg-[#e4e6eb] text-slate-800 transition-colors">
                  <Star className="w-3.5 h-3.5 text-[#105238]" /> Calificar lugar visitado
                </span>
                <span className="inline-flex items-center gap-1 text-slate-500 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> Buscar experiencia
                </span>
              </div>
            </div>

            {/* USER TRAVELER POSTS */}
            {travelerPosts.map((post) => {
              const totalPostReacts = Object.values(post.reactions).reduce((a, b) => a + b, 0)
              return (
                <article
                  key={post.id}
                  className="bg-card border border-border rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-[#105238]/30">
                        <AvatarImage src={post.avatar} alt={post.author} />
                        <AvatarFallback className="bg-[#105238] text-white font-bold text-xs">
                          {post.author.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm text-foreground">{post.author}</p>
                        <p className="text-[11px] text-muted-foreground">{post.createdAt}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#eaf0e2] text-[#105238]">
                      Comunidad
                    </span>
                  </div>

                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{post.text}</p>

                  {post.taggedServiceId && post.taggedServiceName && (() => {
                    const matchedSvc = services.find((s) => s.id === post.taggedServiceId)
                    const svcThumb =
                      getProxyImage(post.taggedServiceImage || matchedSvc?.image || "") || DEFAULT_STORE_COVER
                    return (
                      <button
                        type="button"
                        onClick={() =>
                          post.taggedServiceId &&
                          openServiceDetailInstant(matchedSvc || post.taggedServiceId, "#resenas-reales")
                        }
                        className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-[#f7f8fa] hover:bg-[#f0f2f5] border border-slate-200/80 transition-colors text-left cursor-pointer group/svc"
                      >
                        <img
                          src={svcThumb}
                          alt={post.taggedServiceName}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white shadow-2xs"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_STORE_COVER
                          }}
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-900 truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">{post.taggedServiceName}</span>
                            </span>
                            {post.rating && (
                              <span className="inline-flex items-center gap-0.5 bg-[#f0f2f5] text-slate-800 px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0">
                                <Star className="w-2.5 h-2.5 fill-[#105238] text-[#105238]" /> {post.rating}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-bold text-slate-600 group-hover/svc:text-[#105238] group-hover/svc:underline">
                            Ver reseña en la experiencia →
                          </p>
                        </div>
                      </button>
                    )
                  })()}

                  {/* Quick Reaction Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
                    {REACTIONS.map((r) => {
                      const active = post.userReaction === r.id
                      const count = post.reactions[r.id] || 0
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleReactTravelerPost(post.id, r.id)}
                          className={cn(
                            "group/react inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border",
                            active
                              ? "bg-[#eaf0e2] text-[#105238] border-[#105238]/30 shadow-2xs"
                              : "bg-[#f0f2f5] text-slate-700 hover:bg-[#e4e6eb] hover:text-slate-900 border-transparent",
                          )}
                        >
                          <span className="transition-transform duration-200 group-hover/react:scale-125">
                            <ReactionBadgeIcon type={r.id} size="sm" animated={active} />
                          </span>
                          <span>{r.label}</span>
                          {count > 0 && <span>({count})</span>}
                        </button>
                      )
                    })}

                    <button
                      type="button"
                      onClick={() =>
                        setOpenTravelerCommentsId((prev) => (prev === post.id ? null : post.id))
                      }
                      className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>
                        {post.comments.length} {post.comments.length === 1 ? "comentario" : "comentarios"}
                      </span>
                    </button>
                  </div>

                  {totalPostReacts > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      {totalPostReacts} {totalPostReacts === 1 ? "reacción" : "reacciones"} de viajeros
                    </p>
                  )}

                  {openTravelerCommentsId === post.id && (
                    <div className="pt-2 border-t border-border/60 space-y-2.5">
                      {post.comments.map((c) => (
                        <div key={c.id} className="bg-muted/40 rounded-2xl px-3.5 py-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{c.author}</span>
                            <span className="text-[10px] text-muted-foreground">{c.createdAt}</span>
                          </div>
                          <p className="text-foreground/90 mt-0.5">{c.text}</p>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={travelerCommentDrafts[post.id] || ""}
                          onChange={(e) =>
                            setTravelerCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          placeholder="Escribe un comentario..."
                          className="flex-1 h-9 px-3 rounded-xl border border-border bg-background text-xs"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleAddTravelerComment(post.id)}
                          className="h-9 px-3 rounded-xl bg-[#105238] text-white text-xs font-bold cursor-pointer"
                        >
                          Enviar
                        </Button>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}

            {/* SERVICE SOCIAL FEED POSTS */}
            {effectiveSearchQuery && visibleBatchServices.length === 0 && !isLoadingFeed && (
              <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-3 shadow-2xs">
                <Search className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="font-extrabold text-base text-foreground">
                  No encontramos resultados para "{searchQuery}"
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Prueba buscando por nombre del lugar, municipio o categoría (ej. Restaurante, Hotel, Tours), o haz clic en limpiar para ver todo el feed.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  className="rounded-xl border-slate-300 text-xs font-bold cursor-pointer"
                >
                  Limpiar búsqueda
                </Button>
              </div>
            )}

            {isReloadingBatch || (isLoadingFeed && visibleBatchServices.length === 0) ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-9 h-9 border-3 border-[#105238] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-[#105238]">
                  Descubriendo experiencias para ti...
                </p>
              </div>
            ) : (
              <div className="space-y-5 relative">
                {/* Soft Backdrop: rest of the page in blur, covers 100% of the screen down to the bottom floor */}
                {openCommentsId !== null && (
                  <div
                    id="comments-soft-backdrop"
                    className="fixed inset-0 w-screen h-screen bg-black/45 backdrop-blur-xs z-30 transition-opacity animate-in fade-in duration-200"
                    onClick={() => {
                      setOpenCommentsId(null)
                      setCommentPickerMode(null)
                    }}
                  />
                )}
                {visibleBatchServices.map((service, serviceIdx) => {
                  const hasFlashOffer = Boolean(
                    service.oferta_flash && (service.oferta_flash.cupos_disponibles ?? 0) > 0,
                  )
                  const basePrice = Number(service.price) || 0
                  const flashDiscount = service.oferta_flash?.descuento_porcentaje || service.discount || 0
                  const flashPrice = service.oferta_flash?.precio_promocional
                    ? Number(service.oferta_flash.precio_promocional)
                    : basePrice * (1 - flashDiscount / 100)
                  const flashSpots = service.oferta_flash?.cupos_disponibles ?? service.spotsLeft ?? 0
                  const isFav = userFavorites.some((f) => f.serviceId === service.id)

                  const reactState = serviceReactions[service.id] || {
                    counts: { trato: 0, divertido: 0, fascino: 0, quiero_ir: 0, recomiendo: 0 },
                    userReaction: null,
                  }
                  const totalReacts = Object.values(reactState.counts).reduce((a, b) => a + b, 0)
                  const activeReactMeta = REACTIONS.find((r) => r.id === reactState.userReaction)
                  const commentsList = serviceComments[service.id] || []
                  const shareUrl =
                    typeof window !== "undefined" ? `${window.location.origin}/s/${service.id}` : ""

                  return (
                    <div
                      key={`${service.id}-${serviceIdx}`}
                      ref={observeCardRef}
                      data-service-id={service.id}
                      className={cn(
                        "space-y-5",
                        openCommentsId === service.id ? "relative z-40" : "relative z-10",
                      )}
                    >
                    <article
                      id={`service-card-${service.id}`}
                      className={cn(
                        "bg-card border border-border rounded-3xl transition-all duration-200",
                        openCommentsId === service.id
                          ? "relative z-40 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.35)] ring-2 ring-black/10 dark:ring-white/10 scale-[1.02] h-[calc(100vh-18px)] sm:h-[calc(100dvh-18px)] max-h-[calc(100vh-18px)] sm:max-h-[calc(100dvh-18px)] flex flex-col overflow-hidden scroll-mt-2"
                          : "shadow-2xs overflow-visible scroll-mt-24",
                      )}
                    >
                      {/* Post Header: Business + Location + Price (Fixed at top of card, max 4-5px from top edge of screen) */}
                      <div
                        data-card-header="true"
                        className={cn(
                          "p-3.5 sm:p-4 flex items-start sm:items-center justify-between gap-3 shrink-0 bg-card select-none",
                          openCommentsId === service.id && "border-b border-border/40 z-10",
                        )}
                      >
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => service.businessId && router.push(`/b/${service.businessId}`)}
                            className="shrink-0 cursor-pointer"
                          >
                            <Avatar className="w-11 h-11 border border-slate-200">
                              <AvatarImage src={service.businessAvatar} alt={service.businessName || service.name} />
                              <AvatarFallback className="bg-[#f0f2f5] text-slate-700 font-bold text-xs">
                                {(service.businessName || service.name).substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </button>
                          <div className="flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => service.businessId && router.push(`/b/${service.businessId}`)}
                              className="font-bold text-sm text-foreground hover:underline block w-full text-left cursor-pointer leading-snug break-words whitespace-normal"
                            >
                              {service.businessName || "Comercio Aliado PalenqueGo"}
                            </button>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0 mt-0.5">
                              <span className="inline-flex items-center gap-1 min-w-0 truncate">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{service.location}</span>
                              </span>
                              <span className="shrink-0">·</span>
                              <span className="font-medium text-slate-500 shrink-0">
                                {service.category || service.categoria?.nombre || "Experiencia"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price Pill + Close Button */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            {hasFlashOffer ? (
                              <div>
                                <span className="text-[11px] line-through text-muted-foreground mr-1.5">
                                  ${basePrice.toFixed(2)}
                                </span>
                                <span className="text-lg font-black text-[#105238] dark:text-[#8ee01a]">
                                  ${flashPrice.toFixed(2)}
                                </span>
                                <span className="text-[11px] text-muted-foreground font-semibold"> /p</span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-lg font-black text-foreground">${basePrice.toFixed(2)}</span>
                                <span className="text-[11px] text-muted-foreground font-semibold"> /p</span>
                              </div>
                            )}
                          </div>
                          {openCommentsId === service.id && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenCommentsId(null)
                                setCommentPickerMode(null)
                              }}
                              className="w-7 h-7 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] dark:bg-white/10 dark:hover:bg-white/15 flex items-center justify-center text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer text-xs font-bold shrink-0 ml-1"
                              aria-label="Cerrar"
                              title="Cerrar comentarios"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Center Scrollable Body: Caption + Media + Actions + Existing Comments */}
                      <div
                        className={cn(
                          openCommentsId === service.id
                            ? "flex-1 overflow-y-auto scrollbar-hide overscroll-contain min-h-0"
                            : "",
                        )}
                      >
                        {/* Post Caption: Title + Description + Rating + Bone "+ Info" button (like Facebook's "Más información") */}
                      <div className="px-4 pb-3 space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <h3
                            onClick={() => openServiceDetailInstant(service)}
                            className="font-extrabold text-base sm:text-lg text-foreground hover:underline transition-colors cursor-pointer leading-snug break-words min-w-0"
                          >
                            {service.name}
                          </h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => openServiceDetailInstant(service)}
                              className="inline-flex items-center gap-1 bg-[#f0f2f5] hover:bg-[#e4e6eb] text-slate-800 text-[11px] font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
                              title="Ver página completa de la experiencia"
                            >
                              <Info className="w-3 h-3 text-slate-600" />
                              <span>Más información</span>
                            </button>
                            <div className="flex items-center gap-1 bg-[#f0f2f5] px-2 py-1 rounded-lg">
                              <Star className="w-3.5 h-3.5 fill-slate-700 text-slate-700" />
                              <span className="font-bold text-slate-800 text-xs">{service.rating}</span>
                              <span className="text-[11px] text-slate-500">({service.reviews})</span>
                            </div>
                          </div>
                        </div>

                        {service.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {service.description}
                          </p>
                        )}
                      </div>

                      {/* Post Media: Clicking image opens the Interactive Experience Lightbox Modal */}
                      <div
                        className="relative isolate h-60 sm:h-76 bg-muted overflow-hidden cursor-pointer"
                        onClick={() => {
                          markServiceSeen(service.id)
                          setLightboxServiceId(service.id)
                        }}
                      >
                        <img
                          src={service.image || "/placeholder.svg"}
                          alt={service.name}
                          className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                        />

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavoritePreference(service.id)
                          }}
                          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm flex items-center justify-center shadow-sm z-10 cursor-pointer"
                          aria-label="Guardar en favoritos"
                        >
                          <Heart
                            className={cn(
                              "w-5 h-5 transition-colors",
                              isFav ? "fill-[#105238] text-[#105238]" : "text-slate-700",
                            )}
                          />
                        </button>

                        {hasFlashOffer && service.oferta_flash?.fecha_fin ? (
                          <FlashCountdown fechaFin={service.oferta_flash.fecha_fin} />
                        ) : (
                          service.isRemate && (
                            <Badge className="absolute top-3 left-3 bg-[#105238] text-[#8ee01a] text-xs font-bold shadow-md z-10">
                              <Flame className="w-3 h-3 mr-1" />-{service.discount}%
                            </Badge>
                          )
                        )}

                        {/* Pool Badge + Routes count (Neutral dark glass so photo isn't overwhelmed by green) */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-black/65 hover:bg-black/75 text-white border border-white/15 backdrop-blur-md shadow-md py-1 px-2.5 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#8ee01a] shrink-0" />
                              <span className="text-[10px] font-bold">
                                {service.hasActivePool
                                  ? `Pool disponible · ${service.spotsLeft || 3} cupos`
                                  : "Ahorra en grupo con Pool"}
                              </span>
                            </Badge>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setActivePoolTooltipId(activePoolTooltipId === service.id ? null : service.id)
                              }}
                              className="w-6 h-6 rounded-full bg-black/65 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center text-[11px] font-bold shadow-md cursor-pointer"
                            >
                              ?
                            </button>
                          </div>

                          {service.routes && service.routes.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setServiceForRoutes(service)
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold bg-white/95 text-slate-800 px-2.5 py-1 rounded-full shadow-md cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5 text-[#105238]" />
                              <span>{service.routes.length} rutas</span>
                            </button>
                          )}
                        </div>

                        {activePoolTooltipId === service.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute inset-0 bg-[#105238]/95 text-white p-5 flex flex-col justify-between z-30"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-sm flex items-center gap-1.5 text-[#8ee01a]">
                                  <Users className="w-4 h-4" /> ¿Qué es un Pool?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setActivePoolTooltipId(null)}
                                  className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full hover:bg-white/30"
                                >
                                  Cerrar
                                </button>
                              </div>
                              <p className="text-xs leading-relaxed text-white/90">
                                Un Pool es un viaje o experiencia grupal con descuento compartido. Si te interesa, te avisamos cuando se arme el grupo.
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="w-full bg-[#8ee01a] hover:bg-[#8ee01a]/90 text-[#105238] font-black text-xs cursor-pointer"
                              onClick={() => {
                                registerPoolInterest(service.id)
                                setActivePoolTooltipId(null)
                              }}
                            >
                              Avisarme e invitarme
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Flash Spots Bar */}
                      {hasFlashOffer && flashSpots > 0 && (
                        <div className="px-4 py-1.5 bg-[#eaf0e2] border-b border-[#aeb6a1]/40 flex items-center justify-between text-[11px] font-bold text-[#105238]">
                          <span>Oferta Flash -{flashDiscount}% OFF</span>
                          <span>¡Solo quedan {flashSpots} cupo{flashSpots !== 1 ? "s" : ""}!</span>
                        </div>
                      )}

                      {/* Reactions & Comments Summary */}
                      {(totalReacts > 0 || commentsList.length > 0) && (
                        <div className="px-4 pt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {totalReacts > 0 && (
                              <div className="inline-flex items-center gap-1.5 font-semibold text-[#105238]">
                                <div className="flex items-center -space-x-1">
                                  {REACTIONS.filter((r) => (reactState.counts[r.id] || 0) > 0).map((r) => (
                                    <span key={r.id} className="ring-2 ring-card rounded-full">
                                      <ReactionBadgeIcon type={r.id} size="sm" />
                                    </span>
                                  ))}
                                </div>
                                <span>
                                  {activeReactMeta
                                    ? totalReacts === 1
                                      ? `Tú · ${activeReactMeta.label}`
                                      : `Tú y ${totalReacts - 1} más`
                                    : `${totalReacts} ${totalReacts === 1 ? "reacción" : "reacciones"}`}
                                </span>
                              </div>
                            )}
                          </div>
                          {commentsList.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleToggleComments(service.id)}
                              className="hover:underline cursor-pointer"
                            >
                              {commentsList.length} {commentsList.length === 1 ? "comentario" : "comentarios"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Social Action Row: Reaccionar | Comentar/Calificar | Compartir | Reservar */}
                      <div className="p-2.5 sm:px-4 sm:py-3 border-t border-border/60 mt-2 flex flex-wrap items-center gap-1.5 relative">
                        {/* Reaction Button + Facebook-Style Hover Floating Picker */}
                        <div
                          className="relative flex-1 min-w-[95px]"
                          onMouseEnter={() => handleReactionMouseEnter(service.id)}
                          onMouseLeave={handleReactionMouseLeave}
                        >
                          {openReactionPickerId === service.id && (
                            <div
                              onMouseEnter={() => handleReactionMouseEnter(service.id)}
                              onMouseLeave={handleReactionMouseLeave}
                              className="absolute bottom-full left-0 pb-2.5 z-40"
                            >
                              <div className="bg-white dark:bg-card border border-border rounded-full shadow-2xl px-2.5 py-2 flex items-center gap-2 animate-fb-tray">
                                {REACTIONS.map((r) => {
                                  const selected = reactState.userReaction === r.id
                                  return (
                                    <button
                                      key={r.id}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleServiceReaction(service.id, r.id)
                                      }}
                                      className={cn(
                                        "group/emoji relative flex flex-col items-center justify-center rounded-full transition-transform duration-200 hover:scale-135 hover:-translate-y-2.5 cursor-pointer focus:outline-none",
                                        selected && "ring-2 ring-[#8ee01a] ring-offset-2 ring-offset-white dark:ring-offset-card",
                                      )}
                                      aria-label={r.label}
                                    >
                                      {/* Floating Facebook-style label tooltip on hover */}
                                      <span className="pointer-events-none opacity-0 group-hover/emoji:opacity-100 transition-opacity duration-150 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg">
                                        {r.label}
                                      </span>
                                      <ReactionBadgeIcon type={r.id} size="lg" animated />
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (reactState.userReaction) {
                                toggleServiceReaction(service.id, reactState.userReaction)
                              } else {
                                setOpenReactionPickerId((prev) => (prev === service.id ? null : service.id))
                              }
                            }}
                            className={cn(
                              "w-full h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer px-2",
                              activeReactMeta
                                ? "bg-[#f0f2f5] text-slate-800"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {activeReactMeta ? (
                              <>
                                <span className={cn(justReactedServiceId === service.id && "animate-fb-pop")}>
                                  <ReactionBadgeIcon type={activeReactMeta.id} size="md" />
                                </span>
                                <span className="truncate">{activeReactMeta.label}</span>
                              </>
                            ) : (
                              <>
                                <ThumbsUp className="w-4 h-4 shrink-0" />
                                <span>Reaccionar</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Comentar / Calificar */}
                        <button
                          type="button"
                          onClick={() => handleToggleComments(service.id)}
                          className="flex-1 min-w-[95px] h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2"
                        >
                          <MessageSquare className="w-4 h-4 shrink-0" />
                          <span>Comentar</span>
                        </button>

                        {/* Compartir (Desktop Hover Floating Pill / Mobile Native) */}
                        <div
                          className="relative flex-1 min-w-[85px]"
                          onMouseEnter={() => handleShareMouseEnter(service.id)}
                          onMouseLeave={handleShareMouseLeave}
                        >
                          {openShareId === service.id && (
                            <div
                              onMouseEnter={() => handleShareMouseEnter(service.id)}
                              onMouseLeave={handleShareMouseLeave}
                              className="hidden lg:block absolute bottom-full left-1/2 -translate-x-1/2 pb-2.5 z-40"
                            >
                              <div className="flex items-center gap-2 bg-white/95 dark:bg-card backdrop-blur-md px-3 py-2 rounded-full shadow-[0_12px_32px_rgba(16,82,56,0.18)] border border-[#aeb6a1]/60 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                                <a
                                  href={`https://wa.me/?text=${encodeURIComponent(`${service.name} en PalenqueGo ${shareUrl}`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setOpenShareId(null)}
                                  className="group/sharebtn relative w-10 h-10 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] border border-slate-200/80 flex items-center justify-center text-slate-800 shadow-sm transition-transform duration-200 hover:scale-125 hover:-translate-y-1.5"
                                  aria-label="WhatsApp"
                                >
                                  <span className="pointer-events-none opacity-0 group-hover/sharebtn:opacity-100 transition-opacity duration-150 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                                    WhatsApp
                                  </span>
                                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                                </a>
                                <a
                                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setOpenShareId(null)}
                                  className="group/sharebtn relative w-10 h-10 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] border border-slate-200/80 flex items-center justify-center text-[#1877F2] text-base font-black shadow-sm transition-transform duration-200 hover:scale-125 hover:-translate-y-1.5"
                                  aria-label="Facebook"
                                >
                                  <span className="pointer-events-none opacity-0 group-hover/sharebtn:opacity-100 transition-opacity duration-150 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                                    Facebook
                                  </span>
                                  f
                                </a>
                                <a
                                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${service.name} en PalenqueGo`)}&url=${encodeURIComponent(shareUrl)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setOpenShareId(null)}
                                  className="group/sharebtn relative w-10 h-10 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] border border-slate-200/80 flex items-center justify-center text-slate-900 text-sm font-black shadow-sm transition-transform duration-200 hover:scale-125 hover:-translate-y-1.5"
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
                                  onClick={() => setOpenShareId(null)}
                                  className="group/sharebtn relative w-10 h-10 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] border border-slate-200/80 flex items-center justify-center text-[#0A66C2] text-sm font-black shadow-sm transition-transform duration-200 hover:scale-125 hover:-translate-y-1.5"
                                  aria-label="LinkedIn"
                                >
                                  <span className="pointer-events-none opacity-0 group-hover/sharebtn:opacity-100 transition-opacity duration-150 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                                    LinkedIn
                                  </span>
                                  in
                                </a>
                                <a
                                  href={`mailto:?subject=${encodeURIComponent(service.name)}&body=${encodeURIComponent(shareUrl)}`}
                                  onClick={() => setOpenShareId(null)}
                                  className="group/sharebtn relative w-10 h-10 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-sm transition-transform duration-200 hover:scale-125 hover:-translate-y-1.5"
                                  aria-label="Correo"
                                >
                                  <span className="pointer-events-none opacity-0 group-hover/sharebtn:opacity-100 transition-opacity duration-150 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                                    Correo
                                  </span>
                                  <Mail className="w-5 h-5 text-slate-700" />
                                </a>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(shareUrl)
                                    setCopiedServiceId(service.id)
                                    setTimeout(() => setCopiedServiceId(null), 1500)
                                    setOpenShareId(null)
                                  }}
                                  className="group/sharebtn relative w-10 h-10 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-sm transition-transform duration-200 hover:scale-125 hover:-translate-y-1.5 cursor-pointer"
                                  aria-label="Copiar enlace"
                                >
                                  <span className="pointer-events-none opacity-0 group-hover/sharebtn:opacity-100 transition-opacity duration-150 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                                    Copiar
                                  </span>
                                  {copiedServiceId === service.id ? (
                                    <Check className="w-5 h-5 text-[#105238]" />
                                  ) : (
                                    <Link2 className="w-5 h-5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleShareService(service)}
                            className="w-full h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2"
                          >
                            <Share2 className="w-4 h-4 shrink-0" />
                            <span>{copiedServiceId === service.id ? "¡Copiado!" : "Compartir"}</span>
                          </button>
                        </div>

                        {/* Reservar */}
                        <Button
                          type="button"
                          onClick={() => setSelectedService(service)}
                          className="flex-1 min-w-[100px] h-9 rounded-xl bg-[#eaf0e2] hover:bg-[#d8e6cb] text-[#105238] font-bold text-xs transition-colors cursor-pointer border border-[#105238]/15"
                        >
                          Reservar
                        </Button>
                      </div>

                      {/* Existing Comments List (Scrolls smoothly inside the center body) */}
                      {openCommentsId === service.id && commentsList.length > 0 && (
                        <div className="px-4 pb-4 pt-3 border-t border-border/50 bg-[#fafaf8] dark:bg-[#1e1e1e] space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wide">
                            <span>Experiencias y opiniones ({commentsList.length})</span>
                          </div>
                          <div className="space-y-2.5">
                            {commentsList.map((c) => (
                              <div key={c.id} className="flex gap-2.5 items-start">
                                {c.authorAvatar ? (
                                  <img
                                    src={c.authorAvatar}
                                    alt={c.author}
                                    className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-border/50"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-[#105238] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {c.author ? c.author.charAt(0).toUpperCase() : "V"}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-2xl px-3 py-2 space-y-0.5">
                                    <div className="flex flex-wrap items-center gap-1.5 justify-between">
                                      <span className="font-bold text-xs text-foreground truncate max-w-[150px]">
                                        {c.author}
                                      </span>
                                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
                                        {c.rating && (
                                          <span className="inline-flex items-center gap-0.5 font-bold text-[#105238] dark:text-[#8ee01a]">
                                            <Star className="w-3 h-3 fill-[#105238] dark:fill-[#8ee01a]" />
                                            {c.rating}
                                          </span>
                                        )}
                                        <span>{c.createdAt}</span>
                                      </div>
                                    </div>

                                    {(c.location || c.flag || c.countryCode) && (
                                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                        {c.countryCode && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-white/80 dark:bg-black/25 px-2 py-0.5 rounded-full border border-black/5 text-foreground/80">
                                            <CountryFlagBadge code={c.countryCode} name={c.flag} />
                                          </span>
                                        )}
                                        {c.location && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-white/80 dark:bg-black/25 px-2 py-0.5 rounded-full border border-black/5 text-foreground/80">
                                            <MapPin className="w-2.5 h-2.5 text-slate-500" />
                                            {c.location}
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed pt-0.5">
                                      {c.text}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* FACEBOOK-STYLE BONE COMPOSER PINNED AT BOTTOM (Visible at all times!) */}
                    {openCommentsId === service.id && (() => {
                      const draftText = commentDrafts[service.id] || ""
                      const currentRating = commentRatings[service.id] || 5
                      const currentLoc = commentLocations[service.id]
                      const currentCountry = commentCountries[service.id]
                      const hasSendableContent = Boolean(draftText.trim() || currentLoc)

                      return (
                        <div
                          data-card-footer="true"
                          className="shrink-0 border-t border-border/50 bg-[#fafaf8] dark:bg-[#1e1e1e] p-3 rounded-b-3xl z-10 animate-in fade-in duration-150"
                        >
                          {/* Facebook-style Bone Composer Box focused on Tourism Experience Rating & Opinions */}
                          <div className="bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-2xl p-2.5 sm:p-3 border-0 relative shadow-2xs space-y-2">
                            {/* Single Unified Header Row: User Avatar + Quick Intent Chips + Star Rating (Guaranteed 1 single line, no wrapping, all 5 stars visible) */}
                            <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-hide py-0.5 flex-nowrap w-full">
                              <div className="flex items-center gap-1 shrink-0 flex-nowrap">
                                {currentUser?.avatar ? (
                                  <img
                                    src={currentUser.avatar}
                                    alt={currentUser.name || "Usuario"}
                                    className="w-7 h-7 rounded-full object-cover ring-1 ring-black/10 shrink-0"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-[#105238] text-white flex items-center justify-center font-bold text-[10px] shrink-0 ring-1 ring-black/10">
                                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "M"}
                                  </div>
                                )}

                                {[
                                  { label: "🌴 Ya visité este lugar", prefix: "¡Ya visité este lugar y lo recomiendo! " },
                                  { label: "✨ Me gustaría ir", prefix: "¡Me encantaría ir pronto! " },
                                  { label: "❓ Pregunta sobre el sitio", prefix: "¿Alguien sabe si " },
                                ].map((pill) => (
                                  <button
                                    key={pill.label}
                                    type="button"
                                    onClick={() => {
                                      setCommentDrafts((prev) => {
                                        const current = prev[service.id] || ""
                                        if (current.startsWith(pill.prefix)) return prev
                                        return {
                                          ...prev,
                                          [service.id]: pill.prefix + current,
                                        }
                                      })
                                    }}
                                    className="px-2 py-0.5 rounded-full bg-white/80 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 border border-black/5 text-[10px] font-semibold text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap cursor-pointer shadow-2xs shrink-0"
                                  >
                                    {pill.label}
                                  </button>
                                ))}
                              </div>

                              {/* Star Rating on the Right (Same line, 100% visible without clipping) */}
                              <div className="flex items-center gap-0.5 bg-white/90 dark:bg-[#242526] px-1.5 py-0.5 rounded-full border border-black/5 shadow-2xs shrink-0 ml-auto">
                                {[1, 2, 3, 4, 5].map((starVal) => (
                                  <button
                                    key={starVal}
                                    type="button"
                                    onClick={() =>
                                      setCommentRatings((prev) => ({
                                        ...prev,
                                        [service.id]: starVal,
                                      }))
                                    }
                                    className="cursor-pointer hover:scale-110 transition-transform p-0.5"
                                    title={`${starVal} estrellas`}
                                  >
                                    <Star
                                      className={cn(
                                        "w-3.5 h-3.5",
                                        starVal <= currentRating
                                          ? "fill-[#105238] text-[#105238] dark:fill-[#8ee01a] dark:text-[#8ee01a]"
                                          : "text-muted-foreground/35",
                                      )}
                                    />
                                  </button>
                                ))}
                                <span className="text-[10px] font-bold text-foreground ml-1">
                                  {currentRating}/5
                                </span>
                              </div>
                            </div>

                              {/* Active Badges (Flag & Location, if selected) */}
                              {(currentCountry || currentLoc) && (
                                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                  {currentCountry && (
                                    <span className="inline-flex items-center gap-1.5 bg-white dark:bg-[#242526] pl-1 pr-2 py-0.5 rounded-full border border-black/5 text-foreground shadow-2xs">
                                      <RoundFlagIcon code={currentCountry.code} className="w-4 h-4" />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setCommentCountries((prev) => {
                                            const next = { ...prev }
                                            delete next[service.id]
                                            return next
                                          })
                                        }
                                        className="text-muted-foreground hover:text-foreground text-xs leading-none cursor-pointer"
                                        title="Quitar bandera"
                                      >
                                        ✕
                                      </button>
                                    </span>
                                  )}

                                  {currentLoc && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white dark:bg-[#242526] px-2 py-0.5 rounded-full border border-black/5 text-foreground shadow-2xs">
                                      <MapPin className="w-3 h-3 text-slate-500" />
                                      <span className="truncate max-w-[140px]">{currentLoc}</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setCommentLocations((prev) => {
                                            const next = { ...prev }
                                            delete next[service.id]
                                            return next
                                          })
                                        }
                                        className="text-muted-foreground hover:text-foreground ml-0.5 cursor-pointer"
                                      >
                                        ✕
                                      </button>
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Input Textarea (Single-line initial height, auto-expanding as user types) */}
                              <textarea
                                ref={(el) => {
                                  if (el) {
                                    el.style.height = "auto"
                                    el.style.height = el.value ? `${Math.min(el.scrollHeight, 120)}px` : "22px"
                                  }
                                }}
                                value={draftText}
                                onChange={(e) => {
                                  e.target.style.height = "auto"
                                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                                  setCommentDrafts((prev) => ({
                                    ...prev,
                                    [service.id]: e.target.value,
                                  }))
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleAddServiceComment(service.id)
                                  }
                                }}
                                placeholder="Comparte tu experiencia, opina, califica..."
                                className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground resize-none p-0 min-h-[22px] max-h-28 leading-snug overflow-y-auto"
                                rows={1}
                              />

                              {/* Bottom Action Bar: Subtle Gray Icons + Black Tooltips + Send Icon Button */}
                              <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5 relative">
                                <div className="flex items-center gap-1">
                                  {/* 1. Ubicación (Gray icon + Black Tooltip) */}
                                  <div className="relative group/iconbtn">
                                    <span className="pointer-events-none opacity-0 group-hover/iconbtn:opacity-100 transition-opacity duration-150 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg z-50">
                                      Ubicación
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCommentPickerMode((prev) =>
                                          prev === "location" ? null : "location",
                                        )
                                      }
                                      className={cn(
                                        "comment-picker-trigger p-1.5 rounded-full transition-colors cursor-pointer flex items-center justify-center",
                                        commentPickerMode === "location"
                                          ? "bg-black/10 dark:bg-white/15 text-foreground"
                                          : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10",
                                      )}
                                      aria-label="Marcar ubicación"
                                    >
                                      <MapPin className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* 2. Bandera de País (Gray icon + Black Tooltip) */}
                                  <div className="relative group/iconbtn">
                                    <span className="pointer-events-none opacity-0 group-hover/iconbtn:opacity-100 transition-opacity duration-150 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg z-50">
                                      Banderas del mundo
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCommentPickerMode((prev) =>
                                          prev === "country" ? null : "country",
                                        )
                                      }
                                      className={cn(
                                        "comment-picker-trigger p-1.5 rounded-full transition-colors cursor-pointer flex items-center justify-center",
                                        commentPickerMode === "country"
                                          ? "bg-black/10 dark:bg-white/15 text-foreground"
                                          : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10",
                                      )}
                                      aria-label="Banderas del mundo"
                                    >
                                      <Flag className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* 3. Emojis Viajeros (Gray icon + Black Tooltip) */}
                                  <div className="relative group/iconbtn">
                                    <span className="pointer-events-none opacity-0 group-hover/iconbtn:opacity-100 transition-opacity duration-150 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg z-50">
                                      Emojis
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCommentPickerMode((prev) =>
                                          prev === "emojis" ? null : "emojis",
                                        )
                                      }
                                      className={cn(
                                        "comment-picker-trigger p-1.5 rounded-full transition-colors cursor-pointer flex items-center justify-center",
                                        commentPickerMode === "emojis"
                                          ? "bg-black/10 dark:bg-white/15 text-foreground"
                                          : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10",
                                      )}
                                      aria-label="Emojis"
                                    >
                                      <Smile className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Send Icon Button (NO text "Publicar" - with Black Tooltip) */}
                                <div className="relative group/iconbtn">
                                  <span className="pointer-events-none opacity-0 group-hover/iconbtn:opacity-100 transition-opacity duration-150 absolute -top-8 right-0 bg-[#1f2937] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg z-50">
                                    Enviar opinión
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleAddServiceComment(service.id)}
                                    disabled={!hasSendableContent}
                                    className={cn(
                                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer",
                                      hasSendableContent
                                        ? "text-[#105238] dark:text-[#8ee01a] bg-transparent hover:bg-[#f0f2f5] dark:hover:bg-white/10 active:scale-95 shadow-none border-0"
                                        : "text-neutral-400/50 bg-transparent cursor-not-allowed shadow-none border-0",
                                    )}
                                    aria-label="Enviar"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* FLOATING POPOVER: EMOJIS (DESPRENDE HACIA ARRIBA CON BÚSQUEDA Y CATEGORÍAS) */}
                                {commentPickerMode === "emojis" && (
                                  <div className="comment-picker-popover absolute bottom-full left-0 mb-3 w-[330px] max-w-[92vw] bg-white dark:bg-[#242526] rounded-2xl border border-border shadow-[0_16px_40px_rgba(0,0,0,0.25)] p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 after:content-[''] after:absolute after:top-full after:left-14 after:border-[7px] after:border-transparent after:border-t-white dark:after:border-t-[#242526]">
                                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                        <Smile className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                                        <span>Emojis</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setCommentPickerMode(null)}
                                        className="text-xs text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                                      >
                                        ✕
                                      </button>
                                    </div>

                                    {/* Search input */}
                                    <div className="pt-2 pb-1.5">
                                      <div className="relative">
                                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                          type="text"
                                          value={emojiSearchQuery}
                                          onChange={(e) => setEmojiSearchQuery(e.target.value)}
                                          placeholder="Buscar emoji..."
                                          className="w-full h-8 pl-8 pr-2.5 rounded-xl border border-slate-200 dark:border-border bg-[#f0f2f5]/80 dark:bg-black/20 text-xs placeholder:text-muted-foreground focus:outline-none focus:border-slate-400"
                                        />
                                      </div>
                                    </div>

                                    {/* Category Pills: Wrap cleanly without any scrollbar */}
                                    <div className="flex flex-wrap gap-1 pb-1.5 text-[11px]">
                                      {[
                                        { id: "todo", label: "Todo" },
                                        { id: "emociones", label: "😊 Emociones" },
                                        { id: "naturaleza", label: "🌲 Naturaleza" },
                                        { id: "viaje", label: "✈️ Viaje" },
                                      ].map((cat) => {
                                        const isActive = emojiCategory === cat.id
                                        return (
                                          <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setEmojiCategory(cat.id)}
                                            className={cn(
                                              "px-3 py-1 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer text-[11px]",
                                              isActive
                                                ? "bg-[#105238] text-white shadow-2xs"
                                                : "bg-[#f0f2f5] hover:bg-[#e4e6eb] dark:bg-black/20 dark:hover:bg-black/30 text-slate-700 dark:text-slate-300",
                                            )}
                                          >
                                            {cat.label}
                                          </button>
                                        )
                                      })}
                                    </div>

                                    {/* Emojis Grid: with scrollbar-hide */}
                                    <div className="max-h-52 overflow-y-auto scrollbar-hide pt-1">
                                      <div className="grid grid-cols-6 gap-1.5 justify-items-center">
                                        {filteredEmojis.map((emoji, idx) => (
                                          <button
                                            key={`${emoji}-${idx}`}
                                            type="button"
                                            onClick={() => {
                                              setCommentDrafts((prev) => ({
                                                ...prev,
                                                [service.id]: (prev[service.id] || "") + emoji,
                                              }))
                                            }}
                                            className="w-9 h-9 rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-white/10 text-xl flex items-center justify-center transition-transform hover:scale-125 cursor-pointer"
                                          >
                                            {emoji}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* FLOATING POPOVER: BANDERAS DEL MUNDO (ESTILO IMAGEN 4 CON FLECHAS CIRCULARES ESTÁNDAR) */}
                                {commentPickerMode === "country" && (
                                  <div className="comment-picker-popover absolute bottom-full left-0 mb-3 w-[330px] max-w-[92vw] bg-white dark:bg-[#242526] rounded-2xl border border-border shadow-[0_16px_40px_rgba(0,0,0,0.25)] p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 after:content-[''] after:absolute after:top-full after:left-24 after:border-[7px] after:border-transparent after:border-t-white dark:after:border-t-[#242526]">
                                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                        <Flag className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                                        <span>Banderas del mundo</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setCommentPickerMode(null)}
                                        className="text-xs text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                                      >
                                        ✕
                                      </button>
                                    </div>

                                    {/* Search & Style Switch (Imagen 4) */}
                                    <div className="pt-2 pb-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <div className="relative flex-1">
                                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                          <input
                                            type="text"
                                            value={flagSearchQuery}
                                            onChange={(e) => {
                                              setFlagSearchQuery(e.target.value)
                                              setFlagCarouselPage(0)
                                            }}
                                            placeholder="Buscar país..."
                                            className="w-full h-8 pl-8 pr-2.5 rounded-xl border border-slate-200 dark:border-border bg-[#f0f2f5]/80 dark:bg-black/20 text-xs placeholder:text-muted-foreground focus:outline-none focus:border-slate-400"
                                          />
                                        </div>
                                        <div className="flex items-center gap-0.5 bg-[#f0f2f5] dark:bg-black/20 p-0.5 rounded-xl border border-black/5 shrink-0">
                                          <span className="w-6 h-6 rounded-lg bg-[#105238] text-white flex items-center justify-center">
                                            <Flag className="w-3 h-3 fill-current" />
                                          </span>
                                          <span className="w-6 h-6 rounded-lg text-slate-500 hover:text-slate-800 flex items-center justify-center">
                                            <Globe className="w-3 h-3" />
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Continents slider with standard PalenqueGo circular arrows (NO scrollbar) */}
                                    <div className="flex items-center gap-1.5 py-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          flagContinentTrackRef.current?.scrollBy({ left: -120, behavior: "smooth" })
                                        }
                                        className="w-6 h-6 rounded-full bg-white dark:bg-card border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-600 hover:bg-[#f0f2f5] hover:text-slate-900 transition-all shrink-0 cursor-pointer"
                                        aria-label="Anterior"
                                      >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                      </button>

                                      <div
                                        ref={flagContinentTrackRef}
                                        className="flex-1 flex gap-1 overflow-x-auto scrollbar-hide py-0.5"
                                      >
                                        {(["Todas", "América", "Europa", "Asia", "África", "Oceanía"] as const).map(
                                          (cont) => {
                                            const isActive = flagContinent === cont
                                            return (
                                              <button
                                                key={cont}
                                                type="button"
                                                onClick={() => {
                                                  setFlagContinent(cont)
                                                  setFlagCarouselPage(0)
                                                }}
                                                className={cn(
                                                  "px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer text-[10px]",
                                                  isActive
                                                    ? "bg-[#105238] text-white shadow-2xs"
                                                    : "bg-[#f0f2f5] hover:bg-[#e4e6eb] dark:bg-black/20 dark:hover:bg-black/30 text-slate-700 dark:text-slate-300",
                                                )}
                                              >
                                                {cont}
                                              </button>
                                            )
                                          },
                                        )}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          flagContinentTrackRef.current?.scrollBy({ left: 120, behavior: "smooth" })
                                        }
                                        className="w-6 h-6 rounded-full bg-white dark:bg-card border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-600 hover:bg-[#f0f2f5] hover:text-slate-900 transition-all shrink-0 cursor-pointer"
                                        aria-label="Siguiente"
                                      >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Round Flags Carousel with standard PalenqueGo circular arrow buttons */}
                                    {filteredFlags.length === 0 ? (
                                      <div className="py-5 text-center text-xs text-muted-foreground">
                                        No se encontraron banderas
                                      </div>
                                    ) : (
                                      <div className="pt-1.5">
                                        <div className="flex items-center justify-between gap-1.5">
                                          <button
                                            type="button"
                                            disabled={flagCarouselPage === 0}
                                            onClick={() => setFlagCarouselPage((p) => Math.max(0, p - 1))}
                                            className="w-7 h-7 rounded-full bg-white dark:bg-card border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-700 hover:bg-[#f0f2f5] hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
                                            aria-label="Anterior"
                                          >
                                            <ChevronLeft className="w-4 h-4" />
                                          </button>

                                          <div className="flex-1 grid grid-cols-7 gap-1.5 justify-items-center">
                                            {paginatedFlags.map((flag) => {
                                              const isSelected =
                                                currentCountry?.code?.toLowerCase() === flag.code.toLowerCase()
                                              return (
                                                <button
                                                  key={flag.code}
                                                  type="button"
                                                  onClick={() => {
                                                    setCommentCountries((prev) => ({
                                                      ...prev,
                                                      [service.id]: {
                                                        code: flag.code.toUpperCase(),
                                                        flag: flag.name,
                                                        name: flag.name,
                                                      },
                                                    }))
                                                    setCommentPickerMode(null)
                                                  }}
                                                  className="group/flag relative p-0.5 rounded-full hover:scale-110 transition-transform cursor-pointer"
                                                  title={flag.name}
                                                >
                                                  <RoundFlagIcon
                                                    code={flag.code}
                                                    className="w-8 h-8 sm:w-9 sm:h-9"
                                                    isSelected={isSelected}
                                                  />
                                                  <span className="pointer-events-none opacity-0 group-hover/flag:opacity-100 transition-opacity absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[9px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-lg z-50">
                                                    {flag.name}
                                                  </span>
                                                </button>
                                              )
                                            })}
                                          </div>

                                          <button
                                            type="button"
                                            disabled={flagCarouselPage >= totalFlagPages - 1}
                                            onClick={() =>
                                              setFlagCarouselPage((p) => Math.min(totalFlagPages - 1, p + 1))
                                            }
                                            className="w-7 h-7 rounded-full bg-white dark:bg-card border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-700 hover:bg-[#f0f2f5] hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
                                            aria-label="Siguiente"
                                          >
                                            <ChevronRight className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* FLOATING POPOVER: UBICACIÓN (DESPRENDE HACIA ARRIBA CON BÚSQUEDA Y AUTO-DETECCIÓN) */}
                                {commentPickerMode === "location" && (
                                  <div className="comment-picker-popover absolute bottom-full left-0 mb-3 w-[330px] max-w-[92vw] bg-white dark:bg-[#242526] rounded-2xl border border-border shadow-[0_16px_40px_rgba(0,0,0,0.25)] p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 after:content-[''] after:absolute after:top-full after:left-5 after:border-[7px] after:border-transparent after:border-t-white dark:after:border-t-[#242526]">
                                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                        <MapPin className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                                        <span>Ubicación</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setCommentPickerMode(null)}
                                        className="text-xs text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                                      >
                                        ✕
                                      </button>
                                    </div>

                                    {/* Search Bar */}
                                    <div className="pt-2 pb-1.5">
                                      <div className="relative">
                                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                          type="text"
                                          value={locationSearchQuery}
                                          onChange={(e) => setLocationSearchQuery(e.target.value)}
                                          placeholder="Buscar lugar o playa..."
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" && locationSearchQuery.trim()) {
                                              setCommentLocations((prev) => ({
                                                ...prev,
                                                [service.id]: locationSearchQuery.trim(),
                                              }))
                                              setLocationSearchQuery("")
                                              setCommentPickerMode(null)
                                            }
                                          }}
                                          className="w-full h-8 pl-8 pr-2.5 rounded-xl border border-slate-200 dark:border-border bg-[#f0f2f5]/80 dark:bg-black/20 text-xs placeholder:text-muted-foreground focus:outline-none focus:border-slate-400"
                                        />
                                      </div>
                                    </div>

                                    {/* Auto-detect Location from this Experience (Sutil, no saturado de verde) */}
                                    <div className="space-y-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const autoLoc =
                                            service.location || service.businessName || "Palenque, El Salvador"
                                          setCommentLocations((prev) => ({
                                            ...prev,
                                            [service.id]: autoLoc,
                                          }))
                                          setCommentPickerMode(null)
                                        }}
                                        className="w-full flex items-center gap-2 p-2 rounded-xl bg-[#f0f2f5] hover:bg-[#e4e6eb] dark:bg-black/20 dark:hover:bg-black/30 border border-slate-200/60 dark:border-white/5 text-foreground font-semibold text-xs text-left cursor-pointer transition-colors"
                                      >
                                        <MapPin className="w-3.5 h-3.5 text-[#105238] dark:text-[#8ee01a] shrink-0" />
                                        <span className="truncate">
                                          Ubicación de la experiencia:{" "}
                                          <span className="font-bold text-[#105238] dark:text-[#8ee01a]">
                                            {service.location || service.businessName || "Palenque"}
                                          </span>
                                        </span>
                                      </button>

                                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide pt-1">
                                        Destinos populares
                                      </div>
                                      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto scrollbar-hide pt-0.5">
                                        {POPULAR_TRAVEL_LOCATIONS.filter((loc) =>
                                          loc.toLowerCase().includes(locationSearchQuery.toLowerCase()),
                                        ).map((loc) => (
                                          <button
                                            key={loc}
                                            type="button"
                                            onClick={() => {
                                              setCommentLocations((prev) => ({
                                                ...prev,
                                                [service.id]: loc,
                                              }))
                                              setCommentPickerMode(null)
                                            }}
                                            className="px-2.5 py-1 rounded-full bg-[#f0f2f5] hover:bg-[#105238] hover:text-white dark:bg-black/20 dark:hover:bg-[#105238] text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                                          >
                                            {loc}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </article>

                    {/* Spaced & Randomized Smart In-Feed Interleaving ("de vez en cuando, no siempre y aleatorios"):
                        Triggers every 6 posts with a seed-based offset so it feels organic and never repetitive */}
                    {((serviceIdx + 1 + (feedSeed % 2)) % 6 === 0) && (() => {
                      const carouselSlot = Math.floor((serviceIdx + 1 + (feedSeed % 2)) / 6) - 1
                      const hasUserLikedAny =
                        userFavorites.length > 0 ||
                        Object.values(serviceReactions).some((r) => Boolean(r?.userReaction))
                      const isTravelerWithLikesNoBooking =
                        hasUserLikedAny && userBookings.length === 0

                      const candidatePool =
                        globalCatalogPool.length > 0 ? globalCatalogPool : services

                      // Build personalized taste items based on Likes + Traveler Craving
                      const buildTasteItems = () => {
                        const likedSet = new Set<number>(
                          userFavorites.map((f: any) => (typeof f === "number" ? f : f.serviceId)),
                        )
                        const likedCats = new Set<string>()
                        for (const s of candidatePool) {
                          if (likedSet.has(s.id) || serviceReactions[s.id]?.userReaction) {
                            if (s.category) likedCats.add(s.category.toLowerCase())
                          }
                        }
                        const q = travelerCraving.toLowerCase().trim()
                        const scored = candidatePool
                          .filter((s) => s.id !== service.id)
                          .map((s) => {
                            let score = 0
                            if (travelerCravingCat && travelerCravingCat !== "all" && matchesCategory(s, travelerCravingCat)) {
                              score += 5
                            }
                            if (q && (s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q))) {
                              score += 4
                            }
                            if (s.category && likedCats.has(s.category.toLowerCase())) {
                              score += 3
                            }
                            if (likedSet.has(s.id)) {
                              score += 2
                            }
                            return { s, score }
                          })
                          .sort((a, b) => b.score - a.score)
                        return scored.map((x) => x.s).slice(0, 10)
                      }

                      // Slot 0: Traveler Likes-without-Booking Survey OR Personalized Taste Reel OR Intent Survey
                      if (carouselSlot === 0) {
                        if (hasSubmittedTravelerCraving && travelerCraving) {
                          return (
                            <PersonalizedTasteReelStrip
                              cravingLabel={travelerCraving}
                              items={buildTasteItems()}
                              onOpenService={(svc) => openServiceDetailInstant(svc)}
                              onResetCraving={() => setHasSubmittedTravelerCraving(false)}
                            />
                          )
                        }
                        if (isTravelerWithLikesNoBooking) {
                          return (
                            <TravelerDestinationSurveyCard
                              currentCraving={travelerCraving}
                              onRequestRecommendations={handleRequestTravelerRecommendations}
                            />
                          )
                        }
                        const firstReel =
                          prioritizedSmartReels[(feedSeed + batchNumber) % Math.max(1, prioritizedSmartReels.length)]
                        return (
                          <div className="space-y-4">
                            {!feedSurveyIntent && (
                              <FeedIntentSurveyCard
                                selectedIntent={feedSurveyIntent}
                                onSelectIntent={handleSelectSurveyIntent}
                              />
                            )}
                            {firstReel && <SmartAppReelStrip reel={firstReel} />}
                          </div>
                        )
                      }

                      // Randomized rotation across the 5 experience discovery formats for subsequent slots:
                      // 0 -> SmartAppReelStrip (Pools, Embajador, Go, Alianzas B2B, Equipo, Plan Bronce, Chofer)
                      // 1 -> StoresReelStrip (Reel de Tiendas Destacadas)
                      // 2 -> CategoryCarouselStrip (Otra categoría complementaria)
                      // 3 -> PersonalizedTasteReelStrip / TravelerDestinationSurveyCard (si dio Like y no ha reservado)
                      // 4 -> RoutesCarouselStrip (Rutas & Destinos Go)
                      const kindPool: Array<"APP_REEL" | "STORES_REEL" | "CATEGORY_REEL" | "TASTE_REEL" | "ROUTES_REEL"> = [
                        "STORES_REEL",
                        "CATEGORY_REEL",
                        "APP_REEL",
                        ...(isTravelerWithLikesNoBooking || hasSubmittedTravelerCraving ? (["TASTE_REEL"] as const) : []),
                        ...(routes.length > 0 ? (["ROUTES_REEL"] as const) : []),
                      ]
                      const chosenKind =
                        kindPool[(carouselSlot + (feedSeed % kindPool.length)) % kindPool.length]

                      if (chosenKind === "STORES_REEL" && businesses.length > 0) {
                        return (
                          <StoresReelStrip
                            businesses={businesses}
                            onOpenStore={(bizId) => router.push(`/b/${bizId}`)}
                            onViewAllStores={() => onNavigate?.("businesses")}
                          />
                        )
                      }

                      if (chosenKind === "TASTE_REEL") {
                        if (hasSubmittedTravelerCraving && travelerCraving) {
                          return (
                            <PersonalizedTasteReelStrip
                              cravingLabel={travelerCraving}
                              items={buildTasteItems()}
                              onOpenService={(svc) => openServiceDetailInstant(svc)}
                              onResetCraving={() => setHasSubmittedTravelerCraving(false)}
                            />
                          )
                        }
                        return (
                          <TravelerDestinationSurveyCard
                            currentCraving={travelerCraving}
                            onRequestRecommendations={handleRequestTravelerRecommendations}
                          />
                        )
                      }

                      if (chosenKind === "ROUTES_REEL" && routes.length > 0) {
                        const routeCycle: Array<"TOUR" | "URBANO" | "INTERURBANO"> = [
                          "TOUR",
                          "URBANO",
                          "INTERURBANO",
                        ]
                        const targetRouteType = routeCycle[(carouselSlot + feedSeed) % 3]
                        return (
                          <RoutesCarouselStrip
                            routes={routes}
                            routeType={targetRouteType}
                            onSelectRoute={(routeName) => {
                              useAppStore.getState().setReturnToMapRoute(routeName)
                              onNavigate?.("map-explorer")
                            }}
                            onViewAllRoutes={() => onNavigate?.("map-explorer")}
                          />
                        )
                      }

                      if (chosenKind === "APP_REEL") {
                        const reelIdx =
                          (carouselSlot + (batchNumber - 1) + (feedSeed % 5)) %
                          Math.max(1, prioritizedSmartReels.length)
                        const activeReel = prioritizedSmartReels[reelIdx]
                        return activeReel ? <SmartAppReelStrip reel={activeReel} /> : null
                      }

                      // Complementary Category Recommendation (always recommends a category DIFFERENT from selectedCategory)
                      const otherCats = discoveryCategories.filter((c) => c.id !== selectedCategory)
                      if (otherCats.length === 0) return null
                      const orderedCats =
                        preferredCategories.length > 0
                          ? [
                              ...otherCats.filter((c) => preferredCategories.includes(c.id)),
                              ...otherCats.filter((c) => !preferredCategories.includes(c.id)),
                            ]
                          : otherCats
                      const catOffset = carouselSlot + (feedSeed % orderedCats.length)
                      const targetCat = orderedCats[catOffset % orderedCats.length]
                      const catSamples = candidatePool
                        .filter((s) => matchesCategory(s, targetCat.id) && s.id !== service.id)
                        .slice(0, 10)
                      if (catSamples.length === 0) {
                        const fallbackReel =
                          prioritizedSmartReels[carouselSlot % Math.max(1, prioritizedSmartReels.length)]
                        return fallbackReel ? <SmartAppReelStrip reel={fallbackReel} /> : null
                      }
                      return (
                        <CategoryCarouselStrip
                          categoryLabel={targetCat.label}
                          categoryId={targetCat.id}
                          icon={targetCat.icon}
                          items={catSamples}
                          onSelectCategory={handleSelectCategorySmooth}
                          onOpenService={(sid) => {
                            const matched = catSamples.find((s) => s.id === sid) || sid
                            openServiceDetailInstant(matched)
                          }}
                        />
                      )
                    })()}
                  </div>
                  )
                })}

                {/* End of Category/Selection OR Cycle Wrap-Around Strategy Hub */}
                {!effectiveSearchQuery &&
                  (allUnseenExhausted ||
                    !catalogHasMore ||
                    visibleBatchServices.length < BATCH_SIZE) && (
                  <div className="bg-card border border-border rounded-3xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2">
                          <Compass className="w-4 h-4 text-[#105238] shrink-0" />
                          <span>¿Qué más te gustaría explorar hoy?</span>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          Descubre desde otro ángulo: explora en <strong>Palenque Go</strong> para crear o unirte a un <strong>Pool</strong> grupal, cambia de categoría o baraja el feed con un nuevo orden.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRestartCycle}
                        className="h-8 px-3 rounded-full border-[#aeb6a1] text-[#105238] hover:bg-[#eaf0e2] font-bold text-xs gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>Nuevo orden</span>
                      </Button>
                    </div>

                    {/* Action Banner: Palenque Go (Swiper) & Pools */}
                    <div className="p-3.5 rounded-2xl bg-[#105238] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-extrabold text-[#8ee01a] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Palenque Go & Pools en Grupo
                        </p>
                        <p className="text-[11px] text-white/90 leading-snug">
                          Dale Like en <strong>Go</strong> a lo que te encante y te avisamos al crearse un Pool, o revisa los Pools activos para ahorrar.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onNavigate?.("rutas")}
                          className="h-8 px-3.5 rounded-full bg-[#8ee01a] hover:bg-[#8ee01a]/90 text-[#105238] font-black text-xs cursor-pointer"
                        >
                          Visitar Go
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              sessionStorage.setItem("palenque_pool_subtab", "POOLS")
                            }
                            onNavigate?.("pool")
                          }}
                          className="h-8 px-3.5 rounded-full border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                        >
                          Ver Pools
                        </Button>
                      </div>
                    </div>

                    {/* Other Categories to Start a Fresh Cycle */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Explorar otra categoría
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {categories
                          .filter((c) => c.id !== selectedCategory && (c.id !== "flash" || flashServices.length > 0))
                          .map((cat) => {
                            const CatIcon = cat.icon
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleSelectCategorySmooth(cat.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#f0f2f5] text-slate-700 hover:bg-[#e4e6eb] hover:text-slate-900 transition-colors cursor-pointer"
                              >
                                <CatIcon className="w-3.5 h-3.5" />
                                <span>{cat.label}</span>
                              </button>
                            )
                          })}
                      </div>
                    </div>

                    {topRatedServices.filter((ts) => !visibleBatchServices.some((os) => os.id === ts.id)).length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {topRatedServices
                          .filter((ts) => !visibleBatchServices.some((os) => os.id === ts.id))
                          .slice(0, 4)
                          .map((ts) => (
                            <button
                              key={ts.id}
                              type="button"
                              onClick={() => openServiceDetailInstant(ts)}
                              className="flex items-center gap-3 p-2.5 rounded-2xl border border-border/70 hover:border-[#105238]/40 bg-[#fafaf8] dark:bg-background transition-colors text-left cursor-pointer"
                            >
                              <img
                                src={getProxyImage(ts.image || "") || DEFAULT_STORE_COVER}
                                alt={ts.name}
                                className="w-14 h-14 rounded-xl object-cover shrink-0"
                                onError={(e) => {
                                  e.currentTarget.src = DEFAULT_STORE_COVER
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-xs text-foreground truncate">{ts.name}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{ts.location}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs font-black text-[#105238]">${ts.price} /p</span>
                                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#105238]">
                                    <Star className="w-3 h-3 fill-[#105238]" /> {ts.rating}
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Subtle Facebook-style Scroll Sentinel (no internal batch numbers exposed) */}
                {!allUnseenExhausted &&
                  visibleBatchServices.length >= BATCH_SIZE &&
                  catalogHasMore && (
                    <div ref={sentinelRef} className="py-5 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-[#105238] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* RIGHT STICKY SIDEBAR ON DESKTOP:
              1. Publicidad ALWAYS active at the top.
              2. Ofertas Flash ONLY shown when flashServices.length > 0 (hidden completely if 0).
              3. Smart Companion Card below that alternates ONE AT A TIME as the user scrolls down
                 (Más destacados <-> Tiendas Aliadas <-> Mi Reserva), never stacking Más destacados & Tiendas Aliadas together,
                 and locking steady when the user stops scrolling or hovers to inspect. */}
          <aside
            onMouseEnter={() => setIsHoveringRightSidebar(true)}
            onMouseLeave={() => setIsHoveringRightSidebar(false)}
            className="hidden lg:block lg:w-[300px] xl:w-[320px] shrink-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto hover-scrollbar pr-1 space-y-4"
          >
            {/* 1. ALWAYS ACTIVE: Facebook-style Publicidad Zone (Rotating 2 Sponsored Experiences with Real Photos) */}
            {(() => {
              const hasRealPhoto = (s: Service) =>
                Boolean(s.image && !s.image.includes("placeholder") && s.image !== DEFAULT_STORE_COVER)
              const flashWithPhoto = flashServices.filter(hasRealPhoto)
              const poolSource = globalCatalogPool.length > 0 ? globalCatalogPool : services
              const extraWithPhoto = poolSource.filter(
                (s) => hasRealPhoto(s) && !flashWithPhoto.some((fs) => fs.id === s.id),
              )
              const adPool = [...flashWithPhoto, ...extraWithPhoto].slice(0, 12)
              if (adPool.length === 0) return null
              const firstIdx = (adRotationIndex * 2) % adPool.length
              const secondIdx = (firstIdx + 1) % adPool.length
              const visibleAds = adPool.length > 1 ? [adPool[firstIdx], adPool[secondIdx]] : [adPool[firstIdx]]
              return (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-extrabold text-muted-foreground tracking-tight">Publicidad</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-[#f0f2f5] px-2 py-0.5 rounded-full">
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
                          onClick={() => openServiceDetailInstant(ad)}
                          className="w-full flex items-center gap-3 p-2 rounded-2xl bg-card/60 hover:bg-card hover:shadow-xs border border-border/50 hover:border-slate-300 transition-all text-left cursor-pointer group/ad animate-in fade-in duration-300"
                        >
                          <div className="relative w-22 h-22 rounded-2xl overflow-hidden shrink-0 bg-muted border border-border/50">
                            <img
                              src={getProxyImage(ad.image || "") || DEFAULT_STORE_COVER}
                              alt={ad.name}
                              className="w-full h-full object-cover group-hover/ad:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_STORE_COVER
                              }}
                            />
                            <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                              -{discPct}%
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-[13px] font-extrabold text-foreground leading-snug line-clamp-2 group-hover/ad:underline transition-colors">
                              {ad.name}
                            </p>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-sm font-black text-foreground">${promoP}</span>
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

            {/* ACCESO DIRECTO SUAVE: RUTAS DE TRANSPORTE, GPS EN VIVO Y BOLETOS */}
            <div className="bg-white dark:bg-card border border-border/80 rounded-3xl p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-foreground">
                  <RouteIcon className="w-4 h-4 text-[#105238]" />
                  Rutas de Transporte
                </span>
                <span className="text-[10px] font-bold bg-[#eaf0e2] text-[#105238] px-2 py-0.5 rounded-full">
                  GPS · Safe-Flow
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                Rastrea tu ruta en vivo, compra boletos y activa seguimiento Safe-Flow.
              </p>
              <button
                type="button"
                onClick={() => onNavigate?.("rutas-classic")}
                className="w-full h-9 rounded-xl bg-[#eaf0e2]/80 hover:bg-[#eaf0e2] text-[#105238] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Abrir Feed de Rutas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. OFERTAS FLASH: Shown ONLY if the user/catalog has active flash offers (> 0). Hidden completely when 0! */}
            {flashServices.length > 0 && (
              <div className="bg-gradient-to-br from-[#eaf0e2]/80 via-white to-white dark:from-card dark:to-card border border-[#8ee01a]/70 rounded-3xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#105238] uppercase tracking-wider">
                    <span className="w-6 h-6 rounded-full bg-[#105238] text-[#8ee01a] flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 fill-[#8ee01a]" />
                    </span>
                    Ofertas Flash
                  </span>
                  <span className="text-[11px] font-bold bg-[#105238] text-[#8ee01a] px-2.5 py-0.5 rounded-full">
                    {flashServices.length} {flashServices.length === 1 ? "activa" : "activas"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cupos limitados con descuento directo antes de que expire el reloj.
                </p>
                {flashServices.slice(0, 2).map((fs) => (
                  <button
                    key={fs.id}
                    type="button"
                    onClick={() => openServiceDetailInstant(fs)}
                    className="w-full text-left bg-white dark:bg-background hover:bg-[#eaf0e2]/60 border border-border/70 rounded-2xl p-2 flex items-center justify-between gap-2.5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={getProxyImage(fs.image || "") || DEFAULT_STORE_COVER}
                        alt={fs.name}
                        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-border/50"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_STORE_COVER
                        }}
                      />
                      <span className="text-xs font-bold text-foreground truncate">{fs.name}</span>
                    </div>
                    <span className="text-xs font-black text-[#105238] shrink-0">
                      ${fs.oferta_flash?.precio_promocional} /p
                    </span>
                  </button>
                ))}
                <Button
                  type="button"
                  onClick={() => {
                    setOnlyPreferred(false)
                    setSelectedCategory((prev) => (prev === "flash" ? "all" : "flash"))
                  }}
                  className="w-full h-9 rounded-xl bg-[#105238] hover:bg-[#0c3e2b] text-[#8ee01a] font-black text-xs cursor-pointer"
                >
                  {selectedCategory === "flash" ? "Ver todas las experiencias" : "Ver promociones"}
                </Button>
              </div>
            )}

            {/* 3. CALM COMPANION ZONE (NO TABS, NO DIZZYING SLIDE ANIMATIONS):
                   - Shows Reserva pendiente / Mi próxima reserva if the user has one.
                   - Below it, shows EITHER Más destacados OR Tiendas Aliadas (never stacked together),
                     transitioning softly via opacity only after 30+ seconds and 2200px of scroll once scrolling stops. */}
            {primaryBooking && (
              <div className="bg-card border border-border rounded-3xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <span>
                      {primaryBooking.status === "PENDIENTE" ? "Reserva pendiente" : "Mi próxima reserva"}
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => onNavigate?.("pool")}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                  >
                    Ver todas ({userBookings.length})
                  </button>
                </div>
                <div className="flex items-center gap-3 bg-[#f7f8fa] dark:bg-background border border-border/70 rounded-2xl p-3">
                  <img
                    src={primaryBooking.service?.image || DEFAULT_STORE_COVER}
                    alt={primaryBooking.service?.name || "Reserva"}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-foreground truncate">
                      {primaryBooking.service?.name || "Experiencia"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {primaryBooking.date} · {primaryBooking.time}
                    </p>
                    <p className="text-[11px] font-black text-foreground mt-0.5">
                      Total: ${primaryBooking.totalPrice}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => onNavigate?.("pool")}
                  className="w-full h-9 rounded-xl bg-[#f0f2f5] hover:bg-[#e4e6eb] text-slate-900 font-bold text-xs cursor-pointer shadow-none border-0"
                >
                  Ver Voucher / Pagar
                </Button>
              </div>
            )}

            {(() => {
              const showStoresNow = businesses.length > 0 && rightCompanionIndex % 2 === 1

              if (showStoresNow) {
                return (
                  <div
                    key="companion-stores"
                    className="bg-card border border-border rounded-3xl p-4 shadow-2xs space-y-3 animate-in fade-in duration-700"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                        <StoreIcon className="w-4 h-4 text-[#105238]" />
                        <span>Tiendas Aliadas</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => onNavigate?.("businesses")}
                        className="text-xs font-bold text-[#105238] hover:underline cursor-pointer"
                      >
                        Ver todas
                      </button>
                    </div>
                    <div className="space-y-2">
                      {businesses.slice(0, 4).map((biz) => (
                        <button
                          key={biz.id}
                          type="button"
                          onClick={() => router.push(`/b/${biz.id}`)}
                          className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-muted/50 transition-colors text-left cursor-pointer"
                        >
                          <Avatar className="w-9 h-9 border border-[#105238]/30 shrink-0">
                            <AvatarImage src={biz.logo} alt={biz.name} />
                            <AvatarFallback className="bg-[#105238] text-white text-[10px] font-bold">
                              {biz.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-foreground truncate">{biz.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {biz.category || "Comercio Aliado"}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key="companion-featured"
                  className="bg-card border border-border rounded-3xl p-4 shadow-2xs space-y-3 animate-in fade-in duration-700"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#105238]" />
                      <span>Más destacados</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      {selectedCategory !== "all" && (
                        <button
                          type="button"
                          onClick={() => handleSelectCategorySmooth("all")}
                          className="text-xs font-bold text-[#105238] hover:underline cursor-pointer"
                        >
                          Ver todos
                        </button>
                      )}
                      {filteredServices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setShowComparisonModal(true)}
                          className="text-xs font-bold text-[#105238] hover:underline cursor-pointer"
                        >
                          Comparar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {topRatedServices.slice(0, 4).map((ts) => (
                      <button
                        key={ts.id}
                        type="button"
                        onClick={() => openServiceDetailInstant(ts)}
                        className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-muted/50 transition-colors text-left cursor-pointer"
                      >
                        <img
                          src={ts.image || DEFAULT_STORE_COVER}
                          alt={ts.name}
                          className="w-11 h-11 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-foreground truncate">{ts.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{ts.location}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#105238]">
                            <Star className="w-3 h-3 fill-[#105238]" /> {ts.rating}
                          </span>
                          <p className="text-xs font-black text-foreground">${ts.price} /p</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })()}
          </aside>
        </div>
      </div>

      {/* Preferences Modal */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-lg text-foreground">Personaliza tus Experiencias</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Elige tus intereses para mostrarte primero las publicaciones que más van contigo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferencesModal(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories
                .filter((c) => c.id !== "all")
                .map((cat) => {
                  const Icon = cat.icon
                  const selected = preferredCategories.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        setPreferredCategories((prev) =>
                          prev.includes(cat.id) ? prev.filter((x) => x !== cat.id) : [...prev, cat.id],
                        )
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer",
                        selected
                          ? "bg-[#105238] text-[#8ee01a] border-[#105238]"
                          : "bg-background text-foreground border-border hover:bg-muted",
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  savePreferences([])
                  setOnlyPreferred(false)
                }}
                className="flex-1 h-11 rounded-2xl font-bold text-xs cursor-pointer"
              >
                Ver todo
              </Button>
              <Button
                type="button"
                onClick={() => savePreferences(preferredCategories)}
                className="flex-1 h-11 rounded-2xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold text-xs cursor-pointer"
              >
                Guardar preferencias
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          INTERACTIVE EXPERIENCE LIGHTBOX MODAL (TIKTOK + SPLIT DETAIL VIEW)
         ===================================================================== */}
      {lightboxActiveService && (() => {
        const activeSvc = lightboxActiveService
        const hasFlash = Boolean(
          activeSvc.oferta_flash && (activeSvc.oferta_flash.cupos_disponibles ?? 0) > 0,
        )
        const baseP = Number(activeSvc.price) || 0
        const flashDisc = activeSvc.oferta_flash?.descuento_porcentaje || activeSvc.discount || 0
        const promoP = activeSvc.oferta_flash?.precio_promocional
          ? Number(activeSvc.oferta_flash.precio_promocional)
          : baseP * (1 - flashDisc / 100)
        const effectivePrice = hasFlash ? promoP : baseP

        const rawPhotos = [
          activeSvc.image,
          ...(Array.isArray(activeSvc.galleryImages) ? activeSvc.galleryImages : []),
        ]
          .map((img) => getProxyImage(img || ""))
          .filter(Boolean)
        const allPhotos = rawPhotos.length > 0 ? Array.from(new Set(rawPhotos)) : [DEFAULT_STORE_COVER]
        const safePhotoIdx = lightboxPhotoIdx % allPhotos.length
        const currentPhotoUrl = allPhotos[safePhotoIdx] || DEFAULT_STORE_COVER

        const isFav = userFavorites.some((f: any) => (typeof f === "number" ? f : f.serviceId) === activeSvc.id)
        const reactState = serviceReactions[activeSvc.id] || {
          counts: { trato: 0, divertido: 0, fascino: 0, quiero_ir: 0, recomiendo: 0 },
          userReaction: null,
        }
        const totalReacts = Object.values(reactState.counts).reduce((a, b) => a + b, 0)
        const totalLikesAndReacts = totalReacts + (isFav ? 1 : 0)
        const commentsList = serviceComments[activeSvc.id] || []
        const currentFeedPos = visibleBatchServices.findIndex((s) => s.id === activeSvc.id)

        return (
          <>
            {/* MOBILE-ONLY: Full-Screen 100dvh TikTok/Reels Experience Lightbox */}
            <MobileExperienceReelsModal
              service={activeSvc}
              allPhotos={allPhotos}
              safePhotoIdx={safePhotoIdx}
              setPhotoIdx={setLightboxPhotoIdx}
              isFav={isFav}
              totalLikesAndReacts={totalLikesAndReacts}
              commentsCount={commentsList.length}
              currentFeedPos={currentFeedPos}
              totalFeedCount={visibleBatchServices.length}
              hasFlash={hasFlash}
              basePrice={baseP}
              effectivePrice={effectivePrice}
              defaultCover={DEFAULT_STORE_COVER}
              reactions={REACTIONS}
              reactState={reactState}
              renderReactionIcon={(type, animated) => (
                <ReactionBadgeIcon type={type as any} size="sm" animated={animated} />
              )}
              onClose={() => setLightboxServiceId(null)}
              onStepService={handleStepLightboxService}
              onToggleFavorite={toggleFavoritePreference}
              onToggleReaction={(id, rId) => toggleServiceReaction(id, rId as any)}
              onOpenFullDetail={(svc) => {
                setLightboxServiceId(null)
                openServiceDetailInstant(svc)
              }}
              onOpenBusiness={(businessId) => {
                setLightboxServiceId(null)
                router.push(`/b/${businessId}`)
              }}
              onOpenRoutes={(svc) => setServiceForRoutes(svc)}
              onOpenBooking={(svc) => setSelectedService(svc)}
            />

            {/* DESKTOP / TABLET (sm:+): Existing Split Lightbox 100% Untouched */}
            <div
              onClick={() => setLightboxServiceId(null)}
              className="hidden sm:flex fixed inset-0 z-50 bg-black/85 backdrop-blur-md items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200"
            >
            {/* TikTok/Facebook-style Neutral Up / Down Floating Arrows on the Right */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="fixed right-3 sm:right-5 xl:right-8 top-1/2 -translate-y-1/2 z-[60] flex flex-col items-center gap-3"
            >
              <button
                type="button"
                onClick={() => handleStepLightboxService("prev")}
                title="Experiencia anterior (Flecha Arriba)"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-slate-800 border border-black/10 shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              {currentFeedPos >= 0 && (
                <span className="text-[10px] font-bold text-white/90 bg-neutral-900/80 px-2.5 py-0.5 rounded-full border border-white/15">
                  {currentFeedPos + 1}/{visibleBatchServices.length}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleStepLightboxService("next")}
                title="Siguiente experiencia (Flecha Abajo)"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-slate-800 border border-black/10 shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
            </div>

            {/* Main Split Lightbox Container (Dark Neutral Obsidian + Clean White/Bone Highlights) */}
            <div
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "overflow-hidden shadow-[0_28px_90px_rgba(0,0,0,0.8)] border border-white/15 bg-[#141517] grid grid-cols-1 lg:grid-cols-12 relative transition-all duration-200",
                isLightboxPhotoFullscreen
                  ? "w-[96vw] h-[94vh] max-w-none max-h-none rounded-3xl mr-12 sm:mr-16"
                  : "w-full max-w-[1120px] h-[90vh] lg:h-[85vh] max-h-[760px] rounded-[28px] sm:rounded-[32px] mr-10 sm:mr-14 lg:mr-12",
              )}
            >
              {/* LEFT COLUMN: Interactive Photo & Multi-Image Gallery Viewer */}
              <div
                className={cn(
                  "relative bg-[#0c0d0e] flex flex-col justify-between overflow-hidden select-none",
                  isLightboxPhotoFullscreen
                    ? "lg:col-span-12 h-full"
                    : "lg:col-span-6 h-[38vh] sm:h-[42vh] lg:h-full",
                )}
              >
                {/* Blurred ambient background of current photo */}
                <img
                  src={currentPhotoUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-110 pointer-events-none"
                />

                {/* Main Crisp Image */}
                <img
                  src={currentPhotoUrl}
                  alt={activeSvc.name}
                  onDoubleClick={() => setIsLightboxPhotoFullscreen((prev) => !prev)}
                  className="relative z-10 w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_STORE_COVER
                  }}
                />

                {/* Top Overlay on Image: Category + Photo Counter + Heart Likes + Fullscreen Toggle */}
                <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-black/65 backdrop-blur-md text-white border border-white/15 text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                      {activeSvc.category || "Experiencia"}
                    </span>
                    {allPhotos.length > 1 && (
                      <span className="bg-black/65 backdrop-blur-md text-white/90 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/15">
                        Foto {safePhotoIdx + 1} de {allPhotos.length}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleFavoritePreference(activeSvc.id)}
                      className={cn(
                        "h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-lg border transition-all cursor-pointer",
                        isFav
                          ? "bg-white text-[#105238] border-white"
                          : "bg-black/65 hover:bg-black/80 text-white border-white/20",
                      )}
                      title="Dar Me Gusta / Guardar en Mis Likes"
                    >
                      <Heart className={cn("w-4 h-4", isFav && "fill-[#105238] text-[#105238]")} />
                      <span>{totalLikesAndReacts > 0 ? totalLikesAndReacts : "Like"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsLightboxPhotoFullscreen((prev) => !prev)}
                      className={cn(
                        "h-9 px-3 rounded-full border flex items-center gap-1.5 text-xs font-bold shadow-lg transition-colors cursor-pointer",
                        isLightboxPhotoFullscreen
                          ? "bg-white text-slate-900 border-white"
                          : "w-9 px-0 justify-center bg-black/65 hover:bg-black/85 text-white border-white/20",
                      )}
                      title={
                        isLightboxPhotoFullscreen
                          ? "Restaurar vista con detalles"
                          : "Ver imagen en pantalla grande completa"
                      }
                    >
                      {isLightboxPhotoFullscreen ? (
                        <>
                          <Minimize2 className="w-4 h-4" />
                          <span>Reducir</span>
                        </>
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </button>

                    {isLightboxPhotoFullscreen && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsLightboxPhotoFullscreen(false)
                          setLightboxServiceId(null)
                        }}
                        className="w-9 h-9 rounded-full bg-black/65 hover:bg-white/20 text-white border border-white/25 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                        title="Cerrar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Left / Right Neutral Arrows for Internal Service Photos */}
                {allPhotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxPhotoIdx((prev) => (prev - 1 + allPhotos.length) % allPhotos.length)
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-slate-800 border border-black/10 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                      aria-label="Foto anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLightboxPhotoIdx((prev) => (prev + 1) % allPhotos.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-slate-800 border border-black/10 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                      aria-label="Siguiente foto"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Bottom Overlay on Image: Thumbnails Strip + Subtle Pool & Routes Badges */}
                <div className="absolute bottom-3 left-3.5 right-3.5 z-20 space-y-2">
                  {allPhotos.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1">
                      {allPhotos.map((pUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLightboxPhotoIdx(idx)}
                          className={cn(
                            "w-11 h-11 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer",
                            idx === safePhotoIdx
                              ? "border-white scale-105 shadow-md"
                              : "border-white/30 opacity-60 hover:opacity-100",
                          )}
                        >
                          <img src={pUrl} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-black/65 backdrop-blur-md text-white border border-white/15 text-[11px] font-semibold px-3 py-1 rounded-full shadow-md inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#8ee01a]" />
                      <span>
                        {activeSvc.hasActivePool
                          ? `Pool disponible · ${activeSvc.spotsLeft || 3} cupos`
                          : "Ahorra en grupo con Pool"}
                      </span>
                    </span>

                    {activeSvc.routes && activeSvc.routes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setServiceForRoutes(activeSvc)}
                        className="bg-white/95 text-slate-800 text-[11px] font-bold px-3 py-1 rounded-full shadow-md inline-flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin className="w-3 h-3 text-[#105238]" />
                        <span>{activeSvc.routes.length} rutas</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Sleek Dark Neutral Panel (#18191a) with White/Bone Contrast & Subtle Green Accents */}
              {!isLightboxPhotoFullscreen && (
              <div className="lg:col-span-6 flex flex-col h-[52vh] sm:h-[48vh] lg:h-full bg-[#18191a] text-white overflow-hidden">
                {/* Top Header inside Right Panel */}
                <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3 shrink-0 bg-[#141516]">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                        EXPERIENCIA PALENQUEGO
                      </span>
                      <span className="text-white/30">·</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (activeSvc.businessId) {
                            setLightboxServiceId(null)
                            router.push(`/b/${activeSvc.businessId}`)
                          }
                        }}
                        className="text-xs font-bold text-white/90 hover:text-white hover:underline truncate cursor-pointer"
                      >
                        {activeSvc.businessName || "Comercio Aliado"}
                      </button>
                    </div>
                    <h2
                      onClick={() => {
                        setLightboxServiceId(null)
                        openServiceDetailInstant(activeSvc)
                      }}
                      className="text-lg sm:text-xl font-black text-white hover:underline transition-colors cursor-pointer leading-snug"
                    >
                      {activeSvc.name}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-neutral-300 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{activeSvc.location}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 bg-white/10 text-white px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                        <Star className="w-3 h-3 fill-white text-white" />
                        <span>{activeSvc.rating}</span>
                        <span className="text-neutral-300">({activeSvc.reviews || commentsList.length})</span>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLightboxServiceId(null)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    aria-label="Cerrar modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                  {/* Card 1: Descripción & Detalles de la Experiencia */}
                  <div className="rounded-2xl bg-[#242526] border border-white/10 p-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      SOBRE ESTA EXPERIENCIA
                    </p>
                    <p
                      className={cn(
                        "text-xs sm:text-sm text-neutral-100 leading-relaxed whitespace-pre-line",
                        !expandLightboxDesc && "line-clamp-3",
                      )}
                    >
                      {activeSvc.description ||
                        "Vive una experiencia auténtica en El Salvador con atención verificada por la red PalenqueGo."}
                    </p>
                    {(activeSvc.description?.length || 0) > 140 && (
                      <button
                        type="button"
                        onClick={() => setExpandLightboxDesc((prev) => !prev)}
                        className="text-xs font-bold text-white hover:underline cursor-pointer"
                      >
                        {expandLightboxDesc ? "Ver menos ▲" : "Ver más ▼"}
                      </button>
                    )}
                  </div>

                  {/* Card 2: Galería Interna & Características Incluidas */}
                  {(allPhotos.length > 1 ||
                    (activeSvc.features && activeSvc.features.length > 0) ||
                    (activeSvc.routes && activeSvc.routes.length > 0)) && (
                    <div className="space-y-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Galería y Características de la Experiencia</span>
                      </p>

                      {allPhotos.length > 1 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {allPhotos.slice(0, 6).map((imgUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setLightboxPhotoIdx(idx)}
                              className={cn(
                                "rounded-2xl overflow-hidden border transition-all text-left bg-[#242526] group cursor-pointer",
                                idx === safePhotoIdx
                                  ? "border-white ring-2 ring-white/30"
                                  : "border-white/10 hover:border-white/35",
                              )}
                            >
                              <div className="h-24 w-full overflow-hidden">
                                <img
                                  src={imgUrl}
                                  alt={`${activeSvc.name} ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <div className="px-2.5 py-1.5 flex items-center justify-between text-[10px] font-bold text-neutral-200">
                                <span>Vista #{idx + 1}</span>
                                {idx === safePhotoIdx && <span className="text-white font-extrabold">Activa</span>}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {activeSvc.features && activeSvc.features.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {activeSvc.features.map((feat, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#242526] text-neutral-200 border border-white/10 px-2.5 py-1 rounded-xl"
                            >
                              <Check className="w-3 h-3 text-[#8ee01a]" />
                              <span>{feat}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card 3: Reacciones de Viajeros y Likes */}
                  <div className="rounded-2xl bg-[#242526] border border-white/10 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                        REACCIONES Y LIKES DE VIAJEROS
                      </span>
                      <span className="text-xs font-bold text-neutral-300">
                        {totalLikesAndReacts} {totalLikesAndReacts === 1 ? "interacción" : "interacciones"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {REACTIONS.map((r) => {
                        const isSelected = reactState.userReaction === r.id
                        const count = reactState.counts[r.id] || 0
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => toggleServiceReaction(activeSvc.id, r.id)}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border",
                              isSelected
                                ? "bg-white text-slate-900 border-white shadow-sm"
                                : "bg-[#3a3b3c] hover:bg-[#4e4f50] text-neutral-100 border-transparent",
                            )}
                          >
                            <ReactionBadgeIcon type={r.id} size="sm" animated={isSelected} />
                            <span>{r.label}</span>
                            {count > 0 && <span className="font-black">({count})</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Extras / Productos del Servicio con Imagen */}
                  {activeSvc.extras && activeSvc.extras.length > 0 && (
                    <div className="rounded-2xl bg-[#242526] border border-white/10 p-4 space-y-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 block">
                        PRODUCTOS Y EXTRAS DEL SERVICIO ({activeSvc.extras.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {activeSvc.extras.map((extra) => (
                          <div
                            key={extra.id}
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-[#18191a] border border-white/10"
                          >
                            {extra.image && (
                              <div className="w-11 h-11 rounded-lg overflow-hidden bg-white/10 shrink-0 border border-white/15">
                                <img
                                  src={extra.image}
                                  alt={extra.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-white truncate">{extra.name}</p>
                              {extra.description && (
                                <p className="text-[10px] text-neutral-400 line-clamp-1">{extra.description}</p>
                              )}
                              <p className="text-[11px] font-black text-white">+${extra.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Card 4: Comentarios y Experiencias Vividas */}
                  <div className="rounded-2xl bg-[#242526] border border-white/10 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                        EXPERIENCIAS VIVIDAS Y OPINIONES ({commentsList.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setServiceToRate(activeSvc)}
                        className="text-xs font-bold text-white hover:underline cursor-pointer"
                      >
                        Calificar con estrellas
                      </button>
                    </div>

                    {/* Inline Star Selector + Comment Input */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((starVal) => (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setCommentRatings((prev) => ({ ...prev, [activeSvc.id]: starVal }))}
                          className="cursor-pointer"
                        >
                          <Star
                            className={cn(
                              "w-4 h-4",
                              starVal <= (commentRatings[activeSvc.id] || 5)
                                ? "fill-white text-white"
                                : "text-white/25",
                            )}
                          />
                        </button>
                      ))}
                      <span className="text-[11px] text-neutral-300 ml-1">
                        ({commentRatings[activeSvc.id] || 5}/5)
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentDrafts[activeSvc.id] || ""}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({ ...prev, [activeSvc.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleAddServiceComment(activeSvc.id)}
                        placeholder="Escribe tu opinión o experiencia vivida..."
                        className="flex-1 h-9 px-3 rounded-xl border border-white/15 bg-[#18191a] text-xs text-white placeholder:text-neutral-400 focus:outline-none focus:border-white/40"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddServiceComment(activeSvc.id)}
                        className="h-9 px-3.5 rounded-xl bg-white hover:bg-neutral-200 text-slate-900 text-xs font-bold cursor-pointer"
                      >
                        Publicar
                      </Button>
                    </div>

                    {commentsList.length > 0 ? (
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {commentsList.map((c) => (
                          <div
                            key={c.id}
                            className="bg-[#18191a] border border-white/10 rounded-xl px-3.5 py-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">{c.author}</span>
                              <div className="flex items-center gap-2">
                                {c.rating && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-white">
                                    <Star className="w-3 h-3 fill-white" /> {c.rating}
                                  </span>
                                )}
                                <span className="text-[10px] text-neutral-400">{c.createdAt}</span>
                              </div>
                            </div>
                            <p className="text-neutral-200 mt-0.5">{c.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400">
                        Sé el primero en compartir qué te pareció esta experiencia.
                      </p>
                    )}
                  </div>
                </div>

                {/* Sticky Bottom Booking Bar inside Right Panel (Dark neutral bar + Bone "Más información" + Primary Green CTA) */}
                <div className="px-5 py-3.5 border-t border-white/10 bg-[#141516] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div>
                    <p className="text-[11px] text-neutral-400 font-medium">¿Te gustaría vivir esta experiencia?</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-black text-white">Reserva tu cupo ahora</span>
                      <span className="text-base font-black text-[#8ee01a]">
                        ${effectivePrice.toFixed(2)} /p
                      </span>
                      {hasFlash && (
                        <span className="text-xs line-through text-neutral-500">${baseP.toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setLightboxServiceId(null)
                        openServiceDetailInstant(activeSvc)
                      }}
                      className="h-10 px-3.5 rounded-2xl border-transparent bg-[#f0f2f5] hover:bg-[#e4e6eb] text-slate-900 font-bold text-xs gap-1.5 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-700" />
                      <span>Más información</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setSelectedService(activeSvc)
                      }}
                      className="h-10 px-5 rounded-2xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-black text-xs sm:text-sm shadow-lg cursor-pointer"
                    >
                      Reservar Ahora
                    </Button>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
          </>
        )
      })()}

      {/* Followed Business Promo Video Story Player Modal */}
      {activeFeedStoryItem && (() => {
        const currentStory = activeFeedStoryItem.stories[activeFeedStoryItem.storyIdx]
        if (!currentStory) return null
        return (
          <div
            className="fixed inset-0 z-[130] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
            onClick={() => setActiveFeedStoryItem(null)}
          >
            <div
              className="relative w-full max-w-[400px] h-[82vh] max-h-[720px] bg-black rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Story Progress Bars */}
              <div className="absolute top-0 inset-x-0 z-20 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <div className="flex gap-1.5 mb-3">
                  {activeFeedStoryItem.stories.map((st, idx) => (
                    <div key={st.id || idx} className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          idx <= activeFeedStoryItem.storyIdx ? "w-full bg-[#8ee01a]" : "w-0",
                        )}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      const bId = activeFeedStoryItem.businessId
                      setActiveFeedStoryItem(null)
                      router.push(`/b/${bId}?from=marketplace`)
                    }}
                    className="flex items-center gap-2.5 text-left cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-[#8ee01a] bg-[#105238] flex items-center justify-center text-white font-black text-xs">
                      {activeFeedStoryItem.businessLogo ? (
                        <img
                          src={activeFeedStoryItem.businessLogo}
                          alt={activeFeedStoryItem.businessName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        activeFeedStoryItem.businessName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white leading-tight hover:underline">
                        {activeFeedStoryItem.businessName}
                      </p>
                      <p className="text-[10px] text-[#8ee01a] font-bold">
                        {currentStory.titulo || "Promo del día"}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFeedStoryItem(null)}
                    className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Video Player */}
              <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                <video
                  key={currentStory.video_cloudinary_url}
                  src={currentStory.video_cloudinary_url}
                  poster={currentStory.thumbnail_url || undefined}
                  controls
                  autoPlay
                  playsInline
                  onEnded={() => {
                    if (activeFeedStoryItem.storyIdx < activeFeedStoryItem.stories.length - 1) {
                      setActiveFeedStoryItem({
                        ...activeFeedStoryItem,
                        storyIdx: activeFeedStoryItem.storyIdx + 1,
                      })
                    }
                  }}
                  className="w-full h-full object-contain"
                />

                {activeFeedStoryItem.storyIdx > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveFeedStoryItem({
                        ...activeFeedStoryItem,
                        storyIdx: activeFeedStoryItem.storyIdx - 1,
                      })
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {activeFeedStoryItem.storyIdx < activeFeedStoryItem.stories.length - 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveFeedStoryItem({
                        ...activeFeedStoryItem,
                        storyIdx: activeFeedStoryItem.storyIdx + 1,
                      })
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Footer Action to Visit Store */}
              <div className="p-3.5 bg-[#091f16] border-t border-white/15 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-white truncate">
                  {currentStory.titulo || activeFeedStoryItem.businessName}
                </span>
                <Button
                  size="sm"
                  onClick={() => {
                    const bId = activeFeedStoryItem.businessId
                    setActiveFeedStoryItem(null)
                    router.push(`/b/${bId}?from=marketplace`)
                  }}
                  className="bg-[#8ee01a] hover:bg-[#8ee01a]/90 text-[#105238] font-black text-xs h-8 px-3.5 rounded-xl shrink-0 cursor-pointer"
                >
                  Ver Negocio
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Existing Modals Preserved */}
      {selectedService && <BookingModal service={selectedService} onClose={() => setSelectedService(null)} />}

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

      {serviceForRoutes && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#105238]" />
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
                "{typeof serviceForRoutes.name === "object" ? (serviceForRoutes.name as any).nombre : serviceForRoutes.name}" está disponible en las siguientes rutas turísticas:
              </p>

              <div className="flex flex-col gap-3">
                {serviceForRoutes.routes?.map((route: any) => (
                  <button
                    key={route.id}
                    onClick={() => {
                      setServiceForRoutes(null)
                      useAppStore.getState().setReturnToMapRoute(route.name)
                      onNavigate?.("map-explorer")
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-[#105238]/20 bg-[#eaf0e2]/60 hover:bg-[#eaf0e2] transition-colors group text-left cursor-pointer"
                  >
                    <span className="font-semibold text-[#105238]">{route.name}</span>
                    <MapPin className="w-4 h-4 text-[#105238]/60 group-hover:text-[#105238] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BLURRED-BACKDROP MODAL: PUBLICAR EXPERIENCIA VIVIDA + CALIFICACION REAL */}
      {showPublishModal && (
        <div
          onClick={() => setShowPublishModal(false)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-[#fafaf8] dark:bg-card">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[#105238] text-[#8ee01a] flex items-center justify-center">
                  <Star className="w-4 h-4 fill-[#8ee01a]" />
                </span>
                <div>
                  <h3 className="font-black text-base text-foreground">Publicar experiencia vivida</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Tu comentario y estrellas se guardan directo en la experiencia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishTravelerPost} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto hover-scrollbar">
              {/* Step 1: Mandatory Search & Select Lived Experience */}
              <div className="space-y-2">
                <label className="text-sm sm:text-[15px] font-semibold text-slate-800 dark:text-foreground flex items-center justify-between">
                  <span>1. ¿Qué lugar o experiencia visitaste? *</span>
                  <span className="text-[10px] font-bold text-[#105238] bg-[#eaf0e2] px-2 py-0.5 rounded-full">
                    Requerido
                  </span>
                </label>

                {selectedPublishService ? (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#eaf0e2]/70 border border-[#105238]/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={selectedPublishService.image || DEFAULT_STORE_COVER}
                        alt={selectedPublishService.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-[#105238] truncate">
                          {selectedPublishService.name}
                        </p>
                        <p className="text-[11px] text-[#105238]/75 truncate">
                          {selectedPublishService.location}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPublishService(null)}
                      className="text-xs font-bold text-[#105238] bg-white px-2.5 py-1 rounded-xl border border-[#105238]/20 hover:bg-[#105238] hover:text-white transition-colors shrink-0 cursor-pointer"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={publishSearchQuery}
                        onChange={(e) => setPublishSearchQuery(e.target.value)}
                        placeholder="Escribe el nombre del lugar, restaurante, tour o hotel..."
                        className="w-full h-11 pl-10 pr-8 rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:ring-0"
                        autoFocus
                      />
                      {isSearchingPublish && (
                        <Loader2 className="w-4 h-4 animate-spin text-[#105238] absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>

                    <div className="max-h-44 overflow-y-auto hover-scrollbar border border-border/70 rounded-2xl divide-y divide-border/50 bg-background">
                      {publishSearchResults.length === 0 ? (
                        <p className="p-3 text-xs text-muted-foreground text-center">
                          No encontramos experiencias con ese nombre. Prueba otra palabra.
                        </p>
                      ) : (
                        publishSearchResults.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedPublishService(item)}
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-[#eaf0e2]/60 transition-colors text-left cursor-pointer"
                          >
                            <img
                              src={item.image || DEFAULT_STORE_COVER}
                              alt={item.name}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 bg-muted"
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_STORE_COVER
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {item.location} · {item.category}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-[#105238] bg-[#eaf0e2] px-2 py-0.5 rounded-full shrink-0">
                              Elegir
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Star Rating + 3D Green Reaction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-[#fafaf8] dark:bg-background border border-border/80 rounded-2xl p-3 space-y-1.5">
                  <span className="text-sm font-semibold text-slate-800 dark:text-foreground block">2. Calificación</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPublishRating(n)}
                        className="p-0.5 cursor-pointer hover:scale-110 transition-transform"
                      >
                        <Star
                          className={cn(
                            "w-5 h-5",
                            n <= publishRating ? "fill-[#105238] text-[#105238]" : "text-muted-foreground/35",
                          )}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-black text-[#105238] ml-1">{publishRating}/5</span>
                  </div>
                </div>

                <div className="bg-[#fafaf8] dark:bg-background border border-border/80 rounded-2xl p-3 space-y-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-foreground block">¿Cómo te sentiste?</span>
                  <div className="w-full flex items-center justify-between gap-1.5 pt-1">
                    {REACTIONS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setPublishReaction((prev) => (prev === r.id ? null : r.id))}
                        aria-label={r.label}
                        className={cn(
                          "group/modalreact relative rounded-full transition-transform duration-200 hover:scale-125 hover:-translate-y-1 cursor-pointer focus:outline-none",
                          publishReaction === r.id
                            ? "scale-110 ring-2 ring-[#8ee01a] ring-offset-2 ring-offset-white dark:ring-offset-card"
                            : "opacity-75 hover:opacity-100",
                        )}
                      >
                        <span className="pointer-events-none opacity-0 group-hover/modalreact:opacity-100 transition-opacity duration-150 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg z-20">
                          {r.label}
                        </span>
                        <ReactionBadgeIcon type={r.id} size="md" animated={publishReaction === r.id} animateOnHover />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3: Story Text (no photos for now) */}
              <div className="space-y-1.5">
                <label className="text-sm sm:text-[15px] font-semibold text-slate-800 dark:text-foreground block">
                  3. Cuéntale a otros viajeros cómo te fue
                </label>
                <textarea
                  rows={4}
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  placeholder="¿Qué fue lo que más te gustó? ¿Cómo estuvo la atención?"
                  className="w-full rounded-2xl border-0 bg-white dark:bg-card px-4 py-3 text-base sm:text-[17px] text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-0 shadow-xs leading-relaxed"
                />
              </div>

              {publishError && (
                <p className="text-xs font-bold text-[#105238] bg-[#eaf0e2] border border-[#105238]/20 px-3 py-2 rounded-xl">
                  {publishError}
                </p>
              )}

              <Button
                type="submit"
                disabled={!selectedPublishService || !composerText.trim() || isPublishingExperience}
                className="w-full h-11 rounded-2xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-black text-sm gap-2 cursor-pointer"
              >
                {isPublishingExperience ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#8ee01a]" />
                    <span>Publicando reseña...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#8ee01a]" />
                    <span>Publicar experiencia y calificación</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
