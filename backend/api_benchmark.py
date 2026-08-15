"""
api_benchmark.py — Benchmarks QIO vs Classical by making HTTP calls to active FastAPI backend
"""
import urllib.request
import json
import time

API_BASE = "http://localhost:8000"

def post_json(endpoint, payload):
    req = urllib.request.Request(
        f"{API_BASE}{endpoint}",
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get_json(endpoint):
    with urllib.request.urlopen(f"{API_BASE}{endpoint}") as resp:
        return json.loads(resp.read().decode('utf-8'))

def main():
    test_cases = [
        (10, 2), (10, 5),
        (20, 2), (20, 5), (20, 10),
        (40, 5), (40, 10), (40, 15),
        (60, 5), (60, 10), (60, 15), (60, 20),
        (80, 5), (80, 10), (80, 15), (80, 20),
        (100, 10), (100, 15), (100, 20),
        (120, 15), (120, 20),
        (150, 20)
    ]

    results = []
    print("=" * 80)
    print("QUANTAFLEET ENDPOINT BENCHMARKING GRID")
    print("=" * 80)

    for num_nodes, num_vehicles in test_cases:
        # 1. Generate scenario
        gen_res = post_json("/api/scenario/generate", {"num_nodes": num_nodes, "num_vehicles": num_vehicles})
        
        # 2. Classical solver
        c_res = post_json("/api/optimize/classical", {})
        c_dist = c_res["total_distance"]
        c_time = c_res["time_ms"]

        # 3. Quantum solver
        q_res = post_json("/api/optimize/quantum", {"num_reads": 300})
        q_dist = q_res["total_distance"]
        q_time = q_res["time_ms"]
        qubo_vars = q_res.get("qubo_size", 0)

        # 4. Metrics
        diff_km = c_dist - q_dist
        pct_imp = (diff_km / c_dist * 100.0) if c_dist > 0 else 0.0
        fuel_saved_inr = diff_km * 8.0

        entry = {
            "nodes": num_nodes,
            "vehicles": num_vehicles,
            "qubo_vars": qubo_vars,
            "classical_dist_km": c_dist,
            "classical_time_ms": c_time,
            "qio_dist_km": q_dist,
            "qio_time_ms": q_time,
            "diff_km": round(diff_km, 2),
            "pct_improvement": round(pct_imp, 2),
            "fuel_saved_inr": round(fuel_saved_inr, 2)
        }
        results.append(entry)

        status_icon = "🟢" if pct_imp > 0 else ("🟡" if pct_imp == 0 else "🔴")
        print(f"Nodes: {num_nodes:3d} | Vehicles: {num_vehicles:2d} | QUBO Vars: {qubo_vars:5d} | "
              f"Classical: {c_dist:7.2f}km ({c_time:4d}ms) | QIO: {q_dist:7.2f}km ({q_time:4d}ms) | "
              f"Diff: {diff_km:+6.2f}km ({pct_imp:+5.1f}%) {status_icon}")

    with open("/home/visesh-chauhan/Documents/SIH/backend/api_benchmark_results.json", "w") as f:
        json.dump(results, f, indent=2)

    print("=" * 80)
    print("BENCHMARK COMPLETED SUCCESSFULLY.")
    print("=" * 80)

if __name__ == "__main__":
    main()
