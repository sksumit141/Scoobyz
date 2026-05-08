import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { bookingsApi } from '../services/api';

export default function RatingReviewScreen({ navigation, route }) {
    const { bookingId, vendorName } = route.params || {};
    const insets = useSafeAreaInsets ? useSafeAreaInsets() : { top: 40 };
    
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('Please select a rating out of 5 stars.');
            return;
        }

        setLoading(true);
        try {
            const result = await bookingsApi.submitReview(bookingId, { rating, reviewText });
            if (result.error) throw new Error(result.error);
            
            alert('Review submitted successfully!');
            navigation.goBack();
        } catch (error) {
            console.error('Submit review error:', error);
            alert(error.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppScreen safeArea={false} padding={false} backgroundColor={theme.colors.background}>
            <View style={[styles.header, { paddingTop: insets.top || 40 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textBlack} />
                </TouchableOpacity>
                <AppText style={styles.headerTitle} type="heading" weight="bold">Rate Vendor</AppText>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.card}>
                    <AppText style={styles.title} weight="bold">
                        How was your experience with {vendorName}?
                    </AppText>
                    
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity 
                                key={star} 
                                onPress={() => setRating(star)}
                                activeOpacity={0.7}
                                style={styles.starBtn}
                            >
                                <Ionicons 
                                    name={star <= rating ? "star" : "star-outline"} 
                                    size={44} 
                                    color={star <= rating ? theme.colors.warning : "#D3D3D3"} 
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <AppText style={styles.ratingText}>
                        {rating === 0 ? 'Tap to rate' : `${rating} out of 5 Stars`}
                    </AppText>

                    <AppText style={styles.inputLabel} weight="bold">Write a Review (Optional)</AppText>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Share your experience..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={4}
                        value={reviewText}
                        onChangeText={setReviewText}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity 
                        style={[styles.submitBtn, (rating === 0 || loading) && styles.submitBtnDisabled]} 
                        onPress={handleSubmit}
                        disabled={rating === 0 || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <AppText style={styles.submitBtnText} weight="bold">Submit Review</AppText>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 20, color: '#3d2a5e' },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        alignItems: 'center',
    },
    title: { fontSize: 18, textAlign: 'center', marginBottom: 20, color: '#333' },
    starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10, gap: 10 },
    starBtn: { padding: 5 },
    ratingText: { color: '#666', fontSize: 14, marginBottom: 30 },
    inputLabel: { fontSize: 14, alignSelf: 'flex-start', marginBottom: 10, color: '#444' },
    textInput: {
        width: '100%',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 15,
        fontSize: 15,
        color: '#333',
        minHeight: 120,
        borderWidth: 1,
        borderColor: '#EAEAEA',
        marginBottom: 24,
        fontFamily: theme.fonts.regular,
    },
    submitBtn: {
        backgroundColor: theme.colors.primaryDark,
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitBtnDisabled: {
        backgroundColor: '#A096B4',
    },
    submitBtnText: {
        color: '#FFF',
        fontSize: 16,
    }
});
