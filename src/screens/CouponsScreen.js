import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import ServiceHeader from '../components/ServiceHeader';
import { theme } from '../styles/theme';
import { bookingsApi } from '../services/api';
import { formatMoney, roundMoney } from '../utils/money';

export default function CouponsScreen({ route, navigation }) {
  const orderValue = roundMoney(route.params?.orderValue);
  const serviceType = String(route.params?.serviceType || 'grooming').toLowerCase();
  const priceCategory = route.params?.priceCategory || 'regular_price';
  const baseServiceValue = roundMoney(route.params?.baseServiceValue ?? orderValue);
  const existingCode = route.params?.reviewParams?.selectedCouponPreview?.code;
  const [selectedId, setSelectedId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    bookingsApi.listCoupons({ serviceType, orderValue, baseServiceValue, priceCategory })
      .then(data => {
        if (!active) return;
        const availableCoupons = data.coupons || [];
        setCoupons(availableCoupons);
        const existingCoupon = availableCoupons.find(coupon => coupon.code === existingCode && coupon.eligible);
        if (existingCoupon) setSelectedId(existingCoupon.id);
      })
      .catch(requestError => { if (active) setError(requestError.message || 'Unable to load coupons'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [baseServiceValue, existingCode, orderValue, priceCategory, serviceType]);

  const selectedCoupon = coupons.find((coupon) => coupon.id === selectedId);

  const selectCoupon = (coupon) => {
    if (!coupon.eligible) return;
    setSelectedId((current) => current === coupon.id ? null : coupon.id);
  };

  const confirmSelection = async () => {
    if (!selectedCoupon) return;
    setApplying(true);
    setError('');
    try {
      const quote = await bookingsApi.getCouponQuote({ code: selectedCoupon.code, serviceType, orderValue, baseServiceValue, priceCategory });
      navigation.popTo(route.params?.returnScreen || 'ReviewDetails', {
        ...(route.params?.reviewParams || {}),
        selectedCouponPreview: {
          code: selectedCoupon.code,
          title: selectedCoupon.title,
          originalAmount: quote.originalAmount,
          discountAmount: quote.discountAmount,
          finalAmount: quote.finalAmount,
          priceCategory: quote.priceCategory,
          baseServiceValue,
          quoteToken: quote.quoteToken,
        },
      });
    } catch (requestError) {
      setError(requestError.message || 'Unable to apply this coupon');
      setApplying(false);
    }
  };

  const clearSelection = () => {
    setSelectedId(null);
    if (!existingCode) return;
    navigation.popTo(route.params?.returnScreen || 'ReviewDetails', {
      ...(route.params?.reviewParams || {}),
      selectedCouponPreview: null,
    });
  };

  const footer = selectedCoupon ? (
    <View style={styles.footerContent}>
      <View style={styles.selectedSummary}>
        <View style={styles.selectedIcon}><MaterialCommunityIcons name="ticket-percent-outline" size={20} color={theme.colors.primaryDark} /></View>
        <View style={styles.selectedCopy}>
          <AppText style={styles.selectedEyebrow} weight="bold">COUPON SELECTED FOR YOU</AppText>
          <AppText style={styles.selectedText} weight="bold">Save ₹{formatMoney(selectedCoupon.estimatedSavings)} with “{selectedCoupon.code}”</AppText>
        </View>
      </View>
      <TouchableOpacity style={styles.applyButton} activeOpacity={0.85} onPress={confirmSelection} disabled={applying}>
        {applying ? <ActivityIndicator color={theme.colors.white} /> : <AppText style={styles.applyButtonText} weight="bold">Apply coupon</AppText>}
      </TouchableOpacity>
      {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
    </View>
  ) : null;

  return (
    <AppScreen
      footer={footer}
      padding={false}
      scrollable={false}
      safeAreaTop={true}
      backgroundColor={theme.colors.background}
    >
      <ServiceHeader title={<AppText style={styles.headerTitle} weight="bold">Coupons</AppText>} showAddress={false} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
      <View style={styles.promoBanner}>
        <View style={styles.promoIconWrap}><MaterialCommunityIcons name="paw" size={31} color={theme.colors.white} /></View>
        <View style={styles.promoCopy}>
          <AppText style={styles.promoEyebrow} weight="bold">SCOOBYZ REWARDS</AppText>
          <AppText style={styles.promoTitle} type="heading">More care. More savings.</AppText>
          <AppText style={styles.promoText}>Hand-picked offers for your pet’s next service.</AppText>
        </View>
        <View style={styles.promoCircleOne} />
        <View style={styles.promoCircleTwo} />
      </View>

      <View style={styles.sectionHeading}>
        <View>
          <AppText style={styles.sectionTitle} type="heading">Available coupons</AppText>
          <AppText style={styles.sectionSubtitle}>For your {serviceType} booking of ₹{formatMoney(orderValue)}</AppText>
        </View>
        {selectedCoupon ? <TouchableOpacity onPress={clearSelection}><AppText style={styles.clearText} weight="bold">Clear</AppText></TouchableOpacity> : null}
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 30 }} color={theme.colors.primary} /> : null}
      {!loading && error && coupons.length === 0 ? <AppText style={styles.errorText}>{error}</AppText> : null}
      {!loading && !error && coupons.length === 0 ? <AppText style={styles.emptyText}>No coupons are available for this booking right now.</AppText> : null}
      <View style={styles.couponList}>
        {coupons.map((coupon) => {
          const selected = coupon.id === selectedId;
          const lockedMessage = coupon.reason || 'This coupon is not available for this booking';
          return (
            <TouchableOpacity key={coupon.id} activeOpacity={coupon.eligible ? 0.8 : 1} onPress={() => selectCoupon(coupon)} style={[styles.couponCard, selected && styles.couponCardSelected, !coupon.eligible && styles.couponCardDisabled]}>
              <View style={[styles.discountIcon, !coupon.eligible && styles.discountIconDisabled]}>
                <MaterialCommunityIcons name="brightness-percent" size={22} color={coupon.eligible ? theme.colors.white : theme.colors.textTertiary} />
              </View>
              <View style={styles.couponBody}>
                <View style={styles.couponTitleRow}>
                  <AppText style={[styles.couponTitle, !coupon.eligible && styles.disabledText]} weight="bold">{coupon.title}</AppText>
                  <TouchableOpacity hitSlop={10} onPress={() => setExpandedId(expandedId === coupon.id ? null : coupon.id)}>
                    <MaterialCommunityIcons name="information-outline" size={17} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <AppText style={[styles.couponDescription, coupon.eligible ? styles.eligibleText : styles.lockedText]}>
                  {coupon.eligible ? `Save ₹${formatMoney(coupon.estimatedSavings)} · ${coupon.description || ''}` : lockedMessage}
                </AppText>
                <View style={styles.codeChip}><AppText style={styles.codeChipText} weight="bold">{coupon.code}</AppText></View>
                {expandedId === coupon.id ? <View style={styles.termsBox}><AppText style={styles.termsText}>{coupon.terms}</AppText></View> : null}
              </View>
              <View style={[styles.radio, selected && styles.radioSelected, !coupon.eligible && styles.radioDisabled]}>{selected ? <View style={styles.radioDot} /> : null}</View>
            </TouchableOpacity>
          );
        })}
      </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 24, paddingBottom: 20 },
  headerTitle: { color: theme.colors.textBlack, fontFamily: theme.fonts.heading, fontSize: 19 },
  promoBanner: { minHeight: 138, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', marginTop: 8, padding: 18, borderRadius: 22, backgroundColor: theme.colors.primaryDark },
  promoIconWrap: { width: 56, height: 56, zIndex: 2, alignItems: 'center', justifyContent: 'center', borderRadius: 28, backgroundColor: theme.colors.success, marginRight: 14 },
  promoCopy: { flex: 1, zIndex: 2 },
  promoEyebrow: { color: theme.colors.accent, fontSize: 10, letterSpacing: 1.2 },
  promoTitle: { marginTop: 5, color: theme.colors.white, fontSize: 21 },
  promoText: { marginTop: 4, color: '#FFFFFFC7', fontSize: 11, lineHeight: 17 },
  promoCircleOne: { position: 'absolute', width: 145, height: 145, borderRadius: 73, right: -55, top: -65, backgroundColor: '#FFFFFF12' },
  promoCircleTwo: { position: 'absolute', width: 92, height: 92, borderRadius: 46, right: 10, bottom: -55, backgroundColor: '#D7C4A426' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 14 },
  sectionTitle: { color: theme.colors.textBlack, fontSize: 21 },
  sectionSubtitle: { marginTop: 3, color: theme.colors.textSecondary, fontSize: 11, textTransform: 'capitalize' },
  clearText: { color: theme.colors.error, fontSize: 12 },
  couponList: { overflow: 'hidden', borderRadius: 20, borderWidth: 1, borderColor: '#E3E1DC', backgroundColor: theme.colors.white, marginBottom: 16 },
  couponCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E6E4DF' },
  couponCardSelected: { backgroundColor: '#4E6C480C' },
  couponCardDisabled: { opacity: 0.62 },
  discountIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, marginRight: 12 },
  discountIconDisabled: { backgroundColor: theme.colors.surface },
  couponBody: { flex: 1 },
  couponTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  couponTitle: { color: theme.colors.textBlack, fontSize: 15 },
  couponDescription: { marginTop: 5, fontSize: 12, lineHeight: 18 },
  eligibleText: { color: theme.colors.success },
  lockedText: { color: '#A4673F' },
  disabledText: { color: theme.colors.textSecondary },
  codeChip: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 5, borderWidth: 1, borderStyle: 'dashed', borderColor: '#C7C4BE', backgroundColor: theme.colors.background },
  codeChipText: { color: theme.colors.textSecondary, fontSize: 11, letterSpacing: 1 },
  termsBox: { marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: theme.colors.background },
  termsText: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17 },
  radio: { width: 23, height: 23, borderRadius: 12, borderWidth: 2, borderColor: '#C8CBC7', alignItems: 'center', justifyContent: 'center', marginLeft: 12, marginTop: 4 },
  radioSelected: { borderColor: theme.colors.success },
  radioDisabled: { borderColor: '#D7D7D4' },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: theme.colors.success },
  footerContent: { gap: 10 },
  selectedSummary: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#D9D7D1', backgroundColor: theme.colors.white },
  selectedIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface },
  selectedCopy: { flex: 1, marginLeft: 10 },
  selectedEyebrow: { color: theme.colors.primary, fontSize: 9, letterSpacing: 0.7 },
  selectedText: { marginTop: 2, color: theme.colors.textBlack, fontSize: 12 },
  applyButton: { alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: 15, backgroundColor: theme.colors.success, ...theme.shadows.small },
  applyButtonText: { color: theme.colors.white, fontSize: 14 },
  errorText: { textAlign: 'center', color: theme.colors.error, fontSize: 11 },
  emptyText: { textAlign: 'center', color: theme.colors.textSecondary, fontSize: 12, paddingVertical: 28 },
});
