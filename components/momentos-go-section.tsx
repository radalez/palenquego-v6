"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Play,
  Eye,
  Video,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Volume2,
  VolumeX,
  Users,
  Sparkles,
  Flame,
  BookOpen,
  CalendarCheck,
  CloudUpload,
  Loader2,
  CheckCircle2,
  Store as StoreIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { API_BASE, getProxyImage } from "@/lib/store"

export type MomentoModalidad = "POOL" | "PROMO" | "HISTORIA" | "DESAFIO"

export interface MomentoPoolDetalle {
  id: number
  servicio_id: number
  servicio_nombre: string
  lider_nombre: string
  estado: string
  tipo_pool: string
  titulo_desafio?: string
  fecha_evento?: string | null
  meta_personas: number
  miembros_count: number
  precio_persona: number
  precio_total_servicio: number
}

export interface MomentoGoItem {
  id: number
  tienda: number | null
  tienda_nombre: string | null
  tienda_logo?: string
  autor: number | null
  autor_nombre: string
  modalidad: MomentoModalidad
  servicio: number | null
  servicio_nombre: string | null
  servicio_precio: number | null
  pool: number | null
  pool_detalle: MomentoPoolDetalle | null
  titulo: string
  descripcion: string
  media_cloudinary_url: string
  media_items?: string[]
  thumbnail_cloudinary_url?: string | null
  es_video: boolean
  precio_promo?: string | number | null
  activo: boolean
  expira_el?: string | null
  es_permanente: boolean
  visto?: boolean
  creado_el: string
}

export function getMomentoMeta(modalidad: MomentoModalidad) {
  switch (modalidad) {
    case "DESAFIO":
      return {
        badge: "Desafío",
        cta: "Acepto el desafío",
        cardCta: "Ver reto",
        icon: Flame,
        badgeClass: "bg-[#105238] text-[#8ee01a]",
      }
    case "POOL":
      return {
        badge: "Pool",
        cta: "Unirme",
        cardCta: "Unirme",
        icon: Users,
        badgeClass: "bg-[#eaf0e2] text-[#105238]",
      }
    case "PROMO":
      return {
        badge: "Oferta Flash",
        cta: "Reservar",
        cardCta: "Reservar",
        icon: Sparkles,
        badgeClass: "bg-[#8ee01a] text-[#105238]",
      }
    case "HISTORIA":
    default:
      return {
        badge: "Bitácora",
        cta: "Ver historia",
        cardCta: "Ver historia",
        icon: BookOpen,
        badgeClass: "bg-black/65 text-white border border-white/20",
      }
  }
}

function getMomentoPoster(item: MomentoGoItem): string {
  if (item.thumbnail_cloudinary_url) return getProxyImage(item.thumbnail_cloudinary_url)
  const url = item.media_cloudinary_url || ""
  if (url.includes("/video/upload/")) {
    return getProxyImage(url.replace(/\.(mp4|webm|mov|m4v)(\?.*)?$/i, ".jpg"))
  }
  return getProxyImage(url)
}

interface MomentosGoCarouselProps {
  momentos: MomentoGoItem[]
  onOpenViewer: (index: number) => void
  onOpenCreate: () => void
  onExecuteAction: (item: MomentoGoItem) => void
}

