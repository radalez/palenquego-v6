"use client"

import { useState } from "react"
import { Users, Clock, MapPin, ChevronRight, Zap, Share2, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAppStore, type Pool } from "@/lib/store"
import { CreatePoolModal } from "@/components/create-pool-modal"
import { HeaderWithMenu } from "@/components/header-with-menu"

interface PoolScreenProps {
  onOpenShare?: (pool: Pool) => void
  onOpenPayment?: (pool: Pool) => void
  onNavigate?: (tab: string) => void
}

export function PoolScreen({ onOpenShare, onOpenPayment, onNavigate }: PoolScreenProps) {
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { pools, joinPool, currentUser } = useAppStore()

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100
    if (percentage >= 100) return "bg-primary"
    if (percentage >= 75) return "bg-bamboo"
    return "bg-secondary"
  }

  const getStatusBadge = (status: Pool["status"]) => {
    switch (status) {
      case "ABIERTO":
        return <Badge className="bg-primary/20 text-primary border-0">Buscando gente</Badge>
      case "LLENO":
        return <Badge className="bg-secondary/20 text-secondary border-0">Grupo completo</Badge>
      case "PAGADO":
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-0">Confirmado</Badge>
      case "FINALIZADO":
        return <Badge className="bg-muted text-muted-foreground border-0">Finalizado</Badge>
    }
  }

