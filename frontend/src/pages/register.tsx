import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegistrationForm = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: ''
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };
  
  // Navigate to Sign in page
  const handleNavigation = () => {
    navigate('/login');
  };
  
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.firstName || formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    
    if (!formData.lastName || formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.userType || !['student', 'landlord'].includes(formData.userType)) {
      newErrors.userType = 'Please select a valid user type';
    }
    
    return newErrors;
  };
  
  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setFormError('');
    const validationErrors = validate();
    
    if (Object.keys(validationErrors).length === 0) {
      setIsLoading(true);
      
      try {
        // Prepare the data for the API
        const registerData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          userType: formData.userType,
          ...(formData.phoneNumber && { phoneNumber: formData.phoneNumber })
        };
        
        // Make the API call to the registration endpoint
        const response = await fetch('/api/auth/register', {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registerData),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          // Handle error response
          throw new Error(data.message || 'Registration failed');
        }
        
        // If registration was successful
        setIsLoading(false);
        alert('Registration successful! Please log in with your credentials.');
        navigate('/login');
      } catch (error) {
        setIsLoading(false);
        
        // Handle specific errors
        if (error instanceof Error && error.message.includes('Email already exists')) {
          setErrors((prev) => ({ ...prev, email: 'This email is already registered' }));
          setFormError('An account with this email already exists');
        } else {
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
          setFormError(`Registration failed: ${errorMessage}`);
        }
      }
    } else {
      setErrors(validationErrors);
      setFormError('Please correct the errors in the form');
    }
  };

  return (
    <div className="registration-page">
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
              Sign In
            </button>
          </nav>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="main-content">
        <div className="form-card">
          <div className="form-header">
            <h2 className="form-title">Create Your Account</h2>
            <p className="form-subtitle">Join ZIT AccommoHub to find the perfect accommodation</p>
          </div>
          
          <div className="form-container">
            {formError && (
              <div className="error-message">
                <svg xmlns="http://www.w3.org/2000/svg" className="error-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {formError}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="input-grid">
                <div className="input-group">
                  <label className="input-label">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`input-field ${errors.firstName ? 'input-error' : ''}`}
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && <p className="error-text">{errors.firstName}</p>}
                </div>
                
                <div className="input-group">
                  <label className="input-label">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`input-field ${errors.lastName ? 'input-error' : ''}`}
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && <p className="error-text">{errors.lastName}</p>}
                </div>
                
                <div className="input-group full-width">
                  <label className="input-label">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className={`input-field ${errors.phoneNumber ? 'input-error' : ''}`}
                    placeholder="Enter your phone number"
                  />
                  {errors.phoneNumber && <p className="error-text">{errors.phoneNumber}</p>}
                </div>
                
                <div className="input-group full-width">
                  <label className="input-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input-field ${errors.email ? 'input-error' : ''}`}
                    placeholder="Enter your email address"
                  />
                  {errors.email && <p className="error-text">{errors.email}</p>}
                </div>
                
                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`input-field ${errors.password ? 'input-error' : ''}`}
                    placeholder="Create a password (min 6 characters)"
                  />
                  {errors.password && <p className="error-text">{errors.password}</p>}
                </div>
                
                <div className="input-group">
                  <label className="input-label">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
                </div>
                
                <div className="input-group full-width">
                  <label className="input-label">Register as</label>
                  <select
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                    className={`select-field ${errors.userType ? 'input-error' : ''}`}
                  >
                    <option value="">Select role</option>
                    <option value="student">Student</option>
                    <option value="landlord">Landlord</option>
                  </select>
                  {errors.userType && <p className="error-text">{errors.userType}</p>}
                </div>
              </div>
              
              <div className="button-container">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`submit-button ${isLoading ? 'loading' : ''}`}
                >
                  {isLoading ? 'Creating Your Account...' : 'Create Account'}
                </button>
              </div>
              
              <div className="sign-in-container">
                <span className="sign-in-text">Already have an account?</span>
                <span className="sign-in-link" onClick={handleNavigation}>
                  Sign in to your account
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

      {/* CSS Styles */}
      <style>{`
        /* Global Styles */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100vw;
          overflow-x: hidden;
        }
        
        .registration-page {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: 100vw;
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
          width: 100vw;
        }
        
        .header-container {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .logo-container {
          display: flex;
          flex-direction: column;
        }
        
        .logo {
          font-size: 1.8rem;
          font-weight: 700;
          color:rgb(48, 0, 126);
          margin: 0;
        }
        
        .tagline {
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: 400;
          margin: 0;
        }
        
        .nav {
          display: flex;
          align-items: center;
        }
        
        .nav-button {
          background-color: transparent;
          colorrgb(48, 0, 126);
          border: 1px solidrgb(48, 0, 126);
          border-radius: 4px;
          padding: 0.5rem 1.25rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .nav-button:hover {
          background-color:rgb(48, 0, 126);
          color: white;
        }
        
        /* Main Content Styles */
        .main-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          width: 100vw;
          min-height: calc(100vh - 150px);
        }
        
        .form-card {
          width: 100%;
          max-width: 1200px;
          background-color: #ffffff;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .form-header {
          padding: 2rem;
          text-align: center;
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .form-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }
        
        .form-subtitle {
          font-size: 1rem;
          color: #6b7280;
        }
        
        .form-container {
          padding: 2rem;
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
        
        .input-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        
        @media (min-width: 640px) {
          .input-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
          }
        }
        
        @media (min-width: 1200px) {
          .input-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
          }
          
          .full-width {
            grid-column: span 3;
          }
        }
        
        .full-width {
          grid-column: 1 / -1;
        }
        
        .input-group {
          margin-bottom: -2rem;
        }
        
        .input-label {
          display: block;
          color: #374151;
          font-size: 0.95rem;
          font-weight: 500;
          margin-bottom: 0.50rem;
        }
        
        .input-field, .select-field {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        
        .input-field:focus, .select-field:focus {
          outline: none;
          border-color:rgb(48, 0, 126);
          box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.1);
        }
        
        .input-field::placeholder {
          color: #9ca3af;
        }
        
        .input-error {
          border-color: #ef4444;
        }
        
        .select-field {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 1.25rem;
          padding-right: 2.5rem;
        }
        
        .error-text {
          font-size: 0.875rem;
          color: #ef4444;
          margin-top: 0.375rem;
        }
        
        .button-container {
          margin-top: 2.5rem;
        }
        
        .submit-button {
          width: 100%;
          padding: 1rem;
          background-color: rgb(48, 0, 126);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .submit-button:hover {
          background-color:rgb(29, 2, 71);
        }
        
        .submit-button.loading {
          background-color: #a78bfa;
          cursor: not-allowed;
        }
        
        .sign-in-container {
          margin-top: 2rem;
          text-align: center;
          padding: 1rem;
          background-color: #f9fafb;
          border-radius: 6px;
        }
        
        .sign-in-text {
          font-size: 1rem;
          color: #4b5563;
        }
        
        .sign-in-link {
          font-size: 1rem;
          color:rgb(48, 0, 126);
          font-weight: 600;
          margin-left: 0.375rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .sign-in-link:hover {
          color:rgb(29, 0, 77);
          text-decoration: underline;
        }
        
        /* Footer Styles */
        .footer {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 2rem 0;
          width: 100vw;
        }
        
        .footer-content {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        
        .footer-logo {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        
        .footer-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 1rem;
        }
        
        .footer-link {
          color: #d1d5db;
          text-decoration: none;
          margin: 0 0.75rem;
          font-size: 0.875rem;
          transition: color 0.2s;
        }
        
        .footer-link:hover {
          color: white;
          text-decoration: underline;
        }
        
        .footer-copyright {
          font-size: 0.875rem;
          color: #9ca3af;
        }
        
        @media (min-width: 768px) {
          .footer-content {
            flex-direction: row;
            justify-content: space-between;
            text-align: left;
          }
          
          .footer-logo {
            margin-bottom: 0;
          }
          
          .footer-links {
            margin-bottom: 0;
          }
        }
        
        /* Large Screen Adaptations */
        @media (min-width: 1400px) {
          .form-card {
            max-width: 1400px;
          }
          
          .header-container, .footer-content {
            max-width: 1400px;
            margin: 0 auto;
          }
          
          .form-container {
            padding: 3rem 4rem;
          }
          
          .form-header {
            padding: 2.5rem;
          }
          
          .form-title {
            font-size: 2.2rem;
          }
          
          .form-subtitle {
            font-size: 1.2rem;
          }
        }
        
        /* TV Size Adaptations */
        @media (min-width: 1920px) {
          .form-card {
            max-width: 1800px;
          }
          
          .header-container, .footer-content {
            max-width: 1800px;
          }
          
          .logo {
            font-size: 2.2rem;
          }
          
          .tagline {
            font-size: 1.1rem;
          }
          
          .form-container {
            padding: 4rem 5rem;
          }
          
          .input-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 2.5rem;
          }
          
          .input-label {
            font-size: 1.1rem;
            margin-bottom: 0.75rem;
          }
          
          .input-field, .select-field {
            padding: 1.1rem 1.25rem;
            font-size: 1.1rem;
          }
          
          .submit-button {
            padding: 1.25rem;
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default RegistrationForm;