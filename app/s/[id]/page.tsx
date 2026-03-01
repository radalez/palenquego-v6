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
  FileText,
  Sparkles,
  Gift,
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
          alt={typeof service.name === 'object' ? (service as any).name?.nombre : (service.name as string)}
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
        {/* Title, Rating and Base Price */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              {typeof service.name === 'object' ? (service as any).name?.nombre : service.name}
            </h1>
            <div className="flex items-center gap-1 text-muted-foreground mt-1">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{typeof service.location === 'object' ? (service as any).location?.nombre : service.location}</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-amber-900">{service.rating}</span>
                <span className="text-amber-700 text-sm">({service.reviews} reseñas)</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-primary">${service.price}</span>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Precio Base</p>
          </div>
        </div>

        {/* Business Card */}
        {service.businessName && (
          <button
            onClick={() => router.push(`/b/${service.businessId}`)}
            className="w-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-2xl p-4 hover:border-primary hover:shadow-md transition-all shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="w-14 h-14 border-2 border-primary shadow-sm">
                  <AvatarImage src={service.businessAvatar} alt={service.businessName} className="object-cover" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                    {service.businessAvatar?.substring(0, 2).toUpperCase() || "BZ"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-0.5">Ofrecido por</p>
                  <h3 className="font-bold text-foreground text-sm leading-tight">{service.businessName}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs font-bold text-foreground">{service.businessRating}</span>
                    <span className="text-xs text-muted-foreground">({service.businessReviews} reseñas)</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="text-primary w-6 h-6" />
            </div>
          </button>
        )}

        {/* Description con Icono Lucide */}
        {service.description && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">Descripción</h2>
            </div>
            <p className="text-foreground text-sm leading-relaxed italic">
              "{typeof service.description === 'object' ? (service as any).description?.descripcion : service.description}"
            </p>
          </div>
        )}

        {/* Features con Icono Lucide */}
        {service.features && service.features.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground text-lg uppercase tracking-tight">Características Incluidas</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {service.features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl hover:border-primary/40 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-foreground text-xs font-medium">
                    {typeof feature === 'object' ? (feature as any).nombre : feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extras - FIX DEFINITIVO DE PRECIO_ADICIONAL */}
        {service.extras && service.extras.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground text-lg uppercase tracking-tight">Extras Disponibles</h2>
            </div>
            <div className="space-y-2">
              {service.extras.map((extra: any, idx: number) => {
                // Usamos el campo real descubierto en la consola: precio_adicional
                const extraPrice = extra.precio_adicional || extra.precio || extra.price || 0;
                const extraName = extra.nombre || extra.name || "Extra adicional";
                
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-all shadow-sm"
                  >
                    <span className="text-foreground font-semibold text-sm">{extraName}</span>
                    <span className="text-primary font-black text-lg">+${extraPrice}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Social Links con Icono Lucide */}
        {service.socialLinks && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground text-lg uppercase tracking-tight">Síguenos en Redes</h2>
            </div>
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
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gradient-to-t from-background from-80% to-transparent pt-8 pb-5 px-4 space-y-3 z-30 pointer-events-auto">
        <div className="flex gap-2">
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
        </div>
        <Button
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-black text-lg shadow-xl"
          onClick={() => setShowBookingModal(true)}
        >
          RESERVAR AHORA
        </Button>
      </div>

      {/* Booking Modal */}
      {showBookingModal && <BookingModal service={service} onClose={() => setShowBookingModal(false)} />}
    </main>
  )
}