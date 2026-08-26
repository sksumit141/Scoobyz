import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from './AppText';
import { theme } from '../styles/theme';

const { height } = Dimensions.get('window');

const ADDONS = [
  { id: '1', title: 'Nail clipping', price: 200, icon: 'content-cut' },
  { id: '2', title: 'Ear cleaning', price: 250, icon: 'ear-hearing' },
  { id: '3', title: 'Teeth brushing', price: 150, icon: 'tooth' },
  { id: '4', title: 'De-shedding treatment', price: 650, icon: 'dog-side' },
  { id: '5', title: 'Deworming', price: 400, icon: 'pill' },
];

export default function AddonsModal({ visible, packageData, onClose, onAdd }) {
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [medicalInfo, setMedicalInfo] = useState('');

  // Reset state when modal opens with a new package
  useEffect(() => {
    if (visible && packageData) {
      // Do not auto-select addons by default
      setSelectedAddons([]);
      setMedicalInfo('');
    }
  }, [visible, packageData]);

  if (!packageData) return null;

  const availableAddons = (packageData?.availableAddons || []).filter(a =>
    !a.customServiceName || a.customServiceName === packageData.title
  );

  const isRoyalPamper = packageData?.title?.toLowerCase()?.includes('royal pamper') || packageData?.name?.toLowerCase()?.includes('royal pamper');

  const isAdditionalCharge = (name) => {
    if (!name) return false;
    const lowerName = name.toLowerCase().trim();
    return lowerName.includes('matting') || lowerName.includes('handling') || lowerName.includes('giant breed');
  };

  const regularAddons = isRoyalPamper
    ? []
    : availableAddons.filter(a => !isAdditionalCharge(a.addonName) && !isAdditionalCharge(a.name));

  const additionalCharges = availableAddons.filter(a => isAdditionalCharge(a.addonName) || isAdditionalCharge(a.name));

  const handleToggleAddon = (id) => {
    setSelectedAddons(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleClear = () => {
    setSelectedAddons([]);
    setMedicalInfo('');
  };

  // Pricing Logic:
  // packageData.price is the total (Base + All Addons).
  // We calculate the base price to have a starting point for dynamic adjustments.
  const basePriceOnly = Number(packageData.price) || 0;

  const currentAddonsTotal = availableAddons
    .filter(a => selectedAddons.includes(String(a.id)))
    .reduce((sum, a) => sum + (Number(a.addonPrice) || Number(a.price) || 0), 0);

  const finalTotal = basePriceOnly + currentAddonsTotal;

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} enabled={Platform.OS === 'ios'} style={styles.overlay}>
        <View style={styles.dismissArea}>
          <TouchableOpacity style={styles.floatingCloseBtn} onPress={onClose} activeOpacity={0.8}>
            <MaterialCommunityIcons name="close" size={24} color={theme.colors.textBlack} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>

          <View style={styles.header}>
            <AppText style={styles.title} type="heading" weight="bold" numberOfLines={2}>
              Customize your {packageData.title.toLowerCase()}
            </AppText>
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppText style={styles.clearText}>Clear</AppText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

            <View style={styles.section}>
              <AppText style={styles.sectionLabel}>Medical conditions</AppText>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Skin allergies, any recent surgery"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={medicalInfo}
                onChangeText={setMedicalInfo}
              />
            </View>

            <View style={styles.addonsList}>
              {regularAddons.length === 0 && !isRoyalPamper && (
                <AppText style={{ textAlign: 'center', color: theme.colors.textSecondary, marginVertical: 20 }}>
                  No extra add-ons available for this service.
                </AppText>
              )}

              {regularAddons.map((addon) => {
                const addonId = String(addon.id);
                const isSelected = selectedAddons.includes(addonId);
                const price = Number(addon.addonPrice) || Number(addon.price) || 0;
                return (
                  <TouchableOpacity
                    key={addonId}
                    style={[styles.addonItem, isSelected && styles.addonItemActive]}
                    onPress={() => handleToggleAddon(addonId)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.addonIconBg}>
                      <MaterialCommunityIcons name={addon.icon || "plus"} size={18} color={theme.colors.white} />
                    </View>
                    <AppText style={styles.addonTitle} weight={isSelected ? "bold" : "regular"}>{addon.addonName || addon.name}</AppText>
                    <AppText style={styles.addonPrice} weight="bold">₹{price}</AppText>
                    <MaterialCommunityIcons
                      name="paw"
                      size={20}
                      color={isSelected ? '#4A6B4B' : '#A0AAB5'}
                    />
                  </TouchableOpacity>
                )
              })}
            </View>

            {additionalCharges.length > 0 && (
              <View style={[styles.section, { marginTop: isRoyalPamper ? -10 : 24 }]}>
                <AppText style={[styles.sectionLabel, { fontSize: 18, color: '#000000' }]} weight="bold">Additional charges</AppText>
                <AppText style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 12 }}>
                  *These charges may also be applied by the groomer upon physical inspection.
                </AppText>
                <View style={styles.addonsList}>
                  {additionalCharges.map((addon) => {
                    const addonId = String(addon.id);
                    const isSelected = selectedAddons.includes(addonId);
                    const price = Number(addon.addonPrice) || Number(addon.price) || 0;
                    return (
                      <TouchableOpacity
                        key={addonId}
                        style={[styles.addonItem, isSelected && styles.addonItemActive]}
                        onPress={() => handleToggleAddon(addonId)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.addonIconBg}>
                          <MaterialCommunityIcons name={addon.icon || "dog"} size={18} color={theme.colors.white} />
                        </View>
                        <AppText style={styles.addonTitle} weight={isSelected ? "bold" : "regular"}>{addon.addonName || addon.name}</AppText>
                        <AppText style={styles.addonPrice} weight="bold">₹{price}</AppText>
                        <MaterialCommunityIcons
                          name="paw"
                          size={20}
                          color={isSelected ? '#D32F2F' : '#A0AAB5'}
                        />
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            )}

          </ScrollView>

          <View style={styles.bottomBar}>
            <View style={styles.bottomInfo}>
              <AppText style={styles.totalLabel}>Total</AppText>
              <AppText style={styles.totalValue} weight="bold">₹ {finalTotal}</AppText>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              activeOpacity={0.8}
              onPress={() => {
                onAdd({
                  packageId: packageData.id,
                  basePrice: basePriceOnly,
                  addons: availableAddons.filter(a => selectedAddons.includes(String(a.id))),
                  totalAddonPrice: currentAddonsTotal,
                  medicalInfo
                });
              }}
            >
              <AppText style={styles.addBtnText} weight="bold">Add</AppText>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  floatingCloseBtn: {
    backgroundColor: theme.colors.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.70, // Severely cap the height to keep it very small footprint
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 22,
    color: theme.colors.textBlack,
    marginRight: 16,
    lineHeight: 28,
  },
  clearText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  scrollArea: {
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginLeft: 3
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#EAEAEC',
    borderRadius: 12,
    padding: 16,
    height: 80,
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textBlack,
  },
  addonsList: {
    gap: 12,
  },
  addonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA', // very light grey
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  addonItemActive: {
    backgroundColor: '#FAF8F5',
    borderColor: '#D4C4A8', // tan border per design
  },
  addonIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#758A9F', // slate blue
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addonTitle: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textBlack,
  },
  addonPrice: {
    fontSize: 15,
    color: theme.colors.textBlack,
    marginRight: 12,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 30, // Safe area styling
  },
  bottomInfo: {
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 18,
    color: theme.colors.textBlack,
  },
  addBtn: {
    backgroundColor: '#4A6B4B',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  addBtnText: {
    color: theme.colors.white,
    fontSize: 16,
  },
});
