import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Platform, Text, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { connectTrackingSocket, socket } from '../services/socket';
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

export default function LiveTrackingMap({ bookingId, sessionId, initialLocation, initialDistanceMeters = 0, onSessionUpdate }) {
    const mapRef = useRef(null);
    const joinedSocketIdRef = useRef(null);

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
    const [distanceMeters, setDistanceMeters] = useState(Math.max(0, Number(initialDistanceMeters) || 0));
    const [connectionState, setConnectionState] = useState('connecting');
    const [hasLiveLocation, setHasLiveLocation] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        setDistanceMeters(Math.max(0, Number(initialDistanceMeters) || 0));
    }, [initialDistanceMeters, sessionId]);

    useEffect(() => {
        const animation = Animated.loop(
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
        );
        animation.start();
        return () => animation.stop();
    }, []);

    useEffect(() => {
        if (!bookingId || !sessionId) return undefined;

        const joinWalk = async () => {
            const connected = await connectTrackingSocket();
            if (!connected) {
                setConnectionState('disconnected');
                return;
            }
            if (joinedSocketIdRef.current === socket.id) return;
            joinedSocketIdRef.current = socket.id;
            socket.timeout(6000).emit('track_walk', { bookingId, sessionId }, (error, response) => {
                if (error || !response?.success) joinedSocketIdRef.current = null;
                setConnectionState(!error && response?.success ? 'connected' : 'disconnected');
            });
        };

        const handleLocationUpdate = (data) => {
            if (Number(data?.sessionId) !== Number(sessionId)) return;

            const newLat = parseFloat(data.latitude);
            const newLng = parseFloat(data.longitude);
            if (!Number.isFinite(newLat) || !Number.isFinite(newLng)) return;
            const newHeading = parseFloat(data.heading) || 0;
            const nextDistanceMeters = Number(data.distanceMeters);
            setHasLiveLocation(true);
            if (Number.isFinite(nextDistanceMeters)) setDistanceMeters(Math.max(0, nextDistanceMeters));

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

        const handleSessionUpdate = event => {
            if (Number(event?.bookingId) !== Number(bookingId)) return;
            onSessionUpdate?.(event);
        };

        socket.on('connect', joinWalk);
        socket.on('live_location', handleLocationUpdate);
        socket.on('walking_session_updated', handleSessionUpdate);
        joinWalk();
        return () => {
            joinedSocketIdRef.current = null;
            socket.off('connect', joinWalk);
            socket.off('live_location', handleLocationUpdate);
            socket.off('walking_session_updated', handleSessionUpdate);
        };
    }, [bookingId, sessionId, onSessionUpdate]);

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                initialRegion={{
                    latitude: startCoord.latitude,
                    longitude: startCoord.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
            >
                {hasLiveLocation && <Marker.Animated coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }}>
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
                </Marker.Animated>}
            </MapView>
            {(connectionState !== 'connected' || !hasLiveLocation) && (
                <View style={styles.connectionBanner}>
                    <Text style={styles.connectionText}>
                        {connectionState === 'connecting'
                            ? 'Connecting to live walk…'
                            : connectionState === 'disconnected'
                                ? 'Reconnecting to live walk…'
                                : 'Waiting for the walker’s location…'}
                    </Text>
                </View>
            )}
            <View style={styles.distanceBadge}>
                <Ionicons name="walk-outline" size={17} color="#FFF" />
                <View style={styles.distanceTextGroup}>
                    <Text style={styles.distanceLabel}>DISTANCE</Text>
                    <Text style={styles.distanceValue}>{(distanceMeters / 1000).toFixed(2)} km</Text>
                </View>
            </View>
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
    connectionBanner: {
        position: 'absolute',
        top: 10,
        alignSelf: 'center',
        backgroundColor: 'rgba(20, 25, 20, 0.82)',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 14,
    },
    connectionText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
    distanceBadge: {
        position: 'absolute',
        left: 12,
        bottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(61, 42, 94, 0.9)',
    },
    distanceTextGroup: {
        alignItems: 'flex-start',
    },
    distanceLabel: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    distanceValue: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
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
