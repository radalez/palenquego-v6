'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Trash2, Plus, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'

interface PaymentsExtendedScreenProps {
  onBack: () => void
}

export function PaymentsExtendedScreen({ onBack }: PaymentsExtendedScreenProps) {
  const [showAddCard, setShowAddCard] = useState(false)
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
  })

  const paymentMethods = useAppStore((state) => state.paymentMethods)
  const bookings = useAppStore((state) => state.bookings)
  const fetchMyBookings = useAppStore((state) => state.fetchMyBookings)

  useEffect(() => {
    fetchMyBookings?.()
  }, [fetchMyBookings])

  const handleAddCard = () => {
    if (cardData.cardNumber && cardData.cardholderName && cardData.expiryDate && cardData.cvv) {
      console.log('[v0] Card added:', cardData)
      setCardData({ cardNumber: '', cardholderName: '', expiryDate: '', cvv: '' })
      setShowAddCard(false)
    }
  }

  const getCardBrand = (last4: string) => {
    return last4.startsWith('4') ? 'Visa' : 'Mastercard'
  }

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
          <h1 className="text-2xl font-bold text-primary-foreground">Métodos de Pago</h1>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 overflow-y-auto pb-20 w-full max-w-3xl mx-auto">
        {/* Active Payment Methods */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Tus tarjetas</h2>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-xl p-6 text-white relative overflow-hidden"
              >
                {/* Card Pattern */}
                <div className="absolute top-0 right-0 opacity-10">
                  <CreditCard size={120} />
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <p className="text-xs text-white/60 mb-1">TARJETA</p>
                      <p className="font-mono text-lg">•••• •••• •••• {method.last4}</p>
                    </div>
                    {method.isDefault && (
                      <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-full">
                        <CheckCircle2 size={14} className="text-green-500" />
                        <span className="text-xs font-bold text-green-500">Por defecto</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-end justify-between">
                    <div className="flex items-center gap-4">
                      <p className="text-xs text-white/60">TITULAR</p>
                      <p className="text-sm font-semibold">Usuario</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => console.log('[v0] Deleted card:', method.id)}
                      className="text-white/60 hover:text-white hover:bg-white/10"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Card */}
        {!showAddCard ? (
          <Button
            onClick={() => setShowAddCard(true)}
            variant="outline"
            className="w-full border-2 border-dashed border-primary/30 hover:border-primary/60"
          >
            <Plus size={20} className="mr-2" />
            Agregar nueva tarjeta
          </Button>
        ) : (
          <div className="bg-muted/50 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-foreground">Nueva tarjeta</h3>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Número de tarjeta
              </label>
              <Input
                placeholder="4242 4242 4242 4242"
                value={cardData.cardNumber}
                onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                maxLength={16}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Titular
              </label>
              <Input
                placeholder="Nombre completo"
                value={cardData.cardholderName}
                onChange={(e) => setCardData({ ...cardData, cardholderName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Vencimiento
                </label>
                <Input
                  placeholder="MM/YY"
                  value={cardData.expiryDate}
                  onChange={(e) => setCardData({ ...cardData, expiryDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  CVV
                </label>
                <Input
                  placeholder="123"
                  value={cardData.cvv}
                  onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                  maxLength={3}
                  type="password"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddCard(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button onClick={handleAddCard} className="flex-1">
                Guardar tarjeta
              </Button>
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Historial de transacciones</h2>
          <div className="space-y-3">
            {[
              { id: 1, description: 'Hotel Volcán View', amount: '$120.00', date: '20 Ene 2026' },
              { id: 2, description: 'Tour Café Local', amount: '$45.00', date: '18 Ene 2026' },
              { id: 3, description: 'Pool Surf Lesson', amount: '$35.00', date: '15 Ene 2026' },
            ].map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div>
                  <p className="font-medium text-foreground">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
                <p className="font-bold text-primary">{tx.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
