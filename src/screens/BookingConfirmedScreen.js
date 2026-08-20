import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Animated, Easing, Modal, LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { BASE_URL, bookingsApi, discoverApi } from '../services/api';
import PaymentSummaryModal from '../components/PaymentSummaryModal';
import { formatISTDate } from '../utils/date_utils';
import { useBackHandler } from '../hooks/useBackHandler';

const { width } = Dimensions.get('window');

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120000; // 2 minutes

const BookingConfirmedScreen = ({ navigation, route }) => {
  const {
    bookingId,
    cart = [],
    total = 0,
    expert = {},
    pet = {},
    date = '',
    time = '',
    visitType = '',
    address = '',
    notes = '',
    serviceType = 'grooming',
    selectedRoom,
    duration,
    frequency,
    isScoobyzMatch
  } = route.params || {};

  const svcType = (serviceType || 'grooming').toLowerCase();
  const isBoarding = svcType === 'boarding';
  const isWalking = svcType === 'walking';
  const isVet = svcType === 'veterinary' || svcType === 'vet';

  const [status, setStatus] = useState('pending');
  const [timedOut, setTimedOut] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [invoiceVisible, setInvoiceVisible] = useState(false);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const mainPackage = (cart && cart.length > 0) ? cart[0] : {};
  const addons = (cart && cart.length > 0 && cart[0].addons) ? cart[0].addons : [];

  const [dynamicFeatures, setDynamicFeatures] = useState(mainPackage.features || []);
  const [isPackageExpanded, setIsPackageExpanded] = useState(false);

  const togglePackageAccordion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsPackageExpanded(!isPackageExpanded);
  };

  useEffect(() => {
    if (!dynamicFeatures || dynamicFeatures.length === 0) {
      discoverApi.scoobyzPackages()
        .then(data => {
          const found = data?.packages?.find(p => p.id === mainPackage.packageId || p.title === mainPackage.title || p.title === mainPackage.name || p.title === mainPackage.addonName);
          if (found && found.features) {
            setDynamicFeatures(found.features);
          }
        })
        .catch(e => console.log('Failed to fetch dynamic package details', e));
    }
  }, []);

  // Terminal screen — block back into booking flow, always go home unless timed out
  const { handleBack } = useBackHandler({
    onBack: () => {
      if (timedOut) {
        navigation.goBack();
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'LandingScreen' }] });
      }
      return true;
    }
  });

  useEffect(() => {
    startRotation();
    startPolling();

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
      rotateAnim.stopAnimation();
    };
  }, []);

  const startRotation = () => {
    rotateAnim.setValue(0);
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const addToCalendar = () => {
    const title = `${svcType.toUpperCase()} Service`;
    const location = address || '';
    const eventNotes = notes || `Order ID: #${bookingId}`;
    
    // Attempt basic parsing of route.params.date, e.g., 'May 25, 2026'
    let startDate = new Date();
    if (date) {
      try {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) startDate = parsed;
      } catch(e) {}
    }

    const start = startDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = start;
    const url = Platform.select({
      ios: `calshow:${Math.floor(startDate.getTime() / 1000)}`,
      android: `content://com.android.calendar/time/${startDate.getTime()}`,
      default: `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(eventNotes)}&location=${encodeURIComponent(location)}`
    });
    
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(eventNotes)}&location=${encodeURIComponent(location)}`);
    });
  };

  const startPolling = () => {
    if (!bookingId) {
      // If we got here without a booking ID (e.g. testing mode), just simulate pending forever or skip
      return;
    }

    intervalRef.current = setInterval(async () => {
      try {
        const data = await bookingsApi.getStatus(bookingId);
        if (data?.status === 'confirmed' || (data?.status === 'pending' && data?.vendorId)) {
          stopPolling();
          try {
            const fullData = await bookingsApi.get(bookingId);
            setBookingData(fullData);
          } catch (e) {
            setBookingData(data);
          }
          setStatus('confirmed');
        } else if (data?.status === 'declined') {
          // Keep showing hourglass per user request, wait for timeout
          // DO NOT stop polling or change status
        }
      } catch (err) {
        console.warn('[Pending] Poll error:', err.message);
      }
    }, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(async () => {
      clearInterval(intervalRef.current);
      if (status !== 'confirmed') {
        setTimedOut(true);
        if (!isScoobyzMatch) {
          setStatus('cancelled');
          if (bookingId) {
            try {
              await bookingsApi.cancel(bookingId, { reason: 'System timeout: No vendors available' });
            } catch (e) {
              console.warn('Auto-cancel failed:', e);
            }
          }
        }
      }
    }, POLL_TIMEOUT_MS);
  };

  const stopPolling = () => {
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
  };

  const petImageUrl = pet.photoUrl
    ? (pet.photoUrl.startsWith('http') ? pet.photoUrl : `${BASE_URL}${pet.photoUrl}`)
    : 'https://images.unsplash.com/photo-1591160690555-5debfba289f0?q=80&w=256&auto=format&fit=crop';

  const displayVendorName = bookingData?.vendorName || expert?.name || expert?.businessName || 'Assigned Scoober';
  const displayVendorImage = bookingData?.vendorImage || expert?.image || expert?.profilePhoto;

  const getInitials = (name) => {
    if (!name || name === 'Assigned Scoober') return 'S';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getFormattedRating = () => {
    const rawRating = bookingData?.vendorRating || expert?.rating;
    if (!rawRating) return '4.8';
    const parsed = parseFloat(rawRating);
    return isNaN(parsed) ? '4.8' : parsed.toFixed(1);
  };

  return (
    <AppScreen safeAreaTop={false} padding={false} backgroundColor="#FAFAF8">
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'LandingScreen' }] })}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color={theme.colors.textBlack} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} type="heading" weight="bold">Booking Details</AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 20 }}
      >
        {/* Top Status Section */}
        <View style={styles.statusSection}>
          <Image source={{ uri: petImageUrl }} style={styles.statusPetImage} />
          <AppText style={styles.statusTitle} type="heading" weight="bold">
            {status === 'confirmed' ? 'Booking Confirmed!' : status === 'cancelled' ? 'Booking Cancelled' : 'Booking Request Sent!'}
          </AppText>
          <AppText style={styles.statusSubtitle}>
            Your grooming session for <AppText weight="bold" style={{ color: theme.colors.textBlack }}>{pet.name || 'Your Pet'}</AppText> is {status === 'confirmed' ? 'confirmed' : status === 'cancelled' ? 'cancelled due to unavailability' : 'pending'}.
          </AppText>
          <View style={styles.bookingIdBadge}>
            <AppText style={styles.bookingIdText} weight="bold">
              BOOKING ID: #{bookingId || ''}
            </AppText>
          </View>
        </View>

        {/* Card 1: Package & Addons & Special Request */}
        <View style={styles.card}>
          <View style={styles.simplePackageSection}>
            <AppText style={styles.smallLabel}>PACKAGE DETAIL</AppText>
            <AppText style={styles.simpleMainPackageText} weight="bold">
              {isBoarding 
                ? (selectedRoom?.title || 'Boarding Room')
                : isWalking 
                  ? 'Dog Walking'
                  : isVet
                    ? (visitType || 'Clinic Visit')
                    : (mainPackage.title || mainPackage.name || 'Full Grooming Session')}
            </AppText>
            {isWalking && (duration || frequency) && (
              <AppText style={styles.walkingDetailsText}>
                {[duration ? `${duration} mins` : '', frequency].filter(Boolean).join(' • ')}
              </AppText>
            )}
          </View>
          
          {addons && addons.length > 0 && (
            <View style={styles.simpleAddonsSection}>
              <AppText style={styles.smallLabel}>ADD-ONS</AppText>
              {addons.map((addon, idx) => (
                <AppText key={idx} style={styles.simpleAddonText} weight="bold">
                  {addon.addonName || addon.name || 'Add-on'}
                </AppText>
              ))}
            </View>
          )}

          {notes ? (
            <>
              <View style={styles.dottedLine} />
              <View style={styles.specialRequestContainer}>
                <View style={styles.specialRequestRow}>
                  <View style={styles.specialBadge}>
                    <AppText style={styles.specialBadgeText} weight="bold">SPECIAL REQUEST</AppText>
                  </View>
                </View>
                <View style={styles.notesRow}>
                  <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} style={{ marginRight: 8, marginTop: -2 }} />
                  <AppText style={styles.notesText}>{notes}</AppText>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* Card 2: Appointment Detail */}
        <View style={styles.card}>
          <AppText style={[styles.smallLabel, { marginBottom: 16 }]}>APPOINTMENT DETAIL</AppText>
          
          {/* Dynamic Assignment Status */}
          {status !== 'confirmed' ? (
            <View style={styles.assignmentBlock}>
              {timedOut ? (
                <>
                  <View style={styles.assignmentHeaderRow}>
                    <Ionicons name={isScoobyzMatch ? "time-outline" : "close-circle"} size={20} color={isScoobyzMatch ? "#F59E0B" : theme.colors.error} style={{ marginRight: 8 }} />
                    <AppText style={[styles.assignmentTitle, { color: isScoobyzMatch ? "#F59E0B" : theme.colors.error }]} weight="bold">
                      {isScoobyzMatch ? 'Still finding a match...' : 'No vendors available'}
                    </AppText>
                  </View>
                  <AppText style={styles.assignmentSubtitle}>
                    {isScoobyzMatch 
                      ? `We are still looking for the best scoober for ${pet.name || 'Your Pet'}. You can safely leave this screen, we'll notify you once assigned.`
                      : `We couldn't find an available scoober for ${pet.name || 'Your Pet'} at this time. Please try again later or choose another date.`}
                  </AppText>
                </>
              ) : (
                <>
                  <View style={styles.assignmentHeaderRow}>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <Ionicons name="hourglass-outline" size={20} color="#F59E0B" style={{ marginRight: 8 }} />
                    </Animated.View>
                    <AppText style={[styles.assignmentTitle, { color: '#F59E0B' }]} weight="bold">Assigning a scoober</AppText>
                  </View>
                  <AppText style={styles.assignmentSubtitle}>
                    We're finding an available scoober for {pet.name || 'Your Pet'}. You'll be notified once a scoober is assigned.
                  </AppText>
                </>
              )}
            </View>
          ) : (
            <View style={styles.assignedBlock}>
              {displayVendorImage ? (
                <Image 
                  source={{ uri: displayVendorImage }} 
                  style={styles.vendorImage} 
                />
              ) : (
                <View style={[styles.vendorImage, { backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                  <AppText style={{ color: '#FFF', fontSize: 20 }} weight="bold">
                    {getInitials(displayVendorName)}
                  </AppText>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <AppText style={styles.vendorName} weight="bold">{displayVendorName}</AppText>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <AppText style={styles.ratingText} weight="bold">{getFormattedRating()}</AppText>
                </View>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={24} color={theme.colors.primaryDark} style={styles.detailIcon} />
            <View>
              <AppText style={styles.detailSmallLabel}>DATE & TIME</AppText>
              <AppText style={styles.detailValueText} weight="bold">{date} • {time}</AppText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={24} color={theme.colors.primaryDark} style={styles.detailIcon} />
            <View style={{ flex: 1 }}>
              <AppText style={styles.detailSmallLabel}>ADDRESS</AppText>
              <AppText style={styles.detailValueText} weight="bold">{address}</AppText>
            </View>
          </View>
        </View>

        {/* Card 3: Amount Paid */}
        <View style={styles.amountCard}>
          <View style={styles.amountLeft}>
            <Ionicons name="receipt-outline" size={24} color={theme.colors.primaryDark} style={{ marginRight: 12 }} />
            <View>
              <AppText style={styles.amountTitle} weight="bold">Amount Paid</AppText>
              <TouchableOpacity onPress={() => setInvoiceVisible(true)}>
                <AppText style={styles.viewDetailText}>VIEW DETAIL <Ionicons name="chevron-forward" size={12} /></AppText>
              </TouchableOpacity>
            </View>
          </View>
          <AppText style={styles.amountTotal} weight="bold">₹ {bookingData?.amountPaid ?? route.params.amountPaid ?? 0}</AppText>
        </View>
        {/* OTP Section (if available) */}
        {status === 'confirmed' && bookingData?.otp && (
          <View style={styles.otpContainer}>
            <View style={styles.otpHeader}>
              <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
              <AppText style={styles.otpLabel} weight="bold">SERVICE PIN</AppText>
            </View>
            <AppText style={styles.otpValue} weight="bold">{bookingData.otp}</AppText>
            <AppText style={styles.otpSubText}>Share this pin with your provider to start the service</AppText>
          </View>
        )}

        <TouchableOpacity style={styles.supportLink}>
          <AppText style={styles.supportText}>Need help ? <AppText weight="bold" style={{ textDecorationLine: 'underline' }}>Contact Support</AppText></AppText>
        </TouchableOpacity>

      </ScrollView>

      {/* Bottom Buttons */}
      {/* 
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.calendarBtn} onPress={addToCalendar}>
          <AppText style={styles.calendarBtnText} weight="bold">Add to Calendar</AppText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.trackBtn} onPress={() => {}}>
          <AppText style={styles.trackBtnText} weight="bold">Track</AppText>
        </TouchableOpacity>
      </View>
      */}

      {/* Payment Summary Modal */}
      <PaymentSummaryModal
        visible={invoiceVisible}
        onClose={() => setInvoiceVisible(false)}
        cart={route.params.cart}
        total={route.params.total}
        room={route.params.selectedRoom}
        meal={route.params.selectedMeal}
        nights={route.params.nights}
        frequency={route.params.frequency}
        timesPerDay={route.params.timesPerDay}
        isAggressive={route.params.isAggressive}
        aggressiveFee={route.params.aggressiveFee}
        amountPaid={bookingData?.amountPaid || route.params.amountPaid}
        remainingAmount={bookingData?.remainingAmount || (route.params.total - (route.params.amountPaid || 0))}
      />

    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FAFAF8',
  },
  backButton: {
    marginRight: 12,
    marginLeft: -6,
  },
  headerTitle: {
    fontSize: 22,
    color: theme.colors.textBlack,
  },
  scrollContainer: {
    flex: 1,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusPetImage: {
    width: 80,
    height: 80,
    borderRadius: 24,
    marginBottom: 16,
    ...theme.shadows?.small,
  },
  statusTitle: {
    fontSize: 24,
    color: theme.colors.textBlack,
    marginBottom: 6,
  },
  statusSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  bookingIdBadge: {
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bookingIdText: {
    color: theme.colors.white,
    fontSize: 11,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  simplePackageSection: {
    marginBottom: 16,
  },
  simpleMainPackageText: {
    fontSize: 15,
    color: theme.colors.textBlack,
    marginTop: 6,
  },
  walkingDetailsText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  simpleAddonsSection: {
    marginBottom: 0,
  },
  simpleAddonText: {
    fontSize: 15,
    color: theme.colors.textBlack,
    marginTop: 6,
  },

  smallLabel: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  valueText: {
    fontSize: 16,
    color: theme.colors.textBlack,
    marginBottom: 8,
  },
  dottedLine: {
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
    marginVertical: 16,
    marginHorizontal: -20,
  },
  specialRequestRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  specialBadge: {
    backgroundColor: '#6C7E8D',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  specialBadgeText: {
    color: theme.colors.white,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  assignmentBlock: {
    marginBottom: 24,
  },
  assignmentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  assignmentTitle: {
    fontSize: 16,
  },
  assignmentSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  assignedBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#F5F5F3',
    padding: 12,
    borderRadius: 12,
  },
  vendorImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  vendorName: {
    fontSize: 16,
    color: theme.colors.textBlack,
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: theme.colors.textBlack,
    marginLeft: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  detailIcon: {
    marginRight: 16,
  },
  detailSmallLabel: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailValueText: {
    fontSize: 13,
    color: theme.colors.textBlack,
    lineHeight: 18,
  },
  amountCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows?.medium,
  },
  amountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountTitle: {
    fontSize: 15,
    color: theme.colors.textBlack,
    marginBottom: 4,
  },
  viewDetailText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  amountTotal: {
    fontSize: 20,
    color: theme.colors.textBlack,
  },
  supportLink: {
    alignItems: 'center',
    marginBottom: 40,
  },
  supportText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAFAF8',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30, // Safe area assuming standard iPhone
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  calendarBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: theme.colors.success,
    borderRadius: 16,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: theme.colors.white,
  },
  calendarBtnText: {
    color: theme.colors.success,
    fontSize: 17,
  },
  trackBtn: {
    flex: 1,
    backgroundColor: theme.colors.success,
    borderRadius: 16,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackBtnText: {
    color: theme.colors.white,
    fontSize: 17,
  },
  closeText: {
    color: theme.colors.white,
    fontSize: 14,
  },
  otpContainer: {
    backgroundColor: '#F1F8E9',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  otpLabel: {
    color: '#2E7D32',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  otpValue: {
    color: '#1B5E20',
    fontSize: 32,
    letterSpacing: 10,
    marginVertical: 4,
  },
  otpSubText: {
    color: '#4CAF50',
    fontSize: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 16,
    flex: 1,
    marginTop: 60,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    padding: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    color: theme.colors.textBlack,
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 15,
    color: theme.colors.primaryDark,
    marginTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  dottedLine: {
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  specialRequestRow: {
    marginTop: 8,
  },
  specialBadge: {
    backgroundColor: 'rgba(82, 109, 130, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  specialBadgeText: {
    fontSize: 10,
    color: '#526D82',
    letterSpacing: 0.5,
  },
  specialText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

export default BookingConfirmedScreen;
