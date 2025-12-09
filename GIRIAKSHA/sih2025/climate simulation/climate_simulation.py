# SMART INDIA HACKATHON 2025 - WEATHER-ENHANCED MINE SAFETY SYSTEM
import requests
import random
from datetime import datetime, timedelta

# ==================== MINE CONFIGURATION ====================
WEATHER_API_KEY = "d35fba280190f0e95977742016f32cb4"
MINE_LATITUDE = 11.102222
MINE_LONGITUDE = 79.156389
MINE_NAME = "Tamil Nadu Limestone Mine"

RISK_THRESHOLDS = {
    'evacuation': (0.8, 1.0, "🔴 EVACUATE - Critical Risk"),
    'high': (0.6, 0.8, "🟠 HIGH - Stop Operations"),
    'medium': (0.4, 0.6, "🟡 MEDIUM - Enhanced Monitoring"),
    'low': (0.2, 0.4, "🟢 LOW - Normal Operations"),
    'safe': (0.0, 0.2, "✅ SAFE - All Clear")
}

# ==================== INDUSTRY-STANDARD WEATHER IMPACT ====================
class MiningWeatherImpact:
    def __init__(self):
        self.impact_weights = {
            'rainfall_24h': 0.35, 'rainfall_72h': 0.25, 'rain_intensity': 0.20,
            'conditions': 0.10, 'humidity_wind': 0.10
        }
        
        self.thresholds = {
            'heavy_rain_24h': 30.0, 'moderate_rain_24h': 15.0,
            'saturation_72h': 60.0, 'intense_rain': 12.0, 'critical_intensity': 20.0
        }
    
    def calculate_impact(self, base_risk, weather_data):
        # Normalize weather factors to 0-1 scale
        rainfall_24h_norm = min(weather_data['rainfall_24h'] / 50.0, 1.0)
        rainfall_72h_norm = min(weather_data['rainfall_72h'] / 100.0, 1.0)
        intensity_norm = min(weather_data['max_rain_intensity'] / 25.0, 1.0)
        
        # Conditions impact
        conditions_map = {'Thunderstorm': 1.0, 'Rain': 0.6, 'Drizzle': 0.3, 'Clouds': 0.1, 'Clear': 0.0}
        conditions_impact = conditions_map.get(weather_data['weather_condition'], 0.0)
        
        # Humidity + wind impact
        humidity_impact = max(0, (weather_data['humidity'] - 70) / 25.0)
        wind_impact = min(weather_data['wind_speed'] / 25.0, 1.0)
        humidity_wind_norm = min((humidity_impact + wind_impact) / 2.0, 1.0)
        
        # Calculate weighted weather impact
        weather_impact = (
            rainfall_24h_norm * self.impact_weights['rainfall_24h'] +
            rainfall_72h_norm * self.impact_weights['rainfall_72h'] +
            intensity_norm * self.impact_weights['rain_intensity'] +
            conditions_impact * self.impact_weights['conditions'] +
            humidity_wind_norm * self.impact_weights['humidity_wind']
        )
        
        # Context-sensitive risk combination
        if base_risk >= 0.7: risk_multiplier = 0.6
        elif base_risk >= 0.5: risk_multiplier = 0.4
        elif base_risk >= 0.3: risk_multiplier = 0.3
        else: risk_multiplier = 0.2
        
        enhanced_risk = base_risk + (weather_impact * risk_multiplier)
        
        return {
            'enhanced_risk': min(1.0, enhanced_risk),
            'weather_impact': weather_impact,
            'risk_multiplier': risk_multiplier,
            'breakdown': {
                'rainfall_24h_contrib': rainfall_24h_norm * self.impact_weights['rainfall_24h'],
                'rainfall_72h_contrib': rainfall_72h_norm * self.impact_weights['rainfall_72h'],
                'intensity_contrib': intensity_norm * self.impact_weights['rain_intensity'],
                'conditions_contrib': conditions_impact * self.impact_weights['conditions'],
                'humidity_wind_contrib': humidity_wind_norm * self.impact_weights['humidity_wind']
            },
            'impact_factors': self._get_impact_factors(weather_data)
        }
    
    def _get_impact_factors(self, weather_data):
        """Identify key weather factors contributing to risk"""
        factors = []
        
        if weather_data['rainfall_24h'] > self.thresholds['heavy_rain_24h']:
            factors.append(f"Heavy rainfall ({weather_data['rainfall_24h']}mm in 24h)")
        elif weather_data['rainfall_24h'] > self.thresholds['moderate_rain_24h']:
            factors.append(f"Moderate rainfall ({weather_data['rainfall_24h']}mm in 24h)")
        
        if weather_data['rainfall_72h'] > self.thresholds['saturation_72h']:
            factors.append(f"High cumulative rainfall ({weather_data['rainfall_72h']}mm in 72h)")
        
        if weather_data['max_rain_intensity'] > self.thresholds['critical_intensity']:
            factors.append(f"Critical rain intensity ({weather_data['max_rain_intensity']}mm/h)")
        elif weather_data['max_rain_intensity'] > self.thresholds['intense_rain']:
            factors.append(f"High rain intensity ({weather_data['max_rain_intensity']}mm/h)")
        
        if weather_data['weather_condition'] == 'Thunderstorm':
            factors.append("Thunderstorm conditions")
        
        return factors

