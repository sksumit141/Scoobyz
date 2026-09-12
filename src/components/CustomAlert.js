import React from 'react';
import { Modal, View, StyleSheet, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import AppText from './AppText';

const { width, height } = Dimensions.get('window');

const CustomAlert = ({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  iconName = 'alert-circle-outline',
  iconColor = theme.colors.primaryDark,
  buttonText = 'Cancel',
  confirmText = 'Confirm',
  type = 'info' // info, success, warning, error
}) => {
  const insets = useSafeAreaInsets();
  // Map type to colors if iconColor is not provided specifically
  const getColors = () => {
    switch (type) {
      case 'success': return { icon: theme.colors.success, bg: `${theme.colors.success}15` };
      case 'warning': return { icon: '#FF9800', bg: '#FFF3E0' };
      case 'error': return { icon: '#F44336', bg: '#FFEBEE' };
      default: return { icon: iconColor, bg: `${iconColor}15` }; // 15 is ~8% opacity
    }
  };

  const colors = getColors();
  const styles = getStyles(insets);

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          {/* Pull Handle for aesthetic */}
          <View style={styles.pullHandle} />
          
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.iconWrapper, { backgroundColor: colors.bg }]}>
            <MaterialCommunityIcons name={iconName} size={44} color={colors.icon} />
          </View>

          <View style={styles.content}>
            <AppText style={styles.title} weight="bold">{title}</AppText>
            <AppText style={styles.message}>{message}</AppText>
          </View>

          {onConfirm && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <AppText style={[styles.buttonText, styles.cancelButtonText]} weight="bold">
                  {buttonText}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.confirmButton, { backgroundColor: colors.icon }]} 
                onPress={onConfirm} 
                activeOpacity={0.8}
              >
                <AppText style={[styles.primaryButtonText, { color: theme.colors.white }]} weight="bold">{confirmText}</AppText>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
};

const getStyles = (insets) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 13, 31, 0.48)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  alertBox: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1E8C9',
    paddingHorizontal: 20,
    paddingBottom: Math.max(insets.bottom > 20 ? 24 : 20, 20),
    paddingTop: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 20,
  },
  pullHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DCD3B8',
    borderRadius: 2,
    marginBottom: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    padding: 4,
    zIndex: 10,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 20,
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 27,
  },
  message: {
    fontSize: 14,
    color: '#5F5965',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    alignSelf: 'stretch',
  },
  button: {
    minHeight: 50,
    minWidth: 0,
    borderRadius: 14,
    flex: 1,
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    color: theme.colors.primaryDark,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED6E8',
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: 'transparent',
    // Removed shadows for transparent style
  },
});

export default CustomAlert;
