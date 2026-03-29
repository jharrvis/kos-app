'use client'

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useState } from 'react'

// Fix for default marker icon in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

type Props = {
  latitude: number
  longitude: number
  onChange: (lat: number, lng: number) => void
}

export default function MapPicker({ latitude, longitude, onChange }: Props) {
  const [position, setPosition] = useState<[number, number]>([latitude, longitude])

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng
        setPosition([lat, lng])
        onChange(lat, lng)
      },
    })
    return null
  }

  return (
    <div>
      <MapContainer center={position} zoom={15} style={{ height: '400px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker
          position={position}
          draggable
          eventHandlers={{
            dragend(e) {
              const marker = e.target
              const { lat, lng } = marker.getLatLng()
              setPosition([lat, lng])
              onChange(lat, lng)
            },
          }}
        />
        <MapClickHandler />
      </MapContainer>
      <p className="text-center mt-2">Latitude: {position[0].toFixed(6)}, Longitude: {position[1].toFixed(6)}</p>
    </div>
  )
}