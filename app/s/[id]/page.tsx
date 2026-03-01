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

  // --- LOGS DE INVESTIGACIÓN PARA EL NAVEGADOR ---
  // Estos saldrán en tu consola (F12) apenas abras la página
  console.log("DATOS DEL SERVICIO:", service);
  if (service?.extras) {
    console.log("ESTRUCTURA DE EXTRAS:", service.extras);
  }

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
        <h1 className="text-lg font-bold text-foreground flex-1 text-center">Detalles del Servicio</h1>
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
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-32 px-4 py-6 space-y-6">
        {/* Title, Rating and PRECIO BASE */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-black text-foreground leading-tight">
                {typeof service.name === 'object' ? (service as any).name?.nombre : service.name}
              </h1>
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  {typeof service.location === 'object' ? (service as any).location?.nombre : service.location}
                </span>
              </div>
            </div>
            {/* AQUÍ ESTÁ EL PRECIO BASE QUE FALTABA */}
            <div className="text-right">
              <span className="block text-3xl font-black text-primary">${service.price}</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Precio Base</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-amber-900">{service.rating}</span>
              <span className="text-amber-700 text-xs">({service.reviews} reseñas)</span>
            </div>
          </div>
        </div>

        {/* Business Card */}
        {service.businessName && (
          <button
            onClick={() => router.push(`/b/${service.businessId}`)}
            className="w-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 hover:border-primary transition-all shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-background shadow-md">
                  <AvatarImage src={service.businessAvatar} alt={service.businessName} className="object-cover" />
                  <AvatarFallback className="bg-primary text-white font-bold">
                    {service.businessAvatar?.substring(0, 2).toUpperCase() || "BZ"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-[9px] text-primary font-bold uppercase tracking-widest mb-0.5">Vendido por</p>
                  <h3 className="font-bold text-foreground text-sm">{service.businessName}</h3>
                </div>
              </div>
              <ChevronRight className="text-primary w-5 h-5" />
            </div>
          </button>
        )}

        {/* Description con Icono Lucide */}
        {service.description && (
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground text-xs uppercase tracking-widest">Sobre el servicio</h2>
            </div>
            <p className="text-foreground text-sm leading-relaxed italic opacity-90">
              "{typeof service.description === 'object' ? (service as any).description?.descripcion : service.description}"
            </p>
          </div>
        )}

        {/* Features con Icono Lucide */}
        {service.features && service.features.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground text-lg">¿Qué incluye?</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {service.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl border border-border/50">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-foreground text-xs font-semibold">
                    {typeof feature === 'object' ? (feature as any).nombre : feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extras - LOGICA DEFENSIVA PARA PRECIOS */}
        {service.extras && service.extras.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground text-lg">Personaliza tu reserva</h2>
            </div>
            <div className="space-y-2">
              {service.extras.map((extra: any, idx: number) => {
                // Buscamos cualquier campo que pueda tener el precio real
                const valExtra = extra.precio || extra.price || extra.monto || extra.valor || extra.precio_base || 0;
                const nomExtra = extra.nombre || extra.name || "Extra";
                
                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border hover:border-primary/40 transition-all shadow-sm">
                    <span className="text-foreground font-bold text-sm">{nomExtra}</span>
                    <span className="text-primary font-black text-xl">+${valExtra}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gradient-to-t from-background from-80% to-transparent pt-8 pb-5 px-4 space-y-3 z-30 pointer-events-auto">
        <div className="flex gap-2">
          <button onClick={handleWhatsApp} className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-full font-bold shadow-lg">
            <MessageCircle className="w-5 h-5" /> WhatsApp
          </button>
          <button onClick={handleCall} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg">
            <Phone className="w-5 h-5" /> Llamar
          </button>
          <button onClick={handleShare} className="w-14 h-14 flex items-center justify-center bg-card border border-border rounded-full shadow-lg">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        <Button className="w-full h-14 bg-primary text-primary-foreground rounded-full font-black text-lg shadow-xl" onClick={() => setShowBookingModal(true)}>
          RESERVAR AHORA
        </Button>
      </div>

      {/* Booking Modal */}
      {showBookingModal && <BookingModal service={service} onClose={() => setShowBookingModal(false)} />}
    </main>
  )
}