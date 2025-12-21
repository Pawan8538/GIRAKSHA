# Risk Map Manual Weather Controls - Feature Documentation

## Overview
The Risk Map now includes manual weather control capabilities that allow you to simulate different environmental conditions and see their real-time impact on landslide risk predictions.

## Features Added

### 1. Manual Weather Mode Toggle
- Located at the top of the map screen
- Switch between:
  - **Live Mode**: Uses real weather data from API
  - **Manual Mode**: Allows manual adjustment of weather conditions

### 2. Weather Control Panel
When in Manual Mode, click "Weather" to open the control panel with 4 adjustable parameters:

#### Wind Speed (0-60 km/h)
- Controls wind intensity
- Higher values increase risk for loose materials
- Affects debris displacement potential

#### Sun Intensity (0-100%)
- Controls solar exposure and evaporation
- Low sun + high humidity = sustained soil saturation
- High sun = faster drying and reduced pore pressure

#### Rain (0-50 mm/h)
- Controls precipitation intensity
- Directly impacts soil saturation
- Higher values dramatically increase landslide risk
- Automatically adjusts weather condition classification:
  - 0-2mm: Clear/Clouds
  - 2-10mm: Drizzle
  - 10-20mm: Rain
  - 20+mm: Thunderstorm

#### Humidity (0-100%)
- Controls atmospheric moisture
- High humidity slows soil drying
- Combined with rain, increases saturation duration

### 3. Weather Presets
Quick-apply common scenarios:

- **Clear**: Wind 5 km/h, Sun 90%, Rain 0mm, Humidity 40%
- **Rainy**: Wind 15 km/h, Sun 30%, Rain 15mm, Humidity 75%
- **Storm**: Wind 45 km/h, Sun 10%, Rain 35mm, Humidity 90%

### 4. Cell Risk Explanation
When you tap any cell on the risk map, the detail modal now shows:

**Risk Analysis** section with 1-2 lines explaining:
- Why the risk is at that level
- Which factors are contributing most
- Specific conditions affecting that cell

Example explanations:
- "High risk due to proximity to active mining operations. Sensors detect significant ground movement and high pore pressure."
- "Heavy rainfall has saturated soil, reducing slope stability. Recent rainfall increases pore water pressure."

### 5. Real-Time Risk Updates
- Moving any slider triggers immediate risk recalculation (300ms debounce)
- All cells on the map update their colors based on new conditions
- Statistics update to reflect new risk distribution

## How Risk is Calculated

The risk score for each cell combines:

1. **Mine Proximity (45%)**: Distance from mining center
2. **Geological Factors (35%)**: Static terrain characteristics
3. **Sensor Data (20%)**: Dynamic measurements (displacement, pore pressure, vibration)

Weather impacts all factors through a multiplier:
```
Weather Multiplier = 1.1 + (Weather Impact × 0.8)

Weather Impact =
  (24h Rain / 50) × 0.35 +
  (72h Rain / 100) × 0.25 +
  (Rain Intensity / 25) × 0.20 +
  Weather Condition × 0.10 +
  (Humidity / 100) × 0.10
```

## Risk Explanation Logic

The system analyzes each cell and generates explanations based on:

- **High mine proximity** (>60%): "High risk due to proximity to active mining operations"
- **Geological factors** (>40%): "Geological formation in this area is prone to slope failure"
- **Sensor alerts**:
  - >50%: "Sensors detect significant ground movement and high pore pressure"
  - >30%: "Sensor readings show elevated displacement and vibration levels"
- **Weather impacts**:
  - Heavy rain (>20mm): "Heavy rainfall has saturated soil, reducing slope stability"
  - Moderate rain (>10mm): "Recent rainfall increases pore water pressure"
  - Strong wind (>40 km/h): "Strong winds may trigger loose material displacement"
  - Low sun + high humidity: "Low sun exposure with high humidity maintains soil saturation"

## Integration with Sensor Simulation

Your `Untitled0.ipynb` sensor stream generator can be integrated by:

1. Calling `set_mode('manual')` when manual weather mode is enabled
2. Using `set_manual_conditions()` with the weather control values
3. Applying presets via `apply_preset('clear'/'light_rain'/'heavy_rain'/'storm'/'quake')`

The sensor data influences the **Dynamic Risk** component (20% of total risk).

## Usage Tips

1. **Start with Live Mode** to see current conditions
2. **Switch to Manual Mode** to run "what-if" scenarios
3. **Use Presets** for quick testing of extreme conditions
4. **Adjust individual sliders** for precise scenario modeling
5. **Tap cells** to understand why they have specific risk levels
6. **Watch for color changes** as risk levels shift with weather

## Technical Notes

- Manual weather data bypasses the API cache
- Risk recalculation typically takes <300ms
- All 400 cells (20×20 grid) update simultaneously
- Weather multiplier is capped to prevent unrealistic values
- Cell size: 0.0005° (~55m at this latitude)

## Future Enhancements

Potential additions:
- Temperature control slider
- Soil moisture direct adjustment
- Historical weather playback
- Custom event injection (earthquakes, blasting)
- Save/load weather scenarios
- Time-based progression simulation
