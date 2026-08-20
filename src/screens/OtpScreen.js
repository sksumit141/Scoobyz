import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';
import AppScreen from '../components/AppScreen';
import { authApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PawLoader from '../components/PawLoader';
import { registerAndSendPushToken } from '../components/PushNotificationManager';

const { width } = Dimensions.get('window');

const OtpScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { phone, mode } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    setError('');
    try {
      await authApi.sendOtp(`+91${phone}`, mode);
      setTimer(30); // reset timer
      Alert.alert('OTP Sent', 'A new verification code has been sent to your phone.');
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await authApi.verifyOtp(`+91${phone}`, code);
      if (data.success) {
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('userId', String(data.userId));
        await AsyncStorage.setItem('isOnboarded', String(data.isOnboarded));
        
        registerAndSendPushToken();

        if (data.isOnboarded) {
             navigation.replace('LandingScreen');
        } else {
             navigation.replace('RegisterName');
        }
      } else {
        setError(data.details || 'Verification failed.');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError(err.message || 'Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppScreen scrollable={false} padding={false} safeAreaTop={false}>
        {/* Full-screen loading overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <PawLoader fullScreen={false} />
              <AppText style={styles.loadingText}>Verifying...</AppText>
            </View>
          </View>
        )}

        {/* Header Row with Back Button and Logo */}
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
          <View style={[styles.content, { paddingBottom: Math.max(20, insets.bottom + 10) }]}>
            <View style={styles.formContainer}>
              <AppText type="heading" weight="700" style={styles.title}>
                Verify your number
              </AppText>
              <AppText style={styles.subtitle}>
                Enter the 6-digit code we sent to +91 {phone}
              </AppText>

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={(text) => handleChange(text.replace(/[^0-9]/g, ''), index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                  />
                ))}
              </View>

              {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

              <AppButton
                style={[
                  styles.button,
                  { opacity: otp.join('').length === 6 && !loading ? 1 : 0.6 }
                ]}
                disabled={otp.join('').length !== 6 || loading}
                onPress={handleVerify}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <AppText style={styles.buttonText} weight="600">Verify & Continue</AppText>
                )}
              </AppButton>

              <View style={styles.resendContainer}>
                <AppText style={styles.resendTextLabel}>Didn't receive the code?</AppText>
                <TouchableOpacity onPress={handleResend} disabled={timer > 0 || loading}>
                  <AppText style={timer > 0 ? styles.resendText : styles.resendTextActive} weight={timer > 0 ? '400' : '700'}>
                    {timer > 0 ? ` Resend in ${timer}s` : ' Resend OTP'}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </AppScreen>
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'flex-end', // Pushes the form to the bottom for all screen sizes
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
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  otpInput: {
    width: width * 0.12,
    height: width * 0.14,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'Manrope-Bold',
    color: theme.colors.textPrimary,
    backgroundColor: 'white',
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
  resendContainer: {
    flexDirection: 'row',
    marginTop: 25,
    alignItems: 'center',
  },
  resendTextLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  resendText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  resendTextActive: {
    fontSize: 14,
    color: theme.colors.primary,
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

export default OtpScreen;
