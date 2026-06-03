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
import { formatISTDate } from '../utils/date_utils';

const { width } = Dimensions.get('window');

const CONSULT_TYPES = ['Video Consult', 'Clinic Visit', 'Home Visit'];
const MORNING_SLOTS = ['06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'];
const NOON_SLOTS = ['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'];
const NIGHT_SLOTS = ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM'];
const ALL_SLOTS = [...MORNING_SLOTS, ...NOON_SLOTS, ...NIGHT_SLOTS];

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
      day: isToday ? 'Today' : formatISTDate(d, { weekday: 'short' }),
      date: d.getDate().toString().padStart(2, '0'),
      month: formatISTDate(d, { month: 'short' }),
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
  const [selectedSlot, setSelectedSlot] = useState('09:00 AM');
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const isFormValid = () => {
    return selectedDate && selectedSlot;
  };

  const renderSlotSection = (title, icon, slots) => (
    <View style={styles.slotSection}>
      <View style={styles.slotSectionHeader}>
        <MaterialCommunityIcons name={icon} size={18} color={theme.colors.primaryDark} />
        <AppText style={styles.slotSectionTitle} weight="bold">{title}</AppText>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slotsHorizontalScroll}
        style={styles.slotsScrollWrapper}
      >
        {slots.map((slot, index) => {
          const isActive = selectedSlot === slot;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.slotItem, styles.slotItemHorizontal, isActive && styles.slotItemActive]}
              onPress={() => setSelectedSlot(slot)}
              activeOpacity={0.8}
            >
              <AppText style={[styles.slotText, isActive && styles.slotTextActive]}>{slot}</AppText>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  );

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
        </View>

        <AppText style={[styles.label, { marginBottom: 16, marginTop: 8 }]} weight="bold">Time Slot</AppText>
        
        {renderSlotSection('Morning', 'weather-sunny', MORNING_SLOTS)}
        {renderSlotSection('Noon', 'white-balance-sunny', NOON_SLOTS)}
        {renderSlotSection('Night', 'weather-night', NIGHT_SLOTS)}

        {/* Custom Slot Button */}
        <TouchableOpacity
          style={[
            styles.slotItem,
            styles.customSlotBtn,
            selectedSlot && !ALL_SLOTS.includes(selectedSlot) && styles.slotItemActive,
            { width: '100%', marginTop: 10 }
          ]}
          onPress={() => setTimePickerVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name="plus" 
            size={18} 
            color={selectedSlot && !ALL_SLOTS.includes(selectedSlot) ? theme.colors.white : theme.colors.primaryDark} 
          />
          <AppText
            style={[
              styles.slotText,
              selectedSlot && !ALL_SLOTS.includes(selectedSlot) && styles.slotTextActive,
            ]}
          >
            {selectedSlot && !ALL_SLOTS.includes(selectedSlot) ? `Selected: ${selectedSlot}` : 'Add Custom Time'}
          </AppText>
        </TouchableOpacity>

        <CustomTimePicker
          visible={timePickerVisible}
          initialTime={selectedSlot || '09:00 AM'}
          onConfirm={(time) => setSelectedSlot(time)}
          onClose={() => setTimePickerVisible(false)}
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Fixed Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomInfo}>
          <AppText style={styles.bottomLabel}>{consultType}</AppText>
          <AppText style={styles.bottomValue} weight="bold" numberOfLines={1}>
            {selectedSlot ? `${formatISTDate(selectedDate, { month: 'short', day: 'numeric' })}, ${selectedSlot}` : 'Select Date & Time'}
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
  slotSection: {
    marginBottom: 20,
  },
  slotSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    backgroundColor: 'rgba(61, 42, 94, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  slotSectionTitle: {
    fontSize: 14,
    color: theme.colors.primaryDark,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  slotsScrollWrapper: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  slotsHorizontalScroll: {
    paddingRight: 48,
    gap: 10,
    paddingBottom: 8,
  },
  slotItem: {
    width: '31%',
    backgroundColor: theme.colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  slotItemHorizontal: {
    width: 110,
    marginBottom: 0,
    backgroundColor: theme.colors.white, // Ensure white bg in scroll
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
