import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { Ionicons } from '@expo/vector-icons';
import useWebRTC from '../hooks/useWebRTC';

export default function VideoCallScreen({ navigation, route }) {
    const { bookingId } = route.params || {};
    const { localStream, remoteStream, isMuted, isCameraOff, toggleMute, toggleCamera, switchCamera } = useWebRTC(bookingId);

    const handleHangUp = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.videoContainer}>
                {remoteStream ? (
                    <RTCView 
                        streamURL={remoteStream.toURL()} 
                        style={styles.remoteVideo} 
                        objectFit="cover"
                    />
                ) : (
                    <View style={styles.waitingContainer}>
                        <Text style={styles.waitingText}>Waiting for other person to join...</Text>
                    </View>
                )}

                {localStream && !isCameraOff && (
                    <View style={styles.localVideoContainer}>
                        <RTCView 
                            streamURL={localStream.toURL()} 
                            style={styles.localVideo} 
                            objectFit="cover"
                            zOrder={1}
                        />
                    </View>
                )}
            </View>

            <View style={styles.controlsContainer}>
                <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
                    <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={toggleCamera}>
                    <Ionicons name={isCameraOff ? "videocam-off" : "videocam"} size={28} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
                    <Ionicons name="camera-reverse" size={28} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.controlButton, styles.hangUpButton]} onPress={handleHangUp}>
                    <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111',
    },
    videoContainer: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    remoteVideo: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    waitingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    waitingText: {
        color: '#fff',
        fontSize: 18,
    },
    localVideoContainer: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 100,
        height: 150,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: '#000',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    localVideo: {
        flex: 1,
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: 'rgba(0,0,0,0.8)',
        position: 'absolute',
        bottom: 0,
        width: '100%',
        paddingBottom: 40,
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hangUpButton: {
        backgroundColor: '#ff3b30',
    }
});
