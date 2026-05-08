import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  Animated,
} from 'react-native';
import AppText from './AppText';
import { theme } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CLOCK_SIZE = Math.min(SCREEN_WIDTH * 0.72, 280);
const RADIUS = CLOCK_SIZE / 2;
const CENTER = RADIUS;
const HAND_LENGTH = RADIUS * 0.78;
const DOT_RADIUS = RADIUS * 0.08;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function polarToCartesian(angleDeg, r) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

function getAngleFromTouch(cx, cy, x, y) {
  const dx = x - cx;
  const dy = y - cy;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  if (angle < 0) angle += 360;
  return angle;
}

export default function CustomTimePicker({ visible, initialTime, onConfirm, onClose }) {
  // Parse initialTime like "02:30 PM"
  const parseInitial = (t) => {
    if (!t) return { hour: 10, minute: 0, period: 'AM' };
    const [timePart, per] = t.split(' ');
    const [h, m] = timePart.split(':').map(Number);
    return { hour: h, minute: m, period: per || 'AM' };
  };

  const init = parseInitial(initialTime);
  const [mode, setMode] = useState('hour'); // 'hour' | 'minute'
  const [hour, setHour] = useState(init.hour);
  const [minute, setMinute] = useState(init.minute);
  const [period, setPeriod] = useState(init.period);

  const clockRef = useRef(null);
  const clockLayout = useRef({ x: 0, y: 0 });

  const getAngleValue = useCallback((x, y) => {
    const cx = clockLayout.current.x + CENTER;
    const cy = clockLayout.current.y + CENTER;
    const angle = getAngleFromTouch(cx, cy, x, y);

    if (mode === 'hour') {
      const seg = Math.round(angle / 30) % 12;
      return seg === 0 ? 12 : seg;
    } else {
      const seg = Math.round(angle / 6) % 60;
      return seg < 0 ? seg + 60 : seg;
    }
  }, [mode]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        const val = getAngleValue(pageX, pageY);
        if (mode === 'hour') setHour(val);
        else setMinute(val);
      },
      onPanResponderMove: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        const val = getAngleValue(pageX, pageY);
        if (mode === 'hour') setHour(val);
        else setMinute(val);
      },
      onPanResponderRelease: () => {
        if (mode === 'hour') setMode('minute');
      },
    })
  ).current;

  // Recalculate panResponder callbacks when mode changes
  const panResponderDynamic = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { pageX, pageY } = evt.nativeEvent;
      const angle = getAngleFromTouch(
        clockLayout.current.x + CENTER,
        clockLayout.current.y + CENTER,
        pageX,
        pageY
      );
      if (mode === 'hour') {
        const seg = Math.round(angle / 30) % 12;
        setHour(seg === 0 ? 12 : seg);
      } else {
        const seg = Math.round(angle / 6) % 60;
        setMinute(seg < 0 ? seg + 60 : seg);
      }
    },
    onPanResponderMove: (evt) => {
      const { pageX, pageY } = evt.nativeEvent;
      const angle = getAngleFromTouch(
        clockLayout.current.x + CENTER,
        clockLayout.current.y + CENTER,
        pageX,
        pageY
      );
      if (mode === 'hour') {
        const seg = Math.round(angle / 30) % 12;
        setHour(seg === 0 ? 12 : seg);
      } else {
        const seg = Math.round(angle / 6) % 60;
        setMinute(seg < 0 ? seg + 60 : seg);
      }
    },
    onPanResponderRelease: () => {
      if (mode === 'hour') setMode('minute');
    },
  });


  const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;

  const handleConfirm = () => {
    onConfirm(formattedTime);
    onClose();
  };

  const handleReset = () => {
    const i = parseInitial(initialTime);
    setHour(i.hour);
    setMinute(i.minute);
    setPeriod(i.period);
    setMode('hour');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayDismiss} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheet}>
          {/* Grabber */}
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>

          <AppText style={styles.title} type="heading" weight="bold">Set Custom Time</AppText>

          {/* Time Display */}
          <View style={styles.timeDisplay}>
            <TouchableOpacity
              style={[styles.timeSegment, mode === 'hour' && styles.timeSegmentActive]}
              onPress={() => setMode('hour')}
            >
              <AppText
                style={[styles.timeSegmentText, mode === 'hour' && styles.timeSegmentTextActive]}
                weight="bold"
              >
                {hour.toString().padStart(2, '0')}
              </AppText>
            </TouchableOpacity>

            <AppText style={styles.timeSep} weight="bold">:</AppText>

            <TouchableOpacity
              style={[styles.timeSegment, mode === 'minute' && styles.timeSegmentActive]}
              onPress={() => setMode('minute')}
            >
              <AppText
                style={[styles.timeSegmentText, mode === 'minute' && styles.timeSegmentTextActive]}
                weight="bold"
              >
                {minute.toString().padStart(2, '0')}
              </AppText>
            </TouchableOpacity>

            {/* AM/PM toggle */}
            <View style={styles.periodToggle}>
              <TouchableOpacity
                style={[styles.periodBtn, period === 'AM' && styles.periodBtnActive]}
                onPress={() => setPeriod('AM')}
              >
                <AppText style={[styles.periodText, period === 'AM' && styles.periodTextActive]} weight="bold">AM</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodBtn, period === 'PM' && styles.periodBtnActive]}
                onPress={() => setPeriod('PM')}
              >
                <AppText style={[styles.periodText, period === 'PM' && styles.periodTextActive]} weight="bold">PM</AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mode indicator */}
          <AppText style={styles.modeLabel}>
            {mode === 'hour' ? 'Select Hour' : 'Select Minute'}
          </AppText>

          {/* Analog Clock */}
          <View
            ref={clockRef}
            style={styles.clockContainer}
            onLayout={(e) => {
              clockRef.current?.measureInWindow((x, y) => {
                clockLayout.current = { x, y };
              });
            }}
            {...panResponderDynamic.panHandlers}
          >
            {/* Clock face */}
            <View style={styles.clockFace}>
              {/* Center dot */}
              <View style={styles.centerDot} />


              {/* Numbers */}
              {mode === 'hour'
                ? HOURS.map((h) => {
                    const angle = (h / 12) * 360;
                    const pos = polarToCartesian(angle, RADIUS * 0.78);
                    const isActive = hour === h;
                    return (
                      <TouchableOpacity
                        key={`h-${h}`}
                        style={[
                          styles.numBtn,
                          {
                            left: pos.x - 18,
                            top: pos.y - 18,
                          },
                          isActive && styles.numBtnActive,
                        ]}
                        onPress={() => { setHour(h); setMode('minute'); }}
                      >
                        <AppText style={[styles.numText, isActive && styles.numTextActive]} weight="bold">
                          {h}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })
                : MINUTES.map((m) => {
                    const angle = (m / 60) * 360;
                    const pos = polarToCartesian(angle, RADIUS * 0.78);
                    const isActive = minute === m;
                    return (
                      <TouchableOpacity
                        key={`m-${m}`}
                        style={[
                          styles.numBtn,
                          {
                            left: pos.x - 18,
                            top: pos.y - 18,
                          },
                          isActive && styles.numBtnActive,
                        ]}
                        onPress={() => setMinute(m)}
                      >
                        <AppText style={[styles.numText, isActive && styles.numTextActive]} weight="bold">
                          {m.toString().padStart(2, '0')}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}

              {/* Tick marks */}
              {Array.from({ length: 60 }, (_, i) => {
                const a = (i / 60) * 360;
                const isMajor = i % 5 === 0;
                const inner = polarToCartesian(a, RADIUS * (isMajor ? 0.88 : 0.92));
                const outer = polarToCartesian(a, RADIUS * 0.97);
                return (
                  <View
                    key={`tick-${i}`}
                    style={{
                      position: 'absolute',
                      width: isMajor ? 2 : 1,
                      height: RADIUS * (isMajor ? 0.09 : 0.05),
                      backgroundColor: isMajor ? 'rgba(73,94,113,0.4)' : 'rgba(73,94,113,0.15)',
                      left: outer.x - (isMajor ? 1 : 0.5),
                      top: outer.y,
                      transform: [{ rotate: `${a}deg` }],
                    }}
                  />
                );
              })}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <AppText style={styles.cancelText} weight="bold">Cancel</AppText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <AppText style={styles.confirmText} weight="bold">Set {formattedTime}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  overlayDismiss: {
    flex: 1,
  },
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
    marginBottom: 20,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timeSegment: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minWidth: 64,
    alignItems: 'center',
  },
  timeSegmentActive: {
    backgroundColor: theme.colors.primaryDark,
  },
  timeSegmentText: {
    fontSize: 32,
    color: theme.colors.textPrimary,
    letterSpacing: 1,
  },
  timeSegmentTextActive: {
    color: theme.colors.white,
  },
  timeSep: {
    fontSize: 32,
    color: theme.colors.textSecondary,
  },
  periodToggle: {
    marginLeft: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryDark,
    overflow: 'hidden',
  },
  periodBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  periodBtnActive: {
    backgroundColor: theme.colors.primaryDark,
  },
  periodText: {
    fontSize: 13,
    color: theme.colors.primaryDark,
  },
  periodTextActive: {
    color: theme.colors.white,
  },
  modeLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  clockContainer: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    marginBottom: 24,
  },
  clockFace: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: RADIUS,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: 'rgba(73,94,113,0.1)',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  centerDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primaryDark,
    left: CENTER - 5,
    top: CENTER - 5,
    zIndex: 10,
  },
  numBtn: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 7,
  },
  numBtnActive: {
    backgroundColor: theme.colors.primaryDark,
  },
  numText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  numTextActive: {
    color: theme.colors.white,
  },
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
  },
  confirmText: {
    color: theme.colors.white,
    fontSize: 15,
  },
});
