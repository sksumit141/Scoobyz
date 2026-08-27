import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from '../components/AppText';
import AppScreen from '../components/AppScreen';
import AppHeader from '../components/AppHeader';
import PackageCard from '../components/PackageCard';
import AddonsModal from '../components/AddonsModal';
import { discoverApi, petsApi } from '../services/api';
import { theme } from '../styles/theme';

export default function ExplorePackagesScreen({ route, navigation }) {
  const { expert, serviceName = 'Grooming', isScoobyzGrooming, pet: petParam } = route.params || {};

  // Always fetch the latest pet from the server so breed/size changes reflect instantly
  const [livePet, setLivePet] = useState(petParam || {});
  useEffect(() => {
    if (petParam?.id) {
      petsApi.get(petParam.id)
        .then(updatedPet => { if (updatedPet) setLivePet(updatedPet); })
        .catch(() => {}); // fallback to petParam already set
    }
  }, [petParam?.id]);

  const pet = livePet;
  const petSize = pet?.size || 'Medium';
  const [packages, setPackages] = useState([]);
  const [addons, setAddons] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [meals, setMeals] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeModalPkg, setActiveModalPkg] = useState(null);

  const fetchPackages = useCallback(async () => {
    // For Scoobyz grooming, we don't need an expert id - fetch from Scoobyz master list
    if (!isScoobyzGrooming && !expert?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const mapPackageImage = (p) => {
        const titleLower = (p.name || p.title || p.serviceName || '').toLowerCase();
        let imageUri = require('../../assets/3.png');

        if (titleLower.includes('basic')) {
          imageUri = require('../../assets/1.png');
        } else if (titleLower.includes('fresh') || titleLower.includes('delux') || titleLower.includes('signature')) {
          imageUri = require('../../assets/2.png');
        }

        return {
          id: String(p.id),
          title: p.name || p.serviceName || p.title || 'Package',
          price: Number(p.price) || 0,
          duration: p.duration || '',
          features: p.features || [],
          badge: p.serviceName || p.badge || '',
          image: imageUri,
          pricing: p.pricing || null
        };
      };

      if (isScoobyzGrooming) {
        const data = await discoverApi.scoobyzPackages();
        const mappedScoobyz = (data.packages || []).map(mapPackageImage);
        setPackages(mappedScoobyz);
        setAddons(data.addons || []);
        return;
      }

      const data = await discoverApi.groomerPackages(expert.id);

      if (serviceName === 'Boarding') {
        // For Boarding, Rooms are the "Packages"
        const mappedRooms = (data.rooms || []).map(r => ({
          id: String(r.id),
          title: r.name,
          price: Number(r.price) || 0,
          description: r.description,
          type: 'room'
        }));
        setPackages(mappedRooms);
        setMeals(data.meals || []);
      } else {
        // Dynamic Filter: Only show packages that match the current service flow
        const rawPackages = (data.packages || []).filter(p =>
          p.serviceName?.toLowerCase().includes(serviceName.toLowerCase()) && p.name
        );

        const mapped = rawPackages.map(mapPackageImage);
        setPackages(mapped);
      }
      setAddons(data.addons || []);
    } catch (err) {
      setError(err.message || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  }, [expert]);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  const handleAddClick = (pkg) => {
    const isAdded = cart.some(item => item.packageId === pkg.id);
    if (isAdded) {
      setCart(prev => prev.filter(item => item.packageId !== pkg.id));
    } else {
      setActiveModalPkg({ ...pkg, price: pkg.price, availableAddons: addons });
    }
  };

  const handleModalAdd = (configuredPkg) => {
    setCart([configuredPkg]);
    setActiveModalPkg(null);
  };

  return (
    <AppScreen safeAreaTop={true} padding={false} scrollable={false} backgroundColor={theme.colors.background}>
      <AppHeader title={expert?.name ? `${expert.name}'s Packages` : 'Explore Packages'} />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {loading && <ActivityIndicator size="large" color={theme.colors.primaryDark} style={{ marginTop: 40 }} />}

        {error && (
          <View style={styles.errorBox}>
            <AppText style={styles.errorText}>{error}</AppText>
            <TouchableOpacity onPress={fetchPackages} style={styles.retryBtn}>
              <AppText style={styles.retryText} weight="bold">Retry</AppText>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && packages.length === 0 && !isScoobyzGrooming && (
          <AppText style={styles.emptyText}>No packages listed by this expert yet.</AppText>
        )}

        {serviceName === 'Boarding' && meals.length > 0 && (
          <View style={styles.boardingSection}>
            <AppText style={styles.sectionTitle} weight="bold">Choose Meal Type</AppText>
            <View style={styles.mealsContainer}>
              {meals.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.mealCard, selectedMeal?.id === m.id && styles.mealCardActive]}
                  onPress={() => setSelectedMeal(m)}
                >
                  <AppText style={[styles.mealName, selectedMeal?.id === m.id && { color: '#fff' }]} weight="bold">{m.name}</AppText>
                  <AppText style={[styles.mealPrice, selectedMeal?.id === m.id && { color: '#fff' }]}>₹{m.price}</AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {packages.length > 0 && serviceName !== 'Boarding' && (
          <View style={styles.sizeBanner}>
            <MaterialCommunityIcons name="dog" size={18} color={theme.colors.primaryDark} />
            <AppText style={styles.sizeBannerText}>
              Showing prices for <AppText weight="bold" style={{ color: theme.colors.primaryDark }}>{petSize}</AppText> dogs
            </AppText>
          </View>
        )}

        {/*
        {packages.length > 0 && (
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle} weight="bold">
              {serviceName === 'Boarding' ? 'Select Room Type' : 'Available Packages'}
            </AppText>
          </View>
        )}
        */}

        {packages.map(pkg => {
          const isAdded = serviceName !== 'Boarding' && cart.some(item => item.packageId === pkg.id);
          let displayPrice = pkg.price;
          if (isScoobyzGrooming && pkg.pricing) {
            displayPrice = pkg.pricing[petSize]?.launch || pkg.pricing.Medium.launch;
          }

          // Normalize petSize to ensure it matches our keys exactly (e.g. 'Large' instead of 'large')
          const cleanSize = petSize ? petSize.trim() : 'Medium';
          const normalizedSize = cleanSize.charAt(0).toUpperCase() + cleanSize.slice(1).toLowerCase();

          let originalPrice = null;

          // ==========================================================
          // CUSTOM PRICING CONFIGURATION
          // You can input the regular (original) and discounted (launch) 
          // prices for all 3 types of services here!
          // ==========================================================
          const customPricing = {
            'basic': {
              Small: { original: 799, launch: 699 },
              Medium: { original: 899, launch: 799 },
              Large: { original: 999, launch: 899 }
            },
            'fresh': {
              Small: { original: 799, launch: 699 },
              Medium: { original: 899, launch: 799 },
              Large: { original: 999, launch: 899 }
            },
            'signature': {
              Small: { original: 1499, launch: 1299 }, // Replace these numbers!
              Medium: { original: 1699, launch: 1499 }, // Replace these numbers!
              Large: { original: 1899, launch: 1699 } // Replace these numbers!
            },
            'royal': {
              Small: { original: 1799, launch: 1499 }, // Replace these numbers!
              Medium: { original: 1999, launch: 1699 }, // Replace these numbers!
              Large: { original: 2299, launch: 1899 } // Replace these numbers!
            }
          };

          const titleLower = (pkg.title || pkg.name || '').toLowerCase();
          const customKey = Object.keys(customPricing).find(k => titleLower.includes(k));

          if (customKey) {
            const sizePricing = customPricing[customKey][normalizedSize];
            if (sizePricing) {
              originalPrice = sizePricing.original;
              displayPrice = sizePricing.launch;
            }
          }

          return (
            <PackageCard
              key={pkg.id}
              pkg={{ ...pkg, price: displayPrice, originalPrice: originalPrice }}
              isSelected={serviceName === 'Boarding' && selectedRoom?.id === pkg.id}
              isAdded={isAdded}
              onAdd={() => {
                const packageWithUpdatedPrice = { ...pkg, price: displayPrice, originalPrice: originalPrice };
                if (serviceName === 'Boarding') {
                  setSelectedRoom(packageWithUpdatedPrice);
                } else {
                  if (addons && addons.length > 0) {
                    handleAddClick(packageWithUpdatedPrice);
                  } else {
                    setCart([{ ...packageWithUpdatedPrice, basePrice: displayPrice, totalAddonPrice: 0 }]);
                  }
                }
              }}
            />
          );
        })}

        {serviceName === 'Boarding' && (
          <View style={styles.bottomCtaContainer}>
            <TouchableOpacity
              style={[styles.confirmBtn, !selectedRoom && { backgroundColor: theme.colors.textSecondary }]}
              disabled={!selectedRoom}
              onPress={() => {
                const nights = route.params?.serviceDate && route.params?.endDate ? Math.max(1, Math.ceil((new Date(route.params.endDate).getTime() - new Date(route.params.serviceDate).getTime()) / (1000 * 60 * 60 * 24))) : 1;
                const total = (selectedRoom.price + (selectedMeal ? Number(selectedMeal.price) : 0)) * nights;
                navigation.navigate('BookVendor', {
                  ...route.params,
                  selectedRoom,
                  selectedMeal,
                  total,
                  expert,
                  serviceType: 'Boarding'
                });
              }}
            >
              <AppText style={styles.confirmBtnText} weight="bold">Continue</AppText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {cart.length > 0 && serviceName !== 'Boarding' && (
        <View style={styles.stickyFooter}>
          <View>
            <AppText style={styles.footerTotalLabel}>Total</AppText>
            <AppText style={styles.footerTotalPrice} weight="bold">
              ₹ {cart.reduce((sum, item) => sum + (item.basePrice || 0) + (item.totalAddonPrice || 0), 0)}
            </AppText>
          </View>
          <TouchableOpacity
            style={styles.footerConfirmBtn}
            onPress={() => {
              const total = cart.reduce((sum, item) => sum + (item.basePrice || 0) + (item.totalAddonPrice || 0), 0);
              navigation.navigate('ReviewDetails', {
                ...route.params,
                cart,
                total,
                pet, // pass livePet (freshly fetched) so breed/size is always current
                expert: isScoobyzGrooming ? { id: 'scoobyz_match', name: 'Scoobyz Team Match' } : expert,
                serviceType: serviceName
              });
            }}
          >
            <AppText style={styles.footerConfirmText} weight="bold">Confirm</AppText>
          </TouchableOpacity>
        </View>
      )}

      <AddonsModal
        visible={!!activeModalPkg}
        packageData={activeModalPkg}
        onClose={() => setActiveModalPkg(null)}
        onAdd={handleModalAdd}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 24 },
  errorBox: { alignItems: 'center', marginTop: 40 },
  errorText: { color: theme.colors.error || 'red', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  retryBtn: { backgroundColor: theme.colors.primaryDark, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: theme.colors.white, fontSize: 14 },
  emptyText: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: 60, fontSize: 15 },
  boardingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: theme.colors.textBlack,
    marginBottom: 16,
    fontFamily: theme.fonts.heading,
  },
  mealsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  mealCardActive: {
    backgroundColor: theme.colors.primaryDark,
    borderColor: theme.colors.primaryDark,
  },
  mealName: {
    fontSize: 15,
    color: theme.colors.textBlack,
    marginBottom: 4,
  },
  mealPrice: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  addonPrice: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  addonPriceActive: {
    color: theme.colors.primaryDark,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerTotalLabel: {
    fontSize: 14,
    color: '#666666',
  },
  footerTotalPrice: {
    fontSize: 20,
    color: '#111111',
  },
  footerConfirmBtn: {
    backgroundColor: '#4A6B4B',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  footerConfirmText: {
    color: theme.colors.white,
    fontSize: 16,
  },
  sizeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(73, 94, 113, 0.08)',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  sizeBannerText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  bottomCtaContainer: {
    marginTop: 32,
    paddingBottom: 20,
  },
  confirmBtn: {
    backgroundColor: theme.colors.success,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: theme.colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmBtnText: {
    color: theme.colors.white,
    fontSize: 18,
    letterSpacing: 0.5,
  },
});
