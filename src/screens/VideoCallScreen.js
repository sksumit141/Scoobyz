import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useWebRTC from '../hooks/useWebRTC';

export default function VideoCallScreen({ navigation, route }) {
    const { bookingId } = route.params || {};
    const { localStream, remoteStream, isMuted, isCameraOff, toggleMute, toggleCamera, switchCamera } = useWebRTC(bookingId);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Attach streams to HTML video elements when on Web
    useEffect(() => {
        if (Platform.OS === 'web') {
            if (localVideoRef.current && localStream) {
                localVideoRef.current.srcObject = localStream;
            }
            if (remoteVideoRef.current && remoteStream) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
        }
    }, [localStream, remoteStream]);

    const handleHangUp = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.videoContainer}>
                {remoteStream ? (
                    <video 
                        ref={remoteVideoRef}
                        autoPlay 
                        playsInline 
                        style={styles.remoteVideoWeb} 
                    />
                ) : (
                    <View style={styles.waitingContainer}>
                        <Text style={styles.waitingText}>Waiting for other person to join...</Text>
                    </View>
                )}

                {localStream && !isCameraOff && (
                    <View style={styles.localVideoContainer}>
                        <video 
                            ref={localVideoRef}
                            autoPlay 
                            playsInline 
                            muted
                            style={styles.localVideoWeb} 
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

                {/* Switch camera not fully supported on standard web without enumerating devices again */}
                {/* <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
                    <Ionicons name="camera-reverse" size={28} color="#fff" />
                </TouchableOpacity> */}

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
    remoteVideoWeb: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
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
        width: 150,
        height: 200,
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
    localVideoWeb: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
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