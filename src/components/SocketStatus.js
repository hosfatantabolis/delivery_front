import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const SocketStatus = () => {
  const { socket } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    if (socket) {
      setIsConnected(socket.connected);
      setSocketId(socket.id);
      
      const handleConnect = () => {
        console.log('Socket connected in status component');
        setIsConnected(true);
        setSocketId(socket.id);
      };
      
      const handleDisconnect = () => {
        console.log('Socket disconnected in status component');
        setIsConnected(false);
        setSocketId(null);
      };
      
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      
      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    }
  }, [socket]);

  // Don't show if no socket
  if (!socket) return null;

  return (
    <div className="socket-status">
      <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
      <span className="status-text">
        {isConnected ? 'Real-time connected' : 'Reconnecting...'}
      </span>
      {isConnected && socketId && (
        <span className="socket-id" style={{ fontSize: '10px', marginLeft: '5px', opacity: 0.7 }}>
          (ID: {socketId.substring(0, 6)})
        </span>
      )}
    </div>
  );
};

export default SocketStatus;