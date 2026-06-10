import { useAuth } from "../../contexts/AuthContext";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { apiSettings } from "../../utils/apiSettings";

const OrderStats = ({ orders: externalOrders = null }) => {
  const { user, socket } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    completed: 0,
    pending: 0,
  });

  const isOrderOnDate = useCallback((order, date) => {
    if (!order.deliveryDateStart) return false;

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const startDate = new Date(order.deliveryDateStart);
    startDate.setHours(0, 0, 0, 0);

    if (!order.deliveryDateEnd) {
      return startDate.getTime() === checkDate.getTime();
    }

    const endDate = new Date(order.deliveryDateEnd);
    endDate.setHours(23, 59, 59, 999);

    return checkDate >= startDate && checkDate <= endDate;
  }, []);

  const calculateStats = useCallback(
    (driverOrders) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const todayOrders = driverOrders.filter((order) => {
        if (!order.deliveryDateStart) return false;
        return isOrderOnDate(order, new Date());
      });

      const weekOrders = driverOrders.filter((order) => {
        if (!order.deliveryDateStart) return false;
        const orderDate = new Date(order.deliveryDateStart);
        return orderDate >= weekAgo;
      });

      const completedOrders = driverOrders.filter(
        (order) => order.status === "delivered",
      );

      const pendingOrders = driverOrders.filter(
        (order) => order.status !== "delivered" && order.status !== "cancelled",
      );

      setStats({
        today: todayOrders.length,
        week: weekOrders.length,
        completed: completedOrders.length,
        pending: pendingOrders.length,
      });
    },
    [isOrderOnDate],
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiSettings.serverName}/api/orders`);
      let driverOrders = res.data;

      // Filter for driver if user is driver
      if (user.role === "driver") {
        driverOrders = res.data.filter(
          (order) =>
            order.assignedDriver?._id === user?.id ||
            order.assignedDriver === user?.id,
        );
      }

      setOrders(driverOrders);
      calculateStats(driverOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Use external orders if provided, otherwise fetch internally
  useEffect(() => {
    if (externalOrders !== null) {
      // External orders provided as prop
      let driverOrders = externalOrders;
      if (user.role === "driver") {
        driverOrders = externalOrders.filter(
          (order) =>
            order.assignedDriver?._id === user?.id ||
            order.assignedDriver === user?.id,
        );
      }
      setOrders(driverOrders);
      calculateStats(driverOrders);
      setLoading(false);
    } else {
      // Fetch orders internally
      fetchOrders();
    }
  }, [externalOrders, user, calculateStats]);

  // Socket listeners for real-time updates when fetching internally
  useEffect(() => {
    if (externalOrders !== null || !socket) return;

    const handleOrderUpdate = () => {
      fetchOrders();
    };

    socket.on("order-updated", handleOrderUpdate);
    socket.on("order-assigned", handleOrderUpdate);
    socket.on("order-created", handleOrderUpdate);

    return () => {
      socket.off("order-updated", handleOrderUpdate);
      socket.off("order-assigned", handleOrderUpdate);
      socket.off("order-created", handleOrderUpdate);
    };
  }, [socket, externalOrders]);

  if (loading) {
    return <div className='stats-loading'>Loading stats...</div>;
  }

  return (
    <>
      {user?.role === "admin" && (
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
      )}

      {user?.role === "driver" && (
        <div className='stats-grid'>
          <div className='stat-card'>
            <div className='stat-icon'>📦</div>
            <div className='stat-info'>
              <h3>Заказов сегодня</h3>
              <p className='stat-number'>{stats.today}</p>
            </div>
          </div>
          <div className='stat-card'>
            <div className='stat-icon'>📅</div>
            <div className='stat-info'>
              <h3>Неделя</h3>
              <p className='stat-number'>{stats.week}</p>
            </div>
          </div>
          <div className='stat-card'>
            <div className='stat-icon'>✅</div>
            <div className='stat-info'>
              <h3>Завершены</h3>
              <p className='stat-number'>{stats.completed}</p>
            </div>
          </div>
          <div className='stat-card'>
            <div className='stat-icon'>⏳</div>
            <div className='stat-info'>
              <h3>Ожидание</h3>
              <p className='stat-number'>{stats.pending}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderStats;
