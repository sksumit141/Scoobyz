import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, StatusBar, SafeAreaView, ScrollView, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { bookingsApi } from '../services/api';
import { useIsFocused } from '@react-navigation/native';
import InvoiceComponent from '../components/InvoiceComponent';

export default function MyBookingsScreen({ navigation }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [invoiceVisible, setInvoiceVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const isFocused = useIsFocused();

    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            const data = await bookingsApi.list({ status: filter });
            setBookings(data);
        } catch (error) {
            console.error('Fetch bookings error:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

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

    const BookingCard = ({ item }) => {
        const getStatusColor = (status) => {
            switch (status) {
                case 'confirmed': return '#2E7D32';
                case 'in_progress': return '#EF6C00';
                case 'completed': return '#1565C0';
                case 'declined': return '#D32F2F';
                case 'cancelled': return '#757575';
                default: return '#EF6C00';
            }
        };

        const getStatusBg = (status) => {
            switch (status) {
                case 'confirmed': return '#E8F5E9';
                case 'in_progress': return '#FFF3E0';
                case 'completed': return '#E3F2FD';
                case 'declined': return '#FFEBEE';
                case 'cancelled': return '#F5F5F5';
                default: return '#FFF3E0';
            }
        };

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => { }} // Could navigate to detail later
            >
                <View style={styles.cardHeader}>
                    <View style={styles.serviceIconRow}>
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons
                                name={
                                    item.bookingType === 'boarding' ? 'home-variant' : 
                                    item.bookingType === 'walking' ? 'walk' : 
                                    item.bookingType === 'veterinary' ? 'medical-bag' : 
                                    'cut'
                                }
                                size={20}
                                color={theme.colors.primaryDark}
                            />
                        </View>
                        <View>
                            <AppText style={styles.serviceName} weight="bold">{item.serviceName || item.bookingType.toUpperCase()}</AppText>
                            <AppText style={styles.vendorName}>with {item.vendorName}</AppText>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                        <AppText style={[styles.statusText, { color: getStatusColor(item.status) }]} weight="bold">
                            {item.status.replace('_', ' ').toUpperCase()}
                        </AppText>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Ionicons name="paw-outline" size={14} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                        <AppText style={styles.infoValue}>{item.petName} ({item.petBreed})</AppText>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                        <AppText style={styles.infoValue}>
                            {new Date(item.serviceDate).toLocaleDateString()} {item.timeSlot ? `• ${item.timeSlot}` : ''}
                        </AppText>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={{ flex: 1 }}>
                        <AppText style={styles.priceText} weight="bold">₹{item.totalCost}</AppText>
                        <AppText style={styles.dateLabel}>Placed on {new Date(item.createdAt).toLocaleDateString()}</AppText>
                    </View>
                </View>

                {/* Track, Chat, Video & Invoice Action Row */}
                {['pending', 'confirmed', 'in_progress', 'completed'].includes(item.status) && (
                    <View style={styles.actionRow}>
                        {/* Video Call Button */}
                        {item.visitType === 'Video Consult' && item.status !== 'completed' && (
                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]}
                                onPress={() => navigation.navigate('VideoCall', { 
                                    bookingId: item.id, 
                                    userName: item.vendorName || 'Expert' 
                                })}
                            >
                                <Ionicons name="videocam" size={14} color="#FFF" style={{ marginRight: 4 }} />
                                <AppText style={styles.actionBtnText} weight="bold">Join Call</AppText>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: '#1976D2' }]}
                            onPress={() => {
                                setSelectedBooking(item);
                                setInvoiceVisible(true);
                            }}
                        >
                            <Ionicons name="receipt-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                            <AppText style={styles.actionBtnText} weight="bold">Invoice</AppText>
                        </TouchableOpacity>

                        {/* Track Button (only for walking/boarding in progress) */}
                        {['confirmed', 'in_progress'].includes(item.status) && (
                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: theme.colors.primaryDark }]}
                                onPress={() => navigation.navigate('TrackingScreen', { booking: item })}
                            >
                                <Ionicons name="location-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
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
                                <Ionicons name="chatbubble-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                                <AppText style={styles.actionBtnText} weight="bold">Chat</AppText>
                            </TouchableOpacity>
                        )}


                    </View>
                )}
                
                {/* Rating Section for Completed Bookings */}
                {item.status === 'completed' && (
                    <View style={styles.ratingSection}>
                            {item.customerRating ? (
                                <View style={styles.ratingDisplay}>
                                    <Ionicons name="star" size={14} color={theme.colors.warning} style={{ marginRight: 4 }} />
                                    <AppText style={styles.ratingText} weight="bold">{item.customerRating}/5 Rated</AppText>
                                </View>
                            ) : (
                                <TouchableOpacity 
                                    style={styles.rateBtn}
                                    onPress={() => navigation.navigate('RatingReview', { bookingId: item.id, vendorName: item.vendorName })}
                                >
                                    <AppText style={styles.rateBtnText} weight="bold">Rate Vendor</AppText>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
            </TouchableOpacity>
        );
    };

    return (
        <AppScreen safeArea={true} padding={false} scrollable={false} backgroundColor={theme.colors.background}>
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity 
                        style={styles.headerIconBtn}
                        onPress={() => navigation.openDrawer ? navigation.openDrawer() : navigation.goBack()} 
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name={navigation.openDrawer ? "menu" : "arrow-back"} size={26} color={theme.colors.white} />
                    </TouchableOpacity>
                    <AppText style={styles.headerTitle} type="heading" weight="bold">My Bookings</AppText>
                    <TouchableOpacity 
                        style={styles.notificationBtn}
                        onPress={() => navigation.navigate('Notifications')}
                    >
                        <Ionicons name="notifications-outline" size={20} color="#4A6B4B" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 20 }}>
                    {['all', 'pending', 'confirmed', 'in_progress', 'completed'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterTab, filter === f && styles.activeTab]}
                            onPress={() => setFilter(f)}
                        >
                            <AppText style={[styles.filterTabText, filter === f && styles.activeTabText]} weight="bold">
                                {f.replace('_', ' ').charAt(0).toUpperCase() + f.replace('_', ' ').slice(1)}
                            </AppText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primaryDark} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={({ item }) => <BookingCard item={item} />}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="calendar-search" size={60} color="#E0E0E0" />
                            <AppText style={styles.emptyText}>No bookings found in this category.</AppText>
                        </View>
                    }
                    onRefresh={fetchBookings}
                    refreshing={loading}
                />
            )}

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
        backgroundColor: '#526D82',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 30,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        color: theme.colors.white,
    },
    headerIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: theme.colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterContainer: { 
        flexDirection: 'row', 
        paddingLeft: 20, 
        marginTop: 25,
        marginBottom: 15,
    },
    filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.white, borderWidth: 1, borderColor: '#EEE' },
    activeTab: { backgroundColor: theme.colors.primaryDark, borderColor: theme.colors.primaryDark },
    filterTabText: { fontSize: 13, color: theme.colors.textSecondary },
    activeTabText: { color: theme.colors.white },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    serviceIconRow: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(78,108,72,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    serviceName: { fontSize: 16, color: theme.colors.textBlack },
    vendorName: { fontSize: 12, color: theme.colors.textSecondary },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10 },
    cardBody: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    infoValue: { fontSize: 13, color: '#444' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    priceText: { fontSize: 18, color: theme.colors.primaryDark, marginBottom: 2 },
    dateLabel: { fontSize: 11, color: '#999' },
    actionRow: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: 8, 
        marginTop: 5,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
        paddingTop: 12
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        minWidth: 80,
        justifyContent: 'center'
    },
    actionBtnText: {
        color: '#FFF',
        fontSize: 12,
    },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#999', marginTop: 10, fontSize: 15 },
    ratingSection: { alignItems: 'flex-end', marginTop: 10 },
    rateBtn: { backgroundColor: theme.colors.primaryDark, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    rateBtnText: { color: '#FFF', fontSize: 13 },
    ratingDisplay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9C4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    ratingText: { color: '#F57F17', fontSize: 12 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 4,
    },
    closeModalBtn: {
        alignSelf: 'flex-end',
        padding: 10,
    },
});
