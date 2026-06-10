import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { apiSettings } from "../../utils/apiSettings";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "manager",
    vehicleInfo: "",
    assignedZone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    let value = e.target.value;

    // Auto-format phone number for +7 format
    if (e.target.name === "phone") {
      // Remove all non-digits
      const digits = value.replace(/\D/g, "");

      if (digits.length === 0) {
        value = "";
      } else if (digits.length <= 1) {
        value = "+" + digits;
      } else if (digits.length <= 4) {
        value = "+" + digits;
      } else if (digits.length <= 7) {
        value = "+" + digits.slice(0, 1) + " " + digits.slice(1, 4);
        if (digits.length > 4) value += " " + digits.slice(4);
      } else if (digits.length <= 9) {
        value =
          "+" +
          digits.slice(0, 1) +
          " " +
          digits.slice(1, 4) +
          " " +
          digits.slice(4, 7);
        if (digits.length > 7) value += "-" + digits.slice(7);
      } else {
        value =
          "+" +
          digits.slice(0, 1) +
          " " +
          digits.slice(1, 4) +
          " " +
          digits.slice(4, 7) +
          "-" +
          digits.slice(7, 9) +
          "-" +
          digits.slice(9, 11);
      }
    }

    setFormData({
      ...formData,
      [e.target.name]: value,
    });
    setError("");
  };

  const validatePhone = (phone) => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, "");

    // Check for Russian number format (11 digits starting with 7)
    if (digits.length === 11 && digits[0] === "7") {
      return true;
    }
    // Check for international format with +
    if (phone.match(/^\+\d{1,3}\s?\d{1,4}\s?\d{1,4}-?\d{1,4}-?\d{1,4}$/)) {
      const phoneDigits = phone.replace(/\D/g, "");
      // Accept any phone with 10-15 digits (international)
      return phoneDigits.length >= 10 && phoneDigits.length <= 15;
    }
    return false;
  };

  const formatPhoneForStorage = (phone) => {
    // Return as is, preserving the format the user entered
    // Backend can store it as is
    return phone.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("Имя обязательно для заполнения");
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError("Email обязательно для заполнения");
      setLoading(false);
      return;
    }

    if (!formData.phone.trim()) {
      setError("Номер телефона обязательно для заполнения");
      setLoading(false);
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError(
        "Введите корректный номер телефона (например, +7 912 345-67-89 или +79123456789)",
      );
      setLoading(false);
      return;
    }

    if (!formData.password) {
      setError("Пароль обязательно для заполнения");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Пароль должен быть минимум 6 символов");
      setLoading(false);
      return;
    }

    // Prepare data to send
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formatPhoneForStorage(formData.phone),
      password: formData.password,
      role: formData.role,
    };

    // Add driver fields if role is driver
    if (formData.role === "driver") {
      payload.vehicleInfo = formData.vehicleInfo || "";
      payload.assignedZone = formData.assignedZone || "";
    }

    console.log("Отправка регистрационных данных:", {
      ...payload,
      password: "[HIDDEN]",
    });

    try {
      const response = await axios.post(
        `${apiSettings.serverName}/api/auth/register`,
        payload,
      );
      console.log("Registration response:", response.data);

      setSuccess(
        `Аккаунт ${formData.role} успешно создан! Перенаправление на страницу входа...`,
      );

      // Clear form
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "manager",
        vehicleInfo: "",
        assignedZone: "",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Registration error details:", err);
      console.error("Error response:", err.response);

      const errorMessage =
        err.response?.data?.error ||
        "Регистрация не удалась. Попробуйте снова.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='register-container'>
      <div className='register-card'>
        <h2>Создать аккаунт</h2>

        {error && <div className='error-message'>{error}</div>}
        {success && <div className='success-message'>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className='form-group'>
            <label>Имя и фамилия *</label>
            <input
              type='text'
              name='name'
              value={formData.name}
              onChange={handleChange}
              required
              placeholder='Имя и фамилия'
            />
          </div>

          <div className='form-group'>
            <label>Email *</label>
            <input
              type='email'
              name='email'
              value={formData.email}
              onChange={handleChange}
              required
              placeholder='Введите email'
            />
          </div>

          <div className='form-group'>
            <label>Мобильный телефон *</label>
            <input
              type='tel'
              name='phone'
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder='+7 912 345-67-89'
            />
            <small className='field-hint'>
              Формат: +7 XXX XXX-XX-XX или +79123456789
            </small>
          </div>

          <div className='form-group'>
            <label>Пароль *</label>
            <input
              type='password'
              name='password'
              value={formData.password}
              onChange={handleChange}
              required
              placeholder='Минимум 6 символов'
            />
          </div>

          <div className='form-group'>
            <label>Подтвердить пароль *</label>
            <input
              type='password'
              name='confirmPassword'
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder='Подтвердить пароль'
            />
          </div>

          <div className='form-group'>
            <label>Ваша роль *</label>
            <select
              name='role'
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value='admin'>Администратор</option>
              <option value='manager'>Менеджер</option>
              <option value='driver'>Водитель</option>
            </select>
          </div>

          {/* Driver-specific fields */}
          {formData.role === "driver" && (
            <div className='driver-fields'>
              <div className='form-group'>
                <label>Информация о ТС</label>
                <input
                  type='text'
                  name='vehicleInfo'
                  value={formData.vehicleInfo}
                  onChange={handleChange}
                  placeholder='Номер машины'
                />
              </div>
              <div className='form-group'>
                <label>Присвоенная зона</label>
                <input
                  type='text'
                  name='assignedZone'
                  value={formData.assignedZone}
                  onChange={handleChange}
                  placeholder='город или ТК'
                />
              </div>
            </div>
          )}

          <button type='submit' disabled={loading} className='register-btn'>
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <div className='login-link'>
          Уже есть аккаунт? <a href='/login'>Вход</a>
        </div>
      </div>
    </div>
  );
};

export default Register;
