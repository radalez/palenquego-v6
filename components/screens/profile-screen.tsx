"use client"

import {
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Receipt,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  Heart,
  LinkIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"

interface ProfileScreenProps {
  onNavigateToBilling: () => void
  onNavigateToSettings?: (tab: string) => void
}

export function ProfileScreen({ onNavigateToBilling, onNavigateToSettings }: ProfileScreenProps) {
  const { currentUser, logout, bookings, pools, userFavorites, recommendations } = useAppStore()

  const totalSpent = bookings.reduce((acc, b) => acc + b.totalPrice, 0)
 const poolsJoined = pools.filter((p) => (p.members ?? []).some((m) => m.name === currentUser.name)).length

  const menuItems = [
    {
      icon: Heart,
      label: "Mis Favoritos",
      description: `Gestión de viajes (${userFavorites.length})`,
      action: () => onNavigateToSettings?.("favoritos"),
      tabId: "favoritos",
    },
    {
      icon: LinkIcon,
      label: "Mis Recomendaciones",
      description: `Enlaces de servicios (${recommendations.length})`,
      action: () => onNavigateToSettings?.("recomendaciones"),
      tabId: "recomendaciones",
    },
    {
      icon: Receipt,
      label: "Mis Facturas",
      description: "Historial de gastos y descargas",
      action: onNavigateToBilling,
      tabId: "billing",
    },
    {
      icon: CreditCard,
      label: "Métodos de Pago",
      description: "Tarjetas y billeteras",
      action: () => onNavigateToSettings?.("pagos-extended"),
      tabId: "pagos-extended",
    },
    {
      icon: Bell,
      label: "Notificaciones",
      description: "Configurar alertas",
      action: () => onNavigateToSettings?.("notificaciones-extended"),
      tabId: "notificaciones-extended",
    },
    {
      icon: Shield,
      label: "Privacidad y Seguridad",
      description: "Contraseñas y datos",
      action: () => onNavigateToSettings?.("privacidad-extended"),
      tabId: "privacidad-extended",
    },
    {
      icon: HelpCircle,
      label: "Ayuda y Soporte",
      description: "FAQ y contacto",
      action: () => onNavigateToSettings?.("soporte-extended"),
      tabId: "soporte-extended",
    },
  ]

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-4 pt-12 pb-8">
        <h1 className="text-2xl font-bold text-primary-foreground mb-6">Mi Perfil</h1>

        {/* User Card */}
        <div className="bg-card rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{currentUser.avatar}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">{currentUser.name}</h2>
              <p className="text-sm text-muted-foreground">Usuario Demo</p>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-green-600">Verificado</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="bg-transparent">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-4">
        <div className="bg-card rounded-2xl p-4 shadow-md border border-border grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{bookings.length}</p>
            <p className="text-xs text-muted-foreground">Reservas</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-2xl font-bold text-secondary">{poolsJoined}</p>
            <p className="text-xs text-muted-foreground">Pools</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">${totalSpent}</p>
            <p className="text-xs text-muted-foreground">Gastado</p>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">INFORMACION DE CONTACTO</h3>
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          <div className="flex items-center gap-3 p-4">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-foreground">demo@palenquego.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-foreground">+503 7890-1234</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-foreground">San Salvador, El Salvador</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">CONFIGURACION</h3>
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={item.label === "Mis Facturas" ? onNavigateToBilling : item.action}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Logout Button */}
      <div className="px-4 mt-6 pb-24">
        <Button
          variant="outline"
          className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent"
          onClick={logout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Cerrar Sesion
        </Button>
      </div>
    </div>
  )
}
