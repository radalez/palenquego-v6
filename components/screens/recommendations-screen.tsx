"use client"

import { useState } from "react"
import {
  ChevronLeft,
  Plus,
  Link as LinkIcon,
  Zap,
  Gift,
  Percent,
  Eye,
  ShoppingCart,
  DollarSign,
  Check,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/store"
import { ShareInviteModal } from "@/components/share-invite-modal"
import { CreateRecommendationModal } from "@/components/create-recommendation-modal"

interface RecommendationsScreenProps {
  onBack: () => void
}

export function RecommendationsScreen({ onBack }: RecommendationsScreenProps) {
  const { recommendations, markRecommendationAsPaid, updateRecommendationStats, services } = useAppStore()
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const totalEarned = recommendations.reduce((sum, rec) => sum + rec.stats.totalEarned, 0)
  const totalPending = recommendations
    .filter((rec) => rec.stats.paymentStatus === "PENDIENTE")
    .reduce((sum, rec) => sum + rec.stats.totalEarned, 0)
  const totalPaid = recommendations
    .filter((rec) => rec.stats.paymentStatus === "PAGADO")
    .reduce((sum, rec) => sum + rec.stats.totalEarned, 0)

  const typeConfig = {
    oferta: { label: "Oferta", icon: Zap, color: "bg-blue-100 text-blue-700" },
    descuento: { label: "Descuento", icon: Percent, color: "bg-green-100 text-green-700" },
    feriado: { label: "Feriado", icon: Gift, color: "bg-purple-100 text-purple-700" },
  }

  const handleSimulateClick = (recId: string) => {
    updateRecommendationStats(recId, {
      clicks: (recommendations.find((r) => r.id === recId)?.stats.clicks || 0) + 1,
    })
  }

  const handleSimulatePurchase = (recId: string) => {
    const rec = recommendations.find((r) => r.id === recId)
    if (!rec) return
    updateRecommendationStats(recId, {
      purchases: rec.stats.purchases + 1,
      totalEarned: rec.stats.totalEarned + 15, // Simulated commission
      clicks: rec.stats.clicks + 1,
    })
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-4 pt-4 pb-8 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-primary/20 rounded-lg transition-colors">
            <ChevronLeft className="w-6 h-6 text-primary-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary-foreground">Mis Recomendaciones</h1>
            <p className="text-sm text-primary-foreground/80">Gestiona tus enlaces de servicios</p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuevo
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg p-3">
            <p className="text-xs text-primary-foreground/70 mb-1">Total Ganado</p>
            <p className="text-lg font-bold text-primary-foreground">${totalEarned}</p>
          </div>
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-xs text-yellow-700 mb-1">Pendiente</p>
            <p className="text-lg font-bold text-yellow-700">${totalPending}</p>
          </div>
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
            <p className="text-xs text-green-700 mb-1">Pagado</p>
            <p className="text-lg font-bold text-green-700">${totalPaid}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4">
        {recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <LinkIcon className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Aún no tienes enlaces de recomendación</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Crea tu primer enlace para comenzar a ganar</p>
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              Crear enlace
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => {
              const TypeIcon = typeConfig[rec.type as keyof typeof typeConfig]?.icon
              const TypeColor = typeConfig[rec.type as keyof typeof typeConfig]?.color
              const TypeLabel = typeConfig[rec.type as keyof typeof typeConfig]?.label
              const service = services.find((s) => s.id === rec.serviceId)

              return (
                <div key={rec.id} className="bg-card rounded-xl p-4 border border-border">
                  {/* Header with Thumbnail */}
                  <div className="flex items-start gap-4 mb-3">
                    {service && (
                      <img
                        src={service.image || "/placeholder.svg"}
                        alt={service.name}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{rec.name}</h3>
                        <Badge className={TypeColor}>
                          {TypeIcon && <TypeIcon className="w-3 h-3 mr-1" />}
                          {TypeLabel}
                        </Badge>
                        <Badge
                          variant={rec.stats.paymentStatus === "PAGADO" ? "default" : "secondary"}
                          className={rec.stats.paymentStatus === "PAGADO" ? "bg-green-600" : ""}
                        >
                          {rec.stats.paymentStatus === "PAGADO" ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Pagado
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Pendiente
                            </>
                          )}
                        </Badge>
                      </div>
                      {service && (
                        <p className="text-sm font-medium text-foreground mb-1">{service.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground break-all font-mono">{rec.link}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Creado: {new Date(rec.createdAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-2 mb-3 py-3 border-y border-border">
                    <div className="text-center">
                      <Eye className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">{rec.stats.clicks}</p>
                      <p className="text-xs text-muted-foreground">Clics</p>
                    </div>
                    <div className="text-center">
                      <ShoppingCart className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">{rec.stats.purchases}</p>
                      <p className="text-xs text-muted-foreground">Compras</p>
                    </div>
                    <div className="text-center">
                      <DollarSign className="w-4 h-4 text-green-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-green-600">${rec.stats.totalEarned}</p>
                      <p className="text-xs text-muted-foreground">Comisión</p>
                    </div>
                    {rec.stats.lastPaymentDate && (
                      <div className="text-center">
                        <Check className="w-4 h-4 text-green-600 mx-auto mb-1" />
                        <p className="text-xs font-medium text-green-600">Pagado</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(rec.stats.lastPaymentDate).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRecommendation(rec.id)
                        setShowShareModal(true)
                      }}
                      className="flex-1 text-xs"
                    >
                      <LinkIcon className="w-3 h-3 mr-1" />
                      Compartir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSimulateClick(rec.id)}
                      className="flex-1 text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Simular Click
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSimulatePurchase(rec.id)}
                      className="flex-1 text-xs"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Simular Compra
                    </Button>
                    {rec.stats.paymentStatus === "PENDIENTE" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markRecommendationAsPaid(rec.id)}
                        className="flex-1 text-xs border-green-200 text-green-600 hover:bg-green-50"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Marcar Pagado
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals - Secuencial */}
      {showCreateModal && !showShareModal && (
        <CreateRecommendationModal
          onClose={() => setShowCreateModal(false)}
          onRecommendationCreated={(recId) => {
            setSelectedRecommendation(recId)
            setShowShareModal(true)
          }}
        />
      )}

      {showShareModal && selectedRecommendation && (
        <ShareInviteModal
          poolId={Number(selectedRecommendation)}
          poolName={
            recommendations.find((r) => r.id === selectedRecommendation)?.name ||
            "Mi Recomendación"
          }
          spotPrice={0}
          spotsLeft={0}
          onClose={() => {
            setShowShareModal(false)
            setSelectedRecommendation(null)
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}
