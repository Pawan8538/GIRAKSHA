"""
A* Pathfinding Router for GIRAKSHA Open-Pit Evacuation
Guides miners safely around dynamic rockfall hazard zones (cells with risk >= 0.60 are impassable).
"""

import heapq
import math
from typing import List, Tuple, Dict, Any, Optional

class AStarRouter:
    def __init__(self, grid_size: int = 20, cell_size_meters: float = 25.0):
        self.grid_size = grid_size
        self.cell_size_meters = cell_size_meters

    def _heuristic(self, a: Tuple[int, int], b: Tuple[int, int]) -> float:
        """Euclidean distance in grid units"""
        return math.hypot(a[0] - b[0], a[1] - b[1])

    def _get_heading(self, dr: int, dc: int) -> str:
        """Compass heading for row/col delta"""
        headings = {
            (-1, 0): "N", (1, 0): "S", (0, -1): "W", (0, 1): "E",
            (-1, 1): "NE", (-1, -1): "NW", (1, 1): "SE", (1, -1): "SW"
        }
        return headings.get((dr, dc), "FORWARD")

    def find_route(
        self,
        start: Tuple[int, int],
        exits: List[Tuple[int, int]],
        risk_matrix: List[List[float]],
        impassable_threshold: float = 0.60
    ) -> Dict[str, Any]:
        """
        Finds optimal A* path to the nearest reachable designated safe exit.
        
        Args:
            start: (row, col)
            exits: List of (row, col) exit gate coordinates
            risk_matrix: 20x20 matrix of risk scores in [0.0, 1.0]
            impassable_threshold: cells with risk >= threshold are blocked (default: 0.60)
        """
        if not exits:
            return {"route_found": False, "error": "No exit gates defined"}

        r_start, c_start = start
        if not (0 <= r_start < self.grid_size and 0 <= c_start < self.grid_size):
            return {"route_found": False, "error": "Start cell outside mine grid bounds"}

        # If start is blocked, find nearest unblocked adjacent cell
        if risk_matrix[r_start][c_start] >= impassable_threshold:
            found_safe = False
            for dr in [-1, 0, 1]:
                for dc in [-1, 0, 1]:
                    nr, nc = r_start + dr, c_start + dc
                    if 0 <= nr < self.grid_size and 0 <= nc < self.grid_size and risk_matrix[nr][nc] < impassable_threshold:
                        start = (nr, nc)
                        found_safe = True
                        break
                if found_safe:
                    break

        # Filter reachable exits (must not be blocked itself)
        valid_exits = [e for e in exits if 0 <= e[0] < self.grid_size and 0 <= e[1] < self.grid_size and risk_matrix[e[0]][e[1]] < impassable_threshold]
        if not valid_exits:
            valid_exits = exits # Fallback to designated exits

        # Target nearest exit by euclidean distance
        target_exit = min(valid_exits, key=lambda ex: self._heuristic(start, ex))

        open_set = []
        heapq.heappush(open_set, (0.0, start))

        came_from = {}
        g_score = {start: 0.0}
        f_score = {start: self._heuristic(start, target_exit)}

        # 8-directional movement (N, S, W, E, NW, NE, SW, SE)
        directions = [
            (-1, 0), (1, 0), (0, -1), (0, 1),
            (-1, -1), (-1, 1), (1, -1), (1, 1)
        ]

        while open_set:
            _, current = heapq.heappop(open_set)

            if current in valid_exits or current == target_exit:
                # Reconstruct path
                path = []
                curr = current
                while curr in came_from:
                    path.append(curr)
                    curr = came_from[curr]
                path.append(start)
                path.reverse()

                # Build step-by-step turn waypoints
                waypoints = []
                for i in range(len(path) - 1):
                    dr = path[i+1][0] - path[i][0]
                    dc = path[i+1][1] - path[i][1]
                    dist_m = self.cell_size_meters * (1.414 if (dr != 0 and dc != 0) else 1.0)
                    heading = self._get_heading(dr, dc)
                    waypoints.append({
                        "step": i + 1,
                        "instruction": f"Head {heading} to cell ({path[i+1][0]}, {path[i+1][1]})",
                        "heading": heading,
                        "from_cell": list(path[i]),
                        "to_cell": list(path[i+1]),
                        "distance_meters": round(dist_m, 1)
                    })

                total_dist = sum(w["distance_meters"] for w in waypoints)
                walking_speed_mps = 1.3 # Average miner walking speed in open pit
                est_seconds = int(total_dist / walking_speed_mps)

                return {
                    "route_found": True,
                    "target_exit": list(current),
                    "total_distance_meters": round(total_dist, 1),
                    "estimated_time_seconds": est_seconds,
                    "path_coordinates": [list(p) for p in path],
                    "waypoints": waypoints
                }

            for dr, dc in directions:
                neighbor = (current[0] + dr, current[1] + dc)
                nr, nc = neighbor

                if 0 <= nr < self.grid_size and 0 <= nc < self.grid_size:
                    risk = risk_matrix[nr][nc]

                    # Strictly impassable barrier if risk >= 0.60 (High/Imminent)
                    if risk >= impassable_threshold and neighbor not in valid_exits:
                        continue

                    step_dist = 1.414 if (dr != 0 and dc != 0) else 1.0
                    # Cost penalty: penalizes moving through moderate risk cells (0.35 - 0.60)
                    risk_penalty = 1.0 + (risk * 6.0)
                    tentative_g = g_score[current] + (step_dist * risk_penalty)

                    if neighbor not in g_score or tentative_g < g_score[neighbor]:
                        came_from[neighbor] = current
                        g_score[neighbor] = tentative_g
                        f_score[neighbor] = tentative_g + self._heuristic(neighbor, target_exit)
                        heapq.heappush(open_set, (f_score[neighbor], neighbor))

        return {
            "route_found": False,
            "message": "No safe evacuation route found! Danger zone blocks all exits.",
            "target_exit": list(target_exit),
            "path_coordinates": [],
            "waypoints": []
        }
