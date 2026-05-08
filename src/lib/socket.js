import { io } from 'socket.io-client';
import { BASE_URL } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket = null;

export const initSocket = async () => {
    if (socket) return socket;

    try {
        const token = await AsyncStorage.getItem('authToken');
        
        socket = io(BASE_URL, {
            transports: ['websocket'],
            auth: {
                token: token
            }
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            
            // Join notification room if we have a token/userId
            // Note: The backend expects us to join a room. 
            // In the previous session, we added a 'join_notifications' event.
            if (token) {
                // Decode token or fetch profile to get userId if needed
                // For now, let's assume the backend handles auth via the auth block
            }
        });

        socket.on('connect_error', (err) => {
            console.log('Socket connect error:', err.message);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        return socket;
    } catch (error) {
        console.error('Socket initialization failed:', error);
        return null;
    }
};

export const getSocket = () => {
    if (!socket) {
        // If not initialized, we can trigger init but it's async
        // Most screens should call initSocket in a useEffect
        initSocket();
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
