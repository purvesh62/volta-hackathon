"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { DispatchPlan } from "@/lib/dispatch";
import type { LatLng } from "@/lib/geo";
import { clock, PRIORITY_HEX, teamHex } from "./colors";

const HALIFAX: [number, number] = [44.67, -63.6];

function numberIcon(n: number, hex: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${hex};color:#fff;width:22px;height:22px;border-radius:11px;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);font:600 11px/18px system-ui;text-align:center">${n}</div>`,
    iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -11],
  });
}

function Fit({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
  }, [map, points]);
  return null;
}

export default function DispatchMap({ plan, depot, selected }: { plan: DispatchPlan; depot: LatLng; selected: number | null }) {
  const teams = plan.teams.filter((t) => selected === null || t.id === selected);
  const points: [number, number][] = [[depot.lat, depot.lng], ...teams.flatMap((t) => t.stops.map((s) => [s.wo.lat, s.wo.lng] as [number, number]))];
  return (
    <MapContainer center={HALIFAX} zoom={11} className="h-[72vh] w-full rounded-md border">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Fit points={points} />
      <CircleMarker center={[depot.lat, depot.lng]} radius={9} pathOptions={{ color: "#12283a", fillColor: "#fff", fillOpacity: 1, weight: 3 }}>
        <Popup>Depot · crews leave 08:00</Popup>
      </CircleMarker>
      {teams.map((t) => {
        const hex = teamHex(t.id - 1);
        const path: [number, number][] = [[depot.lat, depot.lng], ...t.stops.map((s) => [s.wo.lat, s.wo.lng] as [number, number])];
        return (
          <div key={t.id}>
            <Polyline positions={path} pathOptions={{ color: hex, weight: 3, opacity: 0.85 }} />
            {t.stops.map((s, n) => (
              <Marker key={s.wo.id} position={[s.wo.lat, s.wo.lng]} icon={numberIcon(n + 1, hex)}>
                <Popup>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">Crew {t.id} · stop {n + 1}</div>
                    <div>#{s.wo.id} · {s.wo.workType}</div>
                    <div>{s.wo.address}</div>
                    <div style={{ color: PRIORITY_HEX[s.priority] }} className="font-medium">{s.priority} · {s.depart - s.arrive} h</div>
                    <div className="text-xs">{clock(s.arrive)} – {clock(s.depart)}{s.travelMin ? ` · ${s.travelMin} min drive` : ""}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </div>
        );
      })}
    </MapContainer>
  );
}
