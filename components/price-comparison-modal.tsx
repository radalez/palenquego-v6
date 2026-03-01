"use client"

import { useState } from "react"
import { X, Star, DollarSign, TrendingDown, Award, Check, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppStore, type Service } from "@/lib/store"
import { BookingModal } from "@/components/booking-modal"
 

interface PriceComparisonModalProps {
  services: Service[]
  onClose: () => void
}

export function PriceComparisonModal({ services, onClose }: PriceComparisonModalProps) {
  const [selectedServices, setSelectedServices] = useState<number[]>([])
  const [serviceToBook, setServiceToBook] = useState<Service | null>(null)

  // Sort by price (most economical)
  const economicalRanking = [...services].sort((a, b) => a.price - b.price)

  // Sort by rating (most recommended)
  const recommendedRanking = [...services].sort((a, b) => b.rating - a.rating)

  const toggleServiceSelection = (serviceId: number) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in duration-300">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-card rounded-t-2xl z-10 flex-shrink-0">
          <h2 className="text-xl font-bold text-foreground">Tabla Comparativa de Precios</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0">
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="economic" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="economic">
                <TrendingDown className="w-4 h-4 mr-2" />
                Más Económicos
              </TabsTrigger>
              <TabsTrigger value="recommended">
                <Award className="w-4 h-4 mr-2" />
                Recomendados
              </TabsTrigger>
            </TabsList>

            {/* Most Economical Ranking */}
            <TabsContent value="economic">
              <div className="space-y-3">
                {economicalRanking.map((service, index) => (
                  <div
                    key={service.id}
                    className="bg-muted/30 rounded-lg p-4 flex items-center gap-4 border border-border hover:bg-muted/50 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-lg flex-shrink-0 overflow-hidden bg-muted">
                      <img
                        src={service.image || "/placeholder.svg"}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Rank Badge */}
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-primary text-sm">{index + 1}</span>
                    </div>

                    {/* Checkbox */}
                    <button
                      onClick={() => toggleServiceSelection(service.id)}
                      className="p-2 hover:bg-muted rounded transition-colors flex-shrink-0"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedServices.includes(service.id) ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                        {selectedServices.includes(service.id) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </button>

                    {/* Service Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.location}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" />
                        <span className="text-xs font-medium text-foreground">{service.rating}</span>
                        <span className="text-xs text-muted-foreground">({service.reviews})</span>
                      </div>
                    </div>

                    {/* Price & Button */}
                    <div className="text-right flex-shrink-0 space-y-2">
                      <div>
                        <div className="flex items-baseline gap-1 justify-end">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-xl font-bold text-green-600">{service.price}</span>
                        </div>
                        {service.isRemate && (
                          <p className="text-xs text-red-600 font-medium">-{service.discount}%</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setServiceToBook(service)}
                        className="w-24 h-8 text-xs gap-1"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Reservar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Most Recommended Ranking */}
            <TabsContent value="recommended">
              <div className="space-y-3">
                {recommendedRanking.map((service, index) => (
                  <div
                    key={service.id}
                    className="bg-muted/30 rounded-lg p-4 flex items-center gap-4 border border-border hover:bg-muted/50 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-lg flex-shrink-0 overflow-hidden bg-muted">
                      <img
                        src={service.image || "/placeholder.svg"}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Rank Badge */}
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-amber-700 text-sm">{index + 1}</span>
                    </div>

                    {/* Checkbox */}
                    <button
                      onClick={() => toggleServiceSelection(service.id)}
                      className="p-2 hover:bg-muted rounded transition-colors flex-shrink-0"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedServices.includes(service.id) ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                        {selectedServices.includes(service.id) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </button>

                    {/* Service Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.location}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" />
                          <span className="text-sm font-bold text-amber-600">{service.rating}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ({service.reviews} reseñas)
                        </span>
                      </div>
                    </div>

                    {/* Price & Button */}
                    <div className="text-right flex-shrink-0 space-y-2">
                      <div>
                        <div className="text-lg font-bold text-foreground">${service.price}</div>
                        {service.isRemate && (
                          <p className="text-xs text-red-600 font-medium mt-1">-{service.discount}%</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setServiceToBook(service)}
                        className="w-24 h-8 text-xs gap-1"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Reservar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Selection Summary */}
          {selectedServices.length > 0 && (
            <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium text-foreground">
                {selectedServices.length} servicio(s) seleccionado(s)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total: ${selectedServices.reduce((sum, id) => sum + (services.find((s) => s.id === id)?.price || 0), 0)}
              </p>
            </div>
          )}

        </div>

        {/* Footer Button - Fixed */}
        <div className="p-6 border-t border-border bg-card rounded-b-2xl z-10 flex-shrink-0">
          <Button onClick={onClose} className="w-full">
            Cerrar Comparativa
          </Button>
        </div>
      </div>

      {/* Booking Modal */}
      {serviceToBook && (
        <BookingModal 
          service={serviceToBook} 
          onClose={() => setServiceToBook(null)} 
        />
      )}
    </div>
  )
}
