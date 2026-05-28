import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './ClientsManager.css';

const ClientsManager = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [editingClient, setEditingClient] = useState(null);
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
      const res = await axios.get('http://localhost:5000/api/clients');
      setClients(res.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
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
    try {
      if (editingClient) {
        await axios.put(`http://localhost:5000/api/clients/${editingClient._id}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/clients', formData);
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
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Deactivate this client?')) {
      try {
        await axios.delete(`http://localhost:5000/api/clients/${id}`);
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };
  
  return (
    <div className="clients-manager-container">
      <h2>Manage Clients</h2>
      
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Company Name" 
          value={formData.name} 
          onChange={e => setFormData({...formData, name: e.target.value})} 
          required 
        />
        <input 
          type="text" 
          placeholder="Contact Person" 
          value={formData.contactPerson} 
          onChange={e => setFormData({...formData, contactPerson: e.target.value})} 
          required 
        />
        <input 
          type="tel" 
          placeholder="Phone" 
          value={formData.phone} 
          onChange={e => setFormData({...formData, phone: e.target.value})} 
          required 
        />
        <input 
          type="email" 
          placeholder="Email" 
          value={formData.email} 
          onChange={e => setFormData({...formData, email: e.target.value})} 
        />
        
        <div className="addresses-section">
          <label>Addresses</label>
          {formData.addresses.map((address, index) => (
            <div key={index} className="address-entry">
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
              <input
                type="text"
                placeholder="Address"
                value={address.address}
                onChange={(e) => handleAddressChange(index, 'address', e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Instructions (optional)"
                value={address.instructions}
                onChange={(e) => handleAddressChange(index, 'instructions', e.target.value)}
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={address.isDefault}
                  onChange={(e) => handleAddressChange(index, 'isDefault', e.target.checked)}
                />
                Default
              </label>
              {formData.addresses.length > 1 && (
                <button type="button" onClick={() => removeAddress(index)}>Remove</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addAddress}>+ Add Address</button>
        </div>
        
        <select 
          value={formData.status} 
          onChange={e => setFormData({...formData, status: e.target.value})}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button type="submit">{editingClient ? 'Update' : 'Create'} Client</button>
        {editingClient && <button type="button" onClick={() => setEditingClient(null)}>Cancel</button>}
      </form>
      
      <div className="table-wrapper">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Phone</th>
              <th>Addresses</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client._id}>
                <td>{client.name}</td>
                <td>{client.contactPerson}</td>
                <td>{client.phone}</td>
                <td>
                  {client.addresses && client.addresses.map((addr, idx) => (
                    <div key={idx} className="address-item">
                      <strong>{addr.type}:</strong> {addr.address}
                    </div>
                  ))}
                </td>
                <td>{client.status}</td>
                <td>
                  <button onClick={() => {
                    setEditingClient(client);
                    setFormData(client);
                  }}>Edit</button>
                  <button onClick={() => handleDelete(client._id)}>Deactivate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientsManager;