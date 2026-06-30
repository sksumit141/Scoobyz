import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Image, ScrollView, Dimensions, ActivityIndicator, FlatList, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AppText from './AppText';
import AppScreen from './AppScreen';
import { theme } from '../styles/theme';
import { BASE_URL, discoverApi } from '../services/api';
import { formatISTDate } from '../utils/date_utils';
import ScoobyzBadge from './ScoobyzBadge';

const { height, width } = Dimensions.get('window');

export default function ExpertDetailsModal({ visible, expert, onClose, onSelect }) {
  const [details, setDetails] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Services'); // 'Services', 'Gallery', 'Reviews'
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (visible && expert?.id) {
      fetchFullDetails();
    } else {
      setDetails(null);
      setPackages([]);
      setActiveTab('Services');
    }
  }, [visible, expert?.id]);

  const fetchFullDetails = async () => {
    try {
      setLoading(true);
      const [detailData, packagesData] = await Promise.all([
        discoverApi.groomerDetail(expert.id),
        discoverApi.groomerPackages(expert.id)
      ]);
      setDetails(detailData);
      setPackages(packagesData?.packages || []);
    } catch (error) {
      console.error('Fetch expert details error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!expert) return null;

  const renderServices = () => {
    if (loading) return <ActivityIndicator color={theme.colors.primaryDark} style={{ marginTop: 20 }} />;
    if (packages.length === 0) return <AppText style={styles.emptyText}>No services available.</AppText>;

    return packages.map((pkg, idx) => (
      <View key={idx} style={styles.serviceCard}>
        <View style={styles.serviceIconContainer}>
          <FontAwesome5 name="cut" size={20} color={theme.colors.primaryDark} />
        </View>
        <View style={styles.serviceInfo}>
          <AppText style={styles.serviceTitle} weight="bold">{pkg.serviceName}</AppText>
          {pkg.description ? <AppText style={styles.serviceDesc} numberOfLines={2}>{pkg.description}</AppText> : null}
        </View>
        <View style={styles.servicePrice}>
          <AppText style={{ fontSize: 10, color: '#718096', marginBottom: 2 }}>Starting at</AppText>
          <AppText style={styles.servicePriceText} weight="bold">₹ {pkg.price}</AppText>
        </View>
      </View>
    ));
  };

  const renderGallery = () => {
    if (loading) return <ActivityIndicator color={theme.colors.primaryDark} style={{ marginTop: 20 }} />;
    const gallery = details?.gallery || [];
    if (gallery.length === 0) return <AppText style={styles.emptyText}>No images in gallery.</AppText>;

    return (
      <View style={styles.galleryGrid}>
        {gallery.map((imgUrl, idx) => (
          <TouchableOpacity key={idx} onPress={() => setPreviewImage(imgUrl)} activeOpacity={0.9}>
            <Image source={{ uri: imgUrl }} style={styles.galleryImage} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReviews = () => {
    if (loading) return <ActivityIndicator color={theme.colors.primaryDark} style={{ marginTop: 20 }} />;
    const reviews = details?.reviews || [];
    if (reviews.length === 0) return <AppText style={styles.emptyText}>No reviews yet.</AppText>;

    return reviews.map((rev, idx) => (
      <View key={idx} style={styles.reviewCard}>
        <View style={styles.reviewTop}>
          <AppText weight="bold" style={styles.customerName}>{rev.customerName || 'Anonymous'}</AppText>
          <View style={styles.reviewRating}>
            <Ionicons name="star" size={12} color="#F1C40F" />
            <AppText style={styles.reviewRatingText}>{rev.rating}</AppText>
          </View>
        </View>
        <AppText style={styles.reviewComment}>{rev.comment}</AppText>
        <AppText style={styles.reviewDate}>
          {formatISTDate(rev.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
        </AppText>
      </View>
    ));
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <AppScreen style={styles.modalContainer} padding={false} scrollable={false}>
        {/* Header */}
        <SafeAreaView style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textBlack} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle} type="introTitle" weight="bold">Expert Profile</AppText>
        </SafeAreaView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Main Profile Card */}
          <View style={[styles.profileCard, { position: 'relative' }]}>
            {(expert.isCertified || expert.badge === 'Elite' || expert.badge === 'Pro' || expert.badge === 'Scoobyz Certified') && (
              <View style={styles.badgeContainer}>
                <ScoobyzBadge />
              </View>
            )}

            <View style={styles.imageWrapper}>
              <Image
                source={{
                  uri: (expert.profilePhoto || expert.image)
                    ? ((expert.profilePhoto || expert.image).startsWith('http')
                      ? (expert.profilePhoto || expert.image)
                      : `${BASE_URL}${expert.profilePhoto || expert.image}`)
                    : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop'
                }}
                style={styles.profileImage}
              />
            </View>
            <AppText style={styles.name} type="heading" weight="bold">{expert.name}</AppText>
            <AppText style={styles.title}>{expert.title || 'Expert'}</AppText>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <AppText style={styles.statValue} weight="bold">{details ? details.rating : (expert.rating || '0')}</AppText>
                <AppText style={styles.statLabel}>Ratings</AppText>
              </View>
              <View style={styles.statCard}>
                <AppText style={styles.statValue} weight="bold">{details ? details.reviewCount : (expert.reviews || '0')}</AppText>
                <AppText style={styles.statLabel}>Reviews</AppText>
              </View>
              <View style={styles.statCard}>
                <AppText style={styles.statValue} weight="bold">{details?.experience || expert.experience || '0'} yrs</AppText>
                <AppText style={styles.statLabel}>Experience</AppText>
              </View>
            </View>

            {/* About */}
            {details?.bio && (
              <View style={styles.aboutSection}>
                <AppText style={styles.aboutText} numberOfLines={3}>{details.bio}</AppText>
              </View>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {['Services', 'Gallery', 'Reviews'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
              >
                <AppText style={[styles.tabText, activeTab === tab && styles.tabTextActive]} weight="bold">
                  {tab}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'Services' && renderServices()}
            {activeTab === 'Gallery' && renderGallery()}
            {activeTab === 'Reviews' && renderReviews()}
          </View>

        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.bookBtn}
            activeOpacity={0.8}
            onPress={() => {
              onClose();
              onSelect();
            }}
          >
            <AppText style={styles.bookBtnText} weight="bold">Book Appointment</AppText>
          </TouchableOpacity>
        </View>

        {/* Image Preview Modal */}
        <Modal visible={!!previewImage} transparent={true} animationType="fade" onRequestClose={() => setPreviewImage(null)}>
          <View style={styles.previewContainer}>
            <TouchableOpacity style={styles.previewCloseBtn} onPress={() => setPreviewImage(null)}>
              <Ionicons name="close" size={30} color="#FFF" />
            </TouchableOpacity>
            {previewImage && <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />}
          </View>
        </Modal>

      </AppScreen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
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
  headerTitle: {
    fontSize: 20,
    color: theme.colors.textBlack,
    marginLeft: 16,
    fontFamily: theme.fonts.heading
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: theme.colors.white,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  imageWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 35, // Squircle look
    backgroundColor: theme.colors.surface,
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    transform: [{ rotate: '-15deg' }],
    zIndex: 999,
    elevation: 10,
  },
  name: {
    fontSize: 22,
    color: theme.colors.textBlack,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  statCard: {
    backgroundColor: theme.colors.surface, // Grey background for stats
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    color: theme.colors.textBlack,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.primaryDark,
  },
  aboutSection: {
    marginTop: 20,
  },
  aboutText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 6,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primaryDark, // Slate blue
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.white,
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  serviceIconContainer: {
    width: 44,
    height: 44,
    backgroundColor: theme.colors.surface, // Light grey squircle
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    color: theme.colors.textBlack,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  servicePrice: {
    marginLeft: 16,
    alignItems: 'flex-end',
  },
  servicePriceText: {
    fontSize: 16,
    color: theme.colors.textBlack,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  galleryImage: {
    width: (width - 50) / 2,
    height: (width - 50) / 2,
    borderRadius: 12,
    marginBottom: 10,
  },
  reviewCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 14,
    color: theme.colors.textBlack,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRatingText: {
    fontSize: 12,
    color: theme.colors.textBlack,
    fontWeight: 'bold',
  },
  reviewComment: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 18,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 11,
    color: theme.colors.textTertiary,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: 20,
    fontSize: 14,
  },
  footer: {
    backgroundColor: 'transparent', // Make background transparent to match design
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30, // for safe area
  },
  bookBtn: {
    backgroundColor: theme.colors.success, // Dark green matching the image
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  bookBtnText: {
    color: theme.colors.white,
    fontSize: 16,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  previewImage: {
    width: width,
    height: height * 0.8,
  },
});
