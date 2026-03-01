"use client"

import { useState } from "react"
import { X, MapPin, Star, Users, Calendar, Clock, Plus, Minus, Check, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [bookingResult, setBookingResult] = useState<{ qrCode: string } | null>(null)
  const [showPoolsModal, setShowPoolsModal] = useState(false)
  const [joinedPool, setJoinedPool] = useState<Pool | null>(null)

  const { addBooking, pools, joinPool } = useAppStore()

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

  const toggleExtra = (extraName: string) => {
    setSelectedExtras((prev) => (prev.includes(extraName) ? prev.filter((e) => e !== extraName) : [...prev, extraName]))
  }

  const calculateTotal = () => {
    let total = service.price * guests
    if (service.extras) {
      service.extras.forEach((extra: any) => {
        // Mapeo real: nombre y precio_adicional detectados en consola
        const extraName = extra.nombre || extra.name
        const extraPrice = parseFloat(extra.precio_adicional || extra.price || 0)
        
        if (selectedExtras.includes(extraName)) {
          total += extraPrice * guests
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

  const handleConfirmBooking = () => {
    const booking = addBooking({
      service,
      date: selectedDate || "15 Ene",
      time: selectedTime || "10:00",
      guests: joinedPool ? 1 : guests,
      extras: selectedExtras,
      totalPrice: joinedPool ? Math.round(joinedPool.totalPrice / joinedPool.targetMembers) : calculateTotal(),
      status: "CONFIRMADO",
      poolId: joinedPool?.id,
    })
    setBookingResult({ qrCode: booking.qrCode })
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
                const isSelected = selectedExtras.includes(extraName)
                
                return (
                  <button
                    key={extraName}
                    onClick={() => toggleExtra(extraName)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                      isSelected ? "border-primary bg-primary/5" : "border-border bg-card",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center",
                          isSelected ? "bg-primary" : "border-2 border-muted-foreground",
                        )}
                      >
                        {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                      </div>
                      <span className="font-medium text-foreground">{extraName}</span>
                    </div>
                    <span className="text-primary font-semibold">+${extraPrice}</span>
                  </button>
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
                  Te uniras al grupo de {joinedPool.leader.name} con otros {joinedPool.currentMembers} viajeros.
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

              {selectedExtras.length > 0 && !joinedPool && (
                <div className="pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Extras:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedExtras.map((extra) => (
                      <Badge key={extra} variant="secondary">
                        {extra}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">
                    ${joinedPool ? Math.round(joinedPool.totalPrice / joinedPool.targetMembers) : calculateTotal()}
                  </span>
                  {joinedPool && <p className="text-xs text-green-600">Ahorro grupal aplicado</p>}
                </div>
              </div>
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
                  "flex-1 h-14 rounded-xl font-semibold",
                  joinedPool
                    ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                    : "bg-secondary hover:bg-secondary/90 text-secondary-foreground",
                )}
                onClick={handleConfirmBooking}
              >
                {joinedPool ? "Unirme al Pool" : "Confirmar Reserva"}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && bookingResult && (
          <div className="p-4 space-y-6 text-center">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto",
                joinedPool ? "bg-secondary/20" : "bg-primary/20",
              )}
            >
              <Check className={cn("w-10 h-10", joinedPool ? "text-secondary" : "text-primary")} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {joinedPool ? "Te Uniste al Pool" : "Reserva Confirmada"}
              </h3>
              <p className="text-muted-foreground">
                {joinedPool
                  ? "Ahora eres parte del grupo. El lider coordinara los detalles."
                  : "Tu reserva ha sido procesada exitosamente"}
              </p>
            </div>

            {/* QR Code Placeholder */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="w-40 h-40 bg-foreground mx-auto rounded-lg flex items-center justify-center mb-4">
                <div className="w-32 h-32 bg-background rounded grid grid-cols-5 gap-1 p-2">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn("rounded-sm", Math.random() > 0.5 ? "bg-foreground" : "bg-transparent")}
                    />
                  ))}
                </div>
              </div>
              <p className="text-lg font-mono font-bold text-foreground">{bookingResult.qrCode}</p>
              <p className="text-sm text-muted-foreground mt-1">Muestra este codigo al llegar</p>
            </div>

            <div className="bg-muted rounded-xl p-4 text-left">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Servicio</span>
                <span className="text-foreground font-medium">{service.name}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Fecha</span>
                <span className="text-foreground font-medium">{selectedDate || "15 Ene"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total pagado</span>
                <span className="text-primary font-bold">
                  ${joinedPool ? Math.round(joinedPool.totalPrice / joinedPool.targetMembers) : calculateTotal()}
                </span>
              </div>
            </div>

            <Button
              className={cn(
                "w-full h-14 rounded-xl text-lg font-semibold",
                joinedPool
                  ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground",
              )}
              onClick={onClose}
            >
              Listo
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
