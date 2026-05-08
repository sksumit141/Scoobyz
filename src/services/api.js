import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'https://scoooobys.onrender.com';
// export const BASE_URL = 'http://192.168.1.33:8000';

const DEV_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsImlhdCI6MTc3NjUzMjY4OSwiZXhwIjoxNzc5MTI0Njg5fQ.60CHG4cZc8yBKr1HdzyJhYHVZADjsn2MJKDFaPD-_xI';

const getHeaders = async () => {
    let token = await AsyncStorage.getItem('authToken');
    if (!token) {
        token = DEV_TOKEN;
    }
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const api = {
    // ── Generic Methods ──
    get: async (endpoint) => {
        const headers = await getHeaders();
        const res = await fetch(`${BASE_URL}${endpoint}`, { headers });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Request failed' }));
            const error = new Error(err.message || err.error || `HTTP ${res.status}`);
            error.data = err;
            throw error;
        }
        return res.json();
    },

    post: async (endpoint, body) => {
        const headers = await getHeaders();
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Request failed' }));
            const error = new Error(err.message || err.error || `HTTP ${res.status}`);
            error.data = err;
            throw error;
        }
        return res.json();
    },

    put: async (endpoint, body) => {
        const headers = await getHeaders();
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json();
    },

    patch: async (endpoint, body) => {
        const headers = await getHeaders();
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json();
    },

    delete: async (endpoint) => {
        const headers = await getHeaders();
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json();
    },

    upload: async (endpoint, formData, method = 'POST') => {
        let token = await AsyncStorage.getItem('authToken');
        if (!token) {
            token = DEV_TOKEN;
        }
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: method,
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                // No Content-Type header — let browser set multipart boundary
            },
            body: formData,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json();
    },
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

// ── Discovery ──
export const discoverApi = {
    groomers: (params) => api.get(`/discover/groomers${params ? '?' + new URLSearchParams(params) : ''}`),
    groomerDetail: (id) => api.get(`/discover/groomers/${id}`),
    groomerPackages: (id) => api.get(`/discover/groomers/${id}/packages`),
    groomerSlots: (id, date) => api.get(`/discover/groomers/${id}/slots?date=${date}`),
    boarding: (params) => api.get(`/discover/boarding${params ? '?' + new URLSearchParams(params) : ''}`),
    boardingDetail: (id) => api.get(`/discover/boarding/${id}`),
    walkers: (params) => api.get(`/discover/walkers${params ? '?' + new URLSearchParams(params) : ''}`),
    walkerDetail: (id) => api.get(`/discover/walkers/${id}`),
    companies: () => api.get('/discover/companies'),
    byService: (serviceName, params) => api.get(`/discover/by-service/${encodeURIComponent(serviceName)}${params ? '?' + new URLSearchParams(params) : ''}`),
};

// ── Bookings ──
export const bookingsApi = {
    createGrooming: (data) => api.post('/customer/bookings/grooming', data),
    createBoarding: (data) => api.post('/customer/bookings/boarding', data),
    createWalking: (data) => api.post('/customer/bookings/walking', data),
    createVeterinary: (data) => api.post('/customer/bookings/veterinary', data),
    getWalkingQuote: (data) => api.post('/customer/bookings/walking-quote', data),
    list: (params) => api.get(`/customer/bookings${params ? '?' + new URLSearchParams(params) : ''}`),
    get: (id) => api.get(`/customer/bookings/${id}`),
    getStatus: (id) => api.get(`/customer/bookings/${id}/status`),
    cancel: (id, data) => api.put(`/customer/bookings/${id}/cancel`, data),
    submitReview: (id, data) => api.post(`/customer/bookings/${id}/review`, data),
    payRemaining: (id, data) => api.post(`/customer/bookings/${id}/pay-remaining`, data),
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
    submit: (data) => api.post('/customer/reviews', data),
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
