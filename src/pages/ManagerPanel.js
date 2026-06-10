import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
// import Notifications from '../components/Notifications/Notifications';
import ClientsManager from '../components/ClientsManager/ClientsManager';
import OrdersManager from '../components/OrdersManager/OrdersManager';
import Header from '../components/Header/Header';
import { apiSettings } from '../utils/apiSettings';

const ManagerPanel = () => {
  const { user, socket } = useAuth();
  // const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [myOrdersCount, setMyOrdersCount] = useState(0);
  const validTabs = ['orders', 'clients'];

  const activeTab = validTabs.includes(searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'orders'; // Default to 'orders'
  const setActiveTab = (tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    setSearchParams(params);
  };

  // Fetch counts for badges
  const fetchOrderCounts = async () => {
    try {
      const res = await axios.get(`${apiSettings.localServer}/api/orders`);
      // Orders created by this manager
      const myOrders = res.data.filter(
        (order) =>
          order.createdBy?._id === user?.id || order.createdBy === user?.id,
      );
      setMyOrdersCount(myOrders.length);
      // Pending orders (all, for info)
      const pending = res.data.filter(
        (o) => o.status === 'pending_confirmation',
      );
      setPendingOrdersCount(pending.length);
    } catch (error) {
      console.error('Error fetching order counts:', error);
    }
  };

  useEffect(() => {
    fetchOrderCounts();

    if (socket) {
      const handleUpdate = () => {
        fetchOrderCounts();
      };

      socket.on('order-updated', handleUpdate);
      socket.on('order-created', handleUpdate);
      socket.on('client-created', handleUpdate);

      return () => {
        socket.off('order-updated', handleUpdate);
        socket.off('order-created', handleUpdate);
        socket.off('client-created', handleUpdate);
      };
    }
  }, [socket, user?.id]);

  // const handleLogout = () => {
  //   logout();
  //   navigate("/login");
  // };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="manager-panel">
      {/* <div className="header">
        <h1>Manager Dashboard</h1>
        <div className="header-buttons">
          <Notifications />
          <span className="welcome">Welcome, {user.name}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div> */}
      <Header />

      <div className="tabs">
        <button
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => setActiveTab('orders')}
        >
          My Orders ({myOrdersCount})
        </button>
        <button
          className={activeTab === 'clients' ? 'active' : ''}
          onClick={() => setActiveTab('clients')}
        >
          Manage Clients
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'orders' && <OrdersManager />}
        {activeTab === 'clients' && <ClientsManager />}
      </div>
    </div>
  );
};

export default ManagerPanel;
