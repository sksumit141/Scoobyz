import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Animated,
    Easing,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { bookingsApi } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { formatISTDate } from '../utils/date_utils';
import InvoiceComponent from '../components/InvoiceComponent';
import PawLoader from '../components/PawLoader';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120000; // 2 minutes

export default function BookingPendingScreen({ navigation, route }) {
    const {
        bookingId,
        expert = {},
        serviceType = 'Service',
        total = 0,
        date,
        time,
        visitType,
        pet = {},
    } = route.params || {};

    const [status, setStatus] = useState('pending');
    const [showDeclinedModal, setShowDeclinedModal] = useState(false);
    const [timedOut, setTimedOut] = useState(false);
    const [dotCount, setDotCount] = useState(1);
    
    const [invoiceVisible, setInvoiceVisible] = useState(false);
    const [bookingData, setBookingData] = useState(null);
    const [paying, setPaying] = useState(false);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const intervalRef = useRef(null);
    const timeoutRef = useRef(null);
    const dotRef = useRef(null);

    useEffect(() => {
        startPulsing();
        startPolling();
        startDotAnimation();

        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            // Prevent going back if still pending and not timed out
            if (!timedOut && status === 'pending') {
                e.preventDefault();
            }
        });

        return () => {
            clearInterval(intervalRef.current);
            clearTimeout(timeoutRef.current);
            clearInterval(dotRef.current);
            pulseAnim.stopAnimation();
            unsubscribe();
        };
    }, [navigation, timedOut, status]);

    const startPulsing = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.12,
                    duration: 900,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 900,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const startDotAnimation = () => {
        dotRef.current = setInterval(() => {
            setDotCount(prev => (prev % 3) + 1);
        }, 500);
    };

    const startPolling = () => {
        intervalRef.current = setInterval(async () => {
            try {
                const data = await bookingsApi.getStatus(bookingId);
                if (data?.status === 'confirmed') {
                    handleAccepted(data);
                } else if (data?.status === 'declined') {
                    handleDeclined();
                } else if (data?.status === 'pending' && data?.paymentStatus === 'awaiting_payment') {
                    stopPolling();
                    setBookingData(data);
                    setInvoiceVisible(true);
                }
            } catch (err) {
                console.warn('[Pending] Poll error:', err.message);
            }
        }, POLL_INTERVAL_MS);

        timeoutRef.current = setTimeout(() => {
            clearInterval(intervalRef.current);
            setTimedOut(true);
        }, POLL_TIMEOUT_MS);
    };

    const stopPolling = () => {
        clearInterval(intervalRef.current);
        clearTimeout(timeoutRef.current);
        clearInterval(dotRef.current);
    };

    const handleAccepted = (bookingData) => {
        stopPolling();
        setStatus('confirmed');

        const CONFIRMED_SCREENS = {
            Grooming: 'BookingConfirmed',
            Boarding: 'BoardingConfirmed',
            Walking: 'WalkingConfirmed',
            Veterinary: 'VetConfirmed',
        };
        const confirmedScreen = CONFIRMED_SCREENS[serviceType] || 'BookingConfirmed';

        setTimeout(() => {
            navigation.reset({
                index: 1,
                routes: [
                    { name: 'LandingScreen' },
                    {
                        name: confirmedScreen,
                        params: {
                            bookingId,
                            expert,
                            pet,
                            serviceType,
                            total: bookingData?.totalCost || total,
                            date,
                            time,
                            visitType,
                            paymentType: bookingData?.paymentType || route.params?.paymentType || 'full',
                            amountPaid: bookingData?.amountPaid || route.params?.amountPaid || bookingData?.totalCost || total,
                            remainingAmount: bookingData?.remainingAmount || route.params?.remainingAmount || 0,
                            paymentMethod: 'online',
                            bookingData,
                        },
                    },
                ],
            });
        }, 600);
    };

    const handleDeclined = () => {
        stopPolling();
        setStatus('declined');
        setShowDeclinedModal(true);
    };

    const handlePayBalance = async () => {
        if (!bookingData) return;
        setPaying(true);
        try {
            await bookingsApi.payRemaining(bookingData.id, { amountPaid: bookingData.remainingAmount });
            setInvoiceVisible(false);
            const updatedData = await bookingsApi.getStatus(bookingData.id);
            handleAccepted(updatedData);
        } catch (error) {
            console.error('Payment error:', error);
            alert('Failed to process payment. Please try again.');
        } finally {
            setPaying(false);
        }
    };

    const dots = '.'.repeat(dotCount);

    return (
        <AppScreen safeAreaTop={false} padding={false} backgroundColor={theme.colors.success}>
            <LinearGradient
                colors={[theme.colors.success, theme.colors.success]}
                style={styles.container}
            >


                <View style={styles.body}>
                    {/* Pulse Animation */}
                    <View style={styles.animationContainer}>
                        <Animated.View style={[styles.outerRing, { transform: [{ scale: pulseAnim }] }]} />
                        <Animated.View style={[styles.innerRing, { transform: [{ scale: pulseAnim }] }]} />
                        <View style={styles.iconCircle}>
                            <Ionicons name="hourglass-outline" size={40} color={theme.colors.primaryDark} />
                        </View>
                    </View>

                    {timedOut ? (
                        <>
                            <AppText style={styles.title} weight="bold">No Response Yet</AppText>
                            <AppText style={styles.subtitle}>
                                The vendor hasn't responded within 2 minutes.{'\n'}Please try again or choose another vendor.
                            </AppText>
                            <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
                                <AppText style={styles.retryBtnText} weight="bold">Go Back</AppText>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <AppText style={styles.title} weight="bold">Waiting for Vendor{dots}</AppText>
                            <AppText style={styles.subtitle}>
                                Your booking request has been sent to{'\n'}
                                <AppText weight="bold" style={{ color: theme.colors.white }}>
                                    {expert.name || expert.businessName || 'the vendor'}
                                </AppText>
                                {'\n'}Please wait while they confirm your slot.
                            </AppText>

                            {/* Booking Summary Pill */}
                            <View style={styles.summaryPill}>
                                <Ionicons name="calendar-outline" size={16} color={theme.colors.white} />
                                <AppText style={styles.summaryText}>{serviceType}</AppText>
                                <View style={styles.pillDot} />
                                <AppText style={styles.summaryText}>₹{total}</AppText>
                                {date && (
                                    <>
                                        <View style={styles.pillDot} />
                                        <AppText style={styles.summaryText}>{formatISTDate(date, { day: 'numeric', month: 'short' })}</AppText>
                                    </>
                                )}
                            </View>

                            <AppText style={styles.bookingIdText}>Booking #{bookingId}</AppText>
                        </>
                    )}
                </View>
            </LinearGradient>

            {/* Declined Modal */}
            <Modal transparent animationType="slide" visible={showDeclinedModal}>
                <View style={styles.modalOverlay}>
                    <View style={styles.declinedModal}>
                        <View style={styles.declinedIconBox}>
                            <Ionicons name="close-circle" size={56} color="#D32F2F" />
                        </View>
                        <AppText style={styles.declinedTitle} weight="bold">Vendor is Busy</AppText>
                        <AppText style={styles.declinedMsg}>
                            {expert.name || 'This vendor'} is currently busy and has declined your request. Your refund will be initiated shortly.
                        </AppText>
                        <TouchableOpacity
                            style={styles.searchAnotherBtn}
                            onPress={() => {
                                setShowDeclinedModal(false);
                                navigation.goBack();
                                navigation.goBack(); // Go back past BookVendor to vendor list
                            }}
                        >
                            <Ionicons name="search" size={18} color="#FFF" style={{ marginRight: 8 }} />
                            <AppText style={styles.searchAnotherBtnText} weight="bold">Search Another Vendor</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.backHomeBtn}
                            onPress={() => {
                                setShowDeclinedModal(false);
                                navigation.navigate('LandingScreen');
                            }}
                        >
                            <AppText style={styles.backHomeBtnText} weight="bold">Back to Home</AppText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Invoice Modal */}
            <Modal transparent animationType="slide" visible={invoiceVisible}>
                <View style={styles.invoiceModalOverlay}>
                    <View style={styles.invoiceModalContent}>
                        <TouchableOpacity style={styles.closeInvoiceBtn} onPress={() => {
                            setInvoiceVisible(false);
                            // If they close, maybe they can pay later from MyBookings
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'LandingScreen' }]
                            });
                        }}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                        <InvoiceComponent 
                            booking={bookingData} 
                            onPayBalance={handlePayBalance} 
                        />
                        {paying && (
                            <View style={styles.payingOverlay}>
                                <PawLoader fullScreen={false} />
                                <AppText style={{ marginTop: 10, color: '#333' }} weight="bold">Processing Payment...</AppText>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

        </AppScreen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 16,
        paddingRight: 24,
        paddingTop: 44,
        paddingBottom: 12,
    },
    backButton: { marginRight: 12 },
    headerTitle: { fontSize: 20, color: theme.colors.white },

    body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

    animationContainer: {
        width: 140,
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    outerRing: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    innerRing: {
        position: 'absolute',
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },

    title: { fontSize: 24, color: theme.colors.white, textAlign: 'center', marginBottom: 12 },
    subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 24, marginBottom: 32 },

    summaryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Glassmorphic look
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
        elevation: 0,
        marginBottom: 16,
    },
    summaryText: { fontSize: 14, color: theme.colors.white, fontWeight: '600' },
    pillDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },
    bookingIdText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },

    retryBtn: {
        backgroundColor: theme.colors.white,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 24,
    },
    retryBtnText: { color: theme.colors.primaryDark, fontSize: 16 },

    // Declined Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    declinedModal: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 32,
        alignItems: 'center',
        paddingBottom: 48,
    },
    declinedIconBox: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#FFEBEE',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    declinedTitle: { fontSize: 24, color: '#D32F2F', marginBottom: 12 },
    declinedMsg: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 28 },
    searchAnotherBtn: {
        backgroundColor: theme.colors.primaryDark,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 14,
        width: '100%',
        justifyContent: 'center',
        marginBottom: 12,
    },
    searchAnotherBtnText: { color: '#FFF', fontSize: 15 },
    backHomeBtn: {
        paddingVertical: 14,
        paddingHorizontal: 24,
    },
    backHomeBtnText: { color: theme.colors.textSecondary, fontSize: 15 },

    // Invoice Modal
    invoiceModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20
    },
    invoiceModalContent: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 10,
    },
    closeInvoiceBtn: {
        alignSelf: 'flex-end',
        padding: 10,
        zIndex: 10
    },
    payingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
        zIndex: 20
    }
});
