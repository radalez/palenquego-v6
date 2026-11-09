"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  MapPin,
  Star,
  Filter,
  Flame,
  Bed,
  Waves,
  Coffee,
  TreePine,
  Utensils,
  Ticket,
  MessageCircle,
  Phone,
  Share2,
  ExternalLink,
  Building2,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn, formatImageUrl, handleImageFallback, DEFAULT_FALLBACK_IMAGE } from "@/lib/utils"
import { useAppStore, type Business } from "@/lib/store"
import { HeaderWithMenu } from "@/components/header-with-menu"
import { AdvancedFilterPanel, type FilterOptions } from "@/components/advanced-filter-panel"

const categories = [
  { id: "all", label: "Todo", icon: Flame },
  { id: "hotel", label: "Hoteles", icon: Bed },
  { id: "surf", label: "Surf", icon: Waves },
  { id: "cafe", label: "Café", icon: Coffee },
  { id: "eco", label: "Ecoturismo", icon: TreePine },
  { id: "food", label: "Gastronomía", icon: Utensils },
  { id: "playa", label: "Playa", icon: Waves },
  { id: "events", label: "Eventos", icon: Ticket },
]

function matchesBusinessCategory(businessCategory: string = "", selectedCategory: string): boolean {
  if (selectedCategory === "all") return true
  const cat = businessCategory.toLowerCase()
  switch (selectedCategory) {
    case "hotel": return cat.includes("hotel") || cat.includes("hospedaj")
    case "surf": return cat.includes("surf")
    case "cafe": return cat.includes("café") || cat.includes("cafe")
    case "eco": return cat.includes("eco") || cat.includes("tour")
    case "food": return cat.includes("gastro") || cat.includes("restauran") || cat.includes("comida")
    case "playa": return cat.includes("playa")
    default: return cat.includes(selectedCategory.toLowerCase())
  }
}

interface BusinessesScreenProps {
  onNavigate?: (tab: string) => void
}

