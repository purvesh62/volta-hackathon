"use client";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { StatusBadge, TIER_HEX } from "@/components/status-badge";
import type { WorkOrder } from "@/lib/types";

const HALIFAX: [number, number] = [44.67, -63.6];
const MAX_MARKERS = 5000;

export default function WoMap({ rows }: { rows: WorkOrder[] }) {
  const shown = rows.slice(0, MAX_MARKERS);
  return (
    <MapContainer center={HALIFAX} zoom={11} className="h-[70vh] w-full rounded-md border" preferCanvas>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {shown.map((r) => (
        <CircleMarker key={r.id} center={[r.lat, r.lng]} radius={r.changed ? 6 : 4}
          pathOptions={{ color: TIER_HEX[r.newStatus], fillColor: TIER_HEX[r.newStatus], fillOpacity: 0.8, weight: r.changed ? 2 : 1 }}>
          <Popup>
            <div className="space-y-1 text-sm">
              <div className="font-medium">#{r.id} · {r.workType}</div>
              <div>{r.address}</div>
              <div className="flex items-center gap-1"><StatusBadge tier={r.oldStatus} /> → <StatusBadge tier={r.newStatus} /></div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
