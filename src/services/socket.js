import io from 'socket.io-client';
import { BASE_URL } from './api';

// Exporting as a singleton instance
export const socket = io(BASE_URL, {
    autoConnect: true,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
});

export default socket;
