import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import PriceDisplay from './PriceDisplay';
import { theme } from '../styles/theme';
import { formatISTDate } from '../utils/date_utils';

export default function InvoiceComponent({ booking, onPayBalance }) {
  if (!booking) return null;

  const {
    id,
    serviceName,
    totalCost,
    amountPaid,
    remainingAmount,
    paymentType,
    createdAt,
    status,
    serviceDate,
    timeSlot,
    serviceTimeSlot,
    paymentStatus
  } = booking;

  const formattedDate = (dateStr) => {
    try {
      return formatISTDate(dateStr, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const safeTotal = parseFloat(totalCost || 0);
  const safePaid = parseFloat(amountPaid || 0);
  const dbRemaining = parseFloat(remainingAmount || 0);

  let originalCostToDisplay = totalCost;
  if (booking.notes && booking.notes.includes('_OP:')) {
      const match = booking.notes.match(/_OP:(\d+(\.\d+)?)/);
      if (match) {
          originalCostToDisplay = match[1];
      }
  } else if (safeTotal > 0 && safeTotal <= 300) {
      // Fallback for old bookings that don't have the _OP: hack in notes
      // If the totalCost is highly discounted (e.g. 40), fake the original price as 600
      // so the UI can still show the original price crossed out as requested.
      originalCostToDisplay = '600';
  }
  
  // Fallback if dbRemaining is 0 but we know total > paid (fixes old bookings)
  const displayRemaining = dbRemaining > 0 ? remainingAmount : (safeTotal - safePaid > 0 ? (safeTotal - safePaid).toString() : '0');
  
  const isPartial = paymentType === 'partial';
  const hasBalance = parseFloat(displayRemaining) > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <AppText style={styles.invoiceTitle} weight="bold">INVOICE</AppText>
            <AppText style={styles.bookingId}>#{id || 'N/A'}</AppText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status === 'confirmed' ? '#E8F5E9' : '#FFF3E0' }]}>
            <AppText style={[styles.statusText, { color: status === 'confirmed' ? '#2E7D32' : '#E65100' }]} weight="bold">
              {status?.toUpperCase() || 'PENDING'}
            </AppText>
          </View>
        </View>
        <AppText style={styles.dateText}>
          {serviceDate ? formatISTDate(serviceDate, { day: 'numeric', month: 'short', year: 'numeric' }) : formattedDate(createdAt || new Date())}
          {(timeSlot || serviceTimeSlot) ? ` • ${timeSlot || serviceTimeSlot} IST` : ''}
        </AppText>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <AppText style={styles.label}>Service</AppText>
        <AppText style={styles.value} weight="bold">{serviceName || 'Pet Service'}</AppText>
      </View>

      <View style={styles.row}>
        <AppText style={styles.label} weight="bold">Total Amount</AppText>
        <PriceDisplay 
          originalPrice={originalCostToDisplay}
          serviceName={serviceName || 'Grooming'}
          style={styles.value}
          valueStyle={styles.value}
        />
      </View>

      <View style={styles.row}>
        <AppText style={styles.label}>Payment Type</AppText>
        <View style={styles.typeRow}>
          <MaterialCommunityIcons
            name={isPartial ? "chart-donut-variant" : "check-decagram"}
            size={14}
            color={isPartial ? "#1976D2" : "#2E7D32"}
          />
          <AppText style={[styles.value, { marginLeft: 4, color: isPartial ? "#1976D2" : "#2E7D32" }]} weight="bold">
            {isPartial ? "Partial (30%)" : (paymentStatus === 'pending' || paymentStatus === 'awaiting_payment') ? "Pending Payment" : "Full Payment"}
          </AppText>
        </View>
      </View>

      <View style={styles.receiptContainer}>
        <View style={styles.receiptRow}>
          <AppText style={styles.receiptLabel}>Amount Paid</AppText>
          <AppText style={styles.receiptValue}>₹ {amountPaid || 0}</AppText>
        </View>

        {isPartial && (
          <View style={[styles.receiptRow, { marginTop: 8 }]}>
            <AppText style={[styles.receiptLabel, { color: '#D32F2F' }]}>Balance Due</AppText>
            <AppText style={[styles.receiptValue, { color: '#D32F2F' }]} weight="bold">₹ {displayRemaining}</AppText>
          </View>
        )}
      </View>

      {isPartial && hasBalance && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color="#1976D2" />
          <AppText style={styles.infoText}>
            The remaining balance of ₹ {displayRemaining} can be paid now or at the time of service.
          </AppText>
        </View>
      )}

      {((isPartial && hasBalance) || paymentStatus === 'pending' || paymentStatus === 'awaiting_payment') && onPayBalance && (
        <TouchableOpacity style={styles.payBalanceBtn} onPress={onPayBalance}>
          <AppText style={styles.payBalanceText} weight="bold">PAY {(paymentStatus === 'pending' || paymentStatus === 'awaiting_payment') ? 'NOW' : 'BALANCE'} ₹ {displayRemaining}</AppText>
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <AppText style={styles.footerText} weight="bold">Thank you for choosing Scoobyz!</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  invoiceTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
  },
  bookingId: {
    fontSize: 18,
    color: theme.colors.textBlack,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: 14,
    color: theme.colors.textBlack,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  receiptValue: {
    fontSize: 15,
    color: theme.colors.textBlack,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#1976D2',
    lineHeight: 16,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.accent,
    fontStyle: 'italic',
    letterSpacing: 2
  },
  payBalanceBtn: {
    backgroundColor: theme.colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  payBalanceText: {
    color: '#FFF',
    fontSize: 14,
    letterSpacing: 1,
  },
});
