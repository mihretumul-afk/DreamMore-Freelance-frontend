import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { getToken } from '../utils/authStorage';

/**
 * Laravel Echo client for real-time WebSocket communication via Reverb.
 *
 * - Uses Pusher protocol (Reverb is compatible with Pusher JS client).
 * - Authentication is handled by sending the Sanctum Bearer token.
 * - Falls back gracefully when WebSocket is unavailable (returns null).
 */

let echoInstance = null;

/**
 * Get or create the Echo instance.
 * Returns null if WebSocket is not configured or available.
 */
export function getEcho() {
  if (echoInstance) return echoInstance;

  const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
  const reverbHost = import.meta.env.VITE_REVERB_HOST;
  const reverbPort = import.meta.env.VITE_REVERB_PORT;
  const reverbScheme = import.meta.env.VITE_REVERB_SCHEME;

  if (!reverbKey) {
    // Reverb not configured — return null for graceful fallback
    return null;
  }

  window.Pusher = Pusher;

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: reverbKey,
    wsHost: reverbHost || window.location.hostname,
    wsPort: reverbPort ? Number(reverbPort) : 6001,
    wssPort: reverbPort ? Number(reverbPort) : 6001,
    forceTLS: (reverbScheme || 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: 'application/json',
      },
    },
  });

  return echoInstance;
}

/**
 * Disconnect the Echo instance (call on logout).
 */
export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
