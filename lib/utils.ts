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
