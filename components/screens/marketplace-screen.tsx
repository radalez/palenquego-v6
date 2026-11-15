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
  ThumbsUp,
  Smile,
  Sparkles,
  MessageSquare,
  Share2,
  Send,
  SlidersHorizontal,
  Calendar,
  Store as StoreIcon,
  ChevronRight,
  Check,
  Mail,
  Link2,
  MessageCircle,
  Loader2,
  Shuffle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useAppStore, type Service, DEFAULT_STORE_COVER } from "@/lib/store"
import { BookingModal } from "@/components/booking-modal"
import { HeaderWithMenu } from "@/components/header-with-menu"
import { RatingModal } from "@/components/rating-modal"
import { AdvancedFilterPanel, type FilterOptions } from "@/components/advanced-filter-panel"
import { PriceComparisonModal } from "@/components/price-comparison-modal"

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

type ReactionKey = "trato" | "divertido" | "fascino" | "quiero_ir"

const REACTIONS: Array<{ id: ReactionKey; label: string; icon: any }> = [
  { id: "trato", label: "Me trataron bien", icon: ThumbsUp },
  { id: "divertido", label: "Me divertí", icon: Smile },
  { id: "fascino", label: "Me fascinó", icon: Sparkles },
  { id: "quiero_ir", label: "Quiero ir", icon: Compass },
]

