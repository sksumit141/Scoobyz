import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './api';

export const socket = io(BASE_URL, {
    autoConnect: false,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    auth: {},
});

let connectedToken = null;
let connectionPromise = null;

export const connectTrackingSocket = async () => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return false;
    if (socket.connected && connectedToken !== token) socket.disconnect();
    socket.auth = { token };
    if (socket.connected) return true;
    if (connectionPromise) return connectionPromise;

    connectionPromise = new Promise(resolve => {
        const finish = value => {
            connectionPromise = null;
            resolve(value);
        };
        const timer = setTimeout(() => {
            socket.off('connect', onConnect);
            finish(false);
        }, 8000);
        const onConnect = () => {
            clearTimeout(timer);
            connectedToken = token;
            finish(true);
        };
        socket.once('connect', onConnect);
        socket.connect();
    });
    return connectionPromise;
};

socket.on('connect', () => console.log('Customer tracking socket connected:', socket.id));
socket.on('disconnect', reason => {
    connectedToken = null;
    console.log('Customer tracking socket disconnected:', reason);
});
socket.on('connect_error', error => console.warn('Customer tracking socket error:', error.message));

export default socket;
