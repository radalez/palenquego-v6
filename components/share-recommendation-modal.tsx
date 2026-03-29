"use client"

import { useState } from "react"
import { X, Facebook, Twitter, Linkedin, Mail, MessageCircle, Contact, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Adaptamos la interfaz EXACTAMENTE a lo que escupe tu API
interface ShareRecommendationModalProps {
  recommendation: any // Le ponemos any por ahora para que trague tus datos de la API sin que TypeScript joda
  onClose: () => void
}

export function ShareRecommendationModal({ recommendation, onClose }: ShareRecommendationModalProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [showContacts, setShowContacts] = useState(false)

  // 1. EXTRAEMOS LOS DATOS REALES DE TU JSON
  // Manejamos tanto la versión vieja del store (name) como la nueva de la API (nombre)
  const nombreCampaña = recommendation.nombre || recommendation.name || "Servicio"
  const descuento = recommendation.descuento || recommendation.discount || 0
  const cupon = recommendation.cupon || recommendation.codigo_embajador || "afiliado"


// 2. CONSTRUIMOS EL ENLACE REAL (¡A LA FUERZA, IGNORANDO LA BASURA VIEJA!)
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://palenquego.com"
  // Si el backend no te manda el slug, te va a chillar en la pantalla para que te des cuenta
  const slugReal = recommendation.slug || "FALTA-SLUG-EN-BACKEND"
  // Imponemos la ruta /ref/ sí o sí.
  const shareLink = `${baseUrl}/ref/${slugReal}`
  
  // 3. ARMAMOS EL MENSAJE DE VENTA PERFECTO
  const descuentoText = descuento > 0 ? ` con un ${descuento}% de descuento` : ""
  const cuponText = cupon ? `\n🎁 Usa mi cupón exclusivo: *${cupon}*` : ""
  const shareText = `¡Te recomiendo ${nombreCampaña}${descuentoText}!${cuponText}\n👇 Reserva aquí:`

  const shareMethods = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-600",
      url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareLink)}`,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      icon: Twitter,
      color: "bg-black",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareLink)}`,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-700",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`,
    },
    {
      id: "email",
      name: "Email",
      icon: Mail,
      color: "bg-gray-600",
      url: `mailto:?subject=Te recomiendo este servicio en Palenque Go&body=${encodeURIComponent(shareText + "\n\n" + shareLink)}`,
    },
    {
      id: "contacts",
      name: "Mis Contactos",
      icon: Contact,
      color: "bg-purple-600",
      action: () => setShowContacts(true),
    },
  ]

  const mockContacts = [
    { id: 1, name: "María García", phone: "+503 7123-4567" },
    { id: 2, name: "Carlos López", phone: "+503 7234-5678" },
    { id: 3, name: "Ana Martínez", phone: "+503 7345-6789" },
    { id: 4, name: "Roberto Sánchez", phone: "+503 7456-7890" },
    { id: 5, name: "Elena Rodríguez", phone: "+503 7567-8901" },
  ]

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleShare = (method: any) => {
    if (method.action) {
      method.action()
    } else if (method.url) {
      window.open(method.url, "_blank", "width=600,height=400")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Compartir Enlace</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {!showContacts ? (
          <div className="p-6 space-y-4">
            {/* AQUÍ SE VERÁN LOS DATOS REALES */}
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl">
              <p className="text-sm text-muted-foreground">Compartiendo campaña:</p>
              <p className="font-semibold text-foreground">{nombreCampaña}</p>
              
              {/* Descuento real de la API */}
              {descuento > 0 && (
                <p className="text-sm text-green-600 font-bold mt-1">
                  Aplica {descuento}% de descuento
                </p>
              )}
              
              {/* Cupón real de la API */}
              {cupon && (
                <p className="text-xs font-mono bg-background px-2 py-1 rounded border border-border mt-2 inline-block">
                  Cupón: {cupon}
                </p>
              )}
            </div>

            {/* Copy Link arreglado */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Copiar enlace</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm border border-border focus:outline-none"
                />
                <Button
                  size="sm"
                  variant={copiedLink ? "default" : "outline"}
                  onClick={handleCopyLink}
                  className="gap-2"
                >
                  {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">O comparte en</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Redes */}
            <div className="grid grid-cols-3 gap-3">
              {shareMethods.map((method) => {
                const Icon = method.icon
                return (
                  <button
                    key={method.id}
                    onClick={() => handleShare(method)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl transition hover:scale-105 active:scale-95",
                      method.color,
                      "text-white",
                    )}
                  >
                    <Icon size={24} />
                    <span className="text-xs font-medium text-center">{method.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setShowContacts(false)}
                className="p-1 hover:bg-muted rounded-lg transition"
              >
                <X size={20} />
              </button>
              <h3 className="text-lg font-semibold">Selecciona contactos</h3>
            </div>

            <div className="space-y-2">
              {mockContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => {
                    const whatsappUrl = `https://wa.me/${contact.phone.replace(/\D/g, "")}?text=${encodeURIComponent(shareText + " " + shareLink)}`
                    window.open(whatsappUrl, "_blank")
                  }}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center font-semibold text-primary">
                      {contact.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.phone}</p>
                    </div>
                  </div>
                  <MessageCircle size={18} className="text-green-600" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}