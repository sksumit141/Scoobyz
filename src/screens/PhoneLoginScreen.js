import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Modal, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../styles/theme';
import AppText from '../components/AppText';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import AppScreen from '../components/AppScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authApi } from '../services/api';
import AppHeader from '../components/AppHeader';
import CustomAlert from '../components/CustomAlert';

const { width } = Dimensions.get('window');

const PhoneLoginScreen = ({ navigation, route }) => {
  const mode = route.params?.mode || 'signup'; // 'signup' or 'login'
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', icon: 'alert-circle-outline', onConfirm: null });

  const showAlert = (title, message, icon = 'alert-circle-outline', onConfirm = null) => {
    setAlertConfig({ visible: true, title, message, icon, onConfirm });
  };

  const handleContinue = async () => {
    if (phone.trim().length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.sendOtp(`+91${phone}`, mode);
      navigation.navigate('OtpScreen', { phone, mode });
    } catch (err) {
      console.error('Send OTP error:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');

      if (err.data && err.data.isExistingUser !== undefined) {
        if (mode === 'signup' && err.data.isExistingUser) {
          showAlert(
            'Login/Signup Mixup',
            'Oops! It looks like you already have an account. Please select "Log In" instead of "Sign Up".',
            'account-alert-outline',
            () => navigation.replace('Welcome')
          );
        } else if (mode === 'login' && !err.data.isExistingUser) {
          showAlert(
            'Login/Signup Mixup',
            'We couldn\'t find an account with this number. Please select "Sign Up" to create a new account.',
            'account-plus-outline',
            () => navigation.replace('Welcome')
          );
        } else {
          showAlert('Error', err.message || 'Failed to send OTP.');
        }
      } else {
        showAlert('Error', err.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppScreen scrollable={true} padding={false}>
        <AppHeader title="" />
        {/* Full-screen loading overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <AppText style={styles.loadingText}>Sending OTP...</AppText>
            </View>
          </View>
        )}

        <KeyboardAvoidingView 
          style={{ flex: 1, width: '100%' }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        <View style={styles.content}>

          <View style={styles.formContainer}>
            <AppText type="heading" weight="700" style={styles.title}>
              What's your number?
            </AppText>
            <AppText style={styles.subtitle}>
              We'll send a code to verify your phone.
            </AppText>

            <AppInput
              placeholder="Enter 10-digit phone number"
              value={phone}
              onChangeText={(txt) => {
                setPhone(txt.replace(/[^0-9]/g, ''));
                setError('');
              }}
              keyboardType="phone-pad"
              maxLength={10}
              autoFocus
            />

            {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

            <AppButton
              style={[
                styles.button,
                { opacity: phone.length === 10 && !loading ? 1 : 0.6 }
              ]}
              disabled={phone.length !== 10 || loading}
              onPress={handleContinue}
            >
              <View style={styles.buttonContent}>
                <AppText style={styles.buttonText} weight="600">Send OTP</AppText>
                <MaterialCommunityIcons name="arrow-right" size={20} color="white" style={{ marginLeft: 8 }} />
              </View>
            </AppButton>
          </View>
        </View>
        </KeyboardAvoidingView>
      </AppScreen>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        iconName={alertConfig.icon}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
        onConfirm={alertConfig.onConfirm}
        confirmText="Take me there"
      />
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 40 : 60,
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
    fontSize: 17,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: theme.colors.primary,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
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
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginTop: 5,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 48,
    alignItems: 'center',
    gap: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  loadingText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
});

export default PhoneLoginScreen;
