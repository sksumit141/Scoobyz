import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, StyleSheet, TouchableOpacity, ScrollView,
  Image, Dimensions, Platform, ActivityIndicator, Linking, LayoutAnimation, UIManager
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import ServiceHeader from '../components/ServiceHeader';
import PaymentSummaryModal from '../components/PaymentSummaryModal';
import { theme } from '../styles/theme';
import { bookingsApi, addressApi, BASE_URL } from '../services/api';
import MapComponent from '../components/MapComponent';
import CustomAlert from '../components/CustomAlert';
import { useDiscount } from '../contexts/DiscountContext';
import { useCart } from '../contexts/CartContext';
import { formatISTDate, getISTDateString } from '../utils/date_utils';
import RazorpayCheckout from 'react-native-razorpay';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function getServiceApi(serviceType) {
  switch ((serviceType || '').toLowerCase()) {
    case 'grooming': return bookingsApi.createGrooming;
    case 'boarding': return bookingsApi.createBoarding;
    case 'walking': return bookingsApi.createWalking;
    case 'veterinary': return bookingsApi.createVeterinary;
    default: return bookingsApi.createGrooming;
  }
}

function buildPayload(params, paymentDetails) {
  const { serviceType, expert, pet, date, time, visitType, consultType,
    total, cart, selectedRoom, selectedMeal,
    frequency, duration, timesPerDay, size, customMealText, notes } = params;
  const vendorUserId = expert?.userId || expert?.id;
  const safeDate = date ? getISTDateString(date) : getISTDateString(new Date());
  const safeTime = time || '10:30 AM';
  const base = {
    vendorUserId, petId: pet?.id,
    totalCost: paymentDetails.totalCost || total || 0,
    serviceDate: safeDate, serviceTimeSlot: safeTime,
    petName: pet?.name || 'Pet', petBreed: pet?.breed || 'Dog',
    notes: notes || cart?.[0]?.notes || '',
    paymentType: paymentDetails.paymentType,
    amountPaid: paymentDetails.amountPaid,
    remainingAmount: paymentDetails.remainingAmount,
  };
  const type = (serviceType || '').toLowerCase();
  if (type === 'boarding') {
    const endDateParam = params.endDate || new Date(Date.now() + 86400000);
    const boardingAddons = [];
    if (params.isAggressive && params.aggressiveFee)
      boardingAddons.push({ name: 'Aggressive Dog Handling', price: params.aggressiveFee });
    return {
      ...base, endDate: getISTDateString(endDateParam), dogSize: size,
      roomType: selectedRoom?.title || selectedRoom?.name, mealType: selectedMeal?.name,
      customMealNotes: customMealText,
      meals: selectedMeal ? [{ mealName: selectedMeal.name, frequency, price: selectedMeal.price }] : [],
      addons: boardingAddons
    };
  } else if (type === 'walking') {
    return { ...base, frequency, duration, timesPerDay: timesPerDay || 1 };
  } else if (type === 'veterinary') {
    return { ...base, visitType: visitType || consultType || 'Clinic Visit' };
  } else {
    const mainPackage = cart?.[0] || {};
    return { ...base, serviceId: mainPackage?.id, visitType: visitType === 'Home Service' ? 'home_visit' : 'studio' };
  }
}

const SERVICE_CONFIG = {
  grooming: { icon: 'content-cut', label: 'Grooming', accent: '#7B1FA2' },
  boarding: { icon: 'home-heart', label: 'Boarding', accent: '#1565C0' },
  walking: { icon: 'dog-side', label: 'Walking', accent: '#2E7D32' },
  veterinary: { icon: 'medical-bag', label: 'Veterinary', accent: '#BF360C' },
  default: { icon: 'paw', label: 'Service', accent: '#526D82' },
};
function getConfig(serviceType) {
  return SERVICE_CONFIG[(serviceType || '').toLowerCase()] || SERVICE_CONFIG.default;
}

const { width } = Dimensions.get('window');

const SectionPill = ({ label }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionPillBar} />
    <AppText style={styles.sectionTitle}>{label}</AppText>
  </View>
);

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <MaterialCommunityIcons name={icon} size={16} color="#526D82" style={{ marginRight: 8 }} />
    <AppText style={styles.detailLabel}>{label}: </AppText>
    <AppText style={styles.detailValue} weight="bold">{value}</AppText>
  </View>
);

