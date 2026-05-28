import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Notifications from '../components/Notifications';
import './DriverPanel.css';

const DriverPanel = () => {
  const { user, logout, socket } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    completed: 0,
    pending: 0
  });
  const [calendarKey, setCalendarKey] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
const [refreshKey, setRefreshKey] = useState(0);

  // In DriverPanel.js - replace the socket event handlers

// In DriverPanel.js - restore proper socket handling

useEffect(() => {
  console.log('🟢 Setting up socket listeners');
  fetchOrders();
  
  if (socket) {
    const handleOrderAssigned = (data) => {
      console.log('📦 order-assigned CALLBACK FIRED');
      console.log('Order data:', data?.orderNumber);
      fetchOrders();
    };
    
    socket.on('order-assigned', handleOrderAssigned);
    socket.on('order-updated', () => fetchOrders());
    socket.on('order-created', () => fetchOrders());
    
    return () => {
      socket.off('order-assigned', handleOrderAssigned);
      socket.off('order-updated');
      socket.off('order-created');
    };
  }
}, [socket, user?.id]); // Keep user?.id here

const fetchOrders = async () => {
  console.log('🔄 fetchOrders START');
  try {
    setLoading(true);
    const res = await axios.get('http://localhost:5000/api/orders');
    console.log('📦 API returned:', res.data.length, 'orders');
    
    const driverOrders = res.data.filter(order => 
      order.assignedDriver?._id === user?.id || order.assignedDriver === user?.id
    );
    console.log('👤 Driver orders:', driverOrders.length);
    
    // Update state
    setOrders(driverOrders);
    calculateStats(driverOrders);
    
    // Force UI refresh
    setRefreshKey(prev => prev + 1);
    console.log('🔄 refreshKey updated to:', refreshKey + 1);
    
  } catch (error) {
    console.error('Error fetching orders:', error);
  } finally {
    setLoading(false);
  }
};

  const calculateStats = (driverOrders) => {
    const today = new Date().toDateString();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const todayOrders = driverOrders.filter(order => {
      if (!order.timeWindow?.start) return false;
      return new Date(order.timeWindow.start).toDateString() === today;
    });
    
    const weekOrders = driverOrders.filter(order => {
      if (!order.timeWindow?.start) return false;
      return new Date(order.timeWindow.start) >= weekAgo;
    });
    
    const completedOrders = driverOrders.filter(order => 
      order.status === 'delivered'
    );
    
    const pendingOrders = driverOrders.filter(order => 
      order.status !== 'delivered' && order.status !== 'cancelled'
    );
    
    setStats({
      today: todayOrders.length,
      week: weekOrders.length,
      completed: completedOrders.length,
      pending: pendingOrders.length
    });
  };

// Check if an order falls on a specific date (handles date ranges)
// Check if an order falls on a specific date (handles date ranges)
const isOrderOnDate = (order, date) => {
  if (!order.deliveryDateStart) return false;
  
  const startDate = new Date(order.deliveryDateStart);
  startDate.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  // If no end date, check only start date
  if (!order.deliveryDateEnd) {
    return startDate.getTime() === checkDate.getTime();
  }
  
  // If end date exists, check if date is within range
  const endDate = new Date(order.deliveryDateEnd);
  endDate.setHours(23, 59, 59, 999);
  
  return checkDate >= startDate && checkDate <= endDate;
};


  // Get orders for a specific date based on delivery time window
const getOrdersForDate = (date) => {
  return orders.filter(order => isOrderOnDate(order, date));
};

// Get orders for the selected date
const getOrdersForSelectedDate = () => {
  return orders.filter(order => isOrderOnDate(order, selectedDate));
};

  // Custom tile content for calendar
  // Custom tile content for calendar with date range support
const tileContent = useCallback(({ date, view }) => {
  if (view === 'month') {
    const dayOrders = getOrdersForDate(date);
    if (dayOrders.length > 0) {
      const deliveredCount = dayOrders.filter(o => o.status === 'delivered').length;
      const inTransitCount = dayOrders.filter(o => o.status === 'in_transit').length;
      const pendingCount = dayOrders.filter(o => o.status === 'assigned' || o.status === 'confirmed').length;
      
      return (
        <div className="calendar-tile">
          <span className="order-count">{dayOrders.length}</span>
          <div className="tile-status-icons">
            {inTransitCount > 0 && <span className="tile-icon in-transit" title="In Transit">🚚</span>}
            {deliveredCount > 0 && <span className="tile-icon delivered" title="Delivered">✅</span>}
            {pendingCount > 0 && <span className="tile-icon pending" title="Pending">⏳</span>}
          </div>
        </div>
      );
    }
  }
  return null;
}, [orders, refreshTrigger]); // Add dependencies

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setActiveTab('orders');
  };

