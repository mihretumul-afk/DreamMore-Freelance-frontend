import { useCallback, useEffect, useRef, useState } from 'react';
import { getEcho } from '../config/echo';

/**
 * Hook that subscribes to real-time contract and milestone updates via Laravel Echo/Reverb.
 *
 * @param {number|null} userId - The authenticated user's ID.
 * @param {number|null} contractId - The contract ID to listen to (optional, listens to all user contracts if null).
 * @returns {{ connected: boolean, lastEvent: object|null }}
 *
 * Events listened to:
 *   - contract.updated  — contract status changed (pause, resume, complete, cancel)
 *   - milestone.updated — milestone status changed (created, funded, started, submitted, approved, revision)
 *
 * Usage:
 *   const { connected, lastEvent } = useRealtimeContract(userId, contractId);
 *   // Use lastEvent to trigger data refresh
 */
export function useRealtimeContract(userId, contractId = null) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const channelsRef = useRef([]);
  const callbacksRef = useRef({
    contractUpdated: [],
    milestoneUpdated: [],
  });

  // Subscribe to channels
  useEffect(() => {
    if (!userId) return;

    const echo = getEcho();
    if (!echo) return;

    const channels = [];

    // Subscribe to user-specific contract channel (gets all contract updates for this user)
    const userChannel = echo.private(`contract.${userId}`);
    channels.push(userChannel);

    userChannel.listen('.contract.updated', (data) => {
      setConnected(true);
      setLastEvent({ type: 'contract', ...data });
      callbacksRef.current.contractUpdated.forEach((cb) => cb(data));
    });

    userChannel.listen('.milestone.updated', (data) => {
      setConnected(true);
      setLastEvent({ type: 'milestone', ...data });
      callbacksRef.current.milestoneUpdated.forEach((cb) => cb(data));
    });

    // If a specific contract ID is provided, also subscribe to that channel
    if (contractId) {
      const contractChannel = echo.private(`contract.${contractId}`);
      channels.push(contractChannel);

      contractChannel.listen('.contract.updated', (data) => {
        setConnected(true);
        setLastEvent({ type: 'contract', ...data });
        callbacksRef.current.contractUpdated.forEach((cb) => cb(data));
      });

      contractChannel.listen('.milestone.updated', (data) => {
        setConnected(true);
        setLastEvent({ type: 'milestone', ...data });
        callbacksRef.current.milestoneUpdated.forEach((cb) => cb(data));
      });
    }

    // Listen for subscription succeeded
    userChannel.subscribed(() => {
      setConnected(true);
    });

    // Listen for subscription errors
    userChannel.error((error) => {
      console.warn('[Echo] Contract channel subscription error:', error);
      setConnected(false);
    });

    channelsRef.current = channels;

    return () => {
      channels.forEach((channel) => {
        channel.stopListening('.contract.updated');
        channel.stopListening('.milestone.updated');
      });
      echo.leave(`contract.${userId}`);
      if (contractId) {
        echo.leave(`contract.${contractId}`);
      }
      channelsRef.current = [];
      setConnected(false);
    };
  }, [userId, contractId]);

  /**
   * Register a callback for contract updates.
   * Returns an unsubscribe function.
   */
  const onContractUpdated = useCallback((callback) => {
    callbacksRef.current.contractUpdated.push(callback);
    return () => {
      callbacksRef.current.contractUpdated = callbacksRef.current.contractUpdated.filter(
        (cb) => cb !== callback,
      );
    };
  }, []);

  /**
   * Register a callback for milestone updates.
   * Returns an unsubscribe function.
   */
  const onMilestoneUpdated = useCallback((callback) => {
    callbacksRef.current.milestoneUpdated.push(callback);
    return () => {
      callbacksRef.current.milestoneUpdated = callbacksRef.current.milestoneUpdated.filter(
        (cb) => cb !== callback,
      );
    };
  }, []);

  return { connected, lastEvent, onContractUpdated, onMilestoneUpdated };
}
