import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from './AppText';
import { theme } from '../styles/theme';

export default function ScoobyzBadge() {
  return (
    <View style={styles.badge}>
      <MaterialCommunityIcons
        name="paw"
        size={17}
        color={theme.colors.success}
      />
      <AppText style={styles.text} weight="bold">
        SC
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    width: 48,
    height: 48,
    borderRadius: 28,
    gap: 1,
    shadowColor: '#000',
    transform: [{ rotate: '15deg' }],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    fontSize: 15,
    color: theme.colors.success,
    letterSpacing: 0.2,
  }
});



