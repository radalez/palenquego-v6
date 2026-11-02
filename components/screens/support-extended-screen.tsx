'use client'

import { useState } from 'react'
import { ChevronLeft, MessageCircle, Mail, Phone, HelpCircle, Search, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SupportExtendedScreenProps {
  onBack: () => void
}

export function SupportExtendedScreen({ onBack }: SupportExtendedScreenProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const contactMethods = [
    { icon: MessageCircle, label: 'Chat en vivo', description: 'Respuesta en tiempo real', action: () => console.log('[v0] Opening chat') },
    { icon: Mail, label: 'Correo electrónico', description: 'support@palenquego.com', action: () => console.log('[v0] Opening email') },
    { icon: Phone, label: 'Teléfono', description: '+503 2123 4567', action: () => console.log('[v0] Opening phone') },
  ]

  const faqs = [
    {
      question: '¿Cómo creo un Pool?',
      answer: 'Ve a la sección de Pool, presiona el botón + y selecciona el servicio. Define la cantidad de personas y comparte el enlace con tus amigos.',
    },
    {
      question: '¿Cómo funciona Safe-Flow?',
      answer: 'Safe-Flow es nuestro sistema de seguridad. Al llegar a tu destino, escanea el código QR para notificar a tus contactos de emergencia.',
    },
    {
      question: '¿Cuándo recibo comisiones?',
      answer: 'Recibes el 7% por cada recomendación exitosa. Las comisiones se acumulan en tu cuenta y puedes retirarlas cuando lo desees.',
    },
    {
      question: '¿Qué pasa si cancelo una reserva?',
      answer: 'Puedes cancelar hasta 24 horas antes sin penalidad. Después, se aplica una penalidad del 20% del total.',
    },
    {
      question: '¿Cómo cambio mi plan?',
      answer: 'En el menú hamburguesa del header, selecciona el plan que deseas. El cambio es inmediato y se ajustarán los cobros proporcionalmente.',
    },
    {
      question: '¿Es seguro compartir mi ubicación?',
      answer: 'Sí, tu ubicación solo se comparte cuando completas una reserva y solo con tus contactos de emergencia autorizados.',
    },
  ]

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-screen bg-background items-center">
      {/* Header */}
      <header className="bg-primary px-4 pt-4 pb-6 rounded-b-3xl w-full">
        <div className="max-w-3xl mx-auto w-full flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ChevronLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold text-primary-foreground">Ayuda y Soporte</h1>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 overflow-y-auto pb-20 w-full max-w-3xl mx-auto">
        {/* Contact Methods */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Contáctanos</h2>
          <div className="space-y-3">
            {contactMethods.map(({ icon: Icon, label, description, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon size={24} className="text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
                <ChevronDown size={18} className="text-muted-foreground transform -rotate-90" />
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Preguntas frecuentes</h2>

          {/* Search */}
          <div className="relative mb-6">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar en FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* FAQs */}
          <div className="space-y-3">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-border rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="w-full flex items-start justify-between p-4 hover:bg-muted/30 transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground text-left">{faq.question}</p>
                    <ChevronDown
                      size={18}
                      className={`text-muted-foreground flex-shrink-0 ml-3 transition-transform ${
                        expandedFaq === idx ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>

                  {expandedFaq === idx && (
                    <div className="px-4 py-3 border-t border-border bg-muted/20">
                      <p className="text-sm text-foreground/70">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <HelpCircle size={40} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No encontramos respuestas para tu búsqueda</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
