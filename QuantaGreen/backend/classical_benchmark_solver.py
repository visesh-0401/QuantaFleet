"""
classical_benchmark_solver.py
-----------------------------
Classical baseline optimization algorithms for SIH26138 benchmarking.
Implements:
1. Classical Greedy Heuristic (standard industry dispatch baseline)
2. Multi-Objective Genetic Algorithm (NSGA-II style classical metaheuristic)
3. Head-to-Head Comparative Benchmark harness against the Quantum-Inspired Optimizer.
"""

import time
import random
import copy
from typing import Dict, Any, List
from fleet_data import MARITIME_ROUTES, VESSEL_TYPES, ACTIVE_FLEET, PORTS
from fuel_prediction_engine import predict_voyage_fuel
from quantum_green_optimizer import QuantumGreenOptimizer

class ClassicalGreedySolver:
    """
    Standard legacy dispatch algorithm:
    Assigns first available vessel with adequate capacity.
    Runs at default design speed using traditional MGO fuel (no slow steaming, no alternative fuels).
    """
    def __init__(self, routes=None, fleet=None, carbon_tax_usd=75.0, sea_state=3):
        self.routes = routes or MARITIME_ROUTES
        self.fleet = fleet or ACTIVE_FLEET
        self.carbon_tax_usd = carbon_tax_usd
        self.sea_state = sea_state

    def solve(self) -> Dict[str, Any]:
        start_time = time.time()
        deployments = []
        total_fuel = 0.0
        total_cost = 0.0
        total_co2e = 0.0
        
        available_vessels = list(self.fleet)
        
        for route in self.routes:
            # Find first compatible vessel
            assigned_v = None
            for v in available_vessels:
                v_model = VESSEL_TYPES[v["model"]]
                if v_model["capacity_teu"] >= route["cargo_demand_teu"]:
                    assigned_v = v
                    break
            if not assigned_v and available_vessels:
                assigned_v = available_vessels[0]
            if assigned_v:
                available_vessels.remove(assigned_v)
            else:
                assigned_v = self.fleet[0]
                
            v_model = VESSEL_TYPES[assigned_v["model"]]
            # Default speed: design speed
            speed = v_model["design_speed_knots"]
            fuel_type = "MGO" # Conventional fuel
            
            eval_res = predict_voyage_fuel(
                vessel_model_key=assigned_v["model"],
                distance_nm=route["distance_nm"],
                speed_knots=speed,
                cargo_load_teu=route["cargo_demand_teu"],
                fuel_type=fuel_type,
                sea_state_beaufort=self.sea_state,
                use_shore_power=False, # Conventional at-berth auxiliary burn
                carbon_tax_usd_per_tonne=self.carbon_tax_usd
            )
            
            total_fuel += eval_res["total_fuel_tonnes"]
            total_cost += eval_res["total_cost_usd"]
            total_co2e += eval_res["co2e_wtw_tonnes"]
            
            deployments.append({
                "vessel_id": assigned_v["vessel_id"],
                "vessel_name": assigned_v["name"],
                "vessel_model": assigned_v["model"],
                "route_id": route["id"],
                "origin": route["origin"],
                "destination": route["destination"],
                "distance_nm": route["distance_nm"],
                "cargo_demand_teu": route["cargo_demand_teu"],
                "speed_knots": speed,
                "fuel_type": fuel_type,
                "use_shore_power": False,
                **eval_res
            })
            
        runtime_ms = round((time.time() - start_time) * 1000, 1)
        cii_scores = [d["attained_cii"] for d in deployments if d.get("attained_cii")]
        avg_cii = round(sum(cii_scores) / len(cii_scores), 2) if cii_scores else 0.0
        
        return {
            "solver": "Classical Greedy Dispatcher (Baseline)",
            "status": "Feasible Solution Found",
            "runtime_ms": runtime_ms,
            "total_fuel_tonnes": round(total_fuel, 2),
            "total_cost_usd": round(total_cost, 2),
            "total_co2e_tonnes": round(total_co2e, 2),
            "average_fleet_cii": avg_cii,
            "deployments": deployments
        }

