import React, { useState } from 'react';
import { Leaf, Flame, Zap, ShieldAlert, Award, TrendingUp, Info } from 'lucide-react';

export default function AlternativeFuelExplorer({ fuelSpecs = {} }) {
  const [selectedFuel, setSelectedFuel] = useState('Methanol');

  const fuels = Object.entries(fuelSpecs);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Intro Header */}
      <div className="glass-panel" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Leaf size={20} color="#10b981" /> Alternative Fuels & Shore Power Scenario Explorer
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '4px' }}>
              Well-to-Wake (WtW) lifecycle greenhouse gas emissions, methane slip modeling, and bunkering economics.
            </p>
          </div>
          <span className="badge badge-green">IMO 2030 / 2050 Compliant</span>
        </div>
      </div>

      {/* Fuel Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        {fuels.map(([key, spec]) => {
          const isSelected = selectedFuel === key;
          return (
            <div
              key={key}
              className="glass-panel"
              onClick={() => setSelectedFuel(key)}
              style={{
                padding: '16px',
                cursor: 'pointer',
                borderColor: isSelected ? spec.color : 'rgba(255,255,255,0.08)',
                boxShadow: isSelected ? `0 0 20px ${spec.color}44` : undefined,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: `${spec.color}22`,
                  color: spec.color,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  border: `1px solid ${spec.color}55`,
                }}>
                  {key}
                </span>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{spec.category}</span>
              </div>

              <h4 style={{ fontSize: '0.95rem', color: '#f1f5f9', marginBottom: '10px' }}>
                {spec.name}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Lower Heating Value (LHV):</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{spec.lhv_mj_per_kg} MJ/kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Bunkering Cost:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#f59e0b', fontWeight: 600 }}>
                    ${spec.cost_usd_per_tonne}/tonne
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Well-to-Wake (WtW) CO₂e:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#00f2fe', fontWeight: 600 }}>
                    {spec.wtw_co2e_kg_per_kg} kg/kg
                  </span>
                </div>
                {spec.methane_slip_g_per_kg > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f43f5e' }}>
                    <span>Methane Slip (GWP20 = 84):</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{spec.methane_slip_g_per_kg} g/kg</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Scenario Insights */}
      {selectedFuel && fuelSpecs[selectedFuel] && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Info size={18} color="#00f2fe" />
            <h4 style={{ fontSize: '1rem', color: '#f1f5f9' }}>
              Strategic Deep-Dive: {fuelSpecs[selectedFuel].name} ({selectedFuel})
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '0.82rem', lineHeight: '1.6', color: '#cbd5e1' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <strong style={{ color: '#10b981', display: 'block', marginBottom: '4px' }}>Decarbonization Impact:</strong>
              {selectedFuel === 'MGO' && 'Fossil benchmark. Emits 3.68 kg CO₂e per kg fuel consumed across lifecycle. High carbon tax exposure under EU ETS & IMO Net-Zero levy.'}
              {selectedFuel === 'LNG' && 'Provides immediate 20-25% CO₂ reduction vs MGO. However, unburned methane slip in low-pressure dual fuel engines requires catalyst technology.'}
              {selectedFuel === 'Methanol' && 'Green e-Methanol produced from captured CO₂ and green hydrogen achieves 90%+ lifecycle carbon reduction. Compatible with standard bunkering infrastructure.'}
              {selectedFuel === 'Ammonia' && 'Zero-carbon molecule with zero Tank-to-Wake CO₂ emissions. Produced via renewable green hydrogen. Enables true net-zero deep-sea voyages.'}
              {selectedFuel === 'Hydrogen' && 'Highest energy density by mass (120 MJ/kg) with zero direct emissions. Ideal for high-efficiency fuel-cell coastal barges and intermodal logistic trucks.'}
              {selectedFuel === 'ShorePower' && 'Cold-ironing allows vessels to shut down auxiliary diesel generators while berthed, eliminating port-city particulate matter (PM2.5, SOx, NOx) and reducing carbon intensity.'}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <strong style={{ color: '#00f2fe', display: 'block', marginBottom: '4px' }}>Quantum Optimization Formulation:</strong>
              The Quantum Annealer balances the higher bunkering purchase cost ($/t) of alternative fuels against avoided carbon taxes ($/t CO₂e) and IMO CII compliance rewards, discovering the exact optimal fuel bunkering strategy per voyage leg.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
