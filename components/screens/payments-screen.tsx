"use client"

import { useState } from "react"
import { CreditCard, Plus, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"

interface PaymentsScreenProps {
  onBack: () => void
}

export function PaymentsScreen({ onBack }: PaymentsScreenProps) {
  const { paymentMethods, addPaymentMethod } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ type: "Visa", last4: "" })

  const handleAddPayment = () => {
    if (formData.last4.length === 4) {
      addPaymentMethod({ type: formData.type, last4: formData.last4 })
      setFormData({ type: "Visa", last4: "" })
      setShowForm(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full items-center">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-4 pt-12 pb-6 w-full">
        <div className="max-w-3xl mx-auto w-full">
          <button onClick={onBack} className="mb-4 text-primary-foreground hover:opacity-80">
            ← Atrás
          </button>
          <h1 className="text-2xl font-bold text-primary-foreground">Métodos de Pago</h1>
          <p className="text-primary-foreground/80 text-sm mt-2">Gestiona tus tarjetas y billeteras</p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="px-4 py-6 space-y-4 flex-1 w-full max-w-3xl mx-auto">
        {paymentMethods.length > 0 ? (
          paymentMethods.map((method) => (
            <div
              key={method.id}
              className="bg-card border-2 border-border rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{method.type}</p>
                  <p className="text-sm text-muted-foreground">•••• •••• •••• {method.last4}</p>
                  {method.isDefault && (
                    <div className="flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">Tarjeta por defecto</span>
                    </div>
                  )}
                </div>
              </div>
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tienes métodos de pago registrados</p>
          </div>
        )}

        {/* Add Payment Form */}
        {showForm && (
          <div className="bg-muted/50 border border-border rounded-xl p-4 space-y-3">
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
            >
              <option>Visa</option>
              <option>Mastercard</option>
              <option>American Express</option>
              <option>PayPal</option>
            </select>
            <input
              type="text"
              placeholder="Últimos 4 dígitos"
              maxLength={4}
              value={formData.last4}
              onChange={(e) => setFormData({ ...formData, last4: e.target.value.replace(/\D/g, "") })}
              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  setShowForm(false)
                  setFormData({ type: "Visa", last4: "" })
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleAddPayment}
                disabled={formData.last4.length !== 4}
              >
                Agregar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Button */}
      {!showForm && (
        <div className="px-4 pb-24">
          <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-5 h-5" />
            Agregar Método de Pago
          </Button>
        </div>
      )}
    </div>
  )
}
