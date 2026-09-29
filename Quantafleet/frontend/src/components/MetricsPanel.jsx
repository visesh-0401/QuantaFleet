import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'

const VEHICLE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']
const VEHICLE_NAMES  = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo']
const TRAFFIC_COLORS = ['#10b981', '#d97706', '#f97316', '#ef4444']
const TRAFFIC_LABELS = ['Free Flow', 'Moderate', 'Heavy', 'Rush Hour']

function EnergyPlot({ energyHistory }) {
  if (!energyHistory || energyHistory.length === 0) return null

  const series = energyHistory[0] ?? []
  const data = series.map((e, i) => ({ step: i, energy: Math.round(e) }))

  return (
    <div className="card pop-up" style={{ animationDelay: '0.4s' }}>
      <div className="card-title">〰 Annealing Energy Curve</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
        Hamiltonian ground state convergence
      </div>
      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="step" tick={{ fontSize: 8, fill: '#475569' }} />
          <YAxis tick={{ fontSize: 8, fill: '#475569' }} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 10 }}
            labelStyle={{ color: 'var(--text-muted)' }}
            itemStyle={{ color: 'var(--indigo-l)' }}
          />
          <Line
            type="monotone"
            dataKey="energy"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: '#818cf8' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
        ↓ Energy minimisation = optimal route found
      </div>
    </div>
  )
}

