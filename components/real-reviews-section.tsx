"use client"

import { useState, useEffect } from "react"
import { Star, MessageSquare, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { API_BASE, fetchWithAuth } from "@/lib/store"

export interface RealReviewItem {
  id: number
  servicio: number
  servicio_nombre?: string
  autor_nombre: string
  calificacion: number
  comentario: string
  creado_el: string
}

interface RealReviewsSectionProps {
  mode: "service" | "business"
  targetId: number
  servicesForBusiness?: Array<{ id: number; name: string }>
  onStatsLoaded?: (rating: number, count: number) => void
}

export function RealReviewsSection({
  mode,
  targetId,
  servicesForBusiness = [],
  onStatsLoaded,
}: RealReviewsSectionProps) {
  const [reviews, setReviews] = useState<RealReviewItem[]>([])
  const [avgRating, setAvgRating] = useState<number>(5.0)
  const [reviewCount, setReviewCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  const [stars, setStars] = useState<number>(5)
  const [comment, setComment] = useState<string>("")
  const [chosenServiceId, setChosenServiceId] = useState<number>(
    mode === "service" ? targetId : servicesForBusiness[0]?.id || 0,
  )
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  useEffect(() => {
    if (mode === "business" && servicesForBusiness.length > 0 && !chosenServiceId) {
      setChosenServiceId(servicesForBusiness[0].id)
    }
  }, [mode, servicesForBusiness, chosenServiceId])

  useEffect(() => {
    if (!targetId) return
    let active = true
    const loadReviews = async () => {
      setLoading(true)
      try {
        const url =
          mode === "service"
            ? `${API_BASE}/catalog/${targetId}/reviews/`
            : `${API_BASE}/catalog/business-reviews/?business_id=${targetId}`
        const res = await fetch(url)
        if (!res.ok) return
        const data = await res.json()
        if (!active) return
        setReviews(data.reviews || [])
        const r = Number(data.calificacion ?? 5.0)
        const c = Number(data.numero_resenas ?? 0)
        setAvgRating(r)
        setReviewCount(c)
        onStatsLoaded?.(r, c)
      } catch {
        // Keep silent fallback
      } finally {
        if (active) setLoading(false)
      }
    }
    loadReviews()
    return () => {
      active = false
    }
  }, [mode, targetId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackMsg(null)
    const serviceToReview = mode === "service" ? targetId : chosenServiceId || servicesForBusiness[0]?.id
    if (!serviceToReview) {
      setFeedbackMsg({ type: "err", text: "Este comercio aún no tiene servicios disponibles para reseñar." })
      return
    }
    if (!comment.trim()) {
      setFeedbackMsg({ type: "err", text: "Escribe un comentario sobre tu experiencia." })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetchWithAuth(`${API_BASE}/catalog/${serviceToReview}/reviews/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calificacion: stars, comentario: comment.trim() }),
      })
      if (res.status === 401) {
        setFeedbackMsg({ type: "err", text: "Inicia sesión para publicar tu reseña y calificación." })
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFeedbackMsg({ type: "err", text: data.error || "No se pudo guardar tu reseña." })
        return
      }
      if (data.review) {
        setReviews((prev) => [data.review, ...prev])
      }
      const nextRating = Number(data.calificacion ?? avgRating)
      const nextCount = Number(data.numero_resenas ?? reviewCount + 1)
      setAvgRating(nextRating)
      setReviewCount(nextCount)
      onStatsLoaded?.(nextRating, nextCount)
      setComment("")
      setStars(5)
      setFeedbackMsg({ type: "ok", text: "¡Tu reseña y calificación se han guardado!" })
    } catch {
      setFeedbackMsg({ type: "err", text: "Error de conexión al enviar tu reseña." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section
      id="resenas-reales"
      className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-2xs space-y-5"
    >
      {/* Header with real aggregate rating */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-2xl bg-[#eaf0e2] text-[#105238] flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-extrabold text-base text-foreground">Reseñas y Calificaciones</h3>
            <p className="text-xs text-muted-foreground">
              {reviewCount === 0
                ? "Sé el primero en compartir tu experiencia real"
                : `${reviewCount} ${reviewCount === 1 ? "reseña verificada" : "reseñas verificadas"}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#eaf0e2] border border-[#aeb6a1]/50 px-3 py-1.5 rounded-2xl">
          <Star className="w-4 h-4 fill-[#105238] text-[#105238]" />
          <span className="font-black text-sm text-[#105238]">{avgRating.toFixed(1)}</span>
          <span className="text-xs text-[#105238]/80">({reviewCount})</span>
        </div>
      </div>

      {/* Submit Review Form */}
      <form onSubmit={handleSubmit} className="bg-[#fafaf8] dark:bg-background border border-border/80 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-foreground">Tu calificación:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars(n)}
                className="p-1 cursor-pointer transition-transform hover:scale-110"
                aria-label={`${n} estrellas`}
              >
                <Star
                  className={cn(
                    "w-5 h-5",
                    n <= stars ? "fill-[#105238] text-[#105238]" : "text-muted-foreground/35",
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {mode === "business" && servicesForBusiness.length > 1 && (
          <select
            value={chosenServiceId}
            onChange={(e) => setChosenServiceId(Number(e.target.value))}
            className="w-full h-9 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground"
          >
            {servicesForBusiness.map((s) => (
              <option key={s.id} value={s.id}>
                Experiencia: {s.name}
              </option>
            ))}
          </select>
        )}

        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="¿Cómo estuvo la atención, el lugar y la experiencia? Cuéntalo aquí..."
          className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#105238]"
        />

        {feedbackMsg && (
          <p
            className={cn(
              "text-xs font-bold px-3 py-1.5 rounded-xl",
              feedbackMsg.type === "ok"
                ? "bg-[#eaf0e2] text-[#105238]"
                : "bg-muted text-foreground",
            )}
          >
            {feedbackMsg.text}
          </p>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitting}
            className="h-9 px-4 rounded-xl bg-[#105238] hover:bg-[#0c3e2b] text-white text-xs font-bold gap-1.5 cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-[#8ee01a]" />
            )}
            <span>{submitting ? "Publicando..." : "Publicar reseña"}</span>
          </Button>
        </div>
      </form>

      {/* Reviews List */}
      {loading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-[#105238]" />
          <span>Cargando reseñas...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground border-t border-border/50">
          Todavía no hay reseñas escritas. ¡Tu opinión ayuda a otros viajeros!
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-[#fafaf8] dark:bg-background border border-border/70 rounded-2xl p-3.5 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-foreground truncate">{rev.autor_nombre}</p>
                  {mode === "business" && rev.servicio_nombre && (
                    <p className="text-[10px] font-semibold text-[#105238] truncate">{rev.servicio_nombre}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-0.5 bg-[#eaf0e2] text-[#105238] px-2 py-0.5 rounded-full text-[11px] font-bold">
                    <Star className="w-3 h-3 fill-[#105238]" /> {rev.calificacion}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(rev.creado_el).toLocaleDateString("es-SV", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">{rev.comentario}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
