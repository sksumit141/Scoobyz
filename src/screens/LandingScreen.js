import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { petsApi, customerApi, BASE_URL } from '../services/api';
import AddressHeader from '../components/AddressHeader';

const { width } = Dimensions.get('window');

const CARDS_DATA = [
  { id: '1', title: 'Grooming', icon: 'scissors-cutting' },
  { id: '2', title: 'Walking', icon: 'dog-service' },
  { id: '3', title: 'Boarding', icon: 'home-variant' },
  { id: '4', title: 'Veterinary', icon: 'stethoscope' },
];

const LandingScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets ? useSafeAreaInsets() : { top: 40 };
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('User');

  useFocusEffect(
    useCallback(() => {
      fetchPets();
      fetchProfile();
    }, [])
  );

  const fetchPets = async () => {
    try {
      setLoading(true);
      const data = await petsApi.list();
      setPets(data);
      if (data.length > 0) setSelectedPet(data[0]);
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
    } catch (error) {
      console.error('Fetch profile error:', error);
    }
  };

  const navigateToService = (service) => {
    const params = { serviceName: service.title, pet: selectedPet };
    if (service.title === 'Boarding') {
      navigation.navigate('BoardingService', params);
    } else if (service.title === 'Walking') {
      navigation.navigate('WalkingService', params);
    } else if (service.title === 'Veterinary') {
      navigation.navigate('VetService', params);
    } else {
      navigation.navigate('SlotSelect', params);
    }
  };

  return (
    <AppScreen safeArea={false} padding={false} backgroundColor={theme.colors.background}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header Section */}
        <LinearGradient
          colors={theme.gradients.primary}
          style={[styles.header, { paddingTop: Math.max((insets.top || 40) - 10, 20) }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerTopRow}>
            <TouchableOpacity 
              style={styles.headerIconBtn}
              onPress={() => navigation.openDrawer ? navigation.openDrawer() : navigation.goBack()}
            >
              <Ionicons name={navigation.openDrawer ? "menu-outline" : "arrow-back"} size={22} color={theme.colors.white} />
            </TouchableOpacity>

            <Image
              source={require('../../assets/scoobyz_logo-removebg-preview.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={{ width: 36 }} /> {/* Spacer to keep logo centered after removing bell */}
          </View>

          <View style={styles.addressWrapper}>
            <AddressHeader lightTheme={true} />
          </View>

          <View style={styles.greetingWrapper}>
            <AppText style={styles.greeting} type="heading" weight="bold">
              Hi, {userName}
            </AppText>
            <AppText style={styles.subtitle}>Let's take care of your pet today!</AppText>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Promo Banner Placeholder */}
          <View style={styles.bannerContainer}>
            <View style={[styles.banner, { backgroundColor: theme.colors.accent }]}>
              <View style={styles.bannerTextContainer}>
                <AppText style={{ color: theme.colors.textBlack, fontWeight: '900', fontSize: width < 360 ? 12 : 14, marginBottom: 4 }}>
                  WELCOME TO{'\n'}MY DOGGIE DEALS
                </AppText>
                <AppText style={{ fontSize: width < 360 ? 9 : 10, color: theme.colors.textPrimary }}>Your one-stop shop for all things pawsome!</AppText>
              </View>
              <Image
                source={require('../../assets/hero_dog.jpg')}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* My Pets Section */}
          <View style={styles.sectionHeader}>
            <AppText type="heading" style={styles.sectionTitle}>My Pets</AppText>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <AppText style={styles.manageText}>Manage</AppText>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petsScrollContent}
            style={styles.petsList}
          >
            {/* Pet Items */}
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
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width < 380 ? 140 : 180,
    height: 48,
    tintColor: theme.colors.white, // Ensure logo shows up well on dark
  },
  addressWrapper: {
    marginBottom: 16,
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
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTextContainer: {
    flex: 1,
    paddingVertical: 16,
    zIndex: 2,
  },
  bannerImage: {
    width: 120,
    height: 100,
    position: 'absolute',
    right: -10,
    bottom: 0,
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
