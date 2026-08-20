import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, BackHandler, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { petsApi, customerApi, bookingsApi, BASE_URL } from '../services/api';
import AddressHeader from '../components/AddressHeader';
import BookingStatusBanner from '../components/BookingStatusBanner';
import AutoScrollBanners from '../components/AutoScrollBanners';

const { width } = Dimensions.get('window');

const CARDS_DATA = [
  { id: '1', title: 'Grooming', icon: 'scissors-cutting' },
  { id: '2', title: 'Walking', icon: 'dog-service' },
  // { id: '3', title: 'Boarding', icon: 'home-variant' },
  // { id: '4', title: 'Veterinary', icon: 'stethoscope' },
];

const LandingScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [pets, setPets] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(null);
  const [hasUsedFreeDemo, setHasUsedFreeDemo] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const loadAllData = async () => {
        try {
          const [cachedPets, cachedProfile] = await Promise.all([
            AsyncStorage.getItem('cached_pets'),
            AsyncStorage.getItem('cached_profile')
          ]);
          if (cachedPets) {
            const parsedPets = JSON.parse(cachedPets);
            setPets(parsedPets);
            if (parsedPets.length > 0 && !selectedPet) setSelectedPet(parsedPets[0]);
          }
          if (cachedProfile) {
            const parsedProfile = JSON.parse(cachedProfile);
            if (parsedProfile && parsedProfile.name) setUserName(parsedProfile.name.split(' ')[0]);
            if (parsedProfile && parsedProfile.hasUsedFreeDemo !== undefined) setHasUsedFreeDemo(parsedProfile.hasUsedFreeDemo);
          }
        } catch (e) {
          console.warn('Cache load error:', e);
        }

        // Fetch fresh data concurrently
        Promise.all([
          fetchPets(),
          fetchProfile(),
          fetchActiveBookings()
        ]);
      };

      loadAllData();

      const onBackPress = () => {
        Alert.alert('Exit App', 'Are you sure you want to exit?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        subscription.remove();
      };
    }, [])
  );

  const fetchPets = async () => {
    try {
      if (pets === null) setLoading(true);
      const data = await petsApi.list();
      setPets(data);
      if (data.length > 0) {
        setSelectedPet(prev => {
          if (prev && data.find(p => p.id === prev.id)) return prev;
          return data[0];
        });
      } else {
        setSelectedPet(null);
      }
      await AsyncStorage.setItem('cached_pets', JSON.stringify(data));
    } catch (error) {
      console.error('Fetch pets error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await customerApi.getProfile();
      if (data && data.name) setUserName(data.name.split(' ')[0]);
      if (data && data.hasUsedFreeDemo !== undefined) {
        setHasUsedFreeDemo(data.hasUsedFreeDemo);
      }
      await AsyncStorage.setItem('cached_profile', JSON.stringify(data));
    } catch (error) {
      console.error('Fetch profile error:', error);
    }
  };

  const fetchActiveBookings = async () => {
    try {
      const pending = await bookingsApi.list({ status: 'pending' });
      const confirmed = await bookingsApi.list({ status: 'confirmed' });
      const inProgress = await bookingsApi.list({ status: 'in_progress' });

      const allActive = [...(pending || []), ...(inProgress || []), ...(confirmed || [])];
      if (allActive.length > 0) {
        // Show the most recent or upcoming one
        setActiveBooking(allActive[0]);
      } else {
        setActiveBooking(null);
      }
    } catch (error) {
      console.error('Fetch bookings error:', error);
    }
  };

  const navigateToService = (service) => {
    const params = { serviceName: service.title, pet: selectedPet };
    if (service.title === 'Boarding') {
      navigation.navigate('BoardingService', params);
    } else if (service.title === 'Walking') {
      // if (!hasUsedFreeDemo) {
      //   params.isDemo = true;
      // }
      navigation.navigate('WalkingService', params);
    } else if (service.title === 'Veterinary') {
      navigation.navigate('VetService', params);
    } else {
      navigation.navigate('SlotSelect', params);
    }
  };

  return (
    <AppScreen safeAreaTop={false} padding={false} backgroundColor={theme.colors.background}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header Section */}
        <View
          style={[styles.header, {
            paddingTop: Math.max((insets.top || 40) - 10, 20),
            backgroundColor: theme.colors.primaryDark
          }]}
        >
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Menu')}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="menu" size={28} color={theme.colors.white} />
            </TouchableOpacity>

            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              <AddressHeader lightTheme={true} rightAlign={false} />
            </View>
          </View>


          <View style={styles.greetingWrapper}>
            {userName ? (
              <AppText style={styles.greeting} type="heading" weight="bold">
                Hi, {userName}
              </AppText>
            ) : (
              <View style={{ width: 120, height: 28, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, marginBottom: 4 }} />
            )}
            <AppText style={styles.subtitle}>Let's take care of your pet today!</AppText>
          </View>
        </View>

        <View style={styles.content}>
          {/* !hasUsedFreeDemo && (
            <TouchableOpacity
              style={styles.demoBanner}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('WalkingService', { isDemo: true, serviceName: 'Walking', pet: selectedPet })}
            >
              <View style={styles.demoBannerContent}>
                <View style={styles.demoBannerTextContainer}>
                  <AppText style={styles.demoBannerTitle} weight="bold">Free 30-Min Demo Walk</AppText>
                  <AppText style={styles.demoBannerSubtitle}>Try Scoobyz with a professional walker today. On us!</AppText>
                </View>
                <View style={styles.demoBannerIconContainer}>
                  <MaterialCommunityIcons name="dog-side" size={48} color={theme.colors.white} />
                </View>
              </View>
            </TouchableOpacity>
          ) */}

          {/* Auto Scrolling Banners */}
          {activeBooking && (
            <View style={{ marginBottom: 12 }}>
              <AppText type="heading" style={styles.sectionTitle}>Upcoming Booking</AppText>
            </View>
          )}
          <AutoScrollBanners autoScrollTime={30000}>
            {activeBooking && (
              <BookingStatusBanner
                booking={activeBooking}
                onPress={() => navigation.navigate('MyBookings')}
              />
            )}

            {/* Promo Banner */}
            <View style={[styles.banner, { backgroundColor: '#E3F2FD' }]}>
              <View style={styles.bannerTextContainer}>
                <AppText style={{ color: theme.colors.textBlack, fontWeight: '900', fontSize: width < 360 ? 12 : 14, marginBottom: 4 }}>
                  WELCOME TO{'\n'}MY DOGGIE DEALS
                </AppText>
                <AppText style={{ fontSize: width < 360 ? 9 : 10, color: theme.colors.textPrimary }}>Your one-stop shop for all your pet needs!</AppText>
              </View>
              <Image
                source={require('../../assets/hero_dog.jpg')}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </View>
          </AutoScrollBanners>

          {/* My Pets Section */}
          <View style={styles.sectionHeader}>
            <AppText type="heading" style={styles.sectionTitle}>My Pets</AppText>
            <TouchableOpacity onPress={() => navigation.navigate('AddPetProfile', { pet: selectedPet })}>
              <AppText style={styles.manageText}>Manage</AppText>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            nestedScrollEnabled={true}
            alwaysBounceHorizontal={true}
            contentContainerStyle={styles.petsScrollContent}
            style={styles.petsList}
          >
            {/* Pet Items or Skeletons */}
            {pets === null ? (
              <>
                <View style={styles.petItem}>
                  <View style={[styles.petImageContainer, { backgroundColor: '#E0E0E0', borderColor: 'transparent' }]} />
                  <View style={{ width: 50, height: 12, backgroundColor: '#E0E0E0', borderRadius: 4, marginTop: 4 }} />
                </View>
                <View style={styles.petItem}>
                  <View style={[styles.petImageContainer, { backgroundColor: '#E0E0E0', borderColor: 'transparent' }]} />
                  <View style={{ width: 40, height: 12, backgroundColor: '#E0E0E0', borderRadius: 4, marginTop: 4 }} />
                </View>
              </>
            ) : (
              <>
                {/* Add Pet Button */}
                <View style={styles.petItem}>
                  <TouchableOpacity
                    style={styles.addPetBtn}
                    onPress={() => navigation.navigate('AddPetProfile')}
                  >
                    <Ionicons name="add" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                  <AppText style={styles.petName}>Add Pet</AppText>
                </View>

                {pets.map((pet, index) => {
                  const isActive = selectedPet?.id === pet.id;
                  return (
                    <TouchableOpacity
                      key={pet.id}
                      style={styles.petItem}
                      onPress={() => setSelectedPet(pet)}
                    >
                      <View style={[styles.petImageContainer, { borderColor: isActive ? theme.colors.primaryDark : 'transparent', borderWidth: isActive ? 2 : 0 }]}>
                        {pet.photoUrl ? (
                          <Image source={{ uri: pet.photoUrl.startsWith('http') ? pet.photoUrl : `${BASE_URL}${pet.photoUrl}` }} style={{ width: '100%', height: '100%', borderRadius: 18 }} />
                        ) : (
                          <MaterialCommunityIcons name="dog" size={26} color={theme.colors.primaryDark} />
                        )}
                      </View>
                      <AppText style={[styles.petName, isActive && { color: theme.colors.primaryDark, fontWeight: 'bold' }]}>{pet.name}</AppText>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </ScrollView>

          {/* Services Section */}
          <View style={[styles.sectionHeader, { marginTop: 12 }]}>
            <AppText type="heading" style={styles.sectionTitle}>Services</AppText>
          </View>

          <View style={styles.servicesGrid}>
            {CARDS_DATA.map((service, index) => (
              <TouchableOpacity
                key={index}
                style={styles.serviceCard}
                onPress={() => navigateToService(service)}
                activeOpacity={0.8}
              >
                <View style={styles.serviceIconWrapper}>
                  <MaterialCommunityIcons name={service.icon} size={20} color={theme.colors.white} />
                </View>
                <AppText style={styles.serviceTitle} weight="bold">{service.title}</AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    ...theme.shadows?.medium,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIconBtn: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingRight: 16,
    marginLeft: -4, // Pull slightly left to align with content visually
  },

  greetingWrapper: {
    marginTop: 4,
  },
  greeting: {
    color: theme.colors.white,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  demoBanner: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 24,
    marginBottom: 20,
    marginTop: 10,
    padding: 24,
    shadowColor: theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  demoBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  demoBannerTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  demoBannerTitle: {
    color: theme.colors.white,
    fontSize: 22,
    marginBottom: 6,
    lineHeight: 28,
  },
  demoBannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  demoBannerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  bannerContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  banner: {
    paddingLeft: 20,
    borderRadius: 16,
    height: 130, // matched with new BookingStatusBanner height approx
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 4,
  },
  bannerTextContainer: {
    flex: 1,
    paddingVertical: 16,
    zIndex: 2,
  },
  bannerImage: {
    width: 120,
    height: 130,
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    color: theme.colors.textBlack,
    fontFamily: theme.fonts.heading,
    fontWeight: 'bold',
  },
  manageText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  petsList: {
    marginHorizontal: -24, // Break out of content padding to allow edge scroll
  },
  petsScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 10,
    gap: 12,
  },
  petItem: {
    alignItems: 'center',
  },
  petImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  petName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  addPetBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: '#CCC',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  serviceCard: {
    width: width < 360 ? '100%' : '47%', // 1 column on tiny screens, 2 cols on regular
    flexGrow: 1,
    minWidth: 120,
    backgroundColor: theme.colors.white,
    padding: width < 360 ? 12 : 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  serviceIconWrapper: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 14,
    color: theme.colors.primaryDark,
  },
});

export default LandingScreen;
