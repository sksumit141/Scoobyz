import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions, SafeAreaView, Modal } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppText from '../components/AppText';
import CustomCalendar from '../components/CustomCalendar';
import ServiceHeader from '../components/ServiceHeader';
import CustomTimePicker from '../components/CustomTimePicker';
import SelectionChoiceModal from '../components/SelectionChoiceModal';
import { theme } from '../styles/theme';
import { useRoute } from '@react-navigation/native';
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
      year: d.getFullYear(),
      fullDate: d.toDateString() // Full parsable string
    });
  }
  return datesArr;
};

const MORNING_SLOTS = ['06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'];
const NOON_SLOTS = ['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'];
const NIGHT_SLOTS = ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM'];
const ALL_SLOTS = [...MORNING_SLOTS, ...NOON_SLOTS, ...NIGHT_SLOTS];

const SUGGESTIONS = [
  { label: 'Evening', icon: 'weather-sunset' },
  { label: 'Morning', icon: 'weather-sunny' }
];

export default function SlotSelectScreen({ navigation }) {
  const route = useRoute();
  const { serviceName = 'Grooming', pet } = route?.params || {};

  const [visitType, setVisitType] = useState('Home Visit');
  const [monthDate, setMonthDate] = useState(new Date());
  const generatedDates = generateDates(monthDate);

  const [selectedDate, setSelectedDate] = useState(generatedDates[0]?.fullDate);
  const [selectedSlot, setSelectedSlot] = useState('09:00 AM');
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [choiceModalVisible, setChoiceModalVisible] = useState(false);

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

  const [suggestionOverlay, setSuggestionOverlay] = useState({
    visible: false,
    title: '',
    options: [],
    targetDateStr: null
  });

  const formattedSelected = selectedDate ? `${formatISTDate(selectedDate, { day: '2-digit', month: 'short' })}, ${selectedSlot}` : '';

  const handleSuggestionPress = (label) => {
    if (label === 'Evening') {
      const todayObj = generatedDates.find(d => d.day === 'Today');
      if (todayObj) {
        setSuggestionOverlay({
          visible: true,
          title: 'Select Evening Slot',
          options: ['04:00 PM', '05:30 PM', '06:30 PM'],
          targetDateStr: todayObj.date
        });
      }
    } else if (label === 'Morning') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (tomorrow.getMonth() !== monthDate.getMonth()) {
        const nextMonth = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1);
        setMonthDate(nextMonth);
      }
      setSuggestionOverlay({
        visible: true,
        title: 'Select Morning Slot',
        options: ['09:00 AM', '10:00 AM', '11:00 AM'],
        targetDateStr: tomorrow.getDate().toString().padStart(2, '0')
      });
    }
  };

  const handleSuggestionSelect = (slot) => {
    setSelectedDate(suggestionOverlay.targetDateStr);
    setSelectedSlot(slot);
    setSuggestionOverlay({ ...suggestionOverlay, visible: false });
  };

  const getFilteredSlots = () => {
    try {
      // 1. Get current time parts in IST
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
      });

      const parts = formatter.formatToParts(new Date());
      const getPart = (type) => parseInt(parts.find(p => p.type === type).value, 10);

      // 2. Create a Date object that reflects the exact IST date and time
      const nowIST = new Date(
        getPart('year'), getPart('month') - 1, getPart('day'),
        getPart('hour') === 24 ? 0 : getPart('hour'), getPart('minute'), getPart('second')
      );

      const isToday = selectedDate && new Date(selectedDate).toDateString() === nowIST.toDateString();

      if (!isToday) return ALL_SLOTS.slice(0, 9);

      // Filter slots to be at least 1 hour from now (in IST)
      const oneHourFromNowIST = new Date(nowIST.getTime() + 60 * 60 * 1000);

      return ALL_SLOTS.filter(slot => {
        const [time, period] = slot.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        const slotTimeIST = new Date(nowIST);
        slotTimeIST.setHours(hours, minutes, 0, 0);

        return slotTimeIST > oneHourFromNowIST;
      }).slice(0, 9);
    } catch (e) {
      console.warn('getFilteredSlots fallback:', e);
      return ALL_SLOTS.slice(0, 9);
    }
  };

  const availableSlots = getFilteredSlots();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ServiceHeader title={`Schedule ${serviceName}`} showAddress={false} />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Toggle Visit Type */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, visitType === 'Home Visit' && styles.toggleBtnActive]}
            onPress={() => setVisitType('Home Visit')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="home-outline" size={20} color={visitType === 'Home Visit' ? theme.colors.white : theme.colors.primaryDark} />
            <AppText style={[styles.toggleText, visitType === 'Home Visit' && styles.toggleTextActive]}>Home Visit</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, visitType === 'Studio' && styles.toggleBtnActive]}
            onPress={() => setVisitType('Studio')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="storefront-outline" size={20} color={visitType === 'Studio' ? theme.colors.white : theme.colors.primaryDark} />
            <AppText style={[styles.toggleText, visitType === 'Studio' && styles.toggleTextActive]}>Vans & Studio</AppText>
          </TouchableOpacity>
        </View>

        {/* Date Selection */}
        <View style={styles.sectionHeader}>
          <AppText style={[styles.sectionTitle, { marginTop: 24, fontFamily: theme.fonts.body, fontStyle: 'normal' }]} weight="bold">Select Date</AppText>
        </View>

        <View style={styles.calendarCard}>
          <CustomCalendar
            selectedDate={selectedDate}
            onDateSelect={(date) => setSelectedDate(date)}
          />
        </View>

        {/* Available Slots */}
        <View style={[styles.sectionHeader, { marginTop: 24, marginBottom: 8 }]}>
          <AppText style={[styles.sectionTitle, { marginBottom: 10, fontFamily: theme.fonts.body, fontStyle: 'normal' }]} weight="bold">Available Slots</AppText>
        </View>

        <View style={styles.slotsGrid}>
          {availableSlots.length > 0 ? (
            availableSlots.map((slot, index) => {
              const isActive = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.slotItem, isActive && styles.slotItemActive]}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.8}
                >
                  <AppText style={[styles.slotText, isActive && styles.slotTextActive]}>{slot}</AppText>
                </TouchableOpacity>
              )
            })
          ) : (
            <AppText style={{ color: theme.colors.textSecondary, fontStyle: 'italic', paddingVertical: 10 }}>
              No slots available for today. Please select a future date.
            </AppText>
          )}
        </View>

        {/* Custom Slot Button */}
        <TouchableOpacity
          style={[
            styles.slotItem,
            styles.customSlotBtn,
            !ALL_SLOTS.includes(selectedSlot) && styles.slotItemActive,
            { width: '100%', marginTop: 10 }
          ]}
          onPress={() => setTimePickerVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="plus"
            size={18}
            color={!ALL_SLOTS.includes(selectedSlot) ? theme.colors.white : theme.colors.primaryDark}
          />
          <AppText
            style={[
              styles.slotText,
              !ALL_SLOTS.includes(selectedSlot) && styles.slotTextActive,
            ]}
          >
            {!ALL_SLOTS.includes(selectedSlot) ? `Selected: ${selectedSlot}` : 'Add Custom Time'}
          </AppText>
        </TouchableOpacity>

        <CustomTimePicker
          visible={timePickerVisible}
          initialTime={selectedSlot}
          onConfirm={(time) => setSelectedSlot(time)}
          onClose={() => setTimePickerVisible(false)}
        />

        {/* Smart Suggestions */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <AppText style={styles.sectionTitle} type="heading" weight="bold">Smart Suggestions</AppText>
        </View>

        <View style={styles.suggestionsContainer}>
          {SUGGESTIONS.map((sug, i) => (
            <TouchableOpacity
              key={i}
              style={styles.suggestionBtn}
              activeOpacity={0.8}
              onPress={() => handleSuggestionPress(sug.label)}
            >
              <MaterialCommunityIcons name={sug.icon} size={18} color={theme.colors.primaryDark} />
              <AppText style={styles.suggestionText}>{sug.label}</AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom spacing to avoid overlapping with absolute bottom bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Fixed Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomInfo}>
          <AppText style={styles.bottomLabel}>Selected Slot</AppText>
          <AppText style={styles.bottomValue} weight="bold">{formattedSelected}</AppText>
        </View>
        <TouchableOpacity
          style={styles.confirmBtn}
          activeOpacity={0.8}
          onPress={() => {
            if (visitType === 'Home Visit') {
              setChoiceModalVisible(true);
            } else {
              const params = {
                serviceName,
                pet,
                date: selectedDate,
                time: selectedSlot,
                visitType
              };
              navigation.navigate('SelectCompany', params);
            }
          }}
        >
          <AppText style={styles.confirmBtnText} weight="bold">Confirm</AppText>
        </TouchableOpacity>
      </View>

      <SelectionChoiceModal
        visible={choiceModalVisible}
        onClose={() => setChoiceModalVisible(false)}
        serviceType="Grooming"
        onSelectYourself={() => {
          setChoiceModalVisible(false);
          const params = {
            serviceName,
            pet,
            date: selectedDate,
            time: selectedSlot,
            visitType
          };
          navigation.navigate('SelectGroomer', params);
        }}
        onScoobyzMatch={() => {
          setChoiceModalVisible(false);
          const params = {
            serviceName,
            pet,
            date: selectedDate,
            time: selectedSlot,
            visitType,
            serviceType: 'Grooming',
            expert: { id: 'scoobyz_match', name: 'Scoobyz Team Match' },
            cart: [{
              id: 'generic_grooming',
              title: 'Standard Home Visit Grooming',
              price: 0,
              features: ['Custom package assigned by Admin']
            }],
            total: 0
          };
          navigation.navigate('BookVendor', params);
        }}
      />

      {/* Suggestion Options Overlay */}
      <Modal
        visible={suggestionOverlay.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuggestionOverlay({ ...suggestionOverlay, visible: false })}
      >
        <TouchableOpacity
          style={styles.overlayBackground}
          activeOpacity={1}
          onPress={() => setSuggestionOverlay({ ...suggestionOverlay, visible: false })}
        >
          <View style={styles.overlayContainer}>
            <AppText style={styles.overlayTitle} type="heading" weight="bold">
              {suggestionOverlay.title}
            </AppText>
            {suggestionOverlay.options.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={styles.overlayOption}
                onPress={() => handleSuggestionSelect(opt)}
                activeOpacity={0.8}
              >
                <AppText style={styles.overlayOptionText}>{opt}</AppText>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.overlayCancel}
              onPress={() => setSuggestionOverlay({ ...suggestionOverlay, visible: false })}
            >
              <AppText style={styles.overlayCancelText}>Cancel</AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
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
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 6,
    marginHorizontal: -4,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.primaryDark,
  },
  toggleText: {
    fontSize: 16,
    color: theme.colors.primaryDark,
  },
  toggleTextActive: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    color: theme.colors.textBlack,
    fontFamily: theme.fonts.heading,
  },
  calendarCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
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
    width: width < 380 ? '47%' : '31%',
    backgroundColor: theme.colors.white,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 4,
  },
  slotItemHorizontal: {
    width: 110,
    marginBottom: 0,
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
    fontSize: width < 360 ? 12 : 13,
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
  },
  slotTextActive: {
    color: theme.colors.white,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  suggestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingVertical: 14,
    paddingHorizontal: 12, // Compact padding
    borderRadius: 12,
    gap: 6,
    flexGrow: 1,
    minWidth: '46%', // Ensure they sit side-by-side or fill row
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: width < 360 ? 11 : 12,
    color: theme.colors.primaryDark,
    fontWeight: '600',
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
    paddingHorizontal: 36,
    borderRadius: 16,
  },
  confirmBtnText: {
    color: theme.colors.white,
    fontSize: 16,
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContainer: {
    width: '80%',
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  overlayTitle: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    marginBottom: 20,
  },
  overlayOption: {
    width: '100%',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  overlayOptionText: {
    fontSize: 16,
    color: theme.colors.primaryDark,
    fontWeight: '600',
  },
  overlayCancel: {
    marginTop: 20,
    paddingVertical: 12,
  },
  overlayCancelText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
});
