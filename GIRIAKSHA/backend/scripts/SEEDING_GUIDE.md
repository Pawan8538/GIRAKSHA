# Database Seeding Guide

This guide explains how to populate your GeoGuard database with sensor data.

## Quick Start

```bash
cd backend
node scripts/seed-sensors.js
```

## Available Scripts

### 1. `seed-sensors.js` - Main Seeding Script

Populates all slopes with a standard set of sensors.

**Usage:**
```bash
# Add sensors to slopes (skips existing)
node scripts/seed-sensors.js

# Force recreate all sensors (WARNING: deletes existing data)
node scripts/seed-sensors.js --force

# Show help
node scripts/seed-sensors.js --help
```

**What it creates per slope:**
- 2× Displacement Sensors (mm)
- 2× Rain Gauges (mm)
- 2× Pore Pressure Sensors (kPa)
- 1× Vibration Sensor (m/s²)
- 1× Seismic Sensor (Hz)
- 2× Tiltmeters (deg)

**Total: 10 sensors per slope**

### 2. `check-sensors.js` - Database Inspection

View current sensor status in the database.

```bash
node scripts/check-sensors.js
```

Shows:
- Total slopes and sensors
- Detailed sensor list with status
- Reading counts

## Implementation Steps

### Step 1: Fresh Database Setup

If you're setting up a new database:

```bash
# 1. Create database and run schema
psql -U postgres -c "CREATE DATABASE geoguard;"
psql -U postgres -d geoguard -f database/schema.sql

# 2. Create at least one slope (mine)
# Use the web app or run SQL:
psql -U postgres -d geoguard -c "
INSERT INTO slopes (name, description, location, risk_level)
VALUES ('Limestone Mine - Dindigul', 'Primary test mine', 
        ST_SetSRID(ST_MakePoint(79.1564, 11.1022), 4326), 'medium');
"

# 3. Seed sensors
cd backend
node scripts/seed-sensors.js
```

### Step 2: Existing Database

If you already have slopes but need sensors:

```bash
cd backend
node scripts/seed-sensors.js
```

The script will:
- ✓ Skip sensors that already exist
- ✓ Only create missing sensors
- ✓ Safe to run multiple times

### Step 3: Reset All Sensors

If you need to start fresh:

```bash
cd backend
node scripts/seed-sensors.js --force
```

⚠️ **WARNING**: This deletes ALL sensors and readings!

### Step 4: Verify

```bash
# Check database
node scripts/check-sensors.js

# Or start the backend and check the API
npm run dev

# Then visit: http://localhost:3000/dashboard/sensors
```

## Customizing Sensor Templates

Edit `scripts/seed-sensors.js` and modify the `SENSOR_TEMPLATES` array:

```javascript
const SENSOR_TEMPLATES = [
    { name: 'Custom Sensor 1', type: 'displacement', unit: 'mm' },
    { name: 'Custom Sensor 2', type: 'custom_type', unit: 'units' },
    // Add more...
];
```

**Supported sensor types:**
- `displacement` - Measures slope movement
- `pore_pressure` - Monitors water pressure
- `vibration` - Detects ground vibrations
- `rain_gauge` - Rainfall measurement
- `seismic` - Earthquake/blast detection
- `tilt` - Slope angle changes

## Automation

### Add to package.json

```json
{
  "scripts": {
    "seed": "node scripts/seed-sensors.js",
    "seed:force": "node scripts/seed-sensors.js --force",
    "db:check": "node scripts/check-sensors.js"
  }
}
```

Then run:
```bash
npm run seed
npm run db:check
```

### Docker/CI Integration

Add to your deployment scripts:

```bash
#!/bin/bash
# deploy.sh

# Run migrations
npm run migrate

# Seed sensors if needed
node scripts/seed-sensors.js

# Start application
npm start
```

## Troubleshooting

### "No slopes found"
**Solution**: Create slopes first via web app or SQL.

### "Permission denied"
**Solution**: Ensure database user has INSERT permissions.

### "Sensor already exists" (when using --force)
**Solution**: The script should handle this. Check for database connection issues.

### Sensors not appearing in UI
**Possible causes:**
1. User's `slope_id` doesn't match sensor's `slope_id`
2. Sensors are marked as `is_active = false`
3. Frontend not fetching correctly

**Debug:**
```bash
node scripts/check-sensors.js
# Check if sensors exist and are active
```

## Production Deployment

### Option 1: Manual Seeding

```bash
# On production server
cd /path/to/geoguard/backend
NODE_ENV=production node scripts/seed-sensors.js
```

### Option 2: Migration Script

Create a migration file:

```javascript
// migrations/005_seed_sensors.js
const { seedSensors } = require('../scripts/seed-sensors');

module.exports = {
  up: async () => {
    await seedSensors();
  },
  down: async () => {
    // Optional: cleanup logic
  }
};
```

### Option 3: API Endpoint

The backend already has a demo data endpoint:

```bash
POST /admin/demo-data
```

This creates basic sensors but is less comprehensive than the seeding script.

## Best Practices

1. **Always backup before using `--force`**
   ```bash
   pg_dump geoguard > backup_$(date +%Y%m%d).sql
   ```

2. **Test in development first**
   - Run seeding on dev database
   - Verify in UI
   - Then deploy to production

3. **Version control your templates**
   - Keep `SENSOR_TEMPLATES` in sync with your requirements
   - Document any custom sensor types

4. **Monitor sensor simulator**
   - Ensure `sensorSimulator.js` is running
   - Check that readings are being generated

## Related Files

- `backend/scripts/seed-sensors.js` - Main seeding script
- `backend/scripts/check-sensors.js` - Database inspection
- `backend/src/services/sensorSimulator.js` - Real-time data generation
- `backend/src/models/queries.js` - Database queries
- `database/schema.sql` - Database schema

## Support

For issues or questions:
1. Check `node scripts/check-sensors.js` output
2. Review backend logs
3. Verify database connection in `.env`
4. Check sensor simulator is running
