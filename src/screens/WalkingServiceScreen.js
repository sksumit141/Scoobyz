import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Alert, Modal } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import CustomCalendar from '../components/CustomCalendar';
import ServiceHeader from '../components/ServiceHeader';
import CustomTimePicker from '../components/CustomTimePicker';
import SelectionChoiceModal from '../components/SelectionChoiceModal';
import { theme } from '../styles/theme';
import { formatISTDate } from '../utils/date_utils';
import { canNavigateToPreviousServiceMonth, isServiceTimeAllowed, SERVICE_TIME_NOTICE } from '../utils/serviceTime';
import { discoverApi } from '../services/api';

const { width } = Dimensions.get('window');

const DURATIONS = ['30 min', '45 min', '1 hr'];
const FREQUENCIES = ['One-time', 'Monthly'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MORNING_SLOTS = ['05:00 AM', '05:30 AM', '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'];
const AFTERNOON_SLOTS = ['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'];
const EVENING_SLOTS = ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM', '12:00 AM'];
const ALL_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS, ...EVENING_SLOTS];

const getSlotMinutes = (slot) => {
  const match = String(slot || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  const minutes = hour * 60 + minute;
  return minutes === 0 ? 24 * 60 : minutes;
};

const WALK_PERIODS = {
  morning: { name: 'morning', title: 'Morning', label: '5:00 AM – 11:30 AM', start: 5 * 60, end: 12 * 60 },
  afternoon: { name: 'afternoon', title: 'Afternoon', label: '12:00 PM – 4:30 PM', start: 12 * 60, end: 17 * 60 },
  evening: { name: 'evening/night', title: 'Evening/Night', label: '5:00 PM – 12:00 AM', start: 17 * 60, end: 24 * 60 + 1 },
};
const isSlotInWalkPeriod = (slot, periodKey) => {
  const minutes = getSlotMinutes(slot);
  const period = WALK_PERIODS[periodKey];
  return period && minutes >= period.start && minutes < period.end;
};
const isWithinWalkingHours = (slot) => {
  const minutes = getSlotMinutes(slot);
  return minutes >= 5 * 60 && minutes <= 24 * 60;
};

const isWalkingTimeAllowed = (selectedDate, slot) => {
  if (slot !== '12:00 AM') return isServiceTimeAllowed(selectedDate, slot);

  // Midnight is the end of the selected service day, not its beginning.
  const nextDay = new Date(selectedDate);
  nextDay.setDate(nextDay.getDate() + 1);
  return isServiceTimeAllowed(nextDay, slot);
};

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
  const [selectedWalkPeriods, setSelectedWalkPeriods] = useState([null]);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [choiceModalVisible, setChoiceModalVisible] = useState(false);
  const [customSlot, setCustomSlot] = useState(null);
  const [unavailableSlotInfo, setUnavailableSlotInfo] = useState(null);

  const [endDate, setEndDate] = useState(null);
  const [pricingData, setPricingData] = useState(null);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await discoverApi.walkingPackages();
        if (response?.defaultPricing) {
          setPricingData(response.defaultPricing);
        }
      } catch (error) {
        console.error('Failed to fetch walking pricing:', error);
      }
    };
    fetchPricing();
  }, []);

  const handlePrevMonth = () => {
    if (!canNavigateToPreviousServiceMonth(monthDate)) return;
    const prev = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1);
    const newDates = generateDates(prev);
    setMonthDate(prev);
    setSelectedDate(newDates[0]?.fullDate);
    setSelectedSlots([]);
    setSelectedWalkPeriods([timesPerDay > 1 ? 'morning' : null]);
    setCustomSlot(null);
  };
  const canGoToPreviousMonth = canNavigateToPreviousServiceMonth(monthDate);

  const handleNextMonth = () => {
    const next = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const newDates = generateDates(next);
    setMonthDate(next);
    setSelectedDate(newDates[0]?.fullDate);
    setSelectedSlots([]);
    setSelectedWalkPeriods([timesPerDay > 1 ? 'morning' : null]);
    setCustomSlot(null);
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

  const selectSlot = (slot) => {
    if (timesPerDay === 1) {
      const periodKey = selectedWalkPeriods[0];
      if (!periodKey) {
        Alert.alert('Choose a Time Period', 'Select Morning, Afternoon, or Evening/Night first.');
        return;
      }
      if (!isSlotInWalkPeriod(slot, periodKey)) return;
      setSelectedSlots(selectedSlots.includes(slot) ? [] : [slot]);
      return;
    }

    if (selectedSlots.length >= timesPerDay) return;
    const currentIndex = selectedSlots.length;
    const periodKey = currentIndex === 0 ? 'morning' : selectedWalkPeriods[currentIndex];
    const requiredPeriod = WALK_PERIODS[periodKey];
    if (!requiredPeriod) {
      Alert.alert('Choose a Time Period', `Select Afternoon or Evening/Night for Walk ${currentIndex + 1}.`);
      return;
    }
    if (!isSlotInWalkPeriod(slot, periodKey)) {
      Alert.alert(
        `${requiredPeriod.name.charAt(0).toUpperCase()}${requiredPeriod.name.slice(1)} Walk Required`,
        `Please choose Walk ${currentIndex + 1} during the ${requiredPeriod.name} period.`,
      );
      return;
    }

    const previousSlot = selectedSlots[selectedSlots.length - 1];
    if (previousSlot && getSlotMinutes(slot) <= getSlotMinutes(previousSlot)) {
      Alert.alert('Choose a Later Time', 'Each walk must be scheduled after the previous walk.');
      return;
    }

    setSelectedSlots([...selectedSlots, slot]);
    setCustomSlot(null);
  };

  const selectMorningSlotOnNextDay = (slot) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    setMonthDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    setSelectedDate(nextDate.toDateString());
    setSelectedSlots([slot]);
    setSelectedWalkPeriods(['morning']);
    setCustomSlot(ALL_SLOTS.includes(slot) ? null : slot);
  };

  const explainUnavailableSlot = (slot) => {
    const isMorningSlot = isSlotInWalkPeriod(slot, 'morning');
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const canUseSameTimeNextDay = isMorningSlot
      && isWalkingTimeAllowed(nextDate.toDateString(), slot);

    setTimePickerVisible(false);
    setUnavailableSlotInfo({ slot, nextDate, canUseSameTimeNextDay });
  };

  const changeWalkTime = (walkIndex) => {
    setSelectedSlots(selectedSlots.slice(0, walkIndex));
    setSelectedWalkPeriods(current => current.slice(0, walkIndex + 1));
    setCustomSlot(null);
  };

  const selectWalkPeriod = (periodKey) => {
    const targetWalkIndex = timesPerDay === 1 ? 0 : currentWalkIndex;
    setSelectedWalkPeriods(current => {
      const next = current.slice(0, targetWalkIndex);
      next[targetWalkIndex] = periodKey;
      return next;
    });
    if (timesPerDay === 1) setSelectedSlots([]);
    setCustomSlot(null);
  };

  // Keep the complete daily schedule visible. Slots inside the three-hour
  // booking window are rendered disabled instead of being removed from view.
  const availableSlots = ALL_SLOTS;
  const currentWalkIndex = timesPerDay === 1 ? 0 : selectedSlots.length;
  const previousSelectedSlot = selectedSlots[currentWalkIndex - 1];
  const currentPeriodKey = timesPerDay === 1
    ? selectedWalkPeriods[0]
    : currentWalkIndex === 0
      ? 'morning'
      : selectedWalkPeriods[currentWalkIndex];
  const periodChoices = timesPerDay === 1
    ? ['morning', 'afternoon', 'evening']
    : previousSelectedSlot && getSlotMinutes(previousSelectedSlot) >= WALK_PERIODS.evening.start
      ? ['evening']
      : ['afternoon', 'evening'];
  const currentWalkSlots = availableSlots.filter(slot => {
      if (timesPerDay > 1 && selectedSlots.includes(slot)) return false;
      if (!currentPeriodKey || !isSlotInWalkPeriod(slot, currentPeriodKey)) return false;
      return !previousSelectedSlot || getSlotMinutes(slot) > getSlotMinutes(previousSelectedSlot);
    });

  const getSelectionError = () => {
    if (!selectedSlots || selectedSlots.length !== timesPerDay) {
      return timesPerDay === 1
        ? 'Please select a time slot to continue.'
        : `Please select exactly ${timesPerDay} time slots to continue.`;
    }
    if (timesPerDay > 1 && !isSlotInWalkPeriod(selectedSlots[0], 'morning')) {
      return 'Walk 1 must be scheduled in the morning.';
    }
    if (timesPerDay > 1 && selectedSlots.slice(1).some(slot => (
      !isSlotInWalkPeriod(slot, 'afternoon') && !isSlotInWalkPeriod(slot, 'evening')
    ))) {
      return 'Later walks must be scheduled in the afternoon or evening/night.';
    }
    if (selectedSlots.some(slot => !isWalkingTimeAllowed(selectedDate, slot))) {
      return SERVICE_TIME_NOTICE;
    }
    return null;
  };

  let calculatedPrice = 0;
  if (pricingData && pricingData[frequency]) {
    const timesMap = pricingData[frequency];
    // Find the correct timesPerDay tier (fallback to highest if exceeds map)
    const tier = timesMap[timesPerDay] || timesMap[Object.keys(timesMap).pop()];
    if (tier && tier[duration]) {
      calculatedPrice = tier[duration];
    }
  } else {
    // Fallback if API fails
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
      if (timesPerDay === 1) base = 4299;
      else if (timesPerDay === 2) base = 6499;
      else if (timesPerDay === 3) base = 7999;

      let extra = 0;
      if (duration === '45 min') extra = 200;
      if (duration === '1 hr') extra = 350;

      calculatedPrice = base + extra;
    }
  }

  const totalPrice = calculatedPrice;

  const handleContinue = () => {
    const selectionError = getSelectionError();
    if (selectionError) {
      Alert.alert('Time Selection Required', selectionError);
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
    return Boolean(selectedDate) && !getSelectionError();
  };

  return (
    <AppScreen safeAreaTop={true} padding={false} scrollable={false} backgroundColor={theme.colors.background}>
      <ServiceHeader title="Dog Walking" showAddress={false} />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>

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
                  if (times === timesPerDay) return;
                  setTimesPerDay(times);
                  setSelectedSlots([]);
                  setSelectedWalkPeriods([times === 1 ? null : 'morning']);
                  setCustomSlot(null);
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
            <TouchableOpacity disabled={!canGoToPreviousMonth} onPress={handlePrevMonth} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={!canGoToPreviousMonth && { opacity: 0.3 }}>
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
                onPress={() => {
                  setSelectedDate(d.fullDate);
                  setSelectedSlots([]);
                  setSelectedWalkPeriods(['morning']);
                  setCustomSlot(null);
                }}
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
          <View>
            <AppText style={styles.sectionTitle} weight="bold">
              {frequency === 'One-time' ? 'Time Slot' : 'Session Time'}
            </AppText>
            {timesPerDay > 1 && (
              <AppText style={styles.slotRuleText}>
                Walk 1 starts from 5:00 AM. Choose Afternoon or Evening/Night for later walks.
              </AppText>
            )}
            {timesPerDay === 1 && (
              <AppText style={styles.slotRuleText}>
                Choose Morning, Afternoon, or Evening/Night to see available times.
              </AppText>
            )}
          </View>
        </View>

        {timesPerDay > 1 && selectedSlots.map((slot, index) => (
          <View key={`${index}-${slot}`} style={styles.selectedWalkCard}>
            <View style={styles.walkNumberBadge}>
              <AppText style={styles.walkNumberText} weight="bold">{index + 1}</AppText>
            </View>
            <View style={styles.selectedWalkInfo}>
              <AppText style={styles.selectedWalkLabel}>Walk {index + 1}</AppText>
              <AppText style={styles.selectedWalkTime} weight="bold">{slot}</AppText>
            </View>
            <TouchableOpacity onPress={() => changeWalkTime(index)} style={styles.changeTimeButton}>
              <AppText style={styles.changeTimeText} weight="bold">Change</AppText>
            </TouchableOpacity>
          </View>
        ))}

        {(timesPerDay === 1 || selectedSlots.length < timesPerDay) && availableSlots.length > 0 ? (
          <View style={timesPerDay > 1 ? styles.walkChoiceCard : null}>
            {timesPerDay > 1 && (
              <View style={styles.walkChoiceHeader}>
                <View style={styles.walkNumberBadge}>
                  <AppText style={styles.walkNumberText} weight="bold">{currentWalkIndex + 1}</AppText>
                </View>
                <View style={styles.selectedWalkInfo}>
                  <AppText style={styles.walkChoiceTitle} weight="bold">Choose Walk {currentWalkIndex + 1}</AppText>
                  <AppText style={styles.walkChoiceHint}>
                    {currentWalkIndex === 0
                      ? `${WALK_PERIODS.morning.title}: ${WALK_PERIODS.morning.label}`
                      : currentPeriodKey
                        ? `${WALK_PERIODS[currentPeriodKey].title}: ${WALK_PERIODS[currentPeriodKey].label}`
                        : 'Choose Afternoon or Evening/Night'}
                  </AppText>
                </View>
              </View>
            )}

            {(timesPerDay === 1 || currentWalkIndex > 0) && (
              <View style={styles.periodChoiceRow}>
                {periodChoices.map(periodKey => {
                  const period = WALK_PERIODS[periodKey];
                  const isActive = currentPeriodKey === periodKey;
                  return (
                    <TouchableOpacity
                      key={periodKey}
                      style={[styles.periodChoice, isActive && styles.periodChoiceActive]}
                      onPress={() => selectWalkPeriod(periodKey)}
                    >
                      <AppText style={[styles.periodChoiceTitle, isActive && styles.periodChoiceTextActive]} weight="bold">
                        {period.title}
                      </AppText>
                      <AppText style={[styles.periodChoiceTime, isActive && styles.periodChoiceTextActive]}>
                        {period.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {!currentPeriodKey ? null : currentWalkSlots.length > 0 ? (
              <View style={styles.slotsGrid}>
                {currentWalkSlots.map(slot => {
                  const isActive = selectedSlots.includes(slot);
                  const isUnavailable = !isWalkingTimeAllowed(selectedDate, slot);
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.slotItem,
                        isActive && styles.slotItemActive,
                        isUnavailable && styles.slotItemDisabled,
                      ]}
                      onPress={() => isUnavailable ? explainUnavailableSlot(slot) : selectSlot(slot)}
                      accessibilityHint={isUnavailable ? 'Explains why this time is unavailable and offers the same time on the next day.' : undefined}
                      activeOpacity={0.8}
                    >
                      <AppText style={[
                        styles.slotText,
                        isActive && styles.slotTextActive,
                        isUnavailable && styles.slotTextDisabled,
                      ]}>{slot}</AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <AppText style={styles.noSlotsText}>
                {currentWalkIndex === 0
                  ? 'No morning slots are available. Please select a future date.'
                  : `No ${WALK_PERIODS[currentPeriodKey]?.name} slots are available. Please choose another period or date.`}
              </AppText>
            )}

            {currentPeriodKey && (
              <TouchableOpacity
                style={[styles.slotItem, styles.customSlotBtn, { width: '100%', marginTop: 10 }]}
                onPress={() => setTimePickerVisible(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="plus" size={18} color={theme.colors.primaryDark} />
                <AppText style={styles.slotText}>Add Custom Time</AppText>
              </TouchableOpacity>
            )}
          </View>
        ) : availableSlots.length === 0 ? (
          <AppText style={styles.noSlotsText}>
            No slots available for today. Please select a future date.
          </AppText>
        ) : null}

        <CustomTimePicker
          visible={timePickerVisible}
          initialTime={customSlot || '09:00 AM'}
          onConfirm={(time) => {
            if (!isWithinWalkingHours(time)) {
              Alert.alert('Time Unavailable', 'Walking slots are available from 5:00 AM through 12:00 AM.');
              return;
            }
            if (!isWalkingTimeAllowed(selectedDate, time)) {
              explainUnavailableSlot(time);
              return;
            }
            setCustomSlot(time);
            selectSlot(time);
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
            const selectionError = getSelectionError();
            if (!isFormValid() || selectionError) {
              Alert.alert('Time Selection Required', selectionError || 'Please select a valid date and time.');
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

      <Modal
        visible={Boolean(unavailableSlotInfo)}
        transparent
        animationType="fade"
        onRequestClose={() => setUnavailableSlotInfo(null)}
      >
        <View style={styles.unavailableModalOverlay}>
          <View style={styles.unavailableModalCard}>
            <View style={styles.unavailableModalIcon}>
              <MaterialCommunityIcons name="clock-alert-outline" size={28} color={theme.colors.success} />
            </View>
            <AppText style={styles.unavailableModalTitle} type="heading" weight="bold">Time Unavailable Today</AppText>
            <AppText style={styles.unavailableModalMessage}>
              {unavailableSlotInfo?.canUseSameTimeNextDay
                ? `${unavailableSlotInfo.slot} is inside today’s 3-hour advance-booking window. You can select the same morning time on ${formatISTDate(unavailableSlotInfo.nextDate, { weekday: 'short', day: 'numeric', month: 'short' })}.`
                : `${unavailableSlotInfo?.slot} cannot be selected for the chosen date.`}
            </AppText>
            <View style={styles.unavailableReasonBox}>
              <AppText style={styles.unavailableReasonTitle} weight="bold">Why is this unavailable?</AppText>
              <AppText style={styles.unavailableReasonText}>Walking appointments must be booked at least 3 hours before they begin.</AppText>
            </View>
            {unavailableSlotInfo?.canUseSameTimeNextDay && (
              <TouchableOpacity
                style={styles.unavailablePrimaryButton}
                onPress={() => {
                  const slot = unavailableSlotInfo.slot;
                  setUnavailableSlotInfo(null);
                  selectMorningSlotOnNextDay(slot);
                }}
                activeOpacity={0.8}
              >
                <AppText style={styles.unavailablePrimaryButtonText} weight="bold">Select next day</AppText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={unavailableSlotInfo?.canUseSameTimeNextDay ? styles.unavailableSecondaryButton : styles.unavailablePrimaryButton}
              onPress={() => setUnavailableSlotInfo(null)}
              activeOpacity={0.8}
            >
              <AppText style={unavailableSlotInfo?.canUseSameTimeNextDay ? styles.unavailableSecondaryButtonText : styles.unavailablePrimaryButtonText} weight="bold">
                {unavailableSlotInfo?.canUseSameTimeNextDay ? 'Not now' : 'Got it'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  slotRuleText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 5,
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
  selectedWalkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(61, 42, 94, 0.12)',
  },
  walkNumberBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryDark,
  },
  walkNumberText: {
    color: theme.colors.white,
    fontSize: 15,
  },
  selectedWalkInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedWalkLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  selectedWalkTime: {
    fontSize: 16,
    color: theme.colors.textBlack,
    marginTop: 2,
  },
  changeTimeButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  changeTimeText: {
    color: theme.colors.primaryDark,
    fontSize: 13,
  },
  walkChoiceCard: {
    backgroundColor: 'rgba(61, 42, 94, 0.05)',
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
    marginBottom: 24,
  },
  walkChoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  walkChoiceTitle: {
    color: theme.colors.textBlack,
    fontSize: 16,
  },
  walkChoiceHint: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  periodChoiceRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  periodChoice: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(61, 42, 94, 0.2)',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  periodChoiceActive: {
    backgroundColor: theme.colors.primaryDark,
    borderColor: theme.colors.primaryDark,
  },
  periodChoiceTitle: {
    color: theme.colors.primaryDark,
    fontSize: 13,
  },
  periodChoiceTime: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },
  periodChoiceTextActive: {
    color: theme.colors.white,
  },
  noSlotsText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    paddingBottom: 14,
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
  slotItemDisabled: {
    opacity: 0.4,
    backgroundColor: '#E8E8E8',
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
  slotTextDisabled: {
    color: theme.colors.textSecondary,
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
  unavailableModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unavailableModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  unavailableModalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(78,108,72,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  unavailableModalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 21,
    textAlign: 'center',
    marginBottom: 8,
  },
  unavailableModalMessage: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  unavailableReasonBox: {
    width: '100%',
    backgroundColor: 'rgba(78,108,72,0.08)',
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
    marginBottom: 18,
  },
  unavailableReasonTitle: {
    color: theme.colors.success,
    fontSize: 13,
    marginBottom: 4,
  },
  unavailableReasonText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  unavailablePrimaryButton: {
    width: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  unavailablePrimaryButtonText: {
    color: theme.colors.white,
    fontSize: 15,
  },
  unavailableSecondaryButton: {
    width: '100%',
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
  },
  unavailableSecondaryButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
});
