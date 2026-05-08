import React from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { theme } from '../styles/theme';
import AppText from './AppText';

const { width, height } = Dimensions.get('window');

const AppInput = ({ label, placeholder, value, onChangeText, secureTextEntry, keyboardType, ...props }) => {
  return (
    <View style={styles.container}>
      {label && (
        <AppText style={styles.label} weight="600">
          {label}
        </AppText>
      )}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        selectionColor={theme.colors.primary}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    paddingVertical: Math.min(16, height * 0.02),
    paddingHorizontal: 20,
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.body,
    // Soft shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, // Increased slightly for visibility without border
    shadowRadius: 4,
    elevation: 3,
  },
});

export default AppInput;
