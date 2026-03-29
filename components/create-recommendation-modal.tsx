"use client"

import { useState, useEffect } from "react"
import { X, Search, Gift, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

import { ShareInviteModal } from "./share-invite-modal"

// 1. RESTAURAMOS TU INTERFAZ ORIGINAL (Adiós líneas rojas en los props)
interface CreateRecommendationModalProps {
  onClose: () => void
  onRecommendationCreated: (recommendationId: string) => void
}

// 2. CREAMOS LA INTERFAZ PARA LAS CAMPAÑAS (Para que TypeScript no llore)
interface Campaign {
  id: number;
  titulo: string;
  nombre_servicio?: string; // Opcional porque puede ser una ruta
  porcentaje_descuento: number;
}

export function CreateRecommendationModal({ onClose, onRecommendationCreated }: CreateRecommendationModalProps) {
  const { fetchRecommendations } = useAppStore()
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  const [step, setStep] = useState<"select_campaign" | "name">("select_campaign")
  const [recommendationName, setRecommendationName] = useState("")

  const [showShareModal, setShowShareModal] = useState(false)
  const [finalGeneratedLink, setFinalGeneratedLink] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const token = typeof window !== "undefined" && localStorage.getItem("app-storage")
          ? JSON.parse(localStorage.getItem("app-storage") as string)?.state?.accessToken
          : ""

        const response = await fetch('/api-proxy/marketing/campaigns/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setCampaigns(data)
        }
      } catch (error) {
        console.error("Error cargando campañas:", error)
      } finally {
        setIsLoadingCampaigns(false)
      }
    }
    loadCampaigns()
  }, [])

  // 3. PROTEGEMOS EL BUSCADOR (Por si nombre_servicio viene vacío)
  const filteredCampaigns = campaigns.filter((camp) => {
    const term = searchQuery.toLowerCase()
    const tituloMatch = camp.titulo.toLowerCase().includes(term)
    const servicioMatch = camp.nombre_servicio ? camp.nombre_servicio.toLowerCase().includes(term) : false
    return tituloMatch || servicioMatch
  })

  const handleCreateRecommendation = async () => {
    if (!selectedCampaign) return
    setIsCreating(true)

    try {
      const token = typeof window !== "undefined" && localStorage.getItem("app-storage")
        ? JSON.parse(localStorage.getItem("app-storage") as string)?.state?.accessToken
        : ""

      const response = await fetch('/api-proxy/marketing/generate-link/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          template: selectedCampaign.id,
          alias_embajador: recommendationName || selectedCampaign.titulo 
        }) 
      })

      if (response.ok) {
        const data = await response.json()
        const realLink = `${window.location.origin}/ref/${data.slug_unico}`

        await fetchRecommendations()

        setFinalGeneratedLink(realLink) 
        setShowShareModal(true)
        onRecommendationCreated(data.slug_unico)
      }
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
          
          <div className="flex items-center justify-between p-6 border-b border-border bg-card rounded-t-2xl z-10 flex-shrink-0">
            <h2 className="text-2xl font-bold text-foreground">Crear Enlace</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0">
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            
            {step === "select_campaign" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-3 block">Elegir Campaña Disponible</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar campaña..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {isLoadingCampaigns ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  ) : filteredCampaigns.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay campañas disponibles en este momento.
                    </div>
                  ) : (
                    filteredCampaigns.map((camp) => (
                      <button
                        key={camp.id}
                        onClick={() => {
                          setSelectedCampaign(camp)
                          setRecommendationName(camp.titulo) 
                        }}
                        className={cn(
                          "w-full flex gap-3 p-4 rounded-lg border-2 transition-all text-left",
                          selectedCampaign?.id === camp.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 bg-muted/30",
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{camp.titulo}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Gift className="w-3 h-3" /> {camp.nombre_servicio || "Ruta Palenque"}
                          </p>
                          <p className="text-sm font-bold text-green-600 mt-2">
                            {camp.porcentaje_descuento}% OFF
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {step === "name" && selectedCampaign && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Campaña seleccionada: <span className="font-semibold text-foreground">{selectedCampaign.titulo}</span>
                  </p>
                  <label className="text-sm font-semibold text-foreground mb-3 block">¿Cómo quieres identificar este enlace?</label>
                  <Input
                    placeholder="Ej: Promo Verano Grupo Familia"
                    value={recommendationName}
                    onChange={(e) => setRecommendationName(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Este nombre es solo para ti, para que puedas organizar tus enlaces en tu panel.
                  </p>
                </div>
              </div>
            )}

          </div>

          <div className="p-6 border-t border-border bg-card rounded-b-2xl z-10 flex-shrink-0 flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (step === "select_campaign") onClose()
                else setStep("select_campaign")
              }}
              className="flex-1"
            >
              {step === "select_campaign" ? "Cancelar" : "Atrás"}
            </Button>
            <Button
              onClick={() => {
                if (step === "select_campaign" && selectedCampaign) setStep("name")
                else handleCreateRecommendation()
              }}
              disabled={isCreating || (step === "select_campaign" && !selectedCampaign)}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isCreating ? "Creando..." : step === "name" ? "Crear Enlace" : "Siguiente"}
            </Button>
          </div>
        </div>
      </div>

      {showShareModal && selectedCampaign && (
        <ShareInviteModal
          type="marketing"
          poolName={recommendationName || selectedCampaign.titulo} 
          discount={selectedCampaign.porcentaje_descuento}
          customLink={finalGeneratedLink}
          onClose={() => {
            setShowShareModal(false)
            onClose()
          }}
        />
      )}
    </>
  )
}