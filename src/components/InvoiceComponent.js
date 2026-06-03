import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
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
    status
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

  const isPartial = paymentType === 'partial';
  const hasBalance = parseFloat(remainingAmount) > 0;

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
        <AppText style={styles.dateText}>{formattedDate(createdAt || new Date())}</AppText>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <AppText style={styles.label}>Service</AppText>
        <AppText style={styles.value} weight="bold">{serviceName || 'Pet Service'}</AppText>
      </View>

      <View style={styles.row}>
        <AppText style={styles.label}>Total Amount</AppText>
        <AppText style={styles.value} weight="bold">₹ {totalCost}</AppText>
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
            {isPartial ? "Partial (30%)" : "Full Payment"}
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
            <AppText style={[styles.receiptValue, { color: '#D32F2F' }]} weight="bold">₹ {remainingAmount || 0}</AppText>
          </View>
        )}
      </View>

      {isPartial && hasBalance && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color="#1976D2" />
          <AppText style={styles.infoText}>
            The remaining balance of ₹ {remainingAmount} can be paid now or at the time of service.
          </AppText>
        </View>
      )}

      {isPartial && hasBalance && onPayBalance && (
        <TouchableOpacity style={styles.payBalanceBtn} onPress={onPayBalance}>
          <AppText style={styles.payBalanceText} weight="bold">PAY BALANCE ₹ {remainingAmount}</AppText>
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <AppText style={styles.footerText}>Thank you for choosing Scoobyz!</AppText>
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
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  payBalanceBtn: {
    backgroundColor: theme.colors.primaryDark,
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
