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
      day: isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate().toString().padStart(2, '0'),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      fullDate: d.toDateString()
    });
  }
  return datesArr;
};

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

  return (
    <AppScreen safeArea={true} padding={false} scrollable={false} backgroundColor={theme.colors.background}>
      <ServiceHeader title="Dog Boarding" />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle} type="heading" weight="bold">Check-in Date</AppText>
        </View>

        <View style={styles.calendarCard}>
          <CustomCalendar
            selectedDate={checkInDate}
            onDateSelect={(date) => {
              setCheckInDate(date);
              if (checkOutDate && new Date(date) >= new Date(checkOutDate)) {
                setCheckOutDate(null);
              }
            }}
          />
        </View>

        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <AppText style={styles.sectionTitle} type="heading" weight="bold">Check-out Date</AppText>
        </View>

        <View style={styles.calendarCard}>
          <CustomCalendar
            selectedDate={checkOutDate}
            minDate={checkInDate ? new Date(new Date(checkInDate).getTime() + 86400000) : new Date()}
            onDateSelect={(date) => setCheckOutDate(date)}
          />
        </View>

        {/* Check-in Time */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <AppText style={styles.sectionTitle} type="heading" weight="bold">Check-in Time</AppText>
        </View>

        <TouchableOpacity
          style={styles.timePickerCard}
          onPress={() => setTimePickerVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.timePickerLeft}>
            <View>
              <AppText style={styles.timePickerLabel}>Check-in Time</AppText>
              <AppText style={styles.timePickerValue} weight="bold">{checkInTime}</AppText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
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
