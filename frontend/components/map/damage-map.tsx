"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { DamageReport, DamageType, ReportStatus } from "@/lib/types";
import { DAMAGE_TYPE_LABELS, STATUS_LABELS } from "@/lib/constants";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((m) => m.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

const severityColors: Record<string, string> = {
  low: "#64748b",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

interface DamageMapProps {
  reports: DamageReport[];
  height?: string;
  filterType?: DamageType | "all";
  filterStatus?: ReportStatus | "all";
}

export function DamageMap({
  reports,
  height = "500px",
  filterType = "all",
  filterStatus = "all",
}: DamageMapProps) {
  const filtered = useMemo(
    () =>
      reports.filter((r) => {
        if (filterType !== "all" && r.damageType !== filterType) return false;
        if (filterStatus !== "all" && r.status !== filterStatus) return false;
        return true;
      }),
    [reports, filterType, filterStatus]
  );

  const center = useMemo(() => {
    if (filtered.length === 0) return { lat: 28.6139, lng: 77.209 };
    const avgLat =
      filtered.reduce((s, r) => s + r.location.lat, 0) / filtered.length;
    const avgLng =
      filtered.reduce((s, r) => s + r.location.lng, 0) / filtered.length;
    return { lat: avgLat, lng: avgLng };
  }, [filtered]);

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-xl border border-line shadow-[var(--shadow-soft)]">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filtered.map((report) => (
          <CircleMarker
            key={report.id}
            center={[report.location.lat, report.location.lng]}
            radius={10}
            pathOptions={{
              color: severityColors[report.severity],
              fillColor: severityColors[report.severity],
              fillOpacity: 0.7,
            }}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">
                  {DAMAGE_TYPE_LABELS[report.damageType]}
                </p>
                <p>{report.location.address}</p>
                <p className="capitalize">Severity: {report.severity}</p>
                <p>Status: {STATUS_LABELS[report.status]}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