function ReactionBadgeIcon({
  type,
  size = "md",
  animated = false,
}: {
  type: ReactionKey
  size?: "xs" | "sm" | "md" | "lg"
  animated?: boolean
}) {
  const sizeClass =
    size === "lg"
      ? "w-10 h-10"
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

  if (type === "trato") {
    return (
      <span
        className={cn(
          sizeClass,
          "rounded-full bg-gradient-to-br from-[#105238] to-[#1a7a54] border border-[#8ee01a]/70 flex items-center justify-center shadow-sm shrink-0",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn(innerSize, animated && "animate-fb-thumb")}
        >
          <path
            d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Zm2 9h7.5a2 2 0 0 0 1.94-1.52l1.2-4.8A2 2 0 0 0 17.7 11H14V6.5A2.5 2.5 0 0 0 11.5 4l-.4.02a.5.5 0 0 0-.45.38L9 11v9Z"
            fill="#8ee01a"
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
          "rounded-full bg-gradient-to-br from-[#c4d551] to-[#91c44a] border border-[#105238]/30 flex items-center justify-center shadow-sm shrink-0",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn(innerSize, animated && "animate-fb-laugh")}
        >
          <path
            d="M7.5 10.5c.6-1 1.7-1 2.3 0M14.2 10.5c.6-1 1.7-1 2.3 0"
            stroke="#105238"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M7.5 14c1 2.5 3 3.5 4.5 3.5s3.5-1 4.5-3.5h-9Z"
            fill="#105238"
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
          "rounded-full bg-gradient-to-br from-[#0f766e] to-[#105238] border border-[#8ee01a]/80 flex items-center justify-center shadow-sm shrink-0",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn(innerSize, animated && "animate-fb-sparkle")}
        >
          <path
            d="M12 2.5l2.4 5.9 6.1.6-4.6 4.1 1.4 6-5.3-3.2-5.3 3.2 1.4-6L3.5 9l6.1-.6L12 2.5Z"
            fill="#8ee01a"
          />
        </svg>
      </span>
    )
  }

  return (
    <span
      className={cn(
        sizeClass,
        "rounded-full bg-gradient-to-br from-[#0284c7] to-[#105238] border border-[#8ee01a]/60 flex items-center justify-center shadow-sm shrink-0",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={cn(innerSize, animated && "animate-fb-compass")}
      >
        <circle cx="12" cy="12" r="8.5" stroke="#ffffff" strokeWidth="1.8" />
        <path d="M15.5 8.5l-2.2 5.2-5.2 2.2 2.2-5.2 5.2-2.2Z" fill="#8ee01a" />
      </svg>
    </span>
  )
}

interface ServiceComment {
  id: string
  author: string
  text: string
  rating?: number
  createdAt: string
}

interface TravelerPost {
  id: string
  author: string
  avatar?: string
  text: string
  taggedServiceId?: number
  taggedServiceName?: string
  createdAt: string
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

export function MarketplaceScreen({ onNavigate }: MarketplaceScreenProps) {
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

  // Preferences Modal state
  const [preferredCategories, setPreferredCategories] = useState<string[]>([])
  const [showPreferencesModal, setShowPreferencesModal] = useState(false)
  const [onlyPreferred, setOnlyPreferred] = useState(false)
  const [feedSeed, setFeedSeed] = useState<number>(() => Math.floor(Math.random() * 99999))

  // Social Feed state (reactions, inline comments, traveler posts, share popover)
  const [openReactionPickerId, setOpenReactionPickerId] = useState<number | null>(null)
  const [justReactedServiceId, setJustReactedServiceId] = useState<number | null>(null)
  const reactionCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [serviceReactions, setServiceReactions] = useState<Record<number, { counts: Record<ReactionKey, number>; userReaction: ReactionKey | null }>>({})
  const [openCommentsId, setOpenCommentsId] = useState<number | null>(null)
  const [serviceComments, setServiceComments] = useState<Record<number, ServiceComment[]>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({})
  const [commentRatings, setCommentRatings] = useState<Record<number, number>>({})
  const [openShareId, setOpenShareId] = useState<number | null>(null)
  const [copiedServiceId, setCopiedServiceId] = useState<number | null>(null)

  // Traveler Post Composer state
  const [composerText, setComposerText] = useState("")
  const [composerTaggedServiceId, setComposerTaggedServiceId] = useState<number | "">("")
  const [travelerPosts, setTravelerPosts] = useState<TravelerPost[]>([])
  const [openTravelerCommentsId, setOpenTravelerCommentsId] = useState<string | null>(null)
  const [travelerCommentDrafts, setTravelerCommentDrafts] = useState<Record<string, string>>({})

  const [activePoolTooltipId, setActivePoolTooltipId] = useState<number | null>(null)
  const observerInstance = useRef<IntersectionObserver | null>(null)

  const {
    services,
    businesses,
    routes,
    currentUser,
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
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs)
        if (Array.isArray(parsed)) setPreferredCategories(parsed)
      } else {
        setShowPreferencesModal(true)
      }

      const savedReacts = localStorage.getItem("palenque_service_reactions")
      if (savedReacts) setServiceReactions(JSON.parse(savedReacts))

      const savedComments = localStorage.getItem("palenque_service_comments")
      if (savedComments) setServiceComments(JSON.parse(savedComments))

      const savedPosts = localStorage.getItem("palenque_traveler_posts")
      if (savedPosts) setTravelerPosts(JSON.parse(savedPosts))
    } catch {
      // ignore storage errors
    }
  }, [])

  // Backend catalog fetch
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedCategory && selectedCategory !== "all") {
      params.append("cat", selectedCategory)
    }
    if (searchQuery.trim()) {
      params.append("search", searchQuery.trim())
    }
    const qs = params.toString() ? `?${params.toString()}` : ""
    fetchServices(qs)
  }, [selectedCategory, searchQuery])

  useEffect(() => {
    fetchBusinesses()
    fetchRoutes()
    useAppStore.getState().fetchUserLikes()
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

  // Infinite scroll sentinel
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
            fetchMoreServices()
          }
        },
        { root: null, rootMargin: "800px", threshold: 0 },
      )
      observerInstance.current.observe(node)
    },
    [fetchMoreServices],
  )

  useEffect(() => {
    let ticking = false
    const checkAndAdvance = () => {
      const scrollables = document.querySelectorAll(".overflow-y-auto")
      let reachedBottom = false
      scrollables.forEach((el) => {
        const target = el as HTMLElement
        if (target.scrollHeight > target.clientHeight) {
          if (target.scrollTop + target.clientHeight >= target.scrollHeight - 1000) {
            reachedBottom = true
          }
        }
      })
      const doc = document.documentElement
      const winScrollTop = window.scrollY || doc.scrollTop || 0
      const winClientHeight = window.innerHeight || doc.clientHeight || 0
      const winScrollHeight = doc.scrollHeight || 0
      if (winScrollHeight > winClientHeight && winScrollTop + winClientHeight >= winScrollHeight - 1000) {
        reachedBottom = true
      }
      if (reachedBottom) fetchMoreServices()
    }
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkAndAdvance()
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true })
    document.addEventListener("scroll", handleScroll, { capture: true, passive: true })
    const interval = setInterval(checkAndAdvance, 1000)
    return () => {
      window.removeEventListener("scroll", handleScroll, true)
      document.removeEventListener("scroll", handleScroll, true)
      clearInterval(interval)
      if (observerInstance.current) observerInstance.current.disconnect()
    }
  }, [fetchMoreServices])

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

  const toggleServiceReaction = (serviceId: number, reaction: ReactionKey) => {
    if (reactionCloseTimerRef.current) {
      clearTimeout(reactionCloseTimerRef.current)
      reactionCloseTimerRef.current = null
    }
    setServiceReactions((prev) => {
      const current = prev[serviceId] || {
        counts: { trato: 0, divertido: 0, fascino: 0, quiero_ir: 0 },
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
  }

  const handleAddServiceComment = (serviceId: number) => {
    const text = (commentDrafts[serviceId] || "").trim()
    if (!text) return
    const rating = commentRatings[serviceId] || 5
    const newComment: ServiceComment = {
      id: `${Date.now()}`,
      author: currentUser?.name || "Viajero PalenqueGo",
      text,
      rating,
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
  }

  const handlePublishTravelerPost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!composerText.trim()) return
    const taggedService = composerTaggedServiceId
      ? services.find((s) => s.id === Number(composerTaggedServiceId))
      : undefined
    const newPost: TravelerPost = {
      id: `post-${Date.now()}`,
      author: currentUser?.name || "Viajero PalenqueGo",
      avatar: currentUser?.avatar,
      text: composerText.trim(),
      taggedServiceId: taggedService?.id,
      taggedServiceName: taggedService?.name,
      createdAt: new Date().toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      reactions: { trato: 0, divertido: 0, fascino: 0, quiero_ir: 0 },
      userReaction: null,
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
    setComposerTaggedServiceId("")
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

  const pendingBookings = bookings.filter((b) => b.status === "PENDIENTE")
  const flashServices = services.filter(
    (s) => s.oferta_flash && (s.oferta_flash.cupos_disponibles ?? 0) > 0,
  )
  const topRatedServices = [...services]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5)

  const filteredServices = services.filter((service) => {
    if (selectedCategory !== "all" && !matchesCategory(service, selectedCategory)) {
      return false
    }
    if (onlyPreferred && preferredCategories.length > 0 && selectedCategory === "all") {
      const matchesAnyPref = preferredCategories.some((pref) => matchesCategory(service, pref))
      if (!matchesAnyPref) return false
    }
    const combinedSearch = searchQuery || filters.searchQuery
    if (combinedSearch && !service.name.toLowerCase().includes(combinedSearch.toLowerCase())) {
      return false
    }
    if (service.rating < filters.ratingMin) return false
    if (service.price < filters.priceMin || service.price > filters.priceMax) return false
    return true
  })

  // Dynamic, category-interleaved ordering so the feed never feels repetitive
  const orderedServices = useMemo(() => {
    if (filteredServices.length <= 1) return filteredServices

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
      buckets.get(key)!.sort((a, b) => {
        const aFlash = a.oferta_flash && (a.oferta_flash.cupos_disponibles ?? 0) > 0 ? 1 : 0
        const bFlash = b.oferta_flash && (b.oferta_flash.cupos_disponibles ?? 0) > 0 ? 1 : 0
        if (aFlash !== bFlash) return bFlash - aFlash
        return pseudoScore(a.id) - pseudoScore(b.id)
      })
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
  }, [filteredServices, feedSeed, preferredCategories])

  const discoveryCategories = useMemo(
    () => categories.filter((c) => c.id !== "all" && c.id !== "flash"),
    [],
  )

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8] dark:bg-background">
      <HeaderWithMenu
        title="Experiencias"
        subtitle="Descubre, reacciona y reserva con la comunidad"
        onNavigate={onNavigate}
      />

      {/* Main Responsive Layout: Airy Centered Social Feed + Sticky Right Sidebar on Desktop */}
      <div className="max-w-[1160px] mx-auto w-full px-4 sm:px-8 lg:px-10 pt-5 pb-28">
        <div className="flex flex-col lg:flex-row lg:justify-center lg:gap-12 items-start">
          {/* LEFT / CENTER COLUMN: SOCIAL FEED */}
          <div className="w-full max-w-[560px] mx-auto lg:mx-0 space-y-5">
            {/* Pending Booking Banner */}
            {pendingBookings.length > 0 && (
              <div className="p-3.5 bg-[#eaf0e2] border border-[#8ee01a]/70 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#105238] flex items-center justify-center text-[#8ee01a] shrink-0">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#105238]">
                      Tienes {pendingBookings.length} reserva{pendingBookings.length > 1 ? "s" : ""} pendiente
                      {pendingBookings.length > 1 ? "s" : ""} de pago
                    </p>
                    <p className="text-[11px] text-[#105238]/80 truncate">
                      {pendingBookings[0].service?.name || "Experiencia"} (${pendingBookings[0].totalPrice})
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-[#105238] hover:bg-[#0c3e2b] text-white text-xs h-8 px-3.5 rounded-xl font-bold shrink-0 cursor-pointer"
                  onClick={() => onNavigate?.("pool")}
                >
                  Pagar / Ver
                </Button>
              </div>
            )}

            {/* TOP "RUTAS GO" CIRCULAR STRIP (replaces Stories) */}
            <div className="bg-card border border-border rounded-3xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#105238]" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Rutas & Destinos Go
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate?.("map-explorer")}
                  className="text-xs font-bold text-[#105238] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Abrir mapa</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-start gap-3.5 overflow-x-auto pb-1 scrollbar-hide">
                {/* First Circle: Open Interactive Map Go */}
                <button
                  type="button"
                  onClick={() => onNavigate?.("map-explorer")}
                  className="flex flex-col items-center gap-1.5 shrink-0 w-18 group cursor-pointer"
                >
                  <div className="w-15 h-15 rounded-full p-0.5 bg-gradient-to-tr from-[#105238] to-[#8ee01a] shadow-xs group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-[#105238] flex items-center justify-center border-2 border-white">
                      <Compass className="w-6 h-6 text-[#8ee01a]" />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-foreground text-center leading-tight line-clamp-2">
                    Mapa Go
                  </span>
                </button>

                {/* Real Routes Circles */}
                {routes.slice(0, 12).map((route: any) => {
                  const thumb = route.image || route.imagen_portada || DEFAULT_STORE_COVER
                  return (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => {
                        useAppStore.getState().setReturnToMapRoute(route.name)
                        onNavigate?.("map-explorer")
                      }}
                      className="flex flex-col items-center gap-1.5 shrink-0 w-18 group cursor-pointer"
                    >
                      <div className="w-15 h-15 rounded-full p-0.5 bg-gradient-to-tr from-[#105238] to-[#8ee01a] shadow-xs group-hover:scale-105 transition-transform">
                        <img
                          src={thumb}
                          alt={route.name}
                          className="w-full h-full rounded-full object-cover border-2 border-white"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_STORE_COVER
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-foreground text-center leading-tight line-clamp-2">
                        {route.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* SEARCH + PREFERENCES + SHUFFLE */}
            <div className="bg-card border border-border rounded-3xl p-4 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    placeholder="Buscar experiencias, tours, restaurantes..."
                    className="pl-10 pr-10 bg-background border border-border h-10 rounded-2xl text-sm"
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilterPanel(true)}
                  className="h-10 px-3 rounded-2xl border-border text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <Filter className="w-4 h-4 text-[#105238]" />
                  <span>Filtros</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreferencesModal(true)}
                  className="h-10 px-3 rounded-2xl border-[#105238]/30 bg-[#eaf0e2]/60 text-[#105238] hover:bg-[#eaf0e2] text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Preferencias</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFeedSeed(Math.floor(Math.random() * 99999))}
                  title="Mezclar orden del feed"
                  className="h-10 px-2.5 rounded-2xl border-border text-xs font-bold gap-1 cursor-pointer"
                >
                  <Shuffle className="w-4 h-4 text-[#105238]" />
                </Button>
              </div>
            </div>

            {/* STICKY CATEGORY PILLS BAR (stays accessible while scrolling) */}
            <div className="sticky top-0 z-20 bg-[#fafaf8]/95 dark:bg-background/95 backdrop-blur-md py-2 -mx-1 px-1">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {preferredCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("all")
                      setOnlyPreferred((prev) => !prev)
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all text-xs font-bold cursor-pointer",
                      onlyPreferred && selectedCategory === "all"
                        ? "bg-[#105238] text-[#8ee01a] shadow-sm"
                        : "bg-[#eaf0e2] text-[#105238] border border-[#aeb6a1]/50",
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Para ti ({preferredCategories.length})</span>
                  </button>
                )}

                {categories.map((cat) => {
                  const Icon = cat.icon
                  const isActive = selectedCategory === cat.id && !(onlyPreferred && cat.id === "all")
                  const isSpecial = (cat as any).isSpecial
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setOnlyPreferred(false)
                        setSelectedCategory(cat.id)
                      }}
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

            {/* TRAVELER EXPERIENCE COMPOSER (Text + Optional Tagged Service, NO photo upload) */}
            <form
              onSubmit={handlePublishTravelerPost}
              className="bg-card border border-border rounded-3xl p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 border border-[#105238]/30 shrink-0">
                  <AvatarImage src={currentUser?.avatar} alt={currentUser?.name || "Viajero"} />
                  <AvatarFallback className="bg-[#105238] text-white font-bold text-xs">
                    {(currentUser?.name || "PG").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <textarea
                  rows={2}
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  placeholder="¿Qué experiencia de viaje quieres compartir hoy con la comunidad?"
                  className="flex-1 bg-background border border-border rounded-2xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#105238]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/60">
                <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                  <MapPin className="w-4 h-4 text-[#105238] shrink-0" />
                  <select
                    value={composerTaggedServiceId}
                    onChange={(e) => setComposerTaggedServiceId(e.target.value ? Number(e.target.value) : "")}
                    className="h-9 rounded-xl border border-border bg-background px-2.5 text-xs font-medium text-foreground max-w-xs w-full"
                  >
                    <option value="">Etiquetar una experiencia (opcional)</option>
                    {services.slice(0, 30).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={!composerText.trim()}
                  className="h-9 px-4 rounded-xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold text-xs gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#8ee01a]" />
                  <span>Publicar</span>
                </Button>
              </div>
            </form>

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

                  {post.taggedServiceId && post.taggedServiceName && (
                    <button
                      type="button"
                      onClick={() => router.push(`/s/${post.taggedServiceId}?from=marketplace`)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#105238] bg-[#eaf0e2] hover:bg-[#eaf0e2]/80 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{post.taggedServiceName}</span>
                    </button>
                  )}

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
                            "group/react inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer",
                            active
                              ? "bg-[#105238] text-[#8ee01a] shadow-xs"
                              : "bg-muted/60 text-muted-foreground hover:bg-[#eaf0e2] hover:text-[#105238]",
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
            {isLoading ? (
              <div className="py-12 text-center">
                <div className="w-9 h-9 border-4 border-[#105238] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Cargando experiencias...</p>
              </div>
            ) : (
              <div className="space-y-5">
                {orderedServices.map((service, serviceIdx) => {
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
                    counts: { trato: 0, divertido: 0, fascino: 0, quiero_ir: 0 },
                    userReaction: null,
                  }
                  const totalReacts = Object.values(reactState.counts).reduce((a, b) => a + b, 0)
                  const activeReactMeta = REACTIONS.find((r) => r.id === reactState.userReaction)
                  const commentsList = serviceComments[service.id] || []
                  const shareUrl =
                    typeof window !== "undefined" ? `${window.location.origin}/s/${service.id}` : ""

                  return (
                    <div key={service.id} className="space-y-5">
                    <article
                      id={`service-card-${service.id}`}
                      className="bg-card border border-border rounded-3xl shadow-2xs overflow-visible scroll-mt-24"
                    >
                      {/* Post Header: Business + Location + Price */}
                      <div className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => service.businessId && router.push(`/b/${service.businessId}`)}
                            className="shrink-0 cursor-pointer"
                          >
                            <Avatar className="w-11 h-11 border-2 border-[#105238]/30">
                              <AvatarImage src={service.businessAvatar} alt={service.businessName || service.name} />
                              <AvatarFallback className="bg-[#105238] text-white font-bold text-xs">
                                {(service.businessName || service.name).substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </button>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => service.businessId && router.push(`/b/${service.businessId}`)}
                              className="font-bold text-sm text-foreground hover:text-[#105238] truncate block text-left cursor-pointer"
                            >
                              {service.businessName || "Comercio Aliado PalenqueGo"}
                            </button>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="inline-flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-[#105238] shrink-0" />
                                <span className="truncate">{service.location}</span>
                              </span>
                              <span>·</span>
                              <span className="font-semibold text-[#105238]">
                                {service.category || service.categoria?.nombre || "Experiencia"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price Pill */}
                        <div className="text-right shrink-0">
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
                      </div>

                      {/* Post Caption: Title + Description + Rating */}
                      <div className="px-4 pb-3 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            onClick={() => {
                              if (typeof window !== "undefined") {
                                sessionStorage.setItem("palenque_return_tab", "marketplace")
                                sessionStorage.setItem("palenque_last_viewed_service_id", String(service.id))
                              }
                              router.push(`/s/${service.id}?from=marketplace`)
                            }}
                            className="font-extrabold text-base sm:text-lg text-foreground hover:text-[#105238] transition-colors cursor-pointer leading-snug"
                          >
                            {service.name}
                          </h3>
                          <div className="flex items-center gap-1 bg-[#eaf0e2] px-2 py-0.5 rounded-lg shrink-0">
                            <Star className="w-3.5 h-3.5 fill-[#105238] text-[#105238]" />
                            <span className="font-bold text-[#105238] text-xs">{service.rating}</span>
                            <span className="text-[11px] text-[#105238]/80">({service.reviews})</span>
                          </div>
                        </div>

                        {service.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {service.description}
                          </p>
                        )}
                      </div>

                      {/* Post Media */}
                      <div
                        className="relative h-60 sm:h-76 bg-muted overflow-hidden cursor-pointer"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            sessionStorage.setItem("palenque_return_tab", "marketplace")
                            sessionStorage.setItem("palenque_last_viewed_service_id", String(service.id))
                          }
                          router.push(`/s/${service.id}?from=marketplace`)
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
                          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-sm z-20 cursor-pointer"
                          aria-label="Guardar en favoritos"
                        >
                          <Heart
                            className={cn(
                              "w-5 h-5 transition-colors",
                              isFav ? "fill-[#105238] text-[#105238]" : "text-foreground",
                            )}
                          />
                        </button>

                        {hasFlashOffer && service.oferta_flash?.fecha_fin ? (
                          <FlashCountdown fechaFin={service.oferta_flash.fecha_fin} />
                        ) : (
                          service.isRemate && (
                            <Badge className="absolute top-3 left-3 bg-[#105238] text-[#8ee01a] text-xs font-bold shadow-md z-20">
                              <Flame className="w-3 h-3 mr-1" />-{service.discount}%
                            </Badge>
                          )
                        )}

                        {/* Pool Badge + Routes count */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 z-20">
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-[#105238]/90 text-white backdrop-blur-sm shadow-md py-1 px-2.5 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#8ee01a] animate-pulse shrink-0" />
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
                              className="w-6 h-6 rounded-full bg-[#105238] text-[#8ee01a] flex items-center justify-center text-[11px] font-black shadow-md cursor-pointer"
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
                              className="inline-flex items-center gap-1 text-xs font-bold bg-white/95 text-[#105238] px-2.5 py-1 rounded-full shadow-md cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5" />
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
                              onClick={() =>
                                setOpenCommentsId((prev) => (prev === service.id ? null : service.id))
                              }
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
                                      <span className="pointer-events-none opacity-0 group-hover/emoji:opacity-100 transition-opacity duration-150 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#105238] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg">
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
                                ? "bg-[#eaf0e2] text-[#105238] ring-1 ring-[#105238]/25"
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
                          onClick={() =>
                            setOpenCommentsId((prev) => (prev === service.id ? null : service.id))
                          }
                          className="flex-1 min-w-[95px] h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2"
                        >
                          <MessageSquare className="w-4 h-4 shrink-0" />
                          <span>Comentar</span>
                        </button>

                        {/* Compartir (Desktop Floating Pill / Mobile Native) */}
                        <div className="relative flex-1 min-w-[85px]">
                          {openShareId === service.id && (
                            <div className="hidden lg:flex items-center gap-1.5 absolute bottom-full right-0 mb-2 bg-[#151b26] text-white px-2.5 py-1.5 rounded-full shadow-2xl border border-white/10 z-40 whitespace-nowrap">
                              <a
                                href={`https://wa.me/?text=${encodeURIComponent(`${service.name} en PalenqueGo ${shareUrl}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpenShareId(null)}
                                className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white"
                                title="WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                              <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpenShareId(null)}
                                className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-xs font-black"
                                title="Facebook"
                              >
                                f
                              </a>
                              <a
                                href={`mailto:?subject=${encodeURIComponent(service.name)}&body=${encodeURIComponent(shareUrl)}`}
                                onClick={() => setOpenShareId(null)}
                                className="w-8 h-8 rounded-full bg-[#105238] flex items-center justify-center text-[#8ee01a]"
                                title="Correo"
                              >
                                <Mail className="w-4 h-4" />
                              </a>
                              <button
                                type="button"
                                onClick={async () => {
                                  await navigator.clipboard.writeText(shareUrl)
                                  setCopiedServiceId(service.id)
                                  setTimeout(() => setCopiedServiceId(null), 1500)
                                }}
                                className="w-8 h-8 rounded-full bg-[#374151] flex items-center justify-center text-white cursor-pointer"
                                title="Copiar enlace"
                              >
                                {copiedServiceId === service.id ? (
                                  <Check className="w-4 h-4 text-[#8ee01a]" />
                                ) : (
                                  <Link2 className="w-4 h-4" />
                                )}
                              </button>
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
                          className="flex-1 min-w-[100px] h-9 rounded-xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold text-xs cursor-pointer"
                        >
                          Reservar
                        </Button>
                      </div>

                      {/* Inline Comments & Rating Drawer */}
                      {openCommentsId === service.id && (
                        <div className="px-4 pb-4 pt-2 border-t border-border/60 bg-muted/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">
                              Opiniones y calificación
                            </span>
                            <button
                              type="button"
                              onClick={() => setServiceToRate(service)}
                              className="text-xs font-bold text-[#105238] hover:underline cursor-pointer"
                            >
                              Calificar con estrellas
                            </button>
                          </div>

                          {/* Star selector for inline comment */}
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((starVal) => (
                              <button
                                key={starVal}
                                type="button"
                                onClick={() => setCommentRatings((prev) => ({ ...prev, [service.id]: starVal }))}
                                className="cursor-pointer"
                              >
                                <Star
                                  className={cn(
                                    "w-4 h-4",
                                    starVal <= (commentRatings[service.id] || 5)
                                      ? "fill-[#105238] text-[#105238]"
                                      : "text-muted-foreground",
                                  )}
                                />
                              </button>
                            ))}
                            <span className="text-[11px] text-muted-foreground ml-1.5">
                              ({commentRatings[service.id] || 5}/5)
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={commentDrafts[service.id] || ""}
                              onChange={(e) =>
                                setCommentDrafts((prev) => ({ ...prev, [service.id]: e.target.value }))
                              }
                              placeholder="Cuenta cómo te fue o pregunta sobre esta experiencia..."
                              className="flex-1 h-9 px-3 rounded-xl border border-border bg-background text-xs"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleAddServiceComment(service.id)}
                              className="h-9 px-3.5 rounded-xl bg-[#105238] text-white text-xs font-bold cursor-pointer"
                            >
                              Publicar
                            </Button>
                          </div>

                          {commentsList.length > 0 && (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {commentsList.map((c) => (
                                <div key={c.id} className="bg-card border border-border/60 rounded-2xl px-3.5 py-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-foreground">{c.author}</span>
                                    <div className="flex items-center gap-2">
                                      {c.rating && (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#105238]">
                                          <Star className="w-3 h-3 fill-[#105238]" /> {c.rating}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-muted-foreground">{c.createdAt}</span>
                                    </div>
                                  </div>
                                  <p className="text-foreground/90 mt-0.5">{c.text}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </article>

                    {/* Inline Category Discovery Card every 5 posts so categories appear naturally as you scroll */}
                    {selectedCategory === "all" &&
                      (serviceIdx + 1) % 5 === 0 &&
                      discoveryCategories.length > 0 && (() => {
                        const catOffset = Math.floor((serviceIdx + 1) / 5 - 1 + (feedSeed % discoveryCategories.length))
                        const targetCat = discoveryCategories[catOffset % discoveryCategories.length]
                        const CatIcon = targetCat.icon
                        const catSamples = services
                          .filter((s) => matchesCategory(s, targetCat.id) && s.id !== service.id)
                          .slice(0, 2)
                        if (catSamples.length === 0) return null
                        return (
                          <div className="bg-[#eaf0e2]/55 dark:bg-card border border-[#aeb6a1]/50 rounded-3xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-xl bg-[#105238] text-[#8ee01a] flex items-center justify-center">
                                  <CatIcon className="w-4 h-4" />
                                </span>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#105238]/75">
                                    Explora otra vibra
                                  </p>
                                  <h4 className="text-sm font-extrabold text-[#105238] dark:text-foreground">
                                    {targetCat.label}
                                  </h4>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setOnlyPreferred(false)
                                  setSelectedCategory(targetCat.id)
                                }}
                                className="text-xs font-bold text-[#105238] hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>Ver más</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {catSamples.map((cs) => (
                                <button
                                  key={cs.id}
                                  type="button"
                                  onClick={() => router.push(`/s/${cs.id}?from=marketplace`)}
                                  className="flex items-center gap-2.5 bg-white dark:bg-background border border-border/70 rounded-2xl p-2 text-left hover:border-[#105238]/40 transition-colors cursor-pointer"
                                >
                                  <img
                                    src={cs.image || DEFAULT_STORE_COVER}
                                    alt={cs.name}
                                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-foreground truncate">{cs.name}</p>
                                    <p className="text-[11px] font-black text-[#105238]">
                                      ${Number(cs.price || 0).toFixed(2)} <span className="font-normal text-muted-foreground">/p</span>
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
                  </div>
                  )
                })}

                {/* When filtered narrowly (e.g. 1 Flash Offer), show Más destacados below so the feed never feels empty */}
                {orderedServices.length <= 3 && services.length > orderedServices.length && (
                  <div className="bg-card border border-border rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#105238]" />
                        <span>Más destacados que te pueden gustar</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setOnlyPreferred(false)
                          setSelectedCategory("all")
                          setSearchQuery("")
                        }}
                        className="text-xs font-bold text-[#105238] hover:underline cursor-pointer"
                      >
                        Ver todas
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {topRatedServices
                        .filter((ts) => !orderedServices.some((os) => os.id === ts.id))
                        .slice(0, 4)
                        .map((ts) => (
                          <button
                            key={ts.id}
                            type="button"
                            onClick={() => router.push(`/s/${ts.id}?from=marketplace`)}
                            className="flex items-center gap-3 p-2.5 rounded-2xl border border-border/70 hover:border-[#105238]/40 bg-[#fafaf8] dark:bg-background transition-colors text-left cursor-pointer"
                          >
                            <img
                              src={ts.image || DEFAULT_STORE_COVER}
                              alt={ts.name}
                              className="w-14 h-14 rounded-xl object-cover shrink-0"
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
                  </div>
                )}

                {/* Pagination / Click-to-Load + Infinite Scroll Sentinel */}
                {catalogHasMore ? (
                  <div
                    ref={sentinelRef}
                    className="py-6 flex flex-col items-center justify-center gap-3"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isFetchingMoreCatalog}
                      onClick={() => fetchMoreServices()}
                      className="rounded-full px-6 h-10 border-[#105238]/40 text-[#105238] hover:bg-[#eaf0e2] font-bold text-xs gap-2 cursor-pointer"
                    >
                      {isFetchingMoreCatalog ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Cargando más experiencias...</span>
                        </>
                      ) : (
                        <span>Cargar más experiencias</span>
                      )}
                    </Button>
                  </div>
                ) : (
                  orderedServices.length > 0 && (
                    <div className="py-6 text-center text-xs text-muted-foreground border-t border-border/50">
                      Has explorado todas las experiencias disponibles ({orderedServices.length})
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* RIGHT STICKY SIDEBAR ON DESKTOP */}
          <aside className="hidden lg:block lg:w-[300px] xl:w-[320px] shrink-0 lg:sticky lg:top-5 space-y-5">
            {/* Next Booking Summary */}
            {bookings.length > 0 && (
              <div className="bg-card border border-border rounded-3xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#105238]" />
                    <span>Mi próxima reserva</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => onNavigate?.("pool")}
                    className="text-xs font-bold text-[#105238] hover:underline cursor-pointer"
                  >
                    Ver todas
                  </button>
                </div>
                <div className="flex items-center gap-3 bg-[#fafaf8] border border-border/70 rounded-2xl p-3">
                  <img
                    src={bookings[0].service?.image || DEFAULT_STORE_COVER}
                    alt={bookings[0].service?.name || "Reserva"}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-foreground truncate">
                      {bookings[0].service?.name || "Experiencia"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {bookings[0].date} · {bookings[0].time}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => onNavigate?.("pool")}
                  className="w-full h-9 rounded-xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold text-xs cursor-pointer"
                >
                  Ver Voucher / Pagar
                </Button>
              </div>
            )}

            {/* Ofertas Flash Highlight Card */}
            <div className="bg-[#105238] text-white rounded-3xl p-5 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#8ee01a] uppercase tracking-wider">
                  <Zap className="w-4 h-4 fill-[#8ee01a]" />
                  Ofertas Flash
                </span>
                <span className="text-[11px] font-bold bg-white/15 px-2.5 py-0.5 rounded-full">
                  {flashServices.length} activas
                </span>
              </div>
              <p className="text-xs text-white/85 leading-relaxed">
                Cupos limitados con descuento directo antes de que expire el reloj.
              </p>
              {flashServices.slice(0, 2).map((fs) => (
                <button
                  key={fs.id}
                  type="button"
                  onClick={() => router.push(`/s/${fs.id}?from=marketplace`)}
                  className="w-full text-left bg-white/10 hover:bg-white/15 rounded-2xl p-2.5 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold truncate">{fs.name}</span>
                  <span className="text-xs font-black text-[#8ee01a] shrink-0">
                    ${fs.oferta_flash?.precio_promocional}
                  </span>
                </button>
              ))}
              <Button
                type="button"
                onClick={() => {
                  setOnlyPreferred(false)
                  setSelectedCategory((prev) => (prev === "flash" ? "all" : "flash"))
                }}
                className="w-full h-9 rounded-xl bg-[#8ee01a] hover:bg-[#8ee01a]/90 text-[#105238] font-black text-xs cursor-pointer"
              >
                {selectedCategory === "flash" ? "Ver todas las experiencias" : "Ver promociones"}
              </Button>
            </div>

            {/* Top Rated / Featured Experiences */}
            <div className="bg-card border border-border rounded-3xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#105238]" />
                  <span>Más destacados</span>
                </h3>
                <div className="flex items-center gap-2">
                  {selectedCategory !== "all" && (
                    <button
                      type="button"
                      onClick={() => {
                        setOnlyPreferred(false)
                        setSelectedCategory("all")
                        setSearchQuery("")
                      }}
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

              <div className="space-y-2.5">
                {topRatedServices.map((ts) => (
                  <button
                    key={ts.id}
                    type="button"
                    onClick={() => router.push(`/s/${ts.id}?from=marketplace`)}
                    className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-muted/50 transition-colors text-left cursor-pointer"
                  >
                    <img
                      src={ts.image || DEFAULT_STORE_COVER}
                      alt={ts.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-foreground truncate">{ts.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{ts.location}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#105238]">
                        <Star className="w-3 h-3 fill-[#105238]" /> {ts.rating}
                      </span>
                      <p className="text-xs font-black text-foreground">${ts.price}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Businesses */}
            {businesses.length > 0 && (
              <div className="bg-card border border-border rounded-3xl p-5 shadow-2xs space-y-3">
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
                        <p className="text-[11px] text-muted-foreground truncate">{biz.category || "Comercio"}</p>
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
    </div>
  )
}
