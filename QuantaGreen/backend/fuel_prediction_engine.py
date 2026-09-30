"""
fuel_prediction_engine.py
-------------------------
Physics-informed, data-driven fuel consumption and emissions prediction engine.
Implements hydrodynamic Admiralty resistance equations, speed-power cubic laws,
SFOC (Specific Fuel Oil Consumption) non-linear load curves, alternative fuel
lifecycle factors (WtW / TtW), and IMO Carbon Intensity Indicator (CII) scoring.
"""

import math
from typing import Dict, Any, Optional
from fleet_data import VESSEL_TYPES, FUEL_SPECIFICATIONS

def get_weather_resistance_factor(beaufort_scale: int = 3) -> float:
    """
    Computes added resistance factor due to wave height, wind, and swell.
    Based on empirical maritime naval architecture curve.
    Beaufort 0 = calm sea (1.0x), Beaufort 6 = strong breeze (1.28x), Beaufort 8 = gale (1.65x).
    """
    b = max(0, min(10, beaufort_scale))
    # Non-linear added resistance polynomial
    return 1.0 + 0.035 * b + 0.0055 * (b ** 2)

def calculate_engine_sfoc(engine_load_ratio: float, fuel_type: str = "MGO") -> float:
    """
    Computes Specific Fuel Consumption (g/kWh) based on engine load curve.
    Engines are most efficient near 75-85% Maximum Continuous Rating (MCR).
    Thermal efficiency drops at low load (<40%) and near full throttle (>95%).
    """
    load = max(0.15, min(1.05, engine_load_ratio))
    
    # Base MGO curve (U-shaped around 0.80 load)
    # At 80% load: ~172 g/kWh. At 30% load: ~205 g/kWh. At 100% load: ~182 g/kWh.
    base_sfoc_mgo = 172.0 + 110.0 * ((load - 0.78) ** 2)
    
    # Adjust for Lower Heating Value (LHV) of alternative fuels
    lhv_mgo = FUEL_SPECIFICATIONS["MGO"]["lhv_mj_per_kg"]
    fuel_spec = FUEL_SPECIFICATIONS.get(fuel_type, FUEL_SPECIFICATIONS["MGO"])
    lhv_target = fuel_spec.get("lhv_mj_per_kg", lhv_mgo)
    
    # Energy equivalent mass factor
    energy_factor = lhv_mgo / lhv_target
    return base_sfoc_mgo * energy_factor

def predict_voyage_fuel(
    vessel_model_key: str,
    distance_nm: float,
    speed_knots: float,
    cargo_load_teu: float,
    fuel_type: str = "MGO",
    sea_state_beaufort: int = 3,
    use_shore_power: bool = True,
    carbon_tax_usd_per_tonne: float = 75.0,
    port_hours: float = 12.0
) -> Dict[str, Any]:
    """
    Calculates detailed hydrodynamic power, voyage fuel consumption,
    Well-to-Wake (WtW) and Tank-to-Wake (TtW) GHG emissions, total cost, and IMO CII.
    """
    vessel = VESSEL_TYPES.get(vessel_model_key, VESSEL_TYPES["feeder_container_2500"])
    fuel_spec = FUEL_SPECIFICATIONS.get(fuel_type, FUEL_SPECIFICATIONS["MGO"])
    
    # Speed bounds check
    speed = max(vessel["min_speed_knots"], min(vessel["max_speed_knots"], speed_knots))
    
    # Transit time (hours)
    transit_time_hrs = distance_nm / speed if speed > 0 else 0.0
    
    # Displacement estimation based on lightweight + cargo payload
    dwt = vessel["dwt"]
    capacity_teu = vessel["capacity_teu"]
    load_ratio = min(1.0, max(0.1, cargo_load_teu / capacity_teu if capacity_teu > 0 else 0.5))
    displacement_tonnes = dwt * (0.35 + 0.65 * load_ratio) # light ship + cargo
    
    # Hydrodynamic Power using Admiralty coefficient formula: P = (Delta^(2/3) * V^3) / C_adm
    adm_coeff = vessel["admiralty_coeff"]
    weather_factor = get_weather_resistance_factor(sea_state_beaufort)
    
    # Main propulsion brake power (kW)
    power_propulsion_kw = ((displacement_tonnes ** (2.0 / 3.0)) * (speed ** 3)) / adm_coeff
    power_propulsion_kw *= weather_factor
    
    # Cap at MCR
    mcr_kw = vessel["main_engine_kw"]
    power_propulsion_kw = min(mcr_kw * 1.02, power_propulsion_kw)
    engine_load_ratio = power_propulsion_kw / mcr_kw
    
    # Auxiliary power (hotel load, ballast pumps, reefers)
    aux_power_kw = vessel["aux_engine_kw"] * (0.6 + 0.4 * load_ratio)
    
    # Main engine & Aux SFOC (g/kWh)
    main_sfoc = calculate_engine_sfoc(engine_load_ratio, fuel_type)
    aux_sfoc = calculate_engine_sfoc(0.65, fuel_type) # aux run at steady medium load
    
    # Fuel burn rates (metric tonnes per hour)
    main_fuel_rate_tonnes_hr = (power_propulsion_kw * main_sfoc) / 1_000_000.0
    aux_fuel_rate_tonnes_hr = (aux_power_kw * aux_sfoc) / 1_000_000.0
    total_sea_fuel_rate_tonnes_hr = main_fuel_rate_tonnes_hr + aux_fuel_rate_tonnes_hr
    
    # Sea passage fuel consumption (metric tonnes)
    sea_fuel_tonnes = total_sea_fuel_rate_tonnes_hr * transit_time_hrs
    
    # Port / Berth emissions & Shore Power
    port_fuel_tonnes = 0.0
    port_shore_power_kwh = 0.0
    port_electricity_cost = 0.0
    port_co2e_tonnes = 0.0
    
    port_hotel_power_kw = vessel["aux_engine_kw"] * 0.45
    if use_shore_power and vessel.get("has_shore_power_cable", False):
        # Connected to port cold-ironing shore power
        port_shore_power_kwh = port_hotel_power_kw * port_hours
        port_electricity_cost = port_shore_power_kwh * FUEL_SPECIFICATIONS["ShorePower"]["cost_usd_per_kwh"]
        port_co2e_tonnes = (port_shore_power_kwh * FUEL_SPECIFICATIONS["ShorePower"]["wtw_co2e_kg_per_kwh"]) / 1000.0
    else:
        # Auxiliary engine running in port on MGO
        mgo_aux_sfoc = calculate_engine_sfoc(0.45, "MGO")
        port_fuel_tonnes = (port_hotel_power_kw * mgo_aux_sfoc * port_hours) / 1_000_000.0
        port_co2e_tonnes = port_fuel_tonnes * FUEL_SPECIFICATIONS["MGO"]["wtw_co2e_kg_per_kg"]
    
    total_fuel_tonnes = sea_fuel_tonnes + port_fuel_tonnes
    
    # GHG Emissions (Well-to-Wake and Tank-to-Wake)
    wtw_factor = fuel_spec.get("wtw_co2e_kg_per_kg", 3.65)
    ttw_factor = fuel_spec.get("ttw_co2_kg_per_kg", 3.20)
    
    sea_co2e_wtw_tonnes = sea_fuel_tonnes * wtw_factor
    sea_co2_ttw_tonnes = sea_fuel_tonnes * ttw_factor
    
    total_co2e_wtw_tonnes = sea_co2e_wtw_tonnes + port_co2e_tonnes
    
    # Cost Breakdown ($ USD)
    fuel_cost_usd = total_fuel_tonnes * fuel_spec["cost_usd_per_tonne"] + port_electricity_cost
    carbon_tax_cost_usd = total_co2e_wtw_tonnes * carbon_tax_usd_per_tonne
    total_voyage_cost_usd = fuel_cost_usd + carbon_tax_cost_usd
    
    # IMO Carbon Intensity Indicator (CII) Rating
    # CII = (CO2 emitted in grams) / (Capacity DWT * Distance Nautical Miles)
    attained_cii = 0.0
    cii_rating = "C"
    if dwt > 0 and distance_nm > 0:
        # Attained CII in gCO2 / (DWT * NM)
        attained_cii = (total_co2e_wtw_tonnes * 1_000_000.0) / (dwt * distance_nm)
        
        # Reference line according to IMO MEPC.337(76)
        # For Container ships: ref = 93.4 * (DWT ^ -0.216)
        # For Bulk carriers: ref = 4745 * (DWT ^ -0.622)
        # For Tankers: ref = 5247 * (DWT ^ -0.610)
        v_type = vessel.get("type", "Container")
        if "Container" in v_type:
            cii_ref = 93.4 * (dwt ** -0.216)
        elif "Bulk" in v_type:
            cii_ref = 4745.0 * (dwt ** -0.622)
        elif "Tanker" in v_type:
            cii_ref = 5247.0 * (dwt ** -0.610)
        else:
            cii_ref = vessel.get("baseline_cii", 12.0)
            
        ratio = attained_cii / cii_ref if cii_ref > 0 else 1.0
        
        # Boundaries: A (<0.82), B (0.82-0.94), C (0.94-1.06), D (1.06-1.18), E (>1.18)
        if ratio <= 0.82:
            cii_rating = "A"
        elif ratio <= 0.94:
            cii_rating = "B"
        elif ratio <= 1.06:
            cii_rating = "C"
        elif ratio <= 1.18:
            cii_rating = "D"
        else:
            cii_rating = "E"
            
    return {
        "vessel_model": vessel_model_key,
        "vessel_name": vessel["name"],
        "fuel_type": fuel_type,
        "speed_knots": round(speed, 1),
        "distance_nm": round(distance_nm, 1),
        "transit_time_hrs": round(transit_time_hrs, 1),
        "sea_state_beaufort": sea_state_beaufort,
        "engine_power_kw": round(power_propulsion_kw, 0),
        "engine_load_pct": round(engine_load_ratio * 100, 1),
        "fuel_burn_rate_tonnes_hr": round(total_sea_fuel_rate_tonnes_hr, 3),
        "total_fuel_tonnes": round(total_fuel_tonnes, 2),
        "sea_fuel_tonnes": round(sea_fuel_tonnes, 2),
        "port_fuel_tonnes": round(port_fuel_tonnes, 2),
        "port_shore_power_kwh": round(port_shore_power_kwh, 1),
        "co2e_wtw_tonnes": round(total_co2e_wtw_tonnes, 2),
        "co2_ttw_tonnes": round(sea_co2_ttw_tonnes, 2),
        "fuel_cost_usd": round(fuel_cost_usd, 2),
        "carbon_tax_cost_usd": round(carbon_tax_cost_usd, 2),
        "total_cost_usd": round(total_voyage_cost_usd, 2),
        "attained_cii": round(attained_cii, 2),
        "cii_rating": cii_rating,
        "trees_offset_equivalent": round(total_co2e_wtw_tonnes * 45.8, 0) # ~45.8 trees per ton CO2e/year
    }

def compare_alternative_fuels_for_route(
    vessel_model_key: str,
    distance_nm: float,
    speed_knots: float,
    cargo_load_teu: float,
    sea_state_beaufort: int = 3,
    carbon_tax_usd: float = 75.0
) -> Dict[str, Any]:
    """
    Evaluates all compatible fuels for a given voyage side-by-side,
    highlighting fuel saved, emissions avoided, and financial payback.
    """
    vessel = VESSEL_TYPES.get(vessel_model_key, VESSEL_TYPES["feeder_container_2500"])
    compatible_fuels = vessel.get("compatible_fuels", ["MGO"])
    
    results = {}
    baseline = predict_voyage_fuel(
        vessel_model_key=vessel_model_key,
        distance_nm=distance_nm,
        speed_knots=speed_knots,
        cargo_load_teu=cargo_load_teu,
        fuel_type="MGO",
        sea_state_beaufort=sea_state_beaufort,
        carbon_tax_usd_per_tonne=carbon_tax_usd
    )
    results["MGO"] = baseline
    
    for fuel in compatible_fuels:
        if fuel == "MGO":
            continue
        eval_res = predict_voyage_fuel(
            vessel_model_key=vessel_model_key,
            distance_nm=distance_nm,
            speed_knots=speed_knots,
            cargo_load_teu=cargo_load_teu,
            fuel_type=fuel,
            sea_state_beaufort=sea_state_beaufort,
            carbon_tax_usd_per_tonne=carbon_tax_usd
        )
        # Delta against MGO baseline
        co2_saved = baseline["co2e_wtw_tonnes"] - eval_res["co2e_wtw_tonnes"]
        co2_reduction_pct = (co2_saved / baseline["co2e_wtw_tonnes"] * 100) if baseline["co2e_wtw_tonnes"] > 0 else 0
        cost_delta = eval_res["total_cost_usd"] - baseline["total_cost_usd"]
        
        eval_res["co2_saved_tonnes"] = round(co2_saved, 2)
        eval_res["co2_reduction_pct"] = round(co2_reduction_pct, 1)
        eval_res["cost_delta_usd"] = round(cost_delta, 2)
        results[fuel] = eval_res
        
    return results
