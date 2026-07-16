import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <AppScreen safeArea={true} padding={false} backgroundColor={theme.colors.background}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color={theme.colors.textBlack} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} weight="bold">Privacy Policy</AppText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <AppText style={styles.sectionTitle} weight="bold">Privacy and Data Protection</AppText>
        <AppText style={styles.paragraph}>
          Scoobyz collects and processes personal data needed to provide and improve its services including contact details, addresses, pet information, booking and payment records, communications, photographs, and location data in accordance with applicable Indian law and its Privacy Policy. We process personal data under the Digital Personal Data Protection Act, 2023, only for the purposes stated in these Terms and for compatible legal, safety and fraud prevention purposes, and not otherwise. We share personal data with the assigned service provider or veterinarian to the extent needed to deliver the service, with our payment aggregator to process payments, and with authorities where required by law; we do not sell personal data to advertisers. Location data is collected only where a service, such as dog walking, requires it, and only for the period reasonably necessary. We retain personal data only for as long as required for these purposes or by law. You may access, correct or erase your personal data, or withdraw consent, by writing to our Grievance Officer at the contact published on the Platform. By using the Platform, you consent to this processing for legitimate business, legal, safety, fraud-prevention, and operational purposes, and to receiving service, transactional, legal, and promotional communications via email, SMS, calls, WhatsApp, or in-app notifications.and to receiving service, transactional and legal communications necessary for the service. Promotional communications by email, SMS, call or WhatsApp are sent only if you separately opt in, and you may withdraw that consent at any time, in accordance with the Telecom Commercial Communications Customer Preference Regulations, 2018.
        </AppText>

        <View style={{ height: 40 }} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    padding: 8,
    marginLeft: -5,
  },
  headerTitle: {
    fontSize: 20,
    color: theme.colors.textBlack,
    fontFamily: theme.fonts.heading,
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: theme.colors.textBlack,
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
});
