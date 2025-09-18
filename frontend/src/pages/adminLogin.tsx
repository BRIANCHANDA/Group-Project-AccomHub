import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Home, Shield, AlertCircle, CheckCircle, User, Building } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './admin.css'; // Import the same CSS file as the dashboard

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  interface FormErrors {
    email?: string;
    password?: string;
  }
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleInputChange = (e: { target: { name: any; value: any; type: any; checked: any; }; }) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear notifications when user starts typing
    if (notification.message) {
      setNotification({ type: '', message: '' });
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setNotification({ type: '', message: '' });
    
    try {
      console.log('Attempting admin login with:', { 
        email: formData.email,
        rememberMe: formData.rememberMe 
      });
      
      // Make API call to the login endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.user.userType !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }

      // Show success notification
      setNotification({
        type: 'success',
        message: 'Authentication successful! Redirecting to admin dashboard...'
      });

      // Store auth token if needed
      if (formData.rememberMe && data.token) {
        localStorage.setItem('authToken', data.token);
      }

      // Set login success state
      setLoginSuccess(true);

      // Navigate to admin dashboard with adminId
      setTimeout(() => {
        navigate('/Admindashboard', {
          state: { adminId: data.user.id },
          replace: true
        });
      }, 1500);

    } catch (err) {
      console.error('Admin login error:', err);
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Authentication failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = () => {
    setNotification({
      type: 'info',
      message: 'Please contact the system administrator to reset your admin password.'
    });
  };

  if (loginSuccess) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-success-card">
            <div className="success-header">
              <div className="success-icon">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h1 className="success-title">Login Successful!</h1>
              <p className="success-subtitle">Redirecting to admin dashboard...</p>
            </div>
            
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Please wait...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Brand Section - matching dashboard header */}
        <div className="login-brand">
          <div className="logo-container">
            <Home size={24} className="text-white" />
          </div>
          <h1 className="brand-title">PlacesForLeaners</h1>
          <p className="brand-subtitle">Administrator Portal</p>
        </div>

        {/* Login Card */}
        <div className="card login-card">
          <div className="card-header">
            <div className="login-header-icon">
              <Shield size={24} />
            </div>
            <h2 className="card-title">Admin Access</h2>
            <p className="card-subtitle">Sign in to access the admin dashboard</p>
          </div>

          {/* Notification */}
          {notification.message && (
            <div className={`notification ${notification.type === 'success' ? 'success' : notification.type === 'error' ? 'error' : 'info'}`}>
              <div className="notification-icon">
                {notification.type === 'success' ? (
                  <CheckCircle size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
              </div>
              <span className="notification-message">{notification.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="input-container">
                <Mail className="input-icon" size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="Enter admin email"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-container">
                <Lock className="input-icon" size={20} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`form-input password-input ${errors.password ? 'error' : ''}`}
                  placeholder="Enter password"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {/* Form Options */}
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="checkbox"
                />
                <span>Remember me</span>
              </label>
              
              <button
                type="button"
                className="forgot-link"
                onClick={handleForgotPassword}
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="action-button primary login-button"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <User size={16} />
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <div className="security-badge">
              <Lock size={14} />
              <span>Secured by PlacesForLeaners</span>
            </div>
            <p className="help-text">
              Need assistance? Contact your system administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;