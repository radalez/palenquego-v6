"use client"

import { useState } from "react"
import { Users, QrCode, ShoppingBag, Shield, ArrowRight, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OnboardingScreenProps {
  onComplete: () => void
}

const onboardingSlides = [
  {
    icon: ShoppingBag,
    title: "Marketplace Circular",
    description:
      "Descubre hoteles, tours, gastronomía y experiencias locales. Apoya a la comunidad mientras disfrutas El Salvador.",
    features: [
      { icon: Users, text: "Partners locales verificados" },
      { icon: Shield, text: "Pagos seguros" },
    ],
  },
  {
    icon: Users,
    title: "Compra en Grupo (Pool)",
    description:
      "Únete o crea grupos de compra para obtener mejores precios. El líder gana comisión del 7% por organizar.",
    features: [
      { icon: ShoppingBag, text: "Ahorra hasta 30%" },
      { icon: QrCode, text: "QR de acceso único" },
    ],
  },
]

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      onComplete()
    }
  }

  const slide = onboardingSlides[currentSlide]
  const isLastSlide = currentSlide === onboardingSlides.length - 1

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <div className="w-full max-w-md flex flex-col min-h-screen">
        {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">Palenque Go</span>
        </div>
        {!isLastSlide && (
          <button
            onClick={onComplete}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Saltar
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Icon */}
        <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-8">
          <slide.icon className="w-12 h-12 text-primary" />
        </div>

        {/* Title and description */}
        <h1 className="text-2xl font-bold text-foreground text-center mb-3 text-balance">{slide.title}</h1>
        <p className="text-muted-foreground text-center max-w-xs leading-relaxed mb-8 text-pretty">
          {slide.description}
        </p>

        {/* Features */}
        <div className="flex flex-col gap-3 w-full max-w-xs mb-8">
          {slide.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl">
              <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center shrink-0">
                <feature.icon className="w-5 h-5 text-secondary" />
              </div>
              <span className="text-sm text-foreground font-medium">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Dots indicator */}
        <div className="flex gap-2 mb-8">
          {onboardingSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? "w-6 bg-primary" : "bg-border hover:bg-muted-foreground"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Footer button */}
      <div className="p-6 pt-0">
        <Button
          onClick={handleNext}
          className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base"
        >
          {isLastSlide ? (
            <span className="flex items-center gap-2">
              ¡Entra a Palenque GO!
              <ArrowRight className="w-5 h-5" />
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Siguiente
              <ArrowRight className="w-5 h-5" />
            </span>
          )}
        </Button>
      </div>
      </div>
    </div>
  )
}
