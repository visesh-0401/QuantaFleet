"""
fleet_data.py
-------------
Comprehensive dataset and catalog for QuantaGreen (SIH26138).
Includes realistic maritime vessels, inland freight vehicles, port hubs,
shipping lane distances (nautical miles), and alternative fuel specifications.
"""

PORTS = {
    "JNPT": {"name": "Jawaharlal Nehru Port (Mumbai)", "lat": 18.9499, "lon": 72.9515, "country": "India", "shore_power": True, "green_fuel_bunkering": ["LNG", "Methanol", "MGO"]},
    "KOCHI": {"name": "Cochin Port (Vallarpadam)", "lat": 9.9667, "lon": 76.2667, "country": "India", "shore_power": True, "green_fuel_bunkering": ["LNG", "MGO"]},
    "COLOMBO": {"name": "Port of Colombo", "lat": 6.9531, "lon": 79.8475, "country": "Sri Lanka", "shore_power": False, "green_fuel_bunkering": ["MGO", "LNG", "Methanol"]},
    "CHENNAI": {"name": "Chennai Port", "lat": 13.0844, "lon": 80.2974, "country": "India", "shore_power": True, "green_fuel_bunkering": ["MGO", "LNG"]},
    "VIZAG": {"name": "Visakhapatnam Port", "lat": 17.6868, "lon": 83.2185, "country": "India", "shore_power": True, "green_fuel_bunkering": ["MGO", "Methanol", "Ammonia"]},
    "KOLKATA": {"name": "Syama Prasad Mookerjee Port (Kolkata/Haldia)", "lat": 22.0258, "lon": 88.0827, "country": "India", "shore_power": False, "green_fuel_bunkering": ["MGO", "LNG"]},
    "DUBAI": {"name": "Jebel Ali Port (Dubai)", "lat": 25.0113, "lon": 55.0612, "country": "UAE", "shore_power": True, "green_fuel_bunkering": ["MGO", "LNG", "Methanol", "Ammonia", "Hydrogen"]},
    "SINGAPORE": {"name": "Port of Singapore", "lat": 1.2902, "lon": 103.8519, "country": "Singapore", "shore_power": True, "green_fuel_bunkering": ["MGO", "LNG", "Methanol", "Ammonia", "Hydrogen"]}
}

MARITIME_ROUTES = [
    {
        "id": "R1_MUM_KOC",
        "origin": "JNPT",
        "destination": "KOCHI",
        "distance_nm": 560,
        "base_sea_state": 2, # Beaufort scale 0-12
        "cargo_demand_teu": 850,
        "max_transit_time_hrs": 42
    },
    {
        "id": "R2_KOC_COL",
        "origin": "KOCHI",
        "destination": "COLOMBO",
        "distance_nm": 310,
        "base_sea_state": 3,
        "cargo_demand_teu": 620,
        "max_transit_time_hrs": 24
    },
    {
        "id": "R3_COL_CHE",
        "origin": "COLOMBO",
        "destination": "CHENNAI",
        "distance_nm": 590,
        "base_sea_state": 3,
        "cargo_demand_teu": 900,
        "max_transit_time_hrs": 45
    },
    {
        "id": "R4_CHE_VIZ",
        "origin": "CHENNAI",
        "destination": "VIZAG",
        "distance_nm": 360,
        "base_sea_state": 2,
        "cargo_demand_teu": 540,
        "max_transit_time_hrs": 28
    },
    {
        "id": "R5_VIZ_KOL",
        "origin": "VIZAG",
        "destination": "KOLKATA",
        "distance_nm": 440,
        "base_sea_state": 3,
        "cargo_demand_teu": 780,
        "max_transit_time_hrs": 36
    },
    {
        "id": "R6_MUM_DUB",
        "origin": "JNPT",
        "destination": "DUBAI",
        "distance_nm": 1070,
        "base_sea_state": 4,
        "cargo_demand_teu": 1400,
        "max_transit_time_hrs": 72
    },
    {
        "id": "R7_CHE_SIN",
        "origin": "CHENNAI",
        "destination": "SINGAPORE",
        "distance_nm": 1640,
        "base_sea_state": 4,
        "cargo_demand_teu": 1800,
        "max_transit_time_hrs": 110
    }
]

