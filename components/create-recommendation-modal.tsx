"use client"

import { useState, useEffect } from "react"
import { X, Search, Zap, Percent, Gift, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

// --- IMPORTAMOS TU MODAL DE COMPARTIR TAL CUAL LO PEDISTE ---
import { ShareInviteModal } from "./share-invite-modal"

interface CreateRecommendationModalProps {
  onClose: () => void
  onRecommendationCreated: (recommendationId: string) => void
}

export function CreateRecommendationModal({ onClose, onRecommendationCreated }: CreateRecommendationModalProps) {
  const { fetchRecommendations } = useAppStore()
  
  // Estados para las campañas de Django
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // --- ESTADOS PARA EL RELOJ SUIZO (MARKETING) ---
  const [showShareModal, setShowShareModal] = useState(false)
  const [finalGeneratedLink, setFinalGeneratedLink] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // 1. Cargamos las plantillas disponibles desde Django al abrir
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

  // 2. Tu buscador, pero ahora filtra las campañas de Django
  const filteredCampaigns = campaigns.filter((camp) => {
    const term = searchQuery.toLowerCase()
    return camp.titulo.toLowerCase().includes(term) || camp.nombre_servicio.toLowerCase().includes(term)
  })

  // --- LA FUNCIÓN QUE CONECTA TODO SIN ROMPER EL PADRE ---
  const handleCreateRecommendation = async () => {
    if (!selectedCampaign) return
    setIsCreating(true)

    try {
      const token = typeof window !== "undefined" && localStorage.getItem("app-storage")
        ? JSON.parse(localStorage.getItem("app-storage") as string)?.state?.accessToken
        : ""

      // A. Le decimos a Django que genere el link basado en la campaña seleccionada
      const response = await fetch('/api-proxy/marketing/generate-link/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ template: selectedCampaign.id }) // Django exige el ID del template
      })

      if (response.ok) {
        const data = await response.json()
        const realLink = `${window.location.origin}/ref/${data.slug_unico}`

        // B. MAGIA AQUÍ: Obligamos a Zustand a actualizarse ANTES de avisar al padre
        // Así evitamos la "paloma de mierda" porque el padre sí encontrará el ID
        await fetchRecommendations()

        // C. Seteamos el link real que vino de Django para TU modal interno
        setFinalGeneratedLink(realLink) 
        
        // D. Abrimos tu modal de compartir
        setShowShareModal(true)
        
        // E. Avisamos al padre (usamos slug_unico porque así lo guarda tu store)
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
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-card rounded-t-2xl z-10 flex-shrink-0">
            <h2 className="text-2xl font-bold text-foreground">Crear Enlace</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0">
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
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
                      onClick={() => setSelectedCampaign(camp)}
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
                          <Gift className="w-3 h-3" /> {camp.nombre_servicio}
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
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-card rounded-b-2xl z-10 flex-shrink-0 flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateRecommendation}
              disabled={isCreating || !selectedCampaign}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : "Crear Enlace"}
            </Button>
          </div>
        </div>
      </div>

      {/* --- EL MOMENTO DE LA VERDAD: ABRIMOS TU MODAL DE COMPARTIR --- */}
      {showShareModal && selectedCampaign && (
        <ShareInviteModal
          type="marketing" // <--- ESTO MATA EL MODO POOL COMO QUERÍAS
          poolName={selectedCampaign.titulo}
          discount={selectedCampaign.porcentaje_descuento}
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