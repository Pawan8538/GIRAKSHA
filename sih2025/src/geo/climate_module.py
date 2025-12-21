# src/geo/climate_module.py

import httpx
import random
from datetime import datetime

class ClimateRiskEngine:
    def __init__(self, api_key="d35fba280190f0e95977742016f32cb4", lat=11.1053, lon=79.1506):
        """
        Initialize Climate Risk Engine
        Default coordinates: 11°06'19"N 79°09'02"E (Mine location in Tamil Nadu, India)
        """
        self.api_key = api_key
        self.lat = lat
        self.lon = lon
        
        # Risk weights and thresholds
        self.impact_weights = {
            'rainfall_24h': 0.35, 'rainfall_72h': 0.25, 'rain_intensity': 0.20,
            'conditions': 0.10, 'humidity_wind': 0.10
        }
        self.thresholds = {
            'heavy_rain_24h': 30.0, 'moderate_rain_24h': 15.0,
            'saturation_72h': 60.0, 'intense_rain': 12.0, 'critical_intensity': 20.0
        }

    async def get_weather_data(self):
        """Fetch real weather data from OpenWeatherMap API (async to prevent blocking)"""
        try:
            url = f"http://api.openweathermap.org/data/2.5/forecast?lat={self.lat}&lon={self.lon}&appid={self.api_key}&units=metric"
            
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(url)
                
            if response.status_code == 200:
                data = response.json()
                result = self._parse_api_response(data)
                print(f"✅ Real weather data fetched for coordinates ({self.lat}, {self.lon})")
                return result
            else:
                print(f"⚠️ Weather API returned status {response.status_code}, using simulation")
                return self._get_simulated_weather()
        except Exception as e:
            print(f"⚠️ Weather API Error: {e}, switching to robust simulation")
            return self._get_simulated_weather()

    def _parse_api_response(self, data):
        """Extract relevant metrics from API response"""
        current = data['list'][0]
        return {
            'temperature': current['main']['temp'],
            'rainfall_24h': self._sum_rain(data, 24),
            'rainfall_72h': self._sum_rain(data, 72),
            'max_rain_intensity': self._max_intensity(data),
            'humidity': current['main']['humidity'],
            'wind_speed': current['wind']['speed'],
            'weather_condition': current['weather'][0]['main'],
            'data_source': 'REAL_API'
        }

    def _sum_rain(self, data, hours):
        total = 0.0
        steps = hours // 3
        for i in range(min(steps, len(data['list']))):
            if 'rain' in data['list'][i]:
                total += data['list'][i]['rain'].get('3h', 0)
        return round(total, 2)

    def _max_intensity(self, data):
        max_int = 0.0
        for item in data['list']:
            if 'rain' in item:
                # 3h volume / 3 = mm/hr
                intensity = item['rain'].get('3h', 0) / 3.0
                max_int = max(max_int, intensity)
        return round(max_int, 2)

    def _get_simulated_weather(self):
        """Fallback simulation for demo/offline"""
        return {
            'temperature': random.uniform(25, 35),
            'rainfall_24h': round(random.uniform(0, 50), 2),
            'rainfall_72h': round(random.uniform(0, 120), 2),
            'max_rain_intensity': round(random.uniform(0, 25), 2),
            'humidity': random.uniform(60, 90),
            'wind_speed': random.uniform(5, 20),
            'weather_condition': random.choice(['Clear', 'Rain', 'Clouds', 'Thunderstorm']),
            'data_source': 'SIMULATED'
        }

    async def calculate_weather_risk(self, base_risk):
        """Calculate how weather modifies the base geotechnical risk"""
        weather = await self.get_weather_data()
        
        # Normalize factors (0.0 to 1.0)
        rain_24 = min(weather['rainfall_24h'] / 50.0, 1.0)
        rain_72 = min(weather['rainfall_72h'] / 100.0, 1.0)
        intensity = min(weather['max_rain_intensity'] / 25.0, 1.0)
        
        cond_map = {'Thunderstorm': 1.0, 'Rain': 0.6, 'Drizzle': 0.3, 'Clouds': 0.1, 'Clear': 0.0}
        cond_score = cond_map.get(weather['weather_condition'], 0.0)
        
        # Weighted impact score
        impact = (
            rain_24 * self.impact_weights['rainfall_24h'] +
            rain_72 * self.impact_weights['rainfall_72h'] +
            intensity * self.impact_weights['rain_intensity'] +
            cond_score * self.impact_weights['conditions']
        )
        
        # Context multiplier: Weather matters more if base risk is already high
        if base_risk >= 0.7: multiplier = 0.6
        elif base_risk >= 0.5: multiplier = 0.4
        elif base_risk >= 0.3: multiplier = 0.3
        else: multiplier = 0.2
        
        enhanced_risk = min(1.0, base_risk + (impact * multiplier))
        
        return {
            'base_risk': base_risk,
            'enhanced_risk': round(enhanced_risk, 4),
            'weather_impact': round(impact, 4),
            'weather_data': weather,
            'alerts': self._generate_alerts(enhanced_risk, weather)
        }

    def _generate_alerts(self, risk, weather):
        alerts = []
        if risk >= 0.8:
            alerts.append("🔴 CRITICAL: Weather exacerbating high risk - EVACUATE")
        elif risk >= 0.6:
            alerts.append("🟠 HIGH: Suspend operations due to weather/ground conditions")
            
        if weather['rainfall_24h'] > 30:
            alerts.append(f"🌧️ Heavy Rain ({weather['rainfall_24h']}mm) - Check drainage")
        if weather['max_rain_intensity'] > 20:
            alerts.append(f"⛈️ Critical Rain Intensity ({weather['max_rain_intensity']}mm/h)")
            
        return alerts

if __name__ == "__main__":
    engine = ClimateRiskEngine()
    result = engine.calculate_weather_risk(base_risk=0.4)
    print(json.dumps(result, indent=2))