VESSEL_TYPES = {
    "feeder_container_2500": {
        "name": "EcoFeeder 2500 TEU",
        "type": "Container Feeder",
        "capacity_teu": 2500,
        "dwt": 32000,
        "length_m": 195,
        "beam_m": 30.2,
        "design_speed_knots": 18.5,
        "min_speed_knots": 10.0,
        "max_speed_knots": 21.0,
        "main_engine_kw": 14800,
        "aux_engine_kw": 1800,
        "admiralty_coeff": 580,
        "compatible_fuels": ["MGO", "LNG", "Methanol"],
        "has_shore_power_cable": True,
        "baseline_cii": 12.8 # gCO2 / (dwt * nm)
    },
    "ultramax_bulk_63k": {
        "name": "GreenBulk Ultramax 63k",
        "type": "Bulk Carrier",
        "capacity_teu": 1800,
        "dwt": 63500,
        "length_m": 199.9,
        "beam_m": 32.2,
        "design_speed_knots": 14.0,
        "min_speed_knots": 9.0,
        "max_speed_knots": 16.0,
        "main_engine_kw": 8200,
        "aux_engine_kw": 1200,
        "admiralty_coeff": 630,
        "compatible_fuels": ["MGO", "LNG", "Ammonia"],
        "has_shore_power_cable": True,
        "baseline_cii": 5.4
    },
    "mr2_tanker_50k": {
        "name": "CleanWave MR2 Product Tanker",
        "type": "Chemical / Product Tanker",
        "capacity_teu": 1500,
        "dwt": 49990,
        "length_m": 183.0,
        "beam_m": 32.2,
        "design_speed_knots": 14.5,
        "min_speed_knots": 9.5,
        "max_speed_knots": 16.5,
        "main_engine_kw": 9100,
        "aux_engine_kw": 1500,
        "admiralty_coeff": 610,
        "compatible_fuels": ["MGO", "LNG", "Methanol"],
        "has_shore_power_cable": True,
        "baseline_cii": 6.8
    },
    "coastal_electric_barge": {
        "name": "Brahmaputra GreenBarge Hybrid",
        "type": "Coastal / Inland Feeder",
        "capacity_teu": 600,
        "dwt": 7500,
        "length_m": 110.0,
        "beam_m": 16.5,
        "design_speed_knots": 11.0,
        "min_speed_knots": 7.0,
        "max_speed_knots": 13.0,
        "main_engine_kw": 2400,
        "aux_engine_kw": 400,
        "admiralty_coeff": 490,
        "compatible_fuels": ["MGO", "Methanol", "Hydrogen"],
        "has_shore_power_cable": True,
        "baseline_cii": 16.5
    },
    "heavy_green_truck": {
        "name": "FreightQ H2-Electric 40T",
        "type": "Intermodal Inland Truck",
        "capacity_teu": 2,
        "dwt": 40,
        "length_m": 16.5,
        "beam_m": 2.5,
        "design_speed_knots": 45.0, # km/h equivalent
        "min_speed_knots": 30.0,
        "max_speed_knots": 65.0,
        "main_engine_kw": 400,
        "aux_engine_kw": 20,
        "admiralty_coeff": 150,
        "compatible_fuels": ["MGO", "Hydrogen", "LNG"],
        "has_shore_power_cable": False,
        "baseline_cii": 72.0
    }
}

