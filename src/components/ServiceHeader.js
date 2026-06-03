import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AppText from './AppText';
import AddressHeader from './AddressHeader';
import { theme } from '../styles/theme';
import { safeGoBack } from '../hooks/useBackHandler';

export default function ServiceHeader({ 
  title, 
  showAddress = true,
  rightIcon,
  onRightPress 
}) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => safeGoBack(navigation)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textBlack} />
        </TouchableOpacity>
        
        <AppText style={styles.title} type="heading" weight="bold">
          {title}
        </AppText>

        {rightIcon ? (
          <TouchableOpacity 
            style={styles.rightButton} 
            onPress={onRightPress}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name={rightIcon} size={22} color={theme.colors.textBlack} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

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
    paddingHorizontal: 18,
    paddingTop: 40,
    paddingBottom: 12,
    backgroundColor: theme.colors.background,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
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
  title: {
    fontSize: 20,
    color: theme.colors.textBlack,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
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
    marginTop: 4,
  }
});
