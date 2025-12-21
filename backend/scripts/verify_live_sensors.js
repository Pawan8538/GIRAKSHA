const axios = require('axios');

async function verifyLive() {
    console.log("🔍 Verifying Python Sensor Stream (http://127.0.0.1:8000/sensors/live)...");

    for (let i = 0; i < 5; i++) {
        try {
            const res = await axios.get('http://127.0.0.1:8000/sensors/live');
            if (res.data.ok) {
                const sensors = res.data.data;
                // Print a few sensors to show change
                const s1 = sensors.find(s => s.type === 'displacement') || sensors[0];
                const s2 = sensors.find(s => s.type === 'pore_pressure') || sensors[1];

                console.log(`\n⏱️  Tick ${i + 1} (${res.data.timestamp})`);
                console.log(`   Sensor ${s1.sensor_id} (${s1.type}): ${getErrorVal(s1).toFixed(4)}`);
                console.log(`   Sensor ${s2.sensor_id} (${s2.type}): ${getErrorVal(s2).toFixed(4)}`);
            } else {
                console.log("❌ API Response Error:", res.data);
            }
        } catch (error) {
            console.error("❌ Request Failed:", error.message, error.response?.data || '');
        }
        // Wait 1 second
        await new Promise(r => setTimeout(r, 1000));
    }
}

function getErrorVal(s) {
    if (s.type === 'displacement') return s.values.disp_mm;
    if (s.type === 'pore_pressure') return s.values.pore_kpa;
    if (s.type === 'vibration') return s.values.vibration_g;
    if (s.type === 'tilt') return s.values.tilt_deg;
    return 0;
}

verifyLive();
