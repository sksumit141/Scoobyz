import AsyncStorage from '@react-native-async-storage/async-storage';
import { appendImageToFormData } from '../utils/formDataFile';
import { navigationRef } from '../utils/navigationRef';

export const BASE_URL = 'https://scoobyz-backend.onrender.com';
// export const BASE_URL = 'http://192.168.1.33:8000';
//https://scoobyz-backend.onrender.com
const getHeaders = async () => {
    let token = await AsyncStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const throwApiError = async (res, fallbackMessage = 'Request failed') => {
    const details = await res.json().catch(() => ({ error: fallbackMessage }));
    const message = details.message || details.error || `HTTP ${res.status}`;
    const isExpiredSession = res.status === 401
        && ['Invalid or expired token', 'No token provided'].includes(message);

    if (isExpiredSession) {
        await AsyncStorage.multiRemove(['authToken', 'userId', 'isOnboarded']);
        if (navigationRef.isReady()) {
            navigationRef.resetRoot({ index: 0, routes: [{ name: 'Welcome' }] });
        }
    }

    const error = new Error(isExpiredSession ? 'Your session has expired. Please sign in again.' : message);
    error.status = res.status;
    error.data = details;
    if (isExpiredSession) error.code = 'SESSION_EXPIRED';
    throw error;
};

const buildQuery = (params) => {
    if (!params) return '';
    const parts = [];
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null) {
            parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
        }
    }
    return parts.length > 0 ? '?' + parts.join('&') : '';
};

export const api = {
    // ── Generic Methods ──
    get: async (endpoint) => {
        const headers = await getHeaders();
        const res = await fetch(`${BASE_URL}${endpoint}`, { headers });
        if (!res.ok) await throwApiError(res);
        return res.json();
    },

    post: async (endpoint, body) => {
        const headers = await getHeaders();
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        if (!res.ok) await throwApiError(res);
        return res.json();
    },

    put: async (endpoint, body) => {
        const headers = await getHeaders();
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body),
        });
        if (!res.ok) await throwApiError(res);
        return res.json();
    },

    patch: async (endpoint, body) => {
        const headers = await getHeaders();
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) await throwApiError(res);
        return res.json();
    },

    delete: async (endpoint) => {
        const headers = await getHeaders();
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers,
        });
        if (!res.ok) await throwApiError(res);
        return res.json();
    },

    upload: async (endpoint, formData, method = 'POST') => {
        let token = await AsyncStorage.getItem('authToken');

        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: method,
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                // No Content-Type header — let browser set multipart boundary
            },
            body: formData,
        });
        if (!res.ok) await throwApiError(res, 'Upload failed');
        return res.json();
    },
};

export const appVersionApi = {
    getPolicy: () => api.get('/api/public/app-version'),
};

// ══════════════════════════════════════
//  Convenience wrappers per domain
// ══════════════════════════════════════

// ── Auth ──
export const authApi = {
    sendOtp: (phoneNumber, type) => api.post('/auth/send-otp', { phoneNumber, type, app: 'customer' }),
    verifyOtp: (phoneNumber, code) => api.post('/auth/verify-otp', { phoneNumber, code, app: 'customer' }),
};

// ── Customer Profile ──
export const customerApi = {
    getProfile: () => api.get('/customer/profile'),
    updateProfile: (data) => api.put('/customer/profile', data),
    uploadPhoto: (formData) => api.upload('/customer/profile/photo', formData),
};

// ── Pets ──
export const petsApi = {
    list: () => api.get('/customer/pets'),
    get: (id) => api.get(`/customer/pets/${id}`),
    create: (formData) => api.upload('/customer/pets', formData),
    update: (id, formData) => api.upload(`/customer/pets/${id}`, formData, 'PUT'),
    delete: (id) => api.delete(`/customer/pets/${id}`),
};

// ── Addresses ──
export const addressApi = {
    list: () => api.get('/customer/address'),
    create: (data) => api.post('/customer/address', data),
    update: (id, data) => api.put(`/customer/address/${id}`, data),
    delete: (id) => api.delete(`/customer/address/${id}`),
};

