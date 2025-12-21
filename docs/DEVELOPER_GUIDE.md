# GIRAKSHA Developer Documentation

**GIRAKSHA** is a comprehensive mine safety and monitoring system designed to predict and visualize geological risks in real-time. This repository contains both the Python-based backend logic and the React Native mobile application.

## Project Structure

### 1. Mobile Application (`/mobile-app`)
The core user interface, built with **React Native** and **Expo**. It has been engineered to run **independently** (offline-capable) by porting the risk logic to JavaScript.

- `src/screens/`: UI Screens (Map, Climate, Prediction, Report, Evacuation).
- `src/services/RiskEngine.js`: **CORE LOGIC**. This service calculates risk locally on the device. It fetches weather, simulates sensors, and generates the risk grid.
- `src/services/api.js`: Interface for data fetching. Currently points to `RiskEngine` for local execution.
- `src/components/`: Reusable UI components (StatusBadge, etc.).

### 2. Backend & Research (`/src`)
The original research code, Python backend, and ML models. Useful for the backend developer to understand the algorithms before they were ported to mobile.

- `api/main.py`: FastAPI server (originally used to serve data).
- `backend/fusion_engine.py`: **PYTHON CORE**. The original risk calculation logic. `RiskEngine.js` is a port of this.
- `geo/climate_module.py`: Weather data handling (OpenWeatherMap integration).
- `sim/sensor_stream.py`: Python script for generating synthetic sensor data streams.
- `ml/`: Machine learning models for vision-based crack detection.

## Data Sources & Generation

### 1. Weather Data (Real)
- **Source**: [OpenWeatherMap API](https://openweathermap.org/).
- **Implementation**:
  - **Mobile**: `RiskEngine.js` calls the API directly.
  - **Fallback**: If offline, it generates synthetic weather data (randomized within realistic bounds).
- **Key**: `d35fba280190f0e95977742016f32cb4` (Free tier).

### 2. Sensor Data (Synthetic)
- **Source**: Simulated locally.
- **Logic**:
  - We simulate 5 sensor nodes (`S0` to `S4`) placed around the mine.
  - **Metrics**:
    - `disp_mm` (Displacement): Random noise + trends.
    - `pore_kpa` (Pore Pressure): Base value + random fluctuation.
    - `vibration_g` (Vibration): Random spikes.
- **File**: `RiskEngine.js` (function `generateSensors`).

### 3. Geological Data (Synthetic)
- **Source**: Static zoning logic.
- **Logic**: The map is divided into a 20x20 grid.
  - **Mine Center**: High base risk (active excavation).
  - **NW Zone**: Unstable rock formation (+35% risk).
  - **SE Zone**: Slope area (+30% risk).
  - **Noise**: Gaussian noise added for realism.

## Risk Models & Algorithms

### The "Fusion Engine" (Risk Calculation)
The risk score (0.0 to 1.0) for each grid cell is calculated using a weighted formula:

$$
\text{Base Risk} = (0.45 \times \text{Mine Proximity}) + (0.35 \times \text{Geology}) + (0.20 \times \text{Sensors})
$$

1. **Mine Proximity**: Exponential decay from the center ($0.85 \times e^{-dist}$).
2. **Geology**: Static zones defined by grid coordinates.
3. **Sensors**: Inverse distance weighting (IDW) from the 5 sensor nodes.

**Final Score**:
$$
\text{Final Risk} = \text{Base Risk} \times \text{Weather Multiplier}
$$
- **Weather Multiplier**: Increases based on rainfall (24h/72h) and intensity.

## How to Run

### Mobile App (Frontend)
1. Navigate to the folder:
   ```bash
   cd mobile-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run on Simulator/Device:
   ```bash
   npx expo start
   ```
4. **Build APK**:
   ```bash
   eas build --platform android --profile release --local
   ```

### Backend (Python - Optional/Reference)
If you want to run the original Python server:
1. Navigate to root:
   ```bash
   cd ..
   ```
2. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
3. Run server:
   ```bash
   python src/api/main.py
   ```

## Notes for Developers

- **Frontend Dev**: Focus on `mobile-app/`. The app is currently **independent**. If you want to connect to a real backend later, update `src/services/api.js` to point to a server URL instead of `RiskEngine`.
- **Backend Dev**: The logic in `fusion_engine.py` is the source of truth for the algorithm. If you update the risk model, ensure `mobile-app/src/services/RiskEngine.js` is updated to match (or switch the app to consume your API).