class ClassicalGeneticAlgorithmSolver:
    """
    Classical Multi-Objective Genetic Algorithm (GA) metaheuristic without quantum tunneling.
    Uses uniform crossover, point mutation, and tournament selection.
    """
    def __init__(self, routes=None, fleet=None, carbon_tax_usd=75.0, sea_state=3, generations=120, pop_size=30):
        self.routes = routes or MARITIME_ROUTES
        self.fleet = fleet or ACTIVE_FLEET
        self.carbon_tax_usd = carbon_tax_usd
        self.sea_state = sea_state
        self.generations = generations
        self.pop_size = pop_size
        self.speed_options = [0.75, 0.85, 0.98]
        
    def _create_chromosome(self):
        chromosome = []
        for route in self.routes:
            vessel = random.choice(self.fleet)
            v_model = VESSEL_TYPES[vessel["model"]]
            fuel = random.choice(v_model.get("compatible_fuels", ["MGO"]))
            speed = round(v_model["design_speed_knots"] * random.choice(self.speed_options), 1)
            use_shore = random.choice([True, False]) and v_model.get("has_shore_power_cable", False)
            chromosome.append({
                "vessel_id": vessel["vessel_id"],
                "vessel_model": vessel["model"],
                "fuel_type": fuel,
                "speed_knots": speed,
                "use_shore_power": use_shore
            })
        return chromosome

    def _fitness(self, chromosome):
        total_fuel = 0.0
        total_cost = 0.0
        total_co2e = 0.0
        penalty = 0.0
        used = set()
        
        for gene, route in zip(chromosome, self.routes):
            if gene["vessel_id"] in used:
                penalty += 15000.0
            used.add(gene["vessel_id"])
            
            v_model = VESSEL_TYPES[gene["vessel_model"]]
            if v_model["capacity_teu"] < route["cargo_demand_teu"]:
                penalty += 500.0 * (route["cargo_demand_teu"] - v_model["capacity_teu"])
                
            eval_res = predict_voyage_fuel(
                vessel_model_key=gene["vessel_model"],
                distance_nm=route["distance_nm"],
                speed_knots=gene["speed_knots"],
                cargo_load_teu=route["cargo_demand_teu"],
                fuel_type=gene["fuel_type"],
                sea_state_beaufort=self.sea_state,
                use_shore_power=gene["use_shore_power"],
                carbon_tax_usd_per_tonne=self.carbon_tax_usd
            )
            
            if eval_res["transit_time_hrs"] > route["max_transit_time_hrs"]:
                delay = eval_res["transit_time_hrs"] - route["max_transit_time_hrs"]
                penalty += 800.0 * (delay ** 1.8)
                
            total_fuel += eval_res["total_fuel_tonnes"]
            total_cost += eval_res["total_cost_usd"]
            total_co2e += eval_res["co2e_wtw_tonnes"]
            
        cost_val = total_cost + total_fuel * 700.0 + total_co2e * 120.0 + penalty
        return cost_val, total_fuel, total_cost, total_co2e

    def solve(self) -> Dict[str, Any]:
        start_time = time.time()
        population = [self._create_chromosome() for _ in range(self.pop_size)]
        
        best_chrom = None
        best_cost = float('inf')
        best_fuel = 0.0
        best_co2e = 0.0
        convergence_history = []
        
        for gen in range(self.generations):
            scores = []
            for chrom in population:
                cost, f, c, co2 = self._fitness(chrom)
                scores.append((cost, chrom, f, c, co2))
                if cost < best_cost:
                    best_cost = cost
                    best_chrom = chrom
                    best_fuel = f
                    best_co2e = co2
                    
            scores.sort(key=lambda x: x[0])
            if gen % 10 == 0 or gen == self.generations - 1:
                convergence_history.append(round(best_cost, 1))
                
            # Selection (Elitism top 20%)
            survivors = [s[1] for s in scores[:max(2, int(self.pop_size * 0.2))]]
            next_gen = copy.deepcopy(survivors)
            
            # Crossover & Mutation
            while len(next_gen) < self.pop_size:
                p1 = random.choice(survivors)
                p2 = random.choice(survivors)
                # Uniform crossover
                child = []
                for g1, g2 in zip(p1, p2):
                    child.append(dict(random.choice([g1, g2])))
                # Mutation
                if random.random() < 0.25:
                    idx = random.randint(0, len(child) - 1)
                    rand_v = random.choice(self.fleet)
                    rand_vm = VESSEL_TYPES[rand_v["model"]]
                    child[idx]["vessel_id"] = rand_v["vessel_id"]
                    child[idx]["vessel_model"] = rand_v["model"]
                    child[idx]["fuel_type"] = random.choice(rand_vm.get("compatible_fuels", ["MGO"]))
                    child[idx]["speed_knots"] = round(rand_vm["design_speed_knots"] * random.choice(self.speed_options), 1)
                next_gen.append(child)
            population = next_gen
            
        runtime_ms = round((time.time() - start_time) * 1000, 1)
        
        # Build deployments list for best solution
        deployments = []
        for gene, route in zip(best_chrom, self.routes):
            v_info = next((v for v in self.fleet if v["vessel_id"] == gene["vessel_id"]), self.fleet[0])
            eval_res = predict_voyage_fuel(
                vessel_model_key=gene["vessel_model"],
                distance_nm=route["distance_nm"],
                speed_knots=gene["speed_knots"],
                cargo_load_teu=route["cargo_demand_teu"],
                fuel_type=gene["fuel_type"],
                sea_state_beaufort=self.sea_state,
                use_shore_power=gene["use_shore_power"],
                carbon_tax_usd_per_tonne=self.carbon_tax_usd
            )
            deployments.append({
                "vessel_id": gene["vessel_id"],
                "vessel_name": v_info["name"],
                "vessel_model": gene["vessel_model"],
                "route_id": route["id"],
                "origin": route["origin"],
                "destination": route["destination"],
                "distance_nm": route["distance_nm"],
                "cargo_demand_teu": route["cargo_demand_teu"],
                "speed_knots": gene["speed_knots"],
                "fuel_type": gene["fuel_type"],
                "use_shore_power": gene["use_shore_power"],
                **eval_res
            })
            
        cii_scores = [d["attained_cii"] for d in deployments if d.get("attained_cii")]
        avg_cii = round(sum(cii_scores) / len(cii_scores), 2) if cii_scores else 0.0
        
        return {
            "solver": "Classical Genetic Algorithm (NSGA-II Inspired)",
            "status": "Near-Optimal Solution Found",
            "runtime_ms": runtime_ms,
            "generations": self.generations,
            "total_fuel_tonnes": round(sum(d["total_fuel_tonnes"] for d in deployments), 2),
            "total_cost_usd": round(sum(d["total_cost_usd"] for d in deployments), 2),
            "total_co2e_tonnes": round(sum(d["co2e_wtw_tonnes"] for d in deployments), 2),
            "average_fleet_cii": avg_cii,
            "convergence_history": convergence_history,
            "deployments": deployments
        }

