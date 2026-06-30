import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from './AppText';
import { theme } from '../styles/theme';

export default function SelectionChoiceModal({ visible, onClose, onSelectYourself, onScoobyzMatch, serviceType }) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlayBackground}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.overlayContainer}>
          <AppText style={styles.title} type="heading" weight="bold">
            How would you like to proceed?
          </AppText>
          <AppText style={styles.subtitle}>
            You can either let our expert team match you with the best available {serviceType === 'Walking' ? 'walker' : 'groomer'}, or you can browse and select one yourself.
          </AppText>

          <TouchableOpacity
            style={[styles.optionCard, styles.primaryOption]}
            onPress={onScoobyzMatch}
            activeOpacity={0.8}
          >
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons name="star-face" size={24} color={theme.colors.white} />
            </View>
            <View style={styles.optionTextContainer}>
              <AppText style={styles.optionTitle} weight="bold">Let Scoobyz team select perfect Match</AppText>
              <AppText style={styles.optionDesc}>We will find the best match for your pet based on availability and ratings.</AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={onSelectYourself}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIconContainer, { backgroundColor: 'rgba(61, 42, 94, 0.1)' }]}>
              <MaterialCommunityIcons name="account-search" size={24} color={theme.colors.primaryDark} />
            </View>
            <View style={styles.optionTextContainer}>
              <AppText style={[styles.optionTitle, { color: theme.colors.primaryDark }]} weight="bold">Select yourself</AppText>
              <AppText style={[styles.optionDesc, { color: theme.colors.textSecondary }]}>Browse through our list of verified experts and their packages.</AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
          >
            <AppText style={styles.cancelBtnText} weight="bold">Cancel</AppText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContainer: {
    width: '90%',
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  optionCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  primaryOption: {
    backgroundColor: theme.colors.primaryDark,
    borderColor: theme.colors.primaryDark,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: theme.colors.white,
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 16,
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});
