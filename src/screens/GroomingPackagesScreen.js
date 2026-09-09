import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

import { discoverApi } from '../services/api';

export default function GroomingPackagesScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { pet, ...otherParams } = route.params || {};
  const petSize = pet?.size || 'Medium';

  const [packages, setPackages] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await discoverApi.scoobyzPackages();
        if (response.data && response.data.packages) {
          setPackages(response.data.packages);
        }
      } catch (error) {
        console.error('Failed to fetch grooming packages:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

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

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <AppText>Loading packages...</AppText>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {packages.map((pkg) => {
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
      )}
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
