import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { COLORS } from '../utils/constants';
import { StatusBadge } from '../components/StatusBadge';

// Theme mapping
const Colors = {
  background: '#0f172a',
  surface: '#1e293b',
  surfaceLight: '#334155',
  primary: COLORS.primary,
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  border: '#334155',
  success: '#16a34a',
  warning: '#f59e0b',
  emergency: '#dc2626',
  emergencyDark: '#991b1b',
  info: '#3b82f6',
};

const Spacing = { sm: 8, md: 16, lg: 24 };
const Typography = {
  h2: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary },
  h3: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  body: { fontSize: 14, color: Colors.textPrimary },
  caption: { fontSize: 12, color: Colors.textSecondary },
  small: { fontSize: 10, color: Colors.textMuted },
};

// Mock personnel data with locations at 11°06'19"N 79°09'02"E area
const PERSONNEL_DATA = [
  { id: 'P001', name: 'Rajesh Kumar', role: 'Supervisor', status: 'safe', location: 'Assembly Point B', lat: 11.103, lon: 79.152, zone: 'Safe Zone' },
  { id: 'P002', name: 'Amit Singh', role: 'Operator', status: 'evacuating', location: 'Zone 3', lat: 11.106, lon: 79.151, eta: '3 min', zone: 'Medium Risk' },
  { id: 'P003', name: 'Priya Sharma', role: 'Engineer', status: 'evacuating', location: 'Zone 2', lat: 11.107, lon: 79.150, eta: '5 min', zone: 'High Risk' },
  { id: 'P004', name: 'Vikram Patel', role: 'Technician', status: 'danger', location: 'Zone 1', lat: 11.108, lon: 79.149, eta: '8 min', zone: 'Danger Zone' },
  { id: 'P005', name: 'Sunita Reddy', role: 'Geologist', status: 'safe', location: 'Assembly Point B', lat: 11.103, lon: 79.152, zone: 'Safe Zone' },
  { id: 'P006', name: 'Arjun Mehta', role: 'Operator', status: 'evacuating', location: 'Zone 4', lat: 11.104, lon: 79.151, eta: '4 min', zone: 'Medium Risk' },
];

// Assembly points
const ASSEMBLY_POINTS = [
  { id: 'AP-B', name: 'Assembly Point B', lat: 11.103, lon: 79.152, capacity: 50, current: 12, safe: true, facilities: ['Medical', 'Water', 'Shelter'] },
  { id: 'AP-A', name: 'Assembly Point A', lat: 11.110, lon: 79.155, capacity: 30, current: 0, safe: true, facilities: ['Water', 'Shelter'] },
];

// Emergency contacts
const EMERGENCY_CONTACTS = [
  { name: 'Control Room', number: '+91-1234-567-890', type: 'primary', available: true },
  { name: 'Medical Unit', number: '+91-1234-567-891', type: 'medical', available: true },
  { name: 'Fire Brigade', number: '+91-1234-567-892', type: 'fire', available: true },
  { name: 'Site Manager', number: '+91-1234-567-893', type: 'management', available: true },
];

export default function SosScreen({ navigation }) {
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showContacts, setShowContacts] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);

  const handleSOS = () => {
    setSosTriggered(true);
    setTimeout(() => setSosTriggered(false), 3000);
    // TODO: Send SOS to backend
  };

  const handleSafe = async () => {
    try {
      // Send "I'm safe" notification to backend
      await axios.post(`${API_BASE_URL}/alerts`, {
        type: 'safe',
        message: 'Field worker marked themselves as safe',
        severity: 'low'
      });

      Alert.alert(
        'Status Updated',
        'You have been marked as SAFE. Admins have been notified.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to send safe status:', error);
      Alert.alert(
        'Error',
        'Failed to update status. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const safeCount = PERSONNEL_DATA.filter(p => p.status === 'safe').length;
  const evacuatingCount = PERSONNEL_DATA.filter(p => p.status === 'evacuating').length;
  const dangerCount = PERSONNEL_DATA.filter(p => p.status === 'danger').length;

  // Generate evacuation map HTML
  const mapHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    body { margin: 0; padding: 0; background: #000; }
    #map { height: 100vh; width: 100vw; }
    .leaflet-control-attribution { display: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([11.1053, 79.1506], 15);
    
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20
    }).addTo(map);

    // Danger zone (red polygon)
    L.polygon([
      [11.108, 79.149],
      [11.109, 79.150],
      [11.108, 79.151],
      [11.107, 79.150]
    ], {
      color: '#dc2626',
      fillColor: '#dc2626',
      fillOpacity: 0.3,
      weight: 2,
      dashArray: '5, 10'
    }).addTo(map);

    // Assembly Point B (green marker)
    L.circle([11.103, 79.152], {
      color: '#16a34a',
      fillColor: '#16a34a',
      fillOpacity: 0.3,
      radius: 100,
      weight: 3
    }).addTo(map);

    L.marker([11.103, 79.152], {
      icon: L.divIcon({
        className: 'assembly-marker',
        html: '<div style="background:#16a34a;color:white;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.3)">POINT B</div>'
      })
    }).addTo(map);

    // Personnel markers
    const personnel = ${JSON.stringify(PERSONNEL_DATA)};
    personnel.forEach(person => {
      let color = '#16a34a';
      if (person.status === 'evacuating') color = '#f59e0b';
      if (person.status === 'danger') color = '#dc2626';

      L.circleMarker([person.lat, person.lon], {
        radius: 6,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(map);
    });

    // Evacuation routes (green dashed lines)
    personnel.filter(p => p.status === 'evacuating').forEach(person => {
      L.polyline([
        [person.lat, person.lon],
        [11.103, 79.152]
      ], {
        color: '#16a34a',
        weight: 2,
        dashArray: '5, 10',
        opacity: 0.7
      }).addTo(map);
    });
  </script>
</body>
</html>
  `;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Emergency Header */}
      <View style={[styles.header, sosTriggered && styles.headerPulse]}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerBackText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>⚠️ EVACUATION ALERT</Text>
          <Text style={styles.headerSub}>Rockfall Risk Detected - Zone 1</Text>
        </View>
      </View>

      {/* Status Overview */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <Text style={[styles.statusValue, { color: Colors.success }]}>{safeCount}</Text>
          <Text style={styles.statusLabel}>Safe</Text>
        </View>
        <View style={[styles.statusItem, styles.statusDivider]}>
          <Text style={[styles.statusValue, { color: Colors.warning }]}>{evacuatingCount}</Text>
          <Text style={styles.statusLabel}>Evacuating</Text>
        </View>
        <View style={[styles.statusItem, styles.statusDivider]}>
          <Text style={[styles.statusValue, { color: Colors.emergency }]}>{dangerCount}</Text>
          <Text style={styles.statusLabel}>At Risk</Text>
        </View>
        <View style={[styles.statusItem, styles.statusDivider]}>
          <Text style={styles.statusValue}>{PERSONNEL_DATA.length}</Text>
          <Text style={styles.statusLabel}>Total</Text>
        </View>
      </View>

      {/* Evacuation Map */}
      <View style={styles.mapSection}>
        <Text style={styles.sectionTitle}>Live Evacuation Map</Text>
        <View style={styles.mapContainer}>
          <WebView
            source={{ html: mapHTML, baseUrl: 'https://google.com' }}
            style={styles.webview}
            scrollEnabled={false}
            javaScriptEnabled={true}
            androidLayerType="hardware"
          />
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollContent}>
        {/* Assembly Points */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assembly Points</Text>
          {ASSEMBLY_POINTS.map(point => (
            <View key={point.id} style={styles.assemblyCard}>
              <View style={styles.assemblyHeader}>
                <View>
                  <Text style={styles.assemblyName}>{point.name}</Text>
                  <Text style={styles.assemblyCoords}>
                    {point.lat.toFixed(4)}°N, {point.lon.toFixed(4)}°E
                  </Text>
                </View>
                <StatusBadge status="safe" label="SAFE" />
              </View>
              <View style={styles.assemblyDetails}>
                <Text style={styles.assemblyText}>
                  Capacity: {point.current}/{point.capacity} ({Math.round(point.current / point.capacity * 100)}% occupied)
                </Text>
                <Text style={styles.assemblyText}>
                  Facilities: {point.facilities.join(', ')}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Personnel List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personnel Status ({PERSONNEL_DATA.length})</Text>
          {PERSONNEL_DATA.map(person => (
            <TouchableOpacity
              key={person.id}
              style={styles.personnelCard}
              onPress={() => setSelectedPerson(person)}
            >
              <View style={styles.personnelHeader}>
                <View style={styles.personnelInfo}>
                  <Text style={styles.personnelName}>{person.name}</Text>
                  <Text style={styles.personnelRole}>{person.role} • {person.id}</Text>
                  <Text style={styles.personnelZone}>📍 {person.zone}</Text>
                </View>
                <StatusBadge status={person.status} />
              </View>
              <View style={styles.personnelDetails}>
                <Text style={styles.personnelLocation}>Current: {person.location}</Text>
                {person.eta && (
                  <Text style={styles.personnelEta}>⏱️ ETA to safety: {person.eta}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.btn, styles.btnSos, sosTriggered && styles.btnSosActive]}
          onPress={handleSOS}
        >
          <Text style={styles.btnText}>🚨 SOS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnContacts]}
          onPress={() => setShowContacts(true)}
        >
          <Text style={styles.btnText}>📞 Contacts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSafe]}
          onPress={handleSafe}
        >
          <Text style={styles.btnText}>✓ I'm Safe</Text>
        </TouchableOpacity>
      </View>

      {/* Emergency Contacts Modal */}
      <Modal
        visible={showContacts}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContacts(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Emergency Contacts</Text>
            {EMERGENCY_CONTACTS.map(contact => (
              <TouchableOpacity
                key={contact.number}
                style={styles.contactRow}
                onPress={() => handleCall(contact.number)}
              >
                <View>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactNumber}>{contact.number}</Text>
                  <Text style={[styles.contactStatus, contact.available && styles.contactAvailable]}>
                    {contact.available ? '● Available' : '○ Unavailable'}
                  </Text>
                </View>
                <Text style={styles.callBtn}>📞 Call</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowContacts(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Personnel Details Modal */}
      <Modal
        visible={selectedPerson !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPerson(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPerson && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>{selectedPerson.name}</Text>
                    <Text style={styles.modalSubtitle}>{selectedPerson.role} • {selectedPerson.id}</Text>
                  </View>
                  <StatusBadge status={selectedPerson.status} />
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailLabel}>Current Zone</Text>
                  <Text style={styles.detailValue}>{selectedPerson.zone}</Text>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailLabel}>Current Location</Text>
                  <Text style={styles.detailValue}>{selectedPerson.location}</Text>
                  <Text style={styles.detailCoords}>
                    {selectedPerson.lat.toFixed(5)}°N, {selectedPerson.lon.toFixed(5)}°E
                  </Text>
                </View>

                {selectedPerson.eta && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailLabel}>Estimated Time to Safety</Text>
                    <Text style={[styles.detailValue, { color: Colors.warning }]}>
                      {selectedPerson.eta}
                    </Text>
                  </View>
                )}

                {selectedPerson.status === 'danger' && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningTitle}>⚠️ CRITICAL</Text>
                    <Text style={styles.warningText}>
                      This person is in a high-risk zone. Immediate evacuation required.
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedPerson(null)}
                >
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
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
    backgroundColor: Colors.emergency,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackBtn: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 10,
  },
  headerBackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerPulse: {
    backgroundColor: Colors.emergencyDark,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  statusBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusDivider: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    paddingLeft: 12,
  },
  statusValue: {
    ...Typography.h2,
    fontSize: 24,
  },
  statusLabel: {
    ...Typography.small,
    marginTop: 4,
  },
  mapSection: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mapContainer: {
    height: 200,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
    color: Colors.primary,
  },
  assemblyCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  assemblyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  assemblyName: {
    ...Typography.body,
    fontWeight: 'bold',
  },
  assemblyCoords: {
    ...Typography.small,
    marginTop: 2,
  },
  assemblyDetails: {
    gap: 4,
  },
  assemblyText: {
    ...Typography.caption,
  },
  personnelCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  personnelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  personnelInfo: {
    flex: 1,
  },
  personnelName: {
    ...Typography.body,
    fontWeight: 'bold',
  },
  personnelRole: {
    ...Typography.caption,
    marginTop: 2,
  },
  personnelZone: {
    ...Typography.caption,
    marginTop: 4,
    color: Colors.primary,
  },
  personnelDetails: {
    gap: 4,
  },
  personnelLocation: {
    ...Typography.caption,
  },
  personnelEta: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  btn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSos: {
    backgroundColor: Colors.emergency,
  },
  btnSosActive: {
    backgroundColor: Colors.emergencyDark,
  },
  btnContacts: {
    backgroundColor: Colors.surfaceLight,
  },
  btnSafe: {
    backgroundColor: Colors.success,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
    ...Typography.h2,
  },
  modalSubtitle: {
    ...Typography.caption,
    marginTop: 4,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  contactName: {
    ...Typography.body,
    fontWeight: 'bold',
  },
  contactNumber: {
    ...Typography.caption,
    marginTop: 4,
  },
  contactStatus: {
    ...Typography.small,
    marginTop: 4,
    color: Colors.textMuted,
  },
  contactAvailable: {
    color: Colors.success,
  },
  callBtn: {
    color: Colors.info,
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsSection: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  detailLabel: {
    ...Typography.small,
    marginBottom: 4,
  },
  detailValue: {
    ...Typography.body,
    fontWeight: 'bold',
  },
  detailCoords: {
    ...Typography.caption,
    marginTop: 4,
  },
  warningBox: {
    padding: Spacing.md,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.emergency,
    marginBottom: Spacing.md,
  },
  warningTitle: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.emergency,
    marginBottom: 4,
  },
  warningText: {
    ...Typography.caption,
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
