import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

const SplashScreenComp = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/scoobyz_logo-removebg-preview.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 320,
    height: 160,
    marginLeft: 30, // Shifting slightly to the right for perfect visual balance
  },
});

export default SplashScreenComp;
