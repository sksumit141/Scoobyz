import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { reviewsApi } from '../services/api';
import { useBackHandler } from '../hooks/useBackHandler';
import PawLoader from '../components/PawLoader';

const { width } = Dimensions.get('window');

export default function ViewSubmittedReviewScreen({ navigation, route }) {
    const { bookingId, vendorName, vendorImage, petName } = route.params || {};
    const insets = useSafeAreaInsets ? useSafeAreaInsets() : { top: 40 };

    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);

    const { handleBack } = useBackHandler();

    useEffect(() => {
        fetchReview();
    }, [bookingId]);

    const fetchReview = async () => {
        try {
            // Fetch the review from the backend using the new endpoint
            const data = await reviewsApi.getByBookingId(bookingId);
            setReview(data);
        } catch (error) {
            console.error('Fetch review error:', error);
            // Review not found - this is okay, just show empty state
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= rating ? 'star' : 'star-outline'}
                    size={28}
                    color="#F5A623"
                />
            );
        }
        return stars;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return new Intl.DateTimeFormat('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            }).format(d);
        } catch {
            return '';
        }
    };

    if (loading) {
        return (
            <AppScreen safeAreaTop={false} padding={false} backgroundColor={theme.colors.background}>
                <View style={[styles.header, { paddingTop: insets.top || 40 }]}>
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.textBlack} />
                    </TouchableOpacity>
                    <AppText style={styles.headerTitle} type="heading" weight="bold">
                        Your Review
                    </AppText>
                </View>
                <View style={styles.loadingContainer}>
                    <PawLoader fullScreen={false} />
                </View>
            </AppScreen>
        );
    }

    if (!review) {
        return (
            <AppScreen safeAreaTop={false} padding={false} backgroundColor={theme.colors.background}>
                <View style={[styles.header, { paddingTop: insets.top || 40 }]}>
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.textBlack} />
                    </TouchableOpacity>
                    <AppText style={styles.headerTitle} type="heading" weight="bold">
                        Your Review
                    </AppText>
                </View>
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={64} color="#CBD5E0" />
                    <AppText style={styles.emptyText}>No review found</AppText>
                    <AppText style={styles.emptySubtext}>
                        You haven't submitted a review for this booking yet.
                    </AppText>
                </View>
            </AppScreen>
        );
    }

    const displayVendorName = vendorName || 'Your Service Provider';
    const displayPetName = petName || 'your pet';
    const displayVendorImage =
        vendorImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop';

    return (
        <AppScreen safeAreaTop={false} padding={false} backgroundColor={theme.colors.background}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top || 40 }]}>
                <TouchableOpacity
                    onPress={handleBack}
                    style={styles.backBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textBlack} />
                </TouchableOpacity>
                <AppText style={styles.headerTitle} type="heading" weight="bold">
                    Your Review
                </AppText>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Vendor Profile */}
                <View style={styles.profileSection}>
                    <Image source={{ uri: displayVendorImage }} style={styles.profileImage} />
                    <AppText style={styles.vendorName} type="heading" weight="bold">
                        {displayVendorName}
                    </AppText>
                    <AppText style={styles.reviewDate}>
                        Reviewed on {formatDate(review.createdAt)}
                    </AppText>
                </View>

                {/* Rating Display */}
                <View style={styles.ratingCard}>
                    <AppText style={styles.ratingLabel}>Your Rating</AppText>
                    <View style={styles.starsContainer}>{renderStars(review.rating)}</View>
                    <AppText style={styles.ratingText} weight="bold">
                        {review.rating} out of 5 stars
                    </AppText>
                </View>

                {/* Review Text */}
                {!!review.comment && (
                    <View style={styles.commentCard}>
                        <View style={styles.commentHeader}>
                            <Ionicons name="chatbox-outline" size={20} color={theme.colors.primaryDark} />
                            <AppText style={styles.commentHeaderText} weight="bold">
                                Your Feedback
                            </AppText>
                        </View>
                        <AppText style={styles.commentText}>{review.comment}</AppText>
                    </View>
                )}

                {/* Review Photo */}
                {!!review.photoUrl && (
                    <View style={styles.photoCard}>
                        <View style={styles.photoHeader}>
                            <Ionicons name="image-outline" size={20} color={theme.colors.primaryDark} />
                            <AppText style={styles.photoHeaderText} weight="bold">
                                Photo of {displayPetName}
                            </AppText>
                        </View>
                        <Image
                            source={{ uri: review.photoUrl }}
                            style={styles.reviewPhoto}
                            resizeMode="cover"
                        />
                    </View>
                )}

                {/* Thank You Message */}
                <View style={styles.thankYouCard}>
                    <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                    <AppText style={styles.thankYouTitle} weight="bold">
                        Thank You!
                    </AppText>
                    <AppText style={styles.thankYouText}>
                        Your review helps other pet parents make informed decisions and helps us improve
                        our services.
                    </AppText>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: theme.colors.background,
    },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 20, color: theme.colors.textBlack },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        color: theme.colors.textBlack,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },

    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 40,
    },

    // Profile
    profileSection: {
        alignItems: 'center',
        marginBottom: 28,
    },
    profileImage: {
        width: 96,
        height: 96,
        borderRadius: 20,
        backgroundColor: '#EBEAE6',
        marginBottom: 14,
    },
    vendorName: {
        fontSize: 20,
        color: theme.colors.textBlack,
        marginBottom: 4,
    },
    reviewDate: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },

    // Rating Card
    ratingCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    ratingLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 12,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 12,
    },
    ratingText: {
        fontSize: 16,
        color: theme.colors.textBlack,
    },

    // Comment Card
    commentCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    commentHeaderText: {
        fontSize: 15,
        color: theme.colors.textBlack,
    },
    commentText: {
        fontSize: 14,
        color: theme.colors.textPrimary,
        lineHeight: 22,
    },

    // Photo Card
    photoCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    photoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    photoHeaderText: {
        fontSize: 15,
        color: theme.colors.textBlack,
    },
    reviewPhoto: {
        width: '100%',
        height: 220,
        borderRadius: 12,
        backgroundColor: '#F0F0F0',
    },

    // Thank You Card
    thankYouCard: {
        backgroundColor: '#F0F9F4',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    thankYouTitle: {
        fontSize: 18,
        color: '#2E7D32',
        marginTop: 12,
        marginBottom: 8,
    },
    thankYouText: {
        fontSize: 14,
        color: '#558B5A',
        textAlign: 'center',
        lineHeight: 20,
    },
});
