"use client"

import { useState, useEffect } from "react"
import { Bell, Mail, MessageSquare, Check, Sparkles, ShieldAlert, ShieldCheck, Users, Car, Store, ExternalLink, CheckCheck, Moon, Clock, Tag } from "lucide-react"
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

  // Tipos de alertas granulares
  const [alertSettings, setAlertSettings] = useState({
    reservasConfirmadas: true,
    poolActualizaciones: true,
    remates: true,
    safeFlow: true,
    recomendaciones: true,
    promoOfertas: false,
    quietHoursEnabled: true,
    quietStart: "22:00",
    quietEnd: "07:00",
  })

  const toggleAlert = (key: keyof typeof alertSettings) => {
    setAlertSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const notificationChannels = [
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

  const alertCategories = [
    { key: "reservasConfirmadas" as const, label: "Reservas confirmadas", desc: "Avisos de boletos y reservas aceptadas" },
    { key: "poolActualizaciones" as const, label: "Actualizaciones de Pool", desc: "Nuevos integrantes y salida de grupos" },
    { key: "remates" as const, label: "Remates Flow disponibles", desc: "Subastas y oportunidades de viaje activas" },
    { key: "safeFlow" as const, label: "Alertas Safe-Flow", desc: "Pánico SOS, monitoreo y desvíos de ruta" },
    { key: "recomendaciones" as const, label: "Comisiones por recomendaciones", desc: "Avisos de recompensas y saldo ganado" },
    { key: "promoOfertas" as const, label: "Promociones y ofertas", desc: "Descuentos en transporte y tours oficiales" },
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
              activeSubTab === "inbox"
                ? "bg-white text-primary shadow-xs"
                : "text-primary-foreground/75 hover:text-white"
            }`}
          >
            Buzón de Avisos
            {unreadNotificationsCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("settings")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === "settings"
                ? "bg-white text-primary shadow-xs"
                : "text-primary-foreground/75 hover:text-white"
            }`}
          >
            Canales y Ajustes
          </button>
        </div>
      </div>

      {/* CONTENIDO 1: BUZÓN DE AVISOS */}
      {activeSubTab === "inbox" && (
        <div className="px-4 py-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {inboxNotifications.length} Notificaci{inboxNotifications.length === 1 ? "ón" : "ones"}
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
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 bg-muted/60 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <Bell className="w-8 h-8 opacity-40" />
              </div>
              <p className="font-bold text-foreground">Buzón al día</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                No tienes notificaciones pendientes. Aquí recibirás confirmaciones de reservas, alertas Safe-Flow y novedades de tu cuenta.
              </p>
            </div>
          ) : (
            inboxNotifications.map((notif) => {
              const IconComp = getNotificationIcon(notif.tipo, notif.icono)
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.leido && markNotificationAsRead(notif.id)}
                  className={`border rounded-2xl p-4 transition-all shadow-xs relative ${getPriorityColors(notif.prioridad, notif.leido)}`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl shrink-0 ${getIconBadgeColor(notif.prioridad)}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-black text-sm text-foreground truncate">{notif.titulo}</h4>
                        {!notif.leido && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{notif.mensaje}</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                        <span>
                          {notif.creado_el 
                            ? new Date(notif.creado_el).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) + " · " + new Date(notif.creado_el).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })
                            : "Reciente"}
                        </span>
                        {notif.enlace_accion && (
                          <a
                            href={notif.enlace_accion}
                            onClick={(e) => {
                              if (notif.enlace_accion && !notif.enlace_accion.startsWith("http") && onNavigate) {
                                e.preventDefault()
                                onNavigate(notif.enlace_accion)
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

      {/* CONTENIDO 2: AJUSTES DE CANALES, TIPOS DE ALERTAS Y HORAS SILENCIOSAS */}
      {activeSubTab === "settings" && (
        <div className="px-4 py-5 space-y-6">
          {/* SECCIÓN 1: CANALES */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">CANALES DE TRANSMISIÓN</h3>
            <div className="space-y-2.5">
              {notificationChannels.map((type) => {
                const Icon = type.icon
                const isEnabled = notifications[type.id as keyof typeof notifications]
                return (
                  <div key={type.id} className="bg-card border border-border rounded-xl p-3.5 flex items-start gap-3.5 shadow-xs">
                    <div className="p-2.5 bg-primary/10 rounded-lg shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
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
          </div>

          {/* SECCIÓN 2: TIPOS DE ALERTAS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">TIPOS DE ALERTAS</h3>
            <div className="space-y-2 bg-card border border-border rounded-xl divide-y divide-border p-1 shadow-xs">
              {alertCategories.map((item) => {
                const checked = alertSettings[item.key]
                return (
                  <div key={item.key} className="flex items-center justify-between p-3">
                    <div className="pr-3">
                      <p className="font-medium text-foreground text-sm">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleAlert(item.key)}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                        checked ? "bg-primary" : "bg-muted border border-border"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          checked ? "translate-x-5.5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SECCIÓN 3: HORAS SILENCIOSAS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">HORAS SILENCIOSAS</h3>
            <div className="bg-card border border-border rounded-xl p-4 space-y-3.5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-lg shrink-0 mt-0.5">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">Pausa nocturna automática</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      No recibirás notificaciones sonoras durante estas horas (las alertas SOS de Safe-Flow siempre tienen prioridad crítica).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAlert("quietHoursEnabled")}
                  className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
                    alertSettings.quietHoursEnabled ? "bg-primary" : "bg-muted border border-border"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      alertSettings.quietHoursEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {alertSettings.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Desde
                    </label>
                    <input
                      type="time"
                      value={alertSettings.quietStart}
                      onChange={(e) => setAlertSettings(prev => ({ ...prev, quietStart: e.target.value }))}
                      className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Hasta
                    </label>
                    <input
                      type="time"
                      value={alertSettings.quietEnd}
                      onChange={(e) => setAlertSettings(prev => ({ ...prev, quietEnd: e.target.value }))}
                      className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
