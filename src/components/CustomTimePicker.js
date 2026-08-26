import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AppText from './AppText';
import { theme } from '../styles/theme';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export default function CustomTimePicker({
  visible,
  initialTime,
  onConfirm,
  onClose,
}) {
  // ---------------------------------------------------------
  // Parse initial time
  // ---------------------------------------------------------
  const parseInitial = (t) => {
    if (!t) {
      return {
        hour: 10,
        minute: 0,
        period: 'AM',
      };
    }

    const [timePart, per] = t.split(' ');
    const [h, m] = timePart.split(':').map(Number);

    let parsedHour = h || 10;
    let parsedMinute = Number.isFinite(m) ? m : 0;
    let parsedPeriod = per === 'PM' ? 'PM' : 'AM';

    // Make sure hour stays between 1-12
    if (parsedHour < 1 || parsedHour > 12) {
      parsedHour = 10;
    }

    // Make sure minute stays between 0-59
    if (parsedMinute < 0 || parsedMinute > 59) {
      parsedMinute = 0;
    }

    return {
      hour: parsedHour,
      minute: parsedMinute,
      period: parsedPeriod,
    };
  };

  // ---------------------------------------------------------
  // State
  // ---------------------------------------------------------
  const [hour, setHour] = useState(10);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState('AM');

  // Scroll references
  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);

  // ---------------------------------------------------------
  // Reset picker whenever it opens
  // ---------------------------------------------------------
  useEffect(() => {
    if (visible) {
      const init = parseInitial(initialTime);

      setHour(init.hour);
      setMinute(init.minute);
      setPeriod(init.period);

      // Wait until modal/list has rendered
      setTimeout(() => {
        hourScrollRef.current?.scrollTo({
          y: (init.hour - 1) * 51,
          animated: false,
        });

        minuteScrollRef.current?.scrollTo({
          y: init.minute * 51,
          animated: false,
        });
      }, 100);
    }
  }, [visible, initialTime]);

  // ---------------------------------------------------------
  // Formatted time
  // ---------------------------------------------------------
  const formattedTime = `${hour
    .toString()
    .padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')} ${period}`;

  // ---------------------------------------------------------
  // Confirm
  // ---------------------------------------------------------
  const handleConfirm = () => {
    onConfirm(formattedTime);
    onClose();
  };

  // ---------------------------------------------------------
  // Select hour
  // ---------------------------------------------------------
  const handleHourSelect = (selectedHour) => {
    setHour(selectedHour);

    // Automatically move user to minute selection
    setTimeout(() => {
      const minutePosition = minute * 51;

      minuteScrollRef.current?.scrollTo({
        y: minutePosition,
        animated: true,
      });
    }, 50);
  };

  // ---------------------------------------------------------
  // Select minute
  // ---------------------------------------------------------
  const handleMinuteSelect = (selectedMinute) => {
    setMinute(selectedMinute);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>

        {/* Tap outside to close */}
        <TouchableOpacity
          style={styles.overlayDismiss}
          onPress={onClose}
          activeOpacity={1}
        />

        {/* Bottom Sheet */}
        <View style={styles.sheet}>

          {/* Grabber */}
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>

          {/* Title */}
          <AppText
            style={styles.title}
            type="heading"
            weight="bold"
          >
            Set Custom Time
          </AppText>

          {/* -------------------------------------------------
              Selected Time Display
          ------------------------------------------------- */}
          <View style={styles.timeDisplay}>

            {/* Hour */}
            <TouchableOpacity
              style={[
                styles.timeSegment,
                styles.timeSegmentActive,
              ]}
              activeOpacity={0.8}
            >
              <AppText
                style={styles.timeSegmentTextActive}
                weight="bold"
              >
                {hour.toString().padStart(2, '0')}
              </AppText>
            </TouchableOpacity>

            <AppText
              style={styles.timeSep}
              weight="bold"
            >
              :
            </AppText>

            {/* Minute */}
            <TouchableOpacity
              style={[
                styles.timeSegment,
                styles.timeSegmentActive,
              ]}
              activeOpacity={0.8}
            >
              <AppText
                style={styles.timeSegmentTextActive}
                weight="bold"
              >
                {minute.toString().padStart(2, '0')}
              </AppText>
            </TouchableOpacity>


          </View>

          {/* -------------------------------------------------
              Instruction
          ------------------------------------------------- */}
          <AppText style={styles.modeLabel}>
            Select hour and minute
          </AppText>

          {/* -------------------------------------------------
              Hour + Minute Scroll Pickers
          ------------------------------------------------- */}
          <View style={styles.pickerContainer}>

            {/* ================= HOUR ================= */}
            <View style={styles.pickerColumn}>

              <AppText
                style={styles.columnLabel}
                weight="bold"
              >
                HOUR
              </AppText>

              <View style={styles.scrollBox}>



                <ScrollView
                  ref={hourScrollRef}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                  nestedScrollEnabled={true}
                  decelerationRate="fast"
                >
                  {HOURS.map((h) => {
                    const isActive = hour === h;

                    return (
                      <TouchableOpacity
                        key={h}
                        style={[
                          styles.pickerItem,
                          isActive && styles.pickerItemActive,
                        ]}
                        onPress={() => handleHourSelect(h)}
                        activeOpacity={0.7}
                      >
                        <AppText
                          style={[
                            styles.pickerText,
                            isActive && styles.pickerTextActive,
                          ]}
                          weight="bold"
                        >
                          {h.toString().padStart(2, '0')}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* ================= MINUTE ================= */}
            <View style={styles.pickerColumn}>

              <AppText
                style={styles.columnLabel}
                weight="bold"
              >
                MINUTE
              </AppText>

              <View style={styles.scrollBox}>



                <ScrollView
                  ref={minuteScrollRef}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                  nestedScrollEnabled={true}
                  decelerationRate="fast"
                >
                  {MINUTES.map((m) => {
                    const isActive = minute === m;

                    return (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.pickerItem,
                          isActive && styles.pickerItemActive,
                        ]}
                        onPress={() => handleMinuteSelect(m)}
                        activeOpacity={0.7}
                      >
                        <AppText
                          style={[
                            styles.pickerText,
                            isActive && styles.pickerTextActive,
                          ]}
                          weight="bold"
                        >
                          {m.toString().padStart(2, '0')}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* -------------------------------------------------
              AM / PM Toggle
          ------------------------------------------------- */}
          <View style={styles.ampmContainer}>

            <TouchableOpacity
              style={[
                styles.ampmButton,
                period === 'AM' && styles.ampmButtonActive,
              ]}
              onPress={() => setPeriod('AM')}
              activeOpacity={0.8}
            >
              <AppText
                style={[
                  styles.ampmText,
                  period === 'AM' && styles.ampmTextActive,
                ]}
                weight="bold"
              >
                AM
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.ampmButton,
                period === 'PM' && styles.ampmButtonActive,
              ]}
              onPress={() => setPeriod('PM')}
              activeOpacity={0.8}
            >
              <AppText
                style={[
                  styles.ampmText,
                  period === 'PM' && styles.ampmTextActive,
                ]}
                weight="bold"
              >
                PM
              </AppText>
            </TouchableOpacity>

          </View>

          {/* -------------------------------------------------
              Actions
          ------------------------------------------------- */}
          <View style={styles.actions}>

            {/* Cancel */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <AppText
                style={styles.cancelText}
                weight="bold"
              >
                Cancel
              </AppText>
            </TouchableOpacity>

            {/* Confirm */}
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <AppText
                style={styles.confirmText}
                weight="bold"
              >
                Set {formattedTime}
              </AppText>
            </TouchableOpacity>

          </View>

        </View>
      </View>
    </Modal>
  );
}


// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  // ----------------------------------------------------------
  // Overlay
  // ----------------------------------------------------------

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },

  overlayDismiss: {
    flex: 1,
  },

  // ----------------------------------------------------------
  // Bottom Sheet
  // ----------------------------------------------------------

  sheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  grabberWrap: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },

  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
  },

  title: {
    fontSize: 20,
    color: theme.colors.textBlack,
    marginTop: 8,
    marginBottom: 18,
  },

  // ----------------------------------------------------------
  // Selected Time
  // ----------------------------------------------------------

  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 8,
  },

  timeSegment: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 9,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timeSegmentActive: {
    backgroundColor: theme.colors.primaryDark,
  },

  timeSegmentTextActive: {
    fontSize: 30,
    color: theme.colors.white,
    letterSpacing: 1,
  },

  timeSep: {
    fontSize: 30,
    color: theme.colors.textSecondary,
  },

  // ----------------------------------------------------------
  // Top AM / PM toggle
  // ----------------------------------------------------------

  periodToggle: {
    marginLeft: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryDark,
    overflow: 'hidden',
    flexDirection: 'row',
  },

  periodBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
  },

  periodBtnActive: {
    backgroundColor: theme.colors.primaryDark,
  },

  periodText: {
    fontSize: 12,
    color: theme.colors.primaryDark,
  },

  periodTextActive: {
    color: theme.colors.white,
  },

  // ----------------------------------------------------------
  // Instruction
  // ----------------------------------------------------------

  modeLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ----------------------------------------------------------
  // Pickers
  // ----------------------------------------------------------

  pickerContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 14,
    marginTop: 2,
    marginBottom: 16,
  },

  pickerColumn: {
    flex: 1,
  },

  columnLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 7,
    letterSpacing: 1,
  },

  scrollBox: {
    height: 210,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(73,94,113,0.1)',
    overflow: 'hidden',
    position: 'relative',
  },

  scrollContent: {
    paddingVertical: 8,
  },

  pickerItem: {
    height: 45,
    marginHorizontal: 8,
    marginVertical: 3,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pickerItemActive: {
    backgroundColor: theme.colors.primaryDark,
  },

  pickerText: {
    fontSize: 17,
    color: theme.colors.textPrimary,
  },

  pickerTextActive: {
    color: theme.colors.white,
    fontSize: 18,
  },

  // ----------------------------------------------------------
  // Selection indicator
  // ----------------------------------------------------------

  selectionIndicator: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 86,
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(73,94,113,0.12)',
    zIndex: 0,
  },

  // ----------------------------------------------------------
  // AM / PM Toggle
  // ----------------------------------------------------------

  ampmContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },

  ampmButton: {
    flex: 1,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ampmButtonActive: {
    backgroundColor: theme.colors.primaryDark,
  },

  ampmText: {
    fontSize: 14,
    color: theme.colors.primaryDark,
  },

  ampmTextActive: {
    color: theme.colors.white,
  },

  // ----------------------------------------------------------
  // Bottom Actions
  // ----------------------------------------------------------

  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },

  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryDark,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    color: theme.colors.primaryDark,
    fontSize: 15,
  },

  confirmBtn: {
    flex: 2,
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmText: {
    color: theme.colors.white,
    fontSize: 15,
  },
});