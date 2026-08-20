import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/AppText';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const MENU_ITEMS = [
  { id: 'LandingScreen', title: 'Home', icon: 'home' },
  { id: 'Explore', title: 'Explore', icon: 'search-outline' },
  { id: 'MyBookings', title: 'Bookings', icon: 'calendar-outline' },
  { id: 'Profile', title: 'Profile', icon: 'person-outline' },
];

export default function MenuScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // We'll highlight Home by default for visual matching with the requested design
  const activeTab = 'LandingScreen';

  const navigateTo = (routeName) => {
    if (routeName === 'LandingScreen') {
      navigation.goBack();
    } else {
      navigation.navigate(routeName);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('authToken');
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={() => navigation.goBack()}
      />

      <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#1C1C1C" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/scoobyz_logo-removebg-preview.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.menuList}>
          {MENU_ITEMS.map((item) => {
            const isActive = item.id === activeTab;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => navigateTo(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Ionicons
                    name={isActive && item.id === 'LandingScreen' ? 'home' : item.icon}
                    size={22}
                    color={isActive ? '#FFF' : '#5A7184'}
                  />
                </View>
                <AppText
                  style={[styles.menuText, isActive && styles.menuTextActive]}
                  weight={isActive ? '500' : '400'}
                >
                  {item.title}
                </AppText>
              </TouchableOpacity>
            );
          })}

          <View style={{ flex: 1 }} />

          {/* Logout Button aligned with Profile */}
          <TouchableOpacity
            style={[styles.menuItem, { marginBottom: insets.bottom + 20 }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.iconBox}>
              <Ionicons name="log-out-outline" size={22} color="#E74C3C" />
            </View>
            <AppText style={[styles.menuText, { color: '#E74C3C' }]} weight="500">
              Log Out
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    width: width * 0.72,
    height: '100%',
    backgroundColor: '#F4F5F7',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  backBtn: {
    padding: 4,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginTop: 15, // Moves the logo down slightly
    marginRight: -60,
  },
  logo: {
    height: 70,
    width: 180,
  },
  menuList: {
    paddingHorizontal: 16,
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuItemActive: {
    backgroundColor: '#5A7184',
  },
  iconBox: {
    width: 32,
    alignItems: 'center',
    marginRight: 10,
  },
  menuText: {
    fontSize: 16,
    color: '#5A7184',
    letterSpacing: 0.3,
  },
  menuTextActive: {
    color: '#FFF',
  },
});
