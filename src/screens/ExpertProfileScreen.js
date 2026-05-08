import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from '../components/AppText';
import AppScreen from '../components/AppScreen';
import ExpertGallery from '../components/ExpertGallery';
import ExpertReviews from '../components/ExpertReviews';
import { theme } from '../styles/theme';
import { BASE_URL } from '../services/api';

const { width } = Dimensions.get('window');

export default function ExpertProfileScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState('Services');

  // Use passed expert data if available
  const passedExpert = route?.params?.expert;
  const expertInfo = passedExpert ? {
    ...passedExpert,
    image: passedExpert.profilePhoto || passedExpert.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop',
    rating: passedExpert.rating || 4.1,
    reviews: passedExpert.reviews || 958,
    experience: passedExpert.experience || '10 yrs'
  } : {
    name: 'Sarah Jenkens',
    title: 'Senior Groomer',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop',
    rating: 4.1,
    reviews: 958,
    experience: '10 yrs'
  };

  const servicesList = [
    { id: '1', title: 'Full Groom', description: 'Complete cut, bath, nail trim and styling', price: 1500, icon: 'content-cut' },
    { id: '2', title: 'Bath & Brush', description: 'Bath, blow dry & brushing', price: 899, icon: 'content-cut' },
    { id: '3', title: 'Nail Trimming', description: 'Trimming & Oiling', price: 350, icon: 'content-cut' }
  ];

  return (
    <AppScreen padding={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textBlack} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} type="heading" weight="bold">Expert Profile</AppText>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <Image 
            source={{ 
              uri: expertInfo.image.startsWith('http') 
                ? expertInfo.image 
                : `${BASE_URL}${expertInfo.image}` 
            }} 
            style={styles.avatar} 
          />
          <AppText style={styles.expertName} type="heading" weight="bold">{expertInfo.name}</AppText>
          <AppText style={styles.expertTitle}>{expertInfo.title}</AppText>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <AppText style={styles.statVal} weight="bold">{expertInfo.rating}</AppText>
              <AppText style={styles.statLabel}>Ratings</AppText>
            </View>
            <View style={styles.statBox}>
              <AppText style={styles.statVal} weight="bold">{expertInfo.reviews}</AppText>
              <AppText style={styles.statLabel}>Reviews</AppText>
            </View>
            <View style={styles.statBox}>
              <AppText style={styles.statVal} weight="bold">{expertInfo.experience}</AppText>
              <AppText style={styles.statLabel}>Experience</AppText>
            </View>
          </View>
        </View>

        {/* Navigation Tabs Card */}
        <View style={styles.tabsContainer}>
          {['Services', 'Gallery', 'Reviews'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <AppText style={[styles.tabText, isActive && styles.tabTextActive]} weight={isActive ? "bold" : "regular"}>
                  {tab}
                </AppText>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Dynamic Content based on Active Tab */}
        {activeTab === 'Services' && (
          <View style={styles.servicesList}>
            {servicesList.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <View style={styles.serviceIconBg}>
                  <MaterialCommunityIcons name={service.icon} size={20} color={theme.colors.textBlack} style={{ transform: [{ rotate: '270deg' }] }} />
                </View>
                <View style={styles.serviceInfo}>
                  <AppText style={styles.serviceTitle} weight="bold">{service.title}</AppText>
                  <AppText style={styles.serviceDesc}>{service.description}</AppText>
                </View>
                <View style={styles.servicePriceBlock}>
                  <AppText style={styles.startingAt}>Starting at</AppText>
                  <AppText style={styles.price} weight="bold">₹ {service.price}</AppText>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Gallery Tab */}
        {activeTab === 'Gallery' && <ExpertGallery />}

        {/* Reviews Tab */}
        {activeTab === 'Reviews' && <ExpertReviews />}

      </ScrollView>

      {/* Fixed Bottom CTA Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bookBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ExplorePackages', { expert: expertInfo })}
        >
          <AppText style={styles.bookBtnText} weight="bold">Book Appointment</AppText>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    color: theme.colors.textBlack,
    fontFamily: theme.fonts.heading,
    marginLeft: -5,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100, // padding for the sticky bottom bar
  },
  profileCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 24, // Squircle geometry
    marginBottom: 16,
    backgroundColor: '#E5E5E5',
  },
  expertName: {
    fontSize: 22,
    color: theme.colors.textBlack,
    marginBottom: 4,
    fontFamily: theme.fonts.heading,
  },
  expertTitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    color: theme.colors.textBlack,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#758A9F',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#526D82', // Slate dark blue
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.white,
  },
  servicesList: {
    gap: 16,
  },
  serviceItem: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  serviceIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 10,
  },
  serviceTitle: {
    fontSize: 15,
    color: theme.colors.textBlack,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  servicePriceBlock: {
    alignItems: 'center',
  },
  startingAt: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  price: {
    fontSize: 16,
    color: theme.colors.textBlack,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background, // Match screen background so it floats
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 30, // Safe area styling
  },
  bookBtn: {
    backgroundColor: '#4A6B4B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookBtnText: {
    color: theme.colors.white,
    fontSize: 16,
  },
});
