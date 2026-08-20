import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import { DiscountProvider } from './src/contexts/DiscountContext';
import { LoadingProvider } from './src/contexts/LoadingContext';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import {
  Newsreader_400Regular,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
  Newsreader_700Bold
} from '@expo-google-fonts/newsreader';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold
} from '@expo-google-fonts/manrope';

import WelcomeScreen from './src/screens/WelcomeScreen';
import SplashScreenComp from './src/screens/SplashScreen';
import RegisterNameScreen from './src/screens/RegisterNameScreen';
import PhoneLoginScreen from './src/screens/PhoneLoginScreen';
import OtpScreen from './src/screens/OtpScreen';
import AddPetProfileScreen from './src/screens/AddPetProfileScreen';
import LandingScreen from './src/screens/LandingScreen';
import MenuScreen from './src/screens/MenuScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import SlotSelectScreen from './src/screens/SlotSelectScreen';
import SelectGroomerScreen from './src/screens/SelectGroomerScreen';
import SelectCompanyScreen from './src/screens/SelectCompanyScreen';
import ExplorePackagesScreen from './src/screens/ExplorePackagesScreen';
import GroomingPackagesScreen from './src/screens/GroomingPackagesScreen';
import ExpertProfileScreen from './src/screens/ExpertProfileScreen';
import BookingConfirmedScreen from './src/screens/BookingConfirmedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import MyBookingsScreen from './src/screens/MyBookingsScreen';
import BookingCardDetailsScreen from './src/screens/BookingCardDetailsScreen';
import BookingCancelledStatusScreen from './src/screens/BookingCancelledStatusScreen';
import BookingRescheduledStatusScreen from './src/screens/BookingRescheduledStatusScreen';
import AddressBookScreen from './src/screens/AddressBookScreen';
import BookingStatusOverlay from './src/components/BookingStatusOverlay';
import CartBanner from './src/components/CartBanner';
import { CartProvider } from './src/contexts/CartContext';
import { registerAndSendPushToken } from './src/components/PushNotificationManager';

import BoardingServiceScreen from './src/screens/BoardingServiceScreen';
import BoardingLocationScreen from './src/screens/BoardingLocationScreen';
import BoardingMealSetupScreen from './src/screens/BoardingMealSetupScreen';
import BoardingConfirmedScreen from './src/screens/BoardingConfirmedScreen';

import WalkingServiceScreen from './src/screens/WalkingServiceScreen';
import WalkingWalkerListScreen from './src/screens/WalkingWalkerListScreen';
import WalkingConfirmedScreen from './src/screens/WalkingConfirmedScreen';

import VetServiceScreen from './src/screens/VetServiceScreen';
import VetListScreen from './src/screens/VetListScreen';
import VetConfirmedScreen from './src/screens/VetConfirmedScreen';

import HelpSupportScreen from './src/screens/HelpSupportScreen';
import SupportChatScreen from './src/screens/SupportChatScreen';
import ChatScreen from './src/screens/ChatScreen';
import TermsConditionsScreen from './src/screens/TermsConditionsScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';

import ArticlesScreen from './src/screens/ArticlesScreen';
import ArticleDetailScreen from './src/screens/ArticleDetailScreen';
import RatingReviewScreen from './src/screens/RatingReviewScreen';
import ViewSubmittedReviewScreen from './src/screens/ViewSubmittedReviewScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import VideoCallScreen from './src/screens/VideoCallScreen';
import BookVendorScreen from './src/screens/BookVendorScreen';
import ReviewDetailsScreen from './src/screens/ReviewDetailsScreen';
import BookingPendingScreen from './src/screens/BookingPendingScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';

import { theme } from './src/styles/theme';

import PushNotificationManager from './src/components/PushNotificationManager';

const Stack = createNativeStackNavigator();

// Keep the splash screen visible while we fetch resources 
SplashScreen.preventAutoHideAsync();

