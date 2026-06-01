import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import './ClientsManager.css';

const ClientsManager = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    addresses: [{ type: 'shipping', address: '', isDefault: true, instructions: '' }],
    status: 'active'
  });
  
  useEffect(() => {
    fetchClients();
  }, []);
  
  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/clients');
      setClients(res.data);
      setError('');
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddressChange = (index, field, value) => {
    const updatedAddresses = [...formData.addresses];
    updatedAddresses[index][field] = value;
    setFormData({ ...formData, addresses: updatedAddresses });
  };
  
  const addAddress = () => {
    setFormData({
      ...formData,
      addresses: [...formData.addresses, { type: 'shipping', address: '', isDefault: false, instructions: '' }]
    });
  };
  
  const removeAddress = (index) => {
    const updatedAddresses = formData.addresses.filter((_, i) => i !== index);
    setFormData({ ...formData, addresses: updatedAddresses });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (editingClient) {
        await axios.put(`http://localhost:5000/api/clients/${editingClient._id}`, formData);
        setSuccess('Client updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/clients', formData);
        setSuccess('Client created successfully!');
      }
      fetchClients();
      setEditingClient(null);
      setFormData({ 
        name: '', 
        contactPerson: '', 
        phone: '', 
        email: '', 
        addresses: [{ type: 'shipping', address: '', isDefault: true, instructions: '' }],
        status: 'active' 
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving client:', error);
      setError(error.response?.data?.error || 'Failed to save client');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Deactivate this client?')) {
      try {
        await axios.delete(`http://localhost:5000/api/clients/${id}`);
        setSuccess('Client deactivated successfully!');
        fetchClients();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting client:', error);
        setError(error.response?.data?.error || 'Failed to deactivate client');
        setTimeout(() => setError(''), 3000);
      }
    }
  };
  
  if (loading) return <div className="loading">Loading clients...</div>;

  return (
    <div className="clients-manager-container">
      <div className="clients-header">
        <h2>
          {user?.role === 'manager' ? 'My Clients' : 'Manage Clients'}
          <span className="client-count">({clients.length})</span>
        </h2>
        {user?.role === 'manager' && (
          <p className="info-text">You can only see and manage clients you have created.</p>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit} className="client-form">
        <div className="form-row">
          <div className="form-group">
            <label>Company Name *</label>
            <input 
              type="text" 
              placeholder="Company Name" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Contact Person *</label>
            <input 
              type="text" 
              placeholder="Contact Person" 
              value={formData.contactPerson} 
              onChange={e => setFormData({...formData, contactPerson: e.target.value})} 
              required 
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Phone *</label>
            <input 
              type="tel" 
              placeholder="Phone" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              placeholder="Email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
          </div>
        </div>
        
        <div className="addresses-section">
          <label>Addresses *</label>
          {formData.addresses.map((address, index) => (
            <div key={index} className="address-entry">
              <div className="form-row">
                <div className="form-group">
                  <select
                    value={address.type}
                    onChange={(e) => handleAddressChange(index, 'type', e.target.value)}
                  >
                    <option value="shipping">Shipping</option>
                    <option value="billing">Billing</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="office">Office</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <input
                    type="text"
                    placeholder="Address *"
                    value={address.address}
                    onChange={(e) => handleAddressChange(index, 'address', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 3 }}>
                  <input
                    type="text"
                    placeholder="Instructions (optional)"
                    value={address.instructions}
                    onChange={(e) => handleAddressChange(index, 'instructions', e.target.value)}
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={address.isDefault}
                      onChange={(e) => handleAddressChange(index, 'isDefault', e.target.checked)}
                    />
                    Default
                  </label>
                </div>
                {formData.addresses.length > 1 && (
                  <button type="button" className="remove-address-btn" onClick={() => removeAddress(index)}>
                    ✕ Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" className="add-address-btn" onClick={addAddress}>
            + Add Address
          </button>
        </div>
        
        {user?.role === 'admin' && (
          <div className="form-group">
            <select 
              value={formData.status} 
              onChange={e => setFormData({...formData, status: e.target.value})}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        )}
        
        <div className="form-buttons">
          <button type="submit" className="btn-primary">
            {editingClient ? 'Update Client' : 'Create Client'}
          </button>
          {editingClient && (
            <button type="button" className="btn-secondary" onClick={() => setEditingClient(null)}>
              Cancel
            </button>
          )}
        </div>
      </form>
      
      <div className="table-wrapper">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Phone</th>
              <th>Addresses</th>
              {user?.role === 'admin' && <th>Created By</th>}
              {user?.role === 'admin' && <th>Status</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={user?.role === 'admin' ? 7 : 5} className="no-data">
                  {user?.role === 'manager' 
                    ? "You haven't created any clients yet. Click 'Create Client' to add one."
                    : "No clients found"}
                </td>
              </tr>
            ) : (
              clients.map(client => (
                <tr key={client._id}>
                  <td className="client-name">{client.name}</td>
                  <td>{client.contactPerson}</td>
                  <td>{client.phone}</td>
                  <td className="addresses-cell">
                    {client.addresses && client.addresses.map((addr, idx) => (
                      <div key={idx} className="address-item">
                        <span className="address-type-badge">{addr.type}</span>
                        <span className="address-text">{addr.address}</span>
                        {addr.isDefault && <span className="default-badge">Default</span>}
                      </div>
                    ))}
                  </td>
                  {user?.role === 'admin' && (
                    <td>{client.createdBy?.name || 'Unknown'}</td>
                  )}
                  {user?.role === 'admin' && (
                    <td>
                      <span className={`status-badge ${client.status}`}>
                        {client.status}
                      </span>
                    </td>
                  )}
                  <td className="actions-cell">
                    <button 
                      className="btn-edit"
                      onClick={() => {
                        setEditingClient(client);
                        setFormData(client);
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(client._id)}
                    >
                      🗑️ Deactivate
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientsManager;