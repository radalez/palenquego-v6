"use client"

import { useRouter } from "next/navigation"
import { Business } from "@/lib/store"
import { BusinessCard } from "./business-card"
import { Button } from "./ui/button"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { useState } from "react"

interface BusinessCarouselProps {
  businesses: Business[]
  onViewProfile?: (business: Business) => void
  onViewMore?: () => void
}

export function BusinessCarousel({ businesses, onViewProfile, onViewMore }: BusinessCarouselProps) {
  const router = useRouter()
  const [scrollPosition, setScrollPosition] = useState(0)

  const handleScroll = (direction: "left" | "right") => {
    const container = document.getElementById("business-carousel-scroll")
    if (container) {
      const scrollAmount = 320
      const newPosition = scrollPosition + (direction === "left" ? -scrollAmount : scrollAmount)
      container.scrollTo({
        left: newPosition,
        behavior: "smooth",
      })
      setScrollPosition(newPosition)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Negocios Destacados</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => handleScroll("left")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => handleScroll("right")}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        <div
          id="business-carousel-scroll"
          className="flex gap-4 overflow-x-auto scroll-smooth pb-10 [-webkit-mask-image:linear-gradient(to_right,black_calc(100%-20px),transparent)] [mask-image:linear-gradient(to_right,black_calc(100%-20px),transparent)]"
        >
          {businesses.slice(0, 6).map((business) => (
            <div
              key={business.id}
              className="flex-shrink-0 w-80"
            >
              <BusinessCard business={business} onViewProfile={onViewProfile} />
            </div>
          ))}
        </div>
      </div>

      {/* Ver Más Button */}
      <Button
        onClick={() => {
          onViewMore?.()
          router.push("/?tab=businesses")
        }}
        className="w-full bg-primary hover:bg-primary/90"
      >
        Ver Más Negocios
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  )
}
