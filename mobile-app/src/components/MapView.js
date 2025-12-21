import { StyleSheet } from 'react-native'
import MapView, { Marker } from 'react-native-maps'

export default function FieldMapView({ markers = [], onMarkerPress }) {
  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: markers[0]?.latitude || 20.5937,
        longitude: markers[0]?.longitude || 78.9629,
        latitudeDelta: 10,
        longitudeDelta: 10,
      }}
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
          title={marker.title}
          description={marker.subtitle}
          pinColor={marker.riskColor || '#f97316'}
          onPress={() => onMarkerPress?.(marker)}
        />
      ))}
    </MapView>
  )
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
})

