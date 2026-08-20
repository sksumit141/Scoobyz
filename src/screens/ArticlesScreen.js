import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { articlesApi } from '../services/api';

const { width } = Dimensions.get('window');



export default function ArticlesScreen({ navigation }) {
  const insets = useSafeAreaInsets ? useSafeAreaInsets() : { top: 40 };
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
    <AppScreen safeAreaTop={false} padding={false} backgroundColor="#F9F8F5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top || 40 }}>
        
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
