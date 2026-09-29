import { useEffect, useRef } from 'react'
import L from 'leaflet'

const VEHICLE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6']

// Interpolate green (#10b981) → amber → red based on congestion factor (0.7–5.0)
function congestionColor(factor) {
  const t = Math.min(Math.max((factor - 0.7) / (5.0 - 0.7), 0), 1)
  if (t < 0.5) {
    // green → amber
    const u = t * 2
    return `rgb(${Math.round(16 + u * (217 - 16))}, ${Math.round(185 - u * (185 - 119))}, ${Math.round(129 - u * (129 - 6))})`
  } else {
    // amber → red
    const u = (t - 0.5) * 2
    return `rgb(${Math.round(217 + u * (239 - 217))}, ${Math.round(119 - u * (119 - 29))}, ${Math.round(6 - u * 6)})`
  }
}

function makeDepotIcon() {
  return L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="
      width:30px;height:30px;background:linear-gradient(135deg,#6366f1,#8b5cf6);
      border-radius:8px;display:flex;align-items:center;justify-content:center;
      font-size:15px;border:2px solid #ffffff;
      box-shadow:0 0 18px rgba(99,102,241,0.6);
      cursor:pointer;
    ">🏭</div>`,
  })
}

function makeNodeIcon(label, demand) {
  return L.divIcon({
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<div style="
      width:22px;height:22px;background:#0d1526;
      border:2px solid rgba(6,182,212,0.6);border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:9px;font-weight:700;color:#06b6d4;
      box-shadow:0 0 8px rgba(6,182,212,0.4);
    ">${demand}</div>`,
  })
}

