"use client"

import { useState, useEffect } from "react"
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
  ShieldAlert,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { ShareInviteModal } from "@/components/share-invite-modal"
import { CreateRecommendationModal } from "@/components/create-recommendation-modal"

interface RecommendationsScreenProps {
  onBack: () => void
}

export function RecommendationsScreen({ onBack }: RecommendationsScreenProps) {
  const { 
    currentUser, 
    recommendations, 
    markRecommendationAsPaid, 
    services, 
    fetchRecommendations 
  } = useAppStore()
  
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // 1. SINCRONIZACIÓN INICIAL
  useEffect(() => {
    if (currentUser?.is_ambassador) {
      fetchRecommendations();
    }
  }, [currentUser, fetchRecommendations]);

  // --- TRABA DE SEGURIDAD (EL RECTIFICADOR) ---
  // Si el usuario no tiene rango de Embajador, mostramos la pantalla de bloqueo
  if (!currentUser?.is_ambassador) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <header className="px-4 py-4 bg-white border-b flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">Mis Recomendaciones</h1>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Acceso Restringido</h2>
          <p className="text-slate-500 mb-8 max-w-xs">
            Esta sección es exclusiva para Embajadores autorizados. Para empezar a ganar comisiones, contacta con un agente de Palenque Go.
          </p>
          <Button 
            className="w-full max-w-sm bg-orange-600 hover:bg-orange-700 text-white h-14 rounded-xl font-semibold gap-2"
            onClick={() => window.open('https://wa.me/TUNUMERO', '_blank')}
          >
            <MessageSquare className="w-5 h-5" />
            Contactar con Soporte
          </Button>
        </div>
      </div>
    )
  }

  // --- LÓGICA PARA USUARIOS AUTORIZADOS (MELVIS) ---
  const totalEarned = recommendations.reduce((sum, rec) => sum + rec.stats.totalEarned, 0)
  const totalPending = recommendations
    .filter((rec) => rec.stats.paymentStatus === "PENDIENTE")
    .reduce((sum, rec) => sum + (rec.stats.totalEarned || 0), 0)

  const totalPaid = recommendations
    .filter((rec) => rec.stats.paymentStatus === "PAGADO")
    .reduce((sum, rec) => sum + (rec.stats.totalEarned || 0), 0)

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="px-4 py-4 bg-white border-b flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-slate-900">Mis Enlaces</h1>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-4 gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Enlace
        </Button>
      </header>

      {/* Stats Summary */}
      <div className="p-4 bg-white border-b grid grid-cols-2 gap-4 shadow-sm">
        <div className="p-4 bg-blue-50 rounded-2xl">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Por Cobrar</span>
          </div>
          <div className="text-2xl font-black text-blue-900">${totalPending}</div>
        </div>
        <div className="p-4 bg-green-50 rounded-2xl">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Check className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Ganado Total</span>
          </div>
          <div className="text-2xl font-black text-green-900">${totalEarned}</div>
        </div>
      </div>

      {/* Enlaces Activos */}
      <div className="flex-1 p-4 space-y-4 pb-24">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
          <LinkIcon className="w-4 h-4 text-orange-500" />
          Tus Campañas Activas
        </h3>

        {recommendations.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-slate-200">
            <Gift className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Aún no has creado enlaces de recomendación.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {recommendations.map((rec) => {
              const service = services.find(s => s.id === rec.serviceId);
              return (
                <div key={rec.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        {rec.type === 'oferta' ? (
                          <Zap className="w-6 h-6 text-orange-600" />
                        ) : rec.type === 'descuento' ? (
                          <Percent className="w-6 h-6 text-orange-600" />
                        ) : (
                          <Gift className="w-6 h-6 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{rec.name}</h4>
                        <p className="text-xs text-slate-500">{service?.name || 'Servicio Palenque'}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={rec.stats.paymentStatus === 'PAGADO' ? 'default' : 'outline'} 
                      className={rec.stats.paymentStatus === 'PAGADO' ? "rounded-full bg-green-600 hover:bg-green-700 border-transparent text-white" : "rounded-full"}
                    >
                      {rec.stats.paymentStatus}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-y border-slate-50 py-3">
                    <div className="text-center">
                      <div className="text-xs text-slate-400 flex items-center justify-center gap-1 mb-1">
                        <Eye className="w-3 h-3" /> Vistas
                      </div>
                      <div className="font-bold text-slate-800">{rec.stats.clicks}</div>
                    </div>
                    <div className="text-center border-x border-slate-50">
                      <div className="text-xs text-slate-400 flex items-center justify-center gap-1 mb-1">
                        <ShoppingCart className="w-3 h-3" /> Ventas
                      </div>
                      <div className="font-bold text-slate-800">{rec.stats.purchases || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400 flex items-center justify-center gap-1 mb-1">
                        <DollarSign className="w-3 h-3" /> Ganancia
                      </div>
                      <div className="font-bold text-green-600">${rec.stats.totalEarned}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button 
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl gap-2 text-sm"
                      onClick={() => {
                        setSelectedRecommendation(rec.id)
                        setShowShareModal(true)
                      }}
                    >
                      <LinkIcon className="w-4 h-4" />
                      Compartir Link
                    </Button>
                    {rec.stats.paymentStatus === "PENDIENTE" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markRecommendationAsPaid(rec.id)}
                        className="text-xs border-green-200 text-green-600 hover:bg-green-50 rounded-xl"
                      >
                        Cobrar
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODALS */}
      {showCreateModal && (
        <CreateRecommendationModal
          onClose={() => setShowCreateModal(false)}
          onRecommendationCreated={(recId) => {
            setSelectedRecommendation(recId)
            setShowShareModal(true)
            setShowCreateModal(false)
          }}
        />
      )}

      {showShareModal && selectedRecommendation && (
        <ShareInviteModal
          poolId={Number(selectedRecommendation)}
          poolName={recommendations.find(r => r.id === selectedRecommendation)?.name || "Mi Oferta"}
          spotPrice={0}
          spotsLeft={0}
          onClose={() => {
            setShowShareModal(false)
            setSelectedRecommendation(null)
          }}
        />
      )}
    </div>
  )
}