import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PanResponder,
} from 'react-native';
import AppText from './AppText';
import { theme } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CLOCK_SIZE = Math.min(SCREEN_WIDTH * 0.72, 280);
const CENTER = CLOCK_SIZE / 2;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function polarToCartesian(angleDeg, r) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

export default function CustomTimePicker({ visible, initialTime, onConfirm, onClose }) {
  const parseInitial = (t) => {
    if (!t) return { hour: 10, minute: 0, period: 'AM' };
    const [timePart, per] = t.split(' ');
    const [h, m] = timePart.split(':').map(Number);
    return { hour: h || 10, minute: m || 0, period: per || 'AM' };
  };

  const [mode, setModeState] = useState('hour'); // 'hour' | 'minute'
  const modeRef = useRef(mode);
  
  const setMode = (m) => {
    setModeState(m);
    modeRef.current = m;
  };

  const [hour, setHour] = useState(10);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState('AM');

  // Reset state when modal opens to ensure fresh state
  useEffect(() => {
    if (visible) {
      const init = parseInitial(initialTime);
      setHour(init.hour);
      setMinute(init.minute);
      setPeriod(init.period);
      setMode('hour');
    }
  }, [visible, initialTime]);

  const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;

  const handleConfirm = () => {
    onConfirm(formattedTime);
    onClose();
  };

  const handleTouch = (evt) => {
    const { locationX, locationY } = evt.nativeEvent;
    // locationX/Y are relative to the view the PanResponder is attached to!
    const dx = locationX - CENTER;
    const dy = locationY - CENTER;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (modeRef.current === 'hour') {
      let h = Math.round(angle / 30) % 12;
      if (h === 0) h = 12;
      setHour(h);
    } else {
      let m = Math.round(angle / 6) % 60;
      if (m < 0) m += 60;
      setMinute(m);
    }
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => handleTouch(evt),
    onPanResponderMove: (evt) => handleTouch(evt),
    onPanResponderRelease: () => {
      if (modeRef.current === 'hour') {
        setMode('minute');
      }
    },
  }), []);

  const activeAngle = mode === 'hour' ? (hour / 12) * 360 : (minute / 60) * 360;
  const armLength = CENTER * 0.78 - 18;

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
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>

          <AppText style={styles.title} type="heading" weight="bold">Set Custom Time</AppText>

          {/* Time Display Header */}
          <View style={styles.timeDisplay}>
            <TouchableOpacity
              style={[styles.timeSegment, mode === 'hour' && styles.timeSegmentActive]}
              onPress={() => setMode('hour')}
              activeOpacity={0.8}
            >
              <AppText style={[styles.timeSegmentText, mode === 'hour' && styles.timeSegmentTextActive]} weight="bold">
                {hour.toString().padStart(2, '0')}
              </AppText>
            </TouchableOpacity>

            <AppText style={styles.timeSep} weight="bold">:</AppText>

            <TouchableOpacity
              style={[styles.timeSegment, mode === 'minute' && styles.timeSegmentActive]}
              onPress={() => setMode('minute')}
              activeOpacity={0.8}
            >
              <AppText style={[styles.timeSegmentText, mode === 'minute' && styles.timeSegmentTextActive]} weight="bold">
                {minute.toString().padStart(2, '0')}
              </AppText>
            </TouchableOpacity>

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

          <AppText style={styles.modeLabel}>
            {mode === 'hour' ? 'Select Hour' : 'Select Minute'}
          </AppText>

          {/* Circular Clock Face */}
          <View style={styles.clockContainer}>
            <View style={styles.clockFace}>
              <View style={styles.centerDot} />

              {/* Clock Arm */}
              <View
                style={{
                  position: 'absolute',
                  left: CENTER - 1.5,
                  top: CENTER - armLength,
                  width: 3,
                  height: armLength,
                  backgroundColor: theme.colors.primaryDark,
                  transform: [
                    { translateY: armLength / 2 },
                    { rotate: `${activeAngle}deg` },
                    { translateY: -armLength / 2 }
                  ],
                  zIndex: 5,
                }}
              />

              {mode === 'hour' ? (
                HOURS.map((h) => {
                  const angle = (h / 12) * 360;
                  const pos = polarToCartesian(angle, CENTER * 0.78);
                  const isActive = hour === h;
                  
                  return (
                    <View
                      key={`h-${h}`}
                      style={[
                        styles.numBtn,
                        { left: pos.x - 20, top: pos.y - 20 },
                        isActive && styles.numBtnActive
                      ]}
                    >
                      <AppText style={[styles.numText, isActive && styles.numTextActive]} weight="bold">
                        {h}
                      </AppText>
                    </View>
                  );
                })
              ) : (
                MINUTES.map((m) => {
                  const angle = (m / 60) * 360;
                  const pos = polarToCartesian(angle, CENTER * 0.78);
                  const isActive = minute === m;
                  
                  return (
                    <View
                      key={`m-${m}`}
                      style={[
                        styles.numBtn,
                        { left: pos.x - 20, top: pos.y - 20 },
                        isActive && styles.numBtnActive
                      ]}
                    >
                      <AppText style={[styles.numText, isActive && styles.numTextActive]} weight="bold">
                        {m.toString().padStart(2, '0')}
                      </AppText>
                    </View>
                  );
                })
              )}

              {/* Invisible Overlay for PanResponder (ensures locationX/Y are robust) */}
              <View 
                style={StyleSheet.absoluteFill} 
                {...panResponder.panHandlers} 
                collapsable={false}
              />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <AppText style={styles.cancelText} weight="bold">Cancel</AppText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.8}>
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
    marginBottom: 32,
    marginTop: 8,
  },
  clockFace: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: CLOCK_SIZE / 2,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(73,94,113,0.1)',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  numBtnActive: {
    backgroundColor: theme.colors.primaryDark,
  },
  numText: {
    fontSize: 15,
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
