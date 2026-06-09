import Notifications from '../Notifications/Notifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { useState } from 'react';

const Header = () => {
  const { user, logout, socket } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {user.role === 'admin' && (
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <div className="header-buttons">
            <Notifications />
            <button
              onClick={() => navigate('/register')}
              className="register-nav-btn"
            >
              + Создать пользователя
            </button>
            <button onClick={handleLogout} className="logout-btn">
              Выход
            </button>
          </div>
        </div>
      )}

      {user.role === 'driver' && (
        <div className="driver-header">
          <div className="header-left">
            <h1>Водитель</h1>
            <div className="driver-info">
              <span className="driver-name">👨‍✈️ {user?.name}</span>
              {user.vehicleInfo && (
                <span className="vehicle-info">🚚 {user.vehicleInfo}</span>
              )}
              {user?.assignedZone && (
                <span className="zone-info">📍 {user.assignedZone}</span>
              )}
            </div>
          </div>
          <div className="header-right">
            <Notifications />
            {/* <button onClick={fetchOrders} className="refresh-btn" title="Refresh orders">
            🔄
          </button> */}
            <button onClick={handleLogout} className="logout-btn">
              Выход
            </button>
          </div>
        </div>
      )}

      {user.role === 'manager' && (
        <div className="header">
          <h1>Manager Dashboard</h1>
          <div className="header-buttons">
            <Notifications />
            <span className="welcome">Welcome, {user.name}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
