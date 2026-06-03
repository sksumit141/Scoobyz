import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from './AppText';
import { theme } from '../styles/theme';

export default function ReviewCard({ review }) {
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialCommunityIcons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color="#526D82"
        />
      );
    }
    return stars;
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.topRow}>
        <Image source={{ uri: review.userImage }} style={styles.userImage} />
        <View style={styles.userInfo}>
          <AppText style={styles.userName} weight="bold">{review.userName}</AppText>
          <AppText style={styles.dateText}>{review.date}</AppText>
        </View>
        <View style={styles.starsContainer}>
          {renderStars(review.rating)}
        </View>
      </View>

      <AppText style={styles.reviewText}>{review.text}</AppText>

      {/* Review photo — shown only when present */}
      {!!review.photoUrl && (
        <Image
          source={{ uri: review.photoUrl }}
          style={styles.reviewPhoto}
          resizeMode="cover"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: theme.colors.surface,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    color: theme.colors.textBlack,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  reviewPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginTop: 12,
    backgroundColor: '#F0F0F0',
  },
});
