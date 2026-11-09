import { jsPDF } from "jspdf"
import QRCode from "qrcode"

export interface VoucherPdfData {
  id?: number | string
  qrCode: string
  serviceName: string
  businessName?: string
  date: string
  time?: string
  guests?: number
  extras?: string[]
  amount: number
  status?: string
  paymentStatus?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  businessPhone?: string
  isPool?: boolean
}

/**
 * Genera y descarga un comprobante / voucher oficial de PalenqueGo en formato PDF real de alta fidelidad.
 */
export async function generateVoucherPdf(data: VoucherPdfData): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Paleta oficial de PalenqueGo
  const PRIMARY_COLOR: [number, number, number] = [16, 82, 56]     // #105238 Turquesa Oscuro
  const ACCENT_COLOR: [number, number, number] = [142, 224, 26]    // #8ee01a Verde Lima
  const LIGHT_BG: [number, number, number] = [234, 240, 226]        // #eaf0e2 Verde Claro
  const DARK_TEXT: [number, number, number] = [17, 24, 39]          // #111827
  const MUTED_TEXT: [number, number, number] = [75, 85, 99]         // #4b5563
  const BORDER_COLOR: [number, number, number] = [209, 213, 219]    // #d1d5db

  // 1. Cabecera Corporativa PalenqueGo (#105238)
  doc.setFillColor(...PRIMARY_COLOR)
  doc.rect(0, 0, pageWidth, 42, "F")

  // Línea decorativa verde lima (#8ee01a)
  doc.setFillColor(...ACCENT_COLOR)
  doc.rect(0, 42, pageWidth, 3, "F")

  // Logotipo y Marca
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.text("PalenqueGo", 15, 18)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(234, 240, 226)
  doc.text("Movilidad & Experiencias Turísticas", 15, 25)
  doc.text("Turismo Sostenible · El Salvador", 15, 31)

  // Tipo de Documento y Código (lado derecho de la cabecera)
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("COMPROBANTE DE RESERVA", pageWidth - 15, 17, { align: "right" })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(...ACCENT_COLOR)
  doc.text(data.qrCode || "PGO-OFICIAL", pageWidth - 15, 25, { align: "right" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(234, 240, 226)
  const fechaEmision = new Date().toLocaleDateString("es-SV", { day: "2-digit", month: "short", year: "numeric" })
  doc.text(`Emisión: ${fechaEmision}`, pageWidth - 15, 32, { align: "right" })

  // 2. Banner de Estado
  const isPaid = (data.paymentStatus || "").toUpperCase().includes("PAG") || (data.status || "").toUpperCase().includes("COMPLET");
  const estadoLabel = isPaid ? "PAGADO / CONFIRMADO" : "RESERVA REGISTRADA (PENDIENTE DE PAGO)";
  
  const bannerColor: [number, number, number] = isPaid ? PRIMARY_COLOR : [217, 119, 6]
  doc.setFillColor(...bannerColor)
  doc.roundedRect(15, 52, pageWidth - 30, 10, 2, 2, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9.5)
  doc.text(`ESTADO: ${estadoLabel}`, pageWidth / 2, 58.5, { align: "center" })

  // 3. Generar Código QR Real
  let qrDataUrl = ""
  try {
    qrDataUrl = await QRCode.toDataURL(data.qrCode || "https://palenquego.com", {
      width: 250,
      margin: 1,
      color: {
        dark: "#105238",
        light: "#FFFFFF",
      },
    })
  } catch (err) {
    console.error("Error generando QR para voucher:", err)
  }

  // 4. Bloque Principal de Información (2 Columnas)
  // Columna Izquierda: Datos del Viajero y Servicio
  let y = 72

  // Caja de Datos del Viajero
  doc.setFillColor(...LIGHT_BG)
  doc.roundedRect(15, y, 110, 48, 3, 3, "F")
  doc.setDrawColor(...BORDER_COLOR)
  doc.roundedRect(15, y, 110, 48, 3, 3, "D")

  doc.setTextColor(...PRIMARY_COLOR)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10.5)
  doc.text("DATOS DEL TITULAR", 20, y + 8)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...MUTED_TEXT)
  doc.text("Nombre:", 20, y + 16)
  doc.setTextColor(...DARK_TEXT)
  doc.setFont("helvetica", "bold")
  doc.text(data.customerName || "Viajero PalenqueGo", 48, y + 16)

  doc.setFont("helvetica", "normal")
  doc.setTextColor(...MUTED_TEXT)
  doc.text("Teléfono / WA:", 20, y + 24)
  doc.setTextColor(...DARK_TEXT)
  doc.text(data.customerPhone || "Registrado en cuenta", 48, y + 24)

  doc.setFont("helvetica", "normal")
  doc.setTextColor(...MUTED_TEXT)
  doc.text("Correo:", 20, y + 32)
  doc.setTextColor(...DARK_TEXT)
  doc.text(data.customerEmail || "No especificado", 48, y + 32)

  doc.setFont("helvetica", "normal")
  doc.setTextColor(...MUTED_TEXT)
  doc.text("Modalidad:", 20, y + 40)
  doc.setTextColor(...DARK_TEXT)
  doc.setFont("helvetica", "bold")
  doc.text(data.isPool ? "Compra en Grupo (Pool Palenque)" : "Reserva Individual", 48, y + 40)

  // Columna Derecha: Tarjeta QR Escaneable
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(132, y, pageWidth - 147, 48, 3, 3, "F")
  doc.setDrawColor(...PRIMARY_COLOR)
  doc.setLineWidth(0.6)
  doc.roundedRect(132, y, pageWidth - 147, 48, 3, 3, "D")

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", 148, y + 3, 32, 32)
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...PRIMARY_COLOR)
  doc.text(data.qrCode, 164, y + 39, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(...MUTED_TEXT)
  doc.text("Escanear para validar en comercio", 164, y + 44, { align: "center" })

  // 5. Detalles de la Experiencia / Servicio
  y = 127
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(15, y, pageWidth - 30, 48, 3, 3, "F")
  doc.setDrawColor(...BORDER_COLOR)
  doc.roundedRect(15, y, pageWidth - 30, 48, 3, 3, "D")

  doc.setTextColor(...PRIMARY_COLOR)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("DETALLES DE LA RESERVA", 20, y + 8)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(...MUTED_TEXT)
  doc.text("Experiencia / Servicio:", 20, y + 17)
  doc.setTextColor(...DARK_TEXT)
  doc.setFont("helvetica", "bold")
  doc.text(data.serviceName, 65, y + 17)

  if (data.businessName) {
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...MUTED_TEXT)
    doc.text("Comercio / Aliado:", 20, y + 25)
    doc.setTextColor(...PRIMARY_COLOR)
    doc.setFont("helvetica", "bold")
    doc.text(data.businessName, 65, y + 25)
  }

  doc.setFont("helvetica", "normal")
  doc.setTextColor(...MUTED_TEXT)
  doc.text("Fecha Reservada:", 20, y + 33)
  doc.setTextColor(...DARK_TEXT)
  doc.setFont("helvetica", "bold")
  doc.text(`${data.date}  ${data.time ? `• Hora: ${data.time}` : ""}`, 65, y + 33)

  doc.setFont("helvetica", "normal")
  doc.setTextColor(...MUTED_TEXT)
  doc.text("Invitados / Personas:", 20, y + 41)
  doc.setTextColor(...DARK_TEXT)
  doc.setFont("helvetica", "bold")
  doc.text(`${data.guests || 1} persona(s)`, 65, y + 41)

  // 6. Desglose Financiero / Tabla de Cobro
  y = 182
  doc.setTextColor(...PRIMARY_COLOR)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("DESGLOSE DE PAGO", 15, y + 5)

  // Cabecera de Tabla
  y = 192
  doc.setFillColor(...PRIMARY_COLOR)
  doc.rect(15, y, pageWidth - 30, 8, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.text("CONCEPTO", 20, y + 5.5)
  doc.text("CANTIDAD", 120, y + 5.5)
  doc.text("TOTAL (USD)", pageWidth - 20, y + 5.5, { align: "right" })

  // Fila 1: Servicio
  y = 200
  doc.setFillColor(250, 250, 250)
  doc.rect(15, y, pageWidth - 30, 9, "F")
  doc.setDrawColor(...BORDER_COLOR)
  doc.line(15, y + 9, pageWidth - 15, y + 9)

  doc.setTextColor(...DARK_TEXT)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(data.serviceName.length > 45 ? `${data.serviceName.substring(0, 45)}...` : data.serviceName, 20, y + 6)
  doc.text(`${data.guests || 1} persona(s)`, 120, y + 6)
  doc.setFont("helvetica", "bold")
  doc.text(`$${Number(data.amount).toFixed(2)}`, pageWidth - 20, y + 6, { align: "right" })

  // Extras si los hay
  if (data.extras && data.extras.length > 0) {
    y += 9
    doc.setFillColor(255, 255, 255)
    doc.rect(15, y, pageWidth - 30, 9, "F")
    doc.line(15, y + 9, pageWidth - 15, y + 9)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    doc.text(`Extras: ${data.extras.join(", ")}`, 20, y + 6)
    doc.text("Incluido", pageWidth - 20, y + 6, { align: "right" })
  }

  // Fila Total
  y += 12
  doc.setFillColor(...LIGHT_BG)
  doc.roundedRect(15, y, pageWidth - 30, 12, 2, 2, "F")
  doc.setDrawColor(...PRIMARY_COLOR)
  doc.roundedRect(15, y, pageWidth - 30, 12, 2, 2, "D")

  doc.setTextColor(...PRIMARY_COLOR)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("TOTAL GENERAL:", 20, y + 8)
  doc.text(`$${Number(data.amount).toFixed(2)} USD`, pageWidth - 20, y + 8, { align: "right" })

  // 7. Términos y Condiciones / Pie de Página
  const footerY = pageHeight - 35
  doc.setDrawColor(...BORDER_COLOR)
  doc.line(15, footerY, pageWidth - 15, footerY)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...PRIMARY_COLOR)
  doc.text("INSTRUCCIONES IMPORTANTES PARA EL VIAJERO:", 15, footerY + 5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED_TEXT)
  doc.text("1. Muestra este comprobante con su código QR impreso o desde tu dispositivo móvil al llegar al comercio.", 15, footerY + 10)
  doc.text("2. Para reprogramaciones o coordinación inmediata, contacta al aliado por WhatsApp o a soporte@palenquego.com.", 15, footerY + 14)
  doc.text("3. Este voucher es intransferible y certifica tu reserva oficial procesada a través del sistema PalenqueGo.", 15, footerY + 18)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.setTextColor(...PRIMARY_COLOR)
  doc.text("PalenqueGo El Salvador · Plataforma Oficial de Turismo Sostenible · www.palenquego.com", pageWidth / 2, footerY + 25, { align: "center" })

  // Descargar archivo
  const cleanCode = (data.qrCode || "VOUCHER").replace(/[^a-zA-Z0-9_-]/g, "_")
  doc.save(`PalenqueGo_Voucher_${cleanCode}.pdf`)
}

/**
 * Genera un PDF de resumen con todas las facturas/reservas del usuario.
 */
export async function generateBillingSummaryPdf(billings: VoucherPdfData[], totalSpent: number): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const PRIMARY_COLOR: [number, number, number] = [16, 82, 56]
  const ACCENT_COLOR: [number, number, number] = [142, 224, 26]
  const LIGHT_BG: [number, number, number] = [234, 240, 226]
  const DARK_TEXT: [number, number, number] = [17, 24, 39]
  const MUTED_TEXT: [number, number, number] = [75, 85, 99]
  const BORDER_COLOR: [number, number, number] = [209, 213, 219]

  // Cabecera
  doc.setFillColor(...PRIMARY_COLOR)
  doc.rect(0, 0, pageWidth, 35, "F")
  doc.setFillColor(...ACCENT_COLOR)
  doc.rect(0, 35, pageWidth, 2.5, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.text("PalenqueGo", 15, 17)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(234, 240, 226)
  doc.text("Historial Consolidado de Facturas y Reservas", 15, 24)

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("RESUMEN DE CUENTA", pageWidth - 15, 17, { align: "right" })

  const fechaHoy = new Date().toLocaleDateString("es-SV", { day: "2-digit", month: "short", year: "numeric" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.text(`Fecha: ${fechaHoy}`, pageWidth - 15, 24, { align: "right" })

  // KPI Resumen
  let y = 46
  doc.setFillColor(...LIGHT_BG)
  doc.roundedRect(15, y, pageWidth - 30, 16, 2, 2, "F")
  doc.setDrawColor(...PRIMARY_COLOR)
  doc.roundedRect(15, y, pageWidth - 30, 16, 2, 2, "D")

  doc.setTextColor(...PRIMARY_COLOR)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text(`Total de Facturas / Comprobantes: ${billings.length}`, 22, y + 10)
  doc.text(`Total Acumulado: $${Number(totalSpent).toFixed(2)} USD`, pageWidth - 22, y + 10, { align: "right" })

  // Tabla
  y = 70
  doc.setFillColor(...PRIMARY_COLOR)
  doc.rect(15, y, pageWidth - 30, 8, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("CÓDIGO", 20, y + 5.5)
  doc.text("FECHA", 55, y + 5.5)
  doc.text("SERVICIO", 85, y + 5.5)
  doc.text("TIPO", 145, y + 5.5)
  doc.text("MONTO", pageWidth - 20, y + 5.5, { align: "right" })

  y = 78
  billings.forEach((b, idx) => {
    if (y > pageHeight - 30) {
      doc.addPage()
      y = 20
    }
    doc.setFillColor(idx % 2 === 0 ? 255 : 249, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 251)
    doc.rect(15, y, pageWidth - 30, 8, "F")
    doc.setDrawColor(...BORDER_COLOR)
    doc.line(15, y + 8, pageWidth - 15, y + 8)

    doc.setTextColor(...DARK_TEXT)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7.5)
    doc.text(b.qrCode, 20, y + 5.5)

    doc.setFont("helvetica", "normal")
    doc.text(b.date, 55, y + 5.5)

    const sName = b.serviceName.length > 30 ? `${b.serviceName.substring(0, 30)}...` : b.serviceName
    doc.text(sName, 85, y + 5.5)

    doc.text(b.isPool ? "Pool" : "Reserva", 145, y + 5.5)

    doc.setFont("helvetica", "bold")
    doc.setTextColor(...PRIMARY_COLOR)
    doc.text(`$${Number(b.amount).toFixed(2)}`, pageWidth - 20, y + 5.5, { align: "right" })

    y += 8
  })

  // Pie
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...MUTED_TEXT)
  doc.text("PalenqueGo · Comprobante oficial consolidado para control del viajero", pageWidth / 2, pageHeight - 12, { align: "center" })

  doc.save(`PalenqueGo_Facturas_Consolidado_${Date.now()}.pdf`)
}
