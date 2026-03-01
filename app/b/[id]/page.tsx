"use client"

import { useState } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, MapPin, Star, MessageCircle, Phone, Share2, Heart, Grid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useAppStore, type Business } from "@/lib/store"
import { BookingModal } from "@/components/booking-modal"

interface BusinessDetailPageProps {
  params: Promise<{ id: string }>
}

export default function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { businesses, services, isAuthenticated } = useAppStore()
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)

  const business = businesses.find((b) => b.id === parseInt(resolvedParams.id))
  // Filtramos los servicios que tengan el mismo businessId que el ID de esta tienda
  const businessServices = business 
    ? services.filter((s) => s.businessId === business.id) 
    : []

  // Render not found state after all hooks
  if (!business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Negocio no encontrado</h1>
          <Button onClick={() => router.back()}>Volver</Button>
        </div>
      </div>
    )
  }

  const handleWhatsApp = () => {
    if (business.socialLinks?.whatsapp) {
      const cleanPhone = business.socialLinks.whatsapp.replace(/\D/g, "")
      window.open(`https://wa.me/${cleanPhone}`, "_blank")
    }
  }

  const handleCall = () => {
    if (business.socialLinks?.phone) {
      window.location.href = `tel:${business.socialLinks.phone}`
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: business.name,
        text: business.description,
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
        <h1 className="text-lg font-bold text-foreground flex-1 text-center">Negocio</h1>
        <div className="w-10" />
      </div>

      {/* Cover Image - Full Width Banner */}
      <div className="relative h-56 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden border-b-2 border-primary/20">
        <img
          src={business.coverImage || "/placeholder.svg"}
          alt={business.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Business Info Card - Enhanced Design */}
        <div className="px-4 space-y-4">
          {/* Avatar and Basic Info */}
          <div className="relative -mt-12 mb-4 flex items-end gap-4">
            <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
              {/* Este es el que carga la imagen real usando el proxy */}
              <AvatarImage src={business.logo} alt={business.name} className="object-cover" />
              
              {/* Este SOLO se muestra si la imagen de arriba falla */}
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-3xl font-bold">
                {business.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-1">
              <h1 className="text-2xl font-bold text-foreground mb-1">{business.name}</h1>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-medium">{business.location}</span>
              </div>
            </div>
          </div>

          {/* Rating Section */}
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i < Math.floor(business.rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground",
                    )}
                  />
                ))}
              </div>
              <div>
                <span className="font-bold text-foreground">{business.rating}</span>
                <span className="text-muted-foreground text-xs"> ({business.reviews} reseñas)</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {business.category.charAt(0).toUpperCase() + business.category.slice(1)}
            </span>
          </div>

          {/* Description */}
          <div>
            <h2 className="font-semibold text-foreground mb-2 text-sm">Sobre este negocio</h2>
            <p className="text-foreground leading-relaxed text-sm">{business.description}</p>
          </div>
        </div>

        {/* Services Grid */}
        <div className="px-4 py-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h2 className="text-xl font-bold text-foreground">Servicios Disponibles</h2>
          </div>

          {businessServices.length > 0 ? (
            <div className="space-y-4"> {/* Aumentamos espacio entre tarjetas */}
              {businessServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/50 transition-all group"
                >
                  <div className="flex h-full min-h-[140px]"> {/* Altura mínima flexible */}
                    {/* Imagen con zoom al hacer hover */}
                    <div className="w-32 flex-shrink-0 overflow-hidden relative">
                      <img
                        src={service.image || "/placeholder.svg"}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {service.isRemate && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          OFERTA
                        </div>
                      )}
                    </div>

                    {/* Contenido con espacio para respirar */}
                    {/* Contenido con Título y Descripción Corta */}
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          {/* Título: Usamos nombre o name con recorte de 1 línea */}
                          <h3 className="font-bold text-foreground text-sm line-clamp-1 flex-1 leading-tight">
                            {service.nombre || service.name}
                          </h3>
                          <span className="text-primary font-bold text-base">
                            ${service.price || service.precio_base}
                          </span>
                        </div>

                        {/* Descripción Breve: Recorte automático a 2 líneas con '...' */}
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                          {service.descripcion || service.description || "Sin descripción disponible"}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-bold text-foreground">{service.rating || "5.0"}</span>
                          </div>
                          {service.reviews > 0 && (
                            <span className="text-[10px] text-muted-foreground">({service.reviews} reseñas)</span>
                          )}
                        </div>
                      </div>

                      {/* Botones con espacio fijo para que no se escondan */}
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-xl h-8 text-[10px] font-bold uppercase tracking-wider"
                          onClick={() => router.push(`/s/${service.id}`)}
                        >
                          Detalles
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-8 text-[10px] font-bold uppercase tracking-wider shadow-sm"
                          onClick={() => {
                            setSelectedService(service)
                            setShowBookingModal(true)
                          }}
                        >
                          Reservar
                        </Button>
                      </div>
                    </div>
                    
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay servicios disponibles</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar - Fixed with proper gradient */}
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
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedService && (
        <BookingModal service={selectedService} onClose={() => setShowBookingModal(false)} />
      )}
    </main>
  )
}
