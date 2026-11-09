"use client"

import { useState } from "react"
import { X, AlertCircle, Check, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface PoolPaymentModalProps {
  poolId: number
  poolName: string
  totalPrice: number
  targetMembers: number
  currentMembers: number
  onClose: () => void
  onSuccess?: () => void
}

export function PoolPaymentModal({
  poolId,
  poolName,
  totalPrice,
  targetMembers,
  currentMembers,
  onClose,
  onSuccess,
}: PoolPaymentModalProps) {
  const [paymentType, setPaymentType] = useState<"FULL" | "PERSONAL" | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [showPaymentGateway, setShowPaymentGateway] = useState(false)
  const [paymentStep, setPaymentStep] = useState<"selection" | "gateway" | "success">("selection")
  const payPool = useAppStore((state) => state.payPool)

  const pricePerMember = totalPrice / targetMembers
  const remainingSpots = targetMembers - currentMembers
  const fullPoolPrice = totalPrice
  const personalPrice = pricePerMember

  const handlePayment = async () => {
    if (!paymentType) return

    setPaymentStep("gateway")
    // Simular procesamiento de pago en pasarela
    await new Promise((resolve) => setTimeout(resolve, 2500))

    payPool(poolId, paymentType)
    setPaymentStep("success")

    // Mostrar notificación de éxito
    onSuccess?.()
    setTimeout(onClose, 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-sm w-full shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4 flex items-center justify-between text-primary-foreground">
          <h2 className="text-xl font-bold">Completar Pago</h2>
          <button
            onClick={onClose}
            disabled={processingPayment}
            className="p-1 hover:bg-primary-foreground/10 rounded-lg transition disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {paymentStep === "gateway" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg">Procesando Pago Seguro</h3>
              <p className="text-sm text-muted-foreground text-center">
                Tu transacción está siendo procesada de forma segura...
              </p>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full animate-pulse"></div>
              </div>
            </div>
          )}

          {paymentStep === "success" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-bold text-lg text-green-600 dark:text-green-400">¡Pago Exitoso!</h3>
              <p className="text-sm text-muted-foreground text-center">
                Tu {paymentType === "FULL" ? "pool completo" : "cupo"} ha sido reservado correctamente.
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Recibirás tu código QR y confirmación por email en breve.
              </p>
            </div>
          )}

          {paymentStep === "selection" && (
            <>
              {/* Pool Info */}
              <div className="bg-muted p-4 rounded-xl space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Servicio</p>
                  <p className="font-bold text-lg">{poolName}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="text-muted-foreground">Participantes</p>
                    <p className="font-bold text-primary">{currentMembers}/{targetMembers}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Por persona</p>
                    <p className="font-bold">${pricePerMember.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cupos libres</p>
                    <p className="font-bold text-secondary">{remainingSpots}</p>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex gap-3">
                <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold mb-1">Importante:</p>
                  <p>Una vez completado el pago, no hay reembolsos. El Anfitrión estará protegido al 100%.</p>
                </div>
              </div>

              {/* Payment Options */}
              <div className="space-y-3">
                <label className="text-sm font-semibold">Elige tu opción de pago:</label>

                {/* Option 1: Pay Full Pool */}
                <button
                  onClick={() => setPaymentType("FULL")}
                  disabled={processingPayment}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition text-left disabled:opacity-50",
                    paymentType === "FULL"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold">Pagar Pool Completo</p>
                      <p className="text-sm text-muted-foreground">Apartar todos los {remainingSpots} cupos restantes</p>
                    </div>
                    {paymentType === "FULL" && <Check size={20} className="text-primary" />}
                  </div>
                  <div className="bg-primary/10 rounded px-2 py-1 w-fit">
                    <p className="text-sm font-bold text-primary">
                      ${(pricePerMember * remainingSpots).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Cada participante te pagará ${pricePerMember.toFixed(2)} por separado
                  </p>
                </button>

                {/* Option 2: Pay Personal Spot */}
                <button
                  onClick={() => setPaymentType("PERSONAL")}
                  disabled={processingPayment}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition text-left disabled:opacity-50",
                    paymentType === "PERSONAL"
                      ? "border-secondary bg-secondary/10"
                      : "border-border hover:border-secondary/50",
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold">Pagar Mi Cupo</p>
                      <p className="text-sm text-muted-foreground">Solo tu participación en el pool</p>
                    </div>
                    {paymentType === "PERSONAL" && <Check size={20} className="text-secondary" />}
                  </div>
                  <div className="bg-secondary/10 rounded px-2 py-1 w-fit">
                    <p className="text-sm font-bold text-secondary">${pricePerMember.toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Los otros participantes pagarán su cupo directamente
                  </p>
                </button>
              </div>

              {/* Info Boxes */}
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Lock size={16} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <p className="font-semibold">Protección Garantizada</p>
                    <p>Tu pago está 100% seguro y protegido</p>
                  </div>
                </div>
              </div>

              {/* QR Code Info */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                  Después del pago recibirás:
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>Código QR individual para acceso</li>
                  <li>Confirmación de reserva</li>
                  <li>Detalles de encuentro</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-border">
                <Button
                  onClick={handlePayment}
                  disabled={!paymentType || processingPayment}
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {processingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                      Procesando...
                    </>
                  ) : (
                    `Confirmar Pago - $${paymentType === "FULL" ? (pricePerMember * remainingSpots).toFixed(2) : pricePerMember.toFixed(2)}`
                  )}
                </Button>
                <Button onClick={onClose} variant="outline" size="lg" className="w-full bg-transparent" disabled={processingPayment}>
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
