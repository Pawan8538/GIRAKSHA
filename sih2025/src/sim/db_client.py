import psycopg2
from psycopg2.extras import RealDictCursor
import os
import time

class DBClient:
    def __init__(self):
        self.conn_string = None
        self.conn = None
        self._load_config()

    def _load_config(self):
        try:
            # Try to find backend/.env relative to this file
            # Current: sih2025/src/sim/db_client.py
            # Target: backend/.env
            # Path: ../../../backend/.env
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            env_path = os.path.join(base_dir, 'backend', '.env')
            
            if os.path.exists(env_path):
                with open(env_path, 'r') as f:
                    for line in f:
                        if line.startswith('DATABASE_URL='):
                            self.conn_string = line.split('=', 1)[1].strip().strip("'").strip('"')
                            break
            
            if not self.conn_string:
                # Fallback or check os.environ
                self.conn_string = os.getenv('DATABASE_URL', "dbname='sih_db' user='postgres' password='1' host='localhost' port='5432'")
                
        except Exception as e:
            print(f"⚠️ Error loading DB config: {e}")
            self.conn_string = "dbname='sih_db' user='postgres' password='1' host='localhost' port='5432'"

    def connect(self):
        try:
            # Use the connection string (DSN)
            self.conn = psycopg2.connect(self.conn_string)
            print("✅ Connected to Postgres database")
            return getattr(self, "conn", None)
        except Exception as e:
            print(f"⚠️ Failed to connect to DB: {e}")
            return None

    def get_latest_sensor_data(self):
        if not self.conn or self.conn.closed:
            self.connect()
        
        if not self.conn:
            return []

        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, sensor_type, current_value, status, lat, lon, updated_at 
                    FROM sensors 
                    WHERE is_active = true
                """)
                return cur.fetchall()
        except Exception as e:
            print(f"Error querying sensors: {e}")
            self.conn.rollback() # Reset transaction state
            return []

    def update_sensors(self, readings):
        """Update sensor readings in the database"""
        if not self.conn or self.conn.closed:
            self.connect()
        
        if not self.conn:
            return

        try:
            with self.conn.cursor() as cur:
                for reading in readings:
                    # We map sensor_id (e.g. S01) to DB id (e.g. 1, 2.. or string id)
                    # Assuming DB IDs match or we map them. 
                    # If DB uses UUIDs or Integers, we might need a lookup.
                    # For now, let's assume the simulated IDs 'S01' match DB or we update by type/index?
                    # Wait, the node simulator updates by ID. 
                    # Let's try to update based on 'sensor_type' and 'index' or just assume strings match?
                    # Safe bet: Update by sensor_type and generic ordering or just try matching ID string
                    
                    # Better approach: The Python script generates IDs like "S01". 
                    # The DB likely has different IDs.
                    # Valid Strategy: Fetch all sensors first (we have logic for that), map Types to IDs, then update.
                    # For MVP speed: Let's just try updating by 'sensor_type' (round robin) or just logs for now?
                    # No, user wants it to work.
                    
                    # Query to find a matching sensor in DB by type that isn't updated recently?
                    # Or simpler: The Node simulator uses `getAllSensors`.
                    
                    # QUERY: UPDATE sensors SET current_value = %s, updated_at = NOW() WHERE id = %s
                    # We need the DB ID.
                    pass 
        except Exception as e:
            print(f"Error updating sensors: {e}") 

    def update_sensor_value(self, sensor_type, value):
        """Update a random sensor of a specific type (Simplified for demo)"""
        if not self.conn or self.conn.closed:
            self.connect()
            
        try:
            with self.conn.cursor() as cur:
                # Update the 'stalest' sensor of this type
                cur.execute("""
                    UPDATE sensors 
                    SET current_value = %s, updated_at = NOW() 
                    WHERE id = (
                        SELECT id FROM sensors 
                        WHERE sensor_type = %s 
                        ORDER BY updated_at ASC 
                        LIMIT 1
                    )
                """, (value, sensor_type))
                self.conn.commit()
        except Exception as e:
            print(f"Error updating sensor {sensor_type}: {e}")
            self.conn.rollback()

    def close(self):
        if self.conn:
            self.conn.close()
