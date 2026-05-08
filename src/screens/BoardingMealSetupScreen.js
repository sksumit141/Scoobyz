import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { discoverApi } from '../services/api';

const SIZES = ['Small', 'Medium', 'Large'];
const FREQUENCIES = ['1x', '2x', '3x'];

export default function BoardingMealSetupScreen({ navigation }) {
  const route = useRoute();
  const expert = route?.params?.expert;

  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [meals, setMeals] = useState([]);

  const [size, setSize] = useState('Medium');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [customMealText, setCustomMealText] = useState('');
  const [frequency, setFrequency] = useState('2x');
  const [isAggressive, setIsAggressive] = useState(false);
  const [aggressiveFee, setAggressiveFee] = useState(0);

  useEffect(() => {
    if (expert?.id) {
      fetchDetails();
    }
  }, [expert]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const data = await discoverApi.groomerPackages(expert.id);

      setRooms(data.rooms || []);
      setMeals(data.meals || []);
      if (data.aggressiveFee) {
        setAggressiveFee(Number(data.aggressiveFee) || 0);
      }

      // Initial selection based on default size (Medium)
      const initialRoom = (data.rooms || []).find(r => r.petSize?.toLowerCase() === 'medium') || data.rooms?.[0];
      if (initialRoom) setSelectedRoom(initialRoom);

      const initialMeal = (data.meals || []).find(m => m.petSize?.toLowerCase() === 'medium') || data.meals?.[0];
      if (initialMeal) setSelectedMeal(initialMeal);
    } catch (error) {
      console.error("Fetch boarding details error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If size changes, update selectedRoom/selectedMeal to the one matching the new size
    if (rooms.length > 0) {
      const match = selectedRoom
        ? rooms.find(r => r.name === selectedRoom.name && r.petSize?.toLowerCase() === size.toLowerCase())
        : rooms.find(r => r.petSize?.toLowerCase() === size.toLowerCase());
      if (match) setSelectedRoom(match);
    }
    if (meals.length > 0) {
      const match = selectedMeal
        ? meals.find(m => m.name === selectedMeal.name && m.petSize?.toLowerCase() === size.toLowerCase())
        : meals.find(m => m.petSize?.toLowerCase() === size.toLowerCase());
      if (match) setSelectedMeal(match);
    }
  }, [size, rooms, meals]);

  const isFormValid = () => {
    if (!selectedRoom) return false;
    // if (selectedMeal && selectedMeal.name === 'Customised' && customMealText.trim() === '') return false;
    return true;
  };

  const calculateNights = () => {
    const start = route.params?.serviceDate ? new Date(route.params.serviceDate) : new Date();
    const end = route.params?.endDate ? new Date(route.params.endDate) : new Date(start.getTime() + 86400000);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const nights = calculateNights();

  const calculateTotal = () => {
    let total = 0;
    if (selectedRoom) total += (Number(selectedRoom.price) || 0) * nights;
    if (isAggressive) total += (aggressiveFee * nights);
    if (selectedMeal) {
      const freqNum = parseInt(frequency) || 1;
      total += (Number(selectedMeal.price) || 0) * freqNum * nights;
    }
    return total;
  };

  if (loading) {
    return (
      <AppScreen safeArea={true} backgroundColor={theme.colors.background}>
        <ActivityIndicator size="large" color={theme.colors.primaryDark} style={{ marginTop: 100 }} />
      </AppScreen>
    );
  }

  return (
    <AppScreen safeArea={true} padding={false} scrollable={false} backgroundColor={theme.colors.background}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textBlack} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <AppText style={styles.headerTitle} type="heading" weight="bold">Stay Details</AppText>
          <AppText style={{ fontSize: 13, color: theme.colors.textSecondary }}>at {expert?.name}</AppText>
        </View>
        <View style={styles.nightsBadge}>
          <AppText style={styles.nightsBadgeText} weight="bold">{nights} {nights === 1 ? 'Night' : 'Nights'}</AppText>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="dog" size={20} color={theme.colors.primaryDark} />
            <AppText style={styles.sectionTitle} weight="bold">Dog Size</AppText>
          </View>
          <View style={styles.chipRow}>
            {SIZES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, size === s && styles.chipActive]}
                onPress={() => setSize(s)}
              >
                <AppText style={[styles.chipText, size === s && styles.chipTextActive]}>{s}</AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="bed-outline" size={20} color={theme.colors.primaryDark} />
            <AppText style={styles.sectionTitle} weight="bold">Room Type</AppText>
          </View>
          <View style={{ gap: 12, marginTop: 12 }}>
            {rooms.length > 0 ? Array.from(new Set(rooms.map(r => r.name))).map(roomName => {
              const roomForSize = rooms.find(r => r.name === roomName && r.petSize?.toLowerCase() === size.toLowerCase()) || rooms.find(r => r.name === roomName);
              if (!roomForSize) return null;

              const isSelected = selectedRoom?.name === roomName;
              return (
                <TouchableOpacity
                  key={roomName}
                  style={[styles.optionCard, isSelected && styles.optionCardActive]}
                  onPress={() => setSelectedRoom(roomForSize)}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionLeft}>
                    <MaterialCommunityIcons
                      name={isSelected ? "radiobox-marked" : "radiobox-blank"}
                      size={22}
                      color={isSelected ? theme.colors.primaryDark : theme.colors.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <AppText style={[styles.optionTitle, isSelected && { color: theme.colors.primaryDark }]}>
                        {roomName}
                      </AppText>
                      <AppText style={{ fontSize: 11, color: theme.colors.textSecondary }} numberOfLines={1}>{roomForSize.description || 'Standard boarding room'}</AppText>
                    </View>
                  </View>
                  <AppText style={[styles.optionPrice, isSelected && { color: theme.colors.primaryDark }]}>
                    ₹ {roomForSize.price}/night
                  </AppText>
                </TouchableOpacity>
              );
            }) : (
              <AppText style={{ color: theme.colors.textSecondary }}>No room types available</AppText>
            )}
          </View>
        </View>

        {aggressiveFee > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="alert-outline" size={20} color="#D32F2F" />
              <AppText style={styles.sectionTitle} weight="bold">Behavioral Profile</AppText>
            </View>
            <TouchableOpacity
              style={[styles.optionCard, isAggressive && { borderColor: '#D32F2F', backgroundColor: 'rgba(211, 47, 47, 0.05)' }, { marginTop: 12 }]}
              onPress={() => setIsAggressive(!isAggressive)}
              activeOpacity={0.8}
            >
              <View style={styles.optionLeft}>
                <MaterialCommunityIcons
                  name={isAggressive ? "checkbox-marked" : "checkbox-blank-outline"}
                  size={22}
                  color={isAggressive ? "#D32F2F" : theme.colors.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <AppText style={[styles.optionTitle, isAggressive && { color: "#D32F2F" }]}>
                    Aggressive Dog Handling
                  </AppText>
                  <AppText style={{ fontSize: 11, color: theme.colors.textSecondary }}>Required for pets with high temperament</AppText>
                </View>
              </View>
              <AppText style={[styles.optionPrice, isAggressive && { color: "#D32F2F" }]}>
                +₹ {aggressiveFee}/night
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="food-apple-outline" size={20} color={theme.colors.primaryDark} />
            <AppText style={styles.sectionTitle} weight="bold">Meal Selection</AppText>
          </View>
          <View style={{ gap: 12, marginTop: 12 }}>
            {meals.length > 0 ? Array.from(new Set(meals.map(m => m.name))).map(mealName => {
              const mealForSize = meals.find(m => m.name === mealName && m.petSize?.toLowerCase() === size.toLowerCase()) || meals.find(m => m.name === mealName);
              if (!mealForSize) return null;

              const isSelected = selectedMeal?.name === mealName;
              return (
                <TouchableOpacity
                  key={mealName}
                  style={[styles.optionCard, isSelected && styles.optionCardActive]}
                  onPress={() => setSelectedMeal(mealForSize)}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionLeft}>
                    <MaterialCommunityIcons
                      name={isSelected ? "radiobox-marked" : "radiobox-blank"}
                      size={22}
                      color={isSelected ? theme.colors.primaryDark : theme.colors.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <AppText style={[styles.optionTitle, isSelected && { color: theme.colors.primaryDark }]}>
                        {mealName}
                      </AppText>
                      <AppText style={{ fontSize: 11, color: theme.colors.textSecondary }} numberOfLines={1}>{mealForSize.description || 'Standard meal option'}</AppText>
                    </View>
                  </View>
                  <AppText style={[styles.optionPrice, isSelected && { color: theme.colors.primaryDark }]}>
                    {Number(mealForSize.price) === 0 ? 'Included' : ` ₹ ${mealForSize.price}/meal`}
                  </AppText>
                </TouchableOpacity>
              );
            }) : (
              <AppText style={{ color: theme.colors.textSecondary }}>No meal plans available</AppText>
            )}
          </View>

          {selectedMeal?.name?.toLowerCase().includes('luxury') && (
            <View style={styles.customMealBox}>
              <AppText style={styles.label}>Meal Customization Notes</AppText>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Any specific instructions for luxury meals?"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                value={customMealText}
                onChangeText={setCustomMealText}
              />
            </View>
          )}

          <AppText style={[styles.label, { marginTop: 20, marginBottom: 12 }]}>Feeding Frequency</AppText>
          <View style={styles.chipRow}>
            {FREQUENCIES.map(freq => (
              <TouchableOpacity
                key={freq}
                style={[styles.chip, frequency === freq && styles.chipActive]}
                onPress={() => setFrequency(freq)}
              >
                <AppText style={[styles.chipText, frequency === freq && styles.chipTextActive]}>
                  {freq} daily
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.totalSection}>
          <View>
            <AppText style={styles.totalLabel}>Grand Total ({nights} {nights === 1 ? 'night' : 'nights'})</AppText>
            <AppText style={{ fontSize: 11, color: theme.colors.textSecondary }}>Incl. taxes and service fees</AppText>
          </View>
          <AppText style={styles.totalValue} weight="bold">₹ {calculateTotal()}</AppText>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, !isFormValid() && { backgroundColor: theme.colors.textSecondary }]}
          activeOpacity={0.8}
          disabled={!isFormValid()}
          onPress={() => navigation.navigate('BoardingReview', {
            ...route.params,
            expert,
            selectedRoom,
            selectedMeal,
            size,
            frequency,
            customMealText,
            isAggressive,
            aggressiveFee,
            nights,
            total: calculateTotal()
          })}
        >
          <AppText style={styles.confirmBtnText} weight="bold">Review Booking</AppText>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 24,
    paddingTop: 40,
    paddingBottom: 15,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    marginLeft: -5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    color: theme.colors.textBlack,
    fontFamily: theme.fonts.heading,
  },
  nightsBadge: {
    backgroundColor: 'rgba(78, 108, 72, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  nightsBadgeText: {
    fontSize: 12,
    color: theme.colors.primaryDark,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: theme.colors.white,
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    color: theme.colors.textBlack,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  chipActive: {
    backgroundColor: theme.colors.primaryDark,
    borderColor: theme.colors.primaryDark,
  },
  chipText: {
    fontSize: 13,
    color: theme.colors.textBlack,
    fontWeight: '500',
  },
  chipTextActive: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#F8F9FA',
  },
  optionCardActive: {
    borderColor: theme.colors.primaryDark,
    backgroundColor: 'rgba(78, 108, 72, 0.05)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    color: theme.colors.textBlack,
    fontWeight: '600',
  },
  optionPrice: {
    fontSize: 13,
    color: theme.colors.textBlack,
    fontWeight: '700',
  },
  customMealBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  label: {
    fontSize: 13,
    color: theme.colors.textBlack,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.textBlack,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  bottomBar: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: theme.colors.textBlack,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 22,
    color: theme.colors.primaryDark,
  },
  confirmBtn: {
    backgroundColor: theme.colors.primaryDark,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: theme.colors.white,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
