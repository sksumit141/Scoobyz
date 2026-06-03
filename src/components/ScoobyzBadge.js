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
        size={10} 
        color={theme.colors.white} 
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
    backgroundColor: theme.colors.primaryDark,
    width: 36,
    height: 36,
    borderRadius: 18,
    gap: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    fontSize: 9,
    color: theme.colors.white,
    letterSpacing: -0.2,
  }
});



