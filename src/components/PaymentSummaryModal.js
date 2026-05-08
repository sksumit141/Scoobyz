import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from './AppText';
import { theme } from '../styles/theme';

export default function PaymentSummaryModal({ 
  visible, onClose, cart = [], total = 0, room = null, meal = null, 
  frequency = '1x', nights = 1, isAggressive = false, aggressiveFee = 0 
}) {
  const mainPackage = cart[0] || {};
  const addons = (mainPackage.addons || []).map(a => ({
    label: a.addonName || a.name || 'Add-on',
    value: Number(a.addonPrice) || Number(a.price) || 0
  }));

  const items = [];
  if (room) {
    items.push({ 
        label: `${room.title || room.name || 'Room'}${nights > 1 ? ` (${nights} nights)` : ''}`, 
        value: (Number(room.price) || 0) * nights 
    });
    if (meal) {
        const freqNum = parseInt(frequency || '1x') || 1;
        const mealTotal = (Number(meal.price) || 0) * freqNum * nights;
        items.push({ 
            label: `${meal.name || 'Meal'}${freqNum > 1 ? ` x ${freqNum}` : ''}${nights > 1 ? ` (${nights} nights)` : ''}`, 
            value: mealTotal 
        });
    }
    if (isAggressive && aggressiveFee > 0) {
        items.push({
            label: `Aggressive Handling${nights > 1 ? ` (${nights} nights)` : ''}`,
            value: aggressiveFee * nights
        });
    }
  } else if (mainPackage.title || mainPackage.serviceName === 'Walking') {
    const unitLabel = mainPackage.duration || mainPackage.unit || 'Session';
    const baseValue = Number(mainPackage.basePrice) || 0;
    const mult = Number(mainPackage.multiplier) || 1;
    const sessions = Number(mainPackage.timesPerDay) || 1;

    items.push({ 
        label: `${mainPackage.title || 'Walking'} (${unitLabel})`, 
        value: baseValue 
    });
    
    if (mult > 1) {
        items.push({ label: `${mainPackage.frequency || 'Plan'} Multiplier`, value: `x${mult}` });
    }
    if (sessions > 1) {
        items.push({ label: `Daily Sessions`, value: `x${sessions}` });
    }
    
    items.push(...addons);
  }

  const summaryItems = [
    ...items,
    { label: 'Service Fee', value: 0 },
    { label: 'Platform Fee', value: 0 },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Floating Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
          <MaterialCommunityIcons name="close" size={24} color={theme.colors.textBlack} />
        </TouchableOpacity>

        {/* Modal Content container */}
        <View style={styles.modalContainer}>
          <AppText style={styles.modalTitle} type="heading" weight="bold">Payment Summary</AppText>

          <View style={styles.itemsContainer}>
            {summaryItems.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <AppText style={styles.itemLabel}>{item.label}</AppText>
                <AppText style={styles.itemValue}>₹ {item.value}</AppText>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <View>
              <AppText style={styles.totalLabel} weight="bold">To Pay</AppText>
              <AppText style={styles.inclusiveText}>Incl. all fee</AppText>
            </View>
            <AppText style={styles.totalValue} weight="bold">₹ {total}</AppText>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Darkened background
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    color: theme.colors.textBlack,
    marginBottom: 24,
  },
  itemsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  itemValue: {
    fontSize: 14,
    color: theme.colors.textBlack,
  },
  divider: {
    height: 1,
    backgroundColor: '#EFEFEF',
    marginBottom: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: theme.colors.textBlack,
  },
  inclusiveText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  totalValue: {
    fontSize: 18,
    color: theme.colors.textBlack,
  },
});
