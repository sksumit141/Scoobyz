import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

export const MOCK_ARTICLES = [
  {
    id: '1',
    title: 'Pet Care Basics',
    subtitle: 'A simple guide to safely groom your dog without stress.',
    readTime: '10 min read',
    date: '25 Mar, 2026',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=300',
    content: 'Grooming your dog at home can be a rewarding experience. It builds trust and keeps your dog healthy. Start with a calm environment and the right tools. Brush their coat gently, check their ears, and trim their nails carefully. Remember to reward them with treats to create positive associations with grooming.',
    isFeatured: true,
    featuredTitle: 'Top Pet Care Trends in India',
    featuredImage: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '2',
    title: 'New Puppy Guide',
    subtitle: 'Everything you need to know about welcoming a new puppy.',
    readTime: '3 min read',
    date: '25 Mar, 2026',
    image: 'https://images.unsplash.com/photo-1591160690555-5debfba289f0?auto=format&fit=crop&q=80&w=300',
    content: 'Bringing a new puppy home is exciting! First, puppy-proof your house. Establish a routine early on for feeding, potty breaks, and playtime. Socialization is key in the first few months. Introduce them to new sounds, people, and other pets safely.',
    isFeatured: false,
  },
  {
    id: '3',
    title: 'Nutrition 101',
    subtitle: 'Understanding the best diet for your growing pet.',
    readTime: '8 min read',
    date: '22 Mar, 2026',
    image: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&q=80&w=300',
    content: 'A balanced diet is crucial for a healthy dog. Look for high-quality proteins and avoid excessive fillers like corn and soy. Consult your vet to determine the right portion sizes based on your dog\'s age, breed, and activity level.',
    isFeatured: true,
    featuredTitle: 'Healthy Diets for Active Dogs',
    featuredImage: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '4',
    title: 'Senior Dog Care',
    subtitle: 'Special considerations for your aging companion.',
    readTime: '5 min read',
    date: '20 Mar, 2026',
    image: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=300',
    content: 'As dogs age, their needs change. They may require softer beds, ramps to avoid jumping, and modified exercise routines. Regular vet check-ups become even more important to catch and manage age-related conditions like arthritis early.',
    isFeatured: false,
  },
  {
    id: '5',
    title: 'Training Tips',
    subtitle: 'Mastering basic commands with positive reinforcement.',
    readTime: '7 min read',
    date: '18 Mar, 2026',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=300',
    content: 'Positive reinforcement is the most effective training method. Use treats and praise to reward good behavior. Keep training sessions short (5-10 minutes) and fun. Consistency is key when teaching commands like sit, stay, and come.',
    isFeatured: false,
  }
];

export default function ArticlesScreen({ navigation }) {
  const insets = useSafeAreaInsets ? useSafeAreaInsets() : { top: 40 };
  const featuredArticles = MOCK_ARTICLES.filter(a => a.isFeatured);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  // Auto-scroll logic for the featured carousel
  useEffect(() => {
    if (featuredArticles.length === 0) return;
    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= featuredArticles.length) {
        nextIndex = 0;
      }
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }, 4000); // Change slide every 4 seconds

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
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top || 40 }]}>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={theme.colors.textBlack} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} type="heading" weight="bold">Tips & Articles</AppText>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Featured Carousel */}
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

        {/* List of Articles */}
        <View style={styles.listContainer}>
          {MOCK_ARTICLES.map(article => (
            <TouchableOpacity 
              key={article.id} 
              style={styles.articleCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ArticleDetail', { article })}
            >
              <Image source={{ uri: article.image }} style={styles.articleImage} />
              <View style={styles.articleInfo}>
                <AppText style={styles.metaText}>{article.readTime}  •  {article.date}</AppText>
                <AppText style={styles.titleText} weight="bold" numberOfLines={1}>{article.title}</AppText>
                <AppText style={styles.subtitleText} numberOfLines={2}>{article.subtitle}</AppText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#F9F8F5',
  },
  headerTitle: {
    fontSize: 22,
    color: theme.colors.textBlack,
    marginLeft: 15,
  },
  carouselContainer: {
    marginBottom: 20,
  },
  featuredCard: {
    width: width,
    paddingHorizontal: 20,
    height: 220,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  featuredOverlay: {
    position: 'absolute',
    top: 0, left: 20, right: 20, bottom: 0,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.4)',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  featuredTitle: {
    fontSize: 28,
    color: '#2A4A6D',
    width: '60%',
    lineHeight: 34,
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
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  articleCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  articleImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginRight: 16,
  },
  articleInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  metaText: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 16,
    color: '#222',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  }
});
