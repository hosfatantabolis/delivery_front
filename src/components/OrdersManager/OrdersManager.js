import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import StatusSelect from "../../utils/StatusSelect/StatusSelect";
import OrderTypeSelect from "../../utils/OrderTypeSelect/OrderTypeSelect";
import PrioritySelect from "../../utils/PrioritySelect/PrioritySelect";
import DriverSelect from "../../utils/DriverSelect/DriverSelect";
import FilterSelect from "../../utils/FilterSelect/FilterSelect";
import "./OrdersManager.css";
import "../../utils/utils";
import { apiSettings } from "../../utils/apiSettings";

const OrdersManager = () => {
  const { user, socket } = useAuth();
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [customAddress, setCustomAddress] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    orderType: "delivery",
    deliveryAddress: "",
    deliveryAddressType: "",
    deliveryDateStart: "",
    deliveryDateEnd: "",
    deliveryTimeStart: "",
    deliveryTimeEnd: "",
    notes: "",
    priority: "normal",
  });

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassigningOrder, setReassigningOrder] = useState(null);
  const [selectedNewDriver, setSelectedNewDriver] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [reassigning, setReassigning] = useState(false);

  // Helper functions
  const getStatusColor = (status) => {
    const colors = {
      pending_confirmation: "#ff9800",
      confirmed: "#2196f3",
      assigned: "#9c27b0",
      in_transit: "#ffc107",
      delivered: "#4caf50",
      cancelled: "#f44336",
      rejected: "#f44336",
    };
    return colors[status] || "#757575";
  };

  const getOrderTypeIcon = (type) => {
    switch (type) {
      case "delivery":
        return "🚚";
      case "collection":
        return "📦";
      case "both":
        return "🔄";
      case "complicated":
        return "⚠️";
      default:
        return "📋";
    }
  };

  const getOrderTypeLabel = (type) => {
    switch (type) {
      case "delivery":
        return "Доставка";
      case "collection":
        return "Забор";
      case "both":
        return "Оба";
      case "complicated":
        return "Всё сложно";
      default:
        return type;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "urgent":
        return "🔴";
      case "high":
        return "🟠";
      case "normal":
        return "🟢";
      default:
        return "🟢";
    }
  };

  const formatDeliveryPeriod = (order) => {
    if (!order.deliveryDateStart) return "Not specified";

    const startDate = new Date(order.deliveryDateStart).toLocaleDateString();

    if (!order.deliveryDateEnd) {
      let result = startDate;
      if (order.deliveryTimeStart && order.deliveryTimeEnd) {
        result += ` ${order.deliveryTimeStart} - ${order.deliveryTimeEnd}`;
      } else if (order.deliveryTimeStart) {
        result += ` from ${order.deliveryTimeStart}`;
      } else if (order.deliveryTimeEnd) {
        result += ` until ${order.deliveryTimeEnd}`;
      }
      return result;
    }

    const endDate = new Date(order.deliveryDateEnd).toLocaleDateString();
    let result = `${startDate} - ${endDate}`;

    if (order.deliveryTimeStart && order.deliveryTimeEnd) {
      result += ` at ${order.deliveryTimeStart} - ${order.deliveryTimeEnd}`;
    } else if (order.deliveryTimeStart) {
      result += ` from ${order.deliveryTimeStart}`;
    } else if (order.deliveryTimeEnd) {
      result += ` until ${order.deliveryTimeEnd}`;
    }

    return result;
  };

  // Reassign driver function
  const handleReassignDriver = async (orderId, newDriverId) => {
    if (!newDriverId || newDriverId === "") {
      setError("Please select a driver");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setReassigning(true);
    try {
      await axios.put(
        `${apiSettings.serverName}/api/orders/${orderId}/reassign`,
        {
          newDriverId: newDriverId,
          reason: reassignReason || "Admin reassignment",
        },
      );
      setSuccess(`Order reassigned to new driver successfully!`);
      fetchOrders();
      setShowReassignModal(false);
      setReassigningOrder(null);
      setSelectedNewDriver("");
      setReassignReason("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error reassigning order:", error);
      setError(error.response?.data?.error || "Failed to reassign order");
      setTimeout(() => setError(""), 3000);
    } finally {
      setReassigning(false);
    }
  };

  const openReassignModal = (order) => {
    setReassigningOrder(order);
    setSelectedNewDriver(order.assignedDriver?._id || "");
    setReassignReason("");
    setShowReassignModal(true);
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiSettings.serverName}/api/orders`);

      let filteredOrders = res.data;

      if (user?.role === "manager") {
        filteredOrders = res.data.filter(
          (order) =>
            order.createdBy?._id === user?.id || order.createdBy === user?.id,
        );
      }

      setOrders(filteredOrders);
      setError("");
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await axios.get(`${apiSettings.serverName}/api/clients`);
      setClients(res.data.filter((c) => c.status === "active"));
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await axios.get(
        `${apiSettings.serverName}/api/users/drivers`,
      );
      setDrivers(res.data.filter((d) => d.isActive));
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchClients();
    if (user?.role !== "manager") {
      fetchDrivers();
    }

    if (socket) {
      const handleOrderUpdate = (updatedOrder) => {
        if (user?.role === "manager") {
          if (
            updatedOrder.createdBy?._id === user?.id ||
            updatedOrder.createdBy === user?.id
          ) {
            fetchOrders();
          }
        } else {
          fetchOrders();
        }
        setSuccess(`Order ${updatedOrder.orderNumber} updated`);
        setTimeout(() => setSuccess(""), 3000);
      };

      const handleOrderCreate = (newOrder) => {
        if (user?.role === "manager") {
          if (
            newOrder.createdBy?._id === user?.id ||
            newOrder.createdBy === user?.id
          ) {
            fetchOrders();
          }
        } else {
          fetchOrders();
        }
        setSuccess(`New order ${newOrder.orderNumber} created!`);
        setTimeout(() => setSuccess(""), 3000);
      };

      socket.on("order-updated", handleOrderUpdate);
      socket.on("order-created", handleOrderCreate);

      return () => {
        socket.off("order-updated", handleOrderUpdate);
        socket.off("order-created", handleOrderCreate);
      };
    }
  }, [socket, user]);

  // Form handlers
  const handleClientChange = (clientId) => {
    const client = clients.find((c) => c._id === clientId);
    setSelectedClient(client);
    setSelectedAddressId("");
    setCustomAddress(false);

    setFormData({
      ...formData,
      clientId: clientId,
      deliveryAddress: "",
      deliveryAddressType: "",
    });
  };

  const handleAddressSelect = (addressId, address) => {
    setSelectedAddressId(addressId);
    setCustomAddress(false);
    setFormData({
      ...formData,
      deliveryAddress: address.address,
      deliveryAddressType: address.type,
    });
  };

  const handleCustomAddress = () => {
    setCustomAddress(true);
    setSelectedAddressId("");
    setFormData({
      ...formData,
      deliveryAddress: "",
      deliveryAddressType: "custom",
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.clientId) {
      setError("Please select a client");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!formData.deliveryAddress) {
      setError("Please select or enter a delivery address");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!formData.deliveryDateStart) {
      setError("Please select a delivery start date");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const orderData = {
      clientId: formData.clientId,
      orderType: formData.orderType,
      deliveryAddress: formData.deliveryAddress,
      deliveryAddressType: formData.deliveryAddressType,
      deliveryDateStart: formData.deliveryDateStart,
      deliveryDateEnd: formData.deliveryDateEnd || null,
      deliveryTimeStart: formData.deliveryTimeStart || null,
      deliveryTimeEnd: formData.deliveryTimeEnd || null,
      notes: formData.notes || null,
      priority: formData.priority,
    };

    try {
      if (editingOrder) {
        await axios.put(
          `${apiSettings.serverName}/api/orders/${editingOrder._id}`,
          orderData,
        );
        setSuccess("Order updated successfully!");
      } else {
        await axios.post("${apiSettings.serverName}/api/orders", orderData);
        setSuccess("Order created successfully!");
      }

      fetchOrders();
      resetForm();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error saving order:", error);
      setError(error.response?.data?.error || "Failed to save order");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      await axios.post(
        `${apiSettings.serverName}/api/orders/${orderId}/confirm`,
      );
      setSuccess("Order confirmed successfully!");
      fetchOrders();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error confirming order:", error);
      setError("Failed to confirm order");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleAssignDriver = async (orderId, driverId) => {
    if (!driverId || driverId === "") {
      setError("Please select a driver");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      await axios.put(
        `${apiSettings.serverName}/api/orders/${orderId}/assign`,
        {
          driverId,
        },
      );
      setSuccess(`Driver assigned successfully!`);
      fetchOrders();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error assigning driver:", error);
      setError(error.response?.data?.error || "Failed to assign driver");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await axios.put(`${apiSettings.serverName}/api/orders/${orderId}`, {
        status,
      });
      setSuccess(`Order status updated to ${status}`);
      fetchOrders();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Failed to update status");
      setTimeout(() => setError(""), 3000);
    }
  };

  const resetForm = () => {
    setEditingOrder(null);
    setSelectedClient(null);
    setSelectedAddressId("");
    setCustomAddress(false);
    setFormData({
      clientId: "",
      orderType: "delivery",
      deliveryAddress: "",
      deliveryAddressType: "",
      deliveryDateStart: "",
      deliveryDateEnd: "",
      deliveryTimeStart: "",
      deliveryTimeEnd: "",
      notes: "",
      priority: "normal",
    });
    setShowModal(false);
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      clientId: order.client?._id || order.client,
      orderType: order.orderType || "delivery",
      deliveryAddress: order.deliveryAddress || "",
      deliveryAddressType: order.deliveryAddressType || "",
      deliveryDateStart: order.deliveryDateStart
        ? order.deliveryDateStart.split("T")[0]
        : "",
      deliveryDateEnd: order.deliveryDateEnd
        ? order.deliveryDateEnd.split("T")[0]
        : "",
      deliveryTimeStart: order.deliveryTimeStart || "",
      deliveryTimeEnd: order.deliveryTimeEnd || "",
      notes: order.notes || "",
      priority: order.priority || "normal",
    });

    const client = clients.find(
      (c) => c._id === (order.client?._id || order.client),
    );
    if (client) {
      setSelectedClient(client);
    }

    setShowModal(true);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filterStatus === "all" || order.status === filterStatus;
    const matchesType = filterType === "all" || order.orderType === filterType;
    const matchesSearch =
      searchTerm === "" ||
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  if (loading) return <div className='loading-state'>Загрузка заказов...</div>;

  return (
    <div className='orders-manager'>
      <div className='orders-header'>
        <h2>{user?.role === "manager" ? "My Orders" : "Manage Orders"}</h2>
        <button className='btn-primary' onClick={() => setShowModal(true)}>
          + Создать заказ
        </button>
      </div>

      {error && <div className='alert alert-error'>{error}</div>}
      {success && <div className='alert alert-success'>{success}</div>}

      <div className='orders-stats'>
        <div className='stat-card'>
          <h3>Всего заказов</h3>
          <p className='stat-number'>{orders.length}</p>
        </div>
        <div className='stat-card'>
          <h3>Ожидание</h3>
          <p className='stat-number'>
            {orders.filter((o) => o.status === "pending_confirmation").length}
          </p>
        </div>
        <div className='stat-card'>
          <h3>В пути</h3>
          <p className='stat-number'>
            {orders.filter((o) => o.status === "in_transit").length}
          </p>
        </div>
        <div className='stat-card'>
          <h3>Доставлены</h3>
          <p className='stat-number'>
            {orders.filter((o) => o.status === "delivered").length}
          </p>
        </div>
      </div>

      <div className='search-filter-bar'>
        <div className='search-box'>
          <span className='search-icon'>🔍</span>
          <input
            type='text'
            placeholder='Поиск по номеру заказа или названию клиента'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <FilterSelect
          type='status'
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        />
        <FilterSelect
          type='orderType'
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        />
      </div>

      <div className='orders-table-wrapper'>
        <table className='orders-table'>
          <thead>
            <tr>
              <th>Заказ #</th>
              <th>Клиент</th>
              <th>Тип</th>
              <th>Приоритет</th>
              <th>Адрес</th>
              <th>Дата/Время</th>
              <th>Водитель</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan='9' className='no-data'>
                  Заказы не найдены
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order._id}>
                  <td className='order-number'>{order.orderNumber}</td>
                  <td>
                    <div className='client-info'>
                      <strong>{order.client?.name}</strong>
                      <small>{order.client?.phone}</small>
                    </div>
                  </td>
                  <td className='order-type'>
                    <span
                      className='order-type-badge'
                      data-type={order.orderType}
                    >
                      {getOrderTypeIcon(order.orderType)}{" "}
                      {getOrderTypeLabel(order.orderType)}
                    </span>
                  </td>
                  <td className='priority'>
                    <span className='priority-icon'>
                      {getPriorityIcon(order.priority)}
                    </span>
                    {order.priority || "normal"}
                  </td>
                  <td>
                    <div className='address-info'>
                      <div className='address-text'>
                        {order.deliveryAddress}
                      </div>
                      {order.deliveryAddressType && (
                        <small className='address-type'>
                          ({order.deliveryAddressType})
                        </small>
                      )}
                    </div>
                  </td>
                  <td className='delivery-period'>
                    {formatDeliveryPeriod(order)}
                    {order.deliveryDateEnd &&
                      order.deliveryDateStart !== order.deliveryDateEnd && (
                        <span className='range-badge'>📅 Multi-day</span>
                      )}
                  </td>
                  <td className='driver-cell'>
                    {order.assignedDriver ? (
                      <div className='driver-info'>
                        <span className='driver-name'>
                          {order.assignedDriver.name}
                        </span>
                        {user?.role === "admin" && (
                          <button
                            className='reassign-driver-btn'
                            onClick={() => openReassignModal(order)}
                            title='Reassign to different driver'
                          >
                            🔄 Переназначить
                          </button>
                        )}
                      </div>
                    ) : (
                      user?.role === "admin" && (
                        <DriverSelect
                          drivers={drivers}
                          value=''
                          onChange={(driverId) =>
                            handleAssignDriver(order._id, driverId)
                          }
                          placeholder='Назначить водителя'
                        />
                      )
                    )}
                    {user?.role === "manager" && !order.assignedDriver && (
                      <span className='no-driver'>Ожидание подтверждения</span>
                    )}
                  </td>
                  <td>
                    <div className='status-container'>
                      <StatusSelect
                        value={order.status}
                        onChange={(status) =>
                          handleUpdateStatus(order._id, status)
                        }
                        disabled={
                          user?.role === "manager" &&
                          order.status === "pending_confirmation"
                        }
                        style={{ borderColor: getStatusColor(order.status) }}
                      />
                    </div>
                  </td>
                  <td className='actions'>
                    <button
                      className='btn-view'
                      onClick={() => handleEdit(order)}
                    >
                      👁️ Просмотр
                    </button>
                    {order.status === "pending_confirmation" &&
                      user?.role === "admin" && (
                        <button
                          className='btn-confirm'
                          onClick={() => handleConfirmOrder(order._id)}
                        >
                          ✓ Подтвердить
                        </button>
                      )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Order Modal */}
      {showModal && (
        <div className='modal-overlay' onClick={resetForm}>
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h3>
                {editingOrder ? "Редактирование заказа" : "Создать новый заказ"}
              </h3>
              <button className='close-modal' onClick={resetForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className='order-form'>
              <div className='form-group'>
                <label className='required'>Получатель</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  required
                >
                  <option value=''>Выбрать получателя</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name} - {client.contactPerson} ({client.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className='form-group'>
                <label>Тип заказа</label>
                <OrderTypeSelect
                  value={formData.orderType}
                  onChange={handleInputChange}
                  name='orderType'
                />
              </div>

              {selectedClient && (
                <div className='form-group'>
                  <label className='required'>Адрес</label>

                  {selectedClient.addresses &&
                    selectedClient.addresses.length > 0 && (
                      <div className='addresses-list'>
                        {selectedClient.addresses.map((addr, idx) => (
                          <div key={idx} className='address-option'>
                            <label className='address-radio'>
                              <input
                                type='radio'
                                name='addressOption'
                                checked={
                                  selectedAddressId === addr._id &&
                                  !customAddress
                                }
                                onChange={() =>
                                  handleAddressSelect(addr._id, addr)
                                }
                              />
                              <div className='address-details'>
                                <strong className='address-type-label'>
                                  {addr.type.toUpperCase()}
                                  {addr.isDefault && (
                                    <span className='default-badge'>
                                      {" "}
                                      (Default)
                                    </span>
                                  )}
                                </strong>
                                <p className='address-full'>{addr.address}</p>
                                {addr.instructions && (
                                  <small className='address-instructions'>
                                    📝 {addr.instructions}
                                  </small>
                                )}
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}

                  <div className='address-option custom-option'>
                    <label className='address-radio'>
                      <input
                        type='radio'
                        name='addressOption'
                        value='custom'
                        checked={customAddress}
                        onChange={handleCustomAddress}
                      />
                      <div className='address-details'>
                        <strong>Другой адрес</strong>
                      </div>
                    </label>
                  </div>

                  {customAddress && (
                    <div className='custom-address-input'>
                      <textarea
                        name='deliveryAddress'
                        placeholder='Введите адрес...'
                        value={formData.deliveryAddress}
                        onChange={handleInputChange}
                        required
                        rows='2'
                      />
                    </div>
                  )}
                </div>
              )}

              <div className='form-row'>
                <div className='form-group'>
                  <label className='required'>С какого числа</label>
                  <input
                    type='date'
                    name='deliveryDateStart'
                    value={formData.deliveryDateStart}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className='form-group'>
                  <label>По какое число (опционально)</label>
                  <input
                    type='date'
                    name='deliveryDateEnd'
                    value={formData.deliveryDateEnd}
                    onChange={handleInputChange}
                    min={
                      formData.deliveryDateStart ||
                      new Date().toISOString().split("T")[0]
                    }
                  />
                  <small className='field-hint'>
                    Оставьте это поле пустым для доставки в определенный день
                  </small>
                </div>
              </div>

              <div className='form-row'>
                <div className='form-group'>
                  <label>Время с (опционально)</label>
                  <input
                    type='time'
                    name='deliveryTimeStart'
                    value={formData.deliveryTimeStart}
                    onChange={handleInputChange}
                  />
                </div>
                <div className='form-group'>
                  <label>Время по (опционально)</label>
                  <input
                    type='time'
                    name='deliveryTimeEnd'
                    value={formData.deliveryTimeEnd}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className='form-group'>
                <label>Приоритет</label>
                <PrioritySelect
                  value={formData.priority}
                  onChange={handleInputChange}
                  name='priority'
                />
              </div>

              <div className='form-group'>
                <label>Примечания</label>
                <textarea
                  name='notes'
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows='2'
                  placeholder='Особые указания для водителя или склада...'
                />
              </div>

              <div className='modal-actions'>
                <button type='submit' className='save-btn'>
                  {editingOrder ? "Внести изменения" : "Создать"}
                </button>
                <button
                  type='button'
                  className='cancel-btn'
                  onClick={resetForm}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Driver Modal */}
      {showReassignModal && reassigningOrder && (
        <div
          className='modal-overlay'
          onClick={() => !reassigning && setShowReassignModal(false)}
        >
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h3>Переназначить заказ #{reassigningOrder.orderNumber}</h3>
              <button
                className='close-modal'
                onClick={() => setShowReassignModal(false)}
              >
                ×
              </button>
            </div>

            <div className='modal-body'>
              <div className='reassign-order-info'>
                <p>
                  <strong>Получатель:</strong> {reassigningOrder.client?.name}
                </p>
                <p>
                  <strong>Текущий водитель:</strong>{" "}
                  {reassigningOrder.assignedDriver?.name}
                </p>
                <p>
                  <strong>Адрес:</strong> {reassigningOrder.deliveryAddress}
                </p>
                <p>
                  <strong>Дата:</strong>{" "}
                  {formatDeliveryPeriod(reassigningOrder)}
                </p>
              </div>

              <div className='form-group'>
                <label className='required'>Выбрать другого водителя</label>
                <DriverSelect
                  drivers={drivers}
                  value={selectedNewDriver}
                  onChange={setSelectedNewDriver}
                  disabled={reassigning}
                  placeholder='-- Выбрать водителя --'
                />
              </div>

              <div className='form-group'>
                <label>Причина переназначения (опционально)</label>
                <textarea
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  disabled={reassigning}
                  placeholder='Например: не успевает, оптимизация маршрута, попал в ДТП'
                  rows='3'
                />
              </div>
            </div>

            <div className='modal-actions'>
              <button
                className='cancel-btn'
                onClick={() => setShowReassignModal(false)}
                disabled={reassigning}
              >
                Отмена
              </button>
              <button
                className='save-btn'
                onClick={() =>
                  handleReassignDriver(reassigningOrder._id, selectedNewDriver)
                }
                disabled={reassigning || !selectedNewDriver}
              >
                {reassigning ? "Переназначение..." : "Подтвердить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManager;
