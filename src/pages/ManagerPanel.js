import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Notifications from '../components/Notifications';


const ManagerPanel = () => {
  const { user, logout, socket } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    clientId: '',
    items: [{ name: '', quantity: 1, price: 0 }],
    deliveryAddress: '',
    notes: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchClients();
    
    if (socket) {
      socket.on('order-updated', (updatedOrder) => {
        setOrders(prev => prev.map(o => 
          o._id === updatedOrder._id ? updatedOrder : o
        ));
      });
    }
    
    return () => socket?.off('order-updated');
  }, [socket]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/orders');
      setOrders(res.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
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

  const handleCreateOrder = async (e) => {
  e.preventDefault();
  try {
    // Backend only accepts simplified order structure
    const orderData = {
      clientId: newOrder.clientId,
      orderType: 'delivery',
      deliveryAddress: newOrder.deliveryAddress,
      deliveryDateStart: new Date().toISOString().split('T')[0], // Default to today
      notes: newOrder.notes,
      priority: 'normal'
    };
    
    await axios.post('http://localhost:5000/api/orders', orderData);
    setShowCreateOrder(false);
    setNewOrder({
      clientId: '',
      items: [{ name: '', quantity: 1, price: 0 }],
      deliveryAddress: '',
      notes: ''
    });
    fetchOrders();
  } catch (error) {
    console.error('Error creating order:', error);
    alert(error.response?.data?.error || 'Failed to create order');
  }
};

  const addOrderItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { name: '', quantity: 1, price: 0 }]
    });
  };

  const updateOrderItem = (index, field, value) => {
    const updatedItems = [...newOrder.items];
    updatedItems[index][field] = value;
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="manager-panel">
      <div className="header">
        <h1>Manager Dashboard</h1>
        <div className="header-buttons">
          <Notifications />
          <span className="welcome">Welcome, {user.name}</span>
          <button onClick={() => setShowCreateOrder(true)} className="create-order-btn">
            + Create Order
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="stats">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p>{orders.length}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Confirmation</h3>
          <p>{orders.filter(o => o.status === 'pending_confirmation').length}</p>
        </div>
        <div className="stat-card">
          <h3>Active Clients</h3>
          <p>{clients.length}</p>
        </div>
      </div>

      <div className="orders-section">
        <h2>My Orders</h2>
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Client</th>
              <th>Items</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td>{order.orderNumber}</td>
                <td>{order.client?.name}</td>
                <td>{order.items?.length || 0} items</td>
                <td>
                  <span className={`status-badge status-${order.status}`}>
                    {order.status}
                  </span>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Order Modal */}
      {showCreateOrder && (
        <div className="modal-overlay" onClick={() => setShowCreateOrder(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Order</h2>
            <form onSubmit={handleCreateOrder}>
              <select 
                value={newOrder.clientId} 
                onChange={(e) => setNewOrder({...newOrder, clientId: e.target.value})}
                required
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>{client.name}</option>
                ))}
              </select>
              
              <h4>Items:</h4>
              {newOrder.items.map((item, index) => (
                <div key={index} className="order-item">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => updateOrderItem(index, 'name', e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => updateOrderItem(index, 'price', parseFloat(e.target.value))}
                    required
                  />
                </div>
              ))}
              <button type="button" onClick={addOrderItem}>+ Add Item</button>
              
              <input
                type="text"
                placeholder="Delivery Address"
                value={newOrder.deliveryAddress}
                onChange={(e) => setNewOrder({...newOrder, deliveryAddress: e.target.value})}
                required
              />
              
              <textarea
                placeholder="Notes (optional)"
                value={newOrder.notes}
                onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
              />
              
              <div className="modal-buttons">
                <button type="submit">Create Order</button>
                <button type="button" onClick={() => setShowCreateOrder(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPanel;