"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion"
import { X, Heart, Info, MapPin, Users, HelpCircle, ChevronLeft, ChevronRight, Share2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, formatImageUrl, getRouteImageUrl, handleImageFallback } from "@/lib/utils"
import { useAppStore, type Service, type Pool } from "@/lib/store"
import { HeaderWithMenu } from "@/components/header-with-menu"
import { CreatePoolModal } from "@/components/create-pool-modal"

interface SwipeGoScreenProps {
  onNavigate?: (tab: string) => void
}

export function SwipeGoScreen({ onNavigate }: SwipeGoScreenProps) {
  const router = useRouter()
  const { 
    services, 
    pools, 
    addSwipeLike, 
    registerPoolInterest, 
    accessToken, 
    fetchServices, 
    fetchPools,
    routes,
    fetchRoutes,
    lastMapCategory,
    lastMapSuperCategory,
    lastMapDestination,
    userIntentions
  } = useAppStore()

  // Maintain deck state — con servicios y experiencias del mapa
  const [deck, setDeck] = useState<Service[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [registeredPools, setRegisteredPools] = useState<Set<number>>(new Set())
  const [deckFilter, setDeckFilter] = useState<"MAP_MATCH" | "ALL">("MAP_MATCH")
  const [poolModalService, setPoolModalService] = useState<Service | null>(null)

  // Modales/Tooltips
  const [showPoolTooltip, setShowPoolTooltip] = useState(false)
 
  // Cargar servicios, pools y rutas del API al montar
  useEffect(() => {
    fetchServices()
    fetchPools()
    if (fetchRoutes) fetchRoutes()
  }, [fetchServices, fetchPools, fetchRoutes])

  // Integrar servicios reales + tours y rutas del mapa para jugar en Go
  const allPlayableItems: Service[] = useMemo(() => {
    const routeServices: Service[] = (routes || [])
      .filter((r) => r.route_type === 'TOUR' || r.price_one_way)
      .map((r) => ({
        id: 100000 + r.id,
        name: r.name,
        category: r.category?.name || (r.route_type === 'TOUR' ? 'Tours & Experiencias' : 'Rutas Interurbanas'),
        location: 'El Salvador',
        price: Number(r.price_one_way) || 20,
        image: getRouteImageUrl(r),
        rating: 4.9,
        reviews: 12,
        allowsPool: true,
        spotsLeft: 14,
        poolDiscount: (r as any).descuento_pool || 20,
        description: (r as any).descripcion || r.name,
        features: ['Transporte Seguro', 'Grupo Pool', 'Ruta Verificada'],
      } as Service))

    return [...services, ...routeServices]
  }, [services, routes])

  // Generar mazo dinámico priorizando lo que el usuario exploró en el mapa
  const dynamicDeck = useMemo(() => {
    if (!lastMapCategory && !lastMapSuperCategory && !lastMapDestination) {
      return allPlayableItems
    }

    const cat = (lastMapCategory || "").toLowerCase()
    const superCat = (lastMapSuperCategory || "").toLowerCase()
    const dest = (lastMapDestination || "").toLowerCase()

    const isMapMatch = (s: Service) => {
      const sCat = (s.category || "").toLowerCase()
      const sName = (s.name || "").toLowerCase()
      const sLoc = (s.location || "").toLowerCase()
      const sDesc = (s.description || s.descripcion || "").toLowerCase()

      if (cat && (sCat.includes(cat) || sName.includes(cat) || sLoc.includes(cat) || sDesc.includes(cat))) return true
      if (dest && (sLoc.includes(dest) || sName.includes(dest))) return true
      if (superCat === "tour" && (sCat.includes("tour") || sCat.includes("experiencia") || sDesc.includes("tour"))) return true
      if (superCat === "urbano" && (sCat.includes("urbano") || sCat.includes("ciudad") || sCat.includes("centro"))) return true
      if (superCat === "interurbano" && (sCat.includes("interurbano") || sCat.includes("playa") || sCat.includes("montaña") || sCat.includes("ruta"))) return true
      return false
    }

    if (deckFilter === "MAP_MATCH") {
      const matched = allPlayableItems.filter(isMapMatch)
      const remaining = allPlayableItems.filter((s) => !isMapMatch(s))
      return matched.length > 0 ? [...matched, ...remaining] : allPlayableItems
    }

    return allPlayableItems
  }, [allPlayableItems, lastMapCategory, lastMapSuperCategory, lastMapDestination, deckFilter])

  // Cargar servicios en el deck cuando se calcule o cambie el mazo dinámico
  useEffect(() => {
    if (dynamicDeck.length > 0) {
      setDeck(dynamicDeck)
      setCurrentIndex(0)
    }
  }, [dynamicDeck])

  // Swipe logic
  const handleSwipe = (direction: "left" | "right") => {
    if (currentIndex >= deck.length) return
    
    const currentService = deck[currentIndex]
    
    if (direction === "right") {
      console.log(`Liked ${currentService.name} (service ID: ${currentService.id}) - registrando en favoritos`)
      addSwipeLike(currentService.id)
      
      const token = accessToken || localStorage.getItem('access_token')
      fetch(`/api-proxy/catalog/${currentService.id}/swipe/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ es_like: true })
      }).then(r => {
        if (!r.ok) console.warn(`Swipe backend error: ${r.status}`)
        else console.log(`✅ Swipe like registrado en backend para servicio ${currentService.id}`)
      }).catch(e => console.error("Swipe fetch error:", e))
    } else {
      const token = accessToken || localStorage.getItem('access_token')
      fetch(`/api-proxy/catalog/${currentService.id}/swipe/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ es_like: false })
      }).then(r => {
        if (!r.ok) console.warn(`Swipe backend error: ${r.status}`)
      }).catch(e => console.error("Swipe fetch error:", e))
    }

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1)
      setShowPoolTooltip(false)
    }, 200)
  }

  if (currentIndex >= deck.length && deck.length > 0) {
    return (
      <div className="flex flex-col h-full bg-background">
        <HeaderWithMenu title="Palenque Go" onNavigate={onNavigate} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">¡Has visto todo en esta categoría!</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            {deckFilter === "MAP_MATCH" && lastMapCategory
              ? `Has explorado los servicios relacionados a ${lastMapCategory}. Puedes cambiar a "Todos" para seguir descubriendo.`
              : "Vuelve más tarde para descubrir nuevos servicios, o revisa tus favoritos."}
          </p>
          <div className="flex gap-2 mt-4">
            {deckFilter === "MAP_MATCH" && (
              <Button onClick={() => setDeckFilter("ALL")}>Ver Todos los Servicios</Button>
            )}
            <Button variant="outline" onClick={() => setCurrentIndex(0)}>Volver a ver</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] overflow-hidden relative">
      <HeaderWithMenu title="Explorar Go" onNavigate={onNavigate} />

      {/* Banner / Selector Dinámico de Afinidades con el Mapa */}
      {(lastMapCategory || lastMapSuperCategory || lastMapDestination) && (
        <div className="px-4 pt-2.5 pb-1 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-1.5 bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-1 rounded-full text-xs text-emerald-950 font-medium shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate max-w-[210px]">
              Jugando con: <strong>{lastMapCategory || lastMapDestination || "Tus Rutas"}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setDeckFilter("MAP_MATCH")}
              className={`px-2.5 py-1 rounded-full font-bold transition-all ${
                deckFilter === "MAP_MATCH"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Para ti
            </button>
            <button
              type="button"
              onClick={() => setDeckFilter("ALL")}
              className={`px-2.5 py-1 rounded-full font-bold transition-all ${
                deckFilter === "ALL"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
          </div>
        </div>
      )}
      
      <div className="flex-1 relative flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <AnimatePresence>
          {deck.slice(currentIndex, currentIndex + 2).map((service, index) => {
            const isFront = index === 0
            return (
              <SwipeableServiceCard
                key={service.id}
                service={service}
                isFront={isFront}
                onSwipe={handleSwipe}
                onInfoClick={() => router.push(`/s/${service.id}`)}
                showPoolTooltip={isFront ? showPoolTooltip : false}
                setShowPoolTooltip={setShowPoolTooltip}
                pools={pools}
                onNavigate={onNavigate}
                registerPoolInterest={registerPoolInterest}
                registeredPools={registeredPools}
                setRegisteredPools={setRegisteredPools}
                onOpenCreatePool={(svc) => setPoolModalService(svc)}
                userIntentions={userIntentions}
              />
            )
          })}
        </AnimatePresence>
      </div>

      {/* Modal de Creación de Pool para el Servicio jugado */}
      {poolModalService && (
        <CreatePoolModal
          service={poolModalService}
          onClose={() => setPoolModalService(null)}
          onSuccess={() => setPoolModalService(null)}
        />
      )}

      {/* Manual Actions (only visible if there are cards) */}
      {currentIndex < deck.length && (
        <div className="h-[100px] flex items-center justify-center gap-6 pb-6 px-4 shrink-0 z-10 bg-gradient-to-t from-background via-background/80 to-transparent">
          <button
            onClick={() => handleSwipe("left")}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-red-100 hover:scale-105 active:scale-95 transition-all group"
          >
            <X className="w-8 h-8 text-red-500 group-hover:text-red-600" />
          </button>
          
          <button
            onClick={() => router.push(`/s/${deck[currentIndex].id}`)}
            className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100 hover:scale-105 active:scale-95 transition-all text-blue-500"
          >
            <Info className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => handleSwipe("right")}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-emerald-100 hover:scale-105 active:scale-95 transition-all group"
          >
            <Heart className="w-8 h-8 text-emerald-500 fill-emerald-100 group-hover:fill-emerald-200" />
          </button>
        </div>
      )}
    </div>
  )
}

