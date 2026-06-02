// components/PrioritySelect.jsx
import React from "react";
import { PRIORITY_OPTIONS } from "../constants";

const PrioritySelect = ({ value, onChange, name = "priority" }) => {
  return (
    <select name={name} value={value} onChange={onChange}>
      {PRIORITY_OPTIONS.map((option) => {
        return (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        );
      })}
      {/* <option value='normal'>🟢 ОЛбычный</option>
      <option value='high'>🟠 High</option>
      <option value='urgent'>🔴 Urgent</option> */}
    </select>
  );
};

export default PrioritySelect;
