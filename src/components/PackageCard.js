import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from './AppText';
import { theme } from '../styles/theme';

export default function PackageCard({ pkg, onAdd, isAdded, isSelected }) {
  const showBadge = pkg.badge || pkg.type;
  const isRoom = pkg.type === 'room';
  
  return (
    <View style={[styles.card, isSelected && styles.cardActive]}>
      {showBadge && (
        <View style={styles.badge}>
          <AppText style={styles.badgeText} weight="bold">{pkg.badge || pkg.type}</AppText>
        </View>
      )}
      <AppText style={styles.title} type="heading" weight="bold">{pkg.title}</AppText>
      
      <Image source={{ uri: pkg.image }} style={styles.image} />
      
      {pkg.duration ? (
        <View style={styles.detailsRow}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.textSecondary} />
          <AppText style={styles.duration}>{pkg.duration}</AppText>
        </View>
      ) : null}
      
      <AppText style={styles.price} weight="bold">₹ {pkg.price}</AppText>
      
      <View style={styles.featuresList}>
        {(pkg.features || []).map((feature, i) => (
          <View key={i} style={styles.featureItem}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#758A9F" style={styles.checkIcon} />
            <AppText style={styles.featureText}>{feature}</AppText>
          </View>
        ))}
      </View>
      
      <TouchableOpacity 
        style={[styles.addBtn, (isAdded || isSelected) && styles.addBtnActive]} 
        onPress={onAdd}
        activeOpacity={0.8}
      >
        <AppText style={styles.addBtnText} weight="bold">
          {isSelected ? 'Selected' : (isAdded ? 'Added' : 'Select')}
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardActive: {
    borderColor: theme.colors.primaryDark,
    borderWidth: 2,
    backgroundColor: '#F8FAF8',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#758A9F', // greyish blue from original mockup
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    color: theme.colors.textBlack,
    marginBottom: 16,
    fontFamily: theme.fonts.heading,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#E5E5E5',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  duration: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  price: {
    fontSize: 20,
    color: theme.colors.textBlack,
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 20,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  addBtn: {
    backgroundColor: '#4A6B4B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addBtnActive: {
    backgroundColor: '#2A402B', // darker active state
  },
  addBtnText: {
    color: theme.colors.white,
    fontSize: 16,
  },
});
