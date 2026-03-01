"use client"

import { useRouter } from "next/navigation"
import { Business } from "@/lib/store"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Star, Phone, MessageCircle, Share2, ExternalLink, MapPin } from "lucide-react"

interface BusinessCardProps {
  business: Business
  onViewProfile?: (business: Business) => void
}

export function BusinessCard({ business, onViewProfile }: BusinessCardProps) {
  const router = useRouter()
 const handleWhatsApp = () => {
    // Añadimos el signo '?' después de socialLinks
    if (business.socialLinks?.whatsapp) {
      const phone = business.socialLinks.whatsapp.replace(/\D/g, "")
      window.open(`https://wa.me/${phone}`, "_blank")
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
    } else {
      const url = `${window.location.origin}?business=${business.id}`
      navigator.clipboard.writeText(url)
    }
  }

  return (
    <Card className="overflow-visible hover:shadow-xl transition-all duration-300 cursor-pointer relative bg-card border-none shadow-md group" onClick={() => {
      onViewProfile?.(business)
      router.push(`/b/${business.id}`)
    }}>
      {/* Contenedor relativo para el Banner y el Logo flotante */}
      <div className="relative">
        {/* Cover Image - El overflow-hidden se queda solo aquí para recortar la imagen y no el logo */}
        <div className="w-full h-40 overflow-hidden rounded-t-xl bg-muted border-b">
          <img
            src={business.coverImage}
            alt={business.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <Badge className="absolute top-3 right-3 bg-white/90 text-foreground hover:bg-white z-10 shadow-sm">
            {business.category}
          </Badge>
        </div>
        
        {/* AVATAR SOBREPUESTO - Movido fuera del overflow-hidden pero dentro del div relativo */}
        <div className="absolute -bottom-8 left-4 z-30">
          <div className="p-1 bg-background rounded-full shadow-xl">
            <Avatar className="w-16 h-16 border-2 border-background">
              <AvatarImage src={business.logo} alt={business.name} className="object-cover" />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl">
                {business.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Content - Manteniendo pt-10 para dar espacio al logo que ahora sí sobresale */}
      <div className="p-4 pt-10 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
              {business.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary" />
              {business.location}
            </p>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-sm">{business.rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">({business.reviews} reseñas)</span>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">{business.description}</p>

        {/* Services Count */}
        <div className="text-xs text-muted-foreground">
        {(business.services || []).length} servicio{(business.services || []).length !== 1 ? "s" : ""} disponible{(business.services || []).length !== 1 ? "s" : ""}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8"
            onClick={(e) => {
              e.stopPropagation()
              handleWhatsApp()
            }}
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            WhatsApp
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8"
            onClick={(e) => {
              e.stopPropagation()
              handleCall()
            }}
          >
            <Phone className="w-4 h-4 mr-1" />
            Llamar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-8"
            onClick={(e) => {
              e.stopPropagation()
              handleShare()
            }}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Social Links */}
        <div className="flex gap-2 pt-2 border-t">
          {business.socialLinks?.instagram && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation()
                window.open(`https://instagram.com/${business.socialLinks?.instagram}`, "_blank")
              }}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          {business.socialLinks?.facebook && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation()
                window.open(`https://facebook.com/${business.socialLinks?.facebook}`, "_blank")
              }}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
