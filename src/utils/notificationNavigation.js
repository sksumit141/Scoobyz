import { navigationRef } from './navigationRef';

const getBookingId = (data = {}) => {
  const fromData = Number(data.bookingId);
  if (Number.isFinite(fromData) && fromData > 0) return fromData;

  const match = String(data.actionUrl || '').match(/\/(?:booking|chat)\/(\d+)/);
  return match ? Number(match[1]) : null;
};

export const navigateFromCustomerNotification = (data = {}) => {
  if (!navigationRef.isReady()) return false;

  const type = data.type;
  const bookingId = getBookingId(data);
  const openPayment = data.openPayment === true || data.openPayment === 'true';

  if (type === 'chat_message' && bookingId) {
    navigationRef.navigate('Chat', { bookingId });
  } else if (type === 'support_message') {
    navigationRef.navigate('SupportChat');
  } else if (bookingId) {
    navigationRef.navigate('MyBookings', { bookingId, openPayment });
  } else {
    navigationRef.navigate('Notifications');
  }

  return true;
};
