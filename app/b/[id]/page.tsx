"use client"

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
  MessageCircle,
  Phone,
  Share2,
  Home,
  FileText,
  Briefcase,
  Mail,
  Link2,
  Check,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useAppStore, DEFAULT_STORE_COVER } from "@/lib/store"
import { BookingModal } from "@/components/booking-modal"
import { RealReviewsSection } from "@/components/real-reviews-section"

interface BusinessDetailPageProps {
  params: Promise<{ id: string }>
}

const GPS_COORD_REGEX = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/

export default function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { businesses, services, fetchBusinesses, fetchServices } = useAppStore()
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [loadingInitial, setLoadingInitial] = useState(businesses.length === 0)
  const [activeSection, setActiveSection] = useState<string>("vista-general")
  const [resolvedAddress, setResolvedAddress] = useState<string>("")
  const [showDesktopShare, setShowDesktopShare] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const sharePopoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      if (businesses.length === 0) await fetchBusinesses()
      if (services.length === 0) await fetchServices()
      setLoadingInitial(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!showDesktopShare) return
    const handleClickOutside = (e: MouseEvent) => {
      if (sharePopoverRef.current && !sharePopoverRef.current.contains(e.target as Node)) {
        setShowDesktopShare(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showDesktopShare])

  const business = businesses.find((b) => b.id === parseInt(resolvedParams.id))
  const businessServices = business ? services.filter((s) => s.businessId === business.id) : []

  // Reverse-geocode if business.location contains raw GPS coordinates (e.g. "-12.211928, -76.937309")
  const coordMatch = business?.location ? business.location.match(GPS_COORD_REGEX) : null
  const lat = coordMatch ? coordMatch[1] : null
  const lng = coordMatch ? coordMatch[2] : null

  useEffect(() => {
    if (!lat || !lng) {
      setResolvedAddress("")
      return
    }
    let cancelled = false
    const reverseGeocode = async () => {
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=es`,
        )
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        const parts = [data.locality || data.city, data.principalSubdivision, data.countryName].filter(Boolean)
        const uniqueParts = Array.from(new Set(parts))
        if (uniqueParts.length > 0) {
          setResolvedAddress(uniqueParts.join(", "))
        }
      } catch {
        // Silently keep fallback
      }
    }
    reverseGeocode()
    return () => {
      cancelled = true
    }
  }, [lat, lng])

  const displayAddress = coordMatch
    ? resolvedAddress || "Ubicación verificada en mapa"
    : business?.location || "El Salvador"

  const effectiveCoverImage =
    business?.coverImage && !business.coverImage.includes("placeholder")
      ? business.coverImage
      : businessServices.find((s) => s.image && !s.image.includes("placeholder"))?.image ||
        (business?.logo && !business.logo.includes("placeholder") ? business.logo : DEFAULT_STORE_COVER)

  const navigateToTab = (tab: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("palenque-active-tab", tab)
      sessionStorage.setItem("palenque_return_tab", tab)
      router.push(`/?tab=${tab}`)
      return
    }
    router.push(`/?tab=${tab}`)
  }

  const handleBack = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const fromParam = urlParams.get("from") || sessionStorage.getItem("palenque_return_tab")
      if (fromParam) {
        sessionStorage.removeItem("palenque_return_tab")
        router.push(`/?tab=${fromParam}`)
        return
      }
    }
    router.back()
  }

  if (loadingInitial && !business) {
    return (
      <div className="min-h-screen bg-[#fafaf8] dark:bg-background flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-full border-4 border-[#105238] border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-bold text-foreground">Cargando comercio...</p>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#fafaf8] dark:bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Negocio no encontrado</h1>
          <Button onClick={handleBack} className="bg-[#105238] hover:bg-[#0c3e2b] text-white">
            Volver
          </Button>
        </div>
      </div>
    )
  }

  const handleWhatsApp = () => {
    if (business.socialLinks?.whatsapp) {
      const cleanPhone = business.socialLinks.whatsapp.replace(/\D/g, "")
      window.open(`https://wa.me/${cleanPhone}`, "_blank")
    }
  }

  const handleCall = () => {
    if (business.socialLinks?.phone) {
      window.location.href = `tel:${business.socialLinks.phone}`
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: business.name,
        text: business.description,
        url: window.location.href,
      })
    }
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""
  const shareText = `${business.name} en PalenqueGo`

  const handleCopyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      // Fallback
    }
  }

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const internalSections = [
    { id: "vista-general", label: "Resumen", visible: true },
    { id: "sobre-negocio", label: "Sobre el negocio", visible: Boolean(business.description) },
    { id: "servicios", label: `Servicios (${businessServices.length})`, visible: true },
  ].filter((sec) => sec.visible)

  const categoryLabel = business.category
    ? business.category.charAt(0).toUpperCase() + business.category.slice(1)
    : "General"

  const mapsUrl = lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null

  return (
    <main className="min-h-screen bg-[#fafaf8] dark:bg-background flex flex-col pb-32 lg:pb-16">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          aria-label="Volver"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1 text-center truncate px-2">Comercio</h1>
        <button
          onClick={handleShare}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          aria-label="Compartir"
        >
          <Share2 className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Desktop Top Navbar */}
      <header className="hidden md:block sticky top-0 z-30 bg-white/95 dark:bg-card/95 backdrop-blur-md border-b border-border/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={() => navigateToTab("map-explorer")}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            <img src="/icon-192.png" alt="PalenqueGo" className="w-9 h-9 rounded-xl object-contain" />
            <span className="font-extrabold text-base text-[#105238] dark:text-[#8ee01a] tracking-tight">
              PalenqueGo
            </span>
          </button>

          {/* Internal Section Navigation Links */}
          <nav className="flex items-center gap-6 h-full overflow-x-auto no-scrollbar">
            {internalSections.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={cn(
                  "h-full inline-flex items-center text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap",
                  activeSection === item.id
                    ? "border-[#105238] text-[#105238] dark:border-[#8ee01a] dark:text-[#8ee01a] font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleBack}
              className="h-9 px-3.5 rounded-full border border-border bg-background hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Breadcrumb */}
      <div className="hidden md:flex max-w-6xl mx-auto w-full px-6 pt-5 pb-3 items-center gap-2 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => navigateToTab("map-explorer")}
          className="inline-flex items-center gap-1 hover:text-[#105238] transition-colors cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Inicio</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button
          type="button"
          onClick={() => navigateToTab("marketplace")}
          className="hover:text-[#105238] transition-colors cursor-pointer"
        >
          Servicios
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-foreground truncate max-w-md">{business.name}</span>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto w-full md:px-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Cover Banner */}
            <div
              id="vista-general"
              className="scroll-mt-24 relative h-52 sm:h-72 md:h-[340px] md:rounded-3xl bg-gradient-to-br from-[#04281a] via-[#064e3b] to-[#043324] overflow-hidden shadow-xs border-b md:border border-border/60"
            >
              <img
                src={effectiveCoverImage}
                alt={business.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget
                  if (target.src !== DEFAULT_STORE_COVER) {
                    target.src = DEFAULT_STORE_COVER
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Inner Content */}
            <div className="px-4 md:px-0 space-y-6">
              {/* Business Identity Card - Clean spacing, zero overlap on multi-line titles */}
              <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-2xs flex items-start sm:items-center gap-4">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-[#105238] shadow-xs shrink-0">
                  <AvatarImage src={business.logo} alt={business.name} className="object-cover" />
                  <AvatarFallback className="bg-[#105238] text-white text-xl sm:text-2xl font-bold">
                    {business.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground leading-tight break-words">
                      {business.name}
                    </h1>
                    <span className="text-[11px] font-bold text-[#105238] bg-[#eaf0e2] border border-[#aeb6a1]/50 px-2.5 py-0.5 rounded-full shrink-0">
                      {categoryLabel}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-4 h-4 text-[#105238] shrink-0" />
                      <span className="font-medium leading-snug">{displayAddress}</span>
                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-[#105238] font-bold hover:underline shrink-0 ml-1"
                        >
                          <span>Mapa</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1 bg-[#eaf0e2] px-2.5 py-0.5 rounded-lg border border-[#aeb6a1]/50 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-[#105238] text-[#105238]" />
                      <span className="font-bold text-[#105238] text-xs">{business.rating}</span>
                      <span className="text-[#105238]/80 text-xs">({business.reviews || 0} reseñas)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {business.description && (
                <div
                  id="sobre-negocio"
                  className="scroll-mt-24 bg-card border border-border rounded-2xl p-5 shadow-2xs"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-[#105238]" />
                    <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">
                      Sobre este negocio
                    </h2>
                  </div>
                  <p className="text-foreground/90 leading-relaxed text-sm">{business.description}</p>
                </div>
              )}

              {/* Services Grid */}
              <div id="servicios" className="scroll-mt-24 space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-5 h-5 text-[#105238]" />
                    <h2 className="text-lg md:text-xl font-bold text-foreground uppercase tracking-tight">
                      Servicios Disponibles
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-[#105238] bg-[#eaf0e2] px-2.5 py-1 rounded-full">
                    {businessServices.length} {businessServices.length === 1 ? "servicio" : "servicios"}
                  </span>
                </div>

                {businessServices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {businessServices.map((service) => (
                      <div
                        key={service.id}
                        className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-[#105238]/50 transition-all group flex flex-col"
                      >
                        <div className="relative h-40 overflow-hidden bg-[#eaf0e2]">
                          <img
                            src={
                              service.image && !service.image.includes("placeholder")
                                ? service.image
                                : effectiveCoverImage
                            }
                            alt={service.nombre || service.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.currentTarget
                              if (target.src !== DEFAULT_STORE_COVER) {
                                target.src = DEFAULT_STORE_COVER
                              }
                            }}
                          />
                          {service.oferta_flash && (
                            <div className="absolute top-2.5 left-2.5 bg-[#105238] text-[#8ee01a] text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm uppercase">
                              Flash -{service.oferta_flash.descuento_porcentaje}%
                            </div>
                          )}
                          <div className="absolute bottom-2.5 right-2.5 bg-white/95 dark:bg-card/95 backdrop-blur-xs px-2.5 py-1 rounded-xl shadow-xs border border-border/60">
                            <span className="text-[#105238] dark:text-[#8ee01a] font-black text-sm">
                              ${service.oferta_flash ? service.oferta_flash.precio_promocional : service.price || service.precio_base}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold"> /p</span>
                          </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-foreground text-sm sm:text-base line-clamp-2 leading-snug">
                                {service.nombre || service.name}
                              </h3>
                              <div className="flex items-center gap-0.5 bg-[#eaf0e2] px-2 py-0.5 rounded-md shrink-0">
                                <Star className="w-3 h-3 fill-[#105238] text-[#105238]" />
                                <span className="text-[11px] font-bold text-[#105238]">
                                  {service.rating || "5.0"}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                              {service.descripcion || service.description || "Sin descripción disponible"}
                            </p>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-border/60">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 rounded-xl h-9 text-xs font-bold cursor-pointer"
                              onClick={() => router.push(`/s/${service.id}`)}
                            >
                              Detalles
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-[#105238] hover:bg-[#0c3e2b] text-white rounded-xl h-9 text-xs font-bold shadow-xs cursor-pointer"
                              onClick={() => {
                                setSelectedService(service)
                                setShowBookingModal(true)
                              }}
                            >
                              Reservar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-card border border-border rounded-2xl">
                    <p className="text-muted-foreground text-sm">No hay servicios disponibles por el momento.</p>
                  </div>
                )}
              </div>

              {/* Real Reviews & Ratings Section */}
              <div className="pt-2">
                <RealReviewsSection
                  mode="business"
                  targetId={business.id}
                  servicesForBusiness={businessServices.map((s) => ({ id: s.id, name: s.name }))}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Contact & Share Card on Desktop */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24">
            <div className="bg-white dark:bg-card border border-border rounded-3xl p-6 shadow-lg space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-border/70">
                <Avatar className="w-12 h-12 border-2 border-[#105238] shrink-0">
                  <AvatarImage src={business.logo} alt={business.name} className="object-cover" />
                  <AvatarFallback className="bg-[#105238] text-white font-bold">
                    {business.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#105238] dark:text-[#8ee01a]">
                    Comercio Aliado
                  </p>
                  <h3 className="font-bold text-foreground text-sm leading-tight truncate">{business.name}</h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{displayAddress}</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleWhatsApp}
                  className="w-full flex items-center justify-center gap-2 h-12 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-2xl font-bold shadow-xs transition-all active:scale-[0.99] cursor-pointer text-sm"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={handleCall}
                  className="w-full flex items-center justify-center gap-2 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xs transition-all active:scale-[0.99] cursor-pointer text-sm"
                >
                  <Phone className="w-5 h-5" />
                  <span>Llamar</span>
                </button>
              </div>

              {/* Desktop Floating Share Popover */}
              <div className="relative pt-2 border-t border-border/60" ref={sharePopoverRef}>
                {showDesktopShare && (
                  <div className="hidden lg:flex items-center gap-2 absolute bottom-full right-0 mb-3 bg-[#151b26] text-white px-3 py-2 rounded-full shadow-2xl border border-white/10 z-50 whitespace-nowrap">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Compartir en WhatsApp"
                      onClick={() => setShowDesktopShare(false)}
                      className="w-9 h-9 rounded-full bg-[#25D366] hover:scale-110 transition-transform flex items-center justify-center text-white"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Compartir en Facebook"
                      onClick={() => setShowDesktopShare(false)}
                      className="w-9 h-9 rounded-full bg-[#1877F2] hover:scale-110 transition-transform flex items-center justify-center text-white"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.5-1.5h1.7V5c-.3 0-1.3-.1-2.5-.1-2.4 0-4.1 1.5-4.1 4.2V11H7.5v3h2.6v8h3.4z" />
                      </svg>
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Compartir en X"
                      onClick={() => setShowDesktopShare(false)}
                      className="w-9 h-9 rounded-full bg-black border border-white/15 hover:scale-110 transition-transform flex items-center justify-center text-white"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Compartir en LinkedIn"
                      onClick={() => setShowDesktopShare(false)}
                      className="w-9 h-9 rounded-full bg-[#0A66C2] hover:scale-110 transition-transform flex items-center justify-center text-white"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6.94 8.5H3.56V19.5H6.94V8.5ZM5.25 3.5C4.14 3.5 3.25 4.39 3.25 5.5C3.25 6.6 4.14 7.5 5.25 7.5C6.35 7.5 7.25 6.6 7.25 5.5C7.25 4.39 6.35 3.5 5.25 3.5ZM20.44 13.02C20.44 9.88 18.76 8.22 16.16 8.22C14.37 8.22 13.48 9.2 13.02 9.93V8.5H9.65C9.7 9.48 9.65 19.5 9.65 19.5H13.02V13.36C13.02 13.02 13.05 12.69 13.15 12.45C13.42 11.78 14.03 11.09 15.07 11.09C16.41 11.09 17.06 12.11 17.06 13.6V19.5H20.44V13.02Z" />
                      </svg>
                    </a>
                    <a
                      href={`mailto:?subject=${encodeURIComponent(business.name)}&body=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}
                      title="Compartir por Correo"
                      onClick={() => setShowDesktopShare(false)}
                      className="w-9 h-9 rounded-full bg-[#105238] hover:scale-110 transition-transform flex items-center justify-center text-[#8ee01a]"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      title={copiedLink ? "Enlace copiado" : "Copiar enlace"}
                      className={cn(
                        "w-9 h-9 rounded-full hover:scale-110 transition-all flex items-center justify-center text-white cursor-pointer",
                        copiedLink ? "bg-[#105238] text-[#8ee01a]" : "bg-[#374151]",
                      )}
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                    </button>
                    <span className="absolute -bottom-1.5 right-10 w-3 h-3 bg-[#151b26] rotate-45 border-r border-b border-white/10" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowDesktopShare((prev) => !prev)}
                  className="w-full h-10 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                  <span>{copiedLink ? "¡Enlace copiado!" : "Compartir comercio"}</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gradient-to-t from-background from-80% to-transparent pt-8 pb-5 px-4 space-y-3 z-30 pointer-events-none">
        <div className="pointer-events-auto flex gap-2">
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full font-semibold transition-colors shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </button>
          <button
            onClick={handleCall}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-colors shadow-lg"
          >
            <Phone className="w-5 h-5" />
            Llamar
          </button>
          <button
            onClick={handleShare}
            className="w-14 h-14 flex items-center justify-center bg-card border border-border rounded-full hover:bg-muted transition-colors shadow-lg"
            aria-label="Compartir"
          >
            <Share2 className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedService && (
        <BookingModal service={selectedService} onClose={() => setShowBookingModal(false)} />
      )}
    </main>
  )
}
