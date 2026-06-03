import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from './AppText';
import { theme } from '../styles/theme';
import { formatISTDate } from '../utils/date_utils';

const { width } = Dimensions.get('window');

const CustomCalendar = ({ 
  onDateSelect, 
  selectedDate, 
  minDate = new Date(),
  isRange = false,
  startDate,
  endDate,
  onRangeSelect
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(startDate || selectedDate || new Date()));
  const [days, setDays] = useState([]);

  useEffect(() => {
    generateDays();
  }, [currentMonth, selectedDate, startDate, endDate]);

  const generateDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // 1st of the month weekday (0=Sun, 6=Sat)
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const daysArr = [];
    // Leading empty slots
    for (let i = 0; i < firstDay; i++) {
      daysArr.push(null);
    }

    // Actual month days
    for (let i = 1; i <= daysInMonth; i++) {
      daysArr.push(new Date(year, month, i));
    }

    // Trailing empty slots to fill the last row (ensures exactly 7 items per row)
    while (daysArr.length % 7 !== 0) {
      daysArr.push(null);
    }

    setDays(daysArr);
  };

  const changeMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  };

  const isSelected = (date) => {
    if (!date) return false;
    if (isRange) return isSameDay(date, startDate) || isSameDay(date, endDate);
    return isSameDay(date, selectedDate);
  };

  const isInRange = (date) => {
    if (!date || !startDate || !endDate) return false;
    const d = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return d > start && d < end;
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

  const handlePress = (date) => {
    if (!date) return;
    // We use a standardized format for the string to avoid timezone shifts when parsing back
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (isRange) {
      if (!startDate || (startDate && endDate)) {
        onRangeSelect(dateStr, null);
      } else {
        onRangeSelect(startDate, dateStr);
      }
    } else {
      onDateSelect(dateStr);
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText style={styles.monthTitle} weight="bold">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </AppText>
        <View style={styles.headerBtns}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-left" size={20} color={theme.colors.primaryDark} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.primaryDark} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.weekRow}>
        {weekDays.map((d, i) => (
          <View key={i} style={styles.dayBox}>
            <AppText style={styles.weekDayText}>{d.charAt(0)}</AppText>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((date, index) => {
          const selected = isSelected(date);
          const range = isInRange(date);
          const isStart = isSameDay(date, startDate);
          const isEnd = isSameDay(date, endDate);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayBox,
                selected && styles.selectedDayBox,
                range && styles.rangeDayBox,
                isStart && endDate && styles.startDayBox,
                isEnd && styles.endDayBox,
                !date && { opacity: 0 }
              ]}
              disabled={!date || isPast(date)}
              onPress={() => handlePress(date)}
            >
              {date && (
                <View style={styles.dayInner}>
                  <AppText style={[
                    styles.dayText,
                    selected && styles.selectedDayText,
                    range && styles.rangeDayText,
                    isPast(date) && styles.pastDayText,
                    isToday(date) && !selected && !range && styles.todayText
                  ]}>
                    {date.getDate()}
                  </AppText>
                  {isToday(date) && !selected && !range && <View style={styles.todayDot} />}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 16,
    color: theme.colors.textBlack,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  weekDayText: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayBox: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayInner: {
    width: '80%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  dayText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  selectedDayBox: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 100,
  },
  rangeDayBox: {
    backgroundColor: 'rgba(73, 94, 113, 0.1)',
    borderRadius: 0,
  },
  startDayBox: {
    backgroundColor: 'rgba(73, 94, 113, 0.1)',
    borderTopLeftRadius: 100,
    borderBottomLeftRadius: 100,
  },
  endDayBox: {
    backgroundColor: 'rgba(73, 94, 113, 0.1)',
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
  },
  selectedDayText: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  rangeDayText: {
    color: theme.colors.primaryDark,
    fontWeight: '600',
  },
  pastDayText: {
    color: 'rgba(0,0,0,0.1)',
  },
  todayText: {
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
  },
  todayDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.primaryDark,
    position: 'absolute',
    bottom: 6,
  }
});

export default CustomCalendar;
