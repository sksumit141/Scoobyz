import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions, FlatList, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import PackageCard from '../components/PackageCard';
import ExpertCard from '../components/ExpertCard';
import { theme } from '../styles/theme';
import { MOCK_ARTICLES } from './ArticlesScreen';

const { width } = Dimensions.get('window');

const MOCK_PACKAGES = [
  {
    id: 'p1',
    name: 'Premium Spa & Bath',
    price: 999,
    rating: 4.8,
    reviews: 124,
    features: ['Deep Cleaning Bath', 'Nail Trimming', 'Ear Cleaning', 'Blow Dry'],
    isPopular: true
  },
  {
    id: 'p2',
    name: 'Standard Grooming',
    price: 699,
    rating: 4.5,
    reviews: 89,
    features: ['Shampoo Bath', 'Brush Out', 'Nail Trimming'],
    isPopular: false
  }
];

const MOCK_WALKERS = [
  {
    id: 'w1',
    name: 'Rajeev Kumar',
    role: 'Certified Dog Walker',
    rating: 4.9,
    reviews: 210,
    price: 150,
    tier: 'Premium',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'w2',
    name: 'Amit Singh',
    role: 'Experienced Walker',
    rating: 4.7,
    reviews: 145,
    price: 120,
    tier: 'Standard',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300'
  }
];

const MOCK_VETS = [
  {
    id: 'v1',
    name: 'Dr. Sarah Jenkins',
    role: 'Senior Veterinarian',
    rating: 4.9,
    reviews: 320,
    price: 500,
    tier: 'Premium',
    image: 'https://images.unsplash.com/photo-1594824436998-d4052e424260?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'v2',
    name: 'Paws Care Clinic',
    role: 'Veterinary Clinic',
    rating: 4.8,
    reviews: 198,
    price: 350,
    tier: 'Standard',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=300'
  }
];

export default function ExploreScreen({ navigation }) {
  const insets = useSafeAreaInsets ? useSafeAreaInsets() : { top: 40 };

  // Carousel Logic
  const featuredArticles = MOCK_ARTICLES.filter(a => a.isFeatured);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (featuredArticles.length === 0) return;
    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= featuredArticles.length) nextIndex = 0;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeIndex, featuredArticles.length]);

  const renderFeaturedItem = ({ item }) => (
    <TouchableOpacity
      style={styles.featuredCard}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('ArticleDetail', { article: item })}
    >
      <Image source={{ uri: item.featuredImage || item.image }} style={styles.featuredImage} />
      <View style={styles.featuredOverlay}>
        <AppText style={styles.featuredTitle} weight="bold">{item.featuredTitle || item.title}</AppText>
      </View>
    </TouchableOpacity>
  );

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  return (
    <AppScreen safeArea={false} padding={false} backgroundColor="#F9F8F5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header Section */}
        <View style={[styles.header, { paddingTop: insets.top || 40 }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => navigation.openDrawer ? navigation.openDrawer() : navigation.goBack()}
            >
              <Ionicons name={navigation.openDrawer ? "menu" : "arrow-back"} size={26} color={theme.colors.white} />
            </TouchableOpacity>

            <AppText style={styles.headerTitle} type="heading" weight="bold">Explore</AppText>

            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={20} color="#4A6B4B" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Featured Articles Carousel */}
          <View style={styles.sectionHeader}>
            <AppText type="heading" weight="bold" style={styles.sectionTitle}>Tips & Articles</AppText>
            <TouchableOpacity onPress={() => navigation.navigate('Articles')}>
              <AppText style={styles.viewAllText}>View All</AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={featuredArticles}
              renderItem={renderFeaturedItem}
              keyExtractor={item => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScroll}
            />
            <View style={styles.pagination}>
              {featuredArticles.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, activeIndex === index && styles.activeDot]}
                />
              ))}
            </View>
          </View>

          {/* Top Rated Grooming Packages */}
          <View style={styles.sectionHeader}>
            <AppText type="heading" weight="bold" style={styles.sectionTitle}>Top Grooming Packages</AppText>
            <TouchableOpacity onPress={() => navigation.navigate('SlotSelect', { serviceName: 'Grooming' })}>
              <AppText style={styles.viewAllText}>View All</AppText>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {MOCK_PACKAGES.map(pkg => (
              <View key={pkg.id} style={styles.horizontalCardWrapper}>
                <PackageCard
                  pkg={pkg}
                  onAdd={() => navigation.navigate('SlotSelect', { serviceName: 'Grooming', selectedPackage: pkg })}
                />
              </View>
            ))}
          </ScrollView>

          {/* Top Walkers */}
          <View style={styles.sectionHeader}>
            <AppText type="heading" weight="bold" style={styles.sectionTitle}>Top Walkers</AppText>
            <TouchableOpacity onPress={() => navigation.navigate('WalkingService', { serviceName: 'Walking' })}>
              <AppText style={styles.viewAllText}>View All</AppText>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {MOCK_WALKERS.map(walker => (
              <View key={walker.id} style={styles.horizontalExpertWrapper}>
                <ExpertCard
                  expert={walker}
                  onSelect={() => navigation.navigate('WalkingService', { serviceName: 'Walking' })}
                />
              </View>
            ))}
          </ScrollView>

          {/* Top Veterinarians */}
          <View style={styles.sectionHeader}>
            <AppText type="heading" weight="bold" style={styles.sectionTitle}>Top Veterinarians</AppText>
            <TouchableOpacity onPress={() => navigation.navigate('VetService', { serviceName: 'Veterinary' })}>
              <AppText style={styles.viewAllText}>View All</AppText>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {MOCK_VETS.map(vet => (
              <View key={vet.id} style={styles.horizontalExpertWrapper}>
                <ExpertCard
                  expert={vet}
                  onSelect={() => navigation.navigate('VetService', { serviceName: 'Veterinary' })}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#526D82',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#222',
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
  },
  horizontalScroll: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  horizontalCardWrapper: {
    width: width * 0.75, // Take up 75% of screen width so next card peeks
  },
  horizontalExpertWrapper: {
    width: width * 0.85, // Expert cards are a bit wider
  },
  carouselContainer: {
    marginBottom: 20,
  },
  featuredCard: {
    width: width,
    paddingHorizontal: 20,
    height: 200,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  featuredOverlay: {
    position: 'absolute',
    top: 0, left: 20, right: 20, bottom: 0,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.4)',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  featuredTitle: {
    fontSize: 24,
    color: '#2A4A6D',
    width: '60%',
    lineHeight: 30,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CCC',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#666',
  }
});
