/**
 * LiveMap — Interactive Leaflet dark-mode map with real-time user markers
 */
import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStore, TelemetryUser } from '../store';

// ── Activity → color/label config ──
export const ACTIVITY_CONFIG: Record<string, { color: string; label: string }> = {
  IDLE: { color: '#94a3b8', label: 'Idle' },
  MOCK_INTERVIEW: { color: '#10b981', label: 'Interview' },
  CODING_SANDBOX: { color: '#38bdf8', label: 'Coding' },
  ATS_SCANNER: { color: '#f59e0b', label: 'ATS Scan' },
  CAREER_COACH: { color: '#a855f7', label: 'Career AI' },
};

// ── Create colored circle marker icon ──
function createMarkerIcon(color: string, isSelected: boolean): L.DivIcon {
  const size = isSelected ? 20 : 14;
  const borderWidth = isSelected ? 3 : 2;
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${color};
      border:${borderWidth}px solid #0f172a;
      box-shadow:0 0 ${isSelected ? 12 : 6}px ${color}80;
      transition: all 0.3s ease;
    "></div>`,
  });
}

// ── Auto-fit map to markers ──
function FitBounds({ users }: { users: TelemetryUser[] }) {
  const map = useMap();
  useEffect(() => {
    const coords = users
      .filter((u) => u.latitude !== null && u.longitude !== null)
      .map((u) => [u.latitude!, u.longitude!] as [number, number]);
    if (coords.length > 0) {
      map.fitBounds(L.latLngBounds(coords).pad(0.3), { maxZoom: 12 });
    }
  }, [users.length]);
  return null;
}

export default function LiveMap() {
  const users = useStore((s) => s.users);
  const selectedUserId = useStore((s) => s.selectedUserId);
  const trail = useStore((s) => s.trail);
  const selectUser = useStore((s) => s.selectUser);

  const usersWithCoords = useMemo(
    () => Array.from(users.values()).filter((u) => u.latitude !== null && u.longitude !== null),
    [users]
  );

  const trailCoords = useMemo(
    () => trail.map((p) => [p.latitude, p.longitude] as [number, number]).reverse(),
    [trail]
  );

  const selectedUser = selectedUserId ? users.get(selectedUserId) : null;

  return (
    <MapContainer
      center={[7.8731, 80.7718]} // Sri Lanka center default
      zoom={8}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
      />

      <FitBounds users={usersWithCoords} />

      {usersWithCoords.map((user) => {
        const cfg = ACTIVITY_CONFIG[user.activity] || ACTIVITY_CONFIG['IDLE'];
        const isSelected = user.userId === selectedUserId;

        return (
          <Marker
            key={user.userId}
            position={[user.latitude!, user.longitude!]}
            icon={createMarkerIcon(cfg.color, isSelected)}
            eventHandlers={{
              click: () => selectUser(isSelected ? null : user.userId),
            }}
          >
            <Popup>
              <div className="text-xs min-w-[180px]">
                <p className="font-bold text-sm mb-1" style={{ color: cfg.color }}>
                  {user.name}
                </p>
                <p className="text-slate-400 mb-1">{user.email}</p>
                <div
                  className="inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1"
                  style={{ backgroundColor: cfg.color + '25', color: cfg.color }}
                >
                  {cfg.label}
                </div>
                {user.targetRole && (
                  <p className="text-slate-400 mt-1 text-[10px]">🎯 {user.targetRole}</p>
                )}
                <p className="text-slate-500 text-[10px] mt-1">
                  📍 {user.latitude!.toFixed(4)}, {user.longitude!.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Trail polyline for selected user */}
      {selectedUser && trailCoords.length > 1 && (
        <Polyline
          positions={trailCoords}
          pathOptions={{
            color: (ACTIVITY_CONFIG[selectedUser.activity] || ACTIVITY_CONFIG['IDLE']).color,
            weight: 2,
            opacity: 0.6,
            dashArray: '6 4',
          }}
        />
      )}
    </MapContainer>
  );
}
