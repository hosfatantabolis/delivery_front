import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Notifications from '../components/Notifications/Notifications';
import axios from 'axios';
import ClientsManager from '../components/ClientsManager/ClientsManager';
import DriversManager from '../components/DriversManager';
import OrdersManager from '../components/OrdersManager/OrdersManager';
import ConfirmOrders from '../components/ConfirmOrders';
import UsersManager from '../components/UsersManager';

const AdminPanel = () => {
  const { user, logout, socket } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('confirm');
  const [pendingOrders, setPendingOrders] = useState([]);
  
  useEffect(() => {
    if (!user) return;
    fetchPendingOrders();
    
    if (socket) {
      socket.on('order-updated', (order) => {
        if (order.status === 'pending_confirmation') {
          setPendingOrders(prev => [order, ...prev.filter(o => o._id !== order._id)]);
        } else {
          setPendingOrders(prev => prev.filter(o => o._id !== order._id));
        }
      });
    }
    
    return () => socket?.off('order-updated');
  }, [socket, user]);
  
  const fetchPendingOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/orders');
      setPendingOrders(res.data.filter(o => o.status === 'pending_confirmation'));
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  if (!user || user.role !== 'admin') return <div>Access Denied</div>;
  
  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="header-buttons">
           <Notifications /> 
          <button onClick={() => navigate('/register')} className="register-nav-btn">
            + Create New User
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
      
      <div className="tabs">
        <button 
          className={activeTab === 'confirm' ? 'active' : ''}
          onClick={() => setActiveTab('confirm')}
        >
          Confirm Orders ({pendingOrders.length})
        </button>
        <button 
          className={activeTab === 'drivers' ? 'active' : ''}
          onClick={() => setActiveTab('drivers')}
        >
          Drivers
        </button>
        <button 
          className={activeTab === 'clients' ? 'active' : ''}
          onClick={() => setActiveTab('clients')}
        >
          Clients
        </button>
        <button 
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => setActiveTab('orders')}
        >
          All Orders
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Manage Users
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'confirm' && <ConfirmOrders orders={pendingOrders} onConfirm={fetchPendingOrders} />}
        {activeTab === 'drivers' && <DriversManager />}
        {activeTab === 'clients' && <ClientsManager />}
        {activeTab === 'orders' && <OrdersManager />}
        {activeTab === 'users' && <UsersManager />}
      </div>
    </div>
  );
};

export default AdminPanel; // Make sure this is default export