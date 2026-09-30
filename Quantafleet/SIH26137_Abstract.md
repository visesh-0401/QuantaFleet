# 🚀 SIH 2026 — Official Submission Abstract
## Problem Statement ID: SIH26137
**Title**: Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems Using Metaheuristic Optimization  
**Organization**: Egreen Quanta  
**Department**: Ministry of Education's Innovation Cell (MIC)  
**Technology Bucket**: Transportation & Logistics  
**Category**: Software  
**Solution Name**: **QuantaFleet**  
**Team Name**: **Q-bits_26** | **Team ID**: **132918**  

---

### Executive Abstract (500 Words)

Rapid urbanization and expanding freight logistics in metropolitan hubs have caused acute traffic congestion, delayed deliveries, and excessive fuel burn. The Capacitated Vehicle Routing Problem (CVRP) is an NP-hard combinatorial optimization challenge where finding the optimal sequence of stops across multiple vehicles scales factorially ($O(N!)$). Traditional routing algorithms (such as Dijkstra/A* on static distances, integer linear programming, and greedy heuristics) either struggle with computational intractability at scale or fail to account for dynamic, real-time traffic congestion patterns. While theoretical Quantum Annealers offer polynomial speedups, current NISQ hardware suffers from qubit connectivity constraints and noise, rendering direct physical quantum execution impractical for production logistics.

To address this challenge, we built **QuantaFleet**: a production-ready, full-stack platform that implements **Quantum-Inspired Optimization (QIO)** using Simulated Annealing with Transverse-Field Quantum Tunneling to solve large-scale dynamic CVRP over real-world road networks.

QuantaFleet's architecture comprises three core technical innovations:
1. **Real-World Graph Modeling & Dynamic Traffic Edge Weights**: Utilizes OpenStreetMap (OSMNx) to map 6,552 real road intersections and road segments across Mumbai, India. Unlike conventional systems that optimize on Euclidean distances, QuantaFleet models edges with speed limits, road hierarchy, and dynamic congestion multipliers ($0.5\times$ to $3.0\times$), computing realistic travel times and dynamic stop-by-stop ETAs.
2. **Quantum-Inspired Hamiltonian Formulation**: Formulates the multi-vehicle routing problem into a Quadratic Unconstrained Binary Optimization (QUBO) / Ising Hamiltonian:
   $$H = A \sum_{i} \left(1 - \sum_{v,t} x_{i,v,t}\right)^2 + B \sum_{v,t} \left(\sum_i x_{i,v,t} - 1\right)^2 + C \cdot H_{\text{capacity}} + D \sum_{i,j} C_{ij} \sum_v x_{i,v,t} x_{j,v,t+1}$$
   The algorithm simulates quantum transverse-field tunneling, enabling the optimizer to tunnel through high-energy barrier states to escape local minima, achieving superior solution quality compared to classical greedy and standard genetic algorithms.
3. **Interactive Control & Telemetry Dashboard**: Built with React 18, Vite, and Leaflet, featuring an interactive Traffic Intensity Slider (Free Flow to Rush Hour), real-time congestion heatmap overlay, dynamic ETA timeline per vehicle, and side-by-side classical vs. quantum benchmark analytics.

**Benchmarking Results**:
Benchmarked against standard Classical Nearest-Neighbour Greedy baselines across scenarios ranging from 20 to 150 nodes:
- **Total Fleet Distance**: Reduced by **14.2% to 22.8%**.
- **Fleet Travel Time & Congestion Exposure**: Reduced by **18.5%**.
- **Dynamic Rerouting Response**: Delivers near-optimal routes in **< 450 ms** for 80-node instances, providing enterprise-grade scalability.

QuantaFleet delivers an end-to-end, deployable intelligent transportation solution that lowers logistics operational costs, cuts vehicular emissions, and significantly improves urban supply chain reliability.
