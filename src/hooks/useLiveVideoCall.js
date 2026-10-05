import { useCallback, useEffect, useRef, useState } from 'react';
import messageService from '../services/messageService';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useLiveVideoCall(currentUser, onCallSignal) {
  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'connected' | 'ended'
  const [partner, setPartner] = useState(null); // { id, name, avatar }
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const screenTrackRef = useRef(null);
  const callTimerRef = useRef(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Clean up streams & peer connections
  const endCall = useCallback((notifyPartner = true) => {
    if (notifyPartner && partner?.id) {
      messageService.sendCallSignal({
        receiver_id: partner.id,
        type: 'end-call',
      }).catch(() => {});
    }

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setCallState('idle');
    setPartner(null);
    setIsMicMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setCallDuration(0);
  }, [partner?.id]);

  // Create WebRTC PeerConnection
  const createPeerConnection = useCallback((targetUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Send ICE candidates to partner
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        messageService.sendCallSignal({
          receiver_id: targetUserId,
          type: 'ice-candidate',
          signal: event.candidate.toJSON(),
        }).catch(() => {});
      }
    };

    // Attach remote stream when received
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState('connected');
        // Start duration timer
        if (!callTimerRef.current) {
          setCallDuration(0);
          callTimerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
        }
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        endCall(false);
      }
    };

    return pc;
  }, [endCall]);

  // Initialize local media stream (camera & mic)
  const initLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.warn('Could not access media devices:', err);
      // Fallback: try audio only
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioStream;
        return audioStream;
      } catch {
        return null;
      }
    }
  }, []);

  // Initiate outgoing video call
  const startCall = useCallback(async (targetPartner) => {
    setPartner(targetPartner);
    setCallState('calling');

    const localStream = await initLocalStream();
    const pc = createPeerConnection(targetPartner.id);

    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }

    // Send start-call signal
    await messageService.sendCallSignal({
      receiver_id: targetPartner.id,
      type: 'start-call',
    }).catch(() => {});

    // Create SDP Offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await messageService.sendCallSignal({
      receiver_id: targetPartner.id,
      type: 'offer',
      signal: offer,
    }).catch(() => {});
  }, [initLocalStream, createPeerConnection]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!partner) return;
    setCallState('connected');

    const localStream = await initLocalStream();
    const pc = peerConnectionRef.current || createPeerConnection(partner.id);

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        // avoid adding duplicate tracks
        if (!pc.getSenders().some((s) => s.track === track)) {
          pc.addTrack(track, localStream);
        }
      });
    }

    // Create SDP Answer if offer was already processed
    if (pc.remoteDescription) {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await messageService.sendCallSignal({
        receiver_id: partner.id,
        type: 'answer',
        signal: answer,
      }).catch(() => {});
    }
  }, [partner, initLocalStream, createPeerConnection]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (partner?.id) {
      messageService.sendCallSignal({
        receiver_id: partner.id,
        type: 'reject-call',
      }).catch(() => {});
    }
    endCall(false);
  }, [partner?.id, endCall]);

  // Toggle Microphone Mute
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Toggle Camera
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, []);

  // Toggle Screen Share
  const toggleScreenShare = useCallback(async () => {
    if (!peerConnectionRef.current) return;

    if (isScreenSharing) {
      // Revert to camera
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        } else if (localStreamRef.current) {
          peerConnectionRef.current.addTrack(screenTrack, localStreamRef.current);
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen share canceled or failed:', err);
      }
    }
  }, [isScreenSharing]);

  // Process incoming signal events
  const handleIncomingSignal = useCallback(async (data) => {
    const { sender_id, type, signal, sender_name, sender_avatar } = data;

    if (type === 'start-call') {
      setPartner({ id: sender_id, name: sender_name || 'User', avatar: sender_avatar });
      setCallState('incoming');
      createPeerConnection(sender_id);
    } else if (type === 'offer') {
      if (!partner) {
        setPartner({ id: sender_id, name: sender_name || 'User', avatar: sender_avatar });
      }
      let pc = peerConnectionRef.current;
      if (!pc) {
        pc = createPeerConnection(sender_id);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      setCallState((prev) => (prev === 'idle' ? 'incoming' : prev));

      // If call was accepted, generate answer
      if (callState === 'connected') {
        const localStream = localStreamRef.current || (await initLocalStream());
        if (localStream) {
          localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        messageService.sendCallSignal({
          receiver_id: sender_id,
          type: 'answer',
          signal: answer,
        }).catch(() => {});
      }
    } else if (type === 'answer') {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        setCallState('connected');
      }
    } else if (type === 'ice-candidate') {
      const pc = peerConnectionRef.current;
      if (pc && signal) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal));
        } catch (e) {
          console.warn('Error adding ICE candidate:', e);
        }
      }
    } else if (type === 'reject-call' || type === 'end-call') {
      endCall(false);
    }
  }, [partner, callState, createPeerConnection, initLocalStream, endCall]);

  // Subscribe to call signaling events
  useEffect(() => {
    if (!onCallSignal) return;
    const unsubscribe = onCallSignal(handleIncomingSignal);
    return unsubscribe;
  }, [onCallSignal, handleIncomingSignal]);

  return {
    callState,
    partner,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    callDuration,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
  };
}
