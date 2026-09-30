"""
main.py
-------
FastAPI REST API Server for QuantaGreen (SIH26138).
Quantum-Inspired Fuel Consumption Prediction and Green Fleet Optimization Platform.
"""

import os
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from fleet_data import PORTS, MARITIME_ROUTES, VESSEL_TYPES, ACTIVE_FLEET, FUEL_SPECIFICATIONS
from fuel_prediction_engine import predict_voyage_fuel, compare_alternative_fuels_for_route
from quantum_green_optimizer import QuantumGreenOptimizer
from classical_benchmark_solver import ClassicalGreedySolver, ClassicalGeneticAlgorithmSolver, run_comprehensive_benchmark

app = FastAPI(
    title="QuantaGreen — Quantum-Inspired Green Fleet Optimization",
    description="SIH26138 Platform for Egreen Quanta & Ministry of Education Innovation Cell (MIC)",
    version="1.0.0"
)

# CORS middleware for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory simulation cache
LATEST_BENCHMARK = None

# Pydantic Request Models
class FuelPredictionRequest(BaseModel):
    vessel_model_key: str = Field(default="feeder_container_2500")
    distance_nm: float = Field(default=560.0, ge=1.0)
    speed_knots: float = Field(default=15.0, ge=5.0, le=45.0)
    cargo_load_teu: float = Field(default=850.0, ge=0.0)
    fuel_type: str = Field(default="MGO")
    sea_state_beaufort: int = Field(default=3, ge=0, le=10)
    use_shore_power: bool = Field(default=True)
    carbon_tax_usd_per_tonne: float = Field(default=75.0, ge=0.0)
    port_hours: float = Field(default=12.0, ge=0.0)

class OptimizationRequest(BaseModel):
    carbon_tax_usd: float = Field(default=75.0, ge=0.0, le=300.0)
    sea_state_severity: int = Field(default=3, ge=0, le=10)
    lambda_fuel: float = Field(default=0.30, ge=0.0, le=1.0)
    lambda_cost: float = Field(default=0.35, ge=0.0, le=1.0)
    lambda_co2: float = Field(default=0.35, ge=0.0, le=1.0)
    num_iterations: int = Field(default=280, ge=50, le=1000)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "QuantaGreen Backend",
        "sih_ps_id": "SIH26138",
        "title": "Quantum-Inspired Fuel Consumption Prediction and Green Fleet Optimization",
        "organization": "Egreen Quanta (MIC)",
        "vessels_loaded": len(ACTIVE_FLEET),
        "routes_loaded": len(MARITIME_ROUTES),
        "fuels_supported": list(FUEL_SPECIFICATIONS.keys())
    }

@app.get("/api/fleet")
def get_fleet_catalog():
    """Returns active fleet and catalog of vessel specifications."""
    return {
        "active_fleet": ACTIVE_FLEET,
        "vessel_catalog": VESSEL_TYPES
    }

@app.get("/api/routes")
def get_routes_and_ports():
    """Returns ports and maritime trade lanes."""
    return {
        "ports": PORTS,
        "routes": MARITIME_ROUTES
    }

@app.get("/api/fuels")
def get_fuel_specifications():
    """Returns alternative fuel properties, heating values, costs, and emissions factors."""
    return {
        "fuel_specs": FUEL_SPECIFICATIONS
    }

@app.post("/api/predict/fuel")
def predict_fuel(req: FuelPredictionRequest):
    """Real-time physics-based hydrodynamic fuel consumption & emission predictor."""
    result = predict_voyage_fuel(
        vessel_model_key=req.vessel_model_key,
        distance_nm=req.distance_nm,
        speed_knots=req.speed_knots,
        cargo_load_teu=req.cargo_load_teu,
        fuel_type=req.fuel_type,
        sea_state_beaufort=req.sea_state_beaufort,
        use_shore_power=req.use_shore_power,
        carbon_tax_usd_per_tonne=req.carbon_tax_usd_per_tonne,
        port_hours=req.port_hours
    )
    return result

