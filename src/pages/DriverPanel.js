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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    completed: 0,
    pending: 0
  });

  // Helper: Get all dates between start and end date
  const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    currentDate.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  // Check if an order falls on a specific date (handles date ranges)
  const isOrderOnDate = useCallback((order, date) => {
    if (!order.deliveryDateStart) return false;
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    const startDate = new Date(order.deliveryDateStart);
    startDate.setHours(0, 0, 0, 0);
    
    // If no end date, check only start date
    if (!order.deliveryDateEnd) {
      return startDate.getTime() === checkDate.getTime();
    }
    
    // If end date exists, check if date is within range
    const endDate = new Date(order.deliveryDateEnd);
    endDate.setHours(23, 59, 59, 999);
    
    return checkDate >= startDate && checkDate <= endDate;
  }, []);

  // Check if date is the start of a range
  const isRangeStart = (order, date) => {
    if (!order.deliveryDateStart) return false;
    const startDate = new Date(order.deliveryDateStart);
    const checkDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return startDate.getTime() === checkDate.getTime();
  };

  // Check if date is the end of a range
  const isRangeEnd = (order, date) => {
    if (!order.deliveryDateEnd) return false;
    const endDate = new Date(order.deliveryDateEnd);
    const checkDate = new Date(date);
    endDate.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return endDate.getTime() === checkDate.getTime();
  };

  // Get orders for a specific date
  const getOrdersForDate = useCallback((date) => {
    return orders.filter(order => isOrderOnDate(order, date));
  }, [orders, isOrderOnDate]);

  // Get orders for selected date
  const getOrdersForSelectedDate = useCallback(() => {
    return orders.filter(order => isOrderOnDate(order, selectedDate));
  }, [orders, selectedDate, isOrderOnDate]);

  // Custom tile content for calendar with timeline support
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const dayOrders = getOrdersForDate(date);
    if (dayOrders.length === 0) return null;
    
    // Group orders by their visual representation type
    const rangeOrders = dayOrders.filter(o => o.deliveryDateEnd && o.deliveryDateStart !== o.deliveryDateEnd);
    const singleOrders = dayOrders.filter(o => !o.deliveryDateEnd || o.deliveryDateStart === o.deliveryDateEnd);
    
    return (
      <div className="calendar-tile-content">
        <div className="order-count-badge">{dayOrders.length}</div>
        <div className="timeline-indicators">
          {/* Range orders - show as timeline bars */}
          {rangeOrders.map((order, idx) => {
            const isStart = isRangeStart(order, date);
            const isEnd = isRangeEnd(order, date);
            let barClass = 'timeline-bar';
            
            if (isStart && isEnd) barClass += ' single-day';
            else if (isStart) barClass += ' start';
            else if (isEnd) barClass += ' end';
            else barClass += ' middle';
            
            // Different colors for different priorities
            let priorityClass = '';
            if (order.priority === 'urgent') priorityClass = ' urgent';
            else if (order.priority === 'high') priorityClass = ' high';
            
            return (
              <div 
                key={order._id} 
                className={barClass + priorityClass}
                title={`${order.orderNumber} (${order.priority}): ${order.client?.name}`}
                style={{ 
                  backgroundColor: getPriorityColor(order.priority),
                  width: '100%'
                }}
              >
                <span className="timeline-label">
                  {isStart ? '▶' : isEnd ? '◼' : '─'}
                </span>
              </div>
            );
          })}
          {/* Single orders - show as dots */}
          {singleOrders.map((order, idx) => (
            <div 
              key={order._id} 
              className="single-order-dot"
              style={{ backgroundColor: getPriorityColor(order.priority) }}
              title={`${order.orderNumber} (${order.priority}): ${order.client?.name}`}
            >
              <span className="dot-label">●</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return '#f44336';
      case 'high': return '#ff9800';
      default: return '#4caf50';
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/orders');
      const driverOrders = res.data.filter(order => 
        order.assignedDriver?._id === user?.id || order.assignedDriver === user?.id
      );
      setOrders(driverOrders);
      calculateStats(driverOrders);
      setRefreshTrigger(prev => prev + 1);
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
      if (!order.deliveryDateStart) return false;
      return isOrderOnDate(order, new Date());
    });
    
    const weekOrders = driverOrders.filter(order => {
      if (!order.deliveryDateStart) return false;
      const orderDate = new Date(order.deliveryDateStart);
      return orderDate >= weekAgo;
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

  useEffect(() => {
    fetchOrders();
    
    if (socket) {
      const handleOrderUpdate = () => {
        fetchOrders();
      };
      
      socket.on('order-updated', handleOrderUpdate);
      socket.on('order-assigned', handleOrderUpdate);
      socket.on('order-created', handleOrderUpdate);
      
      return () => {
        socket.off('order-updated', handleOrderUpdate);
        socket.off('order-assigned', handleOrderUpdate);
        socket.off('order-created', handleOrderUpdate);
      };
    }
  }, [socket, user?.id]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setActiveTab('orders');
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${orderId}`, { status: newStatus });
      await fetchOrders();
      setShowStatusModal(false);
      setSelectedOrder(null);
      setSuccess(`Order status updated to ${newStatus}`);
      setTimeout(() => setSuccess(''), 3000);
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

  const formatDeliveryPeriod = (order) => {
    if (!order.deliveryDateStart) return 'Not specified';
    
    const startDate = new Date(order.deliveryDateStart).toLocaleDateString();
    
    if (!order.deliveryDateEnd || order.deliveryDateStart === order.deliveryDateEnd) {
      let result = startDate;
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
    
    const endDate = new Date(order.deliveryDateEnd).toLocaleDateString();
    let result = `${startDate} - ${endDate}`;
    
    if (order.deliveryTimeStart && order.deliveryTimeEnd) {
      result += ` at ${order.deliveryTimeStart} - ${order.deliveryTimeEnd}`;
    } else if (order.deliveryTimeStart) {
      result += ` from ${order.deliveryTimeStart}`;
    } else if (order.deliveryTimeEnd) {
      result += ` until ${order.deliveryTimeEnd}`;
    }
    
    return result;
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return null;
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    return digits;
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
          <button onClick={fetchOrders} className="refresh-btn" title="Refresh orders">
            🔄
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {success && <div className="success-message">{success}</div>}

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
          📅 Timeline Calendar
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 Orders for {selectedDate.toLocaleDateString()}
        </button>
      </div>

      {/* Timeline Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="calendar-tab">
          <div className="calendar-container">
            <Calendar
              key={`calendar-${refreshTrigger}`}
              onChange={setSelectedDate}
              value={selectedDate}
              tileContent={tileContent}
              onClickDay={handleDateClick}
              className="driver-calendar timeline-calendar"
            />
          </div>
          
          <div className="calendar-legend">
            <h3>Timeline Legend</h3>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-bar start" style={{ backgroundColor: '#4caf50' }}></div>
                <span>Start of range (▶)</span>
              </div>
              <div className="legend-item">
                <div className="legend-bar middle" style={{ backgroundColor: '#4caf50' }}></div>
                <span>Middle of range (─)</span>
              </div>
              <div className="legend-item">
                <div className="legend-bar end" style={{ backgroundColor: '#4caf50' }}></div>
                <span>End of range (◼)</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ backgroundColor: '#4caf50' }}></div>
                <span>Single day order (●)</span>
              </div>
              <div className="legend-item">
                <div className="legend-bar urgent" style={{ backgroundColor: '#f44336' }}></div>
                <span>🔴 Urgent priority</span>
              </div>
              <div className="legend-item">
                <div className="legend-bar high" style={{ backgroundColor: '#ff9800' }}></div>
                <span>🟠 High priority</span>
              </div>
              <div className="legend-item">
                <div className="legend-bar" style={{ backgroundColor: '#4caf50' }}></div>
                <span>🟢 Normal priority</span>
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
                      <span className="detail-label">Client Phone:</span>
                      <span className="detail-value">
                        {order.client?.phone ? (
                          <a href={`tel:${formatPhoneNumber(order.client.phone)}`} className="phone-link">
                            📞 {order.client.phone}
                          </a>
                        ) : (
                          'No phone'
                        )}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{order.deliveryAddress}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Delivery Period:</span>
                      <span className="detail-value delivery-period">
                        {formatDeliveryPeriod(order)}
                        {order.deliveryDateEnd && order.deliveryDateStart !== order.deliveryDateEnd && (
                          <span className="range-badge">📅 Multi-day</span>
                        )}
                      </span>
                    </div>
                    
                    {/* Order Creator Info - NEW SECTION */}
                    <div className="creator-section">
                      <div className="detail-row creator-info">
                        <span className="detail-label">Order Creator:</span>
                        <span className="detail-value">
                          👤 {order.createdBy?.name || 'Unknown'}
                        </span>
                      </div>
                      {order.createdBy?.phone && (
                        <div className="detail-row">
                          <span className="detail-label">Creator Phone:</span>
                          <span className="detail-value">
                            <a href={`tel:${formatPhoneNumber(order.createdBy.phone)}`} className="phone-link creator-phone">
                              📞 {order.createdBy.phone}
                            </a>
                          </span>
                        </div>
                      )}
                      {order.createdBy?.email && (
                        <div className="detail-row">
                          <span className="detail-label">Creator Email:</span>
                          <span className="detail-value">
                            <a href={`mailto:${order.createdBy.email}`} className="email-link">
                              ✉️ {order.createdBy.email}
                            </a>
                          </span>
                        </div>
                      )}
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
                <p><strong>Client Phone:</strong> 
                  {selectedOrder.client?.phone ? (
                    <a href={`tel:${formatPhoneNumber(selectedOrder.client.phone)}`} className="phone-link">
                      {selectedOrder.client.phone}
                    </a>
                  ) : 'No phone'}
                </p>
                <p><strong>Address:</strong> {selectedOrder.deliveryAddress}</p>
                <p><strong>Delivery Period:</strong> {formatDeliveryPeriod(selectedOrder)}</p>
                <p><strong>Created by:</strong> {selectedOrder.createdBy?.name || 'Unknown'}</p>
                {selectedOrder.createdBy?.phone && (
                  <p><strong>Creator Phone:</strong> 
                    <a href={`tel:${formatPhoneNumber(selectedOrder.createdBy.phone)}`} className="phone-link">
                      {selectedOrder.createdBy.phone}
                    </a>
                  </p>
                )}
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