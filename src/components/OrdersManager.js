import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './OrdersManager.css';

const OrdersManager = () => {
  const { user, socket } = useAuth();
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [customAddress, setCustomAddress] = useState(false);
const [formData, setFormData] = useState({
  clientId: '',
  orderType: 'delivery',
  deliveryAddress: '',
  deliveryAddressType: '',
  deliveryDateStart: '', // Required
  deliveryDateEnd: '',   // Optional
  deliveryTimeStart: '', // Optional
  deliveryTimeEnd: '',   // Optional
  notes: '',
  priority: 'normal'
});

  useEffect(() => {
    fetchOrders();
    fetchClients();
    fetchDrivers();

    if (socket) {
      socket.on('order-updated', (updatedOrder) => {
        setOrders(prev => prev.map(order => 
          order._id === updatedOrder._id ? updatedOrder : order
        ));
        setSuccess(`Order ${updatedOrder.orderNumber} updated to ${updatedOrder.status}`);
        setTimeout(() => setSuccess(''), 3000);
      });

      socket.on('order-created', (newOrder) => {
        setOrders(prev => [newOrder, ...prev]);
        setSuccess(`New order ${newOrder.orderNumber} created!`);
        setTimeout(() => setSuccess(''), 3000);
      });
    }

    return () => {
      if (socket) {
        socket.off('order-updated');
        socket.off('order-created');
      }
    };
  }, [socket]);

const handleDeliveryDateChange = (e) => {
  setFormData({
    ...formData,
    deliveryDate: e.target.value
  });
};

const handleDeliveryTimeStartChange = (e) => {
  setFormData({
    ...formData,
    deliveryTimeStart: e.target.value
  });
};

const handleDeliveryTimeEndChange = (e) => {
  setFormData({
    ...formData,
    deliveryTimeEnd: e.target.value
  });
};

const handleDateStartChange = (e) => {
  setFormData({
    ...formData,
    deliveryDateStart: e.target.value
  });
};

const handleDateEndChange = (e) => {
  setFormData({
    ...formData,
    deliveryDateEnd: e.target.value
  });
};

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/orders');
      setOrders(res.data);
      setError('');
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/clients');
      setClients(res.data.filter(c => c.status === 'active'));
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users/drivers');
      setDrivers(res.data.filter(d => d.isActive));
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c._id === clientId);
    setSelectedClient(client);
    setSelectedAddressId('');
    setCustomAddress(false);
    
    setFormData({
      ...formData,
      clientId: clientId,
      deliveryAddress: '',
      deliveryAddressType: ''
    });
  };

  const handleAddressSelect = (addressId, address) => {
    setSelectedAddressId(addressId);
    setCustomAddress(false);
    setFormData({
      ...formData,
      deliveryAddress: address.address,
      deliveryAddressType: address.type
    });
  };

  const handleCustomAddress = () => {
    setCustomAddress(true);
    setSelectedAddressId('');
    setFormData({
      ...formData,
      deliveryAddress: '',
      deliveryAddressType: 'custom'
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTimeWindowChange = (field, value) => {
    setFormData({
      ...formData,
      timeWindow: {
        ...formData.timeWindow,
        [field]: value
      }
    });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate required fields
  if (!formData.clientId) {
    setError('Please select a client');
    setTimeout(() => setError(''), 3000);
    return;
  }
  
  if (!formData.deliveryAddress) {
    setError('Please select or enter a delivery address');
    setTimeout(() => setError(''), 3000);
    return;
  }
  
  if (!formData.deliveryDateStart) {
    setError('Please select a delivery start date');
    setTimeout(() => setError(''), 3000);
    return;
  }
  
  // Prepare data for API - MATCH BACKEND EXPECTATION
  const orderData = {
    clientId: formData.clientId,
    orderType: formData.orderType,
    deliveryAddress: formData.deliveryAddress,
    deliveryAddressType: formData.deliveryAddressType,
    deliveryDateStart: formData.deliveryDateStart,
    deliveryDateEnd: formData.deliveryDateEnd || null,
    deliveryTimeStart: formData.deliveryTimeStart || null,
    deliveryTimeEnd: formData.deliveryTimeEnd || null,
    notes: formData.notes || null,
    priority: formData.priority
  };
  
  try {
    if (editingOrder) {
      await axios.put(`http://localhost:5000/api/orders/${editingOrder._id}`, orderData);
      setSuccess('Order updated successfully!');
    } else {
      await axios.post('http://localhost:5000/api/orders', orderData);
      setSuccess('Order created successfully!');
    }
    
    fetchOrders();
    resetForm();
    setTimeout(() => setSuccess(''), 3000);
  } catch (error) {
    console.error('Error saving order:', error);
    setError(error.response?.data?.error || 'Failed to save order');
    setTimeout(() => setError(''), 3000);
  }
};

  const handleConfirmOrder = async (orderId) => {
    try {
      await axios.post(`http://localhost:5000/api/orders/${orderId}/confirm`);
      setSuccess('Order confirmed successfully!');
      fetchOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error confirming order:', error);
      setError('Failed to confirm order');
      setTimeout(() => setError(''), 3000);
    }
  };

const handleAssignDriver = async (orderId, driverId) => {
  console.log('Assigning driver:', { orderId, driverId });
  
  if (!driverId || driverId === '') {
    console.error('No driver selected');
    setError('Please select a driver');
    setTimeout(() => setError(''), 3000);
    return;
  }
  
  try {
    const response = await axios.put(
      `http://localhost:5000/api/orders/${orderId}/assign`,
      { driverId: driverId },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    console.log('Assignment response:', response.data);
    setSuccess(`Driver assigned successfully! Notification sent to driver.`);
    fetchOrders();
    setTimeout(() => setSuccess(''), 3000);
  } catch (error) {
    console.error('Error assigning driver:', error);
    console.error('Error response:', error.response?.data);
    setError(error.response?.data?.error || 'Failed to assign driver');
    setTimeout(() => setError(''), 3000);
  }
};

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${orderId}`, { status });
      setSuccess(`Order status updated to ${status}`);
      fetchOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status');
      setTimeout(() => setError(''), 3000);
    }
  };

 const resetForm = () => {
  setEditingOrder(null);
  setSelectedClient(null);
  setSelectedAddressId('');
  setCustomAddress(false);
  setFormData({
    clientId: '',
    orderType: 'delivery',
    deliveryAddress: '',
    deliveryAddressType: '',
    deliveryDateStart: '',
    deliveryDateEnd: '',
    deliveryTimeStart: '',
    deliveryTimeEnd: '',
    notes: '',
    priority: 'normal'
  });
  setShowModal(false);
};

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      clientId: order.client?._id || order.client,
      orderType: order.orderType || 'delivery',
      deliveryAddress: order.deliveryAddress || '',
      deliveryAddressType: order.deliveryAddressType || '',
      timeWindow: order.timeWindow || { start: '', end: '' },
      notes: order.notes || '',
      priority: order.priority || 'normal'
    });
    
    const client = clients.find(c => c._id === (order.client?._id || order.client));
    if (client) {
      setSelectedClient(client);
    }
    
    setShowModal(true);
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

  const getOrderTypeIcon = (type) => {
    switch(type) {
      case 'delivery': return '🚚';
      case 'collection': return '📦';
      case 'both': return '🔄';
      case 'complicated': return '⚠️';
      default: return '📋';
    }
  };

  const getOrderTypeLabel = (type) => {
    switch(type) {
      case 'delivery': return 'Delivery';
      case 'collection': return 'Collection';
      case 'both': return 'Both';
      case 'complicated': return 'Complicated';
      default: return type;
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

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesType = filterType === 'all' || order.orderType === filterType;
    const matchesSearch = searchTerm === '' || 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  if (loading) return <div className="loading-state">Loading orders...</div>;

  return (
    <div className="orders-manager">
      <div className="orders-header">
        <h2>Manage Orders</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Create Order
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="orders-stats">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-number">{orders.length}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number">{orders.filter(o => o.status === 'pending_confirmation').length}</p>
        </div>
        <div className="stat-card">
          <h3>In Transit</h3>
          <p className="stat-number">{orders.filter(o => o.status === 'in_transit').length}</p>
        </div>
        <div className="stat-card">
          <h3>Delivered</h3>
          <p className="stat-number">{orders.filter(o => o.status === 'delivered').length}</p>
        </div>
      </div>

      <div className="search-filter-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by order # or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="filter-select" 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending_confirmation">Pending Confirmation</option>
          <option value="confirmed">Confirmed</option>
          <option value="assigned">Assigned</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </select>
        <select 
          className="filter-select" 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="delivery">🚚 Delivery</option>
          <option value="collection">📦 Collection</option>
          <option value="both">🔄 Both</option>
          <option value="complicated">⚠️ Complicated</option>
        </select>
      </div>

      <div className="orders-table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Client</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Delivery Address</th>
              <th>Time Window</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">No orders found</td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order._id}>
                  <td className="order-number">{order.orderNumber}</td>
                  <td>
                    <div className="client-info">
                      <strong>{order.client?.name}</strong>
                      <small>{order.client?.phone}</small>
                    </div>
                  </td>
                  <td className="order-type">
                    <span className="order-type-badge" data-type={order.orderType}>
                      {getOrderTypeIcon(order.orderType)} {getOrderTypeLabel(order.orderType)}
                    </span>
                  </td>
                  <td className="priority">
                    <span className="priority-icon">{getPriorityIcon(order.priority)}</span>
                    {order.priority || 'normal'}
                  </td>
                  <td>
                    <div className="address-info">
                      <div className="address-text">{order.deliveryAddress}</div>
                      {order.deliveryAddressType && (
                        <small className="address-type">({order.deliveryAddressType})</small>
                      )}
                    </div>
                  </td>
                  <td className="time-window">
                    {formatTimeWindow(order.timeWindow?.start, order.timeWindow?.end)}
                  </td>
                  <td>
                    {order.assignedDriver ? (
                      <span className="driver-name">{order.assignedDriver.name}</span>
                    ) : (
                      <select 
                        className="assign-driver-select"
                        onChange={(e) => handleAssignDriver(order._id, e.target.value)}
                        value=""
                      >
                        <option value="" disabled>Assign driver</option>
                        {drivers.map(driver => (
                          <option key={driver._id} value={driver._id}>{driver.name}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    <div className="status-container">
                      <select
                        className="status-select"
                        style={{ borderColor: getStatusColor(order.status) }}
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                      >
                        <option value="pending_confirmation">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </td>
                  <td className="actions">
                    <button className="btn-view" onClick={() => handleEdit(order)}>
                      👁️ View
                    </button>
                    {order.status === 'pending_confirmation' && (
                      <button className="btn-confirm" onClick={() => handleConfirmOrder(order._id)}>
                        ✓ Confirm
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Order Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingOrder ? 'Edit Order' : 'Create New Order'}</h3>
              <button className="close-modal" onClick={resetForm}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="order-form">
              <div className="form-group">
                <label className="required">Client</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  required
                >
                  <option value="">Select Client</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.name} - {client.contactPerson} ({client.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Order Type</label>
                <select
                  name="orderType"
                  value={formData.orderType}
                  onChange={handleInputChange}
                >
                  <option value="delivery">🚚 Delivery</option>
                  <option value="collection">📦 Collection</option>
                  <option value="both">🔄 Both</option>
                  <option value="complicated">⚠️ Complicated</option>
                </select>
              </div>

              {selectedClient && (
                <div className="form-group">
                  <label className="required">Delivery Address</label>
                  
                  {selectedClient.addresses && selectedClient.addresses.length > 0 && (
                    <div className="addresses-list">
                      {selectedClient.addresses.map((addr, idx) => (
                        <div key={idx} className="address-option">
                          <label className="address-radio">
                            <input
                              type="radio"
                              name="addressOption"
                              checked={selectedAddressId === addr._id && !customAddress}
                              onChange={() => handleAddressSelect(addr._id, addr)}
                            />
                            <div className="address-details">
                              <strong className="address-type-label">
                                {addr.type.toUpperCase()}
                                {addr.isDefault && <span className="default-badge"> (Default)</span>}
                              </strong>
                              <p className="address-full">{addr.address}</p>
                              {addr.instructions && (
                                <small className="address-instructions">📝 {addr.instructions}</small>
                              )}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="address-option custom-option">
                    <label className="address-radio">
                      <input
                        type="radio"
                        name="addressOption"
                        value="custom"
                        checked={customAddress}
                        onChange={handleCustomAddress}
                      />
                      <div className="address-details">
                        <strong>Enter Custom Address</strong>
                      </div>
                    </label>
                  </div>

                  {customAddress && (
                    <div className="custom-address-input">
                      <textarea
                        name="deliveryAddress"
                        placeholder="Enter delivery address..."
                        value={formData.deliveryAddress}
                        onChange={handleInputChange}
                        required
                        rows="2"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Delivery Date and Time Section */}
              <div className="form-row">
                <div className="form-group">
                  <label className="required">Delivery Date Start</label>
                  <input
                    type="date"
                    value={formData.deliveryDateStart}
                    onChange={handleDateStartChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Delivery Date End (Optional)</label>
                  <input
                    type="date"
                    value={formData.deliveryDateEnd}
                    onChange={handleDateEndChange}
                    min={formData.deliveryDateStart || new Date().toISOString().split('T')[0]}
                  />
                  <small className="field-hint">Leave empty for single day delivery</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Delivery Time Start (Optional)</label>
                  <input
                    type="time"
                    value={formData.deliveryTimeStart}
                    onChange={(e) => setFormData({...formData, deliveryTimeStart: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Delivery Time End (Optional)</label>
                  <input
                    type="time"
                    value={formData.deliveryTimeEnd}
                    onChange={(e) => setFormData({...formData, deliveryTimeEnd: e.target.value})}
                  />
                </div>
                <small className="field-hint full-width">Leave time empty for "any time" delivery</small>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  <option value="normal">🟢 Normal</option>
                  <option value="high">🟠 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Special instructions for the driver..."
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="save-btn">
                  {editingOrder ? 'Update Order' : 'Create Order'}
                </button>
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManager;