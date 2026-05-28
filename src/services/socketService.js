import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.token = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (!token) {
      console.error('No token provided for socket connection');
      return null;
    }

    if (this.socket && this.socket.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    this.token = token;
    
    this.socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: { token }
    });

    this.setupEventHandlers();
    return this.socket;
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      if (this.listeners.has('connect')) {
        this.listeners.get('connect')(this.socket.id);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      if (error.message === 'Invalid token') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        this.socket.connect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this.listeners.set(event, callback);
    }
  }

  off(event) {
    if (this.socket && this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
      this.listeners.delete(event);
    }
  }

  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }
}

// Create a singleton instance
const socketService = new SocketService();

// Export as default
export default socketService;