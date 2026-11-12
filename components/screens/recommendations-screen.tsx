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

  MessageSquare,

  Building2,

  Store

} from "lucide-react"

import { Button } from "@/components/ui/button"

import { Badge } from "@/components/ui/badge"

import { useAppStore } from "@/lib/store"

import { cn } from "@/lib/utils" 

import { ShareRecommendationModal } from "@/components/share-recommendation-modal"

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

      <div className="flex flex-col min-h-screen bg-slate-50 items-center">

        <header className="px-4 py-4 bg-white border-b w-full">

          <div className="max-w-3xl mx-auto w-full flex items-center gap-4">

            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">

              <ChevronLeft className="w-6 h-6" />

            </Button>

            <h1 className="text-xl font-bold">Mis Recomendaciones</h1>

          </div>

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

            className="w-full max-w-sm bg-[#105238] hover:bg-[#0c3e2a] text-white h-14 rounded-xl font-semibold gap-2"

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

    <div className="flex flex-col min-h-screen bg-slate-50 items-center">

      {/* Header */}

      <header className="px-4 py-4 bg-white border-b sticky top-0 z-10 w-full">

        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">

          <div className="flex items-center gap-4">

            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">

              <ChevronLeft className="w-6 h-6" />

            </Button>

            <h1 className="text-xl font-bold text-slate-900">Mis Enlaces</h1>

          </div>

          <Button

            onClick={() => setShowCreateModal(true)}

            className="bg-[#105238] hover:bg-[#0c3e2a] text-white rounded-full px-4 gap-2 font-semibold shadow-sm transition-all"

          >

            <Plus className="w-4 h-4" />

            Crear Enlace

          </Button>

        </div>

      </header>



      {/* Stats Summary */}

      <div className="p-4 bg-white border-b w-full">

        <div className="max-w-3xl mx-auto w-full grid grid-cols-2 gap-4 shadow-sm">

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

      </div>



      {/* Enlaces Activos */}

      <div className="flex-1 p-4 space-y-4 pb-24 w-full max-w-3xl mx-auto">

        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">

          <LinkIcon className="w-4 h-4 text-[#105238]" />

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
              const service = services.find((s) => s.id === rec.serviceId);
              const displayName = (rec as any).nombre_servicio || (rec as any).nombre || rec.name;
              const storeName = (rec as any).tienda_nombre || (service?.name ? `Comercio: ${service.name}` : "Comercio PalenqueGo");
              const discountVal = (rec as any).descuento || (rec as any).porcentaje_descuento || 20;

              return (
                <div key={rec.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-[#eaf0e2] rounded-xl flex items-center justify-center flex-shrink-0">
                        {(rec as any).es_oferta_flash || rec.type === 'oferta' ? (
                          <Zap className="w-6 h-6 text-[#105238]" />
                        ) : (
                          <Percent className="w-6 h-6 text-[#105238]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          {(rec as any).es_mi_aliado ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#eaf0e2] text-[#105238] border border-[#aeb6a1]/40">
                              <Building2 className="w-3 h-3 text-[#105238]" />
                              Mi Aliado B2B
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              <Store className="w-3 h-3 text-slate-500" />
                              {(rec as any).tienda_nombre || 'Comercio de la Red'}
                            </span>
                          )}

                          {(rec as any).esta_expirado ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              <Clock className="w-3 h-3 text-slate-500" />
                              FINALIZADA
                            </span>
                          ) : (rec as any).es_oferta_flash ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                              OFERTA FLASH
                            </span>
                          ) : null}
                        </div>

                        <h4 className="font-bold text-slate-900 text-base leading-snug">{displayName}</h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-slate-500">
                          {(rec as any).servicio_nombre && (rec as any).servicio_nombre !== displayName && (
                            <span className="font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                              Servicio: {(rec as any).servicio_nombre}
                            </span>
                          )}
                          <p className="text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">Comercio:</span> {storeName}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={rec.stats.paymentStatus === 'PAGADO' ? 'default' : 'outline'} 
                      className={rec.stats.paymentStatus === 'PAGADO' ? "rounded-full bg-[#105238] hover:bg-[#0c3e2a] border-transparent text-white" : "rounded-full"}
                    >
                      {rec.stats.paymentStatus}
                    </Badge>
                  </div>

                  {/* Bloque Detallado de Precios y Descuento */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                    <div className="flex items-baseline gap-2">
                      {(rec as any).precio_base && (rec as any).precio_promocional && (rec as any).precio_base > (rec as any).precio_promocional ? (
                        <>
                          <span className="text-xs text-slate-400 line-through">
                            ${(rec as any).precio_base.toFixed(2)}
                          </span>
                          <span className="text-sm font-black text-[#105238]">
                            ${(rec as any).precio_promocional.toFixed(2)}
                          </span>
                        </>
                      ) : (rec as any).precio_base ? (
                        <span className="text-sm font-bold text-slate-800">
                          ${(rec as any).precio_base.toFixed(2)}
                        </span>
                      ) : null}
                      <span className="text-xs font-black px-1.5 py-0.5 rounded bg-emerald-100 text-[#105238]">
                        -{discountVal}% OFF
                      </span>
                    </div>

                    {(rec as any).cupos_disponibles !== null && (rec as any).cupos_disponibles !== undefined && (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        ¡{(rec as any).cupos_disponibles} cupos!
                      </span>
                    )}
                  </div>

                  {/* Estadísticas de Rendimiento */}
                  <div className="grid grid-cols-3 gap-2 border-y border-slate-50 py-2.5 bg-slate-50/50 rounded-xl px-2">
                    <div className="text-center">
                      <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                        <Eye className="w-3 h-3" /> Vistas
                      </div>
                      <div className="font-bold text-slate-800">{(rec as any).clics ?? (rec as any).vistas ?? rec.stats.clicks ?? 0}</div>
                    </div>
                    <div className="text-center border-x border-slate-200">
                      <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                        <ShoppingCart className="w-3 h-3" /> Ventas
                      </div>
                      <div className="font-bold text-slate-800">{(rec as any).ventas ?? rec.stats.purchases ?? 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                        <DollarSign className="w-3 h-3" /> Ganancia
                      </div>
                      <div className="font-bold text-[#105238]">${(rec as any).ganancia ?? rec.stats.totalEarned ?? 0}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {(rec as any).esta_expirado ? (
                      <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold border border-slate-200">
                        <Clock className="w-3.5 h-3.5" />
                        Oferta Concluida
                      </div>
                    ) : (
                      <Button 
                        className="flex-1 bg-[#105238] hover:bg-[#0c3e2a] text-white rounded-xl gap-2 text-sm font-semibold shadow-sm transition-all"
                        onClick={() => {
                          setSelectedRecommendation(rec.id)
                          setShowShareModal(true)
                        }}
                      >
                        <LinkIcon className="w-4 h-4" />
                        Compartir Link
                      </Button>
                    )}
                    {rec.stats.paymentStatus === "PENDIENTE" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markRecommendationAsPaid(rec.id)}
                        className="text-xs border-emerald-200 text-[#105238] hover:bg-emerald-50 rounded-xl"
                      >
                        Cobrar
                      </Button>
                    )}
                  </div>
                </div>
              );
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

    

