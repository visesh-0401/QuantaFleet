import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Anchor, Navigation, Wind, Zap, Fuel, Activity } from 'lucide-react';

// Custom Glowing Port Icon
const createPortIcon = (name, hasShorePower) => {
  return L.divIcon({
    className: 'custom-port-marker',
    html: `
      <div style="
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: ${hasShorePower ? '#10b981' : '#38bdf8'};
        border: 2px solid #ffffff;
        box-shadow: 0 0 10px ${hasShorePower ? '#10b981' : '#38bdf8'};
        cursor: pointer;
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

// Custom Vessel Icon with Heading / Fuel Color
const createVesselIcon = (fuelType) => {
  const colorMap = {
    'MGO': '#ef4444',
    'LNG': '#3b82f6',
    'Methanol': '#10b981',
    'Ammonia': '#8b5cf6',
    'Hydrogen': '#00f2fe',
  };
  const color = colorMap[fuelType] || '#10b981';
  return L.divIcon({
    className: 'custom-vessel-marker',
    html: `
      <div style="
        width: 26px;
        height: 26px;
        border-radius: 6px;
        background: rgba(11, 23, 38, 0.9);
        border: 2px solid ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${color};
        box-shadow: 0 0 14px ${color}88;
        font-size: 13px;
        cursor: pointer;
      ">
        🚢
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

export default function MaritimeMap({ ports = {}, routes = [], fleet = [], deployments = [] }) {
  // Center of Indian Ocean shipping corridor
  const mapCenter = [14.0, 77.5];

  // Map route IDs to active deployment info (if optimization has run)
  const deploymentMap = useMemo(() => {
    const map = {};
    if (deployments && deployments.length > 0) {
      deployments.forEach((d) => {
        map[d.route_id] = d;
      });
    }
    return map;
  }, [deployments]);

  return (
    <div className="glass-panel" style={{ height: '580px', position: 'relative', overflow: 'hidden' }}>
      {/* Map Header Overlay */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 14,
        zIndex: 500,
        background: 'rgba(8, 18, 31, 0.88)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: '8px',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Anchor size={16} color="#00f2fe" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Indian Ocean Green Maritime Corridor</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span> Shore Power Port
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }}></span> Standard Berth
          </span>
        </div>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={5}
        minZoom={4}
        maxZoom={9}
        style={{ width: '100%', height: '100%', borderRadius: '12px' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Shipping Lane Polylines */}
        {routes.map((route) => {
          const originPort = ports[route.origin];
          const destPort = ports[route.destination];
          if (!originPort || !destPort) return null;

          const positions = [
            [originPort.lat, originPort.lon],
            [destPort.lat, destPort.lon],
          ];

          const deployed = deploymentMap[route.id];
          const lineColor = deployed 
            ? (deployed.fuel_type === 'MGO' ? '#ef4444' : deployed.fuel_type === 'LNG' ? '#3b82f6' : '#10b981')
            : 'rgba(0, 242, 254, 0.45)';

          return (
            <Polyline
              key={route.id}
              positions={positions}
              pathOptions={{
                color: lineColor,
                weight: deployed ? 3.5 : 2,
                dashArray: deployed ? undefined : '5, 8',
                opacity: 0.85,
              }}
            >
              <Tooltip sticky>
                <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                  <strong>{route.origin} → {route.destination}</strong><br />
                  Distance: {route.distance_nm} NM<br />
                  Cargo Demand: {route.cargo_demand_teu} TEU<br />
                  Transit Max: {route.max_transit_time_hrs}h<br />
                  {deployed && (
                    <span style={{ color: '#10b981', fontWeight: 600 }}>
                      Assigned: {deployed.vessel_name} ({deployed.fuel_type})
                    </span>
                  )}
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Port Markers */}
        {Object.entries(ports).map(([key, port]) => (
          <Marker
            key={key}
            position={[port.lat, port.lon]}
            icon={createPortIcon(port.name, port.shore_power)}
          >
            <Popup>
              <div style={{ minWidth: '180px', padding: '4px' }}>
                <h4 style={{ color: '#00f2fe', margin: '0 0 4px 0', fontSize: '0.9rem' }}>
                  {port.name}
                </h4>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                  <div><strong>Country:</strong> {port.country}</div>
                  <div>
                    <strong>Cold-Ironing Shore Power:</strong>{' '}
                    <span style={{ color: port.shore_power ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                      {port.shore_power ? 'Available (Zero Berth Emissions)' : 'Not Fitted'}
                    </span>
                  </div>
                  <div>
                    <strong>Bunkering:</strong> {port.green_fuel_bunkering?.join(', ')}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Fleet Vessels Plotted along Routes */}
        {fleet.map((vessel, idx) => {
          const route = routes.find((r) => r.id === vessel.assigned_route) || routes[idx % routes.length];
          if (!route) return null;

          const originPort = ports[route.origin];
          const destPort = ports[route.destination];
          if (!originPort || !destPort) return null;

          // Interpolate vessel position roughly along the route
          const t = 0.25 + (idx * 0.12) % 0.6;
          const vLat = originPort.lat + (destPort.lat - originPort.lat) * t;
          const vLon = originPort.lon + (destPort.lon - originPort.lon) * t;

          const deployed = deploymentMap[route.id];
          const fuel = deployed ? deployed.fuel_type : vessel.fuel_type;
          const speed = deployed ? deployed.speed_knots : vessel.speed_knots;

          return (
            <Marker
              key={vessel.vessel_id}
              position={[vLat, vLon]}
              icon={createVesselIcon(fuel)}
            >
              <Popup>
                <div style={{ minWidth: '200px', padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ color: '#10b981', fontSize: '0.92rem' }}>{vessel.name}</strong>
                    <span className="badge badge-quantum">{vessel.vessel_id}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                    <div><strong>Model:</strong> {vessel.model}</div>
                    <div><strong>Fuel Type:</strong> <span style={{ color: '#00f2fe', fontWeight: 600 }}>{fuel}</span></div>
                    <div><strong>Speed:</strong> {speed} knots</div>
                    <div><strong>Route:</strong> {route.origin} → {route.destination}</div>
                    {deployed && (
                      <div style={{ marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
                        <div><strong>Attained CII:</strong> {deployed.attained_cii} gCO₂/dwt·nm</div>
                        <div>
                          <strong>IMO CII Grade:</strong>{' '}
                          <span style={{ 
                            fontWeight: 700, 
                            color: deployed.cii_rating === 'A' ? '#10b981' : deployed.cii_rating === 'B' ? '#38bdf8' : '#f59e0b' 
                          }}>
                            Grade {deployed.cii_rating}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
