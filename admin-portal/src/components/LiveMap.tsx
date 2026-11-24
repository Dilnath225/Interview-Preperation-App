/**
 * LiveMap — Interactive Leaflet dark-mode map with real-time user markers
 */
import { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStore, TelemetryUser } from '../store';
import { apiPost } from '../api';

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
  const size = isSelected ? 22 : 15;
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
      box-shadow:0 0 ${isSelected ? 16 : 6}px ${color}90;
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

// ── Auto-pan / fly to selected user ──
function FocusSelectedUser({ selectedUser }: { selectedUser: TelemetryUser | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedUser?.latitude != null && selectedUser?.longitude != null) {
      map.flyTo([selectedUser.latitude, selectedUser.longitude], 13, { duration: 1.2 });
    }
  }, [selectedUser?.userId, selectedUser?.latitude, selectedUser?.longitude, map]);
  return null;
}

export default function LiveMap() {
  const token = useStore((s) => s.token);
  const users = useStore((s) => s.users);
  const selectedUserId = useStore((s) => s.selectedUserId);
  const trail = useStore((s) => s.trail);
  const selectUser = useStore((s) => s.selectUser);
  const updateUser = useStore((s) => s.updateUser);

  const [simulating, setSimulating] = useState(false);

  const usersWithCoords = useMemo(
    () => Array.from(users.values()).filter((u) => u.latitude !== null && u.longitude !== null),
    [users]
  );

  const trailCoords = useMemo(
    () => trail.map((p) => [p.latitude, p.longitude] as [number, number]).reverse(),
    [trail]
  );

  const selectedUser = selectedUserId ? users.get(selectedUserId) : null;
  const selectedCfg = selectedUser ? (ACTIVITY_CONFIG[selectedUser.activity] || ACTIVITY_CONFIG['IDLE']) : null;

  // Simulate test GPS ping for selected candidate
  const handleSimulatePing = async () => {
    if (!selectedUser || !token || simulating) return;
    setSimulating(true);
    try {
      const res = await apiPost(`/api/admin/users/${selectedUser.userId}/simulate-location`, {}, token);
      if (res.success && res.data) {
        updateUser(selectedUser.userId, {
          latitude: res.data.latitude,
          longitude: res.data.longitude,
          activity: res.data.activityContext,
          isOnline: true,
        });
      }
    } catch (err) {
      console.error('Failed to simulate location:', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="relative h-full w-full">
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
        <FocusSelectedUser selectedUser={selectedUser ?? null} />

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
                <div className="text-xs min-w-[190px]">
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
              weight: 3,
              opacity: 0.7,
              dashArray: '6 4',
            }}
          />
        )}
      </MapContainer>

      {/* Floating Candidate Telemetry Inspector Card */}
      {selectedUser && selectedCfg && (
        <div className="absolute top-4 right-4 z-[1000] w-80 bg-slate-900/95 border border-slate-700/60 rounded-xl p-4 shadow-2xl backdrop-blur-md text-white animate-fade-in">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ backgroundColor: selectedCfg.color + '25', color: selectedCfg.color }}
              >
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{selectedUser.name}</h4>
                <p className="text-[11px] text-slate-400 truncate max-w-[170px]">{selectedUser.email}</p>
              </div>
            </div>
            <button
              onClick={() => selectUser(null)}
              className="text-slate-500 hover:text-white text-xs px-2 py-1 rounded bg-slate-800/60"
            >
              ✕
            </button>
          </div>

          <div className="py-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Connection:</span>
              <span className={`font-semibold flex items-center gap-1.5 ${selectedUser.isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                <span className={`w-2 h-2 rounded-full ${selectedUser.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                {selectedUser.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Current Module:</span>
              <span
                className="font-bold px-2 py-0.5 rounded text-[10px]"
                style={{ backgroundColor: selectedCfg.color + '25', color: selectedCfg.color }}
              >
                {selectedCfg.label}
              </span>
            </div>

            {selectedUser.targetRole && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Role:</span>
                <span className="text-slate-200 font-medium">{selectedUser.targetRole}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800/80">
              {selectedUser.latitude != null && selectedUser.longitude != null ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Live GPS:</span>
                    <span className="text-cyan-400 font-mono text-[11px]">
                      {selectedUser.latitude.toFixed(4)}, {selectedUser.longitude.toFixed(4)}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    ✓ Telemetry active & pinned to map
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
                    ⚠️ <strong>No GPS telemetry received yet.</strong> Coordinates will pin automatically once this candidate logs into the updated mobile app.
                  </div>
                  <button
                    onClick={handleSimulatePing}
                    disabled={simulating}
                    className="w-full py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-xs shadow transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {simulating ? 'Sending Ping…' : '⚡ Simulate GPS Ping (Test Colombo Pin)'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
