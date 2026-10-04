"use client"

import React, { useState } from "react"
import { Star, X, CheckCircle, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"

interface RateTripModalProps {
  routeId: number
  routeName: string
  driverName?: string
  driverAvatar?: string
  onClose: () => void
  onSuccess?: () => void
}

export function RateTripModal({
  routeId,
  routeName,
  driverName,
  driverAvatar,
  onClose,
  onSuccess,
}: RateTripModalProps) {
  const [selectedStars, setSelectedStars] = useState<number>(5)
  const [hoveredStars, setHoveredStars] = useState<number | null>(null)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { rateTrip } = useAppStore()

  const handleSubmit = async () => {
    if (selectedStars < 1) return
    setIsSubmitting(true)
    setErrorMsg(null)
    const res = await rateTrip(routeId, selectedStars, comment)
    setIsSubmitting(false)
    if (res.success) {
      setIsDone(true)
      if (onSuccess) onSuccess()
      setTimeout(() => {
        onClose()
      }, 1500)
    } else {
      setErrorMsg(res.error || "No se pudo registrar la calificación.")
    }
  }

  const activeStars = hoveredStars || selectedStars

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 border border-gray-100 overflow-hidden relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isDone ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">¡Gracias por calificar!</h3>
            <p className="text-sm text-gray-500">Tu opinión nos ayuda a mejorar el servicio de transporte.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                {driverAvatar ? (
                  <img src={driverAvatar} alt="Chofer" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <Star className="w-7 h-7 fill-amber-400 text-amber-500" />
                )}
              </div>
              <h3 className="text-lg font-black text-gray-900 leading-tight">
                Calificar Viaje
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {driverName ? `Chofer: ${driverName}` : routeName}
              </p>
            </div>

            {/* Stars selector */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredStars(star)}
                    onMouseLeave={() => setHoveredStars(null)}
                    onClick={() => setSelectedStars(star)}
                    className="p-1 hover:scale-125 transition-transform active:scale-95"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= activeStars
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-600">
                {activeStars === 5 && "¡Excelente servicio!"}
                {activeStars === 4 && "Muy buen viaje"}
                {activeStars === 3 && "Bueno"}
                {activeStars === 2 && "Regular"}
                {activeStars === 1 && "Malo"}
              </span>
            </div>

            {/* Comment */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                Comentario adicional (opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="¿Cómo estuvo el chofer y el recorrido?"
                className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-gray-50"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-500 text-center font-medium bg-red-50 p-2 rounded-lg">
                {errorMsg}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={onClose}
                className="flex-1 rounded-xl text-gray-600 font-bold text-xs h-11"
              >
                Omitir
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-[#064e3b] hover:bg-[#043324] text-white font-bold text-xs h-11 rounded-xl shadow-md"
              >
                {isSubmitting ? "Enviando..." : "Enviar Calificación"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
