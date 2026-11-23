"""
FastAPI HTTP Endpoint Integration Test
Tests all endpoints using TestClient.
"""

from fastapi.testclient import TestClient
from main import app

def test_endpoints():
    with TestClient(app) as client:
        print("Testing /health ...")
        r = client.get("/health")
        assert r.status_code == 200
        print("  /health response:", r.json())

        print("\nTesting /risk/grid ...")
        r = client.get("/risk/grid")
        assert r.status_code == 200
        res = r.json()
        assert res["dimensions"] == {"rows": 20, "cols": 20}
        assert len(res["grid"]) == 400
        print(f"  /risk/grid returned {len(res['grid'])} cells.")

        print("\nTesting /predict with sensor history ...")
        payload = {
            "slopeId": "SLOPE_BENCH_04",
            "slope_deg": 35.0,
            "history": [
                {"disp_mm": 1.2 + i * 0.1, "pore_kpa": 30.0, "tilt_deg": 0.01, "rain_mm": 5.0, "ppv": 0.2}
                for i in range(25)
            ]
        }
        r = client.post("/predict", json=payload)
        assert r.status_code == 200, f"Error: {r.text}"
        data = r.json()["data"]
        print(f"  /predict score: {data['risk_score']}, level: {data['risk_level']}")
        print(f"  top SHAP drivers: {data['explainability']['top_drivers']}")

        print("\nTesting /evacuation/route ...")
        route_payload = {
            "workerId": "WORKER_102",
            "startCell": [10, 10],
            "exits": [[0, 19], [19, 0]]
        }
        r = client.post("/evacuation/route", json=route_payload)
        assert r.status_code == 200
        route_data = r.json()["data"]
        print(f"  /evacuation/route found: {route_data['route_found']}, dist: {route_data['total_distance_meters']}m, time: {route_data['estimated_time_seconds']}s")

        print("\nTesting /anomaly/detect ...")
        anom_payload = {
            "sensorId": "SN_DISP_01",
            "displacement_history": [1.0, 1.1, 1.05, 1.12, 1.08, 9.85] # sudden jump
        }
        r = client.post("/anomaly/detect", json=anom_payload)
        assert r.status_code == 200
        print(f"  /anomaly/detect composite: {r.json()['data']['composite_anomaly']}")

        print("\nTesting /forecast ...")
        fc_payload = {
            "sensorId": "1750L-54XC",
            "displacement_history": [1.0 + i*0.05 for i in range(20)],
            "horizon_hours": 72
        }
        r = client.post("/forecast", json=fc_payload)
        assert r.status_code == 200
        fc_data = r.json()["data"]
        print(f"  /forecast method: {fc_data['method']}, steps: {len(fc_data['timestamps'])}h")

        print("\n🎉 ALL FASTAPI HTTP ENDPOINT TESTS PASSED!")

if __name__ == "__main__":
    test_endpoints()
