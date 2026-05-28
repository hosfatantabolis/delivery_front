import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Notifications.css';

const Notifications = () => {
  const { socket, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    console.log('Notifications component mounted for role:', user?.role);

    // Load notifications from localStorage (separate for each user)
    const storageKey = `notifications_${user?.id}`;
    const savedNotifications = localStorage.getItem(storageKey);
    if (savedNotifications) {
      const parsed = JSON.parse(savedNotifications);
      setNotifications(parsed);
      setUnreadCount(parsed.filter(n => !n.read).length);
    }

    if (socket) {
      // Listen for new notifications
      socket.on('notification', (notification) => {
        console.log(`🔔 Notification received for ${user?.role}:`, notification);
        addNotification(notification);
        
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification(notification.title || 'Delivery System', {
            body: notification.message,
            icon: '/favicon.ico'
          });
        }
        
        // Play sound for assignment notifications
        if (notification.type === 'assignment') {
          playNotificationSound();
        }
      });
      
      // Listen for order assignments (specific for drivers)
      socket.on('order-assigned', (order) => {
        console.log('Order assigned event received:', order);
        // Refresh orders if the component has a refresh function
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('order-assigned', { detail: order }));
        }
      });
    }

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (socket) {
        socket.off('notification');
        socket.off('order-assigned');
      }
    };
  }, [socket, user]);

  const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioContext.close().catch(console.error); // Add error handling
    }, 300);
  } catch (e) {
    console.log('Audio not supported:', e);
  }
};

  const addNotification = (notification) => {
    setNotifications(prev => {
      // Avoid duplicate notifications
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      
      const newNotifications = [notification, ...prev].slice(0, 50);
      // Save to localStorage with user-specific key
      const storageKey = `notifications_${user?.id}`;
      localStorage.setItem(storageKey, JSON.stringify(newNotifications));
      return newNotifications;
    });
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      const storageKey = `notifications_${user?.id}`;
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      const storageKey = `notifications_${user?.id}`;
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    const storageKey = `notifications_${user?.id}`;
    localStorage.removeItem(storageKey);
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'success': return '✅';
      case 'assignment': return '📋';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'success': return '#4caf50';
      case 'assignment': return '#2196f3';
      case 'warning': return '#ff9800';
      case 'error': return '#f44336';
      default: return '#667eea';
    }
  };

  return (
    <div className="notifications-container">
      <button 
        className="notification-bell" 
        onClick={() => setShowDropdown(!showDropdown)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {notifications.length > 0 && (
                <>
                  <button onClick={markAllAsRead}>Mark all read</button>
                  <button onClick={clearAll}>Clear all</button>
                </>
              )}
            </div>
          </div>
          
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <span>📭</span>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  style={{ borderLeftColor: getNotificationColor(notification.type) }}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    {notification.clientName && (
                      <div className="notification-detail">
                        🏢 {notification.clientName}
                      </div>
                    )}
                    {notification.deliveryAddress && (
                      <div className="notification-detail">
                        📍 {notification.deliveryAddress.substring(0, 60)}...
                      </div>
                    )}
                    <div className="notification-time">
                      {new Date(notification.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {!notification.read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;