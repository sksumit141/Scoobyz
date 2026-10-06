import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import AppText from './AppText';
import { appVersionApi } from '../services/api';
import { compareAppVersions, isTrustedStoreUrl, OFFICIAL_STORE_URLS } from '../utils/appVersion';
import { theme } from '../styles/theme';

export default function AppUpdateGate() {
  const [update, setUpdate] = useState(null);
  const [openingStore, setOpeningStore] = useState(false);
  const [openError, setOpenError] = useState('');

  useEffect(() => {
    let mounted = true;

    const checkVersion = async () => {
      if (!['android', 'ios'].includes(Platform.OS)) return;
      try {
        const response = await appVersionApi.getPolicy();
        const policy = response?.platforms?.[Platform.OS];
        const installedVersion = Application.nativeApplicationVersion;
        if (!policy || !installedVersion) return;
        const storeUrl = isTrustedStoreUrl(Platform.OS, policy.storeUrl)
          ? policy.storeUrl
          : OFFICIAL_STORE_URLS[Platform.OS];
        if (!storeUrl) return;

        if (compareAppVersions(installedVersion, policy.latestVersion) < 0 && mounted) {
          setUpdate({
            ...policy,
            storeUrl,
            installedVersion,
            message: response.message,
            required: compareAppVersions(installedVersion, policy.minimumVersion) < 0,
          });
        }
      } catch (error) {
        console.warn('App version check failed:', error.message);
      }
    };

    checkVersion();
    return () => { mounted = false; };
  }, []);

  const openStore = async () => {
    if (!update?.storeUrl || openingStore) return;
    setOpeningStore(true);
    setOpenError('');
    try {
      await Linking.openURL(update.storeUrl);
    } catch {
      setOpenError('Could not open the app store. Please update Scoobyz directly from the store.');
    } finally {
      setOpeningStore(false);
    }
  };

  return (
    <Modal
      visible={Boolean(update)}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => { if (!update?.required) setUpdate(null); }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="cellphone-arrow-down" size={34} color={theme.colors.success} />
          </View>
          <AppText style={styles.title} type="heading" weight="bold">
            {update?.required ? 'Update Required' : 'New Version Available'}
          </AppText>
          <AppText style={styles.message}>{update?.message}</AppText>
          <AppText style={styles.versionText}>
            Installed {update?.installedVersion}  •  Latest {update?.latestVersion}
          </AppText>
          {openError ? <AppText style={styles.errorText}>{openError}</AppText> : null}
          <TouchableOpacity style={styles.updateButton} onPress={openStore} disabled={openingStore} activeOpacity={0.8}>
            {openingStore
              ? <ActivityIndicator color={theme.colors.white} />
              : <AppText style={styles.updateButtonText} weight="bold">Update now</AppText>}
          </TouchableOpacity>
          {!update?.required && (
            <TouchableOpacity style={styles.laterButton} onPress={() => setUpdate(null)} activeOpacity={0.8}>
              <AppText style={styles.laterButtonText} weight="bold">Maybe later</AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    backgroundColor: theme.colors.white,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(78,108,72,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 23,
    textAlign: 'center',
  },
  message: {
    marginTop: 9,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  versionText: {
    marginTop: 12,
    color: theme.colors.success,
    fontSize: 12,
  },
  errorText: {
    marginTop: 12,
    color: theme.colors.error,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  updateButton: {
    width: '100%',
    minHeight: 48,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateButtonText: {
    color: theme.colors.white,
    fontSize: 16,
  },
  laterButton: {
    width: '100%',
    paddingVertical: 13,
    alignItems: 'center',
  },
  laterButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
});
