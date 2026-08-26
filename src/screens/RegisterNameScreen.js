import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import AppText from '../components/AppText';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import AppScreen from '../components/AppScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { customerApi } from '../services/api';

const { width, height } = Dimensions.get('window');

const RegisterNameScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (name.trim().length < 2) return;

    setLoading(true);
    try {
      await customerApi.updateProfile({ name: name.trim() });
      navigation.navigate('AddPetProfile');
    } catch (error) {
      console.error('Update name error:', error);
      Alert.alert('Error', 'Failed to save your name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen scrollable={false} padding={false} safeAreaTop={false}>
      <View style={[styles.headerRow, { paddingTop: Math.max(20, insets.top) }]}>
        <Image
          source={require('../../assets/scoobyz_logo-removebg-preview.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1, width: '100%' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.formContainer}>
            <AppText type="heading" weight="700" style={styles.title}>
              What's your name?
            </AppText>
            <AppText style={styles.subtitle}>
              We'll use this to personalize your Scoobyz experience.
            </AppText>

            <AppInput
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <AppButton
              style={[
                styles.button,
                { opacity: name.length > 2 && !loading ? 1 : 0.6 }
              ]}
              disabled={name.length <= 2 || loading}
              onPress={handleContinue}
            >
              <View style={styles.buttonContent}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <AppText style={styles.buttonText} weight="600">Continue</AppText>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="white" style={{ marginLeft: 8 }} />
                  </>
                )}
              </View>
            </AppButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 40,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    color: theme.colors.textPrimary,
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: theme.colors.primary,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
});

export default RegisterNameScreen;
