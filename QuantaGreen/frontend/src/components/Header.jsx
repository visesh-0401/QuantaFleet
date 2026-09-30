import React from 'react';
import { Leaf, Cpu, Activity, Calculator, BarChart3, ShieldCheck, Download } from 'lucide-react';

export default function Header({ 
  onOpenCalculator, 
  activeTab, 
  setActiveTab, 
  isOptimizing,
  onRunQuantum,
  onRunBenchmark 
}) {
  return (
    <header style={{
      background: 'rgba(8, 18, 31, 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(16, 185, 129, 0.22)',
      padding: '12px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{
        maxWidth: '1720px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
      }}>
        {/* Brand & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #00f2fe 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0, 242, 254, 0.4)',
          }}>
            <Leaf size={24} color="#060d17" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                Quanta<span style={{ color: '#00f2fe' }}>Green</span>
              </h1>
              <span className="badge badge-quantum">
                <Cpu size={12} /> QIO Metaheuristic
              </span>
              <span className="badge badge-green">
                SIH26138
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
              Quantum-Inspired Fuel Consumption Prediction & Green Fleet Optimization • Egreen Quanta / MIC
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(14, 28, 46, 0.8)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid rgba(16, 185, 129, 0.15)',
        }}>
          <button 
            className={`btn ${activeTab === 'map' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => setActiveTab('map')}
          >
            <Activity size={15} /> Fleet & Routes
          </button>
          <button 
            className={`btn ${activeTab === 'benchmark' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => setActiveTab('benchmark')}
          >
            <BarChart3 size={15} /> Quantum Benchmark
          </button>
          <button 
            className={`btn ${activeTab === 'fuels' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => setActiveTab('fuels')}
          >
            <Leaf size={15} /> Alternative Fuels
          </button>
          <button 
            className={`btn ${activeTab === 'cii' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => setActiveTab('cii')}
          >
            <ShieldCheck size={15} /> IMO CII Scorecard
          </button>
        </div>

        {/* Quick Action Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '7px 14px' }}
            onClick={onOpenCalculator}
          >
            <Calculator size={15} color="#00f2fe" /> Fuel Calculator
          </button>

          <button 
            className="btn btn-quantum"
            style={{ fontSize: '0.82rem', padding: '7px 16px' }}
            disabled={isOptimizing}
            onClick={onRunQuantum}
          >
            <Cpu size={15} /> {isOptimizing ? 'Optimizing...' : 'Run Quantum Annealer'}
          </button>
        </div>
      </div>
    </header>
  );
}
