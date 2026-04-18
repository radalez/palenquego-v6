"use client"

import { useEffect } from "react"
import { Crown, Star, Zap, Gem, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"

interface PlansScreenProps {
  onBack: () => void
}

export function PlansScreen({ onBack }: PlansScreenProps) {
  const { userPlan, upgradePlan, plans, fetchPlans } = useAppStore()

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
    // Default: Plan Gratis
    return {
      icon: Zap,
      description: "Perfecto para explorar",
      color: "from-blue-50 to-blue-100 border-blue-200",
      features: ["Acceso a Marketplace", "Crear y unirse a Pools", "Safe-Flow básico", "Soporte por email"]
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header - Restaurado con tu degradado original */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-4 pt-12 pb-6">
        <button onClick={onBack} className="mb-4 text-primary-foreground hover:opacity-80">
          ← Atrás
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">Planes y Membresías</h1>
        <p className="text-primary-foreground/80 text-sm mt-2">Elige el plan perfecto para potenciar Palenque Go</p>
      </div>

      {/* Plans Grid - Dinámico pero con todo el estilo visual */}
      <div className="px-4 py-6 space-y-4 pb-24">
        {plans.map((plan) => {
          const config = getVisualConfig(plan.nombre)
          const Icon = config.icon
          const isCurrentPlan = userPlan === plan.nombre
          const { isLoading } = useAppStore()

          return (
            <div
              key={plan.id}
              className={`bg-gradient-to-br ${config.color} rounded-2xl p-6 border-2 transition-all ${
                isCurrentPlan ? "ring-2 ring-primary" : "hover:shadow-lg"
              }`}
            >
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
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => upgradePlan(plan.id)}
                >
                 {isLoading ? "Procesando..." : `Actualizar a ${plan.nombre}`}
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