import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { apiSettings } from '../utils/apiSettings';

const UsersManager = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${apiSettings.localServer}/api/auth/users`,
      );
      setUsers(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (userId) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        await axios.delete(
          `${apiSettings.localServer}/api/auth/users/${userId}`,
        );
        fetchUsers(); // Refresh the list
      } catch (error) {
        console.error('Error deactivating user:', error);
        alert(error.response?.data?.error || 'Failed to deactivate user');
      }
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="users-manager">
      <h2>System Users ({users.length})</h2>
      <table className="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.phone || '-'}</td>
              <td>
                <span
                  style={{
                    background:
                      user.role === 'admin'
                        ? '#f44336'
                        : user.role === 'manager'
                          ? '#4caf50'
                          : '#2196f3',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  {user.role}
                </span>
              </td>
              <td>
                <span
                  style={{
                    color: user.isActive ? '#4caf50' : '#f44336',
                    fontWeight: 'bold',
                  }}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                {user.isActive &&
                  user.role !== 'admin' &&
                  currentUser?._id !== user._id && (
                    <button
                      onClick={() => handleDeactivate(user._id)}
                      style={{ background: '#f44336', color: 'white' }}
                    >
                      Deactivate
                    </button>
                  )}
                {user.role === 'admin' && (
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    Protected
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersManager;
