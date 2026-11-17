"use client"

import React, { useState, useRef } from "react"
import {
  ArrowDown,
  ArrowUp,
  Check,
  Heart,
  Info,
  MapPin,
  Maximize2,
  Minimize2,
  Sparkles,
  Star,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Service } from "@/lib/store"

export interface MobileExperienceReelsModalProps {
  service: Service
  allPhotos: string[]
  safePhotoIdx: number
  setPhotoIdx: React.Dispatch<React.SetStateAction<number>>
  isFav: boolean
  totalLikesAndReacts: number
  commentsCount: number
  currentFeedPos: number
  totalFeedCount: number
  hasFlash: boolean
  basePrice: number
  effectivePrice: number
  defaultCover: string
  reactions: Array<{ id: string; label: string }>
  reactState: {
    counts: Record<string, number>
    userReaction: string | null
  }
  renderReactionIcon: (type: string, animated: boolean) => React.ReactNode
  onClose: () => void
  onStepService: (dir: "prev" | "next") => void
  onToggleFavorite: (id: number) => void
  onToggleReaction: (serviceId: number, reactionId: string) => void
  onOpenFullDetail: (service: Service) => void
  onOpenBusiness: (businessId: number) => void
  onOpenRoutes: (service: Service) => void
  onOpenBooking: (service: Service) => void
}

