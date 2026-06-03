import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { chatApi, BASE_URL } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client/dist/socket.io.js';
import { formatISTTime } from '../utils/date_utils';

const { width } = Dimensions.get('window');

export default function ChatScreen({ navigation, route }) {
  const { bookingId, partnerName } = route.params;
  const insets = useSafeAreaInsets ? useSafeAreaInsets() : { top: 40 };
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const scrollViewRef = useRef();
  const socketRef = useRef();

  useEffect(() => {
    loadUserId();
    fetchMessages();

    // Initialize Socket Connection
    socketRef.current = io(BASE_URL, {
      transports: ['websocket']
    });
    
    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
      socketRef.current.emit('join_booking_chat', bookingId);
    });

    socketRef.current.on('new_message', (message) => {
      // Only add if it's not from current user (already added locally) 
      // Actually, it's safer to just add it if it's not already in list
      setMessages(prev => {
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [bookingId]);

  const loadUserId = async () => {
    const id = await AsyncStorage.getItem('userId');
    setCurrentUserId(parseInt(id));
  };

  const fetchMessages = async () => {
    try {
      const data = await chatApi.getMessages(bookingId);
      setMessages(data);
    } catch (err) {
      console.error("Fetch chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => scrollViewRef.current.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      // We still use REST to save the message
      const newMessage = await chatApi.sendMessage(bookingId, textToSend);
      // The server will emit 'new_message' which we'll catch in the listener
      // But we can also add it locally for instant feedback if we want 
      // (The listener logic checks for duplicates)
      setMessages(prev => {
        if (prev.find(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    } catch (err) {
      alert("Failed to send message. Chat might be closed.");
      console.error("Send message error:", err);
    }
  };

  const formatTime = (dateStr) => {
    return formatISTTime(dateStr);
  };

  return (
    <AppScreen safeArea={false} padding={false} backgroundColor="#F9F8F5">
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header Section */}
        <View style={[styles.header, { paddingTop: insets.top || 40 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>

          <View style={styles.agentInfo}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarPlaceholder}>
                <AppText style={styles.avatarInitials} weight="bold">{partnerName?.charAt(0) || 'P'}</AppText>
              </View>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.headerTextContainer}>
              <AppText style={styles.headerTitle} weight="bold">{partnerName || 'Partner'}</AppText>
              <AppText style={styles.headerSubtitle}>Order #{bookingId}</AppText>
            </View>
          </View>
        </View>

        {/* Chat Area */}
        {loading && messages.length === 0 ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color={theme.colors.primaryDark} />
          </View>
        ) : (
          <ScrollView 
            ref={scrollViewRef}
            style={styles.chatArea} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          >
            {messages.map((msg) => {
              const isUser = msg.senderId === currentUserId;
              return (
                <View key={msg.id} style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperAgent]}>
                  <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAgent]}>
                    <AppText style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextAgent]}>
                      {msg.text}
                    </AppText>
                    <AppText style={[styles.timeText, isUser ? styles.timeTextUser : styles.timeTextAgent]}>
                      {formatTime(msg.createdAt)}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#888"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: theme.colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: { marginRight: 15 },
  agentInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatarWrapper: { position: 'relative', marginRight: 12 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: { color: theme.colors.primaryDark, fontSize: 16 },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: theme.colors.primaryDark,
  },
  headerTextContainer: { justifyContent: 'center' },
  headerTitle: { color: '#FFF', fontSize: 16, marginBottom: 2 },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  chatArea: { flex: 1, backgroundColor: '#F9F8F5' },
  loadingArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageWrapper: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  messageWrapperUser: { justifyContent: 'flex-end' },
  messageWrapperAgent: { justifyContent: 'flex-start' },
  bubble: { maxWidth: width * 0.75, padding: 14, borderRadius: 20 },
  bubbleUser: { backgroundColor: theme.colors.primaryDark, borderBottomRightRadius: 4 },
  bubbleAgent: { backgroundColor: '#FFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#EAEAEA' },
  messageText: { fontSize: 14, lineHeight: 20 },
  messageTextUser: { color: '#FFF' },
  messageTextAgent: { color: '#333' },
  timeText: { fontSize: 10, marginTop: 6, alignSelf: 'flex-end' },
  timeTextUser: { color: 'rgba(255,255,255,0.7)' },
  timeTextAgent: { color: '#888' },
  inputContainer: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: '#333',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  }
});
