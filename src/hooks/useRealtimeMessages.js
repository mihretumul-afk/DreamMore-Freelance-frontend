import { useCallback, useEffect, useRef, useState } from 'react';
import { getEcho } from '../config/echo';

/**
 * Hook that subscribes to real-time message channels via Laravel Echo/Reverb.
 *
 * @param {number|null} userId - The authenticated user's ID.
 * @returns {{ connected: boolean }}
 *
 * Events listened to:
 *   - message.sent  — a new message was sent to or from the user
 *   - message.read  — a message the user sent was marked as read
 *
 * Usage:
 *   const { onMessageSent, onMessageRead } = useRealtimeMessages(userId);
 *   // Pass callbacks to wire up your state:
 *   onMessageSent((message) => { ... });
 *   onMessageRead((data) => { ... });
 */
export function useRealtimeMessages(userId) {
  const [connected, setConnected] = useState(false);
  const channelRef = useRef(null);
  const callbacksRef = useRef({
    messageSent: [],
    messageRead: [],
    callSignal: [],
  });

  // Subscribe to the user's private chat channel
  useEffect(() => {
    if (!userId) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`chat.${userId}`);
    channelRef.current = channel;

    channel.listen('.message.sent', (message) => {
      setConnected(true);
      callbacksRef.current.messageSent.forEach((cb) => cb(message));
    });

    channel.listen('.message.read', (data) => {
      callbacksRef.current.messageRead.forEach((cb) => cb(data));
    });

    channel.listen('.call.signal', (data) => {
      callbacksRef.current.callSignal.forEach((cb) => cb(data));
    });

    // Listen for subscription succeeded
    channel.subscribed(() => {
      setConnected(true);
    });

    // Listen for subscription errors
    channel.error((error) => {
      console.warn('[Echo] Channel subscription error:', error);
      setConnected(false);
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.stopListening('.message.sent');
        channelRef.current.stopListening('.message.read');
        channelRef.current.stopListening('.call.signal');
        echo.leave(`chat.${userId}`);
        channelRef.current = null;
      }
      setConnected(false);
    };
  }, [userId]);

  /**
   * Register a callback for new incoming messages.
   * Returns an unsubscribe function.
   */
  const onMessageSent = useCallback((callback) => {
    callbacksRef.current.messageSent.push(callback);
    return () => {
      callbacksRef.current.messageSent = callbacksRef.current.messageSent.filter(
        (cb) => cb !== callback,
      );
    };
  }, []);

  /**
   * Register a callback for read receipts.
   * Returns an unsubscribe function.
   */
  const onMessageRead = useCallback((callback) => {
    callbacksRef.current.messageRead.push(callback);
    return () => {
      callbacksRef.current.messageRead = callbacksRef.current.messageRead.filter(
        (cb) => cb !== callback,
      );
    };
  }, []);

  /**
   * Register a callback for incoming call signals.
   * Returns an unsubscribe function.
   */
  const onCallSignal = useCallback((callback) => {
    callbacksRef.current.callSignal.push(callback);
    return () => {
      callbacksRef.current.callSignal = callbacksRef.current.callSignal.filter(
        (cb) => cb !== callback,
      );
    };
  }, []);

  return { connected, onMessageSent, onMessageRead, onCallSignal };
}
