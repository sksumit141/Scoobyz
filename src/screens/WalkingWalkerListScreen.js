import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import ExpertCard from '../components/ExpertCard';
import ExpertDetailsModal from '../components/ExpertDetailsModal';
import FilterModal from '../components/FilterModal';
import { discoverApi } from '../services/api';
import { theme } from '../styles/theme';

export default function WalkingWalkerListScreen({ navigation, route }) {
  const { duration = '45 min' } = route.params || {};
  const [walkers, setWalkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWalker, setSelectedWalker] = useState(null);
  const [activeModalExpert, setActiveModalExpert] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ sort: null, tiers: [] });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWalkers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await discoverApi.walkers({ duration });
      setWalkers(data);
    } catch (err) {
      setError(err.message || 'Failed to load walkers');
    } finally {
      setLoading(false);
    }
  }, [duration]);

  useEffect(() => { fetchWalkers(); }, [fetchWalkers]);

  const displayed = [...walkers]
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
    <AppScreen safeArea={true} padding={false} scrollable={false} backgroundColor={theme.colors.background}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textBlack} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} type="heading" weight="bold">Select Walker</AppText>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
          <MaterialCommunityIcons
            name="tune-variant"
            size={24}
            color={(activeFilters.tiers.length > 0 || activeFilters.sort) ? theme.colors.primaryDark : theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

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
          <AppText style={styles.introTitle} type="heading" weight="bold">Available Walkers</AppText>
        </View>

        {loading && <ActivityIndicator size="large" color={theme.colors.primaryDark} style={{ marginTop: 40 }} />}

        {error && (
          <View style={styles.errorBox}>
            <AppText style={styles.errorText}>{error}</AppText>
            <TouchableOpacity onPress={fetchWalkers} style={styles.retryBtn}>
              <AppText style={styles.retryText} weight="bold">Retry</AppText>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && displayed.length === 0 && (
          <AppText style={styles.emptyText}>No walkers found in your area yet.</AppText>
        )}

        <View style={styles.listContainer}>
          {displayed.map((walker) => (
            <ExpertCard
              key={walker.id}
              expert={walker}
              onView={() => setActiveModalExpert(walker)}
              onSelect={() => {
                const multiplier = route.params?.frequency === 'Weekly' ? 7 : (route.params?.frequency === 'Monthly' ? 25 : 1);
                const timesPerDay = route.params?.timesPerDay || 1;
                const newTotal = (Number(walker.price) || 0) * multiplier * timesPerDay;
                navigation.navigate('BookVendor', { ...route.params, expert: walker, total: newTotal, serviceType: 'Walking' });
              }}
              isSelected={selectedWalker === walker.id}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, !selectedWalker && { backgroundColor: theme.colors.textSecondary }]}
          disabled={!selectedWalker}
          activeOpacity={0.8}
          onPress={() => {
            const walker = walkers.find(w => w.id === selectedWalker);
            navigation.navigate('BookVendor', { ...route.params, expert: walker, serviceType: 'Walking' });
          }}
        >
          <AppText style={styles.confirmBtnText} weight="bold">Continue with Walker</AppText>
        </TouchableOpacity>
      </View>

      <ExpertDetailsModal
        visible={!!activeModalExpert}
        expert={activeModalExpert}
        onClose={() => setActiveModalExpert(null)}
        onSelect={() => {
          const multiplier = route.params?.frequency === 'Weekly' ? 7 : (route.params?.frequency === 'Monthly' ? 25 : 1);
          const timesPerDay = route.params?.timesPerDay || 1;
          const newTotal = (Number(activeModalExpert.price) || 0) * multiplier * timesPerDay;
          setActiveModalExpert(null);
          navigation.navigate('BookVendor', { ...route.params, expert: activeModalExpert, total: newTotal, serviceType: 'Walking' });
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
    paddingLeft: 18, paddingRight: 24, paddingTop: 40, paddingBottom: 10,
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
    marginBottom: 8,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textBlack,
    paddingVertical: 0,
  },
});
