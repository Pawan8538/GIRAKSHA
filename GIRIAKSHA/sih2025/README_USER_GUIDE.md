# GeoGuard Demo - User Guide

Follow these steps to run the GeoGuard Rockfall Prediction System demo.

## 1. Setup Environment
Open your terminal, navigate to the `geo_guard` directory, and run these commands to set up a safe environment and install tools:

```bash
# Navigate to the project directory
cd geo_guard

# Create a virtual environment (to avoid system errors)
python3 -m venv .venv

# Activate the environment
source .venv/bin/activate

# Install Python dependencies
pip install fastapi uvicorn xgboost pandas shapely geopandas pyproj scipy numpy requests pyarrow
```

## 2. Generate Data & Start Server
Run the following commands to generate the risk map and start the backend server:

```bash
# Add current directory to Python path
export PYTHONPATH=$PYTHONPATH:.

# Generate the latest risk heatmap
python3 src/geo/generate_heatmap.py

# Start the API server
python3 src/api/map_api.py
```

*You will see a message saying "Uvicorn running on http://0.0.0.0:8001". Keep this terminal window open.*

## 3. View the Map
Open a **new terminal window** (or file explorer) and open the viewer file in your browser:

**Mac:**
```bash
open src/ui/heatmap_view.html
```

**Windows/Linux:**
Manually navigate to the `geo_guard/src/ui` folder and double-click `heatmap_view.html`.

---
**Note:** If the map looks empty, ensure the API server is running in the background.
