import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'manager',
    vehicleInfo: '',
    assignedZone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    let value = e.target.value;
    
    // Auto-format phone number for +7 format
    if (e.target.name === 'phone') {
      // Remove all non-digits
      const digits = value.replace(/\D/g, '');
      
      if (digits.length === 0) {
        value = '';
      } else if (digits.length <= 1) {
        value = '+' + digits;
      } else if (digits.length <= 4) {
        value = '+' + digits;
      } else if (digits.length <= 7) {
        value = '+' + digits.slice(0, 1) + ' ' + digits.slice(1, 4);
        if (digits.length > 4) value += ' ' + digits.slice(4);
      } else if (digits.length <= 9) {
        value = '+' + digits.slice(0, 1) + ' ' + digits.slice(1, 4) + ' ' + digits.slice(4, 7);
        if (digits.length > 7) value += '-' + digits.slice(7);
      } else {
        value = '+' + digits.slice(0, 1) + ' ' + digits.slice(1, 4) + ' ' + digits.slice(4, 7) + '-' + digits.slice(7, 9) + '-' + digits.slice(9, 11);
      }
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value
    });
    setError('');
  };

  const validatePhone = (phone) => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Check for Russian number format (11 digits starting with 7)
    if (digits.length === 11 && digits[0] === '7') {
      return true;
    }
    // Check for international format with +
    if (phone.match(/^\+\d{1,3}\s?\d{1,4}\s?\d{1,4}-?\d{1,4}-?\d{1,4}$/)) {
      const phoneDigits = phone.replace(/\D/g, '');
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
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required');
      setLoading(false);
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError('Please enter a valid phone number (e.g., +7 912 345-67-89 or +79123456789)');
      setLoading(false);
      return;
    }

    if (!formData.password) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    // Prepare data to send
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formatPhoneForStorage(formData.phone),
      password: formData.password,
      role: formData.role
    };

    // Add driver fields if role is driver
    if (formData.role === 'driver') {
      payload.vehicleInfo = formData.vehicleInfo || '';
      payload.assignedZone = formData.assignedZone || '';
    }

    console.log('Sending registration data:', { ...payload, password: '[HIDDEN]' });

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', payload);
      console.log('Registration response:', response.data);
      
      setSuccess(`Account created successfully as ${formData.role}! Redirecting to login...`);
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'manager',
        vehicleInfo: '',
        assignedZone: ''
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      console.error('Registration error details:', err);
      console.error('Error response:', err.response);
      
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Create Account</h2>
        <p className="subtitle">Register for an account</p>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Mobile Phone *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+7 912 345-67-89"
            />
            <small className="field-hint">Format: +7 XXX XXX-XX-XX or +79123456789</small>
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
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
              onChange={handleChange}
              required
              placeholder="Re-enter password"
            />
          </div>

          <div className="form-group">
            <label>Register as *</label>
            <select name="role" value={formData.role} onChange={handleChange} required>
              <option value="admin">Admin (Full Access)</option>
              <option value="manager">Manager</option>
              <option value="driver">Driver</option>
            </select>
          </div>

          {/* Driver-specific fields */}
          {formData.role === 'driver' && (
            <div className="driver-fields">
              <div className="form-group">
                <label>Vehicle Info</label>
                <input
                  type="text"
                  name="vehicleInfo"
                  value={formData.vehicleInfo}
                  onChange={handleChange}
                  placeholder="e.g., Truck - Plate ABC123"
                />
              </div>
              <div className="form-group">
                <label>Assigned Zone</label>
                <input
                  type="text"
                  name="assignedZone"
                  value={formData.assignedZone}
                  onChange={handleChange}
                  placeholder="e.g., Zone A, North Region"
                />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="register-btn">
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="login-link">
          Already have an account? <a href="/login">Login here</a>
        </div>

        <div className="info-box">
          <h4>Account Types:</h4>
          <ul>
            <li><strong>Admin:</strong> Full system access (manage users, confirm orders, all privileges)</li>
            <li><strong>Manager:</strong> Create orders, edit orders, manage clients</li>
            <li><strong>Driver:</strong> View assigned orders, update delivery status</li>
          </ul>
          <p className="note">Note: Your phone number will be visible to drivers for contact purposes.</p>
        </div>
      </div>
    </div>
  );
};

export default Register;