const ReviewDetailsScreen = ({ navigation, route }) => {
  const params = route.params || {};
  const {
    cart = [], total: rawTotal = 0, expert = {},
    date, time, visitType, address, pet = {},
    selectedRoom = null, selectedMeal = null,
    frequency, duration, timesPerDay, size, notes, customMealText,
    endDate, checkoutDate, isAggressive, aggressiveFee, consultType,
  } = params;

  const total = Number(rawTotal) || 0;
  const serviceType = params.serviceType || 'Grooming';
  const svcType = serviceType.toLowerCase();
  const svcConfig = getConfig(serviceType);
  const isWalking = svcType === 'walking';
  const isBoarding = svcType === 'boarding';
  const isVet = svcType === 'veterinary';
  const isGrooming = !isWalking && !isBoarding && !isVet;

  const { saveToCart, clearCart } = useCart();

  React.useEffect(() => {
    saveToCart(params, 'ReviewDetails', serviceType || 'Service', rawTotal || 0);
  }, []);

  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentType, setPaymentType] = useState((isWalking || isGrooming) ? 'full' : null);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });
  const [validationMsg, setValidationMsg] = useState('');

  const { calculateDiscountedPrice } = useDiscount();
  const isScoobyzMatch = expert?.id === 'scoobyz_match' || expert?.userId === 'scoobyz_match';

  const [quantities, setQuantities] = useState(() => {
    const q = { 'main': 1 };
    (params.cart?.[0]?.addons || []).forEach(a => {
      q[a.id || a.name || a.addonName] = 1;
    });
    return q;
  });

  const mainPackage = cart[0] || {};
  const addons = mainPackage.addons || [];

  const dynamicTotal = React.useMemo(() => {
    let sum = 0;
    if (isGrooming) {
      sum += (mainPackage.basePrice || mainPackage.price || 0) * (quantities['main'] || 1);
      addons.forEach(a => {
        sum += (a.addonPrice || a.price || 0) * (quantities[a.id || a.name || a.addonName] || 0);
      });
      return sum > 0 ? sum : total;
    }
    return total;
  }, [quantities, mainPackage, addons, isGrooming, total]);

  const discountedTotal = calculateDiscountedPrice(dynamicTotal, serviceType);
  const amountPaid = (paymentType === 'partial' ? dynamicTotal * 0.3 : dynamicTotal);
  const remainingAmount = dynamicTotal - amountPaid;
  const discountedAmountPaid = calculateDiscountedPrice(amountPaid, serviceType);
  const discountedRemainingAmount = calculateDiscountedPrice(remainingAmount, serviceType);

  const nights = (date && (endDate || checkoutDate))
    ? Math.max(1, Math.ceil((new Date(endDate || checkoutDate).getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const displayDate = date ? formatISTDate(date) : 'TBD';

  useFocusEffect(
    useCallback(() => {
      const loadAddress = async () => {
        try {
          if (route.params?.selectedAddress) {
            setSelectedAddress(route.params.selectedAddress);
            return;
          }

          if (address && typeof address === 'object') {
            setSelectedAddress(address);
            return;
          }

          if (
            address &&
            typeof address === 'string' &&
            address !== '123 Paws Lane, Noida Sector-42'
          ) {
            setSelectedAddress({
              fullAddress: address,
              label: 'Service Location',
            });
            return;
          }

          const addresses = await addressApi.list();

          const def =
            addresses.find(a => a.isDefault) ||
            addresses[0];

          if (def) {
            setSelectedAddress(def);
          }
        } catch (error) {
          console.error('Fetch address error:', error);
        }
      };

      loadAddress();
    }, [route.params?.selectedAddress, address])
  );

  const handleOpenMaps = () => {
    const parts = selectedAddress ? [
      selectedAddress.fullAddress, selectedAddress.areaLocality,
      selectedAddress.landmark ? `Near ${selectedAddress.landmark}` : null,
      selectedAddress.city, selectedAddress.state, selectedAddress.pincode,
    ].filter(Boolean) : [address];
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(parts.join(', '))}`,
      android: `geo:0,0?q=${encodeURIComponent(parts.join(', '))}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`,
    });
    Linking.openURL(url).catch(e => console.error(e));
  };

  const handleConfirmBooking = async () => {
    if (!selectedAddress && !address) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setValidationMsg('Please add an address first to continue.');
      setTimeout(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setValidationMsg('');
      }, 3000);
      return;
    }
    const vendorUserId = expert?.userId || expert?.id;
    if (!vendorUserId) {
      setAlertConfig({ visible: true, title: 'Error', message: 'Vendor information missing.', type: 'error' }); return;
    }
    if (!paymentType) {
      setAlertConfig({ visible: true, title: 'Payment Required', message: 'Please select a payment option to continue.', type: 'error' }); return;
    }
    setLoading(true);
    try {
      const apiCall = getServiceApi(serviceType);
      let finalPaymentReferenceId = null;
      if (!params.isDemo && amountPaid > 0) {
        try {
          const orderRes = await fetch(`${BASE_URL}/payment/create-order-direct`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await require('@react-native-async-storage/async-storage').default.getItem('authToken')}` },
            body: JSON.stringify({ amount: amountPaid }),
          });
          const orderData = await orderRes.json();
          if (orderData.error) throw new Error(orderData.error);
          const options = {
            description: `Payment for ${serviceType}`,
            image: 'https://ik.imagekit.io/bjwb4bn8bn/scoobyz_logo.png',
            currency: orderData.currency,
            key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_T3ueH6b31wuS9u',
            amount: orderData.amount, name: 'Scoobyz', order_id: orderData.orderId,
            theme: { color: '#3d2a5e' },
          };
          const paymentData = await new Promise((resolve, reject) => {
            if (Platform.OS === 'web') {
              const loadScript = src => new Promise(res => {
                const s = document.createElement('script');
                s.src = src; s.onload = () => res(true); s.onerror = () => res(false);
                document.body.appendChild(s);
              });
              loadScript('https://checkout.razorpay.com/v1/checkout.js').then(ok => {
                if (!ok) return reject(new Error('Razorpay SDK failed'));
                const rzp = new window.Razorpay({
                  ...options, handler: resolve,
                  modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
                });
                rzp.on('payment.failed', r => reject(new Error(r.error.description)));
                rzp.open();
              });
            } else {
              RazorpayCheckout.open(options).then(resolve).catch(reject);
            }
          });
          finalPaymentReferenceId = paymentData.razorpay_payment_id;
        } catch (paymentError) {
          setAlertConfig({ visible: true, title: 'Payment Failed', message: 'Payment was cancelled or failed.', type: 'error' });
          setLoading(false); return;
        }
      }
      const originalNotes = params.notes || '';
      const payload = {
        ...buildPayload(params, { paymentType, amountPaid: amountPaid, remainingAmount: remainingAmount, totalCost: dynamicTotal }),
        addressId: selectedAddress?.id, requiresAdminAssignment: isScoobyzMatch,
        isDemo: params.isDemo || false, paymentReferenceId: finalPaymentReferenceId,
        notes: `_OP:${dynamicTotal}_ ${originalNotes}`.trim(),
      };
      const result = await apiCall(payload);
      const bookingId = result?.bookingId || result?.id;
      if (!bookingId) throw new Error('Booking created but no ID returned.');

      clearCart();

      if (isScoobyzMatch) {
        navigation.replace('BookingConfirmed', {
          bookingId, cart: params.cart, total: dynamicTotal, expert, pet, date, time, visitType,
          address: selectedAddress ? [selectedAddress.fullAddress, selectedAddress.areaLocality, selectedAddress.city].filter(Boolean).join(', ') : address, notes: originalNotes, serviceType, isScoobyzMatch,
          amountPaid, remainingAmount, duration, frequency
        });
      } else {
        navigation.replace('BookingPending', {
          bookingId, expert, pet, total: dynamicTotal, serviceType, date, time, visitType,
          paymentType, amountPaid: amountPaid, remainingAmount: remainingAmount, duration, frequency
        });
      }
    } catch (error) {
      setAlertConfig({ visible: true, title: 'Booking Failed', message: error.message || 'Something went wrong.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const expertImageUrl = (expert.image || expert.profilePhoto)
    ? ((expert.image || expert.profilePhoto).startsWith('http') ? (expert.image || expert.profilePhoto) : `${BASE_URL}${expert.image || expert.profilePhoto}`)
    : 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=256';
  const petImageUrl = pet.photoUrl
    ? (pet.photoUrl.startsWith('http') ? pet.photoUrl : `${BASE_URL}${pet.photoUrl}`)
    : 'https://images.unsplash.com/photo-1591160690555-5debfba289f0?q=80&w=256';

  const renderServiceDetails = () => {
    if (isBoarding) return (
      <View style={styles.multiCard}>
        <SectionPill label="BOARDING DETAILS" />
        {selectedRoom && (
          <View style={styles.serviceRow}>
            <MaterialCommunityIcons name="home-city-outline" size={20} color="#526D82" style={{ marginRight: 16 }} />
            <View style={styles.serviceInfo}>
              <AppText style={styles.serviceName} weight="bold">{selectedRoom.title || selectedRoom.name}</AppText>
              <AppText style={styles.detailLabel}>{nights} night{nights !== 1 ? 's' : ''}</AppText>
              <AppText style={styles.servicePrice} weight="bold">₹{selectedRoom.price * nights}</AppText>
            </View>
          </View>
        )}
        {selectedMeal && (
          <><View style={styles.dottedLine} />
            <View style={styles.serviceRow}>
              <MaterialCommunityIcons name="food-variant" size={20} color="#526D82" style={{ marginRight: 16 }} />
              <View style={styles.serviceInfo}>
                <AppText style={styles.serviceName} weight="bold">Meal: {selectedMeal.name}</AppText>
                {frequency && <AppText style={styles.detailLabel}>{frequency}x per day</AppText>}
                {selectedMeal.price > 0 && <AppText style={styles.servicePrice} weight="bold">₹{selectedMeal.price}</AppText>}
              </View>
            </View></>
        )}
        {size ? <DetailRow icon="dog" label="Dog Size" value={size} /> : null}
        {isAggressive && aggressiveFee > 0 ? <DetailRow icon="alert-circle-outline" label="Aggressive Handling" value={`₹${aggressiveFee}`} /> : null}
        {customMealText ? <DetailRow icon="note-text-outline" label="Meal Note" value={customMealText} /> : null}
      </View>
    );

    if (isWalking) return (
      <View style={styles.multiCard}>
        <SectionPill label="WALK DETAILS" />
        <View style={styles.serviceRow}>
          <MaterialCommunityIcons name="dog-side" size={20} color="#526D82" style={{ marginRight: 16 }} />
          <View style={styles.serviceInfo}>
            <AppText style={styles.serviceName} weight="bold">Dog Walking</AppText>
            {duration && <AppText style={styles.detailLabel}>{duration} mins / walk</AppText>}
            <AppText style={styles.servicePrice} weight="bold">₹{total}</AppText>
          </View>
        </View>
        {frequency ? <DetailRow icon="repeat" label="Frequency" value={frequency} /> : null}
        {timesPerDay ? <DetailRow icon="counter" label="Times/Day" value={`${timesPerDay}x`} /> : null}
      </View>
    );

    if (isVet) return (
      <View style={styles.multiCard}>
        <SectionPill label="CONSULTATION DETAILS" />
        <View style={styles.serviceRow}>
          <MaterialCommunityIcons name="medical-bag" size={20} color="#526D82" style={{ marginRight: 16 }} />
          <View style={styles.serviceInfo}>
            <AppText style={styles.serviceName} weight="bold">{visitType || consultType || 'Clinic Visit'}</AppText>
            <AppText style={styles.detailLabel}>Veterinary Consultation</AppText>
            <AppText style={styles.servicePrice} weight="bold">₹{total}</AppText>
          </View>
        </View>
      </View>
    );

    // Grooming (default)
    return (
      <View style={styles.multiCard}>
        <SectionPill label="PACKAGE DETAIL" />
        <View style={styles.serviceRow}>
          <MaterialCommunityIcons name="content-cut" size={20} color="#526D82" style={{ marginRight: 16, transform: [{ rotate: '270deg' }] }} />
          <View style={styles.serviceInfo}>
            <AppText style={styles.serviceName} weight="bold">
              {mainPackage.title || mainPackage.name || 'Grooming Package'}
            </AppText>
            {mainPackage.duration && (
              <View style={styles.timeRow}>
                <MaterialCommunityIcons name="clock-outline" size={12} color={theme.colors.textSecondary} />
                <AppText style={styles.timeText}>{mainPackage.duration} mins</AppText>
              </View>
            )}
            <AppText style={styles.servicePrice} weight="bold">₹{mainPackage.basePrice || mainPackage.price || total}</AppText>
          </View>
        </View>
        {addons.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 8 }]}>
              <MaterialCommunityIcons name="plus" size={18} color={theme.colors.textBlack} />
              <AppText style={styles.sectionTitle}>ADD-ONS</AppText>
            </View>
            {addons.map((addon, idx) => {
              const addonKey = addon.id || addon.name || addon.addonName;
              const qty = quantities[addonKey] || 0;
              return (
                <React.Fragment key={idx}>
                  <View style={styles.serviceRow}>
                    <MaterialCommunityIcons name={addon.icon || 'paw'} size={20} color="#526D82" style={{ marginRight: 16 }} />
                    <View style={styles.serviceInfo}>
                      <AppText style={styles.serviceName} weight="bold">
                        {addon.addonName || addon.addon_name || addon.name || addon.title || 'Add-on'}
                      </AppText>
                      <AppText style={styles.servicePrice} weight="bold">₹{addon.addonPrice || addon.price}</AppText>
                    </View>
                    <View style={styles.qtyContainer}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => setQuantities(prev => ({ ...prev, [addonKey]: Math.max(0, qty - 1) }))}
                      >
                        <MaterialCommunityIcons name="minus" size={16} color={theme.colors.textBlack} />
                      </TouchableOpacity>
                      <AppText style={styles.qtyText} weight="bold">{qty}</AppText>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => setQuantities(prev => ({ ...prev, [addonKey]: qty + 1 }))}
                      >
                        <MaterialCommunityIcons name="plus" size={16} color={theme.colors.textBlack} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {idx < addons.length - 1 && <View style={styles.dottedLine} />}
                </React.Fragment>
              );
            })}
          </>
        )}
      </View>
    );
  };

  return (
    <AppScreen safeArea={false} padding={false} backgroundColor={theme.colors.background}>
      <ServiceHeader title="Review Details" showAddress={false} />

      {validationMsg ? (
        <View style={styles.validationBanner}>
          <Ionicons name="alert-circle-outline" size={24} color="#D32F2F" />
          <AppText style={styles.validationText}>{validationMsg}</AppText>
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}
      >
        {/* Pet */}
        <View style={styles.card}>
          <Image source={{ uri: petImageUrl }} style={styles.petImage} />
          <View style={styles.petInfo}>
            <AppText style={styles.petName} weight="bold">{pet.name || 'Your Pet'}</AppText>
            <AppText style={styles.petBreed}>{pet.breed || 'Dog'}</AppText>
          </View>
          <View style={styles.ageBadge}>
            <AppText style={styles.ageText}>{pet.age || '0'} yrs old</AppText>
          </View>
        </View>

        {/* Expert */}
        <View style={styles.card}>
          {!isScoobyzMatch && <Image source={{ uri: expertImageUrl }} style={styles.expertImage} />}
          <View style={[styles.expertInfo, isScoobyzMatch && { marginLeft: 0 }]}>
            <View style={[styles.serviceBadge, { backgroundColor: svcConfig.accent + '22' }]}>
              <MaterialCommunityIcons name={svcConfig.icon} size={12} color={svcConfig.accent} />
              <AppText style={[styles.serviceBadgeText, { color: svcConfig.accent }]}>{svcConfig.label}</AppText>
            </View>
            <AppText style={styles.expertName} weight="bold">
              {isScoobyzMatch ? 'Scoobyz Match' : (expert.name || expert.businessName || 'Professional')}
            </AppText>
            <AppText style={styles.expertTitle}>{expert.title || `${svcConfig.label} Specialist`}</AppText>
          </View>
          {expert.rating ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#FFC107" />
              <AppText style={styles.ratingText}>{expert.rating}</AppText>
            </View>
          ) : null}
        </View>

        {/* Dynamic Service Details */}
        {renderServiceDetails()}

        {/* Date & Time */}
        <View style={[styles.card, { flexDirection: 'column', alignItems: 'flex-start' }]}>
          <View style={[styles.sectionHeader, { marginBottom: 6 }]}>
            <View style={styles.sectionPillBar} />
            <AppText style={styles.smallLabel}>DATE & TIME</AppText>
          </View>
          <AppText style={[styles.mainValue, { marginLeft: 11 }]} weight="bold">
            {displayDate} • {time || 'TBD'}
          </AppText>
          {isBoarding && (endDate || checkoutDate) && (
            <AppText style={[styles.detailLabel, { marginLeft: 11, marginTop: 4 }]}>
              Checkout: {formatISTDate(endDate || checkoutDate)} ({nights} night{nights !== 1 ? 's' : ''})
            </AppText>
          )}
        </View>

        {/* Special Request */}
        {(notes || mainPackage.medicalInfo || mainPackage.notes) ? (
          <View style={[styles.card, { alignItems: 'flex-start' }]}>
            <MaterialCommunityIcons name="information-outline" size={20} color="#526D82" style={{ marginRight: 12, marginTop: 4 }} />
            <View style={{ flex: 1 }}>
              <View style={[styles.specialBadge, { alignSelf: 'flex-start', marginBottom: 4 }]}>
                <AppText style={styles.specialBadgeText} weight="bold">SPECIAL REQUEST</AppText>
              </View>
              <AppText style={styles.specialText}>{notes || mainPackage.medicalInfo || mainPackage.notes}</AppText>
            </View>
          </View>
        ) : null}

        {/* Location / Mode */}
        <View style={styles.multiCard}>
          <View style={[styles.locationTopText, { alignItems: 'flex-start' }]}>
            <View style={styles.sectionPillBar} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <AppText style={styles.smallLabel}>MODE</AppText>
                <TouchableOpacity onPress={() => navigation.navigate('AddressBook', { returnScreen: 'ReviewDetails', reviewParams: route.params })}>
                  <AppText style={{ color: theme.colors.primary, fontSize: 10 }} weight="bold">CHANGE</AppText>
                </TouchableOpacity>
              </View>
              <AppText style={[styles.mainValue, { marginBottom: 6 }]} weight="bold">
                {visitType || (isBoarding ? 'Boarding Facility' : 'Home Service')}
              </AppText>
              <AppText style={styles.addressText} numberOfLines={2}>
                {selectedAddress?.fullAddress || (typeof address === 'string' ? address : '')}
              </AppText>
              {(selectedAddress?.areaLocality || selectedAddress?.landmark) && (
                <AppText style={styles.addressText}>
                  {selectedAddress.areaLocality}
                  {selectedAddress.areaLocality && selectedAddress.landmark ? ', ' : ''}
                  {selectedAddress.landmark ? `Near ${selectedAddress.landmark}` : ''}
                </AppText>
              )}
              {selectedAddress?.city && (
                <AppText style={styles.addressText}>
                  {selectedAddress.city}{selectedAddress.state ? `, ${selectedAddress.state}` : ''} {selectedAddress.pincode}
                </AppText>
              )}
            </View>
          </View>
          <View style={styles.mapContainer}>
            <MapComponent latitude={selectedAddress?.latitude} longitude={selectedAddress?.longitude} style={styles.mapImage} title="Service Location" />
            <View style={styles.mapOverlay} />
            <TouchableOpacity style={styles.mapBtn} onPress={handleOpenMaps}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: theme.colors.textBlack, marginRight: 6 }} />
              <AppText style={styles.mapBtnText} weight="bold">View on Google Maps</AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Options
          <View style={[styles.card, { flexDirection: 'column', alignItems: 'stretch' }]}>
            <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
              <View style={styles.sectionPillBar} />
              <AppText style={styles.smallLabel}>PAYMENT OPTIONS (MANDATORY)</AppText>
            </View>
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                style={[styles.paymentOptionCard, paymentType === 'full' && styles.paymentOptionActive]}
                onPress={() => setPaymentType('full')}
              >
                <View style={styles.paymentOptionInfo}>
                  <AppText style={[styles.paymentOptionTitle, paymentType === 'full' && { color: theme.colors.success }]} weight="bold">Pay 100% Now</AppText>
                  <AppText style={styles.paymentOptionSub}>
                    Full amount{' '}
                    <AppText weight="bold" style={{ color: theme.colors.success, fontSize: 18 }}>₹{dynamicTotal}</AppText>
                  </AppText>
                </View>
                <View style={[styles.radioCircle, paymentType === 'full' && styles.radioCircleActive]}>
                  {paymentType === 'full' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>

              {!isWalking && (
                <TouchableOpacity
                  style={[styles.paymentOptionCard, paymentType === 'partial' && styles.paymentOptionActive]}
                  onPress={() => setPaymentType('partial')}
                >
                  <View style={styles.paymentOptionInfo}>
                    <AppText style={[styles.paymentOptionTitle, paymentType === 'partial' && { color: theme.colors.success }]} weight="bold">Pay 30% Now</AppText>
                    <AppText style={styles.paymentOptionSub}>
                      Pay{' '}
                      <AppText weight="bold" style={{ color: theme.colors.success, fontSize: 16 }}>₹{amountPaid.toFixed(0)}</AppText>
                      {' '}now, remaining{' '}
                      <AppText weight="bold" style={{ color: theme.colors.success, fontSize: 16 }}>₹{remainingAmount.toFixed(0)}</AppText>
                      {' '}at service
                    </AppText>
                  </View>
                  <View style={[styles.radioCircle, paymentType === 'partial' && styles.radioCircleActive]}>
                    {paymentType === 'partial' && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        */}

        {/* To Pay Summary */}
        <View style={styles.multiCard}>
          <View style={styles.toPayTopRow}>
            <MaterialCommunityIcons name="receipt-outline" size={24} color="#526D82" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <AppText style={styles.mainValue} weight="bold">To Pay</AppText>
              <TouchableOpacity style={styles.viewDetailBtn} onPress={() => setPaymentModalVisible(true)}>
                <AppText style={styles.viewDetailText}>VIEW DETAIL</AppText>
                <MaterialCommunityIcons name="chevron-right" size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <AppText style={styles.toPayTotal} weight="bold">
              ₹ {paymentType === 'partial' ? amountPaid.toFixed(0) : dynamicTotal}
            </AppText>
          </View>
          <View style={styles.cancellationBox}>
            <MaterialCommunityIcons name="information-outline" size={16} color={theme.colors.textBlack} style={{ marginTop: 2 }} />
            <AppText style={styles.cancellationText}>
              Cancellations made within 24 hrs of the appointment are subject to a 50% fee.
            </AppText>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <AppText style={styles.footerTotalLabel}>{paymentType === 'partial' ? 'Pay Now' : 'Total'}</AppText>
          <AppText style={styles.footerTotalValue} weight="bold">
            ₹ {paymentType === 'partial' ? amountPaid.toFixed(0) : dynamicTotal}
          </AppText>
        </View>
        <TouchableOpacity style={styles.payBtn} activeOpacity={0.8} onPress={handleConfirmBooking} disabled={loading}>
          {loading ? <ActivityIndicator color={theme.colors.white} /> : <AppText style={styles.payBtnText}>{isScoobyzMatch ? 'Request Match' : 'Pay Now'}</AppText>}
        </TouchableOpacity>
      </View>

      <PaymentSummaryModal
        visible={isPaymentModalVisible} onClose={() => setPaymentModalVisible(false)}
        cart={cart} total={dynamicTotal} room={selectedRoom} meal={selectedMeal} nights={nights}
        frequency={frequency} isAggressive={isAggressive} aggressiveFee={aggressiveFee} timesPerDay={timesPerDay}
      />
      <CustomAlert
        visible={alertConfig.visible} title={alertConfig.title}
        message={alertConfig.message} type={alertConfig.type}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </AppScreen>
  );
};

export default ReviewDetailsScreen;

const styles = StyleSheet.create({
  scrollContainer: { paddingHorizontal: 24 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 16, padding: 16, marginBottom: 16,
  },
  multiCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16, padding: 16, marginBottom: 16,
  },
  petImage: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.surface },
  petInfo: { flex: 1, marginLeft: 12 },
  petName: { fontSize: 16, color: theme.colors.textBlack, marginBottom: 2 },
  petBreed: { fontSize: 13, color: theme.colors.textSecondary },
  ageBadge: { backgroundColor: '#526D82', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  ageText: { fontSize: 11, color: theme.colors.white },
  expertImage: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.surface },
  expertInfo: { flex: 1, marginLeft: 12 },
  serviceBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 4, gap: 4,
  },
  serviceBadgeText: { fontSize: 10, letterSpacing: 0.3 },
  expertName: { fontSize: 15, color: theme.colors.textBlack, marginBottom: 2 },
  expertTitle: { fontSize: 12, color: theme.colors.textSecondary },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF8E1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 3,
  },
  ratingText: { fontSize: 12, color: '#8D6E00' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionPillBar: { width: 3, height: 12, backgroundColor: theme.colors.primaryDark, borderRadius: 2, marginRight: 8 },
  sectionTitle: { fontSize: 11, color: theme.colors.textSecondary, letterSpacing: 0.8 },
  smallLabel: { fontSize: 10, color: theme.colors.textSecondary, letterSpacing: 0.8 },
  mainValue: { fontSize: 16, color: theme.colors.textBlack },
  serviceRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 14, color: theme.colors.textBlack, marginBottom: 2 },
  servicePrice: { fontSize: 14, color: theme.colors.primaryDark, marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11, color: theme.colors.textSecondary },
  dottedLine: {
    borderTopWidth: 1, borderTopColor: '#EBEBEB',
    borderStyle: 'dashed', marginVertical: 10,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detailLabel: { fontSize: 13, color: theme.colors.textSecondary },
  detailValue: { fontSize: 13, color: theme.colors.textBlack, flex: 1 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 4, paddingVertical: 2 },
  qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center', borderRadius: 14, backgroundColor: theme.colors.white },
  qtyText: { marginHorizontal: 12, fontSize: 14, color: theme.colors.textBlack },
  specialBadge: {
    backgroundColor: '#526D82', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12, marginBottom: 12,
  },
  specialBadgeText: { color: theme.colors.white, fontSize: 10, letterSpacing: 0.5 },
  specialText: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18 },
  locationTopText: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  addressText: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
  validationBanner: {
    position: 'absolute',
    top: 90, // Position it just below the header
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEAEA',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  validationText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  mapContainer: { height: 120, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  mapImage: { width: '100%', height: '100%' },
  mapOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(78,108,72,0.2)' },
  mapBtn: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: theme.colors.white,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
  },
  mapBtnText: { fontSize: 11, color: theme.colors.textBlack },
  toPayTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  viewDetailBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  viewDetailText: { fontSize: 10, color: theme.colors.textSecondary, letterSpacing: 0.5, marginRight: 2 },
  toPayTotal: { fontSize: 18, color: theme.colors.textBlack },
  cancellationBox: {
    backgroundColor: '#F7F6F2', borderRadius: 12, padding: 12,
    flexDirection: 'row', alignItems: 'flex-start',
  },
  cancellationText: { flex: 1, fontSize: 12, color: theme.colors.textSecondary, marginLeft: 8, lineHeight: 18 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20,
  },
  footerLeft: {},
  footerTotalLabel: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 2 },
  footerTotalValue: { fontSize: 20, color: theme.colors.textBlack },
  payBtn: { backgroundColor: '#4E6C48', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  payBtnText: { color: theme.colors.white, fontSize: 16, fontFamily: theme.fonts.body },
  paymentOptionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9F9F9', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#EFEFEF',
  },
  paymentOptionActive: { borderColor: theme.colors.success, backgroundColor: 'rgba(78,108,72,0.06)' },
  paymentOptionInfo: { flex: 1 },
  paymentOptionTitle: { fontSize: 15, color: theme.colors.textBlack, marginBottom: 2 },
  paymentOptionSub: { fontSize: 12, color: theme.colors.textSecondary },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#DDD',
    justifyContent: 'center', alignItems: 'center', marginLeft: 12,
  },
  radioCircleActive: { borderColor: theme.colors.success },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.success },
});
