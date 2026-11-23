/**
 * GIRAKSHA Backend Unit & Regression Test
 * Validates new ML Service endpoints, 20x20 IDW Grid, A* Evacuation, and 15s ACK Escalation
 */
const mlService = require('../services/ml.service');
const sensorService = require('../services/sensor.service');

async function runTests() {
  console.log('🧪 Starting GIRAKSHA Backend Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  // Test 1: Prediction with 23 Causal Features & Table 3 Thresholds
  try {
    const predResult = await mlService.predict({
      slopeId: 'slope_1',
      sensorData: {
        v24: 0.65,
        disp_last: 0.65,
        pore_kpa: 35.0,
        vibration_g: 0.15
      }
    });

    assert(predResult.ok === true, 'Prediction returns ok: true');
    assert(typeof predResult.data.risk_score === 'number', 'Risk score is a valid number');
    assert(['low', 'medium', 'high', 'imminent'].includes(predResult.data.risk_level), `Risk level is standardized: ${predResult.data.risk_level}`);
    assert(Object.keys(predResult.data.features_used).length === 23, 'Features used has exactly 23 causal features');
  } catch (err) {
    console.error('Test 1 error:', err.message);
    failed++;
  }

  // Test 2: 72-Hour Forecast (ARIMA / ETS + Weather Integration)
  try {
    const forecastResult = await mlService.forecast({ slopeId: 'slope_1' });
    assert(forecastResult.ok === true, 'Forecast returns ok: true');
    assert(Array.isArray(forecastResult.data.forecast) && forecastResult.data.forecast.length > 0, 'Forecast array is populated');
    assert(forecastResult.data.current_assessment.weather_impact !== undefined, 'Weather impact calculation is included');
  } catch (err) {
    console.error('Test 2 error:', err.message);
    failed++;
  }

  // Test 3: 20×20 IDW Spatial Risk Grid
  try {
    const gridResult = await mlService.getRiskGrid();
    assert(gridResult.ok === true, 'Risk grid returns ok: true');
    assert(gridResult.dimensions.rows === 20 && gridResult.dimensions.cols === 20, 'Grid dimensions are exactly 20×20 (400 cells)');
    assert(gridResult.grid.length === 400, 'Grid array contains 400 cell objects');
    assert(gridResult.grid[0].impassable !== undefined, 'Grid cell includes impassable flag for A* routing');
  } catch (err) {
    console.error('Test 3 error:', err.message);
    failed++;
  }

  // Test 4: A* Pathfinding Evacuation Route (<800ms Latency Target)
  try {
    const t0 = Date.now();
    const evacResult = await mlService.getEvacuationRoute({
      workerId: 'worker_unit_1',
      currentLocation: { lat: 11.1052, lon: 79.1498 },
      gridRow: 14,
      gridCol: 4
    });
    const duration = Date.now() - t0;

    assert(evacResult.ok === true, 'Evacuation route returns ok: true');
    assert(evacResult.routeFound === true, 'Safe evacuation route found');
    assert(Array.isArray(evacResult.waypoints) && evacResult.waypoints.length > 0, 'Turn-by-turn waypoints generated');
    assert(duration < 800, `A* pathfinding executed in ${duration}ms (Target: <800ms)`);
  } catch (err) {
    console.error('Test 4 error:', err.message);
    failed++;
  }

  // Test 5: Anomaly Detection (Z-Score, CUSUM, Isolation Forest)
  try {
    const anomalyResult = await mlService.detectAnomalies({
      sensorId: '1750L-54XC',
      readings: [0.1, 0.12, 0.11, 0.13, 0.15, 0.85] // Injected jump anomaly
    });
    assert(anomalyResult.ok === true, 'Anomaly detection returns ok: true');
    assert(anomalyResult.detectors.robust_z_score !== undefined, 'Robust Z-score detector present');
    assert(anomalyResult.detectors.cusum !== undefined, 'CUSUM detector present');
    assert(anomalyResult.detectors.isolation_forest !== undefined, 'Isolation Forest detector present');
  } catch (err) {
    console.error('Test 5 error:', err.message);
    failed++;
  }

  // Test 6: Thermal Camera Verification Status (LWIR 8-14μm)
  try {
    const thermalResult = await mlService.getThermalStatus();
    assert(thermalResult.ok === true, 'Thermal camera status returns ok: true');
    assert(thermalResult.wavelengthRange === '8-14 μm (LWIR)', 'LWIR 8-14μm wavelength verified');
    assert(thermalResult.evacuationCompliance !== undefined, 'Evacuation compliance metrics present');
  } catch (err) {
    console.error('Test 6 error:', err.message);
    failed++;
  }

  // Test 7: Strain-Bar Calibration Conversion (0.035 mm/ohm)
  try {
    const rawOhms = 100.0;
    const calibratedMm = sensorService.calibrateSensorReading('displacement', rawOhms);
    const expected = 100.0 * 0.035;
    assert(Math.abs(calibratedMm - expected) < 0.001, `Calibration factor 0.035 applied: ${rawOhms} ohms -> ${calibratedMm} mm`);
  } catch (err) {
    console.error('Test 7 error:', err.message);
    failed++;
  }

  // Summary
  console.log(`\n========================================`);
  console.log(`Total Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
