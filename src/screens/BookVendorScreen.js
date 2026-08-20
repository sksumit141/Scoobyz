import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    Dimensions,
    Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { bookingsApi, addressApi, BASE_URL } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import PaymentSummaryModal from '../components/PaymentSummaryModal';
import CustomAlert from '../components/CustomAlert';
import PriceDisplay from '../components/PriceDisplay';
import { useDiscount } from '../contexts/DiscountContext';
import { useCart } from '../contexts/CartContext';
import { formatISTDate, getISTDateString } from '../utils/date_utils';
import RazorpayCheckout from 'react-native-razorpay';

const { width } = Dimensions.get('window');

const SERVICE_COLORS = {
    Grooming: { bg: '#F3E5F5', accent: '#7B1FA2', icon: 'content-cut' },
    Boarding: { bg: '#E3F2FD', accent: '#1565C0', icon: 'home-heart' },
    Walking: { bg: '#E8F5E9', accent: '#2E7D32', icon: 'dog-side' },
    Veterinary: { bg: '#FBE9E7', accent: '#BF360C', icon: 'medical-bag' },
    default: { bg: '#F5F5F5', accent: '#3d2a5e', icon: 'paw' },
};

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
        frequency, duration, timesPerDay, size, customMealText,
        notes, address } = params;

    const vendorUserId = expert?.userId || expert?.id;
    const safeDate = date ? getISTDateString(date) : getISTDateString(new Date());
    const safeTime = time || '10:00 AM';

    const base = {
        vendorUserId,
        petId: pet?.id,
        totalCost: paymentDetails.totalCost || total || 0,
        serviceDate: safeDate,
        serviceTimeSlot: safeTime,
        petName: pet?.name || 'Pet',
        petBreed: pet?.breed || 'Dog',
        petSize: pet?.size || null,
        notes: notes || cart?.[0]?.notes || '',
        paymentType: paymentDetails.paymentType,
        amountPaid: paymentDetails.amountPaid,
        remainingAmount: paymentDetails.remainingAmount,
    };

    const type = (serviceType || '').toLowerCase();
    if (type === 'boarding') {
        const endDateParam = params.endDate || new Date(Date.now() + 86400000);
        const boardingAddons = [];
        if (params.isAggressive && params.aggressiveFee) {
            boardingAddons.push({ name: 'Aggressive Dog Handling', price: params.aggressiveFee });
        }

        return {
            ...base,
            endDate: getISTDateString(endDateParam),
            dogSize: size,
            roomType: selectedRoom?.title || selectedRoom?.name,
            mealType: selectedMeal?.name,
            customMealNotes: customMealText,
            meals: selectedMeal ? [{ mealName: selectedMeal.name, frequency, price: selectedMeal.price }] : [],
            addons: boardingAddons,
        };
    } else if (type === 'walking') {
        return { ...base, frequency, duration, timesPerDay: timesPerDay || 1 };
    } else if (type === 'veterinary') {
        const finalVisitType = visitType || consultType || 'Clinic Visit';
        return { ...base, visitType: finalVisitType };
    } else {
        // grooming (default)
        const mainPackage = cart?.[0] || {};
        return {
            ...base,
            serviceId: mainPackage?.id,
            packageName: mainPackage?.title,
            selectedSubServices: mainPackage?.addons || [],
            visitType: visitType === 'Home Visit' || visitType === 'Home Service' ? 'home_visit' : 'studio',
        };
    }
}

