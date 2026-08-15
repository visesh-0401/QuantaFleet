import { useState, useEffect } from 'react'

function VehicleRouteCard({ route, isSelected, onSelect }) {
  const stopsSeq = route.stops?.map(s => s.is_depot ? 'Depot' : `#${s.label.replace('Delivery Point #', '')}`).join(' ➔ ')
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
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, lineHeight: '1.4' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>PATH: </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{stopsSeq}</span>
      </div>
      <div className="vehicle-meta" style={{ marginTop: 6, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <span>Deliveries: {route.stops ? Math.max(0, route.stops.length - 2) : 0} points</span>
        <span style={{ color: route.color }}>{isSelected ? '● Highlighted' : 'Click to highlight'}</span>
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
}) {
  const [numReads, setNumReads] = useState(400)
  const [inputNodes, setInputNodes] = useState(81)
  const [inputVehicles, setInputVehicles] = useState(20)

  useEffect(() => {
    if (scenario?.nodes) setInputNodes(scenario.nodes.length)
    if (scenario?.config?.num_vehicles) setInputVehicles(scenario.config.num_vehicles)
  }, [scenario])

  const routeList = routes?.routes || qioResult?.route_details || classicalResult?.route_details || []

  return (
    <>
      {/* Scenario info */}
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
          Scaling: 0 &lt; B·max(dist) &lt; A
        </div>

        <button
          id="run-quantum-btn"
          className="btn btn-quantum"
          onClick={() => onRunQuantum(numReads)}
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

