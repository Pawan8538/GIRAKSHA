# GeoGuard ML Services

This directory (`sih2025`) contains the machine learning components for risk prediction, landslide detection, and climate simulation.

## Components

- **Risk Prediction**: XGBoost/RandomForest models to predict slope stability.
- **Computer Vision**: Models for detecting cracks in slope images.
- **Climate Simulation**: Simulates weather impact on terrain stability.

## Setup

1. Navigate to this directory:
   ```bash
   cd sih2025
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the service:
   ```bash
   python -m src.main
   ```

## Integration
This service exposes a REST API (typically on port 8000 or 5000) that the Backend consumes to fetch risk scores and alerts.
