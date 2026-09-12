import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { useBackHandler } from '../hooks/useBackHandler';
import { theme } from '../styles/theme';

export default function ComingSoonScreen() {
  const { handleBack } = useBackHandler({ fallbackScreen: 'LandingScreen' });

  return (
    <AppScreen safeAreaTop={true} padding={false} backgroundColor={theme.colors.background}>
      <AppHeader title="Coming Soon" onBackPress={handleBack} />

      <View style={styles.content}>
        <Ionicons name="construct-outline" size={64} color={theme.colors.primaryDark} style={{ marginBottom: 24 }} />
        <AppText type="heading" weight="bold" style={styles.title}>Coming Soon!</AppText>
        <AppText style={styles.subtitle}>
          We are bringing this service soon. Stay tuned for updates!
        </AppText>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    color: theme.colors.textBlack,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
