import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

const isConfigured = Constants.expoConfig?.extra?.metaSdkConfigured === true;
let sdk;

function getSdk() {
  if (!isConfigured) return null;

  try {
    sdk ||= require('react-native-fbsdk-next');
    return sdk;
  } catch (error) {
    console.warn('[Meta SDK] Native module is unavailable in this build.', error?.message);
    return null;
  }
}

export async function initializeMetaSdk() {
  const meta = getSdk();
  if (!meta) return false;

  try {
    let trackingStatus;
    if (Platform.OS === 'ios') {
      ({ status: trackingStatus } = await requestTrackingPermissionsAsync());
    }

    meta.Settings.initializeSDK();

    if (Platform.OS === 'ios') {
      await meta.Settings.setAdvertiserTrackingEnabled(trackingStatus === 'granted');
    }

    return true;
  } catch (error) {
    console.warn('[Meta SDK] Initialization failed.', error?.message);
    return false;
  }
}

async function logOnce(key, logEvent) {
  const meta = getSdk();
  if (!meta) return;

  const storageKey = `meta_event:${key}`;
  if (await AsyncStorage.getItem(storageKey)) return;

  logEvent(meta.AppEventsLogger);
  await AsyncStorage.setItem(storageKey, 'true');
}

export function logCompletedRegistration({ method, userId }) {
  return logOnce(`registration:${userId}`, logger => {
    logger.logEvent(logger.AppEvents.CompletedRegistration, {
      [logger.AppEventParams.RegistrationMethod]: method,
    });
  });
}

function getContentParameters(logger, { contentId, contentType = 'service', currency = 'INR' }) {
  return {
    [logger.AppEventParams.ContentID]: String(contentId || 'unknown'),
    [logger.AppEventParams.ContentType]: contentType,
    [logger.AppEventParams.Currency]: currency,
  };
}

export function logContact({ userId, channel = 'support_chat' }) {
  return logOnce(`contact:${channel}:${userId || 'anonymous'}`, logger => {
    logger.logEvent(logger.AppEvents.Contact, { contact_channel: channel });
  });
}

export function logViewContent({ contentId, contentType = 'service', amount = 0 }) {
  const meta = getSdk();
  if (!meta) return;

  const logger = meta.AppEventsLogger;
  logger.logEvent(
    logger.AppEvents.ViewedContent,
    Number(amount) || 0,
    getContentParameters(logger, { contentId, contentType })
  );
}

export function logBookingStarted({ contentId, contentType = 'service', amount }) {
  const meta = getSdk();
  if (!meta) return;

  const logger = meta.AppEventsLogger;
  logger.logEvent(
    logger.AppEvents.InitiatedCheckout,
    Number(amount) || 0,
    getContentParameters(logger, { contentId, contentType })
  );
}

export function logSchedule({ bookingId, contentId, contentType = 'service', amount }) {
  return logOnce(`schedule:${bookingId}`, logger => {
    logger.logEvent(
      logger.AppEvents.Schedule,
      Number(amount) || 0,
      {
        ...getContentParameters(logger, { contentId, contentType }),
        booking_id: String(bookingId),
      }
    );
  });
}

export function logBookingCompleted({ bookingId, serviceType, amount }) {
  return logOnce(`booking_completed:${bookingId}`, logger => {
    logger.logEvent(
      'BookingCompleted',
      Number(amount) || 0,
      {
        booking_id: String(bookingId),
        service_type: serviceType || 'unknown',
        fb_currency: 'INR',
      }
    );
  });
}

export function logPurchase({ bookingId, contentId, contentType = 'service', amount }) {
  return logOnce(`purchase:${bookingId}`, logger => {
    logger.logPurchase(Number(amount) || 0, 'INR', {
      ...getContentParameters(logger, { contentId, contentType }),
      booking_id: String(bookingId),
    });
  });
}
