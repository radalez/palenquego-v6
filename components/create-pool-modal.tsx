"use client"

import { useState } from "react"
import { X, Users, Calendar, Clock, ChevronRight, Check, Share2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAppStore, type Service, type Pool } from "@/lib/store"

interface CreatePoolModalProps {
  service?: Service
  onClose: () => void
  onSuccess?: (pool: Pool) => void
}

type CreatePoolStep = "select-service" | "config" | "confirm" | "success"

export function CreatePoolModal({ service: initialService, onClose, onSuccess }: CreatePoolModalProps) {
  const [step, setStep] = useState<CreatePoolStep>(initialService ? "config" : "select-service")
  const [selectedService, setSelectedService] = useState<Service | null>(initialService || null)
  const [targetMembers, setTargetMembers] = useState(4)
  const [selectedDate, setSelectedDate] = useState("")
  const [createdPool, setCreatedPool] = useState<Pool | null>(null)

  const { services, createPool, currentUser } = useAppStore()

  const poolableServices = services.filter((s) => s.allowsPool)

  const dates = [
    { day: "Hoy", date: "15", month: "Ene" },
    { day: "Mar", date: "16", month: "Ene" },
    { day: "Mie", date: "17", month: "Ene" },
    { day: "Jue", date: "18", month: "Ene" },
    { day: "Vie", date: "19", month: "Ene" },
  ]

  // Busca handleCreatePool en create-pool-modal.tsx:
  // Busca handleCreatePool en create-pool-modal.tsx
  const handleCreatePool = async () => {
    if (!selectedService || !selectedDate) return

    // Pasamos 4 argumentos ahora: id, meta, fecha y PRECIO
    const success = await createPool(
      selectedService.id, 
      targetMembers, 
      selectedDate, 
      selectedService.price // <--- MANDAMOS EL PRECIO AQUÍ
    )

    if (success) {
      setStep("success")
    } else {
      alert("Error al crear el pool en el servidor")
    }
  }

  const pricePerPerson = selectedService ? selectedService.price : 0

  const leaderCommission = selectedService ? (selectedService.price * targetMembers * 0.07).toFixed(0) : 0

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
      <div className="bg-background w-full max-w-md rounded-t-3xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 px-4 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {step === "select-service" && "Seleccionar Servicio"}
            {step === "config" && "Configurar Pool"}
            {step === "confirm" && "Confirmar Pool"}
            {step === "success" && "Pool Creado"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Step: Select Service */}
        {step === "select-service" && (
          <div className="p-4 space-y-4">
            <p className="text-muted-foreground text-sm">Selecciona un servicio para crear un grupo de compra</p>

            <div className="space-y-3">
              {poolableServices.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => {
                    setSelectedService(svc)
                    setStep("config")
                  }}
                  className="w-full flex items-center gap-4 p-3 bg-card rounded-xl border border-border hover:border-primary transition-colors text-left"
                >
                  <img
                    src={svc.image || "/placeholder.svg"}
                    alt={svc.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{svc.name}</h3>
                    <p className="text-sm text-muted-foreground">{svc.location}</p>
                    <p className="text-primary font-semibold">${svc.price}/persona</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Config */}
        {step === "config" && selectedService && (
          <div className="p-4 space-y-6">
            {/* Service Summary */}
            <div className="flex gap-4 p-3 bg-muted rounded-xl">
              <img
                src={selectedService.image || "/placeholder.svg"}
                alt={selectedService.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div>
                <h3 className="font-semibold text-foreground">{selectedService.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedService.location}</p>
                <p className="text-lg font-bold text-primary">${selectedService.price}/persona</p>
              </div>
            </div>

            {/* Target Members */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Users className="w-4 h-4 inline mr-2" />
                Meta de personas
              </label>
              <p className="text-xs text-muted-foreground mb-3">Cuantas personas necesitas para completar el grupo</p>
              <div className="flex items-center gap-4 bg-muted rounded-xl p-3">
                <button
                  onClick={() => setTargetMembers(Math.max(2, targetMembers - 1))}
                  className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-xl font-bold"
                  disabled={targetMembers <= 2}
                >
                  -
                </button>
                <span className="text-3xl font-bold text-foreground flex-1 text-center">{targetMembers}</span>
                <button
                  onClick={() => setTargetMembers(Math.min(selectedService.capacityMax || 10, targetMembers + 1))}
                  className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-xl font-bold"
                  disabled={targetMembers >= (selectedService.capacityMax || 10)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Calendar className="w-4 h-4 inline mr-2" />
                Fecha del servicio
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dates.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(`${d.date} ${d.month}`)}
                    className={cn(
                      "flex flex-col items-center px-4 py-3 rounded-xl min-w-[70px] transition-all",
                      selectedDate === `${d.date} ${d.month}`
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <span className="text-xs">{d.day}</span>
                    <span className="text-lg font-bold">{d.date}</span>
                    <span className="text-xs">{d.month}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Preview */}
            <div className="bg-primary/10 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Precio por persona</span>
                <span className="font-semibold text-foreground">${pricePerPerson}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total del grupo</span>
                <span className="font-semibold text-foreground">${pricePerPerson * targetMembers}</span>
              </div>
              <div className="pt-2 border-t border-primary/20 flex justify-between">
                <span className="text-primary font-medium">Tu comision (7%)</span>
                <span className="font-bold text-primary">${leaderCommission}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-xl bg-transparent"
                onClick={() => setStep("select-service")}
              >
                Atras
              </Button>
              <Button
                className="flex-1 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                onClick={() => setStep("confirm")}
                disabled={!selectedDate}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && selectedService && (
          <div className="p-4 space-y-6">
            <div className="bg-muted rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-foreground">Resumen del Pool</h3>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Servicio</span>
                <span className="text-foreground font-medium">{selectedService.name}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ubicacion</span>
                <span className="text-foreground font-medium">{selectedService.location}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fecha</span>
                <span className="text-foreground font-medium">{selectedDate}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Meta de personas</span>
                <span className="text-foreground font-medium">{targetMembers}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Precio por persona</span>
                <span className="text-foreground font-medium">${pricePerPerson}</span>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-foreground">Total del grupo</span>
                  <span className="text-xl font-bold text-foreground">${pricePerPerson * targetMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary font-medium">Tu comision estimada</span>
                  <span className="font-bold text-primary">${leaderCommission}</span>
                </div>
              </div>
            </div>

            <div className="bg-secondary/10 rounded-xl p-4">
              <p className="text-sm text-foreground">
                <strong>Como lider del Pool:</strong>
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>- Recibiras el 7% de comision al completar el grupo</li>
                <li>- Tu pago queda reservado hasta llenar el grupo</li>
                <li>- Tienes 24 horas para completar el Pool</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-xl bg-transparent"
                onClick={() => setStep("config")}
              >
                Atras
              </Button>
              <Button
                className="flex-1 h-14 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl font-semibold"
                onClick={handleCreatePool}
              >
                Crear Pool
              </Button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && createdPool && (
          <div className="p-4 space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-primary" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Pool Creado Exitosamente</h3>
              <p className="text-muted-foreground">Ahora comparte el enlace para llenar tu grupo</p>
            </div>

            {/* Share Card */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={createdPool.image || "/placeholder.svg"}
                  alt={createdPool.serviceName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="text-left">
                  <h4 className="font-semibold text-foreground">{createdPool.serviceName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {createdPool.currentMembers ?? 0}/{createdPool.targetMembers ?? 0} personas
                  </p>
                  <p className="text-primary font-semibold">
                    ${((createdPool.totalPrice ?? 0) / (createdPool.targetMembers ?? 1)).toFixed(0)}/persona
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl bg-transparent"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Unete a mi Pool en Palenque Go: ${createdPool.serviceName} - $${((createdPool.totalPrice ?? 0) / (createdPool.targetMembers ?? 1)).toFixed(0)}/persona`,
                    )
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
                <Button className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartir
                </Button>
              </div>
            </div>

            <div className="bg-muted rounded-xl p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-secondary" />
                <span className="font-medium text-foreground">Tiempo restante</span>
              </div>
              <p className="text-2xl font-bold text-secondary">{createdPool.deadline}</p>
              <p className="text-sm text-muted-foreground">para completar el grupo</p>
            </div>

            <Button
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-semibold"
              onClick={onClose}
            >
              Ver mi Pool
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
