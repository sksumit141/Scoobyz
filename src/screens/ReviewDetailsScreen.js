import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import PaymentSummaryModal from '../components/PaymentSummaryModal';
import { theme } from '../styles/theme';
import { bookingsApi, addressApi, BASE_URL } from '../services/api';
import { ActivityIndicator, Alert, Linking } from 'react-native';
import MapComponent from '../components/MapComponent';

const { width } = Dimensions.get('window');

const Stepper = ({ value }) => (
  <View style={styles.stepperContainer}>
    <TouchableOpacity style={styles.stepperBtn}>
      <MaterialCommunityIcons name="minus" size={16} color={theme.colors.textBlack} />
    </TouchableOpacity>
    <AppText style={styles.stepperValue}>{value}</AppText>
    <TouchableOpacity style={styles.stepperBtn}>
      <MaterialCommunityIcons name="plus" size={16} color={theme.colors.textBlack} />
    </TouchableOpacity>
  </View>
);

const ReviewDetailsScreen = ({ navigation, route }) => {
  const {
    cart = [],
    total = 0,
    expert = {},
    date = 'Apr 24, 2026',
    time = '10:30 AM',
    visitType = 'Home Service',
    address = '123 Paws Lane, Noida Sector-42',
    pet = {},
    selectedRoom = null,
    selectedMeal = null
  } = route.params || {};
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const nights = (date && (route.params?.endDate || route.params?.checkoutDate)) ? Math.max(1, Math.ceil((new Date(route.params.endDate || route.params.checkoutDate).getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))) : 1;

  React.useEffect(() => {
    if (address && address !== '123 Paws Lane, Noida Sector-42') {
      // If we have an object address, use it, otherwise fetch
      if (typeof address === 'object') {
        setSelectedAddress(address);
      } else {
        setSelectedAddress({ fullAddress: address, label: 'Service Location' });
      }
    } else {
      fetchDefaultAddress();
    }
  }, [address]);

  const fetchDefaultAddress = async () => {
    try {
      const addresses = await addressApi.list();
      const def = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddress(def);
    } catch (error) {
      console.error('Fetch address error:', error);
    }
  };

  const handleOpenMaps = () => {
    let addr = '';
    if (selectedAddress) {
      const parts = [
        selectedAddress.fullAddress,
        selectedAddress.areaLocality,
        selectedAddress.landmark ? `Near ${selectedAddress.landmark}` : null,
        selectedAddress.city,
        selectedAddress.state,
        selectedAddress.pincode
      ].filter(Boolean);
      addr = parts.join(', ');
    } else {
      addr = address;
    }

    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(addr)}`,
      android: `geo:0,0?q=${encodeURIComponent(addr)}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`,
    });
    Linking.openURL(url).catch(err => console.error('Error opening maps:', err));
  };

  const handleConfirm = () => {
    // Navigate to the new mandatory BookVendor screen instead of booking directly
    navigation.navigate('BookVendor', {
      ...route.params,
      serviceType: 'Grooming',
      total: total,
      nights: nights,
    });
  };

  const mainPackage = cart[0] || {};
  const addons = mainPackage.addons || [];

  return (
    <AppScreen safeArea={false} padding={false} backgroundColor={theme.colors.background}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textBlack} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} type="heading" weight="bold">Review Details</AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Card 1: Pet Details */}
        <View style={styles.card}>
          <Image source={{ uri: pet.photoUrl ? (pet.photoUrl.startsWith('http') ? pet.photoUrl : `${BASE_URL}${pet.photoUrl}`) : 'https://images.unsplash.com/photo-1591160690555-5debfba289f0?q=80&w=256&auto=format&fit=crop' }} style={styles.petImage} />
          <View style={styles.petInfo}>
            <AppText style={styles.petName} weight="bold">{pet.name || 'Your Pet'}</AppText>
            <AppText style={styles.petBreed}>{pet.breed || 'Dog'}</AppText>
          </View>
          <View style={styles.ageBadge}>
            <AppText style={styles.ageText}>{pet.age || '0'} yrs old</AppText>
          </View>
        </View>

        {/* Card 2: Expert Details */}
        <View style={styles.card}>
          <Image source={{ uri: expert.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop' }} style={styles.expertImage} />
          <View style={styles.expertInfo}>
            <AppText style={styles.expertLabel}>EXPERT</AppText>
            <AppText style={styles.expertName} weight="bold">{expert.name || 'Professional'}</AppText>
            <AppText style={styles.expertTitle}>{expert.title || 'Senior ' + (expert.serviceCategory || 'Expert')}</AppText>
          </View>
          <TouchableOpacity style={styles.eyeBtn}>
            <MaterialCommunityIcons name="eye-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Card 3: Package & Addons */}
        <View style={styles.multiCard}>
          {/* Header */}
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={18} color={theme.colors.textBlack} />
            <AppText style={styles.sectionTitle}>PACKAGE DETAIL</AppText>
          </View>

          {/* Package / Room Item */}
          <View style={styles.serviceRow}>
            <MaterialCommunityIcons name={selectedRoom ? "home-city-outline" : "content-cut"} size={20} color={theme.colors.textSecondary} style={{ marginRight: 12, transform: [{ rotate: selectedRoom ? '0deg' : '270deg' }] }} />
            <View style={styles.serviceInfo}>
              <AppText style={styles.serviceName} weight="bold">{selectedRoom?.title || mainPackage.title || 'Service Package'}</AppText>
              <View style={styles.timeRow}>
                <MaterialCommunityIcons name="clock-outline" size={12} color={theme.colors.textSecondary} />
                <AppText style={styles.timeText}>Standard Duration</AppText>
              </View>
              <AppText style={styles.servicePrice} weight="bold">₹{selectedRoom?.price || mainPackage.basePrice || 0}</AppText>
            </View>
          </View>

          {selectedMeal && (
            <>
              <View style={styles.dottedLine} />
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="food-apple-outline" size={18} color={theme.colors.textBlack} />
                <AppText style={styles.sectionTitle}>BOARDING MEAL</AppText>
              </View>
              <View style={styles.serviceRow}>
                <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={theme.colors.textSecondary} style={{ marginRight: 12 }} />
                <View style={styles.serviceInfo}>
                  <AppText style={styles.serviceName} weight="bold">{selectedMeal.name}</AppText>
                  <AppText style={styles.servicePrice} weight="bold">₹{selectedMeal.price}</AppText>
                </View>
              </View>
            </>
          )}

          {addons.length > 0 && (
            <>
              {/* Dotted Divider */}
              <View style={styles.dottedLine} />

              {/* Addons Header */}
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="plus" size={18} color={theme.colors.textBlack} />
                <AppText style={styles.sectionTitle}>ADD-ONS</AppText>
              </View>

              {/* Addon Items */}
              {addons.map((addon, idx) => (
                <View key={idx} style={[styles.serviceRow, idx === addons.length - 1 && { marginBottom: 0 }]}>
                  <MaterialCommunityIcons name={addon.icon || "paw"} size={20} color={theme.colors.textSecondary} style={{ marginRight: 12 }} />
                  <View style={styles.serviceInfo}>
                    <AppText style={styles.serviceName} weight="bold">{addon.addonName || addon.addon_name || addon.name || addon.title || 'Add-on'}</AppText>
                    <View style={styles.timeRow}>
                      <MaterialCommunityIcons name="clock-outline" size={12} color={theme.colors.textSecondary} />
                      <AppText style={styles.timeText}>Included</AppText>
                    </View>
                    <AppText style={styles.servicePrice} weight="bold">₹{addon.addonPrice || addon.price}</AppText>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Date & Time */}
        <View style={styles.card}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={20} color={theme.colors.textSecondary} />
          <View style={styles.cardCenter}>
            <AppText style={styles.smallLabel}>DATE & TIME</AppText>
            <AppText style={styles.mainValue} weight="bold">{date} • {time}</AppText>
          </View>
        </View>

        {/* Special Request */}
        {(mainPackage.medicalInfo || mainPackage.notes) && (
          <View style={styles.multiCard}>
            <View style={styles.specialBadge}>
              <AppText style={styles.specialBadgeText} weight="bold">SPECIAL REQUEST</AppText>
            </View>
            <View style={styles.specialRow}>
              <MaterialCommunityIcons name="information-outline" size={18} color={theme.colors.textSecondary} style={{ marginTop: 2 }} />
              <AppText style={styles.specialText}>
                {mainPackage.medicalInfo || mainPackage.notes}
              </AppText>
            </View>
          </View>
        )}

        {/* Mode / Location */}
        <View style={styles.multiCard}>
          <View style={styles.locationTopText}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={theme.colors.textSecondary} />
            <View style={styles.cardCenter}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <AppText style={styles.smallLabel}>MODE</AppText>
                <TouchableOpacity onPress={() => navigation.navigate('AddressBook')}>
                  <AppText style={{ color: theme.colors.primary, fontSize: 10 }} weight="bold">CHANGE</AppText>
                </TouchableOpacity>
              </View>
              <AppText style={styles.mainValue} weight="bold">{visitType}</AppText>
              <AppText style={styles.addressText} numberOfLines={2}>
                {selectedAddress?.fullAddress || address}
              </AppText>
              {(selectedAddress?.areaLocality || selectedAddress?.landmark) && (
                <AppText style={styles.addressText}>
                  {selectedAddress.areaLocality}{selectedAddress.areaLocality && selectedAddress.landmark ? ', ' : ''}
                  {selectedAddress.landmark ? `Near ${selectedAddress.landmark}` : ''}
                </AppText>
              )}
              {selectedAddress?.city && (
                <AppText style={styles.addressText}>{selectedAddress.city}{selectedAddress.state ? `, ${selectedAddress.state}` : ''} {selectedAddress.pincode}</AppText>
              )}
            </View>
          </View>
          
          <View style={styles.mapContainer}>
            <MapComponent
              latitude={selectedAddress?.latitude}
              longitude={selectedAddress?.longitude}
              style={styles.mapImage}
              title="Service Location"
            />
            <View style={styles.mapOverlay} />
            <TouchableOpacity style={styles.mapBtn} onPress={handleOpenMaps}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={theme.colors.textBlack} style={{ marginRight: 4 }} />
              <AppText style={styles.mapBtnText} weight="bold">View on Google Maps</AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* To Pay */}
        <View style={styles.multiCard}>
          <View style={styles.toPayTopRow}>
            <MaterialCommunityIcons name="receipt" size={20} color={theme.colors.textSecondary} />
            <View style={styles.cardCenter}>
              <AppText style={styles.mainValue} weight="bold">To Pay</AppText>
              <TouchableOpacity
                style={styles.viewDetailBtn}
                onPress={() => setPaymentModalVisible(true)}
              >
                <AppText style={styles.viewDetailText}>VIEW DETAIL</AppText>
                <MaterialCommunityIcons name="chevron-right" size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <AppText style={styles.toPayTotal} weight="bold">₹ {total}</AppText>
          </View>
          <View style={styles.cancellationBox}>
            <MaterialCommunityIcons name="information-outline" size={16} color={theme.colors.textBlack} style={{ marginTop: 2 }} />
            <AppText style={styles.cancellationText}>
              Cancellation made within 24hrs of the appointment are subject to 50% fee.
            </AppText>
          </View>
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <AppText style={styles.footerTotalLabel}>Total</AppText>
          <AppText style={styles.footerTotalValue} weight="bold">₹ {total}</AppText>
        </View>
        <TouchableOpacity
          style={styles.payBtn}
          activeOpacity={0.8}
          onPress={handleConfirm}
        >
          <AppText style={styles.payBtnText}>Book Vendor</AppText>
        </TouchableOpacity>
      </View>

      {/* Payment Modal Overlay */}
      <PaymentSummaryModal
        visible={isPaymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        cart={cart}
        total={total}
        room={selectedRoom}
        meal={selectedMeal}
        nights={nights}
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 24,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 22,
    color: theme.colors.textBlack,
    fontFamily: theme.fonts.heading,
    flex: 1,
    marginLeft: -5,
  },
  scrollContainer: {
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  petImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
  },
  petInfo: {
    flex: 1,
    marginLeft: 12,
  },
  petName: {
    fontSize: 16,
    color: theme.colors.textBlack,
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  ageBadge: {
    backgroundColor: '#526D82', // Slate dark
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ageText: {
    color: theme.colors.white,
    fontSize: 11,
  },
  expertImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  expertInfo: {
    flex: 1,
    marginLeft: 12,
  },
  expertLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  expertName: {
    fontSize: 15,
    color: theme.colors.textBlack,
    marginBottom: 2,
  },
  expertTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  eyeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  multiCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    color: theme.colors.textBlack,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  serviceInfo: {
    flex: 1,
    paddingRight: 12,
  },
  serviceName: {
    fontSize: 14,
    color: theme.colors.textBlack,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  servicePrice: {
    fontSize: 15,
    color: theme.colors.textBlack,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 8,
    height: 36,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    height: '100%',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 14,
    color: theme.colors.textBlack,
    paddingHorizontal: 8,
  },
  dottedLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#EBEAE6',
    borderStyle: 'dashed',
    marginBottom: 20,
    // Note: React Native border dashed bug workaround might be needed, but minimal line is okay
  },
  dashedCard: {
    borderWidth: 1,
    borderColor: '#C5D0D6', // Light slate
    borderStyle: 'dashed',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: theme.colors.white, // In case its white filled
  },
  addMoreText: {
    color: '#526D82',
    fontSize: 14,
    marginLeft: 8,
  },
  cardCenter: {
    flex: 1,
    marginLeft: 16,
  },
  smallLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  mainValue: {
    fontSize: 15,
    color: theme.colors.textBlack,
  },
  specialBadge: {
    backgroundColor: '#526D82',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  specialBadgeText: {
    color: theme.colors.white,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  specialRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  specialText: {
    fontSize: 13,
    color: theme.colors.textBlack,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  locationTopText: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  addressText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  mapContainer: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(78, 108, 72, 0.2)', // Greenish tint
  },
  mapBtn: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: theme.colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapBtnText: {
    fontSize: 11,
    color: theme.colors.textBlack,
  },
  toPayTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  viewDetailText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    marginRight: 2,
  },
  toPayTotal: {
    fontSize: 18,
    color: theme.colors.textBlack,
  },
  cancellationBox: {
    backgroundColor: '#F7F6F2',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cancellationText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 8,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerTotalLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginRight: 8,
  },
  footerTotalValue: {
    fontSize: 18,
    color: theme.colors.textBlack,
  },
  payBtn: {
    backgroundColor: '#4E6C48', // Green success primary
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  payBtnText: {
    color: theme.colors.white,
    fontSize: 16,
    fontFamily: theme.fonts.body,
  },
});

export default ReviewDetailsScreen;
