import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';

export default function ComingSoonScreen({ navigation }) {
  return (
    <AppScreen padding={false} backgroundColor={theme.colors.background}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color={theme.colors.textBlack} />
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    zIndex: 10,
    elevation: 10,
  },
  closeBtn: {
    padding: 8,
    marginLeft: -8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: -80, // Offset to visually center better
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
