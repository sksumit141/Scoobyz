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
  buttonText = 'Okay',
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

          <View style={onConfirm ? styles.buttonRow : styles.singleButtonContainer}>
            <TouchableOpacity 
              style={[styles.button, onConfirm ? styles.cancelButton : [styles.primaryButton, { backgroundColor: colors.icon }]]} 
              onPress={onClose} 
              activeOpacity={0.8}
            >
              <AppText style={[styles.buttonText, onConfirm ? styles.cancelButtonText : [styles.primaryButtonText, { color: theme.colors.white }]]} weight="bold">
                {buttonText}
              </AppText>
            </TouchableOpacity>

            {onConfirm && (
              <TouchableOpacity 
                style={[styles.button, styles.confirmButton, { backgroundColor: colors.icon }]} 
                onPress={onConfirm} 
                activeOpacity={0.8}
              >
                <AppText style={[styles.primaryButtonText, { color: theme.colors.white }]} weight="bold">{confirmText}</AppText>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </View>
    </Modal>
  );
};

const getStyles = (insets) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  alertBox: {
    width: '100%',
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 16, // Reduced padding to make buttons wider
    paddingBottom: Math.max(insets.bottom + 10, 34),
    paddingTop: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  pullHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#EBEAE6',
    borderRadius: 2,
    marginBottom: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 24,
    right: 24,
    padding: 4,
    zIndex: 10,
  },
  iconWrapper: {
    width: 86,
    height: 86,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  content: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 24,
    color: theme.colors.textBlack,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 32,
  },
  message: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    paddingHorizontal: 8,
  },
  singleButtonContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  button: {
    height: 72,
    borderRadius: 24,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: 'transparent',
    // Removed shadows for transparent style
  },
  primaryButtonText: {
    color: theme.colors.primaryDark,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: '#F5F5F7',
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 18,
  },
  confirmButton: {
    backgroundColor: 'transparent',
    // Removed shadows for transparent style
  },
});

export default CustomAlert;
