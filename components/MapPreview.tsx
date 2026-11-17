"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api'
import { WifiOff, MapPin } from 'lucide-react'

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '12px'
}

interface MapPreviewProps {
  stops: any[]
  unitLocation?: {
    lat: number
    lng: number
  }
}

const GOOGLE_MAPS_LIBRARIES: ('places')[] = ['places']

export default function MapPreview({ stops, unitLocation }: MapPreviewProps) {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsOffline(!navigator.onLine)
    const onOff = () => setIsOffline(true)
    const onOn = () => setIsOffline(false)
    window.addEventListener('offline', onOff)
    window.addEventListener('online', onOn)
    return () => {
      window.removeEventListener('offline', onOff)
      window.removeEventListener('online', onOn)
    }
  }, [])

  // 1. Cargamos el motor con tu llave de Netlify
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  const [map, setMap] = useState(null)

  // 2. Calculamos el centro: Si hay bus, centramos ahí. Si no, en la primera parada.
  const center = unitLocation
    ? { lat: Number(unitLocation.lat) || 13.6893, lng: Number(unitLocation.lng) || -89.1872 }
    : (stops && stops.length > 0
        ? { lat: Number(stops[0].latitude) || 13.6893, lng: Number(stops[0].longitude) || -89.1872 }
        : { lat: 13.6893, lng: -89.1872 })

  // 3. Convertimos paradas para la línea de ruta (Polyline)
  const pathCoordinates = (stops || []).map(stop => ({
    lat: Number(stop.latitude),
    lng: Number(stop.longitude)
  })).filter(pt => !isNaN(pt.lat) && !isNaN(pt.lng))

  const onLoad = useCallback(function callback(mapInstance: any) {
    setMap(mapInstance)
  }, [])

  // Respaldo visual offline cuando no hay internet o Google Maps no puede cargar
  if (isOffline || loadError || (!isLoaded && typeof navigator !== 'undefined' && !navigator.onLine)) {
    const validStops = (stops || []).filter(
      (s) => !isNaN(Number(s.latitude)) && !isNaN(Number(s.longitude))
    )
    const lats = validStops.map((s) => Number(s.latitude))
    const lngs = validStops.map((s) => Number(s.longitude))
    const minLat = lats.length ? Math.min(...lats) : 13.6
    const maxLat = lats.length ? Math.max(...lats) : 13.7
    const minLng = lngs.length ? Math.min(...lngs) : -89.25
    const maxLng = lngs.length ? Math.max(...lngs) : -89.15
    const latSpan = Math.max(maxLat - minLat, 0.01)
    const lngSpan = Math.max(maxLng - minLng, 0.01)

    const points = validStops.map((s, idx) => {
      const x = 18 + ((Number(s.longitude) - minLng) / lngSpan) * 64
      const y = 82 - ((Number(s.latitude) - minLat) / latSpan) * 64
      return { x, y, name: s.name || `Parada ${idx + 1}`, order: s.order || idx + 1 }
    })

    const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ")

    return (
      <div className="relative h-full w-full bg-[#eaf0e2] rounded-xl overflow-hidden flex flex-col justify-between p-3 border border-[#aeb6a1]/50">
        <div className="flex items-center justify-between gap-2 z-10">
          <span className="inline-flex items-center gap-1.5 bg-[#105238] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
            <WifiOff className="w-3 h-3 text-[#8ee01a]" />
            Mapa offline · Paradas guardadas
          </span>
          <span className="text-[10px] font-bold text-[#105238] bg-white/90 px-2 py-0.5 rounded-full">
            {validStops.length} paradas
          </span>
        </div>

        <svg viewBox="0 0 100 100" className="w-full flex-1 my-1">
          {points.length > 1 && (
            <polyline
              fill="none"
              stroke="#105238"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="3 2"
              points={polylinePoints}
            />
          )}
          {points.map((p) => (
            <g key={p.order}>
              <circle cx={p.x} cy={p.y} r="4.2" fill="#105238" stroke="#8ee01a" strokeWidth="1.2" />
              <text
                x={p.x}
                y={p.y + 1.4}
                textAnchor="middle"
                fontSize="3.8"
                fontWeight="bold"
                fill="#ffffff"
              >
                {p.order}
              </text>
            </g>
          ))}
        </svg>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide z-10">
          {points.slice(0, 4).map((p) => (
            <span
              key={p.order}
              className="inline-flex items-center gap-1 bg-white/95 text-[#105238] text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap shadow-2xs shrink-0"
            >
              <MapPin className="w-2.5 h-2.5" />
              {p.order}. {p.name}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full bg-muted animate-pulse rounded-xl flex items-center justify-center text-muted-foreground text-xs">
        Cargando Satélites de Google...
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14}
      onLoad={onLoad}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      }}
    >
      {/* 4. Dibujamos la línea de la ruta */}
      <Polyline
        path={pathCoordinates}
        options={{
          strokeColor: "#059669",
          strokeOpacity: 0.8,
          strokeWeight: 5,
        }}
      />

      {/* 5. Ponemos los marcadores de las paradas */}
      {(stops || []).map((stop) => {
        const lat = Number(stop.latitude)
        const lng = Number(stop.longitude)
        if (isNaN(lat) || isNaN(lng)) return null
        return (
          <Marker
            key={stop.id}
            position={{ lat, lng }}
            title={stop.name}
            label={{
              text: stop.name ? stop.name.charAt(0) : 'P',
              color: "white",
              fontSize: "10px",
              fontWeight: "bold"
            }}
          />
        )
      })}

      {/* 6. EL BUS (Marcador que se mueve en tiempo real) */}
      {unitLocation && !isNaN(Number(unitLocation.lat)) && !isNaN(Number(unitLocation.lng)) && (
        <Marker
          position={{ lat: Number(unitLocation.lat), lng: Number(unitLocation.lng) }}
          title="Ubicación del Bus"
          icon={typeof window !== 'undefined' && window.google?.maps?.Size ? {
            url: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png",
            scaledSize: new window.google.maps.Size(45, 45),
            anchor: new window.google.maps.Point(22, 22)
          } : undefined}
        />
      )}
    </GoogleMap>
  )
}