@app.get("/api/predict/compare-fuels")
def compare_fuels(
    vessel_model_key: str = Query("feeder_container_2500"),
    distance_nm: float = Query(560.0),
    speed_knots: float = Query(15.0),
    cargo_load_teu: float = Query(850.0),
    sea_state: int = Query(3),
    carbon_tax_usd: float = Query(75.0)
):
    """Compares all compatible alternative fuels for a route side-by-side."""
    return compare_alternative_fuels_for_route(
        vessel_model_key=vessel_model_key,
        distance_nm=distance_nm,
        speed_knots=speed_knots,
        cargo_load_teu=cargo_load_teu,
        sea_state_beaufort=sea_state,
        carbon_tax_usd=carbon_tax_usd
    )

@app.post("/api/optimize/quantum")
def optimize_fleet_quantum(req: OptimizationRequest):
    """Executes Quantum-Inspired Annealing with Transverse-Field Quantum Tunneling."""
    optimizer = QuantumGreenOptimizer(
        carbon_tax_usd=req.carbon_tax_usd,
        sea_state_severity=req.sea_state_severity,
        lambda_fuel=req.lambda_fuel,
        lambda_cost=req.lambda_cost,
        lambda_co2=req.lambda_co2,
        num_iterations=req.num_iterations
    )
    return optimizer.optimize()

@app.post("/api/optimize/classical")
def optimize_fleet_classical(carbon_tax_usd: float = Query(75.0), sea_state: int = Query(3)):
    """Runs classical greedy baseline dispatch."""
    solver = ClassicalGreedySolver(carbon_tax_usd=carbon_tax_usd, sea_state=sea_state)
    return solver.solve()

@app.post("/api/optimize/genetic")
def optimize_fleet_genetic(carbon_tax_usd: float = Query(75.0), sea_state: int = Query(3)):
    """Runs Classical Genetic Algorithm (NSGA-II inspired)."""
    solver = ClassicalGeneticAlgorithmSolver(carbon_tax_usd=carbon_tax_usd, sea_state=sea_state)
    return solver.solve()

@app.get("/api/benchmark/full")
def run_benchmark(carbon_tax_usd: float = Query(75.0), sea_state: int = Query(3)):
    """Runs comprehensive 3-way comparative benchmark (Greedy vs GA vs Quantum)."""
    global LATEST_BENCHMARK
    LATEST_BENCHMARK = run_comprehensive_benchmark(carbon_tax_usd=carbon_tax_usd, sea_state=sea_state)
    return LATEST_BENCHMARK

@app.get("/api/compliance/cii")
def get_cii_fleet_overview():
    """Generates an IMO Carbon Intensity Indicator (CII) compliance summary."""
    assessments = []
    for v in ACTIVE_FLEET:
        v_model = VESSEL_TYPES[v["model"]]
        route = next((r for r in MARITIME_ROUTES if r["id"] == v["assigned_route"]), MARITIME_ROUTES[0])
        eval_res = predict_voyage_fuel(
            vessel_model_key=v["model"],
            distance_nm=route["distance_nm"],
            speed_knots=v["speed_knots"],
            cargo_load_teu=route["cargo_demand_teu"],
            fuel_type=v["fuel_type"],
            sea_state_beaufort=3,
            use_shore_power=True
        )
        assessments.append({
            "vessel_id": v["vessel_id"],
            "vessel_name": v["name"],
            "vessel_type": v_model["type"],
            "fuel_type": v["fuel_type"],
            "attained_cii": eval_res["attained_cii"],
            "cii_rating": eval_res["cii_rating"],
            "co2e_wtw_tonnes": eval_res["co2e_wtw_tonnes"]
        })
        
    grade_distribution = {"A": 0, "B": 0, "C": 0, "D": 0, "E": 0}
    for a in assessments:
        grade = a["cii_rating"]
        grade_distribution[grade] = grade_distribution.get(grade, 0) + 1
        
    return {
        "regulatory_standard": "IMO MARPOL Annex VI MEPC.337(76)",
        "grade_distribution": grade_distribution,
        "fleet_assessments": assessments
    }

# Serve React static build in production
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

