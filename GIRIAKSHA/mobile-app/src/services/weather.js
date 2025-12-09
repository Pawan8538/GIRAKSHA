import axios from 'axios'

// Demo Mine Coordinates
const LAT = 11.1022
const LNG = 79.1564

export const weatherService = {
    async getCurrentWeather() {
        try {
            // Fetch current weather from Open-Meteo (Free, No Key)
            const response = await axios.get(
                `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
            )

            const current = response.data.current
            const daily = response.data.daily

            return {
                temp: `${Math.round(current.temperature_2m)}°C`,
                humidity: `${current.relative_humidity_2m}%`,
                wind: `${current.wind_speed_10m} km/h`,
                rain: `${current.rain} mm`,
                precipitation: `${current.precipitation} mm`,
                forecast: daily.time.slice(0, 3).map((time, index) => ({
                    day: new Date(time).toLocaleDateString('en-US', { weekday: 'short' }),
                    temp: `${Math.round(daily.temperature_2m_max[index])}°C`,
                    rain: daily.precipitation_sum[index] > 0,
                    icon: daily.precipitation_sum[index] > 2 ? 'rain' : daily.precipitation_sum[index] > 0 ? 'cloud' : 'sun'
                }))
            }
        } catch (error) {
            console.error('Failed to fetch weather:', error)
            // Fallback if API fails
            return {
                temp: '--°C',
                humidity: '--%',
                wind: '-- km/h',
                rain: '-- mm',
                forecast: []
            }
        }
    }
}
