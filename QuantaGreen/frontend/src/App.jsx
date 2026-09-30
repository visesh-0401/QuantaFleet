import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MaritimeMap from './components/MaritimeMap';
import OptimizationControls from './components/OptimizationControls';
import ComparisonDashboard from './components/ComparisonDashboard';
import AlternativeFuelExplorer from './components/AlternativeFuelExplorer';
import CIIScorecard from './components/CIIScorecard';
import FuelCalculatorModal from './components/FuelCalculatorModal';

import {
  fetchFleet,
  fetchRoutes,
  fetchFuels,
  fetchCIIOverview,
  runQuantumOptimization,
  runClassicalGreedy,
  runFullBenchmark,
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Core Data
  const [ports, setPorts] = useState({});
  const [routes, setRoutes] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [vesselCatalog, setVesselCatalog] = useState({});
  const [fuelSpecs, setFuelSpecs] = useState({});
  const [ciiData, setCiiData] = useState(null);

  // Simulation & Optimization State
  const [optimizationParams, setOptimizationParams] = useState({
    carbon_tax_usd: 75.0,
    sea_state_severity: 3,
    lambda_fuel: 0.30,
    lambda_cost: 0.35,
    lambda_co2: 0.35,
    num_iterations: 280,
  });

  const [quantumResult, setQuantumResult] = useState(null);
  const [classicalResult, setClassicalResult] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);

  // Load initial backend datasets
  useEffect(() => {
    async function loadData() {
      try {
        const [fleetRes, routesRes, fuelsRes, ciiRes] = await Promise.all([
          fetchFleet(),
          fetchRoutes(),
          fetchFuels(),
          fetchCIIOverview(),
        ]);
        setFleet(fleetRes.active_fleet);
        setVesselCatalog(fleetRes.vessel_catalog);
        setPorts(routesRes.ports);
        setRoutes(routesRes.routes);
        setFuelSpecs(fuelsRes.fuel_specs);
        setCiiData(ciiRes);

        // Run default benchmark in background for instant comparison
        runFullBenchmark({ carbon_tax_usd: 75.0, sea_state: 3 }).then((bench) => {
          setBenchmarkData(bench);
          setQuantumResult(bench.quantum_optimizer);
          setClassicalResult(bench.greedy_baseline);
        });
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    loadData();
  }, []);

  // Handlers
  const handleRunQuantum = async () => {
    setIsOptimizing(true);
    try {
      const res = await runQuantumOptimization(optimizationParams);
      setQuantumResult(res);
      setActiveTab('benchmark');
    } catch (err) {
      alert('Quantum Optimization failed: ' + err.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleRunBenchmark = async () => {
    setIsOptimizing(true);
    try {
      const bench = await runFullBenchmark({
        carbon_tax_usd: optimizationParams.carbon_tax_usd,
        sea_state: optimizationParams.sea_state_severity,
      });
      setBenchmarkData(bench);
      setQuantumResult(bench.quantum_optimizer);
      setClassicalResult(bench.greedy_baseline);
      setActiveTab('benchmark');
    } catch (err) {
      alert('Benchmark failed: ' + err.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleRunClassical = async () => {
    setIsOptimizing(true);
    try {
      const res = await runClassicalGreedy({
        carbon_tax_usd: optimizationParams.carbon_tax_usd,
        sea_state: optimizationParams.sea_state_severity,
      });
      setClassicalResult(res);
      setActiveTab('benchmark');
    } catch (err) {
      alert('Classical run failed: ' + err.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        isOptimizing={isOptimizing}
        onRunQuantum={handleRunQuantum}
        onRunBenchmark={handleRunBenchmark}
      />

      {/* Main Body */}
      <main className="main-content">
        {/* Left Column: Simulation & Control Sidebar */}
        <aside>
          <OptimizationControls
            params={optimizationParams}
            setParams={setOptimizationParams}
            onRunQuantum={handleRunQuantum}
            onRunBenchmark={handleRunBenchmark}
            onRunClassical={handleRunClassical}
            isOptimizing={isOptimizing}
            benchmarkData={benchmarkData}
          />
        </aside>

        {/* Right Column: Dynamic Tab View */}
        <section>
          {activeTab === 'map' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <MaritimeMap
                ports={ports}
                routes={routes}
                fleet={fleet}
                deployments={quantumResult?.deployments || []}
              />
              {/* Quick Summary Strip under map */}
              <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-green">Live Sea Corridors</span>
                  <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                    {routes.length} Maritime Shipping Lanes Active across Arabian Sea & Bay of Bengal
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem' }}>
                  <span>Weather: <strong style={{ color: '#00f2fe' }}>Beaufort {optimizationParams.sea_state_severity}</strong></span>
                  <span>Carbon Tax: <strong style={{ color: '#10b981' }}>${optimizationParams.carbon_tax_usd}/t</strong></span>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '0.76rem', padding: '5px 12px' }}
                    onClick={() => setActiveTab('benchmark')}
                  >
                    View Optimization Analytics →
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'benchmark' && (
            <ComparisonDashboard
              benchmarkData={benchmarkData}
              quantumResult={quantumResult}
              classicalResult={classicalResult}
            />
          )}

          {activeTab === 'fuels' && (
            <AlternativeFuelExplorer fuelSpecs={fuelSpecs} />
          )}

          {activeTab === 'cii' && (
            <CIIScorecard ciiData={ciiData} />
          )}
        </section>
      </main>

      {/* Floating Fuel Sandbox Calculator Modal */}
      <FuelCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        vesselCatalog={vesselCatalog}
        fuelSpecs={fuelSpecs}
      />
    </div>
  );
}
