const axios = require('axios');

async function debugProxy() {
    console.log("🔍 Debugging Proxy Connection...");
    const url = 'http://127.0.0.1:8000/sensors/live';

    try {
        console.time("Request");
        const res = await axios.get(url, { timeout: 2000 });
        console.timeEnd("Request");

        console.log("✅ Success!");
        console.log("Status:", res.status);
        console.log("Data:", JSON.stringify(res.data).substring(0, 100) + "...");
    } catch (error) {
        console.timeEnd("Request");
        console.error("❌ Failed!");
        console.error("Message:", error.message);
        if (error.code) console.error("Code:", error.code);
        if (error.response) {
            console.error("Response:", error.response.status, error.response.data);
        }
    }
}

debugProxy();
