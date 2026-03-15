"use client"

import { X, Users, Clock, Check, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppStore, type Service, type Pool } from "@/lib/store"
import { cn } from "@/lib/utils"

interface PoolsForServiceModalProps {
  service: Service
  onClose: () => void
  onJoinPool: (pool: Pool) => void
}

export function PoolsForServiceModal({ service, onClose, onJoinPool }: PoolsForServiceModalProps) {
  const { pools, currentUser } = useAppStore()

  const availablePools = pools.filter((p) => p.serviceId === service.id && p.status === "ABIERTO")

  const calculateSavings = (pool: Pool) => {
    const regularPrice = service.price
    const poolPrice = (pool.totalPrice ?? 0) / (pool.targetMembers ?? 1)
    return Math.round(((regularPrice - poolPrice) / regularPrice) * 100)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
      <div className="bg-background w-full max-w-md rounded-t-3xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Pools Disponibles</h2>
              <p className="text-sm text-muted-foreground">{service.name}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Info Banner */}
          <div className="bg-primary/10 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-primary mb-1">Ahorra comprando en grupo</h3>
                <p className="text-sm text-muted-foreground">
                  Unete a un Pool existente y comparte el costo con otros viajeros. El lider del grupo coordina todo por
                  ti.
                </p>
              </div>
            </div>
          </div>

          {/* Available Pools */}
          {availablePools.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No hay Pools activos</h3>
              <p className="text-sm text-muted-foreground mb-4">Se el primero en crear un Pool para este servicio</p>
              <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">Crear Pool</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {availablePools.map((pool) => {
                const progress = ((pool.currentMembers ?? 0) / (pool.targetMembers ?? 1)) * 100
                const savings = calculateSavings(pool)
                const pricePerPerson = Math.round((pool.totalPrice ?? 0) / (pool.targetMembers ?? 1))
                const isAlreadyMember = (pool.members ?? []).some((m) => m.name === currentUser.name)

                return (
                  <div key={pool.id} className="bg-card rounded-xl border border-border overflow-hidden">
                    {/* Pool Header */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">{pool.leader?.avatar ?? "👤"}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Lider: {pool.leader?.name ?? "No asignado"}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>Cierra en {pool.deadline}</span>
                            </div>
                          </div>
                        </div>
                        {savings > 0 && (
                          <Badge className="bg-green-100 text-green-700 border-0">-{savings}% ahorro</Badge>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Progreso del grupo</span>
                          <span className="font-medium text-foreground">
                            {pool.currentMembers}/{pool.targetMembers} personas
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Members */}
                      <div className="flex items-center gap-1 mb-3">
                       {(pool.members ?? []).slice(0, 5).map((member, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium -ml-1 first:ml-0 border-2 border-card",
                              member.paid ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                            )}
                          >
                            {member.avatar}
                          </div>
                        ))}
                        {((pool.targetMembers ?? 0) - (pool.currentMembers ?? 0)) > 0 && (
                          <div className="w-7 h-7 rounded-full bg-border border-2 border-dashed border-muted-foreground flex items-center justify-center text-xs text-muted-foreground -ml-1">
                            +{(pool.targetMembers ?? 0) - (pool.currentMembers ?? 0)}
                          </div>
                        )}
                      </div>

                      {/* Price and Action */}
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground">Precio por persona</p>
                          <p className="text-xl font-bold text-primary">${pricePerPerson}</p>
                        </div>
                        {isAlreadyMember ? (
                          <Button disabled className="bg-muted text-muted-foreground">
                            <Check className="w-4 h-4 mr-1" />
                            Ya estas unido
                          </Button>
                        ) : (
                          <Button
                            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                            onClick={() => onJoinPool(pool)}
                          >
                            Unirme al Pool
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
