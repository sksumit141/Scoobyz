import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Image, Alert, Modal, Dimensions, Linking, Platform, DeviceEventEmitter } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import AppHeader from '../components/AppHeader';
import CustomCalendar from '../components/CustomCalendar';
import { theme } from '../styles/theme';
import { bookingsApi, BASE_URL } from '../services/api';
import { useBackHandler } from '../hooks/useBackHandler';

const { width } = Dimensions.get('window');

const humanize = (value) => String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());

const formatPrice = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? `₹${amount.toFixed(2)}` : '';
};

const ServiceSummaryRow = ({ icon, label, value }) => value ? (
    <View style={styles.serviceSummaryRow}>
        <MaterialCommunityIcons name={icon} size={18} color={theme.colors.primaryDark} />
        <View style={styles.serviceSummaryText}>
            <AppText style={styles.serviceSummaryLabel}>{label}</AppText>
            <AppText style={styles.serviceSummaryValue} weight="bold">{value}</AppText>
        </View>
    </View>
) : null;

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

    const fetchBookingDetails = useCallback(async ({ silent = false } = {}) => {
        try {
            const data = await bookingsApi.get(bookingId);
            setBooking(data);
        } catch (error) {
            if (!silent) console.error('Fetch booking details error:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        fetchBookingDetails();
    }, [fetchBookingDetails]);

    useEffect(() => {
        if (booking?.bookingType !== 'walking' || ['completed', 'cancelled'].includes(booking.status)) return undefined;
        const timer = setInterval(() => fetchBookingDetails({ silent: true }), 6000);
        const subscription = DeviceEventEmitter.addListener('refresh_customer_bookings', () => {
            fetchBookingDetails({ silent: true });
        });
        return () => {
            clearInterval(timer);
            subscription.remove();
        };
    }, [booking?.bookingType, booking?.status, fetchBookingDetails]);

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

    const handleCall = () => {
        const phoneNumber = booking?.vendorPhone || '9876543210';
        const url = Platform.OS === 'android' ? `tel:${phoneNumber}` : `telprompt:${phoneNumber}`;
        Linking.openURL(url).catch(err => {
            console.error('Error opening dialer:', err);
            Alert.alert('Error', 'Unable to open dialer.');
        });
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

    const addToCalendar = () => {
        if (!booking) return;
        const title = `${booking.serviceName || 'Scoobyz Service'} for ${booking.petName || 'Pet'}`;
        const location = booking.fullAddress || '';
        const notes = booking.notes || `Order ID: #${booking.id}`;
        
        let startDate = booking.serviceDate;
        if (booking.timeSlot) {
            // Very basic parse assuming format like "10:00 AM" and serviceDate is an ISO string or similar
            // In a real robust implementation, properly combine date + timeSlot
            startDate = new Date(booking.serviceDate);
        }

        const start = new Date(startDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
        const end = start; // Basic implementation, same as start
        const url = Platform.select({
            ios: `calshow:${Math.floor(new Date(startDate).getTime() / 1000)}`,
            android: `content://com.android.calendar/time/${new Date(startDate).getTime()}`,
            default: `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(notes)}&location=${encodeURIComponent(location)}`
        });
        
        Linking.openURL(url).catch(() => {
            Linking.openURL(`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(notes)}&location=${encodeURIComponent(location)}`);
        });
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
                <AppHeader title="Booking Details" onBackPress={handleBack} />
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

    const serviceDetails = booking.serviceDetails || {};
    const packageDetails = serviceDetails.package || null;
    const selectedAddons = (serviceDetails.addons || []).filter(item => item.category !== 'additional_charge');
    const additionalCharges = (serviceDetails.addons || []).filter(item => item.category === 'additional_charge');
    const walkProgress = booking.bookingType === 'walking' ? booking.sessionProgress : null;
    const currentWalk = walkProgress?.activeSession || walkProgress?.nextSession;

    // Resolve service tasks / details
    let serviceTasks = booking.notes || '';
    if (serviceTasks && serviceTasks.includes('_OP:')) {
        serviceTasks = serviceTasks.replace(/_OP:\d+(\.\d+)?_?\s*/g, '').trim();
    }
    if (!serviceTasks && packageDetails?.features?.length) {
        serviceTasks = packageDetails.features.join(' • ');
    }
    if (!serviceTasks && booking.bookingType === 'walking') {
        serviceTasks = [serviceDetails.frequency, serviceDetails.duration,
            serviceDetails.timesPerDay ? `${serviceDetails.timesPerDay} walk(s) per day` : null]
            .filter(Boolean).join(' • ');
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
            <AppHeader title="Booking Details" onBackPress={handleBack} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Top Section */}
                <View style={styles.topSection}>
                    {booking.status === 'rescheduled' && (
                        <View style={{ backgroundColor: '#FFF3E0', padding: 12, borderRadius: 8, marginBottom: 16, marginTop: -20, width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="time-outline" size={20} color="#E65100" style={{ marginRight: 8 }} />
                            <AppText style={{ color: '#E65100', flex: 1, fontSize: 13 }}>
                                Reschedule request sent. Waiting for vendor approval.
                            </AppText>
                        </View>
                    )}
                    {booking.status === 'awaiting_vendor' && (
                        <View style={{ backgroundColor: '#E3F2FD', padding: 12, borderRadius: 8, marginBottom: 16, marginTop: -20, width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="search-outline" size={20} color="#1976D2" style={{ marginRight: 8 }} />
                            <AppText style={{ color: '#1976D2', flex: 1, fontSize: 13 }}>
                                Assigning a nearby expert to your order...
                            </AppText>
                        </View>
                    )}
                    {booking.status === 'declined' && (
                        <View style={{ backgroundColor: '#FFEBEE', padding: 12, borderRadius: 8, marginBottom: 16, marginTop: -20, width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="alert-circle" size={20} color="#D32F2F" style={{ marginRight: 8 }} />
                            <AppText style={{ color: '#D32F2F', flex: 1, fontSize: 13 }}>
                                The vendor has declined this request. Please select a different date and time by clicking Reschedule below.
                            </AppText>
                        </View>
                    )}
                    {booking.status === 'cancelled' && (
                        <View style={{ backgroundColor: '#FFEBEE', padding: 12, borderRadius: 8, marginBottom: 16, marginTop: -20, width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="close-circle" size={20} color="#D32F2F" style={{ marginRight: 8 }} />
                            <AppText style={{ color: '#D32F2F', flex: 1, fontSize: 13 }}>
                                This booking has been cancelled.
                            </AppText>
                        </View>
                    )}
                    <Image source={{ uri: petPhoto }} style={styles.mainImage} />
                    <AppText style={styles.petName} type="heading" weight="bold">{booking.petName || 'Bruno'}</AppText>
                    <AppText style={styles.serviceName}>{booking.serviceName || (booking.bookingType ? (booking.bookingType.charAt(0).toUpperCase() + booking.bookingType.slice(1)) : 'Pro Grooming')}</AppText>
                    <AppText style={styles.serviceTasks}>{serviceTasks}</AppText>
                </View>

                {/* Complete snapshot of what the customer reviewed before booking */}
                <View style={styles.card}>
                    <AppText style={styles.serviceDetailTitle} weight="bold">SERVICE DETAILS</AppText>

                    {packageDetails && (
                        <View style={styles.packageBlock}>
                            <View style={styles.packageHeadingRow}>
                                <MaterialCommunityIcons name="package-variant-closed" size={22} color={theme.colors.primaryDark} />
                                <View style={styles.packageHeadingText}>
                                    <AppText style={styles.packageName} weight="bold">{packageDetails.name}</AppText>
                                    {(packageDetails.subtitle || packageDetails.duration) && (
                                        <AppText style={styles.packageMeta}>
                                            {[packageDetails.subtitle, packageDetails.duration].filter(Boolean).join(' • ')}
                                        </AppText>
                                    )}
                                </View>
                            </View>
                            {packageDetails.features?.length > 0 && (
                                <View style={styles.serviceList}>
                                    <AppText style={styles.serviceListTitle} weight="bold">PACKAGE INCLUDES</AppText>
                                    {packageDetails.features.map((feature, index) => (
                                        <View key={`${feature}-${index}`} style={styles.serviceLineItem}>
                                            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                                            <AppText style={styles.serviceLineItemText}>{feature}</AppText>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {booking.bookingType === 'walking' && (
                        <View style={styles.walkingGrid}>
                            <ServiceSummaryRow icon="clock-outline" label="Duration" value={serviceDetails.duration} />
                            <ServiceSummaryRow icon="repeat" label="Frequency" value={humanize(serviceDetails.frequency)} />
                            <ServiceSummaryRow icon="counter" label="Walks per day" value={serviceDetails.timesPerDay ? String(serviceDetails.timesPerDay) : null} />
                            <ServiceSummaryRow icon="calendar-week" label="Recurring days" value={serviceDetails.recurringDays?.join(', ')} />
                            <ServiceSummaryRow icon="clock-check-outline" label="Selected slot(s)" value={booking.timeSlot} />

                            {walkProgress?.totalSessions > 0 && (
                                <View style={styles.walkProgressBlock}>
                                    <View style={styles.walkProgressHeader}>
                                        <AppText style={styles.walkProgressTitle} weight="bold">WALK PROGRESS</AppText>
                                        <AppText style={styles.walkProgressCount} weight="bold">
                                            {walkProgress.completedSessions}/{walkProgress.totalSessions}
                                        </AppText>
                                    </View>
                                    <View style={styles.walkProgressTrack}>
                                        <View
                                            style={[
                                                styles.walkProgressFill,
                                                { width: `${Math.round((walkProgress.completedSessions / walkProgress.totalSessions) * 100)}%` },
                                            ]}
                                        />
                                    </View>

                                    {currentWalk && (
                                        <View style={styles.currentWalkCard}>
                                            <View style={styles.currentWalkInfo}>
                                                <AppText style={styles.currentWalkTitle} weight="bold">
                                                    {currentWalk.status === 'in_progress' ? 'Walk live now' : `Next walk #${currentWalk.sessionNumber}`}
                                                </AppText>
                                                <AppText style={styles.currentWalkMeta}>
                                                    {formatBookingDate(currentWalk.serviceDate)} • {currentWalk.timeSlot}
                                                </AppText>
                                            </View>
                                            {currentWalk.otp && (
                                                <View style={styles.walkOtpBox}>
                                                    <AppText style={styles.walkOtpLabel}>PIN</AppText>
                                                    <AppText style={styles.walkOtpValue} weight="bold">{currentWalk.otp}</AppText>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    {walkProgress.activeSession && (
                                        <TouchableOpacity
                                            style={styles.trackWalkButton}
                                            onPress={() => navigation.navigate('TrackingScreen', { booking })}
                                        >
                                            <Ionicons name="navigate" size={17} color="#FFF" />
                                            <AppText style={styles.trackWalkButtonText} weight="bold">TRACK LIVE WALK</AppText>
                                        </TouchableOpacity>
                                    )}

                                    <View style={styles.walkSessionList}>
                                        {walkProgress.sessions.map((session) => (
                                            <View key={session.id} style={styles.walkSessionRow}>
                                                <Ionicons
                                                    name={session.status === 'completed' ? 'checkmark-circle' : session.status === 'in_progress' ? 'navigate-circle' : 'ellipse-outline'}
                                                    size={18}
                                                    color={session.status === 'completed' ? theme.colors.success : session.status === 'in_progress' ? theme.colors.primaryDark : '#A5ADB5'}
                                                />
                                                <AppText style={styles.walkSessionText}>
                                                    Walk #{session.sessionNumber} • {formatBookingDate(session.serviceDate)} • {session.timeSlot}
                                                </AppText>
                                                <AppText style={styles.walkSessionStatus} weight="bold">{humanize(session.status)}</AppText>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {serviceDetails.visitType && booking.bookingType !== 'walking' && (
                        <ServiceSummaryRow icon="map-marker-outline" label="Visit type" value={humanize(serviceDetails.visitType)} />
                    )}

                    {selectedAddons.length > 0 && (
                        <View style={styles.serviceList}>
                            <AppText style={styles.serviceListTitle} weight="bold">SELECTED ADD-ONS</AppText>
                            {selectedAddons.map((addon, index) => (
                                <View key={`${addon.name}-${index}`} style={styles.serviceLineItem}>
                                    <Ionicons name="add-circle" size={16} color={theme.colors.primaryDark} />
                                    <View style={styles.serviceLineItemBody}>
                                        <AppText style={styles.serviceLineItemText} weight="bold">{addon.name}</AppText>
                                        {addon.description ? <AppText style={styles.serviceLineDescription}>{addon.description}</AppText> : null}
                                    </View>
                                    {addon.price !== undefined && <AppText style={styles.serviceLinePrice} weight="bold">{formatPrice(addon.price)}</AppText>}
                                </View>
                            ))}
                        </View>
                    )}

                    {additionalCharges.length > 0 && (
                        <View style={styles.serviceList}>
                            <AppText style={styles.serviceListTitle} weight="bold">ADDITIONAL CHARGES</AppText>
                            {additionalCharges.map((charge, index) => (
                                <View key={`${charge.name}-${index}`} style={styles.serviceLineItem}>
                                    <Ionicons name="alert-circle" size={16} color="#A65A00" />
                                    <View style={styles.serviceLineItemBody}>
                                        <AppText style={styles.serviceLineItemText} weight="bold">{charge.name}</AppText>
                                        {charge.description ? <AppText style={styles.serviceLineDescription}>{charge.description}</AppText> : null}
                                    </View>
                                    {charge.price !== undefined && <AppText style={styles.serviceLinePrice} weight="bold">{formatPrice(charge.price)}</AppText>}
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={styles.serviceTotalRow}>
                        <AppText style={styles.serviceTotalLabel}>TOTAL SERVICE AMOUNT</AppText>
                        <AppText style={styles.serviceTotalValue} weight="bold">{formatPrice(booking.totalCost)}</AppText>
                    </View>
                </View>

                {/* Main Info Card */}
                <View style={styles.card}>
                    {/* Date & Time & Expert Row */}
                    <View style={[styles.infoBlock, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                            <AppText style={styles.infoLabel}>DATE & TIME</AppText>
                            <AppText style={styles.infoValue}>
                                {formatBookingDate(booking.serviceDate)}{booking.timeSlot ? ` • ${booking.timeSlot}` : ' • 10:30 AM'}
                            </AppText>
                        </View>
                        <View style={{ width: 1, backgroundColor: '#F0F2F5', height: '100%', marginHorizontal: 8 }} />
                        <View style={{ flex: 1, paddingLeft: 10 }}>
                            <AppText style={styles.infoLabel}>{booking.bookingType === 'walking' ? 'WALKER' : 'EXPERT'}</AppText>
                            <View style={styles.expertRow}>
                                <AppText style={[styles.infoValue, { flex: 1 }]} numberOfLines={1}>{booking.vendorName || (['pending', 'awaiting_vendor'].includes(booking.status) ? 'Assigning...' : 'Unassigned')}</AppText>
                                {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
                                    <>
                                        <TouchableOpacity style={[styles.actionIconBtn, { width: 28, height: 28, marginLeft: 6 }]} activeOpacity={0.8} onPress={handleCall}>
                                            <Ionicons name="call-outline" size={14} color="#FFF" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionIconBtn, { width: 28, height: 28, marginLeft: 6 }]} activeOpacity={0.8}>
                                            <Ionicons name="chatbubble-outline" size={14} color="#FFF" />
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* PIN Block (if exists) */}
                    {(booking.status === 'confirmed' || booking.status === 'in_progress') && booking.otp && (
                        <View style={[styles.infoBlock, { flexDirection: 'row', alignItems: 'center' }]}>
                            <View style={[styles.otpMinimalContainer, { marginTop: 0 }]}>
                                <AppText style={styles.otpMinimalLabel}>PIN</AppText>
                                <View style={styles.otpHighlight}>
                                    <AppText style={styles.otpMinimalValue} weight="bold">{booking.otp}</AppText>
                                </View>
                            </View>
                            <AppText style={{ flex: 1, marginLeft: 12, fontSize: 12, color: theme.colors.textSecondary }}>
                                Share this PIN with your {booking.bookingType === 'walking' ? 'walker' : 'expert'} to start the service.
                            </AppText>
                        </View>
                    )}

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
                                {booking.status !== 'declined' && !(booking.bookingType === 'walking' && (
                                    walkProgress?.activeSession || walkProgress?.completedSessions > 0
                                )) && (
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
                            
                            {/* Add to Calendar */}
                            <TouchableOpacity 
                                style={styles.calendarBtn} 
                                activeOpacity={0.8}
                                onPress={addToCalendar}
                            >
                                <Ionicons name="calendar-outline" size={18} color={theme.colors.primaryDark} style={{ marginRight: 8 }} />
                                <AppText style={styles.calendarBtnText} weight="bold">Add to Calendar</AppText>
                            </TouchableOpacity>
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
                        <TouchableOpacity 
                            style={styles.viewDetailRow} 
                            activeOpacity={0.8}
                            onPress={() => {
                                Alert.alert(
                                    'Bill Details',
                                    `Service Amount: ₹${booking.totalCost ?? booking.amountPaid ?? 0}\nAmount Paid: ₹${booking.amountPaid ?? 0}\nStatus: ${booking.paymentStatus === 'paid' || booking.amountPaid > 0 ? 'Paid' : 'Pending'}`
                                );
                            }}
                        >
                            <AppText style={styles.viewDetailText}>VIEW DETAIL</AppText>
                            <Ionicons name="chevron-forward" size={12} color={theme.colors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                    <AppText style={styles.amountValue} weight="bold">₹ {booking.amountPaid ?? booking.totalCost ?? 0}</AppText>
                </View>

                {/* Info Banner */}
                <View style={styles.infoBanner}>
                    <Ionicons name="information-circle-outline" size={18} color={theme.colors.textSecondary} style={{ marginTop: 2 }} />
                    <AppText style={styles.infoBannerText}>
                        Cancellation made within 24hrs of the appointment are subject to a ₹49 fee.
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
    serviceDetailTitle: {
        fontSize: 13,
        color: theme.colors.textTertiary,
        letterSpacing: 0.8,
        marginBottom: 16,
    },
    packageBlock: {
        marginBottom: 4,
    },
    packageHeadingRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    packageHeadingText: {
        flex: 1,
        marginLeft: 12,
    },
    packageName: {
        color: theme.colors.textBlack,
        fontSize: 17,
    },
    packageMeta: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        lineHeight: 18,
        marginTop: 2,
    },
    serviceList: {
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
        marginTop: 14,
        paddingTop: 14,
    },
    serviceListTitle: {
        color: theme.colors.textTertiary,
        fontSize: 11,
        letterSpacing: 0.6,
        marginBottom: 9,
    },
    serviceLineItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    serviceLineItemBody: {
        flex: 1,
        marginLeft: 8,
    },
    serviceLineItemText: {
        flex: 1,
        color: theme.colors.textBlack,
        fontSize: 13,
        lineHeight: 19,
        marginLeft: 8,
    },
    serviceLineDescription: {
        color: theme.colors.textSecondary,
        fontSize: 11,
        lineHeight: 16,
    },
    serviceLinePrice: {
        color: theme.colors.primaryDark,
        fontSize: 13,
        marginLeft: 10,
    },
    walkingGrid: {
        marginTop: -6,
    },
    walkProgressBlock: {
        marginTop: 18,
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
        paddingTop: 16,
    },
    walkProgressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    walkProgressTitle: {
        color: theme.colors.textTertiary,
        fontSize: 11,
        letterSpacing: 0.6,
    },
    walkProgressCount: {
        color: theme.colors.primaryDark,
        fontSize: 13,
    },
    walkProgressTrack: {
        height: 7,
        backgroundColor: '#E7EBE7',
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 9,
    },
    walkProgressFill: {
        height: '100%',
        backgroundColor: theme.colors.success,
        borderRadius: 4,
    },
    currentWalkCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#F3F7F2',
    },
    currentWalkInfo: {
        flex: 1,
    },
    currentWalkTitle: {
        color: theme.colors.textBlack,
        fontSize: 14,
    },
    currentWalkMeta: {
        color: theme.colors.textSecondary,
        fontSize: 11,
        marginTop: 3,
    },
    walkOtpBox: {
        alignItems: 'center',
        backgroundColor: '#E0F2E0',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginLeft: 10,
    },
    walkOtpLabel: {
        color: theme.colors.textSecondary,
        fontSize: 8,
    },
    walkOtpValue: {
        color: '#2E7D32',
        fontSize: 15,
        letterSpacing: 2,
    },
    trackWalkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.colors.primaryDark,
        borderRadius: 10,
        paddingVertical: 11,
        marginTop: 12,
    },
    trackWalkButtonText: {
        color: '#FFF',
        fontSize: 12,
    },
    walkSessionList: {
        marginTop: 10,
    },
    walkSessionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F5',
    },
    walkSessionText: {
        flex: 1,
        color: theme.colors.textSecondary,
        fontSize: 10,
        marginLeft: 7,
    },
    walkSessionStatus: {
        color: theme.colors.primaryDark,
        fontSize: 9,
        marginLeft: 6,
    },
    serviceSummaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5',
        paddingVertical: 11,
    },
    serviceSummaryText: {
        flex: 1,
        marginLeft: 10,
    },
    serviceSummaryLabel: {
        color: theme.colors.textTertiary,
        fontSize: 10,
        textTransform: 'uppercase',
    },
    serviceSummaryValue: {
        color: theme.colors.textBlack,
        fontSize: 13,
        marginTop: 2,
    },
    serviceTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
        marginTop: 12,
        paddingTop: 15,
    },
    serviceTotalLabel: {
        color: theme.colors.textSecondary,
        fontSize: 11,
        letterSpacing: 0.5,
    },
    serviceTotalValue: {
        color: theme.colors.primaryDark,
        fontSize: 17,
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
    slotTextActive: {
        color: '#FFF',
    },
    otpMinimalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    otpMinimalLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginRight: 8,
        fontWeight: 'bold',
    },
    otpHighlight: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    otpMinimalValue: {
        fontSize: 14,
        color: '#2E7D32',
        letterSpacing: 2,
    },
    calendarBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F0F0',
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 12,
    },
    calendarBtnText: {
        color: theme.colors.primaryDark,
        fontSize: 14,
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
