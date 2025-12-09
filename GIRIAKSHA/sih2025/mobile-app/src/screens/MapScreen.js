import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Colors, Spacing, Typography } from '../theme';
import { StatusBadge } from '../components/StatusBadge';

import { fetchSensorData, fetchRiskGrid } from '../services/api';

// Generate heatmap data based on real sensors
const generateHeatmapData = (sensors = []) => {
  const cells = [];
  const baseLatLon = { lat: 11.1053, lon: 79.1506 };
  const gridSize = 12;
  const cellSize = 0.0008;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const lat = baseLatLon.lat + (row - gridSize / 2) * cellSize;
      const lon = baseLatLon.lon + (col - gridSize / 2) * cellSize;

      // Default values
      let riskScore = 0.1;
      let displacement = 0;
      let porePressure = 50;
      let vibration = 0.001;

      // Interpolate from nearest sensor if available
      if (sensors.length > 0) {
        let minDist = Infinity;
        let nearestSensor = null;

        sensors.forEach(s => {
          const d = Math.sqrt(Math.pow(s.location.lat - lat, 2) + Math.pow(s.location.lon - lon, 2));
          if (d < minDist) {
            minDist = d;
            nearestSensor = s;
          }
        });

        if (nearestSensor && minDist < 0.002) { // Influence radius
          const vals = nearestSensor.values;
          displacement = vals.disp_mm;
          porePressure = vals.pore_kpa;
          vibration = vals.vibration_g;

          // Calculate local risk
          const dRisk = Math.min(displacement / 5.0, 1.0);
          const pRisk = Math.min(porePressure / 100.0, 1.0);
          riskScore = (dRisk * 0.5) + (pRisk * 0.5);
        }
      } else {
        // Fallback to demo pattern if no sensors
        const distFromCenter = Math.sqrt(Math.pow(row - gridSize / 2, 2) + Math.pow(col - gridSize / 2, 2));
        if (distFromCenter < 2) riskScore = 0.75 + Math.random() * 0.2;
        else if (distFromCenter < 4) riskScore = 0.4 + Math.random() * 0.3;
        else riskScore = 0.1 + Math.random() * 0.3;
      }

      cells.push({
        id: `C${row}-${col}`,
        row, col, lat, lon,
        riskScore: Math.min(riskScore, 0.99),
        slopeAngle: 25 + Math.random() * 30,
        displacement,
        porePressure,
        vibration,
        weatherCondition: 'Live',
      });
    }
  }
  return cells;
};

// Helper functions for risk assessment
const getRiskColor = (score) => {
  if (score >= 0.75) return '#7a0019'; // Danger
  if (score >= 0.60) return '#d62728'; // High
  if (score >= 0.35) return '#ff7f0e'; // Medium
  return '#2ca02c';                    // Low
};

const getRiskLevel = (score) => {
  if (score >= 0.75) return 'Danger';
  if (score >= 0.60) return 'High';
  if (score >= 0.35) return 'Medium';
  return 'Low';
};

export default function MapScreen({ navigation }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [filterLevel, setFilterLevel] = useState('all');

  const webviewRef = React.useRef(null);

  React.useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Sync with backend every 5s
    return () => clearInterval(interval);
  }, []);

  // Inject data into WebView when it changes
  React.useEffect(() => {
    if (webviewRef.current && heatmapData.length > 0) {
      const script = `
        if (window.updateMap) {
          window.updateMap(${JSON.stringify(filteredCells)});
        }
      `;
      webviewRef.current.injectJavaScript(script);
    }
  }, [heatmapData, filterLevel]);

  const loadData = async () => {
    try {
      // Fetch the robust grid from the backend using the new service
      const data = await fetchRiskGrid();
      if (data && data.grid) {
        setHeatmapData(data.grid);
      } else {
        console.warn("Received empty grid data");
      }
    } catch (error) {
      console.error("Failed to load map grid:", error);
    }
  };

  const filteredCells = heatmapData.filter(cell => {
    if (filterLevel === 'all') return true;
    return getRiskLevel(cell.risk_score) === filterLevel;
  });

  // Generate HTML with Leaflet map and satellite imagery
  const mapHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    body { margin: 0; padding: 0; }
    #map { height: 100vh; width: 100vw; }
    .leaflet-control-attribution { display: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { 
      zoomControl: false, // Cleaner look
      attributionControl: false 
    }).setView([11.1053, 79.1506], 17); // Zoomed in closer

    // Satellite imagery layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20,
      attribution: 'Esri'
    }).addTo(map);

    let gridLayer = L.layerGroup().addTo(map);

    function getRiskColor(score) {
      if (score >= 0.75) return '#7a0019'; // Imminent
      if (score >= 0.60) return '#d62728'; // High
      if (score >= 0.35) return '#ff7f0e'; // Medium
      return '#2ca02c';                 // Low
    }

    // Function to update map data
    window.updateMap = function(cells) {
      gridLayer.clearLayers(); // Clear existing cells

      cells.forEach(cell => {
        // Cell size matches backend generation (0.0005 deg)
        // We add a tiny buffer to overlap and remove gaps
        const halfSize = 0.00026; 
        const bounds = [
          [cell.lat - halfSize, cell.lon - halfSize],
          [cell.lat + halfSize, cell.lon + halfSize]
        ];

        const rectangle = L.rectangle(bounds, {
          color: 'transparent', // No border for seamless look
          fillColor: getRiskColor(cell.risk_score),
          fillOpacity: 0.6, // Transparent as requested
          weight: 0,
          interactive: true
        }).addTo(gridLayer);

        rectangle.on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify(cell));
        });
      });
    };

    // Add mine boundary marker (Visual Anchor)
    L.circle([11.1053, 79.1506], {
      color: '#fff',
      fillColor: 'transparent',
      radius: 400,
      weight: 1,
      dashArray: '10, 10',
      opacity: 0.5
    }).addTo(map);
  </script>
</body>
</html>
  `;

  const stats = {
    total: heatmapData.length,
    imminent: heatmapData.filter(c => c.risk_score >= 0.75).length,
    high: heatmapData.filter(c => c.risk_score >= 0.60 && c.risk_score < 0.75).length,
    medium: heatmapData.filter(c => c.risk_score >= 0.35 && c.risk_score < 0.60).length,
    low: heatmapData.filter(c => c.risk_score < 0.35).length,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Risk Heatmap</Text>
          <Text style={styles.subtitle}>Limestone Mine • 11°06'19"N 79°09'02"E</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      {/* Statistics Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Cells</Text>
        </View>
        <View style={[styles.statItem, styles.statDivider]}>
          <Text style={[styles.statValue, { color: Colors.riskImminent }]}>{stats.imminent}</Text>
          <Text style={styles.statLabel}>Danger</Text>
        </View>
        <View style={[styles.statItem, styles.statDivider]}>
          <Text style={[styles.statValue, { color: Colors.riskHigh }]}>{stats.high}</Text>
          <Text style={styles.statLabel}>High</Text>
        </View>
        <View style={[styles.statItem, styles.statDivider]}>
          <Text style={[styles.statValue, { color: Colors.riskMedium }]}>{stats.medium}</Text>
          <Text style={styles.statLabel}>Medium</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.riskLow }]}>{stats.low}</Text>
          <Text style={styles.statLabel}>Low</Text>
        </View>
      </View>



      {/* Map with Satellite Imagery */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webviewRef}
          originWhitelist={['*']}
          source={{ html: mapHTML }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={(event) => {
            const cell = JSON.parse(event.nativeEvent.data);
            setSelectedCell(cell);
          }}
        />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Risk Levels</Text>
        <View style={styles.legendItems}>
          {[
            { label: 'Imminent', color: Colors.riskImminent, count: stats.imminent },
            { label: 'High', color: Colors.riskHigh, count: stats.high },
            { label: 'Medium', color: Colors.riskMedium, count: stats.medium },
            { label: 'Low', color: Colors.riskLow, count: stats.low },
          ].map(item => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label} ({item.count})</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Cell Details Modal */}
      <Modal
        visible={selectedCell !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedCell(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedCell(null)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {selectedCell && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Cell {selectedCell.id}</Text>
                    <Text style={styles.modalCoords}>
                      {selectedCell.lat.toFixed(5)}°N, {selectedCell.lon.toFixed(5)}°E
                    </Text>
                  </View>
                  <StatusBadge
                    status={getRiskLevel(selectedCell.risk_score).toLowerCase()}
                    label={getRiskLevel(selectedCell.risk_score)}
                  />
                </View>

                <ScrollView style={styles.detailsScroll}>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Risk Score</Text>
                      <Text style={[styles.detailValue, { color: getRiskColor(selectedCell.risk_score) }]}>
                        {(selectedCell.risk_score * 100).toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Static Risk</Text>
                      <Text style={styles.detailValue}>
                        {(selectedCell.static_risk * 100).toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Dynamic Risk</Text>
                      <Text style={styles.detailValue}>
                        {(selectedCell.dynamic_risk * 100).toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Status</Text>
                      <Text style={styles.detailValue}>
                        Live
                      </Text>
                    </View>
                  </View>

                  {selectedCell.risk_score >= 0.60 && (
                    <View style={styles.warningBox}>
                      <Text style={styles.warningTitle}>⚠️ Recommended Actions</Text>
                      <Text style={styles.warningText}>
                        • Restrict access to this zone{'\n'}
                        • Increase monitoring frequency{'\n'}
                        • Prepare evacuation protocols{'\n'}
                        • Alert on-site personnel
                      </Text>
                    </View>
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedCell(null)}
                >
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,      // Drastically reduced
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 60,
  },
  backBtnText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 14,            // Reduced from Typography.h3
    fontWeight: 'bold',
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 9,             // Reduced from Typography.caption
    marginTop: 1,            // Reduced from 2
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: 4,      // Reduced from Spacing.sm
    paddingHorizontal: Spacing.sm,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    paddingLeft: 8,
  },
  statValue: {
    ...Typography.h3,
    fontSize: 14,  // Reduced from 18
  },
  statLabel: {
    ...Typography.small,
    fontSize: 9,   // Reduced from 10
    marginTop: 1,  // Reduced from 2
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,  // Reduced from default
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterBtn: {
    paddingHorizontal: 10,  // Reduced from 12
    paddingVertical: 2,     // Reduced from 4
    marginRight: 4,         // Reduced from 6
    borderRadius: 10,       // Reduced from 12
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.caption,
    fontSize: 10,           // Explicitly set to 10px
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  legend: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendTitle: {
    ...Typography.caption,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    ...Typography.small,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    ...Typography.h3,
  },
  modalCoords: {
    ...Typography.small,
    marginTop: 4,
  },
  detailsScroll: {
    maxHeight: 400,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  detailItem: {
    width: '48%',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  detailLabel: {
    ...Typography.small,
    marginBottom: 4,
  },
  detailValue: {
    ...Typography.h3,
    color: Colors.primary,
    fontSize: 16,
  },
  warningBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.emergency,
  },
  warningTitle: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.emergency,
    marginBottom: 8,
  },
  warningText: {
    ...Typography.caption,
    lineHeight: 20,
  },
  closeBtn: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    ...Typography.body,
    fontWeight: 'bold',
  },
});
