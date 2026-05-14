// src/pages/GPSTrackingPage.jsx - Real-time GPS tracking with Leaflet
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { connectSocket, getSocket } from '../services/socket';
import api from '../services/api';
import { Navigation, Bus, Clock, Wifi, WifiOff } from 'lucide-react';
import { format } from 'date-fns';

// Custom bus icon
const createBusIcon = (color = '#0ea5e9') => L.divIcon({
  className: '',
  html: `
    <div style="
      width:36px;height:36px;background:${color};
      border-radius:50%;border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 12px rgba(0,0,0,0.4);
      animation: pulse-dot 2s ease-in-out infinite;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="3" width="22" height="13" rx="2"/><path d="M16 16v3a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3"/><path d="M8 16v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3"/><path d="M1 10h22"/><path d="M8 6h8"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20]
});

const BUS_COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, map.getZoom(), { duration: 1 });
  }, [center, map]);
  return null;
}

export default function GPSTrackingPage() {
  const [busPositions, setBusPositions] = useState({});
  const [busTrails, setBusTrails] = useState({});
  const [routes, setRoutes] = useState([]);
  const [connected, setConnected] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const GUATEMALA_CENTER = [14.634, -90.507];

  useEffect(() => {
    // Load routes for reference
    api.get('/routes').then(res => setRoutes(res.data)).catch(() => {});

    // Load current positions
    api.get('/gps/current').then(res => {
      const positions = {};
      res.data.forEach(bus => {
        if (bus.currentLat && bus.currentLng) {
          positions[bus.id] = {
            lat: bus.currentLat,
            lng: bus.currentLng,
            plate: bus.plate,
            model: bus.model,
            driver: bus.driver,
            routes: bus.routes
          };
        }
      });
      setBusPositions(positions);
    }).catch(() => {});

    // Connect socket
    const socket = connectSocket();
    if (!socket) return;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('gps:update', (updates) => {
      setLastUpdate(new Date());
      setBusPositions(prev => {
        const next = { ...prev };
        updates.forEach(update => {
          next[update.busId] = {
            ...prev[update.busId],
            lat: update.lat,
            lng: update.lng,
            speed: update.speed,
            heading: update.heading,
            plate: update.plate
          };
        });
        return next;
      });

      // Update trails (last 20 positions)
      setBusTrails(prev => {
        const next = { ...prev };
        updates.forEach(update => {
          const trail = prev[update.busId] || [];
          next[update.busId] = [...trail.slice(-20), [update.lat, update.lng]];
        });
        return next;
      });
    });

    return () => {
      socket.off('gps:update');
    };
  }, []);

  const buses = Object.entries(busPositions);

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Navigation size={22} className="text-brand-400" />
            GPS en Tiempo Real
          </h2>
          <p className="text-slate-400 text-sm mt-1">Seguimiento de buses escolares</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border
            ${connected
              ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50'
              : 'bg-red-900/30 text-red-400 border-red-900/50'
            }`}>
            {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {connected ? 'Conectado' : 'Desconectado'}
          </div>
          {lastUpdate && (
            <span className="text-xs text-slate-500">
              Última actualización: {format(lastUpdate, 'HH:mm:ss')}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Bus List */}
        <div className="card p-4 space-y-3">
          <h3 className="font-medium text-white text-sm border-b border-slate-800 pb-2">
            Buses Activos ({buses.length})
          </h3>
          {buses.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-4">Sin buses activos</p>
          ) : (
            buses.map(([busId, info], idx) => (
              <button
                key={busId}
                onClick={() => setSelectedBus(selectedBus === busId ? null : busId)}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-150
                  ${selectedBus === busId
                    ? 'bg-brand-900/30 border-brand-700'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: BUS_COLORS[idx % BUS_COLORS.length] }}
                  />
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{info.plate}</p>
                    <p className="text-slate-400 text-xs truncate">{info.model || 'Bus escolar'}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-auto flex-shrink-0" />
                </div>
                {info.speed && (
                  <p className="text-xs text-slate-500 mt-1.5 font-mono">
                    {info.speed.toFixed(1)} km/h · {info.lat?.toFixed(4)}, {info.lng?.toFixed(4)}
                  </p>
                )}
                {info.driver && (
                  <p className="text-xs text-slate-500 mt-1">
                    🧑‍✈️ {info.driver.firstName} {info.driver.lastName}
                  </p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-3 rounded-xl overflow-hidden border border-slate-800" style={{ height: '600px' }}>
          <MapContainer
            center={GUATEMALA_CENTER}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />

            {/* Bus markers */}
            {buses.map(([busId, info], idx) => (
              info.lat && info.lng ? (
                <Marker
                  key={busId}
                  position={[info.lat, info.lng]}
                  icon={createBusIcon(BUS_COLORS[idx % BUS_COLORS.length])}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold text-white">{info.plate}</p>
                      <p className="text-slate-300">{info.model || 'Bus escolar'}</p>
                      {info.driver && (
                        <p className="text-slate-300">Piloto: {info.driver.firstName} {info.driver.lastName}</p>
                      )}
                      {info.speed && (
                        <p className="text-slate-400 font-mono text-xs">{info.speed.toFixed(1)} km/h</p>
                      )}
                      <p className="text-slate-500 text-xs mt-1">
                        {info.lat?.toFixed(6)}, {info.lng?.toFixed(6)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            ))}

            {/* Bus trails */}
            {Object.entries(busTrails).map(([busId, trail], idx) => (
              trail.length > 1 ? (
                <Polyline
                  key={busId}
                  positions={trail}
                  color={BUS_COLORS[idx % BUS_COLORS.length]}
                  weight={2}
                  opacity={0.5}
                  dashArray="4 4"
                />
              ) : null
            ))}

            {/* Focus on selected bus */}
            {selectedBus && busPositions[selectedBus] && (
              <MapUpdater center={[busPositions[selectedBus].lat, busPositions[selectedBus].lng]} />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