interface SwipeableServiceCardProps {
  service: Service
  isFront: boolean
  onSwipe: (direction: "left" | "right") => void
  onInfoClick: () => void
  showPoolTooltip: boolean
  setShowPoolTooltip: (val: boolean) => void
  pools: Pool[]
  onNavigate?: (tab: string) => void
  registerPoolInterest: (serviceId: number) => Promise<boolean>
  registeredPools: Set<number>
  setRegisteredPools: React.Dispatch<React.SetStateAction<Set<number>>>
  onOpenCreatePool?: (service: Service) => void
  userIntentions?: any
}

function SwipeableServiceCard({
  service,
  isFront,
  onSwipe,
  onInfoClick,
  showPoolTooltip,
  setShowPoolTooltip,
  pools,
  onNavigate,
  registerPoolInterest,
  registeredPools,
  setRegisteredPools,
  onOpenCreatePool,
  userIntentions,
}: SwipeableServiceCardProps) {
  const x = useMotionValue(0)
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375

  const displayCapacity = service.capacityMax || 10
  const displayPrice = service.price || 0
  const discountPct = service.poolDiscount || service.discount || 20

  // Buscar pool activo asociado al servicio
  const activePool = service.allowsPool
    ? pools.find(p => p.serviceId === service.id && p.status === "ABIERTO")
    : undefined

  const spotsRemaining = activePool
    ? (activePool.targetMembers || 0) - (activePool.currentMembers || 0)
    : 0
  
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])
  
  // Like/Nope Overlay Opacities
  const likeOpacity = useTransform(x, [20, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-20, -100], [0, 1])

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100
    if (info.offset.x > threshold) {
      onSwipe("right")
    } else if (info.offset.x < -threshold) {
      onSwipe("left")
    }
  }

  // Galería de imágenes del servicio con saneamiento
  const gallery = service.galleryImages && service.galleryImages.length > 0
    ? service.galleryImages
    : [service.image || "/placeholder.svg"]
  const [photoIndex, setPhotoIndex] = useState(0)

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPhotoIndex((prev) => (prev + 1) % gallery.length)
  }
  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPhotoIndex((prev) => (prev - 1 + gallery.length) % gallery.length)
  }

  return (
    <motion.div
      style={{ x, rotate, opacity: isFront ? 1 : 0.8, scale: isFront ? 1 : 0.95 }}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ scale: isFront ? 1 : 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`absolute w-full max-w-[360px] h-full max-h-[600px] bg-white rounded-3xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing border border-border/50 ${isFront ? 'z-20' : 'z-10'}`}
    >
      {/* Photo Gallery Area */}
      <div className="relative w-full h-[48%] bg-zinc-900 group" onClick={onInfoClick}>
        <img 
          src={formatImageUrl(gallery[photoIndex])} 
          alt={service.name} 
          className="w-full h-full object-cover select-none pointer-events-none" 
          onError={handleImageFallback}
        />
        
        {/* Photo Navigation Overlays */}
        <div className="absolute top-0 left-0 w-1/2 h-full z-10" onClick={prevPhoto} />
        <div className="absolute top-0 right-0 w-1/2 h-full z-10" onClick={nextPhoto} />
        
        {/* Indicators */}
        <div className="absolute top-3 left-0 right-0 flex gap-1 px-3 z-20">
          {gallery.map((_, idx) => (
            <div key={idx} className={`h-1 flex-1 rounded-full bg-white transition-opacity ${idx === photoIndex ? 'opacity-100' : 'opacity-40 shadow-sm'}`} />
          ))}
        </div>
 
        {/* Badges superiores: Ubicación y Categoría */}
        <div className="absolute top-6 left-3 right-3 flex justify-between items-center z-20 pointer-events-none gap-2">
          <div className="bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1 border border-white/20 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[130px]">{service.location}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <div className="bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-bold border border-white/20 truncate max-w-[120px]">
              {service.category || "Experiencia"}
            </div>
            {service.isRemate && service.discount && (
              <div className="bg-red-500/90 backdrop-blur-md px-2 py-1 rounded-full text-white text-[10px] font-black border border-white/20">
                -{service.discount}%
              </div>
            )}
          </div>
        </div>
 
        {/* Swipe Overlays */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 left-6 z-30 pointer-events-none rotate-[-15deg]">
          <div className="border-4 border-emerald-400 text-emerald-400 font-black text-4xl px-4 py-1 rounded-lg uppercase tracking-widest shadow-sm bg-white/10 backdrop-blur-sm">
            LIKE
          </div>
        </motion.div>
        <motion.div style={{ opacity: nopeOpacity }} className="absolute top-10 right-6 z-30 pointer-events-none rotate-[15deg]">
          <div className="border-4 border-red-500 text-red-500 font-black text-4xl px-4 py-1 rounded-lg uppercase tracking-widest shadow-sm bg-white/10 backdrop-blur-sm">
            NOPE
          </div>
        </motion.div>
 
        {/* Gradient Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
        
        {/* Title Info overlay inside image */}
        <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
          <div className="flex justify-between items-end gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-extrabold leading-tight drop-shadow-md line-clamp-2">{service.name}</h2>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <p className="text-white/95 font-semibold drop-shadow-sm flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Ideal para {displayCapacity} pers.
                </p>
                {service.businessName && (
                  <span className="text-white/80 drop-shadow-sm truncate">
                    • por {service.businessName}
                  </span>
                )}
              </div>
            </div>
            {/* Precio */}
            <div className="flex-shrink-0">
               <span className="bg-emerald-600 text-white px-3 py-1 rounded-xl text-sm font-black shadow-lg border border-white/20">
                 ${displayPrice}
               </span>
            </div>
          </div>
        </div>
      </div>
 
      {/* Info Card Content Bottom */}
      <div className="p-3.5 h-[52%] flex flex-col justify-between">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 leading-relaxed">
            {service.description || service.descripcion || "Sin descripción disponible"}
          </p>
          {service.features && service.features.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {service.features.slice(0, 3).map((f, i) => (
                <span key={i} className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded-full font-medium">{f}</span>
              ))}
            </div>
          )}
        </div>
 
        {/* Pool Gamification Status */}
        <div className="mt-auto relative z-30" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-300/60 p-2.5 rounded-2xl relative overflow-visible">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-extrabold text-emerald-950 block leading-tight truncate">
                {activePool && spotsRemaining > 0
                  ? (spotsRemaining === 1 || spotsRemaining === 2
                      ? `¡Falta${spotsRemaining === 1 ? "" : "n"} ${spotsRemaining}! Únete ya`
                      : `Pool Activo (${activePool.currentMembers}/${activePool.targetMembers})`)
                  : `Ahorra hasta -${discountPct}% en grupo`}
              </span>
              <span className="text-[10px] text-emerald-700 block truncate">
                {activePool ? "Viaje grupal confirmado" : "Comparte gastos o arma tu grupo"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Botón de unirse a pool existente */}
              {activePool && spotsRemaining > 0 ? (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate?.("pool");
                  }}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Únete aquí
                </button>
              ) : null}

              {/* Botón de Líder (si tiene intención de crear/liderar pools) */}
              {userIntentions?.wantsToLeadPools ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCreatePool?.(service);
                  }}
                  className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-700 to-[#064e3b] hover:from-emerald-800 hover:to-[#043324] text-white text-[10px] font-extrabold rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1"
                >
                  <Users className="w-3 h-3" />
                  <span>Armar Pool</span>
                </button>
              ) : null}

              {/* Botón de Pasajero / Interés (si no hay pool activo y es viajero) */}
              {(!activePool || spotsRemaining <= 0) && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (service) {
                      registerPoolInterest(service.id);
                      setRegisteredPools((prev: Set<number>) => new Set(prev).add(service.id));
                    }
                  }}
                  className={cn(
                    "px-2.5 py-1.5 text-[10px] font-bold rounded-xl transition-all shadow-sm active:scale-95",
                    service && registeredPools.has(service.id)
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-emerald-600 text-emerald-900 hover:bg-emerald-50"
                  )}
                >
                  {service && registeredPools.has(service.id) ? "✓ Te avisaremos" : "Me interesa"}
                </button>
              )}

              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPoolTooltip(!showPoolTooltip);
                }}
                className="p-1 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors shrink-0"
                title="¿Qué es un Pool?"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tooltip Gamificado */}
            <AnimatePresence>
              {showPoolTooltip && (
                <motion.div 
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 3, scale: 0.95 }}
                  className="absolute bottom-full mb-2 right-0 w-[240px] bg-[#064e3b] text-white p-3 rounded-2xl shadow-xl z-50 text-xs"
                >
                  <div className="absolute -bottom-1 right-4 w-3 h-3 bg-[#064e3b] rotate-45" />
                  <p className="font-bold mb-1 flex items-center gap-1.5 text-emerald-200">
                    <Users className="w-3.5 h-3.5"/> ¿Qué es un Pool?
                  </p>
                  <p className="opacity-90 leading-snug">
                    Un pool es una compra grupal para ahorrar hasta un {discountPct}%. ¡Puedes unirte o armar el grupo tú mismo!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
