import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, TextInput } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppText from '../components/AppText';
import ExpertCard from '../components/ExpertCard';
import ExpertDetailsModal from '../components/ExpertDetailsModal';
import FilterModal from '../components/FilterModal';
import { discoverApi } from '../services/api';
import { theme } from '../styles/theme';

export default function SelectCompanyScreen({ navigation, route }) {
  const serviceName = route.params?.serviceName || 'Grooming';
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ sort: null, tiers: [] });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Pool vendors (companies) by service
      const data = await discoverApi.byService(serviceName);
      // Filter for businesses only as this is the company screen
      setCompanies(data.filter(v => v.type === 'business'));
    } catch (err) {
      setError(err.message || `Failed to load ${serviceName} studios`);
    } finally {
      setLoading(false);
    }
  }, [serviceName]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const displayed = [...companies]
    .filter(c => {
      const matchesBadge = activeFilters.tiers.length === 0 || activeFilters.tiers.includes(c.badge);
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textBlack} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} type="heading" weight="bold">Select {serviceName} Studio</AppText>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
          <MaterialCommunityIcons
            name="tune-variant"
            size={24}
            color={(activeFilters.tiers.length > 0 || activeFilters.sort) ? theme.colors.primaryDark : theme.colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search studios by name..."
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

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.introSection}>
          <AppText style={styles.introTitle} type="heading" weight="bold">{serviceName} Studios</AppText>
          <AppText style={styles.introSubtitle}>Choose a professional studio near you</AppText>
        </View>

        {loading && <ActivityIndicator size="large" color={theme.colors.primaryDark} style={{ marginTop: 40 }} />}

        {error && (
          <View style={styles.errorBox}>
            <AppText style={styles.errorText}>{error}</AppText>
            <TouchableOpacity onPress={fetchCompanies} style={styles.retryBtn}>
              <AppText style={styles.retryText} weight="bold">Retry</AppText>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && displayed.length === 0 && (
          <AppText style={styles.emptyText}>No studios found in your area yet.</AppText>
        )}

        <View style={styles.listContainer}>
          {displayed.map((company) => (
            <ExpertCard
              key={company.id}
              expert={company}
              onView={() => setSelectedExpert(company)}
              onSelect={() => navigation.navigate('ExplorePackages', { expert: company, ...route.params })}
            />
          ))}
        </View>
      </ScrollView>

      <ExpertDetailsModal
        visible={!!selectedExpert}
        expert={selectedExpert}
        onClose={() => setSelectedExpert(null)}
        onSelect={() => {
          setSelectedExpert(null);
          navigation.navigate('ExplorePackages', { expert: selectedExpert, ...route.params });
        }}
      />

      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        initialSort={activeFilters.sort}
        initialTiers={activeFilters.tiers}
        onApply={(filters) => setActiveFilters(filters)}
      />
    </SafeAreaView>
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
