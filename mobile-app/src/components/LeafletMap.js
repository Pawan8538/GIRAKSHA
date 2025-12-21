import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

export default function LeafletMap({ markers = [], onMarkerPress }) {
  const webViewRef = useRef(null);
  const [loadingProgress, setLoadingProgress] = React.useState(0);

  // ... htmlContent ...

  // Handle messages from WebView (marker clicks)
  const handleMessage = (event) => {
    try {
      const markerData = JSON.parse(event.nativeEvent.data);
      if (onMarkerPress) {
        onMarkerPress(markerData);
      }
    } catch (error) {
      console.warn('Failed to parse map message', error);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent, baseUrl: 'https://google.com' }} // Hack for Android to load external tiles
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoadProgress={({ nativeEvent }) => setLoadingProgress(nativeEvent.progress)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView HTTP error: ', nativeEvent);
        }}
        androidLayerType="hardware"
      />
      {loadingProgress < 1 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>Loading Map... {Math.round(loadingProgress * 100)}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Match app background
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
});