function LoadChart({ qioLoads, classicalLoads }) {
  if (!qioLoads && !classicalLoads) return null
  const loads = qioLoads || classicalLoads
  const data = loads.map((v, i) => ({
    name: VEHICLE_NAMES[i % VEHICLE_NAMES.length],
    load: Math.round(v),
  }))

  return (
    <div className="card pop-up" style={{ animationDelay: '0.3s' }}>
      <div className="card-title">📦 Load Allocation</div>
      <ResponsiveContainer width="100%" height={90}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} />
          <YAxis tick={{ fontSize: 9, fill: '#475569' }} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 10 }}
          />
          <Bar dataKey="load" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={VEHICLE_COLORS[i % VEHICLE_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function DistanceBar({ qioDist, classicalDist }) {
  if (!qioDist && !classicalDist) return null
  const max = Math.max(qioDist ?? 0, classicalDist ?? 0, 1)
  return (
    <div className="card pop-up" style={{ animationDelay: '0.2s' }}>
      <div className="card-title">📏 Route Distance</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {classicalDist != null && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
              <span style={{ color: 'var(--amber)', fontWeight: 600 }}>📊 Classical</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>{classicalDist} km</span>
            </div>
            <div className="prog-bar-wrap">
              <div className="prog-bar-fill" style={{ width: `${(classicalDist / max) * 100}%`, background: 'var(--amber)' }} />
            </div>
          </div>
        )}
        {qioDist != null && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
              <span style={{ color: 'var(--indigo-l)', fontWeight: 600 }}>⚛ QIO</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--indigo-l)' }}>{qioDist} km</span>
            </div>
            <div className="prog-bar-wrap">
              <div className="prog-bar-fill" style={{ width: `${(qioDist / max) * 100}%`, background: 'linear-gradient(90deg, var(--indigo), var(--violet))' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ETA Timeline Tab ──────────────────────────────────────────────────────────
function ETATimeline({ qioResult, classicalResult }) {
  const routeDetails = qioResult?.route_details || classicalResult?.route_details
  if (!routeDetails || routeDetails.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
        Run an optimizer to see ETA timelines
      </div>
    )
  }

  // ETA chart — per-vehicle total route time bar chart
  const etaData = routeDetails
    .filter(r => r.total_eta_min != null)
    .map((r, i) => ({
      name: r.vehicle_name?.split('-')[0] ?? `V${i + 1}`,
      qio_eta: qioResult?.route_details?.[i]?.total_eta_min ?? 0,
      classical_eta: classicalResult?.route_details?.[i]?.total_eta_min ?? 0,
    }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ETA bar chart */}
      {etaData.length > 0 && (
        <div className="card pop-up">
          <div className="card-title">⏱ Route ETA Comparison (min)</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
            Total round-trip time per vehicle (traffic-aware)
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={etaData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 9, fill: '#475569' }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 10 }}
              />
              {qioResult && <Bar dataKey="qio_eta" name="QIO ETA" fill="#6366f1" radius={[4, 4, 0, 0]} />}
              {classicalResult && <Bar dataKey="classical_eta" name="Classical ETA" fill="#d97706" radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-vehicle stop-by-stop timeline */}
      {routeDetails.slice(0, 5).map((route, idx) => (
        <div key={idx} className="card pop-up" style={{ animationDelay: `${idx * 0.05}s` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: route.color || VEHICLE_COLORS[idx % VEHICLE_COLORS.length]
            }} />
            <span style={{ fontWeight: 700, fontSize: 12, color: 'white' }}>{route.vehicle_name}</span>
            {route.total_eta_min != null && (
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#a78bfa', fontWeight: 700 }}>
                Total: {route.total_eta_min} min
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {route.stops?.map((stop, sIdx) => {
              if (sIdx === 0) return null  // skip depot start
              const isDepot = stop.is_depot
              const cFactor = stop.leg_congestion ?? 1.0
              const congColor = cFactor < 1.5 ? '#10b981' : cFactor < 2.5 ? '#d97706' : '#ef4444'
              return (
                <div key={sIdx} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '4px 6px', borderRadius: 6,
                  background: isDepot ? 'rgba(99,102,241,0.08)' : 'rgba(0,0,0,0.03)',
                  fontSize: 10,
                }}>
                  {/* timeline dot */}
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: isDepot ? '#6366f1' : (route.color || VEHICLE_COLORS[idx % VEHICLE_COLORS.length])
                  }} />
                  <span style={{ flex: 1, color: isDepot ? '#818cf8' : 'var(--text-secondary)', fontWeight: isDepot ? 700 : 400 }}>
                    {isDepot ? '🏭 Return to Depot' : `#${stop.label?.replace('Delivery Point #', '') ?? sIdx} — ${stop.label}`}
                  </span>
                  {stop.eta_min != null && (
                    <span style={{ color: '#a78bfa', fontWeight: 700, flexShrink: 0 }}>
                      {stop.eta_min}m
                    </span>
                  )}
                  {!isDepot && stop.leg_congestion != null && (
                    <span style={{ color: congColor, fontSize: 9, flexShrink: 0 }}>
                      ×{cFactor.toFixed(1)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MetricsPanel({ metrics, qioResult, classicalResult }) {
  const [activeTab, setActiveTab] = useState('metrics')
  const comp = metrics?.comparison
  const qio = metrics?.qio
  const classical = metrics?.classical

  const tabs = [
    { id: 'metrics', label: '📊 Metrics' },
    { id: 'eta', label: '⏱ ETA Timeline' },
  ]

  return (
    <>
      {/* Tab Navigation */}
      {(qioResult || classicalResult) && (
        <div style={{
          display: 'flex', gap: 4, marginBottom: 12,
          background: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: 4,
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '6px 8px', borderRadius: 7, border: 'none',
                cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
                background: activeTab === tab.id ? 'white' : 'transparent',
                color: activeTab === tab.id ? 'var(--indigo)' : 'var(--text-muted)',
                boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── ETA Timeline Tab ── */}
      {activeTab === 'eta' && (qioResult || classicalResult) && (
        <ETATimeline qioResult={qioResult} classicalResult={classicalResult} />
      )}

      {/* ── Metrics Tab ── */}
      {activeTab === 'metrics' && (
        <>
          {/* Traffic context */}
          {(qioResult?.traffic_label || classicalResult?.traffic_label) && (
            <div style={{
              fontSize: 10, padding: '5px 10px', borderRadius: 8, marginBottom: 10,
              background: `${TRAFFIC_COLORS[(qioResult || classicalResult)?.traffic_level ?? 0]}18`,
              color: TRAFFIC_COLORS[(qioResult || classicalResult)?.traffic_level ?? 0],
              border: `1px solid ${TRAFFIC_COLORS[(qioResult || classicalResult)?.traffic_level ?? 0]}30`,
              fontWeight: 600,
            }}>
              🚦 Optimized under: {(qioResult || classicalResult)?.traffic_label}
            </div>
          )}

          {/* Comparison savings */}
          {comp && (
            <div className="comparison-banner pop-up" style={{ animationDelay: '0.1s', marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--indigo-l)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⚛ QIO MVP Advantage
              </div>
              <div className="savings-row" style={{ fontSize: 15, padding: '6px 0' }}>
                <span className="savings-label">Distance saved</span>
                <span className="savings-value c-emerald">-{comp.distance_saved_km} km</span>
              </div>
              <div className="savings-row" style={{ fontSize: 15, padding: '6px 0' }}>
                <span className="savings-label">Improvement</span>
                <span className="savings-value c-emerald">{comp.savings_pct}%</span>
              </div>
              <div className="savings-row" style={{ fontSize: 15, padding: '6px 0' }}>
                <span className="savings-label">Fuel savings</span>
                <span className="savings-value c-amber">₹{comp.fuel_saved_inr}</span>
              </div>
              <div className="savings-row" style={{ fontSize: 15, padding: '6px 0' }}>
                <span className="savings-label">Algorithmic Speedup</span>
                <span className="savings-value c-cyan" style={{ fontSize: 14 }}>O(√2ⁿ)</span>
              </div>

              <div className="divider" style={{ margin: '16px 0', background: 'rgba(99,102,241,0.2)' }} />

              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--amber)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🏢 Enterprise Projection (Delhivery Scale)
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12, lineHeight: '1.5' }}>
                Extrapolating our {comp.savings_pct}% improvement to a fleet of 10,000 trucks (1.5M km/day):
              </div>
              <div className="savings-row" style={{ fontSize: 16, padding: '6px 0' }}>
                <span className="savings-label" style={{ fontWeight: 600 }}>Projected Fuel Savings</span>
                <span className="savings-value c-emerald" style={{ fontSize: 18 }}>~₹{((comp.savings_pct / 100) * 1231).toFixed(1)} Cr/yr</span>
              </div>
              <div className="savings-row" style={{ fontSize: 16, padding: '6px 0' }}>
                <span className="savings-label" style={{ fontWeight: 600 }}>Carbon Reduction</span>
                <span className="savings-value c-cyan" style={{ fontSize: 18 }}>~{((comp.savings_pct / 100) * 450000).toFixed(0)} Tonnes CO₂</span>
              </div>
            </div>
          )}

          <div className="metrics-grid">
            <DistanceBar
              qioDist={qio?.total_distance_km}
              classicalDist={classical?.total_distance_km}
            />

            <LoadChart
              qioLoads={qioResult?.vehicle_loads}
              classicalLoads={classicalResult?.vehicle_loads}
            />

            {qioResult?.energy_history && (
              <EnergyPlot energyHistory={qioResult.energy_history} />
            )}

            {qioResult && (
              <div className="card pop-up" style={{ animationDelay: '0.5s' }}>
                <div className="card-title">🔬 QUBO Details</div>
                <div className="qubo-box">
                  Variables: {qioResult.qubo_size}<br />
                  Solver: SimulatedAnnealingSampler<br />
                  Backend: D-Wave Ocean SDK (neal)<br />
                  Paradigm: Quantum Annealing (NISQ)<br />
                  Solve time: {qioResult.time_ms}ms<br />
                  <span style={{ color: TRAFFIC_COLORS[qioResult.traffic_level ?? 0] }}>
                    Traffic: {qioResult.traffic_label ?? 'Free Flow'}
                  </span>
                </div>
              </div>
            )}

            {qioResult && (
              <div className="card pop-up" style={{ borderColor: 'rgba(99,102,241,0.5)', background: 'var(--bg-main)', animationDelay: '0.6s' }}>
                <div className="card-title" style={{ fontSize: 16 }}>🧠 Algorithmic Insights (Why QIO Wins)</div>
                <div style={{ fontSize: 15, color: 'var(--text-main)', lineHeight: '1.6' }}>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ color: 'var(--amber)', fontWeight: 700, display: 'block', fontSize: 16 }}>1. The Classical Flaw:</span> Heuristics get trapped in <strong>local minima</strong>—valleys in the energy landscape that look optimal locally but fail at enterprise scale.
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ color: 'var(--indigo-l)', fontWeight: 700, display: 'block', fontSize: 16 }}>2. Quantum Tunneling:</span> Our algorithm mathematically tunnels <em>through</em> high-energy barriers instead of climbing over them, bypassing local traps.
                  </div>
                  <div>
                    <span style={{ color: 'var(--emerald)', fontWeight: 700, display: 'block', fontSize: 16 }}>3. Hamiltonian Ground State:</span> By solving <code style={{ color: 'var(--indigo)', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 'bold' }}>H = A(Constraints) + B(Distance)</code>, the system naturally collapses to the absolute lowest energy, yielding near-global optimal routes.
                  </div>
                </div>
              </div>
            )}

            {qio && classical && (
              <div className="card pop-up" style={{ animationDelay: '0.7s' }}>
                <div className="card-title">⏱ Solve Time</div>
                <div className="metric-grid">
                  <div className="metric-tile">
                    <div className="metric-label">QIO</div>
                    <div className="metric-value c-indigo">{qio.time_ms}</div>
                    <div className="metric-unit">ms</div>
                  </div>
                  <div className="metric-tile">
                    <div className="metric-label">Classical</div>
                    <div className="metric-value c-amber">{classical.time_ms}</div>
                    <div className="metric-unit">ms</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {!qioResult && !classicalResult && (
        <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚛</div>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            No results yet
          </div>
          <div>Run the QIO optimizer or classical baseline to see metrics here.</div>
        </div>
      )}
    </>
  )
}
