import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import CustomCalendar from '../components/CustomCalendar';
import ServiceHeader from '../components/ServiceHeader';
import CustomTimePicker from '../components/CustomTimePicker';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

const DURATIONS = ['20 min', '40 min', '1 hr'];
const FREQUENCIES = ['One-time', 'Weekly', 'Monthly'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = ['07:00 AM', '08:30 AM', '10:00 AM', '05:00 PM', '06:30 PM', '08:00 PM'];

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

const calculateEndTime = (startTimeStr, durationLabel) => {
  if (!startTimeStr) return '';
  const [time, period] = startTimeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  let addMins = 0;
  if (durationLabel === '20 min') addMins = 20;
  else if (durationLabel === '40 min') addMins = 40;
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

  const [duration, setDuration] = useState('40 min');
  const [frequency, setFrequency] = useState('One-time');
  const [timesPerDay, setTimesPerDay] = useState(1);

  const [monthDate, setMonthDate] = useState(new Date());
  const generatedDates = generateDates(monthDate);
  const [selectedDate, setSelectedDate] = useState(generatedDates[0]?.fullDate);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [customSlot, setCustomSlot] = useState(null);

  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    if (selectedDate && (frequency === 'Weekly' || frequency === 'Monthly')) {
      const start = new Date(selectedDate);
      const daysToAdd = frequency === 'Weekly' ? 7 : 25;
      const end = new Date(start);
      end.setDate(start.getDate() + daysToAdd);
      setEndDate(end.toDateString());
    } else {
      setEndDate(null);
    }
  }, [selectedDate, frequency]);

  const toggleSlot = (slot) => {
    if (frequency === 'One-time') {
      setSelectedSlots([slot]);
    } else {
      if (selectedSlots.includes(slot)) {
        setSelectedSlots(selectedSlots.filter(s => s !== slot));
      } else if (selectedSlots.length < timesPerDay) {
        setSelectedSlots([...selectedSlots, slot].sort((a, b) => {
          const allSlots = [...SLOTS, ...(customSlot ? [customSlot] : [])];
          return allSlots.indexOf(a) - allSlots.indexOf(b);
        }));
      } else {
        const allSlots = [...SLOTS, ...(customSlot ? [customSlot] : [])];
        const newSlots = [...selectedSlots.slice(1), slot].sort((a, b) => allSlots.indexOf(a) - allSlots.indexOf(b));
        setSelectedSlots(newSlots);
      }
    }
  };

  const calculatePrice = () => {
    let base = 0;
    if (duration === '20 min') base = 150;
    else if (duration === '40 min') base = 300;
    else if (duration === '1 hr') base = 450;

    let multiplier = 1;
    if (frequency === 'Weekly') multiplier = 7;
    else if (frequency === 'Monthly') multiplier = 30;

    const total = base * multiplier * timesPerDay;
    return total;
  };

  const totalPrice = calculatePrice();

  const isFormValid = () => {
    if (frequency === 'One-time') {
      return selectedDate && selectedSlots.length === 1;
    } else {
      return selectedDate && selectedSlots.length === timesPerDay;
    }
  };

  return (
    <AppScreen safeArea={true} padding={false} scrollable={false} backgroundColor={theme.colors.background}>
      <ServiceHeader title="Dog Walking" />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Settings Card */}
        <View style={styles.card}>
          <AppText style={styles.label} weight="bold">Duration</AppText>
          <View style={styles.chipRow}>
            {DURATIONS.map(dur => (
              <TouchableOpacity
                key={dur}
                style={[styles.chip, duration === dur && styles.chipActive]}
                onPress={() => setDuration(dur)}
              >
                <AppText style={[styles.chipText, duration === dur && styles.chipTextActive]}>{dur}</AppText>
              </TouchableOpacity>
            ))}
          </View>

          <AppText style={[styles.label, { marginTop: 20 }]} weight="bold">Frequency</AppText>
          <View style={styles.chipRow}>
            {FREQUENCIES.map(freq => (
              <TouchableOpacity
                key={freq}
                style={[styles.chip, frequency === freq && styles.chipActive]}
                onPress={() => {
                  setFrequency(freq);
                  if (freq === 'One-time' && selectedSlots.length > 1) {
                    setSelectedSlots([selectedSlots[0]]);
                  }
                }}
              >
                <AppText style={[styles.chipText, frequency === freq && styles.chipTextActive]}>{freq}</AppText>
              </TouchableOpacity>
            ))}
          </View>

          {frequency !== 'One-time' && (
            <>
              <AppText style={[styles.label, { marginTop: 20 }]} weight="bold">Times per day</AppText>
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
            </>
          )}
        </View>

        {/* Schedule & Time */}
        <View style={styles.card}>
          <AppText style={styles.label} weight="bold">
            {frequency === 'One-time' ? 'Select Date' : 'Start Date'}
          </AppText>

          <CustomCalendar
            selectedDate={selectedDate}
            onDateSelect={(date) => setSelectedDate(date)}
          />

          {endDate && (
            <View style={styles.endDateContainer}>
              <MaterialCommunityIcons name="calendar-clock" size={20} color={theme.colors.primaryDark} />
              <AppText style={styles.endDateText}>
                Plan Ends on: <AppText weight="bold" style={{ color: theme.colors.primaryDark }}>{new Date(endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</AppText>
              </AppText>
            </View>
          )}

          <View style={styles.divider} />

          <AppText style={styles.label} weight="bold">
            {frequency === 'One-time' ? 'Time Slot' : 'Session Time'}
          </AppText>
          <View style={styles.slotsGrid}>
            {SLOTS.map((slot, index) => {
              const isActive = selectedSlots.includes(slot);
              return (
                <TouchableOpacity
                  key={`slot-${index}`}
                  style={[styles.slotItem, isActive && styles.slotItemActive]}
                  onPress={() => toggleSlot(slot)}
                  activeOpacity={0.8}
                >
                  <AppText style={[styles.slotText, isActive && styles.slotTextActive]}>{slot}</AppText>
                </TouchableOpacity>
              )
            })}

            {/* Custom Slot */}
            {customSlot && (
              <TouchableOpacity
                style={[styles.slotItem, selectedSlots.includes(customSlot) && styles.slotItemActive]}
                onPress={() => toggleSlot(customSlot)}
                activeOpacity={0.8}
              >
                <AppText style={[styles.slotText, selectedSlots.includes(customSlot) && styles.slotTextActive]}>
                  {customSlot}
                </AppText>
              </TouchableOpacity>
            )}

            {/* Custom Slot Button */}
            <TouchableOpacity
              style={[styles.slotItem, styles.customSlotBtn]}
              onPress={() => setTimePickerVisible(true)}
              activeOpacity={0.8}
            >
              <AppText style={styles.slotText}>Custom</AppText>
            </TouchableOpacity>
          </View>

          <CustomTimePicker
            visible={timePickerVisible}
            initialTime={customSlot || '09:00 AM'}
            onConfirm={(time) => {
              setCustomSlot(time);
              toggleSlot(time);
            }}
            onClose={() => setTimePickerVisible(false)}
          />
        </View>

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
          style={[styles.confirmBtn, !isFormValid() && { backgroundColor: theme.colors.textSecondary }]}
          activeOpacity={0.8}
          disabled={!isFormValid()}
          onPress={() => {
            const currentParams = route?.params || {};
            navigation.navigate('WalkingWalkerList', {
              ...currentParams,
              duration,
              frequency,
              date: selectedDate,
              time: selectedSlots.join(', '),
              total: totalPrice,
              serviceName: 'Walking'
            });
          }}
        >
          <AppText style={styles.confirmBtnText} weight="bold">Find Walkers</AppText>
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
  endDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(73, 94, 113, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginTop: 15,
    gap: 10,
  },
  endDateText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
});
