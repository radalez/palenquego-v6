"use client"

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  CheckCircle2,
  MessageCircle,
  Phone,
  Share2,
  Heart,
  FileText,
  Sparkles,
  Gift,
  Tag,
  Home,
  User,
  Instagram,
  Globe,
  Mail,
  Link2,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"
import { BookingModal } from "@/components/booking-modal"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface ServiceDetailPageProps {
  params: Promise<{ id: string }>
}

const ScriptInjector = ({ htmlContent }: { htmlContent: string }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !htmlContent) return
    try {
      const slotHtml = document.createRange().createContextualFragment(htmlContent)
      containerRef.current.innerHTML = ""
      containerRef.current.appendChild(slotHtml)
    } catch (e) {
      console.error("Error inyectando script:", e)
    }
    return () => {
      // Limpiar los elementos inyectados globalmente por el chatbot de Landingfy
      const tooltip = document.getElementById("lfyTooltip")
      if (tooltip) tooltip.remove()

      const launcher = document.getElementById("lfyLauncher")
      if (launcher) launcher.remove()

      const widget = document.getElementById("lfyWidget")
      if (widget) widget.remove()

      // Restablecer la variable global para permitir que se cargue de nuevo
      if (typeof window !== "undefined") {
        ;(window as any).LandingFyChatbotLoaded = false
      }
    }
  }, [htmlContent])

  return <div ref={containerRef} />
}

