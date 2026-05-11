"use client"

import React, { useCallback, useState } from 'react'
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api'

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

export default function MapPreview({ stops, unitLocation }: MapPreviewProps) {
  // 1. Cargamos el motor con tu llave de Netlify
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  })

  const [map, setMap] = useState(null)

  // 2. Calculamos el centro: Si hay bus, centramos ahí. Si no, en la primera parada.
  const center = unitLocation 
    ? { lat: unitLocation.lat, lng: unitLocation.lng }
    : (stops && stops.length > 0 
        ? { lat: stops[0].latitude, lng: stops[0].longitude }
        : { lat: 13.6893, lng: -89.1872 }); // San Salvador por defecto

  // 3. Convertimos paradas para la línea de ruta (Polyline)
  const pathCoordinates = stops.map(stop => ({
    lat: stop.latitude,
    lng: stop.longitude
  }))

  const onLoad = useCallback(function callback(mapInstance: any) {
    setMap(mapInstance)
  }, [])

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
      {stops.map((stop) => (
        <Marker
          key={stop.id}
          position={{ lat: stop.latitude, lng: stop.longitude }}
          title={stop.name}
          label={{
            text: stop.name.charAt(0),
            color: "white",
            fontSize: "10px",
            fontWeight: "bold"
          }}
        />
      ))}

      {/* 6. EL BUS (Marcador que se mueve en tiempo real) */}
      {unitLocation && (
        <Marker
          position={unitLocation}
          title="Ubicación del Bus"
          icon={{
            url: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png",
            scaledSize: new window.google.maps.Size(45, 45),
            anchor: new window.google.maps.Point(22, 22)
          }}
        />
      )}
    </GoogleMap>
  )
}