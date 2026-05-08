import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Alert, BackHandler } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { BASE_URL } from '../services/api';
import InvoiceComponent from '../components/InvoiceComponent';

const { width } = Dimensions.get('window');

const BookingConfirmedScreen = ({ navigation, route }) => {
  const {
    cart = [],
    total = 0,
    expert = {},
    pet = {},
    date = 'Apr 24, 2026',
    time = '10:30 AM',
    visitType = 'Home Service',
    address = '123 Paws Lane, Noida Sector-42'
  } = route.params || {};

  const mainPackage = cart[0] || {};
  const addons = mainPackage.addons || [];

  // Prevent back navigation into the booking flow
  useEffect(() => {
    const onBack = () => {
      navigation.reset({ index: 0, routes: [{ name: 'LandingScreen' }] });
      return true; // Block default back
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [navigation]);

  const handlePayBalance = () => {
    Alert.alert(
      'Pay Balance',
      `Complete payment of ₹${route.params?.remainingAmount}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pay Now', 
          onPress: () => Alert.alert('Success', 'Payment completed!') 
        }
      ]
    );
  };

  return (
    <AppScreen safeArea={false} padding={false} backgroundColor={theme.colors.background}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'LandingScreen' }] })}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textBlack} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} type="heading" weight="bold">Booking Details</AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Top Status Section */}
        <View style={styles.statusSection}>
          <Image
            source={{ uri: pet.photoUrl ? (pet.photoUrl.startsWith('http') ? pet.photoUrl : `${BASE_URL}${pet.photoUrl}`) : 'https://images.unsplash.com/photo-1591160690555-5debfba289f0?q=80&w=256&auto=format&fit=crop' }}
            style={styles.statusPetImage}
          />
          <AppText style={styles.statusTitle} type="heading" weight="bold">Booking Confirmed!</AppText>
          <AppText style={styles.statusSubtitle}>
            Your session for <AppText weight="bold" style={{ color: theme.colors.textBlack }}>{pet.name || 'Your Pet'}</AppText> is confirmed.
          </AppText>
          <View style={styles.bookingIdBadge}>
            <AppText style={styles.bookingIdText} weight="bold">BOOKING ID: #23{Math.floor(Math.random() * 90000) + 10000}</AppText>
          </View>
        </View>

        {/* Card 1: Package & Addons & Special Request */}
        <View style={styles.card}>
          <AppText style={styles.smallLabel}>PACKAGE DETAIL</AppText>
          <AppText style={[styles.valueText, { marginBottom: 16 }]}>{mainPackage.title || 'Service Package'}</AppText>

          {addons.length > 0 && (
            <>
              <AppText style={styles.smallLabel}>ADD-ONS</AppText>
              {addons.map((a, i) => (
                <AppText key={i} style={styles.valueText}>{a.addonName || a.name}</AppText>
              ))}
            </>
          )}

          <View style={styles.dottedLine} />

          <View style={styles.specialBadge}>
            <AppText style={styles.specialBadgeText} weight="bold">SPECIAL REQUEST</AppText>
          </View>
          <View style={styles.specialRow}>
            <MaterialCommunityIcons name="information-outline" size={18} color={theme.colors.textSecondary} style={{ marginTop: 2 }} />
            <AppText style={styles.specialText}>
              {mainPackage.medicalInfo || mainPackage.notes || 'None'}
            </AppText>
          </View>
        </View>

        {/* Card 2: Appointment Detail */}
        <View style={styles.card}>
          <AppText style={[styles.smallLabel, { marginBottom: 16 }]}>APPOINTMENT DETAIL</AppText>

          <View style={styles.expertRow}>
            <Image
              source={{ uri: expert.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop' }}
              style={styles.expertImage}
            />
            <View style={styles.expertInfo}>
              <AppText style={styles.smallLabel}>EXPERT</AppText>
              <AppText style={styles.expertName}>{expert.name || 'Professional'}</AppText>
            </View>
            <View style={styles.expertActions}>
              <TouchableOpacity style={styles.actionCircleBtn}>
                <MaterialCommunityIcons name="phone" size={14} color={theme.colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCircleBtn}>
                <MaterialCommunityIcons name="message-text" size={14} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={20} color={theme.colors.textSecondary} style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <AppText style={styles.smallLabel}>DATE & TIME</AppText>
              <AppText style={styles.valueText}>{date} • {time}</AppText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={theme.colors.textSecondary} style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <AppText style={styles.smallLabel}>MODE ({visitType})</AppText>
              <AppText style={[styles.valueText, { lineHeight: 22 }]}>
                {address}
              </AppText>
            </View>
          </View>
        </View>

        {/* Invoice Section */}
        <View style={{ marginBottom: 16 }}>
          <InvoiceComponent 
            booking={{
              totalCost: total,
              paymentType: route.params?.paymentType || 'full',
              amountPaid: route.params?.amountPaid || total,
              remainingAmount: route.params?.remainingAmount || 0,
              serviceName: mainPackage.title || 'Service',
              vendorName: expert.name,
              serviceDate: date,
              serviceTimeSlot: time,
            }} 
            onPayBalance={handlePayBalance}
          />
        </View>

        {/* Support */}
        <View style={styles.supportContainer}>
          <AppText style={styles.supportText}>
            Need help ? <AppText style={styles.supportLink} weight="bold">Contact Support</AppText>
          </AppText>
        </View>
      </ScrollView>

      {/* Main Footer Actions */}
      <View style={styles.footerContainer}>
        <TouchableOpacity 
          style={styles.messageBtn} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Chat', { 
            bookingId: bookingId, 
            partnerName: expert.name || 'Expert' 
          })}
        >
          <MaterialCommunityIcons name="message-text-outline" size={20} color={theme.colors.primaryDark} style={{ marginRight: 8 }} />
          <AppText style={styles.messageBtnText} weight="bold">Message Vendor</AppText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.bookingsBtn} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('MyBookings')}
        >
          <AppText style={styles.bookingsBtnText} weight="bold">Go to Bookings</AppText>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 24,
    paddingTop: 40,
    paddingBottom: 24,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 22,
    color: theme.colors.textBlack,
    fontFamily: theme.fonts.heading,
    marginLeft: -5
  },
  scrollContainer: {
    paddingHorizontal: 20,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusPetImage: {
    width: 80,
    height: 80,
    borderRadius: 24, // Squircle matching the mock
    backgroundColor: theme.colors.surface,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    color: theme.colors.textBlack,
    marginBottom: 6,
  },
  statusSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  bookingIdBadge: {
    backgroundColor: '#526D82',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bookingIdText: {
    color: theme.colors.white,
    fontSize: 10,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  smallLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  valueText: {
    fontSize: 15,
    color: theme.colors.textBlack,
    marginBottom: 4,
  },
  dottedLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#EBEAE6',
    borderStyle: 'dashed',
    marginVertical: 20,
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
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  expertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  expertImage: {
    width: 44,
    height: 44,
    borderRadius: 12, // squircle 
    backgroundColor: theme.colors.surface,
    marginRight: 12,
  },
  expertInfo: {
    flex: 1,
  },
  expertName: {
    fontSize: 15,
    color: theme.colors.textBlack,
  },
  expertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#526D82',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  detailIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountIcon: {
    marginRight: 16,
  },
  amountInfo: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 15,
    color: theme.colors.textBlack,
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
  },
  amountValue: {
    fontSize: 20,
    color: theme.colors.textBlack,
  },
  supportContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  supportText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  supportLink: {
    color: theme.colors.textBlack,
    textDecorationLine: 'underline',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    backgroundColor: "#fff", // Match screen background so it floats cleanly
    gap: 12,
  },
  messageBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.primaryDark,
    backgroundColor: theme.colors.white,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBtnText: {
    fontSize: 15,
    color: theme.colors.primaryDark,
  },
  bookingsBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingsBtnText: {
    fontSize: 15,
    color: theme.colors.white,
  },
});

export default BookingConfirmedScreen;
