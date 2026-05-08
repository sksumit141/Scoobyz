import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import { theme } from '../styles/theme';

export default function ReviewDetailsCard({ expert, service, date, time }) {
  return (
    <View style={styles.card}>
      <View style={styles.expertRow}>
        <Image source={{ uri: expert.image }} style={styles.expertThumb} />
        <View style={styles.expertInfo}>
          <AppText style={styles.expertName} weight="bold">{expert.name}</AppText>
          <AppText style={styles.expertRole}>{expert.role}</AppText>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFB800" />
            <AppText style={styles.ratingText}>{expert.rating}</AppText>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailItem}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="calendar-range" size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <AppText style={styles.label}>Date & Time</AppText>
          <AppText style={styles.value} weight="bold">{date} | {time}</AppText>
        </View>
      </View>

      <View style={styles.detailItem}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="content-cut" size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <AppText style={styles.label}>Service Type</AppText>
          <AppText style={styles.value} weight="bold">{service}</AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  expertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  expertThumb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.surface,
  },
  expertInfo: {
    flex: 1,
    marginLeft: 15,
  },
  expertName: {
    fontSize: 18,
    color: theme.colors.textBlack,
  },
  expertRole: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: theme.colors.textBlack,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(97, 119, 139, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: theme.colors.textBlack,
  },
});
