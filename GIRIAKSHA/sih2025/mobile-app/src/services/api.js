// src/services/api.js
import { calculateRiskGrid, getRiskAssessment, fetchWeatherData } from './RiskEngine';

// Android Emulator with 'adb reverse tcp:8000 tcp:8000'
// Standard Android Emulator Host Loopback
// Public Internet URL (Tunnel to Localhost)
const API_BASE_URL = 'https://cute-days-tease.loca.lt';

// Helper for robust fetching with timeout
const fetchWithRetry = async (url, options = {}, retries = 3, timeout = 15000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await Promise.race([
                fetch(url, options),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
            ]);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`API Success: ${url}`, data);
            return data;
        } catch (error) {
            console.warn(`Attempt ${i + 1} failed for ${url}: ${error.message}`);
            if (i === retries - 1) throw error;
            // Wait before retrying (exponential backoff)
            await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
        }
    }
};

// 3. Fetch Sensor Data (Simulated)
export const fetchSensorData = async () => {
    // Return empty or simulated data if needed by other components
    return [];
};

// 2. Fetch Current Risk Assessment (Local Calculation)
export const fetchCurrentRisk = async () => {
    try {
        const data = await getRiskAssessment();
        return data;
    } catch (error) {
        console.error("Risk Assessment Error:", error);
        return null;
    }
};

// 1. Fetch Risk Grid (Local Calculation)
export const fetchRiskGrid = async () => {
    try {
        console.log("Calculating local risk grid...");
        const data = await calculateRiskGrid();
        return data;
    } catch (error) {
        console.error("Risk Engine Error:", error);
        return null;
    }
};

export const triggerSimulationEvent = async (type) => {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/sim/event/${type}`, { method: 'POST' });
    } catch (error) {
        console.error('Error triggering simulation:', error);
        throw error;
    }
};

export const uploadImageForAnalysis = async (imageUri) => {
    try {
        const formData = new FormData();
        formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg', // Adjust based on actual image type
            name: 'upload.jpg',
        });

        const response = await fetch(`${API_BASE_URL}/analyze/image`, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
};