export function BusinessesScreen({ onNavigate }: BusinessesScreenProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    ratingMin: 0,
    priceMin: 0,
    priceMax: 500,
    searchQuery: "",
  })

  const { businesses, currentUser, accessToken } = useAppStore()

  const [isB2BMode, setIsB2BMode] = useState(false)
  const [isPromoterMode, setIsPromoterMode] = useState(false)
  const [targetStore, setTargetStore] = useState<Business | null>(null)
  const [invitationCategory, setInvitationCategory] = useState<"PROMOTOR" | "ALIADO_B2B">("ALIADO_B2B")
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [contactPhone, setContactPhone] = useState(currentUser?.telefono || "")
  const [proposalMessage, setProposalMessage] = useState("")
  const [submittingProposal, setSubmittingProposal] = useState(false)
  const [proposalSuccess, setProposalSuccess] = useState<string | null>(null)
  const [proposalError, setProposalError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const b2bActive = sessionStorage.getItem("palenque_b2b_mode") === "true"
      const promoterActive = sessionStorage.getItem("palenque_promoter_mode") === "true"
      const isAliado = currentUser?.tipo === "ALIADO" || Boolean((currentUser as any)?.is_aliado)

      setIsB2BMode(Boolean(b2bActive && isAliado))
      setIsPromoterMode(Boolean(promoterActive))
    }
  }, [currentUser])

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("palenque_b2b_mode")
        sessionStorage.removeItem("palenque_promoter_mode")
      }
    }
  }, [])

  const handleNav = (tab: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("palenque_b2b_mode")
      sessionStorage.removeItem("palenque_promoter_mode")
    }
    onNavigate?.(tab)
  }

  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetStore) return
    if (!contactPhone.trim()) {
      setProposalError("Por favor ingresa un teléfono o WhatsApp de contacto.")
      return
    }

    setSubmittingProposal(true)
    setProposalError(null)

    try {
      const token = accessToken || useAppStore.getState().accessToken
      const res = await fetch("/api-proxy/marketing/solicitar-promotor/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tienda_id: targetStore.id,
          telefono_whatsapp: contactPhone.trim(),
          mensaje: proposalMessage.trim(),
          categoria: invitationCategory,
          es_lider_pool: invitationCategory === "PROMOTOR",
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setProposalSuccess(data.message || `¡Solicitud enviada con éxito a ${targetStore.name}!`)
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("palenque_b2b_mode")
          sessionStorage.removeItem("palenque_promoter_mode")
        }
      } else {
        setProposalError(data.error || data.detail || "No fue posible enviar la solicitud.")
      }
    } catch (err) {
      setProposalError("Error de conexión al enviar la solicitud.")
    } finally {
      setSubmittingProposal(false)
    }
  }

  const filteredBusinesses = businesses.filter((business) => {
    // Category filter
    if (selectedCategory !== "all" && !matchesBusinessCategory(business.category, selectedCategory)) {
      return false
    }

    // Search filter
    const combinedSearch = searchQuery || filters.searchQuery
    if (combinedSearch && !business.name.toLowerCase().includes(combinedSearch.toLowerCase())) {
      return false
    }

    // Rating filter
    if (business.rating < filters.ratingMin) {
      return false
    }

    return true
  })

  const handleWhatsApp = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const cleanPhone = phone.replace(/\D/g, "")
    window.open(`https://wa.me/${cleanPhone}`, "_blank")
  }

  const handleCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation()
    window.location.href = `tel:${phone}`
  }

  const handleShare = (business: Business, e: React.MouseEvent) => {
    e.stopPropagation()
    if (navigator.share) {
      navigator.share({
        title: business.name,
        text: business.description,
        url: window.location.href,
      })
    } else {
      const url = `${window.location.origin}?business=${business.id}`
      navigator.clipboard.writeText(url)
    }
  }

  return (
    <div className="flex flex-col">
      <HeaderWithMenu title="Servicios" onNavigate={handleNav} />
      <div className="flex justify-between items-center px-4 py-4">
        <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
          <span className="text-primary-foreground font-semibold">JD</span>
        </div>
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar tiendas..."
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

      {/* Banner de Modo Socio B2B */}
      {isB2BMode && (
        <div className="mx-4 mb-2 bg-[#eaf0e2] dark:bg-[#105238]/30 border border-[#91c44a]/50 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#91c44a]/30 text-[#105238] dark:text-[#8ee01a] flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#105238] dark:text-[#eaf0e2]">Modo Selección de Alianza B2B Activo</p>
              <p className="text-[11px] text-[#105238]/80 dark:text-[#eaf0e2]/80 truncate">
                Busca y pulsa "Elegir como socio comercial" sobre la tienda deseada.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              sessionStorage.removeItem("palenque_b2b_mode")
              setIsB2BMode(false)
            }}
            className="text-[#105238] dark:text-[#eaf0e2] hover:bg-[#91c44a]/20 border border-[#91c44a]/40 text-xs h-7 px-2.5 rounded-lg shrink-0 cursor-pointer"
          >
            Salir
          </Button>
        </div>
      )}

      {/* Banner de Modo Embajador / Promotor */}
      {isPromoterMode && (
        <div className="mx-4 mb-2 bg-[#eaf0e2] dark:bg-[#105238]/30 border border-[#105238]/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#105238]/15 text-[#105238] dark:text-[#8ee01a] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#105238] dark:text-[#eaf0e2]">Modo Postulación de Embajador Activo</p>
              <p className="text-[11px] text-[#105238]/80 dark:text-[#eaf0e2]/80 truncate">
                Busca y pulsa "Postular como Embajador" sobre el comercio que deseas promocionar.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              sessionStorage.removeItem("palenque_promoter_mode")
              setIsPromoterMode(false)
            }}
            className="text-[#105238] dark:text-[#eaf0e2] hover:bg-[#105238]/10 border border-[#105238]/30 text-xs h-7 px-2.5 rounded-lg shrink-0 cursor-pointer"
          >
            Salir
          </Button>
        </div>
      )}

      {/* Categories */}
      <div className="px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Botón para ir a las rutas clásicas */}
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
            <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors duration-300">Mapa y Rutas en Vivo</h3>
            <p className="text-sm text-muted-foreground leading-tight mt-0.5">Sigue tu transporte y mira las paradas en tiempo real.</p>
          </div>
        </div>
      </div>

      {/* Business Cards */}
      <div className="px-4 pb-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBusinesses.length > 0 ? (
          filteredBusinesses.map((business) => (
          <div
            key={business.id}
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.setItem("palenque_return_tab", "businesses")
              }
              router.push(`/b/${business.id}?from=businesses`)
            }}
            className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border hover:border-primary transition-colors cursor-pointer"
          >
              {/* Cover Image */}
              <div className="relative h-40">
                <img
                  src={formatImageUrl(business.coverImage)}
                  alt={business.name}
                  onError={(e) => handleImageFallback(e, DEFAULT_FALLBACK_IMAGE)}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                  {business.category}
                </Badge>

                {/* Botón sobre la imagen para Modo B2B */}
                {isB2BMode && (currentUser?.tipo === "ALIADO" || Boolean((currentUser as any)?.is_aliado)) && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setTargetStore(business)
                      setInvitationCategory("ALIADO_B2B")
                      setContactPhone(currentUser?.telefono || "")
                      setProposalMessage("")
                      setProposalSuccess(null)
                      setProposalError(null)
                      setShowApplyModal(true)
                    }}
                    className="absolute bottom-2.5 right-2.5 bg-[#91c44a] hover:bg-[#82b43e] text-[#105238] font-bold text-xs h-8 px-3 rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer z-20 border border-[#7ea83c]"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Elegir como socio comercial</span>
                  </Button>
                )}

                {/* Botón sobre la imagen para Modo Embajador */}
                {isPromoterMode && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setTargetStore(business)
                      setInvitationCategory("PROMOTOR")
                      setContactPhone(currentUser?.telefono || "")
                      setProposalMessage("")
                      setProposalSuccess(null)
                      setProposalError(null)
                      setShowApplyModal(true)
                    }}
                    className="absolute bottom-2.5 right-2.5 bg-[#105238] hover:bg-[#0c3e2a] text-[#8ee01a] font-bold text-xs h-8 px-3 rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer z-20 border border-[#8ee01a]/40"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Postular</span>
                  </Button>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Business Info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{business.name}</h3>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <MapPin className="w-3 h-3" />
                      <span>{business.location}</span>
                    </div>
                  </div>
                  <Avatar className="h-10 w-10 flex-shrink-0 bg-muted border border-border shadow-sm">
                  {/* Cargamos la imagen real del logo del negocio */}
                  <AvatarImage src={formatImageUrl(business.logo)} alt={business.name} className="object-cover" />
                  
                  {/* Fallback con iniciales si la imagen no carga */}
                  <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground uppercase">
                    {business.name?.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 py-2 border-t border-b border-border">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium text-foreground text-sm">{business.rating}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">({business.reviews} reseñas)</span>
                  <span className="text-muted-foreground text-xs ml-auto">
                    {business.services.length} servicio{business.services.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">{business.description}</p>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 flex items-center justify-center gap-1.5 font-medium hover:border-primary hover:text-primary transition-colors text-xs"
                    onClick={(e) => handleWhatsApp(business.socialLinks.whatsapp || "", e)}
                    disabled={!business.socialLinks.whatsapp}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 flex items-center justify-center gap-1.5 font-medium hover:border-primary hover:text-primary transition-colors text-xs"
                    onClick={(e) => handleCall(business.socialLinks.phone || "", e)}
                    disabled={!business.socialLinks.phone}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Llamar
                  </Button>
                </div>

                {/* Social Links */}
                {(business.socialLinks.instagram || business.socialLinks.facebook) && (
                  <div className="flex gap-2 pt-2 border-t">
                    {business.socialLinks.instagram && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(`https://instagram.com/${business.socialLinks.instagram}`, "_blank")
                        }}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Instagram
                      </Button>
                    )}
                    {business.socialLinks.facebook && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(`https://facebook.com/${business.socialLinks.facebook}`, "_blank")
                        }}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Facebook
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron tiendas</p>
          </div>
        )}
      </div>

      {showFilterPanel && (
        <AdvancedFilterPanel
          onFilter={(newFilters) => setFilters(newFilters)}
          onClose={() => setShowFilterPanel(false)}
          maxPrice={500}
        />
      )}

      {/* Modal Directo de Postulación: B2B o Embajador con tienda preseleccionada */}
      {showApplyModal && targetStore && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 border border-border shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowApplyModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border",
                invitationCategory === "ALIADO_B2B"
                  ? "bg-[#91c44a]/20 text-[#105238] dark:text-[#8ee01a] border-[#91c44a]/30"
                  : "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-emerald-600/20"
              )}>
                {invitationCategory === "ALIADO_B2B" ? (
                  <Building2 className="w-5 h-5" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {invitationCategory === "ALIADO_B2B" ? "Proponer Alianza Comercial B2B" : "Postular como Embajador"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {invitationCategory === "ALIADO_B2B"
                    ? "Alianzas estratégicas entre negocios de la red PalenqueGo"
                    : "Promociona este comercio a tus grupos y gana comisiones"}
                </p>
              </div>
            </div>

            {proposalSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-foreground text-sm">¡Solicitud Enviada con Éxito!</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed px-4">
                    {proposalSuccess}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setShowApplyModal(false)
                    setProposalSuccess(null)
                    setIsB2BMode(false)
                    setIsPromoterMode(false)
                    if (typeof window !== "undefined") {
                      sessionStorage.removeItem("palenque_b2b_mode")
                      sessionStorage.removeItem("palenque_promoter_mode")
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl cursor-pointer"
                >
                  Entendido
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSendProposal} className="space-y-3.5 mt-4">
                {proposalError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-semibold">
                    {proposalError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    {invitationCategory === "ALIADO_B2B"
                      ? "Negocio Aliado al que deseas vincularte"
                      : "Comercio que deseas promocionar"}
                  </label>
                  <div className={cn(
                    "p-3 rounded-2xl flex items-center gap-3 border",
                    invitationCategory === "ALIADO_B2B"
                      ? "bg-[#eaf0e2] dark:bg-[#105238]/30 border-[#91c44a]/40"
                      : "bg-muted/40 border-border"
                  )}>
                    <Avatar className="h-11 w-11 rounded-xl border border-border shadow-xs shrink-0">
                      <AvatarImage src={formatImageUrl(targetStore.logo)} alt={targetStore.name} className="object-cover" />
                      <AvatarFallback className="font-bold text-xs bg-emerald-700 text-white uppercase">
                        {targetStore.name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-foreground truncate">{targetStore.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{targetStore.category} • {targetStore.location}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Tu Correo Electrónico
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={currentUser?.email || ""}
                    className="w-full px-3.5 py-2.5 bg-muted/30 border border-border/60 rounded-xl text-xs text-muted-foreground cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Teléfono / WhatsApp de Contacto *
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="ej: +503 7000 0000"
                    className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    {invitationCategory === "ALIADO_B2B"
                      ? "Propuesta de Alianza / Paquetes Combinados"
                      : "Propuesta o Mensaje (Opcional)"}
                  </label>
                  <textarea
                    rows={3}
                    value={proposalMessage}
                    onChange={(e) => setProposalMessage(e.target.value)}
                    placeholder={
                      invitationCategory === "ALIADO_B2B"
                        ? "Ej: Somos Hotel El Tunco y nos gustaría ofrecer sus tours a nuestros huéspedes y publicar sus paquetes en nuestra recepción para comisionar mutuamente..."
                        : "Hola, organizo grupos y viajo frecuentemente con amigos. Me gustaría ser embajador y compartir sus servicios..."
                    }
                    className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowApplyModal(false)}
                    className="w-1/3 h-10 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingProposal}
                    className={cn(
                      "w-2/3 h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md",
                      invitationCategory === "ALIADO_B2B"
                        ? "bg-[#91c44a] hover:bg-[#82b43e] text-[#105238]"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    )}
                  >
                    {submittingProposal ? (
                      <span>Enviando...</span>
                    ) : (
                      <>
                        {invitationCategory === "ALIADO_B2B" ? (
                          <Building2 className="w-3.5 h-3.5" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>{invitationCategory === "ALIADO_B2B" ? "Enviar Propuesta B2B" : "Enviar Solicitud"}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
</div>
  )
}