const updateOrderStatus = async (orderId, newStatus) => {
  try {
    // Use the main order update endpoint (PUT /api/orders/:id) instead
    const response = await axios.put(`http://localhost:5000/api/orders/${orderId}`, 
      { status: newStatus }
    );
    await fetchOrders();
    setShowStatusModal(false);
    setSelectedOrder(null);
  } catch (error) {
    console.error('Error updating order status:', error);
    alert(error.response?.data?.error || 'Failed to update order status');
  }
};

  const getStatusColor = (status) => {
    const colors = {
      'pending_confirmation': '#ff9800',
      'confirmed': '#2196f3',
      'assigned': '#9c27b0',
      'in_transit': '#ffc107',
      'delivered': '#4caf50',
      'cancelled': '#f44336',
      'rejected': '#f44336'
    };
    return colors[status] || '#757575';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending_confirmation': return '⏳';
      case 'confirmed': return '✅';
      case 'assigned': return '📋';
      case 'in_transit': return '🚚';
      case 'delivered': return '🎯';
      case 'cancelled': return '❌';
      case 'rejected': return '⚠️';
      default: return '📦';
    }
  };

  const getOrderTypeIcon = (type) => {
    switch(type) {
      case 'delivery': return '🚚';
      case 'collection': return '📦';
      case 'both': return '🔄';
      case 'complicated': return '⚠️';
      default: return '📋';
    }
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'normal': return '🟢';
      default: return '🟢';
    }
  };

  const formatTimeWindow = (start, end) => {
    if (!start && !end) return 'Not specified';
    if (start && !end) return `From ${new Date(start).toLocaleString()}`;
    if (!start && end) return `Until ${new Date(end).toLocaleString()}`;
    return `${new Date(start).toLocaleString()} - ${new Date(end).toLocaleString()}`;
  };

  const formatDeliveryPeriod = (order) => {
  if (!order.deliveryDateStart) return 'Not specified';
  
  const startDate = new Date(order.deliveryDateStart).toLocaleDateString();
  
  if (!order.deliveryDateEnd) {
    // Single day
    let result = startDate;
    
    // Add time if specified
    if (order.deliveryTimeStart && order.deliveryTimeEnd) {
      result += ` at ${order.deliveryTimeStart} - ${order.deliveryTimeEnd}`;
    } else if (order.deliveryTimeStart) {
      result += ` from ${order.deliveryTimeStart}`;
    } else if (order.deliveryTimeEnd) {
      result += ` until ${order.deliveryTimeEnd}`;
    } else {
      result += ` (any time)`;
    }
    
    return result;
  }
  
  // Date range
  const endDate = new Date(order.deliveryDateEnd).toLocaleDateString();
  let result = `${startDate} - ${endDate}`;
  
  // Add time if specified
  if (order.deliveryTimeStart && order.deliveryTimeEnd) {
    result += ` at ${order.deliveryTimeStart} - ${order.deliveryTimeEnd}`;
  } else if (order.deliveryTimeStart) {
    result += ` from ${order.deliveryTimeStart}`;
  } else if (order.deliveryTimeEnd) {
    result += ` until ${order.deliveryTimeEnd}`;
  }
  
  return result;
};

  const getNextStatuses = (currentStatus) => {
    switch(currentStatus) {
      case 'assigned':
        return ['in_transit', 'cancelled'];
      case 'in_transit':
        return ['delivered', 'cancelled'];
      case 'confirmed':
        return ['assigned', 'cancelled'];
      default:
        return [];
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="loading-state">Loading dashboard...</div>;

  return (
    <div className="driver-panel">
      {/* Header */}
      <div className="driver-header">
        <div className="header-left">
          <h1>Driver Dashboard</h1>
          <div className="driver-info">
            <span className="driver-name">👨‍✈️ {user?.name}</span>
            {user?.vehicleInfo && (
              <span className="vehicle-info">🚚 {user.vehicleInfo}</span>
            )}
            {user?.assignedZone && (
              <span className="zone-info">📍 {user.assignedZone}</span>
            )}
          </div>
        </div>
        <div className="header-right">
          <Notifications />
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>Today's Orders</h3>
            <p className="stat-number">{stats.today}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>This Week</h3>
            <p className="stat-number">{stats.week}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Completed</h3>
            <p className="stat-number">{stats.completed}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>Pending</h3>
            <p className="stat-number">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="driver-tabs">
        <button 
          className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          📅 Calendar View
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 Orders for {selectedDate.toLocaleDateString()}
        </button>
      </div>

      {/* Calendar View Tab */}
      {activeTab === 'calendar' && (
        <div className="calendar-tab">
          <div className="calendar-container">
            <Calendar
              key={`calendar-${refreshTrigger}`}  // Add this key
              onChange={setSelectedDate}
              value={selectedDate}
              tileContent={tileContent}
              onClickDay={handleDateClick}
              className="driver-calendar"
            />
          </div>
          
          <div className="calendar-legend">
            <h3>Legend</h3>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-badge">3</span>
                <span>Number of orders on this day</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon">🚚</span>
                <span>Order in transit</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon">✅</span>
                <span>Order delivered</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon">⏳</span>
                <span>Order pending</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders List Tab */}
      {activeTab === 'orders' && (
        <div className="orders-tab">
          <div className="selected-date-header">
            <h2>Orders for {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</h2>
            <button 
              className="back-to-calendar"
              onClick={() => setActiveTab('calendar')}
            >
              ← Back to Calendar
            </button>
          </div>

          <div className="orders-list" key={`orders-${refreshTrigger}`}>
            {getOrdersForSelectedDate().length === 0 ? (
              <div className="no-orders">
                <div className="no-orders-icon">📭</div>
                <h3>No orders for this day</h3>
                <p>You don't have any deliveries scheduled on this date</p>
              </div>
            ) : (
              getOrdersForSelectedDate().map(order => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <div className="order-number">
                      <span className="order-icon">📦</span>
                      <strong>{order.orderNumber}</strong>
                      <span className="order-type-badge" data-type={order.orderType}>
                        {getOrderTypeIcon(order.orderType)} {order.orderType}
                      </span>
                      <span className="priority-badge" data-priority={order.priority}>
                        {getPriorityIcon(order.priority)} {order.priority}
                      </span>
                    </div>
                    <div 
                      className="order-status"
                      style={{ background: getStatusColor(order.status) + '20', color: getStatusColor(order.status) }}
                    >
                      {getStatusIcon(order.status)} {order.status?.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="order-details">
                    <div className="detail-row">
                      <span className="detail-label">Client:</span>
                      <span className="detail-value">{order.client?.name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value"><a href={`tel:${order.client?.phone}`}>{order.client?.phone}</a></span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value"><a href={`yandexnavi://map_search?text=`+order.deliveryAddress}>{order.deliveryAddress}</a></span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Delivery Window:</span>
                      <span className="detail-value">{formatTimeWindow(order.timeWindow?.start, order.timeWindow?.end)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Delivery Period:</span>
                      <span className="detail-value">{formatDeliveryPeriod(order)}</span>
                    </div>
                    {order.notes && (
                      <div className="detail-row">
                        <span className="detail-label">Notes:</span>
                        <span className="detail-value notes">{order.notes}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="order-actions">
                    {getNextStatuses(order.status).map(nextStatus => (
                      <button
                        key={nextStatus}
                        className={`status-btn ${nextStatus}`}
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowStatusModal(true);
                        }}
                      >
                        {nextStatus === 'in_transit' && '🚚 Start Delivery'}
                        {nextStatus === 'delivered' && '✅ Mark Delivered'}
                        {nextStatus === 'assigned' && '📋 Accept Order'}
                        {nextStatus === 'cancelled' && '❌ Cancel Order'}
                      </button>
                    ))}
                    {order.status === 'delivered' && (
                      <div className="completed-badge">
                        ✅ Completed - {new Date(order.updatedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Order Status</h3>
              <button className="close-modal" onClick={() => setShowStatusModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="order-summary">
                <p><strong>Order:</strong> {selectedOrder.orderNumber}</p>
                <p><strong>Client:</strong> {selectedOrder.client?.name}</p>
                <p><strong>Address:</strong> {selectedOrder.deliveryAddress}</p>
                <p><strong>Delivery Window:</strong> {formatTimeWindow(selectedOrder.timeWindow?.start, selectedOrder.timeWindow?.end)}</p>
              </div>
              <div className="status-options">
                <h4>Change status to:</h4>
                {getNextStatuses(selectedOrder.status).map(nextStatus => (
                  <button
                    key={nextStatus}
                    className={`status-option-btn ${nextStatus}`}
                    onClick={() => {
                      if (nextStatus === 'delivered') {
                        if (window.confirm('Confirm that the delivery has been completed?')) {
                          updateOrderStatus(selectedOrder._id, nextStatus);
                        }
                      } else if (nextStatus === 'cancelled') {
                        if (window.confirm('Are you sure you want to cancel this order?')) {
                          updateOrderStatus(selectedOrder._id, nextStatus);
                        }
                      } else {
                        updateOrderStatus(selectedOrder._id, nextStatus);
                      }
                    }}
                  >
                    {nextStatus === 'in_transit' && '🚚 Start Delivery'}
                    {nextStatus === 'delivered' && '✅ Mark as Delivered'}
                    {nextStatus === 'assigned' && '📋 Accept Order'}
                    {nextStatus === 'cancelled' && '❌ Cancel Order'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverPanel;