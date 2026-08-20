import React from 'react';
import { Platform, View, Image } from 'react-native';

let MapView, Marker;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch (e) {
    console.warn('react-native-maps not found');
  }
}

const MapComponent = ({ latitude, longitude, style, title }) => {
  if (Platform.OS === 'web' || !MapView) {
    return (
      <View style={style}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600&auto=format&fit=crop' }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }

  const safeLat = parseFloat(latitude);
  const safeLng = parseFloat(longitude);
  const isValidCoords = !isNaN(safeLat) && !isNaN(safeLng);

  return (
    <MapView
      style={style}
      initialRegion={{
        latitude: isValidCoords ? safeLat : 28.6139,
        longitude: isValidCoords ? safeLng : 77.2090,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
    >
      {isValidCoords && (
        <Marker
          coordinate={{
            latitude: safeLat,
            longitude: safeLng,
          }}
          title={title || "Location"}
        />
      )}
    </MapView>
  );
};

import { StyleSheet } from 'react-native';

export default MapComponent;
