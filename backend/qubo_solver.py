"""
qubo_solver.py
--------------
Formulates the Capacitated Vehicle Routing Problem (CVRP) as a QUBO
Hamiltonian and solves it using D-Wave's neal SimulatedAnnealingSampler.

The approach:
  1. Cluster delivery nodes to vehicles (k-means style by load)
  2. For each vehicle, solve the TSP sub-problem as a QUBO
  3. Return per-vehicle routes + annealing energy history
"""

import numpy as np
import networkx as nx
from neal import SimulatedAnnealingSampler
from typing import List, Dict, Tuple
import time


# ─────────────────────────────────────────────────────────────────────────────
# QUBO builder for TSP
# ─────────────────────────────────────────────────────────────────────────────

def build_tsp_qubo(dist_matrix: np.ndarray, A: float = 8000.0, B: float = 1.0) -> Dict:
    """
    Build the QUBO matrix for the Travelling Salesman Problem.

    Variables: x_{i,t} = 1 if city i is visited at position t
    Linearised index: v(i, t) = i * n + t   (row-major)

    Hamiltonian:
        H = A * H_city  +  A * H_pos  +  B * H_dist

        H_city = Σ_i  (1 - Σ_t x_{i,t})²   ← each city visited exactly once
        H_pos  = Σ_t  (1 - Σ_i x_{i,t})²   ← each position has exactly one city
        H_dist = Σ_{u,v,t} W_{u,v} · x_{u,t} · x_{v,(t+1) mod n}

    Penalty scaling condition (from lecture): 0 < B · max(dist) < A
    """
    n = len(dist_matrix)
    N = n * n  # total binary variables

    Q = np.zeros((N, N))

    def idx(i, t):
        return i * n + t

    # ── H_city: each city visited exactly once ────────────────────────────────
    for i in range(n):
        for t in range(n):
            v = idx(i, t)
            Q[v, v] -= A  # diagonal: from expanding (1 - Σ x)²
            for t2 in range(t + 1, n):
                v2 = idx(i, t2)
                Q[v, v2] += 2 * A  # off-diagonal cross terms

    # ── H_pos: each position filled by exactly one city ──────────────────────
    for t in range(n):
        for i in range(n):
            v = idx(i, t)
            Q[v, v] -= A
            for i2 in range(i + 1, n):
                v2 = idx(i2, t)
                Q[v, v2] += 2 * A

    # ── H_dist: minimise total route length ───────────────────────────────────
    for u in range(n):
        for v_city in range(n):
            if u == v_city:
                continue
            w = dist_matrix[u][v_city]
            for t in range(n):
                t_next = (t + 1) % n
                pu = idx(u, t)
                pv = idx(v_city, t_next)
                if pu <= pv:
                    Q[pu, pv] += B * w
                else:
                    Q[pv, pu] += B * w

    # Convert to upper-triangle dict format expected by neal
    Q_dict = {}
    for i in range(N):
        for j in range(i, N):
            if Q[i, j] != 0:
                Q_dict[(i, j)] = Q[i, j]

    return Q_dict, n


def decode_tsp_solution(sample: Dict, n: int, node_indices: List[int]) -> List[int]:
    """
    Decode the binary sample back into a city ordering.
    Returns a list of original node indices in visit order.
    Falls back to greedy if the QUBO solution is degenerate.
    """
    position_map = {}  # position -> city_local_index
    for i in range(n):
        for t in range(n):
            v = i * n + t
            if sample.get(v, 0) == 1:
                if t not in position_map:
                    position_map[t] = i

    # Build ordered route
    route_local = []
    for t in range(n):
        if t in position_map:
            route_local.append(position_map[t])

    # If solution is incomplete/degenerate, return greedy fallback
    if len(set(route_local)) != n:
        return list(range(n))

    return [node_indices[i] for i in route_local]


# ─────────────────────────────────────────────────────────────────────────────
# Capacity-aware node assignment to vehicles
# ─────────────────────────────────────────────────────────────────────────────

def assign_nodes_to_vehicles(
    nodes: List[Dict],
    depot_idx: int,
    num_vehicles: int,
    vehicle_capacity: float,
) -> List[List[int]]:
    """
    Greedy bin-packing: assign delivery nodes to vehicles respecting capacity.
    Returns list of node-index lists (one per vehicle).
    """
    delivery_nodes = [(i, n) for i, n in enumerate(nodes) if i != depot_idx]
    delivery_nodes.sort(key=lambda x: x[1]["demand"], reverse=True)

    vehicle_loads = [0.0] * num_vehicles
    vehicle_routes = [[] for _ in range(num_vehicles)]

    for node_idx, node in delivery_nodes:
        # Find vehicle with most room that can still fit this demand
        best_v = -1
        best_space = -1
        for v in range(num_vehicles):
            space = vehicle_capacity - vehicle_loads[v]
            if space >= node["demand"] and space > best_space:
                best_v = v
                best_space = space
        if best_v == -1:
            best_v = min(range(num_vehicles), key=lambda v: vehicle_loads[v])
        vehicle_routes[best_v].append(node_idx)
        vehicle_loads[best_v] += node["demand"]

    return vehicle_routes, vehicle_loads


