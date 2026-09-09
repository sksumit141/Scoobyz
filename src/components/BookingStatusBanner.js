import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from './AppText';
import { theme } from '../styles/theme';
import { formatISTDate } from '../utils/date_utils';

const BookingStatusBanner = ({ booking, onPress, onPay, paying = false }) => {
  if (!booking) return null;

  const payableAmount = Number(booking.remainingAmount || 0);
  const isGroomingPaymentDue = booking.bookingType === 'grooming'
    && booking.status === 'completed'
    && booking.paymentStatus === 'awaiting_payment'
    && payableAmount > 0;
  const walkProgress = booking.bookingType === 'walking' ? booking.sessionProgress : null;
  const currentWalk = walkProgress?.activeSession || walkProgress?.nextSession;
  const bookingDate = formatISTDate(currentWalk?.serviceDate || booking.serviceDate, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const bookingPin = currentWalk?.otp || booking.otp || '----';

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {isGroomingPaymentDue ? (
        <View style={[styles.paymentDueSection, styles.paymentDueContent]}>
          <AppText style={styles.paymentDueTitle} weight="bold">Grooming completed</AppText>
          <View style={styles.paymentDueRow}>
            <View>
              <AppText style={styles.payableLabel}>TO BE PAID</AppText>
              <AppText style={styles.payableAmount} weight="bold">₹ {payableAmount.toFixed(2)}</AppText>
            </View>
            <TouchableOpacity
              style={[styles.payNowButton, paying && styles.payNowButtonDisabled]}
              disabled={paying}
              onPress={(event) => {
                event?.stopPropagation?.();
                onPay?.(booking);
              }}
            >
              <AppText style={styles.payNowText} weight="bold">{paying ? 'OPENING...' : 'PAY NOW'}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.compactContent}>
          <View style={styles.compactItem}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={22} color={theme.colors.primaryDark} />
            <AppText style={styles.compactLabel}>DATE</AppText>
            <AppText style={styles.compactValue} weight="bold">{bookingDate}</AppText>
          </View>
          <View style={styles.compactDivider} />
          <View style={styles.compactItem}>
            <MaterialCommunityIcons name="key-variant" size={22} color={theme.colors.primaryDark} />
            <AppText style={styles.compactLabel}>PIN</AppText>
            <AppText style={styles.pinValue} weight="bold">{bookingPin}</AppText>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12, // Reduced padding
    height: 130, // Fixed height to match promo banner
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 4,
  },
  compactContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 18,
  },
  compactItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactDivider: {
    width: 1,
    height: 58,
    backgroundColor: '#E3E0E8',
    marginHorizontal: 18,
  },
  compactLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    letterSpacing: 1.1,
    marginTop: 5,
  },
  compactValue: {
    color: theme.colors.textBlack,
    fontSize: 15,
    marginTop: 2,
  },
  pinValue: {
    fontSize: 19,
    color: '#2E7D32',
    letterSpacing: 2,
    marginTop: 1,
  },
  paymentDueSection: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
  },
  paymentDueContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  paymentDueTitle: {
    color: '#A33A00',
    fontSize: 14,
    marginBottom: 10,
  },
  paymentDueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payableLabel: {
    color: '#A33A00',
    fontSize: 9,
    letterSpacing: 1,
  },
  payableAmount: {
    color: '#E65100',
    fontSize: 17,
  },
  payNowButton: {
    backgroundColor: '#E65100',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  payNowButtonDisabled: {
    opacity: 0.65,
  },
  payNowText: {
    color: '#FFF',
    fontSize: 11,
  },
});

export default BookingStatusBanner;
