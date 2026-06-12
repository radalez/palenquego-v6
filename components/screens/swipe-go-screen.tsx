"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion"
import { X, Heart, Info, MapPin, Users, HelpCircle, ChevronLeft, ChevronRight, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore, type Service } from "@/lib/store"
import { HeaderWithMenu } from "@/components/header-with-menu"

interface SwipeGoScreenProps {
  onNavigate?: (tab: string) => void
}

export function SwipeGoScreen({ onNavigate }: SwipeGoScreenProps) {
  const router = useRouter()
  const { services, addSwipeLike, accessToken, fetchServices } = useAppStore()
  // Maintain deck state — ahora con SERVICIOS, no tiendas
  const [deck, setDeck] = useState<Service[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // Modales/Tooltips
  const [showPoolTooltip, setShowPoolTooltip] = useState(false)

  // Cargar servicios reales del API al montar
  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  useEffect(() => {
    // Cargar servicios en el deck cuando lleguen del API
    if (services.length > 0) {
      setDeck(services)
    }
  }, [services])

  // Swipe logic
  const handleSwipe = (direction: "left" | "right") => {
    if (currentIndex >= deck.length) return
    
    const currentService = deck[currentIndex]
    
    if (direction === "right") {
      console.log(`Liked ${currentService.name} (service ID: ${currentService.id}) - registrando en favoritos`)
      // Agrega directamente como favorito con el ID del servicio real
      addSwipeLike(currentService.id)
      
      // Registrar en backend con el token de autenticación
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
          <h2 className="text-2xl font-bold text-foreground">¡Has visto todo!</h2>
          <p className="text-muted-foreground">Vuelve más tarde para descubrir nuevos servicios, o revisa tus favoritos.</p>
          <Button className="mt-8" onClick={() => onNavigate?.("favoritos")}>Ver mis Favoritos</Button>
          <Button variant="outline" className="mt-2" onClick={() => setCurrentIndex(0)}>Volver a ver</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] overflow-hidden relative">
      <HeaderWithMenu title="Explorar Go" onNavigate={onNavigate} />
      
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
              />
            )
          })}
        </AnimatePresence>
      </div>

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
}

function SwipeableServiceCard({ service, isFront, onSwipe, onInfoClick, showPoolTooltip, setShowPoolTooltip }: SwipeableServiceCardProps) {
  const x = useMotionValue(0)
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375

  const displayCapacity = service.capacityMax || 10
  const displayPrice = service.price || 0
  
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
    } else {
      // Return to center (handled automatically by dragConstraints)
    }
  }

  // Galería de imágenes del servicio
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
      <div className="relative w-full h-[65%] bg-zinc-900 group" onClick={onInfoClick}>
        <img 
          src={gallery[photoIndex]} 
          alt={service.name} 
          className="w-full h-full object-cover select-none pointer-events-none" 
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

        {/* Badges */}
        <div className="absolute top-6 left-3 right-3 flex justify-between z-20 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1 border border-white/20">
            <MapPin className="w-3 h-3" />
            {service.location}
          </div>
          {service.isRemate && service.discount && (
            <div className="bg-red-500/90 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold border border-white/20">
              -{service.discount}% OFF
            </div>
          )}
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
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
        
        {/* Title Info overlay inside image */}
        <div className="absolute bottom-4 left-4 right-4 text-white pointer-events-none">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold leading-tight drop-shadow-md">{service.name}</h2>
              <p className="text-white/90 text-sm font-medium drop-shadow-sm flex items-center gap-1 mt-1">
                <Users className="w-4 h-4" /> Ideal para {displayCapacity} pers.
              </p>
              {service.businessName && (
                <p className="text-white/70 text-xs mt-0.5">por {service.businessName}</p>
              )}
            </div>
            {/* Precio */}
            <div className="text-right">
               <span className="bg-white text-black px-3 py-1 rounded-xl font-bold shadow-lg">
                 ${displayPrice}
               </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card Content Bottom */}
      <div className="p-5 h-[35%] flex flex-col justify-between">
        <div>
          <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
            {service.description || service.descripcion || "Sin descripción disponible"}
          </p>
          {service.features && service.features.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {service.features.slice(0, 3).map((f, i) => (
                <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{f}</span>
              ))}
            </div>
          )}
        </div>

        {/* Pool Gamification Status */}
        {service.allowsPool && (
          <div className="mt-3 relative z-30" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 p-3 rounded-xl relative overflow-visible">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-primary flex-1">
                Pool Activo Disponible
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPoolTooltip(!showPoolTooltip);
                }}
                className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-primary" />
              </button>

              {/* Tooltip Gamificado */}
              <AnimatePresence>
                {showPoolTooltip && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className="absolute bottom-full mb-3 right-0 w-[240px] bg-primary text-primary-foreground p-4 rounded-2xl shadow-xl z-50 text-sm"
                  >
                    <div className="absolute -bottom-2 right-4 w-4 h-4 bg-primary rotate-45" />
                    <p className="font-bold mb-1 flex items-center gap-2">
                      <Users className="w-4 h-4"/> ¡Ahorra en Grupo!
                    </p>
                    <p className="opacity-90 leading-snug">
                      Darle LIKE aumenta tus chances de unirte a un Pool con descuentos si hace match con otros recientes.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
