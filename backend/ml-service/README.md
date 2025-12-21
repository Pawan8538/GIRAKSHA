# GeoGuard ML Service

Python FastAPI service that provides ML model endpoints for risk prediction, crack detection, and forecasting.

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Ensure model files are in the correct locations:
   - XGBoost model: `../../sih2025/geo_guard/models/xgb_baseline.json`
   - Vision model: `../../sih2025/geo_guard/colab_final_model.h5`

3. Set environment variable (optional):
```bash
export ML_SERVICE_PORT=8000
```

4. Run the service:
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Configuration

The service will automatically look for model files in:
- `sih2025/geo_guard/models/xgb_baseline.json` (XGBoost model)
- `sih2025/geo_guard/colab_final_model.h5` (Vision model)

If models are not found, the service will still start but endpoints will return errors.

## Endpoints

See `ML_INTEGRATION_DOCS.txt` in the project root for complete API documentation.

## Dependencies

- fastapi: Web framework
- uvicorn: ASGI server
- xgboost: XGBoost model inference
- pandas: Data processing
- numpy: Numerical operations
- Pillow: Image processing
- httpx: HTTP client for weather API
- tensorflow: Vision model inference

## Notes

- The service uses the Fusion Engine from `sih2025/geo_guard/src/backend/fusion_engine.py`
- Weather data is fetched from OpenWeatherMap API (with fallback to simulation)
- Image uploads are temporarily stored in `backend/uploads/` and cleaned up after processing

