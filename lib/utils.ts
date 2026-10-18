import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DEFAULT_FALLBACK_IMAGE = "https://res.cloudinary.com/dacanh1gn/image/upload/v1791135831/palenque_banners/slide_3_tours_costa.webp"

export function formatImageUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl || typeof rawUrl !== "string") return DEFAULT_FALLBACK_IMAGE
  
  // Si viene una lista separada por comas, punto y coma o saltos de línea, tomar la primera
  const cleaned = rawUrl.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)[0]
  if (!cleaned) return DEFAULT_FALLBACK_IMAGE

  if (cleaned.startsWith("http://") || cleaned.startsWith("https://") || cleaned.startsWith("data:") || cleaned.startsWith("blob:")) {
    return cleaned
  }
  if (cleaned.startsWith("/placeholder.svg")) {
    return cleaned
  }
  const cleanPath = cleaned.startsWith("/") ? cleaned : `/${cleaned}`
  return `https://palenquego.com${cleanPath}`
}

export function getRouteImageUrl(route: any): string {
  if (!route) return DEFAULT_FALLBACK_IMAGE

  // 1. Array de imágenes de la ruta
  if (Array.isArray(route.imagenes) && route.imagenes.length > 0) {
    const first = route.imagenes[0]
    if (first && typeof first === 'string' && first.trim()) {
      return formatImageUrl(first)
    }
  }

  // 2. imagen_portada
  if (route.imagen_portada && typeof route.imagen_portada === 'string' && route.imagen_portada.trim()) {
    return formatImageUrl(route.imagen_portada)
  }

  // 3. stops_images array
  if (Array.isArray(route.stops_images) && route.stops_images.length > 0) {
    const first = route.stops_images[0]
    if (first && typeof first === 'string' && first.trim()) {
      return formatImageUrl(first)
    }
  }

  // 4. Paradas con imagen
  if (Array.isArray(route.stops)) {
    for (const stop of route.stops) {
      if (stop.imagen && typeof stop.imagen === 'string' && stop.imagen.trim()) {
        return formatImageUrl(stop.imagen)
      }
      if (stop.image && typeof stop.image === 'string' && stop.image.trim()) {
        return formatImageUrl(stop.image)
      }
    }
  }

  return DEFAULT_FALLBACK_IMAGE
}

export function handleImageFallback(e: React.SyntheticEvent<HTMLImageElement, Event>, customFallback?: string) {
  const target = e.currentTarget
  const fallback = customFallback || DEFAULT_FALLBACK_IMAGE
  if (!target.dataset.fallbackTried) {
    target.dataset.fallbackTried = "true"
    target.src = fallback
  }
}

/**
 * Reproduce un tono chime de notificación suave y elegante usando la Web Audio API
 * e invoca la vibración háptica en dispositivos móviles sin depender de archivos de audio externos.
 */
export function playNotificationSound() {
  if (typeof window === "undefined") return

  // 1. Vibración háptica en teléfonos móviles
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate([70, 40, 70])
    } catch (e) {}
  }

  // 2. Chime armónico sintético nativo (D5 -> A5)
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const now = ctx.currentTime

    // Tono base (587.33 Hz - D5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = "sine"
    osc1.frequency.setValueAtTime(587.33, now)
    gain1.gain.setValueAtTime(0.18, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.35)

    // Tono armónico superior (880 Hz - A5)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = "sine"
    osc2.frequency.setValueAtTime(880, now + 0.08)
    gain2.gain.setValueAtTime(0.22, now + 0.08)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.08)
    osc2.stop(now + 0.55)
  } catch (e) {
    // Si el navegador bloquea audio antes de interacción, se maneja de forma segura
  }
}

