import { useState, useEffect, useCallback, useRef } from 'react'
import FleetMap from './components/FleetMap.jsx'
import OptimizerPanel from './components/OptimizerPanel.jsx'
import MetricsPanel from './components/MetricsPanel.jsx'

const API = ''  // proxied via vite

export default function App() {
  const [scenario, setScenario] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [routes, setRoutes] = useState(null)
  const [qioResult, setQioResult] = useState(null)
  const [classicalResult, setClassicalResult] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [isRunningQIO, setIsRunningQIO] = useState(false)
  const [isRunningClassical, setIsRunningClassical] = useState(false)
  const [activeRoute, setActiveRoute] = useState(null)
  const [mapExpanded, setMapExpanded] = useState(false)
  const [pipPos, setPipPos] = useState({ x: 0, y: 0 })

  // Traffic state
  const [trafficLevel, setTrafficLevel] = useState(0)
  const [heatmapData, setHeatmapData] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(false)

  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 })
  const tickRef = useRef(null)

  // Load scenario on mount
  useEffect(() => {
    fetch(`${API}/api/scenario`)
      .then(r => r.json())
      .then(setScenario)
      .catch(console.error)
  }, [])

  // Poll fleet positions every 600ms
  useEffect(() => {
    tickRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${API}/api/fleet/status`)
        const data = await r.json()
        setVehicles(data.vehicles || [])
      } catch {}
    }, 600)
    return () => clearInterval(tickRef.current)
  }, [])

  const fetchMetrics = useCallback(async () => {
    const r = await fetch(`${API}/api/metrics`)
    const data = await r.json()
    if (data.status !== 'no_results') setMetrics(data)
  }, [])

  const fetchRoutes = useCallback(async () => {
    const r = await fetch(`${API}/api/fleet/routes`)
    const data = await r.json()
    if (data.type !== 'none') setRoutes(data)
  }, [])

  // Fetch heatmap data from backend
  const fetchHeatmap = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/traffic/heatmap`)
      const data = await r.json()
      setHeatmapData(data)
    } catch {}
  }, [])

  // When traffic level changes: tell backend, then refresh heatmap
  const handleTrafficChange = useCallback(async (level) => {
    setTrafficLevel(level)
    // Reset results when traffic changes
    setQioResult(null)
    setClassicalResult(null)
    setRoutes(null)
    setMetrics(null)
    setActiveRoute(null)
    try {
      await fetch(`${API}/api/traffic/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traffic_level: level }),
      })
      // Always refresh heatmap when level changes (even if not visible, pre-load)
      await fetchHeatmap()
    } catch (e) {
      console.error(e)
    }
  }, [fetchHeatmap])

  // Toggle heatmap: lazy-fetch on first show
  const toggleHeatmap = useCallback(async () => {
    if (!showHeatmap && !heatmapData) {
      await fetchHeatmap()
    }
    setShowHeatmap(v => !v)
  }, [showHeatmap, heatmapData, fetchHeatmap])

  const runQuantum = useCallback(async (numReads, tLevel) => {
    setIsRunningQIO(true)
    try {
      const r = await fetch(`${API}/api/optimize/quantum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_reads: numReads, traffic_level: tLevel ?? trafficLevel }),
      })
      const data = await r.json()
      setQioResult(data)
      await fetchMetrics()
      await fetchRoutes()
    } catch (e) {
      console.error(e)
    } finally {
      setIsRunningQIO(false)
    }
  }, [fetchMetrics, fetchRoutes, trafficLevel])

  const runClassical = useCallback(async () => {
    setIsRunningClassical(true)
    try {
      const r = await fetch(`${API}/api/optimize/classical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await r.json()
      setClassicalResult(data)
      await fetchMetrics()
      await fetchRoutes()
    } catch (e) {
      console.error(e)
    } finally {
      setIsRunningClassical(false)
    }
  }, [fetchMetrics, fetchRoutes])

  const generateScenario = useCallback(async (numNodes, numVehicles) => {
    try {
      await fetch(`${API}/api/scenario/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_nodes: numNodes, num_vehicles: numVehicles }),
      })
      setQioResult(null)
      setClassicalResult(null)
      setRoutes(null)
      setMetrics(null)
      setActiveRoute(null)

      const r = await fetch(`${API}/api/scenario`)
      const data = await r.json()
      setScenario(data)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handlePointerDown = (e) => {
    if (!hasResults || mapExpanded) return
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: pipPos.x,
      initialY: pipPos.y
    }
    e.target.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDragging) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setPipPos({ x: dragRef.current.initialX + dx, y: dragRef.current.initialY + dy })
  }

  const handlePointerUp = (e) => {
    if (dragRef.current.isDragging) {
      dragRef.current.isDragging = false
      e.target.releasePointerCapture(e.pointerId)
    }
  }

  const hasResults = Boolean(qioResult || classicalResult)
  const mapStyle = hasResults && !mapExpanded ? { transform: `translate(${pipPos.x}px, ${pipPos.y}px)` } : {}

  return (
    <div className={`app-shell ${hasResults ? 'has-results' : ''}`}>
      {/* ── Topbar ── */}
      <header className="topbar">
        <div className="topbar-logo">
          <div className="logo-icon">⚛</div>
          <div>
            <div className="logo-text">QuantaFleet</div>
            <div className="logo-sub">Quantum-Inspired Logistics</div>
          </div>
        </div>
        <div className="topbar-spacer" />
        <div className="topbar-badge">NISQ Era</div>
        <div className="topbar-badge">QUBO Engine</div>
        <div className="topbar-badge">SimQA Solver</div>

        {/* Heatmap toggle in topbar */}
        <button
          onClick={toggleHeatmap}
          style={{
            padding: '4px 12px',
            borderRadius: 99,
            border: `1px solid ${showHeatmap ? 'rgba(239,68,68,0.5)' : 'rgba(0,0,0,0.12)'}`,
            background: showHeatmap ? 'rgba(239,68,68,0.1)' : 'transparent',
            color: showHeatmap ? '#ef4444' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          🌡️ {showHeatmap ? 'Heatmap ON' : 'Heatmap'}
        </button>

        <div className="status-pill">
          <div className="status-dot" />
          Live
        </div>
      </header>

      {/* ── Left Panel ── */}
      <aside className="panel">
        <OptimizerPanel
          scenario={scenario}
          onRunQuantum={runQuantum}
          onRunClassical={runClassical}
          isRunningQIO={isRunningQIO}
          isRunningClassical={isRunningClassical}
          qioResult={qioResult}
          classicalResult={classicalResult}
          vehicles={vehicles}
          activeRoute={activeRoute}
          onSelectRoute={setActiveRoute}
          routes={routes}
          onGenerateScenario={generateScenario}
          trafficLevel={trafficLevel}
          onTrafficChange={handleTrafficChange}
        />
      </aside>

      {/* ── Map ── */}
      <main className={`map-container ${mapExpanded ? 'expanded' : ''}`} style={mapStyle}>
        {hasResults && (
          <div className="map-header" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 600, pointerEvents: 'none' }}>⚛ Live Fleet Map</span>
            <button className="map-expand-btn" onPointerDown={e => e.stopPropagation()} onClick={() => setMapExpanded(!mapExpanded)}>
              {mapExpanded ? 'Minimize' : 'Expand'}
            </button>
          </div>
        )}
        <FleetMap
          scenario={scenario}
          vehicles={vehicles}
          routes={routes}
          activeRoute={activeRoute}
          onSelectRoute={setActiveRoute}
          qioResult={qioResult}
          classicalResult={classicalResult}
          trafficLevel={trafficLevel}
          heatmapData={heatmapData}
          showHeatmap={showHeatmap}
        />
      </main>

      {/* ── Right Panel ── */}
      <aside className="panel panel-right">
        <MetricsPanel
          metrics={metrics}
          qioResult={qioResult}
          classicalResult={classicalResult}
        />
      </aside>
    </div>
  )
}