export default function BookVendorScreen({ navigation, route }) {
    const params = route.params || {};
    const {
        serviceType = 'Grooming',
        expert = {},
        pet = {},
        total: rawTotal = expert?.price || 500,
        date,
        time,
        visitType,
        selectedRoom,
        selectedMeal,
        customMealText,
        cart = [],
        address,
        frequency,
        isDemo
    } = params;

    const total = Number(rawTotal);

    const { saveToCart, clearCart } = useCart();
    
    React.useEffect(() => {
        saveToCart(params, 'BookVendor', serviceType, total);
    }, []);

    const [loading, setLoading] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
    const isWalking = (serviceType || '').toLowerCase() === 'walking';
    const [paymentType, setPaymentType] = useState(isWalking ? 'full' : null);
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info'
    });

    const { calculateDiscountedPrice } = useDiscount();
    
    const isScoobyzMatch = expert?.id === 'scoobyz_match';

    const discountedTotal = calculateDiscountedPrice(total || 0, serviceType || 'Grooming');
    const amountPaid = !isScoobyzMatch ? (paymentType === 'partial' ? (total * 0.3) : total) : 0;
    const remainingAmount = !isScoobyzMatch ? (total - amountPaid) : 0;
    const discountedAmountPaid = calculateDiscountedPrice(amountPaid || 0, serviceType || 'Grooming');
    const discountedRemainingAmount = calculateDiscountedPrice(remainingAmount || 0, serviceType || 'Grooming');

    React.useEffect(() => {
        if (params.address) {
            setSelectedAddress(params.address);
        } else {
            fetchDefaultAddress();
        }
    }, []);

    const fetchDefaultAddress = async () => {
        try {
            const addresses = await addressApi.list();
            const def = addresses.find(a => a.isDefault) || addresses[0];
            setSelectedAddress(def);
        } catch (error) {
            console.error('Fetch address error:', error);
        }
    };
    const colors = SERVICE_COLORS[serviceType] || SERVICE_COLORS.default;
    const mainItem = selectedRoom || cart?.[0] || {};
    const displayDate = formatISTDate(date);

    const handleBook = async () => {
        if (!selectedAddress && !address) {
            setAlertConfig({ 
                visible: true, 
                title: 'Address Required', 
                message: 'Please add a service address before booking.', 
                type: 'success',
                onConfirm: () => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    navigation.navigate('AddressBook');
                },
                buttonText: 'Cancel',
                confirmText: 'Add Address'
            }); 
            return;
        }

        const vendorUserId = expert?.userId || expert?.id;
        if (!vendorUserId) {
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Vendor information missing. Please go back and try again.'
            });
            return;
        }

        if (!isScoobyzMatch && !paymentType) {
            setAlertConfig({
                visible: true,
                title: 'Payment Required',
                message: 'Please select a payment option and pay to book the vendor.'
            });
            return;
        }

        setLoading(true);
        try {
            const apiCall = getServiceApi(serviceType);
            let finalPaymentReferenceId = null;

            // Call Razorpay FIRST if not Scoobyz match and not a demo
            if (!isScoobyzMatch && !isDemo && discountedAmountPaid > 0) {
                try {
                    // Create order on backend directly with amount
                    const orderRes = await fetch(`${BASE_URL}/payment/create-order-direct`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${await require('@react-native-async-storage/async-storage').default.getItem('authToken')}`
                        },
                        body: JSON.stringify({ amount: discountedAmountPaid })
                    });
                    const orderData = await orderRes.json();
                    
                    if (orderData.error) throw new Error(orderData.error);

                    const options = {
                        description: `Payment for ${serviceType}`,
                        image: 'https://ik.imagekit.io/bjwb4bn8bn/scoobyz_logo.png',
                        currency: orderData.currency,
                        key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_T3ueH6b31wuS9u', // Replace with real key id in production
                        amount: orderData.amount,
                        name: 'Scoobyz',
                        order_id: orderData.orderId,
                        theme: { color: '#3d2a5e' }
                    };

                    const paymentData = await new Promise((resolve, reject) => {
                        if (Platform.OS === 'web') {
                            const loadScript = src => new Promise((resolveScript) => {
                                const script = document.createElement('script');
                                script.src = src;
                                script.onload = () => resolveScript(true);
                                script.onerror = () => resolveScript(false);
                                document.body.appendChild(script);
                            });
                            
                            loadScript('https://checkout.razorpay.com/v1/checkout.js').then((res) => {
                                if (!res) return reject(new Error('Razorpay SDK failed to load'));
                                const rzp = new window.Razorpay({
                                    ...options,
                                    handler: function (response) {
                                        resolve(response);
                                    },
                                    modal: {
                                        ondismiss: function() {
                                            reject(new Error('Payment cancelled'));
                                        }
                                    }
                                });
                                rzp.on('payment.failed', function (response){
                                    reject(new Error(response.error.description));
                                });
                                rzp.open();
                            });
                        } else {
                            RazorpayCheckout.open(options).then(resolve).catch(reject);
                        }
                    });

                    console.log('Payment Success:', paymentData);
                    finalPaymentReferenceId = paymentData.razorpay_payment_id;
                } catch (paymentError) {
                    console.error('Payment Error:', paymentError);
                    setAlertConfig({
                        visible: true,
                        title: 'Payment Failed',
                        message: 'Payment was cancelled or failed. Your booking has not been created.'
                    });
                    setLoading(false);
                    return; // Stop execution, do not create booking
                }
            }

            const originalNotes = params.notes || '';
            const payload = {
                ...buildPayload(params, { paymentType, amountPaid: discountedAmountPaid, remainingAmount: discountedRemainingAmount, totalCost: discountedTotal }),
                addressId: selectedAddress?.id,
                requiresAdminAssignment: isScoobyzMatch,
                isDemo: isDemo || false,
                paymentReferenceId: finalPaymentReferenceId,
                notes: `_OP:${total}_ ${originalNotes}`.trim()
            };
            const result = await apiCall(payload);
            const bookingId = result?.bookingId || result?.id;

            if (!bookingId) throw new Error('Booking created but no ID returned.');

            clearCart();

            if (isScoobyzMatch) {
                navigation.replace('BookingConfirmed', { 
                    bookingId, cart: params.cart, total: discountedTotal, expert, pet, date, time, visitType, 
                    address: selectedAddress ? [selectedAddress.fullAddress, selectedAddress.areaLocality, selectedAddress.city].filter(Boolean).join(', ') : address, notes: originalNotes, serviceType, isScoobyzMatch,
                    amountPaid, remainingAmount, duration, frequency
                });
            } else {
                navigation.replace('BookingPending', {
                    bookingId,
                    expert,
                    pet,
                    total: discountedTotal,
                    serviceType,
                    date,
                    time,
                    visitType,
                    paymentType,
                    amountPaid: discountedAmountPaid,
                    remainingAmount: discountedRemainingAmount,
                    duration,
                    frequency
                });
            }
        } catch (error) {
            console.error('[BookVendor] Error:', error);
            setAlertConfig({
                visible: true,
                title: 'Booking Failed',
                message: error.message || 'Something went wrong. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppScreen safeAreaTop={false} padding={false} backgroundColor={theme.colors.background}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textBlack} />
                </TouchableOpacity>
                <AppText style={styles.headerTitle} weight="bold">Book Vendor</AppText>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
                {/* Hero Section */}
                <LinearGradient
                    colors={[theme.colors.primaryDark, theme.colors.primary]}
                    style={styles.heroSection}
                >
                    {/* Vendor Card */}
                    <View style={styles.vendorCard}>
                        <Image
                            source={isScoobyzMatch 
                                ? require('../../assets/scoobyz_logo-removebg-preview.png') 
                                : { uri: expert.image || expert.profilePhoto ? ((expert.image || expert.profilePhoto).startsWith('http') ? (expert.image || expert.profilePhoto) : `${BASE_URL}${expert.profilePhoto}`) : 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200' }}
                            style={[styles.vendorAvatar, isScoobyzMatch && { resizeMode: 'contain', backgroundColor: '#FFF' }]}
                        />
                        <View style={styles.vendorInfo}>
                            <AppText style={styles.vendorName} weight="bold">{expert.name || expert.businessName || 'Expert'}</AppText>
                            <AppText style={styles.vendorSub}>{expert.title || serviceType + ' Specialist'}</AppText>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={14} color="#FFC107" />
                                <AppText style={styles.ratingText}>{expert.rating || '4.8'} rating</AppText>
                            </View>
                        </View>
                        <View style={[styles.serviceTag, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                            <Ionicons name="checkmark-circle" size={12} color={theme.colors.white} />
                            <AppText style={[styles.serviceTagText, { color: theme.colors.white }]}>{serviceType}</AppText>
                        </View>
                    </View>
                </LinearGradient>

                {/* Pet Info */}
                <View style={styles.section}>
                    <View style={styles.sectionRow}>
                        <Ionicons name="paw-outline" size={18} color={theme.colors.textSecondary} />
                        <AppText style={styles.sectionLabel}>YOUR PET</AppText>
                    </View>
                    <View style={styles.petCard}>
                        <Image
                            source={{ uri: pet?.photoUrl ? (pet.photoUrl.startsWith('http') ? pet.photoUrl : `${BASE_URL}${pet.photoUrl}`) : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100' }}
                            style={styles.petAvatar}
                        />
                        <View>
                            <AppText style={styles.petName} weight="bold">{pet?.name || 'Your Pet'}</AppText>
                            <AppText style={styles.petBreed}>{pet?.breed || ''} {pet?.size ? `· ${pet.size}` : ''} {pet?.age ? `· ${pet.age} yrs` : ''}</AppText>
                        </View>
                    </View>
                </View>

                {/* Service Details */}
                <View style={styles.section}>
                    <View style={styles.sectionRow}>
                        <Ionicons name="list-outline" size={18} color={theme.colors.textSecondary} />
                        <AppText style={styles.sectionLabel}>SERVICE DETAILS</AppText>
                    </View>
                    <View style={styles.detailsGrid}>
                        <DetailItem icon="calendar-outline" label="Date" value={displayDate} />
                        <DetailItem icon="time-outline" label="Time" value={time || 'Flexible'} />
                        {visitType && <DetailItem icon="location-outline" label="Visit Type" value={visitType} />}
                        {selectedRoom && <DetailItem icon="bed-outline" label="Room" value={selectedRoom.title || selectedRoom.name} />}
                        {selectedMeal && <DetailItem icon="restaurant-outline" label="Meal Plan" value={selectedMeal.name} />}
                    </View>
                </View>

                {/* Payment Options */}
                {!isScoobyzMatch && (
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
                                <AppText style={[styles.paymentOptionTitle, paymentType === 'full' && { color: theme.colors.success }]} weight="bold">Pay 100% Now</AppText>
                                <AppText style={styles.paymentOptionSub}>
                                    Pay the full amount <AppText style={{ textDecorationLine: 'line-through', opacity: 0.6 }}>₹{total}</AppText> <AppText weight="bold" style={{ color: theme.colors.success, fontSize: 18 }}>₹{discountedTotal}</AppText> now
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
                                        Pay <AppText style={{ textDecorationLine: 'line-through', opacity: 0.6 }}>₹{(total * 0.3).toFixed(2)}</AppText> <AppText weight="bold" style={{ color: theme.colors.success, fontSize: 16 }}>₹{discountedAmountPaid.toFixed(2)}</AppText> now, balance <AppText style={{ textDecorationLine: 'line-through', opacity: 0.6 }}>₹{(total * 0.7).toFixed(2)}</AppText> <AppText weight="bold" style={{ color: theme.colors.success, fontSize: 16 }}>₹{discountedRemainingAmount.toFixed(2)}</AppText> at service
                                    </AppText>
                                </View>
                                <View style={[styles.radioCircle, paymentType === 'partial' && styles.radioCircleActive]}>
                                    {paymentType === 'partial' && <View style={styles.radioInner} />}
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                )}

                {/* Price Summary */}
                {!isScoobyzMatch && (
                <View style={styles.section}>
                    <View style={styles.sectionRow}>
                        <Ionicons name="receipt-outline" size={18} color={theme.colors.textSecondary} />
                        <AppText style={styles.sectionLabel}>PRICE SUMMARY</AppText>
                    </View>
                    <View style={styles.priceCard}>
                        <View style={styles.priceRow}>
                            <View>
                                <AppText style={styles.priceLabel}>Service Total</AppText>
                                <TouchableOpacity
                                    style={styles.viewDetailBtn}
                                    onPress={() => setPaymentModalVisible(true)}
                                >
                                    <AppText style={styles.viewDetailText}>VIEW DETAIL</AppText>
                                    <MaterialCommunityIcons name="chevron-right" size={14} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <PriceDisplay 
                                originalPrice={total}
                                serviceName={serviceType || 'Grooming'}
                                style={styles.priceValue}
                                valueStyle={styles.priceValue}
                            />
                        </View>

                        {paymentType === 'partial' && (
                            <>
                                <View style={[styles.priceRow, { marginTop: 12 }]}>
                                    <AppText style={styles.priceLabel}>Payable Now (30%)</AppText>
                                    <AppText style={[styles.priceValue, { color: theme.colors.success }]} weight="bold">₹ {discountedAmountPaid.toFixed(2)}</AppText>
                                </View>
                                <View style={[styles.priceRow, { marginTop: 8 }]}>
                                    <AppText style={styles.priceLabel}>Remaining Balance</AppText>
                                    <AppText style={styles.priceValue}>₹ {discountedRemainingAmount.toFixed(2)}</AppText>
                                </View>
                            </>
                        )}

                        <View style={styles.divider} />
                        <View style={styles.priceRow}>
                            <AppText style={[styles.priceLabel, { color: theme.colors.primaryDark }]} weight="bold">
                                {paymentType === 'partial' ? 'Total Payable Now' : 'Grand Total'}
                            </AppText>
                            <AppText style={[styles.priceValue, { color: theme.colors.primaryDark, fontSize: 22 }]} weight="bold">
                                ₹ {paymentType === 'partial' ? discountedAmountPaid.toFixed(2) : discountedTotal}
                            </AppText>
                        </View>
                    </View>
                </View>
                )}

                {/* Address Section */}
                <View style={styles.section}>
                    <View style={styles.sectionRow}>
                        <Ionicons name="location-outline" size={18} color={theme.colors.textSecondary} />
                        <AppText style={styles.sectionLabel}>SERVICE ADDRESS</AppText>
                        <TouchableOpacity
                            style={{ marginLeft: 'auto' }}
                            onPress={() => navigation.navigate('AddressBook')}
                        >
                            <AppText style={{ color: theme.colors.primaryDark, fontSize: 12 }} weight="bold">Change</AppText>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.addressCard}>
                        {selectedAddress ? (
                            <>
                                <AppText style={styles.addressLabel} weight="bold">{selectedAddress.label}</AppText>
                                <AppText style={styles.addressText}>{selectedAddress.fullAddress}</AppText>
                                <AppText style={styles.addressCity}>{selectedAddress.city} {selectedAddress.pincode}</AppText>
                            </>
                        ) : (
                            <TouchableOpacity onPress={() => navigation.navigate('AddressBook')}>
                                <AppText style={{ color: theme.colors.textSecondary }}>No address selected. Tap to add one.</AppText>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Info Banner */}
                <View style={styles.infoBanner}>
                    <Ionicons name="information-circle-outline" size={18} color='#1565C0' />
                    <AppText style={styles.infoText}>
                        {isScoobyzMatch 
                          ? 'Your request will be sent to the Scoobyz Team. We will match you with the best available expert and notify you once assigned. Payment will be calculated after assignment.'
                          : 'A payment is required to book. Your request will be sent to the vendor, and if declined, your payment will be refunded immediately.'}
                    </AppText>
                </View>
            </ScrollView>

            {/* Bottom CTA */}
            <View style={styles.footer}>
                <View style={styles.footerLeft}>
                    <AppText style={styles.footerLabel}>{isScoobyzMatch ? 'Estimated Price' : 'Payable Now'}</AppText>
                    <AppText style={[styles.footerTotal, isScoobyzMatch && { fontSize: 18 }]} weight="bold">{isScoobyzMatch ? 'To be decided' : `₹ ${discountedAmountPaid.toFixed(2)}`}</AppText>
                </View>
                <TouchableOpacity
                    style={[styles.bookBtn, loading && { opacity: 0.7 }]}
                    onPress={handleBook}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="send" size={18} color="#FFF" style={{ marginRight: 8 }} />
                            <AppText style={styles.bookBtnText} weight="bold">Book Now</AppText>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <PaymentSummaryModal
                visible={isPaymentModalVisible}
                onClose={() => setPaymentModalVisible(false)}
                cart={cart}
                total={total}
                room={selectedRoom}
                meal={selectedMeal}
                frequency={frequency}
                nights={params.nights || 1}
                isAggressive={params.isAggressive}
                aggressiveFee={params.aggressiveFee}
                timesPerDay={params.timesPerDay || 1}
            />

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                onConfirm={alertConfig.onConfirm}
                buttonText={alertConfig.buttonText || 'Okay'}
                confirmText={alertConfig.confirmText || 'Confirm'}
            />
        </AppScreen>
    );
}

function DetailItem({ icon, label, value }) {
    return (
        <View style={styles.detailItem}>
            <Ionicons name={icon} size={16} color={theme.colors.textSecondary} />
            <View style={{ marginLeft: 8 }}>
                <AppText style={styles.detailLabel}>{label}</AppText>
                <AppText style={styles.detailValue} weight="bold">{value}</AppText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 16,
        paddingRight: 24,
        paddingTop: 44,
        paddingBottom: 12,
        backgroundColor: theme.colors.background,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        ...theme.shadows.small,
    },
    headerTitle: { fontSize: 22, color: theme.colors.textBlack },

    heroSection: { padding: 20, marginBottom: 8 },

    vendorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    vendorAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F0F0F0',
        marginRight: 14,
    },
    vendorInfo: { flex: 1 },
    vendorName: { fontSize: 17, color: theme.colors.textBlack, marginBottom: 2 },
    vendorSub: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 4 },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { fontSize: 12, color: theme.colors.textSecondary, marginLeft: 4 },
    serviceTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    serviceTagText: { fontSize: 11, marginLeft: 4, fontWeight: '700' },

    section: { paddingHorizontal: 20, marginBottom: 16 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sectionLabel: { fontSize: 11, color: theme.colors.textSecondary, marginLeft: 8, letterSpacing: 0.5, fontWeight: '600' },

    petCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    petAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F0F0', marginRight: 14 },
    petName: { fontSize: 16, color: theme.colors.textBlack, marginBottom: 2 },
    petBreed: { fontSize: 13, color: theme.colors.textSecondary },

    detailsGrid: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    detailItem: { flexDirection: 'row', alignItems: 'flex-start', width: '44%' },
    detailLabel: { fontSize: 10, color: theme.colors.textSecondary, letterSpacing: 0.3 },
    detailValue: { fontSize: 14, color: theme.colors.textBlack, marginTop: 2 },

    priceCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priceLabel: { fontSize: 14, color: theme.colors.textSecondary },
    priceValue: { fontSize: 16, color: theme.colors.textBlack },
    viewDetailBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    viewDetailText: { fontSize: 10, color: theme.colors.textSecondary, letterSpacing: 0.5, marginRight: 2 },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 14 },

    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.primaryLight,
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        gap: 10,
    },
    infoText: { flex: 1, fontSize: 12, color: theme.colors.primaryDark, lineHeight: 18 },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 36,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
    },
    footerLeft: {},
    footerLabel: { fontSize: 12, color: theme.colors.textSecondary },
    footerTotal: { fontSize: 22, color: theme.colors.textBlack },
    addressCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    addressLabel: {
        fontSize: 14,
        color: theme.colors.textBlack,
        marginBottom: 4,
    },
    addressText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        lineHeight: 18,
    },
    addressCity: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    bookBtn: {
        backgroundColor: theme.colors.success,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 14,
        elevation: 4,
        shadowColor: theme.colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    bookBtnText: { color: theme.colors.white, fontSize: 16 },
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
        borderColor: theme.colors.success,
        backgroundColor: 'rgba(78, 108, 72, 0.06)',
    },
    paymentOptionInfo: {
        flex: 1,
    },
    paymentOptionTitle: {
        fontSize: 15,
        color: theme.colors.textBlack,
        marginBottom: 2,
    },
    paymentOptionSub: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
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
    radioCircleActive: {
        borderColor: theme.colors.success,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.success,
    },
});