{/* REEMPLAZA EL BLOQUE DE showShareModal POR ESTE: */}

      {showShareModal && selectedRecommendation && (

        (() => {

          const rec = recommendations.find((r) => r.id === selectedRecommendation)

          const service = services.find((s) => s.id === rec?.serviceId)

          

          if (!rec) return null



          // Fusionamos los datos del servicio y la recomendación para que el modal

          // reciba la estructura EXACTA que espera (y que escupirá la API después)

          const recommendationData = {
            ...rec,
            nombre: (rec as any).nombre_servicio || (rec as any).nombre || rec.name || service?.name,
            name: (rec as any).nombre_servicio || (rec as any).nombre || rec.name || service?.name,
            descuento: (rec as any).descuento || (rec as any).porcentaje_descuento || service?.discount || 20,
            cupon: (rec as any).cupon || (rec as any).codigo_embajador || "PALENQUE",
            tienda_nombre: (rec as any).tienda_nombre || (service?.name ? `Comercio: ${service.name}` : ""),
          }



          return (

            <ShareRecommendationModal

              // Ahora SOLO le pasamos recommendationData, sin serviceName ni discount aparte

              recommendation={recommendationData}

              onClose={() => {

                setShowShareModal(false)

                setSelectedRecommendation(null)

                setShowCreateModal(false)

              }}

            />

          )

        })()

      )}

    </div>

  )

}