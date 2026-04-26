"use client"

import { useState } from "react"
import { Heart, Star, MapPin, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAppStore, type Service } from "@/lib/store"
import { RatingModal } from "@/components/rating-modal"

interface ServiceCardProps {
  service: Service
  onBook?: (service: Service) => void
}

export function ServiceCard({ service, onBook }: ServiceCardProps) {
  const [showRatingModal, setShowRatingModal] = useState(false)
  const { toggleFavorite, favorites, payService, isLoading } = useAppStore()
  const isFavorite = favorites.includes(service.id)

  return (
    <>
      <div className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Image Container */}
        <div className="relative h-40 bg-muted overflow-hidden">
          <img
            src={service.image || "/placeholder.svg"}
            alt={service.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.target as HTMLImageElement
              img.src = "/placeholder-service.jpg"
            }}
          />

          {/* Badges */}
          {service.isRemate && (
            <Badge className="absolute top-3 right-3 bg-red-500 hover:bg-red-600">
              <Zap className="w-3 h-3 mr-1" />
              Remate {service.discount}%
            </Badge>
          )}

          {/* Favorite Button */}
          <button
            onClick={() => toggleFavorite(service.id)}
            className="absolute bottom-3 right-3 p-2 bg-white/90 hover:bg-white rounded-lg transition-colors"
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-colors",
                isFavorite ? "fill-red-500 stroke-red-500" : "stroke-muted-foreground"
              )}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title & Location */}
          <h3 className="font-semibold text-foreground line-clamp-1">{service.name}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin className="w-3 h-3" />
            {service.location}
          </div>

          {/* Rating Section with Calificar Button */}
          <div className="mt-3 pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-500 stroke-amber-500" />
                  <span className="font-semibold text-sm text-foreground">{service.rating}</span>
                </div>
                <span className="text-xs text-muted-foreground">({service.reviews})</span>
              </div>
              <button
                onClick={() => setShowRatingModal(true)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Calificar
              </button>
            </div>
          </div>

          {/* Price & Availability */}
          <div className="mt-3 mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground">${service.price}</span>
              {service.discount && (
                <span className="text-xs text-muted-foreground line-through">${Math.round(service.price / (1 - service.discount / 100))}</span>
              )}
            </div>
            {service.spotsLeft > 0 && (
              <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                <Users className="w-3 h-3" />
                {service.spotsLeft} lugares disponibles
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button
            onClick={() => payService(service.id)}
            className="w-full"
            disabled={service.spotsLeft === 0 || isLoading}
          >
            {isLoading ? (
              "Procesando..."
            ) : service.spotsLeft > 0 ? (
              "Pagar ahora"
            ) : (
              "Agotado"
            )}
          </Button>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal
          serviceId={service.id}
          serviceName={service.name}
          currentRating={service.rating}
          currentReviews={service.reviews}
          onClose={() => setShowRatingModal(false)}
        />
      )}
    </>
  )
}
