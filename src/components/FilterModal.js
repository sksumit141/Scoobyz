import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import AppText from './AppText';
import AppButton from './AppButton';

const { height } = Dimensions.get('window');

const sortOptions = [
  { id: 'rating_desc', label: 'Rating: High to Low' },
  { id: 'reviews_desc', label: 'Popularity: Most Reviews' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
];

const tierOptions = ['Scoobyz Certified', 'Pro', 'Basic'];

export default function FilterModal({
  visible,
  onClose,
  onApply,
  initialSort = null,
  initialTiers = [],
}) {
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [selectedTiers, setSelectedTiers] = useState(initialTiers);

  const toggleTier = (tier) => {
    if (selectedTiers.includes(tier)) {
      setSelectedTiers(selectedTiers.filter((t) => t !== tier));
    } else {
      setSelectedTiers([...selectedTiers, tier]);
    }
  };

  const handleClearAll = () => {
    setSelectedSort(null);
    setSelectedTiers([]);
  };

  const handleApply = () => {
    onApply({
      sort: selectedSort,
      tiers: selectedTiers,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <View style={styles.grabberContainer}>
            <View style={styles.grabber} />
          </View>

          <View style={styles.header}>
            <AppText type="heading" weight="700" style={styles.title}>
              Sort & Filter
            </AppText>
            <TouchableOpacity onPress={handleClearAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppText style={styles.clearText} weight="600">Clear All</AppText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* Filter Section (Provider Badge) */}
            <View style={styles.section}>
              <AppText style={styles.sectionTitle} weight="bold">Provider Badges</AppText>
              <View style={styles.pillContainer}>
                {tierOptions.map((tier) => {
                  const isSelected = selectedTiers.includes(tier);
                  const isCertified = tier === 'Scoobyz Certified';
                  return (
                    <TouchableOpacity
                      key={tier}
                      style={[
                        styles.pill, 
                        isSelected && styles.pillSelected,
                        (isCertified && isSelected) && { backgroundColor: theme.colors.success, borderColor: theme.colors.success }
                      ]}
                      onPress={() => toggleTier(tier)}
                    >
                      {isSelected && (
                        <MaterialCommunityIcons name="check" size={16} color="white" style={{ marginRight: 4 }} />
                      )}
                      <AppText style={[
                        styles.pillText, 
                        isSelected && styles.pillTextSelected,
                      ]} weight={isSelected ? "600" : "500"}>
                        {tier}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Sort Section */}
            <View style={styles.section}>
              <AppText style={styles.sectionTitle} weight="bold">Sort By</AppText>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.radioRow}
                  onPress={() => setSelectedSort(option.id)}
                >
                  <View style={[styles.radioOuter, selectedSort === option.id && styles.radioOuterSelected]}>
                    {selectedSort === option.id && <View style={styles.radioInner} />}
                  </View>
                  <AppText style={styles.radioLabel}>{option.label}</AppText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Additional padding for bottom */}
            <View style={{ height: 40 }} />
          </ScrollView>

          <SafeAreaView style={styles.footer}>
            <AppButton style={styles.applyBtn} onPress={handleApply}>
              <AppText style={styles.applyBtnText} weight="bold">Apply Filters</AppText>
            </AppButton>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayDismiss: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.65,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  grabberContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  grabber: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    color: theme.colors.textPrimary,
  },
  clearText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C0C0C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: theme.colors.primaryDark,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primaryDark,
  },
  radioLabel: {
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginBottom: 24,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: theme.colors.white,
  },
  pillSelected: {
    backgroundColor: theme.colors.primaryDark,
    borderColor: theme.colors.primaryDark,
  },
  pillText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  pillTextSelected: {
    color: theme.colors.white,
  },
  footer: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: theme.colors.background,
  },
  applyBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 10,
  },
  applyBtnText: {
    color: 'white',
    fontSize: 16,
  },
});
