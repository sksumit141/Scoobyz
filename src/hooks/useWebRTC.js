import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import io from 'socket.io-client';
import { BASE_URL } from '../services/api';

// Platform-specific WebRTC imports
let RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices;

if (Platform.OS !== 'web') {
    const webrtc = require('react-native-webrtc');
    RTCPeerConnection = webrtc.RTCPeerConnection;
    RTCIceCandidate = webrtc.RTCIceCandidate;
    RTCSessionDescription = webrtc.RTCSessionDescription;
    mediaDevices = webrtc.mediaDevices;
} else {
    RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
    RTCIceCandidate = window.RTCIceCandidate;
    RTCSessionDescription = window.RTCSessionDescription;
    mediaDevices = navigator.mediaDevices;
}

const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function useWebRTC(roomId) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const peerConnection = useRef(null);
    const socket = useRef(null);

    useEffect(() => {
        if (!roomId) return;
        socket.current = io(BASE_URL, {
            transports: ['websocket'],
        });

        const startCall = async () => {
            try {
                let stream;
                if (Platform.OS !== 'web') {
                    let isFront = true;
                    const sourceInfos = await mediaDevices.enumerateDevices();
                    let videoSourceId;
                    for (let i = 0; i < sourceInfos.length; i++) {
                        const sourceInfo = sourceInfos[i];
                        if (sourceInfo.kind === 'videoinput' && sourceInfo.facing === (isFront ? 'front' : 'environment')) {
                            videoSourceId = sourceInfo.deviceId;
                        }
                    }

                    stream = await mediaDevices.getUserMedia({
                        audio: true,
                        video: {
                            width: 640,
                            height: 480,
                            frameRate: 30,
                            facingMode: (isFront ? 'user' : 'environment'),
                            deviceId: videoSourceId
                        }
                    });
                } else {
                    stream = await mediaDevices.getUserMedia({ audio: true, video: true });
                }

                setLocalStream(stream);

                peerConnection.current = new RTCPeerConnection(configuration);

                // Add local stream to peer connection
                if (Platform.OS !== 'web') {
                    stream.getTracks().forEach(track => {
                        peerConnection.current.addTrack(track, stream);
                    });
                } else {
                    stream.getTracks().forEach(track => {
                        peerConnection.current.addTrack(track, stream);
                    });
                }

                peerConnection.current.ontrack = (event) => {
                    if (event.streams && event.streams[0]) {
                        setRemoteStream(event.streams[0]);
                    } else if (Platform.OS === 'web') {
                         const inboundStream = new MediaStream();
                         inboundStream.addTrack(event.track);
                         setRemoteStream(inboundStream);
                    }
                };

                peerConnection.current.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.current.emit('new_ice_candidate', {
                            roomId,
                            candidate: event.candidate,
                        });
                    }
                };

                socket.current.emit('join_video_room', roomId);

                socket.current.on('user_joined', async () => {
                    // We are the caller (we were here first, someone joined)
                    try {
                        const offer = await peerConnection.current.createOffer();
                        await peerConnection.current.setLocalDescription(offer);
                        socket.current.emit('video_offer', { roomId, offer });
                    } catch (e) {
                        console.error("Error creating offer", e);
                    }
                });

                socket.current.on('video_offer', async (data) => {
                    // We are the callee
                    try {
                        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.offer));
                        const answer = await peerConnection.current.createAnswer();
                        await peerConnection.current.setLocalDescription(answer);
                        socket.current.emit('video_answer', { roomId, answer, to: data.sender });
                    } catch (e) {
                        console.error("Error handling offer", e);
                    }
                });

                socket.current.on('video_answer', async (data) => {
                    try {
                        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                    } catch (e) {
                        console.error("Error handling answer", e);
                    }
                });

                socket.current.on('new_ice_candidate', async (data) => {
                    try {
                        await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                    } catch (e) {
                        console.error('Error adding received ice candidate', e);
                    }
                });
                
                socket.current.on('user_left', () => {
                    setRemoteStream(null);
                });

            } catch (err) {
                console.error("Failed to start call:", err);
            }
        };

        startCall();

        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (peerConnection.current) {
                peerConnection.current.close();
            }
            if (socket.current) {
                socket.current.emit('leave_video_room', roomId);
                socket.current.disconnect();
            }
        };
    }, [roomId]);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsCameraOff(!isCameraOff);
        }
    };

    const switchCamera = () => {
        if (localStream && Platform.OS !== 'web') {
            localStream.getVideoTracks().forEach(track => {
                if (track._switchCamera) {
                    track._switchCamera();
                }
            });
        }
    };

    return { localStream, remoteStream, isMuted, isCameraOff, toggleMute, toggleCamera, switchCamera };
}
