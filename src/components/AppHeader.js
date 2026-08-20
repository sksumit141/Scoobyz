import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AppText from './AppText';
import { theme } from '../styles/theme';
import { safeGoBack } from '../hooks/useBackHandler';

export default function AppHeader({ 
  title, 
  onBackPress, 
  rightComponent, 
  showBackButton = true,
  style,
  headerTheme = 'light' // 'light' means dark text/icons, 'dark' means white text/icons
}) {
  const navigation = useNavigation();
  const textColor = headerTheme === 'dark' ? theme.colors.white : theme.colors.textBlack;

  return (
    <View style={[styles.container, style]}>
      {showBackButton && (
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => onBackPress ? onBackPress() : safeGoBack(navigation)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={textColor} />
        </TouchableOpacity>
      )}
      
      {title ? (
        typeof title === 'string' ? (
          <AppText style={[styles.title, { color: textColor }, !showBackButton && { marginLeft: 0 }]} weight="bold" numberOfLines={1}>
            {title}
          </AppText>
        ) : (
          <View style={[styles.customTitleContainer, !showBackButton && { marginLeft: 0 }]}>
            {title}
          </View>
        )
      ) : null}

      {rightComponent ? (
        <View style={styles.rightComponentContainer}>
          {rightComponent}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    minHeight: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginLeft: -8, // slight offset to align the icon visually with padding
  },
  title: {
    fontSize: 22,
    color: theme.colors.textBlack,
    fontFamily: theme.fonts.heading,
    flex: 1,
    textAlign: 'left',
    marginLeft: 4, // spacing between chevron and title
  },
  customTitleContainer: {
    flex: 1,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  rightComponentContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  }
});