export function MobileExperienceReelsModal({
  service,
  allPhotos,
  safePhotoIdx,
  setPhotoIdx,
  isFav,
  totalLikesAndReacts,
  commentsCount,
  currentFeedPos,
  totalFeedCount,
  hasFlash,
  basePrice,
  effectivePrice,
  defaultCover,
  reactions,
  reactState,
  renderReactionIcon,
  onClose,
  onStepService,
  onToggleFavorite,
  onToggleReaction,
  onOpenFullDetail,
  onOpenBusiness,
  onOpenRoutes,
  onOpenBooking,
}: MobileExperienceReelsModalProps) {
  const [showDetailsSheet, setShowDetailsSheet] = useState(false)
  const [isCleanMediaMode, setIsCleanMediaMode] = useState(false)
  const [expandDesc, setExpandDesc] = useState(false)

  // Touch swipe support for horizontal photos & vertical feed stepping
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const currentPhotoUrl = allPhotos[safePhotoIdx] || defaultCover

  const handleTouchStart = (e: React.TouchEvent) => {
    if (showDetailsSheet) return
    const t = e.touches[0]
    touchStartRef.current = { x: t.clientX, y: t.clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (showDetailsSheet || !touchStartRef.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStartRef.current.x
    const dy = t.clientY - touchStartRef.current.y
    touchStartRef.current = null

    // Horizontal swipe -> cycle photos
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2 && allPhotos.length > 1) {
      if (dx < 0) {
        setPhotoIdx((prev) => (prev + 1) % allPhotos.length)
      } else {
        setPhotoIdx((prev) => (prev - 1 + allPhotos.length) % allPhotos.length)
      }
      return
    }

    // Vertical swipe -> step experience prev/next
    if (Math.abs(dy) > 65 && Math.abs(dy) > Math.abs(dx) * 1.3) {
      if (dy < 0) {
        onStepService("next")
      } else {
        onStepService("prev")
      }
    }
  }

  return (
    <div
      className="sm:hidden fixed inset-0 z-[70] bg-[#0b0c0e] text-white h-[100dvh] w-full flex flex-col overflow-hidden select-none animate-in fade-in duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* MEDIA STAGE: Full 100dvh in Reels mode, or docked 34dvh top stage when Details Sheet is open */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "relative w-full bg-[#090a0c] overflow-hidden transition-all duration-300 ease-out flex items-center justify-center",
          showDetailsSheet ? "h-[34dvh] shrink-0" : "flex-1 h-full",
        )}
      >
        {/* Ambient blurred backdrop so horizontal & vertical photos both look cinematic */}
        <img
          src={currentPhotoUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-110 pointer-events-none"
        />

        {/* Crisp Full Image (always centered cleanly for both horizontal & vertical photos) */}
        <img
          src={currentPhotoUrl}
          alt={service.name}
          onClick={() => {
            if (!showDetailsSheet) setIsCleanMediaMode((prev) => !prev)
          }}
          className="relative z-10 w-full h-full object-contain"
          onError={(e) => {
            e.currentTarget.src = defaultCover
          }}
        />

        {/* TOP BAR OVERLAY */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="bg-black/60 backdrop-blur-md text-white border border-white/15 text-[11px] font-bold px-3 py-1 rounded-full shadow-md truncate max-w-[155px]">
              {service.category || "Experiencia"}
            </span>
            {allPhotos.length > 1 && (
              <span className="bg-black/60 backdrop-blur-md text-white/90 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/15 shrink-0">
                {safePhotoIdx + 1}/{allPhotos.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!showDetailsSheet && (
              <button
                type="button"
                onClick={() => setIsCleanMediaMode((prev) => !prev)}
                className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white border border-white/20 flex items-center justify-center shadow-lg cursor-pointer"
                aria-label={isCleanMediaMode ? "Mostrar controles" : "Vista limpia de foto"}
              >
                {isCleanMediaMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (showDetailsSheet) {
                  setShowDetailsSheet(false)
                } else {
                  onClose()
                }
              }}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white border border-white/25 flex items-center justify-center shadow-lg cursor-pointer"
              aria-label={showDetailsSheet ? "Volver a foto completa" : "Cerrar"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT-SIDE FLOATING REELS ACTION RAIL (TikTok Style: Like, Ver Info, Up/Down Arrows) */}
        {!showDetailsSheet && !isCleanMediaMode && (
          <div className="absolute right-2.5 bottom-44 z-30 flex flex-col items-center gap-3">
            {/* Like Button */}
            <button
              type="button"
              onClick={() => onToggleFavorite(service.id)}
              className="flex flex-col items-center gap-0.5 cursor-pointer group"
              aria-label="Me gusta"
            >
              <span
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center border shadow-xl transition-transform active:scale-90",
                  isFav
                    ? "bg-white text-[#105238] border-white"
                    : "bg-black/60 backdrop-blur-md text-white border-white/20",
                )}
              >
                <Heart className={cn("w-5 h-5", isFav && "fill-[#105238] text-[#105238]")} />
              </span>
              <span className="text-[10px] font-bold text-white drop-shadow">
                {totalLikesAndReacts > 0 ? totalLikesAndReacts : "Like"}
              </span>
            </button>

            {/* Ver Info / Expand Details Sheet */}
            <button
              type="button"
              onClick={() => setShowDetailsSheet(true)}
              className="flex flex-col items-center gap-0.5 cursor-pointer"
              aria-label="Ver info"
            >
              <span className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center justify-center shadow-xl transition-transform active:scale-90">
                <Info className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold text-white drop-shadow">Ver info</span>
            </button>

            {/* Feed Up / Down Navigation Arrows */}
            <div className="flex flex-col items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onStepService("prev")}
                className="w-10 h-10 rounded-full bg-white/90 text-slate-900 border border-black/10 flex items-center justify-center shadow-xl active:scale-90 cursor-pointer"
                aria-label="Anterior experiencia"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onStepService("next")}
                className="w-10 h-10 rounded-full bg-[#105238] text-[#8ee01a] border border-white/20 flex items-center justify-center shadow-xl active:scale-90 cursor-pointer"
                aria-label="Siguiente experiencia"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM REELS OVERLAY (Circular Thumbnails + Info + Booking CTA) */}
        {!showDetailsSheet && !isCleanMediaMode && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-12 pb-4 px-4 space-y-2.5">
            {/* Circular Photo Thumbnails Strip (Fixed position for vertical & horizontal photos) */}
            {allPhotos.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-0.5 pr-12">
                {allPhotos.map((pUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoIdx(idx)}
                    className={cn(
                      "w-9 h-9 rounded-full overflow-hidden border-2 transition-all shrink-0 cursor-pointer",
                      idx === safePhotoIdx
                        ? "border-[#8ee01a] scale-110 shadow-md"
                        : "border-white/35 opacity-65 hover:opacity-100",
                    )}
                    aria-label={`Ver foto ${idx + 1}`}
                  >
                    <img src={pUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Routes Badge (if available) */}
            {service.routes && service.routes.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pr-12">
                <button
                  type="button"
                  onClick={() => onOpenRoutes(service)}
                  className="bg-white/95 text-slate-900 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-[#105238]" />
                  <span>{service.routes.length} rutas</span>
                </button>
              </div>
            )}

            {/* Title, Business, Rating & Single-line Description */}
            <div className="space-y-1 pr-12">
              <div className="flex items-center gap-2 text-[11px] text-neutral-300 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (service.businessId) onOpenBusiness(service.businessId)
                  }}
                  className="font-bold text-white/90 hover:underline truncate max-w-[180px] cursor-pointer"
                >
                  {service.businessName || "Comercio Aliado"}
                </button>
                <span>·</span>
                <span className="inline-flex items-center gap-1 font-bold text-white">
                  <Star className="w-3 h-3 fill-[#8ee01a] text-[#8ee01a]" />
                  {service.rating} ({service.reviews || commentsCount})
                </span>
              </div>

              <h2
                onClick={() => setShowDetailsSheet(true)}
                className="text-lg font-black text-white leading-tight cursor-pointer line-clamp-2"
              >
                {service.name}
              </h2>

              <p
                onClick={() => setShowDetailsSheet(true)}
                className="text-xs text-neutral-200/90 line-clamp-1 leading-snug cursor-pointer"
              >
                {service.description ||
                  "Vive una experiencia auténtica en El Salvador con atención verificada por la red PalenqueGo."}
              </p>

              <button
                type="button"
                onClick={() => setShowDetailsSheet(true)}
                className="text-[11px] font-bold text-[#8ee01a] inline-flex items-center gap-1 pt-0.5 cursor-pointer"
              >
                <span>Ver más</span>
              </button>
            </div>

            {/* Bottom Sticky CTA Row */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/15">
              <div>
                <div className="flex items-baseline gap-1.5">
                  {hasFlash && (
                    <span className="text-[11px] line-through text-neutral-400">
                      ${basePrice.toFixed(2)}
                    </span>
                  )}
                  <span className="text-lg font-black text-[#8ee01a]">${effectivePrice.toFixed(2)}</span>
                  <span className="text-[11px] text-neutral-300 font-semibold">/p</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenFullDetail(service)}
                  className="h-9 px-3 rounded-xl bg-white text-slate-900 font-bold text-xs inline-flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Info className="w-3.5 h-3.5 text-slate-700" />
                  <span>Más info</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenBooking(service)}
                  className="h-9 px-4 rounded-xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer shadow-lg active:scale-95 border border-[#8ee01a]/40"
                >
                  <span>Reservar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EXPANDED DETAILS SHEET (Slides up cleanly on mobile when user taps "Ver info", like facilitoweb.com/videos/) */}
      {showDetailsSheet && (
        <div className="flex-1 bg-[#141517] rounded-t-3xl border-t border-white/15 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
          {/* Sheet Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-start justify-between gap-2 shrink-0">
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                <button
                  type="button"
                  onClick={() => {
                    if (service.businessId) onOpenBusiness(service.businessId)
                  }}
                  className="font-bold text-white/90 hover:underline truncate cursor-pointer"
                >
                  {service.businessName || "Comercio Aliado"}
                </button>
                <span>·</span>
                <span className="inline-flex items-center gap-1 text-white font-bold">
                  <Star className="w-3 h-3 fill-[#8ee01a] text-[#8ee01a]" />
                  {service.rating} ({service.reviews || commentsCount})
                </span>
              </div>
              <h3 className="text-base font-black text-white leading-snug">{service.name}</h3>
              <p className="text-[11px] text-neutral-400 inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{service.location}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDetailsSheet(false)}
              className="text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-xl shrink-0 cursor-pointer"
            >
              Volver a foto
            </button>
          </div>

          {/* Scrollable Details Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Circular Photo Thumbnails */}
            {allPhotos.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                {allPhotos.map((pUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoIdx(idx)}
                    className={cn(
                      "w-12 h-12 rounded-full overflow-hidden border-2 transition-all shrink-0 cursor-pointer",
                      idx === safePhotoIdx ? "border-[#8ee01a] scale-105" : "border-white/25 opacity-70",
                    )}
                  >
                    <img src={pUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="rounded-2xl bg-[#202124] border border-white/10 p-3.5 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                SOBRE ESTA EXPERIENCIA
              </p>
              <p
                className={cn(
                  "text-xs text-neutral-100 leading-relaxed whitespace-pre-line",
                  !expandDesc && "line-clamp-4",
                )}
              >
                {service.description ||
                  "Vive una experiencia auténtica en El Salvador con atención verificada por la red PalenqueGo."}
              </p>
              {(service.description?.length || 0) > 140 && (
                <button
                  type="button"
                  onClick={() => setExpandDesc((prev) => !prev)}
                  className="text-xs font-bold text-[#8ee01a] cursor-pointer"
                >
                  {expandDesc ? "Ver menos ▲" : "Ver más ▼"}
                </button>
              )}
            </div>

            {/* Features */}
            {service.features && service.features.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8ee01a]" />
                  <span>Incluye y Características</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {service.features.map((feat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#202124] text-neutral-200 border border-white/10 px-2.5 py-1 rounded-xl"
                    >
                      <Check className="w-3 h-3 text-[#8ee01a]" />
                      <span>{feat}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reactions */}
            <div className="rounded-2xl bg-[#202124] border border-white/10 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold uppercase tracking-wider text-neutral-300">REACCIONES</span>
                <span className="font-bold text-neutral-400">{totalLikesAndReacts} interacciones</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {reactions.map((r) => {
                  const isSelected = reactState.userReaction === r.id
                  const count = reactState.counts[r.id] || 0
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onToggleReaction(service.id, r.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border",
                        isSelected
                          ? "bg-white text-slate-900 border-white"
                          : "bg-[#323336] text-neutral-100 border-transparent",
                      )}
                    >
                      {renderReactionIcon(r.id, isSelected)}
                      <span>{r.label}</span>
                      {count > 0 && <span className="font-black">({count})</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sticky Bottom Booking Footer */}
          <div className="px-4 py-3 border-t border-white/10 bg-[#101113] flex items-center justify-between gap-2 shrink-0">
            <div>
              <span className="text-[10px] text-neutral-400 block">Precio por persona</span>
              <div className="flex items-baseline gap-1.5">
                {hasFlash && (
                  <span className="text-xs line-through text-neutral-500">${basePrice.toFixed(2)}</span>
                )}
                <span className="text-lg font-black text-[#8ee01a]">${effectivePrice.toFixed(2)}</span>
                <span className="text-[11px] text-neutral-400 font-semibold">/p</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenFullDetail(service)}
                className="h-10 px-3 rounded-xl bg-white text-slate-900 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Más info</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenBooking(service)}
                className="h-10 px-4 rounded-xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer border border-[#8ee01a]/40"
              >
                <span>Reservar Ahora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
