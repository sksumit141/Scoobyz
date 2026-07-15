import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { petsApi, customerApi, BASE_URL } from '../services/api';
import CustomAlert from '../components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState({
    name: 'User',
    email: '',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
    stats: [
      { label: 'Bookings', value: '12' },
      { label: 'My Pets', value: '0' },
      { label: 'Points', value: '450' },
    ]
  });

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchProfileAndPets();
  }, []);

  const fetchProfileAndPets = async () => {
    try {
      setLoading(true);
      const [profileData, petsData] = await Promise.all([
        customerApi.getProfile(),
        petsApi.list()
      ]);

      setUser({
        name: profileData.name || 'User',
        email: profileData.email || '',
        avatar: (profileData.image && profileData.image !== 'null') ? (profileData.image.startsWith('http') ? profileData.image : `${BASE_URL}${profileData.image}`) : null,
        stats: [
          { label: 'Bookings', value: '12' },
          { label: 'My Pets', value: String(petsData.length) },
          { label: 'Points', value: '450' },
        ]
      });
      setPets(petsData);
    } catch (error) {
      console.error('Fetch profile/pets error:', error);
    } finally {
      setLoading(false);
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

  const confirmDeletePet = (id, name) => {
    setDeletingId(id);
    setAlertConfig({
      visible: true,
      title: 'Delete Pet?',
      message: `Are you sure you want to remove ${name}'s profile? This action cannot be undone.`,
      onClose: () => setAlertConfig({ ...alertConfig, visible: false }),
      onConfirm: () => handleDeletePet(id)
    });
  };

  const handleDeletePet = async (id) => {
    try {
      setAlertConfig({ ...alertConfig, visible: false });
      setLoading(true);
      await petsApi.delete(id);
      await fetchProfileAndPets();
    } catch (error) {
      console.error('Delete pet error:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Failed to delete pet profile. Please try again.',
        onClose: () => setAlertConfig({ ...alertConfig, visible: false })
      });
    } finally {
      setLoading(false);
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userId');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEditAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setAlertConfig({
          visible: true,
          title: 'Permission Denied',
          message: 'Please grant camera roll permissions to change your profile photo.',
          onClose: () => setAlertConfig({ ...alertConfig, visible: false })
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLoading(true);
        const selectedImage = result.assets[0];

        // Fetch the image to get a blob (works on both mobile and web)
        const response = await fetch(selectedImage.uri);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append('photo', blob, 'profile_photo.jpg');

        const uploadRes = await customerApi.uploadPhoto(formData);
        if (uploadRes.success) {
          await fetchProfileAndPets();
          setAlertConfig({
            visible: true,
            title: 'Success',
            message: 'Profile photo updated successfully!',
            onClose: () => setAlertConfig({ ...alertConfig, visible: false })
          });
        }
      }
    } catch (error) {
      console.error('Avatar update error:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Failed to update profile photo. Please try again.',
        onClose: () => setAlertConfig({ ...alertConfig, visible: false })
      });
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      title: 'Account Settings',
      items: [
        { icon: 'map-marker-outline', label: 'Address Book', route: 'AddressBook' },
        { icon: 'credit-card-outline', label: 'Payment Methods', route: 'Payments' },
        { icon: 'bell-outline', label: 'Notification Preferences', route: 'Notifications' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', label: 'Help & FAQ', route: 'Help' },
        { icon: 'chat-outline', label: 'Contact Us', route: 'SupportChat' },
        { icon: 'information-outline', label: 'About Scoobyz', route: 'About' },
      ]
    }
  ];

  const [isPetsExpanded, setIsPetsExpanded] = useState(false);

  if (loading) {
    return (
      <AppScreen backgroundColor={theme.colors.background}>
        <ActivityIndicator size="large" color={theme.colors.primaryDark} style={{ marginTop: 100 }} />
      </AppScreen>
    );
  }

  return (
    <AppScreen safeArea={true} padding={false} scrollable={true} backgroundColor={theme.colors.background}>
      {/* Top Header Section - Reconfigured into a Card */}
      <View style={styles.topSection}>
        {/* Simple App Bar just for the menu button */}
        <View style={styles.appBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.menuButton}
          >
            <Ionicons name="arrow-back" size={28} color={theme.colors.textBlack} />
          </TouchableOpacity>
          <AppText style={styles.appBarTitle} weight="bold">Profile</AppText>
          <View style={{ width: 28 }} />{/* Spacer to center title */}
        </View>

        {/* Floating Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.nameContainer}>
              <AppText style={styles.profileName} weight="bold">{user.name}</AppText>
              {user.email ? (
                <AppText style={styles.profileEmail}>{user.email}</AppText>
              ) : null}
            </View>

            <TouchableOpacity onPress={handleEditAvatar} style={styles.headerAvatarWrapper}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <AppText style={styles.avatarInitial} weight="bold">{getInitials(user.name)}</AppText>
                </View>
              )}
              <View style={styles.headerEditBadge}>
                <MaterialCommunityIcons name="pencil" size={12} color={theme.colors.white} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* My Pets Section - Dropdown Style */}
        <TouchableOpacity
          style={styles.mainMenuItem}
          onPress={() => setIsPetsExpanded(!isPetsExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <MaterialCommunityIcons name="paw" size={22} color={theme.colors.primaryDark} />
            <AppText style={styles.menuItemLabel}>My Pets ({pets.length})</AppText>
          </View>
          <Ionicons
            name={isPetsExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={theme.colors.textTertiary}
          />
        </TouchableOpacity>

        {isPetsExpanded && (
          <View style={styles.petsDropdown}>
            {pets.map((pet) => (
              <View key={pet.id} style={styles.petDropdownItem}>
                <View style={styles.petItemInfo}>
                  <View style={styles.smallPetAvatar}>
                    {pet.photoUrl ? (
                      <Image
                        source={{ uri: pet.photoUrl.startsWith('http') ? pet.photoUrl : `${BASE_URL}${pet.photoUrl}` }}
                        style={styles.fullImage}
                      />
                    ) : (
                      <MaterialCommunityIcons name="dog" size={16} color={theme.colors.primaryDark} />
                    )}
                  </View>
                  <AppText style={styles.petDropdownName}>{pet.name}</AppText>
                </View>
                <TouchableOpacity
                  style={styles.petEditBtn}
                  onPress={() => navigation.navigate('AddPetProfile', { pet })}
                >
                  <AppText style={styles.petEditBtnText}>Edit</AppText>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addNewPetOption}
              onPress={() => navigation.navigate('AddPetProfile')}
            >
              <View style={styles.addPetIconCircle}>
                <Ionicons name="add" size={16} color={theme.colors.white} />
              </View>
              <AppText style={styles.addNewPetText} weight="bold">Add New Pet</AppText>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.sectionDivider} />

        {/* Account Menu Items */}
        {menuItems[0].items.map((item, index) => (
          <React.Fragment key={index}>
            <TouchableOpacity
              style={styles.mainMenuItem}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name={item.icon} size={22} color={theme.colors.primaryDark} />
                <AppText style={styles.menuItemLabel}>{item.label}</AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
            <View style={styles.itemSeparator} />
          </React.Fragment>
        ))}

        {/* Support Section */}
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionHeaderText} weight="bold">Support & Feedback</AppText>
        </View>

        {menuItems[1].items.map((item, index) => (
          <React.Fragment key={index}>
            <TouchableOpacity
              style={styles.mainMenuItem}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name={item.icon} size={22} color={theme.colors.primaryDark} />
                <AppText style={styles.menuItemLabel}>{item.label}</AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
            <View style={styles.itemSeparator} />
          </React.Fragment>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <View style={styles.menuItemLeft}>
            <MaterialCommunityIcons name="logout" size={22} color={theme.colors.error} />
            <AppText style={styles.logoutLabel} weight="bold">Log Out</AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(231, 76, 60, 0.2)" />
        </TouchableOpacity>

        <View style={styles.footer}>
          <AppText style={styles.versionText}>Version 1.0.0 • Scoobyz</AppText>
        </View>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={alertConfig.onClose}
        {...(alertConfig.onConfirm ? {
          buttonText: "Cancel",
          onConfirm: alertConfig.onConfirm,
          confirmText: "Delete"
        } : {})}
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  topSection: {
    backgroundColor: theme.colors.background,
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  menuButton: {
    padding: 4,
    marginLeft: -4,
  },
  appBarTitle: {
    fontSize: 20,
    color: theme.colors.textBlack,
    fontFamily: theme.fonts.heading,
  },
  profileCard: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 24,
    padding: 24,
    shadowColor: theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameContainer: {
    flex: 1,
    paddingRight: 16,
  },
  profileName: {
    color: theme.colors.white,
    fontSize: 26,
    fontFamily: theme.fonts.heading,
    marginBottom: 4,
  },
  profileEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  headerAvatarWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 28,
    color: theme.colors.primaryDark,
  },
  headerEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: theme.colors.error, // Gives a nice pop of color
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 10,
  },
  mainMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemLabel: {
    fontSize: 16,
    color: theme.colors.textBlack,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
    marginHorizontal: 24,
  },
  sectionDivider: {
    height: 8,
    backgroundColor: '#F0F0F0',
    opacity: 0.5,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
    marginTop: 10,
  },
  sectionHeaderText: {
    fontSize: 18,
    color: theme.colors.textBlack,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  logoutLabel: {
    fontSize: 16,
    color: theme.colors.error,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  versionText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    opacity: 0.5,
  },
  // New Dropdown Styles
  petsDropdown: {
    backgroundColor: '#F9F9F9',
    marginHorizontal: 24,
    borderRadius: 16,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  petDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  petItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smallPetAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(73, 94, 113, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  petDropdownName: {
    fontSize: 14,
    color: theme.colors.textBlack,
  },
  petEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primaryDark,
  },
  petEditBtnText: {
    fontSize: 12,
    color: theme.colors.primaryDark,
    fontWeight: '600',
  },
  addNewPetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  addPetIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNewPetText: {
    fontSize: 14,
    color: theme.colors.primaryDark,
  }
});

export default ProfileScreen;