// Google Places and Geocoding are proxied by the backend so the server key is
// never embedded in JavaScript or sent to third-party browser proxies.
export const mapsApi = {
    reverseGeocode: (lat, lng) => api.get(`/api/maps/reverse-geocode${buildQuery({ lat, lng })}`),
    autocomplete: (input) => api.get(`/api/maps/places/autocomplete${buildQuery({ input })}`),
    placeDetails: (placeId) => api.get(`/api/maps/places/details${buildQuery({ placeId })}`),
};

// ── Discovery ──
export const discoverApi = {
    groomers: (params) => api.get(`/discover/groomers${buildQuery(params)}`),
    groomerDetail: (id) => api.get(`/discover/groomers/${id}`),
    groomerPackages: (id) => api.get(`/discover/groomers/${id}/packages`),
    groomerSlots: (id, date) => api.get(`/discover/groomers/${id}/slots?date=${date}`),
    boarding: (params) => api.get(`/discover/boarding${buildQuery(params)}`),
    boardingDetail: (id) => api.get(`/discover/boarding/${id}`),
    walkers: (params) => api.get(`/discover/walkers${buildQuery(params)}`),
    walkerDetail: (id) => api.get(`/discover/walkers/${id}`),
    companies: () => api.get('/discover/companies'),
    byService: (serviceName, params) => api.get(`/discover/by-service/${encodeURIComponent(serviceName)}${buildQuery(params)}`),
    scoobyzPackages: () => api.get('/discover/scoobyz/packages'),
    walkingPackages: () => api.get('/discover/walking/packages'),
    landingBanners: () => api.get('/discover/landing-banners'),
};

// ── Bookings ──
export const bookingsApi = {
    createGrooming: (data) => api.post('/customer/bookings/grooming', data),
    createBoarding: (data) => api.post('/customer/bookings/boarding', data),
    createWalking: (data) => api.post('/customer/bookings/walking', data),
    createVeterinary: (data) => api.post('/customer/bookings/veterinary', data),
    getWalkingQuote: (data) => api.post('/customer/bookings/walking-quote', data),
    list: (params) => api.get(`/customer/bookings${buildQuery(params)}`),
    get: (id) => api.get(`/customer/bookings/${id}`),
    getStatus: (id) => api.get(`/customer/bookings/${id}/status`),
    cancel: (id, data) => api.put(`/customer/bookings/${id}/cancel`, data),
    reschedule: (id, data) => api.put(`/customer/bookings/${id}/reschedule`, data),
    submitReview: (id, data) => api.post(`/customer/bookings/${id}/review`, data),
};

// ── Boarding Meals ──
export const mealsApi = {
    create: (data) => api.post('/customer/meals', data),
    list: (bookingId) => api.get(`/customer/meals/${bookingId}`),
    update: (id, data) => api.put(`/customer/meals/${id}`, data),
    delete: (id) => api.delete(`/customer/meals/${id}`),
};

// ── Reviews ──
export const reviewsApi = {
    // Plain JSON submit (no photo)
    submit: (data) => api.post('/customer/reviews', data),

    // Multipart submit — supports optional photo attachment
    // data: { bookingId, rating, comment?, photoUri? }
    submitWithPhoto: async ({ bookingId, rating, comment, photoUri }) => {
        const formData = new FormData();
        formData.append('bookingId', String(bookingId));
        formData.append('rating', String(rating));
        if (comment) formData.append('comment', comment);
        if (photoUri) {
            await appendImageToFormData(formData, 'photo', photoUri, {
                fallbackName: `review_${Date.now()}.jpg`,
            });
        }
        return api.upload('/customer/reviews', formData);
    },

    // Get review for a specific booking
    getByBookingId: (bookingId) => api.get(`/customer/reviews/booking/${bookingId}`),

    // TEST ONLY: Delete a review to re-test
    deleteForTesting: (bookingId) => api.delete(`/customer/reviews/${bookingId}`),

    forVendor: (vendorId) => api.get(`/customer/reviews/vendor/${vendorId}`),
};

// ── Chat ──
export const chatApi = {
    getMessages: (bookingId) => api.get(`/api/chat/${bookingId}`),
    sendMessage: (bookingId, text) => api.post(`/api/chat/${bookingId}`, { text }),
};

// ── Notifications ──
export const getNotifications = () => api.get('/api/notifications');
export const markAsRead = (id) => api.post(`/api/notifications/${id}/read`);
export const markAllAsRead = () => api.post('/api/notifications/read-all');

// ── Articles ──
export const articlesApi = {
    list: () => api.get('/articles'),
};
