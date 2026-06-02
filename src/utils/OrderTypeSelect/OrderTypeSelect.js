// components/OrderTypeSelect.jsx
import React from "react";

const OrderTypeSelect = ({ value, onChange, name = "orderType" }) => {
  return (
    <select name={name} value={value} onChange={onChange}>
      <option value='delivery'>🚚 Delivery</option>
      <option value='collection'>📦 Collection</option>
      <option value='both'>🔄 Both</option>
      <option value='complicated'>⚠️ Complicated</option>
    </select>
  );
};

export default OrderTypeSelect;
