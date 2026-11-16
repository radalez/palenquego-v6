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
  Plus,
  Play,
  Volume2,
  VolumeX,
  ShoppingBag,
  CloudUpload,
  Settings2,
  UserPlus,
  UserCheck,
  Trash2,
  X,
  Loader2,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useAppStore, DEFAULT_STORE_COVER, API_BASE, getProxyImage } from "@/lib/store"
import { BookingModal } from "@/components/booking-modal"
import { RealReviewsSection } from "@/components/real-reviews-section"
import { DesktopSidebar, DesktopFloatingIconRail } from "@/components/desktop-sidebar"
import { SidebarMenu } from "@/components/sidebar-menu"
import { PhoneCountryInput } from "@/components/phone-country-input"

interface BusinessDetailPageProps {
  params: Promise<{ id: string }>
}

const GPS_COORD_REGEX = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/

export default function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const storeIdNum = parseInt(resolvedParams.id)
  const { businesses, services, fetchBusinesses, fetchServices, currentUser, userPlan, accessToken } = useAppStore()
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [loadingInitial, setLoadingInitial] = useState(businesses.length === 0)
  const [activeSection, setActiveSection] = useState<string>("vista-general")
  const [resolvedAddress, setResolvedAddress] = useState<string>("")
  const [showDesktopShare, setShowDesktopShare] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(true)
  const sharePopoverRef = useRef<HTMLDivElement>(null)

  // Follow, Stories, Products & BYOC Cloudinary state
  const [isFollowingStore, setIsFollowingStore] = useState<boolean>(false)
  const [followersCount, setFollowersCount] = useState<number>(0)
  const [promoStories, setPromoStories] = useState<any[]>([])
  const [storeProducts, setStoreProducts] = useState<any[]>([])
  const [activeStoryViewerIdx, setActiveStoryViewerIdx] = useState<number | null>(null)
  const [storyMuted, setStoryMuted] = useState<boolean>(false)

  // Modals for Store Owner (Upload Story, Add Product, Configure Own Cloudinary) & Customer Product Purchase
  const [showUploadStoryModal, setShowUploadStoryModal] = useState(false)
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [showCloudinaryConfigModal, setShowCloudinaryConfigModal] = useState(false)
  const [selectedProductToBuy, setSelectedProductToBuy] = useState<any | null>(null)
  const [buyQuantity, setBuyQuantity] = useState<number>(1)
  const [buyerName, setBuyerName] = useState<string>("")
  const [buyerPhone, setBuyerPhone] = useState<string>("")
  const [productOrderConfirmed, setProductOrderConfirmed] = useState<boolean>(false)

  // Form drafts
  const [cloudNameDraft, setCloudNameDraft] = useState<string>("")
  const [uploadPresetDraft, setUploadPresetDraft] = useState<string>("")
  const [storyTitleDraft, setStoryTitleDraft] = useState<string>("")
  const [storyDescDraft, setStoryDescDraft] = useState<string>("")
  const [storyMediaUrlDraft, setStoryMediaUrlDraft] = useState<string>("")
  const [storyPriceDraft, setStoryPriceDraft] = useState<string>("")
  const [storyIsVideoDraft, setStoryIsVideoDraft] = useState<boolean>(true)
  const [productNameDraft, setProductNameDraft] = useState<string>("")
  const [productDescDraft, setProductDescDraft] = useState<string>("")
  const [productPriceDraft, setProductPriceDraft] = useState<string>("")
  const [productStockDraft, setProductStockDraft] = useState<string>("10")
  const [productImageUrlDraft, setProductImageUrlDraft] = useState<string>("")
  const [isUploadingToCloudinary, setIsUploadingToCloudinary] = useState<boolean>(false)
  const [actionStatusMsg, setActionStatusMsg] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      await fetchBusinesses()
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

  const business = businesses.find((b) => b.id === storeIdNum) as any
  const businessServices = business ? services.filter((s) => s.businessId === business.id) : []

  const isStoreOwner = Boolean(
    currentUser &&
      business &&
      (currentUser.id === business.aliado_id ||
        currentUser.name === business.aliado_nombre ||
        currentUser.tipo === "ALIADO" ||
        currentUser.es_aliado),
  )

  const isFreeOrBroncePlan = Boolean(
    !userPlan ||
      userPlan === "FREE" ||
      (currentUser?.plan &&
        ["bronce", "free", "gratis"].some((k) => String(currentUser.plan).toLowerCase().includes(k))),
  )

  // Hydrate follow state, promo stories, products & Cloudinary config when business loads
  useEffect(() => {
    if (!business) return
    setPromoStories(Array.isArray(business.promo_stories) ? business.promo_stories : [])
    setStoreProducts(Array.isArray(business.products) ? business.products : [])
    setFollowersCount(business.followers_count || 0)
    setCloudNameDraft(business.cloudinary_cloud_name || "")
    setUploadPresetDraft(business.cloudinary_upload_preset || "")

    let localFollow = Boolean(business.is_following)
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("palenque_followed_stores_v1")
        if (raw) {
          const ids: number[] = JSON.parse(raw)
          if (Array.isArray(ids) && ids.includes(business.id)) {
            localFollow = true
          }
        }
      } catch {
        // ignore
      }
    }
    setIsFollowingStore(localFollow)
  }, [business?.id, business?.promo_stories?.length, business?.products?.length])

  useEffect(() => {
    if (currentUser) {
      setBuyerName(currentUser.name || "")
      setBuyerPhone(currentUser.telefono || "")
    }
  }, [currentUser])

  const handleToggleFollow = async () => {
    if (!business) return
    const nextState = !isFollowingStore
    setIsFollowingStore(nextState)
    setFollowersCount((prev) => Math.max(0, prev + (nextState ? 1 : -1)))

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("palenque_followed_stores_v1")
        const parsed: number[] = raw ? JSON.parse(raw) : []
        const updated = nextState
          ? Array.from(new Set([...parsed, business.id]))
          : parsed.filter((id) => id !== business.id)
        localStorage.setItem("palenque_followed_stores_v1", JSON.stringify(updated))
      } catch {
        // ignore
      }
    }

    if (accessToken) {
      try {
        const res = await fetch(`${API_BASE}/stores/list/${business.id}/follow/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        })
        if (res.ok) {
          const data = await res.json()
          setIsFollowingStore(Boolean(data.following))
          setFollowersCount(data.followers_count ?? 0)
        }
      } catch {
        // keep optimistic state
      }
    }
  }

  // Upload file directly from browser to the Business's own Cloudinary (or fallback if configured)
  const handleDirectCloudinaryFileUpload = async (
    file: File,
    onSuccessUrl: (url: string, isVideo: boolean) => void,
  ) => {
    setActionStatusMsg(null)
    const activeCloudName = (cloudNameDraft || business?.cloudinary_cloud_name || "").trim()
    const activePreset = (uploadPresetDraft || business?.cloudinary_upload_preset || "").trim()

    if (!activeCloudName || !activePreset) {
      setActionStatusMsg(
        "Primero configura tu Cloud Name y Upload Preset de tu cuenta de Cloudinary (o pega directamente tu enlace https://res.cloudinary.com/...).",
      )
      return
    }

    setIsUploadingToCloudinary(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", activePreset)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${activeCloudName}/auto/upload`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || !data.secure_url) {
        throw new Error(data?.error?.message || "No se pudo subir a Cloudinary. Verifica tu Cloud Name y Upload Preset.")
      }
      const isVid = file.type.startsWith("video/") || data.resource_type === "video"
      onSuccessUrl(data.secure_url, isVid)
      setActionStatusMsg("Archivo subido directamente a tu Cloudinary con éxito.")
    } catch (err: any) {
      setActionStatusMsg(err?.message || "Error al subir a tu Cloudinary.")
    } finally {
      setIsUploadingToCloudinary(false)
    }
  }

  const handleSaveCloudinaryConfig = async () => {
    if (!business) return
    setActionStatusMsg(null)
    try {
      const res = await fetch(`${API_BASE}/stores/list/${business.id}/cloudinary-config/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          cloudinary_cloud_name: cloudNameDraft.trim(),
          cloudinary_upload_preset: uploadPresetDraft.trim(),
        }),
      })
      if (res.ok) {
        await fetchBusinesses()
        setShowCloudinaryConfigModal(false)
      } else {
        const d = await res.json().catch(() => ({}))
        setActionStatusMsg(d.error || "No se pudo guardar la configuración.")
      }
    } catch {
      setActionStatusMsg("Error de red al guardar configuración de Cloudinary.")
    }
  }

  const handlePublishPromoStory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business) return
    setActionStatusMsg(null)
    if (promoStories.length >= 10) {
      setActionStatusMsg("Ya tienes 10 historias/videos de promoción activas hoy (máximo 10 diarias).")
      return
    }
    const cleanUrl = storyMediaUrlDraft.trim()
    if (!cleanUrl) {
      setActionStatusMsg("Sube un video/imagen a tu Cloudinary o pega el enlace de Cloudinary.")
      return
    }
    const looksLikeVideo =
      storyIsVideoDraft || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(cleanUrl) || cleanUrl.includes("/video/upload/")

    try {
      const res = await fetch(`${API_BASE}/stores/list/${business.id}/stories/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          titulo: storyTitleDraft.trim() || "Promo",
          descripcion: storyDescDraft.trim(),
          media_cloudinary_url: cleanUrl,
          es_video: looksLikeVideo,
          precio_promo: storyPriceDraft ? parseFloat(storyPriceDraft) : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setActionStatusMsg(data.error || "No se pudo publicar la historia.")
        return
      }
      setPromoStories((prev) => [data, ...prev].slice(0, 10))
      setStoryTitleDraft("")
      setStoryDescDraft("")
      setStoryMediaUrlDraft("")
      setStoryPriceDraft("")
      setShowUploadStoryModal(false)
      await fetchBusinesses()
    } catch {
      setActionStatusMsg("Error al publicar la promoción.")
    }
  }

  const handleDeletePromoStory = async (storyId: number) => {
    if (!business) return
    try {
      const res = await fetch(`${API_BASE}/stores/list/${business.id}/stories/?story_id=${storyId}`, {
        method: "DELETE",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      })
      if (res.ok) {
        setPromoStories((prev) => prev.filter((s) => s.id !== storyId))
        setActiveStoryViewerIdx(null)
        await fetchBusinesses()
      }
    } catch {
      // ignore
    }
  }

  const handleCreateStoreProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business) return
    setActionStatusMsg(null)
    if (isFreeOrBroncePlan && storeProducts.length >= 1) {
      setActionStatusMsg(
        "En el Plan Gratuito / Bronce solo puedes publicar 1 producto activo. Sube de plan para agregar más productos.",
      )
      return
    }
    if (!productNameDraft.trim() || !productPriceDraft) {
      setActionStatusMsg("Completa el nombre y el precio del producto.")
      return
    }

    try {
      const res = await fetch(`${API_BASE}/stores/list/${business.id}/products/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          nombre: productNameDraft.trim(),
          descripcion: productDescDraft.trim(),
          precio: parseFloat(productPriceDraft) || 0,
          stock: parseInt(productStockDraft, 10) || 10,
          imagen_cloudinary_url: productImageUrlDraft.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setActionStatusMsg(data.error || "No se pudo crear el producto.")
        return
      }
      setStoreProducts((prev) => [data, ...prev])
      setProductNameDraft("")
      setProductDescDraft("")
      setProductPriceDraft("")
      setProductImageUrlDraft("")
      setShowAddProductModal(false)
      await fetchBusinesses()
    } catch {
      setActionStatusMsg("Error al guardar el producto.")
    }
  }

  const handleDeleteStoreProduct = async (prodId: number) => {
    if (!business) return
    try {
      const res = await fetch(`${API_BASE}/stores/list/${business.id}/products/?product_id=${prodId}`, {
        method: "DELETE",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      })
      if (res.ok) {
        setStoreProducts((prev) => prev.filter((p) => p.id !== prodId))
        await fetchBusinesses()
      }
    } catch {
      // ignore
    }
  }

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
    { id: "promos-historias", label: `Promos (${promoStories.length}/10)`, visible: true },
    { id: "productos", label: `Productos (${storeProducts.length})`, visible: true },
    { id: "sobre-negocio", label: "Sobre el negocio", visible: Boolean(business.description) },
    { id: "servicios", label: `Servicios (${businessServices.length})`, visible: true },
  ].filter((sec) => sec.visible)

  const categoryLabel = business.category
    ? business.category.charAt(0).toUpperCase() + business.category.slice(1)
    : "General"

  const mapsUrl = lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null

  return (
    <div className="min-h-screen bg-[#fafaf8] dark:bg-background flex w-full">
      {/* Desktop Left Sidebar / Floating Icon Rail so Store pages always have the PalenqueGo menu */}
      {!isDesktopSidebarCollapsed && (
        <div className="hidden lg:block h-screen sticky top-0 shrink-0 z-30">
          <DesktopSidebar
            activeTab="marketplace"
            onNavigate={navigateToTab}
            onToggleCollapse={() => setIsDesktopSidebarCollapsed(true)}
          />
        </div>
      )}

      {isDesktopSidebarCollapsed && (
        <DesktopFloatingIconRail
          activeTab="marketplace"
          onNavigate={navigateToTab}
          onExpand={() => setIsDesktopSidebarCollapsed(false)}
        />
      )}

      <div className="lg:hidden">
        <SidebarMenu activeTab="marketplace" onNavigate={navigateToTab} />
      </div>

      <main className={cn("flex-1 min-w-0 min-h-screen bg-[#fafaf8] dark:bg-background flex flex-col pb-32 lg:pb-16", isDesktopSidebarCollapsed && "lg:pl-16")}>
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
              {/* Business Identity Card + Instagram-style Seguir / Mensaje + Circular Promo Stories */}
              <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-2xs space-y-5">
                <div className="flex items-start sm:items-center gap-4">
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

                      <span className="text-xs font-bold text-[#105238]">
                        {followersCount} {followersCount === 1 ? "seguidor" : "seguidores"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instagram-style Action Buttons: Seguir + Mensaje + Owner Management */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleToggleFollow}
                    className={cn(
                      "flex-1 min-w-[140px] h-10 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer",
                      isFollowingStore
                        ? "bg-[#eaf0e2] text-[#105238] border border-[#105238]/30 hover:bg-[#dfe8d4]"
                        : "bg-[#105238] hover:bg-[#0c3e2b] text-[#8ee01a]",
                    )}
                  >
                    {isFollowingStore ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Siguiendo</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Seguir</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="flex-1 min-w-[140px] h-10 rounded-xl bg-muted hover:bg-[#eaf0e2]/70 text-foreground hover:text-[#105238] border border-border/80 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-[#105238]" />
                    <span>Mensaje</span>
                  </button>

                  {isStoreOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setActionStatusMsg(null)
                        setShowCloudinaryConfigModal(true)
                      }}
                      className="h-10 px-3.5 rounded-xl bg-[#eaf0e2] hover:bg-[#105238] text-[#105238] hover:text-[#8ee01a] border border-[#aeb6a1]/70 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Conectar tu propio espacio de Cloudinary"
                    >
                      <Settings2 className="w-4 h-4" />
                      <span>Cloudinary Propio</span>
                    </button>
                  )}
                </div>

                {/* Instagram-style Circular Promo Stories Row (Up to 10/day) */}
                <div id="promos-historias" className="scroll-mt-24 pt-2 border-t border-border/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#105238] dark:text-[#8ee01a] flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Promociones en Video e Historias ({promoStories.length}/10 hoy)</span>
                    </span>
                    {isStoreOwner && promoStories.length < 10 && (
                      <button
                        type="button"
                        onClick={() => {
                          setActionStatusMsg(null)
                          setShowUploadStoryModal(true)
                        }}
                        className="text-xs font-extrabold text-[#105238] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Subir video promo</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-start gap-4 overflow-x-auto pb-1 scrollbar-hide">
                    {/* Owner's "+ Subir Promo" Circle */}
                    {isStoreOwner && promoStories.length < 10 && (
                      <button
                        type="button"
                        onClick={() => {
                          setActionStatusMsg(null)
                          setShowUploadStoryModal(true)
                        }}
                        className="flex flex-col items-center gap-1.5 shrink-0 w-20 group cursor-pointer"
                      >
                        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full p-[3px] bg-gradient-to-tr from-[#105238] to-[#8ee01a] shadow-sm group-hover:scale-105 transition-transform">
                          <div className="w-full h-full rounded-full bg-[#eaf0e2] flex items-center justify-center border-2 border-white text-[#105238]">
                            <Plus className="w-7 h-7 stroke-[2.5]" />
                          </div>
                        </div>
                        <span className="text-[11px] font-extrabold text-[#105238] text-center leading-tight line-clamp-1">
                          + Subir Promo
                        </span>
                      </button>
                    )}

                    {/* If the business has active promo videos/stories */}
                    {promoStories.length > 0 ? (
                      promoStories.map((st, idx) => {
                        const isVid =
                          st.es_video ||
                          /\.(mp4|webm|mov|m4v)(\?|$)/i.test(st.media_cloudinary_url || "") ||
                          (st.media_cloudinary_url || "").includes("/video/upload/")
                        const thumbUrl =
                          st.thumbnail_cloudinary_url ||
                          (isVid && (st.media_cloudinary_url || "").includes("/video/upload/")
                            ? st.media_cloudinary_url.replace(/\.(mp4|webm|mov|m4v)(\?.*)?$/i, ".jpg")
                            : st.media_cloudinary_url) ||
                          business.logo ||
                          effectiveCoverImage
                        return (
                          <button
                            key={st.id || idx}
                            type="button"
                            onClick={() => setActiveStoryViewerIdx(idx)}
                            className="flex flex-col items-center gap-1.5 shrink-0 w-20 group cursor-pointer"
                          >
                            <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full p-[3px] bg-gradient-to-tr from-[#105238] via-[#91c44a] to-[#8ee01a] shadow-md group-hover:scale-105 transition-transform">
                              {isVid ? (
                                <video
                                  src={st.media_cloudinary_url}
                                  poster={thumbUrl}
                                  muted
                                  playsInline
                                  preload="metadata"
                                  className="w-full h-full rounded-full object-cover border-2 border-white bg-black"
                                />
                              ) : (
                                <img
                                  src={thumbUrl}
                                  alt={st.titulo}
                                  className="w-full h-full rounded-full object-cover border-2 border-white bg-muted"
                                  onError={(e) => {
                                    e.currentTarget.src = business.logo || DEFAULT_STORE_COVER
                                  }}
                                />
                              )}
                              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#105238] text-[#8ee01a] border-2 border-white flex items-center justify-center shadow-xs">
                                <Play className="w-3 h-3 fill-current ml-0.5" />
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-foreground text-center leading-tight line-clamp-1">
                              {st.titulo || `Promo ${idx + 1}`}
                            </span>
                          </button>
                        )
                      })
                    ) : (
                      /* Instagram-style Empty State Circle when the store has no promos yet */
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex flex-col items-center gap-1.5 shrink-0 w-20 opacity-80">
                          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full p-[3px] border-2 border-dashed border-[#aeb6a1] flex items-center justify-center bg-muted/40">
                            <img
                              src={business.logo || DEFAULT_STORE_COVER}
                              alt="Sin promoción"
                              className="w-full h-full rounded-full object-cover grayscale opacity-60 border-2 border-white"
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-muted-foreground text-center leading-tight">
                            Sin promos
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                          Este comercio aún no ha publicado videos de promoción hoy.{" "}
                          {!isFollowingStore && (
                            <button
                              type="button"
                              onClick={handleToggleFollow}
                              className="font-extrabold text-[#105238] hover:underline cursor-pointer"
                            >
                              Síguelo para ver sus próximas historias en tu feed.
                            </button>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* NEW SECTION: PRODUCTOS DE LA TIENDA (con compra directa y límite de 1 producto en Plan Gratuito/Bronce) */}
              <div id="productos" className="scroll-mt-24 space-y-4 pt-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-5 h-5 text-[#105238]" />
                    <h2 className="text-lg md:text-xl font-bold text-foreground uppercase tracking-tight">
                      Productos de la Tienda
                    </h2>
                    <span className="text-xs font-bold text-[#105238] bg-[#eaf0e2] px-2.5 py-0.5 rounded-full">
                      {storeProducts.length} {storeProducts.length === 1 ? "producto" : "productos"}
                    </span>
                  </div>

                  {isStoreOwner && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setActionStatusMsg(null)
                        setShowAddProductModal(true)
                      }}
                      className="bg-[#105238] hover:bg-[#0c3e2b] text-[#8ee01a] font-black text-xs rounded-xl h-9 px-3.5 gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Producto</span>
                    </Button>
                  )}
                </div>

                {storeProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {storeProducts.map((prod: any) => {
                      const prodImg =
                        getProxyImage(prod.imagen_url || prod.imagen_cloudinary_url || prod.imagen || "") ||
                        effectiveCoverImage
                      return (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setSelectedProductToBuy(prod)
                            setBuyQuantity(1)
                            setProductOrderConfirmed(false)
                          }}
                          className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-[#105238]/50 transition-all group flex flex-col cursor-pointer"
                        >
                          <div className="relative h-44 overflow-hidden bg-[#eaf0e2]">
                            <img
                              src={prodImg}
                              alt={prod.nombre}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_STORE_COVER
                              }}
                            />
                            <div className="absolute top-2.5 left-2.5 bg-[#105238] text-[#8ee01a] text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs uppercase">
                              Producto Directo
                            </div>
                            {isStoreOwner && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteStoreProduct(prod.id)
                                }}
                                className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/65 hover:bg-black text-white flex items-center justify-center cursor-pointer"
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <div className="absolute bottom-2.5 right-2.5 bg-white/95 dark:bg-card/95 backdrop-blur-xs px-3 py-1 rounded-xl shadow-xs border border-border/60">
                              <span className="text-[#105238] dark:text-[#8ee01a] font-black text-base">
                                ${prod.precio}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                            <div>
                              <h3 className="font-extrabold text-foreground text-base line-clamp-1">
                                {prod.nombre}
                              </h3>
                              {prod.descripcion && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                  {prod.descripcion}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border/60">
                              <span className="text-[11px] font-semibold text-muted-foreground">
                                Disponible ({prod.stock || 10} en stock)
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedProductToBuy(prod)
                                  setBuyQuantity(1)
                                  setProductOrderConfirmed(false)
                                }}
                                className="bg-[#105238] hover:bg-[#0c3e2b] text-[#8ee01a] rounded-xl h-8 px-3.5 text-xs font-black cursor-pointer"
                              >
                                Comprar
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      Este comercio aún no tiene productos publicados en su vitrina.
                    </p>
                    {isStoreOwner && (
                      <p className="text-xs text-muted-foreground">
                        Puedes publicar tu producto con foto desde tu Cloudinary usando el botón{" "}
                        <strong>+ Agregar Producto</strong> (1 producto incluido en Plan Gratuito/Bronce).
                      </p>
                    )}
                  </div>
                )}
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
                  className="w-full flex items-center justify-center gap-2 h-12 bg-[#eaf0e2] hover:bg-[#dfe8d4] text-[#105238] border border-[#aeb6a1]/70 rounded-2xl font-bold shadow-xs transition-all active:scale-[0.99] cursor-pointer text-sm"
                >
                  <Phone className="w-5 h-5 text-[#105238]" />
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
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#eaf0e2] hover:bg-[#dfe8d4] text-[#105238] border border-[#aeb6a1]/70 rounded-full font-semibold transition-colors shadow-lg"
          >
            <Phone className="w-5 h-5 text-[#105238]" />
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

      {/* =====================================================================
          MODAL 1: VISOR VERTICAL DE HISTORIAS / VIDEOS PROMO ESTILO INSTAGRAM
         ===================================================================== */}
      {activeStoryViewerIdx !== null && promoStories[activeStoryViewerIdx] && (() => {
        const currentStory = promoStories[activeStoryViewerIdx]
        const isVid =
          currentStory.es_video ||
          /\.(mp4|webm|mov|m4v)(\?|$)/i.test(currentStory.media_cloudinary_url || "") ||
          (currentStory.media_cloudinary_url || "").includes("/video/upload/")

        return (
          <div
            onClick={() => setActiveStoryViewerIdx(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[400px] h-[86vh] max-h-[740px] rounded-3xl overflow-hidden bg-black border border-[#8ee01a]/40 shadow-2xl flex flex-col justify-between select-none"
            >
              {/* Top Progress Bars (1 to N stories) */}
              <div className="relative z-20 p-3 space-y-2.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <div className="flex items-center gap-1">
                  {promoStories.map((_: any, idx: number) => (
                    <div key={idx} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-300",
                          idx <= activeStoryViewerIdx ? "w-full bg-[#8ee01a]" : "w-0",
                        )}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={business.logo || DEFAULT_STORE_COVER}
                      alt={business.name}
                      className="w-9 h-9 rounded-full object-cover border-2 border-[#8ee01a]"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white truncate">{business.name}</p>
                      <p className="text-[10px] text-[#8ee01a] font-bold truncate">{currentStory.titulo}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isVid && (
                      <button
                        type="button"
                        onClick={() => setStoryMuted((prev) => !prev)}
                        className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer"
                      >
                        {storyMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    )}
                    {isStoreOwner && (
                      <button
                        type="button"
                        onClick={() => handleDeletePromoStory(currentStory.id)}
                        className="w-8 h-8 rounded-full bg-black/50 text-white hover:text-[#8ee01a] flex items-center justify-center cursor-pointer"
                        title="Eliminar esta historia"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveStoryViewerIdx(null)}
                      className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Media Content (Video or Image from Cloudinary) */}
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                {isVid ? (
                  <video
                    key={currentStory.media_cloudinary_url}
                    src={currentStory.media_cloudinary_url}
                    autoPlay
                    playsInline
                    muted={storyMuted}
                    onEnded={() => {
                      if (activeStoryViewerIdx < promoStories.length - 1) {
                        setActiveStoryViewerIdx(activeStoryViewerIdx + 1)
                      } else {
                        setActiveStoryViewerIdx(null)
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={currentStory.media_cloudinary_url}
                    alt={currentStory.titulo}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Left / Right Tap Navigation Zones */}
              <button
                type="button"
                onClick={() =>
                  setActiveStoryViewerIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))
                }
                className="absolute inset-y-20 left-0 w-1/3 z-10 focus:outline-none cursor-pointer"
                aria-label="Historia anterior"
              />
              <button
                type="button"
                onClick={() =>
                  setActiveStoryViewerIdx((prev) =>
                    prev !== null && prev < promoStories.length - 1 ? prev + 1 : null,
                  )
                }
                className="absolute inset-y-20 right-0 w-1/3 z-10 focus:outline-none cursor-pointer"
                aria-label="Siguiente historia"
              />

              {/* Bottom Caption + Direct Action Button */}
              <div className="relative z-20 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent space-y-3">
                {currentStory.descripcion && (
                  <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                    {currentStory.descripcion}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2">
                  {currentStory.precio_promo && (
                    <span className="bg-[#105238] text-[#8ee01a] text-sm font-black px-3.5 py-1.5 rounded-full border border-[#8ee01a]/50">
                      Promo ${currentStory.precio_promo}
                    </span>
                  )}
                  <Button
                    type="button"
                    onClick={() => {
                      setActiveStoryViewerIdx(null)
                      handleWhatsApp()
                    }}
                    className="flex-1 h-10 rounded-full bg-[#8ee01a] hover:bg-[#8ee01a]/90 text-[#105238] font-black text-xs cursor-pointer"
                  >
                    Pedir esta promoción por WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* =====================================================================
          MODAL 2: SUBIR HISTORIA / VIDEO DE PROMOCIÓN (CONECTADO A SU CLOUDINARY)
         ===================================================================== */}
      {showUploadStoryModal && (
        <div
          onClick={() => setShowUploadStoryModal(false)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#105238] bg-[#eaf0e2] px-2.5 py-0.5 rounded-full">
                  Historias Diarias ({promoStories.length}/10)
                </span>
                <h3 className="text-lg font-black text-foreground mt-1">Subir Video de Promoción</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadStoryModal(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishPromoStory} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Título corto (Debajo del círculo) *
                </label>
                <input
                  type="text"
                  maxLength={40}
                  placeholder="Ej: Promo 2x1, Menú Hoy, Descuento..."
                  value={storyTitleDraft}
                  onChange={(e) => setStoryTitleDraft(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[#eaf0e2]/65 border border-[#aeb6a1]/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#105238] flex items-center gap-1.5">
                    <CloudUpload className="w-4 h-4" />
                    <span>Subir a tu propio Cloudinary</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadStoryModal(false)
                      setShowCloudinaryConfigModal(true)
                    }}
                    className="text-[11px] font-bold text-[#105238] underline cursor-pointer"
                  >
                    {business.cloudinary_cloud_name ? `Cloud: ${business.cloudinary_cloud_name}` : "Configurar Cloud"}
                  </button>
                </div>

                <input
                  type="file"
                  accept="video/*,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleDirectCloudinaryFileUpload(file, (url, isVid) => {
                        setStoryMediaUrlDraft(url)
                        setStoryIsVideoDraft(isVid)
                      })
                    }
                  }}
                  className="block w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#105238] file:text-[#8ee01a] hover:file:bg-[#0c3e2b] file:cursor-pointer"
                />

                {isUploadingToCloudinary && (
                  <p className="text-xs font-bold text-[#105238] flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Subiendo directo a tu cuenta de Cloudinary...</span>
                  </p>
                )}

                <div>
                  <label className="text-[11px] font-bold text-[#105238] block mb-1">
                    O pega directamente tu enlace de Cloudinary (https://res.cloudinary.com/...)
                  </label>
                  <input
                    type="url"
                    placeholder="https://res.cloudinary.com/.../video/upload/..."
                    value={storyMediaUrlDraft}
                    onChange={(e) => setStoryMediaUrlDraft(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-[#aeb6a1] bg-white text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Precio Promo ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Opcional, ej: 15.00"
                    value={storyPriceDraft}
                    onChange={(e) => setStoryPriceDraft(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Tipo de archivo</label>
                  <select
                    value={storyIsVideoDraft ? "video" : "image"}
                    onChange={(e) => setStoryIsVideoDraft(e.target.value === "video")}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-semibold"
                  >
                    <option value="video">Video Promo (MP4/WebM)</option>
                    <option value="image">Imagen Promo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Descripción / Llamado a la acción
                </label>
                <input
                  type="text"
                  maxLength={200}
                  placeholder="Ej: Válido hoy hasta las 8:00 PM reservando desde PalenqueGo"
                  value={storyDescDraft}
                  onChange={(e) => setStoryDescDraft(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-xs"
                />
              </div>

              {actionStatusMsg && (
                <p className="text-xs font-bold text-[#105238] bg-[#eaf0e2] p-2.5 rounded-xl border border-[#105238]/20">
                  {actionStatusMsg}
                </p>
              )}

              <Button
                type="submit"
                disabled={isUploadingToCloudinary}
                className="w-full h-11 rounded-2xl bg-[#105238] hover:bg-[#0c3e2b] text-[#8ee01a] font-black text-sm cursor-pointer"
              >
                Publicar Historia de Promoción
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: AGREGAR PRODUCTO DE TIENDA (LÍMITE 1 EN PLAN GRATUITO/BRONCE)
         ===================================================================== */}
      {showAddProductModal && (
        <div
          onClick={() => setShowAddProductModal(false)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#105238] bg-[#eaf0e2] px-2.5 py-0.5 rounded-full">
                  {isFreeOrBroncePlan ? "Plan Bronce / Gratis: Máx 1 Producto" : "Catálogo de Productos"}
                </span>
                <h3 className="text-lg font-black text-foreground mt-1">Agregar Producto a tu Tienda</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isFreeOrBroncePlan && storeProducts.length >= 1 ? (
              <div className="p-4 rounded-2xl bg-[#eaf0e2] border border-[#105238]/30 space-y-3 text-center">
                <p className="text-xs font-extrabold text-[#105238]">
                  Ya tienes 1 producto activo en tu Plan Gratuito / Bronce.
                </p>
                <p className="text-xs text-[#105238]/80">
                  En el plan gratuito cada negocio puede publicar 1 producto directo. Sube a Plan Oro o Platino para agregar productos ilimitados.
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddProductModal(false)
                    navigateToTab("planes")
                  }}
                  className="w-full h-10 rounded-xl bg-[#105238] text-[#8ee01a] font-black text-xs cursor-pointer"
                >
                  Ver Planes Oro y Platino
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateStoreProduct} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Nombre del Producto *</label>
                  <input
                    type="text"
                    placeholder="Ej: Café Gourmet en Grano 1 lb, Camiseta Oficial, Pase VIP..."
                    value={productNameDraft}
                    onChange={(e) => setProductNameDraft(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-xs sm:text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Precio ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ej: 12.50"
                      value={productPriceDraft}
                      onChange={(e) => setProductPriceDraft(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-xs sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Stock disponible</label>
                    <input
                      type="number"
                      min="1"
                      value={productStockDraft}
                      onChange={(e) => setProductStockDraft(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Descripción</label>
                  <textarea
                    rows={2}
                    placeholder="Describe qué incluye tu producto..."
                    value={productDescDraft}
                    onChange={(e) => setProductDescDraft(e.target.value)}
                    className="w-full p-3 rounded-xl border border-border bg-background text-xs resize-none"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#eaf0e2]/65 border border-[#aeb6a1]/70 space-y-2">
                  <span className="text-xs font-extrabold text-[#105238] block">
                    Imagen del Producto (en tu Cloudinary)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleDirectCloudinaryFileUpload(file, (url) => {
                          setProductImageUrlDraft(url)
                        })
                      }
                    }}
                    className="block w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#105238] file:text-[#8ee01a] file:cursor-pointer"
                  />
                  <input
                    type="url"
                    placeholder="O pega la URL de la foto en Cloudinary..."
                    value={productImageUrlDraft}
                    onChange={(e) => setProductImageUrlDraft(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-[#aeb6a1] bg-white text-xs font-mono"
                  />
                </div>

                {actionStatusMsg && (
                  <p className="text-xs font-bold text-[#105238] bg-[#eaf0e2] p-2.5 rounded-xl">
                    {actionStatusMsg}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isUploadingToCloudinary}
                  className="w-full h-11 rounded-2xl bg-[#105238] hover:bg-[#0c3e2b] text-[#8ee01a] font-black text-sm cursor-pointer"
                >
                  Publicar Producto en mi Tienda
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: CONFIGURAR CUENTA PROPIA DE CLOUDINARY DEL NEGOCIO (BYOC)
         ===================================================================== */}
      {showCloudinaryConfigModal && (
        <div
          onClick={() => setShowCloudinaryConfigModal(false)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#105238] bg-[#eaf0e2] px-2.5 py-0.5 rounded-full">
                  Almacenamiento Propio
                </span>
                <h3 className="text-lg font-black text-foreground mt-1">Conecta tu propio Cloudinary</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCloudinaryConfigModal(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Tus videos de historias promocionales e imágenes de productos se suben directamente a tu propio espacio de <strong>Cloudinary</strong>. Ingresa los datos de tu cuenta:
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  1. Tu Cloud Name de Cloudinary *
                </label>
                <input
                  type="text"
                  placeholder="Ej: dxyz1234 o nombre-de-tu-cloud"
                  value={cloudNameDraft}
                  onChange={(e) => setCloudNameDraft(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-xs sm:text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  2. Tu Upload Preset (Unsigned) *
                </label>
                <input
                  type="text"
                  placeholder="Ej: ml_default o tu_preset_unsigned"
                  value={uploadPresetDraft}
                  onChange={(e) => setUploadPresetDraft(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-xs sm:text-sm font-mono"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  En tu panel de Cloudinary ve a <em>Settings → Upload → Upload presets</em> y crea un preset en modo <strong>Unsigned</strong>.
                </p>
              </div>
            </div>

            {actionStatusMsg && (
              <p className="text-xs font-bold text-[#105238] bg-[#eaf0e2] p-2.5 rounded-xl">
                {actionStatusMsg}
              </p>
            )}

            <Button
              type="button"
              onClick={handleSaveCloudinaryConfig}
              className="w-full h-11 rounded-2xl bg-[#105238] hover:bg-[#0c3e2b] text-[#8ee01a] font-black text-sm cursor-pointer"
            >
              Guardar Conexión Cloudinary
            </Button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 5: COMPRA DIRECTA DE PRODUCTO DE LA TIENDA
         ===================================================================== */}
      {selectedProductToBuy && (
        <div
          onClick={() => setSelectedProductToBuy(null)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-foreground">Comprar Producto</h3>
              <button
                type="button"
                onClick={() => setSelectedProductToBuy(null)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#fafaf8] dark:bg-background border border-border/80">
              <img
                src={
                  getProxyImage(
                    selectedProductToBuy.imagen_url ||
                      selectedProductToBuy.imagen_cloudinary_url ||
                      selectedProductToBuy.imagen ||
                      "",
                  ) || effectiveCoverImage
                }
                alt={selectedProductToBuy.nombre}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-sm text-foreground truncate">
                  {selectedProductToBuy.nombre}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {selectedProductToBuy.descripcion || business.name}
                </p>
                <p className="text-sm font-black text-[#105238] mt-0.5">
                  ${selectedProductToBuy.precio} c/u
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#eaf0e2]/60 border border-[#aeb6a1]/60">
              <span className="text-xs font-bold text-[#105238]">Cantidad</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBuyQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-[#105238]/20 font-black text-[#105238] cursor-pointer"
                >
                  -
                </button>
                <span className="font-black text-sm text-[#105238] w-6 text-center">{buyQuantity}</span>
                <button
                  type="button"
                  onClick={() => setBuyQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-[#105238] text-[#8ee01a] font-black cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Tu Nombre</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Tu WhatsApp / Teléfono</label>
                <PhoneCountryInput value={buyerPhone} onChange={setBuyerPhone} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-xs font-bold text-muted-foreground">Total a pagar:</span>
              <span className="text-xl font-black text-[#105238]">
                ${(Number(selectedProductToBuy.precio || 0) * buyQuantity).toFixed(2)}
              </span>
            </div>

            <Button
              type="button"
              onClick={() => {
                const total = (Number(selectedProductToBuy.precio || 0) * buyQuantity).toFixed(2)
                const rawPhone = business.socialLinks?.whatsapp || business.telefono_contacto || "50370000000"
                const cleanPhone = String(rawPhone).replace(/\D/g, "") || "50370000000"
                const msg = encodeURIComponent(
                  `¡Hola ${business.name}! Quiero comprar el producto "${selectedProductToBuy.nombre}" (Cantidad: ${buyQuantity}, Total: $${total}). Cliente: ${buyerName || "Viajero PalenqueGo"} (${buyerPhone || ""}).`,
                )
                window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank")
                setSelectedProductToBuy(null)
              }}
              className="w-full h-11 rounded-2xl bg-[#105238] hover:bg-[#0c3e2b] text-[#8ee01a] font-black text-sm cursor-pointer"
            >
              Confirmar Compra del Producto
            </Button>
          </div>
        </div>
      )}
      </main>
    </div>
  )
}
