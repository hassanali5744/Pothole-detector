"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in Leaflet with React
const createCustomIcon = () => {
  return L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

const customIcon = createCustomIcon();

interface MapControllerProps {
  center: [number, number];
  zoom?: number;
}

function MapController({ center, zoom = 18 }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (center[0] !== 0 && center[1] !== 0) {
      map.setView(center, zoom, {
        animate: true,
        duration: 1,
      });
    }
  }, [center, zoom, map]);

  return null;
}

interface LocationMapProps {
  latitude: number;
  longitude: number;
  className?: string;
}

export function LocationMap({ latitude, longitude, className = "" }: LocationMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  const center: [number, number] = [latitude, longitude];
  const hasLocation = latitude !== 0 && longitude !== 0;

  if (!hasLocation) {
    return (
      <div className={`flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface-muted/40 ${className}`}>
        <p className="text-sm text-muted">Click "Use Current GPS Location" to see the map</p>
      </div>
    );
  }

  return (
    <div className={`h-64 w-full rounded-xl overflow-hidden border border-line ${className}`}>
      <MapContainer
        center={center}
        zoom={18}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={18} />
        <Marker position={center} icon={customIcon}>
          {/* You can add a popup here if needed */}
        </Marker>
      </MapContainer>
    </div>
  );
}
