import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Dimensions, Modal, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import AppHeader from '../components/AppHeader';
import { theme } from '../styles/theme';
import { BASE_URL } from '../services/api';

const { width } = Dimensions.get('window');

const FAQ_CATEGORIES = ['All', 'Account', 'Service', 'Payment'];

const FAQS = [
  {
    id: '1',
    category: 'Service',
    question: 'How to book a groomer?',
    answer: 'To book, navigate to the Services section and select Grooming. Follow the steps to choose a time and a groomer.'
  },
  {
    id: '2',
    category: 'Service',
    question: 'How do I track my order?',
    answer: 'You can track your order in the My Bookings section under your profile.'
  },
  {
    id: '3',
    category: 'Service',
    question: 'What are your delivery hours?',
    answer: 'Our standard service hours are from 9 AM to 8 PM, seven days a week.'
  },
  {
    id: '4',
    category: 'Account',
    question: 'Can I cancel my appointment?',
    answer: 'Yes, cancellations made within 24 hours of the appointment are subject to a 50% convenience fee.'
  }
];

export default function HelpSupportScreen({ navigation }) {
  const insets = useSafeAreaInsets ? useSafeAreaInsets() : { top: 40 };
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState('1');

  // Account Deletion State
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteRequest = async () => {
    if (!deleteReason.trim()) {
      Alert.alert('Required', 'Please let us know why you are deleting your account.');
      return;
    }
    try {
      setIsDeleting(true);
      const authToken = await AsyncStorage.getItem('authToken');
      const API_URL = process.env.EXPO_PUBLIC_API_URL || BASE_URL || 'https://scoobyz-backend.onrender.com';

      const response = await fetch(`${API_URL}/user/delete-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ reason: deleteReason })
      });

      const data = await response.json();
      if (data.success) {
        setIsDeleteModalVisible(false);
        Alert.alert(
          'Request Submitted',
          'Your account deletion request has been received. You will be logged out now.',
          [{
            text: 'OK',
            onPress: async () => {
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('userId');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            }
          }]
        );
      } else {
        throw new Error(data.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Delete request error:', error);
      Alert.alert('Error', 'Could not submit your request. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredFaqs = FAQS.filter(faq => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AppScreen safeAreaTop={false} padding={false} backgroundColor="#F9F8F5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header Section */}
        <View style={[styles.header, { paddingTop: insets.top || 40 }]}>
          <AppHeader
            title=""
            headerTheme="dark"
            style={{ paddingHorizontal: 0, paddingVertical: 0, minHeight: 48, justifyContent: 'space-between' }}
            rightComponent={
              <TouchableOpacity
                style={[styles.notificationBtn]}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Ionicons name="notifications-outline" size={20} color="#4A6B4B" />
              </TouchableOpacity>
            }
          />

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search question"
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.content}>
          {/* Popular FAQs */}
          <AppText type="heading" weight="bold" style={styles.sectionTitle}>Popular FAQs</AppText>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {FAQ_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <AppText style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.faqList}>
            {filteredFaqs.map(faq => {
              const isExpanded = expandedId === faq.id;
              return (
                <TouchableOpacity
                  key={faq.id}
                  style={[styles.faqCard, isExpanded && styles.faqCardExpanded]}
                  onPress={() => setExpandedId(isExpanded ? null : faq.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.faqHeader}>
                    <AppText style={styles.faqQuestion} weight="bold">{faq.question}</AppText>
                    <MaterialCommunityIcons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#888"
                    />
                  </View>
                  {isExpanded && (
                    <AppText style={styles.faqAnswer}>{faq.answer}</AppText>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Contact Us Section */}
          <AppText type="heading" weight="bold" style={[styles.sectionTitle, { marginTop: 10 }]}>Contact Us</AppText>

          <TouchableOpacity
            style={styles.contactCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SupportChat')}
          >
            <View style={styles.contactIconWrapper}>
              <MaterialCommunityIcons name="chat-processing-outline" size={24} color="#FFF" />
            </View>
            <View style={styles.contactInfo}>
              <AppText style={styles.contactTitle} weight="bold">Chat with us</AppText>
              <AppText style={styles.contactSubtitle}>Instant response time</AppText>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#BBB" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} activeOpacity={0.8}>
            <View style={styles.contactIconWrapper}>
              <MaterialCommunityIcons name="phone-outline" size={24} color="#FFF" />
            </View>
            <View style={styles.contactInfo}>
              <AppText style={styles.contactTitle} weight="bold">Call us</AppText>
              <AppText style={styles.contactSubtitle}>Mon-Fri, 9am - 6pm</AppText>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#BBB" />
          </TouchableOpacity>

          {/* Account Management Section */}
          <AppText type="heading" weight="bold" style={[styles.sectionTitle, { marginTop: 20 }]}>Account Management</AppText>

          <TouchableOpacity
            style={[styles.contactCard, { borderColor: 'rgba(231, 76, 60, 0.3)' }]}
            activeOpacity={0.8}
            onPress={() => setIsDeleteModalVisible(true)}
          >
            <View style={[styles.contactIconWrapper, { backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}>
              <MaterialCommunityIcons name="delete-outline" size={24} color={theme.colors.error} />
            </View>
            <View style={styles.contactInfo}>
              <AppText style={[styles.contactTitle, { color: theme.colors.error }]} weight="bold">Delete Account</AppText>
              <AppText style={styles.contactSubtitle}>Request permanent deletion</AppText>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#BBB" />
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !isDeleting && setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconCircle}>
                <MaterialCommunityIcons name="alert-circle-outline" size={32} color={theme.colors.error} />
              </View>
              <AppText type="heading" weight="bold" style={styles.modalTitle}>Delete Account</AppText>
            </View>

            <AppText style={styles.modalDescription}>
              Submitting this request will mark your account for permanent deletion. All data, bookings, and pet profiles will be removed.
            </AppText>

            <AppText style={styles.modalLabel} weight="bold">Why are you leaving?</AppText>
            <TextInput
              style={styles.modalInput}
              placeholder="Please tell us why (required)"
              placeholderTextColor="#999"
              value={deleteReason}
              onChangeText={setDeleteReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isDeleting}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsDeleteModalVisible(false)}
                disabled={isDeleting}
              >
                <AppText style={styles.modalCancelText} weight="bold">Cancel</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleDeleteRequest}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <AppText style={styles.modalSubmitText} weight="bold">Submit Request</AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#526D82',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 140,
    height: 40,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    marginTop: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontFamily: theme.fonts.regular,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#222',
    marginBottom: 16,
  },
  categoryScroll: {
    gap: 10,
    paddingRight: 20,
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  categoryChipActive: {
    backgroundColor: '#526D82',
    borderColor: '#526D82',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  faqList: {
    marginBottom: 24,
  },
  faqCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  faqCardExpanded: {
    paddingBottom: 20,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    paddingRight: 10,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#666',
    marginTop: 12,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  contactIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#526D82',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    color: '#222',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 13,
    color: '#777',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    color: '#333',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 15,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    color: '#FFF',
    fontSize: 15,
  }
});
