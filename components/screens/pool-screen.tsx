"use client"

import { useState, useEffect, useMemo } from "react"
import { Users, Clock, MapPin, ChevronRight, Zap, Share2, Plus, Check, Sparkles, Bell, Trash2, MessageCircle, Car, Repeat, ShieldCheck, Navigation2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn, formatImageUrl, handleImageFallback } from "@/lib/utils"
import { useAppStore, type Pool, type Service } from "@/lib/store"
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
  const [modalService, setModalService] = useState<Service | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("FOR_YOU")
  const [activeSection, setActiveSection] = useState<"POOLS" | "MY_ROUTES">("POOLS")

  const { 
    pools, 
    joinPool, 
    currentUser, 
    fetchPools, 
    fetchServices, 
    services,
    registeredPoolInterests = [],
    fetchMyPoolInterests,
    removePoolInterest,
    lastMapCategory, 
    lastMapSuperCategory,
    myUserRoutes = [],
    fetchMyUserRoutes,
    deleteUserRoute,
  } = useAppStore()

  useEffect(() => {
    fetchPools();    // Trae los pools reales de https://palenquego.com/api/v1/pools/
    fetchServices(); // Trae las rutas reales para el modal de "+"
    fetchMyPoolInterests();
    if (fetchMyUserRoutes) {
      fetchMyUserRoutes();
    }
  }, [fetchPools, fetchServices, fetchMyPoolInterests, fetchMyUserRoutes]);

  const myInterestedServices = useMemo(() => {
    return services.filter((s) => (registeredPoolInterests || []).includes(s.id))
  }, [services, registeredPoolInterests])

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

  // Categorías de pools disponibles
  const poolCategories = useMemo(() => {
    const cats = new Set<string>()
    pools.forEach((p) => {
      if (p.category && p.category.trim()) cats.add(p.category.trim())
    })
    return Array.from(cats)
  }, [pools])

  // Pools filtrados dinámicamente según interacción en el mapa o pestaña seleccionada
  const filteredPools = useMemo(() => {
    if (selectedCategory === "ALL") return pools

    if (selectedCategory === "FOR_YOU" && (lastMapCategory || lastMapSuperCategory)) {
      const target = (lastMapCategory || "").toLowerCase()
      const superTarget = (lastMapSuperCategory || "").toLowerCase()
      const matched = pools.filter((p) => {
        const cat = (p.category || "").toLowerCase()
        const name = (p.serviceName || "").toLowerCase()
        const loc = (p.location || "").toLowerCase()
        return cat.includes(target) || name.includes(target) || loc.includes(target) ||
               (superTarget === "tour" && (cat.includes("tour") || cat.includes("experiencia"))) ||
               (superTarget === "urbano" && (cat.includes("urbano") || cat.includes("ciudad"))) ||
               (superTarget === "interurbano" && (cat.includes("interurbano") || cat.includes("ruta") || cat.includes("montaña")))
      })
      if (matched.length > 0) return matched
    }

    if (selectedCategory !== "ALL" && selectedCategory !== "FOR_YOU") {
      return pools.filter((p) => p.category === selectedCategory)
    }

    return pools
  }, [pools, selectedCategory, lastMapCategory, lastMapSuperCategory])

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
    <div className="flex flex-col pb-28">
      <HeaderWithMenu title="Mis Viajes" subtitle="Pools grupales y tus rutas privadas" onNavigate={onNavigate} />
      
      {/* Selector de Pestañas: Pools Grupales vs Mis Rutas */}
      <div className="px-4 py-2.5 flex items-center gap-2 border-b border-border bg-white sticky top-0 z-20 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveSection("POOLS")}
          className={cn(
            "flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95",
            activeSection === "POOLS"
              ? "bg-[#064e3b] text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <Users className="w-4 h-4" />
          <span>Pools en Grupo ({pools.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("MY_ROUTES")}
          className={cn(
            "flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95",
            activeSection === "MY_ROUTES"
              ? "bg-[#064e3b] text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <Car className="w-4 h-4" />
          <span>Mis Rutas ({myUserRoutes?.length || 0})</span>
        </button>
      </div>

      {activeSection === "POOLS" && (
        <>
          <div className="px-4 py-3 flex items-center justify-between border-b border-border">
            <p className="text-muted-foreground text-sm">Ahorra compartiendo gastos en grupo</p>
            <Button
              size="icon"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-sm"
              onClick={() => setShowCreateModal(true)}
              title="Armar un nuevo Pool"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>

      {/* Stats */}
      <div className="px-4 py-3">
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
            <p className="text-xs text-muted-foreground">Comisión líder</p>
          </div>
        </div>
      </div>

      {/* Banner de recomendación dinámica de mapa */}
      {lastMapCategory && (
        <div className="mx-4 mb-2 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-950">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">
              Pools sugeridos según tu mapa: <strong>{lastMapCategory}</strong>
            </span>
          </div>
          {selectedCategory !== "ALL" && (
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className="text-[11px] font-bold text-emerald-700 underline shrink-0 ml-2"
            >
              Ver todos
            </button>
          )}
        </div>
      )}

      {/* Píldoras de Filtro Dinámico */}
      <div className="px-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {/* Píldora Mis Intereses (Me interesa) */}
        <button
          type="button"
          onClick={() => setSelectedCategory("MY_INTERESTS")}
          className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedCategory === "MY_INTERESTS"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200/90 hover:bg-emerald-100"
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Mis Intereses ({myInterestedServices.length})</span>
        </button>

        {(lastMapCategory || lastMapSuperCategory) && (
          <button
            type="button"
            onClick={() => setSelectedCategory("FOR_YOU")}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
              selectedCategory === "FOR_YOU"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Para ti</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setSelectedCategory("ALL")}
          className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
            selectedCategory === "ALL"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Todos ({pools.length})
        </button>
        {poolCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Active Pools or My Interests */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg text-foreground">
            {selectedCategory === "MY_INTERESTS"
              ? "Mis Intereses de Viaje (Espera de Grupo)"
              : selectedCategory === "FOR_YOU" && lastMapCategory
              ? `Pools en ${lastMapCategory}`
              : selectedCategory === "ALL"
              ? "Todos los Pools Activos"
              : `Pools de ${selectedCategory}`}
          </h2>
          <span className="text-xs text-muted-foreground font-medium">
            {selectedCategory === "MY_INTERESTS"
              ? `${myInterestedServices.length} en espera`
              : `${filteredPools.length} ${filteredPools.length === 1 ? 'grupo' : 'grupos'}`}
          </span>
        </div>

        {selectedCategory === "MY_INTERESTS" ? (
          myInterestedServices.length === 0 ? (
            <div className="bg-muted/30 border border-dashed border-border rounded-2xl p-6 text-center space-y-3 mt-2">
              <Bell className="w-8 h-8 text-emerald-600 mx-auto opacity-70" />
              <h3 className="font-bold text-foreground text-sm">
                No tienes viajes en tu lista de espera
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Cuando estés en la sección <strong>Explorar</strong> o en el <strong>Mapa</strong> y veas una experiencia o ruta que te guste, toca <strong>"Me interesa"</strong>. Te notificaremos al celular y por correo cuando se arme el grupo con hasta 20% de descuento.
              </p>
              <Button
                onClick={() => onNavigate?.("rutas")}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs gap-1.5"
              >
                <span>Explorar Experiencias</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {myInterestedServices.map((service) => {
                const precioBase = Number(service.precio_base || service.price || 0)
                const precioPool = precioBase > 0 ? precioBase * 0.8 : 0
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
                  `¡Hola! Me interesa este viaje en Palenque Go: "${service.nombre || service.name}". Si nos unimos en grupo obtenemos hasta 20% de descuento. Míralo aquí: https://palenquego.com/s/${service.id}`
                )}`

                return (
                  <div
                    key={service.id}
                    className="bg-card rounded-2xl p-4 shadow-sm border border-emerald-100/90 hover:border-emerald-300 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex gap-3.5">
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                        <img
                          src={formatImageUrl(service.imagen_cloudinary_url || service.imagen_principal || service.image || service.portada)}
                          alt={service.nombre || service.name}
                          className="w-full h-full object-cover"
                          onError={handleImageFallback}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {service.categoria?.nombre || service.category || "Experiencia"}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            -20% en Grupo
                          </span>
                        </div>
                        <h3 className="font-bold text-foreground text-sm truncate">
                          {service.nombre || service.name}
                        </h3>
                        <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{service.ubicacion || service.location || "El Salvador"}</span>
                        </div>

                        {precioBase > 0 && (
                          <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-sm font-black text-emerald-700">
                              ${precioPool.toFixed(2)}
                            </span>
                            <span className="text-xs text-muted-foreground line-through">
                              ${precioBase.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-emerald-800 font-semibold">tarifa pool</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Estado de espera y notificación */}
                    <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-xl p-2.5 text-[11px] text-emerald-950 flex items-start gap-2">
                      <Bell className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <p className="leading-snug">
                        <strong>En espera de grupo:</strong> Te avisaremos con sonido al celular y correo cuando otros viajeros se sumen para activar la tarifa grupal.
                      </p>
                    </div>

                    {/* Botones de acción: WhatsApp, Crear Pool, Desmarcar */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors shadow-2xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Invitar amigos</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setModalService(service)
                          setShowCreateModal(true)
                        }}
                        className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Armar Pool</span>
                      </button>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removePoolInterest(service.id)}
                        className="text-[10px] text-muted-foreground hover:text-red-600 transition-colors flex items-center gap-1 py-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Ya no me interesa</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : filteredPools.length === 0 ? (
          <div className="bg-muted/30 border border-dashed border-border rounded-2xl p-6 text-center space-y-3 mt-2">
            <Sparkles className="w-8 h-8 text-primary mx-auto opacity-70" />
            <h3 className="font-bold text-foreground text-sm">
              No hay pools abiertos en {selectedCategory === "FOR_YOU" ? (lastMapCategory || "esta categoría") : selectedCategory}
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              ¡Sé el primer líder en armar un grupo para esta experiencia y gana el 7% de comisión!
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Armar el primer Pool</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPools.map((pool) => {
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
                        src={formatImageUrl(pool.image)}
                        alt={pool.serviceName}
                        className="w-full h-full object-cover"
                        onError={handleImageFallback}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 inline-block mb-1">
                            {pool.category || "Experiencia"}
                          </span>
                          <h3 className="font-semibold text-foreground truncate">{pool.serviceName}</h3>
                        </div>
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
      )}
      </div>

      {/* How it works */}
      <div className="px-4 pb-24">
        <h2 className="font-semibold text-lg mb-4 text-foreground">¿Cómo funciona?</h2>
        <div className="bg-muted rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </>
  )}

      {/* SECCIÓN MIS RUTAS & TRASLADOS PRIVADOS */}
      {activeSection === "MY_ROUTES" && (
        <div className="px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Tus Rutas y Traslados</h3>
              <p className="text-xs text-gray-500">Tus viajes privados creados con tarifa propuesta</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.("map-explorer")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#064e3b] text-white font-bold text-xs shadow-xs hover:bg-[#043324] transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Ruta</span>
            </button>
          </div>

          {(!myUserRoutes || myUserRoutes.length === 0) ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-[#064e3b] flex items-center justify-center">
                <Navigation2 className="w-7 h-7 rotate-45" />
              </div>
              <h4 className="font-bold text-gray-800 text-sm">No tienes rutas creadas aún</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                Diseña traslados personalizados punto a punto en el mapa y negocia tu propia tarifa con choferes cercanos.
              </p>
              <Button
                onClick={() => onNavigate?.("map-explorer")}
                className="bg-[#064e3b] hover:bg-[#043324] text-white font-bold text-xs rounded-xl"
              >
                Diseñar Ruta en el Mapa
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {myUserRoutes.map((route: any) => {
                const estado = route.estado_viaje || 'BORRADOR'
                const stops = route.stops || []
                const origin = stops[0]?.name || "Origen"
                const destination = stops[stops.length - 1]?.name || "Destino"
                const isIdaVuelta = route.tipo_viaje === 'IDA_Y_VUELTA'
                const displayPrice = route.precio_ofertado || route.price_one_way

                return (
                  <div
                    key={route.id}
                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                          <h4 className="text-sm font-bold text-gray-900">{route.name}</h4>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                            isIdaVuelta ? "bg-purple-50 text-purple-700 border border-purple-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                          )}>
                            {isIdaVuelta ? <Repeat className="w-2.5 h-2.5" /> : <Car className="w-2.5 h-2.5" />}
                            {isIdaVuelta ? "Ida y Retorno" : "Solo Ida"}
                          </span>
                        </div>

                        {displayPrice && (
                          <div className="flex items-center gap-1.5 text-xs pt-1">
                            <span className="text-gray-500 font-medium">Tarifa ofertada:</span>
                            <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              ${displayPrice}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Badge de estado */}
                      <div className="shrink-0">
                        {estado === 'SOLICITADO' && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Buscando Chofer
                          </span>
                        )}
                        {estado === 'ACEPTADO' && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Chofer Asignado
                          </span>
                        )}
                        {estado === 'EN_CURSO' && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Navigation2 className="w-3 h-3 text-blue-600" />
                            En Curso
                          </span>
                        )}
                        {estado === 'FINALIZADO' && (
                          <span className="text-[10px] font-bold text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                            Finalizado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Origen y Destino */}
                    <div className="bg-gray-50/80 rounded-xl p-2.5 text-xs space-y-1.5 border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate"><strong>Desde:</strong> {origin}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="truncate"><strong>Hasta:</strong> {destination}</span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center justify-between pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigate?.("map-explorer")}
                        className="text-xs font-semibold gap-1.5 rounded-xl border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                      >
                        <Navigation2 className="w-3.5 h-3.5 rotate-45" />
                        Ver en Mapa
                      </Button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm("¿Deseas eliminar esta ruta?")) {
                            await deleteUserRoute?.(route.id)
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                        title="Eliminar ruta"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-[11px]">Eliminar</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Pool Modal */}
      {showCreateModal && (
        <CreatePoolModal
          service={modalService || undefined}
          onClose={() => {
            setShowCreateModal(false)
            setModalService(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setModalService(null)
            fetchPools()
          }}
        />
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
          src={formatImageUrl(currentPool.image)}
          alt={currentPool.serviceName}
          className="w-full h-full object-cover"
          onError={handleImageFallback}
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
