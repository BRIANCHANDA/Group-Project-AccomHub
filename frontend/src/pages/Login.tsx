import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Navigate to Register
  const handleNavigation = () => {
    navigate('/register');
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      const mockUserType = 'student';
      
      if (mockUserType === 'student') {
        navigate('/student-view');
      } else if (mockUserType === 'landlord') {
        navigate('/landlord-view');
      }
    }, 1500);
  };

  return (
    <div className="login-page">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="logo-container">
            <h1 className="logo">ZIT AccommoHub</h1>
            <h2 className="tagline">Student Accommodation Platform</h2>
          </div>
          <nav className="nav">
            <button 
              className="nav-button" 
              onClick={handleNavigation}
            >
              Create Account
            </button>
          </nav>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="main-content">
        <div className="form-card">
          <div className="form-header">
            <h2 className="form-title">Welcome Back</h2>
            <p className="form-subtitle">Sign in to access your ZIT AccommoHub account</p>
          </div>
          
          {/* Avatar */}
          <div className="avatar-container">
            <div className="avatar">
              <img 
                src="/api/placeholder/120/120" 
                alt="User avatar" 
                className="avatar-image"
              />
            </div>
          </div>
          
          <div className="form-container">
            {error && (
              <div className="error-message">
                <svg xmlns="http://www.w3.org/2000/svg" className="error-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="input-group full-width">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="input-group full-width">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              <div className="forgot-password">
                <a href="#" className="forgot-password-link">
                  Forgot your password?
                </a>
              </div>
              
              <div className="button-container">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`submit-button ${isLoading ? 'loading' : ''}`}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
              
              <div className="sign-in-container">
                <span className="sign-in-text">Don't have an account yet?</span>
                <span className="sign-in-link" onClick={handleNavigation}>
                  Create an account
                </span>
              </div>
            </form>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">ZIT AccommoHub</div>
          <div className="footer-links">
            <a href="#" className="footer-link">About</a>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
            <a href="#" className="footer-link">Contact</a>
          </div>
          <div className="footer-copyright">&copy; 2025 ZIT AccommoHub. All rights reserved.</div>
        </div>
      </footer>

      {/* CSS Styles - Improved for full screen width */}
      <style jsx>{`
        /* Global Styles with Full Width Support */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        html, body {
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        
        .login-page {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          min-width: 100vw;
          width: 100%;
          background-color: #f8f9fa;
          color: #333;
        }
        
        /* Header Styles */
        .header {
          background-color: #ffffff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 1rem 0;
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100vw; /* Full viewport width */
          left: 0;
          right: 0;
        }
        
        .header-container {
          width: 100%;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        }
        
        @media (min-width: 640px) {
          .header-container {
            padding: 0 2rem;
          }
        }
        
        @media (min-width: 1200px) {
          .header-container {
            padding: 0 4rem;
          }
        }
        
        @media (min-width: 1800px) {
          .header-container {
            padding: 0 6rem;
          }
        }
        
        .logo-container {
          display: flex;
          flex-direction: column;
          margin: 0.5rem 0;
        }
        
        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: #6d28d9;
          margin: 0;
        }
        
        .tagline {
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 400;
          margin: 0;
        }
        
        @media (min-width: 640px) {
          .logo {
            font-size: 1.8rem;
          }
          
          .tagline {
            font-size: 0.9rem;
          }
        }
        
        @media (min-width: 1200px) {
          .logo {
            font-size: 2rem;
          }
          
          .tagline {
            font-size: 1rem;
          }
        }
        
        .nav {
          display: flex;
          align-items: center;
          margin: 0.5rem 0;
        }
        
        .nav-button {
          background-color: transparent;
          color: #6d28d9;
          border: 1px solid #6d28d9;
          border-radius: 4px;
          padding: 0.4rem 1rem;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        @media (min-width: 640px) {
          .nav-button {
            padding: 0.5rem 1.25rem;
            font-size: 1rem;
          }
        }
        
        .nav-button:hover {
          background-color: #6d28d9;
          color: white;
        }
        
        /* Main Content Styles */
        .main-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 1rem;
          width: 100vw; /* Full viewport width */
        }
        
        @media (min-width: 640px) {
          .main-content {
            padding: 2rem 1.5rem;
          }
        }
        
        @media (min-width: 1024px) {
          .main-content {
            padding: 3rem 2rem;
          }
        }
        
        @media (min-width: 1800px) {
          .main-content {
            padding: 4rem;
          }
        }
        
        .form-card {
          width: 100%;
          max-width: 90%;
          background-color: #ffffff;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        @media (min-width: 480px) {
          .form-card {
            max-width: 420px;
          }
        }
        
        @media (min-width: 640px) {
          .form-card {
            max-width: 500px;
          }
        }
        
        @media (min-width: 1600px) {
          .form-card {
            max-width: 600px;
          }
        }
        
        .form-header {
          padding: 1.5rem;
          text-align: center;
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        
        @media (min-width: 640px) {
          .form-header {
            padding: 2rem;
          }
        }
        
        .form-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }
        
        .form-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        @media (min-width: 640px) {
          .form-title {
            font-size: 1.8rem;
          }
          
          .form-subtitle {
            font-size: 1rem;
          }
        }
        
        @media (min-width: 1600px) {
          .form-title {
            font-size: 2rem;
          }
          
          .form-subtitle {
            font-size: 1.125rem;
          }
        }
        
        /* Avatar Styles */
        .avatar-container {
          display: flex;
          justify-content: center;
          margin: 1.5rem 0;
        }
        
        @media (min-width: 640px) {
          .avatar-container {
            margin: 2rem 0;
          }
        }
        
        .avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background-color: #e0e7ff;
          border: 4px solid white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        @media (min-width: 640px) {
          .avatar {
            width: 120px;
            height: 120px;
          }
        }
        
        @media (min-width: 1600px) {
          .avatar {
            width: 140px;
            height: 140px;
          }
        }
        
        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .form-container {
          padding: 1.5rem;
        }
        
        @media (min-width: 480px) {
          .form-container {
            padding: 2rem;
          }
        }
        
        @media (min-width: 640px) {
          .form-container {
            padding: 2.5rem 3rem;
          }
        }
        
        .error-message {
          display: flex;
          align-items: center;
          margin-bottom: 1.5rem;
          padding: 0.75rem 1rem;
          background-color: #fef2f2;
          border: 1px solid #fee2e2;
          border-radius: 6px;
          color: #dc2626;
          font-size: 0.875rem;
        }
        
        .error-icon {
          width: 1.25rem;
          height: 1.25rem;
          margin-right: 0.5rem;
          flex-shrink: 0;
        }
        
        .input-group {
          margin-bottom: 1.5rem;
        }
        
        .full-width {
          width: 100%;
        }
        
        .input-label {
          display: block;
          color: #374151;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        
        @media (min-width: 640px) {
          .input-label {
            font-size: 0.95rem;
          }
        }
        
        .input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9rem;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        
        @media (min-width: 640px) {
          .input-field {
            padding: 0.875rem 1rem;
            font-size: 1rem;
          }
        }
        
        .input-field:focus {
          outline: none;
          border-color: #6d28d9;
          box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.1);
        }
        
        .input-field::placeholder {
          color: #9ca3af;
        }
        
        .forgot-password {
          text-align: right;
          margin-bottom: 1.5rem;
        }
        
        .forgot-password-link {
          color: #6d28d9;
          font-size: 0.875rem;
          text-decoration: none;
          transition: color 0.2s;
        }
        
        @media (min-width: 640px) {
          .forgot-password-link {
            font-size: 0.9rem;
          }
        }
        
        .forgot-password-link:hover {
          color: #5b21b6;
          text-decoration: underline;
        }
        
        .button-container {
          margin-top: 1rem;
        }
        
        .submit-button {
          width: 100%;
          padding: 0.875rem;
          background-color: #6d28d9;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        @media (min-width: 640px) {
          .submit-button {
            padding: 1rem;
            font-size: 1rem;
          }
        }
        
        .submit-button:hover {
          background-color: #5b21b6;
        }
        
        .submit-button.loading {
          background-color: #a78bfa;
          cursor: not-allowed;
        }
        
        .sign-in-container {
          margin-top: 1.5rem;
          text-align: center;
          padding: 0.875rem;
          background-color: #f9fafb;
          border-radius: 6px;
        }
        
        @media (min-width: 640px) {
          .sign-in-container {
            margin-top: 2rem;
            padding: 1rem;
          }
        }
        
        .sign-in-text {
          font-size: 0.9rem;
          color: #4b5563;
        }
        
        @media (min-width: 640px) {
          .sign-in-text {
            font-size: 1rem;
          }
        }
        
        .sign-in-link {
          font-size: 0.9rem;
          color: #6d28d9;
          font-weight: 600;
          margin-left: 0.25rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        @media (min-width: 640px) {
          .sign-in-link {
            font-size: 1rem;
            margin-left: 0.375rem;
          }
        }
        
        .sign-in-link:hover {
          color: #5b21b6;
          text-decoration: underline;
        }
        
        /* Footer Styles */
        .footer {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1.5rem 1rem;
          width: 100vw; /* Full viewport width */
          left: 0;
          right: 0;
        }
        
        @media (min-width: 640px) {
          .footer {
            padding: 2rem 0;
          }
        }
        
        .footer-content {
          width: 100%;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        
        @media (min-width: 640px) {
          .footer-content {
            padding: 0 2rem;
          }
        }
        
        @media (min-width: 1200px) {
          .footer-content {
            padding: 0 4rem;
          }
        }
        
        @media (min-width: 1800px) {
          .footer-content {
            padding: 0 6rem;
          }
        }
        
        .footer-logo {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        
        @media (min-width: 640px) {
          .footer-logo {
            font-size: 1.25rem;
          }
        }
        
        .footer-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 1rem;
          gap: 0.5rem;
        }
        
        .footer-link {
          color: #d1d5db;
          text-decoration: none;
          margin: 0 0.5rem;
          font-size: 0.8rem;
          transition: color 0.2s;
        }
        
        @media (min-width: 640px) {
          .footer-link {
            margin: 0 0.75rem;
            font-size: 0.875rem;
          }
        }
        
        .footer-link:hover {
          color: white;
          text-decoration: underline;
        }
        
        .footer-copyright {
          font-size: 0.8rem;
          color: #9ca3af;
        }
        
        @media (min-width: 640px) {
          .footer-copyright {
            font-size: 0.875rem;
          }
        }
        
        @media (min-width: 768px) {
          .footer-content {
            flex-direction: row;
            justify-content: space-between;
            text-align: left;
            flex-wrap: wrap;
          }
          
          .footer-logo {
            margin-bottom: 0;
          }
          
          .footer-links {
            margin-bottom: 0;
            order: 2;
          }
          
          .footer-copyright {
            width: 100%;
            text-align: center;
            order: 3;
            margin-top: 1rem;
          }
        }
        
        @media (min-width: 1024px) {
          .footer-content {
            flex-wrap: nowrap;
          }
          
          .footer-copyright {
            width: auto;
            text-align: right;
            order: 3;
            margin-top: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;