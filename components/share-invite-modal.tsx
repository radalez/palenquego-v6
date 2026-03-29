"use client"

import { useState } from "react"
import { X, Facebook, Twitter, Linkedin, Mail, MessageCircle, Contact, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ShareInviteModalProps {
  poolId?: number // Opcional ahora
  poolName: string
  spotPrice?: number // Opcional ahora
  spotsLeft?: number // Opcional ahora
  onClose: () => void
  // --- EXTENSIÓN PARA MARKETING (MANTENEMOS TODO LO ANTERIOR) ---
  type?: 'pool' | 'marketing'
  discount?: number
  customLink?: string
}

export function ShareInviteModal({ 
  poolId, 
  poolName, 
  spotPrice, 
  spotsLeft, 
  onClose,
  type = 'pool', // Por defecto sigue siendo un Pool para no romper nada
  discount,
  customLink
}: ShareInviteModalProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [showContacts, setShowContacts] = useState(false)

  // 1. LÓGICA DE ENLACE: Si viene customLink (de Melvis), usamos ese. Si no, el de Pool.
  const finalLink = customLink || `https://palenquego.app/pool/${poolId}`

  // 2. LÓGICA DE TEXTO: Cambia según el tipo, manteniendo el formato original.
  const shareText = type === 'marketing'
    ? `¡Aprovecha esta oferta en Palenque Go! "${poolName}" con un ${discount}% de descuento exclusivo. ¡No te lo pierdas!`
    : `Únete a mi Pool en Palenque Go: "${poolName}" por $${spotPrice}. ${spotsLeft} cupo${spotsLeft !== 1 ? "s" : ""} disponible${spotsLeft !== 1 ? "s" : ""}. ¡Ahorra con nosotros!`

  const shareMethods = [
    {
      id: "facebook",
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(finalLink)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      icon: Twitter,
      color: "bg-black",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(finalLink)}`,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-700",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(finalLink)}`,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-600",
      url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + finalLink)}`,
    },
    {
      id: "email",
      name: "Email",
      icon: Mail,
      color: "bg-gray-600",
      url: `mailto:?subject=${encodeURIComponent(type === 'marketing' ? 'Oferta especial Palenque' : 'Únete a mi Pool')}&body=${encodeURIComponent(shareText + "\n\n" + finalLink)}`,
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
    navigator.clipboard.writeText(finalLink)
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-card rounded-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header - Dinámico pero con el mismo estilo */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {type === 'marketing' ? "Compartir oferta" : "Invitar amigos"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {!showContacts ? (
          <div className="p-6 space-y-4">
            {/* Info Box - Muestra Precio o Descuento según el tipo */}
            <div className="bg-muted p-4 rounded-xl">
              <p className="text-sm text-muted-foreground">Compartiendo:</p>
              <p className="font-semibold">{poolName}</p>
              {type === 'marketing' ? (
                <p className="text-sm text-primary font-bold">{discount}% de descuento</p>
              ) : (
                <p className="text-sm text-primary font-bold">${spotPrice} por persona</p>
              )}
            </div>

            {/* Copy Link - Usa el finalLink (Pool o Ref) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {type === 'marketing' ? "Tu enlace de embajador" : "Copiar enlace"}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={finalLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm border border-border"
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

            {/* Share Methods Grid - EXACTAMENTE EL MISMO QUE TENÍAS */}
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

            {/* Info de cupos - Solo se muestra si es tipo Pool */}
            {type === 'pool' && spotsLeft !== undefined && (
              <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-3 text-sm text-secondary-foreground">
                Cuota disponible: <strong>{spotsLeft}</strong>
              </div>
            )}
          </div>
        ) : (
          /* Seccion de Contactos - INTEGRA TOTALMENTE TU LÓGICA ORIGINAL */
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
                    const whatsappUrl = `https://wa.me/${contact.phone.replace(/\D/g, "")}?text=${encodeURIComponent(shareText + "\n\n" + finalLink)}`
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