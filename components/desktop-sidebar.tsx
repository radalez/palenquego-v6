"use client"

import { useState, useEffect } from "react"
import { Store, Users, QrCode, Map, Briefcase, Crown, Zap, Star, Gem, LogOut, ChevronRight, CreditCard, Bell, Shield, HelpCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface DesktopSidebarProps {
  activeTab: string
  onNavigate: (tab: string) => void
}

export function DesktopSidebar({ activeTab, onNavigate }: DesktopSidebarProps) {
  const { userPlan, logout, currentUser } = useAppStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const plans = [
    { id: "FREE", label: "Plan Gratis", icon: Zap, description: "Acceso básico", color: "bg-blue-100 text-blue-700" },
    { id: "ORO", label: "Partner ORO", icon: Star, description: "Gestor/Turoperador", color: "bg-amber-100 text-amber-700" },
    { id: "PLATINO", label: "Partner PLATINO", icon: Crown, description: "Socio VIP", color: "bg-purple-100 text-purple-700" },
    { id: "PRO", label: "Soporte PRO", icon: Gem, description: "Profesional", color: "bg-pink-100 text-pink-700" },
  ]

  const mainTabs = [
    { id: "marketplace", label: "Servicios", icon: Store },
    { id: "businesses", label: "Negocios", icon: Briefcase },
    { id: "pool", label: "Pool", icon: Users },
    { id: "safeflow", label: "Safe-Flow", icon: QrCode },
    { id: "rutas", label: "Rutas", icon: Map },
  ]

  const secondaryTabs = [
    { id: "profile", label: "Mi Perfil", icon: User },
    { id: "planes", label: "Planes y Membresías", icon: Crown },
    { id: "pagos-extended", label: "Métodos de Pago", icon: CreditCard },
    { id: "notificaciones-extended", label: "Notificaciones", icon: Bell },
    { id: "privacidad-extended", label: "Privacidad y Seguridad", icon: Shield },
    { id: "soporte-extended", label: "Ayuda y Soporte", icon: HelpCircle },
  ]

  return (
    <div className="w-72 bg-card border-r border-border h-full flex flex-col overflow-y-auto">
      <div className="p-6">
        {/* Logo/Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <img src="/logo-white.png" alt="Palenque Go Logo" className="w-6 h-6 object-contain" style={{ filter: 'invert(1)' }} />
          </div>
          <h1 className="text-xl font-bold text-primary tracking-tight">Palenque Go</h1>
        </div>

        {/* Main Navigation */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Explorar</p>
          <div className="space-y-1">
            {mainTabs.map((tab) => {
              const IconComponent = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => onNavigate(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <IconComponent className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="h-px bg-border my-6" />

        {/* Current Plan Card */}
        {isMounted && (
          <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border border-primary/20 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("planes")}>
            <p className="text-xs text-muted-foreground mb-2">Plan Actual</p>
            <div className="flex items-center gap-2">
              {plans.find((p) => p.id === userPlan)?.icon &&
                (() => {
                  const PlanIcon = plans.find((p) => p.id === userPlan)!.icon
                  return <PlanIcon className="w-5 h-5 text-primary" />
                })()}
              <p className="font-semibold text-foreground">{plans.find((p) => p.id === userPlan)?.label}</p>
            </div>
          </div>
        )}

        {/* Secondary Navigation */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Configuración</p>
          <div className="space-y-1">
            {secondaryTabs.map((tab) => {
              const IconComponent = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => onNavigate(tab.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group text-sm",
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-foreground" />}
                </button>
              )
            })}
          </div>
        </div>

      </div>
      
      {/* Footer / Logout */}
      <div className="mt-auto p-6 border-t border-border bg-card">
        <Button
          variant="outline"
          className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}
