import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import AppHeader from '../components/AppHeader';
import { theme } from '../styles/theme';
import { BASE_URL } from '../services/api';
import { useBackHandler } from '../hooks/useBackHandler';

export default function BookingCancelledStatusScreen({ route, navigation }) {
    const { booking } = route.params;

    // Hardware back + visual back both go to MyBookings (terminal screen — nothing to go back to)
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

    // Resolve pet photo
    const petPhoto = booking?.petPhotoUrl
        ? (booking.petPhotoUrl.startsWith('http') ? booking.petPhotoUrl : `${BASE_URL}${booking.petPhotoUrl}`)
        : 'https://images.unsplash.com/photo-1591160690555-5debfba289f0?q=80&w=256&auto=format&fit=crop';

    // Resolve service tasks / details
    let serviceTasks = booking?.notes || '';
    if (serviceTasks.includes('_OP:1_')) serviceTasks = '';
    
    if (!serviceTasks && booking) {
        if (booking.bookingType === 'grooming') {
            serviceTasks = 'Full groom, nail trim, ear cleaning';
        } else if (booking.bookingType === 'walking') {
            serviceTasks = 'Regular dog walk, exercise, hydration';
        } else if (booking.bookingType === 'veterinary') {
            serviceTasks = 'Consultation, health check, prescription';
        } else if (booking.bookingType === 'boarding') {
            serviceTasks = 'Overnight stay, meals, playtime';
        } else {
            serviceTasks = 'Professional premium pet service';
        }
    }

    // Resolve address
    let addressString = '';
    if (booking?.fullAddress) {
        const parts = [
            booking.fullAddress,
            booking.areaLocality,
            booking.city,
            booking.state
        ].filter(Boolean);
        addressString = parts.join(', ');
    } else {
        addressString = '123456 Paws Lane, Noida Sector-42, Uttar Pradesh';
    }

    const totalCost = parseFloat(booking?.totalCost || '2200');
    // Using simple mock calculation for cancellation fee (50% based on info banner on details screen)
    const cancellationFee = totalCost * 0.5;
    const refundAmount = totalCost - cancellationFee;

    return (
        <AppScreen padding={false} style={styles.screen}>
            {/* Header */}
            <AppHeader title="Booking Status" onBack={handleBack} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Status Icon */}
                <View style={styles.statusIconContainer}>
                    <View style={styles.calendarCircle}>
                        <Ionicons name="calendar-outline" size={40} color="#607D8B" />
                        <View style={styles.closeIconBadge}>
                            <Ionicons name="close" size={16} color="#FFF" />
                        </View>
                    </View>
                </View>

                {/* Status Texts */}
                <AppText style={styles.statusTitle} type="heading" weight="bold">Booking Cancelled</AppText>
                <AppText style={styles.statusSubtitle}>
                    Your appointment for {booking?.petName || 'Bruno'} has been cancelled.
                </AppText>

                {/* Booking Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.cardHeaderRow}>
                        <Image source={{ uri: petPhoto }} style={styles.petImage} />
                        <View style={styles.petInfoContainer}>
                            <AppText style={styles.petName} type="heading" weight="bold">{booking?.petName || 'Bruno'}</AppText>
                            <AppText style={styles.serviceName}>{booking?.serviceName || (booking?.bookingType ? (booking.bookingType.charAt(0).toUpperCase() + booking.bookingType.slice(1)) : 'Pro Grooming')}</AppText>
                            <AppText style={styles.serviceTasks}>{serviceTasks}</AppText>
                        </View>
                        <View style={styles.cancelledTag}>
                            <AppText style={styles.cancelledTagText} weight="bold">CANCELLED</AppText>
                        </View>
                    </View>
                    
                    <View style={styles.divider} />

                    <View style={styles.cardMiddleRow}>
                        {/* Date Column */}
                        <View style={styles.metaColumn}>
                            <Ionicons name="pricetag-outline" size={16} color="#90A4AE" style={styles.metaIcon} />
                            <View style={styles.metaTextContainer}>
                                <AppText style={styles.metaLabel}>DATE & TIME</AppText>
                                <AppText style={styles.metaValue} weight="bold">
                                    {formatBookingDate(booking?.serviceDate)}{booking?.timeSlot ? ` • ${booking.timeSlot}` : ' • 10:30 AM'}
                                </AppText>
                            </View>
                        </View>
                        
                        <View style={styles.verticalDivider} />

                        {/* Groomer Column */}
                        <View style={styles.metaColumn}>
                            <Ionicons name="person-outline" size={16} color="#90A4AE" style={styles.metaIcon} />
                            <View style={styles.metaTextContainer}>
                                <AppText style={styles.metaLabel}>GROOMER</AppText>
                                <AppText style={styles.metaValue} weight="bold" numberOfLines={1}>
                                    {booking?.vendorName || 'Sarah Jenkins'}
                                </AppText>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.cardBottomRow}>
                        <Ionicons name="calendar-outline" size={16} color="#90A4AE" style={styles.metaIcon} />
                        <View style={styles.metaTextContainer}>
                            <AppText style={styles.metaLabel}>LOCATION</AppText>
                            <AppText style={styles.locationValue} weight="bold">
                                {addressString}
                            </AppText>
                        </View>
                    </View>
                </View>

                {/* Refund Details */}
                <View style={styles.refundCard}>
                    <AppText style={styles.refundTitle} weight="bold">Refund Details</AppText>
                    
                    <View style={styles.refundRow}>
                        <AppText style={styles.refundLabel}>Amount Paid</AppText>
                        <AppText style={styles.refundLabel}>Rs {totalCost}</AppText>
                    </View>
                    <View style={styles.refundRow}>
                        <AppText style={styles.refundLabel}>Cancellation Fee</AppText>
                        <AppText style={styles.refundLabel}>Rs {cancellationFee}</AppText>
                    </View>
                    
                    <View style={styles.refundDivider} />

                    <View style={styles.refundRow}>
                        <AppText style={styles.refundTotalLabel} weight="bold">Refund Amount</AppText>
                        <AppText style={styles.refundTotalLabel} weight="bold">Rs {refundAmount}</AppText>
                    </View>

                    <View style={styles.infoBanner}>
                        <Ionicons name="information-circle" size={18} color="#90A4AE" />
                        <AppText style={styles.infoBannerText}>
                            Amount will be refunded to your original payment method within 5-7 business days.
                        </AppText>
                    </View>
                </View>

            </ScrollView>
            
            {/* Bottom Button */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity 
                    style={styles.backToBookingsBtn}
                    onPress={() => navigation.navigate('MyBookings')}
                    activeOpacity={0.8}
                >
                    <AppText style={styles.backToBookingsBtnText} weight="bold">Back to My Bookings</AppText>
                </TouchableOpacity>
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F8F7F3',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: '#F8F7F3',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        color: theme.colors.textBlack,
        fontFamily: theme.fonts.heading,
        fontSize: 22,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    statusIconContainer: {
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    calendarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        position: 'relative',
    },
    closeIconBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#D32F2F',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F8F7F3',
    },
    statusTitle: {
        fontSize: 24,
        color: theme.colors.textBlack,
        textAlign: 'center',
        marginBottom: 8,
    },
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
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    petImage: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#EBEAE6',
    },
    petInfoContainer: {
        flex: 1,
        marginLeft: 16,
        marginRight: 10,
    },
    petName: {
        fontSize: 18,
        color: theme.colors.textBlack,
        marginBottom: 2,
    },
    serviceName: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },
    serviceTasks: {
        fontSize: 11,
        color: theme.colors.textTertiary,
    },
    cancelledTag: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    cancelledTagText: {
        color: '#D32F2F',
        fontSize: 10,
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 16,
    },
    cardMiddleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaColumn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    metaIcon: {
        marginRight: 10,
        marginTop: 2,
    },
    metaTextContainer: {
        flex: 1,
    },
    metaLabel: {
        fontSize: 10,
        color: theme.colors.textTertiary,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    metaValue: {
        fontSize: 13,
        color: theme.colors.textBlack,
    },
    verticalDivider: {
        width: 1,
        backgroundColor: '#F0F0F0',
        height: 32,
        marginHorizontal: 16,
    },
    cardBottomRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    locationValue: {
        fontSize: 13,
        color: theme.colors.textBlack,
        lineHeight: 18,
    },
    refundCard: {
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
    refundTitle: {
        fontSize: 18,
        color: theme.colors.textBlack,
        marginBottom: 16,
    },
    refundRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    refundLabel: {
        fontSize: 15,
        color: theme.colors.textSecondary,
    },
    refundDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 12,
    },
    refundTotalLabel: {
        fontSize: 16,
        color: theme.colors.textBlack,
    },
    infoBanner: {
        flexDirection: 'row',
        marginTop: 20,
        paddingRight: 10,
    },
    infoBannerText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginLeft: 10,
        lineHeight: 18,
        flex: 1,
    },
    bottomContainer: {
        padding: 20,
        paddingBottom: 30, // For safer area
        backgroundColor: '#F8F7F3',
    },
    backToBookingsBtn: {
        backgroundColor: '#4E6C48',
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backToBookingsBtnText: {
        color: theme.colors.white,
        fontSize: 16,
    }
});
