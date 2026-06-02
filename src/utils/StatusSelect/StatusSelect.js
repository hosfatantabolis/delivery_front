// components/StatusSelect.jsx
import React from "react";
import { STATUS_OPTIONS } from "../constants.js";

const StatusSelect = ({ value, onChange, disabled = false, style = {} }) => {
  const getStatusColor = (status) => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === status);
    return option?.color || "#757575";
  };

  return (
    <select
      className='status-select'
      style={{ borderColor: getStatusColor(value), ...style }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default StatusSelect;
