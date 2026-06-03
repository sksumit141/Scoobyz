import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Image, Alert, Modal, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import CustomCalendar from '../components/CustomCalendar';
import { theme } from '../styles/theme';
import { bookingsApi, BASE_URL } from '../services/api';
import { useBackHandler } from '../hooks/useBackHandler';

const { width } = Dimensions.get('window');

export default function BookingCardDetailsScreen({ route, navigation }) {
    const { bookingId, openReschedule } = route.params;
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // Safe back — falls back to MyBookings if there is nothing in the stack
    const { handleBack } = useBackHandler({ fallbackScreen: 'MyBookings' });

    // Reschedule State
    const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState(null);

    const getNextDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            dates.push(d);
        }
        return dates;
    };
    const nextDates = getNextDates();

    const formatDayOfWeek = (date) => {
        if (date.toDateString() === new Date().toDateString()) return 'Today';
        return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
    };

    const MORNING_SLOTS = ['06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'];
    const NOON_SLOTS = ['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'];
    const NIGHT_SLOTS = ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM'];

    const formatDay = (date) => new Intl.DateTimeFormat('en-US', { day: '2-digit' }).format(date);
    const formatMonth = (date) => new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
    const formatFullMonthYear = (date) => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);

    const renderSlotSection = (title, icon, slots) => (
        <View style={styles.slotSection}>
            <View style={styles.slotSectionHeader}>
                <MaterialCommunityIcons name={icon} size={18} color={theme.colors.primaryDark} />
                <AppText style={styles.slotSectionTitle} weight="bold">{title}</AppText>
            </View>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slotsHorizontalScroll}
            >
                {slots.map((slot, index) => {
                    const isSelected = selectedSlot === slot;
                    return (
                        <TouchableOpacity
                            key={index}
                            style={[styles.slotItem, isSelected && styles.slotItemActive]}
                            onPress={() => setSelectedSlot(slot)}
                            activeOpacity={0.8}
                        >
                            <AppText style={[styles.slotText, isSelected && styles.slotTextActive]}>{slot}</AppText>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    useEffect(() => {
        const fetchBookingDetails = async () => {
            try {
                const data = await bookingsApi.get(bookingId);
                setBooking(data);
            } catch (error) {
                console.error('Fetch booking details error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookingDetails();
    }, [bookingId]);

    // Auto-open reschedule modal if the user was redirected from a declined reschedule
    useEffect(() => {
        if (openReschedule && !loading) {
            setRescheduleModalVisible(true);
        }
    }, [openReschedule, loading]);

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

    const handleCancelConfirm = async () => {
        try {
            setIsCancelling(true);
            await bookingsApi.cancel(bookingId, { reason: 'Customer cancelled' });
            setCancelModalVisible(false);
            // Navigate to BookingCancelledStatusScreen with booking details
            navigation.replace('BookingCancelledStatus', { booking });
        } catch (error) {
            console.error('Cancel error:', error);
            Alert.alert('Error', 'Failed to cancel booking. Please try again.');
        } finally {
            setIsCancelling(false);
        }
    };

    const handleRescheduleConfirm = async () => {
        if (!selectedSlot) {
            Alert.alert('Select a slot', 'Please select a time slot to reschedule.');
            return;
        }
        try {
            setIsRescheduling(true);
            // Format date in IST to avoid UTC offset shifting the day backward
            // e.g. May 27 IST midnight = May 26 UTC — so we must NOT use toISOString()
            const istParts = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).format(selectedDate);
            // istParts is already 'YYYY-MM-DD' from en-CA locale
            const dateStr = istParts;
            await bookingsApi.reschedule(bookingId, { serviceDate: dateStr, serviceTimeSlot: selectedSlot });
            setRescheduleModalVisible(false);
            
            // Navigate to Rescheduled Status screen
            navigation.replace('BookingRescheduledStatus', { 
                booking: { ...booking, serviceDate: dateStr, serviceTimeSlot: selectedSlot },
                bookingId: bookingId
            });
        } catch (error) {
            console.error('Reschedule error:', error);
            Alert.alert('Error', 'Failed to reschedule booking. Please try again.');
        } finally {
            setIsRescheduling(false);
        }
    };

    if (loading) {
        return (
            <AppScreen padding={false} style={styles.loadingScreen}>
                <ActivityIndicator size="large" color={theme.colors.primaryDark} />
            </AppScreen>
        );
    }

    if (!booking) {
        return (
            <AppScreen padding={false} style={styles.screen}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back-outline" size={24} color={theme.colors.textBlack} />
                    </TouchableOpacity>
                    <AppText style={styles.headerTitle} type="heading" weight="bold">Booking Details</AppText>
                </View>
                <View style={styles.emptyContainer}>
                    <AppText>Booking not found.</AppText>
                </View>
            </AppScreen>
        );
    }

    // Resolve pet photo
    const petPhoto = booking.petPhotoUrl
        ? (booking.petPhotoUrl.startsWith('http') ? booking.petPhotoUrl : `${BASE_URL}${booking.petPhotoUrl}`)
        : 'https://images.unsplash.com/photo-1591160690555-5debfba289f0?q=80&w=256&auto=format&fit=crop';

    // Resolve service tasks / details
    let serviceTasks = booking.notes || '';
    if (!serviceTasks) {
        if (booking.bookingType === 'grooming') {
            serviceTasks = 'Full groom, Nail trim, Ear cleaning';
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
    if (booking.fullAddress) {
        const parts = [
            booking.fullAddress,
            booking.areaLocality,
            booking.city,
            booking.state
        ].filter(Boolean);
        addressString = parts.join(', ');
    } else {
        addressString = 'Flat-24 ABC complex noida sector-53 , Uttar Pradesh';
    }

    return (
        <AppScreen padding={false} style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
                    <Ionicons name="arrow-back-outline" size={26} color={theme.colors.textBlack} />
                </TouchableOpacity>
                <AppText style={styles.headerTitle} type="heading" weight="bold">Booking Details</AppText>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Top Section */}
                <View style={styles.topSection}>
                    {booking.status === 'rescheduled' && (
                        <View style={{ backgroundColor: '#FFF3E0', padding: 12, borderRadius: 8, marginBottom: 16, width: '90%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="time-outline" size={20} color="#E65100" style={{ marginRight: 8 }} />
                            <AppText style={{ color: '#E65100', flex: 1, fontSize: 13 }}>
                                Reschedule request sent. Waiting for vendor approval.
                            </AppText>
                        </View>
                    )}
                    {booking.status === 'declined' && (
                        <View style={{ backgroundColor: '#FFEBEE', padding: 12, borderRadius: 8, marginBottom: 16, width: '90%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="alert-circle" size={20} color="#D32F2F" style={{ marginRight: 8 }} />
                            <AppText style={{ color: '#D32F2F', flex: 1, fontSize: 13 }}>
                                The vendor has declined this request. Please select a different date and time by clicking Reschedule below.
                            </AppText>
                        </View>
                    )}
                    {booking.status === 'cancelled' && (
                        <View style={{ backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, marginBottom: 16, width: '90%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="close-circle" size={20} color="#757575" style={{ marginRight: 8 }} />
                            <AppText style={{ color: '#757575', flex: 1, fontSize: 13 }}>
                                This booking has been cancelled.
                            </AppText>
                        </View>
                    )}
                    <Image source={{ uri: petPhoto }} style={styles.mainImage} />
                    <AppText style={styles.petName} type="heading" weight="bold">{booking.petName || 'Bruno'}</AppText>
                    <AppText style={styles.serviceName}>{booking.serviceName || (booking.bookingType ? (booking.bookingType.charAt(0).toUpperCase() + booking.bookingType.slice(1)) : 'Pro Grooming')}</AppText>
                    <AppText style={styles.serviceTasks}>{serviceTasks}</AppText>
                </View>

                {/* Main Info Card */}
                <View style={styles.card}>
                    {/* Date & Time */}
                    <View style={styles.infoBlock}>
                        <AppText style={styles.infoLabel}>DATE & TIME</AppText>
                        <AppText style={styles.infoValue}>
                            {formatBookingDate(booking.serviceDate)}{booking.timeSlot ? ` • ${booking.timeSlot}` : ' • 10:30 AM'}
                        </AppText>
                    </View>

                    {/* Expert */}
                    <View style={styles.infoBlock}>
                        <AppText style={styles.infoLabel}>EXPERT</AppText>
                        <View style={styles.expertRow}>
                            <AppText style={[styles.infoValue, { flex: 1 }]}>{booking.vendorName || 'Sarah Jenkens'}</AppText>
                            <TouchableOpacity style={styles.actionIconBtn} activeOpacity={0.8}>
                                <Ionicons name="call-outline" size={16} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionIconBtn} activeOpacity={0.8}>
                                <Ionicons name="chatbubble-outline" size={16} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Address */}
                    <View style={styles.infoBlock}>
                        <AppText style={styles.infoLabel}>ADDRESS</AppText>
                        <AppText style={[styles.infoValue, { lineHeight: 22 }]}>
                            {addressString}
                        </AppText>
                    </View>

                    {/* Action Buttons */}
                    {!['cancelled', 'completed'].includes(booking.status) && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.actionButtonsRow}>
                                {booking.status !== 'declined' && (
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, styles.cancelBtn]} 
                                        activeOpacity={0.8}
                                        onPress={() => setCancelModalVisible(true)}
                                    >
                                        <AppText style={styles.cancelBtnText} weight="bold">Cancel Booking</AppText>
                                    </TouchableOpacity>
                                )}
                                {booking.status !== 'rescheduled' && (
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, styles.rescheduleBtn]} 
                                        activeOpacity={0.8}
                                        onPress={() => setRescheduleModalVisible(true)}
                                    >
                                        <AppText style={styles.rescheduleBtnText} weight="bold">Reschedule</AppText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </View>

                {/* Amount Paid Card */}
                <View style={[styles.card, styles.amountCard]}>
                    <View style={styles.receiptIconContainer}>
                        <Ionicons name="receipt-outline" size={24} color={theme.colors.primaryDark} />
                    </View>
                    <View style={styles.amountTextContainer}>
                        <AppText style={styles.amountLabel} weight="bold">Amount Paid</AppText>
                        <TouchableOpacity style={styles.viewDetailRow} activeOpacity={0.8}>
                            <AppText style={styles.viewDetailText}>VIEW DETAIL</AppText>
                            <Ionicons name="chevron-forward" size={12} color={theme.colors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                    <AppText style={styles.amountValue} weight="bold">₹ {booking.totalCost || '2200'}</AppText>
                </View>

                {/* Info Banner */}
                <View style={styles.infoBanner}>
                    <Ionicons name="information-circle-outline" size={18} color={theme.colors.textSecondary} style={{ marginTop: 2 }} />
                    <AppText style={styles.infoBannerText}>
                        Cancellation made within 24hrs of the appointment are subject to 50% fee.
                    </AppText>
                </View>

            </ScrollView>

            {/* Cancel Booking Modal */}
            <Modal
                visible={cancelModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setCancelModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <AppText style={styles.modalTitle} type="heading" weight="bold">Cancel Booking</AppText>
                        <View style={styles.modalDivider} />
                        <AppText style={styles.modalMessage}>Are you sure you want to cancel the booking?</AppText>
                        
                        <View style={styles.modalButtonsRow}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalNoBtn]} 
                                activeOpacity={0.8}
                                onPress={() => setCancelModalVisible(false)}
                            >
                                <AppText style={styles.modalNoBtnText}>No</AppText>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalYesBtn]} 
                                activeOpacity={0.8}
                                onPress={handleCancelConfirm}
                                disabled={isCancelling}
                            >
                                {isCancelling ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <AppText style={styles.modalYesBtnText}>Yes, Cancel</AppText>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Reschedule Booking Modal */}
            <Modal
                visible={rescheduleModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setRescheduleModalVisible(false)}
            >
                <View style={styles.rescheduleModalOverlay}>
                    <View style={styles.rescheduleModalContent}>
                        {/* Header */}
                        <View style={styles.rescheduleHeader}>
                            <AppText style={styles.rescheduleTitle} type="heading" weight="bold">Reschedule Booking</AppText>
                            <TouchableOpacity onPress={() => setRescheduleModalVisible(false)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                                <Ionicons name="close" size={24} color={theme.colors.textBlack} />
                            </TouchableOpacity>
                        </View>
                        <AppText style={styles.rescheduleSubtitle}>Choose a new date and time for you booking</AppText>

                        {/* Date Selection */}
                        <View style={styles.sectionHeaderRow}>
                            <AppText style={styles.sectionTitle} weight="bold">Select Date</AppText>
                            <View style={styles.monthSelector}>
                                <Ionicons name="chevron-back" size={14} color={theme.colors.textSecondary} />
                                <AppText style={styles.monthText}>{formatFullMonthYear(selectedDate)}</AppText>
                                <Ionicons name="chevron-forward" size={14} color={theme.colors.textSecondary} />
                            </View>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesScroll}>
                            {nextDates.map((date, index) => {
                                const isSelected = selectedDate.toDateString() === date.toDateString();
                                return (
                                    <TouchableOpacity 
                                        key={index}
                                        style={[styles.dateBox, isSelected && styles.dateBoxSelected]}
                                        onPress={() => setSelectedDate(date)}
                                        activeOpacity={0.7}
                                    >
                                        <AppText style={[styles.dateDayName, isSelected && styles.dateTextSelected]}>{formatDayOfWeek(date)}</AppText>
                                        <AppText style={[styles.dateNumber, isSelected && styles.dateTextSelected]} weight="bold">{formatDay(date)}</AppText>
                                        <AppText style={[styles.dateMonth, isSelected && styles.dateTextSelected]}>{formatMonth(date)}</AppText>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Slots Selection */}
                        <View style={{ paddingHorizontal: 24, marginTop: 16, marginBottom: 12 }}>
                            <AppText style={styles.sectionTitle} weight="bold">Available Slots</AppText>
                        </View>
                        
                        <ScrollView style={{maxHeight: 250}} showsVerticalScrollIndicator={false}>
                            {renderSlotSection('Morning', 'weather-sunny', MORNING_SLOTS)}
                            {renderSlotSection('Noon', 'white-balance-sunny', NOON_SLOTS)}
                            {renderSlotSection('Night', 'weather-night', NIGHT_SLOTS)}
                        </ScrollView>

                        {/* Bottom Action */}
                        <View style={styles.rescheduleBottomRow}>
                            <View style={styles.selectedSlotInfo}>
                                <AppText style={styles.selectedSlotLabel}>Selected Slot</AppText>
                                <AppText style={styles.selectedSlotValue} weight="bold">
                                    {formatDay(selectedDate)} {formatMonth(selectedDate)}, {selectedSlot || 'None'}
                                </AppText>
                            </View>
                            <TouchableOpacity 
                                style={[styles.confirmBtn, !selectedSlot && { opacity: 0.5 }]} 
                                activeOpacity={0.8}
                                onPress={handleRescheduleConfirm}
                                disabled={!selectedSlot || isRescheduling}
                            >
                                {isRescheduling ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <AppText style={styles.confirmBtnText} weight="bold">Confirm</AppText>
                                )}
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </Modal>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F8F7F3', // Using slightly warmer white as in the image
    },
    loadingScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F7F3',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 44, // Match typical iOS status bar + some padding
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
    topSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 24,
    },
    mainImage: {
        width: 100,
        height: 100,
        borderRadius: 24, // softer rounded corners
        backgroundColor: '#EBEAE6',
        marginBottom: 16,
    },
    petName: {
        fontSize: 22,
        color: theme.colors.textBlack,
        marginBottom: 4,
    },
    serviceName: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },
    serviceTasks: {
        fontSize: 13,
        color: theme.colors.textTertiary,
    },
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    infoBlock: {
        marginBottom: 20,
    },
    infoLabel: {
        fontSize: 12,
        color: theme.colors.textTertiary,
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 15,
        color: theme.colors.textBlack,
    },
    expertRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIconBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primaryDark,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginBottom: 20,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {
        borderWidth: 1,
        borderColor: theme.colors.success,
        backgroundColor: theme.colors.white,
    },
    cancelBtnText: {
        color: theme.colors.success,
        fontSize: 14,
    },
    rescheduleBtn: {
        backgroundColor: theme.colors.success,
    },
    rescheduleBtnText: {
        color: theme.colors.white,
        fontSize: 14,
    },
    amountCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
    },
    receiptIconContainer: {
        marginRight: 16,
    },
    amountTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    amountLabel: {
        fontSize: 16,
        color: theme.colors.textBlack,
        marginBottom: 4,
    },
    viewDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewDetailText: {
        fontSize: 11,
        color: theme.colors.textTertiary,
        marginRight: 4,
        letterSpacing: 0.5,
    },
    amountValue: {
        fontSize: 20,
        color: theme.colors.textBlack,
    },
    infoBanner: {
        flexDirection: 'row',
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        padding: 16,
        alignItems: 'flex-start',
    },
    infoBannerText: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginLeft: 10,
        lineHeight: 18,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 24,
        paddingBottom: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        color: '#E53935', // Red color for cancel
        marginBottom: 16,
    },
    modalDivider: {
        height: 1,
        width: '100%',
        backgroundColor: '#F0F0F0',
        marginBottom: 16,
    },
    modalMessage: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    modalButtonsRow: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
    },
    modalBtn: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalNoBtn: {
        borderWidth: 1,
        borderColor: theme.colors.textSecondary,
        backgroundColor: theme.colors.white,
    },
    modalNoBtnText: {
        color: theme.colors.textBlack,
        fontSize: 15,
        fontFamily: theme.fonts.body,
    },
    modalYesBtn: {
        backgroundColor: '#4E6C48', // Green color
    },
    modalYesBtnText: {
        color: theme.colors.white,
        fontSize: 15,
        fontFamily: theme.fonts.body,
    },
    // Reschedule Modal Styles
    rescheduleModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    rescheduleModalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 24,
        paddingBottom: 30, // For safer area
    },
    rescheduleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 8,
    },
    rescheduleTitle: {
        fontSize: 22,
        color: theme.colors.textBlack,
    },
    rescheduleSubtitle: {
        fontSize: 15,
        color: theme.colors.textSecondary,
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        color: theme.colors.textBlack,
        marginLeft: -5,
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    monthText: {
        fontSize: 14,
        color: theme.colors.textBlack,
        marginHorizontal: 8,
    },
    datesScroll: {
        paddingHorizontal: 24,
        gap: 12,
    },
    dateBox: {
        width: 65,
        height: 90,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateBoxSelected: {
        backgroundColor: '#4A5F70',
        borderColor: '#4A5F70',
    },
    dateDayName: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    dateNumber: {
        fontSize: 18,
        color: theme.colors.textBlack,
        marginBottom: 2,
    },
    dateMonth: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    dateTextSelected: {
        color: '#FFF',
    },
    slotSection: {
        marginBottom: 20,
    },
    slotSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        backgroundColor: 'rgba(61, 42, 94, 0.05)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginLeft: 24,
    },
    slotSectionTitle: {
        fontSize: 14,
        color: theme.colors.primaryDark,
    },
    slotsHorizontalScroll: {
        paddingHorizontal: 24,
        paddingRight: 48,
        gap: 10,
        paddingBottom: 8,
    },
    slotItem: {
        width: 110,
        backgroundColor: theme.colors.white,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        marginBottom: 4,
    },
    slotItemActive: {
        backgroundColor: theme.colors.primaryDark,
    },
    slotText: {
        fontSize: 13,
        color: theme.colors.primaryDark,
        fontWeight: 'bold',
    },
    slotTextActive: {
        color: theme.colors.white,
    },
    rescheduleBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    selectedSlotInfo: {
        flex: 1,
    },
    selectedSlotLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    selectedSlotValue: {
        fontSize: 15,
        color: theme.colors.textBlack,
    },
    confirmBtn: {
        backgroundColor: '#4E6C48',
        height: 48,
        paddingHorizontal: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 120,
    },
    confirmBtnText: {
        color: '#FFF',
        fontSize: 15,
    }
});