export default function FleetMap({
  scenario,
  vehicles,
  routes,
  activeRoute,
  onSelectRoute,
  qioResult,
  classicalResult,
  trafficLevel,
  heatmapData,
  showHeatmap,
}) {
  const mapRef = useRef(null)
  const leafletRef = useRef(null)
  const layersRef = useRef({ nodes: [], routes: [], heatmap: [] })

  // Init map
  useEffect(() => {
    if (leafletRef.current) return
    const map = L.map(mapRef.current, {
      center: [19.02, 72.83],
      zoom: 12,
      zoomControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)
    leafletRef.current = map
  }, [])

  // Draw/update congestion heatmap overlay
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return

    // Clear old heatmap layers
    layersRef.current.heatmap.forEach(l => map.removeLayer(l))
    layersRef.current.heatmap = []

    if (!showHeatmap || !heatmapData?.edges?.length) return

    heatmapData.edges.forEach(edge => {
      const color = congestionColor(edge.congestion)
      const line = L.polyline(
        [[edge.lat1, edge.lon1], [edge.lat2, edge.lon2]],
        { color, weight: 3, opacity: 0.65 }
      ).addTo(map)
      line.bindTooltip(
        `<div style="font-size:10px;font-weight:600">
          Congestion: <b>×${edge.congestion.toFixed(2)}</b>
         </div>`,
        { sticky: true }
      )
      layersRef.current.heatmap.push(line)
    })
  }, [heatmapData, showHeatmap])

  // Draw nodes
  useEffect(() => {
    const map = leafletRef.current
    if (!map || !scenario?.nodes) return

    layersRef.current.nodes.forEach(l => map.removeLayer(l))
    layersRef.current.nodes = []

    scenario.nodes.forEach((node) => {
      const icon = node.is_depot ? makeDepotIcon() : makeNodeIcon(node.label[0], node.demand)
      const marker = L.marker([node.lat, node.lon], { icon })
        .addTo(map)
        .bindTooltip(
          `<div style="font-family:Inter,sans-serif;font-size:12px;font-weight:600">${node.label}</div>
           <div style="font-size:10px;color:#94a3b8">Demand: ${node.demand} units</div>`,
          { className: 'custom-tooltip', direction: 'top', offset: [0, -4] }
        )
      layersRef.current.nodes.push(marker)
    })
  }, [scenario])

  // Draw exact route meshes & sequence paths
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return

    layersRef.current.routes.forEach(l => map.removeLayer(l))
    layersRef.current.routes = []

    const routeData = routes?.routes || qioResult?.route_details || classicalResult?.route_details
    if (!routeData || routeData.length === 0) return

    routeData.forEach((r, idx) => {
      const pathCoords = r.path?.map(p => [p.lat, p.lon]) || r.stops?.map(s => [s.lat, s.lon])
      if (!pathCoords || pathCoords.length < 2) return

      const isSelected = activeRoute === null || activeRoute === r.vehicle_id || activeRoute === idx
      const color = r.color || VEHICLE_COLORS[idx % VEHICLE_COLORS.length]

      const polyline = L.polyline(pathCoords, {
        color: color,
        weight: isSelected ? (activeRoute === r.vehicle_id ? 5 : 3.5) : 1.5,
        opacity: isSelected ? 0.9 : 0.2,
        dashArray: !isSelected ? '4, 4' : null,
      }).addTo(map)

      const etaLine = r.total_eta_min != null
        ? `<br/>ETA: <b>${r.total_eta_min} min</b>`
        : ''

      polyline.bindTooltip(
        `<div style="font-family:Inter,sans-serif;font-size:12px;font-weight:700;color:${color}">
          🚛 ${r.vehicle_name || 'Vehicle ' + (idx + 1)}
         </div>
         <div style="font-size:11px;color:#cbd5e1;margin-top:2px">
          Route Length: <b>${r.distance_km} km</b><br/>
          Deliveries: <b>${r.stops ? Math.max(0, r.stops.length - 2) : 0} points</b>${etaLine}
         </div>`,
        { sticky: true }
      )

      polyline.on('click', () => {
        if (onSelectRoute) onSelectRoute(activeRoute === r.vehicle_id ? null : r.vehicle_id)
      })

      layersRef.current.routes.push(polyline)

      // Numbered stop sequence badges with ETA tooltip
      if (r.stops && isSelected) {
        r.stops.forEach((stop, sIdx) => {
          if (stop.is_depot) return

          const congColor = stop.leg_congestion != null
            ? congestionColor(stop.leg_congestion)
            : '#ffffff'

          const seqBadgeIcon = L.divIcon({
            className: '',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            html: `<div style="
              width:22px;height:22px;background:${color};
              border:2px solid #ffffff;border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              font-size:10px;font-weight:800;color:#ffffff;
              box-shadow:0 0 10px ${color}aa;
              cursor:pointer;
            ">${sIdx}</div>`,
          })

          const etaTooltip = stop.eta_min != null
            ? `<div style="font-size:10px;color:#94a3b8;margin-top:2px">
                 ETA: <b style="color:#a78bfa">${stop.eta_min} min</b>
                 ${stop.leg_congestion != null ? `· Congestion: <b style="color:${congColor}">×${stop.leg_congestion.toFixed(1)}</b>` : ''}
               </div>`
            : ''

          const seqMarker = L.marker([stop.lat, stop.lon], { icon: seqBadgeIcon, zIndexOffset: 500 })
            .addTo(map)
            .bindTooltip(
              `<div style="font-family:Inter,sans-serif;font-size:11px;font-weight:700;color:${color}">
                ${r.vehicle_name} — Stop #${sIdx}
               </div>
               <div style="font-size:10px;color:#cbd5e1">${stop.label} (Demand: ${stop.demand})</div>
               ${etaTooltip}`,
              { direction: 'top', offset: [0, -6] }
            )

          seqMarker.on('click', () => {
            if (onSelectRoute) onSelectRoute(activeRoute === r.vehicle_id ? null : r.vehicle_id)
          })

          layersRef.current.routes.push(seqMarker)
        })
      }
    })
  }, [routes, qioResult, classicalResult, activeRoute, onSelectRoute])

  const activeRoutesList = routes?.routes || qioResult?.route_details || classicalResult?.route_details || []
  const TRAFFIC_COLORS = ['#10b981', '#d97706', '#f97316', '#ef4444']
  const TRAFFIC_LABELS = ['Free Flow', 'Moderate', 'Heavy', 'Rush Hour']
  const tLevel = trafficLevel ?? 0

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Overlay badges */}
      <div className="map-overlay">
        <div className="map-badge">
          <span style={{ color: 'var(--cyan)' }}>📍</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            {scenario?.nodes?.length ?? 0} nodes
          </span>
        </div>
        <div className="map-badge">
          <span style={{ color: 'var(--emerald)' }}>🕸️</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            {activeRoutesList.length} Route Meshes
          </span>
        </div>
        {/* Traffic level badge */}
        <div className="map-badge" style={{ borderColor: `${TRAFFIC_COLORS[tLevel]}50` }}>
          <span style={{ color: TRAFFIC_COLORS[tLevel] }}>🚦</span>
          <span style={{ color: TRAFFIC_COLORS[tLevel], fontWeight: 700, fontSize: 10 }}>
            {TRAFFIC_LABELS[tLevel]}
          </span>
        </div>
        {routes && (
          <div className="map-badge" style={{ borderColor: 'rgba(99,102,241,0.4)' }}>
            <span style={{ color: 'var(--indigo-l)' }}>
              {routes.type === 'qio' ? '⚛' : '📊'}
            </span>
            <span style={{ color: 'var(--indigo-l)', fontWeight: 700 }}>
              {routes.type === 'qio' ? 'QIO Network Mesh' : 'Classical Network Mesh'}
            </span>
          </div>
        )}
        {showHeatmap && heatmapData && (
          <div className="map-badge" style={{ borderColor: 'rgba(239,68,68,0.4)' }}>
            <span style={{ color: '#ef4444' }}>🌡️</span>
            <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 10 }}>Congestion Heatmap ON</span>
          </div>
        )}
      </div>

      {/* Heatmap legend */}
      {showHeatmap && (
        <div style={{
          position: 'absolute', bottom: 40, left: 12, zIndex: 1000,
          background: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: '6px 10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: 10, fontFamily: 'Inter, sans-serif',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: '#1f2937' }}>Congestion Level</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 60, height: 6, borderRadius: 3, background: 'linear-gradient(to right, #10b981, #d97706, #ef4444)' }} />
            <span style={{ color: '#64748b' }}>Low → High</span>
          </div>
        </div>
      )}

      {/* Route Comparison Overlay */}
      {qioResult && classicalResult && (
        <div className="in-map-routes comparison-overlay" onPointerDown={e => e.stopPropagation()}>
          <div className="card-title" style={{ fontSize: 10, marginBottom: 12 }}>
            ⚡ POINT-TO-POINT ROUTE SEQUENCES
          </div>
          <div className="scroll-container" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {qioResult.route_details.map((qr, i) => {
              const cr = classicalResult.route_details[i]
              if (!cr) return null

              const isHighlighted = activeRoute === qr.vehicle_id
              const qSeq = qr.stops.map(s => s.is_depot ? 'Depot' : `#${s.label.replace('Delivery Point #', '')}`).join(' ➔ ')
              const cSeq = cr.stops.map(s => s.is_depot ? 'Depot' : `#${s.label.replace('Delivery Point #', '')}`).join(' ➔ ')

              return (
                <div
                  key={i}
                  className="comparison-item"
                  style={{
                    fontSize: 11,
                    cursor: 'pointer',
                    background: isHighlighted ? 'rgba(99,102,241,0.15)' : undefined,
                    borderColor: isHighlighted ? qr.color : undefined,
                  }}
                  onClick={() => onSelectRoute && onSelectRoute(isHighlighted ? null : qr.vehicle_id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="vehicle-dot" style={{ background: qr.color, width: 10, height: 10, borderRadius: '50%' }} />
                      <span style={{ fontWeight: 700, color: 'white' }}>{qr.vehicle_name}</span>
                    </div>
                    {isHighlighted && <span style={{ fontSize: 9, color: qr.color, fontWeight: 700 }}>SELECTED</span>}
                  </div>

                  <div className="seq-row qio" style={{ color: 'var(--indigo-l)', marginBottom: 2 }}>
                    <span style={{ display: 'inline-block', width: '16px' }}>⚛</span>
                    {qSeq}
                    <span style={{ opacity: 0.8, marginLeft: 4, fontWeight: 600 }}>({qr.distance_km}km</span>
                    {qr.total_eta_min != null && (
                      <span style={{ opacity: 0.8, marginLeft: 2, fontWeight: 600, color: '#a78bfa' }}>· {qr.total_eta_min}m)</span>
                    )}
                  </div>

                  <div className="seq-row classical" style={{ color: 'var(--amber)', opacity: 0.8 }}>
                    <span style={{ display: 'inline-block', width: '16px' }}>📊</span>
                    {cSeq}
                    <span style={{ opacity: 0.8, marginLeft: 4, fontWeight: 600 }}>({cr.distance_km}km</span>
                    {cr.total_eta_min != null && (
                      <span style={{ opacity: 0.8, marginLeft: 2, fontWeight: 600 }}>· {cr.total_eta_min}m)</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
