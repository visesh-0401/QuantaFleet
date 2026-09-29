"""
classical_solver.py
-------------------
Greedy Nearest-Neighbour heuristic for CVRP.
Used as the classical baseline for comparison with the QIO solver.
"""

import numpy as np
import time
from typing import List, Dict
from qubo_solver import haversine, assign_nodes_to_vehicles


def solve_vrp_greedy(
    nodes: List[Dict],
    depot_idx: int,
    num_vehicles: int,
    vehicle_capacity: float,
) -> Dict:
    """
    Nearest-Neighbour greedy heuristic for VRP.
    For each vehicle's assigned node group, build a route by always
    visiting the closest unvisited node next.
    """
    start_t = time.time()
    n_nodes = len(nodes)

    dist_matrix = np.zeros((n_nodes, n_nodes))
    for i in range(n_nodes):
        for j in range(n_nodes):
            if i != j:
                dist_matrix[i][j] = haversine(
                    nodes[i]["lat"], nodes[i]["lon"],
                    nodes[j]["lat"], nodes[j]["lon"],
                )

    vehicle_node_groups, vehicle_loads = assign_nodes_to_vehicles(
        nodes, depot_idx, num_vehicles, vehicle_capacity
    )

    all_routes = []
    total_distance = 0.0

    for group in vehicle_node_groups:
        if not group:
            all_routes.append([depot_idx, depot_idx])
            continue

        unvisited = set(group)
        route = [depot_idx]
        current = depot_idx

        while unvisited:
            nearest = min(unvisited, key=lambda x: dist_matrix[current][x])
            route.append(nearest)
            unvisited.remove(nearest)
            current = nearest

        route.append(depot_idx)
        all_routes.append(route)
        total_distance += sum(
            dist_matrix[route[i]][route[i + 1]] for i in range(len(route) - 1)
        )

    elapsed_ms = int((time.time() - start_t) * 1000)

    return {
        "routes": all_routes,
        "vehicle_loads": vehicle_loads,
        "total_distance": round(total_distance, 2),
        "time_ms": elapsed_ms,
        "num_vehicles": num_vehicles,
    }
