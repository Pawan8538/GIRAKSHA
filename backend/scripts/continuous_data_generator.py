import os
import time
import random
import psycopg2
from datetime import datetime
import sys

# Database connection string
DATABASE_URL = "postgresql://postgres.whuqdlkjwpjpovcxewig:Sih12345SIH@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def fetch_sensors(conn):
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, sensor_type FROM sensors")
        sensors = cur.fetchall()
        cur.close()
        return sensors
    except Exception as e:
        print(f"Error fetching sensors: {e}")
        return []

def generate_reading(sensor_type):
    if sensor_type == 'displacement':
        # Random value between 0.0 and 5.0 mm
        return round(random.uniform(0.0, 5.0), 2)
    elif sensor_type == 'pore_pressure':
        # Random value between 20.0 and 80.0 kPa
        return round(random.uniform(20.0, 80.0), 1)
    elif sensor_type == 'vibration':
        # Random value between 0.001 and 0.05 g
        return round(random.uniform(0.001, 0.05), 3)
    elif sensor_type == 'rain_gauge':
        # Random value between 0.0 and 10.0 mm (mostly 0)
        if random.random() > 0.8:
            return round(random.uniform(0.1, 10.0), 1)
        return 0.0
    elif sensor_type == 'tiltmeter':
        # Random value between -2.0 and 2.0 degrees
        return round(random.uniform(-2.0, 2.0), 2)
    else:
        return round(random.uniform(0, 100), 2)

def main():
    print("🚀 Starting Continuous Sensor Data Generator...")
    print(f"Connecting to: {DATABASE_URL}")

    conn = get_db_connection()
    if not conn:
        sys.exit(1)

    print("✅ Connected to Database")

    try:
        while True:
            sensors = fetch_sensors(conn)
            if not sensors:
                print("⚠️ No sensors found. Retrying in 5 seconds...")
                time.sleep(5)
                continue

            cur = conn.cursor()
            count = 0
            
            for sensor_id, sensor_type in sensors:
                value = generate_reading(sensor_type)
                timestamp = datetime.now()
                
                try:
                    cur.execute(
                        "INSERT INTO readings (sensor_id, value, recorded_at) VALUES (%s, %s, %s)",
                        (sensor_id, value, timestamp)
                    )
                    count += 1
                except Exception as e:
                    print(f"Error inserting reading for sensor {sensor_id}: {e}")
            
            conn.commit()
            cur.close()
            
            print(f"[{datetime.now().strftime('%H:%M:%S')}] 📡 Generated {count} new readings for {len(sensors)} sensors.")
            
            # Wait for 5 seconds before next batch
            time.sleep(5)

    except KeyboardInterrupt:
        print("\n🛑 Stopping generator...")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
    finally:
        if conn:
            conn.close()
            print("Database connection closed.")

if __name__ == "__main__":
    main()
