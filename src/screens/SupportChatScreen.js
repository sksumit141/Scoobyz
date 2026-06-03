import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';
import { BASE_URL, customerApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client/dist/socket.io.js';
import { formatISTTime } from '../utils/date_utils';

const { width } = Dimensions.get('window');

export default function SupportChatScreen({ navigation }) {
  const insets = useSafeAreaInsets ? useSafeAreaInsets() : { top: 40 };
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const scrollViewRef = useRef();
  const socketRef = useRef();

  useEffect(() => {
    loadUser();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const loadUser = async () => {
    try {
        const id = await AsyncStorage.getItem('userId');
        setUserId(id);

        // Fetch complete details
        const profile = await customerApi.getProfile();
        setUserDetails(profile);
        setUserName(profile?.fullName || profile?.name || 'User');

        if (id) {
            // Initialize Socket Connection
            socketRef.current = io(BASE_URL, {
              transports: ['websocket']
            });
            
            socketRef.current.on('connect', () => {
              socketRef.current.emit('join_support_room', id);
            });

            socketRef.current.on('support_message', (msg) => {
              setMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
            });
        }
    } catch (err) {
        console.error("Load user error:", err);
    }
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => scrollViewRef.current.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || !socketRef.current) return;

    const msgData = {
        userId: userId,
        sender: 'user',
        userType: 'customer',
        name: userName,
        text: inputText.trim(),
        userDetails: userDetails,
    };

    socketRef.current.emit('send_support_message', msgData);
    setInputText('');
  };

  const formatTime = (timestamp) => {
    return formatISTTime(timestamp);
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

          <View style={styles.headerTextContainer}>
            <AppText style={styles.headerTitle} weight="bold">Scoobys Support</AppText>
            <AppText style={styles.headerSubtitle}>We typically reply in minutes</AppText>
          </View>
        </View>

        {/* Chat Area */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatArea} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          {messages.length === 0 && (
              <View style={styles.emptyState}>
                  <Ionicons name="chatbubbles-outline" size={60} color="#DDD" />
                  <AppText style={styles.emptyText}>Hi {userName}! How can we help you today?</AppText>
              </View>
          )}
          {messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            return (
              <View key={index} style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperAgent]}>
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAgent]}>
                  <AppText style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextAgent]}>
                    {msg.text}
                  </AppText>
                  <AppText style={[styles.timeText, isUser ? styles.timeTextUser : styles.timeTextAgent]}>
                    {formatTime(msg.timestamp)}
                  </AppText>
                </View>
              </View>
            );
          })}
        </ScrollView>

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
  headerTextContainer: { flex: 1 },
  headerTitle: { color: '#FFF', fontSize: 18 },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  chatArea: { flex: 1, backgroundColor: '#F9F8F5' },
  messageWrapper: { flexDirection: 'row', marginBottom: 16 },
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
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#AAA', marginTop: 10, textAlign: 'center', width: '80%' },
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
