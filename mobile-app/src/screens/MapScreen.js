
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { COLORS } from '../utils/constants';
import { StatusBadge } from '../components/StatusBadge';
import { calculateRiskGrid } from '../services/RiskEngine';

// Theme mapping
const Colors = {
  background: COLORS.background,
  surface: COLORS.surface,
  primary: COLORS.primary,
  textPrimary: COLORS.text,
  textSecondary: COLORS.textSecondary,
  border: COLORS.border,
  borderLight: COLORS.divider,
  riskImminent: COLORS.danger,
  riskHigh: COLORS.high || '#FF5722', // Fallback if not directly in COLORS root
  riskMedium: COLORS.warning,
  riskLow: COLORS.success,
  emergency: COLORS.danger,
};

const Spacing = { sm: 8, md: 16, lg: 24 };
const Typography = {
  h3: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  body: { fontSize: 14, color: Colors.textPrimary },
  caption: { fontSize: 12, color: Colors.textSecondary },
  small: { fontSize: 10, color: Colors.textSecondary },
};

// Helper functions for risk assessment
const getRiskColor = (score) => {
  if (score >= 0.9) return Colors.riskImminent; // Critical
  if (score >= 0.75) return Colors.riskHigh;    // High
  if (score >= 0.60) return Colors.riskMedium;  // Medium
  return Colors.riskLow;                        // Low
};

const getRiskLevel = (score) => {
  if (score >= 0.9) return 'Critical';
  if (score >= 0.75) return 'High';
  if (score >= 0.60) return 'Medium';
  return 'Low';
};

import { weatherService } from '../services/weather'

export default function MapScreen({ navigation }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [filterLevel, setFilterLevel] = useState('all');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [weather, setWeather] = useState(null);

  const webviewRef = React.useRef(null);

  const filteredCells = React.useMemo(() => {
    return heatmapData.filter(cell => {
      if (filterLevel === 'all') return true;
      return getRiskLevel(cell.risk_score) === filterLevel;
    });
  }, [heatmapData, filterLevel]);

  React.useEffect(() => {
    loadData();
    loadWeather();
    const interval = setInterval(loadData, 5000); // Sync with backend every 5s
    return () => clearInterval(interval);
  }, []);

  const loadWeather = async () => {
    const data = await weatherService.getCurrentWeather()
    setWeather(data)
  }

  // Inject data into WebView when it changes
  React.useEffect(() => {
    if (webviewRef.current && heatmapData.length > 0) {
      const jsonCells = JSON.stringify(filteredCells);
      const script = 'if (window.updateMap) { window.updateMap(' + jsonCells + '); }';
      webviewRef.current.injectJavaScript(script);
    }
  }, [filteredCells]);

  const loadData = async () => {
    try {
      // Fetch the robust grid from the local engine
      const data = await calculateRiskGrid();
      if (data && data.grid) {
        setHeatmapData(data.grid);
      } else {
        console.warn("Received empty grid data");
      }
    } catch (error) {
      console.error("Failed to load map grid:", error);
    }
  };

  // Generate HTML with Leaflet map and satellite imagery
  const mapHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    body { margin: 0; padding: 0; background-color: ${COLORS.background}; }
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
      if (score >= 0.9) return '${COLORS.danger}'; // Critical
      if (score >= 0.75) return '${COLORS.high || '#FF5722'}'; // High
      if (score >= 0.60) return '${COLORS.warning}'; // Moderate
      return '${COLORS.success}';                 // Low
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
      color: '${COLORS.mapSlopeBoundary || '#2B9CEF'}',
      fillColor: 'transparent',
      radius: 400,
      weight: 2,
      dashArray: '10, 10',
      opacity: 0.8
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
          {weather && (
            <Text style={styles.weatherBadge}>{weather.temp} • {weather.rain}</Text>
          )}
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
          source={{ html: mapHTML, baseUrl: 'https://google.com' }} // Hack for Android
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={(event) => {
            try {
              const cell = JSON.parse(event.nativeEvent.data);
              setSelectedCell(cell);
            } catch (e) { console.warn(e); }
          }}
          onLoadProgress={({ nativeEvent }) => setLoadingProgress(nativeEvent.progress)}
          androidLayerType="hardware"
        />
        {loadingProgress < 1 && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading Map... {Math.round(loadingProgress * 100)}%</Text>
          </View>
        )}
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
    paddingVertical: 6,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 9,
    marginTop: 1,
    color: Colors.textSecondary,
  },
  weatherBadge: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: 4,
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
    fontSize: 14,
  },
  statLabel: {
    ...Typography.small,
    fontSize: 9,
    marginTop: 1,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
})

