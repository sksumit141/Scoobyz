import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Image, Linking } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import { theme } from '../styles/theme';
import { formatISTDate } from '../utils/date_utils';
import { BASE_URL } from '../services/api';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const BookingStatusBanner = ({ booking, onPress }) => {
  const navigation = useNavigation();

  if (!booking) return null;

  const isPending = booking.status === 'pending';
  
  // Resolve vendor image
  let vendorImageUri = null;
  if (booking.vendorImage) {
      vendorImageUri = booking.vendorImage.startsWith('http') 
        ? booking.vendorImage 
        : `${BASE_URL}${booking.vendorImage}`;
  }

  const getInitials = (name) => {
    if (!name || name === 'Vendor Assigned') return 'V';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.topSection}>
        <View style={styles.vendorInfoRow}>
          {/* Avatar Area */}
          {isPending ? (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="magnify" size={28} color={theme.colors.textSecondary} />
            </View>
          ) : vendorImageUri ? (
            <Image source={{ uri: vendorImageUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary, borderWidth: 0 }]}>
              <AppText style={{ color: '#FFF', fontSize: 20 }} weight="bold">
                {getInitials(booking.vendorName)}
              </AppText>
            </View>
          )}

          {/* Details Area */}
          <View style={styles.detailsCol}>
            <AppText style={styles.vendorName} weight="bold" numberOfLines={1}>
              {isPending ? 'Searching the vendor...' : booking.vendorName || 'Vendor Assigned'}
            </AppText>
            
            {!isPending && (
              <AppText style={styles.vendorRole} numberOfLines={1}>
                {booking.serviceName === 'Grooming' ? 'Senior Groomer' : 
                 booking.serviceName === 'Walking' ? 'Professional Walker' : 
                 booking.serviceName === 'Veterinary' ? 'Certified Vet' : 'Pet Care Expert'}
              </AppText>
            )}
          </View>

          {/* Action Icons */}
          {!isPending && (
            <View style={styles.actionsRow}>
              {booking.vendorPhone && (
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => Linking.openURL(`tel:${booking.vendorPhone}`)}
                >
                  <Ionicons name="call-outline" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => navigation.navigate('Chat', { bookingId: booking.id, partnerName: booking.vendorName || 'Vendor' })}
              >
                <Ionicons name="chatbubble-outline" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={18} color={theme.colors.textSecondary} />
            <AppText style={styles.dateText}>
              {formatISTDate(booking.serviceDate, { day: 'numeric', month: 'short', year: 'numeric' })}
            </AppText>
          </View>
          
          <View style={styles.dateItem}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={theme.colors.textSecondary} />
            <AppText style={styles.dateText}>
              {booking.timeSlot || 'Anytime'}
            </AppText>
          </View>

          {/* OTP Section (Inline) */}
          {(booking.status === 'confirmed' || booking.status === 'in_progress') && booking.otp && (
            <View style={styles.otpMinimalContainer}>
                <AppText style={styles.otpMinimalLabel}>PIN</AppText>
                <View style={styles.otpHighlight}>
                    <AppText style={styles.otpMinimalValue} weight="bold">{booking.otp}</AppText>
                </View>
            </View>
          )}
        </View>
      </View>
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
  topSection: {
  },
  vendorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48, // Slightly smaller avatar
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  detailsCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  vendorName: {
    fontSize: 16,
    color: theme.colors.textBlack,
    marginBottom: 2,
  },
  vendorRole: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    // Removed badge container and text styles as they are no longer used
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginLeft: 10,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  bottomSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: theme.colors.textBlack,
    fontWeight: '500',
  },
  otpMinimalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  otpMinimalLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginRight: 4,
    fontWeight: 'bold',
  },
  otpHighlight: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  otpMinimalValue: {
    fontSize: 12,
    color: '#2E7D32',
    letterSpacing: 1,
  },
});

export default BookingStatusBanner;
