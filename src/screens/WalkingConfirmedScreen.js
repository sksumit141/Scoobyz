import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { BASE_URL } from '../services/api';
import InvoiceComponent from '../components/InvoiceComponent';
import { formatISTDate } from '../utils/date_utils';
import { useBackHandler } from '../hooks/useBackHandler';

const { width } = Dimensions.get('window');

import { useRoute } from '@react-navigation/native';

export default function WalkingConfirmedScreen({ navigation }) {
  const route = useRoute();
  const { expert, pet, total, date, time, frequency, bookingId } = route.params || {};

  const displayPet = pet?.name || "your pet";
  const displayWalker = expert?.name || "Rajeev Kumar";
  const displayTotal = total || "3960";
  const displayDate = formatISTDate(date, { day: 'numeric', month: 'short' });

  // Terminal screen — block back into booking flow
  const { handleBack } = useBackHandler({
    onBack: () => {
      navigation.reset({ index: 0, routes: [{ name: 'LandingScreen' }] });
      return true;
    }
  });

  return (
    <AppScreen safeAreaTop={false} padding={false} backgroundColor={theme.colors.background}>
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
            source={{ uri: pet?.photoUrl ? (pet.photoUrl.startsWith('http') ? pet.photoUrl : `${BASE_URL}${pet.photoUrl}`) : 'https://images.unsplash.com/photo-1591160690555-5debfba289f0?q=80&w=256&auto=format&fit=crop' }}
            style={styles.statusPetImage}
          />
          <AppText style={styles.statusTitle} type="heading" weight="bold">Booking Confirmed!</AppText>
          <AppText style={styles.statusSubtitle}>
            Your dog walking schedule for <AppText weight="bold" style={{ color: theme.colors.textBlack }}>{displayPet}</AppText> is confirmed.
          </AppText>
          <View style={styles.bookingIdBadge}>
            <AppText style={styles.bookingIdText} weight="bold">BOOKING ID: #{bookingId || 'WLK-88221'}</AppText>
          </View>
        </View>

        {/* Card 1: Walker & Schedule */}
        <View style={styles.card}>
          <AppText style={[styles.smallLabel, { marginBottom: 16 }]}>WALKER DETAIL</AppText>

          <View style={styles.expertRow}>
            <Image
              source={{ uri: expert?.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300' }}
              style={styles.expertImage}
            />
            <View style={styles.expertInfo}>
              <AppText style={styles.smallLabel}>CERTIFIED WALKER</AppText>
              <AppText style={styles.expertName}>{displayWalker}</AppText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar-sync-outline" size={20} color={theme.colors.textSecondary} style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <AppText style={styles.smallLabel}>SCHEDULE</AppText>
              <AppText style={[styles.valueText, { lineHeight: 22 }]}>
                Starts {displayDate} • {frequency || 'Mon, Wed, Fri'}
              </AppText>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock-time-four-outline" size={20} color={theme.colors.textSecondary} style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <AppText style={styles.smallLabel}>SESSION DETAIL</AppText>
              <AppText style={[styles.valueText, { lineHeight: 22 }]}>
                {time || "08:30 AM"}
              </AppText>
            </View>
          </View>
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
              serviceName: 'Dog Walking Service',
              vendorName: expert?.name || 'Walker',
              serviceDate: date,
              serviceTimeSlot: time,
            }} 
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
            partnerName: expert?.name || 'Walker' 
          })}
        >
          <MaterialCommunityIcons name="message-text-outline" size={20} color={theme.colors.primaryDark} style={{ marginRight: 8 }} />
          <AppText style={styles.messageBtnText} weight="bold">Message Walker</AppText>
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
    paddingTop: 10,
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
