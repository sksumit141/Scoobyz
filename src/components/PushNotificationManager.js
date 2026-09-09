import { useEffect, useRef } from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { navigateFromCustomerNotification } from '../utils/notificationNavigation';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://scoobyz-backend.onrender.com';
const CHANNELS = [
  ['default', 'General', Notifications.AndroidImportance.DEFAULT],
  ['bookings', 'Bookings', Notifications.AndroidImportance.MAX],
  ['messages', 'Messages', Notifications.AndroidImportance.HIGH],
  ['payments', 'Payments and refunds', Notifications.AndroidImportance.HIGH],
  ['account', 'Account', Notifications.AndroidImportance.DEFAULT],
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const createAndroidChannels = async () => {
  if (Platform.OS !== 'android') return;
  await Promise.all(CHANNELS.map(([id, name, importance]) =>
    Notifications.setNotificationChannelAsync(id, {
      name,
      importance,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4A6B4B',
      sound: 'default',
    })
  ));
};

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web' || !Device.isDevice) return null;
  await createAndroidChannels();

  const existingPermission = await Notifications.getPermissionsAsync();
  const permission = existingPermission.status === 'granted'
    ? existingPermission
    : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return null;

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  return (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
}

export async function registerAndSendPushToken() {
  try {
    const [pushToken, authToken] = await Promise.all([
      registerForPushNotificationsAsync(),
      AsyncStorage.getItem('authToken'),
    ]);
    if (!pushToken || !authToken) return false;

    const response = await fetch(`${API_URL}/api/notifications/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ pushToken, app: 'customer', platform: Platform.OS }),
    });
    if (!response.ok) throw new Error(`Push token registration failed (${response.status})`);
    await AsyncStorage.setItem('expoPushToken', pushToken);
    return true;
  } catch (error) {
    console.error('Failed to register customer push token:', error);
    return false;
  }
}

export async function unregisterPushToken() {
  const [authToken, pushToken] = await Promise.all([
    AsyncStorage.getItem('authToken'),
    AsyncStorage.getItem('expoPushToken'),
  ]);
  if (!authToken) return;

  try {
    await fetch(`${API_URL}/api/notifications/push-token/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ pushToken }),
    });
  } catch (error) {
    console.warn('Failed to unregister customer push token:', error);
  } finally {
    await AsyncStorage.removeItem('expoPushToken');
  }
}

const markNotificationRead = async (notificationId) => {
  if (!notificationId) return;
  try {
    const authToken = await AsyncStorage.getItem('authToken');
    if (!authToken) return;
    await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
  } catch (error) {
    console.warn('Failed to mark customer notification as read:', error);
  }
};

export default function PushNotificationManager() {
  const lastResponseId = useRef(null);

  useEffect(() => {
    registerAndSendPushToken();

    const handleResponse = (response, retryCount = 0) => {
      const request = response?.notification?.request;
      const responseId = request?.identifier;
      if (responseId && lastResponseId.current === responseId) return;

      const data = request?.content?.data || {};
      if (!navigateFromCustomerNotification(data) && retryCount < 10) {
        setTimeout(() => handleResponse(response, retryCount + 1), 300);
        return;
      }

      lastResponseId.current = responseId;
      markNotificationRead(data.notificationId);
      Notifications.setBadgeCountAsync(0).catch(() => {});
    };

    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      const type = notification.request.content.data?.type;
      DeviceEventEmitter.emit('refresh_notifications');
      if (String(type || '').startsWith('booking_') || type === 'payment') {
        DeviceEventEmitter.emit('refresh_customer_bookings');
      }
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) handleResponse(response);
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return null;
}