export const navigationRef = createNavigationContainerRef();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Welcome');
  const [currentRoute, setCurrentRoute] = useState();

  useEffect(() => {
    async function prepare() {
      try {
        // Minimum wait for branding
        const delay = new Promise(resolve => setTimeout(resolve, 2500));

        // Load fonts
        const fontLoading = Font.loadAsync({
          'Newsreader': Newsreader_400Regular,
          'Newsreader-Medium': Newsreader_500Medium,
          'Newsreader-SemiBold': Newsreader_600SemiBold,
          'Newsreader-Bold': Newsreader_700Bold,
          'Manrope': Manrope_400Regular,
          'Manrope-Medium': Manrope_500Medium,
          'Manrope-SemiBold': Manrope_600SemiBold,
          'Manrope-Bold': Manrope_700Bold,
        });

        const authCheck = (async () => {
          try {
            const token = await AsyncStorage.getItem('authToken');
            const isOnboarded = await AsyncStorage.getItem('isOnboarded');
            
            if (token) {
              if (isOnboarded === 'true') {
                setInitialRoute('LandingScreen');
                registerAndSendPushToken().catch(console.error);
              } else {
                // Stale token from partial onboarding or backup restore. Clear it and start fresh.
                await AsyncStorage.removeItem('authToken');
                setInitialRoute('Welcome');
              }
            }
          } catch (e) {
            console.error('Auth check error:', e);
          }
        })();

        await Promise.all([delay, fontLoading, authCheck]);
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return <SplashScreenComp />;
  }

  return (
    <LoadingProvider>
    <CartProvider>
      <DiscountProvider>
        <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <SafeAreaProvider>
          <NavigationContainer 
            ref={navigationRef}
            onReady={() => {
              setCurrentRoute(navigationRef.getCurrentRoute()?.name);
            }}
            onStateChange={() => {
              setCurrentRoute(navigationRef.getCurrentRoute()?.name);
            }}
          >
            <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
            <Stack.Screen name="OtpScreen" component={OtpScreen} />
            <Stack.Screen name="RegisterName" component={RegisterNameScreen} />
            <Stack.Screen name="AddPetProfile" component={AddPetProfileScreen} />
            <Stack.Screen name="LandingScreen" component={LandingScreen} />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="Explore" component={ExploreScreen} />
            
            {/* Drawer Screens restored to Stack for proper back-button behavior */}
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
            <Stack.Screen name="AddressBook" component={AddressBookScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Help" component={HelpSupportScreen} />
            <Stack.Screen name="SupportChat" component={SupportChatScreen} />
            <Stack.Screen name="Terms" component={TermsConditionsScreen} />
            <Stack.Screen name="Privacy" component={PrivacyPolicyScreen} />

            <Stack.Screen name="SlotSelect" component={SlotSelectScreen} />
            <Stack.Screen name="SelectGroomer" component={SelectGroomerScreen} />
            <Stack.Screen name="SelectCompany" component={SelectCompanyScreen} />
            <Stack.Screen name="ExplorePackages" component={ExplorePackagesScreen} />
            <Stack.Screen name="GroomingPackages" component={GroomingPackagesScreen} />
            <Stack.Screen name="ExpertProfile" component={ExpertProfileScreen} />
            <Stack.Screen name="ReviewDetails" component={ReviewDetailsScreen} />
            <Stack.Screen name="BookingConfirmed" component={BookingConfirmedScreen} />
            <Stack.Screen name="BookingCardDetails" component={BookingCardDetailsScreen} />
            <Stack.Screen name="BookingCancelledStatus" component={BookingCancelledStatusScreen} />
            <Stack.Screen name="BookingRescheduledStatus" component={BookingRescheduledStatusScreen} />

            {/* Dog Boarding Flow */}
            <Stack.Screen name="BoardingService" component={BoardingServiceScreen} />
            <Stack.Screen name="BoardingLocation" component={BoardingLocationScreen} />
            <Stack.Screen name="BoardingMealSetup" component={BoardingMealSetupScreen} />
            <Stack.Screen name="BoardingConfirmed" component={BoardingConfirmedScreen} />

            {/* Dog Walking Flow */}
            <Stack.Screen name="WalkingService" component={WalkingServiceScreen} />
            <Stack.Screen name="WalkingWalkerList" component={WalkingWalkerListScreen} />
            <Stack.Screen name="WalkingConfirmed" component={WalkingConfirmedScreen} />

            {/* Veterinary Flow */}
            <Stack.Screen name="VetService" component={VetServiceScreen} />
            <Stack.Screen name="VetList" component={VetListScreen} />
            <Stack.Screen name="VetConfirmed" component={VetConfirmedScreen} />

            {/* Support & Chat */}
            <Stack.Screen name="Contact" component={ChatScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />

            {/* Articles */}
            <Stack.Screen name="Articles" component={ArticlesScreen} />
            <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />

            {/* Reviews */}
            <Stack.Screen name="RatingReview" component={RatingReviewScreen} />
            <Stack.Screen name="ViewSubmittedReview" component={ViewSubmittedReviewScreen} />

            {/* Tracking */}
            <Stack.Screen name="TrackingScreen" component={TrackingScreen} />
            <Stack.Screen name="VideoCall" component={VideoCallScreen} />

            {/* New Booking Request Flow */}
            <Stack.Screen name="BookVendor" component={BookVendorScreen} />
            <Stack.Screen name="BookingPending" component={BookingPendingScreen} />
          </Stack.Navigator>
          
          {/* Global Banners */}
          {currentRoute === 'LandingScreen' && (
            <CartBanner />
          )}

        </NavigationContainer>
        <BookingStatusOverlay />
        <PushNotificationManager />
        <Toast />
        </SafeAreaProvider>
      </GestureHandlerRootView>
      </DiscountProvider>
    </CartProvider>
    </LoadingProvider>
  );
}
