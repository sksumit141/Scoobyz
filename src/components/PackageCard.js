import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from './AppText';
import { theme } from '../styles/theme';

export default function PackageCard({ pkg, onAdd, isAdded, isSelected }) {
  const showBadge = pkg.badge || pkg.type;
  
  return (
    <View style={styles.card}>
      {showBadge && (
        <View style={styles.badge}>
          <AppText style={styles.badgeText} weight="bold">{pkg.badge || pkg.type}</AppText>
        </View>
      )}

      {/* Launch Price Strip */}
      {pkg.originalPrice && (
        <View style={styles.launchStrip}>
          <AppText style={styles.launchStripText} weight="bold">LAUNCH PRICE</AppText>
        </View>
      )}
      
      <AppText style={styles.title} weight="bold">{pkg.title}</AppText>
      
      <Image source={{ uri: pkg.image }} style={styles.image} />
      
      {/* 
      {pkg.duration ? (
        <View style={styles.detailsRow}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.textSecondary} />
          <AppText style={styles.duration}>{pkg.duration}</AppText>
        </View>
      ) : null}
      */}
      
      <View style={styles.priceRow}>
        {pkg.originalPrice && (
          <AppText style={styles.originalPrice}>₹ {pkg.originalPrice}</AppText>
        )}
        <AppText style={styles.price} weight="bold">₹ {pkg.price}</AppText>
      </View>
      
      <View style={styles.featuresList}>
        {(pkg.features || []).map((feature, i) => (
          <View key={i} style={styles.featureItem}>
            <MaterialCommunityIcons name="check-circle" size={18} color="#758A9F" style={styles.checkIcon} />
            <AppText style={styles.featureText}>{feature}</AppText>
          </View>
        ))}
      </View>
      
      <TouchableOpacity 
        style={[styles.addBtn, isAdded && styles.addBtnActive]} 
        onPress={onAdd}
        activeOpacity={0.8}
      >
        <AppText style={styles.addBtnText} weight="bold">
          {isAdded ? 'Added' : 'Add'}
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#758A9F',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 10,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  launchStrip: {
    position: 'absolute',
    top: 16,
    right: 0,
    backgroundColor: theme.colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  launchStripText: {
    color: '#FFF',
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    color: '#333333',
    marginBottom: 16,
    fontFamily: theme.fonts.heading,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  duration: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
    gap: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 24,
    color: theme.colors.primaryDark,
  },
  featuresList: {
    marginBottom: 20,
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#444444',
  },
  addBtn: {
    backgroundColor: '#4A6B4B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addBtnActive: {
    backgroundColor: '#2A402B',
  },
  addBtnText: {
    color: theme.colors.white,
    fontSize: 16,
  },
});
