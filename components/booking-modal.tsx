"use client"

import { useState, useEffect } from "react"
import { X, MapPin, Star, Users, Calendar, Clock, Plus, Minus, Check, ChevronRight, Phone, MessageCircle, CreditCard } from "lucide-react"
import QRCode from "react-qr-code"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAppStore, type Service, type Pool } from "@/lib/store"
import { PoolsForServiceModal } from "./pools-for-service-modal"

interface BookingModalProps {
  service: Service
  onClose: () => void
}

type BookingStep = "details" | "extras" | "confirm" | "success"

export function BookingModal({ service, onClose }: BookingModalProps) {
  const [step, setStep] = useState<BookingStep>("details")
  const [guests, setGuests] = useState(1)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({})
  const [bookingResult, setBookingResult] = useState<{ qrCode: string } | null>(null)
  const [showPoolsModal, setShowPoolsModal] = useState(false)
  const [joinedPool, setJoinedPool] = useState<Pool | null>(null)

  const { addBooking, pools, joinPool, createServiceBooking, payServiceWompi, currentUser, isLoading } = useAppStore()
  const [userPhone, setUserPhone] = useState(currentUser?.telefono || "")
  const [phoneError, setPhoneError] = useState("")
  const [isPayingWompi, setIsPayingWompi] = useState(false)
  const [tiendaInfo, setTiendaInfo] = useState<{ nombre?: string; telefono?: string }>({})

  useEffect(() => {
    if (currentUser?.telefono && !userPhone) {
      setUserPhone(currentUser.telefono)
    }
  }, [currentUser?.telefono])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      // Solo aquí, cuando el pago es positivo, mostramos el QR
      setStep("success");
      setBookingResult({ qrCode: `PGO-${Math.random().toString(36).toUpperCase().substring(2, 10)}` });
    }
  }, []);

  
  // Check for available pools for this service
  const availablePools = pools.filter((p) => p.serviceId === service.id && p.status === "ABIERTO")

  const dates = [
    { day: "Hoy", date: "15", month: "Ene" },
    { day: "Mar", date: "16", month: "Ene" },
    { day: "Mie", date: "17", month: "Ene" },
    { day: "Jue", date: "18", month: "Ene" },
    { day: "Vie", date: "19", month: "Ene" },
  ]

  const times = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]

  const updateExtraQuantity = (extraName: string, delta: number) => {
    setSelectedExtras((prev) => {
      const currentQty = prev[extraName] || 0
      const newQty = Math.max(0, currentQty + delta)
      return { ...prev, [extraName]: newQty }
    })
  }

  const calculateTotal = () => {
    // Forzamos Number() para evitar que "90" + "30" sea "9030"
    let total = Number(service.price) * Number(guests)
    
    if (service.extras) {
      service.extras.forEach((extra: any) => {
        const extraName = extra.nombre || extra.name
        const extraPrice = Number(extra.precio_adicional || extra.price || 0)
        const quantity = Number(selectedExtras[extraName] || 0)
        
        if (quantity > 0) {
          total += (extraPrice * quantity)
        }
      })
    }
    return total
  }

  const handleJoinPool = (pool: Pool) => {
    joinPool(pool.id)
    setJoinedPool(pool)
    setShowPoolsModal(false)
    // Auto-fill booking details
    setGuests(1)
    setStep("confirm")
  }

  const formatWhatsappLink = (phone?: string) => {
    if (!phone) return ""
    const clean = phone.replace(/[^0-9]/g, "")
    const msg = encodeURIComponent(
      `¡Hola! Acabo de hacer la reserva #${bookingResult?.qrCode || ""} para "${service.name}" el ${selectedDate || "15 Ene"} a las ${selectedTime || "10:00"} (${guests} personas). Quisiera coordinar los detalles.`
    )
    return `https://wa.me/${clean}?text=${msg}`
  }

  const handlePayWompi = async () => {
    if (!bookingResult?.qrCode) return
    setIsPayingWompi(true)
    const total = joinedPool 
      ? Math.round((Number(joinedPool.totalPrice) ?? 0) / (Number(joinedPool.targetMembers) ?? 1)) 
      : calculateTotal()
    
    const url = await payServiceWompi(service.id, total, bookingResult.qrCode)
    setIsPayingWompi(false)
    if (url) {
      window.location.href = url
    } else {
      alert("No se pudo iniciar la pasarela Wompi en este momento. Puedes coordinar directamente por WhatsApp con el comercio.")
    }
  }

  const handleConfirmBooking = async () => {
    const phoneToUse = userPhone.trim() || currentUser?.telefono || ""
    if (!phoneToUse) {
      setPhoneError("Por favor ingresa tu número de WhatsApp para confirmar.")
      return
    }
    setPhoneError("")

    // 1. Cálculo del total real
    const total = joinedPool 
      ? Math.round((Number(joinedPool.totalPrice) ?? 0) / (Number(joinedPool.targetMembers) ?? 1)) 
      : calculateTotal()

    // 2. Generar el resumen de extras
    const extrasSummary = Object.entries(selectedExtras)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([name, qty]) => `${qty}x ${name}`)

    // 3. Disparar al backend (y registrar inmediatamente en el CRM Invictus)
    const res = await createServiceBooking(service.id, {
      date: selectedDate || "15 Ene",
      time: selectedTime || "10:00",
      guests: guests,
      extras: extrasSummary,
      amount: total,
      telefono: phoneToUse,
    })

    const reservaId = res.reserva_id || `PGO-${Math.random().toString(36).toUpperCase().substring(2, 10)}`
    setBookingResult({ qrCode: reservaId })
    setTiendaInfo({
      nombre: res.tienda_nombre || service.businessName,
      telefono: res.tienda_telefono || service.socialLinks?.whatsapp
    })

    // 4. Registro local
    addBooking({
      service,
      date: selectedDate || "15 Ene",
      time: selectedTime || "10:00",
      guests: guests,
      extras: extrasSummary,
      totalPrice: total,
      status: "PENDIENTE",
      poolId: joinedPool?.id,
    })

    setStep("success")
  }

  if (showPoolsModal) {
    return (
      <PoolsForServiceModal service={service} onClose={() => setShowPoolsModal(false)} onJoinPool={handleJoinPool} />
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
      <div className="bg-background w-full max-w-md rounded-t-3xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 px-4 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {step === "details" && "Reservar"}
            {step === "extras" && "Extras"}
            {step === "confirm" && (joinedPool ? "Confirmar Pool" : "Confirmar")}
            {step === "success" && (joinedPool ? "Unido al Pool" : "Reserva Exitosa")}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Step: Details */}
        {step === "details" && (
          <div className="p-4 space-y-6">
            {/* Service Summary */}
            <div className="flex gap-4">
              <img
                src={service.image || "/placeholder.svg"}
                alt={service.name}
                className="w-24 h-24 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{service.name}</h3>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <MapPin className="w-3 h-3" />
                  <span>{service.location}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-medium">{service.rating}</span>
                </div>
                <p className="text-lg font-bold text-primary mt-1">${service.price}/persona</p>
              </div>
            </div>

            {availablePools.length > 0 && (
              <div className="bg-primary/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="font-medium text-primary">Pools disponibles</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Hay {availablePools.length} grupo(s) abiertos para este servicio. Puedes unirte para ahorrar.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-primary text-primary bg-transparent hover:bg-primary/5"
                  onClick={() => setShowPoolsModal(true)}
                >
                  Ver Pools disponibles
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Guests */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Users className="w-4 h-4 inline mr-2" />
                Numero de personas
              </label>
              <div className="flex items-center gap-4 bg-muted rounded-xl p-3">
                <button
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
                  disabled={guests <= 1}
                >
                  <Minus className="w-5 h-5 text-foreground" />
                </button>
                <span className="text-2xl font-bold text-foreground flex-1 text-center">{guests}</span>
                <button
                  onClick={() => setGuests(Math.min(service.capacityMax || 10, guests + 1))}
                  className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
                  disabled={guests >= (service.capacityMax || 10)}
                >
                  <Plus className="w-5 h-5 text-foreground" />
                </button>
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Calendar className="w-4 h-4 inline mr-2" />
                Seleccionar fecha
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dates.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(`${d.date} ${d.month}`)}
                    className={cn(
                      "flex flex-col items-center px-4 py-3 rounded-xl min-w-[70px] transition-all",
                      selectedDate === `${d.date} ${d.month}`
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <span className="text-xs">{d.day}</span>
                    <span className="text-lg font-bold">{d.date}</span>
                    <span className="text-xs">{d.month}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Clock className="w-4 h-4 inline mr-2" />
                Seleccionar hora
              </label>
              <div className="grid grid-cols-3 gap-2">
                {times.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      "py-3 rounded-xl text-sm font-medium transition-all",
                      selectedTime === time ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Continue Button */}
            <Button
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-semibold"
              disabled={!selectedDate || !selectedTime}
              onClick={() => setStep(service.extras?.length ? "extras" : "confirm")}
            >
              Continuar
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step: Extras */}
        {step === "extras" && (
          <div className="p-4 space-y-6">
            <p className="text-muted-foreground">Mejora tu experiencia con estos extras opcionales</p>

            <div className="space-y-3">
              {service.extras?.map((extra: any) => {
                const extraName = extra.nombre || extra.name
                const extraPrice = parseFloat(extra.precio_adicional || extra.price || 0)
                const quantity = selectedExtras[extraName] || 0
                
                return (
                  <div
                    key={extraName}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all shadow-sm",
                      quantity > 0 ? "border-primary bg-primary/5" : "border-border bg-card",
                    )}
                  >
                    <div className="flex-1 text-left">
                      <span className="block font-bold text-foreground">{extraName}</span>
                      <span className="text-primary font-semibold text-sm">+${extraPrice} /u</span>
                    </div>

                    <div className="flex items-center gap-3 bg-muted rounded-lg p-1 ml-4 border border-border">
                      <button
                        onClick={() => updateExtraQuantity(extraName, -1)}
                        className="w-8 h-8 rounded-md bg-card flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
                        disabled={quantity === 0}
                      >
                        <Minus className="w-4 h-4 text-foreground" />
                      </button>
                      <span className="w-6 text-center font-bold text-foreground text-sm">{quantity}</span>
                      <button
                        onClick={() => updateExtraQuantity(extraName, 1)}
                        className="w-8 h-8 rounded-md bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4 text-primary-foreground" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-xl bg-transparent"
                onClick={() => setStep("details")}
              >
                Atras
              </Button>
              <Button
                className="flex-1 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                onClick={() => setStep("confirm")}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && (
          <div className="p-4 space-y-6">
            {joinedPool && (
              <div className="bg-secondary/10 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-secondary" />
                  <span className="font-medium text-secondary">Uniendote a Pool</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Te uniras al grupo de {joinedPool.leader?.name || "un líder"} con otros {joinedPool.currentMembers ?? 0} viajeros.
                </p>
              </div>
            )}

            {/* Summary Card */}
            <div className="bg-muted rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-foreground">Resumen de {joinedPool ? "Pool" : "reserva"}</h3>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Servicio</span>
                <span className="text-foreground font-medium">{service.name}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fecha</span>
                <span className="text-foreground font-medium">{selectedDate || "15 Ene"}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hora</span>
                <span className="text-foreground font-medium">{selectedTime || "10:00"}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Personas</span>
                <span className="text-foreground font-medium">{joinedPool ? 1 : guests}</span>
              </div>

              {Object.values(selectedExtras).some((q: any) => q > 0) && !joinedPool && (
                <div className="pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground font-medium">Extras seleccionados:</span>
                  <div className="flex flex-col gap-2 mt-2">
                    {Object.entries(selectedExtras).map(([name, qty]) => (qty as number) > 0 && (
                      <div key={name} className="flex justify-between items-center text-sm bg-background/50 p-2 rounded-lg">
                        <span className="font-semibold text-foreground">{qty}x {name}</span>
                        <span className="text-primary font-bold">
                          {/* FIX QUIRÚRGICO: Forzamos 'as any' para que el punto rojo desaparezca */}
                          ${(parseFloat((service.extras?.find((e: any) => (e.nombre || e.name) === name) as any)?.precio_adicional || "0") * (qty as number)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">
                    ${joinedPool ? Math.round((joinedPool.totalPrice ?? 0) / (joinedPool.targetMembers ?? 1)) : calculateTotal()}
                  </span>
                  {joinedPool && <p className="text-xs text-green-600">Ahorro grupal aplicado</p>}
                </div>
              </div>
            </div>

            {/* Phone/WhatsApp input to ensure contactability & CRM sync */}
            <div className="bg-muted/70 rounded-xl p-3.5 border border-border space-y-1.5 text-left">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" />
                WhatsApp / Celular para coordinar tu reserva
              </label>
              <Input
                type="tel"
                placeholder="Ej: +503 7000-0000"
                value={userPhone}
                onChange={(e) => {
                  setUserPhone(e.target.value)
                  if (phoneError) setPhoneError("")
                }}
                className="h-11 rounded-lg bg-background border-border text-sm"
              />
              {phoneError ? (
                <p className="text-xs text-destructive font-medium">{phoneError}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  El comercio aliado y el equipo comercial te contactarán por este medio.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-xl bg-transparent"
                onClick={() => {
                  if (joinedPool) {
                    setJoinedPool(null)
                    setStep("details")
                  } else {
                    setStep(service.extras?.length ? "extras" : "details")
                  }
                }}
              >
                Atras
              </Button>
              <Button
                className={cn(
                  "flex-1 h-14 rounded-xl font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground",
                )}
                onClick={handleConfirmBooking}
                disabled={isLoading}
              >
                {isLoading ? "Procesando reserva..." : joinedPool ? "Unirme al Pool" : "Confirmar Reserva"}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && bookingResult && (
          <div className="p-4 space-y-5 text-center">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto",
                joinedPool ? "bg-secondary/20" : "bg-primary/20",
              )}
            >
              <Check className={cn("w-10 h-10", joinedPool ? "text-secondary" : "text-primary")} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">
                {joinedPool ? "¡Te Uniste al Pool!" : "¡Reserva Solicitada con Éxito!"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {joinedPool
                  ? "Ahora eres parte del grupo. El líder coordinará los detalles."
                  : "Tu solicitud ha sido enviada al comercio aliado. Te contactarán a la brevedad por WhatsApp."}
              </p>
            </div>

            {/* QR Code Real y Escaneable */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="bg-white p-3.5 rounded-xl border border-border inline-flex items-center justify-center mx-auto mb-3 shadow-sm">
                <QRCode
                  value={bookingResult.qrCode || `RES-${service.id}`}
                  size={150}
                  level="M"
                />
              </div>
              <p className="text-base font-mono font-bold text-foreground tracking-wide">{bookingResult.qrCode}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Voucher de Reserva Oficial</p>
            </div>

            <div className="bg-muted rounded-xl p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Servicio</span>
                <span className="text-foreground font-medium">{service.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fecha y Hora</span>
                <span className="text-foreground font-medium">{selectedDate || "15 Ene"} - {selectedTime || "10:00"}</span>
              </div>
              {tiendaInfo.nombre && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Aliado / Tienda</span>
                  <span className="text-foreground font-medium">{tiendaInfo.nombre}</span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-1 border-t border-border">
                <span className="text-muted-foreground font-medium">Monto estimado</span>
                <span className="text-primary font-bold">
                  ${joinedPool ? Math.round((joinedPool.totalPrice ?? 0) / (joinedPool.targetMembers ?? 1)) : calculateTotal()}
                </span>
              </div>
            </div>

            {/* Opciones de pago o contacto */}
            <div className="space-y-2.5 pt-1">
              {(tiendaInfo.telefono || service.socialLinks?.whatsapp) && (
                <a
                  href={formatWhatsappLink(tiendaInfo.telefono || service.socialLinks?.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm transition-all text-sm"
                >
                  <MessageCircle className="w-5 h-5" />
                  Escribir al WhatsApp del Aliado
                </a>
              )}

              <Button
                onClick={handlePayWompi}
                disabled={isPayingWompi}
                variant="outline"
                className="w-full h-12 rounded-xl font-semibold border-primary text-primary hover:bg-primary/5 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {isPayingWompi ? "Generando pasarela Wompi..." : "Pagar en línea con Wompi"}
              </Button>

              <Button
                className="w-full h-12 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={onClose}
              >
                Listo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
