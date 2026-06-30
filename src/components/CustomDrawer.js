import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import AppText from './AppText';
import CustomAlert from './CustomAlert';
import { customerApi, BASE_URL } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';


const { width } = Dimensions.get('window');

const menuGroups = [
  {
    title: 'MAIN MENU',
    items: [
      { id: 'Landing', title: 'Home', icon: 'home-variant' },
      { id: 'Explore', title: 'Explore', icon: 'magnify' },
      { id: 'Bookings', title: 'My Bookings', icon: 'calendar-check' },
    ]
  },
  {
    title: 'ACCOUNT',
    items: [
      { id: 'Profile', title: 'My Profile', icon: 'account-outline' },
      { id: 'AddressBook', title: 'Saved Addresses', icon: 'map-marker-outline' },
      { id: 'Notifications', title: 'Notifications', icon: 'bell-outline' },
    ]
  },
  {
    title: 'SUPPORT',
    items: [
      { id: 'Help', title: 'Help & FAQ', icon: 'help-circle-outline' },
      { id: 'SupportChat', title: 'Support Chat', icon: 'chat-processing-outline' },
    ]
  }
];

export default function CustomDrawer(props) {
  const [user, setUser] = useState({ name: 'User', email: '', avatar: null });
  const [logoutAlertVisible, setLogoutAlertVisible] = useState(false);
  const currentRouteName = props.state.routeNames[props.state.index];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const profileData = await customerApi.getProfile();
      setUser({
        name: profileData.name || 'User',
        email: profileData.email || '',
        avatar: (profileData.image && profileData.image !== 'null') ? (profileData.image.startsWith('http') ? profileData.image : `${BASE_URL}${profileData.image}`) : null
      });
    } catch (error) {
      console.error('Drawer profile fetch error:', error);
    }
  };

  const getInitials = (name) => {
    if (!name || name === 'User') return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1 && parts[1]) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    setLogoutAlertVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutAlertVisible(false);
    await AsyncStorage.removeItem('authToken');
    props.navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={styles.headerContainer}>
        <View
          style={[styles.headerGradient, { backgroundColor: theme.colors.primaryDark }]}
        >
          <TouchableOpacity
            style={styles.profileSection}
            onPress={() => props.navigation.navigate('Profile')}
            activeOpacity={0.9}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                {user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <AppText style={styles.avatarInitials} weight="bold">{getInitials(user.name)}</AppText>
                  </View>
                )}
                <View style={styles.statusDot} />
              </View>
            </View>
            <View style={styles.profileTextContainer}>
              <AppText style={styles.userName} weight="bold" numberOfLines={1}>{user.name}</AppText>
              <AppText style={styles.userEmail} numberOfLines={1}>{user.email || 'Complete Profile'}</AppText>
            </View>
            <View style={styles.chevronContainer}>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuContainer}>
          {menuGroups.map((group, groupIndex) => (
            <View key={groupIndex} style={styles.groupWrapper}>
              <AppText style={styles.groupTitle} weight="bold">{group.title}</AppText>
              {group.items.map((item) => {
                const isActive = currentRouteName === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.menuItem, isActive && styles.activeMenuItem]}
                    onPress={() => props.navigation.navigate(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconBox, isActive && styles.activeIconBox]}>
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={22}
                        color={isActive ? theme.colors.white : theme.colors.textSecondary}
                      />
                    </View>
                    <AppText
                      style={[styles.menuText, isActive && styles.activeMenuText]}
                      weight={isActive ? "bold" : "500"}
                    >
                      {item.title}
                    </AppText>
                    {isActive && (
                      <View style={styles.activeIndicator} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Promo Section */}
        {/* <View style={styles.promoContainer}>
          <View
            style={[styles.promoBox, { backgroundColor: '#FFF9F1' }]}
          >
            <View style={styles.promoIcon}>
              <Ionicons name="gift-outline" size={20} color="#F57C00" />
            </View>
            <View style={styles.promoText}>
              <AppText weight="bold" style={styles.promoTitle}>Invite Friends</AppText>
              <AppText style={styles.promoSubtitle}>Get 20% off next booking</AppText>
            </View>
          </View>
        </View> */}
      </DrawerContentScrollView>

      {/* Styled Footer */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={styles.logoutIconBox}>
            <MaterialCommunityIcons name="logout-variant" size={20} color="#E74C3C" />
          </View>
          <AppText style={styles.logoutLabel} weight="bold">Log Out</AppText>
        </TouchableOpacity>
        <View style={styles.versionInfo}>
          <AppText style={styles.versionText}>Scoobyz• v1.0.0</AppText>
        </View>
      </View>

      <CustomAlert
        visible={logoutAlertVisible}
        title="Sign Out"
        message="Are you sure you want to leave? Your pet's dashboard will be waiting for you."
        onClose={() => setLogoutAlertVisible(false)}
        onConfirm={confirmLogout}
        confirmText="Logout"
        buttonText="Stay"
        iconName="logout-variant"
        type="error"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    overflow: 'hidden',
    borderBottomRightRadius: 40,
  },
  headerGradient: {
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    color: theme.colors.primaryDark,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: theme.colors.primaryDark,
  },
  profileTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  chevronContainer: {
    padding: 4,
  },
  scrollContent: {
    paddingTop: 8,
  },
  menuContainer: {
    paddingHorizontal: 16,
  },
  groupWrapper: {
    marginBottom: 28,
  },
  groupTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    letterSpacing: 1.5,
    marginLeft: 12,
    marginBottom: 16,
    opacity: 0.6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    marginBottom: 6,
  },
  activeMenuItem: {
    backgroundColor: theme.colors.primary + '10',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activeIconBox: {
    backgroundColor: theme.colors.primaryDark,
    shadowColor: theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  menuText: {
    fontSize: 16,
    color: theme.colors.textBlack,
    flex: 1,
    letterSpacing: 0.2,
  },
  activeMenuText: {
    color: theme.colors.primaryDark,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primaryDark,
  },
  promoContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  promoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  promoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  promoText: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 14,
    color: '#E65100',
  },
  promoSubtitle: {
    fontSize: 12,
    color: '#FB8C00',
    marginTop: 1,
  },
  footerContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFF5F5',
  },
  logoutIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutLabel: {
    fontSize: 16,
    color: '#E74C3C',
  },
  versionInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    opacity: 0.5,
    letterSpacing: 0.5,
  },
});
