# Connection Troubleshooting & Sensor Setup

## Issue: Phones Can't Connect

**Problem:** Phones showing "connecting" then error

**Most likely causes:**
1. Wrong IP address (192.0.0.2 might not be the hotspot IP)
2. Phones not on the same hotspot as laptop
3. Firewall blocking connections

## Finding the Correct IP

Run on your laptop:
```bash
# Check all IPs
ifconfig | grep "inet " | grep -v 127.0.0.1

# The IP should be something like:
# - 172.20.10.x (if iPhone hotspot)
# - 192.168.43.x (if Android hotspot)
# - 192.168.137.x (Windows hotspot)
```

## Quick Fix Steps:

1. **On phone creating hotspot:** Note the hotspot name

2. **On laptop:** Verify connected to that exact hotspot

3. **Find laptop IP on hotspot network:**
   ```bash
   ifconfig en0 | grep "inet " || ifconfig en1 | grep "inet "
   ```

4. **Update server** if needed and restart

5. **On phones:** Use the CORRECT IP address (not 192.0.0.2)

---

## Sensor Integration (Your New Requirement)

You mentioned wanting sensor data from phones - **do you want:**

**Option A: Phone as Sensor Device (NEW)**
- Add accelerometer support to Android app
- Phone detects shaking/movement
- Automatically triggers alerts when earthquake detected
- No laptop needed for triggering

**Option B: Current Setup**
- Keep laptop/dashboard for manual triggering
- Phones are just Worker Bands and Sirens

**Which do you prefer?** If Option A, I can add accelerometer sensor code to detect earthquakes automatically!

---

## Network Setup Clarification

**All phones must:**
1. Be connected to the SAME hotspot
2. Use the SAME server IP (your laptop's IP on that hotspot)
3. Server running on laptop: `node server.js`

**The phones communicate like this:**
```
Phone Hotspot (192.168.x.0/24)
    ├── Laptop (192.168.x.2) ← Running server on :3000
    ├── Worker Phone 1 (192.168.x.3) ← App connects to .2:3000
    ├── Worker Phone 2 (192.168.x.4) ← App connects to .2:3000
    └── Siren Phone (192.168.x.5) ← App connects to .2:3000
```

All phones connect TO the laptop's server IP!
