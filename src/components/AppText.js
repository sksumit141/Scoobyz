import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

const AppText = ({ children, style, type = 'body', weight = '400', ...props }) => {
  const textStyle = [
    type === 'heading' ? styles.heading : styles.body,
    { fontWeight: weight },
    style,
  ];

  return <Text style={textStyle} {...props}>{children}</Text>;
};

const styles = StyleSheet.create({
  body: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  heading: {
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    color: theme.colors.textPrimary,
  },
});

export default AppText;
