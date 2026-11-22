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
        badge: "Momento",
        cta: "Ver momento",
        cardCta: "Ver momento",
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
  const [modalidad, setModalidad] = useState<"HISTORIA" | "DESAFIO" | "POOL" | "PROMO" | null>(null)
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string>("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [esVideo, setEsVideo] = useState(true)
  const [servicioId, setServicioId] = useState("")
  const [metaPersonas, setMetaPersonas] = useState("6")
  const [myStores, setMyStores] = useState<
    Array<{ id: number; nombre_comercial: string; logo?: string; cloudinary_cloud_name?: string; cloudinary_upload_preset?: string }>
  >([])
  const [tiendaId, setTiendaId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open || !accessToken) return
    fetch(`${API_BASE}/stores/list/my-stores/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.stores)) {
          setMyStores(d.stores)
        }
      })
      .catch(() => {})
  }, [open, accessToken])

  useEffect(() => {
    return () => {
      if (mediaPreview && mediaPreview.startsWith("blob:")) {
        URL.revokeObjectURL(mediaPreview)
      }
    }
  }, [mediaPreview])

  if (!open) return null

  const myStoreIds = new Set(myStores.map((s) => s.id))
  const ownStoreServices = tiendaId
    ? services.filter((s) => s.businessId === Number(tiendaId))
    : services.filter((s) => s.businessId && myStoreIds.has(s.businessId))

  const cards = [
    {
      id: "HISTORIA" as const,
      title: "Crear Momento",
      subtitle: "Foto o video de 24h",
      icon: BookOpen,
      gradient: "from-indigo-500 via-blue-500 to-sky-400",
    },
    {
      id: "DESAFIO" as const,
      title: "Lanzar Desafío",
      subtitle: "Reto grupal de 24h",
      icon: Flame,
      gradient: "from-fuchsia-500 via-purple-500 to-indigo-500",
    },
    ...(myStores.length > 0
      ? [
          {
            id: "POOL" as const,
            title: "Únete (Pool)",
            subtitle: "Grupo de tu tienda · 24h",
            icon: Users,
            gradient: "from-sky-500 via-cyan-500 to-teal-500",
          },
          {
            id: "PROMO" as const,
            title: "Reservar (Promo)",
            subtitle: "Promo fija de tu tienda",
            icon: Sparkles,
            gradient: "from-emerald-600 via-teal-600 to-slate-800",
          },
        ]
      : []),
  ]

  const handleFileChange = (file: File | null) => {
    if (!file) return
    if (mediaPreview && mediaPreview.startsWith("blob:")) {
      URL.revokeObjectURL(mediaPreview)
    }
    const isVid = file.type.startsWith("video/")
    setEsVideo(isVid)
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
    setMediaUrl("")
    setErrorMsg(null)
  }

  const resetAll = () => {
    setModalidad(null)
    setTitulo("")
    setDescripcion("")
    setMediaFile(null)
    if (mediaPreview && mediaPreview.startsWith("blob:")) URL.revokeObjectURL(mediaPreview)
    setMediaPreview("")
    setMediaUrl("")
    setShowUrlInput(false)
    setServicioId("")
    setErrorMsg(null)
  }

  const handleDiscard = () => {
    resetAll()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    if (!modalidad) {
      setErrorMsg("Elige primero una tarjeta.")
      return
    }
    if (!accessToken) {
      setErrorMsg("Inicia sesión para publicar tu Momento.")
      return
    }
    if ((modalidad === "PROMO" || modalidad === "POOL") && myStores.length > 0 && !tiendaId) {
      setErrorMsg("Selecciona tu tienda para esta publicación.")
      return
    }
    if (!mediaFile && !mediaUrl.trim()) {
      setErrorMsg("Sube un video o foto para continuar.")
      return
    }

    setSubmitting(true)
    try {
      let finalUrl = mediaUrl.trim()
      let finalIsVideo = esVideo
      const selectedStore = myStores.find((s) => String(s.id) === tiendaId)

      if (mediaFile && selectedStore?.cloudinary_cloud_name && selectedStore?.cloudinary_upload_preset) {
        const cloudFd = new FormData()
        cloudFd.append("file", mediaFile)
        cloudFd.append("upload_preset", selectedStore.cloudinary_upload_preset)
        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${selectedStore.cloudinary_cloud_name}/auto/upload`,
          { method: "POST", body: cloudFd }
        )
        const cloudData = await cloudRes.json().catch(() => ({}))
        if (cloudRes.ok && cloudData.secure_url) {
          finalUrl = cloudData.secure_url
          finalIsVideo = mediaFile.type.startsWith("video/") || cloudData.resource_type === "video"
        }
      }

      let res: Response
      if (mediaFile && !finalUrl) {
        const fd = new FormData()
        fd.append("media_file", mediaFile)
        fd.append("modalidad", modalidad)
        fd.append("titulo", titulo.trim() || "Momento Go")
        fd.append("descripcion", descripcion.trim())
        fd.append("es_video", String(finalIsVideo))
        if (tiendaId) fd.append("tienda_id", tiendaId)
        if (servicioId) fd.append("servicio_id", servicioId)
        if (modalidad === "POOL" || modalidad === "DESAFIO") {
          fd.append("meta_personas", metaPersonas || "6")
        }
        res = await fetch(`${API_BASE}/stores/list/momentos/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: fd,
        })
      } else {
        res = await fetch(`${API_BASE}/stores/list/momentos/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            modalidad,
            titulo: titulo.trim() || "Momento Go",
            descripcion: descripcion.trim(),
            media_cloudinary_url: finalUrl,
            es_video: finalIsVideo || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(finalUrl) || finalUrl.includes("/video/upload/"),
            tienda_id: tiendaId ? parseInt(tiendaId, 10) : null,
            servicio_id: servicioId ? parseInt(servicioId, 10) : null,
            meta_personas: modalidad === "POOL" || modalidad === "DESAFIO" ? parseInt(metaPersonas || "6", 10) : null,
          }),
        })
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorMsg(data.error || "No se pudo publicar tu Momento.")
        return
      }
      onCreated(data)
      resetAll()
      onClose()
    } catch {
      setErrorMsg("No se pudo conectar. Intenta nuevamente.")
    } finally {
      setSubmitting(false)
    }
  }

  const activeMeta = modalidad ? getMomentoMeta(modalidad) : null

  return (
    <div className="fixed inset-0 z-50 bg-[#f0f2f5] dark:bg-background flex flex-col md:flex-row overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
      />

      {/* LEFT SIDEBAR (Meta Stories Studio style) */}
      <aside className="w-full md:w-[340px] lg:w-[360px] bg-white dark:bg-card border-b md:border-b-0 md:border-r border-slate-200 dark:border-border flex flex-col justify-between shrink-0 max-h-[48vh] md:max-h-full">
        {/* Top bar */}
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDiscard}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-muted flex items-center justify-center text-slate-700 cursor-pointer transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-foreground leading-tight">
                {modalidad ? "Tu Momento" : "Momentos Go"}
              </h2>
              <p className="text-[11px] text-slate-500">
                {modalidad ? "Personaliza y comparte" : "Elige qué quieres compartir"}
              </p>
            </div>
          </div>
          {modalidad && (
            <button
              type="button"
              onClick={() => setModalidad(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Cambiar tipo
            </button>
          )}
        </div>

        {/* Guided Sidebar Form (appears after choosing a card) */}
        <form id="momento-studio-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {!modalidad ? (
            <div className="space-y-3 py-2">
              <p className="text-xs text-slate-600 dark:text-muted-foreground leading-relaxed">
                Selecciona una de las tarjetas del estudio para comenzar a armar tu Momento Go con vista previa en tiempo real.
              </p>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-muted/40 border border-slate-200/70 space-y-1.5 text-xs text-slate-600">
                <p className="font-bold text-slate-800 dark:text-foreground">¿Cómo funciona?</p>
                <p>• <strong>Momento</strong> y <strong>Desafío</strong> duran 24 horas.</p>
                {myStores.length > 0 && (
                  <p>• <strong>Reservar</strong> queda fija vinculada a tu servicio.</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-foreground block mb-1">
                  Título o texto principal
                </label>
                <input
                  type="text"
                  maxLength={60}
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder={
                    modalidad === "DESAFIO"
                      ? "¿Quién se atreve a subir este volcán?"
                      : modalidad === "POOL"
                      ? "Escapada en grupo este finde"
                      : "Escribe un título atractivo..."
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-border bg-slate-50/70 dark:bg-background text-sm focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-foreground block mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  maxLength={220}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Cuéntale a la comunidad qué vivirán..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-border bg-slate-50/70 dark:bg-background text-xs resize-none focus:outline-none focus:border-slate-400"
                />
              </div>

              {myStores.length > 0 && (modalidad === "PROMO" || modalidad === "POOL" || modalidad === "DESAFIO" || modalidad === "HISTORIA") && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-foreground block mb-1">
                    Publicar desde
                  </label>
                  <select
                    value={tiendaId}
                    onChange={(e) => {
                      setTiendaId(e.target.value)
                      setServicioId("")
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-border bg-slate-50/70 dark:bg-background text-xs font-semibold"
                  >
                    {modalidad !== "PROMO" && modalidad !== "POOL" && (
                      <option value="">Mi perfil personal</option>
                    )}
                    {myStores.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.nombre_comercial}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(modalidad === "PROMO" || modalidad === "POOL" || (modalidad === "DESAFIO" && myStores.length > 0)) && ownStoreServices.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-foreground block mb-1">
                    Tu servicio vinculado
                  </label>
                  <select
                    value={servicioId}
                    onChange={(e) => setServicioId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-border bg-slate-50/70 dark:bg-background text-xs font-semibold"
                  >
                    <option value="">Selecciona uno de tus servicios...</option>
                    {ownStoreServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (${s.price})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(modalidad === "POOL" || modalidad === "DESAFIO") && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-foreground block mb-1">
                    Cupos disponibles del grupo
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={metaPersonas}
                    onChange={(e) => setMetaPersonas(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-border bg-slate-50/70 dark:bg-background text-xs font-bold"
                  />
                </div>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowUrlInput((v) => !v)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  {showUrlInput ? "Ocultar enlace" : "¿Prefieres pegar un enlace de video/foto?"}
                </button>
                {showUrlInput && (
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => {
                      setMediaUrl(e.target.value)
                      setMediaFile(null)
                      setMediaPreview("")
                    }}
                    placeholder="https://.../video.mp4"
                    className="mt-2 w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                )}
              </div>

              {errorMsg && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  {errorMsg}
                </p>
              )}
            </>
          )}
        </form>

        {/* Bottom Sticky Actions (Descartar + Compartir) */}
        {modalidad && (
          <div className="p-4 border-t border-slate-100 dark:border-border flex items-center gap-2.5 bg-white dark:bg-card shrink-0">
            <button
              type="button"
              onClick={handleDiscard}
              className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
            >
              Descartar
            </button>
            <Button
              type="submit"
              form="momento-studio-form"
              disabled={submitting}
              className="flex-[1.6] h-10 rounded-xl bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold text-xs cursor-pointer"
            >
              {submitting ? "Compartiendo..." : "Compartir Momento"}
            </Button>
          </div>
        )}
      </aside>

      {/* MAIN STUDIO CANVAS (Right Side) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
        {!modalidad ? (
          /* 4-Card Carousel Selection View (Meta Stories style) */
          <div className="w-full max-w-3xl">
            <div className="flex items-stretch justify-start sm:justify-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {cards.map((c) => {
                const Icon = c.icon
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setModalidad(c.id)
                      if ((c.id === "PROMO" || c.id === "POOL") && myStores.length > 0) {
                        setTiendaId(String(myStores[0].id))
                      }
                    }}
                    className={cn(
                      "w-[165px] sm:w-[180px] h-[270px] sm:h-[300px] rounded-2xl p-5 shrink-0 bg-gradient-to-br text-white shadow-lg hover:scale-[1.03] active:scale-[0.99] transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer",
                      c.gradient
                    )}
                  >
                    <div className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-md">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black leading-snug">{c.title}</p>
                      <p className="text-[11px] text-white/85 mt-1">{c.subtitle}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* Live Vista Previa Stage (Meta Stories style) */
          <div className="w-full max-w-3xl bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-border shadow-sm p-4 sm:p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-foreground">Vista previa</span>
              {(mediaPreview || mediaUrl.trim()) && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  Cambiar archivo
                </button>
              )}
            </div>

            <div className="bg-[#18191a] rounded-xl py-6 px-4 flex items-center justify-center">
              <div className="relative w-[240px] sm:w-[270px] h-[420px] sm:h-[465px] rounded-2xl overflow-hidden bg-gradient-to-b from-slate-800 to-black border border-white/15 shadow-2xl flex flex-col justify-between">
                {mediaPreview || mediaUrl.trim() ? (
                  esVideo ? (
                    <video
                      src={mediaPreview || mediaUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={mediaPreview || mediaUrl}
                      alt="Vista previa"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/90 hover:bg-white/5 transition-colors cursor-pointer p-6 text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
                      <CloudUpload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Sube tu video o foto</p>
                      <p className="text-[11px] text-white/65 mt-1">Toca aquí para elegir desde tu dispositivo</p>
                    </div>
                  </button>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/45 pointer-events-none" />

                {/* Top live badge */}
                <div className="relative z-10 p-3 flex items-center justify-between pointer-events-none">
                  {activeMeta && (
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black", activeMeta.badgeClass)}>
                      {activeMeta.badge}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-white/80 bg-black/45 px-2 py-0.5 rounded-full">
                    {modalidad === "PROMO" ? "Fija" : "24h"}
                  </span>
                </div>

                {/* Bottom live overlay */}
                <div className="relative z-10 p-3.5 space-y-2 pointer-events-none">
                  <p className="text-sm font-black text-white leading-snug line-clamp-2">
                    {titulo || "Tu título aparecerá aquí..."}
                  </p>
                  {descripcion && (
                    <p className="text-[11px] text-white/80 line-clamp-2">{descripcion}</p>
                  )}
                  {modalidad !== "HISTORIA" && activeMeta && (
                    <div className="w-full h-8 rounded-full bg-white/95 text-slate-900 text-xs font-black flex items-center justify-center">
                      {activeMeta.cta}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
