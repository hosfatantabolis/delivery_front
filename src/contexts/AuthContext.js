import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  // Initialize socket connection
  const initSocket = (authToken) => {
  if (!authToken) return null;
  
  if (socketRef.current) {
    socketRef.current.disconnect();
  }

  const newSocket = io('http://localhost:5000', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    auth: { token: authToken }
  });

  newSocket.on('connect', () => {
    console.log('✅ Socket connected:', newSocket.id);
    console.log('Socket auth token present:', !!authToken);
  });

  newSocket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  newSocket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  // Test event
  newSocket.on('test', (data) => {
    console.log('Test event received:', data);
  });

  socketRef.current = newSocket;
  setSocket(newSocket);
  return newSocket;
};

  // Check if user is already logged in on page load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      // Set default axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        // Verify token and get user data
        const response = await axios.get('http://localhost:5000/api/auth/me');
        const userData = response.data.user;
        
        setUser(userData);
        
        // Initialize socket connection after successful auth
        initSocket(token);
        
      } catch (error) {
        console.error('Auth check failed:', error);
        // Token is invalid, clear it
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Store token
      localStorage.setItem('token', token);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user state
      setUser(user);
      
      // Initialize socket connection
      initSocket(token);
      
      return user;
    } catch (error) {
      throw error.response?.data || { error: 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, socket, loading }}>
      {children}
    </AuthContext.Provider>
  );
};