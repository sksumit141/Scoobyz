import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';
import CustomAlert from '../components/CustomAlert';
import AppScreen from '../components/AppScreen';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../services/api';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');
const isSmallDevice = height < 700;

const WelcomeScreen = ({ navigation }) => {
  const [authState, setAuthState] = useState('initial');
  const [selectedMode, setSelectedMode] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', icon: 'alert-circle-outline' });

  const showAlert = (title, message, icon = 'alert-circle-outline') => {
    setAlertConfig({ visible: true, title, message, icon });
  };

  const transitionTo = (newState, mode = null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAuthState(newState);
    if (mode) setSelectedMode(mode);
  };

  const [request, response, promptAsync] = Google.useAuthRequest({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      redirectUri: Platform.OS === 'web' 
          ? AuthSession.makeRedirectUri({ path: 'oauthredirect' })
          : 'com.googleusercontent.apps.1013005276460-pusoouaic016hst3dsb938mm22h36bed:/oauthredirect',
      scopes: ['openid', 'profile', 'email'],
  });

  React.useEffect(() => {
      if (response?.type === 'success') {
          const idToken = response.authentication?.idToken;
          const accessToken = response.authentication?.accessToken;
          if (idToken) {
              handleSupabaseGoogle(idToken);
          } else if (accessToken) {
              handleGoogleFallback(accessToken);
          }
      }
  }, [response]);

  // Path 1: idToken → Supabase verification → your backend
  const handleSupabaseGoogle = async (idToken) => {
      try {
          const { data: sd, error: se } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: idToken,
          });
          if (se) { showAlert('Login Error', se.message); return; }
          const u = sd.user;
          await sendToBackend(u.email, u.user_metadata?.full_name || u.user_metadata?.name || '', u.user_metadata?.sub || u.id);
      } catch (e) {
          console.error('Supabase Google error:', e);
          showAlert('Error', e.message || 'Google sign-in failed.');
      }
  };

  // Path 2 (fallback): accessToken → Google UserInfo API → your backend
  const handleGoogleFallback = async (accessToken) => {
      try {
          const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!r.ok) throw new Error('Failed to fetch Google user info');
          const p = await r.json();
          await sendToBackend(p.email, p.name, p.sub);
      } catch (e) {
          console.error('Google fallback error:', e);
          showAlert('Error', e.message || 'Google sign-in failed.');
      }
  };

  // Shared: send verified user info to YOUR backend
  const sendToBackend = async (email, name, googleId) => {
      try {
          const res = await fetch(`${BASE_URL}/auth/google-supabase`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, name, googleId, app: 'customer', type: selectedMode }),
          });
          const data = await res.json();
          if (data.success) {
              await AsyncStorage.setItem('authToken', data.token);
              await AsyncStorage.setItem('userId', String(data.userId));
              if (data.isOnboarded) {
                  navigation.replace('LandingScreen');
              } else {
                  navigation.replace('RegisterName');
              }
          } else {
              if (res.status === 403) {
                  showAlert('Wrong App', data.message || 'You have a Partner account. Please use the Scoob Partner app.');
              } else if (data.error === 'Account Exists') {
                  showAlert(
                    'Login/Signup Mixup',
                    'Oops! It looks like you already have an account. Please select "Log In" instead of "Sign Up".',
                    'account-alert-outline'
                  );
              } else if (data.error === 'No Account Found') {
                  showAlert(
                    'Login/Signup Mixup',
                    'We couldn\'t find an account with this email. Please select "Sign Up" to create a new account.',
                    'account-plus-outline'
                  );
              } else {
                  showAlert(data.error || 'Login Failed', data.message || 'Unknown error');
              }
          }
      } catch (error) {
          console.error('Backend auth error:', error);
          showAlert('Error', 'Failed to connect to server.');
      }
  };

  const renderActionSection = () => {
    switch (authState) {
      case 'initial':
        return (
          <AppButton
            style={styles.button}
            onPress={() => transitionTo('selection')}
          >
            <View style={styles.buttonContent}>
              <AppText style={styles.buttonText} weight="600">
                Get Started
              </AppText>
              <MaterialCommunityIcons name="arrow-right" size={18} color="white" style={{ marginLeft: 8 }} />
            </View>
          </AppButton>
        );

      case 'selection':
        return (
          <View style={styles.selectionContainer}>
            <AppButton
              style={[styles.miniButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => transitionTo('methods', 'signup')}
            >
              <AppText style={styles.miniButtonText}>Sign Up</AppText>
            </AppButton>

            <AppButton
              style={[styles.miniButton, styles.outlineButton]}
              onPress={() => transitionTo('methods', 'login')}
            >
              <AppText style={styles.miniButtonText}>Log In</AppText>
            </AppButton>

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => transitionTo('initial')}
            >
              <AppText style={styles.backText} weight="700">Back</AppText>
            </TouchableOpacity>
          </View>
        );

      case 'methods':
        return (
          <View style={styles.methodsContainer}>
            <AppText style={styles.methodsTitle} weight="700">
              {selectedMode === 'signup' ? 'Sign Up' : 'Login with'}
            </AppText>

            <View style={styles.socialColumn}>
              <AppButton
                style={styles.socialButton}
                onPress={() => navigation.navigate('PhoneLogin', { mode: selectedMode })}
              >
                <MaterialCommunityIcons name="cellphone" size={22} color={theme.colors.textPrimary} />
                <AppText style={styles.socialButtonText}>Continue with Phone</AppText>
              </AppButton>
              
              <AppButton
                style={styles.socialButton}
                onPress={() => promptAsync()}
                disabled={!request}
              >
                <MaterialCommunityIcons name="google" size={22} color={theme.colors.accent} />
                <AppText style={styles.socialButtonText}>Continue with Google</AppText>
              </AppButton>
              
              <AppButton
                style={styles.socialButton}
                onPress={() => navigation.navigate('RegisterName')}
              >
                <MaterialCommunityIcons name="apple" size={22} color="black" />
                <AppText style={styles.socialButtonText}>Continue with Apple</AppText>
              </AppButton>
            </View>

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => transitionTo('selection')}
            >
              <AppText style={styles.backText} weight="700">Back</AppText>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <AppScreen padding={false} safeArea={true} scrollable={true} style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* TOP */}
        <View style={styles.topHalf}>
          <View style={styles.imageWrapper}>
            <View style={styles.topDecorator} />

            <Image
              source={require('../../assets/Scobysimage.jpeg')}
              style={styles.heroImage}
              resizeMode="cover"
            />

            <View style={styles.pawDecorator}>
              <MaterialCommunityIcons
                name="paw"
                size={width * 0.08}
                color={theme.colors.accent}
              />
            </View>
          </View>
        </View>

        {/* BOTTOM */}
        <View style={styles.bottomHalf}>
          <View style={styles.textContainer}>
            <AppText type="heading" weight="700" style={styles.welcomeText}>
              Welcome to
            </AppText>

            <AppText type="heading" weight="700" style={styles.brandText}>
              Scoobyz
            </AppText>

            <AppText style={styles.tagline} weight="600">
              INDIA'S NO.1 PET CARE PLATFORM
            </AppText>
          </View>

          <View style={styles.actionContainer}>
            {renderActionSection()}
          </View>
        </View>

        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          iconName={alertConfig.icon}
          onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
        />
      </AppScreen>
    </>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: height,
    backgroundColor: theme.colors.background,
  },

  /* TOP */
  topHalf: {
    flex: isSmallDevice ? 1 : 1.2,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  imageWrapper: {
    width: width * (isSmallDevice ? 0.75 : 0.7),
    aspectRatio: 0.8,
    position: 'relative',


  },

  heroImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 80,
    borderBottomRightRadius: 80,
  },

  topDecorator: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: width * 0.12,
    height: width * 0.12,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: theme.colors.accent,
  },

  pawDecorator: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    backgroundColor: theme.colors.background,
    padding: 6,
    borderRadius: 20,
  },

  /* BOTTOM */
  bottomHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },

  textContainer: {
    alignItems: 'center',
    marginBottom: Math.min(20, height * 0.02),
  },

  welcomeText: {
    fontSize: Math.min(26, width * 0.065),
    color: theme.colors.textPrimary,
  },

  brandText: {
    fontSize: Math.min(32, width * 0.082),
    color: theme.colors.primary,
    marginTop: 4,
  },

  tagline: {
    fontSize: Math.min(13, width * 0.032),
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    marginTop: 12,
    textAlign: 'center',
  },

  actionContainer: {
    width: '100%',
    alignItems: 'center',
    minHeight: Math.min(120, height * 0.15),
  },

  button: {
    backgroundColor: theme.colors.primary,
    width: '100%',
    maxWidth: 360,
    paddingVertical: Math.min(16, height * 0.02),
    borderRadius: 40,
    alignItems: 'center',
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  buttonText: {
    color: 'white',
    fontSize: Math.min(16, width * 0.045),
  },

  selectionContainer: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },

  miniButton: {
    width: '100%',
    maxWidth: 300,
    paddingVertical: Math.min(14, height * 0.018),
    borderRadius: 30,
    alignItems: 'center',
  },

  outlineButton: {
    backgroundColor: theme.colors.primary,
  },

  miniButtonText: {
    fontSize: 16,
    color: 'white',
  },

  methodsContainer: {
    alignItems: 'center',
    width: '100%',
  },

  methodsTitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 17,
  },

  socialColumn: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
    marginBottom: 0,
  },

  socialButton: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    gap: 10,
  },

  socialButtonText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },

  backBtn: {
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  backText: {
    color: theme.colors.textSecondary,
    fontSize: 16,

  },
});