import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { BASE_URL } from '../services/api';
import InvoiceComponent from '../components/InvoiceComponent';
import { formatISTDate } from '../utils/date_utils';
import { useBackHandler } from '../hooks/useBackHandler';

const { width } = Dimensions.get('window');

export default function BoardingConfirmedScreen({ navigation, route }) {
  const {
    expert = {},
    selectedRoom = {},
    selectedMeal = {},
    size = "Medium",
    frequency = "2x Day",
    customMealText = "",
    total = 0,
    pet = {}
  } = route.params || {};

  const petName = pet.name || "Your Pet";
  const bookingId = `BDG-${Math.floor(Math.random() * 90000) + 10000}`;

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

  // Terminal screen — block back into booking flow
  const { handleBack } = useBackHandler({
    onBack: () => {
      navigation.reset({ index: 0, routes: [{ name: 'LandingScreen' }] });
      return true;
    }
  });

  return (
    <AppScreen safeArea={false} padding={false} backgroundColor={theme.colors.background}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="close" size={24} color={theme.colors.textBlack} />
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
            Your boarding session for <AppText weight="bold" style={{ color: theme.colors.textBlack }}>{petName}</AppText> is confirmed.
          </AppText>
          <View style={styles.bookingIdBadge}>
            <AppText style={styles.bookingIdText} weight="bold">BOOKING ID: #{bookingId}</AppText>
          </View>
        </View>

        {/* Card 1: Location & Instructions */}
        <View style={styles.card}>
          <AppText style={[styles.smallLabel, { marginBottom: 16 }]}>LOCATION DETAIL</AppText>

          <View style={styles.expertRow}>
            <Image
              source={{ uri: expert.image || 'https://images.unsplash.com/photo-1601758124277-380ebcd549e3?auto=format&fit=crop&q=80&w=300' }}
              style={styles.expertImage}
            />
            <View style={styles.expertInfo}>
              <AppText style={styles.smallLabel}>HOST</AppText>
              <AppText style={styles.expertName}>{expert.name || 'Happy Paws Villa'}</AppText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={theme.colors.textSecondary} style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <AppText style={styles.smallLabel}>ADDRESS</AppText>
              <AppText style={[styles.valueText, { lineHeight: 22 }]}>
                {expert.title || 'Plot 42, Greenery Avenue, Sector-21, Noida'}
              </AppText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.textSecondary} style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <AppText style={styles.smallLabel}>CHECK-IN INSTRUCTIONS</AppText>
              <AppText style={[styles.valueText, { lineHeight: 22 }]}>
                Please bring vaccination records. Gate opens at 9 AM.
              </AppText>
            </View>
          </View>
        </View>

        {/* Card 2: Meal Schedule */}
        <View style={styles.card}>
          <AppText style={styles.smallLabel}>MEAL SCHEDULE SUMMARY</AppText>
          <View style={styles.dottedLine} />

          <AppText style={styles.valueText} weight="bold">Room: {selectedRoom.name || 'Standard Stay'}</AppText>
          <AppText style={styles.valueText} weight="bold">Meal: {selectedMeal?.name || 'No Meal Plan'}</AppText>
          <AppText style={[styles.smallLabel, { marginTop: 4 }]}>{frequency} • {customMealText || 'No special notes'}</AppText>
        </View>

        {/* Invoice Section */}
        <View style={{ marginBottom: 16 }}>
          <InvoiceComponent 
            booking={{
              ...route.params?.bookingData,
              totalCost: route.params?.total || total,
              paymentType: route.params?.paymentType || 'full',
              amountPaid: route.params?.amountPaid || total,
              remainingAmount: route.params?.remainingAmount || 0,
              serviceName: 'Premium Pet Boarding',
              vendorName: expert?.name || 'Boarder',
              serviceDate: formatISTDate(route.params?.serviceDate || new Date()),
              serviceTimeSlot: route.params?.checkInTime || 'Standard',
            }} 
            onPayBalance={handlePayBalance}
          />
        </View>

      </ScrollView>

      {/* Main Footer Actions */}
      <View style={styles.footerContainer}>
        <TouchableOpacity 
          style={styles.messageBtn} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Chat', { 
            bookingId: bookingId, 
            partnerName: expert.name || 'Host' 
          })}
        >
          <MaterialCommunityIcons name="message-text-outline" size={20} color={theme.colors.primaryDark} style={{ marginRight: 8 }} />
          <AppText style={styles.messageBtnText} weight="bold">Message Host</AppText>
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
}

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
    borderRadius: 24,
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
    marginVertical: 12,
  },
  expertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  expertImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
  amountValue: {
    fontSize: 20,
    color: theme.colors.textBlack,
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
    backgroundColor: "#fff",
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
    fontSize: 14,
    color: theme.colors.primaryDark,
    fontWeight: '600'
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
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600'
  },
});
