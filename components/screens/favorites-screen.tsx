"use client"

import { useState, useEffect } from "react"
import { Heart, MapPin, Star, ChevronLeft, Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { BookingModal } from "@/components/booking-modal"
 

interface FavoritesScreenProps {
  onBack: () => void
}

export function FavoritesScreen({ onBack }: FavoritesScreenProps) {
  const { services, userFavorites, toggleFavoritePreference, setFavoritePreference, selectTripFavorite, fetchServices } =
    useAppStore()

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

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

  const renderFavoriteCard = (service: (typeof services)[number], isFascina: boolean) => {
    const favorite = userFavorites.find((f) => f.serviceId === service.id)!
    const isSelectedTrip = favorite.selectedForTrip

    return (
      <div
        key={service.id}
        className={`bg-card rounded-2xl p-3.5 border transition-all duration-200 flex flex-col justify-between gap-3 shadow-2xs ${
          isSelectedTrip
            ? "border-[#105238] ring-2 ring-[#105238]/15"
            : "border-border hover:border-[#105238]/40"
        }`}
      >
        <div className="flex gap-3">
          <img
            src={service.image || "/placeholder.svg"}
            alt={service.name}
            className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-border/50"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-foreground leading-snug line-clamp-2">{service.name}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{service.location}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleFavoriteClick(service.id)}
                title={isFascina ? "Click para mover a Me gusta" : "Doble click para mover a Me fascina"}
                className="p-1.5 hover:bg-muted rounded-full transition-colors flex-shrink-0 cursor-pointer"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isFascina ? "fill-[#105238] stroke-[#105238]" : "fill-[#105238]/75 stroke-[#105238]"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center gap-3 mt-2 text-xs">
              <div className="flex items-center gap-1 font-semibold text-foreground">
                <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                <span>{service.rating}</span>
              </div>
              <span className="font-black text-sm text-[#105238]">
                ${service.price} <span className="text-[11px] font-medium text-muted-foreground">/p</span>
              </span>
            </div>
          </div>
        </div>

        {!isSelectedTrip && (
          <button
            type="button"
            onClick={() => selectTripFavorite(service.id)}
            className="w-full h-9 px-3 text-xs font-bold text-[#105238] bg-[#eaf0e2] hover:bg-[#105238] hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            Elegir para mi viaje
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Header (Centered max-w-3xl matching Notificaciones) */}
      <div className="bg-[#105238] text-white px-4 pt-5 pb-6">
        <div className="max-w-3xl mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs font-bold text-white/80 hover:text-white mb-3 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white">Mis Favoritos</h1>
              <p className="text-xs sm:text-sm text-white/80 mt-0.5">
                Gestor de Plan de Viajes • {totalFavorites} {totalFavorites === 1 ? "guardado" : "guardados"}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-[#8ee01a]" />
            </div>
          </div>
        </div>
      </div>

      {/* Content (Centered max-w-3xl) */}
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
        {totalFavorites === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-3xl p-8">
            <Heart className="w-14 h-14 text-muted-foreground/25 mb-3" />
            <p className="text-base font-bold text-foreground">Sin favoritos aún</p>
            <p className="text-xs text-muted-foreground mt-1">
              Comienza a guardar experiencias desde Experiencias para planear tu viaje.
            </p>
          </div>
        ) : (
          <>
            {/* Selected Trip Section */}
            {selectedTripService && (
              <div className="bg-[#105238] rounded-3xl p-5 shadow-md text-white">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#8ee01a]" />
                    <span className="font-black text-base">Tu próximo viaje</span>
                  </div>
                  <span className="text-[11px] font-bold bg-white/15 px-2.5 py-0.5 rounded-full">
                    Seleccionado
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/15 mb-4 flex gap-3.5">
                  <img
                    src={selectedTripService.image || "/placeholder.svg"}
                    alt={selectedTripService.name}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-base truncate">{selectedTripService.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-white/85 mt-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{selectedTripService.location}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="flex items-center gap-1 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-300 stroke-amber-300" />
                        <span>{selectedTripService.rating}</span>
                      </div>
                      <span className="text-lg font-black text-[#8ee01a]">
                        ${selectedTripService.price} <span className="text-xs font-normal text-white/75">/p</span>
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full bg-[#8ee01a] text-[#105238] font-black hover:bg-[#8ee01a]/90 h-11 rounded-2xl text-sm cursor-pointer"
                >
                  Reservar ahora
                </Button>
              </div>
            )}

            {/* Me Fascina Section */}
            {meFascinaServices.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#105238]" />
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Me fascina</h2>
                      <p className="text-xs text-muted-foreground">Tus experiencias favoritas principales</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#105238] bg-[#eaf0e2] px-2.5 py-0.5 rounded-full">
                    {meFascinaServices.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {meFascinaServices.map((service) => renderFavoriteCard(service, true))}
                </div>
              </div>
            )}

            {/* Me Gusta Section */}
            {meGustaServices.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#105238]" />
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Me gusta</h2>
                      <p className="text-xs text-muted-foreground">Otras opciones que te interesan</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#105238] bg-[#eaf0e2] px-2.5 py-0.5 rounded-full">
                    {meGustaServices.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {meGustaServices.map((service) => renderFavoriteCard(service, false))}
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
