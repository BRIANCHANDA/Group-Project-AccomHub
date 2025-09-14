import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Home, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';


const styles = `
  .login-container {
    min-height: 100vh;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    position: relative;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  }

  .bg-decoration {
    position: absolute;
    inset: 0;
    opacity: 0.3;
    pointer-events: none;
  }

  .decoration-1,
  .decoration-2,
  .decoration-3 {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
  }

  .decoration-1 {
    top: 10%;
    left: 10%;
    width: 200px;
    height: 200px;
    background: linear-gradient(45deg, #667eea, #764ba2);
  }

  .decoration-2 {
    bottom: 10%;
    right: 10%;
    width: 300px;
    height: 300px;
    background: linear-gradient(45deg, #f093fb, #f5576c);
  }

  .decoration-3 {
    top: 50%;
    left: 20%;
    width: 150px;
    height: 150px;
    background: linear-gradient(45deg, #4facfe, #00f2fe);
  }

  .login-card {
    width: 100%;
    max-width: 450px;
    position: relative;
    z-index: 1;
  }

  .brand-section {
    text-align: center;
    margin-bottom: 30px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 30px 20px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .logo-container {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 70px;
    height: 70px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 18px;
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    margin-bottom: 20px;
  }

  .brand-title {
    font-size: 32px;
    font-weight: 800;
    color: #2d3748;
    margin: 15px 0 5px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .brand-subtitle {
    color: #4a5568;
    font-size: 16px;
    font-weight: 500;
  }

  .form-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    padding: 40px;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .form-header {
    text-align: center;
    margin-bottom: 35px;
  }

  .form-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
    border-radius: 16px;
    margin-bottom: 20px;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
  }

  .form-title {
    font-size: 28px;
    font-weight: 700;
    color: #1a202c;
    margin: 0 0 8px 0;
  }

  .form-subtitle {
    color: #718096;
    margin: 0;
    font-size: 16px;
  }

  .notification {
    margin-bottom: 25px;
    padding: 15px 18px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 500;
    border: 1px solid transparent;
  }

  .notification.success {
    background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
    color: #22543d;
    border-color: #9ae6b4;
  }

  .notification.error {
    background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
    color: #742a2a;
    border-color: #fc8181;
  }

  .form-group {
    margin-bottom: 25px;
  }

  .form-label {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 10px;
  }

  .input-container {
    position: relative;
  }

  .input-icon {
    position: absolute;
    left: 18px;
    top: 50%;
    transform: translateY(-50%);
    color: #a0aec0;
    pointer-events: none;
    z-index: 2;
    transition: color 0.3s ease;
  }

  .form-input {
    display: block;
    width: 100%;
    padding: 18px 18px 18px 52px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 500;
    background: #ffffff;
    color: #1a202c;
    transition: all 0.3s ease;
    box-sizing: border-box;
  }

  .form-input::placeholder {
    color: #a0aec0;
    font-weight: 400;
  }

  .form-input:hover {
    border-color: #cbd5e0;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
    background: #ffffff;
  }

  .form-input:focus ~ .input-icon,
  .form-input:hover ~ .input-icon {
    color: #3b82f6;
  }

  .form-input.error {
    border-color: #e53e3e;
    background: #fed7d7;
  }

  .form-input.error:focus {
    border-color: #e53e3e;
    box-shadow: 0 0 0 4px rgba(229, 62, 62, 0.15);
  }

  .form-input.error ~ .input-icon {
    color: #e53e3e !important;
  }

  /* Force input text to be visible */
  input[type="email"],
  input[type="password"],
  input[type="text"] {
    color: #000000 !important;
    background-color: #ffffff !important;
  }

  .form-input:disabled {
    background: #f7fafc;
    border-color: #e2e8f0;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .password-toggle {
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #a0aec0;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.3s ease;
    z-index: 2;
  }

  .password-toggle:hover {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }

  .error-message {
    margin-top: 8px;
    font-size: 14px;
    color: #e53e3e;
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
  }

  .form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30px;
    flex-wrap: wrap;
    gap: 15px;
  }

  .checkbox-container {
    display: flex;
    align-items: center;
  }

  .checkbox {
    width: 18px;
    height: 18px;
    margin-right: 10px;
    accent-color: #3b82f6;
    cursor: pointer;
  }

  .checkbox-label {
    font-size: 14px;
    color: #2d3748;
    font-weight: 500;
    cursor: pointer;
    user-select: none;
  }

  .forgot-link {
    font-size: 14px;
    color: #3b82f6;
    text-decoration: none;
    font-weight: 600;
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .forgot-link:hover {
    color: #2563eb;
    background: rgba(59, 130, 246, 0.1);
  }

  .login-button {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 18px 24px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
    color: white;
    font-weight: 600;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    position: relative;
    overflow: hidden;
  }

  .login-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.6s ease;
  }

  .login-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
  }

  .login-button:hover:not(:disabled)::before {
    left: 100%;
  }

  .login-button:active:not(:disabled) {
    transform: translateY(0px);
  }

  .login-button:disabled {
    background: #a0aec0;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .loading-spinner {
    width: 22px;
    height: 22px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 10px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .form-footer {
    margin-top: 30px;
    padding-top: 25px;
    border-top: 1px solid #e2e8f0;
    text-align: center;
  }

  .footer-text {
    font-size: 14px;
    color: #718096;
    font-weight: 500;
  }

  .bottom-info {
    text-align: center;
    margin-top: 25px;
  }

  .help-text {
    color: #4a5568;
    font-size: 14px;
    font-weight: 500;
  }

  .success-dashboard {
    margin-top: 25px;
    padding: 30px;
    background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
    border: 2px solid #9ae6b4;
    border-radius: 16px;
    text-align: center;
  }

  .success-title {
    color: #22543d;
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 15px;
  }

  .success-text {
    color: #276749;
    font-size: 16px;
  }

  @media (max-width: 640px) {
    .login-container {
      padding: 15px;
    }
    
    .form-card {
      padding: 30px 25px;
    }
    
    .brand-title {
      font-size: 26px;
    }
    
    .form-title {
      font-size: 24px;
    }
    
    .form-input {
      padding: 16px 16px 16px 48px;
      font-size: 16px;
    }
    
    .input-icon {
      left: 16px;
    }
    
    .password-toggle {
      right: 16px;
    }
    
    .form-options {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
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

     
      localStorage.setItem('authToken', data.token);

      // Set login success state
      setLoginSuccess(true);

     
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
              <h1 className="brand-title">PlacesForLeaners Admin</h1>
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
            <h1 className="brand-title ">PlacesForLeaners Admin</h1>
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
                Protected by PlacesForLeaners Security
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