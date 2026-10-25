"use client"

import { useState, useEffect } from "react"
import { Bell, Mail, MessageSquare, Check, Sparkles, ShieldAlert, ShieldCheck, Users, Car, Store, ExternalLink, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore, InAppNotification } from "@/lib/store"

interface NotificationsScreenProps {
  onBack: () => void
  onNavigate?: (tab: string) => void
}

export function NotificationsScreen({ onBack, onNavigate }: NotificationsScreenProps) {
  const [activeSubTab, setActiveSubTab] = useState<"inbox" | "settings">("inbox")
  const { 
    notifications, 
    updateNotifications, 
    inboxNotifications, 
    unreadNotificationsCount, 
    fetchNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
  } = useAppStore()

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const notificationTypes = [
    {
      id: "email",
      label: "Notificaciones por Email",
      description: "Recibe actualizaciones sobre reservas, pools y promociones",
      icon: Mail,
    },
    {
      id: "sms",
      label: "Notificaciones por SMS",
      description: "Alertas instantáneas en tu teléfono",
      icon: MessageSquare,
    },
    {
      id: "push",
      label: "Notificaciones Push",
      description: "Recordatorios y avisos en la app",
      icon: Bell,
    },
  ]

  const getNotificationIcon = (tipo: string, icono: string) => {
    switch (tipo) {
      case "SAFEFLOW":
        return icono === "ShieldAlert" ? ShieldAlert : ShieldCheck
      case "PLAN":
        return Sparkles
      case "CHOFER":
        return Car
      case "POOL":
        return Users
      case "RESERVA":
        return Store
      default:
        return Bell
    }
  }

  const getPriorityColors = (prioridad: string, leido: boolean) => {
    if (leido) {
      return "bg-card border-border text-muted-foreground opacity-80"
    }
    switch (prioridad) {
      case "DANGER":
        return "bg-rose-500/10 border-rose-500/40 text-foreground"
      case "WARNING":
        return "bg-amber-500/10 border-amber-500/40 text-foreground"
      case "SUCCESS":
        return "bg-emerald-500/10 border-emerald-500/40 text-foreground"
      default:
        return "bg-blue-500/10 border-blue-500/40 text-foreground"
    }
  }

  const getIconBadgeColor = (prioridad: string) => {
    switch (prioridad) {
      case "DANGER":
        return "bg-rose-500 text-white"
      case "WARNING":
        return "bg-amber-500 text-white"
      case "SUCCESS":
        return "bg-emerald-600 text-white"
      default:
        return "bg-blue-600 text-white"
    }
  }

  return (
    <div className="flex flex-col min-h-full pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-4 pt-12 pb-5 text-primary-foreground shadow-md">
        <button onClick={onBack} className="mb-3 text-primary-foreground/90 hover:text-white text-xs font-bold flex items-center gap-1">
          ← Volver
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Centro de Notificaciones</h1>
            <p className="text-primary-foreground/80 text-xs mt-1">Avisos importantes de tus viajes, seguridad y membresía</p>
          </div>
          <div className="relative p-2.5 bg-white/10 rounded-2xl border border-white/20">
            <Bell className="w-6 h-6 text-white" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[11px] font-black rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </div>
        </div>

        {/* Sub-Tabs: Buzón vs Ajustes */}
        <div className="flex gap-2 mt-5 p-1 bg-black/15 rounded-xl">
          <button
            onClick={() => setActiveSubTab("inbox")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === "inbox" ? "bg-white text-emerald-950 shadow-sm" : "text-white/80 hover:text-white"
            }`}
          >
            <span>Buzón de Avisos</span>
            {unreadNotificationsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("settings")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === "settings" ? "bg-white text-emerald-950 shadow-sm" : "text-white/80 hover:text-white"
            }`}
          >
            Canales y Ajustes
          </button>
        </div>
      </div>

      {/* CONTENIDO 1: BUZÓN DE NOTIFICACIONES */}
      {activeSubTab === "inbox" && (
        <div className="px-4 py-5 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {inboxNotifications.length} {inboxNotifications.length === 1 ? "Notificación" : "Notificaciones"}
            </span>
            {unreadNotificationsCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Marcar todas leídas
              </button>
            )}
          </div>

          {inboxNotifications.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center mt-4">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                <Bell className="w-7 h-7 opacity-50" />
              </div>
              <p className="font-bold text-foreground text-sm">Tu buzón está al día</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Aquí recibirás las confirmaciones de tus reservas, alertas de Safe-Flow y novedades de tu membresía.
              </p>
            </div>
          ) : (
            inboxNotifications.map((notif: InAppNotification) => {
              const IconComp = getNotificationIcon(notif.tipo, notif.icono)
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.leido && markNotificationAsRead(notif.id)}
                  className={`rounded-2xl p-4 border transition-all cursor-pointer ${getPriorityColors(notif.prioridad, notif.leido)}`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${getIconBadgeColor(notif.prioridad)}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-foreground text-sm truncate">{notif.titulo}</h4>
                        {!notif.leido && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {notif.mensaje}
                      </p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50 text-[11px]">
                        <span className="text-muted-foreground">
                          {new Date(notif.creado_el).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(notif.creado_el).toLocaleDateString()}
                        </span>
                        {notif.enlace_accion && (
                          <a
                            href={notif.enlace_accion}
                            target={notif.enlace_accion.startsWith("http") ? "_blank" : "_self"}
                            onClick={(e) => {
                              e.stopPropagation()
                              markNotificationAsRead(notif.id)
                              if (notif.enlace_accion && !notif.enlace_accion.startsWith("http") && onNavigate) {
                                e.preventDefault()
                                const clean = notif.enlace_accion.replace(/^\//, '')
                                onNavigate(clean)
                              }
                            }}
                            className="font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            Ver detalle <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* CONTENIDO 2: AJUSTES DE CANALES */}
      {activeSubTab === "settings" && (
        <div className="px-4 py-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">CANALES DE TRANSMISIÓN</h3>

          {notificationTypes.map((type) => {
            const Icon = type.icon
            const isEnabled = notifications[type.id as keyof typeof notifications]
            return (
              <div key={type.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg mt-0.5">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateNotifications({
                      [type.id]: !isEnabled,
                    })
                  }
                  className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
                    isEnabled ? "bg-primary" : "bg-muted border border-border"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      isEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
