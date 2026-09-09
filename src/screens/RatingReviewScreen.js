import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import AppHeader from '../components/AppHeader';
import { theme } from '../styles/theme';
import { reviewsApi } from '../services/api';
import { useBackHandler, safeGoBack } from '../hooks/useBackHandler';
import PawLoader from '../components/PawLoader';

// ─── Star rating labels ───
const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

const getNameInitials = (name) => {
    const parts = String(name || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) return 'V';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export default function RatingReviewScreen({ navigation, route }) {
    const { bookingId, vendorName, vendorRole, petName } = route.params || {};
    const insets = useSafeAreaInsets ? useSafeAreaInsets() : { top: 40 };

    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null); // { uri, uploading }
    const [isReviewed, setIsReviewed] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const displayVendorName = vendorName || 'Your Groomer';
    const displayVendorRole = vendorRole || 'Pet Care Professional';
    const displayPetName = petName || 'your pet';
    const vendorInitials = getNameInitials(displayVendorName);

    const { handleBack } = useBackHandler();

    // ─── Fetch existing review ───
    useEffect(() => {
        if (!bookingId) {
            setInitialLoading(false);
            return;
        }

        const fetchReview = async () => {
            try {
                const response = await reviewsApi.getByBookingId(bookingId);
                if (response && response.rating) {
                    setRating(parseFloat(response.rating));
                    setReviewText(response.comment || '');
                    if (response.photoUrl) {
                        setSelectedImage(response.photoUrl);
                    }
                    setIsReviewed(true);
                }
            } catch (error) {
                // Not found or error (ignore if not found)
            } finally {
                setInitialLoading(false);
            }
        };

        fetchReview();
    }, [bookingId]);

    // ─── Pick image from gallery ───
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission Required',
                'Please allow access to your photo library to add a photo.',
                [{ text: 'OK' }]
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    // ─── Remove selected image ───
    const removeImage = () => {
        setSelectedImage(null);
    };

    // ─── Submit review ───
    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Rating Required', 'Please select a star rating before submitting.');
            return;
        }

        if (!bookingId) {
            Alert.alert('Error', 'Booking information is missing. Please try again.');
            return;
        }

        setLoading(true);
        try {
            const result = await reviewsApi.submitWithPhoto({
                bookingId,
                rating,
                comment: reviewText.trim() || undefined,
                photoUri: selectedImage || undefined,
            });

            if (result.error) throw new Error(result.error);

            Alert.alert(
                'Thank You!',
                'Your review has been submitted successfully.',
                [{ text: 'Done', onPress: () => safeGoBack(navigation) }]
            );
        } catch (error) {
            console.error('Submit review error:', error);

            const msg = error.message || '';

            if (msg.toLowerCase().includes('already reviewed')) {
                Alert.alert(
                    'Already Reviewed',
                    'You have already submitted a review for this booking.',
                    [{ text: 'Go Back', onPress: () => safeGoBack(navigation) }]
                );
            } else if (msg.toLowerCase().includes('completed')) {
                Alert.alert(
                    'Not Yet Complete',
                    'Reviews can only be submitted after the booking is completed.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Submission Failed',
                    'Something went wrong. Please check your connection and try again.',
                    [{ text: 'OK' }]
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // ─── Star row ───
    const renderStars = () => (
        <View style={styles.starsWrapper}>
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                        disabled={isReviewed}
                        activeOpacity={0.7}
                        style={styles.starBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                        <Ionicons
                            name={star <= rating ? 'star' : 'star-outline'}
                            size={40}
                            color={star <= rating ? '#F5A623' : '#CBD5E0'}
                        />
                    </TouchableOpacity>
                ))}
            </View>
            {rating > 0 && (
                <AppText style={styles.ratingLabel} weight="bold">
                    {RATING_LABELS[rating]}
                </AppText>
            )}
        </View>
    );

    if (initialLoading) {
        return (
            <AppScreen safeAreaTop={true} padding={false} backgroundColor={theme.colors.background}>
                <AppHeader title="Rate Your Experience" onBackPress={handleBack} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <PawLoader fullScreen={false} />
                </View>
            </AppScreen>
        );
    }

    return (
        <AppScreen safeAreaTop={true} padding={false} backgroundColor={theme.colors.background}>
            <AppHeader title="Rate Your Experience" onBackPress={handleBack} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Vendor Profile */}
                    <View style={styles.profileSection}>
                        <View style={styles.vendorMonogram}>
                            <AppText style={styles.vendorInitials} weight="bold">
                                {vendorInitials}
                            </AppText>
                        </View>
                        <AppText style={styles.vendorName} type="heading" weight="bold">
                            {displayVendorName}
                        </AppText>
                        <AppText style={styles.vendorRole}>{displayVendorRole}</AppText>
                    </View>

                    {/* Star Rating */}
                    <View style={styles.ratingSection}>
                        <AppText style={styles.ratingQuestion}>How was your experience?</AppText>
                        {renderStars()}
                    </View>

                    {/* Written Feedback */}
                    <View style={styles.feedbackSection}>
                        <AppText style={styles.sectionLabel}>
                            Share your feedback{' '}
                            <AppText style={styles.optionalText}>(optional)</AppText>
                        </AppText>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                placeholder={`Tell others about ${displayPetName}'s experience...`}
                                placeholderTextColor="#9BA4B5"
                                multiline
                                numberOfLines={5}
                                value={reviewText}
                                onChangeText={setReviewText}
                                editable={!isReviewed}
                                textAlignVertical="top"
                                maxLength={500}
                            />
                            <AppText style={styles.charCount}>
                                {reviewText.length}/500
                            </AppText>
                        </View>
                    </View>

                    {/* Photo Upload */}
                    <View style={styles.photoSection}>
                        <AppText style={styles.sectionLabel}>
                            {isReviewed ? 'Photo' : 'Add a photo'}{' '}
                            {!isReviewed && <AppText style={styles.optionalText}>(optional)</AppText>}
                        </AppText>

                        {selectedImage ? (
                            /* Selected image preview */
                            <View style={styles.imagePreviewContainer}>
                                <Image
                                    source={{ uri: selectedImage }}
                                    style={styles.previewImage}
                                    resizeMode="cover"
                                />
                                {!isReviewed && (
                                    <>
                                        {/* Action buttons overlay */}
                                        <View style={styles.imageActions}>
                                            <TouchableOpacity
                                                style={styles.imageActionBtn}
                                                onPress={pickImage}
                                                activeOpacity={0.8}
                                            >
                                                <Feather name="refresh-cw" size={16} color="#FFF" />
                                                <AppText style={styles.imageActionText} weight="bold">
                                                    Change
                                                </AppText>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.imageActionBtn, styles.removeBtn]}
                                                onPress={removeImage}
                                                activeOpacity={0.8}
                                            >
                                                <Feather name="trash-2" size={16} color="#FFF" />
                                                <AppText style={styles.imageActionText} weight="bold">
                                                    Remove
                                                </AppText>
                                            </TouchableOpacity>
                                        </View>
                                        {/* Upload indicator badge */}
                                        <View style={styles.photoBadge}>
                                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                            <AppText style={styles.photoBadgeText}>Photo ready</AppText>
                                        </View>
                                    </>
                                )}
                            </View>
                        ) : isReviewed ? (
                            <View style={styles.noPhotoContainer}>
                                <AppText style={styles.noPhotoText}>No photo provided</AppText>
                            </View>
                        ) : (
                            /* Empty state — tap to pick */
                            <TouchableOpacity
                                style={styles.uploadPlaceholder}
                                activeOpacity={0.7}
                                onPress={pickImage}
                            >
                                <View style={styles.uploadIconCircle}>
                                    <Feather name="camera" size={28} color="#4E6C48" />
                                </View>
                                <AppText style={styles.uploadTitle} weight="bold">
                                    Add a photo of {displayPetName}
                                </AppText>
                                <AppText style={styles.uploadSubtitle}>
                                    Show off the grooming results!
                                </AppText>
                                <View style={styles.uploadHint}>
                                    <Feather name="image" size={12} color="#9BA4B5" />
                                    <AppText style={styles.uploadHintText}>
                                        JPEG, PNG or WebP · Max 10 MB
                                    </AppText>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={{ height: 20 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Submit Button */}
            <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity
                    style={[
                        styles.submitBtn,
                        (!isReviewed && rating === 0 || loading) && styles.submitBtnDisabled,
                    ]}
                    onPress={isReviewed ? handleBack : handleSubmit}
                    disabled={!isReviewed && (rating === 0 || loading)}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <View style={styles.loadingRow}>
                            <ActivityIndicator color="#FFF" size="small" />
                            <AppText style={[styles.submitBtnText, { marginLeft: 10 }]}>
                                {selectedImage ? 'Uploading & Submitting…' : 'Submitting…'}
                            </AppText>
                        </View>
                    ) : (
                        <AppText style={styles.submitBtnText} weight="bold">
                            {isReviewed ? 'Go Back' : 'Submit Review'}
                        </AppText>
                    )}
                </TouchableOpacity>
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    keyboardView: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },

    // ── Vendor profile ──
    profileSection: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 28,
    },
    vendorMonogram: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: theme.colors.primaryDark,
        marginBottom: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    vendorInitials: {
        color: '#FFFFFF',
        fontSize: 32,
        letterSpacing: 1,
    },
    vendorName: {
        fontSize: 20,
        color: theme.colors.textBlack,
        marginBottom: 4,
    },
    vendorRole: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },

    // ── Stars ──
    ratingSection: {
        alignItems: 'center',
        marginBottom: 28,
    },
    ratingQuestion: {
        fontSize: 16,
        color: theme.colors.textBlack,
        marginBottom: 14,
    },
    starsWrapper: {
        alignItems: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    starBtn: { padding: 4 },
    ratingLabel: {
        marginTop: 10,
        fontSize: 15,
        color: '#F5A623',
        letterSpacing: 0.3,
    },

    // ── Feedback text ──
    feedbackSection: { marginBottom: 24 },
    sectionLabel: {
        fontSize: 15,
        color: theme.colors.textBlack,
        marginBottom: 10,
    },
    optionalText: {
        color: theme.colors.textSecondary,
        fontSize: 13,
    },
    inputContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        minHeight: 130,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.textBlack,
        fontFamily: theme.fonts?.regular,
        minHeight: 90,
    },
    charCount: {
        fontSize: 11,
        color: '#B0BEC5',
        textAlign: 'right',
        marginTop: 6,
    },

    // ── Photo upload ──
    photoSection: { marginBottom: 8 },
    uploadPlaceholder: {
        borderWidth: 1.5,
        borderColor: '#B0BEC5',
        borderStyle: 'dashed',
        borderRadius: 16,
        paddingVertical: 28,
        paddingHorizontal: 20,
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    uploadIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#EEF3ED',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    uploadTitle: {
        fontSize: 15,
        color: theme.colors.textBlack,
        marginBottom: 4,
        textAlign: 'center',
    },
    uploadSubtitle: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginBottom: 12,
        textAlign: 'center',
    },
    uploadHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    uploadHintText: {
        fontSize: 11,
        color: '#9BA4B5',
        marginLeft: 4,
    },
    noPhotoContainer: {
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        borderRadius: 16,
        paddingVertical: 20,
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    noPhotoText: {
        fontSize: 13,
        color: '#9BA4B5',
    },

    // ── Image preview ──
    imagePreviewContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        height: 200,
        position: 'relative',
        backgroundColor: '#000',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    imageActions: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        gap: 8,
    },
    imageActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(78,108,72,0.85)',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        gap: 5,
    },
    removeBtn: {
        backgroundColor: 'rgba(211,47,47,0.85)',
    },
    imageActionText: {
        color: '#FFF',
        fontSize: 12,
        marginLeft: 4,
    },
    photoBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.92)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 4,
    },
    photoBadgeText: {
        fontSize: 11,
        color: '#2E7D32',
        marginLeft: 4,
    },

    // ── Bottom bar ──
    bottomContainer: {
        paddingHorizontal: 24,
        paddingTop: 14,
        backgroundColor: theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    submitBtn: {
        backgroundColor: '#4E6C48',
        width: '100%',
        paddingVertical: 17,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnDisabled: {
        backgroundColor: '#A3B19E',
        opacity: 0.75,
    },
    submitBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: theme.fonts?.medium,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
