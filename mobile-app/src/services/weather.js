import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export const weatherService = {
    async getCurrentWeather() {
        try {
            // Get token if needed (though forecast might be protected)
            const token = await AsyncStorage.getItem('userToken');

            // Call Backend API
            // Use a default slope ID (e.g., '1' for the demo mine)
            console.log(`[WeatherService] Fetching from: ${API_URL}/ml/forecast`);
            const response = await axios.post(
                `${API_URL}/ml/forecast`,
                { slopeId: '1' },
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    timeout: 10000 // 10s timeout
                }
            );

            if ((response.data.success || response.data.ok) && response.data.data) {
                const { current_assessment, forecast_details, timestamps } = response.data.data;
                const impact = current_assessment.weather_impact || {};

                // Helper to check valid number (including 0)
                const isValid = (val) => val !== undefined && val !== null;

                // Map Backend Data to UI Format
                return {
                    temp: isValid(impact.temp_c) ? `${Math.round(impact.temp_c)}°C` : '--°C',
                    humidity: '65%', // Placeholder (Backend doesn't send humidity yet)
                    wind: isValid(impact.wind_speed) ? `${Math.round(impact.wind_speed)} km/h` : '0 km/h',
                    rain: isValid(impact.rainfall_24h) ? `${impact.rainfall_24h.toFixed(1)} mm` : '0 mm',
                    precipitation: isValid(impact.rainfall_72h) ? `${impact.rainfall_72h.toFixed(1)} mm` : '0 mm',

                    // Map next 3 days of forecast using full details
                    forecast: (forecast_details || []).slice(0, 3).map((item) => {
                        const date = new Date(item.timestamp);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        const code = item.weather?.code || 0;
                        const temp = item.weather?.temp_c;

                        // Simple icon mapping
                        let icon = 'cloud';
                        if (item.weather?.rain_mm > 0.5) icon = 'rain';
                        else if (code <= 1) icon = 'sun';

                        return {
                            day: dayName,
                            temp: isValid(temp) ? `${Math.round(temp)}°C` : '--°C',
                            icon: icon
                        };
                    })
                };
            }

            throw new Error('Invalid backend response');

        } catch (error) {
            console.error('Failed to fetch weather from backend:', error.message);
            // Fallback
            return {
                temp: '--°C',
                humidity: '--%',
                wind: '-- km/h',
                rain: '-- mm',
                forecast: []
            };
        }
    }
}
