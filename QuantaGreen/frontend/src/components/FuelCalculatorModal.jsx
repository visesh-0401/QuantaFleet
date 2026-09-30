import React, { useState, useEffect } from 'react';
import { X, Calculator, Zap, Fuel, DollarSign, CloudRain, ShieldCheck, Activity } from 'lucide-react';
import { predictFuel } from '../services/api';

export default function FuelCalculatorModal({ isOpen, onClose, vesselCatalog = {}, fuelSpecs = {} }) {
  const [formData, setFormData] = useState({
    vessel_model_key: 'feeder_container_2500',
    distance_nm: 560,
    speed_knots: 15.0,
    cargo_load_teu: 850,
    fuel_type: 'MGO',
    sea_state_beaufort: 3,
    use_shore_power: true,
    carbon_tax_usd_per_tonne: 75.0,
    port_hours: 12.0,
  });

  const [result, setResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    runCalc();
  }, [formData, isOpen]);

  const runCalc = async () => {
    setIsCalculating(true);
    try {
      const data = await predictFuel(formData);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={20} color="#00f2fe" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Hydrodynamic Fuel & Emissions Sandbox Calculator
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Inputs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '18px' }}>
          {/* Vessel Selection */}
          <div className="slider-group">
            <label className="slider-label">Vessel Model</label>
            <select
              style={{
                background: '#13263c',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                padding: '8px',
                color: '#f1f5f9',
                fontSize: '0.82rem',
                outline: 'none',
              }}
              value={formData.vessel_model_key}
              onChange={(e) => setFormData({ ...formData, vessel_model_key: e.target.value })}
            >
              {Object.entries(vesselCatalog).map(([key, v]) => (
                <option key={key} value={key}>{v.name} ({v.type})</option>
              ))}
            </select>
          </div>

          {/* Fuel Selection */}
          <div className="slider-group">
            <label className="slider-label">Bunkering Fuel</label>
            <select
              style={{
                background: '#13263c',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                padding: '8px',
                color: '#f1f5f9',
                fontSize: '0.82rem',
                outline: 'none',
              }}
              value={formData.fuel_type}
              onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
            >
              {Object.keys(fuelSpecs).filter(f => f !== 'ShorePower').map((f) => (
                <option key={f} value={f}>{f} — {fuelSpecs[f]?.name}</option>
              ))}
            </select>
          </div>

          {/* Speed Slider */}
          <div className="slider-group">
            <div className="slider-label">
              <span>Cruising Speed</span>
              <span className="slider-val">{formData.speed_knots} knots</span>
            </div>
            <input
              type="range"
              min="8.0"
              max="22.0"
              step="0.5"
              value={formData.speed_knots}
              onChange={(e) => setFormData({ ...formData, speed_knots: Number(e.target.value) })}
            />
          </div>

          {/* Distance */}
          <div className="slider-group">
            <div className="slider-label">
              <span>Voyage Distance</span>
              <span className="slider-val">{formData.distance_nm} NM</span>
            </div>
            <input
              type="range"
              min="100"
              max="2500"
              step="50"
              value={formData.distance_nm}
              onChange={(e) => setFormData({ ...formData, distance_nm: Number(e.target.value) })}
            />
          </div>

          {/* Cargo Load */}
          <div className="slider-group">
            <div className="slider-label">
              <span>Cargo Payload</span>
              <span className="slider-val">{formData.cargo_load_teu} TEU</span>
            </div>
            <input
              type="range"
              min="50"
              max="2500"
              step="50"
              value={formData.cargo_load_teu}
              onChange={(e) => setFormData({ ...formData, cargo_load_teu: Number(e.target.value) })}
            />
          </div>

          {/* Sea State */}
          <div className="slider-group">
            <div className="slider-label">
              <span>Weather / Sea State</span>
              <span className="slider-val">Beaufort {formData.sea_state_beaufort}</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="1"
              value={formData.sea_state_beaufort}
              onChange={(e) => setFormData({ ...formData, sea_state_beaufort: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* Shore Power Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <input
            type="checkbox"
            id="shorePowerCheck"
            checked={formData.use_shore_power}
            onChange={(e) => setFormData({ ...formData, use_shore_power: e.target.checked })}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="shorePowerCheck" style={{ fontSize: '0.82rem', color: '#cbd5e1', cursor: 'pointer' }}>
            Connect to Port Cold-Ironing Shore Power during 12h turnaround (eliminates in-port auxiliary diesel burn)
          </label>
        </div>

        {/* Live Hydrodynamic Prediction Results */}
        {result && (
          <div style={{ background: '#07121e', borderRadius: '12px', border: '1px solid rgba(0, 242, 254, 0.3)', padding: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#00f2fe', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={16} /> Instant Physical Prediction Outputs
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Propulsion Power</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{result.engine_power_kw.toLocaleString()} kW</span>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>{result.engine_load_pct}% MCR Load</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Transit Time</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{result.transit_time_hrs} hrs</span>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Speed {result.speed_knots} kt</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Voyage Fuel Burn</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#10b981' }}>{result.total_fuel_tonnes} t</span>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>{result.fuel_burn_rate_tonnes_hr} t/hr</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Lifecycle CO₂e</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#00f2fe' }}>{result.co2e_wtw_tonnes} t</span>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Well-to-Wake</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Total OPEX Cost</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>${Math.round(result.total_cost_usd).toLocaleString()}</span>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Fuel + ${formData.carbon_tax_usd_per_tonne}/t tax</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>IMO CII Grade</span>
                <span style={{
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  color: result.cii_rating === 'A' ? '#10b981' : result.cii_rating === 'B' ? '#38bdf8' : '#f59e0b'
                }}>
                  Grade {result.cii_rating}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>{result.attained_cii} gCO₂/dwt·nm</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
