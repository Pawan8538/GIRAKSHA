# GeoGuard: AI-Powered Mine Safety System

GeoGuard is a comprehensive safety monitoring platform for mining operations, integrating real-time sensor data, ML-driven risk prediction, and role-based alerts.

## Project Structure

- **`mobile-app/`**: React Native (Expo) application for Field Workers, Site Admins, and Gov Authorities.
- **`backend/`**: Node.js/Express server handling authentication, data aggregation, and alerts.
- **`ml-service/`**: Flask-based Machine Learning service providing risk predictions and forecasting.
- **`web-app/`**: Next.js web dashboard for desktop monitoring (Integration in progress).
- **`database/`**: SQL scripts for PostgreSQL schema setup.

## Getting Started

### 1. Backend
```bash
cd backend
npm install
# Setup .env with DB credentials
npm start
```

### 2. ML Service
```bash
cd ml-service
pip install -r requirements.txt
python -m app.main
```

### 3. Mobile App
```bash
cd mobile-app
npm install
npm start
```

## Features
- **Role-Based Access**: Specialized views for Workers, Admins, and Government.
- **Real-time Risk Map**: Heatmap visualization of slope stability.
- **ML Predictions**:
  - Landslide Risk
  - Crack Detection (Computer Vision)
  - Rainfall & Displacement Forecasting
  - Seismic Anomaly Detection
- **Offline Support**: Queue-based complaint submission for field workers.
