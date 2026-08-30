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
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';
import CustomAlert from '../components/CustomAlert';
import AppScreen from '../components/AppScreen';
import * as WebBrowser from 'expo-web-browser';
import { configureGoogleAuth, signInWithGoogle } from '../utils/GoogleAuth';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../services/api';
import { supabase } from '../lib/supabase';
import PawLoader from '../components/PawLoader';

WebBrowser.maybeCompleteAuthSession();

configureGoogleAuth();
const { width, height } = Dimensions.get('window');
const isSmallDevice = height < 700;

const WelcomeScreen = ({ navigation }) => {
  const [authState, setAuthState] = useState('selection');
  const [selectedMode, setSelectedMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', icon: 'alert-circle-outline' });

  const showAlert = (title, message, icon = 'alert-circle-outline') => {
    setAlertConfig({ visible: true, title, message, icon });
  };

  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const isTransitioning = React.useRef(false);

  const transitionTo = (newState, mode = null) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setAuthState(newState);
      if (mode) setSelectedMode(mode);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        isTransitioning.current = false;
      });
    });
  };

  // Web-only Google Sign-In hook
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });

  React.useEffect(() => {
    if (Platform.OS === 'web' && response?.type === 'success') {
      const idToken = response.authentication?.idToken;
      const accessToken = response.authentication?.accessToken;
      if (idToken) {
        handleSupabaseGoogle(idToken);
      } else if (accessToken) {
        handleGoogleFallback(accessToken);
      }
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    if (Platform.OS === 'web') {
      promptAsync();
      return;
    }

    try {
      const idToken = await signInWithGoogle();
      if (idToken) {
        await handleSupabaseGoogle(idToken);
      } else {
        showAlert('Error', 'No ID token found from Google Sign-In.');
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      if (error.code !== 'SIGN_IN_CANCELLED') {
        showAlert('Login Error', error.message || 'Google sign-in failed.');
      }
    }
  };

  // Path 1: idToken → Supabase verification → your backend
  const handleSupabaseGoogle = async (idToken) => {
    setLoading(true);
    try {
      const { data: sd, error: se } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (se) { showAlert('Login Error', se.message); setLoading(false); return; }
      const u = sd.user;
      await sendToBackend(u.email, u.user_metadata?.full_name || u.user_metadata?.name || '', u.user_metadata?.sub || u.id);
    } catch (e) {
      console.error('Supabase Google error:', e);
      showAlert('Error', e.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  // Path 2 (fallback): accessToken → Google UserInfo API → your backend
  const handleGoogleFallback = async (accessToken) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Shared: send verified user info to YOUR backend
  const sendToBackend = async (email, name, googleId) => {
    setLoading(true);
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
        await AsyncStorage.setItem('isOnboarded', String(data.isOnboarded));
        if (data.isOnboarded) {
          navigation.replace('LandingScreen');
        } else {
          // Bypassing RegisterName screen for all users
          navigation.replace('AddPetProfile');
        }
      } else {
        if (res.status === 403) {
          showAlert('Wrong App', data.message || 'You have a Partner account. Please use the Scoob Partner app.');
        } else if (data.error === 'Account Exists') {
          showAlert(
            'Account Exists',
            data.message || 'You already have an account. Please Login.'
          );
        } else if (data.error === 'No Account Found') {
          showAlert(
            'No Account Found',
            data.message || "We couldn't find an account. Please sign up."
          );
        } else {
          showAlert(data.error || 'Login Failed', data.message || 'Unknown error');
        }
      }
    } catch (error) {
      console.error('Backend auth error:', error);
      showAlert('Error', 'Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  // Apple Login
  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      // Supabase requires a nonce for Apple Sign-In to prevent replay attacks
      const rawNonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      const { identityToken, fullName, email } = credential;

      if (!identityToken) {
        throw new Error('No identityToken returned from Apple');
      }

      // Log into Supabase with the identity token AND the raw nonce
      const { data: sd, error: se } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
        nonce: rawNonce,
      });

      if (se) {
        showAlert('Apple Login Error', se.message);
        setLoading(false);
        return;
      }

      const u = sd.user;

      // Extract name from Apple payload if available, else from Supabase
      let name = '';
      if (fullName?.givenName || fullName?.familyName) {
        name = `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim();
      } else {
        name = u.user_metadata?.full_name || u.user_metadata?.name || '';
      }

      const userEmail = email || u.email;

      // Send to backend
      const res = await fetch(`${BASE_URL}/auth/apple-supabase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name,
          appleId: u.user_metadata?.sub || u.id,
          app: 'customer',
          type: selectedMode
        }),
      });

      const data = await res.json();
      if (data.success) {
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('userId', String(data.userId));
        await AsyncStorage.setItem('isOnboarded', String(data.isOnboarded));
        if (data.isOnboarded) {
          navigation.replace('LandingScreen');
        } else {
          // Bypassing RegisterName screen for all users
          navigation.replace('AddPetProfile');
        }
      } else {
        if (res.status === 403) {
          showAlert('Wrong App', data.message || 'You have a Partner account. Please use the Scoob Partner app.');
        } else if (data.error === 'Account Exists') {
          showAlert('Account Exists', data.message);
        } else if (data.error === 'No Account Found') {
          showAlert('No Account Found', data.message);
        } else {
          showAlert('Login Failed', data.error || 'Unknown error');
        }
      }
    } catch (e) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // user canceled
      } else {
        console.error('Apple Login error:', e);
        showAlert('Error', e.message || 'Apple sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderActionSection = () => {
    switch (authState) {
      case 'initial':
        return (
          <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%', paddingBottom: 60 }}>
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
          </View>
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
                <View style={styles.socialIconContainer}>
                  <MaterialCommunityIcons name="cellphone" size={22} color={theme.colors.textPrimary} />
                </View>
                <AppText style={styles.socialButtonText}>Continue with Phone</AppText>
              </AppButton>

              <AppButton
                style={styles.socialButton}
                onPress={handleGoogleSignIn}
              >
                <View style={styles.socialIconContainer}>
                  <MaterialCommunityIcons name="google" size={22} color={theme.colors.accent} />
                </View>
                <AppText style={styles.socialButtonText}>Continue with Google</AppText>
              </AppButton>

              <AppButton
                style={styles.socialButton}
                onPress={handleAppleLogin}
              >
                <View style={styles.socialIconContainer}>
                  <MaterialCommunityIcons name="apple" size={22} color="black" />
                </View>
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
      <AppScreen padding={false} safeAreaTop={true} scrollable={true} style={styles.container}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppText type="heading" weight="700" style={styles.welcomeText}>
                Welcome to{' '}
              </AppText>
              <AppText type="heading" weight="700" style={styles.brandText}>
                Scoobyz
              </AppText>
            </View>

            <AppText style={styles.tagline} weight="600">
              PET CARE PLATFORM
            </AppText>
          </View>

          <View style={[styles.actionContainer, authState === 'initial' && { flex: 1 }]}>
            <Animated.View style={[{ opacity: fadeAnim, width: '100%', alignItems: 'center' }, authState === 'initial' && { flex: 1 }]}>
              {renderActionSection()}
            </Animated.View>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <PawLoader fullScreen={false} />
              <AppText style={styles.loadingText}>Connecting...</AppText>
            </View>
          </View>
        )}

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
    flex: isSmallDevice ? 1 : 1.3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
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
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
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
    marginTop: Math.max(10, height * 0.02),
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
    marginTop: -30,
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
    paddingVertical: 12,
    paddingLeft: 45, // Left padding to push everything inward
    borderRadius: 24,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-start', // Aligns both icon and text to start from the same vertical line
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },

  socialIconContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15, // Fixed gap before the text starts
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
    fontSize: 16,

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
