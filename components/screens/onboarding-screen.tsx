"use client"

import { useState } from "react"
import { Users, QrCode, ShoppingBag, Shield, ArrowRight, Leaf, Palmtree, Car, Building2, Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"

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
      "Únete o crea grupos de compra para obtener mejores precios. El líder organiza salidas colectivas.",
    features: [
      { icon: ShoppingBag, text: "Ahorra hasta 30%" },
      { icon: QrCode, text: "QR de acceso único" },
    ],
  },
]

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const setUserIntentions = useAppStore((state) => state.setUserIntentions)

  const [intentions, setIntentions] = useState({
    isTraveler: true,
    wantsToLeadPools: false,
    wantsToDrive: false,
    isBusinessOwner: false,
  })

  const toggleIntention = (key: keyof typeof intentions) => {
    setIntentions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleNext = () => {
    if (currentSlide < 2) {
      setCurrentSlide(currentSlide + 1)
    } else {
      setUserIntentions(intentions)
      onComplete()
    }
  }

  const handleSkip = () => {
    setUserIntentions(intentions)
    onComplete()
  }

  const isIntentionStep = currentSlide === 2
  const slide = !isIntentionStep ? onboardingSlides[currentSlide] : null

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
          {!isIntentionStep ? (
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Saltar
            </button>
          ) : (
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Personalización
            </span>
          )}
        </div>

        {/* Content */}
        {!isIntentionStep && slide ? (
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
              {[0, 1, 2].map((stepIdx) => (
                <button
                  key={stepIdx}
                  onClick={() => setCurrentSlide(stepIdx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    stepIdx === currentSlide ? "w-6 bg-primary" : "bg-border hover:bg-muted-foreground"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          /* STEP 3: PANTALLA DE PREGUNTAS E INTENCIONES DEL USUARIO */
          <div className="flex-1 flex flex-col px-6 pb-6 overflow-y-auto">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl mx-auto flex items-center justify-center mb-3 text-primary">
                <Sparkles className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1.5">
                ¿Cómo quieres vivir PalenqueGo?
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Elige una o más opciones para personalizar tus opciones y rutas en la app:
              </p>
            </div>

            {/* OPCIONES DE INTENCION INTERACTIVAS */}
            <div className="flex flex-col gap-3 w-full mb-6">
              
              {/* Opción 1: Viajero / Explorador */}
              <div
                onClick={() => toggleIntention("isTraveler")}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  intentions.isTraveler
                    ? "border-emerald-600 bg-emerald-50/70 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    intentions.isTraveler ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Palmtree className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-gray-900 leading-tight">Quiero viajar y explorar</h3>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        intentions.isTraveler
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {intentions.isTraveler && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-snug">
                    Descubrir rutas, tours, playas y unirme a planes con descuentos grupales.
                  </p>
                </div>
              </div>

              {/* Opción 2: Organizador de Pools */}
              <div
                onClick={() => toggleIntention("wantsToLeadPools")}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  intentions.wantsToLeadPools
                    ? "border-emerald-600 bg-emerald-50/70 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    intentions.wantsToLeadPools ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-gray-900 leading-tight">Me gusta armar grupos y salidas</h3>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        intentions.wantsToLeadPools
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {intentions.wantsToLeadPools && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-snug">
                    Conectar amigos, armar viajes en pool y liderar salidas en grupo.
                  </p>
                </div>
              </div>

              {/* Opción 3: Conductor / Chofer */}
              <div
                onClick={() => toggleIntention("wantsToDrive")}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  intentions.wantsToDrive
                    ? "border-emerald-600 bg-emerald-50/70 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    intentions.wantsToDrive ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Car className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-gray-900 leading-tight">Tengo vehículo / Conductor</h3>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        intentions.wantsToDrive
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {intentions.wantsToDrive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-snug">
                    Intención de generar ingresos conduciendo. Te invitaremos al proceso KYC cuando decidas.
                  </p>
                </div>
              </div>

              {/* Opción 4: Aliado / Negocio */}
              <div
                onClick={() => toggleIntention("isBusinessOwner")}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  intentions.isBusinessOwner
                    ? "border-emerald-600 bg-emerald-50/70 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    intentions.isBusinessOwner ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-gray-900 leading-tight">Tengo negocio o transporte</h3>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        intentions.isBusinessOwner
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {intentions.isBusinessOwner && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-snug">
                    Hotel, restaurante o tour operadora. Podrás reclamar tu tienda o registrar tus rutas.
                  </p>
                </div>
              </div>

            </div>

            {/* Dots indicator */}
            <div className="flex gap-2 justify-center mb-4">
              {[0, 1, 2].map((stepIdx) => (
                <button
                  key={stepIdx}
                  onClick={() => setCurrentSlide(stepIdx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    stepIdx === currentSlide ? "w-6 bg-primary" : "bg-border hover:bg-muted-foreground"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer button */}
        <div className="p-6 pt-0">
          <Button
            onClick={handleNext}
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-md"
          >
            {isIntentionStep ? (
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
