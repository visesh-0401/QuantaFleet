import React from 'react';
import { Sliders, Wind, DollarSign, Cpu, BarChart2, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

export default function OptimizationControls({
  params,
  setParams,
  onRunQuantum,
  onRunBenchmark,
  onRunClassical,
  isOptimizing,
  benchmarkData
}) {
  const beaufortDescriptions = [
    '0 - Calm (Flat mirror sea)',
    '1 - Light Air (Ripples, 0.1m)',
    '2 - Light Breeze (Small wavelets, 0.2m)',
    '3 - Gentle Breeze (Large wavelets, 0.6m)',
    '4 - Moderate Breeze (Small waves, 1.0m)',
    '5 - Fresh Breeze (Moderate waves, 2.0m)',
    '6 - Strong Breeze (Large waves, white foam, 3.0m)',
    '7 - Near Gale (Sea heaps up, foam streaks, 4.0m)',
    '8 - Gale (Moderately high waves, 5.5m)',
  ];

  const applyPreset = (presetName) => {
    if (presetName === 'monsoon') {
      setParams({ ...params, sea_state_severity: 6, carbon_tax_usd: 85, lambda_fuel: 0.25, lambda_cost: 0.35, lambda_co2: 0.40 });
    } else if (presetName === 'calm_eco') {
      setParams({ ...params, sea_state_severity: 1, carbon_tax_usd: 120, lambda_fuel: 0.20, lambda_cost: 0.25, lambda_co2: 0.55 });
    } else if (presetName === 'cost_max') {
      setParams({ ...params, sea_state_severity: 3, carbon_tax_usd: 25, lambda_fuel: 0.45, lambda_cost: 0.45, lambda_co2: 0.10 });
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="#00f2fe" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Simulation Controls</h3>
        </div>
        <span className="badge badge-quantum">QIO Setup</span>
      </div>

      {/* Scenario Presets */}
      <div>
        <label style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>
          Quick Scenario Presets
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '0.72rem', padding: '6px 4px' }}
            onClick={() => applyPreset('monsoon')}
          >
            🌊 Monsoon 6B
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '0.72rem', padding: '6px 4px' }}
            onClick={() => applyPreset('calm_eco')}
          >
            🌿 Net-Zero Eco
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '0.72rem', padding: '6px 4px' }}
            onClick={() => applyPreset('cost_max')}
          >
            💰 Low Opex
          </button>
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

      {/* Weather / Sea State Slider */}
      <div className="slider-group">
        <div className="slider-label">
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Wind size={14} color="#38bdf8" /> Sea State (Beaufort Scale)
          </span>
          <span className="slider-val">Bft {params.sea_state_severity}</span>
        </div>
        <input
          type="range"
          min="0"
          max="8"
          step="1"
          value={params.sea_state_severity}
          onChange={(e) => setParams({ ...params, sea_state_severity: Number(e.target.value) })}
        />
        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
          {beaufortDescriptions[params.sea_state_severity]}
        </span>
      </div>

      {/* Carbon Tax Slider */}
      <div className="slider-group">
        <div className="slider-label">
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <DollarSign size={14} color="#10b981" /> Carbon Tax / EU ETS Levy
          </span>
          <span className="slider-val">${params.carbon_tax_usd}/t CO₂e</span>
        </div>
        <input
          type="range"
          min="0"
          max="180"
          step="5"
          value={params.carbon_tax_usd}
          onChange={(e) => setParams({ ...params, carbon_tax_usd: Number(e.target.value) })}
        />
        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
          Simulates IMO Net-Zero Pricing & EU Maritime ETS Penalties
        </span>
      </div>

      {/* Multi-Objective Weights */}
      <div>
        <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Multi-Objective Priorities</span>
          <span style={{ color: '#00f2fe', fontSize: '0.74rem' }}>Σ = 1.0</span>
        </label>

        {/* Fuel Weight */}
        <div className="slider-group" style={{ marginBottom: '8px' }}>
          <div className="slider-label">
            <span>Fuel Burn (λ_fuel)</span>
            <span className="slider-val">{(params.lambda_fuel * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={params.lambda_fuel}
            onChange={(e) => setParams({ ...params, lambda_fuel: Number(e.target.value) })}
          />
        </div>

        {/* Cost Weight */}
        <div className="slider-group" style={{ marginBottom: '8px' }}>
          <div className="slider-label">
            <span>Voyage OPEX (λ_cost)</span>
            <span className="slider-val">{(params.lambda_cost * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={params.lambda_cost}
            onChange={(e) => setParams({ ...params, lambda_cost: Number(e.target.value) })}
          />
        </div>

        {/* CO2 Weight */}
        <div className="slider-group" style={{ marginBottom: '8px' }}>
          <div className="slider-label">
            <span>CO₂ Lifecycle (λ_co2)</span>
            <span className="slider-val">{(params.lambda_co2 * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={params.lambda_co2}
            onChange={(e) => setParams({ ...params, lambda_co2: Number(e.target.value) })}
          />
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

      {/* Annealing Iterations */}
      <div className="slider-group">
        <div className="slider-label">
          <span>QIO Annealing Iterations</span>
          <span className="slider-val">{params.num_iterations}</span>
        </div>
        <input
          type="range"
          min="100"
          max="600"
          step="20"
          value={params.num_iterations}
          onChange={(e) => setParams({ ...params, num_iterations: Number(e.target.value) })}
        />
      </div>

      {/* Execution Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
        <button
          className="btn btn-quantum"
          style={{ width: '100%', padding: '10px' }}
          disabled={isOptimizing}
          onClick={onRunQuantum}
        >
          <Cpu size={16} /> {isOptimizing ? 'Quantum Annealer Running...' : '⚡ Optimize via Quantum Annealer'}
        </button>

        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '9px' }}
          disabled={isOptimizing}
          onClick={onRunBenchmark}
        >
          <BarChart2 size={16} /> 📊 Run 3-Way Benchmark
        </button>

        <button
          className="btn btn-secondary"
          style={{ width: '100%', padding: '8px', fontSize: '0.78rem' }}
          disabled={isOptimizing}
          onClick={onRunClassical}
        >
          <RefreshCw size={14} /> Run Classical Greedy Baseline
        </button>
      </div>

      {/* Benchmark Badge Notice */}
      {benchmarkData && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '0.76rem',
          color: '#cbd5e1',
          lineHeight: '1.4',
        }}>
          <div style={{ color: '#10b981', fontWeight: 700, marginBottom: '2px' }}>
            ✓ Benchmark Active
          </div>
          QIO saved <strong>{benchmarkData.benchmark_summary?.co2_saved_pct}% CO₂e</strong> and escaped local minima via{' '}
          <strong>{benchmarkData.benchmark_summary?.quantum_tunneling_events} quantum tunneling events</strong>.
        </div>
      )}
    </div>
  );
}
