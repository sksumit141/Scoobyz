import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import ExpertCard from '../components/ExpertCard';
import ExpertDetailsModal from '../components/ExpertDetailsModal';
import FilterModal from '../components/FilterModal';
import AddressHeader from '../components/AddressHeader';
import { discoverApi } from '../services/api';
import { theme } from '../styles/theme';

export default function BoardingLocationScreen({ navigation }) {
  const route = useRoute();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeModalExpert, setActiveModalExpert] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ sort: null, tiers: [] });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await discoverApi.boarding();
      setLocations(data);
    } catch (err) {
      setError(err.message || 'Failed to load boarding locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const handleSelect = (location) => {
    setActiveModalExpert(null);
    setSelectedLocation(location.id);
    
    // Explicitly bundle everything we need for the next step
    const navigationParams = {
        ...(route?.params || {}),
        expert: location,
        serviceName: 'Boarding'
    };
    
    console.log('BoardingLocation: Navigating to MealSetup with', navigationParams);
    navigation.navigate('BoardingMealSetup', navigationParams);
  };

  const displayed = [...locations]
    .filter(l => {
      const matchesBadge = activeFilters.tiers.length === 0 || activeFilters.tiers.includes(l.badge);
      const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase());
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
        <AppText style={styles.headerTitle} type="heading" weight="bold">Select a Location</AppText>
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
          placeholder="Search locations by name..."
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

      <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
        <AddressHeader />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.introSection}>
          <AppText style={styles.introTitle} type="heading" weight="bold">Boarding Facilities</AppText>
          <AppText style={styles.introSubtitle}>Find a safe, caring home for your pet</AppText>
        </View>

        {loading && <ActivityIndicator size="large" color={theme.colors.primaryDark} style={{ marginTop: 40 }} />}

        {error && (
          <View style={styles.errorBox}>
            <AppText style={styles.errorText}>{error}</AppText>
            <TouchableOpacity onPress={fetchLocations} style={styles.retryBtn}>
              <AppText style={styles.retryText} weight="bold">Retry</AppText>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && displayed.length === 0 && (
          <AppText style={styles.emptyText}>No boarding facilities found in your area yet.</AppText>
        )}

        <View style={styles.listContainer}>
          {displayed.map((location) => (
             <TouchableOpacity
             key={location.id}
             onPress={() => setSelectedLocation(location.id)}
             activeOpacity={0.9}
           >
              <ExpertCard
                expert={location}
                isSelected={selectedLocation === location.id}
                onView={() => setActiveModalExpert(location)}
                onSelect={() => handleSelect(location)}
              />
           </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, !selectedLocation && { backgroundColor: theme.colors.textSecondary }]}
          disabled={!selectedLocation}
          activeOpacity={0.8}
          onPress={() => {
            const loc = locations.find(l => l.id === selectedLocation);
            handleSelect(loc);
          }}
        >
          <AppText style={styles.confirmBtnText} weight="bold">Continue</AppText>
        </TouchableOpacity>
      </View>

      <ExpertDetailsModal
        visible={!!activeModalExpert}
        expert={activeModalExpert}
        onClose={() => setActiveModalExpert(null)}
        onSelect={() => handleSelect(activeModalExpert)}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 24,
    paddingTop: 40,
    paddingBottom: 10,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    color: theme.colors.textBlack,
    fontFamily: theme.fonts.heading,
    marginLeft: -5,
    marginTop: 10
  },
  filterButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  introSection: {
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 24,
    color: theme.colors.textBlack,
    marginBottom: 4,
  },
  introSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  listContainer: {
    gap: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  confirmBtn: {
    backgroundColor: theme.colors.success,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: theme.colors.white,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  errorBox: {
    marginTop: 40,
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.error || '#D32F2F',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#f7f2fc',
    borderRadius: 12,
  },
  retryText: {
    color: theme.colors.primaryDark,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 24,
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
