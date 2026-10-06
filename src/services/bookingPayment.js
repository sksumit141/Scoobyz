import { Platform } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { api } from './api';

const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
  if (globalThis.Razorpay) {
    resolve(globalThis.Razorpay);
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(globalThis.Razorpay);
  script.onerror = () => reject(new Error('Razorpay Checkout failed to load'));
  document.body.appendChild(script);
});

const openCheckout = async (options) => {
  if (Platform.OS !== 'web') {
    return RazorpayCheckout.open(options);
  }

  const Razorpay = await loadRazorpayCheckout();
  return new Promise((resolve, reject) => {
    const checkout = new Razorpay({
      ...options,
      handler: resolve,
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    });
    checkout.on('payment.failed', response => {
      reject(new Error(response?.error?.description || 'Payment failed'));
    });
    checkout.open();
  });
};

const requireCheckoutKey = (order) => {
  if (!order?.keyId) {
    throw new Error('Payment gateway key is missing from the server response');
  }
  return order.keyId;
};

const requirePaymentVerification = (payment, serverOrderId) => {
  if (!serverOrderId || !payment?.razorpay_payment_id || !payment?.razorpay_signature) {
    throw new Error('Razorpay did not return complete payment verification details');
  }
  return {
    // Razorpay requires the order ID created by the server for signature verification.
    razorpay_order_id: serverOrderId,
    razorpay_payment_id: payment.razorpay_payment_id,
    razorpay_signature: payment.razorpay_signature,
  };
};

export const payDirectBooking = async ({ amount, description }) => {
  const order = await api.post('/payment/create-order-direct', { amount });
  const payment = await openCheckout({
    key: requireCheckoutKey(order),
    amount: order.amount,
    currency: order.currency || 'INR',
    order_id: order.orderId,
    name: 'Scoobyz',
    description,
    image: 'https://ik.imagekit.io/bjwb4bn8bn/scoobyz_logo.png',
    theme: { color: '#3d2a5e' },
  });
  const paymentVerification = requirePaymentVerification(payment, order.orderId);
  return {
    paymentReferenceId: paymentVerification.razorpay_payment_id,
    paymentVerification,
  };
};

export const payBookingBalance = async (booking) => {
  if (!booking?.id) throw new Error('Booking information is missing');

  const order = await api.post('/payment/create-order', { bookingId: booking.id });
  const payment = await openCheckout({
    key: requireCheckoutKey(order),
    amount: order.amount,
    currency: order.currency || 'INR',
    order_id: order.orderId,
    name: 'Scoobyz',
    description: `Remaining payment for booking #${booking.id}`,
    image: 'https://ik.imagekit.io/bjwb4bn8bn/scoobyz_logo.png',
    theme: { color: '#3d2a5e' },
  });

  const paymentVerification = requirePaymentVerification(payment, order.orderId);
  return api.post('/payment/verify-booking-payment', {
    bookingId: booking.id,
    ...paymentVerification,
  });
};
