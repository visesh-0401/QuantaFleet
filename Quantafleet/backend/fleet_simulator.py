"""
fleet_simulator.py
------------------
Simulates real-time GPS movement of fleet vehicles along their assigned routes.
Broadcasts positions over time so the frontend map feels "live".
"""

import asyncio
import math
import time
from typing import List, Dict, Optional
import numpy as np


VEHICLE_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"]
VEHICLE_NAMES = ["Alpha", "Bravo", "Charlie", "Delta", "Echo"]


class FleetSimulator:
    def __init__(self):
        self.routes: List[List[Dict]] = []       # list of routes (list of node dicts)
        self.vehicle_states: List[Dict] = []
        self.is_running = False
        self._progress: List[float] = []         # 0.0 → 1.0 along route
        self._speed = 0.002                       # progress units per tick

    def set_routes(self, routes: List[Dict], nodes: List[Dict]):
        """Load new routes (with exact paths) into the simulator and reset state."""
        self.routes = []
        self.vehicle_states = []
        self._progress = []

        for v_idx, route in enumerate(routes):
            # Fallback to empty if missing
            node_route = route.get("path", [])
            if not node_route and "stops" in route:
                node_route = [{"lat": s["lat"], "lon": s["lon"]} for s in route["stops"]]
                
            self.routes.append(node_route)
            self._progress.append(0.0)

            start_node = node_route[0] if node_route else nodes[0]
            base_name = VEHICLE_NAMES[v_idx % len(VEHICLE_NAMES)]
            self.vehicle_states.append({
                "id": v_idx,
                "name": f"{base_name}-{v_idx+1}",
                "color": VEHICLE_COLORS[v_idx % len(VEHICLE_COLORS)],
                "lat": start_node["lat"],
                "lon": start_node["lon"],
                "status": "idle",
                "speed_kmh": 0,
                "current_stop": 0,
                "total_stops": len(route.get("stops", [])),
                "progress_pct": 0,
            })

    def tick(self):
        """Advance all vehicles one simulation step. Call every ~600ms."""
        for v_idx, state in enumerate(self.vehicle_states):
            if v_idx >= len(self.routes):
                continue
            route = self.routes[v_idx]
            if len(route) < 2:
                continue

            prog = self._progress[v_idx]
            total_segments = len(route) - 1
            seg_prog = prog * total_segments          # which segment we're on
            seg_idx = min(int(seg_prog), total_segments - 1)
            local_t = seg_prog - seg_idx             # 0→1 within segment

            # Interpolate lat/lon
            a = route[seg_idx]
            b = route[min(seg_idx + 1, len(route) - 1)]
            lat = a["lat"] + (b["lat"] - a["lat"]) * local_t
            lon = a["lon"] + (b["lon"] - a["lon"]) * local_t

            state["lat"] = round(lat, 6)
            state["lon"] = round(lon, 6)
            # Estimate current delivery stop based on overall progress
            state["current_stop"] = int(prog * state["total_stops"])
            state["progress_pct"] = round(prog * 100, 1)
            state["status"] = "delivering" if prog < 0.98 else "returned"
            state["speed_kmh"] = round(40 + 20 * math.sin(prog * math.pi), 1)

            # Advance progress (loop)
            self._progress[v_idx] = (prog + self._speed) % 1.0

        return self.vehicle_states

    def get_status(self) -> List[Dict]:
        return self.vehicle_states


# Shared singleton
simulator = FleetSimulator()
