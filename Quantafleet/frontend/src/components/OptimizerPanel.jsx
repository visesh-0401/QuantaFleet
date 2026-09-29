import { useState, useEffect } from 'react'

const TRAFFIC_LABELS = ['🟢 Free Flow', '🟡 Moderate', '🟠 Heavy', '🔴 Rush Hour']
const TRAFFIC_COLORS = ['#10b981', '#d97706', '#f97316', '#ef4444']
const TRAFFIC_DESCRIPTIONS = [
  'Roads clear — optimal travel conditions',
  'Moderate congestion on arterials',
  'Heavy traffic — significant slowdowns',
  'Near-gridlock — major arterials jammed',
]

const PRESETS = [
  { label: '🟢 Light', nodes: 21, vehicles: 4, desc: '20 nodes · 4 trucks' },
  { label: '🟡 Medium', nodes: 41, vehicles: 5, desc: '40 nodes · 5 trucks' },
  { label: '🔴 Hackathon', nodes: 81, vehicles: 10, desc: '80 nodes · 10 trucks' },
  { label: '⚫ Enterprise', nodes: 151, vehicles: 10, desc: '150 nodes · 10 trucks' },
]

function VehicleRouteCard({ route, isSelected, onSelect }) {
  const stopsSeq = route.stops
    ?.map(s => s.is_depot ? 'Depot' : `#${s.label.replace('Delivery Point #', '')}`)
    .join(' ➔ ')

  const avgCongestion = route.stops
    ? route.stops.reduce((sum, s) => sum + (s.leg_congestion || 1), 0) / Math.max(route.stops.length, 1)
    : 1.0
  const congestionColor = avgCongestion < 1.5 ? '#10b981' : avgCongestion < 2.5 ? '#d97706' : '#ef4444'

  return (
    <div
      className="vehicle-card pop-up"
      style={{
        animationDelay: `${(route.vehicle_id || 0) * 0.08}s`,
        cursor: 'pointer',
        borderColor: isSelected ? route.color : undefined,
        background: isSelected ? 'rgba(99,102,241,0.15)' : undefined,
      }}
      onClick={onSelect}
    >
      <div className="vehicle-header">
        <div className="vehicle-badge" style={{ background: route.color }}>
          {route.vehicle_name?.[0] ?? 'V'}
        </div>
        <span className="vehicle-name" style={{ color: 'white', fontWeight: 700 }}>{route.vehicle_name}</span>
        <span className="vehicle-status" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--cyan)' }}>
          {route.distance_km} km
        </span>
        {route.total_eta_min != null && (
          <span className="vehicle-status" style={{ background: 'rgba(255,255,255,0.06)', color: '#a78bfa', marginLeft: 4 }}>
            ⏱ {route.total_eta_min}m
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, lineHeight: '1.4' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>PATH: </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{stopsSeq}</span>
      </div>
      <div className="vehicle-meta" style={{ marginTop: 6, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <span>Deliveries: {route.stops ? Math.max(0, route.stops.length - 2) : 0} points</span>
        <span style={{ color: congestionColor, fontSize: 10 }}>
          ● Congestion ×{avgCongestion.toFixed(1)}
        </span>
      </div>
    </div>
  )
}

export default function OptimizerPanel({
  scenario,
  onRunQuantum,
  onRunClassical,
  isRunningQIO,
  isRunningClassical,
  qioResult,
  classicalResult,
  vehicles,
  activeRoute,
  onSelectRoute,
  routes,
  onGenerateScenario,
  trafficLevel,
  onTrafficChange,
}) {
  const [numReads, setNumReads] = useState(400)
  const [inputNodes, setInputNodes] = useState(81)
  const [inputVehicles, setInputVehicles] = useState(20)

  useEffect(() => {
    if (scenario?.nodes) setInputNodes(scenario.nodes.length)
    if (scenario?.config?.num_vehicles) setInputVehicles(scenario.config.num_vehicles)
  }, [scenario])

  const routeList = routes?.routes || qioResult?.route_details || classicalResult?.route_details || []

  const handlePreset = (preset) => {
    setInputNodes(preset.nodes)
    setInputVehicles(preset.vehicles)
    onGenerateScenario(preset.nodes, preset.vehicles)
  }

  return (
    <>
      {/* Scenario Presets */}
      <div className="card pop-up" style={{ animationDelay: '0.05s' }}>
        <div className="card-title">⚡ Benchmark Presets</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              className="btn btn-outline"
              style={{ fontSize: 11, padding: '6px 8px', textAlign: 'left', lineHeight: 1.3 }}
              onClick={() => handlePreset(p)}
              disabled={isRunningQIO || isRunningClassical}
            >
              <div style={{ fontWeight: 700 }}>{p.label}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Generator */}
      <div className="card pop-up" style={{ animationDelay: '0.1s' }}>
        <div className="card-title">📍 Scenario Generator</div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
            <span>Nodes (Deliveries)</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--indigo-l)', fontWeight: 700 }}>{inputNodes}</span>
          </div>
          <input
            type="range"
            min={10}
            max={150}
            step={1}
            value={inputNodes}
            onChange={e => setInputNodes(Number(e.target.value))}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
            <span>Fleet Vehicles</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--emerald)', fontWeight: 700 }}>{inputVehicles}</span>
          </div>
          <input
            type="range"
            min={2}
            max={50}
            step={1}
            value={inputVehicles}
            onChange={e => setInputVehicles(Number(e.target.value))}
          />
        </div>
        <button
          className="btn btn-outline"
          onClick={() => onGenerateScenario(inputNodes, inputVehicles)}
          disabled={isRunningQIO || isRunningClassical}
          style={{ marginTop: 8 }}
        >
          🔄 Generate Network
        </button>
      </div>

      {/* Traffic Intensity Control */}
      <div className="card pop-up" style={{ animationDelay: '0.15s', borderColor: `${TRAFFIC_COLORS[trafficLevel ?? 0]}40` }}>
        <div className="card-title" style={{ color: TRAFFIC_COLORS[trafficLevel ?? 0] }}>
          🚦 Traffic Intensity
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: TRAFFIC_COLORS[trafficLevel ?? 0] }}>
              {TRAFFIC_LABELS[trafficLevel ?? 0]}
            </span>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 99,
              background: `${TRAFFIC_COLORS[trafficLevel ?? 0]}22`,
              color: TRAFFIC_COLORS[trafficLevel ?? 0],
              fontWeight: 700,
            }}>
              Level {trafficLevel ?? 0}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={3}
            step={1}
            value={trafficLevel ?? 0}
            onChange={e => onTrafficChange && onTrafficChange(Number(e.target.value))}
            style={{ accentColor: TRAFFIC_COLORS[trafficLevel ?? 0] }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
            <span>Free Flow</span><span>Rush Hour</span>
          </div>
        </div>
        <div style={{
          fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4,
          padding: '6px 8px', background: 'rgba(0,0,0,0.04)', borderRadius: 6,
        }}>
          {TRAFFIC_DESCRIPTIONS[trafficLevel ?? 0]}
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 6 }}>
          ⚠ Changing traffic level resets results — re-run solvers to see traffic-aware routes
        </div>
      </div>

      {/* QIO Controls */}
      <div className="card glow-indigo pop-up" style={{ animationDelay: '0.2s' }}>
        <div className="card-title">⚛ Quantum Engine</div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
            <span>Annealing reads</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--indigo-l)', fontWeight: 700 }}>{numReads}</span>
          </div>
          <input
            type="range"
            min={100}
            max={800}
            step={50}
            value={numReads}
            onChange={e => setNumReads(Number(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>
            <span>Fast (100)</span><span>Precise (800)</span>
          </div>
        </div>

        <div className="qubo-box" style={{ marginBottom: 10 }}>
          H = A·H_constraints + B·H_objective<br />
          QUBO vars: n² per vehicle sub-TSP<br />
          Scaling: 0 &lt; B·max(dist) &lt; A<br />
          <span style={{ color: TRAFFIC_COLORS[trafficLevel ?? 0] }}>
            Traffic: {TRAFFIC_LABELS[trafficLevel ?? 0]}
          </span>
        </div>

        <button
          id="run-quantum-btn"
          className="btn btn-quantum"
          onClick={() => onRunQuantum(numReads, trafficLevel ?? 0)}
          disabled={isRunningQIO || isRunningClassical}
        >
          {isRunningQIO ? <><div className="spinner" /> Annealing…</> : <>⚛ Run QIO Optimizer</>}
        </button>

        {qioResult && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>✓ {qioResult.total_distance} km</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{qioResult.time_ms}ms</span>
          </div>
        )}
        {qioResult?.traffic_label && (
          <div style={{ marginTop: 4, fontSize: 10, color: TRAFFIC_COLORS[qioResult.traffic_level ?? 0] }}>
            🚦 Solved under: {qioResult.traffic_label}
          </div>
        )}
      </div>

      {/* Classical Baseline */}
      <div className="card pop-up" style={{ animationDelay: '0.3s' }}>
        <div className="card-title">🔁 Classical Baseline</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>
          Nearest-Neighbour greedy heuristic — O(n²) per vehicle
        </div>
        <button
          id="run-classical-btn"
          className="btn btn-classical"
          onClick={onRunClassical}
          disabled={isRunningQIO || isRunningClassical}
        >
          {isRunningClassical ? <><div className="spinner" style={{ borderTopColor: 'var(--amber)' }} /> Running…</> : <>📊 Run Classical (Greedy)</>}
        </button>

        {classicalResult && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{classicalResult.total_distance} km</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{classicalResult.time_ms}ms</span>
          </div>
        )}
      </div>

      {/* Vehicle Route Meshes */}
      {routeList.length > 0 && (
        <div className="card pop-up" style={{ animationDelay: '0.5s' }}>
          <div className="card-title">🕸️ Vehicle Route Meshes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {routeList.map((r, i) => (
              <VehicleRouteCard
                key={i}
                route={r}
                isSelected={activeRoute === r.vehicle_id}
                onSelect={() => onSelectRoute && onSelectRoute(activeRoute === r.vehicle_id ? null : r.vehicle_id)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
