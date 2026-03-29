"use client"

import { useState } from "react"
import { X, Search, Zap, Percent, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppStore, type Service } from "@/lib/store"
import { cn } from "@/lib/utils"
// --- IMPORTAMOS TU MODAL DE COMPARTIR ---
// CAMBIA ESTO (Línea 10):
import { ShareInviteModal } from "./share-invite-modal"

interface CreateRecommendationModalProps {
  onClose: () => void
  onRecommendationCreated: (recommendationId: string) => void
}

export function CreateRecommendationModal({ onClose, onRecommendationCreated }: CreateRecommendationModalProps) {
  const { services, addRecommendation } = useAppStore()
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedType, setSelectedType] = useState<"oferta" | "descuento" | "feriado" | null>(null)
  const [recommendationName, setRecommendationName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [step, setStep] = useState<"select_service" | "select_type" | "name">("select_service")

  // --- ESTADOS PARA EL RELOJ SUIZO (MARKETING) ---
  const [showShareModal, setShowShareModal] = useState(false)
  const [finalGeneratedLink, setFinalGeneratedLink] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const typeConfig = {
    oferta: { label: "Oferta", icon: Zap, color: "bg-blue-100 text-blue-700 border-blue-300" },
    descuento: { label: "Descuento", icon: Percent, color: "bg-green-100 text-green-700 border-green-300" },
    feriado: { label: "Feriado", icon: Gift, color: "bg-purple-100 text-purple-700 border-purple-300" },
  }

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isAuthorized = service.linkTypes && service.linkTypes.length > 0;
    return matchesSearch && isAuthorized;
  })

  const availableTypes = selectedService?.linkTypes && selectedService.linkTypes.length > 0 
    ? selectedService.linkTypes 
    : (["oferta", "descuento", "feriado"] as const)

  // --- LA FUNCIÓN QUE MATA EL POOL/3 ---
  const handleCreateRecommendation = async () => {
    if (!selectedService || !selectedType) return
    setIsCreating(true)

    const recommendationData = {
      name: recommendationName || `${selectedService.name} - ${typeConfig[selectedType].label}`,
      link: "", 
      type: selectedType,
      serviceId: selectedService.id,
      createdAt: new Date(),
      stats: {
        clicks: 0,
        purchases: 0,
        totalEarned: 0,
        paymentStatus: "PENDIENTE" as const,
      },
    }

    try {
      // 1. Creamos la recomendación en el store (que pega a Django)
      const recommendation = await addRecommendation(recommendationData)
      
      // 2. Seteamos el link real que vino de Django para el modal de compartir
      setFinalGeneratedLink(recommendation.link) 
      
      // 3. Abrimos el modal de compartir
      setShowShareModal(true)
      
      // 4. Avisamos al padre
      onRecommendationCreated(recommendation.id)
    } catch (error) {
      console.error("Error al crear:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-card rounded-t-2xl z-10 flex-shrink-0">
            <h2 className="text-2xl font-bold text-foreground">Crear Enlace</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0">
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {step === "select_service" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-3 block">Elegir Servicio</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar servicio..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {filteredServices.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service)
                        setStep("select_type")
                      }}
                      className={cn(
                        "w-full flex gap-3 p-3 rounded-lg border-2 transition-all text-left",
                        selectedService?.id === service.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 bg-muted/30",
                      )}
                    >
                      <img
                        src={service.image || "/placeholder.svg"}
                        alt={service.name}
                        className="w-16 h-16 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{service.name}</h3>
                        <p className="text-xs text-muted-foreground">{service.location}</p>
                        <p className="text-sm font-bold text-primary mt-1">${service.price}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === "select_type" && selectedService && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Seleccionaste: <span className="font-semibold text-foreground">{selectedService.name}</span>
                  </p>
                  <label className="text-sm font-semibold text-foreground mb-3 block">Tipo de Enlace</label>
                  <div className="space-y-2">
                    {availableTypes.map((type) => {
                      const Icon = typeConfig[type as keyof typeof typeConfig].icon
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            setSelectedType(type as "oferta" | "descuento" | "feriado")
                            setStep("name")
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                            selectedType === type
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted-foreground/30 hover:border-primary/50 bg-muted/20 text-foreground",
                          )}
                        >
                          <Icon className="w-6 h-6 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold">{typeConfig[type as keyof typeof typeConfig].label}</p>
                            <p className="text-xs text-muted-foreground">Obtén beneficios por recomendar este servicio.</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === "name" && selectedService && selectedType && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-3 block">Nombre del Enlace</label>
                  <Input
                    placeholder="Ej: Promo Verano Tano"
                    value={recommendationName}
                    onChange={(e) => setRecommendationName(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-card rounded-b-2xl z-10 flex-shrink-0 flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (step === "select_service") onClose()
                else if (step === "select_type") setStep("select_service")
                else setStep("select_type")
              }}
              className="flex-1"
            >
              {step === "select_service" ? "Cancelar" : "Atrás"}
            </Button>
            <Button
              onClick={() => {
                if (step === "select_service" && selectedService) setStep("select_type")
                else if (step === "select_type" && selectedType) setStep("name")
                else handleCreateRecommendation()
              }}
              disabled={isCreating || (step === "select_service" && !selectedService) || (step === "select_type" && !selectedType)}
              className="flex-1"
            >
              {isCreating ? "Creando..." : step === "name" ? "Crear Enlace" : "Siguiente"}
            </Button>
          </div>
        </div>
      </div>

      {/* --- EL MOMENTO DE LA VERDAD: ABRIMOS EL MODAL DE COMPARTIR --- */}
      {showShareModal && selectedService && (
        <ShareInviteModal
          type="marketing" // <--- ESTO MATA EL MODO POOL
          poolName={recommendationName || selectedService.name}
          discount={20} // O el dato que venga de tu campaña
          customLink={finalGeneratedLink} // <--- EL LINK REAL DE DJANGO
          onClose={() => {
            setShowShareModal(false)
            onClose() // Cerramos todo el flujo
          }}
        />
      )}
    </>
  )
}