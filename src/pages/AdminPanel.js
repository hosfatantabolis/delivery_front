import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
// import Notifications from '../components/Notifications/Notifications';
import axios from "axios";
import ClientsManager from "../components/ClientsManager/ClientsManager";
import DriversManager from "../components/DriversManager";
import OrdersManager from "../components/OrdersManager/OrdersManager";
import ConfirmOrders from "../components/ConfirmOrders";
import UsersManager from "../components/UsersManager";
import Header from "../components/Header/Header";

const AdminPanel = () => {
  const { user, socket } = useAuth();
  // const navigate = useNavigate();
  const setActiveTab = (tab) => {
    // Create a new URLSearchParams object to preserve any other existing query params
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    setSearchParams(params);
  };
  const [pendingOrders, setPendingOrders] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ["confirm", "drivers", "clients", "orders", "users"];

  const activeTab = validTabs.includes(searchParams.get("tab"))
    ? searchParams.get("tab")
    : "confirm";

  useEffect(() => {
    if (!user) return;
    fetchPendingOrders();

    if (socket) {
      socket.on("order-updated", (order) => {
        if (order.status === "pending_confirmation") {
          setPendingOrders((prev) => [
            order,
            ...prev.filter((o) => o._id !== order._id),
          ]);
        } else {
          setPendingOrders((prev) => prev.filter((o) => o._id !== order._id));
        }
      });
    }

    return () => socket?.off("order-updated");
  }, [socket, user]);

  const fetchPendingOrders = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/orders");
      setPendingOrders(
        res.data.filter((o) => o.status === "pending_confirmation"),
      );
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // const handleLogout = () => {
  //   logout();
  //   navigate('/login');
  // };

  if (!user || user.role !== "admin") return <div>Доступ запрещен</div>;

  return (
    <div className='admin-panel'>
      {/* <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="header-buttons">
           <Notifications /> 
          <button onClick={() => navigate('/register')} className="register-nav-btn">
            + Создать пользователя
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Выход
          </button>
        </div>
      </div> */}
      <Header />

      <div className='tabs'>
        <button
          className={activeTab === "confirm" ? "active" : ""}
          onClick={() => setActiveTab("confirm")}
        >
          Подтверждение заказов ({pendingOrders.length})
        </button>
        <button
          className={activeTab === "drivers" ? "active" : ""}
          onClick={() => setActiveTab("drivers")}
        >
          Водители
        </button>
        <button
          className={activeTab === "clients" ? "active" : ""}
          onClick={() => setActiveTab("clients")}
        >
          Клиенты
        </button>
        <button
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          Все заказы
        </button>
        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          Управление пользователями
        </button>
      </div>

      <div className='tab-content'>
        {activeTab === "confirm" && (
          <ConfirmOrders
            orders={pendingOrders}
            onConfirm={fetchPendingOrders}
          />
        )}
        {activeTab === "drivers" && <DriversManager />}
        {activeTab === "clients" && <ClientsManager />}
        {activeTab === "orders" && <OrdersManager />}
        {activeTab === "users" && <UsersManager />}
      </div>
    </div>
  );
};

export default AdminPanel; // Make sure this is default export
