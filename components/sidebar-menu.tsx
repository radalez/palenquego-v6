"use client"

import { useState, useEffect } from "react"
import { Menu, X, Crown, Zap, Star, Gem, LogOut, ChevronRight, CreditCard, Bell, Shield, HelpCircle, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface SidebarMenuProps {
  activeTab: string
  onNavigate: (tab: string) => void
}

export function SidebarMenu({ activeTab, onNavigate }: SidebarMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { userPlan, logout, currentUser } = useAppStore()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const plans = [
    { id: "FREE", label: "Plan Gratis", icon: Zap, description: "Acceso básico", color: "bg-blue-100 text-blue-700" },
    { id: "ORO", label: "Partner ORO", icon: Star, description: "Gestor/Turoperador", color: "bg-amber-100 text-amber-700" },
    { id: "PLATINO", label: "Partner PLATINO", icon: Crown, description: "Socio VIP", color: "bg-purple-100 text-purple-700" },
    { id: "PRO", label: "Soporte PRO", icon: Gem, description: "Profesional", color: "bg-pink-100 text-pink-700" },
  ]

  const menuItems = [
    { id: "planes", label: "Planes y Membresías", icon: Crown },
    { id: "pagos-extended", label: "Métodos de Pago", icon: CreditCard },
    { id: "notificaciones-extended", label: "Notificaciones", icon: Bell },
    { id: "privacidad-extended", label: "Privacidad y Seguridad", icon: Shield },
    { id: "soporte-extended", label: "Ayuda y Soporte", icon: HelpCircle },
  ]

  const handleNavigate = (id: string) => {
    onNavigate(id)
    setIsOpen(false)
  }

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-72 bg-card border-r border-border z-40 transform transition-transform duration-300 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pt-20 px-4 pb-6">
          {/* Current Plan */}
          {isMounted && (
            <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border border-primary/20">
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

          {/* Sección de Chofer / Conductor */}
          {currentUser?.tipo === "CHOFER" && (
            <div className="mb-6 p-3.5 bg-gradient-to-br from-[#105238]/10 to-[#105238]/5 rounded-2xl border-2 border-[#105238]/30 shadow-sm">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#105238]">Modo Chofer</span>
                <span className={cn(
                  "text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                  currentUser.kyc_status === 'APPROVED' ? "bg-emerald-100 text-emerald-800" :
                  currentUser.kyc_status === 'PENDING' ? "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300" :
                  "bg-amber-100 text-amber-800"
                )}>
                  {currentUser.kyc_status === 'APPROVED' ? 'Aprobado' :
                   currentUser.kyc_status === 'PENDING' ? 'En Revisión' : 'KYC Requerido'}
                </span>
              </div>
              <button
                onClick={() => handleNavigate("conductor")}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all font-bold text-sm bg-[#105238] text-white shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="w-5 h-5" />
                  <span>Panel de Chofer</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>
            </div>
          )}

          {/* Menu Items */}
          <div className="space-y-2 mb-6">
            {menuItems.map((item) => {
              const IconComponent = item.icon as any
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                </button>
              )
            })}
          </div>

          {/* Divider */}
          <div className="h-px bg-border mb-6" />

          {/* Logout */}
          <Button
            variant="outline"
            className="w-full h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </>
  )
}
