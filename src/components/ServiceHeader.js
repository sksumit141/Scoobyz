import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AppText from './AppText';
import AddressHeader from './AddressHeader';
import { theme } from '../styles/theme';
import AppHeader from './AppHeader';

export default function ServiceHeader({ 
  title, 
  showAddress = true,
  rightIcon,
  onRightPress 
}) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <AppHeader 
        title={title} 
        rightComponent={
          rightIcon ? (
            <TouchableOpacity 
              style={styles.rightButton} 
              onPress={onRightPress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name={rightIcon} size={22} color={theme.colors.textBlack} />
            </TouchableOpacity>
          ) : null
        }
      />

      {showAddress && (
        <View style={styles.addressSection}>
          <AddressHeader lightTheme={false} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 0,
    backgroundColor: theme.colors.background,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 0,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginLeft: -6, // Compensate for internal icon padding to visually align with subheadings
  },
  title: {
    fontSize: 28,
    color: theme.colors.textBlack,
    textAlign: 'left',
    flex: 1,
    marginLeft: 0, 
  },
  rightButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  placeholder: {
    width: 44,
  },
  addressSection: {
    marginTop: 16,
    paddingHorizontal: 0,
  },
});
