import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AppText from './AppText';
import { theme } from '../styles/theme';

const AppButton = ({ title, onPress, loading, style, textStyle, children, ...props }) => {
  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={onPress} 
      disabled={loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.white} />
      ) : (
        children || (
          <AppText style={[styles.text, textStyle]} weight="600">
            {title}
          </AppText>
        )
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: theme.colors.white,
    fontSize: 16,
  },
});

export default AppButton;
