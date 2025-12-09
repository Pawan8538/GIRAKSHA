const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
// You might need a valid token here. For now, we will just check if the routes exist by hitting them and checking for 401 (Unauthorized) which means the route is there but protected.
// If it returns 404, then the route is missing.

async function verify() {
    try {
        console.log("Verifying /tasks/all endpoint...");
        try {
            await axios.get(`${API_URL}/tasks/all`);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log("✅ /tasks/all exists (got 401 as expected without token)");
            } else if (error.response && error.response.status === 404) {
                console.error("❌ /tasks/all returned 404 - Route NOT found");
            } else {
                console.log(`⚠️ /tasks/all returned ${error.response?.status} - ${error.message}`);
            }
        }

        console.log("Verifying /tasks endpoint (Create Task)...");
        try {
            await axios.post(`${API_URL}/tasks`, {});
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log("✅ POST /tasks exists (got 401 as expected without token)");
            } else if (error.response && error.response.status === 404) {
                console.error("❌ POST /tasks returned 404 - Route NOT found");
            } else {
                console.log(`⚠️ POST /tasks returned ${error.response?.status} - ${error.message}`);
            }
        }

    } catch (e) {
        console.error("Verification script failed:", e.message);
    }
}

verify();
