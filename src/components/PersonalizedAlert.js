import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

let alertListener = null;
let pendingAlert = null;
let installed = false;

const inferType = (title = '') => {
  const value = String(title).toLowerCase();
  if (value.includes('success') || value.includes('submitted') || value.includes('completed') || value.includes('updated')) return 'success';
  if (value.includes('error') || value.includes('failed') || value.includes('unable') || value.includes('denied')) return 'error';
  if (value.includes('warning') || value.includes('required') || value.includes('incomplete') || value.includes('delete')) return 'warning';
  return 'info';
};

export const showPersonalizedAlert = (title, message, buttons, options) => {
  const payload = {
    id: Date.now() + Math.random(), title: title || 'Scoobyz', message: message || '',
    buttons: Array.isArray(buttons) ? buttons : [], options: options || {}, type: inferType(title),
  };
  pendingAlert = payload;
  alertListener?.(payload);
};

export const installPersonalizedAlerts = () => {
  if (installed) return;
  installed = true;
  Alert.alert = showPersonalizedAlert;
  if (typeof globalThis !== 'undefined') {
    globalThis.alert = (message) => showPersonalizedAlert('Scoobyz', String(message || ''));
  }
};

const TYPE_STYLES = {
  success: { icon: 'checkmark-circle-outline', color: '#4B6B54', tint: '#E9F0E8' },
  error: { icon: 'close-circle-outline', color: '#B74848', tint: '#F8E7E5' },
  warning: { icon: 'alert-circle-outline', color: '#A66A16', tint: '#F8EDD6' },
  info: { icon: 'information-circle-outline', color: '#3D2A5E', tint: '#EEE8F5' },
};

export default function PersonalizedAlertHost() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(pendingAlert);
  const palette = useMemo(() => TYPE_STYLES[current?.type] || TYPE_STYLES.info, [current?.type]);
  const isActionable = Boolean(current?.buttons?.length);

  useEffect(() => {
    alertListener = setCurrent;
    if (pendingAlert) setCurrent(pendingAlert);
    return () => { if (alertListener === setCurrent) alertListener = null; };
  }, []);

  useEffect(() => {
    if (!current || isActionable) return undefined;
    const timeout = setTimeout(() => dismiss(), current.type === 'error' ? 4200 : 3000);
    return () => clearTimeout(timeout);
  }, [current?.id, isActionable]);

  const dismiss = () => {
    const onDismiss = current?.options?.onDismiss;
    pendingAlert = null;
    setCurrent(null);
    onDismiss?.();
  };

  const pressButton = (button) => {
    pendingAlert = null;
    setCurrent(null);
    button?.onPress?.();
  };

  if (!current) return null;

  const card = (
    <View style={[styles.card, isActionable ? styles.dialogCard : styles.toastCard]}>
      <View style={[styles.iconBox, { backgroundColor: palette.tint }]}>
        <Ionicons name={palette.icon} size={26} color={palette.color} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{current.title}</Text>
        {current.message ? <Text style={styles.message}>{current.message}</Text> : null}
      </View>
      {!isActionable ? (
        <TouchableOpacity onPress={dismiss} style={styles.closeButton} accessibilityLabel="Close message">
          <Ionicons name="close" size={20} color="#62596A" />
        </TouchableOpacity>
      ) : null}
      {isActionable ? (
        <View style={styles.actions}>
          {current.buttons.map((button, index) => {
            const isCancel = button.style === 'cancel';
            const isDestructive = button.style === 'destructive';
            return (
              <TouchableOpacity
                key={`${button.text || 'button'}-${index}`}
                onPress={() => pressButton(button)}
                style={[styles.actionButton, isCancel && styles.cancelButton, isDestructive && styles.destructiveButton, !isCancel && !isDestructive && { backgroundColor: palette.color }]}
              >
                <Text style={[styles.actionText, isCancel && styles.cancelText]}>{button.text || 'Okay'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );

  if (!isActionable) {
    return <View pointerEvents="box-none" style={[styles.toastLayer, { top: Math.max(insets.top, 12) + 10 }]}>{card}</View>;
  }

  return <Modal transparent visible animationType="fade" onRequestClose={dismiss}><View style={styles.overlay}>{card}</View></Modal>;
}

const styles = StyleSheet.create({
  toastLayer: { position: 'absolute', left: 20, right: 20, zIndex: 10000, elevation: 30 },
  overlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(20, 13, 31, 0.48)' },
  card: { backgroundColor: '#FFFBEB', borderRadius: 14, borderWidth: 1, borderColor: '#F1E8C9', flexDirection: 'row', alignItems: 'center', padding: 16, shadowColor: '#22182F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 14, elevation: 12 },
  toastCard: { width: '100%' },
  dialogCard: { width: '100%', maxWidth: 420, alignSelf: 'center', flexWrap: 'wrap', padding: 20 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, paddingHorizontal: 12 },
  title: { color: '#2D3748', fontSize: 16, lineHeight: 22, fontFamily: 'Manrope_700Bold' },
  message: { color: '#5F5965', fontSize: 13, lineHeight: 19, marginTop: 3, fontFamily: 'Manrope_400Regular' },
  closeButton: { padding: 6, marginRight: -6 },
  actions: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  actionButton: { minWidth: 100, minHeight: 46, flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  cancelButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DED6E8' },
  destructiveButton: { backgroundColor: '#B74848' },
  actionText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Manrope_700Bold' },
  cancelText: { color: '#3D2A5E' },
});
