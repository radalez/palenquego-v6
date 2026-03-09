"use client"
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
// @ts-ignore
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Arreglo para los iconos de Leaflet en Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapPreview({ stops }: { stops: any[] }) {
  if (!stops || stops.length === 0) return null;

  const center: [number, number] = [stops[0].latitude, stops[0].longitude];
  const polylinePositions = stops.map(s => [s.latitude, s.longitude] as [number, number]);

  return (
    <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%', borderRadius: '12px', zIndex: 0 }} // <-- Agrega zIndex: 0
        >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {stops.map((stop) => (
          <Marker key={stop.id} position={[stop.latitude, stop.longitude]} icon={customIcon}>
            <Popup>{stop.name}</Popup>
          </Marker>
        ))}
      <Polyline positions={polylinePositions} color="#059669" weight={4} />
    </MapContainer>
  );
}