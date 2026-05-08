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

  return (
    <MapView
      style={style}
      initialRegion={{
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
    >
      <Marker
        coordinate={{
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        }}
        title={title || "Location"}
      />
    </MapView>
  );
};

import { StyleSheet } from 'react-native';

export default MapComponent;
