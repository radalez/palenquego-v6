"use client"

import { useState, useEffect } from "react"
import { X, Search, Gift, Loader2, Building2, Store, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

import { ShareInviteModal } from "./share-invite-modal"

interface CreateRecommendationModalProps {
  onClose: () => void
  onRecommendationCreated: (recommendationId: string) => void
}

interface Campaign {
  id: number;
  titulo: string;
  nombre_servicio?: string;
  tienda_nombre?: string;
  aliado_nombre?: string;
  es_mi_aliado?: boolean;
  relacion_label?: string;
  porcentaje_descuento: number;
  precio_base?: number;
  precio_promocional?: number;
  cupos_disponibles?: number | null;
  es_oferta_flash?: boolean;
  tipo_campana?: string;
  categoria_nombre?: string;
  fecha_expiracion?: string;
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

  const filteredCampaigns = campaigns.filter((camp) => {
    const term = searchQuery.toLowerCase()
    const tituloMatch = camp.titulo.toLowerCase().includes(term)
    const servicioMatch = camp.nombre_servicio ? camp.nombre_servicio.toLowerCase().includes(term) : false
    const tiendaMatch = camp.tienda_nombre ? camp.tienda_nombre.toLowerCase().includes(term) : false
    return tituloMatch || servicioMatch || tiendaMatch
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
                          setRecommendationName(camp.nombre_servicio || camp.titulo) 
                        }}
                        className={cn(
                          "w-full flex flex-col gap-2 p-4 rounded-xl border-2 transition-all text-left",
                          selectedCampaign?.id === camp.id
                            ? "border-[#105238] bg-[#eaf0e2]/30 shadow-sm"
                            : "border-slate-200 hover:border-[#105238]/50 bg-white",
                        )}
                      >
                        {/* Badges superiores: Alianza B2B y Oferta Flash */}
                        <div className="flex items-center justify-between gap-2 flex-wrap w-full">
                          {camp.es_mi_aliado ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#eaf0e2] text-[#105238] border border-[#aeb6a1]/40">
                              <Building2 className="w-3 h-3 text-[#105238]" />
                              Mi Aliado Comercial B2B
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              <Store className="w-3 h-3 text-slate-500" />
                              {camp.categoria_nombre || "Comercio de la Red"}
                            </span>
                          )}

                          {camp.es_oferta_flash && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                              OFERTA FLASH
                            </span>
                          )}
                        </div>

                        {/* Título del Servicio y Nombre del Comercio Aliado */}
                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-snug">
                            {camp.nombre_servicio || camp.titulo}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="font-semibold text-slate-700">Comercio:</span> {camp.tienda_nombre || "PalenqueGo Oficial"}
                            {camp.aliado_nombre && camp.aliado_nombre !== camp.tienda_nombre && (
                              <span className="text-slate-400">({camp.aliado_nombre})</span>
                            )}
                          </p>
                        </div>

                        {/* Bloque de Precios y Cupos */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1 w-full">
                          <div className="flex items-baseline gap-2">
                            {camp.precio_base && camp.precio_promocional && camp.precio_base > camp.precio_promocional ? (
                              <>
                                <span className="text-xs text-slate-400 line-through">
                                  ${camp.precio_base.toFixed(2)}
                                </span>
                                <span className="text-base font-black text-[#105238]">
                                  ${camp.precio_promocional.toFixed(2)}
                                </span>
                              </>
                            ) : camp.precio_base ? (
                              <span className="text-sm font-bold text-slate-800">
                                ${camp.precio_base.toFixed(2)}
                              </span>
                            ) : null}
                            <span className="text-xs font-black px-1.5 py-0.5 rounded bg-emerald-100 text-[#105238]">
                              -{camp.porcentaje_descuento}% OFF
                            </span>
                          </div>

                          {camp.cupos_disponibles !== null && camp.cupos_disponibles !== undefined && (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              ¡{camp.cupos_disponibles} cupos!
                            </span>
                          )}
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