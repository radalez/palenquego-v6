"use client"

import { useState, useEffect } from "react"
import { Crown, Star, Zap, Gem, Check, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"

interface PlansScreenProps {
  onBack: () => void
}

export function PlansScreen({ onBack }: PlansScreenProps) {
  const { userPlan, upgradePlan, plans, fetchPlans, currentUser, fetchCurrentUser } = useAppStore()
  const [loadingPlanId, setLoadingPlanId] = useState<number | null>(null)
  const [highlightBronce, setHighlightBronce] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const shouldHighlight = sessionStorage.getItem("palenque_highlight_bronce") === "true"
      if (shouldHighlight) {
        setHighlightBronce(true)
      }
    }
  }, [])

  const handleUpgrade = async (planId: number) => {
    setLoadingPlanId(planId)
    try {
      await upgradePlan(planId)
      await fetchCurrentUser()
    } finally {
      setLoadingPlanId(null)
    }
  }

  useEffect(() => {
    // Solo cargamos si el array está vacío para no saturar el servidor
    if (plans.length === 0) {
      fetchPlans()
    }
  }, [fetchPlans, plans.length])

  // Recuperamos la lógica de estilos que tenías originalmente
  const getVisualConfig = (nombre: string) => {
    const name = nombre.toUpperCase()
    if (name.includes("ORO")) {
      return {
        icon: Star,
        description: "Para gestores de activos",
        color: "from-amber-50 to-amber-100 border-amber-200",
        features: ["Todo del Plan Gratis", "Gestión multi-activo", "Crear y activar Remates Flow", "Crear paquetes de experiencias", "Dashboard de ventas", "Soporte prioritario"]
      }
    }
    if (name.includes("PLATINO")) {
      return {
        icon: Crown,
        description: "Para socios VIP y logística",
        color: "from-purple-50 to-purple-100 border-purple-200",
        features: ["Todo de Partner ORO", "Crear y gestionar Rutas Abiertas", "Comisión de red en rutas", "Análisis avanzado de mercado", "API integración", "Gestor de cuenta dedicado"]
      }
    }
    if (name.includes("PRO")) {
      return {
        icon: Gem,
        description: "Para profesionales y servicios",
        color: "from-pink-50 to-pink-100 border-pink-200",
        features: ["Todo del Plan Gratis", "Directorio profesional destacado", "Visibilidad en Marketplace Capa 3", "Herramientas de contratos", "Estadísticas detalladas", "Soporte 24/7"]
      }
    }
    // Default: Plan Bronce / Gratis
    return {
      icon: Zap,
      description: "Ideal para iniciar, registrar tu negocio y alianzas B2B",
      color: "from-emerald-50 via-teal-50 to-emerald-100 border-[#91c44a]/50",
      features: [
        "Activa tu Tienda Oficial y publica tus servicios",
        "Habilita tu comercio para Alianzas B2B y Socio Comercial",
        "Acceso a Marketplace de Comercios",
        "Crear y unirse a Pools",
        "Safe-Flow básico",
        "Soporte por email"
      ]
    }
  }

  return (
    <div className="flex flex-col min-h-full items-center">
      {/* Header - Restaurado con tu degradado original */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-4 pt-12 pb-6 w-full">
        <div className="max-w-3xl mx-auto w-full">
          <button onClick={onBack} className="mb-4 text-primary-foreground hover:opacity-80">
            ← Atrás
          </button>
          <h1 className="text-2xl font-bold text-primary-foreground">Planes y Membresías</h1>
          <p className="text-primary-foreground/80 text-sm mt-2">Elige el plan perfecto para potenciar Palenque Go</p>
        </div>
      </div>

      {/* Plans Grid - Dinámico pero con todo el estilo visual */}
      <div className="px-4 py-6 space-y-4 pb-24 w-full max-w-3xl mx-auto">
        {plans.map((plan) => {
          const config = getVisualConfig(plan.nombre)
          const Icon = config.icon
          const isCurrentPlan = Boolean(
            currentUser?.plan && currentUser.plan.toLowerCase() === plan.nombre.toLowerCase()
          );
          const isProcessingThis = loadingPlanId === plan.id

          return (
            <div
              key={plan.id}
              className={`bg-gradient-to-br ${config.color} rounded-2xl p-6 border-2 transition-all ${
                plan.nombre.toLowerCase().includes("bronce") && highlightBronce
                  ? "ring-4 ring-[#91c44a] shadow-xl border-[#105238]/40"
                  : isCurrentPlan ? "ring-2 ring-primary" : "hover:shadow-lg"
              }`}
            >
              {/* Banner explicativo B2B en plan Bronce */}
              {plan.nombre.toLowerCase().includes("bronce") && (
                <div className="mb-4 bg-[#eaf0e2] dark:bg-[#105238]/40 border border-[#91c44a] rounded-xl p-3 flex items-start gap-2.5 shadow-xs">
                  <Building2 className="w-5 h-5 text-[#105238] dark:text-[#8ee01a] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#105238] dark:text-[#eaf0e2]">
                      Plan para Activar tu Negocio y Proponer Alianzas B2B
                    </p>
                    <p className="text-[11px] text-[#105238]/80 dark:text-[#eaf0e2]/80 leading-snug mt-0.5">
                      Este plan te permite activar tu tienda oficial, publicar tus servicios y poder postular como socio comercial con otros negocios de la red PalenqueGo.
                    </p>
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/80 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{plan.nombre}</h3>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>
              </div>

              {/* Price - Ahora viene de tu Admin de Django */}
              <div className="mb-4">
                <p className="text-3xl font-bold text-foreground">
                  ${plan.precio_mensual}
                  <span className="text-sm text-muted-foreground ml-1">/ mes</span>
                </p>
              </div>

              {/* Features - Mezcla de DB y maquetación original */}
              <div className="space-y-2 mb-6">
                {config.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
                {/* Dato dinámico de la comisión de la DB */}
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-semibold text-foreground">
                    {plan.comision_plataforma}% comisión en recomendaciones
                  </span>
                </div>
                {plan.permite_rutas && (
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-bold text-primary">Permite Crear Rutas Abiertas</span>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              {isCurrentPlan ? (
                <Button disabled className="w-full bg-primary/50 text-primary-foreground">
                  Plan Actual
                </Button>
              ) : (
                <Button
                  disabled={loadingPlanId !== null}
                  className={`w-full font-bold transition-all cursor-pointer ${
                    plan.nombre.toLowerCase().includes("bronce") && highlightBronce
                      ? "bg-[#105238] hover:bg-[#0c3e2a] text-[#8ee01a] animate-pulse ring-4 ring-[#91c44a]/70 shadow-lg text-base py-3"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                  }`}
                  onClick={() => handleUpgrade(plan.id)}
                >
                 {isProcessingThis
                   ? "Procesando..."
                   : plan.nombre.toLowerCase().includes("bronce") && highlightBronce
                   ? `¡Actualizar a ${plan.nombre} (Activar Mi Negocio)!`
                   : `Actualizar a ${plan.nombre}`}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Info Box - Restaurado */}
      <div className="px-4 pb-6 mt-4">
        <div className="bg-muted/50 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">
            Todos los planes incluyen acceso completo a Palenque Go. Cancela en cualquier momento sin penalidades. Los precios están sincronizados con tu configuración regional.
          </p>
        </div>
      </div>
    </div>
  )
}