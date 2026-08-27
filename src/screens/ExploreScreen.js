import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions, FlatList, Image, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import AppHeader from '../components/AppHeader';
import { theme } from '../styles/theme';
import { articlesApi } from '../services/api';

const { width } = Dimensions.get('window');

export default function ExploreScreen({ navigation }) {
  const insets = useSafeAreaInsets ? useSafeAreaInsets() : { top: 40 };

  // Carousel Logic
  const [articles, setArticles] = useState([]);
  const featuredArticles = articles.filter(a => a.isFeatured);
  const regularArticles = articles.filter(a => !a.isFeatured);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await articlesApi.list();
        if (res && res.success) {
          setArticles(res.articles);
        }
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      }
    };
    fetchArticles();
  }, []);

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
    <AppScreen safeAreaTop={false} padding={false} backgroundColor="#F9F8F5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header Section */}
        <View style={[styles.header, { paddingTop: insets.top || 40 }]}>
          <AppHeader
            title="Explore"
            headerTheme="dark"
            style={{ paddingHorizontal: 0 }}
            rightComponent={
              <TouchableOpacity
                style={styles.notificationBtn}
                onPress={() => navigation.navigate('Notifications')}
              >
                <View style={styles.notificationIconWrapper}>
                  <Ionicons name="notifications-outline" size={20} color="#4A6B4B" />
                  <View style={styles.notificationBadge} />
                </View>
              </TouchableOpacity>
            }
          />

          {/* <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              placeholder=""
              style={styles.searchInput}
              placeholderTextColor="#999"
            />
          </View> */}
        </View>

        <View style={styles.content}>
          {/* Essentials Shop Section (Coming Soon) */}
          <View style={styles.sectionHeader}>
            <AppText type="heading" weight="bold" style={styles.sectionTitle}>Essentials Shop</AppText>
          </View>
          <View style={styles.shopCard}>
            <View style={styles.shopIconContainer}>
              <MaterialCommunityIcons name="shopping-outline" size={28} color="#FFF" />
            </View>
            <View style={styles.shopTextContainer}>
              <AppText style={styles.shopComingSoon} weight="bold">COMING SOON!</AppText>
              <AppText style={styles.shopDesc}>We're curating the products for your pet. Stay tuned!</AppText>
            </View>
          </View>

          {/* Tips & Articles Carousel */}
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
              getItemLayout={(data, index) => (
                { length: width, offset: width * index, index }
              )}
              onScrollToIndexFailed={(info) => {
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                  flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                });
              }}
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
            {regularArticles.map(article => (
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
    paddingTop: 10,
    paddingBottom: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    letterSpacing: 1,
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
  notificationIconWrapper: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4B4B',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
    marginRight: 30, // Balances the 20px icon + 10px margin on the left
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
  shopCard: {
    marginHorizontal: 20,
    backgroundColor: '#3D5668',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  shopIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  shopTextContainer: {
    flex: 1,
  },
  shopComingSoon: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 4,
  },
  shopDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 18,
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