def run_comprehensive_benchmark(carbon_tax_usd: float = 75.0, sea_state: int = 3) -> Dict[str, Any]:
    """
    Executes a head-to-head benchmark:
    1. Classical Greedy Baseline
    2. Classical Genetic Algorithm
    3. Quantum-Inspired Optimizer (QIO)
    Computes exact percentage savings, emissions abatement, and efficiency gains.
    """
    greedy_solver = ClassicalGreedySolver(carbon_tax_usd=carbon_tax_usd, sea_state=sea_state)
    greedy_res = greedy_solver.solve()
    
    ga_solver = ClassicalGeneticAlgorithmSolver(carbon_tax_usd=carbon_tax_usd, sea_state=sea_state, generations=100, pop_size=25)
    ga_res = ga_solver.solve()
    
    qio_solver = QuantumGreenOptimizer(carbon_tax_usd=carbon_tax_usd, sea_state_severity=sea_state, num_iterations=280)
    qio_res = qio_solver.optimize()
    
    # Delta comparisons against classical greedy baseline
    base_fuel = greedy_res["total_fuel_tonnes"]
    base_cost = greedy_res["total_cost_usd"]
    base_co2e = greedy_res["total_co2e_tonnes"]
    
    fuel_saved_tonnes = round(base_fuel - qio_res["total_fuel_tonnes"], 2)
    fuel_saved_pct = round((fuel_saved_tonnes / base_fuel * 100) if base_fuel > 0 else 0, 1)
    
    cost_saved_usd = round(base_cost - qio_res["total_cost_usd"], 2)
    cost_saved_pct = round((cost_saved_usd / base_cost * 100) if base_cost > 0 else 0, 1)
    
    co2_saved_tonnes = round(base_co2e - qio_res["total_co2e_tonnes"], 2)
    co2_saved_pct = round((co2_saved_tonnes / base_co2e * 100) if base_co2e > 0 else 0, 1)
    
    speedup_vs_ga = round(ga_res["runtime_ms"] / max(1.0, qio_res["runtime_ms"]), 2)
    
    return {
        "benchmark_summary": {
            "fuel_saved_tonnes": fuel_saved_tonnes,
            "fuel_saved_pct": fuel_saved_pct,
            "cost_saved_usd": cost_saved_usd,
            "cost_saved_pct": cost_saved_pct,
            "co2_saved_tonnes": co2_saved_tonnes,
            "co2_saved_pct": co2_saved_pct,
            "quantum_tunneling_events": qio_res.get("tunneling_events", 0),
            "speedup_factor_vs_ga": speedup_vs_ga,
            "trees_offset_equivalent": round(co2_saved_tonnes * 45.8, 0)
        },
        "greedy_baseline": greedy_res,
        "genetic_algorithm": ga_res,
        "quantum_optimizer": qio_res
    }
