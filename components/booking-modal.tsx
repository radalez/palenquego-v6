"use client"

import { useState, useEffect, useRef } from "react"
import { X, MapPin, Star, Users, Calendar, Clock, Plus, Minus, Check, ChevronRight, Phone, MessageCircle, CreditCard, Building2 } from "lucide-react"
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

// Helper to generate dynamic upcoming dates starting from today
const generateUpcomingDates = (count = 7) => {
  const daysOfWeek = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
  const result = []
  const today = new Date()

  for (let i = 0; i < count; i++) {
    const dateObj = new Date(today)
    dateObj.setDate(today.getDate() + i)
    const dayName = i === 0 ? "Hoy" : daysOfWeek[dateObj.getDay()]
    const dateNum = String(dateObj.getDate())
    const monthName = months[dateObj.getMonth()]
    const formatted = `${dateNum} ${monthName}`
    result.push({
      day: dayName,
      date: dateNum,
      month: monthName,
      formatted,
      isToday: i === 0,
    })
  }
  return result
}

const upcomingDates = generateUpcomingDates(7)

const timeSlots = [
  { value: "09:00", label: "09:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "14:00", label: "02:00 PM" },
  { value: "15:00", label: "03:00 PM" },
  { value: "16:00", label: "04:00 PM" },
  { value: "17:00", label: "05:00 PM" },
]

export function BookingModal({ service, onClose }: BookingModalProps) {
  const datePickerRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<BookingStep>("details")
  const [guests, setGuests] = useState(1)

  // Detect whether category allows multi-day range bookings (e.g. Hotelería)
  const isHotelService = Boolean(
    service.categoria?.permite_rango_fechas ||
    service.category?.toLowerCase().includes("hotel") ||
    service.category?.toLowerCase().includes("hospedaje")
  )

  const todayIso = new Date().toISOString().split("T")[0]
  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowIso = tomorrowDate.toISOString().split("T")[0]

  const [checkIn, setCheckIn] = useState(todayIso)
  const [checkOut, setCheckOut] = useState(tomorrowIso)

  const [selectedDate, setSelectedDate] = useState(upcomingDates[0]?.formatted || "")
  const [selectedTime, setSelectedTime] = useState("10:00")
  
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({})
  const [bookingResult, setBookingResult] = useState<{ qrCode: string } | null>(null)
  const [showPoolsModal, setShowPoolsModal] = useState(false)
  const [joinedPool, setJoinedPool] = useState<Pool | null>(null)

  const { addBooking, pools, joinPool, createServiceBooking, payServiceWompi, currentUser, isLoading } = useAppStore()
  const [userPhone, setUserPhone] = useState(currentUser?.telefono || "")
  const [phoneError, setPhoneError] = useState("")
  const [isPayingWompi, setIsPayingWompi] = useState(false)
  const [tiendaInfo, setTiendaInfo] = useState<{ nombre?: string; telefono?: string }>({})

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1
    const start = new Date(checkIn).getTime()
    const end = new Date(checkOut).getTime()
    const diff = Math.round((end - start) / (1000 * 3600 * 24))
    return diff > 0 ? diff : 1
  }

  const nightsCount = calculateNights()

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

  const updateExtraQuantity = (extraName: string, delta: number) => {
    setSelectedExtras((prev) => {
      const currentQty = prev[extraName] || 0
      const newQty = Math.max(0, currentQty + delta)
      return { ...prev, [extraName]: newQty }
    })
  }

  const calculateTotal = () => {
    let basePrice = Number(service.price)
    let total = isHotelService ? (basePrice * nightsCount * Number(guests)) : (basePrice * Number(guests))
    
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
    const defaultDate = upcomingDates[0]?.formatted || "Hoy"
    const effectiveDateStr = isHotelService
      ? `Check-in: ${checkIn} / Check-out: ${checkOut} (${nightsCount} noches)`
      : `${selectedDate || defaultDate} a las ${selectedTime || "10:00"}`

    const msg = encodeURIComponent(
      `¡Hola! Acabo de hacer la reserva #${bookingResult?.qrCode || ""} para "${service.name}" (${effectiveDateStr}, ${guests} personas). Quisiera coordinar los detalles.`
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

    const defaultDate = upcomingDates[0]?.formatted || "Hoy"
    const effectiveDateStr = isHotelService ? `${checkIn} al ${checkOut}` : (selectedDate || defaultDate)
    const timeStr = isHotelService ? `Check-in / Check-out (${nightsCount} noches)` : (selectedTime || "10:00")

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
      date: effectiveDateStr,
      time: timeStr,
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
      date: effectiveDateStr,
      time: timeStr,
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

  const openDatePicker = () => {
    if (datePickerRef.current) {
      try {
        if (typeof datePickerRef.current.showPicker === "function") {
          datePickerRef.current.showPicker()
        } else {
          datePickerRef.current.click()
        }
      } catch (e) {
        datePickerRef.current.click()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-end justify-center">
      <div className="bg-background w-full max-w-md rounded-t-3xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 shadow-2xl pb-6">
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

        {/* Hidden Native Date Input Triggered via showPicker() */}
        <input
          ref={datePickerRef}
          type="date"
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => {
            if (e.target.value) {
              const [year, month, day] = e.target.value.split("-")
              const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
              const monthName = months[parseInt(month, 10) - 1]
              const formatted = `${parseInt(day, 10)} ${monthName}`
              setSelectedDate(formatted)
            }
          }}
          className="sr-only hidden"
        />

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
                <p className="text-lg font-bold text-primary mt-1">
                  ${service.price} {isHotelService ? "/ persona / noche" : "/ persona"}
                </p>

                {/* Stock Badge */}
                <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Stock disponible: <strong>{service.stock_unidades ?? service.spotsLeft ?? 1}</strong> {((service.stock_unidades ?? service.spotsLeft ?? 1) === 1) ? "unidad" : "unidades"}</span>
                </div>
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <Users className="w-4 h-4 inline mr-2 text-primary" />
                  Número de personas
                </label>
                {service.capacityMax && (
                  <span className="text-xs text-muted-foreground">Máx. {service.capacityMax} personas</span>
                )}
              </div>
              <div className="flex items-center gap-4 bg-muted/70 border border-border rounded-xl p-3">
                <button
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                  disabled={guests <= 1}
                >
                  <Minus className="w-5 h-5 text-foreground" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-extrabold text-foreground block">{guests}</span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {guests === 1 ? "persona" : "personas"}
                  </span>
                </div>
                <button
                  onClick={() => setGuests(Math.min(service.capacityMax || 10, guests + 1))}
                  className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40"
                  disabled={guests >= (service.capacityMax || 10)}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Date and Range Selection */}
            {isHotelService ? (
              <div className="space-y-3 bg-muted/50 p-4 rounded-2xl border border-border">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    Estancia (Check-in / Check-out)
                  </label>
                  <Badge variant="secondary" className="text-xs font-extrabold text-primary bg-primary/10 border border-primary/20">
                    {nightsCount} {nightsCount === 1 ? "Noche" : "Noches"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Entrada (Check-in)</label>
                    <input
                      type="date"
                      min={todayIso}
                      value={checkIn}
                      onChange={(e) => {
                        const newIn = e.target.value
                        setCheckIn(newIn)
                        if (new Date(checkOut) <= new Date(newIn)) {
                          const nextDay = new Date(newIn)
                          nextDay.setDate(nextDay.getDate() + 1)
                          setCheckOut(nextDay.toISOString().split("T")[0])
                        }
                      }}
                      className="w-full h-11 px-3 rounded-xl bg-card border border-border text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Salida (Check-out)</label>
                    <input
                      type="date"
                      min={checkIn}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-card border border-border text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                {service.blocked_dates && service.blocked_dates.length > 0 && (
                  <p className="text-[11px] text-amber-600 font-medium pt-1">
                    ⚠️ Este hospedaje cuenta con {service.blocked_dates.length} fecha(s) no disponibles bloqueadas por el hotelero.
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Date Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      Seleccionar fecha
                    </label>

                    {/* Visible Future Date Picker Button in Header */}
                    <div className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-all cursor-pointer shadow-xs group">
                      <Calendar className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-primary">
                        {upcomingDates.some((d) => d.formatted === selectedDate) ? "Elegir otra fecha" : `📅 ${selectedDate}`}
                      </span>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => {
                          if (e.target.value) {
                            const [year, month, day] = e.target.value.split("-")
                            const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
                            const monthName = months[parseInt(month, 10) - 1]
                            const formatted = `${parseInt(day, 10)} ${monthName}`
                            setSelectedDate(formatted)
                          }
                        }}
                        onClick={(e) => {
                          try {
                            if ("showPicker" in e.currentTarget) {
                              e.currentTarget.showPicker()
                            }
                          } catch (err) {}
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-30 block"
                        title="Haz clic para abrir el calendario y elegir cualquier fecha futura"
                      />
                    </div>
                  </div>

                  {/* Quick Date Pills Horizontal Slider */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none items-center">
                    {/* Custom Future Date Pill placed FIRST so it's always immediately visible */}
                    <div className="relative min-w-[76px] h-[72px] flex flex-col items-center justify-center p-2 rounded-xl border-2 border-dashed border-primary/50 bg-primary/10 hover:bg-primary/20 transition-all text-center cursor-pointer group shrink-0">
                      <Calendar className="w-5 h-5 text-primary mb-0.5 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black text-primary leading-tight uppercase">Otra fecha</span>
                      <span className="text-[9px] text-primary/80 font-medium">Calendario</span>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => {
                          if (e.target.value) {
                            const [year, month, day] = e.target.value.split("-")
                            const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
                            const monthName = months[parseInt(month, 10) - 1]
                            const formatted = `${parseInt(day, 10)} ${monthName}`
                            setSelectedDate(formatted)
                          }
                        }}
                        onClick={(e) => {
                          try {
                            if ("showPicker" in e.currentTarget) {
                              e.currentTarget.showPicker()
                            }
                          } catch (err) {}
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-30 block"
                        title="Seleccionar cualquier fecha futura"
                      />
                    </div>

                    {upcomingDates.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(d.formatted)}
                        className={cn(
                          "flex flex-col items-center px-4 py-3 rounded-xl min-w-[72px] border transition-all shadow-sm shrink-0",
                          selectedDate === d.formatted
                            ? "bg-primary text-primary-foreground border-primary font-semibold ring-2 ring-primary/30"
                            : "bg-card text-foreground border-border hover:bg-muted/80",
                        )}
                      >
                        <span className={cn("text-xs font-medium uppercase", selectedDate === d.formatted ? "text-primary-foreground/90" : "text-muted-foreground")}>
                          {d.day}
                        </span>
                        <span className="text-lg font-bold my-0.5">{d.date}</span>
                        <span className={cn("text-xs font-medium", selectedDate === d.formatted ? "text-primary-foreground/90" : "text-muted-foreground")}>
                          {d.month}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    <Clock className="w-4 h-4 inline mr-2 text-primary" />
                    Seleccionar hora
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.value}
                        onClick={() => setSelectedTime(slot.value)}
                        className={cn(
                          "py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all shadow-sm text-center",
                          selectedTime === slot.value
                            ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/30"
                            : "bg-card text-foreground border-border hover:bg-muted/80",
                        )}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Total Preview Summary */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs text-muted-foreground font-medium block">Total a reservar</span>
                <span className="text-2xl font-black text-primary">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
              <div className="text-right text-xs text-muted-foreground font-medium">
                {isHotelService ? (
                  <span>{guests} {guests === 1 ? "persona" : "personas"} × {nightsCount} {nightsCount === 1 ? "noche" : "noches"} × ${service.price}</span>
                ) : (
                  <span>{guests} {guests === 1 ? "persona" : "personas"} × ${service.price}</span>
                )}
              </div>
            </div>

            {/* Continue Button */}
            <Button
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-semibold shadow-md transition-all"
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
                <span className="text-muted-foreground">{isHotelService ? "Estancia" : "Fecha"}</span>
                <span className="text-foreground font-medium">{isHotelService ? `${checkIn} al ${checkOut}` : (selectedDate || "Hoy")}</span>
              </div>

              {isHotelService ? (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Noches</span>
                  <span className="text-foreground font-medium">{nightsCount} {nightsCount === 1 ? "noche" : "noches"}</span>
                </div>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hora</span>
                  <span className="text-foreground font-medium">{selectedTime || "10:00"}</span>
                </div>
              )}

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
