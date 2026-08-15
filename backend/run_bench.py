"""
run_bench.py — Runs performance grid evaluation for QIO vs Classical
"""
import sys
import os
import json
import time
import random

sys.path.insert(0, os.path.dirname(__file__))

from qubo_solver import solve_vrp_qubo
from classical_solver import solve_vrp_greedy
from main import generate_mumbai_nodes

def main():
    node_configs = [10, 20, 40, 60, 80, 100, 120, 150]
    vehicle_configs = [2, 5, 10, 15, 20]
    results = []

    print("=" * 80)
    print("QUANTAFLEET LOGISTICS BENCHMARK SUITE")
    print("=" * 80)

    for num_nodes in node_configs:
        deliveries = max(1, num_nodes - 1)
        for num_vehicles in vehicle_configs:
            if num_vehicles > deliveries:
                continue

            random.seed(42 + num_nodes * 7 + num_vehicles * 13)
            nodes = generate_mumbai_nodes(deliveries)
            depot_idx = 0
            vehicle_capacity = max(30.0, (deliveries * 10.0) / num_vehicles)

            # Classical Greedy
            t0 = time.time()
            res_classical = solve_vrp_greedy(nodes, depot_idx, num_vehicles, vehicle_capacity)
            c_dist = res_classical["total_distance"]
            c_time = res_classical["time_ms"]

            # QIO
            res_qio = solve_vrp_qubo(nodes, depot_idx, num_vehicles, vehicle_capacity, num_reads=300)
            q_dist = res_qio["total_distance"]
            q_time = res_qio["time_ms"]
            qubo_vars = res_qio.get("qubo_size", 0)

            dist_diff = c_dist - q_dist
            pct_imp = (dist_diff / c_dist * 100.0) if c_dist > 0 else 0.0
            fuel_saved_inr = dist_diff * 8.0

            entry = {
                "nodes": num_nodes,
                "vehicles": num_vehicles,
                "deliveries": deliveries,
                "qubo_vars": qubo_vars,
                "classical_dist_km": c_dist,
                "classical_time_ms": c_time,
                "qio_dist_km": q_dist,
                "qio_time_ms": q_time,
                "diff_km": round(dist_diff, 2),
                "pct_improvement": round(pct_imp, 2),
                "fuel_saved_inr": round(fuel_saved_inr, 2)
            }
            results.append(entry)

            print(f"N={num_nodes:3d}, V={num_vehicles:2d} | QUBO Vars: {qubo_vars:5d} | "
                  f"Classical: {c_dist:7.2f}km ({c_time:3d}ms) | QIO: {q_dist:7.2f}km ({q_time:4d}ms) | "
                  f"Diff: {dist_diff:+6.2f}km ({pct_imp:+5.1f}%)")

    out_file = os.path.join(os.path.dirname(__file__), "benchmark_results.json")
    with open(out_file, "w") as f:
        json.dump(results, f, indent=2)

    print("=" * 80)
    print(f"DONE. Benchmark output saved to {out_file}")
    print("=" * 80)

if __name__ == "__main__":
    main()
