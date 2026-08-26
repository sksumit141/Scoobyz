import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AppText from './AppText';
import { theme } from '../styles/theme';
import { addressApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddressHeader({
  onPress,
  lightTheme = false,
  rightAlign = false
}) {
  const navigation = useNavigation();
  const [defaultAddress, setDefaultAddress] = useState(null);

  const fetchDefaultAddress = async () => {
    try {
      const cached = await AsyncStorage.getItem('cached_default_address');
      if (cached) {
        setDefaultAddress(JSON.parse(cached));
      }

      const addresses = await addressApi.list();
      const def = addresses.find(a => a.isDefault) || addresses[0];
      setDefaultAddress(def);
      if (def) {
        await AsyncStorage.setItem('cached_default_address', JSON.stringify(def));
      }
    } catch (error) {
      console.error('Fetch default address error:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDefaultAddress();
    }, [])
  );

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('AddressBook');
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        lightTheme ? styles.containerLight : styles.containerDark
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.textContainer, rightAlign && { alignItems: 'flex-end' }]}>
        <View style={[styles.titleRow, rightAlign && { justifyContent: 'flex-end' }]}>
          <AppText style={[styles.title, lightTheme && { color: theme.colors.white }, rightAlign && { textAlign: 'right' }]} weight="bold">
            {defaultAddress?.label || "Select Location"}
          </AppText>
          <MaterialCommunityIcons
            name="chevron-down"
            size={16}
            color={lightTheme ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary}
            style={{ marginLeft: 4 }}
          />
        </View>
        <AppText style={[styles.address, lightTheme && { color: 'rgba(255,255,255,0.6)' }, rightAlign && { textAlign: 'right' }]} numberOfLines={1}>
          {defaultAddress ? [defaultAddress.fullAddress, defaultAddress.areaLocality, defaultAddress.city].filter(Boolean).join(', ') : "Tap to set your delivery address"}
        </AppText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  containerLight: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  containerDark: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12, // changed from marginRight to marginLeft since it's on the right now
  },
  iconContainerLight: {
    // Removed white background
  },
  iconContainerDark: {
    backgroundColor: 'rgba(78, 108, 72, 0.08)',
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  address: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  }
});
