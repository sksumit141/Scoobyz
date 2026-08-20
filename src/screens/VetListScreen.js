import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import AppHeader from '../components/AppHeader';
import ExpertCard from '../components/ExpertCard';
import ExpertDetailsModal from '../components/ExpertDetailsModal';
import FilterModal from '../components/FilterModal';
import { discoverApi } from '../services/api';
import { theme } from '../styles/theme';
import PawLoader from '../components/PawLoader';

export default function VetListScreen({ navigation, route }) {
  const { consultType = 'Clinic Visit' } = route.params || {};
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVet, setSelectedVet] = useState(null);
  const [activeModalExpert, setActiveModalExpert] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ sort: null, tiers: [] });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // We use byService to get experts offering Veterinary services
      const data = await discoverApi.byService('Veterinary', { consultType });
      // If endpoint doesn't support byService, fallback to mock data or handling here
      setVets(data || []);
    } catch (err) {
      console.warn('API error, falling back to mock Vets for demo purposes', err);
      // Mock data fallback if endpoint fails
      setVets([
        {
          id: 101,
          userId: 101,
          name: "Dr. Sarah Jenkins",
          role: "Senior Veterinarian",
          rating: 4.9,
          reviews: 124,
          price: 500,
          badge: 'Pro',
          image: "https://images.unsplash.com/photo-1594824436998-d4052e424260?auto=format&fit=crop&q=80&w=300"
        },
        {
          id: 102,
          userId: 102,
          name: "Paws Care Clinic",
          role: "Veterinary Clinic",
          rating: 4.7,
          reviews: 89,
          price: 350,
          badge: 'Basic',
          image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=300"
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVets(); }, [fetchVets]);

  const displayed = [...vets]
    .filter(w => {
      const matchesBadge = activeFilters.tiers.length === 0 || activeFilters.tiers.includes(w.badge);
      const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesBadge && matchesSearch;
    })
    .sort((a, b) => {
      if (activeFilters.sort === 'price_asc') return Number(a.price) - Number(b.price);
      if (activeFilters.sort === 'price_desc') return Number(b.price) - Number(a.price);
      if (activeFilters.sort === 'rating_desc') return Number(b.rating) - Number(a.rating);
      if (activeFilters.sort === 'reviews_desc') return Number(b.reviews) - Number(a.reviews);
      return 0;
    });

  return (
    <AppScreen safeAreaTop={true} padding={false} scrollable={false} backgroundColor={theme.colors.background}>
      <AppHeader title="Select Vet" rightComponent={<TouchableOpacity onPress={() => setFilterVisible(true)} activeOpacity={0.7}><MaterialCommunityIcons name="tune-variant" size={24} color={theme.colors.primaryDark} /></TouchableOpacity>} />

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search experts by name..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.introSection}>
          <AppText style={styles.introTitle} type="heading" weight="bold">Available Veterinarians</AppText>
        </View>

        {loading && <PawLoader fullScreen={false} />}

        {error && (
          <View style={styles.errorBox}>
            <AppText style={styles.errorText}>{error}</AppText>
            <TouchableOpacity onPress={fetchVets} style={styles.retryBtn}>
              <AppText style={styles.retryText} weight="bold">Retry</AppText>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && displayed.length === 0 && (
          <AppText style={styles.emptyText}>No vets found in your area yet.</AppText>
        )}

        <View style={styles.listContainer}>
          {displayed.map((vet) => (
            <ExpertCard
              key={vet.id}
              expert={vet}
              onView={() => setActiveModalExpert(vet)}
              onSelect={() => navigation.navigate('BookVendor', { ...route.params, expert: vet, total: vet.price, serviceType: 'Veterinary', visitType: route.params?.consultType || 'Clinic Visit' })}
              isSelected={selectedVet === vet.id}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, !selectedVet && { backgroundColor: theme.colors.textSecondary }]}
          disabled={!selectedVet}
          activeOpacity={0.8}
          onPress={() => {
            const vet = vets.find(w => w.id === selectedVet);
            navigation.navigate('BookVendor', { ...route.params, expert: vet, total: vet.price, serviceType: 'Veterinary', visitType: route.params?.consultType || 'Clinic Visit' });
          }}
        >
          <AppText style={styles.confirmBtnText} weight="bold">Continue with Vet</AppText>
        </TouchableOpacity>
      </View>

      <ExpertDetailsModal
        visible={!!activeModalExpert}
        expert={activeModalExpert}
        onClose={() => setActiveModalExpert(null)}
        onSelect={() => {
          setActiveModalExpert(null);
          navigation.navigate('BookVendor', { ...route.params, expert: activeModalExpert, total: activeModalExpert.price, serviceType: 'Veterinary', visitType: route.params?.consultType || 'Clinic Visit' });
        }}
      />

      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        initialSort={activeFilters.sort}
        initialTiers={activeFilters.tiers}
        onApply={(filters) => setActiveFilters(filters)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: 18, paddingRight: 24, paddingTop: 10, paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    ...theme.shadows.small,
  },
  headerTitle: { fontSize: 22, color: theme.colors.textBlack, fontFamily: theme.fonts.heading, flex: 1, marginLeft: -5 },
  filterButton: { padding: 4 },
  scrollContent: { paddingHorizontal: 24 },
  introSection: { marginTop: 16, marginBottom: 24 },
  introTitle: { fontSize: 18, color: theme.colors.textBlack, marginBottom: 6 },
  introSubtitle: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20 },
  listContainer: { gap: 16 },
  errorBox: { alignItems: 'center', marginTop: 40 },
  errorText: { color: theme.colors.error || 'red', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  retryBtn: { backgroundColor: theme.colors.primaryDark, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: theme.colors.white, fontSize: 14 },
  emptyText: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: 60, fontSize: 15 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 30,
  },
  confirmBtn: {
    backgroundColor: theme.colors.success, paddingVertical: 16,
    borderRadius: 16, alignItems: 'center',
  },
  confirmBtnText: { color: theme.colors.white, fontSize: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textBlack,
    paddingVertical: 0,
  },
});
