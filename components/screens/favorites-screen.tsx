"use client"

import { useState } from "react"
import { Heart, MapPin, Star, ChevronLeft, Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { BookingModal } from "@/components/booking-modal"
 

interface FavoritesScreenProps {
  onBack: () => void
}

export function FavoritesScreen({ onBack }: FavoritesScreenProps) {
  const { services, userFavorites, toggleFavoritePreference, setFavoritePreference, selectTripFavorite } =
    useAppStore()

  const [clickCount, setClickCount] = useState<{ [key: number]: number }>({})
  const [clickTimeouts, setClickTimeouts] = useState<{ [key: number]: NodeJS.Timeout }>({})
  const [showBookingModal, setShowBookingModal] = useState(false)

  // Separa favoritos por preferencia
  const meGustaServices = services.filter((s) =>
    userFavorites.some((f) => f.serviceId === s.id && f.preference === "me_gusta"),
  )
  const meFascinaServices = services.filter((s) =>
    userFavorites.some((f) => f.serviceId === s.id && f.preference === "me_gusta_mas"),
  )

  const handleFavoriteClick = (serviceId: number) => {
    const currentCount = (clickCount[serviceId] || 0) + 1
    const currentFavorite = userFavorites.find((f) => f.serviceId === serviceId)

    // Clear existing timeout
    if (clickTimeouts[serviceId]) {
      clearTimeout(clickTimeouts[serviceId])
    }

    setClickCount({ ...clickCount, [serviceId]: currentCount })

    // Set new timeout to detect if this is a double click
    const timeout = setTimeout(() => {
      if (currentCount === 1) {
        // Single click - just toggle favorite on/off
        if (currentFavorite) {
          toggleFavoritePreference(serviceId)
        } else {
          setFavoritePreference(serviceId, "me_gusta")
        }
      } else if (currentCount === 2) {
        // Double click - toggle "me gusta más"
        if (currentFavorite?.preference === "me_gusta_mas") {
          setFavoritePreference(serviceId, "me_gusta")
        } else {
          setFavoritePreference(serviceId, "me_gusta_mas")
        }
      }

      // Reset click count
      setClickCount({ ...clickCount, [serviceId]: 0 })
    }, 300)

    setClickTimeouts({ ...clickTimeouts, [serviceId]: timeout })
  }

  const selectedTrip = userFavorites.find((f) => f.selectedForTrip)
  const selectedTripService = selectedTrip ? services.find((s) => s.id === selectedTrip.serviceId) : null
  const totalFavorites = meGustaServices.length + meFascinaServices.length

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-4 pt-4 pb-8 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-primary-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary-foreground">Mis Favoritos</h1>
            <p className="text-sm text-primary-foreground/80">Gestor de Plan de Viajes • {totalFavorites} total</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-primary-foreground/10 border border-primary-foreground/20 rounded-xl p-3 backdrop-blur-sm">
          <p className="text-xs text-primary-foreground/80 font-medium">
            Tu gestor personal de viajes
          </p>
          <p className="text-xs text-primary-foreground/70 mt-2">
            Organiza tus experiencias: "Me gusta" para opciones y "Me fascina" para tus favoritas. Luego, elige tu experiencia ideal.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-4 pb-6">
        {totalFavorites === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="w-16 h-16 text-muted-foreground/20 mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Sin favoritos aún</p>
            <p className="text-sm text-muted-foreground/70 mt-2">Comienza a agregar experiencias desde el marketplace</p>
          </div>
        ) : (
          <>
            {/* Selected Trip Section - Always Visible */}
            {selectedTripService && (
              <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl p-5 mb-2 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Check className="w-6 h-6 text-primary-foreground animate-pulse" />
                  <span className="font-bold text-primary-foreground text-lg">Tu próximo viaje</span>
                </div>
                <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4 border border-primary-foreground/20 mb-4">
                  <div className="flex gap-4">
                    <img
                      src={selectedTripService.image || "/placeholder.svg"}
                      alt={selectedTripService.name}
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-primary-foreground text-lg">{selectedTripService.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-primary-foreground/90 mt-1">
                        <MapPin className="w-4 h-4" />
                        {selectedTripService.location}
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-300 stroke-amber-300" />
                          <span className="font-bold text-primary-foreground">{selectedTripService.rating}</span>
                        </div>
                        <span className="text-xl font-bold text-primary-foreground">${selectedTripService.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full bg-primary-foreground text-primary font-bold hover:bg-primary-foreground/90 h-12 text-base"
                >
                  Reservar ahora
                </Button>
              </div>
            )}

            {/* Me Fascina Section */}
            {meFascinaServices.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-foreground">Me fascina</h2>
                  <span className="ml-auto text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {meFascinaServices.length}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground px-1 mb-2">Tus experiencias favoritas principales</p>

                <div className="space-y-2">
                  {meFascinaServices.map((service) => {
                    const favorite = userFavorites.find((f) => f.serviceId === service.id)!
                    const isSelectedTrip = favorite.selectedForTrip

                    return (
                      <div
                        key={service.id}
                        className={`bg-card rounded-xl p-3 border-2 transition-all duration-200 ${
                          isSelectedTrip ? "border-primary ring-2 ring-primary/20" : "border-amber-200/50"
                        }`}
                      >
                        <div className="flex gap-3">
                          <img
                            src={service.image || "/placeholder.svg"}
                            alt={service.name}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <h3 className="font-semibold text-foreground">{service.name}</h3>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {service.location}
                                </div>
                              </div>
                              <button
                                onClick={() => handleFavoriteClick(service.id)}
                                title="Click para mover a Me gusta"
                                className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                              >
                                <Heart className="w-5 h-5 fill-amber-500 stroke-amber-500" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3 mt-2 text-sm">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" />
                                <span className="font-medium">{service.rating}</span>
                              </div>
                              <span className="font-bold text-foreground">${service.price}</span>
                            </div>
                          </div>
                        </div>

                        {!isSelectedTrip && (
                          <button
                            onClick={() => selectTripFavorite(service.id)}
                            className="w-full mt-3 px-3 py-2 text-sm font-medium text-primary bg-primary/5 border border-primary rounded-lg hover:bg-primary/10 transition-colors"
                          >
                            Elegir para mi viaje
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Me Gusta Section */}
            {meGustaServices.length > 0 && (
              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-2 px-1">
                  <Heart className="w-5 h-5 text-red-500" />
                  <h2 className="text-lg font-bold text-foreground">Me gusta</h2>
                  <span className="ml-auto text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {meGustaServices.length}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground px-1 mb-2">Otras opciones que te interesan</p>

                <div className="space-y-2">
                  {meGustaServices.map((service) => {
                    const favorite = userFavorites.find((f) => f.serviceId === service.id)!
                    const isSelectedTrip = favorite.selectedForTrip

                    return (
                      <div
                        key={service.id}
                        className={`bg-card rounded-xl p-3 border-2 transition-all duration-200 ${
                          isSelectedTrip ? "border-primary ring-2 ring-primary/20" : "border-red-200/30"
                        }`}
                      >
                        <div className="flex gap-3">
                          <img
                            src={service.image || "/placeholder.svg"}
                            alt={service.name}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <h3 className="font-semibold text-foreground">{service.name}</h3>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {service.location}
                                </div>
                              </div>
                              <button
                                onClick={() => handleFavoriteClick(service.id)}
                                title="Doble click para mover a Me fascina"
                                className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                              >
                                <Heart className="w-5 h-5 fill-red-500 stroke-red-500" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3 mt-2 text-sm">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" />
                                <span className="font-medium">{service.rating}</span>
                              </div>
                              <span className="font-bold text-foreground">${service.price}</span>
                            </div>
                          </div>
                        </div>

                        {!isSelectedTrip && (
                          <button
                            onClick={() => selectTripFavorite(service.id)}
                            className="w-full mt-3 px-3 py-2 text-sm font-medium text-primary bg-primary/5 border border-primary rounded-lg hover:bg-primary/10 transition-colors"
                          >
                            Elegir para mi viaje
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedTripService && (
        <BookingModal service={selectedTripService} onClose={() => setShowBookingModal(false)} />
      )}
    </div>
  )
}
