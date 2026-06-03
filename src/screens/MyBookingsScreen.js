import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, StatusBar, SafeAreaView, ScrollView, Modal, Alert, Image } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { bookingsApi, BASE_URL } from '../services/api';
import { useIsFocused } from '@react-navigation/native';
import InvoiceComponent from '../components/InvoiceComponent';

export default function MyBookingsScreen({ navigation }) {
    const [allBookings, setAllBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', 'cancelled'
    const [invoiceVisible, setInvoiceVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const isFocused = useIsFocused();

    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch all bookings at once to support fast, instantaneous client-side filtering
            const data = await bookingsApi.list();
            setAllBookings(data);
        } catch (error) {
            console.error('Fetch bookings error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isFocused) fetchBookings();
    }, [isFocused, fetchBookings]);

    const handlePayBalance = (booking) => {
        Alert.alert(
            'Pay Balance',
            `Complete payment of ₹${booking.remainingAmount} for ${booking.serviceName || 'this service'}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Pay Now',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await bookingsApi.payRemaining(booking.id, {
                                amountPaid: booking.remainingAmount,
                                paymentReferenceId: 'MOCK_REF_' + Date.now()
                            });
                            setInvoiceVisible(false);
                            Alert.alert('Success', 'Payment completed successfully!');
                            fetchBookings();
                        } catch (err) {
                            Alert.alert('Payment Failed', err.message);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const getFilteredBookings = useCallback(() => {
        return allBookings.filter(item => {
            const status = (item.status || '').toLowerCase();
            if (filter === 'upcoming') {
                return status === 'pending' || status === 'confirmed' || status === 'in_progress' || status === 'rescheduled';
            } else if (filter === 'past') {
                return status === 'completed';
            } else if (filter === 'cancelled') {
                return status === 'cancelled' || status === 'declined';
            }
            return true;
        });
    }, [allBookings, filter]);

    const formatBookingDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Kolkata',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            return formatter.format(d); // e.g. "Apr 24, 2026"
        } catch (e) {
            return '';
        }
    };

    const BookingCard = ({ item }) => {
        // Resolve service icon with appropriate fallback
        const serviceLogo = item.serviceIcon
            ? (item.serviceIcon.startsWith('http') ? item.serviceIcon : `${BASE_URL}${item.serviceIcon}`)
            : 'https://images.unsplash.com/photo-1591160690555-5debfba289f0?q=80&w=256&auto=format&fit=crop';

        // Resolve vendor image or use default placeholder
        const vendorRoleLabel =
            item.bookingType === 'grooming' ? 'GROOMER' :
                item.bookingType === 'walking' ? 'WALKER' :
                    item.bookingType === 'veterinary' ? 'VET' :
                        'EXPERT';

        // Resolve address details
        let addressString = '';
        if (item.fullAddress) {
            const parts = [
                item.fullAddress,
                item.areaLocality,
                item.city,
                item.state
            ].filter(Boolean);
            addressString = parts.join(', ');
        } else {
            addressString = '123456 Paws Lane, Noida Sector-42, Uttar Pradesh'; // Premium mockup placeholder fallback
        }

        // Resolve service tasks / details
        let serviceTasks = '';
        if (item.notes && item.notes.trim().length > 0) {
            serviceTasks = item.notes;
        } else {
            if (item.bookingType === 'grooming') {
                serviceTasks = 'Full groom, nail trim, ear cleaning';
            } else if (item.bookingType === 'walking') {
                serviceTasks = 'Regular dog walk, exercise, hydration';
            } else if (item.bookingType === 'veterinary') {
                serviceTasks = 'Consultation, health check, prescription';
            } else if (item.bookingType === 'boarding') {
                serviceTasks = 'Overnight stay, meals, playtime';
            } else {
                serviceTasks = 'Professional premium pet service';
            }
        }

        // Active actions
        const hasActions = ['pending', 'confirmed', 'in_progress', 'completed'].includes(item.status);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('BookingCardDetails', { bookingId: item.id })}
            >
                {/* Top Section: Pet image, names, chevron */}
                <View style={styles.cardTopRow}>
                    <Image source={{ uri: serviceLogo }} style={styles.petImage} />
                    <View style={styles.petInfoContainer}>
                        <AppText style={styles.petName} type="heading" weight="bold">{item.petName || 'Bruno'}</AppText>
                        <AppText style={styles.serviceName} weight="bold">{item.serviceName || (item.bookingType ? item.bookingType.toUpperCase() : 'Pro Grooming')}</AppText>
                        <AppText style={styles.serviceTasks} numberOfLines={2}>{serviceTasks}</AppText>
                    </View>
                    {item.status === 'cancelled' && <View style={[styles.statusTag, { backgroundColor: '#F5F5F5' }]}><AppText style={[styles.statusTagText, { color: '#757575' }]}>CANCELLED</AppText></View>}
                    {item.status === 'declined' && <View style={[styles.statusTag, { backgroundColor: '#FFEBEE' }]}><AppText style={[styles.statusTagText, { color: '#D32F2F' }]}>DECLINED</AppText></View>}
                    {item.status === 'rescheduled' && <View style={[styles.statusTag, { backgroundColor: '#F3E5F5' }]}><AppText style={[styles.statusTagText, { color: '#6A1B9A' }]}>RESCHEDULED</AppText></View>}
                    {item.status === 'pending' && <View style={[styles.statusTag, { backgroundColor: '#FFF3E0' }]}><AppText style={[styles.statusTagText, { color: '#E65100' }]}>PENDING</AppText></View>}
                    {!['cancelled', 'declined', 'rescheduled', 'pending'].includes(item.status) && (
                        <Ionicons name="chevron-forward" size={18} color="#C4CCD3" style={styles.chevron} />
                    )}
                </View>

                {/* First Divider */}
                <View style={styles.divider} />

                {/* Middle Section: Date & Time + Expert/Provider */}
                <View style={styles.cardMiddleRow}>
                    {/* Date Column */}
                    <View style={styles.metaColumn}>
                        <Ionicons name="pricetag-outline" size={18} color={theme.colors.primary} style={styles.metaIcon} />
                        <View style={styles.metaTextContainer}>
                            <AppText style={styles.metaLabel} weight="bold">DATE & TIME</AppText>
                            <AppText style={styles.metaValue} weight="bold">
                                {formatBookingDate(item.serviceDate)}{item.timeSlot ? ` • ${item.timeSlot}` : ''}
                            </AppText>
                        </View>
                    </View>

                    {/* Vertical separator */}
                    <View style={styles.verticalDivider} />

                    {/* Expert Column */}
                    <View style={styles.metaColumn}>
                        <Ionicons name="person-outline" size={18} color={theme.colors.primary} style={styles.metaIcon} />
                        <View style={styles.metaTextContainer}>
                            <AppText style={styles.metaLabel} weight="bold">{vendorRoleLabel}</AppText>
                            <AppText style={styles.metaValue} weight="bold" numberOfLines={1}>
                                {item.vendorName || 'Sarah Jenkins'}
                            </AppText>
                        </View>
                    </View>
                </View>

                {/* Second Divider */}
                <View style={styles.divider} />

                {/* Bottom Section: Location */}
                <View style={styles.cardBottomRow}>
                    <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} style={styles.metaIcon} />
                    <View style={styles.metaTextContainer}>
                        <AppText style={styles.metaLabel} weight="bold">LOCATION</AppText>
                        <AppText style={styles.locationValue} weight="bold">
                            {addressString}
                        </AppText>
                    </View>
                </View>

                {/* Action Buttons Row */}
                {hasActions && (
                    <View style={styles.actionSection}>
                        <View style={styles.actionDivider} />
                        <View style={styles.actionButtonsRow}>
                            {/* Video Call Button */}
                            {item.visitType === 'Video Consult' && item.status !== 'completed' && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]}
                                    onPress={() => navigation.navigate('VideoCall', {
                                        bookingId: item.id,
                                        userName: item.vendorName || 'Expert'
                                    })}
                                >
                                    <Ionicons name="videocam" size={14} color="#FFF" />
                                    <AppText style={styles.actionBtnText} weight="bold">Join Call</AppText>
                                </TouchableOpacity>
                            )}

                            {/* Invoice Button */}
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
                                onPress={() => {
                                    setSelectedBooking(item);
                                    setInvoiceVisible(true);
                                }}
                            >
                                <Ionicons name="receipt-outline" size={14} color="#FFF" />
                                <AppText style={styles.actionBtnText} weight="bold">Invoice</AppText>
                            </TouchableOpacity>

                            {/* Track Button (only for walking/boarding in progress) */}
                            {['confirmed', 'in_progress'].includes(item.status) && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: theme.colors.primaryDark }]}
                                    onPress={() => navigation.navigate('TrackingScreen', { booking: item })}
                                >
                                    <Ionicons name="location-outline" size={14} color="#FFF" />
                                    <AppText style={styles.actionBtnText} weight="bold">Track</AppText>
                                </TouchableOpacity>
                            )}

                            {/* Chat Button */}
                            {item.status !== 'completed' && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#4E6C48' }]}
                                    onPress={() => navigation.navigate('Chat', {
                                        bookingId: item.id,
                                        partnerName: item.vendorName
                                    })}
                                >
                                    <Ionicons name="chatbubble-outline" size={14} color="#FFF" />
                                    <AppText style={styles.actionBtnText} weight="bold">Chat</AppText>
                                </TouchableOpacity>
                            )}

                            {/* Rating Section for Completed Bookings */}
                            {item.status === 'completed' && (
                                <View style={styles.ratingContainer}>
                                    {item.customerRating ? (
                                        <View style={styles.ratingDisplay}>
                                            <Ionicons name="star" size={12} color="#F57F17" style={{ marginRight: 4 }} />
                                            <AppText style={styles.ratingText} weight="bold">{item.customerRating}/5 Rated</AppText>
                                            <TouchableOpacity
                                                style={styles.viewReviewBtn}
                                                onPress={() => navigation.navigate('ViewSubmittedReview', {
                                                    bookingId: item.id,
                                                    vendorName: item.vendorName,
                                                    petName: item.petName
                                                })}
                                            >
                                                <AppText style={styles.viewReviewText}>View</AppText>
                                                <Ionicons name="chevron-forward" size={12} color={theme.colors.primaryDark} />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: theme.colors.primaryDark }]}
                                            onPress={() => navigation.navigate('RatingReview', { bookingId: item.id, vendorName: item.vendorName })}
                                        >
                                            <Ionicons name="star-outline" size={12} color="#FFF" />
                                            <AppText style={styles.actionBtnText} weight="bold">Rate Vendor</AppText>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const filteredBookings = getFilteredBookings();

    return (
        <AppScreen safeArea={true} padding={false} scrollable={false} backgroundColor={theme.colors.background}>
            {/* Header section (Mockup-aligned) */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate('LandingScreen')}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textBlack} />
                </TouchableOpacity>
                <AppText style={styles.headerTitle} type="heading" weight="bold">My Bookings</AppText>
            </View>

            {/* Segmented Control Filter Tabs */}
            <View style={styles.segmentedContainer}>
                {['upcoming', 'past', 'cancelled'].map((tab) => {
                    const isActive = filter === tab;
                    const tabLabel = tab.charAt(0).toUpperCase() + tab.slice(1);
                    return (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.segmentTab, isActive && styles.segmentTabActive]}
                            activeOpacity={0.8}
                            onPress={() => setFilter(tab)}
                        >
                            <AppText style={[styles.segmentText, isActive && styles.segmentTextActive]} weight="bold">
                                {tabLabel}
                            </AppText>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Bookings List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primaryDark} />
                </View>
            ) : (
                <FlatList
                    data={filteredBookings}
                    renderItem={({ item }) => <BookingCard item={item} />}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="calendar-search" size={54} color="#C4CCD3" />
                            <AppText style={styles.emptyText} weight="bold">No bookings found in this category.</AppText>
                        </View>
                    }
                    onRefresh={fetchBookings}
                    refreshing={loading}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Invoice Modal */}
            <Modal
                visible={invoiceVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setInvoiceVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.closeModalBtn}
                            onPress={() => setInvoiceVisible(false)}
                        >
                            <Ionicons name="close" size={24} color={theme.colors.textBlack} />
                        </TouchableOpacity>
                        <InvoiceComponent
                            booking={selectedBooking}
                            onPayBalance={() => handlePayBalance(selectedBooking)}
                        />
                    </View>
                </View>
            </Modal>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 8,
        backgroundColor: theme.colors.background,
    },
    backButton: {
        marginLeft: -5,
    },
    headerTitle: {
        color: theme.colors.textBlack,
        fontFamily: theme.fonts.heading,
        fontSize: 20,
        marginLeft: 20,
    },
    segmentedContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.white,
        borderRadius: 18,
        marginHorizontal: 24,
        marginVertical: 12,
        padding: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 2,
    },
    segmentTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
    },
    segmentTabActive: {
        backgroundColor: '#3E5060',
    },
    segmentText: {
        fontSize: 14,
        color: '#7A8B99',
    },
    segmentTextActive: {
        color: theme.colors.white,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    petImage: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: '#EBEAE6',
    },
    petInfoContainer: {
        flex: 1,
        marginLeft: 16,
        marginRight: 8,
    },
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    statusTagText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    petName: {
        fontSize: 18,
        color: theme.colors.textBlack,
    },
    serviceName: {
        fontSize: 13,
        color: theme.colors.textPrimary,
        marginTop: 2,
    },
    serviceTasks: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 4,
        lineHeight: 16,
    },
    chevron: {
        marginLeft: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F2F5',
        marginVertical: 16,
    },
    cardMiddleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaColumn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaIcon: {
        marginRight: 10,
    },
    metaTextContainer: {
        flex: 1,
    },
    metaLabel: {
        fontSize: 9,
        color: theme.colors.textTertiary,
        letterSpacing: 0.5,
    },
    metaValue: {
        fontSize: 12,
        color: theme.colors.textBlack,
        marginTop: 2,
    },
    verticalDivider: {
        width: 1,
        backgroundColor: '#F0F2F5',
        height: 32,
        marginHorizontal: 12,
    },
    cardBottomRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    locationValue: {
        fontSize: 12,
        color: theme.colors.textBlack,
        marginTop: 2,
        lineHeight: 16,
    },
    actionSection: {
        marginTop: 12,
    },
    actionDivider: {
        height: 1,
        backgroundColor: '#F5F5F5',
        marginBottom: 12,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 4,
    },
    actionBtnText: {
        color: theme.colors.white,
        fontSize: 11,
    },
    ratingContainer: {
        justifyContent: 'center',
    },
    ratingDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9C4',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    ratingText: {
        color: '#F57F17',
        fontSize: 11,
    },
    viewReviewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#FFF',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.primaryDark,
        gap: 2,
    },
    viewReviewText: {
        color: theme.colors.primaryDark,
        fontSize: 10,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
        gap: 12,
    },
    emptyText: {
        color: theme.colors.textTertiary,
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: theme.colors.white,
        borderRadius: 24,
        padding: 6,
    },
    closeModalBtn: {
        alignSelf: 'flex-end',
        padding: 10,
    },
});
