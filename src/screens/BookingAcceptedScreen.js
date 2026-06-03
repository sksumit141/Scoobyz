import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { BASE_URL } from '../services/api';
import { formatISTDate } from '../utils/date_utils';

const { width } = Dimensions.get('window');

const CONFIRMED_SCREENS = {
    Grooming: 'BookingConfirmed',
    Boarding: 'BoardingConfirmed',
    Walking: 'WalkingConfirmed',
    Veterinary: 'VetConfirmed',
};

export default function BookingAcceptedScreen({ navigation, route }) {
    const {
        bookingId,
        expert = {},
        serviceType = 'Grooming',
        total = 0,
        date,
        time,
        visitType,
        pet = {},
    } = route.params || {};

    const [paymentType, setPaymentType] = useState('full');

    const confirmedScreen = CONFIRMED_SCREENS[serviceType] || 'BookingConfirmed';

    const handleProceed = () => {
        const amountPaid = paymentType === 'full' ? total : (total * 0.3).toFixed(2);
        const remainingAmount = paymentType === 'full' ? 0 : (total * 0.7).toFixed(2);

        // Reset the entire navigation stack so back button goes to Home, not the booking flow
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
                        total,
                        date,
                        time,
                        visitType,
                        paymentType,
                        amountPaid,
                        remainingAmount,
                        paymentMethod: 'online',
                    },
                },
            ],
        });
    };

    return (
        <AppScreen safeArea={false} padding={false} backgroundColor="#FBFBFB">
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textBlack} />
                </TouchableOpacity>
                <AppText style={styles.headerTitle} weight="bold">Complete Payment</AppText>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Success Banner */}
                <View style={styles.successBanner}>
                    <View style={styles.successIconWrapper}>
                        <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                    </View>
                    <View style={styles.successTextWrapper}>
                        <AppText style={styles.successTitle} weight="bold">Request Accepted!</AppText>
                        <AppText style={styles.successSub}>{expert.name || 'The expert'} is ready for your pet.</AppText>
                    </View>
                </View>

                {/* Service Details Card */}
                <View style={styles.section}>
                    <View style={styles.sectionRow}>
                        <Ionicons name="paw-outline" size={18} color={theme.colors.textSecondary} />
                        <AppText style={styles.sectionLabel}>BOOKING DETAILS</AppText>
                    </View>
                    <View style={styles.card}>
                        <View style={styles.detailItem}>
                            <Ionicons name="person-outline" size={16} color={theme.colors.primaryDark} />
                            <AppText style={styles.detailText}>{expert.name || 'Expert'}</AppText>
                        </View>
                        <View style={styles.detailItem}>
                            <Ionicons name="calendar-outline" size={16} color={theme.colors.primaryDark} />
                            <AppText style={styles.detailText}>{formatISTDate(date)} • {time}</AppText>
                        </View>
                        {visitType && (
                            <View style={styles.detailItem}>
                                <Ionicons name="location-outline" size={16} color={theme.colors.primaryDark} />
                                <AppText style={styles.detailText}>{visitType}</AppText>
                            </View>
                        )}
                        <View style={styles.detailItem}>
                            <Ionicons name="id-card-outline" size={16} color={theme.colors.primaryDark} />
                            <AppText style={styles.detailText}>Booking ID: #{bookingId}</AppText>
                        </View>
                    </View>
                </View>

                {/* Payment Options */}
                <View style={styles.section}>
                    <View style={styles.sectionRow}>
                        <Ionicons name="card-outline" size={18} color={theme.colors.textSecondary} />
                        <AppText style={styles.sectionLabel}>PAYMENT OPTIONS (MANDATORY)</AppText>
                    </View>
                    <View style={{ gap: 12 }}>
                        <TouchableOpacity 
                            style={[styles.paymentOptionCard, paymentType === 'full' && styles.paymentOptionActive]}
                            onPress={() => setPaymentType('full')}
                        >
                            <View style={styles.paymentOptionInfo}>
                                <AppText style={[styles.paymentOptionTitle, paymentType === 'full' && { color: theme.colors.primaryDark }]} weight="bold">Pay 100% Now</AppText>
                                <AppText style={styles.paymentOptionSub}>Pay the full amount ₹{total} now</AppText>
                            </View>
                            <View style={[styles.radioCircle, paymentType === 'full' && styles.radioCircleActive]}>
                                {paymentType === 'full' && <View style={styles.radioInner} />}
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.paymentOptionCard, paymentType === 'partial' && styles.paymentOptionActive]}
                            onPress={() => setPaymentType('partial')}
                        >
                            <View style={styles.paymentOptionInfo}>
                                <AppText style={[styles.paymentOptionTitle, paymentType === 'partial' && { color: theme.colors.primaryDark }]} weight="bold">Pay 30% Now</AppText>
                                <AppText style={styles.paymentOptionSub}>Pay ₹{(total * 0.3).toFixed(2)} now, balance ₹{(total * 0.7).toFixed(2)} at service</AppText>
                            </View>
                            <View style={[styles.radioCircle, paymentType === 'partial' && styles.radioCircleActive]}>
                                {paymentType === 'partial' && <View style={styles.radioInner} />}
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Amount Summary */}
                <View style={styles.section}>
                    <View style={styles.priceRow}>
                        <AppText style={styles.priceLabel}>Service Total</AppText>
                        <AppText style={styles.priceValue}>₹{total}</AppText>
                    </View>
                    <View style={styles.priceRow}>
                        <AppText style={styles.priceLabel}>Payable Now</AppText>
                        <AppText style={[styles.priceValue, { color: theme.colors.primaryDark, fontSize: 20 }]} weight="bold">
                            ₹{paymentType === 'full' ? total : (total * 0.3).toFixed(2)}
                        </AppText>
                    </View>
                </View>
            </ScrollView>

            {/* Footer Action */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.payBtn} onPress={handleProceed}>
                    <AppText style={styles.payBtnText} weight="bold">Proceed to Pay ₹{paymentType === 'full' ? total : (total * 0.3).toFixed(2)}</AppText>
                </TouchableOpacity>
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: '#FFF',
    },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, color: theme.colors.textBlack },
    
    successBanner: {
        flexDirection: 'row',
        backgroundColor: '#E8F5E9',
        margin: 20,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
    },
    successIconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    successTextWrapper: { flex: 1 },
    successTitle: { fontSize: 18, color: '#2E7D32', marginBottom: 2 },
    successSub: { fontSize: 13, color: '#666' },

    section: { paddingHorizontal: 20, marginBottom: 24 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    sectionLabel: { fontSize: 12, color: theme.colors.textSecondary, letterSpacing: 1 },
    
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        gap: 12,
    },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    detailText: { fontSize: 15, color: theme.colors.textBlack },

    paymentOptionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    paymentOptionActive: {
        borderColor: theme.colors.primaryDark,
        backgroundColor: 'rgba(140, 111, 196, 0.05)',
    },
    paymentOptionInfo: { flex: 1 },
    paymentOptionTitle: { fontSize: 15, color: theme.colors.textBlack, marginBottom: 2 },
    paymentOptionSub: { fontSize: 12, color: theme.colors.textSecondary },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#DDD',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    radioCircleActive: { borderColor: theme.colors.primaryDark },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primaryDark },

    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    priceLabel: { fontSize: 15, color: '#666' },
    priceValue: { fontSize: 16, color: theme.colors.textBlack },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 34,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    payBtn: {
        backgroundColor: theme.colors.primaryDark,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    payBtnText: { color: '#FFF', fontSize: 16 },
});
