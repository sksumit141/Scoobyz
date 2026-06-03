import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import AddressHeader from '../components/AddressHeader';
import CustomCalendar from '../components/CustomCalendar';
import ServiceHeader from '../components/ServiceHeader';
import CustomTimePicker from '../components/CustomTimePicker';
import { theme } from '../styles/theme';
import { formatISTDate } from '../utils/date_utils';

const { width } = Dimensions.get('window');

const generateDates = (monthDate) => {
  const datesArr = [];
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getMonth() === monthDate.getMonth() && now.getFullYear() === monthDate.getFullYear();
  let currentD = isCurrentMonth ? now.getDate() : 1;

  for (let i = 0; i < daysInMonth; i++) {
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

const MORNING_SLOTS = ['06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'];
const NOON_SLOTS = ['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'];
const NIGHT_SLOTS = ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM'];
const ALL_SLOTS = [...MORNING_SLOTS, ...NOON_SLOTS, ...NIGHT_SLOTS];

export default function BoardingServiceScreen({ navigation }) {
  const route = useRoute();

  const [monthDate, setMonthDate] = useState(new Date());
  const generatedDates = generateDates(monthDate);

  const [checkInDate, setCheckInDate] = useState(generatedDates[0]?.fullDate);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [checkInTime, setCheckInTime] = useState('10:00 AM');
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const handlePrevMonth = () => {
    const prev = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1);
    const newDates = generateDates(prev);
    setMonthDate(prev);
    setCheckInDate(newDates[0]?.fullDate);
  };

  const handleNextMonth = () => {
    const next = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const newDates = generateDates(next);
    setMonthDate(next);
    setCheckInDate(newDates[0]?.fullDate);
  };

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const a = new Date(checkInDate);
    const b = new Date(checkOutDate);
    const diff = b.getTime() - a.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const formattedSelected = (checkInDate && checkOutDate)
    ? `${calculateNights()} Nights`
    : 'Select Dates';

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
          const isActive = checkInTime === slot;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.slotItem, styles.slotItemHorizontal, isActive && styles.slotItemActive]}
              onPress={() => setCheckInTime(slot)}
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
      <ServiceHeader title="Dog Boarding" showAddress={false} />


      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle} type="heading" weight="bold">Select Dates</AppText>
          <AppText style={styles.nightsBadge} weight="bold">{formattedSelected}</AppText>
        </View>

        <View style={styles.calendarCard}>
          <CustomCalendar
            isRange={true}
            startDate={checkInDate}
            endDate={checkOutDate}
            onRangeSelect={(start, end) => {
              setCheckInDate(start);
              setCheckOutDate(end);
            }}
          />
        </View>

        {/* Check-in Time */}
        <AppText style={[styles.sectionTitle, { marginTop: 24, marginBottom: 16 }]} type="heading" weight="bold">Check-in Time</AppText>

        {renderSlotSection('Morning', 'weather-sunny', MORNING_SLOTS)}
        {renderSlotSection('Noon', 'white-balance-sunny', NOON_SLOTS)}
        {renderSlotSection('Night', 'weather-night', NIGHT_SLOTS)}

        {/* Custom Slot Button */}
        <TouchableOpacity
          style={[
            styles.slotItem,
            styles.customSlotBtn,
            checkInTime && !ALL_SLOTS.includes(checkInTime) && styles.slotItemActive,
            { width: '100%', marginTop: 10 }
          ]}
          onPress={() => setTimePickerVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name="plus" 
            size={18} 
            color={checkInTime && !ALL_SLOTS.includes(checkInTime) ? theme.colors.white : theme.colors.primaryDark} 
          />
          <AppText
            style={[
              styles.slotText,
              checkInTime && !ALL_SLOTS.includes(checkInTime) && styles.slotTextActive,
            ]}
          >
            {checkInTime && !ALL_SLOTS.includes(checkInTime) ? `Selected: ${checkInTime}` : 'Add Custom Time'}
          </AppText>
        </TouchableOpacity>

        <CustomTimePicker
          visible={timePickerVisible}
          initialTime={checkInTime}
          onConfirm={(time) => setCheckInTime(time)}
          onClose={() => setTimePickerVisible(false)}
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Fixed Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomInfo}>
          <AppText style={styles.bottomLabel}>Duration</AppText>
          <AppText style={styles.bottomValue} weight="bold">{formattedSelected}</AppText>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, (!checkInDate || !checkOutDate) && { backgroundColor: theme.colors.textSecondary }]}
          activeOpacity={0.8}
          disabled={!checkInDate || !checkOutDate}
          onPress={() => {
            const currentParams = route?.params || {};
            navigation.navigate('BoardingLocation', {
              ...currentParams,
              serviceDate: checkInDate,
              endDate: checkOutDate,
              checkInTime,
              serviceName: 'Boarding'
            });
          }}
        >
          <AppText style={styles.confirmBtnText} weight="bold">Find Locations</AppText>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingLeft: 18,
    paddingRight: 24,
    paddingTop: 40,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: theme.colors.textBlack,
    fontFamily: theme.fonts.heading,
  },
  nightsBadge: {
    backgroundColor: 'rgba(61, 42, 94, 0.1)',
    color: theme.colors.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 14,
  },
  calendarCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  timePickerCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  timePickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  timeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  timePickerValue: {
    fontSize: 18,
    color: theme.colors.textBlack,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  dateScroll: {
    marginHorizontal: -24,
  },
  dateScrollContent: {
    paddingHorizontal: 24,
    gap: 12,
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
    backgroundColor: theme.colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  slotItemActive: {
    backgroundColor: theme.colors.primaryDark,
  },
  slotText: {
    fontSize: 13,
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
  },
  slotTextActive: {
    color: theme.colors.white,
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
