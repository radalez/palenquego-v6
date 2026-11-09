"use client"

import { useState } from "react"
import { ArrowLeft, Download, FileText, Calendar, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { generateVoucherPdf, generateBillingSummaryPdf } from "@/lib/voucher-pdf"

interface BillingScreenProps {
  onBack: () => void
}

export function BillingScreen({ onBack }: BillingScreenProps) {
  const { bookings, currentUser } = useAppStore()
  const [selectedFilter, setSelectedFilter] = useState<"all" | "reservas" | "pools">("all")
  const [downloadingId, setDownloadingId] = useState<number | string | null>(null)

  // Historial real de facturación a partir de las reservas del usuario
  const billingHistory = bookings.map((booking) => ({
    id: booking.id,
    type: booking.poolId ? "pool" : "reserva",
    serviceName: booking.service?.name || "Servicio Turístico",
    businessName: booking.service?.businessName || "Comercio Aliado",
    date: booking.date,
    amount: booking.totalPrice,
    status: booking.status || "CONFIRMADO",
    qrCode: booking.qrCode,
    details: {
      guests: booking.guests || 1,
      time: booking.time || "10:00",
      extras: booking.extras || [],
    },
  }))

  // Datos de demostración solo si aún no existen reservas reales en la cuenta
  const mockHistory =
    billingHistory.length === 0
      ? [
          {
            id: 1001,
            type: "reserva",
            serviceName: "Hotel Vista al Volcan",
            businessName: "Hotel Vista al Volcán",
            date: "10 Ene",
            amount: 170,
            status: "COMPLETADO",
            qrCode: "PGO-DEMO01",
            details: { guests: 2, time: "14:00", extras: ["Desayuno incluido"] },
          },
          {
            id: 1002,
            type: "pool",
            serviceName: "Surf Experience El Tunco",
            businessName: "Surf Club El Salvador",
            date: "8 Ene",
            amount: 45,
            status: "COMPLETADO",
            qrCode: "PGO-DEMO02",
            details: { guests: 1, time: "09:00", extras: [] },
          },
          {
            id: 1003,
            type: "reserva",
            serviceName: "Ruta del Cafe Premium",
            businessName: "Finca de Café Apaneca",
            date: "5 Ene",
            amount: 70,
            status: "COMPLETADO",
            qrCode: "PGO-DEMO03",
            details: { guests: 2, time: "10:00", extras: ["Degustación premium"] },
          },
        ]
      : []

  const allBillings = billingHistory.length > 0 ? billingHistory : mockHistory

  const filteredBillings = allBillings.filter((b) => {
    if (selectedFilter === "all") return true
    if (selectedFilter === "reservas") return b.type === "reserva"
    if (selectedFilter === "pools") return b.type === "pool"
    return true
  })

  const totalSpent = allBillings.reduce((acc, b) => acc + Number(b.amount || 0), 0)

  // Descarga de Voucher / Factura en PDF Real y Oficial
  const handleDownloadPDF = async (billing: (typeof allBillings)[0]) => {
    setDownloadingId(billing.id)

    try {
      await generateVoucherPdf({
        qrCode: billing.qrCode,
        serviceName: billing.serviceName,
        businessName: (billing as any).businessName || (billing.type === "pool" ? "Grupo Pool Palenque" : "Comercio Aliado"),
        date: billing.date,
        time: billing.details.time,
        guests: billing.details.guests,
        extras: billing.details.extras,
        amount: billing.amount,
        status: billing.status,
        customerName: currentUser?.name || "Viajero PalenqueGo",
        customerPhone: currentUser?.telefono || "",
        customerEmail: currentUser?.email || "",
        isPool: billing.type === "pool",
      })
    } catch (err) {
      console.error("Error generando PDF de factura:", err)
    } finally {
      setDownloadingId(null)
    }
  }

  // Descarga consolidada de todas las facturas en un PDF resumen oficial
  const handleDownloadAll = async () => {
    setDownloadingId(-1)

    try {
      await generateBillingSummaryPdf(
        filteredBillings.map((b) => ({
          qrCode: b.qrCode,
          serviceName: b.serviceName,
          date: b.date,
          amount: b.amount,
          isPool: b.type === "pool",
        })),
        totalSpent
      )
    } catch (err) {
      console.error("Error generando resumen consolidado:", err)
    } finally {
      setDownloadingId(null)
    }
  }

  const currentMonthYear = new Date().toLocaleDateString("es-SV", { month: "long", year: "numeric" })
  const formattedPeriod = currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1)

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Mis Facturas</h1>
            <p className="text-xs text-muted-foreground">Historial oficial de reservas, pagos y vouchers PDF</p>
          </div>
        </div>

        {/* Summary Card Corporativa PalenqueGo */}
        <div className="bg-gradient-to-br from-[#105238] to-[#166544] rounded-2xl p-4 text-white shadow-md border border-[#8ee01a]/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-90">Total facturado / gastado</span>
            <Badge className="bg-white/20 text-white border-0 font-bold">{allBillings.length} facturas</Badge>
          </div>
          <p className="text-3xl font-extrabold tracking-tight">${Number(totalSpent).toFixed(2)} USD</p>
          <p className="text-xs opacity-80 mt-1 flex items-center gap-1.5">
            <span>Período: {formattedPeriod}</span>
            <span>•</span>
            <span className="text-[#8ee01a] font-bold">100% Verificado</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border bg-card">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {["all", "reservas", "pools"].map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter as typeof selectedFilter)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95",
              selectedFilter === filter 
                ? "bg-[#105238] text-white shadow-xs" 
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {filter === "all" ? "Todos" : filter === "reservas" ? "Reservas" : "Pools"}
          </button>
        ))}
      </div>

      {/* Download All Button */}
      {filteredBillings.length > 0 && (
        <div className="px-4 py-3">
          <Button
            variant="outline"
            className="w-full bg-white hover:bg-emerald-50 border-emerald-300 text-emerald-900 font-bold text-xs h-10 shadow-2xs"
            onClick={handleDownloadAll}
            disabled={downloadingId === -1}
          >
            {downloadingId === -1 ? (
              <>
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />
                Generando PDF Consolidado...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2 text-emerald-700" />
                Descargar todas las facturas (PDF Consolidado)
              </>
            )}
          </Button>
        </div>
      )}

      {/* Billing List */}
      <div className="flex-1 px-4 pb-24">
        {filteredBillings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Sin facturas registradas</h3>
            <p className="text-sm text-muted-foreground">Tus facturas y comprobantes aparecerán aquí cuando reserves un servicio o tour.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-1">
            {filteredBillings.map((billing) => (
              <div key={billing.id} className="bg-card rounded-2xl border border-border p-4 shadow-2xs hover:shadow-xs transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs",
                        billing.type === "pool" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-emerald-100/60 text-[#105238] border border-emerald-300/60",
                      )}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm leading-tight">{billing.serviceName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline"
                          className={cn(
                            "text-[10px] font-extrabold px-1.5 py-0 rounded-md border",
                            billing.type === "pool" 
                              ? "bg-lime-50 text-lime-900 border-lime-300" 
                              : "bg-emerald-50 text-emerald-900 border-emerald-300"
                          )}
                        >
                          {billing.type === "pool" ? "Pool" : "Reserva"}
                        </Badge>
                        <span className="text-[11px] font-mono font-bold text-muted-foreground">{billing.qrCode}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-foreground text-base">${Number(billing.amount).toFixed(2)}</p>
                    <p className="text-[11px] text-muted-foreground">{billing.date}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                    <span>{billing.details.time}</span>
                    <span>•</span>
                    <span>{billing.details.guests} persona(s)</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 rounded-lg border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-xs shadow-2xs transition-all active:scale-95"
                    onClick={() => handleDownloadPDF(billing)}
                    disabled={downloadingId === billing.id}
                  >
                    {downloadingId === billing.id ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mr-1.5" />
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                        <span>PDF Oficial</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