# ==================== REAL WEATHER FORECAST MANAGER ====================
class RealWeatherForecaster:
    def get_real_forecast(self):
        try:
            url = f"http://api.openweathermap.org/data/2.5/forecast?lat={MINE_LATITUDE}&lon={MINE_LONGITUDE}&appid={WEATHER_API_KEY}&units=metric"
            response = requests.get(url, timeout=10)
            data = response.json()
            
            return {
                'temperature': data['list'][0]['main']['temp'],
                'rainfall_24h': self._calculate_rainfall(data, 24),
                'rainfall_72h': self._calculate_rainfall(data, 72),
                'max_rain_intensity': self._max_rain_intensity(data),
                'humidity': data['list'][0]['main']['humidity'],
                'wind_speed': data['list'][0]['wind']['speed'],
                'weather_condition': data['list'][0]['weather'][0]['main'],
                'pressure': data['list'][0]['main']['pressure'],
                'data_source': 'REAL_API'
            }
        except Exception as e:
            return self._get_realistic_forecast()
    
    def _calculate_rainfall(self, data, hours):
        total_rain = 0.0
        for forecast in data['list']:
            if hours <= 0: break
            if 'rain' in forecast:
                total_rain += forecast['rain'].get('3h', 0)
            hours -= 3
        return round(total_rain, 2)
    
    def _max_rain_intensity(self, data):
        max_intensity = 0.0
        for forecast in data['list']:
            if 'rain' in forecast:
                intensity = forecast['rain'].get('3h', 0) / 3
                max_intensity = max(max_intensity, intensity)
        return round(max_intensity, 2)
    
    def _get_realistic_forecast(self):
        return {
            'temperature': random.uniform(25, 35),
            'rainfall_24h': round(random.uniform(0, 50), 2),
            'rainfall_72h': round(random.uniform(0, 120), 2),
            'max_rain_intensity': round(random.uniform(0, 25), 2),
            'humidity': random.uniform(60, 90),
            'wind_speed': random.uniform(5, 20),
            'weather_condition': random.choice(['Clear', 'Rain', 'Clouds', 'Thunderstorm']),
            'pressure': random.uniform(1000, 1020),
            'data_source': 'SIMULATED'
        }

# ==================== MINE SAFETY ALERT SYSTEM ====================
class MineSafetyAlertSystem:
    def generate_alerts(self, risk_assessment, base_risk, weather_data):
        alerts = []
        enhanced_risk = risk_assessment['enhanced_risk']
        
        # Risk-based emergency protocols
        if enhanced_risk >= 0.8:
            alerts.extend([
                "🚨 IMMEDIATE EVACUATION: All personnel evacuate mining area",
                "🔴 CRITICAL: Stop all operations and machinery",
                "📞 ACTIVATE: Emergency response team and safety officers",
                "📢 EXECUTE: Emergency evacuation protocol"
            ])
        elif enhanced_risk >= 0.6:
            alerts.extend([
                "🟠 HIGH RISK: Suspend all blasting and excavation",
                "⚠️ RESTRICT: Essential personnel only in highwall areas", 
                "📊 ENHANCE: Monitoring frequency to every 30 minutes",
                "👷 DEPLOY: Additional safety observers"
            ])
        elif enhanced_risk >= 0.4:
            alerts.extend([
                "🟡 MEDIUM RISK: Continue with enhanced safety measures",
                "👷 PRECAUTION: Deploy additional spotters in highwall areas",
                "📋 INSPECT: Review slope stability and drainage systems",
                "⏱️ MONITOR: Hourly safety inspections required"
            ])
        
        # Weather-specific alerts
        if weather_data['rainfall_24h'] > 30:
            alerts.append(f"🌧️ HEAVY RAIN ALERT: {weather_data['rainfall_24h']}mm in 24h - Monitor drainage")
        elif weather_data['rainfall_24h'] > 15:
            alerts.append(f"🌧️ RAIN ALERT: {weather_data['rainfall_24h']}mm in 24h - Check drainage")
        
        if weather_data['max_rain_intensity'] > 20:
            alerts.append(f"⛈️ CRITICAL INTENSITY: {weather_data['max_rain_intensity']}mm/h - High erosion risk")
        elif weather_data['max_rain_intensity'] > 12:
            alerts.append(f"⛈️ HIGH INTENSITY: {weather_data['max_rain_intensity']}mm/h - Erosion concern")
        
        if weather_data['weather_condition'] == 'Thunderstorm':
            alerts.append("⚡ LIGHTNING ALERT: Secure equipment and avoid high points")
        
        return alerts

