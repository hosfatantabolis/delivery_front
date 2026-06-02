// constants/orderConstants.js
export const STATUS_OPTIONS = [
  { value: "pending_confirmation", label: "Ожидание", color: "#ff9800" },
  { value: "confirmed", label: "Подтвержден", color: "#2196f3" },
  { value: "assigned", label: "Назначен", color: "#9c27b0" },
  { value: "in_transit", label: "В пути", color: "#ffc107" },
  { value: "delivered", label: "Доставлен", color: "#4caf50" },
  { value: "cancelled", label: "Отменен", color: "#f44336" },
  { value: "rejected", label: "Отказ", color: "#f44336" },
];

export const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Все статусы" },
  ...STATUS_OPTIONS,
];

export const ORDER_TYPE_OPTIONS = [
  { value: "delivery", label: "🚚 Доставка", icon: "🚚" },
  { value: "collection", label: "📦 Забор", icon: "📦" },
  { value: "both", label: "🔄 Все вместе", icon: "🔄" },
  { value: "complicated", label: "⚠️ Все сложно", icon: "⚠️" },
];

export const PRIORITY_OPTIONS = [
  { value: "normal", label: "🟢 Обычный", icon: "🟢" },
  { value: "high", label: "🟠 Побыстрей бы", icon: "🟠" },
  { value: "urgent", label: "🔴 Жопа в огне", icon: "🔴" },
];
