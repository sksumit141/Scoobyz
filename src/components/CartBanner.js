import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AppText from './AppText';
import { theme } from '../styles/theme';
import { useCart } from '../contexts/CartContext';

const { width } = Dimensions.get('window');

const CartBanner = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { cartItem, clearCart } = useCart();

  if (!cartItem) return null;

  const handleResume = () => {
    navigation.navigate(cartItem.screen, cartItem.params);
  };

  return (
    <View style={[styles.container, { bottom: insets.bottom + 20 }]}>
      <TouchableOpacity style={styles.banner} onPress={handleResume} activeOpacity={0.9}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="cart-outline" size={24} color={theme.colors.white} />
          </View>
          <View style={styles.textContainer}>
            <AppText style={styles.title} weight="bold">Incomplete Booking</AppText>
            <AppText style={styles.subtitle}>{cartItem.serviceName} • ₹{cartItem.amount}</AppText>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
            <Ionicons name="close" size={20} color={theme.colors.white} />
          </TouchableOpacity>
          <View style={styles.resumeBtn}>
            <AppText style={styles.resumeText} weight="bold">View</AppText>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.white} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 999,
  },
  banner: {
    backgroundColor: theme.colors.success,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    ...theme.shadows?.medium,
    elevation: 6,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: theme.colors.white,
    fontSize: 15,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearBtn: {
    padding: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  resumeText: {
    color: theme.colors.white,
    fontSize: 14,
    marginRight: 4,
  }
});

export default CartBanner;
