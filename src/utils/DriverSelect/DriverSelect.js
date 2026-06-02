// components/DriverSelect.jsx
import React from "react";

const DriverSelect = ({
  drivers,
  value,
  onChange,
  placeholder = "Assign driver",
  disabled = false,
}) => {
  return (
    <select
      className='assign-driver-select'
      onChange={(e) => onChange(e.target.value)}
      value={value || ""}
      disabled={disabled}
    >
      <option value='' disabled>
        {placeholder}
      </option>
      {drivers.map((driver) => (
        <option key={driver._id} value={driver._id}>
          {driver.name} {driver.phone ? `(${driver.phone})` : ""}
          {driver.currentLoad !== undefined &&
            ` - ${driver.currentLoad} active deliveries`}
        </option>
      ))}
    </select>
  );
};

export default DriverSelect;
