"use client"

import React, { useCallback, useState } from 'react'
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api'

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '12px'
}

export default function MapPreview({ stops }: { stops: any[] }) {
  // 1. Cargamos el motor con tu llave de Netlify
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  })

  // 2. Calculamos el centro basado en tus paradas actuales
  const center = stops && stops.length > 0 
    ? { lat: stops[0].latitude, lng: stops[0].longitude }
    : { lat: 13.6893, lng: -89.1872 }; // San Salvador por defecto

  // 3. Convertimos tus paradas al formato de Google para la línea (Polyline)
  const pathCoordinates = stops.map(stop => ({
    lat: stop.latitude,
    lng: stop.longitude
  }))

  if (!isLoaded) return <div className="h-full w-full bg-muted animate-pulse rounded-xl" />

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
      options={{
        disableDefaultUI: true, // Mapa limpio como lo tenías
        zoomControl: true,
      }}
    >
      {/* Dibujamos la línea verde de la ruta que ya tenías en Leaflet */}
      <Polyline
        path={pathCoordinates}
        options={{
          strokeColor: "#059669",
          strokeOpacity: 1.0,
          strokeWeight: 4,
        }}
      />

      {/* Ponemos los marcadores de tus paradas reales */}
      {stops.map((stop) => (
        <Marker
          key={stop.id}
          position={{ lat: stop.latitude, lng: stop.longitude }}
          title={stop.name}
        />
      ))}
    </GoogleMap>
  )
}