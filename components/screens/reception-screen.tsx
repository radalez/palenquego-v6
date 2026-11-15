"use client"

import { useState, useEffect, useRef } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"
import QRCode from "react-qr-code"
import {
  QrCode,
  Camera,
  Keyboard,
  CheckCircle2,
  Clock,
  CreditCard,
  Banknote,
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  Search,
  RefreshCw,
  Calendar,
  Store as StoreIcon,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { HeaderWithMenu } from "@/components/header-with-menu"
import { useAppStore, API_BASE } from "@/lib/store"
import { cn } from "@/lib/utils"

interface ReceptionScreenProps {
  onNavigate?: (tab: string) => void
}

interface ReceptionBooking {
  id: number
  reserva_id: string
  cliente_nombre: string
  cliente_email: string
  cliente_telefono: string
  servicio_id: number
  servicio_nombre: string
  tienda_id: number
  tienda_nombre: string
  fecha_reserva: string
  hora_reserva: string
  invitados: number
  monto_total: number
  estado: string
  estado_pago: string
  metodo_pago_confirmado: string
  validado_por_nombre: string | null
  validado_el: string | null
  notas: string
  already_redeemed?: boolean
  can_confirm_payment?: boolean
  redeemed_now?: boolean
}

interface StaffMember {
  id: number
  tienda_id: number
  tienda_nombre: string
  usuario_id: number
  nombre: string
  email: string
  telefono: string
  rol: string
  puede_confirmar_pago: boolean
  activo: boolean
}

export function ReceptionScreen({ onNavigate }: ReceptionScreenProps) {
  const { currentUser, accessToken, fetchCurrentUser } = useAppStore()
  const [subTab, setSubTab] = useState<"SCANNER" | "BOOKINGS" | "TEAM">("SCANNER")

  // Scanner / Maquinita state
  const [qrInput, setQrInput] = useState("")
  const [showCamera, setShowCamera] = useState(false)
  const [scanLoading, setScanLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scannedBooking, setScannedBooking] = useState<ReceptionBooking | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [wompiUrl, setWompiUrl] = useState<string | null>(null)
  const [wompiLoading, setWompiLoading] = useState(false)
  const [confirmPhysicalMethod, setConfirmPhysicalMethod] = useState<"POS / TARJETA" | "EFECTIVO" | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Bookings list state
  const [bookings, setBookings] = useState<ReceptionBooking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingFilter, setBookingFilter] = useState<"ALL" | "PENDING" | "PAID" | "REDEEMED">("ALL")
  const [bookingSearch, setBookingSearch] = useState("")

  // Team / Staff management state
  const [ownedStores, setOwnedStores] = useState<{ id: number; nombre_comercial: string }[]>([])
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [newStaffIdentifier, setNewStaffIdentifier] = useState("")
  const [selectedStoreId, setSelectedStoreId] = useState<number | "">("")
  const [canConfirmPaymentPerm, setCanConfirmPaymentPerm] = useState(true)
  const [staffError, setStaffError] = useState<string | null>(null)
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null)

  const getToken = () => {
    if (accessToken) return accessToken
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("app-storage")
        if (raw) return JSON.parse(raw)?.state?.accessToken || ""
      } catch {
        return ""
      }
    }
    return ""
  }

  const receptionStores = currentUser?.reception_stores || []
  const isOwnerOfAnyStore =
    Boolean(currentUser?.es_aliado) || receptionStores.some((st) => st.is_owner)

  useEffect(() => {
    fetchCurrentUser()
    loadReceptionBookings()
    if (isOwnerOfAnyStore) {
      loadStaff()
    }
  }, [])

  useEffect(() => {
    if (subTab === "SCANNER" && !showCamera && !scannedBooking) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [subTab, showCamera, scannedBooking])

  const loadReceptionBookings = async () => {
    const token = getToken()
    if (!token) return
    setBookingsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/catalog/reception-bookings/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setBookings(Array.isArray(data) ? data : [])
      }
    } catch {
      // ignore
    } finally {
      setBookingsLoading(false)
    }
  }

  const loadStaff = async () => {
    const token = getToken()
    if (!token) return
    setStaffLoading(true)
    try {
      const res = await fetch(`${API_BASE}/stores/my-staff/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const stores = Array.isArray(data.stores) ? data.stores : []
        setOwnedStores(stores)
        if (stores.length > 0 && !selectedStoreId) {
          setSelectedStoreId(stores[0].id)
        }
        setStaffList(Array.isArray(data.staff) ? data.staff : [])
      }
    } catch {
      // ignore
    } finally {
      setStaffLoading(false)
    }
  }

  const lookupQrCode = async (code: string) => {
    const clean = code.trim()
    if (!clean) return
    const token = getToken()
    if (!token) return

    setScanLoading(true)
    setScanError(null)
    setSuccessMessage(null)
    setWompiUrl(null)
    setConfirmPhysicalMethod(null)

    try {
      const res = await fetch(`${API_BASE}/catalog/validate-qr/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qr_code: clean, action: "lookup" }),
      })
      const data = await res.json()
      if (!res.ok) {
        setScannedBooking(null)
        setScanError(data.error || "No se pudo validar este código QR.")
      } else {
        setScannedBooking(data)
        setShowCamera(false)
        setQrInput("")
      }
    } catch {
      setScanError("Error de conexión al validar el código QR.")
    } finally {
      setScanLoading(false)
    }
  }

  const executeQrAction = async (
    action: "redeem" | "pay_and_redeem",
    paymentMethod?: "POS / TARJETA" | "EFECTIVO",
  ) => {
    if (!scannedBooking) return
    const token = getToken()
    if (!token) return

    setActionLoading(true)
    setScanError(null)
    setSuccessMessage(null)

    try {
      const res = await fetch(`${API_BASE}/catalog/validate-qr/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          qr_code: scannedBooking.reserva_id,
          action,
          payment_method: paymentMethod || "POS / TARJETA",
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setScanError(data.error || "No se pudo completar la validación.")
        if (data.reserva_id) {
          setScannedBooking(data)
        }
      } else {
        setScannedBooking(data)
        setSuccessMessage(
          action === "pay_and_redeem"
            ? `Pago (${paymentMethod}) confirmado y Voucher QR canjeado correctamente.`
            : "Ingreso validado y Voucher QR canjeado correctamente.",
        )
        loadReceptionBookings()
      }
    } catch {
      setScanError("Error de red al confirmar la operación.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStaffIdentifier.trim()) return
    const token = getToken()
    if (!token) return

    setStaffError(null)
    setStaffSuccess(null)
    try {
      const res = await fetch(`${API_BASE}/stores/my-staff/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          identifier: newStaffIdentifier.trim(),
          tienda_id: selectedStoreId || undefined,
          puede_confirmar_pago: canConfirmPaymentPerm,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStaffError(data.error || "No se pudo agregar al miembro de recepción.")
      } else {
        setStaffSuccess(`${data.nombre} fue habilitado en Recepción para ${data.tienda_nombre}.`)
        setNewStaffIdentifier("")
        loadStaff()
      }
    } catch {
      setStaffError("Error de conexión al agregar personal.")
    }
  }

  const handleToggleStaff = async (member: StaffMember, field: "activo" | "puede_confirmar_pago") => {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/stores/my-staff/${member.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: !member[field] }),
      })
      if (res.ok) {
        loadStaff()
      }
    } catch {
      // ignore
    }
  }

  const handleDeleteStaff = async (memberId: number) => {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/stores/my-staff/${memberId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        loadStaff()
      }
    } catch {
      // ignore
    }
  }

  const generateWompiLink = async () => {
    if (!scannedBooking) return
    const token = getToken()
    if (!token) return

    setWompiLoading(true)
    setScanError(null)
    try {
      const res = await fetch(`${API_BASE}/catalog/reception-wompi-link/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          qr_code: scannedBooking.reserva_id,
          redirect_url:
            typeof window !== "undefined"
              ? `${window.location.origin}/?payment=success`
              : "https://palenquegov6.netlify.app/?payment=success",
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.payment_url) {
        setScanError(data.error || "No se pudo generar el enlace de Wompi.")
      } else {
        setWompiUrl(data.payment_url)
      }
    } catch {
      setScanError("Error de conexión al generar enlace de Wompi.")
    } finally {
      setWompiLoading(false)
    }
  }

  const resetScanner = () => {
    setScannedBooking(null)
    setScanError(null)
    setSuccessMessage(null)
    setWompiUrl(null)
    setConfirmPhysicalMethod(null)
    setQrInput("")
    setTimeout(() => inputRef.current?.focus(), 80)
  }

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === "PENDING" && b.estado_pago === "PAGADO") return false
    if (bookingFilter === "PAID" && (b.estado_pago !== "PAGADO" || b.estado === "FINALIZADA")) return false
    if (bookingFilter === "REDEEMED" && b.estado !== "FINALIZADA") return false
    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase()
      return (
        b.reserva_id.toLowerCase().includes(q) ||
        b.cliente_nombre.toLowerCase().includes(q) ||
        b.servicio_nombre.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="min-h-screen bg-[#fafaf8] dark:bg-background pb-28">
      <HeaderWithMenu
        title="Recepción"
        subtitle="Validación de Voucher QR y cobro en puerta"
        onNavigate={onNavigate}
      />

      {/* Sub-navigation Pill Container */}
      <div className="px-4 pt-3 pb-2 bg-card/60 border-b border-border/60">
        <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-1.5 flex items-center gap-1 shadow-2xs max-w-3xl mx-auto w-full">
          <button
            type="button"
            onClick={() => setSubTab("SCANNER")}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              subTab === "SCANNER"
                ? "bg-[#105238] text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
            )}
          >
            <QrCode className="w-4 h-4 shrink-0" />
            <span>Validar QR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubTab("BOOKINGS")
              loadReceptionBookings()
            }}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              subTab === "BOOKINGS"
                ? "bg-[#105238] text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
            )}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Reservas ({bookings.length})</span>
          </button>

          {isOwnerOfAnyStore && (
            <button
              type="button"
              onClick={() => {
                setSubTab("TEAM")
                loadStaff()
              }}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                subTab === "TEAM"
                  ? "bg-[#105238] text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
              )}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Equipo</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-5 max-w-3xl mx-auto w-full space-y-5">
        {/* Authorized Stores Banner */}
        {receptionStores.length > 0 && (
          <div className="bg-[#eaf0e2] dark:bg-[#105238]/20 border border-[#aeb6a1]/60 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#105238] dark:text-[#8ee01a]">
              <StoreIcon className="w-4 h-4 shrink-0" />
              <span>
                Comercios habilitados:{" "}
                {receptionStores.map((s) => s.nombre_comercial).join(" · ")}
              </span>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#105238] text-[#8ee01a]">
              Modo Recepción Activo
            </span>
          </div>
        )}

        {/* TAB 1: SCANNER & MAQUINITA */}
        {subTab === "SCANNER" && (
          <div className="space-y-4">
            {/* Maquinita / USB Scanner & Manual Code Card */}
            <div className="bg-card border border-border rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-foreground text-base flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-[#105238]" />
                    <span>Lector QR o Código de Reserva</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Usa un lector de código QR (USB / Bluetooth), escribe el código o usa la cámara.
                  </p>
                </div>
                <Button
                  type="button"
                  variant={showCamera ? "outline" : "default"}
                  size="sm"
                  onClick={() => setShowCamera((prev) => !prev)}
                  className={cn(
                    "rounded-xl font-bold text-xs gap-1.5 shrink-0 cursor-pointer",
                    !showCamera && "bg-[#105238] hover:bg-[#0c3e2b] text-white",
                  )}
                >
                  {showCamera ? <X className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                  <span>{showCamera ? "Cerrar Cámara" : "Usar Cámara"}</span>
                </Button>
              </div>

              {/* Hardware Scanner Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  lookupQrCode(qrInput)
                }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="Escanea con lector QR o escribe el código (ej. RES-1234)"
                  className="flex-1 h-12 px-4 rounded-2xl border border-border bg-background text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#105238]"
                />
                <Button
                  type="submit"
                  disabled={scanLoading || !qrInput.trim()}
                  className="h-12 px-5 rounded-2xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold text-sm cursor-pointer shrink-0"
                >
                  {scanLoading ? "Buscando..." : "Validar"}
                </Button>
              </form>

              {/* Live Camera Scanner */}
              {showCamera && (
                <div className="rounded-2xl overflow-hidden border-2 border-[#105238] bg-black max-w-sm mx-auto">
                  <Scanner
                    onScan={(detected) => {
                      if (detected && detected.length > 0) {
                        const rawVal = detected[0].rawValue
                        if (rawVal) {
                          lookupQrCode(rawVal)
                        }
                      }
                    }}
                    onError={(err) => console.error("QR Camera error:", err)}
                    constraints={{ facingMode: "environment" }}
                  />
                </div>
              )}
            </div>

            {/* Error Alert */}
            {scanError && (
              <div className="bg-[#eaf0e2] border border-[#105238]/40 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#105238] shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-foreground font-medium">{scanError}</div>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="bg-[#105238] text-white rounded-2xl p-4 flex items-center gap-3 shadow-md">
                <CheckCircle2 className="w-6 h-6 text-[#8ee01a] shrink-0" />
                <p className="text-sm font-bold">{successMessage}</p>
              </div>
            )}

            {/* Scanned Booking Detail Card */}
            {scannedBooking && (
              <div className="bg-card border-2 border-[#105238]/30 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-border">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-[#105238] bg-[#eaf0e2] px-2.5 py-0.5 rounded-full">
                      {scannedBooking.reserva_id}
                    </span>
                    <h3 className="text-lg font-extrabold text-foreground mt-1.5">
                      {scannedBooking.servicio_nombre}
                    </h3>
                    <p className="text-xs text-muted-foreground">{scannedBooking.tienda_nombre}</p>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col items-end gap-1">
                    {scannedBooking.estado === "FINALIZADA" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#105238] text-[#8ee01a] text-xs font-black">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        YA CANJEADO
                      </span>
                    ) : scannedBooking.estado_pago === "PAGADO" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf0e2] text-[#105238] text-xs font-black border border-[#8ee01a]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        PAGADO · LISTO PARA INGRESO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf0e2] text-[#105238] text-xs font-black border border-[#aeb6a1]">
                        <Clock className="w-3.5 h-3.5" />
                        PENDIENTE DE PAGO
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-muted/40 rounded-xl p-3">
                    <p className="text-muted-foreground font-semibold">Cliente</p>
                    <p className="font-bold text-foreground mt-0.5 truncate">{scannedBooking.cliente_nombre}</p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3">
                    <p className="text-muted-foreground font-semibold">Fecha y Hora</p>
                    <p className="font-bold text-foreground mt-0.5">
                      {scannedBooking.fecha_reserva} · {scannedBooking.hora_reserva}
                    </p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3">
                    <p className="text-muted-foreground font-semibold">Cupos</p>
                    <p className="font-bold text-foreground mt-0.5">
                      {scannedBooking.invitados} {scannedBooking.invitados === 1 ? "persona" : "personas"}
                    </p>
                  </div>
                  <div className="bg-[#eaf0e2] rounded-xl p-3">
                    <p className="text-[#105238]/80 font-semibold">Total</p>
                    <p className="font-black text-[#105238] text-base mt-0.5">
                      ${scannedBooking.monto_total.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Already Redeemed Audit */}
                {scannedBooking.estado === "FINALIZADA" && (
                  <div className="bg-[#eaf0e2]/70 border border-[#aeb6a1]/60 rounded-2xl p-3.5 text-xs text-[#105238] space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Registro de Validación
                    </p>
                    <p>
                      Validado por: <strong>{scannedBooking.validado_por_nombre || "Recepción"}</strong>
                      {scannedBooking.validado_el
                        ? ` · ${new Date(scannedBooking.validado_el).toLocaleString()}`
                        : ""}
                    </p>
                    {scannedBooking.metodo_pago_confirmado && (
                      <p>
                        Método de pago: <strong>{scannedBooking.metodo_pago_confirmado}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {scannedBooking.estado !== "FINALIZADA" && (
                  <div className="space-y-2.5 pt-2">
                    {scannedBooking.estado_pago !== "PAGADO" ? (
                      scannedBooking.can_confirm_payment !== false ? (
                        <div className="space-y-3">
                          <div className="bg-[#eaf0e2]/70 border border-[#aeb6a1]/60 rounded-2xl p-3.5 space-y-2.5">
                            <p className="text-xs font-bold text-[#105238]">
                              Cobro real en puerta con tarjeta (Wompi):
                            </p>
                            {!wompiUrl ? (
                              <Button
                                type="button"
                                disabled={wompiLoading || actionLoading}
                                onClick={generateWompiLink}
                                className="w-full h-12 rounded-2xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold text-xs sm:text-sm gap-2 cursor-pointer"
                              >
                                <QrCode className="w-4 h-4 text-[#8ee01a]" />
                                <span>
                                  {wompiLoading
                                    ? "Generando enlace Wompi..."
                                    : `Generar Link / QR de Pago Wompi ($${scannedBooking.monto_total.toFixed(2)})`}
                                </span>
                              </Button>
                            ) : (
                              <div className="bg-white dark:bg-card border border-[#105238]/30 rounded-2xl p-4 flex flex-col items-center text-center gap-3">
                                <p className="text-xs font-bold text-foreground">
                                  Pídele al cliente escanear este QR con su celular para pagar en Wompi:
                                </p>
                                <div className="p-3 bg-white rounded-2xl border border-border shadow-2xs">
                                  <QRCode value={wompiUrl} size={168} />
                                </div>
                                <div className="flex flex-wrap gap-2 w-full">
                                  <a
                                    href={wompiUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 h-10 rounded-xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold text-xs flex items-center justify-center gap-1.5 px-3"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-[#8ee01a]" />
                                    <span>Abrir Pasarela Wompi</span>
                                  </a>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={scanLoading}
                                    onClick={() => lookupQrCode(scannedBooking.reserva_id)}
                                    className="flex-1 h-10 rounded-xl border-[#105238] text-[#105238] font-bold text-xs gap-1.5 cursor-pointer"
                                  >
                                    <RefreshCw className={cn("w-3.5 h-3.5", scanLoading && "animate-spin")} />
                                    <span>Verificar si ya pagó</span>
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2 pt-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                              O si ya recibiste el pago físico en tu comercio:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <Button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => setConfirmPhysicalMethod("POS / TARJETA")}
                                variant="outline"
                                className="h-11 rounded-2xl border-[#105238]/50 text-[#105238] hover:bg-[#eaf0e2] font-bold text-xs gap-2 cursor-pointer"
                              >
                                <CreditCard className="w-4 h-4" />
                                <span>Ya cobré en Datáfono propio</span>
                              </Button>
                              <Button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => setConfirmPhysicalMethod("EFECTIVO")}
                                variant="outline"
                                className="h-11 rounded-2xl border-[#105238]/50 text-[#105238] hover:bg-[#eaf0e2] font-bold text-xs gap-2 cursor-pointer"
                              >
                                <Banknote className="w-4 h-4" />
                                <span>Ya cobré en Efectivo</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-muted-foreground">
                          Esta reserva está pendiente de pago. Tu usuario no tiene permiso para confirmar cobros en recepción.
                        </p>
                      )
                    ) : (
                      <Button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => executeQrAction("redeem")}
                        className="w-full h-12 rounded-2xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-black text-sm gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-5 h-5 text-[#8ee01a]" />
                        <span>VALIDAR INGRESO / CHECK-IN</span>
                      </Button>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-border flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetScanner}
                    className="text-xs font-bold text-[#105238] cursor-pointer"
                  >
                    Escanear otro QR
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STORE BOOKINGS LIST */}
        {subTab === "BOOKINGS" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Buscar por código, cliente o servicio..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#105238]"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadReceptionBookings}
                className="h-10 rounded-xl gap-1.5 text-xs font-bold cursor-pointer"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", bookingsLoading && "animate-spin")} />
                <span>Actualizar</span>
              </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { id: "ALL", label: "Todas" },
                { id: "PENDING", label: "Pendientes de Pago" },
                { id: "PAID", label: "Pagadas (Por Validar)" },
                { id: "REDEEMED", label: "Canjeadas" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setBookingFilter(f.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors cursor-pointer",
                    bookingFilter === f.id
                      ? "bg-[#105238] text-white border-[#105238]"
                      : "bg-card text-muted-foreground border-border hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredBookings.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
                No hay reservas que coincidan con este filtro.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#105238]/50 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-[#105238] bg-[#eaf0e2] px-2 py-0.5 rounded-md">
                          {b.reserva_id}
                        </span>
                        <span className="text-xs font-bold text-foreground truncate">{b.cliente_nombre}</span>
                        {b.estado === "FINALIZADA" ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#105238] text-[#8ee01a]">
                            CANJEADA
                          </span>
                        ) : b.estado_pago === "PAGADO" ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#eaf0e2] text-[#105238] border border-[#8ee01a]">
                            PAGADA
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            PENDIENTE PAGO
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-foreground truncate">{b.servicio_nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.fecha_reserva} · {b.hora_reserva} · {b.invitados} {b.invitados === 1 ? "persona" : "personas"} ·{" "}
                        <strong className="text-[#105238]">${b.monto_total.toFixed(2)}</strong>
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setSubTab("SCANNER")
                        lookupQrCode(b.reserva_id)
                      }}
                      className="rounded-xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold text-xs shrink-0 cursor-pointer"
                    >
                      {b.estado === "FINALIZADA" ? "Ver Detalle" : "Cobrar / Validar"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TEAM / STAFF MANAGEMENT (OWNER ONLY) */}
        {subTab === "TEAM" && isOwnerOfAnyStore && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-3xl p-5 shadow-xs space-y-4">
              <div>
                <h2 className="font-bold text-foreground text-base flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#105238]" />
                  <span>Agregar Personal de Recepción</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Habilita a un empleado registrado en PalenqueGo para escanear Voucher QR y confirmar pagos en puerta. No tendrá acceso a tus finanzas ni configuración.
                </p>
              </div>

              <form onSubmit={handleAddStaff} className="space-y-3">
                {ownedStores.length > 1 && (
                  <select
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-medium"
                  >
                    {ownedStores.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.nombre_comercial}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newStaffIdentifier}
                    onChange={(e) => setNewStaffIdentifier(e.target.value)}
                    placeholder="Correo electrónico o teléfono del usuario registrado"
                    className="flex-1 h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#105238]"
                  />
                  <Button
                    type="submit"
                    disabled={!newStaffIdentifier.trim()}
                    className="h-11 px-5 rounded-xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold text-sm cursor-pointer shrink-0"
                  >
                    Habilitar
                  </Button>
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={canConfirmPaymentPerm}
                    onChange={(e) => setCanConfirmPaymentPerm(e.target.checked)}
                    className="rounded border-border accent-[#105238]"
                  />
                  <span>Permitir confirmar cobros con POS / Tarjeta o Efectivo</span>
                </label>
              </form>

              {staffError && (
                <div className="bg-[#eaf0e2] border border-[#105238]/40 rounded-xl p-3 text-xs font-semibold text-[#105238]">
                  {staffError}
                </div>
              )}
              {staffSuccess && (
                <div className="bg-[#105238] text-white rounded-xl p-3 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8ee01a]" />
                  <span>{staffSuccess}</span>
                </div>
              )}
            </div>

            {/* Staff List */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                Personal Autorizado ({staffList.length})
              </h3>
              {staffLoading ? (
                <div className="text-xs text-muted-foreground p-4 text-center">Cargando equipo...</div>
              ) : staffList.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-6 text-center text-xs text-muted-foreground">
                  Aún no has agregado personal de Recepción. Como propietario, tú ya tienes acceso automático al escáner QR.
                </div>
              ) : (
                staffList.map((member) => (
                  <div
                    key={member.id}
                    className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground truncate">{member.nombre}</span>
                        <span
                          className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded-full",
                            member.activo ? "bg-[#eaf0e2] text-[#105238]" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {member.activo ? "ACTIVO" : "PAUSADO"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email} {member.telefono ? `· ${member.telefono}` : ""}
                      </p>
                      <p className="text-[11px] font-semibold text-[#105238]">
                        {member.tienda_nombre} ·{" "}
                        {member.puede_confirmar_pago ? "Puede confirmar cobros" : "Solo validar QR pagados"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStaff(member, "puede_confirmar_pago")}
                        className="h-8 rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        {member.puede_confirmar_pago ? "Quitar Cobro" : "Permitir Cobro"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStaff(member, "activo")}
                        className="h-8 rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        {member.activo ? "Pausar" : "Activar"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(member.id)}
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                        title="Eliminar acceso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Explicit Confirmation Modal for Physical / Cash / Own POS Payment */}
      {confirmPhysicalMethod && scannedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#eaf0e2] text-[#105238] flex items-center justify-center shrink-0">
                {confirmPhysicalMethod === "EFECTIVO" ? (
                  <Banknote className="w-5 h-5" />
                ) : (
                  <CreditCard className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-foreground text-base">
                  Confirmar cobro físico recibido
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  ¿Confirmas que ya recibiste{" "}
                  <strong className="text-[#105238]">
                    ${scannedBooking.monto_total.toFixed(2)}
                  </strong>{" "}
                  {confirmPhysicalMethod === "EFECTIVO"
                    ? "en efectivo en caja"
                    : "en tu datáfono bancario propio"}
                  ?
                </p>
              </div>
            </div>

            <div className="bg-[#eaf0e2]/60 border border-[#aeb6a1]/50 rounded-2xl p-3 text-xs text-[#105238]">
              Esta acción no debita tarjetas por internet; registra el cobro físico en tu comercio y marca el Voucher QR como <strong>PAGADO y CANJEADO</strong> a tu nombre.
            </div>

            <div className="flex gap-2.5 pt-1">
              <Button
                type="button"
                variant="outline"
                disabled={actionLoading}
                onClick={() => setConfirmPhysicalMethod(null)}
                className="flex-1 h-11 rounded-2xl font-bold text-xs cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={actionLoading}
                onClick={async () => {
                  const method = confirmPhysicalMethod
                  setConfirmPhysicalMethod(null)
                  await executeQrAction("pay_and_redeem", method)
                }}
                className="flex-1 h-11 rounded-2xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold text-xs cursor-pointer"
              >
                {actionLoading ? "Registrando..." : "Sí, ya recibí el dinero"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
