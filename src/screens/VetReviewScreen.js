import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import ReviewDetailsCard from '../components/ReviewDetailsCard';
import PaymentSummaryModal from '../components/PaymentSummaryModal';
import { bookingsApi } from '../services/api';
import { theme } from '../styles/theme';

export default function VetReviewScreen({ navigation, route }) {
  const { expert, pet, consultType, date, time, total } = route.params || {};
  const [isPaymentModalVisible, setPaymentModalVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const displayTotal = total || expert?.price || 500;
  const displayPet = pet || { name: "Bruno", breed: "Dog", id: 1 };

  const handleConfirm = () => {
    navigation.navigate('BookVendor', {
      ...route.params,
      serviceType: 'Veterinary',
      total: displayTotal,
      visitType: consultType,
    });
  };

  return (
    <AppScreen safeArea={true} padding={false} scrollable={false} backgroundColor={theme.colors.background}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton} 
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textBlack} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} type="heading" weight="bold">Review & Confirm</AppText>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ReviewDetailsCard
          expert={{
            name: expert?.name || "Expert Vet",
            role: expert?.role || "Veterinarian",
            rating: expert?.rating || "5.0",
            image: expert?.image || "https://images.unsplash.com/photo-1594824436998-d4052e424260?auto=format&fit=crop&q=80&w=300"
          }}
          service={consultType || 'Clinic Visit'}
          date={date ? new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : "Today"}
          time={time || "10:30 AM"}
        />

        <View style={styles.card}>
          <AppText style={styles.sectionTitle} type="heading" weight="bold">Booking Summary</AppText>
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <AppText style={styles.label}>Pet</AppText>
            <AppText style={styles.value} weight="bold">{displayPet.name} ({displayPet.breed})</AppText>
          </View>

          <View style={styles.row}>
            <AppText style={styles.label}>Consultation</AppText>
            <AppText style={styles.value} weight="bold">{consultType || "Clinic Visit"}</AppText>
          </View>
        </View>

        {/* Payment Summary Box */}
        <View style={styles.multiCard}>
          <View style={styles.toPayTopRow}>
            <MaterialCommunityIcons name="receipt" size={20} color={theme.colors.textSecondary} />
            <View style={styles.cardCenter}>
              <AppText style={styles.mainValue} weight="bold">To Pay</AppText>
              <TouchableOpacity
                style={styles.viewDetailBtn}
                onPress={() => setPaymentModalVisible(true)}
              >
                <AppText style={styles.viewDetailText}>VIEW DETAIL</AppText>
                <MaterialCommunityIcons name="chevron-right" size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <AppText style={styles.toPayTotal} weight="bold">₹{displayTotal}</AppText>
          </View>
          
          <View style={styles.cancellationBox}>
            <MaterialCommunityIcons name="information-outline" size={16} color={theme.colors.textBlack} style={{ marginTop: 2 }} />
            <AppText style={styles.cancellationText}>
              Cancellations made within 24hrs are subject to a 50% convenience fee.
            </AppText>
          </View>
        </View>

        <View style={styles.policyText}>
          <AppText style={{ fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 18 }}>
            By confirming, you agree to our <AppText style={{ color: theme.colors.primaryDark, textDecorationLine: 'underline' }}>Terms</AppText> and <AppText style={{ color: theme.colors.primaryDark, textDecorationLine: 'underline' }}>Privacy Policy</AppText>.
          </AppText>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.confirmBtn}
          activeOpacity={0.8}
          onPress={handleConfirm}
        >
          <AppText style={styles.confirmBtnText} weight="bold">Book Vendor</AppText>
        </TouchableOpacity>
      </View>

      <PaymentSummaryModal
        visible={isPaymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        total={displayTotal}
        cart={[{
           serviceName: 'Veterinary Consult',
           basePrice: displayTotal,
           multiplier: 1,
           timesPerDay: 1,
           frequency: 'One-time',
           duration: '1 Session'
        }]}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingLeft: 18, paddingRight: 24, paddingTop: 40, paddingBottom: 10,
  },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 22, color: theme.colors.textBlack, fontFamily: theme.fonts.heading, marginLeft: -5 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 10 },
  card: { backgroundColor: theme.colors.white, padding: 20, borderRadius: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#F0F0F0' },
  sectionTitle: { fontSize: 16, color: theme.colors.primaryDark, marginBottom: 4 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 13, color: theme.colors.textSecondary },
  value: { fontSize: 14, color: theme.colors.textBlack },
  multiCard: { backgroundColor: theme.colors.white, borderRadius: 24, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  toPayTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  cardCenter: { flex: 1, marginLeft: 16 },
  mainValue: { fontSize: 15, color: theme.colors.textBlack },
  viewDetailBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  viewDetailText: { fontSize: 10, color: theme.colors.textSecondary, letterSpacing: 0.5, marginRight: 2 },
  toPayTotal: { fontSize: 18, color: theme.colors.textBlack },
  cancellationBox: { backgroundColor: '#F7F6F2', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'flex-start' },
  cancellationText: { flex: 1, fontSize: 12, color: theme.colors.textSecondary, marginLeft: 8, lineHeight: 18 },
  policyText: { paddingHorizontal: 20, marginTop: 8, marginBottom: 20 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 30 },
  confirmBtn: { backgroundColor: theme.colors.success || '#4A6B4B', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  confirmBtnText: { color: theme.colors.white, fontSize: 16 },
});