export default function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { services, fetchServices, toggleFavoritePreference, userFavorites } = useAppStore()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("vista-general")
  const [showDesktopShare, setShowDesktopShare] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const sharePopoverRef = useRef<HTMLDivElement>(null)

  const serviceId = parseInt(resolvedParams.id)
  const service = services.find((s) => s.id === serviceId)
  const [isLoading, setIsLoading] = useState(!service)

  useEffect(() => {
    if (service) {
      setIsLoading(false)
      return
    }
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      try {
        await fetchServices()
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [serviceId, Boolean(service)])

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
      const fromParam = urlParams.get("from") || sessionStorage.getItem("palenque_return_tab") || "marketplace"
      navigateToTab(fromParam)
      return
    }
    router.back()
  }

  if (isLoading && !service) {
    return (
      <div className="min-h-screen bg-[#fafaf8] dark:bg-background flex flex-col items-center justify-center px-4 gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-[#105238] border-t-transparent animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">Cargando experiencia...</p>
      </div>
    )
  }

  // Render not found state after loading finishes
  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full bg-card border border-border rounded-3xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground mb-4">Servicio no encontrado</h1>
          <Button onClick={handleBack} className="bg-[#105238] hover:bg-[#0c3e2b] text-white rounded-xl">
            Volver
          </Button>
        </div>
      </div>
    )
  }

  const serviceTitle = typeof service.name === "object" ? (service as any).name?.nombre : (service.name as string)
  const serviceLocation = typeof service.location === "object" ? (service as any).location?.nombre : service.location
  const serviceDescription =
    typeof service.description === "object" ? (service as any).description?.descripcion : service.description

  const images =
    service.galleryImages && service.galleryImages.length > 0
      ? service.galleryImages
      : [service.image || "/placeholder.svg"]
  const isFavorite = userFavorites.some((f) => f.serviceId === service.id)
  const hasActiveFlash = Boolean(service.oferta_flash && service.oferta_flash.cupos_disponibles > 0)

  const handleWhatsApp = () => {
    if (service.socialLinks?.whatsapp) {
      const cleanPhone = service.socialLinks.whatsapp.replace(/\D/g, "")
      window.open(`https://wa.me/${cleanPhone}`, "_blank")
    }
  }

  const handleCall = () => {
    if (service.socialLinks?.whatsapp) {
      const cleanPhone = service.socialLinks.whatsapp.replace(/\D/g, "")
      window.location.href = `tel:${cleanPhone}`
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: serviceTitle,
        text: serviceDescription,
        url: window.location.href,
      })
    }
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""
  const shareText = `${serviceTitle} en PalenqueGo`

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
    { id: "oferta-flash", label: "Oferta Flash", visible: Boolean(hasActiveFlash && service.oferta_flash) },
    { id: "comercio", label: "Comercio", visible: Boolean(service.businessName) },
    { id: "descripcion", label: "Descripción", visible: Boolean(serviceDescription) },
    { id: "rutas", label: "Rutas", visible: Boolean(service.routes && service.routes.length > 0) },
    { id: "caracteristicas", label: "Características", visible: Boolean(service.features && service.features.length > 0) },
    { id: "extras", label: "Extras", visible: Boolean(service.extras && service.extras.length > 0) },
    {
      id: "redes",
      label: "Redes",
      visible: Boolean(service.socialLinks && (service.socialLinks.instagram || service.socialLinks.facebook)),
    },
  ].filter((sec) => sec.visible)

  return (
    <main className="min-h-screen bg-[#fafaf8] dark:bg-background flex flex-col pb-32 lg:pb-16">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          aria-label="Volver"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1 text-center">Detalles</h1>
        <button
          onClick={() => toggleFavoritePreference(service.id)}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          aria-label="Guardar en favoritos"
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-colors",
              isFavorite ? "fill-[#105238] text-[#105238]" : "text-foreground",
            )}
          />
        </button>
      </div>

      {/* Desktop Top Navbar */}
      <header className="hidden md:block sticky top-0 z-30 bg-white/95 dark:bg-card/95 backdrop-blur-md border-b border-border/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          {/* Brand */}
          <button
            type="button"
            onClick={() => navigateToTab("map-explorer")}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <img src="/icon-192.png" alt="PalenqueGo" className="w-9 h-9 rounded-xl object-contain" />
            <span className="font-extrabold text-base text-[#105238] dark:text-[#8ee01a] tracking-tight">
              PalenqueGo
            </span>
          </button>

          {/* Internal Section Navigation Links */}
          <nav className="flex items-center gap-5 h-full overflow-x-auto no-scrollbar">
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

          {/* Right Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toggleFavoritePreference(service.id)}
              className="w-9 h-9 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
              title="Guardar en favoritos"
            >
              <Heart
                className={cn(
                  "w-4 h-4 transition-colors",
                  isFavorite ? "fill-[#105238] text-[#105238]" : "text-foreground",
                )}
              />
            </button>
            <button
              type="button"
              onClick={() => navigateToTab("profile")}
              className="w-9 h-9 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
              title="Mi Perfil"
            >
              <User className="w-4 h-4 text-foreground" />
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="rounded-xl text-xs font-semibold gap-1 ml-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver
            </Button>
          </div>
        </div>
      </header>

      {/* Desktop Breadcrumb */}
      <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground max-w-6xl mx-auto w-full px-6 pt-5 pb-3">
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
        <span className="font-semibold text-foreground truncate max-w-md">{serviceTitle}</span>
      </div>

      {/* Main Content Layout: Mobile single column, Desktop 2 columns */}
      <div className="max-w-6xl mx-auto w-full md:px-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 items-start">
          {/* Left Column: Media + Full Details */}
          <div className="lg:col-span-8 space-y-6">
            {/* Image Slider */}
            <div
              id="vista-general"
              className="scroll-mt-24 relative h-64 sm:h-80 md:h-[380px] md:rounded-3xl bg-muted overflow-hidden shadow-xs border-b md:border border-border/60"
            >
              <img
                src={images[currentImageIndex] || "/placeholder.svg"}
                alt={serviceTitle}
                className="w-full h-full object-cover"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Siguiente imagen"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={cn(
                          "h-2 rounded-full transition-all cursor-pointer",
                          i === currentImageIndex ? "bg-white w-6" : "bg-white/50 w-2",
                        )}
                        aria-label={`Ver imagen ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Inner Content */}
            <div className="px-4 md:px-0 space-y-6">
              {/* Title, Location, Rating (and Price on Mobile/Tablet only) */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                    {serviceTitle}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                      <MapPin className="w-4 h-4 text-[#105238]" />
                      <span>{serviceLocation}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-[#eaf0e2] px-2.5 py-1 rounded-lg border border-[#aeb6a1]/50">
                      <Star className="w-4 h-4 fill-[#105238] text-[#105238]" />
                      <span className="font-bold text-[#105238] text-xs">{service.rating}</span>
                      <span className="text-[#105238]/80 text-xs">({service.reviews} reseñas)</span>
                    </div>
                  </div>
                </div>

                {/* Price visible inline on mobile/tablet; on desktop it lives in sticky sidebar */}
                <div className="text-right lg:hidden shrink-0">
                  <span className="text-3xl font-black text-[#105238]">${service.price}</span>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                    Precio Base
                  </p>
                </div>
              </div>

              {/* Oferta Flash Banner */}
              {hasActiveFlash && service.oferta_flash && (
                <div
                  id="oferta-flash"
                  className="scroll-mt-24 bg-[#eaf0e2] dark:bg-[#105238]/20 border border-[#8ee01a] rounded-2xl p-4 md:p-5 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#105238] text-[#8ee01a] shrink-0">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-[#105238] dark:text-foreground">
                          {service.oferta_flash.titulo_promocional || "Oportunidad Flash Activa"}
                        </h3>
                        <p className="text-xs text-[#105238]/80 dark:text-emerald-300 font-bold">
                          {service.oferta_flash.descuento_porcentaje}% de descuento inmediato
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#aeb6a1]/40">
                      <div className="sm:text-right">
                        <span className="text-2xl font-black text-[#105238] dark:text-[#8ee01a] block leading-tight">
                          ${service.oferta_flash.precio_promocional.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground line-through">
                          Antes ${service.price}
                        </span>
                      </div>

                      <div className="sm:border-l sm:border-[#aeb6a1]/50 sm:pl-5 text-right text-xs">
                        <span className="font-bold text-foreground block">
                          Cupos restantes:{" "}
                          <span className="text-[#105238] dark:text-[#8ee01a] font-black">
                            {service.oferta_flash.cupos_disponibles}
                          </span>{" "}
                          de {service.oferta_flash.cupos_totales}
                        </span>
                        <span className="text-muted-foreground text-[11px] font-medium">
                          Vence:{" "}
                          {new Date(service.oferta_flash.fecha_fin).toLocaleDateString([], {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Business Card */}
              {service.businessName && (
                <button
                  id="comercio"
                  onClick={() => router.push(`/b/${service.businessId}`)}
                  className="scroll-mt-24 w-full bg-[#eaf0e2]/60 dark:bg-card border border-[#aeb6a1]/60 rounded-2xl p-4 hover:border-[#105238] hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5 flex-1">
                      <Avatar className="w-14 h-14 border-2 border-[#105238] shadow-xs">
                        <AvatarImage src={service.businessAvatar} alt={service.businessName} className="object-cover" />
                        <AvatarFallback className="bg-[#105238] text-white font-bold text-lg">
                          {service.businessAvatar?.substring(0, 2).toUpperCase() || "BZ"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="text-[10px] text-[#105238] dark:text-[#8ee01a] font-bold uppercase tracking-wider mb-0.5">
                          Ofrecido por
                        </p>
                        <h3 className="font-bold text-foreground text-sm md:text-base leading-tight">
                          {service.businessName}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs font-bold text-foreground">{service.businessRating}</span>
                          <span className="text-xs text-muted-foreground">
                            ({service.businessReviews} reseñas)
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="text-[#105238] w-6 h-6" />
                  </div>
                </button>
              )}

              {/* Description */}
              {serviceDescription && (
                <div id="descripcion" className="scroll-mt-24 bg-card border border-border rounded-2xl p-5 shadow-2xs">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-[#105238]" />
                    <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">Descripción</h2>
                  </div>
                  <p className="text-foreground/90 text-sm leading-relaxed italic">"{serviceDescription}"</p>
                </div>
              )}

              {/* Associated Routes */}
              {service.routes && service.routes.length > 0 && (
                <div id="rutas" className="scroll-mt-24 bg-card border border-border rounded-2xl p-5 shadow-2xs">
                  <span className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#105238]" /> Disponible en rutas:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {service.routes.map((route: any) => (
                      <button
                        key={route.id}
                        onClick={() => {
                          useAppStore.getState().setReturnToMapRoute(route.name)
                          navigateToTab("map-explorer")
                        }}
                        className="text-xs md:text-sm font-semibold bg-[#eaf0e2] text-[#105238] hover:bg-[#105238] hover:text-white px-3.5 py-1.5 rounded-xl transition-colors border border-[#aeb6a1]/50 cursor-pointer"
                      >
                        {route.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              {service.features && service.features.length > 0 && (
                <div id="caracteristicas" className="scroll-mt-24">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-[#105238]" />
                    <h2 className="font-bold text-foreground text-base md:text-lg uppercase tracking-tight">
                      Características Incluidas
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {service.features.map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 p-3.5 bg-card border border-border rounded-xl hover:border-[#105238]/40 transition-colors shadow-2xs"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#105238] shrink-0" />
                        <span className="text-foreground text-xs font-medium">
                          {typeof feature === "object" ? (feature as any).nombre : feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extras */}
              {service.extras && service.extras.length > 0 && (
                <div id="extras" className="scroll-mt-24">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="w-5 h-5 text-[#105238]" />
                    <h2 className="font-bold text-foreground text-base md:text-lg uppercase tracking-tight">
                      Extras Disponibles
                    </h2>
                  </div>
                  <div className="space-y-2.5">
                    {service.extras.map((extra: any, idx: number) => {
                      const extraPrice = extra.precio_adicional || extra.precio || extra.price || 0
                      const extraName = extra.nombre || extra.name || "Extra adicional"

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-[#105238]/50 transition-all shadow-2xs"
                        >
                          <span className="text-foreground font-semibold text-sm">{extraName}</span>
                          <span className="text-[#105238] font-black text-base">+${extraPrice}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Social Links (Zero Emojis) */}
              {service.socialLinks && (service.socialLinks.instagram || service.socialLinks.facebook) && (
                <div id="redes" className="scroll-mt-24 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Share2 className="w-5 h-5 text-[#105238]" />
                    <h2 className="font-bold text-foreground text-base md:text-lg uppercase tracking-tight">
                      Síguenos en Redes
                    </h2>
                  </div>
                  <div className="flex gap-3">
                    {service.socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${service.socialLinks.instagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#105238] hover:bg-[#0c3e2b] text-white rounded-xl hover:shadow-md transition-all font-semibold text-sm"
                      >
                        <Instagram className="w-4 h-4" />
                        <span>Instagram</span>
                      </a>
                    )}
                    {service.socialLinks.facebook && (
                      <a
                        href={`https://facebook.com/${service.socialLinks.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl hover:shadow-md transition-all font-semibold text-sm"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Facebook</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Booking Card on Desktop */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24">
            <div className="bg-white dark:bg-card border border-border rounded-3xl p-6 shadow-lg space-y-5">
              {/* Price Display */}
              <div className="text-center pb-4 border-b border-border/70">
                {hasActiveFlash && service.oferta_flash ? (
                  <>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#eaf0e2] text-[#105238] text-[10px] font-black uppercase tracking-wider mb-1">
                      Oferta Flash -{service.oferta_flash.descuento_porcentaje}%
                    </span>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-black text-[#105238] dark:text-[#8ee01a]">
                        ${service.oferta_flash.precio_promocional.toFixed(2)}
                      </span>
                      <span className="text-base line-through text-muted-foreground">${service.price}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
                      Precio por cupo
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-black text-[#105238] dark:text-[#8ee01a] block leading-none">
                      ${service.price}
                    </span>
                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mt-1.5">
                      Precio Base
                    </p>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {!service.chatbotScript && (
                  <>
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
                  </>
                )}

                <Button
                  className="w-full h-13 bg-[#105238] hover:bg-[#0c3e2b] text-white rounded-2xl font-black text-base shadow-md transition-all active:scale-[0.99] cursor-pointer"
                  onClick={() => setShowBookingModal(true)}
                >
                  RESERVAR AHORA
                </Button>
              </div>

              {/* Secondary Share / Favorite */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => toggleFavoritePreference(service.id)}
                  className="flex-1 h-10 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Heart
                    className={cn(
                      "w-4 h-4",
                      isFavorite ? "fill-[#105238] text-[#105238]" : "text-muted-foreground",
                    )}
                  />
                  <span>{isFavorite ? "Guardado" : "Guardar"}</span>
                </button>
                <div className="relative flex-1" ref={sharePopoverRef}>
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
                        href={`mailto:?subject=${encodeURIComponent(serviceTitle)}&body=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}
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
                    <span>{copiedLink ? "¡Copiado!" : "Compartir"}</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gradient-to-t from-background from-80% to-transparent pt-8 pb-5 px-4 space-y-3 z-30 pointer-events-auto">
        <div className="flex gap-2">
          {!service.chatbotScript && (
            <>
              <button
                onClick={handleWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold shadow-lg transition-transform active:scale-95"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </button>
              <button
                onClick={handleCall}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg transition-transform active:scale-95"
              >
                <Phone className="w-5 h-5" />
                Llamar
              </button>
              <button
                onClick={handleShare}
                className="w-14 h-14 flex items-center justify-center bg-card border border-border rounded-full hover:bg-muted text-foreground shadow-lg transition-transform active:scale-95"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
        <div className={`flex ${service.chatbotScript ? "justify-start" : "justify-center"} w-full`}>
          <Button
            className={`h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-black text-lg shadow-xl ${
              service.chatbotScript ? "w-[80%]" : "w-full"
            }`}
            onClick={() => setShowBookingModal(true)}
          >
            RESERVAR AHORA
          </Button>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && <BookingModal service={service} onClose={() => setShowBookingModal(false)} />}

      {/* Chatbot Script Injector */}
      {service.chatbotScript && <ScriptInjector htmlContent={service.chatbotScript} />}
    </main>
  )
}
