import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
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

export default function WalkingWalkerListScreen({ navigation, route }) {
  // total is pre-computed by WalkingServiceScreen using Scoobyz static pricing
  const { total: routeTotal = 0 } = route.params || {};
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
      // Fetch all walking vendors - no duration/price filter since pricing is Scoobyz-fixed
      const data = await discoverApi.walkers({});
      setWalkers(data);
    } catch (err) {
      setError(err.message || 'Failed to load walkers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWalkers(); }, [fetchWalkers]);

  const displayed = [...walkers]
    .filter(w => {
      const matchesBadge = activeFilters.tiers.length === 0 || activeFilters.tiers.includes(w.badge);
      const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesBadge && matchesSearch;
    })
    .sort((a, b) => {
      if (activeFilters.sort === 'rating_desc') return Number(b.rating) - Number(a.rating);
      if (activeFilters.sort === 'reviews_desc') return Number(b.reviews) - Number(a.reviews);
      return 0;
    });

  const navigateToBook = (walker) => {
    navigation.navigate('BookVendor', {
      ...route.params,
      expert: walker,
      total: routeTotal,
      serviceType: 'Walking',
    });
  };

  return (
    <AppScreen safeAreaTop={true} padding={false} scrollable={false} backgroundColor={theme.colors.background}>
      <AppHeader
        title="Select Walker"
        rightComponent={
          <TouchableOpacity onPress={() => setFilterVisible(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="tune-variant" size={24} color={theme.colors.primaryDark} />
          </TouchableOpacity>
        }
      />

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search walkers by name..."
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

      {/* Price info banner */}
      {routeTotal > 0 && (
        <View style={styles.priceBanner}>
          <MaterialCommunityIcons name="tag-outline" size={16} color={theme.colors.primaryDark} />
          <AppText style={styles.priceBannerText}>
            Scoobyz price: <AppText weight="bold" style={{ color: theme.colors.primaryDark }}>₹{routeTotal}</AppText> — same for all walkers
          </AppText>
        </View>
      )}

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.introSection}>
          <AppText style={styles.introTitle} type="heading" weight="bold">Available Walkers</AppText>
        </View>

        {loading && <PawLoader fullScreen={false} />}

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
              expert={{ ...walker, price: routeTotal > 0 ? String(routeTotal) : walker.price }}
              onView={() => setActiveModalExpert(walker)}
              onSelect={() => navigateToBook(walker)}
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
            navigateToBook(walker);
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
          setActiveModalExpert(null);
          navigateToBook(activeModalExpert);
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
  priceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight || '#F0F4FF',
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
  },
  priceBannerText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  scrollContent: { paddingHorizontal: 24 },
  introSection: { marginTop: 16, marginBottom: 24 },
  introTitle: { fontSize: 18, color: theme.colors.textBlack, marginBottom: 6 },
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
});
