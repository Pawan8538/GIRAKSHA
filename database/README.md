# Database Setup

This directory contains the SQL scripts and migrations for the GeoGuard PostgreSQL database.

## Files

- **`schema.sql`**: The specific schema definition for tables, indexes, and constraints.
- **`migrations/`**: Directory containing incremental changes to the database schema.

## Setup

1. Ensure PostgreSQL is installed and running.
2. Create a database named `geoguard`.
3. Run the schema script:

```bash
psql -U postgres -d geoguard -f schema.sql
```

## Tables
- `users`: Stores user credentials and roles.
- `sensors`: Registry of IoT sensors.
- `measurements`: Time-series data from sensors.
- `alerts`: System generated alerts.
- `complaints`: User reported issues.
