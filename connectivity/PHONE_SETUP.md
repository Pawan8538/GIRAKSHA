# ✅ Phone Configuration Guide

## Your Server IP: **10.0.75.150:3000**

All phones must use this exact IP!

---

## Phone 1 - Worker (Band) #1

```
Role: Worker (Band)
Server IP: 10.0.75.150:3000
Zones: Unit-1,Unit-2,Unit-3
Worker ID: worker1
```
Press **Connect** → Should see 🟢 Connected

---

## Phone 2 - Worker (Band) #2

```
Role: Worker (Band)
Server IP: 10.0.75.150:3000
Zones: Unit-1,Unit-2,Unit-3
Worker ID: worker2
```
Press **Connect**

---

## Phone 3 - Siren

```
Role: Siren
Server IP: 10.0.75.150:3000
Zones: Unit-1,Unit-2,Unit-3
Worker ID: (leave empty)
```
Press **Connect**, then **"Enable Audio"** button

---

## Test Connection First:

On any Android phone, open browser and go to:
**http://10.0.75.150:3000**

You should see the dashboard. If you do, the network is working!

---

## Demo Test:

1. Open laptop browser: http://10.0.75.150:3000
2. Enter Zone: `Unit-3`, Severity: `3`
3. Click "Create Alert"
4. Worker phones should vibrate!
5. Press ACK on one, let other timeout
6. Siren should play alarm

---

**All phones connected to the same Android hotspot?** ✓  
**Laptop connected to same hotspot?** ✓  
**Server running?** ✓  
**Ready to go!** 🚀
