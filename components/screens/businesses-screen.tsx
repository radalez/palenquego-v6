"use client"

import { useState } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useAppStore, type Business } from "@/lib/store"
import { HeaderWithMenu } from "@/components/header-with-menu"
import { AdvancedFilterPanel, type FilterOptions } from "@/components/advanced-filter-panel"

const categories = [
  { id: "all", label: "Todo", icon: Flame },
  { id: "hotel", label: "Hoteles", icon: Bed },
  { id: "surf", label: "Surf", icon: Waves },
  { id: "cafe", label: "Café", icon: Coffee },
  { id: "eco", label: "Eco Tours", icon: TreePine },
  { id: "food", label: "Comida", icon: Utensils },
  { id: "events", label: "Eventos", icon: Ticket },
]

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

  const { businesses } = useAppStore()

  const filteredBusinesses = businesses.filter((business) => {
    // Category filter
    if (selectedCategory !== "all" && business.category !== selectedCategory) {
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
      <HeaderWithMenu title="Negocios" onNavigate={onNavigate} />
      <div className="flex justify-between items-center px-4 py-4">
        <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
          <span className="text-primary-foreground font-semibold">JD</span>
        </div>
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar negocios..."
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

      {/* Business Cards */}
      <div className="px-4 space-y-4 pb-4">
        {filteredBusinesses.length > 0 ? (
          filteredBusinesses.map((business) => (
          <div
            key={business.id}
            onClick={() => router.push(`/b/${business.id}`)}
            className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border hover:border-primary transition-colors cursor-pointer"
          >
              {/* Cover Image */}
              <div className="relative h-40">
                <img
                  src={business.coverImage || "/placeholder.svg"}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                  {business.category}
                </Badge>
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
                  <AvatarImage src={business.logo} alt={business.name} className="object-cover" />
                  
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
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8"
                    onClick={(e) => handleWhatsApp(business.socialLinks.whatsapp || "", e)}
                    disabled={!business.socialLinks.whatsapp}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8"
                    onClick={(e) => handleCall(business.socialLinks.phone || "", e)}
                    disabled={!business.socialLinks.phone}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Llamar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 h-8"
                    onClick={(e) => handleShare(business, e)}
                  >
                    <Share2 className="w-4 h-4" />
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
            <p className="text-muted-foreground">No se encontraron negocios</p>
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
    </div>
  )
}
