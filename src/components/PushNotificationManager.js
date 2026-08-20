import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { navigationRef } from '../../App';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return;
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Expo project ID needed for EAS builds
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    
    try {
      if (projectId) {
         token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      } else {
         token = (await Notifications.getExpoPushTokenAsync()).data;
      }
      console.log('Expo Push Token:', token);
    } catch (e) {
      console.error('Error getting expo push token', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export async function registerAndSendPushToken() {
  try {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      const authToken = await AsyncStorage.getItem('authToken');
      if (authToken) {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://scoobyz-backend.onrender.com';
        await fetch(`${API_URL}/api/notifications/push-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ pushToken: token })
        });
        console.log('Push token sent to backend after login');
      }
    }
  } catch (e) {
    console.error('Error sending push token:', e);
  }
}

export async function sendLocalWelcomeNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Hi 👋",
      body: "How are you?",
    },
    trigger: null,
  });
}

export default function PushNotificationManager() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerAndSendPushToken();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      const data = response?.notification?.request?.content?.data;
      if (data && data.actionUrl && navigationRef.isReady()) {
        try {
          navigationRef.navigate(data.actionUrl, data.params || {});
        } catch (err) {
          console.error('Failed to navigate from push notification:', err);
        }
      } else {
        // Fallback or default behavior, e.g., open notifications tab
        if (navigationRef.isReady()) {
          navigationRef.navigate('Notifications');
        }
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return null;
}
