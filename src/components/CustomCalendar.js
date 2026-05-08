import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from './AppText';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

const CustomCalendar = ({ onDateSelect, selectedDate, minDate = new Date() }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));
  const [days, setDays] = useState([]);

  useEffect(() => {
    generateDays();
  }, [currentMonth, selectedDate]);

  const generateDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const daysArr = [];
    // Adjust for Monday start if preferred, but standard is Sunday (0)
    // firstDay is 0-6 (Sun-Sat)

    // Fill empty slots before first day
    for (let i = 0; i < firstDay; i++) {
      daysArr.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      daysArr.push(new Date(year, month, i));
    }

    setDays(daysArr);
  };

  const changeMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    const d = new Date(selectedDate);
    return d.getDate() === date.getDate() &&
      d.getMonth() === date.getMonth() &&
      d.getFullYear() === date.getFullYear();
  };

  const isPast = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText style={styles.monthTitle} weight="bold">
          {currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </AppText>
        <View style={styles.headerBtns}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-left" size={18} color={theme.colors.primaryDark} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.primaryDark} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.weekRow}>
        {weekDays.map((d, i) => (
          <View key={i} style={styles.dayBox}>
            <AppText style={styles.weekDayText}>{d}</AppText>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((date, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayBox,
              isSelected(date) && styles.selectedDayBox,
              !date && { opacity: 0 }
            ]}
            disabled={!date || isPast(date)}
            onPress={() => onDateSelect(date.toDateString())}
          >
            {date && (
              <View style={styles.dayInner}>
                <AppText style={[
                  styles.dayText,
                  isSelected(date) && styles.selectedDayText,
                  isPast(date) && styles.pastDayText,
                  isToday(date) && !isSelected(date) && styles.todayText
                ]}>
                  {date.getDate()}
                </AppText>
                {isToday(date) && !isSelected(date) && <View style={styles.todayDot} />}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(73, 94, 113, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 14,
    color: theme.colors.textBlack,
    letterSpacing: 0.2,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  weekDayText: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayBox: {
    width: `${100 / 7}%`,
    aspectRatio: 1.1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  dayInner: {
    width: '80%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  dayText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  selectedDayBox: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 100,
  },
  selectedDayText: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  pastDayText: {
    color: 'rgba(0,0,0,0.1)',
  },
  todayText: {
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
  },
  todayDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.colors.primaryDark,
    position: 'absolute',
    bottom: 4,
  }
});

export default CustomCalendar;
