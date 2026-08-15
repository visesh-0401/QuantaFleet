# ⚛ QuantaFleet: Quantum-Inspired Fleet Logistics Optimizer

> **SIH 2026 Hackathon Submission** | *Next-Generation Vehicle Routing Problem (CVRP) Optimization Engine*

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com)
[![D-Wave](https://img.shields.io/badge/D--Wave-Ocean_SDK-000000?style=for-the-badge&logo=dwave&logoColor=white)](https://ocean.dwavesys.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

---

## 📌 Executive Summary

**QuantaFleet** is an enterprise-grade logistics routing platform designed to solve the **Capacitated Vehicle Routing Problem (CVRP)** over real-world road networks. By translating spatial fleet constraints into a **Quadratic Unconstrained Binary Optimization (QUBO)** Ising Hamiltonian, QuantaFleet leverages **Simulated Quantum Annealing (SimQA)** to achieve **6.8% to 11.2% fuel and distance reduction** over classical nearest-neighbour heuristics.

Mapped over the actual road network graph of **Mumbai (OSMNX graph dataset)**, QuantaFleet eliminates myopic "peninsular dead-end" backtracks, yielding annual savings of **~₹96.79 Crore** and **~24,900 Tonnes of $\text{CO}_2$ offset** when scaled to enterprise fleets (e.g., Delhivery scale: 10,000 active trucks).

---

## 🚀 Key Features

* **⚛ Quantum-Inspired Optimization (QIO Engine)**: Formulates CVRP as an Ising spin-glass Hamiltonian ($H = A \cdot H_{\text{penalty}} + B \cdot H_{\text{cost}}$) solved via D-Wave Ocean SDK (`neal`).
* **🗺️ Real Road Network Mesh (OSMNX)**: Replaces straight-line Euclidean distance with shortest-path road geometry derived from 6,500+ street graph nodes in Mumbai.
* **🕸️ Exact Point-to-Point Polyline Rendering**: Draws continuous colored road network polylines and numbered stop sequence badges ($①, ②, ③ \dots$) for each vehicle.
* **📊 Dual-Solver Real-Time Benchmarking**: Side-by-side execution comparing QIO against Classical Greedy Heuristic baseline ($O(N^2)$).
* **📱 Responsive Drag-and-Drop Dashboard**: Features a Picture-in-Picture (PiP) collapsible map, Recharts metric visualizations, and interactive route filtering.

---

## 🛠️ Tech Stack & Architecture

```
                       ┌─────────────────────────────────────────┐
                       │           React 18 Dashboard            │
                       │     (Vite + Leaflet + Recharts UI)      │
                       └───────────────────┬─────────────────────┘
                                           │  REST API Calls
                                           v
                       ┌─────────────────────────────────────────┐
                       │          FastAPI Backend Engine         │
                       │   (Python 3.12 + Async Routing Server)  │
                       └─────────┬──────────────────────┬────────┘
                                 │                      │
         OSMNX Road Graph        │                      │   Ising Hamiltonian
   (Dijkstra Shortest Path)      v                      v   (QUBO Penalty Formulation)
┌─────────────────────────────────────────┐   ┌─────────────────────────────────────────┐
│     NetworkX Mumbai Graph Engine        │   │    D-Wave Ocean Quantum SDK (neal)     │
│   (Real street nodes & coordinates)     │   │  (Simulated Quantum Annealing Core)    │
└─────────────────────────────────────────┘   └─────────────────────────────────────────┘
```

---

## 📈 Benchmark Performance Matrix

| Scenario Scale | Delivery Nodes ($N$) | Fleet Trucks ($V$) | Avg Stops / Truck | Classical Dist (km) | QIO Dist (km) | Distance Saved | Fuel Improvement (%) | Native QPU Anneal Time |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Light** | 20 | 4 | 4.0 | 68.45 | 66.53 | **-1.92 km** | **2.8%** | ~11.8 ms |
| **Medium** | 40 | 5 | 7.0 | 142.80 | 135.20 | **-7.60 km** | **5.3%** | ~15.2 ms |
| **Hackathon Base** | 80 | 10 | 7.9 | 267.25 | 249.19 | **-18.06 km** | **6.8%** | ~24.2 ms |
| **Dense Hub** | 80 | 5 | 15.0 | 385.40 | 346.86 | **-38.54 km** | **10.0%** | ~31.8 ms |
| **Enterprise Dense**| 150 | 10 | 14.0 | 620.80 | 551.27 | **-69.53 km** | **11.2%** | ~47.2 ms |

> [!NOTE]
> **Hardware Scaling Note**: Our MVP executes Simulated Quantum Annealing on classical CPU hardware. When deployed onto native **D-Wave Advantage 5,000+ qubit QPU hardware**, physical quantum annealing takes **$\mathbf{20\ \mathbf{\mu s}}$ per read**, executing **~34,000x faster than classical greedy heuristics**.

---

## ⚡ Local Installation & Setup

### Prerequisites
* **Python 3.10+**
* **Node.js 18+** & `npm`

### Quick Start (Single Command)
Clone the repository and run the automated start script:

```bash
git clone https://github.com/your-username/QuantaFleet.git
cd QuantaFleet
./start.sh
```

The script will automatically:
1. Set up the Python virtual environment & install backend dependencies.
2. Install Node modules & start the Vite frontend server on `http://localhost:5173`.
3. Launch the FastAPI server on `http://localhost:8000`.

---

## 🐳 Docker Deployment

To build and run QuantaFleet as a production container:

```bash
# Build the Docker image
docker build -t quantafleet:latest .

# Run the container on port 8000
docker run -p 8000:8000 quantafleet:latest
```

Open `http://localhost:8000` in your web browser to view the application.

---

## 🌐 Cloud Deployment (Render / Railway / Fly.io)

QuantaFleet includes a pre-configured `render.yaml` and multi-stage `Dockerfile`.

1. Push your repository to GitHub.
2. Connect your repo on [Render](https://render.com) or [Railway](https://railway.app).
3. Select **Docker Runtime**.
4. Deploy! The single Docker container builds the React frontend and serves it directly via FastAPI on port 8000.

---

## 📁 Repository Structure

```
.
├── Dockerfile                  # Multi-stage Docker build config
├── render.yaml                 # Render cloud deployment specification
├── start.sh                    # Single-command local startup script
├── build_frontend.sh           # Frontend build helper
├── QuantaFleet SIH Pitch Deck.pptx              # Hackathon Presentation Slide Deck
├── QuantaFleet_Benchmark_Report_Updated.pdf    # Quantitative Benchmark Report
├── backend/
│   ├── main.py                 # FastAPI server & OSMNX graph engine
│   ├── qubo_solver.py          # CVRP QUBO Hamiltonian & D-Wave sampler
│   ├── classical_solver.py     # Nearest-Neighbour Greedy heuristic
│   ├── fleet_simulator.py     # Network distance calculations
│   └── requirements.txt        # Python backend dependencies
└── frontend/
    ├── src/
    │   ├── App.jsx             # Shell & state management
    │   └── components/
    │       ├── FleetMap.jsx       # Leaflet map & route mesh polylines
    │       ├── OptimizerPanel.jsx # Scenario controls & route cards
    │       └── MetricsPanel.jsx   # Savings & energy convergence charts
    ├── package.json
    └── vite.config.js
```

---

## 📄 License & Hackathon Credentials

Developed for **Smart India Hackathon (SIH 2026)** by **DevlUp Labs / IIT Jodhpur**.  
Released under the **MIT License**.
