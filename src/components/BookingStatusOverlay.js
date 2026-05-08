import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from './AppText';
import { theme } from '../styles/theme';
import api from '../services/api';

const { width } = Dimensions.get('window');

const BookingStatusOverlay = () => {
    const [notifications, setNotifications] = useState([]);
    const [current, setCurrent] = useState(null);

    useEffect(() => {
        const interval = setInterval(fetchUpdates, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchUpdates = async () => {
        try {
            // Use the centralized api service which handles tokens and BASE_URL
            const data = await api.get('/api/notifications'); 
            
            if (data && data.length > 0) {
                setNotifications(data);
                if (!current) setCurrent(data[0]);
            }
        } catch (err) {
            // Silent retry
        }
    };

    const handleDismiss = async () => {
        if (!current) return;
        try {
            await api.patch(`/api/notifications/${current.id}/read`);
            setNotifications(prev => prev.filter(n => n.id !== current.id));
            setCurrent(null);
        } catch (err) {
            console.error("Dismiss err:", err);
        }
    };

    if (!current) return null;

    const isConfirmed = current.title.toLowerCase().includes('confirmed');
    const isDeclined = current.title.toLowerCase().includes('declined');

    return (
        <Modal transparent visible={!!current} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={[styles.statusLine, { backgroundColor: isDeclined ? '#D32F2F' : isConfirmed ? '#2E7D32' : theme.colors.primaryDark }]} />
                    
                    <View style={styles.content}>
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons 
                                name={isDeclined ? "close-circle" : isConfirmed ? "check-circle" : "bell"} 
                                size={40} 
                                color={isDeclined ? '#D32F2F' : isConfirmed ? '#2E7D32' : theme.colors.primaryDark} 
                            />
                        </View>
                        
                        <AppText style={styles.title} weight="bold">{current.title}</AppText>
                        <AppText style={styles.message}>{current.message}</AppText>
                        
                        <TouchableOpacity style={styles.btn} onPress={handleDismiss}>
                            <AppText style={{ color: '#FFF' }} weight="bold">Okay, Got it!</AppText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 25
    },
    card: {
        backgroundColor: '#FFF', borderRadius: 24, width: '100%', overflow: 'hidden', elevation: 20
    },
    statusLine: { height: 6, width: '100%' },
    content: { padding: 30, alignItems: 'center' },
    iconCircle: { marginBottom: 20 },
    title: { fontSize: 22, color: theme.colors.textBlack, marginBottom: 10, textAlign: 'center' },
    message: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
    btn: { backgroundColor: theme.colors.primaryDark, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 20, width: '100%', alignItems: 'center' }
});

export default BookingStatusOverlay;
