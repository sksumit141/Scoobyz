import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { BASE_URL, bookingsApi } from '../services/api';
import { useBackHandler } from '../hooks/useBackHandler';
import { initSocket } from '../lib/socket';

// status: 'waiting' | 'accepted' | 'declined'
export default function BookingRescheduledStatusScreen({ route, navigation }) {
    const { booking: initialBooking, bookingId: routeBookingId } = route.params;
    const [booking, setBooking] = useState(initialBooking);
    const [status, setStatus] = useState('waiting'); // waiting, accepted, declined
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const statusRef = useRef('waiting'); // track status in ref so polling can bail out

    const bookingId = routeBookingId || initialBooking?.id;

    const resolveStatus = (bookingStatus) => {
        if (bookingStatus === 'confirmed') {
            statusRef.current = 'accepted';
            setStatus('accepted');
        } else if (bookingStatus === 'declined') {
            statusRef.current = 'declined';
            setStatus('declined');
        }
    };

    // Pulse animation for the waiting icon
    useEffect(() => {
        if (status !== 'waiting') return;
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, easing: Easing.ease, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.ease, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [status]);

    // Polling fallback — checks every 5s in case the socket event was missed
    useEffect(() => {
        let isMounted = true;

        const checkStatus = async () => {
            if (!isMounted || statusRef.current !== 'waiting') return;
            try {
                const updated = await bookingsApi.get(bookingId);
                if (!isMounted) return;
                setBooking(updated);
                resolveStatus(updated.status);
            } catch (e) {
                // silent fail — polling will retry
            }
        };

        // Check immediately on mount (handles case where vendor already acted)
        checkStatus();

        // Then poll every 5 seconds while still waiting
        const interval = setInterval(() => {
            if (statusRef.current !== 'waiting') {
                clearInterval(interval);
                return;
            }
            checkStatus();
        }, 5000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [bookingId]);

    // Socket listener for instant vendor response (no delay)
    useEffect(() => {
        let isMounted = true;
        let socketInstance = null;

        const setup = async () => {
            socketInstance = await initSocket();
            if (!socketInstance || !isMounted) return;

            socketInstance.on('new_notification', async (notif) => {
                if (!isMounted) return;
                // Accept any booking_update — re-fetch and check status
                if (notif.type === 'booking_update') {
                    const notifBookingId = notif.metadata?.bookingId;
                    if (String(notifBookingId) !== String(bookingId)) return;
                    try {
                        const updated = await bookingsApi.get(bookingId);
                        if (!isMounted) return;
                        setBooking(updated);
                        resolveStatus(updated.status);
                    } catch (e) {
                        console.error('Socket: Failed to refetch booking:', e);
                    }
                }
            });
        };

        setup();
        return () => {
            isMounted = false;
            if (socketInstance) socketInstance.off('new_notification');
        };
    }, [bookingId]);

    // Disable back while waiting — go to MyBookings if already resolved
    const { handleBack } = useBackHandler({
        onBack: () => {
            navigation.navigate('MyBookings');
            return true;
        }
    });

    const formatBookingDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Kolkata',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }).format(d);
        } catch (e) {
            return '';
        }
    };

    const petPhoto = booking?.petPhotoUrl
        ? (booking.petPhotoUrl.startsWith('http') ? booking.petPhotoUrl : `${BASE_URL}${booking.petPhotoUrl}`)
        : 'https://images.unsplash.com/photo-1591160690555-5debfba289f0?q=80&w=256&auto=format&fit=crop';

    let serviceTasks = booking?.notes || '';
    if (!serviceTasks && booking) {
        if (booking.bookingType === 'grooming') serviceTasks = 'Full groom, nail trim, ear cleaning';
        else if (booking.bookingType === 'walking') serviceTasks = 'Regular dog walk, exercise, hydration';
        else if (booking.bookingType === 'veterinary') serviceTasks = 'Consultation, health check, prescription';
        else if (booking.bookingType === 'boarding') serviceTasks = 'Overnight stay, meals, playtime';
        else serviceTasks = 'Professional premium pet service';
    }

    let addressString = '';
    if (booking?.fullAddress) {
        addressString = [booking.fullAddress, booking.areaLocality, booking.city, booking.state].filter(Boolean).join(', ');
    } else {
        addressString = '123456 Paws Lane, Noida Sector-42, Uttar Pradesh';
    }

    const totalCost = parseFloat(booking?.totalCost || '2200');

    const renderStatusIcon = () => {
        if (status === 'waiting') {
            return (
                <Animated.View style={[styles.iconCircle, styles.iconWaiting, { transform: [{ scale: pulseAnim }] }]}>
                    <ActivityIndicator size="large" color="#7B5EA7" />
                </Animated.View>
            );
        }
        if (status === 'accepted') {
            return (
                <View style={[styles.iconCircle, styles.iconAccepted]}>
                    <Ionicons name="checkmark-circle" size={52} color="#4E6C48" />
                </View>
            );
        }
        return (
            <View style={[styles.iconCircle, styles.iconDeclined]}>
                <Ionicons name="close-circle" size={52} color="#D32F2F" />
            </View>
        );
    };

    const renderStatusText = () => {
        if (status === 'waiting') {
            return (
                <>
                    <AppText style={styles.statusTitle} type="heading" weight="bold">Waiting for Vendor...</AppText>
                    <AppText style={styles.statusSubtitle}>
                        Your reschedule request has been sent to the vendor. Please wait while they review it.
                    </AppText>
                </>
            );
        }
        if (status === 'accepted') {
            return (
                <>
                    <AppText style={[styles.statusTitle, { color: '#4E6C48' }]} type="heading" weight="bold">Reschedule Confirmed! </AppText>
                    <AppText style={styles.statusSubtitle}>
                        The vendor has accepted your reschedule. Your appointment for {booking?.petName || 'your pet'} is set!
                    </AppText>
                </>
            );
        }
        return (
            <>
                <AppText style={[styles.statusTitle, { color: '#D32F2F' }]} type="heading" weight="bold">Request Declined</AppText>
                <AppText style={styles.statusSubtitle}>
                    The vendor couldn't accommodate this new date. Please select a different date and time.
                </AppText>
            </>
        );
    };

    const renderTag = () => {
        if (status === 'waiting') return <View style={[styles.tag, { backgroundColor: '#7B5EA7' }]}><AppText style={styles.tagText} weight="bold">PENDING APPROVAL</AppText></View>;
        if (status === 'accepted') return <View style={[styles.tag, { backgroundColor: '#4E6C48' }]}><AppText style={styles.tagText} weight="bold">CONFIRMED</AppText></View>;
        return <View style={[styles.tag, { backgroundColor: '#D32F2F' }]}><AppText style={styles.tagText} weight="bold">DECLINED</AppText></View>;
    };

    return (
        <AppScreen padding={false} style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
                    <Ionicons name="arrow-back-outline" size={26} color={theme.colors.textBlack} />
                </TouchableOpacity>
                <AppText style={styles.headerTitle} type="heading" weight="bold">Booking Status</AppText>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Status Icon */}
                <View style={styles.statusIconContainer}>
                    {renderStatusIcon()}
                </View>

                {/* Status Texts */}
                {renderStatusText()}

                {/* Booking Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.cardHeaderRow}>
                        <Image source={{ uri: petPhoto }} style={styles.petImage} />
                        <View style={styles.petInfoContainer}>
                            <AppText style={styles.petName} type="heading" weight="bold">{booking?.petName || 'Bruno'}</AppText>
                            <AppText style={styles.serviceName}>{booking?.serviceName || (booking?.bookingType ? (booking.bookingType.charAt(0).toUpperCase() + booking.bookingType.slice(1)) : 'Pro Grooming')}</AppText>
                            <AppText style={styles.serviceTasks}>{serviceTasks}</AppText>
                        </View>
                        {renderTag()}
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.cardMiddleRow}>
                        <View style={styles.metaColumn}>
                            <Ionicons name="calendar-outline" size={16} color="#90A4AE" style={styles.metaIcon} />
                            <View style={styles.metaTextContainer}>
                                <AppText style={styles.metaLabel}>DATE & TIME</AppText>
                                <AppText style={styles.metaValue} weight="bold">
                                    {formatBookingDate(booking?.serviceDate)}{booking?.serviceTimeSlot ? ` • ${booking.serviceTimeSlot}` : (booking?.timeSlot ? ` • ${booking.timeSlot}` : ' • 10:30 AM')}
                                </AppText>
                            </View>
                        </View>

                        <View style={styles.verticalDivider} />

                        <View style={styles.metaColumn}>
                            <Ionicons name="person-outline" size={16} color="#90A4AE" style={styles.metaIcon} />
                            <View style={styles.metaTextContainer}>
                                <AppText style={styles.metaLabel}>VENDOR</AppText>
                                <AppText style={styles.metaValue} weight="bold" numberOfLines={1}>
                                    {booking?.vendorName || 'Expert'}
                                </AppText>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.cardBottomRow}>
                        <Ionicons name="location-outline" size={16} color="#90A4AE" style={styles.metaIcon} />
                        <View style={styles.metaTextContainer}>
                            <AppText style={styles.metaLabel}>LOCATION</AppText>
                            <AppText style={styles.locationValue} weight="bold">{addressString}</AppText>
                        </View>
                    </View>
                </View>

                {/* Amount Paid */}
                <View style={styles.amountCard}>
                    <View style={styles.receiptIconContainer}>
                        <Ionicons name="receipt-outline" size={24} color="#607D8B" />
                    </View>
                    <View style={styles.amountTextContainer}>
                        <AppText style={styles.amountLabel} weight="bold">Amount Paid</AppText>
                        <View style={styles.viewDetailRow}>
                            <AppText style={styles.viewDetailText}>VIEW DETAIL</AppText>
                            <Ionicons name="chevron-forward" size={12} color={theme.colors.textTertiary} />
                        </View>
                    </View>
                    <AppText style={styles.amountValue} weight="bold">₹ {totalCost}</AppText>
                </View>

            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.bottomContainer}>
                {status === 'waiting' && (
                    <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => navigation.navigate('MyBookings')} activeOpacity={0.8}>
                        <AppText style={styles.btnSecondaryText} weight="bold">View All Bookings</AppText>
                    </TouchableOpacity>
                )}
                {status === 'accepted' && (
                    <TouchableOpacity style={[styles.btn, styles.btnSuccess]} onPress={() => navigation.navigate('MyBookings')} activeOpacity={0.8}>
                        <AppText style={styles.btnText} weight="bold">Back to My Bookings</AppText>
                    </TouchableOpacity>
                )}
                {status === 'declined' && (
                    <View style={{ gap: 12 }}>
                        <TouchableOpacity
                            style={[styles.btn, styles.btnPrimary]}
                            onPress={() => navigation.navigate('BookingCardDetails', { bookingId: bookingId, openReschedule: true })}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="calendar-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                            <AppText style={styles.btnText} weight="bold">Choose Another Date & Time</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => navigation.navigate('MyBookings')} activeOpacity={0.8}>
                            <AppText style={styles.btnSecondaryText} weight="bold">Back to My Bookings</AppText>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F8F7F3' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 10,
        backgroundColor: '#F8F7F3',
    },
    backButton: { marginRight: 16 },
    headerTitle: { color: theme.colors.textBlack, fontSize: 22 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    statusIconContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    iconWaiting: { backgroundColor: '#F3EEF9' },
    iconAccepted: { backgroundColor: '#EDF5EC' },
    iconDeclined: { backgroundColor: '#FFEBEE' },
    statusTitle: { fontSize: 24, color: theme.colors.textBlack, textAlign: 'center', marginBottom: 8 },
    statusSubtitle: {
        fontSize: 15,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    summaryCard: {
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start' },
    petImage: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#EBEAE6' },
    petInfoContainer: { flex: 1, marginLeft: 16, marginRight: 10 },
    petName: { fontSize: 18, color: theme.colors.textBlack, marginBottom: 2 },
    serviceName: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 2 },
    serviceTasks: { fontSize: 11, color: theme.colors.textTertiary },
    tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    tagText: { color: '#FFF', fontSize: 10, letterSpacing: 0.5 },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 16 },
    cardMiddleRow: { flexDirection: 'row', alignItems: 'center' },
    metaColumn: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
    metaIcon: { marginRight: 10, marginTop: 2 },
    metaTextContainer: { flex: 1 },
    metaLabel: { fontSize: 10, color: theme.colors.textTertiary, letterSpacing: 0.5, marginBottom: 4 },
    metaValue: { fontSize: 13, color: theme.colors.textBlack },
    verticalDivider: { width: 1, backgroundColor: '#F0F0F0', height: 32, marginHorizontal: 16 },
    cardBottomRow: { flexDirection: 'row', alignItems: 'flex-start' },
    locationValue: { fontSize: 13, color: theme.colors.textBlack, lineHeight: 18 },
    amountCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 20,
    },
    receiptIconContainer: { marginRight: 16 },
    amountTextContainer: { flex: 1, justifyContent: 'center' },
    amountLabel: { fontSize: 16, color: theme.colors.textBlack, marginBottom: 4 },
    viewDetailRow: { flexDirection: 'row', alignItems: 'center' },
    viewDetailText: { fontSize: 11, color: theme.colors.textTertiary, marginRight: 4, letterSpacing: 0.5 },
    amountValue: { fontSize: 20, color: theme.colors.textBlack },
    bottomContainer: { padding: 20, paddingBottom: 30, backgroundColor: '#F8F7F3' },
    btn: {
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    btnPrimary: { backgroundColor: theme.colors.primaryDark },
    btnSuccess: { backgroundColor: '#4E6C48' },
    btnSecondary: { backgroundColor: '#EEE' },
    btnText: { color: '#FFF', fontSize: 16 },
    btnSecondaryText: { color: '#555', fontSize: 16 },
});
