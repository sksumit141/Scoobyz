import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Image, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import { theme } from '../styles/theme';
import { BASE_URL, discoverApi } from '../services/api';
import { formatISTDate } from '../utils/date_utils';

import ScoobyzBadge from './ScoobyzBadge';

const { height, width } = Dimensions.get('window');

export default function ExpertDetailsModal({ visible, expert, onClose, onSelect }) {
  const [details, setDetails] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (visible && expert?.id) {
      fetchFullDetails();
    } else {
      details && setDetails(null);
    }
  }, [visible, expert?.id]);

  const fetchFullDetails = async () => {
    try {
      setLoading(true);
      const data = await discoverApi.groomerDetail(expert.id);
      setDetails(data);
    } catch (error) {
      console.error('Fetch expert details error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!expert) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />

        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={theme.colors.textBlack} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            <View style={styles.imageWrapper}>
              <Image
                source={{
                  uri: (expert.profilePhoto || expert.image)
                    ? ((expert.profilePhoto || expert.image).startsWith('http')
                      ? (expert.profilePhoto || expert.image)
                      : `${BASE_URL}${expert.profilePhoto || expert.image}`)
                    : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop'
                }}
                style={styles.largeImage}
              />
              {(expert.isCertified || expert.badge === 'Elite' || expert.badge === 'Pro' || expert.badge === 'Scoobyz Certified') && (
                <View style={{ position: 'absolute', bottom: -12, left: 0, right: 0, alignItems: 'center' }}>
                  <ScoobyzBadge />
                </View>
              )}
            </View>

            <View style={styles.headerInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <AppText style={styles.name} type="heading" weight="bold">{expert.name}</AppText>
                {(expert.isCertified || expert.badge === 'Elite' || expert.badge === 'Pro' || expert.badge === 'Scoobyz Certified') && (
                  <ScoobyzBadge />
                )}
              </View>
              <AppText style={styles.title}>{expert.title}</AppText>
            </View>


            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={18} color={theme.colors.textBlack} />
                <AppText style={styles.statValue} weight="bold">{details ? details.rating : (expert.rating || '0')}</AppText>
                <AppText style={styles.statLabel}>Rating</AppText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="chatbubble-outline" size={18} color={theme.colors.textBlack} />
                <AppText style={styles.statValue} weight="bold">{details ? details.reviewCount : (expert.reviews || '0')}</AppText>
                <AppText style={styles.statLabel}>Reviews</AppText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="pricetag-outline" size={18} color={theme.colors.textBlack} />
                <AppText style={styles.statValue} weight="bold">₹ {expert.price}</AppText>
                <AppText style={styles.statLabel}>Starting</AppText>
              </View>
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle} type="heading" weight="600">About</AppText>
              <AppText style={styles.aboutText}>
                {details?.bio || `${expert.name} is a professional providing top-tier services. With extensive experience and a genuine love for animals, they ensure your pet's needs are met with the highest standards of care.`}
              </AppText>
            </View>

            {details?.tags && details.tags.length > 0 && (
              <View style={styles.section}>
                <AppText style={styles.sectionTitle} type="heading" weight="600">Specialties</AppText>
                <View style={styles.tagsContainer}>
                  {details.tags.split(',').map((tag, i) => (
                    <View key={i} style={styles.tag}>
                      <AppText style={styles.tagText}>{tag.trim()}</AppText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Reviews Section */}
            <View style={styles.section}>
              <AppText style={styles.sectionTitle} type="heading" weight="600">Recent Reviews</AppText>
              {loading ? (
                <ActivityIndicator color={theme.colors.primaryDark} style={{ marginTop: 10 }} />
              ) : details?.reviews?.length > 0 ? (
                details.reviews.map((rev, idx) => (
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
                ))
              ) : (
                <AppText style={styles.noReviews}>No reviews yet.</AppText>
              )}
            </View>

          </ScrollView>

          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.selectBtn}
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onSelect();
              }}
            >
              <AppText style={styles.selectBtnText} weight="bold">Select Context</AppText>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.85,
    paddingTop: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 16,
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  imageWrapper: {
    alignItems: 'center',
    marginVertical: 24,
  },
  largeImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E5E5E5',
    borderWidth: 4,
    borderColor: theme.colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  proBadge: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#526D82',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  proText: {
    color: theme.colors.white,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    color: theme.colors.textBlack,
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    color: theme.colors.textBlack,
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#EAEAEC',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: theme.colors.textBlack,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 30, // Safe area
    paddingTop: 16,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  selectBtn: {
    backgroundColor: '#4A6B4B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectBtnText: {
    color: theme.colors.white,
    fontSize: 16,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
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
  noReviews: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  }
});
