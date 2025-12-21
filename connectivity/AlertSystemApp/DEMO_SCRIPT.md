# 60-Second Demo Script for Judges

**Objective:** Demonstrate Worker Band ACK flow and NO-ACK escalation to Siren using the Android app over local hotspot (simulating production LoRa system behavior).

---

## Pre-Demo Setup (5 minutes before)

### Devices Required
- 2 Android phones as **Workers** (worker1, worker2)
- 1 Android phone as **Siren**
- 1 Laptop running Node.js server

### Checklist
- [ ] Laptop: WiFi hotspot active, server running on port 3000
- [ ] Laptop: Note IP address (e.g., 192.168.43.1)
- [ ] All phones: Connected to laptop hotspot
- [ ] Worker phones: App open, role=Worker, connected, showing zones
- [ ] Siren phone: App open, role=Siren, **AUDIO ENABLED**, connected
- [ ] Siren phone: Test alarm verified (working sound)
- [ ] All phones: Battery >50%, volume HIGH, screen brightness HIGH
- [ ] Laptop dashboard: Open and ready to trigger alerts

---

## Demo Script (60 seconds)

### [0:00 - 0:10] Introduction (10s)

**SAY:**
> "We have an earthquake alert system with Worker Bands that vibrate when sensors detect seismic activity.  
> These two phones represent field workers in Unit-3.  
> **Production uses LoRa radios at 9600 baud**—today we're demonstrating over WiFi with identical application logic."

**SHOW:**
- Hold up 2 Worker phones
- Point to "Sensor data via LoRa @ 9600 baud" text on screen

---

### [0:10 - 0:20] Trigger Alert (10s)

**SAY:**
> "I'll now simulate an earthquake: magnitude 3.0 at Unit-3."

**DO:**
1. Laptop dashboard: Press **"Start Earthquake"** or **"Create Alert"**
2. Enter zone: `Unit-3`, magnitude: `3.0`
3. Click **Create**

**SHOW:**
- Server logs showing alert created

---

### [0:20 - 0:30] Worker Receives & ACKs (10s)

**OBSERVE:**
- Both Worker phones **vibrate** (3 pulses, 400ms each)
- Alert cards appear with countdown timer

**SAY:**
> "Both workers' bands vibrate immediately—**3 pulses transmitted via LoRa at 9600 baud**.  
> Worker 1 acknowledges within 15 seconds..."

**DO:**
- Worker1 phone: Press **big green ACK button**

**OBSERVE:**
- Worker1: Vibration stops, alert marked "ACKed" in log
- Laptop logs: Show ACK received from worker1

**SAY:**
> "Worker 1 ACKed—**uplink sent via LoRa**, escalation cancelled for their alert."

---

### [0:30 - 0:45] NO-ACK Escalation (15s)

**SAY:**
> "Worker 2 is unresponsive—let's see what happens..."

**OBSERVE:**
- Worker2 phone: Countdown timer expires (0s)
- Worker2: Alert marked "Escalated"

**SAY (at ~0:40):**
> "No ACK from Worker 2 after 15 seconds—system **automatically escalates to siren**..."

**OBSERVE:**
- Siren phone: **Alarm plays** (loud)
- Siren phone: Shows "🚨 SIREN ACTIVE: Unit-3"

**SAY:**
> "The siren alerts supervisors that Worker 2 needs assistance."

---

### [0:45 - 0:55] Siren Cancel (10s)

**SAY:**
> "Once we verify Worker 2, we cancel the siren from the control center..."

**DO:**
- Laptop dashboard: Press **sirenCancel** button (or Worker2 ACKs)

**OBSERVE:**
- Siren phone: Alarm **stops immediately**
- Siren phone: "SIREN ACTIVE" card disappears

**SAY:**
> "Siren cancelled. Incident resolved."

---

### [0:55 - 1:00] Wrap-Up (5s)

**SAY:**
> "That's our complete alert flow: **sensor → vibrate → ACK → escalation**—all driven by LoRa at 9600 baud in production.  
> This demo uses WiFi, but the **timing, ACK logic, and escalation rules are identical**."

**SHOW:**
- Alert logs on all 3 phones showing timestamps
- (Optional) Show laptop logs with complete event timeline

---

## Backup Plan (If Technical Issues)

### If WiFi fails:
> "Due to network issues, I'll narrate the flow using our laptop dashboard logs..."  
→ Show pre-recorded video or screenshots

### If vibration fails:
> "This device doesn't support vibration—notice the visual flash and on-screen alert..."  
→ Point to visual fallback

### If audio fails:
> "Audio isn't playing, but the siren logic triggered—see the active status..."  
→ Show siren active screen without sound

---

## Key Points to Emphasize

1. **LoRa 9600 Baud:**  
   "Production data transmitted at 9600 baud via LoRa, not WiFi"

2. **Identical Logic:**  
   "WiFi replaces radio layer only—app logic, timeouts, escalation identical to production"

3. **Real-World Scenario:**  
   "Worker incapacitated → no ACK → automatic escalation saves lives"

4. **Latency:**  
   "Alert to vibration: <1 second. ACK to server: <1 second. Escalation: 15s timeout."

---

## Post-Demo Q&A Prep

**Q: Why use phones instead of real bands?**  
A: "For SIH demo reliability. Production uses custom wearable hardware with LoRa radios. Same application logic."

**Q: What if network fails?**  
A: "LoRa doesn't need internet—900MHz radio, 10km range. WiFi here is just for demo."

**Q: How do you prevent false positives?**  
A: "Multi-sensor correlation, ML risk engine, and configurable ACK timeouts per severity."

**Q: Battery life?**  
A: "Production wearable: 48hr standby, LoRa ultra-low power. These phones are just for demo."

---

## Timing Breakdown

| Time | Action | Duration |
|------|--------|----------|
| 0:00-0:10 | Intro + show devices | 10s |
| 0:10-0:20 | Trigger alert (laptop) | 10s |
| 0:20-0:30 | Worker1 ACK | 10s |
| 0:30-0:45 | Worker2 NO-ACK + siren | 15s |
| 0:45-0:55 | Siren cancel | 10s |
| 0:55-1:00 | Wrap-up | 5s |
| **Total** | | **60s** |

---

## Rehearsal Checklist

Before final demo:
- [ ] Run through script 3x with full setup
- [ ] Measure actual latencies (alert → vibrate, ACK → confirm)
- [ ] Test both ACK and NO-ACK paths
- [ ] Verify siren audio volume adequate for room
- [ ] Practice laptop dashboard navigation (no fumbling)
- [ ] Prepare backup screenshots/video
- [ ] Charge all devices to 100%
- [ ] Test in demo venue WiFi environment

---

**Good luck! Keep it simple, clear, and focused on the ACK/NO-ACK flow.**
