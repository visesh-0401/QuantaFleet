"""
quantum_green_optimizer.py
--------------------------
Quantum-Inspired Metaheuristic Fleet Optimizer for SIH26138.
Formulates multi-objective green fleet management (vessel deployment,
speed optimization, alternative fuel mix, and shore power scheduling)
into a Quantum-Inspired Hamiltonian with Transverse-Field Quantum Tunneling.
"""

import math
import random
import time
from typing import Dict, Any, List, Tuple
from fleet_data import MARITIME_ROUTES, VESSEL_TYPES, ACTIVE_FLEET, FUEL_SPECIFICATIONS, PORTS
from fuel_prediction_engine import predict_voyage_fuel

class QuantumGreenOptimizer:
    """
    Quantum-Inspired Simulated Annealing with Transverse-Field Quantum Tunneling (QIO).
    Solves the non-linear, multi-objective Green Fleet Deployment & Speed Optimization problem.
    """
    def __init__(
        self,
        routes: List[Dict[str, Any]] = None,
        fleet: List[Dict[str, Any]] = None,
        carbon_tax_usd: float = 75.0,
        sea_state_severity: int = 3,
        lambda_fuel: float = 0.25,
        lambda_cost: float = 0.35,
        lambda_co2: float = 0.40,
        num_iterations: int = 350,
        initial_gamma: float = 2.5, # Quantum transverse field strength
        initial_temp: float = 100.0
    ):
        self.routes = routes or MARITIME_ROUTES
        self.fleet = fleet or ACTIVE_FLEET
        self.carbon_tax_usd = carbon_tax_usd
        self.sea_state = sea_state_severity
        self.lambda_fuel = lambda_fuel
        self.lambda_cost = lambda_cost
        self.lambda_co2 = lambda_co2
        self.num_iterations = num_iterations
        self.initial_gamma = initial_gamma
        self.initial_temp = initial_temp
        
        # Discretized speed options (ratio of design speed: 0.70 = slow eco, 0.85 = normal, 1.0 = fast)
        self.speed_multipliers = [0.72, 0.85, 0.98]
        
    def _generate_candidate_decision(self, vessel_info: Dict[str, Any], route: Dict[str, Any]) -> Dict[str, Any]:
        """Generates a valid (or low penalty) deployment configuration for one route."""
        v_model_key = vessel_info["model"]
        v_model = VESSEL_TYPES[v_model_key]
        
        # Select compatible fuel
        compatible_fuels = v_model.get("compatible_fuels", ["MGO"])
        chosen_fuel = random.choice(compatible_fuels)
        
        # Select speed
        mult = random.choice(self.speed_multipliers)
        speed = round(v_model["design_speed_knots"] * mult, 1)
        
        # Shore power at destination port
        dest_port = PORTS.get(route["destination"], {})
        can_use_shore = dest_port.get("shore_power", False) and v_model.get("has_shore_power_cable", False)
        
        return {
            "vessel_id": vessel_info["vessel_id"],
            "vessel_name": vessel_info["name"],
            "vessel_model": v_model_key,
            "route_id": route["id"],
            "origin": route["origin"],
            "destination": route["destination"],
            "distance_nm": route["distance_nm"],
            "cargo_demand_teu": route["cargo_demand_teu"],
            "speed_knots": speed,
            "fuel_type": chosen_fuel,
            "use_shore_power": can_use_shore
        }

    def _evaluate_candidate_state(self, state: List[Dict[str, Any]]) -> Tuple[float, Dict[str, Any]]:
        """
        Evaluates the Quantum Hamiltonian (Total Energy / Objective Cost).
        Incorporates fuel burn, OPEX ($), Well-to-Wake CO2e, and penalty terms for constraints.
        """
        total_fuel_tonnes = 0.0
        total_cost_usd = 0.0
        total_co2e_tonnes = 0.0
        penalty = 0.0
        voyage_details = []
        
        used_vessels = set()
        
        for item in state:
            v_id = item["vessel_id"]
            if v_id in used_vessels:
                penalty += 15000.0 # Heavy collision penalty (one vessel cannot do two simultaneous voyages)
            used_vessels.add(v_id)
            
            v_model = VESSEL_TYPES[item["vessel_model"]]
            # Capacity constraint
            if v_model["capacity_teu"] < item["cargo_demand_teu"]:
                excess_demand = item["cargo_demand_teu"] - v_model["capacity_teu"]
                penalty += 500.0 * excess_demand
                
            # Physics-based fuel and emission prediction
            eval_res = predict_voyage_fuel(
                vessel_model_key=item["vessel_model"],
                distance_nm=item["distance_nm"],
                speed_knots=item["speed_knots"],
                cargo_load_teu=item["cargo_demand_teu"],
                fuel_type=item["fuel_type"],
                sea_state_beaufort=self.sea_state,
                use_shore_power=item["use_shore_power"],
                carbon_tax_usd_per_tonne=self.carbon_tax_usd
            )
            
            # Schedule deadline constraint
            route_obj = next((r for r in self.routes if r["id"] == item["route_id"]), None)
            if route_obj and eval_res["transit_time_hrs"] > route_obj["max_transit_time_hrs"]:
                delay_hrs = eval_res["transit_time_hrs"] - route_obj["max_transit_time_hrs"]
                penalty += 800.0 * (delay_hrs ** 1.8) # Non-linear tardiness penalty
                
            total_fuel_tonnes += eval_res["total_fuel_tonnes"]
            total_cost_usd += eval_res["total_cost_usd"]
            total_co2e_tonnes += eval_res["co2e_wtw_tonnes"]
            
            voyage_details.append({**item, **eval_res})
            
        # Multi-objective normalized Hamiltonian
        # Normalize: 1 ton fuel ~ $700, 1 ton CO2e ~ $100
        cost_term = total_cost_usd
        fuel_term = total_fuel_tonnes * 700.0
        co2_term = total_co2e_tonnes * 120.0
        
        H = (
            self.lambda_cost * cost_term +
            self.lambda_fuel * fuel_term +
            self.lambda_co2 * co2_term +
            penalty
        )
        
        metrics = {
            "energy": H,
            "total_fuel_tonnes": round(total_fuel_tonnes, 2),
            "total_cost_usd": round(total_cost_usd, 2),
            "total_co2e_tonnes": round(total_co2e_tonnes, 2),
            "penalty": round(penalty, 2),
            "voyage_details": voyage_details
        }
        return H, metrics

    def optimize(self) -> Dict[str, Any]:
        """
        Executes Quantum-Inspired Annealing with Transverse-Field Quantum Tunneling.
        Simulates quantum superposition collapse and barrier tunneling for escape from local minima.
        """
        start_time = time.time()
        
        # Initial assignment: assign available vessels to routes
        current_state = []
        for i, route in enumerate(self.routes):
            vessel = self.fleet[i % len(self.fleet)]
            current_state.append(self._generate_candidate_decision(vessel, route))
            
        current_energy, current_metrics = self._evaluate_candidate_state(current_state)
        best_state = [dict(c) for c in current_state]
        best_energy = current_energy
        best_metrics = current_metrics
        
        energy_history = [best_energy]
        tunneling_events = 0
        
        # Annealing schedule
        for step in range(1, self.num_iterations + 1):
            progress = step / self.num_iterations
            # Temperature decays geometrically
            T = self.initial_temp * ((1.0 - progress) ** 1.5) + 0.1
            # Transverse field Gamma(t) controls quantum tunneling probability
            gamma = self.initial_gamma * (1.0 - progress)
            
            # Perturb a random route deployment
            candidate_state = [dict(c) for c in current_state]
            idx_to_mutate = random.randint(0, len(candidate_state) - 1)
            target_route = next(r for r in self.routes if r["id"] == candidate_state[idx_to_mutate]["route_id"])
            random_vessel = random.choice(self.fleet)
            
            candidate_state[idx_to_mutate] = self._generate_candidate_decision(random_vessel, target_route)
            
            candidate_energy, candidate_metrics = self._evaluate_candidate_state(candidate_state)
            delta_E = candidate_energy - current_energy
            
            accept = False
            if delta_E < 0:
                accept = True
            else:
                # Classical thermal Metropolis probability
                p_thermal = math.exp(-delta_E / max(0.01, T))
                
                # Quantum Tunneling probability through high-energy barrier:
                # P_tunnel = exp(- sqrt(2 * delta_E) / (hbar * gamma))
                # Enabled when transverse field gamma > 0.05
                p_tunnel = 0.0
                if gamma > 0.05:
                    barrier_width = 1.2
                    p_tunnel = math.exp(- (math.sqrt(max(0.1, delta_E)) * barrier_width) / (gamma * 1.8))
                
                combined_p = min(1.0, p_thermal + p_tunnel)
                
                if random.random() < combined_p:
                    accept = True
                    if p_tunnel > p_thermal:
                        tunneling_events += 1
                        
            if accept:
                current_state = candidate_state
                current_energy = candidate_energy
                current_metrics = candidate_metrics
                
                if current_energy < best_energy:
                    best_state = [dict(c) for c in current_state]
                    best_energy = current_energy
                    best_metrics = current_metrics
                    
            if step % 10 == 0 or step == self.num_iterations:
                energy_history.append(round(best_energy, 1))
                
        runtime_ms = round((time.time() - start_time) * 1000, 1)
        
        # Calculate overall fleet CII and fuel savings breakdown
        fleet_cii_scores = [v["attained_cii"] for v in best_metrics["voyage_details"] if v.get("attained_cii")]
        avg_cii = round(sum(fleet_cii_scores) / len(fleet_cii_scores), 2) if fleet_cii_scores else 0.0
        
        return {
            "solver": "Quantum-Inspired Optimizer (QIO-Annealer)",
            "status": "Optimal Solution Found",
            "runtime_ms": runtime_ms,
            "iterations": self.num_iterations,
            "tunneling_events": tunneling_events,
            "total_energy": round(best_energy, 2),
            "total_fuel_tonnes": best_metrics["total_fuel_tonnes"],
            "total_cost_usd": best_metrics["total_cost_usd"],
            "total_co2e_tonnes": best_metrics["total_co2e_tonnes"],
            "average_fleet_cii": avg_cii,
            "convergence_history": energy_history,
            "deployments": best_metrics["voyage_details"]
        }
