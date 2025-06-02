import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Home, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';



const styles = `
  .login-container {
    min-height: 100vh;
    background: whitesmoke;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    position: relative;
    overflow: hidden;
    color:rgb(4, 6, 8);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .bg-decoration {
    position: absolute;
    inset: 0;
    opacity: 0.1;
    pointer-events: none;
    color:black;
  }

  .decoration-1 {
    position: absolute;
    top: 80px;
    left: 80px;
    width: 128px;
    height: 128px;
    background: white;
    border-radius: 50%;
    filter: blur(40px);
  }

  .decoration-2 {
    position: absolute;
    bottom: 80px;
    right: 80px;
    width: 160px;
    height: 160px;
    background: #93c5fd;
    border-radius: 50%;
    filter: blur(40px);
  }

  .decoration-3 {
    position: absolute;
    top: 50%;
    left: 25%;
    width: 96px;
    height: 96px;
    background: #a5b4fc;
    border-radius: 50%;
    filter: blur(40px);
  }

  .login-card {
    width: 100%;
    max-width: 448px;
    position: relative;
    color:black;
  }

  .brand-section {
    text-align: center;
    margin-bottom: 32px;
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
    color:rgb(4, 6, 8);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .logo-container {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    margin-bottom: 16px;
  }

  .brand-title {
    font-size: 30px;
    font-weight: 700;
    color: white;
    margin: 8px 0;
  }

  .brand-subtitle {
    color:rgb(50, 71, 95);
    font-size: 16px;
  }

  .form-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    padding: 32px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .form-header {
    text-align: center;
    margin-bottom: 24px;
  }

  .form-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: #dbeafe;
    border-radius: 50%;
    margin-bottom: 12px;
  }

  .form-title {
    font-size: 24px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .form-subtitle {
    color: #6b7280;
    margin-top: 4px;
    font-size: 14px;
  }

  .notification {
    margin-bottom: 16px;
    padding: 12px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  .notification.success {
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
  }

  .notification.error {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .demo-info {
    margin-bottom: 24px;
    padding: 12px;
    background: #eff6ff;
    border-radius: 8px;
    border: 1px solid #dbeafe;
  }

  .demo-title {
    font-size: 12px;
    color: #1d4ed8;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .demo-text {
    font-size: 12px;
    color: #2563eb;
    margin: 2px 0;
  }

  .form-group {
    margin-bottom: 24px;
  }

  .form-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
  }

  .input-container {
    position: relative;
  }

  .input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    pointer-events: none;
  }

  .form-input {
    display: block;
    width: 100%;
    padding: 12px 12px 12px 40px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 16px;
    background: white;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  .form-input:hover {
    border-color: #9ca3af;
  }

  .form-input:focus {
    outline: none;
    border: 2px solid #3b82f6;
  }

  .form-input.error {
    border-color: #fca5a5;
    background: #fef2f2;
  }

  .form-input:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }

  .password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    padding: 4px;
  }

  .password-toggle:hover {
    color: #6b7280;
  }

  .error-message {
    margin-top: 4px;
    font-size: 14px;
    color: #dc2626;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .checkbox-container {
    display: flex;
    align-items: center;
  }

  .checkbox {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    accent-color: #3b82f6;
  }

  .checkbox-label {
    font-size: 14px;
    color: #374151;
  }

  .forgot-link {
    font-size: 14px;
    color: #3b82f6;
    text-decoration: none;
    font-weight: 500;
    background: none;
    border: none;
    cursor: pointer;
  }

  .forgot-link:hover {
    color: #2563eb;
  }

  .login-button {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    color: white;
    font-weight: 500;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  }

  .login-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  .login-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid transparent;
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .form-footer {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
  }

  .footer-text {
    font-size: 14px;
    color: #6b7280;
  }

  .bottom-info {
    text-align: center;
    margin-top: 24px;
  }

  .help-text {
    color: #bfdbfe;
    font-size: 14px;
  }

  .success-dashboard {
    margin-top: 24px;
    padding: 20px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    text-align: center;
  }

  .success-title {
    color: #166534;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .success-text {
    color: #15803d;
    font-size: 14px;
  }

  @media (max-width: 640px) {
    .login-container {
      padding: 16px;
    }
    
    .form-card {
      padding: 24px;
    }
    
    .brand-title {
      font-size: 24px;
    }
  }
`;

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
    if (errors[name]) {
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
    const newErrors = {};
    
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
      console.log('Attempting login with:', { 
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
        throw new Error('This account is not an admin account');
      }
    if (data.user.userType === 'admin') {
      console.log('Redirecting to admin-view');
      navigate('/Admindashboard', {
        state: { adminId: data.user.id },
      });
    }

    // Show success notification
      setNotification({
        type: 'success',
        message: 'Login successful! Redirecting to dashboard...'
      });

      // Store the token (you might want to use cookies or more secure storage)
      localStorage.setItem('authToken', data.token);

      // Set login success state
      setLoginSuccess(true);

      // Redirect to admin dashboard
      // In a real app, you would use your router (e.g., react-router)
      

    } catch (err) {
      console.error('Login error:', err);
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'An error occurred during sign in'
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
      type: 'error',
      message: 'Please contact the system administrator to reset your password'
    });
  };

 



  if (loginSuccess) {
    return (
      <>
        <style>{styles}</style>
        <div className="login-container">
          <div className="bg-decoration">
            <div className="decoration-1"></div>
            <div className="decoration-2"></div>
            <div className="decoration-3"></div>
          </div>
          
          <div className="login-card">
            <div className="brand-section">
              <div className="logo-container">
                <Home size={32} style={{ color: '#3b82f6' }} />
              </div>
              <h1 className="brand-title">NexNest Admin</h1>
              <p className="brand-subtitle">Login Successful!</p>
            </div>
            
            <div className="form-card">
              <div className="success-dashboard">
                <div className="success-title">🎉 Welcome to Admin Dashboard</div>
                
                <button 
                  onClick={() => {
                    setLoginSuccess(false);
                    setFormData({ email: '', password: '', rememberMe: false });
                    setNotification({ type: '', message: '' });
                  }}
                  className="login-button"
                  style={{ marginTop: '16px' }}
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="login-container">
        {/* Background decoration */}
        <div className="bg-decoration">
          <div className="decoration-1"></div>
          <div className="decoration-2"></div>
          <div className="decoration-3"></div>
        </div>

        <div className="login-card">
          {/* Logo and branding */}
          <div className="brand-section">
            <div className="logo-container">
              <Home size={32} style={{ color: '#3b82f6' }} />
            </div>
            <h1 className="brand-title ">NexNest Admin</h1>
            <p className="brand-subtitle">Secure Administrator Access</p>
          </div>

          {/* Login form card */}
          <div className="form-card">
            {/* Header */}
            <div className="form-header">
              <div className="form-icon">
                <Shield size={24} style={{ color: '#3b82f6' }} />
              </div>
              <h2 className="form-title">Admin Login</h2>
              <p className="form-subtitle">Enter your credentials to access the dashboard</p>
            </div>

            {/* Notification */}
            {notification.message && (
              <div className={`notification ${notification.type}`}>
                {notification.type === 'success' ? (
                  <CheckCircle size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{notification.message}</span>
              </div>
            )}


            <div>
              {/* Email field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="input-container">
                  <div className="input-icon">
                    <Mail size={20} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="admin@nexnest.com"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="error-message">
                    <AlertCircle size={16} />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="input-container">
                  <div className="input-icon">
                    <Lock size={20} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    style={{ paddingRight: '48px' }}
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
                  <p className="error-message">
                    <AlertCircle size={16} />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember me checkbox */}
              <div className="form-options">
                <div className="checkbox-container">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    className="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <label htmlFor="rememberMe" className="checkbox-label">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading}
                className="login-button"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="form-footer">
              <p className="footer-text">
                Protected by NexNest Security
              </p>
            </div>
          </div>

          {/* Additional info */}
          <div className="bottom-info">
            <p className="help-text">
              Need help? Contact your system administrator
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;