# ==================== MAIN INTEGRATION FUNCTION ====================
def get_weather_enhanced_risk(base_risk_score):
    """
    MAIN FUNCTION TO INTEGRATE WITH YOUR EXISTING SYSTEM
    
    Parameters:
    base_risk_score (float): Risk score from your existing ML model (0.0 to 1.0)
    
    Returns:
    dict: Enhanced risk assessment with weather impact
    """
    # Initialize systems
    weather_forecaster = RealWeatherForecaster()
    impact_calculator = MiningWeatherImpact()
    alert_system = MineSafetyAlertSystem()
    
    # Get real weather data
    weather_data = weather_forecaster.get_real_forecast()
    
    # Calculate weather-enhanced risk
    risk_assessment = impact_calculator.calculate_impact(base_risk_score, weather_data)
    
    # Generate safety alerts
    alerts = alert_system.generate_alerts(risk_assessment, base_risk_score, weather_data)
    
    # Return complete assessment
    return {
        'base_risk': base_risk_score,
        'enhanced_risk': risk_assessment['enhanced_risk'],
        'weather_impact': risk_assessment['weather_impact'],
        'risk_multiplier': risk_assessment['risk_multiplier'],
        'breakdown': risk_assessment['breakdown'],
        'impact_factors': risk_assessment['impact_factors'],
        'weather_data': weather_data,
        'alerts': alerts,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }

def display_single_analysis(assessment):
    """Display single real-time analysis with all detailed output"""
    print("\n" + "="*70)
    print("🏭 REAL-TIME MINE SAFETY ASSESSMENT")
    print("📍 Weather-Enhanced Risk Prediction")
    print("="*70)
    
    print(f"📍 Mine: {MINE_NAME}")
    print(f"📅 Analysis Time: {assessment['timestamp']}")
    print(f"📡 Data Source: {assessment['weather_data']['data_source']}")
    
    # Display base risk (from your existing ML system)
    print(f"\n📊 EXISTING RISK ASSESSMENT:")
    print(f"   • Base Risk Score: {assessment['base_risk']:.2f}")
    print(f"   • Current Level: {get_risk_level(assessment['base_risk'])}")
    
    # Display current weather
    print(f"\n🌤️  CURRENT WEATHER CONDITIONS:")
    print(f"   • Temperature: {assessment['weather_data']['temperature']}°C")
    print(f"   • 24h Rainfall: {assessment['weather_data']['rainfall_24h']}mm")
    print(f"   • 72h Rainfall: {assessment['weather_data']['rainfall_72h']}mm")
    print(f"   • Max Rain Intensity: {assessment['weather_data']['max_rain_intensity']}mm/h")
    print(f"   • Conditions: {assessment['weather_data']['weather_condition']}")
    print(f"   • Humidity: {assessment['weather_data']['humidity']}%")
    print(f"   • Wind Speed: {assessment['weather_data']['wind_speed']} m/s")
    
    # Calculate weather-enhanced risk
    print(f"\n⚖️  WEATHER IMPACT ANALYSIS:")
    print(f"   • Total Weather Impact: +{assessment['weather_impact']:.2f}")
    print(f"   • Risk Context Multiplier: {assessment['risk_multiplier']:.0%}")
    
    if assessment['breakdown']:
        print(f"   • Impact Breakdown:")
        print(f"     - 24h Rainfall: +{assessment['breakdown']['rainfall_24h_contrib']:.3f}")
        print(f"     - 72h Rainfall: +{assessment['breakdown']['rainfall_72h_contrib']:.3f}")
        print(f"     - Rain Intensity: +{assessment['breakdown']['intensity_contrib']:.3f}")
        print(f"     - Conditions: +{assessment['breakdown']['conditions_contrib']:.3f}")
        print(f"     - Humidity/Wind: +{assessment['breakdown']['humidity_wind_contrib']:.3f}")
    
    if assessment['impact_factors']:
        print(f"   • Key Factors: {', '.join(assessment['impact_factors'])}")
    else:
        print(f"   • Key Factors: No significant weather risks")
    
    print(f"\n🎯 ENHANCED RISK ASSESSMENT:")
    print(f"   • Base Risk: {assessment['base_risk']:.2f}")
    print(f"   • Weather Impact: +{assessment['weather_impact'] * assessment['risk_multiplier']:.2f}")
    print(f"   • FINAL RISK: {assessment['enhanced_risk']:.2f}")
    print(f"   • SAFETY LEVEL: {get_risk_level(assessment['enhanced_risk'])}")
    
    # Generate safety alerts
    if assessment['alerts']:
        print(f"\n🛡️  SAFETY PROTOCOLS:")
        for j, alert in enumerate(assessment['alerts'], 1):
            print(f"   {j}. {alert}")
    else:
        print(f"\n✅ ALL CLEAR: Normal operations can continue")
    
    print("="*70)

def get_risk_level(score):
    """Convert risk score to safety level"""
    for level, (min_val, max_val, label) in RISK_THRESHOLDS.items():
        if min_val <= score <= max_val:
            return label
    return "UNKNOWN"

# ==================== USAGE EXAMPLE ====================
if __name__ == "__main__":
    # Example: Your existing ML model provides this base risk
    # REPLACE THIS WITH YOUR ACTUAL ML MODEL OUTPUT
    base_risk_from_your_ml = 0.45
    
    # Get weather-enhanced risk
    assessment = get_weather_enhanced_risk(base_risk_from_your_ml)
    
    # Display single analysis with all detailed output
    display_single_analysis(assessment)