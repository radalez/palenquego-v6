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
  if (cleaned.startsWith("stores/") || cleaned.startsWith("/stores/")) {
    const p = cleaned.startsWith("/") ? cleaned : `/${cleaned}`
    return `https://palenquego.com/media${p}`
  }
  if (cleaned.startsWith("media/") || cleaned.startsWith("/media/")) {
    const p = cleaned.startsWith("/") ? cleaned : `/${cleaned}`
    return `https://palenquego.com${p}`
  }
  const cleanPath = cleaned.startsWith("/") ? cleaned : `/${cleaned}`
  return `https://palenquego.com${cleanPath}`
}

const TOUR_THEMED_PHOTOS: Array<{ keywords: string[]; urls: string[] }> = [
  {
    keywords: ["volcan", "volcán", "crater", "cráter", "santa ana", "izalco", "cerro verde", "boqueron", "boquerón"],
    urls: [
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&q=80",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=80",
    ],
  },
  {
    keywords: ["rio", "río", "sumpul", "cascada", "tubing", "lago", "coatepeque", "ilopango", "suchitlan", "jiquilisco", "bahia", "bahía"],
    urls: [
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=80",
      "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=900&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80",
    ],
  },
  {
    keywords: ["sunset", "malecon", "malecón", "puerto", "playa", "surf", "costa", "tunco", "libertad", "mar"],
    urls: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=900&q=80",
      "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=900&q=80",
    ],
  },
  {
    keywords: ["flores", "nahuizalco", "juayua", "juayúa", "apaneca", "salcoatitan", "suchitoto", "cafe", "café", "colonial", "añil"],
    urls: [
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=900&q=80",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900&q=80",
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=900&q=80",
    ],
  },
  {
    keywords: ["gastronom", "pupusa", "comida", "mercado", "gourmet", "zen"],
    urls: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=80",
    ],
  },
  {
    keywords: ["bosque", "montaña", "montana", "pital", "imposible", "caminata", "sendero", "ecoturismo"],
    urls: [
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&q=80",
    ],
  },
]

const URBAN_FALLBACK_PHOTOS = [
  "https://res.cloudinary.com/dacanh1gn/image/upload/v1791135828/palenque_banners/slide_1_interurbano_montanas.webp",
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900&q=80",
  "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=900&q=80",
]

function buildGoogleStaticMapUrl(stops: any[], apiKey: string): string | null {
  const valid = (stops || [])
    .map((s) => ({ lat: Number(s.latitude), lng: Number(s.longitude) }))
    .filter((pt) => !isNaN(pt.lat) && !isNaN(pt.lng) && pt.lat !== 0 && pt.lng !== 0)
  if (valid.length === 0) return null

  const first = valid[0]
  const last = valid[valid.length - 1]
  const sampled = valid.length > 10
    ? valid.filter((_, i) => i === 0 || i === valid.length - 1 || i % Math.ceil(valid.length / 8) === 0)
    : valid
  const pathPoints = sampled.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|")

  const params = new URLSearchParams({
    size: "800x480",
    scale: "2",
    maptype: "roadmap",
    style: "feature:poi|visibility:off",
    key: apiKey,
  })
  const markers =
    `&markers=${encodeURIComponent(`color:0x105238|label:A|${first.lat.toFixed(5)},${first.lng.toFixed(5)}`)}` +
    (valid.length > 1
      ? `&markers=${encodeURIComponent(`color:0x8ee01a|label:B|${last.lat.toFixed(5)},${last.lng.toFixed(5)}`)}`
      : "")
  const path = valid.length > 1 ? `&path=${encodeURIComponent(`color:0x105238ff|weight:5|${pathPoints}`)}` : ""

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}${markers}${path}`
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

  // 2. imagen_portada o image
  if (route.imagen_portada && typeof route.imagen_portada === 'string' && route.imagen_portada.trim()) {
    return formatImageUrl(route.imagen_portada)
  }
  if (route.image && typeof route.image === 'string' && route.image.trim()) {
    return formatImageUrl(route.image)
  }

  // 3. stops_images array
  if (Array.isArray(route.stops_images) && route.stops_images.length > 0) {
    const first = route.stops_images[0]
    if (first && typeof first === 'string' && first.trim()) {
      return formatImageUrl(first)
    }
  }

  // 4. Paradas con imagen real
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

  const rType = String(route.route_type || "").toUpperCase()
  const isTour = rType === "TOUR" || String(route.name || "").toLowerCase().startsWith("tour")

  // 5. Para rutas Urbanas / Interurbanas sin foto: Google Maps Static real de su ubicación y trazado
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  if (!isTour && mapsKey && Array.isArray(route.stops) && route.stops.length > 0) {
    const staticMapUrl = buildGoogleStaticMapUrl(route.stops, mapsKey)
    if (staticMapUrl) return staticMapUrl
  }

  // 6. Para Tours sin foto del backend: foto temática realista según ubicación / palabras clave
  const haystack = `${route.name || ""} ${route.descripcion || ""} ${(route.stops || []).map((s: any) => s.name || "").join(" ")}`.toLowerCase()
  const seedId = Math.abs(Number(route.id) || 0)

  for (const group of TOUR_THEMED_PHOTOS) {
    if (group.keywords.some((kw) => haystack.includes(kw))) {
      return group.urls[seedId % group.urls.length]
    }
  }

  if (!isTour) {
    return URBAN_FALLBACK_PHOTOS[seedId % URBAN_FALLBACK_PHOTOS.length]
  }

  const allTourPool = TOUR_THEMED_PHOTOS.flatMap((g) => g.urls)
  return allTourPool[seedId % allTourPool.length] || DEFAULT_FALLBACK_IMAGE
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

