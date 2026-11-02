"use client"

import { MessageCircle, Mail, Phone, Globe, ChevronRight, Search } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface SupportScreenProps {
  onBack: () => void
}

export function SupportScreen({ onBack }: SupportScreenProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const faqItems = [
    {
      question: "¿Cómo creo un Pool?",
      answer: "Ve a la sección Pool, presiona el botón '+' y selecciona el servicio que deseas compartir.",
    },
    {
      question: "¿Cómo funciona el Safe-Flow?",
      answer: "Al escanear el código QR al llegar al destino, automáticamente notificamos a tus contactos de emergencia.",
    },
    {
      question: "¿Cuál es el límite de Pools que puedo crear?",
      answer: "Puedes crear pools ilimitados. Solo tienes que tener un pool activo por servicio.",
    },
    {
      question: "¿Cómo recibo mi comisión de recomendaciones?",
      answer: "Las comisiones se acumulan en tu billetera digital y puedes retirarlas mensualmente.",
    },
    {
      question: "¿Qué pasa si cancelo una reserva?",
      answer: "Obtén reembolso completo si cancelas con 48 horas de anticipación.",
    },
    {
      question: "¿Cómo cambio mi plan?",
      answer: "Accede a Planes y Membresías en el menú y elige el plan que desees.",
    },
  ]

  const contactMethods = [
    {
      icon: MessageCircle,
      title: "Chat en Vivo",
      description: "Habla con nuestro equipo ahora",
      action: "Iniciar chat",
      color: "bg-blue-100 text-blue-700",
    },
    {
      icon: Mail,
      title: "Email",
      description: "support@palenquego.com",
      action: "Enviar email",
      color: "bg-green-100 text-green-700",
    },
    {
      icon: Phone,
      title: "Teléfono",
      description: "+503 7890-1234",
      action: "Llamar",
      color: "bg-purple-100 text-purple-700",
    },
    {
      icon: Globe,
      title: "Centro de Ayuda",
      description: "Artículos y tutoriales",
      action: "Explorar",
      color: "bg-orange-100 text-orange-700",
    },
  ]

  const filteredFaq = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col min-h-full items-center">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-4 pt-12 pb-6 w-full">
        <div className="max-w-3xl mx-auto w-full">
          <button onClick={onBack} className="mb-4 text-primary-foreground hover:opacity-80">
            ← Atrás
          </button>
          <h1 className="text-2xl font-bold text-primary-foreground">Ayuda y Soporte</h1>
          <p className="text-primary-foreground/80 text-sm mt-2">Estamos aquí para ayudarte</p>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="px-4 py-6 w-full max-w-3xl mx-auto">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">CONTACTANOS</h3>
        <div className="space-y-3">
          {contactMethods.map((method, idx) => {
            const Icon = method.icon
            return (
              <button
                key={idx}
                className="w-full bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${method.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{method.title}</p>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
              </button>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">PREGUNTAS FRECUENTES</h3>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar preguntas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* FAQ Items */}
          <div className="space-y-2">
            {filteredFaq.map((item, idx) => (
              <details
                key={idx}
                className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all group"
              >
                <summary className="p-4 cursor-pointer flex items-center justify-between hover:bg-muted/50">
                  <p className="font-medium text-foreground text-left">{item.question}</p>
                  <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 pb-4 border-t border-border text-sm text-muted-foreground">{item.answer}</div>
              </details>
            ))}
          </div>

          {filteredFaq.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron resultados</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Help */}
      <div className="px-4 pb-24">
        <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-xl p-4 text-center">
          <p className="font-semibold text-foreground mb-3">¿No encuentras lo que buscas?</p>
          <Button className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground">
            Contactar Soporte Directo
          </Button>
        </div>
      </div>
    </div>
  )
}