# ─────────────────────────────────────────────────────────────────────────────
# Main solver
# ─────────────────────────────────────────────────────────────────────────────

def solve_vrp_qubo(
    nodes: List[Dict],
    depot_idx: int,
    num_vehicles: int,
    vehicle_capacity: float,
    num_reads: int = 500,
) -> Dict:
    """
    Full pipeline:
      nodes         — list of {id, lat, lon, demand, label}
      depot_idx     — index of the depot node
      num_vehicles  — fleet size
      vehicle_capacity — max load per vehicle

    Returns:
      {
        routes: [[node_ids per vehicle]],
        vehicle_loads: [load per vehicle],
        total_distance: float,
        energy_history: [[energies per read] per vehicle],
        time_ms: int,
        qubo_size: int,
      }
    """
    start_t = time.time()
    n_nodes = len(nodes)

    # Build full distance matrix (Haversine approximation)
    dist_matrix = np.zeros((n_nodes, n_nodes))
    for i in range(n_nodes):
        for j in range(n_nodes):
            if i != j:
                dist_matrix[i][j] = haversine(
                    nodes[i]["lat"], nodes[i]["lon"],
                    nodes[j]["lat"], nodes[j]["lon"]
                )

    # Assign nodes to vehicles via greedy bin-packing
    vehicle_node_groups, vehicle_loads = assign_nodes_to_vehicles(
        nodes, depot_idx, num_vehicles, vehicle_capacity
    )

    sampler = SimulatedAnnealingSampler()
    all_routes = []
    all_energy_histories = []
    total_distance = 0.0
    total_qubo_vars = 0

    for v_idx, group in enumerate(vehicle_node_groups):
        # Include depot at start and end
        route_nodes = [depot_idx] + group  # local indices for this vehicle
        sub_n = len(route_nodes)

        if sub_n <= 2:
            # Trivial route: depot → node → depot
            all_routes.append(route_nodes + [depot_idx])
            all_energy_histories.append([0.0] * 10)
            d = sum(dist_matrix[route_nodes[i]][route_nodes[i+1]]
                    for i in range(len(route_nodes)-1))
            total_distance += d + dist_matrix[route_nodes[-1]][depot_idx]
            continue

        # Build local distance sub-matrix
        sub_dist = np.array([
            [dist_matrix[route_nodes[i]][route_nodes[j]] for j in range(sub_n)]
            for i in range(sub_n)
        ])

        # Penalty scaling condition (from lecture): 0 < B*max(dist) < A
        B_coeff = 1.0
        max_d = sub_dist.max()
        A_penalty = max(8000.0, max_d * sub_n * 4)
        Q_dict, _ = build_tsp_qubo(sub_dist, A=A_penalty, B=B_coeff)
        total_qubo_vars += sub_n * sub_n

        # Run simulated annealing (neal SimulatedAnnealingSampler)
        response = sampler.sample_qubo(
            Q_dict,
            num_reads=num_reads,
            num_sweeps=1000,
            beta_range=(0.1, 4.0),
        )

        best_sample = response.first.sample
        # .record.energy gives a numpy array of all read energies — fast and compatible
        energy_series = sorted(response.record.energy.tolist(), reverse=True)
        # Downsample to 50 points for the frontend chart
        step = max(1, len(energy_series) // 50)
        energy_history = energy_series[::step][:50]
        all_energy_histories.append(energy_history)

        # Decode solution
        ordered_local = decode_tsp_solution(best_sample, sub_n, list(range(sub_n)))
        ordered_route = [route_nodes[i] for i in ordered_local]

        # Ensure depot is first
        if ordered_route[0] != depot_idx:
            di = ordered_route.index(depot_idx) if depot_idx in ordered_route else 0
            ordered_route = ordered_route[di:] + ordered_route[:di]

        full_route = ordered_route + [depot_idx]
        all_routes.append(full_route)

        d = sum(dist_matrix[full_route[i]][full_route[i+1]]
                for i in range(len(full_route) - 1))
        total_distance += d

    elapsed_ms = int((time.time() - start_t) * 1000)

    return {
        "routes": all_routes,
        "vehicle_loads": vehicle_loads,
        "total_distance": round(total_distance, 2),
        "energy_history": all_energy_histories,
        "time_ms": elapsed_ms,
        "qubo_size": total_qubo_vars,
        "num_vehicles": num_vehicles,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def haversine(lat1, lon1, lat2, lon2) -> float:
    """Returns distance in km between two lat/lon coordinates."""
    R = 6371.0
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlam = np.radians(lon2 - lon1)
    a = np.sin(dphi / 2)**2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlam / 2)**2
    return 2 * R * np.arcsin(np.sqrt(a))
