import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Platform, Text, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { socket } from '../services/socket';
import { theme } from '../styles/theme';

// Only import maps on native platforms to prevent web crashes
let MapView, Marker, AnimatedRegion, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    AnimatedRegion = Maps.AnimatedRegion;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

export default function LiveTrackingMap({ bookingId, initialLocation }) {
    const mapRef = useRef(null);
    
    // Fallback for Web
    if (Platform.OS === 'web') {
        return (
            <View style={[styles.container, styles.webPlaceholder]}>
                <Ionicons name="map-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.webText}>Live Map is available on mobile apps</Text>
            </View>
        );
    }

    // Default fallback coordinate if nothing provided
    const fallbackCoord = { latitude: 28.7041, longitude: 77.1025 };
    const startCoord = {
        latitude: parseFloat(initialLocation?.latitude || fallbackCoord.latitude),
        longitude: parseFloat(initialLocation?.longitude || fallbackCoord.longitude)
    };

    // Use AnimatedRegion for smooth sliding of the marker
    const [coordinate] = useState(
        new AnimatedRegion({
            latitude: startCoord.latitude,
            longitude: startCoord.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        })
    );
    const [heading, setHeading] = useState(0);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.5,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 0,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    useEffect(() => {
        if (!bookingId) return;

        socket.emit('track_walk', { bookingId });

        const handleLocationUpdate = (data) => {
            if (!data || !data.latitude || !data.longitude) return;
            
            const newLat = parseFloat(data.latitude);
            const newLng = parseFloat(data.longitude);
            const newHeading = parseFloat(data.heading) || 0;

            coordinate.timing({
                latitude: newLat,
                longitude: newLng,
                duration: 2000,
                useNativeDriver: false
            }).start();

            setHeading(newHeading);

            mapRef.current?.animateCamera({
                center: { latitude: newLat, longitude: newLng },
                heading: newHeading,
                pitch: 45
            }, { duration: 1000 });
        };

        socket.on('live_location', handleLocationUpdate);
        return () => socket.off('live_location', handleLocationUpdate);
    }, [bookingId]);

    return (
        <View style={styles.container}>
            <MapView 
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    latitude: startCoord.latitude,
                    longitude: startCoord.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
            >
                <Marker.Animated coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }}>
                    <View style={styles.markerWrapper}>
                        {/* Pulsing ring */}
                        <Animated.View style={[
                            styles.pulseCircle,
                            {
                                transform: [{ scale: pulseAnim }],
                                opacity: pulseAnim.interpolate({
                                    inputRange: [1, 1.5],
                                    outputRange: [0.6, 0]
                                })
                            }
                        ]} />
                        
                        <View style={[styles.pawContainer, { transform: [{ rotate: `${heading}deg` }] }]}>
                            <Ionicons name="paw" size={30} color={theme.colors.accent} />
                        </View>
                    </View>
                </Marker.Animated>
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        borderRadius: 16, 
        overflow: 'hidden',
        backgroundColor: '#f0f0f0'
    },
    webPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#dee2e6',
        padding: 20
    },
    webText: {
        marginTop: 12,
        color: theme.colors.textSecondary,
        fontFamily: theme.fonts.body,
        textAlign: 'center'
    },
    map: { 
        width: '100%', 
        height: '100%' 
    },
    markerWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        height: 60,
    },
    pulseCircle: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.accent,
    },
    pawContainer: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2
    }
});
