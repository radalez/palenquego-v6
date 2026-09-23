"use client"

import { useState } from "react"
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
  Ticket,
  QrCode,
  MessageCircle,
  X,
  CheckCircle2,
  Clock,
} from "lucide-react"
import QRCode from "react-qr-code"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppStore, type Booking } from "@/lib/store"
import { cn } from "@/lib/utils"

interface ProfileScreenProps {
  onNavigateToBilling: () => void
  onNavigateToSettings?: (tab: string) => void
}

export function ProfileScreen({ onNavigateToBilling, onNavigateToSettings }: ProfileScreenProps) {
  const { currentUser, logout, bookings, pools, userFavorites, recommendations, payServiceWompi } = useAppStore()
  const [selectedQrBooking, setSelectedQrBooking] = useState<Booking | null>(null)
  const [payingWompiId, setPayingWompiId] = useState<number | null>(null)

  const totalSpent = bookings.reduce((acc, b) => acc + b.totalPrice, 0)
  const poolsJoined = pools.filter((p) => (p.members ?? []).some((m) => m.name === currentUser.name)).length

  // Sort bookings so PENDIENTE appears first
  const sortedBookings = [...bookings].sort((a, b) => {
    if (a.status === "PENDIENTE" && b.status !== "PENDIENTE") return -1
    if (a.status !== "PENDIENTE" && b.status === "PENDIENTE") return 1
    return b.id - a.id
  })

  const handlePayWompi = async (booking: Booking) => {
    setPayingWompiId(booking.id)
    const url = await payServiceWompi(booking.service.id, booking.totalPrice, booking.qrCode)
    setPayingWompiId(null)
    if (url) {
      window.location.href = url
    } else {
      alert("No se pudo iniciar la pasarela Wompi en este momento. Puedes coordinar directamente por WhatsApp con el aliado.")
    }
  }

  const formatWhatsappLink = (booking: Booking) => {
    const phone = booking.service?.socialLinks?.whatsapp || "50370000000"
    const clean = phone.replace(/[^0-9]/g, "")
    const msg = encodeURIComponent(
      `¡Hola! Quisiera coordinar o enviar comprobante de pago para mi reserva #${booking.qrCode} de "${booking.service?.name}" (${booking.date}, ${booking.guests} personas). Total: $${booking.totalPrice}`
    )
    return `https://wa.me/${clean}?text=${msg}`
  }

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
    <div className="flex flex-col min-h-full items-center">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-4 pt-12 pb-8 w-full">
        <div className="max-w-3xl mx-auto w-full">
          <h1 className="text-2xl font-bold text-primary-foreground mb-6">Mi Perfil</h1>

          {/* User Card */}
          <div className="bg-card rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {currentUser.avatar?.startsWith('http') ? (
                  <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-primary">{currentUser.avatar || "U"}</span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">{currentUser.name}</h2>
                <p className="text-sm text-muted-foreground">{currentUser.tipo}</p>
                {currentUser.tipo === "CHOFER" && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className={cn("w-2 h-2 rounded-full", currentUser.kyc_status === 'APPROVED' ? "bg-green-500" : "bg-amber-500")} />
                    <span className={cn("text-xs font-semibold", currentUser.kyc_status === 'APPROVED' ? "text-green-600" : "text-amber-600")}>
                      {currentUser.kyc_status === 'APPROVED' ? 'Verificado' : 'No Verificado'}
                    </span>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" className="bg-transparent">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-4 w-full max-w-3xl mx-auto">
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

      {/* Sección: Mis Reservas y Estancias */}
      <div className="px-4 mt-6 w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-muted-foreground tracking-wide">MIS RESERVAS Y ESTANCIAS</h3>
          <Badge variant="outline" className="text-xs bg-muted text-foreground">
            {bookings.length} {bookings.length === 1 ? "reserva" : "reservas"}
          </Badge>
        </div>

        {sortedBookings.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-foreground">Sin reservas activas</p>
            <p className="text-xs text-muted-foreground mt-1">Explora las experiencias en el Marketplace para realizar tu primera reserva.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedBookings.map((b) => {
              const isPending = b.status === "PENDIENTE"
              return (
                <div
                  key={b.id}
                  className={cn(
                    "bg-card rounded-2xl p-4 border transition-all shadow-sm space-y-3",
                    isPending ? "border-amber-500/40 bg-amber-500/5 ring-1 ring-amber-500/20" : "border-border"
                  )}
                >
                  <div className="flex gap-3">
                    <img
                      src={b.service?.image || "/placeholder.svg"}
                      alt={b.service?.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-foreground text-sm truncate">{b.service?.name || "Servicio Reservado"}</h4>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase font-bold shrink-0 px-2 py-0.5 rounded-full",
                            isPending
                              ? "bg-amber-500/20 text-amber-700 border-amber-500/40"
                              : "bg-emerald-500/20 text-emerald-700 border-emerald-500/40"
                          )}
                        >
                          {isPending ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pendiente de Pago
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Confirmado
                            </span>
                          )}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mt-0.5">{b.date} • {b.time}</p>
                      <p className="text-xs font-semibold text-primary mt-1">
                        Total: ${b.totalPrice} <span className="text-muted-foreground font-normal">({b.guests} {b.guests === 1 ? "persona" : "personas"})</span>
                      </p>
                    </div>
                  </div>

                  {/* Acciones para cada reserva */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
                    {isPending && (
                      <Button
                        size="sm"
                        onClick={() => handlePayWompi(b)}
                        disabled={payingWompiId === b.id}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-9 px-3 rounded-xl flex items-center gap-1.5 shadow-sm"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        {payingWompiId === b.id ? "Abriendo Wompi..." : "Pagar con Wompi"}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedQrBooking(b)}
                      className="text-xs font-medium h-9 px-3 rounded-xl flex items-center gap-1.5 bg-background hover:bg-muted"
                    >
                      <QrCode className="w-3.5 h-3.5 text-primary" />
                      Ver Voucher QR
                    </Button>

                    <a
                      href={formatWhatsappLink(b)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="px-4 mt-6 w-full max-w-3xl mx-auto">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">INFORMACION DE CONTACTO</h3>
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          <div className="flex items-center gap-3 p-4">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-foreground">{currentUser.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-foreground">{currentUser.telefono || "Sin teléfono"}</p>
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
      <div className="px-4 mt-6 w-full max-w-3xl mx-auto">
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
      <div className="px-4 mt-6 pb-24 w-full max-w-3xl mx-auto">
        <Button
          variant="outline"
          className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent"
          onClick={logout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Cerrar Sesion
        </Button>
      </div>

      {/* QR Voucher Modal */}
      {selectedQrBooking && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center relative">
            <button
              onClick={() => setSelectedQrBooking(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <h3 className="text-lg font-bold text-foreground mb-1">Voucher de Reserva</h3>
            <p className="text-xs text-muted-foreground mb-4">{selectedQrBooking.service?.name}</p>

            <div className="bg-white p-4 rounded-2xl border border-border inline-flex items-center justify-center mx-auto mb-3 shadow-xs">
              <QRCode
                value={selectedQrBooking.qrCode || `RES-${selectedQrBooking.id}`}
                size={160}
                level="M"
              />
            </div>

            <p className="text-base font-mono font-bold text-foreground tracking-wide">{selectedQrBooking.qrCode}</p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-4">Muestra este código al llegar al establecimiento</p>

            <div className="bg-muted rounded-xl p-3.5 text-left text-xs space-y-1.5 mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha:</span>
                <span className="font-semibold text-foreground">{selectedQrBooking.date} ({selectedQrBooking.time})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Personas:</span>
                <span className="font-semibold text-foreground">{selectedQrBooking.guests}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/60">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-primary">${selectedQrBooking.totalPrice}</span>
              </div>
            </div>

            <div className="space-y-2">
              {selectedQrBooking.status === "PENDIENTE" && (
                <Button
                  onClick={() => {
                    setSelectedQrBooking(null)
                    handlePayWompi(selectedQrBooking)
                  }}
                  className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl text-sm"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagar con Wompi
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setSelectedQrBooking(null)}
                className="w-full h-11 font-semibold rounded-xl text-sm"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

