import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from '../components/AppText';
import PackageCard from '../components/PackageCard';
import AddonsModal from '../components/AddonsModal';
import { discoverApi } from '../services/api';
import { theme } from '../styles/theme';

export default function ExplorePackagesScreen({ route, navigation }) {
  const { expert, serviceName = 'Grooming' } = route.params || {};
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
    if (!expert?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
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

        // Map backend format to what PackageCard expects
        const mapped = rawPackages.map(p => ({
          id: String(p.id),
          title: p.name || p.serviceName || 'Package',
          price: Number(p.price) || 0,
          duration: p.duration || '',
          features: [],
          badge: p.serviceName || '',
        }));
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
      setActiveModalPkg({ ...pkg, availableAddons: addons });
    }
  };

  const handleModalAdd = (configuredPkg) => {
    const nextParams = {
      ...route.params,
      cart: [configuredPkg],
      total: configuredPkg.basePrice + configuredPkg.totalAddonPrice,
      expert,
    };

    if (serviceName?.toLowerCase() === 'walking') {
      console.log('[ExplorePackages] Routing to WalkingReviewFinal');
      navigation.navigate('WalkingReviewFinal', nextParams);
    } else {
      navigation.navigate('ReviewDetails', nextParams);
    }
    setActiveModalPkg(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.accent} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} type="heading" weight="bold">
          {expert?.name ? `${expert.name}'s Packages` : 'Explore Packages'}
        </AppText>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {loading && <ActivityIndicator size="large" color={theme.colors.primaryDark} style={{ marginTop: 40 }} />}

        {error && (
          <View style={styles.errorBox}>
            <AppText style={styles.errorText}>{error}</AppText>
            <TouchableOpacity onPress={fetchPackages} style={styles.retryBtn}>
              <AppText style={styles.retryText} weight="bold">Retry</AppText>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && packages.length === 0 && (
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

        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle} weight="bold">
            {serviceName === 'Boarding' ? 'Select Room Type' : 'Available Packages'}
          </AppText>
        </View>

        {packages.map(pkg => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            isSelected={serviceName === 'Boarding' && selectedRoom?.id === pkg.id}
            isAdded={serviceName !== 'Boarding' && cart.some(item => item.packageId === pkg.id)}
            onAdd={() => {
              if (serviceName === 'Boarding') {
                setSelectedRoom(pkg);
              } else {
                handleAddClick(pkg);
              }
            }}
          />
        ))}

        {serviceName === 'Boarding' && (
          <View style={styles.bottomCtaContainer}>
            <TouchableOpacity
              style={[styles.confirmBtn, !selectedRoom && { backgroundColor: theme.colors.textSecondary }]}
              disabled={!selectedRoom}
              onPress={() => {
                const nights = route.params?.serviceDate && route.params?.endDate ? Math.max(1, Math.ceil((new Date(route.params.endDate).getTime() - new Date(route.params.serviceDate).getTime()) / (1000 * 60 * 60 * 24))) : 1;
                const total = (selectedRoom.price + (selectedMeal ? Number(selectedMeal.price) : 0)) * nights;
                navigation.navigate('ReviewDetails', {
                  ...route.params,
                  selectedRoom,
                  selectedMeal,
                  total,
                  expert,
                });
              }}
            >
              <AppText style={styles.confirmBtnText} weight="bold">Continue</AppText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <AddonsModal
        visible={!!activeModalPkg}
        packageData={activeModalPkg}
        onClose={() => setActiveModalPkg(null)}
        onAdd={handleModalAdd}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: 18, paddingRight: 24, paddingTop: 40, paddingBottom: 24,
  },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 22, color: theme.colors.textBlack, fontFamily: theme.fonts.heading, marginLeft: -5, marginTop: 5 },
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
