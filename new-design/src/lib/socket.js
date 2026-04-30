import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/socket.io`
  : `${window.location.origin}/socket.io`;

let socket = null;

/**
 * Get or create the Socket.io singleton.
 * Options:
 *   { auth: { userId, token } } — connect with auth
 *   no args — return existing or create unconnected instance
 */
export function getSocket(options = null) {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false,
    });
  }

  if (options && !socket.connected) {
    socket.connect();
    if (options.auth) {
      socket.auth = options.auth;
    }
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default { getSocket, disconnectSocket };