import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

export default function ArticleDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets ? useSafeAreaInsets() : { top: 40 };
  const { article } = route.params || {};

  if (!article) {
    return (
      <AppScreen safeAreaTop={false} padding={false} backgroundColor="#F9F8F5">
        <View style={[styles.header, { paddingTop: insets.top || 40 }]}>
          <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color={theme.colors.textBlack} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <AppText>Article not found.</AppText>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen safeAreaTop={false} padding={false} backgroundColor="#F9F8F5">
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top || 40 }]}>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={theme.colors.textBlack} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} type="heading" weight="bold">Article</AppText>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Article Hero Image */}
        <Image source={{ uri: article.featuredImage || article.image }} style={styles.heroImage} />
        
        {/* Article Content */}
        <View style={styles.contentContainer}>
          <AppText style={styles.metaText}>{article.readTime}  •  {article.date}</AppText>
          <AppText style={styles.titleText} type="heading" weight="bold">{article.title}</AppText>
          
          <View style={styles.divider} />
          
          <AppText style={styles.bodyText}>
            {article.content}
          </AppText>
          
          {/* Mock additional paragraphs to simulate a longer article */}
          <AppText style={[styles.bodyText, { marginTop: 16 }]}>
            Consistency is key. Whether you're grooming, training, or focusing on nutrition, building a routine helps your dog understand what to expect. Always ensure you consult with your veterinarian before making major changes to your dog's diet or healthcare routine.
          </AppText>
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
  heroImage: {
    width: width,
    height: 250,
  },
  contentContainer: {
    padding: 24,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30, // overlap image slightly
    minHeight: Dimensions.get('window').height - 250,
  },
  metaText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  titleText: {
    fontSize: 26,
    color: '#222',
    lineHeight: 34,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 26,
    fontFamily: theme.fonts.regular,
  }
});
