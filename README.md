# GIRAKSHA: AI-Powered Mine Safety System

## 🚀 Live Demo & Access

| Component | Status | URL |
| :--- | :--- | :--- |
| **Web Dashboard** | 🟢 Live | [sih-web-app-pcgw.onrender.com](https://sih-web-app-pcgw.onrender.com) |
| **Backend API** | 🟢 Live | [sih-backend-gwzk.onrender.com](https://sih-backend-gwzk.onrender.com) |
| **ML Service** | 🟢 Live | [sih-ml-service.onrender.com](https://sih-ml-service.onrender.com) |
| **Database** | 🟢 Live | Internal Managed PostgreSQL |

### 🔑 Demo Login Credentials
Use these credentials to explore the platform roles without signing up:

| Role | Phone | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `1234567890` | `123456` | Full Control, Global Monitoring |
| **Site Admin** | `2222222222` | `123456` | Mine-Specific Alerts, worker management |
| **Govt Authority** | `3333333333` | `123456` | Compliance, Reporting, Oversight |
| **Field Worker** | `1122334455` | `123456` | SOS, Task Updates (Mobile View) |

GIRAKSHA is a comprehensive safety monitoring platform for mining operations, integrating real-time sensor data, ML-driven risk prediction, and role-based alerts.

## Project Structure

- **mobile-app/**: React Native (Expo) application for Field Workers, Site Admins, and Gov Authorities.
- **backend/**: Node.js/Express server handling authentication, data aggregation, and alerts.
- **sih2025/**: Python-based Machine Learning service (Flask) providing risk predictions, climate simulation, and forecasting.
- **web-app/**: Next.js web dashboard for desktop monitoring.
- **database/**: SQL scripts for PostgreSQL schema setup and migrations.
- **docs/**: Comprehensive documentation for Users, Developers, and System Integrators.

## 🤝 The Team
Built by **Team Zenware**, finalists of **SIH 2025**.
👉 **[Meet the Team](docs/TEAM.md)**

## Documentation

- **[User Guide](docs/USER_GUIDE.md)**: Logic and workflow for all roles (Super Admin, Site Admin, Field Worker, Gov Authority).
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)**: Technical architecture, setup, and code structure.
- **[Alert System](docs/ALERT_SYSTEM.md)**: Detailed breakdown of the real-time alert and connectivity system.
- **[API Routes](docs/API_ROUTES.md)**: API reference for Backend services.
- **[ML Integration](docs/ML_INTEGRATION.md)**: ML model details and integration points.
- **[Risk Map Features](docs/RISK_MAP.md)**: Manual weather controls and risk explanation logic.

## Getting Started

### 1. Backend
```bash
cd backend
npm install
# Setup .env with DB credentials
npm start
```

### 2. ML Service (sih2025)
```bash
cd sih2025
pip install -r requirements.txt
python -m src.main
```

### 3. Mobile App
```bash
cd mobile-app
npm install
npm start
```

### 4. Web App
```bash
cd web-app
npm install
npm run dev
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

