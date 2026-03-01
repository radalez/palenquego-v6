"use client"

import { useState } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import {
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  CheckCircle2,
  MessageCircle,
  Phone,
  Share2,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAppStore, type Service } from "@/lib/store"
import { BookingModal } from "@/components/booking-modal"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface ServiceDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { services, toggleFavoritePreference, userFavorites, isAuthenticated } = useAppStore()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showBookingModal, setShowBookingModal] = useState(false)

  const service = services.find((s) => s.id === parseInt(resolvedParams.id))

  // Render not found state after all hooks
  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Servicio no encontrado</h1>
          <Button onClick={() => router.back()}>Volver</Button>
        </div>
      </div>
    )
  }

  const images = service.galleryImages || [service.image]
  const isFavorite = userFavorites.some((f) => f.serviceId === service.id)

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
        title: typeof service.name === 'object' ? (service as any).name?.nombre : service.name,
        text: typeof service.description === 'object' ? (service as any).description?.descripcion : service.description,
        url: window.location.href,
      })
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col max-w-md mx-auto pb-32">
      {/* Header with Back Button - Fixed */}
      <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1 text-center">Detalles</h1>
        <button
          onClick={() => toggleFavoritePreference(service.id)}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-colors",
              isFavorite ? "fill-red-500 text-red-500" : "text-foreground",
            )}
          />
        </button>
      </div>

      {/* Image Slider */}
      <div className="relative h-64 bg-muted overflow-hidden">
        <img
          src={images[currentImageIndex] || "/placeholder.svg"}
          alt={service.name as any}
          className="w-full h-full object-cover"
        />

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentImageIndex((i) => (i + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    i === currentImageIndex ? "bg-white w-6" : "bg-white/50",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-32 px-4 py-6 space-y-6">
        {/* Title and Rating */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {typeof service.name === 'object' ? (service as any).name?.nombre : service.name}
              </h1>
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <MapPin className="w-4 h-4" />
                <span>{typeof service.location === 'object' ? (service as any).location?.nombre : service.location}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">{service.rating}</span>
              <span className="text-muted-foreground">({service.reviews} reseñas)</span>
            </div>
          </div>
        </div>

        {/* Business Card - Logo Fixed */}
        {service.businessName && (
          <button
            onClick={() => router.push(`/b/${service.businessId}`)}
            className="w-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-2xl p-4 hover:border-primary hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="w-14 h-14 border-2 border-primary">
                  {/* Ahora sí mostramos el logo real si businessAvatar es la URL */}
                  <AvatarImage src={service.businessAvatar} alt={service.businessName} className="object-cover" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                    {service.businessAvatar?.substring(0, 2).toUpperCase() || "BZ"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <h3 className="font-bold text-foreground text-sm leading-tight">{service.businessName}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3 h-3",
                            i < Math.floor(service.businessRating || 0)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground",
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-foreground">{service.businessRating}</span>
                    <span className="text-xs text-muted-foreground">({service.businessReviews})</span>
                  </div>
                </div>
              </div>
              <div className="text-primary font-bold text-2xl">→</div>
            </div>
          </button>
        )}

        {/* Description */}
        {service.description && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <h2 className="font-semibold text-foreground mb-2">📝 Descripción</h2>
            <p className="text-foreground text-sm leading-relaxed">
              {typeof service.description === 'object' ? (service as any).description?.descripcion : service.description}
            </p>
          </div>
        )}

        {/* Features - ANTI CRASH FIX */}
        {service.features && service.features.length > 0 && (
          <div>
            <h2 className="font-semibold text-foreground mb-3 text-lg">✨ Características Incluidas</h2>
            <div className="grid grid-cols-2 gap-3">
              {service.features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground text-sm font-medium">
                    {/* Si el feature es un objeto con nombre, extraemos el texto */}
                    {typeof feature === 'object' ? (feature as any).nombre : feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extras */}
        {service.extras && service.extras.length > 0 && (
          <div>
            <h2 className="font-semibold text-foreground mb-3 text-lg">🎁 Extras Disponibles</h2>
            <div className="space-y-2">
              {service.extras.map((extra) => (
                <div
                  key={extra.name}
                  className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <span className="text-foreground font-medium">{extra.name}</span>
                  <span className="text-primary font-bold text-lg">+${extra.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Services */}
        {service.relatedServices && service.relatedServices.length > 0 && (
          <div>
            <h2 className="font-semibold text-foreground mb-3 text-lg">🔗 Servicios Relacionados</h2>
            <div className="space-y-2">
              {service.relatedServices.map((relId) => {
                const relatedService = services.find((s) => s.id === relId)
                return relatedService ? (
                  <button
                    key={relId}
                    onClick={() => router.push(`/s/${relId}`)}
                    className="w-full text-left p-4 bg-card rounded-lg border border-border hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-foreground">{relatedService.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <p className="text-xs text-muted-foreground">{relatedService.rating} • {relatedService.location}</p>
                        </div>
                      </div>
                      <span className="text-primary font-bold">${relatedService.price}</span>
                    </div>
                  </button>
                ) : null
              })}
            </div>
          </div>
        )}

        {/* Social Links */}
        {service.socialLinks && (
          <div>
            <h2 className="font-semibold text-foreground mb-3 text-lg">📱 Síguenos</h2>
            <div className="flex gap-2">
              {service.socialLinks.instagram && (
                <a
                  href={`https://instagram.com/${service.socialLinks.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  📷 Instagram
                </a>
              )}
              {service.socialLinks.facebook && (
                <a
                  href={`https://facebook.com/${service.socialLinks.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  f Facebook
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gradient-to-t from-background from-80% to-transparent pt-8 pb-5 px-4 space-y-3 z-30 pointer-events-none">
        <div className="pointer-events-auto space-y-3">
          <div className="flex gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold transition-colors shadow-lg"
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
            >
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
          </div>
          <Button
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold text-base shadow-lg"
            onClick={() => setShowBookingModal(true)}
          >
            Reservar Ahora
          </Button>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && <BookingModal service={service} onClose={() => setShowBookingModal(false)} />}
    </main>
  )
}