const isUserInPool = (pool: Pool) => {
    return (pool.members ?? []).some((m) => m.name === currentUser.name)
  }

  
  if (selectedPool) {
    return (
      <PoolDetail
        pool={selectedPool}
        onBack={() => setSelectedPool(null)}
        onJoin={() => {
          joinPool(selectedPool.id)
          // Refresh the selected pool with updated data
          const updated = pools.find((p) => p.id === selectedPool.id)
          if (updated) setSelectedPool(updated)
        }}
        isUserInPool={isUserInPool(selectedPool)}
        onOpenShare={onOpenShare}
        onOpenPayment={onOpenPayment}
      />
    )
  }

  return (
    <div className="flex flex-col">
      <HeaderWithMenu title="Pool Palenque" onNavigate={onNavigate} />
      
      <div className="px-4 py-3 flex items-center justify-between border-b border-border">
        <p className="text-muted-foreground text-sm">Ahorra compartiendo gastos</p>
        <Button
          size="icon"
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Stats */}
      <div className="px-4 py-4">
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center justify-around">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{pools.length}</p>
            <p className="text-xs text-muted-foreground">Pools activos</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary">$127</p>
            <p className="text-xs text-muted-foreground">Ahorrado</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">7%</p>
            <p className="text-xs text-muted-foreground">Comision lider</p>
          </div>
        </div>
      </div>

      {/* Active Pools */}
      <div className="px-4 py-6">
        <h2 className="font-semibold text-lg mb-4 text-foreground">Pools Activos</h2>

        <div className="space-y-4">
          {pools.map((pool) => {
            const progress = ((pool.currentMembers ?? 0) / (pool.targetMembers ?? 1)) * 100
            const pricePerPerson = (pool.totalPrice ?? 0) / (pool.targetMembers ?? 1)

            return (
              <button
                key={pool.id}
                onClick={() => setSelectedPool(pool)}
                className="w-full bg-card rounded-2xl p-4 shadow-sm border border-border text-left transition-all hover:shadow-md"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={pool.image || "/placeholder.svg"}
                      alt={pool.serviceName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-foreground truncate pr-2">{pool.serviceName}</h3>
                      {getStatusBadge(pool.status)}
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>{pool.location}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>
                            {pool.currentMembers}/{pool.targetMembers} personas
                          </span>
                        </div>
                        {pool.status === "ABIERTO" && (
                          <div className="flex items-center gap-1 text-secondary">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{pool.deadline}</span>
                          </div>
                        )}
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            getProgressColor(pool.currentMembers ?? 0, pool.targetMembers ?? 1),
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-foreground">${pricePerPerson.toFixed(0)}</span>
                        <span className="text-muted-foreground text-sm"> / persona</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="px-4 pb-6">
        <h2 className="font-semibold text-lg mb-4 text-foreground">Como funciona?</h2>
        <div className="bg-muted rounded-2xl p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-semibold text-sm">1</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Crea o unete a un Pool</p>
              <p className="text-sm text-muted-foreground">Encuentra un grupo o inicia uno nuevo</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-semibold text-sm">2</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Comparte y llena el grupo</p>
              <p className="text-sm text-muted-foreground">El lider gana 7% de comision por cada miembro</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-secondary-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Todos ahorran!</p>
              <p className="text-sm text-muted-foreground">Division equitativa, experiencia compartida</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Pool Modal */}
      {showCreateModal && (
        <CreatePoolModal onClose={() => setShowCreateModal(false)} onSuccess={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}

function PoolDetail({
  pool,
  onBack,
  onJoin,
  isUserInPool,
  onOpenShare,
  onOpenPayment,
}: {
  pool: Pool
  onBack: () => void
  onJoin: () => void
  isUserInPool: boolean
  onOpenShare?: (pool: Pool) => void
  onOpenPayment?: (pool: Pool) => void
}) {
  const { pools } = useAppStore()
  // Get fresh pool data
  const currentPool = pools.find((p) => p.id === pool.id) || pool

 const progress = ((currentPool.currentMembers ?? 0) / (currentPool.targetMembers ?? 1)) * 100
  const pricePerPerson = (currentPool.totalPrice ?? 0) / (currentPool.targetMembers ?? 1)
  const spotsLeft = (currentPool.targetMembers ?? 0) - (currentPool.currentMembers ?? 0)

  return (
    <div className="flex flex-col min-h-full">
      {/* Header Image */}
      <div className="relative h-48">
        <img
          src={currentPool.image || "/placeholder.svg"}
          alt={currentPool.serviceName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <ChevronRight className="w-6 h-6 text-white rotate-180" />
        </button>
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-xl font-bold text-white mb-1">{currentPool.serviceName}</h1>
          <div className="flex items-center gap-1 text-white/80 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{currentPool.location}</span>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-4 -mt-4">
        <div className="bg-card rounded-2xl p-5 shadow-lg border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-muted-foreground text-sm">Progreso del grupo</p>
              <p className="text-2xl font-bold text-foreground">
                {currentPool.currentMembers}/{currentPool.targetMembers} personas
              </p>
            </div>
            {currentPool.status === "ABIERTO" && (
              <div className="text-right">
                <p className="text-muted-foreground text-sm">Tiempo restante</p>
                <p className="text-xl font-bold text-secondary">{currentPool.deadline}</p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500 relative"
                style={{ width: `${progress}%` }}
              >
                {progress >= 20 && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {progress.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {spotsLeft > 0 ? `Faltan solo ${spotsLeft} persona${spotsLeft > 1 ? "s" : ""}!` : "Grupo completo!"}
            </p>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
            <div>
              <p className="text-muted-foreground text-sm">Tu precio</p>
              <p className="text-2xl font-bold text-primary">${pricePerPerson.toFixed(0)}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-sm">Precio original</p>
              <p className="text-lg text-muted-foreground line-through">${currentPool.totalPrice}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="px-4 py-6">
        <h2 className="font-semibold text-lg mb-4 text-foreground">Miembros del grupo</h2>
        <div className="space-y-3">
          { (currentPool.members ?? []).map((member, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">{member.avatar}</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{member.name}</p>
                  {i === 0 && (
                    <Badge variant="outline" className="text-xs mt-1 border-secondary text-secondary">
                      Lider
                    </Badge>
                  )}
                </div>
              </div>
              {member.paid ? (
                <div className="flex items-center gap-1 text-emerald-600">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Pagado</span>
                </div>
              ) : (
                <Badge className="bg-amber-500/20 text-amber-600 border-0">Pendiente</Badge>
              )}
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: spotsLeft }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center justify-center p-3 border-2 border-dashed border-border rounded-xl"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-5 h-5" />
                <span className="text-sm">Cupo disponible</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-6 mt-auto space-y-3">
        <Button 
          onClick={() => onOpenShare?.(currentPool)}
          className="w-full h-14 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl text-lg font-semibold"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Invitar amigos
        </Button>
        {currentPool.status === "ABIERTO" && !isUserInPool && (
          <Button
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-semibold"
            onClick={onJoin}
          >
            Unirme al Pool - ${pricePerPerson.toFixed(0)}
          </Button>
        )}
        {currentPool.status === "ABIERTO" && isUserInPool && (
          <Button className="w-full h-14 bg-muted text-muted-foreground rounded-xl text-lg font-semibold" disabled>
            Ya estas en este Pool
          </Button>
        )}
        {currentPool.status === "LLENO" && (
          <Button 
            onClick={() => onOpenPayment?.(currentPool)}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-semibold"
          >
            Proceder al pago
          </Button>
        )}
      </div>
    </div>
  )
}
