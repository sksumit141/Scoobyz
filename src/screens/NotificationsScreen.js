import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';
import { getNotifications, markAsRead, markAllAsRead } from '../services/api';
import { getSocket } from '../lib/socket';

const { width } = Dimensions.get('window');

const NotificationItem = ({ item, onPress }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    const getIcon = () => {
        switch (item.type) {
            case 'booking_request': return { name: 'calendar', color: '#4F46E5', bg: '#EEF2FF' };
            case 'booking_update': return { name: 'notifications', color: '#10B981', bg: '#ECFDF5' };
            case 'payment': return { name: 'wallet', color: '#F59E0B', bg: '#FFFBEB' };
            case 'system': return { name: 'settings-outline', color: '#6366F1', bg: '#F5F3FF' };
            default: return { name: 'information-circle', color: '#6B7280', bg: '#F9FAFB' };
        }
    };

    const icon = getIcon();

    return (
        <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
                style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
                onPress={() => onPress(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
                    <Ionicons name={icon.name} size={22} color={icon.color} />
                </View>
                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                    </View>
                    <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                </View>
                {!item.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        </Animated.View>
    );
};

// Wrapper for NotificationItem to use useRef
const NotificationItemWrapper = (props) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

    return <NotificationItem {...props} fadeAnim={fadeAnim} />;
};

// Redefining NotificationItem to be cleaner
const PureNotificationItem = ({ item, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
            onPress={() => onPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                </View>
                <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );
};

const NotificationsScreen = () => {
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Fetch notifications error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const socket = getSocket();
        if (socket) {
            socket.on('new_notification', (newNotif) => {
                setNotifications(prev => [newNotif, ...prev]);
            });
        }

        return () => {
            if (socket) socket.off('new_notification');
        };
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleNotificationPress = async (item) => {
        if (!item.isRead) {
            try {
                await markAsRead(item.id);
                setNotifications(prev =>
                    prev.map(n => n.id === item.id ? { ...n, isRead: true } : n)
                );
            } catch (err) {
                console.error('Mark read error:', err);
            }
        }

        if (item.actionUrl) {
            // Check if it's a deep link for the app
            if (item.actionUrl.startsWith('scoobyz://')) {
                const route = item.actionUrl.replace('scoobyz://', '');
                if (route.startsWith('booking/')) {
                    const bookingId = route.split('/')[1];
                    navigation.navigate('MyBookings', { bookingId });
                    return;
                }
            } else {
                // External link
                Linking.openURL(item.actionUrl).catch(err => console.error("Couldn't load page", err));
            }
        }

        if (item.type === 'booking_request' || item.type === 'booking_update') {
            if (item.metadata?.bookingId) {
                navigation.navigate('MyBookings', { bookingId: item.metadata.bookingId });
            } else {
                navigation.navigate('MyBookings');
            }
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Mark all read error:', err);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={28} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Notifications</Text>
                    </View>
                    {notifications.length > 0 && (
                        <TouchableOpacity onPress={handleMarkAllRead}>
                            <Text style={styles.markReadText}>Mark all read</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {notifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="notifications-off-outline" size={60} color="#E2E8F0" />
                        </View>
                        <Text style={styles.emptyTitle}>Stay Tuned!</Text>
                        <Text style={styles.emptySubtitle}>You're all caught up. New notifications will appear here.</Text>
                        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
                            <Text style={styles.refreshBtnText}>Check Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <PureNotificationItem item={item} onPress={handleNotificationPress} />
                        )}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl 
                                refreshing={refreshing} 
                                onRefresh={handleRefresh} 
                                tintColor={theme.colors.primary} 
                                colors={[theme.colors.primary]}
                            />
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 40, // As requested
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        fontFamily: theme.fonts.heading,
    },
    markReadText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '700',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    unreadCard: {
        backgroundColor: '#F8FAFC',
        borderColor: theme.colors.primary + '20',
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        flex: 1,
        marginRight: 10,
    },
    time: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    message: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        fontFamily: theme.fonts.body,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary,
        marginLeft: 12,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: -50,
    },
    emptyIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    refreshBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
    },
    refreshBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
});

export default NotificationsScreen;
