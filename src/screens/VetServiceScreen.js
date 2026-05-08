import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import CustomCalendar from '../components/CustomCalendar';
import ServiceHeader from '../components/ServiceHeader';
import CustomTimePicker from '../components/CustomTimePicker';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

const CONSULT_TYPES = ['Video Consult', 'Clinic Visit', 'Home Visit'];
const SLOTS = ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:30 PM'];

const generateDates = (monthDate) => {
  const datesArr = [];
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getMonth() === monthDate.getMonth() && now.getFullYear() === monthDate.getFullYear();
  let currentD = isCurrentMonth ? now.getDate() : 1;

  for (let i = 0; i < 14; i++) { // Show next 14 days
    if (currentD + i > daysInMonth) break;
    const d = new Date(monthDate.getFullYear(), monthDate.getMonth(), currentD + i);
    const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    datesArr.push({
      day: isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate().toString().padStart(2, '0'),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      fullDate: d.toDateString()
    });
  }
  return datesArr;
};

export default function VetServiceScreen({ navigation }) {
  const route = useRoute();

  const [consultType, setConsultType] = useState('Clinic Visit');
  const [monthDate, setMonthDate] = useState(new Date());
  const generatedDates = generateDates(monthDate);
  const [selectedDate, setSelectedDate] = useState(generatedDates[0]?.fullDate);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const isFormValid = () => {
    return selectedDate && selectedSlot;
  };

  return (
    <AppScreen safeArea={true} padding={false} scrollable={false} backgroundColor={theme.colors.background}>
      <ServiceHeader title="Veterinary" />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Settings Card */}
        <View style={styles.card}>
          <AppText style={styles.label} weight="bold">Consultation Type</AppText>
          <View style={styles.chipRow}>
            {CONSULT_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.chip, consultType === type && styles.chipActive]}
                onPress={() => setConsultType(type)}
              >
                <AppText style={[styles.chipText, consultType === type && styles.chipTextActive]}>{type}</AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Schedule & Time */}
        <View style={styles.card}>
          <AppText style={styles.label} weight="bold">Select Date</AppText>

          <CustomCalendar
            selectedDate={selectedDate}
            onDateSelect={(date) => setSelectedDate(date)}
          />

          <View style={styles.divider} />

          <AppText style={styles.label} weight="bold">Time Slot</AppText>
          <View style={styles.slotsGrid}>
            {SLOTS.map((slot, index) => {
              const isActive = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={`slot-${index}`}
                  style={[styles.slotItem, isActive && styles.slotItemActive]}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.8}
                >
                  <AppText style={[styles.slotText, isActive && styles.slotTextActive]}>{slot}</AppText>
                </TouchableOpacity>
              )
            })}

            {/* Custom Slot Button */}
            <TouchableOpacity
              style={[
                styles.slotItem,
                styles.customSlotBtn,
                selectedSlot && !SLOTS.includes(selectedSlot) && styles.slotItemActive,
              ]}
              onPress={() => setTimePickerVisible(true)}
              activeOpacity={0.8}
            >
              <AppText
                style={[
                  styles.slotText,
                  selectedSlot && !SLOTS.includes(selectedSlot) && styles.slotTextActive,
                ]}
              >
                {selectedSlot && !SLOTS.includes(selectedSlot) ? selectedSlot : 'Custom'}
              </AppText>
            </TouchableOpacity>
          </View>

          <CustomTimePicker
            visible={timePickerVisible}
            initialTime={selectedSlot || '09:00 AM'}
            onConfirm={(time) => setSelectedSlot(time)}
            onClose={() => setTimePickerVisible(false)}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Fixed Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomInfo}>
          <AppText style={styles.bottomLabel}>{consultType}</AppText>
          <AppText style={styles.bottomValue} weight="bold" numberOfLines={1}>
            {selectedSlot ? `${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${selectedSlot}` : 'Select Date & Time'}
          </AppText>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, !isFormValid() && { backgroundColor: theme.colors.textSecondary }]}
          activeOpacity={0.8}
          disabled={!isFormValid()}
          onPress={() => {
            const currentParams = route?.params || {};
            navigation.navigate('VetList', {
              ...currentParams,
              consultType,
              date: selectedDate,
              time: selectedSlot,
              serviceName: 'Veterinary'
            });
          }}
        >
          <AppText style={styles.confirmBtnText} weight="bold">Find Vets</AppText>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 24,
    paddingTop: 40,
    paddingBottom: 10,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    color: theme.colors.textBlack,
    fontFamily: theme.fonts.heading,
    marginLeft: -5,
    marginTop: 5
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    color: theme.colors.textBlack,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: theme.colors.white,
  },
  chipActive: {
    backgroundColor: theme.colors.primaryDark,
    borderColor: theme.colors.primaryDark,
  },
  chipText: {
    fontSize: 14,
    color: theme.colors.textBlack,
  },
  chipTextActive: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 20,
  },
  dateScroll: {
    marginHorizontal: -24,
  },
  dateScrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  dateCard: {
    width: 72,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dateCardActive: {
    backgroundColor: theme.colors.primaryDark,
  },
  dateDay: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  dateNum: {
    fontSize: 24,
    color: theme.colors.primaryDark,
    marginBottom: 4,
  },
  dateMonth: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotItem: {
    width: '31%',
    backgroundColor: theme.colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  slotItemActive: {
    backgroundColor: theme.colors.primaryDark,
  },
  customSlotBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderColor: theme.colors.primaryDark,
    backgroundColor: theme.colors.white,
  },
  slotText: {
    fontSize: 13,
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
  },
  slotTextActive: {
    color: theme.colors.white,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 30, // Safe area padding
  },
  bottomInfo: {
    flex: 1,
  },
  bottomLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  bottomValue: {
    fontSize: 15,
    color: theme.colors.textBlack,
    letterSpacing: 0.3,
  },
  confirmBtn: {
    backgroundColor: theme.colors.success,
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 16,
  },
  confirmBtnText: {
    color: theme.colors.white,
    fontSize: 16,
  },
});
