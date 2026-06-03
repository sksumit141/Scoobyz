import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AppText from './AppText';
import { theme } from '../styles/theme';
import { formatISTDate } from '../utils/date_utils';

const { width } = Dimensions.get('window');

const BookingStatusBanner = ({ booking, onPress }) => {
  if (!booking) {
    return (
      <TouchableOpacity 
        style={[styles.statusBanner, styles.emptyBanner]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F1F8E9']}
          style={styles.emptyGradient}
        >
          <View style={{ flex: 1 }}>
            <AppText style={styles.emptyTitle} weight="bold">Get your new service now</AppText>
            <AppText style={styles.emptySubtitle}>Book top-rated professionals for your pet</AppText>
          </View>
          <View style={styles.arrowCircle}>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#2E7D32" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.statusBanner}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#3D2A5E', '#1A1128']}
        style={styles.statusBannerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Abstract Background Element */}
        <View style={styles.abstractCircle} />
        
        <View style={styles.statusBannerLeft}>
          <View style={styles.statusIconCircle}>
            <MaterialCommunityIcons 
              name={booking.bookingType === 'boarding' ? 'home-heart' : 'dog-service'} 
              size={24} 
              color="#FFF" 
            />
          </View>
          <View>
            <View style={styles.badge}>
              <AppText style={styles.badgeText} weight="bold">
                {booking.status === 'in_progress' ? 'LIVE NOW' : 'CONFIRMED'}
              </AppText>
            </View>
            <AppText style={styles.statusTitle} weight="bold">
              {booking.serviceName || booking.bookingType.toUpperCase()}
            </AppText>
            <AppText style={styles.statusSubtitle}>
              Scheduled for {booking.petName}
            </AppText>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statusBannerRight}>
          <View style={styles.timeInfo}>
            <MaterialCommunityIcons name="clock-outline" size={12} color="rgba(255,255,255,0.6)" />
            <AppText style={styles.statusTime} weight="bold">
              {formatISTDate(booking.serviceDate, { day: 'numeric', month: 'short' })}
            </AppText>
          </View>
          <AppText style={styles.statusTimeSub}>{booking.timeSlot || 'Anytime'}</AppText>
        </View>
        <View style={styles.arrowCircleLight}>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#FFF" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  statusBanner: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#3D2A5E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    height: 110,
  },
  statusBannerGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 15,
  },
  abstractCircle: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statusBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  statusIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badge: {
    backgroundColor: theme.colors.accent || '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 9,
    color: '#000',
    letterSpacing: 0.5,
  },
  statusTitle: {
    color: '#FFF',
    fontSize: 18,
    letterSpacing: -0.5,
  },
  statusSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statusBannerRight: {
    alignItems: 'flex-end',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusTime: {
    color: '#FFF',
    fontSize: 16,
  },
  statusTimeSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  arrowCircleLight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBanner: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    height: 100,
  },
  emptyGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  emptyIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 20,
    overflow: 'hidden',
  },
  iconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    color: '#2E7D32',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(46, 125, 50, 0.7)',
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BookingStatusBanner;
