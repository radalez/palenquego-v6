"use client"

import { useState } from "react"
import { X, Facebook, Twitter, Linkedin, Mail, MessageCircle, Contact, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type Recommendation } from "@/lib/store"

interface ShareRecommendationModalProps {
  recommendation: Recommendation
  serviceName?: string
  discount?: number
  onClose: () => void
}

export function ShareRecommendationModal({ recommendation, serviceName, discount, onClose }: ShareRecommendationModalProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [showContacts, setShowContacts] = useState(false)

  // Enlace real de tu campaña de embajador
  const shareLink = recommendation.link
  
  const discountText = discount ? ` con un ${discount}% de descuento` : ""
  const shareText = `¡Te recomiendo ${serviceName || recommendation.name}${discountText}! Usa mi enlace exclusivo aquí:`

  const shareMethods = [
    {
      id: "facebook",
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600",
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareLink}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      icon: Twitter,
      color: "bg-black",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${shareLink}`,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-700",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${shareLink}`,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-600",
      url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareLink)}`,
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

  // Restaurados los contactos que te había quitado
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
            {/* Campaign Info - Adaptado para embajadores */}
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl">
              <p className="text-sm text-muted-foreground">Compartiendo campaña:</p>
              <p className="font-semibold text-foreground">{recommendation.name}</p>
              {discount && (
                <p className="text-sm text-green-600 font-bold mt-1">
                  Aplica {discount}% de descuento
                </p>
              )}
            </div>

            {/* Copy Link */}
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

            {/* Share Methods Grid - Todas las opciones restauradas */}
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
          /* Vista de contactos restaurada exactamente igual */
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
                    const whatsappUrl = `https://wa.me/${contact.phone.replace(/\D/g, "")}?text=${encodeURIComponent(shareText + "\n\n" + shareLink)}`
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