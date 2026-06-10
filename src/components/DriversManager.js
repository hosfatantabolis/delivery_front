import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { apiSettings } from "../utils/apiSettings";

const DriversManager = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    vehicleInfo: "",
    assignedZone: "",
    isActive: true,
  });

  // Fetch all drivers on component mount
  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${apiSettings.serverName}/api/users/drivers`,
      );
      setDrivers(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching drivers:", error);
      setError(error.response?.data?.error || "Failed to fetch drivers");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!editingDriver && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!editingDriver && formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      if (editingDriver) {
        // Update existing driver
        const updateData = {
          name: formData.name,
          phone: formData.phone,
          vehicleInfo: formData.vehicleInfo,
          assignedZone: formData.assignedZone,
          isActive: formData.isActive,
        };

        await axios.put(
          `${apiSettings.serverName}/api/users/drivers/${editingDriver._id}`,
          updateData,
        );
        setSuccess("Данные водителя успешно обновлены!");
      } else {
        // Create new driver
        const driverData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          vehicleInfo: formData.vehicleInfo,
          assignedZone: formData.assignedZone,
        };

        await axios.post(
          `${apiSettings.serverName}/api/users/drivers`,
          driverData,
        );
        setSuccess("Пользователь с привилегиями водителя успешно создан");
      }

      // Reset form and refresh list
      resetForm();
      fetchDrivers();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error saving driver:", error);
      setError(error.response?.data?.error || "Не удалось сохранить");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      email: driver.email,
      password: "",
      confirmPassword: "",
      phone: driver.phone || "",
      vehicleInfo: driver.vehicleInfo || "",
      assignedZone: driver.assignedZone || "",
      isActive: driver.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (driverId) => {
    if (window.confirm("Are you sure you want to deactivate this driver?")) {
      try {
        await axios.delete(
          `${apiSettings.serverName}/api/users/drivers/${driverId}`,
        );
        setSuccess("Успешная деактивация пользователя");
        fetchDrivers();
        setTimeout(() => setSuccess(""), 3000);
      } catch (error) {
        console.error("Error deactivating driver:", error);
        setError(
          error.response?.data?.error || "Неудачная деактивация пользователя",
        );
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  const handleActivate = async (driverId) => {
    try {
      await axios.put(
        `${apiSettings.serverName}/api/users/drivers/${driverId}`,
        {
          isActive: true,
        },
      );
      setSuccess("Успешная деактивация пользователя");
      fetchDrivers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Неудачная деактивация пользователя:", error);
      setError(
        error.response?.data?.error || "Неудачная деактивация пользователя",
      );
      setTimeout(() => setError(""), 3000);
    }
  };

  const resetForm = () => {
    setEditingDriver(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      vehicleInfo: "",
      assignedZone: "",
      isActive: true,
    });
    setShowModal(false);
    setError("");
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className='status-badge active'>Действующий</span>
    ) : (
      <span className='status-badge inactive'>Недействующий</span>
    );
  };

  if (loading) return <div className='loading'>Загрузка водителей...</div>;

  return (
    <div className='drivers-manager'>
      <div className='section-header'>
        <h2>Управление водителями</h2>
        {/* <button onClick={() => setShowModal(true)} className="btn-primary">
          + Добавить водителя
        </button> */}
      </div>

      {error && <div className='error-message'>{error}</div>}
      {success && <div className='success-message'>{success}</div>}

      <div className='drivers-stats'>
        <div className='stat-card'>
          <h3>Всего водителей</h3>
          <p>{drivers.length}</p>
        </div>
        <div className='stat-card'>
          <h3>Действующие</h3>
          <p>{drivers.filter((d) => d.isActive).length}</p>
        </div>
        <div className='stat-card'>
          <h3>Недействующие</h3>
          <p>{drivers.filter((d) => !d.isActive).length}</p>
        </div>
      </div>

      <div className='drivers-table-container'>
        <table className='drivers-table'>
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Информация о ТС</th>
              <th>Зона</th>
              <th>Статус</th>
              <th>Зарегистирован</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan='8' className='no-data'>
                  Не найдено водителей
                </td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr key={driver._id}>
                  <td>
                    <strong>{driver.name}</strong>
                  </td>
                  <td>{driver.email}</td>
                  <td>{driver.phone || "-"}</td>
                  <td>
                    <span className='vehicle-badge'>
                      🚚 {driver.vehicleInfo || "Not assigned"}
                    </span>
                  </td>
                  <td>
                    <span className='zone-badge'>
                      📍 {driver.assignedZone || "Not assigned"}
                    </span>
                  </td>
                  <td>{getStatusBadge(driver.isActive)}</td>
                  <td>{new Date(driver.createdAt).toLocaleDateString()}</td>
                  <td className='actions'>
                    <button
                      onClick={() => handleEdit(driver)}
                      className='btn-edit'
                      title='Edit driver'
                    >
                      ✏️ Редактировать
                    </button>
                    {driver.isActive ? (
                      <button
                        onClick={() => handleDelete(driver._id)}
                        className='btn-delete'
                        title='Deactivate driver'
                      >
                        🔴 Деактивировать
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(driver._id)}
                        className='btn-activate'
                        title='Activate driver'
                      >
                        🟢 Активировать
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Create/Edit Driver */}
      {/* {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h2>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter driver's full name"
                  />
                </div>

                {!editingDriver && (
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="driver@example.com"
                    />
                  </div>
                )}
              </div>

              {!editingDriver && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  <div className="form-group">
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      placeholder="Re-enter password"
                    />
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Vehicle Information</label>
                  <input
                    type="text"
                    name="vehicleInfo"
                    value={formData.vehicleInfo}
                    onChange={handleInputChange}
                    placeholder="e.g., Truck - ABC123, Van - XYZ789"
                  />
                </div>

                <div className="form-group">
                  <label>Assigned Zone</label>
                  <input
                    type="text"
                    name="assignedZone"
                    value={formData.assignedZone}
                    onChange={handleInputChange}
                    placeholder="e.g., North Zone, Downtown, Region A"
                  />
                </div>
              </div>

              {editingDriver && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    />
                    Driver is Active
                  </label>
                </div>
              )}

              <div className="modal-buttons">
                <button type="submit" className="btn-save">
                  {editingDriver ? 'Update Driver' : 'Create Driver'}
                </button>
                <button type="button" onClick={resetForm} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default DriversManager;
