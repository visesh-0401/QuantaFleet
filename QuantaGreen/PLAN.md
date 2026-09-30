# 🌿 QuantaGreen (SIH26138) — Implementation Plan
## Quantum-Inspired Fuel Consumption Prediction & Green Fleet Optimization
**Problem Statement**: SIH26138 | **Creator**: Sarim Moin / Egreen Quanta (MIC) | **Category**: Clean & Green Technology

---

## 🧭 Executive Summary & Core Requirements

SIH26138 addresses the maritime and logistics sector's high-stakes decarbonization challenge:
1. **Accurate Non-Linear Fuel Prediction**: Physical hydrodynamics (Admiralty coefficient / Holtrop-Mennen resistance, engine SFOC curves, payload displacement, weather/sea state resistance) coupled with machine-learning coefficients.
2. **Alternative Fuel & Shore Power Modeling**: Marine Gas Oil (MGO/VLSFO), LNG, Green Methanol, Green Hydrogen, Green Ammonia, and Berth Shore Power (Cold Ironing).
3. **Quantum-Inspired Metaheuristic Fleet Optimizer**: Multi-objective combinatorial optimization (QUBO / Simulated Bifurcation / Quantum Annealing) determining:
   - Optimal vessel-to-route assignment
   - Speed optimization (Slow Steaming vs Transit Deadline)
   - Alternative fuel bunkering selection
   - Shore-power berth utilization
4. **Lifecycle Emissions & Regulatory Compliance**: Well-to-Wake (WtW) and Tank-to-Wake (TtW) GHG emissions (CO₂e, CH₄ slip, N₂O) and IMO Carbon Intensity Indicator (CII) Rating (Grades A to E).
5. **Head-to-Head Benchmarking Engine**: Comparing Quantum-Inspired Optimization (QIO) vs Classical Baselines (Greedy Heuristics, Multi-Objective Genetic Algorithm) in convergence rate, solution quality, fuel saved %, and carbon tax reduction.

---

## 🏗️ Architecture & Component Roadmap

### 1. Backend (`/QuantaGreen/backend`)
- **`fleet_data.py`**:
  - Realistic vessel & vehicle catalog (Feedermax Container, Ultramax Bulk Carrier, MR2 Product Tanker, Coastal Electric Barge, Heavy Freight EV/H2 Truck).
  - Indian Ocean & Coastal Shipping Lanes (JNPT Mumbai, Kochi, Colombo, Chennai, Visakhapatnam, Kolkata, Haldia) with nautical miles and sea-condition baselines.
  - Fuel specifications (energy densities, cost $/tonne, lifecycle emission factors gCO₂e/MJ).
- **`fuel_prediction_engine.py`**:
  - Non-linear hydrodynamic resistance modeling:
    $$P_B = \frac{\Delta^{2/3} \cdot V^3}{C_{adm}} \cdot f_{weather}(Beaufort) \cdot f_{draft} \cdot f_{fouling}$$
  - Specific fuel oil consumption (SFOC) per fuel type.
  - Well-to-Wake (WtW) lifecycle GHG & IMO CII calculation.
- **`quantum_green_optimizer.py`**:
  - Multi-objective QUBO formulation balancing:
    $$H = \lambda_{fuel} H_{fuel} + \lambda_{cost} H_{cost} + \lambda_{co2} H_{co2} + \lambda_{penalty} H_{constraints}$$
  - Quantum Simulated Annealing with quantum tunneling mechanisms & simulated bifurcation.
- **`classical_benchmark_solver.py`**:
  - Multi-Objective Genetic Algorithm (NSGA-II inspired) + Sequential Greedy Dispatcher for fair, rigorous benchmark comparison.
- **`main.py`**:
  - High-performance FastAPI server exposing REST APIs for fleet management, real-time prediction, quantum optimization, classical benchmark, and CII regulatory auditing.

### 2. Frontend (`/QuantaGreen/frontend`)
- **Aesthetic**: Futuristic Clean-Tech Marine Command Center. Deep abyssal ocean dark theme (`#08121e`), bioluminescent emerald `#10b981`, electric cyan `#00f2fe`, glassmorphic HUD cards.
- **Components**:
  - `MaritimeMap.jsx`: Leaflet map rendering Indian Ocean / Coastal shipping lanes, port hubs, real-time vessel positions, weather/sea state overlay.
  - `OptimizationControls.jsx`: Scenario controls for weather severity (Beaufort 1–8), carbon tax rate ($0–$150/ton), alternative fuel mandate, and optimization engine selection.
  - `FuelCalculatorModal.jsx`: Interactive sandbox to input vessel type, speed (knots), draft, sea state, and fuel to instantly calculate fuel burn, CO₂, and CII rating.
  - `ComparisonDashboard.jsx`: Side-by-side Quantum vs Classical performance telemetry (Fuel saved %, Cost reduction %, CO₂ abatement, convergence speed).
  - `AlternativeFuelExplorer.jsx`: Interactive trade-off visualizer comparing MGO, LNG, Methanol, Hydrogen, and Ammonia across CAPEX, OPEX, and lifecycle emissions.
  - `CIIScorecard.jsx`: Official IMO CII grade rating badges (A through E) and decarbonization trajectory toward 2030/2050 targets.

### 3. Deliverables & Submission Collateral
- **`SIH26138_Idea_Presentation.html`**: A 6-slide presentation deck matching the official SIH 2026 PPT format for Egreen Quanta / MIC.
- **`SIH26138_Abstract.md`**: Official 500-word PS-specific abstract tailored for Clean & Green Technology.
- **`README.md` & `start.sh`**: One-command launch and documentation.
