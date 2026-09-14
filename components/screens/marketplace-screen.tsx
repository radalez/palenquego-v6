"use client"

import { useState, useEffect } from "react"
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

  const [visibleCount, setVisibleCount] = useState(16)
  const [activePoolTooltipId, setActivePoolTooltipId] = useState<number | null>(null)

  // Reset pagination when category or search changes
  useEffect(() => {
    setVisibleCount(16)
  }, [selectedCategory, searchQuery, filters])

  // --- CONEXIÓN A TU API REAL ---
  const { 
    services, 
    businesses, 
    toggleFavoritePreference, 
    registerPoolInterest,
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
      <div className="px-4 pb-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-10 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground italic">Sincronizando con Palenque...</p>
          </div>
        ) : (
          <>
            {filteredServices.slice(0, visibleCount).map((service) => (
              <div key={service.id} className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border flex flex-col">
                <div className="relative h-40">
                  <img
                    src={service.image || "/placeholder.svg"}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => toggleFavoritePreference(service.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-sm"
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

                    {/* Associated Routes Button */}
                    {service.routes && service.routes.length > 0 && (
                      <div className="mt-3 border-t border-border pt-3">
                        <button 
                          onClick={() => setServiceForRoutes(service)}
                          className="w-full flex items-center justify-center gap-2 text-xs font-semibold bg-[#059669]/10 text-[#059669] hover:bg-[#059669]/20 px-3 py-2 rounded-lg transition-colors border border-[#059669]/20"
                        >
                          <MapPin className="w-3.5 h-3.5" /> 
                          Ver {service.routes.length} ruta{service.routes.length !== 1 ? 's' : ''} disponible{service.routes.length !== 1 ? 's' : ''}
                        </button>
                      </div>
                    )}
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
          ))}

          {visibleCount < filteredServices.length && (
            <div className="col-span-full text-center py-6">
              <Button 
                variant="outline" 
                onClick={() => setVisibleCount((prev) => prev + 16)}
                className="px-8 py-3 font-bold rounded-xl shadow-sm border-primary/30 text-primary hover:bg-primary/5 text-sm"
              >
                Cargar más experiencias ({filteredServices.length - visibleCount} restantes)
              </Button>
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