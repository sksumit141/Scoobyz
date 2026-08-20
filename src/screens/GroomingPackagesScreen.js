import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const PACKAGES = [
  {
    id: 'fresh_clean',
    title: 'Fresh & Clean',
    subtitle: 'Basic Grooming',
    image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&q=80',
    features: [
      'Bath and Blow Dry',
      'Brushing',
      'Ear Cleaning',
      'Nail Clipping',
      'Deodorizing Spray'
    ],
    pricing: {
      Small: { regular: 799, launch: 699 },
      Medium: { regular: 899, launch: 799 },
      Large: { regular: 999, launch: 899 },
    }
  },
  {
    id: 'signature_style',
    title: 'Signature Style',
    subtitle: 'Premium Grooming',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&q=80',
    features: [
      'Everything in Fresh & Clean, plus:',
      'Hygiene Trim',
      'Paw Care',
      'Face Trim',
      'Salon Finish'
    ],
    pricing: {
      Small: { regular: 1499, launch: 1299 },
      Medium: { regular: 1699, launch: 1499 },
      Large: { regular: 1899, launch: 1699 },
    }
  },
  {
    id: 'royal_pamper',
    title: 'Royal Pamper',
    subtitle: 'Full Grooming',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&q=80',
    features: [
      'Everything in Signature Style, plus:',
      'Full Breed Haircut',
      'Premium Shampoo',
      'Premium Conditioner',
      'Paw Butter',
      'Luxury Finish'
    ],
    pricing: {
      Small: { regular: 1799, launch: 1499 },
      Medium: { regular: 1999, launch: 1699 },
      Large: { regular: 2299, launch: 1899 },
    }
  }
];

export default function GroomingPackagesScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { pet, ...otherParams } = route.params || {};
  const petSize = pet?.size || 'Medium';

  const handleSelectPackage = (pkg) => {
    // Navigate to ExplorePackagesScreen in "Standard Grooming" mode
    navigation.navigate('ExplorePackages', {
      ...otherParams,
      pet,
      isScoobyzGrooming: true,
      selectedPackage: pkg,
      petSize
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max((insets.top || 40) - 10, 20) }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={28} color={theme.colors.white} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle} type="heading" weight="bold">Select a Package</AppText>
        </View>
        <AppText style={styles.headerSubtitle}>
          Choose the best grooming package for your {petSize} pet.
        </AppText>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {PACKAGES.map((pkg) => {
          const prices = pkg.pricing[petSize] || pkg.pricing.Medium;
          return (
            <TouchableOpacity 
              key={pkg.id} 
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => handleSelectPackage(pkg)}
            >
              <Image source={{ uri: pkg.image }} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <AppText style={styles.cardTitle} weight="bold">{pkg.title}</AppText>
                    <AppText style={styles.cardSubtitle}>{pkg.subtitle}</AppText>
                  </View>
                  <View style={styles.priceContainer}>
                    <AppText style={styles.regularPrice}>₹{prices.regular}</AppText>
                    <AppText style={styles.launchPrice} weight="bold">₹{prices.launch}</AppText>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.featuresList}>
                  {pkg.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.primaryDark} style={{ marginTop: 2 }} />
                      <AppText style={styles.featureText}>{feature}</AppText>
                    </View>
                  ))}
                </View>
                <View style={styles.selectBtn}>
                  <AppText style={styles.selectBtnText} weight="bold">View & Select</AppText>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  header: {
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...theme.shadows?.small,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 12,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    ...theme.shadows?.medium,
  },
  cardImage: {
    width: '100%',
    height: 140,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 18,
    color: theme.colors.textBlack,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: theme.colors.primaryDark,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  regularPrice: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  launchPrice: {
    fontSize: 20,
    color: theme.colors.textBlack,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  selectBtn: {
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectBtnText: {
    color: theme.colors.primaryDark,
    fontSize: 15,
  }
});
