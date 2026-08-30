import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import CustomCalendar from '../components/CustomCalendar';
import ServiceHeader from '../components/ServiceHeader';
import CustomTimePicker from '../components/CustomTimePicker';
import SelectionChoiceModal from '../components/SelectionChoiceModal';
import { theme } from '../styles/theme';
import { formatISTDate } from '../utils/date_utils';

const { width } = Dimensions.get('window');

const DURATIONS = ['30 min', '45 min', '1 hr'];
const FREQUENCIES = ['One-time', 'Monthly'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MORNING_SLOTS = ['06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'];
const NOON_SLOTS = ['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'];
const NIGHT_SLOTS = ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM'];
const ALL_SLOTS = [...MORNING_SLOTS, ...NOON_SLOTS, ...NIGHT_SLOTS];

const generateDates = (monthDate) => {
  const datesArr = [];
  const now = new Date();
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonths = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const daysInMonth = daysInMonths[month];

  const isCurrentMonth = now.getMonth() === month && now.getFullYear() === year;
  const startDay = isCurrentMonth ? now.getDate() : 1;

  for (let day = startDay; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
    datesArr.push({
      day: isToday ? 'Today' : formatISTDate(d, { weekday: 'short' }),
      date: day.toString().padStart(2, '0'),
      month: formatISTDate(d, { month: 'short' }),
      year: year,
      fullDate: d.toDateString() // Full parsable string
    });
  }
  return datesArr;
};

const calculateEndTime = (startTimeStr, durationLabel) => {
  if (!startTimeStr) return '';
  const [time, period] = startTimeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  let addMins = 0;
  if (durationLabel === '30 min') addMins = 30;
  else if (durationLabel === '45 min') addMins = 45;
  else if (durationLabel === '1 hr') addMins = 60;

  minutes += addMins;
  hours += Math.floor(minutes / 60);
  minutes = minutes % 60;

  const endPeriod = hours >= 12 && hours < 24 ? 'PM' : 'AM';
  let endHours = hours % 12;
  if (endHours === 0) endHours = 12;

  return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${endPeriod}`;
};

export default function WalkingServiceScreen({ navigation }) {
  const route = useRoute();
  const { isDemo, pet, serviceName } = route.params || {};

  const [duration, setDuration] = useState(isDemo ? '30 min' : '45 min');
  const [frequency, setFrequency] = useState('One-time');
  const [timesPerDay, setTimesPerDay] = useState(1);

  const [monthDate, setMonthDate] = useState(new Date());
  const generatedDates = generateDates(monthDate);
  const [selectedDate, setSelectedDate] = useState(generatedDates[0]?.fullDate);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [choiceModalVisible, setChoiceModalVisible] = useState(false);
  const [customSlot, setCustomSlot] = useState(null);

  const [endDate, setEndDate] = useState(null);
  const [validationMsg, setValidationMsg] = useState('');

  const handlePrevMonth = () => {
    const prev = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1);
    const newDates = generateDates(prev);
    setMonthDate(prev);
    setSelectedDate(newDates[0]?.fullDate);
  };

  const handleNextMonth = () => {
    const next = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const newDates = generateDates(next);
    setMonthDate(next);
    setSelectedDate(newDates[0]?.fullDate);
  };

  useEffect(() => {
    if (selectedDate && (frequency === 'Weekly' || frequency === 'Monthly')) {
      const start = new Date(selectedDate);
      const daysToAdd = frequency === 'Weekly' ? 7 : 30;
      const end = new Date(start);
      end.setDate(start.getDate() + daysToAdd);
      setEndDate(end.toDateString());
    } else {
      setEndDate(null);
    }
  }, [selectedDate, frequency]);

  const toggleSlot = (slot) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else if (selectedSlots.length < timesPerDay) {
      setSelectedSlots([...selectedSlots, slot].sort((a, b) => {
        return ALL_SLOTS.indexOf(a) - ALL_SLOTS.indexOf(b);
      }));
    } else {
      const newSlots = [...selectedSlots.slice(1), slot].sort((a, b) => ALL_SLOTS.indexOf(a) - ALL_SLOTS.indexOf(b));
      setSelectedSlots(newSlots);
    }
  };

  const getFilteredSlots = () => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
      });

      const parts = formatter.formatToParts(new Date());
      const getPart = (type) => parseInt(parts.find(p => p.type === type).value, 10);

      const nowIST = new Date(
        getPart('year'), getPart('month') - 1, getPart('day'),
        getPart('hour') === 24 ? 0 : getPart('hour'), getPart('minute'), getPart('second')
      );

      const isToday = selectedDate && new Date(selectedDate).toDateString() === nowIST.toDateString();
      const nineAmIndex = ALL_SLOTS.indexOf('09:00 AM');

      if (!isToday) return ALL_SLOTS.slice(nineAmIndex, nineAmIndex + 9);

      const oneHourFromNowIST = new Date(nowIST.getTime() + 60 * 60 * 1000);
      const nineAmIST = new Date(nowIST);
      nineAmIST.setHours(9, 0, 0, 0);

      return ALL_SLOTS.filter(slot => {
        const [time, period] = slot.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        const slotTimeIST = new Date(nowIST);
        slotTimeIST.setHours(hours, minutes, 0, 0);

        return slotTimeIST > oneHourFromNowIST && slotTimeIST >= nineAmIST;
      }).slice(0, 9);
    } catch (e) {
      console.warn('getFilteredSlots fallback:', e);
      const nineAmIndex = ALL_SLOTS.indexOf('09:00 AM');
      return ALL_SLOTS.slice(nineAmIndex, nineAmIndex + 9);
    }
  };

  const availableSlots = getFilteredSlots();

  let calculatedPrice = 0;
  // if (!isDemo) {
  if (frequency === 'One-time') {
    if (timesPerDay === 1) {
      if (duration === '30 min') calculatedPrice = 149;
      if (duration === '45 min') calculatedPrice = 179;
      if (duration === '1 hr') calculatedPrice = 199;
    } else if (timesPerDay === 2) {
      if (duration === '30 min') calculatedPrice = 275;
      if (duration === '45 min') calculatedPrice = 320;
      if (duration === '1 hr') calculatedPrice = 349;
    } else if (timesPerDay === 3) {
      if (duration === '30 min') calculatedPrice = 425;
      if (duration === '45 min') calculatedPrice = 500;
      if (duration === '1 hr') calculatedPrice = 600;
    }
  } else if (frequency === 'Monthly') {
    let base = 0;
    if (timesPerDay === 1) base = 2799;
    else if (timesPerDay === 2) base = 4499;
    else if (timesPerDay === 3) base = 5999;

    let extra = 0;
    if (duration === '45 min') extra = 200;
    if (duration === '1 hr') extra = 350;

    calculatedPrice = base + extra;
  }
  // }

  const totalPrice = calculatedPrice; // isDemo ? 0 : calculatedPrice;

  const handleContinue = () => {
    if (!selectedSlots || selectedSlots.length !== timesPerDay) {
      alert(`Please select exactly ${timesPerDay} time slot(s).`);
      return;
    }
    if (isDemo) {
      const currentParams = route?.params || {};
      navigation.navigate('BookVendor', {
        ...currentParams,
        duration: '30 min',
        frequency: 'One-time',
        timesPerDay: 1,
        date: selectedDate,
        time: selectedSlots.join(', '),
        total: 0,
        serviceName: 'Walking',
        serviceType: 'Walking',
        expert: { id: 'scoobyz_match', name: 'Scoobyz Team Match' }
      });
      return;
    }
    setChoiceModalVisible(true);
  };

  const isFormValid = () => {
    return selectedDate && selectedSlots.length === timesPerDay;
  };

  return (
    <AppScreen safeAreaTop={true} padding={false} scrollable={false} backgroundColor={theme.colors.background}>
      <ServiceHeader title="Dog Walking" showAddress={false} />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {validationMsg ? (
          <View style={styles.validationBanner}>
            <Ionicons name="alert-circle-outline" size={24} color="#D32F2F" />
            <AppText style={styles.validationText}>{validationMsg}</AppText>
          </View>
        ) : null}

        {/* Settings Card */}
        <View style={styles.card}>
          <AppText style={styles.label} weight="bold">Duration</AppText>
          {/* {isDemo && <AppText style={{ color: theme.colors.primaryDark, fontSize: 13, marginBottom: 12 }}>Free demo walk is locked to 30 mins</AppText>} */}
          <View style={styles.chipRow}>
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, duration === d && styles.chipActive]}
                onPress={() => {
                  setDuration(d);
                }}
                activeOpacity={0.7}
              >
                <AppText style={[styles.chipText, duration === d && styles.chipTextActive]}>{d}</AppText>
              </TouchableOpacity>
            ))}
          </View>

          <AppText style={[styles.label, { marginTop: 20 }]} weight="bold">Subscription</AppText>
          {/* {isDemo && <AppText style={{ color: theme.colors.primaryDark, fontSize: 13, marginBottom: 12 }}>Free demo walk is locked to 1 Day</AppText>} */}
          <View style={styles.chipRow}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.chip, frequency === f && styles.chipActive]}
                onPress={() => {
                  setFrequency(f);
                }}
                activeOpacity={0.7}
              >
                <AppText style={[styles.chipText, frequency === f && styles.chipTextActive]}>{f === 'One-time' ? '1 Day' : f}</AppText>
              </TouchableOpacity>
            ))}
          </View>

          <AppText style={[styles.label, { marginTop: 20 }]} weight="bold">Frequency</AppText>
          <View style={styles.chipRow}>
            {[1, 2, 3].map(times => (
              <TouchableOpacity
                key={times}
                style={[styles.chip, timesPerDay === times && styles.chipActive]}
                onPress={() => {
                  setTimesPerDay(times);
                  if (selectedSlots.length > times) {
                    setSelectedSlots(selectedSlots.slice(0, times));
                  }
                }}
              >
                <AppText style={[styles.chipText, timesPerDay === times && styles.chipTextActive]}>
                  {times} {times === 1 ? 'time' : 'times'}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Selection */}
        <View style={[styles.sectionHeader, { marginBottom: 5 }]}>
          <AppText style={styles.sectionTitle} weight="bold">
            {frequency === 'One-time' ? 'Select Date' : 'Start Date'}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={handlePrevMonth} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="chevron-left" size={22} color={theme.colors.primaryDark} />
            </TouchableOpacity>
            <AppText style={styles.monthText}>{formatISTDate(monthDate, { month: 'long', year: 'numeric' })}</AppText>
            <TouchableOpacity onPress={handleNextMonth} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.primaryDark} />
            </TouchableOpacity>
          </View>
        </View>

        {/* <View style={styles.card}>
          <CustomCalendar
            selectedDate={selectedDate}
            onDateSelect={(date) => setSelectedDate(date)}
          />
        </View> */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScrollContent}
          style={styles.dateScroll}
        >
          {generatedDates.map((d, index) => {
            const isActive = selectedDate === d.fullDate;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateCard,
                  isActive && styles.dateCardActive,
                  index === generatedDates.length - 1 && { marginRight: 0 } // Remove margin from last item
                ]}
                onPress={() => setSelectedDate(d.fullDate)}
                activeOpacity={0.8}
              >
                <AppText style={[styles.dateDay, isActive && styles.chipTextActive]}>{d.day}</AppText>
                <AppText style={[styles.dateNum, isActive && styles.chipTextActive]} weight="bold">{d.date}</AppText>
                <AppText style={[styles.dateMonth, isActive && styles.chipTextActive]}>{d.month}</AppText>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {endDate && (
          <View style={styles.endDateContainer}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={theme.colors.primaryDark} />
            <AppText style={styles.endDateText}>
              Plan Ends on: <AppText weight="bold" style={{ color: theme.colors.primaryDark }}>{formatISTDate(endDate)}</AppText>
            </AppText>
          </View>
        )}

        <View style={[styles.sectionHeader, { marginTop: -30 }]}>
          <AppText style={styles.sectionTitle} weight="bold">
            {frequency === 'One-time' ? 'Time Slot' : 'Session Time'}
          </AppText>
        </View>

        <View style={styles.slotsGrid}>
          {availableSlots.length > 0 ? (
            availableSlots.map((slot, index) => {
              const isActive = selectedSlots.includes(slot);
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.slotItem, isActive && styles.slotItemActive]}
                  onPress={() => toggleSlot(slot)}
                  activeOpacity={0.8}
                >
                  <AppText style={[styles.slotText, isActive && styles.slotTextActive]}>{slot}</AppText>
                </TouchableOpacity>
              )
            })
          ) : (
            <AppText style={{ color: theme.colors.textSecondary, fontStyle: 'italic', paddingBottom: 10, marginTop: -8 }}>
              No slots available for today. Please select a future date.
            </AppText>
          )}
        </View>

        {/* Custom Slot Button */}
        <TouchableOpacity
          style={[
            styles.slotItem,
            styles.customSlotBtn,
            customSlot && !ALL_SLOTS.includes(customSlot) && styles.slotItemActive,
            { width: '100%', marginTop: 10, marginBottom: 24 }
          ]}
          onPress={() => setTimePickerVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="plus"
            size={18}
            color={customSlot && !ALL_SLOTS.includes(customSlot) ? theme.colors.white : theme.colors.primaryDark}
          />
          <AppText
            style={[
              styles.slotText,
              customSlot && !ALL_SLOTS.includes(customSlot) && styles.slotTextActive,
            ]}
          >
            {customSlot && !ALL_SLOTS.includes(customSlot) ? `Selected: ${customSlot}` : 'Add Custom Time'}
          </AppText>
        </TouchableOpacity>

        <CustomTimePicker
          visible={timePickerVisible}
          initialTime={customSlot || '09:00 AM'}
          onConfirm={(time) => {
            setCustomSlot(time);
            toggleSlot(time);
          }}
          onClose={() => setTimePickerVisible(false)}
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Fixed Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomInfo}>
          <AppText style={styles.bottomLabel}>{frequency} • {duration}</AppText>
          <AppText style={styles.bottomValue} weight="bold" numberOfLines={1}>
            {selectedSlots.length > 0
              ? selectedSlots.join(', ')
              : 'Select Time'}
          </AppText>
        </View>
        <TouchableOpacity
          style={styles.confirmBtn}
          activeOpacity={0.8}
          onPress={() => {
            if (!isFormValid()) {
              setValidationMsg(`Please select exactly ${timesPerDay} time slot(s) for your walks.`);
              setTimeout(() => setValidationMsg(''), 3000);
              return;
            }
            const currentParams = route?.params || {};
            navigation.navigate('ReviewDetails', {
              ...currentParams,
              duration,
              frequency,
              timesPerDay,
              date: selectedDate,
              time: selectedSlots.join(', '),
              total: totalPrice,
              serviceName: 'Walking',
              serviceType: 'Walking',
              expert: { id: 'scoobyz_match', name: 'Scoobyz Team Match' }
            });
          }}
        >
          <AppText style={styles.confirmBtnText} weight="bold">Confirm</AppText>
        </TouchableOpacity>
      </View>

      {/* SelectionChoiceModal bypassed for Walking per requirement */}
      {/* 
      <SelectionChoiceModal
        ...
      /> 
      */}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 24,
    paddingTop: 10,
    paddingBottom: 10,
  },
  validationBanner: {
    backgroundColor: '#FFEBEE',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 16,
    borderRadius: 8,
  },
  validationText: {
    marginLeft: 10,
    color: '#D32F2F',
    fontSize: 14,
    flex: 1,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    color: theme.colors.textBlack,
    fontFamily: theme.fonts.heading,
  },
  monthText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
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
    marginBottom: 32,
  },
  dateScrollContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  dateCard: {
    width: 60,
    height: 90,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginRight: 12,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  dateCardActive: {
    backgroundColor: theme.colors.primaryDark,
  },
  dateDay: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  dateNum: {
    fontSize: 20,
    color: theme.colors.primaryDark,
    marginBottom: 2,
  },
  dateMonth: {
    fontSize: 12,
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
    marginBottom: 24,
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
    backgroundColor: theme.colors.white,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
    backgroundColor: theme.colors.white,
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
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  confirmBtnText: {
    color: theme.colors.white,
    fontSize: 16,
  },
  endDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(73, 94, 113, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginTop: -30, // Pulled up closer to dates
    marginBottom: 50, // Maintains gap below
    gap: 10,
  },
  endDateText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
});
