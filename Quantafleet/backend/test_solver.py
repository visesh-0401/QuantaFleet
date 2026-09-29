"""Quick smoke-test for the QUBO solver. Run with venv python."""
import traceback, sys

try:
    from qubo_solver import solve_vrp_qubo

    nodes = [
        {'id':0,'label':'Depot','lat':19.076,'lon':72.877,'demand':0,'is_depot':True},
        {'id':1,'label':'Andheri','lat':19.11,'lon':72.87,'demand':10,'is_depot':False},
        {'id':2,'label':'Bandra','lat':19.06,'lon':72.83,'demand':8,'is_depot':False},
        {'id':3,'label':'Thane','lat':19.22,'lon':72.98,'demand':12,'is_depot':False},
    ]

    r = solve_vrp_qubo(nodes, depot_idx=0, num_vehicles=2,
                       vehicle_capacity=30, num_reads=50)
    print("✅ QUBO solver OK")
    print(f"   Total distance : {r['total_distance']} km")
    print(f"   QUBO variables : {r['qubo_size']}")
    print(f"   Solve time     : {r['time_ms']} ms")
    print(f"   Routes         : {r['routes']}")

except Exception:
    print("❌ QUBO solver FAILED:")
    traceback.print_exc()
    sys.exit(1)
