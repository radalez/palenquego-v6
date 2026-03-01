"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  MapPin,
  Star,
  Heart,
  Filter,
  Flame,
  Bed,
  Waves,
  Coffee,
  TreePine,
  Utensils,
  Ticket,
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

const categories = [
  { id: "all", label: "Todo", icon: Flame },
  { id: "hotel", label: "Hoteles", icon: Bed },
  { id: "surf", label: "Surf", icon: Waves },
  { id: "cafe", label: "Café", icon: Coffee },
  { id: "eco", label: "Eco Tours", icon: TreePine },
  { id: "food", label: "Comida", icon: Utensils },
  { id: "events", label: "Eventos", icon: Ticket },
]

interface MarketplaceScreenProps {
  onNavigate?: (tab: string) => void
  onViewServiceDetail?: (service: Service) => void
}

export function MarketplaceScreen({ onNavigate, onViewServiceDetail }: MarketplaceScreenProps) {
  const router = useRouter()
  const [selectedService, setSelectedService] = useState<Service | null>(null)
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

  // --- CONEXIÓN A TU API REAL ---
  const { 
    services, 
    businesses, 
    toggleFavoritePreference, 
    userFavorites,
    fetchServices,
    fetchBusinesses,
    isLoading
  } = useAppStore()

  useEffect(() => {
    fetchServices() // Jala servicios desde 157.245.181.207
    fetchBusinesses() // Jala tiendas de tu servidor
  }, [])

  const filteredServices = services.filter((service) => {
    // Filtro de categoría
    if (selectedCategory !== "all" && service.category !== selectedCategory) {
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

      {/* Carousel de Negocios Reales */}
      <div className="px-4 py-4">
        <BusinessCarousel
          businesses={businesses}
          onViewProfile={(business) => router.push(`/b/${business.id}`)}
          onViewMore={() => onNavigate?.("businesses")}
        />
      </div>

      {/* Sección de Remates Flow */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-secondary" />
            <h2 className="font-semibold text-lg text-foreground">Remates Flow</h2>
            <Badge variant="secondary" className="text-xs bg-secondary/20 text-secondary">
              Última hora
            </Badge>
          </div>
          {filteredServices.length > 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowComparisonModal(true)}
              className="text-xs"
            >
              Comparar precios
            </Button>
          )}
        </div>
      </div>

      {/* Listado de Tarjetas */}
      <div className="px-4 space-y-4 pb-24">
        {isLoading ? (
          <div className="py-10 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground italic">Sincronizando con Palenque...</p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <div key={service.id} className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border">
              <div className="relative h-40">
                <img
                  src={service.image || "/placeholder.svg"}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => toggleFavoritePreference(service.id)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center"
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
                {service.isRemate && (
                  <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground">
                    <Flame className="w-3 h-3 mr-1" />-{service.discount}%
                  </Badge>
                )}
                {service.allowsPool && (
                  <Badge className="absolute bottom-3 left-3 bg-primary text-primary-foreground">
                    <span className="text-xs">Pool disponible • {service.spotsLeft} cupos</span>
                  </Badge>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 cursor-pointer" onClick={() => router.push(`/s/${service.id}`)}>
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
                  <div className="flex items-center justify-between">
                    <div>
                      {service.isRemate ? (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground line-through text-sm font-medium">
                            ${Math.round(service.price / (1 - (service.discount || 0) / 100))}
                          </span>
                          <span className="text-2xl font-black text-secondary">${service.price}</span>
                        </div>
                      ) : (
                        <span className="text-2xl font-black text-foreground">${service.price}</span>
                      )}
                      <span className="text-muted-foreground text-sm font-medium"> / persona</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl"
                      onClick={() => router.push(`/s/${service.id}`)}
                    >
                      Ver Detalles
                    </Button>
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                      onClick={() => setSelectedService(service)}
                    >
                      Reservar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
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
    </div>
  )
}