ACTIVE_FLEET = [
    {"vessel_id": "V-101", "name": "Ocean Trident", "model": "feeder_container_2500", "fuel_type": "MGO", "current_location": "JNPT", "assigned_route": "R1_MUM_KOC", "speed_knots": 15.5, "status": "Underway"},
    {"vessel_id": "V-102", "name": "Vanguard Eco", "model": "feeder_container_2500", "fuel_type": "LNG", "current_location": "KOCHI", "assigned_route": "R2_KOC_COL", "speed_knots": 14.0, "status": "Underway"},
    {"vessel_id": "V-103", "name": "Blue Horizon", "model": "ultramax_bulk_63k", "fuel_type": "MGO", "current_location": "COLOMBO", "assigned_route": "R3_COL_CHE", "speed_knots": 13.0, "status": "Underway"},
    {"vessel_id": "V-104", "name": "Zephyr Green", "model": "mr2_tanker_50k", "fuel_type": "Methanol", "current_location": "CHENNAI", "assigned_route": "R4_CHE_VIZ", "speed_knots": 13.5, "status": "Underway"},
    {"vessel_id": "V-105", "name": "Ganga Pioneer", "model": "coastal_electric_barge", "fuel_type": "Hydrogen", "current_location": "VIZAG", "assigned_route": "R5_VIZ_KOL", "speed_knots": 10.0, "status": "Underway"},
    {"vessel_id": "V-106", "name": "Indus Titan", "model": "feeder_container_2500", "fuel_type": "LNG", "current_location": "JNPT", "assigned_route": "R6_MUM_DUB", "speed_knots": 16.0, "status": "Underway"},
    {"vessel_id": "V-107", "name": "Malacca Breeze", "model": "ultramax_bulk_63k", "fuel_type": "Ammonia", "current_location": "CHENNAI", "assigned_route": "R7_CHE_SIN", "speed_knots": 12.5, "status": "Underway"}
]

FUEL_SPECIFICATIONS = {
    "MGO": {
        "name": "Marine Gas Oil (0.1% Sulphur)",
        "lhv_mj_per_kg": 42.7,
        "cost_usd_per_tonne": 690.0,
        "ttw_co2_kg_per_kg": 3.206,      # Tank-to-Wake (combustion)
        "wtw_co2e_kg_per_kg": 3.68,      # Well-to-Wake (lifecycle)
        "methane_slip_g_per_kg": 0.0,
        "category": "Fossil Standard",
        "color": "#ef4444"
    },
    "LNG": {
        "name": "Liquefied Natural Gas",
        "lhv_mj_per_kg": 49.2,
        "cost_usd_per_tonne": 640.0,
        "ttw_co2_kg_per_kg": 2.75,
        "wtw_co2e_kg_per_kg": 3.05,      # accounts for 1.8% methane slip (GWP20 = 84, GWP100 = 28)
        "methane_slip_g_per_kg": 8.5,
        "category": "Transition Fuel",
        "color": "#3b82f6"
    },
    "Methanol": {
        "name": "Green e-Methanol",
        "lhv_mj_per_kg": 19.9,
        "cost_usd_per_tonne": 920.0,
        "ttw_co2_kg_per_kg": 1.375,      # chemically emitted, but net zero with captured CO2
        "wtw_co2e_kg_per_kg": 0.38,      # Lifecycle biogenic / renewable synthesis
        "methane_slip_g_per_kg": 0.0,
        "category": "Renewable Synthetic",
        "color": "#10b981"
    },
    "Ammonia": {
        "name": "Green Ammonia (NH3)",
        "lhv_mj_per_kg": 18.6,
        "cost_usd_per_tonne": 880.0,
        "ttw_co2_kg_per_kg": 0.0,        # Zero direct carbon
        "wtw_co2e_kg_per_kg": 0.18,      # Trace N2O emissions lifecycle
        "methane_slip_g_per_kg": 0.0,
        "category": "Zero-Carbon Molecular",
        "color": "#8b5cf6"
    },
    "Hydrogen": {
        "name": "Green Liquid Hydrogen (LH2)",
        "lhv_mj_per_kg": 120.0,
        "cost_usd_per_tonne": 2900.0,
        "ttw_co2_kg_per_kg": 0.0,
        "wtw_co2e_kg_per_kg": 0.08,
        "methane_slip_g_per_kg": 0.0,
        "category": "Ultra-Clean",
        "color": "#00f2fe"
    },
    "ShorePower": {
        "name": "Shore Power / Cold Ironing",
        "lhv_mj_per_kg": 3.6,           # 1 kWh = 3.6 MJ
        "cost_usd_per_tonne": 120.0,     # equivalent electricity unit cost
        "cost_usd_per_kwh": 0.14,
        "ttw_co2_kg_per_kg": 0.0,
        "wtw_co2e_kg_per_kwh": 0.52,    # Port grid average (can drop to 0.08 with solar/wind)
        "category": "Port Electrification",
        "color": "#f59e0b"
    }
}
