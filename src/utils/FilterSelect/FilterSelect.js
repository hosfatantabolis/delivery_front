// components/FilterSelect.jsx
import React from "react";
import { STATUS_FILTER_OPTIONS, ORDER_TYPE_OPTIONS } from "../constants.js";

const FilterSelect = ({
  type = "status",
  value,
  onChange,
  customOptions = null,
}) => {
  const getOptions = () => {
    if (customOptions) return customOptions;
    if (type === "status") return STATUS_FILTER_OPTIONS;
    if (type === "orderType") return ORDER_TYPE_OPTIONS;
    return [];
  };

  return (
    <select className='filter-select' value={value} onChange={onChange}>
      {getOptions().map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default FilterSelect;
