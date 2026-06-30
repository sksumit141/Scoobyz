import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import PriceDisplay from './PriceDisplay';
import { theme } from '../styles/theme';
import { BASE_URL } from '../services/api';
import ScoobyzBadge from './ScoobyzBadge';

export default function ExpertCard({ expert, onView, onSelect, isSelected }) {
  return (
    <View style={[styles.card, isSelected && { borderColor: theme.colors.success, borderWidth: 2 }]}>
      {(expert.isCertified || expert.badge === 'Elite' || expert.badge === 'Pro' || expert.badge === 'Scoobyz Certified') && (
        <View style={styles.badgePosition}>
          <ScoobyzBadge />
        </View>
      )}
      <View style={styles.cardLeft}>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: (expert.profilePhoto || expert.image)
                ? ((expert.profilePhoto || expert.image).startsWith('http')
                  ? (expert.profilePhoto || expert.image)
                  : `${BASE_URL}${expert.profilePhoto || expert.image}`)
                : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop'
            }}
            style={styles.expertImage}
          />
        </View>
        <View style={styles.priceContainer}>
          <AppText style={styles.startingAt}>Starting at</AppText>
          <PriceDisplay 
            originalPrice={expert.price} 
            serviceName={expert.services?.[0] || 'Grooming'} 
            style={styles.price} 
            valueStyle={styles.price}
          />
        </View>
      </View>

      <View style={styles.cardRight}>
        <View style={styles.infoTop}>
          <AppText style={styles.expertName} type="heading" weight="bold" numberOfLines={1}>{expert.name}</AppText>

          <AppText style={styles.expertTitle}>{expert.title}</AppText>

          {expert.badge && !['Basic', 'Elite', 'Pro', 'Scoobyz Certified'].includes(expert.badge) && (
            <View style={[styles.badgeTag, { backgroundColor: expert.badge === 'Pro' ? '#FFF9C4' : '#E8F5E9' }]}>
              <Ionicons
                name={expert.badge === 'Pro' ? 'ribbon' : 'checkmark-circle'}
                size={10}
                color={expert.badge === 'Pro' ? '#FBC02D' : '#2E7D32'}
              />
              <AppText style={[styles.badgeText, { color: expert.badge === 'Pro' ? '#FBC02D' : '#2E7D32' }]} weight="bold">
                {expert.badge}
              </AppText>
            </View>
          )}

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F1C40F" />
            <AppText style={styles.ratingText} weight="bold">{expert.rating || '0.0'}</AppText>
            <AppText style={styles.reviewsText}>{expert.reviews || '0'} reviews</AppText>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.viewBtn} onPress={onView}>
            <Ionicons name="eye-outline" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectBtn} onPress={onSelect}>
            <AppText style={styles.selectBtnText} weight="bold">Select</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardLeft: {
    width: 80,
    alignItems: 'center',
    marginRight: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  expertImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#E5E5E5',
  },
  badgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  priceContainer: {
    alignItems: 'center',
  },
  startingAt: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  price: {
    fontSize: 13,
    color: theme.colors.textBlack,
  },
  cardRight: {
    flex: 1,
    justifyContent: 'space-between',
  },
  infoTop: {
    marginBottom: 8,
  },
  expertName: {
    fontSize: 18,
    color: theme.colors.textBlack,
    marginBottom: 2,
  },
  expertTitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: theme.colors.textBlack,
  },
  reviewsText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  viewBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtn: {
    backgroundColor: '#4A6B4B',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  selectBtnText: {
    color: theme.colors.white,
    fontSize: 14,
  },
  badgePosition: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 100,
  }
});
