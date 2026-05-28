import React, { useState } from 'react';
import axios from 'axios';

const ConfirmOrders = ({ orders, onConfirm }) => {
  const [selectedOrders, setSelectedOrders] = useState([]);
  
  const handleConfirm = async (orderId) => {
    try {
      await axios.post(`http://localhost:5000/api/orders/${orderId}/confirm`);
      onConfirm();
    } catch (error) {
      console.error('Error confirming order:', error);
    }
  };
  
  const handleBulkConfirm = async () => {
    try {
      await Promise.all(selectedOrders.map(id => 
        axios.post(`http://localhost:5000/api/orders/${id}/confirm`)
      ));
      setSelectedOrders([]);
      onConfirm();
    } catch (error) {
      console.error('Error bulk confirming:', error);
    }
  };
  
  return (
    <div>
      <div className="bulk-actions">
        <button onClick={handleBulkConfirm} disabled={selectedOrders.length === 0}>
          Confirm Selected ({selectedOrders.length})
        </button>
      </div>
      
      <table className="orders-table">
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox" 
                onChange={(e) => {
                  if (e.target.checked) setSelectedOrders(orders.map(o => o._id));
                  else setSelectedOrders([]);
                }} 
              />
            </th>
            <th>Order #</th>
            <th>Client</th>
            <th>Items</th>
            <th>Manager</th>
            <th>Actions</th>
           </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order._id}>
              <td>
                <input 
                  type="checkbox" 
                  checked={selectedOrders.includes(order._id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedOrders([...selectedOrders, order._id]);
                    else setSelectedOrders(selectedOrders.filter(id => id !== order._id));
                  }} 
                />
              </td>
              <td>{order.orderNumber}</td>
              <td>{order.client?.name}</td>
              <td>{order.items?.length || 0} items</td>
              <td>{order.createdBy?.name}</td>
              <td>
                <button onClick={() => handleConfirm(order._id)}>Confirm</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ConfirmOrders; // Default export