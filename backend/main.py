"""
main.py — FastAPI backend for QuantaFleet
"""

import asyncio
import json
import math
import os
from typing import List, Optional
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from qubo_solver import solve_vrp_qubo, haversine
from classical_solver import solve_vrp_greedy
from fleet_simulator import simulator, VEHICLE_COLORS, VEHICLE_NAMES

import osmnx as ox
import networkx as nx

ox.settings.use_cache = True
print("Downloading/Loading OSMNX graph for Mumbai...")
try:
    # Load 12x12 km box in central Mumbai
    G_road_network = ox.graph_from_point((18.98, 72.84), dist=6000, network_type='drive')
    largest_cc = max(nx.strongly_connected_components(G_road_network), key=len)
    G_road_network = G_road_network.subgraph(largest_cc).copy()
    G_nodes_list = list(G_road_network.nodes(data=True))
    print(f"Graph loaded successfully. Nodes: {len(G_nodes_list)}")
except Exception as e:
    print(f"Failed to load OSMNX graph: {e}")
    G_road_network = None
    G_nodes_list = []

app = FastAPI(title="QuantaFleet API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Default scenario: Mumbai metro delivery network
# ─────────────────────────────────────────────────────────────────────────────

import random

# Mumbai bounding box for random nodes
LAT_MIN, LAT_MAX = 18.90, 19.25
LON_MIN, LON_MAX = 72.80, 73.05

def generate_mumbai_nodes(num_deliveries: int) -> List[dict]:
    nodes = []
    
    if G_road_network and len(G_nodes_list) > num_deliveries + 1:
        # Sample nodes from the real graph
        sampled_nodes = random.sample(G_nodes_list, num_deliveries + 1)
        
        # Depot is the first sampled node
        depot_node_id, depot_data = sampled_nodes[0]
        nodes.append({
            "id": 0, "label": "Central Depot (Mumbai)", 
            "lat": round(depot_data['y'], 6), "lon": round(depot_data['x'], 6), 
            "demand": 0, "is_depot": True
        })
        
        # Deliveries
        for i in range(1, num_deliveries + 1):
            node_id, n_data = sampled_nodes[i]
            nodes.append({
                "id": i,
                "label": f"Delivery Point #{i}",
                "lat": round(n_data['y'], 6),
                "lon": round(n_data['x'], 6),
                "demand": random.randint(2, 15),
                "is_depot": False
            })
    else:
        # Fallback
        nodes.append({"id": 0, "label": "Central Depot (Mumbai)", "lat": 19.0760, "lon": 72.8777, "demand": 0, "is_depot": True})
        for i in range(1, num_deliveries + 1):
            nodes.append({
                "id": i,
                "label": f"Delivery Point #{i}",
                "lat": round(random.uniform(LAT_MIN, LAT_MAX), 4),
                "lon": round(random.uniform(LON_MIN, LON_MAX), 4),
                "demand": random.randint(2, 15),
                "is_depot": False
            })
    return nodes

random.seed(42)  # Fixed seed for consistent first load demo
DEFAULT_NODES = generate_mumbai_nodes(80)

DEFAULT_CONFIG = {
    "depot_idx": 0,
    "num_vehicles": 20,
    "vehicle_capacity": 45.0,
}

# In-memory state
state = {
    "nodes": DEFAULT_NODES,
    "config": DEFAULT_CONFIG,
    "qio_result": None,
    "classical_result": None,
}


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic models
# ─────────────────────────────────────────────────────────────────────────────

class NodeModel(BaseModel):
    id: int
    label: str
    lat: float
    lon: float
    demand: float
    is_depot: bool = False

class ScenarioConfig(BaseModel):
    nodes: List[NodeModel]
    depot_idx: int = 0
    num_vehicles: int = 3
    vehicle_capacity: float = 30.0

class OptimizeRequest(BaseModel):
    num_reads: int = 400

class GenerateRequest(BaseModel):
    num_nodes: int
    num_vehicles: int


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "QuantaFleet API running", "version": "1.0.0"}


@app.get("/api/scenario")
def get_scenario():
    return {
        "nodes": state["nodes"],
        "config": state["config"],
    }


@app.post("/api/scenario")
def set_scenario(cfg: ScenarioConfig):
    state["nodes"] = [n.model_dump() for n in cfg.nodes]
    state["config"] = {
        "depot_idx": cfg.depot_idx,
        "num_vehicles": cfg.num_vehicles,
        "vehicle_capacity": cfg.vehicle_capacity,
    }
    state["qio_result"] = None
    state["classical_result"] = None
    return {"status": "ok", "node_count": len(state["nodes"])}


@app.post("/api/scenario/generate")
def generate_scenario_api(req: GenerateRequest):
    # -1 because num_nodes includes the depot, and generate_mumbai_nodes takes num_deliveries
    deliveries = max(1, req.num_nodes - 1)
    nodes = generate_mumbai_nodes(deliveries)
    
    state["nodes"] = nodes
    state["config"]["num_vehicles"] = req.num_vehicles
    state["qio_result"] = None
    state["classical_result"] = None
    
    # reset simulator
    simulator.set_routes([], nodes)
    
    return {"status": "ok", "node_count": len(nodes), "vehicles": req.num_vehicles}


@app.post("/api/optimize/quantum")
def optimize_quantum(req: OptimizeRequest):
    """Run QUBO formulation + SimulatedAnnealingSampler on the current scenario."""
    nodes = state["nodes"]
    cfg = state["config"]

    result = solve_vrp_qubo(
        nodes=nodes,
        depot_idx=cfg["depot_idx"],
        num_vehicles=cfg["num_vehicles"],
        vehicle_capacity=cfg["vehicle_capacity"],
        num_reads=req.num_reads,
    )

    # Enrich with node labels and full road path for frontend
    result["route_details"] = _enrich_routes(result["routes"], nodes)
    state["qio_result"] = result

    # Update fleet simulator with the detailed route paths
    simulator.set_routes(result["route_details"], nodes)

    return result


@app.post("/api/optimize/classical")
def optimize_classical():
    """Run greedy nearest-neighbour solver on the current scenario."""
    nodes = state["nodes"]
    cfg = state["config"]

    result = solve_vrp_greedy(
        nodes=nodes,
        depot_idx=cfg["depot_idx"],
        num_vehicles=cfg["num_vehicles"],
        vehicle_capacity=cfg["vehicle_capacity"],
    )

    result["route_details"] = _enrich_routes(result["routes"], nodes)
    state["classical_result"] = result

    # Update fleet simulator
    simulator.set_routes(result["route_details"], nodes)

    return result


@app.get("/api/metrics")
def get_metrics():
    """Return side-by-side comparison metrics for QIO vs Classical."""
    qio = state["qio_result"]
    classical = state["classical_result"]

    if not qio and not classical:
        return {"status": "no_results"}

    metrics = {}

    if classical:
        metrics["classical"] = {
            "total_distance_km": classical["total_distance"],
            "time_ms": classical["time_ms"],
            "vehicle_loads": classical["vehicle_loads"],
        }

    if qio:
        metrics["qio"] = {
            "total_distance_km": qio["total_distance"],
            "time_ms": qio["time_ms"],
            "vehicle_loads": qio["vehicle_loads"],
            "qubo_variables": qio.get("qubo_size", 0),
            "energy_history": qio.get("energy_history", []),
        }

    if qio and classical:
        savings_km = classical["total_distance"] - qio["total_distance"]
        savings_pct = (savings_km / classical["total_distance"]) * 100 if classical["total_distance"] > 0 else 0
        # Rough fuel/cost estimate: ₹8 per km (diesel truck)
        fuel_saved = savings_km * 8
        metrics["comparison"] = {
            "distance_saved_km": round(savings_km, 2),
            "savings_pct": round(savings_pct, 1),
            "fuel_saved_inr": round(fuel_saved, 2),
            "qio_speedup": "Quadratic O(√2ⁿ) via amplitude amplification",
        }

    return metrics


@app.get("/api/fleet/status")
def fleet_status():
    """Tick the simulator and return current vehicle positions."""
    positions = simulator.tick()

    # Attach colors/names if not present
    for i, p in enumerate(positions):
        p["color"] = VEHICLE_COLORS[i % len(VEHICLE_COLORS)]
        p["name"] = VEHICLE_NAMES[i % len(VEHICLE_NAMES)]

    return {"vehicles": positions, "node_count": len(state["nodes"])}


@app.get("/api/fleet/routes")
def fleet_routes():
    """Return the current active routes (QIO preferred, else classical)."""
    result = state["qio_result"] or state["classical_result"]
    if not result:
        return {"routes": [], "type": "none"}

    route_type = "qio" if state["qio_result"] else "classical"
    return {
        "routes": result["route_details"],
        "type": route_type,
        "nodes": state["nodes"],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _enrich_routes(routes: List[List[int]], nodes: List[dict]) -> List[dict]:
    """Attach labels, coordinates, and exact road paths to each route."""
    enriched = []
    for v_idx, route in enumerate(routes):
        stops = []
        full_path = [] # list of {lat, lon} for the continuous road
        total_dist = 0.0
        
        for i, node_idx in enumerate(route):
            n = nodes[node_idx]
            stop = {
                "node_id": node_idx,
                "label": n["label"],
                "lat": n["lat"],
                "lon": n["lon"],
                "demand": n.get("demand", 0),
                "is_depot": n.get("is_depot", False),
            }
            stops.append(stop)

            if i == 0:
                full_path.append({"lat": n["lat"], "lon": n["lon"]})
            else:
                prev = nodes[route[i - 1]]
                
                # Calculate road path between prev and n
                if G_road_network:
                    try:
                        u = ox.distance.nearest_nodes(G_road_network, X=prev["lon"], Y=prev["lat"])
                        v = ox.distance.nearest_nodes(G_road_network, X=n["lon"], Y=n["lat"])
                        shortest_path = nx.shortest_path(G_road_network, u, v, weight='length')
                        
                        for p_node in shortest_path[1:]:
                            p_data = G_road_network.nodes[p_node]
                            full_path.append({"lat": p_data['y'], "lon": p_data['x']})
                            
                        path_length = nx.shortest_path_length(G_road_network, u, v, weight='length') / 1000.0
                        total_dist += path_length
                        continue
                    except Exception:
                        pass
                
                # Fallback straight line
                full_path.append({"lat": n["lat"], "lon": n["lon"]})
                total_dist += haversine(prev["lat"], prev["lon"], n["lat"], n["lon"])

        base_name = VEHICLE_NAMES[v_idx % len(VEHICLE_NAMES)]
        enriched.append({
            "vehicle_id": v_idx,
            "vehicle_name": f"{base_name}-{v_idx+1}",
            "color": VEHICLE_COLORS[v_idx % len(VEHICLE_COLORS)],
            "stops": stops,
            "path": full_path,
            "distance_km": round(total_dist, 2),
        })
    return enriched

# ─────────────────────────────────────────────────────────────────────────────
# Static Files & SPA Routing (Production)
# ─────────────────────────────────────────────────────────────────────────────
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Serve the file if it exists, otherwise serve index.html (SPA routing)
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
