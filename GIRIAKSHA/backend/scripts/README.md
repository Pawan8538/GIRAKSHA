# Database Seeding - Quick Reference

## Common Commands

```bash
# Navigate to backend
cd backend

# Seed sensors (safe, skips existing)
npm run seed

# Check database status
npm run db:check

# Force recreate all sensors (⚠️ DELETES DATA)
npm run seed:force
```

## First Time Setup

```bash
# 1. Ensure database exists
# 2. Run schema
psql -U postgres -d geoguard -f database/schema.sql

# 3. Create a slope via web app or SQL
# 4. Seed sensors
npm run seed

# 5. Start backend (sensor simulator auto-starts)
npm run dev
```

## What Gets Created

**Per Slope (10 sensors):**
- 2× Displacement Sensors
- 2× Rain Gauges  
- 2× Pore Pressure Sensors
- 1× Vibration Sensor
- 1× Seismic Sensor
- 2× Tiltmeters

## Verification

```bash
# Check sensors
npm run db:check

# View in browser
http://localhost:3000/dashboard/sensors
```

## Troubleshooting

**No sensors showing?**
1. Run `npm run db:check` - verify sensors exist
2. Check user's `slope_id` matches sensors
3. Refresh browser (Ctrl+F5)

**Need to reset?**
```bash
npm run seed:force
# Type 'yes' to confirm
```

## Files

- `scripts/seed-sensors.js` - Main script
- `scripts/check-sensors.js` - Inspection tool
- `scripts/SEEDING_GUIDE.md` - Full documentation