export function MomentosGoCarousel({
  momentos,
  onOpenViewer,
  onOpenCreate,
  onExecuteAction,
}: MomentosGoCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="bg-card border border-border rounded-3xl p-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#105238] text-[#8ee01a] flex items-center justify-center shrink-0">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h2 className="text-sm font-black text-foreground leading-tight">Momentos Go</h2>
            <p className="text-[11px] text-muted-foreground">
              Videos cortos para descubrir aventuras reales
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {momentos.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenViewer(0)}
              className="h-8 px-3 rounded-full border border-border bg-background hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-[#105238]" />
              <span>Ver todos</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenCreate}
            className="h-8 px-3.5 rounded-full bg-[#105238] hover:bg-[#0c3e2b] text-[#8ee01a] text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Crear momento</span>
          </button>
        </div>
      </div>

      {momentos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-center">
          <p className="text-xs font-bold text-foreground">
            Aún no hay Momentos Go publicados hoy
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Comparte una historia de 24h, lanza un desafío o descubre promociones en video de comercios aliados.
          </p>
        </div>
      ) : (
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex items-stretch gap-3 overflow-x-auto pb-1 scrollbar-hide"
          >
            {momentos.map((item, idx) => {
              const meta = getMomentoMeta(item.modalidad)
              const MetaIcon = meta.icon
              const poster = getMomentoPoster(item)
              return (
                <div
                  key={item.id}
                  onClick={() => onOpenViewer(idx)}
                  className={cn(
                    "relative w-[150px] sm:w-[162px] h-[220px] rounded-2xl overflow-hidden shrink-0 cursor-pointer group border transition-all",
                    item.visto ? "border-border/70 opacity-90" : "border-[#8ee01a] ring-1 ring-[#8ee01a]/50"
                  )}
                >
                  {item.es_video && !poster ? (
                    <video
                      src={item.media_cloudinary_url}
                      muted
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <img
                      src={poster || "/placeholder.svg"}
                      alt={item.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/25" />

                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 fill-current" />
                      {item.es_permanente ? "Promo" : "24h"}
                    </span>
                    {!item.visto && (
                      <span className="w-2 h-2 rounded-full bg-[#8ee01a] shadow-sm" title="Nuevo" />
                    )}
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 space-y-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black",
                        meta.badgeClass
                      )}
                    >
                      <MetaIcon className="w-2.5 h-2.5" />
                      {meta.badge}
                    </span>
                    <p className="text-xs font-black text-white leading-snug line-clamp-2">
                      {item.titulo}
                    </p>
                    {item.precio_promo && (
                      <p className="text-[11px] font-black text-[#8ee01a]">
                        ${Number(item.precio_promo).toFixed(0)}{" "}
                        <span className="text-white/75 font-semibold">/p</span>
                      </p>
                    )}
                    {item.pool_detalle && (
                      <p className="text-[10px] font-semibold text-white/85 flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#8ee01a]" />
                        {item.pool_detalle.miembros_count}/{item.pool_detalle.meta_personas} viajeros
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (item.modalidad === "HISTORIA") {
                          onOpenViewer(idx)
                        } else {
                          onExecuteAction(item)
                        }
                      }}
                      className={cn(
                        "w-full h-7 rounded-full text-[11px] font-black flex items-center justify-center gap-1 transition-colors cursor-pointer",
                        item.modalidad === "PROMO"
                          ? "bg-[#105238] text-[#8ee01a] hover:bg-[#0c3e2b]"
                          : item.modalidad === "POOL"
                          ? "bg-white text-[#105238] hover:bg-[#eaf0e2]"
                          : "bg-black/60 text-white border border-white/30 hover:bg-black/80"
                      )}
                    >
                      <span>{meta.cardCta}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {momentos.length > 3 && (
            <button
              type="button"
              onClick={() => scrollRef.current?.scrollBy({ left: 260, behavior: "smooth" })}
              className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 border border-border shadow-md items-center justify-center text-foreground hover:bg-[#eaf0e2] cursor-pointer"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

interface MomentosGoViewerModalProps {
  momentos: MomentoGoItem[]
  activeIndex: number | null
  onChangeIndex: (idx: number) => void
  onClose: () => void
  onExecuteAction: (item: MomentoGoItem) => void
  onOpenBusiness: (storeId: number) => void
  onMarkViewed: (id: number) => void
}

export function MomentosGoViewerModal({
  momentos,
  activeIndex,
  onChangeIndex,
  onClose,
  onExecuteAction,
  onOpenBusiness,
  onMarkViewed,
}: MomentosGoViewerModalProps) {
  const [muted, setMuted] = useState(false)
  const [photoIdx, setPhotoIdx] = useState(0)
  const touchStartY = useRef<number | null>(null)
  const wheelLock = useRef<number>(0)

  const item = activeIndex !== null ? momentos[activeIndex] : null

  useEffect(() => {
    if (!item) return
    setPhotoIdx(0)
    onMarkViewed(item.id)
  }, [item?.id])

  useEffect(() => {
    if (activeIndex === null) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        if (activeIndex < momentos.length - 1) onChangeIndex(activeIndex + 1)
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        if (activeIndex > 0) onChangeIndex(activeIndex - 1)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [activeIndex, momentos.length, onChangeIndex, onClose])

  if (activeIndex === null || !item) return null

  const meta = getMomentoMeta(item.modalidad)
  const MetaIcon = meta.icon
  const gallery =
    Array.isArray(item.media_items) && item.media_items.length > 0
      ? item.media_items
      : [item.media_cloudinary_url]

  const stepMomento = (dir: "prev" | "next") => {
    if (dir === "next" && activeIndex < momentos.length - 1) {
      onChangeIndex(activeIndex + 1)
    } else if (dir === "prev" && activeIndex > 0) {
      onChangeIndex(activeIndex - 1)
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now()
    if (now - wheelLock.current < 350) return
    if (e.deltaY > 35) {
      wheelLock.current = now
      stepMomento("next")
    } else if (e.deltaY < -35) {
      wheelLock.current = now
      stepMomento("prev")
    }
  }

  return (
    <div
      onClick={onClose}
      onWheel={handleWheel}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center md:p-6"
    >
      {/* MOBILE REELS VIEWER (100dvh TikTok style) */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0]?.clientY ?? null
        }}
        onTouchEnd={(e) => {
          if (touchStartY.current === null) return
          const endY = e.changedTouches[0]?.clientY ?? touchStartY.current
          const diff = touchStartY.current - endY
          if (diff > 55) stepMomento("next")
          else if (diff < -55) stepMomento("prev")
          touchStartY.current = null
        }}
        className="md:hidden relative w-full h-[100dvh] bg-black overflow-hidden flex flex-col justify-between"
      >
        {item.es_video ? (
          <video
            key={item.media_cloudinary_url}
            src={item.media_cloudinary_url}
            poster={getMomentoPoster(item)}
            autoPlay
            playsInline
            loop
            muted={muted}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <img
            src={getProxyImage(gallery[photoIdx] || item.media_cloudinary_url)}
            alt={item.titulo}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none" />

        {/* Top bar */}
        <div className="relative z-10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-black flex items-center gap-1", meta.badgeClass)}>
              <MetaIcon className="w-3 h-3" />
              {meta.badge}
            </span>
            <span className="text-[11px] font-bold text-white/80 bg-black/45 px-2.5 py-1 rounded-full">
              {activeIndex + 1}/{momentos.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {item.es_video && (
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right vertical step buttons */}
        <div className="relative z-10 px-4 flex justify-end">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() => stepMomento("prev")}
              className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center disabled:opacity-30"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              type="button"
              disabled={activeIndex >= momentos.length - 1}
              onClick={() => stepMomento("next")}
              className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center disabled:opacity-30"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom info + CTA */}
        <div className="relative z-10 p-4 pb-6 space-y-2.5">
          {item.tienda && item.tienda_nombre ? (
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenBusiness(item.tienda!)
              }}
              className="inline-flex items-center gap-2 text-xs font-extrabold text-white/95 hover:underline"
            >
              <StoreIcon className="w-3.5 h-3.5 text-[#8ee01a]" />
              <span>{item.tienda_nombre}</span>
            </button>
          ) : (
            <p className="text-xs font-bold text-white/90">{item.autor_nombre}</p>
          )}
          <h3 className="text-lg font-black text-white leading-tight">{item.titulo}</h3>
          {item.descripcion && (
            <p className="text-xs text-white/85 line-clamp-2">{item.descripcion}</p>
          )}
          {item.pool_detalle && (
            <div className="flex items-center gap-3 text-xs text-[#8ee01a] font-bold">
              <span>
                {item.pool_detalle.miembros_count}/{item.pool_detalle.meta_personas} viajeros
              </span>
              <span>•</span>
              <span>${item.pool_detalle.precio_persona.toFixed(2)} /p</span>
            </div>
          )}
          {item.modalidad !== "HISTORIA" && (
            <Button
              type="button"
              onClick={() => onExecuteAction(item)}
              className="w-full h-11 rounded-2xl bg-[#105238] hover:bg-[#0c3e2b] text-[#8ee01a] font-black text-sm"
            >
              {meta.cta}
            </Button>
          )}
        </div>
      </div>

      {/* DESKTOP LIGHTBOX VIEWER (Service Detail Style + Scroll Arrows) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="hidden md:flex items-center gap-4 max-w-5xl w-full"
      >
        <div className="flex-1 bg-[#141716] border border-white/10 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-12 h-[82vh] max-h-[680px]">
          {/* Left Media */}
          <div className="col-span-7 relative bg-black flex items-center justify-center overflow-hidden">
            {item.es_video ? (
              <video
                key={item.media_cloudinary_url}
                src={item.media_cloudinary_url}
                poster={getMomentoPoster(item)}
                controls
                autoPlay
                playsInline
                muted={muted}
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={getProxyImage(gallery[photoIdx] || item.media_cloudinary_url)}
                alt={item.titulo}
                className="w-full h-full object-contain"
              />
            )}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className={cn("px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5", meta.badgeClass)}>
                <MetaIcon className="w-3.5 h-3.5" />
                {meta.badge}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/65 text-white/90 text-xs font-bold">
                {item.es_permanente ? "Promo permanente" : "Activo 24h"}
              </span>
            </div>
          </div>

          {/* Right Info Panel */}
          <div className="col-span-5 bg-[#181c1a] text-white flex flex-col justify-between p-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {item.tienda && item.tienda_nombre ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        onOpenBusiness(item.tienda!)
                      }}
                      className="text-xs font-bold text-[#8ee01a] hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <StoreIcon className="w-3.5 h-3.5" />
                      <span>{item.tienda_nombre}</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-[#8ee01a]">{item.autor_nombre}</span>
                  )}
                  <h3 className="text-xl font-black text-white mt-1 leading-snug">{item.titulo}</h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-[11px] font-black uppercase tracking-wider text-white/60">
                  Sobre este Momento Go
                </p>
                <p className="text-sm text-white/90 leading-relaxed">
                  {item.descripcion || "Descubre esta experiencia real compartida en PalenqueGo."}
                </p>
              </div>

              {item.servicio_nombre && (
                <div className="p-3.5 rounded-2xl bg-[#105238]/30 border border-[#8ee01a]/25 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#8ee01a]">Servicio vinculado</p>
                    <p className="text-sm font-bold text-white">{item.servicio_nombre}</p>
                  </div>
                  {(item.precio_promo || item.servicio_precio) && (
                    <p className="text-lg font-black text-[#8ee01a]">
                      ${Number(item.precio_promo || item.servicio_precio).toFixed(2)}
                      <span className="text-xs text-white/70 font-normal"> /p</span>
                    </p>
                  )}
                </div>
              )}

              {item.pool_detalle && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#8ee01a] flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {item.pool_detalle.tipo_pool === "DESAFIO" ? "Pool de Desafío" : "Pool Grupal"}
                    </span>
                    <span className="text-xs font-bold text-white/80">
                      {item.pool_detalle.miembros_count}/{item.pool_detalle.meta_personas} cupos
                    </span>
                  </div>
                  <p className="text-xs text-white/80">
                    Líder: <strong className="text-white">{item.pool_detalle.lider_nombre}</strong> ·{" "}
                    <strong className="text-[#8ee01a]">${item.pool_detalle.precio_persona.toFixed(2)} /p</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <div>
                {item.precio_promo || item.pool_detalle?.precio_persona || item.servicio_precio ? (
                  <>
                    <p className="text-[11px] text-white/60">Tarifa por persona</p>
                    <p className="text-xl font-black text-[#8ee01a]">
                      ${Number(item.precio_promo || item.pool_detalle?.precio_persona || item.servicio_precio).toFixed(2)}{" "}
                      <span className="text-xs text-white/70 font-normal">/p</span>
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-white/60">Momento informativo de la comunidad</p>
                )}
              </div>

              {item.modalidad !== "HISTORIA" ? (
                <Button
                  type="button"
                  onClick={() => onExecuteAction(item)}
                  className="h-11 px-6 rounded-2xl bg-[#105238] hover:bg-[#0c3e2b] text-[#8ee01a] font-black text-sm cursor-pointer"
                >
                  {meta.cta}
                </Button>
              ) : item.tienda ? (
                <Button
                  type="button"
                  onClick={() => {
                    onClose()
                    onOpenBusiness(item.tienda!)
                  }}
                  className="h-11 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                >
                  Ver negocio
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Outside Desktop Scroll Arrows (like Service Detail Modal) */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={activeIndex === 0}
            onClick={() => stepMomento("prev")}
            className="w-11 h-11 rounded-full bg-white/90 hover:bg-white text-[#105238] flex items-center justify-center shadow-lg disabled:opacity-35 cursor-pointer"
            aria-label="Momento anterior"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <span className="px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-black">
            {activeIndex + 1}/{momentos.length}
          </span>
          <button
            type="button"
            disabled={activeIndex >= momentos.length - 1}
            onClick={() => stepMomento("next")}
            className="w-11 h-11 rounded-full bg-white/90 hover:bg-white text-[#105238] flex items-center justify-center shadow-lg disabled:opacity-35 cursor-pointer"
            aria-label="Siguiente momento"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

interface MomentosGoCreateModalProps {
  open: boolean
  onClose: () => void
  accessToken: string | null
  services: Array<{ id: number; name: string; price: number; businessId?: number }>
  onCreated: (item: MomentoGoItem) => void
}

export function MomentosGoCreateModal({
  open,
  onClose,
  accessToken,
  services,
  onCreated,
}: MomentosGoCreateModalProps) {
  const [modalidad, setModalidad] = useState<"HISTORIA" | "DESAFIO" | "POOL" | "PROMO">("HISTORIA")
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [esVideo, setEsVideo] = useState(true)
  const [servicioId, setServicioId] = useState("")
  const [metaPersonas, setMetaPersonas] = useState("6")
  const [myStores, setMyStores] = useState<Array<{ id: number; nombre_comercial: string; cloudinary_cloud_name?: string }>>([])
  const [tiendaId, setTiendaId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !accessToken) return
    fetch(`${API_BASE}/stores/list/my-stores/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.stores)) {
          setMyStores(d.stores)
          if (d.stores.length > 0 && !tiendaId) {
            setTiendaId(String(d.stores[0].id))
          }
        }
      })
      .catch(() => {})
  }, [open, accessToken])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    if (!accessToken) {
      setErrorMsg("Inicia sesión para publicar un Momento Go.")
      return
    }
    const cleanUrl = mediaUrl.trim()
    if (!cleanUrl) {
      setErrorMsg("Pega el enlace directo de tu video o imagen en Cloudinary (o MP4/WebM).")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/stores/list/momentos/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          modalidad,
          titulo: titulo.trim() || "Momento Go",
          descripcion: descripcion.trim(),
          media_cloudinary_url: cleanUrl,
          es_video: esVideo || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(cleanUrl) || cleanUrl.includes("/video/upload/"),
          tienda_id: tiendaId ? parseInt(tiendaId, 10) : null,
          servicio_id: servicioId ? parseInt(servicioId, 10) : null,
          meta_personas: modalidad === "POOL" || modalidad === "DESAFIO" ? parseInt(metaPersonas || "6", 10) : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorMsg(data.error || "No se pudo publicar el Momento Go.")
        return
      }
      onCreated(data)
      setTitulo("")
      setDescripcion("")
      setMediaUrl("")
      onClose()
    } catch {
      setErrorMsg("Error de red al publicar Momento Go.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#105238] bg-[#eaf0e2] px-2.5 py-0.5 rounded-full">
              Comunidad PalenqueGo
            </span>
            <h3 className="text-lg font-black text-foreground mt-1">Crear Momento Go</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "HISTORIA" as const, label: "Historia", sub: "Informativa · 24h" },
              { id: "DESAFIO" as const, label: "Desafío", sub: "Pool reto · 24h" },
              ...(myStores.length > 0
                ? [
                    { id: "POOL" as const, label: "Únete (Pool)", sub: "Aventura · 24h" },
                    { id: "PROMO" as const, label: "Reservar", sub: "Promo permanente" },
                  ]
                : []),
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModalidad(m.id)}
                className={cn(
                  "p-2.5 rounded-xl border text-left cursor-pointer transition-all",
                  modalidad === m.id
                    ? "border-[#105238] bg-[#eaf0e2] text-[#105238]"
                    : "border-border bg-background hover:border-[#105238]/40"
                )}
              >
                <p className="text-xs font-black">{m.label}</p>
                <p className="text-[10px] text-muted-foreground">{m.sub}</p>
              </button>
            ))}
          </div>

          {myStores.length > 0 && (
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Publicar como tienda (opcional)</label>
              <select
                value={tiendaId}
                onChange={(e) => setTiendaId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-semibold"
              >
                <option value="">Mi perfil personal (Viajero)</option>
                {myStores.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.nombre_comercial}
                  </option>
                ))}
              </select>
            </div>
          )}

          {modalidad !== "HISTORIA" && services.length > 0 && (
            <div className={cn("grid gap-2", modalidad === "POOL" || modalidad === "DESAFIO" ? "grid-cols-3" : "grid-cols-1")}>
              <div className={cn(modalidad === "POOL" || modalidad === "DESAFIO" ? "col-span-2" : "")}>
                <label className="text-xs font-bold text-foreground block mb-1">Experiencia / Servicio</label>
                <select
                  value={servicioId}
                  onChange={(e) => setServicioId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-semibold"
                >
                  <option value="">Selecciona servicio...</option>
                  {services.slice(0, 60).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (${s.price})
                    </option>
                  ))}
                </select>
              </div>
              {(modalidad === "POOL" || modalidad === "DESAFIO") && (
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Cupos</label>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={metaPersonas}
                    onChange={(e) => setMetaPersonas(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-bold"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Título corto *</label>
            <input
              type="text"
              maxLength={60}
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: ¿Te atreves a subir el volcán?"
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              URL de Video o Imagen (Cloudinary / MP4) *
            </label>
            <input
              type="url"
              required
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://res.cloudinary.com/.../video/upload/..."
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Descripción</label>
            <input
              type="text"
              maxLength={220}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Cuenta qué vivirán en esta aventura..."
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs"
            />
          </div>

          {errorMsg && (
            <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
              {errorMsg}
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-2xl bg-[#105238] hover:bg-[#0c3e2b] text-[#8ee01a] font-black text-sm cursor-pointer"
          >
            {submitting ? "Publicando..." : "Publicar Momento Go"}
          </Button>
        </form>
      </div>
    </div>
  )
}
