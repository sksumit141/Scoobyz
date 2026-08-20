import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import AppHeader from '../components/AppHeader';
import { theme } from '../styles/theme';
import LiveTrackingMap from '../components/LiveTrackingMap';

const { width } = Dimensions.get('window');

export default function TrackingScreen({ navigation, route }) {
    const { booking } = route.params || {};
    
    if (!booking) {
        return (
            <AppScreen safeAreaTop={true}>
                <AppHeader title="Track Order" />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <AppText>Booking details not found.</AppText>
                </View>
            </AppScreen>
        );
    }

    // Ordered tracking steps
    const steps = [
        { id: 'confirmed', title: 'Order Confirmed', description: 'Vendor has accepted your order.' },
        { id: 'in_progress', title: 'Order In Progress', description: 'Service is currently being provided.' },
        { id: 'completed', title: 'Order Completed', description: 'Service has been successfully completed.' }
    ];

    const getStatusIndex = (status) => {
        if (status === 'completed') return 2;
        if (status === 'in_progress') return 1;
        if (status === 'confirmed') return 0;
        return -1; // pending or cancelled
    };

    const currentIndex = getStatusIndex(booking.status);

    return (
        <AppScreen safeAreaTop={true} padding={false} scrollable={false} backgroundColor="#F8F9FA">
            <AppHeader title="Track Order" />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.summaryCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                            <AppText style={styles.bookingId} weight="bold">Order #{booking.id}</AppText>
                            <AppText style={styles.serviceName}>{booking.serviceName}</AppText>
                            <AppText style={styles.vendorName}>with {booking.vendorName || 'Expert Vet'}</AppText>
                        </View>
                        
                        {(booking.visitType === 'Video Consult' || booking.bookingType === 'veterinary') && (booking.status === 'confirmed' || booking.status === 'in_progress') && (
                            <TouchableOpacity 
                                style={styles.videoBtn} 
                                onPress={() => navigation.navigate('VideoCall', {
                                    bookingId: booking.id,
                                    userName: 'Customer', // Ideally fetched from user profile
                                    userId: booking.customerUserId || 'customer_1'
                                })}
                            >
                                <Ionicons name="videocam" size={20} color="#FFF" />
                                <AppText style={styles.videoBtnText} weight="bold">Join Call</AppText>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* OTP Display for Confirmed Bookings */}
                {booking.status === 'confirmed' && booking.otp && (
                    <View style={styles.otpContainer}>
                        <AppText style={styles.otpTitle} weight="bold">Verification Code</AppText>
                        <AppText style={styles.otpDescription}>
                            Please share this 4-digit code with the vendor when they arrive to start the service.
                        </AppText>
                        <View style={styles.otpBox}>
                            <AppText style={styles.otpText} weight="bold">{booking.otp}</AppText>
                        </View>
                    </View>
                )}

                {/* Live Walking Tracker - Only for Walking Services in progress */}
                {booking.serviceName?.toLowerCase().includes('walking') && booking.status === 'in_progress' && (
                    <View style={styles.mapContainer}>
                        <View style={styles.mapHeader}>
                            <Ionicons name="paw" size={18} color={theme.colors.accent} />
                            <AppText style={styles.mapHeaderText} weight="bold">LIVE TRACKING</AppText>
                        </View>
                        <View style={styles.mapWrapper}>
                            <LiveTrackingMap 
                                bookingId={booking.id} 
                                initialLocation={{
                                    latitude: parseFloat(booking.latitude) || 28.7041,
                                    longitude: parseFloat(booking.longitude) || 77.1025
                                }} 
                            />
                        </View>
                    </View>
                )}

                <View style={styles.trackingContainer}>
                    {steps.map((step, index) => {
                        const isCompleted = index <= currentIndex;
                        const isLast = index === steps.length - 1;

                        return (
                            <View key={step.id} style={styles.stepContainer}>
                                <View style={styles.indicatorContainer}>
                                    <View style={[
                                        styles.dot,
                                        isCompleted ? styles.dotCompleted : styles.dotPending
                                    ]}>
                                        {isCompleted && <Ionicons name="checkmark" size={16} color="#FFF" />}
                                    </View>
                                    {!isLast && (
                                        <View style={[
                                            styles.line,
                                            index < currentIndex ? styles.lineCompleted : styles.linePending
                                        ]} />
                                    )}
                                </View>
                                <View style={styles.stepTextContainer}>
                                    <AppText style={[
                                        styles.stepTitle,
                                        isCompleted ? styles.stepTitleCompleted : styles.stepTitlePending
                                    ]} weight="bold">
                                        {step.title}
                                    </AppText>
                                    <AppText style={styles.stepDescription}>
                                        {step.description}
                                    </AppText>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        marginTop: 40,
    },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 20, },
    scrollContent: { padding: 20 },
    summaryCard: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 16,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    bookingId: { fontSize: 16, color: theme.colors.primaryDark, marginBottom: 5 },
    serviceName: { fontSize: 18, color: theme.colors.textBlack, fontWeight: '700', marginBottom: 2 },
    vendorName: { fontSize: 14, color: theme.colors.textSecondary },
    videoBtn: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 12,
        marginLeft: 10,
    },
    videoBtnText: {
        color: '#FFF',
        fontSize: 14,
        marginLeft: 6,
    },
    trackingContainer: {
        backgroundColor: '#FFF',
        padding: 25,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    stepContainer: {
        flexDirection: 'row',
        marginBottom: 0, // line handles spacing
    },
    indicatorContainer: {
        alignItems: 'center',
        marginRight: 15,
    },
    dot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    dotCompleted: {
        backgroundColor: '#2E7D32',
    },
    dotPending: {
        backgroundColor: '#E0E0E0',
        borderWidth: 2,
        borderColor: '#BDBDBD',
    },
    line: {
        width: 3,
        height: 50,
        marginTop: -4,
        marginBottom: -4,
        zIndex: 1,
    },
    lineCompleted: {
        backgroundColor: '#2E7D32',
    },
    linePending: {
        backgroundColor: '#E0E0E0',
    },
    stepTextContainer: {
        flex: 1,
        paddingBottom: 30, // Spacing between steps
    },
    stepTitle: {
        fontSize: 16,
        marginBottom: 4,
    },
    stepTitleCompleted: {
        color: '#2E7D32',
    },
    stepTitlePending: {
        color: '#9E9E9E',
    },
    stepDescription: {
        fontSize: 13,
        color: '#757575',
        lineHeight: 18,
    },
    mapContainer: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        marginBottom: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    mapHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F8F9FA',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    mapHeaderText: {
        fontSize: 12,
        color: theme.colors.accent,
        marginLeft: 6,
        letterSpacing: 1,
    },
    mapWrapper: {
        height: 220,
        width: '100%',
    },
    otpContainer: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(255, 140, 0, 0.2)',
    },
    otpTitle: {
        fontSize: 18,
        color: theme.colors.textBlack,
        marginBottom: 8,
    },
    otpDescription: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    otpBox: {
        backgroundColor: '#F8F9FA',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    otpText: {
        fontSize: 32,
        letterSpacing: 8,
        color: theme.colors.primary,
    }
});
