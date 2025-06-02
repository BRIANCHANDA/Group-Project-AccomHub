import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './bootstrap-5.3.5-dist/css/bootstrap.min.css';
import { Form, Button, Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';

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
  
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    userType?: string;
  }>({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [colorScheme, setColorScheme] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });
  
  // Color schemes - will rotate
  const colorSchemes = [
    {
      name: 'Blue',
      primary: '#0056b3',
      primaryDark: '#004085',
      primaryLight: '#3d80d4',
      primaryVeryLight: '#ebf5ff',
      secondary: '#4da3ff',
      accent: '#ff9800'
    },
  ];
  
  // Animation effect on component mount
  useEffect(() => {
    setAnimateIn(true);
    return () => clearInterval();
  }, []);

  // Enhanced email validation
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };

  // Enhanced phone number validation (supports multiple formats)
  const validatePhoneNumber = (phone) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check various phone number formats
    const patterns = [
      /^\d{10}$/, // 1234567890
      /^\d{11}$/, // 12345678901 (with country code)
      /^\d{12}$/, // 123456789012 (international format)
    ];
    
    return patterns.some(pattern => pattern.test(cleaned)) && cleaned.length >= 10;
  };

  // Enhanced password validation with strength checking
  const validatePassword = (password) => {
    const minLength = 8;
    const feedback = [];
    let score = 0;
    
    // Check length
    if (password.length < minLength) {
      feedback.push(`Password must be at least ${minLength} characters long`);
    } else {
      score += 1;
    }
    
    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }
    
    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }
    
    // Check for number
    if (!/\d/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else {
      score += 1;
    }
    
    // Check for special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    } else {
      score += 1;
    }
    
    // Check for common patterns to avoid
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /(.)\1{2,}/ // Three or more consecutive identical characters
    ];
    
    if (commonPatterns.some(pattern => pattern.test(password))) {
      feedback.push('Password contains common patterns that should be avoided');
      score = Math.max(0, score - 1);
    }
    
    return { score, feedback, isValid: score >= 5 && feedback.length === 0 };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Real-time password strength checking
    if (name === 'password') {
      const strength = validatePassword(value);
      setPasswordStrength(strength);
    }
    
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
    const newErrors: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      userType?: string;
    } = {};
    
    // First name validation
    if (!formData.firstName || formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.firstName.trim())) {
      newErrors.firstName = 'First name can only contain letters, spaces, hyphens, and apostrophes';
    }
    
    // Last name validation
    if (!formData.lastName || formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.lastName.trim())) {
      newErrors.lastName = 'Last name can only contain letters, spaces, hyphens, and apostrophes';
    }
    
    // Phone number validation (if provided)
    if (formData.phoneNumber && formData.phoneNumber.trim()) {
      if (!validatePhoneNumber(formData.phoneNumber)) {
        newErrors.phoneNumber = 'Please enter a valid phone number (10-12 digits)';
      }
    }
    
    // Email validation
    if (!formData.email || formData.email.trim() === '') {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.feedback[0] || 'Password does not meet security requirements';
      }
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // User type validation
    if (!formData.userType || !['student', 'landlord'].includes(formData.userType)) {
      newErrors.userType = 'Please select a valid user type';
    }
    
    return newErrors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const validationErrors = validate();
    
    if (Object.keys(validationErrors).length === 0) {
      setIsLoading(true);
      
      try {
        // Prepare the data for the API
        const registerData = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          userType: formData.userType,
          ...(formData.phoneNumber && formData.phoneNumber.trim() && { 
            phoneNumber: formData.phoneNumber.replace(/\D/g, '') // Store only digits
          })
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
        
        // If registration was successful, show success animation and redirect
        setIsLoading(false);
        
        // Create success animation element
        const successOverlay = document.createElement('div');
        successOverlay.className = 'success-overlay';
        successOverlay.innerHTML = `
          <div class="success-animation">
            <div class="checkmark-circle">
              <div class="checkmark draw"></div>
            </div>
            <h3 class="success-text">Registration Successful!</h3>
          </div>
        `;
        document.body.appendChild(successOverlay);
        
        // Remove overlay after animation and redirect
        setTimeout(() => {
          document.body.removeChild(successOverlay);
          navigate('/login');
        }, 2500);
        
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

  // Get password strength color and text
  const getPasswordStrengthInfo = () => {
    if (!formData.password) return { color: '#dee2e6', text: '', width: 0 };
    
    const { score } = passwordStrength;
    
    if (score <= 1) return { color: '#dc3545', text: 'Very Weak', width: 20 };
    if (score === 2) return { color: '#fd7e14', text: 'Weak', width: 40 };
    if (score === 3) return { color: '#ffc107', text: 'Fair', width: 60 };
    if (score === 4) return { color: '#28a745', text: 'Good', width: 80 };
    return { color: '#198754', text: 'Strong', width: 100 };
  };

  // Get current color scheme
  const currentScheme = colorSchemes[colorScheme];

  return (
    <div 
      className={`registration-page ${animateIn ? 'fade-in' : ''}`}
      style={{ 
        ['--primary' as string]: currentScheme.primary,
        ['--primary-dark' as string]: currentScheme.primaryDark,
        ['--primary-light' as string]: currentScheme.primaryLight,
        ['--primary-very-light' as string]: currentScheme.primaryVeryLight,
        ['--secondary' as string]: currentScheme.secondary,
        ['--accent' as string]: currentScheme.accent,
      } as React.CSSProperties}
    >
      {/* Header */}
      <header className="header shadow-sm sticky-top">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center py-3">
            <div className="brand-container">
              <h1 className="brand-logo mb-0">NexNest</h1>
            </div>
            <nav>
              <Button 
                variant="outline-primary"
                onClick={handleNavigation}
                className="fw-medium signin-btn"
              >
                Sign In
              </Button>
            </nav>
          </div>
        </Container>
      </header>
      
      {/* Main Content - Full Width */}
      <main className="main-content py-4">
        <Container fluid>
          <Row>
            <Col lg={4} className="info-section d-none d-lg-flex">
              <div className="info-content">
                <h2 className="info-title mb-4">Find Your Perfect Student Accommodation</h2>
                <div className="info-features">
                  <div className="feature-item">
                    <div className="feature-icon">
                      <i className="bi bi-house-door"></i>
                    </div>
                    <div className="feature-text">
                      <h4>Wide Selection</h4>
                      <p>Browse through hundreds of verified student accommodations</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon">
                      <i className="bi bi-shield-check"></i>
                    </div>
                    <div className="feature-text">
                      <h4>Trusted Platform</h4>
                      <p>All listings are verified for your peace of mind</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon">
                      <i className="bi bi-chat-dots"></i>
                    </div>
                    <div className="feature-text">
                      <h4>Direct Communication</h4>
                      <p>Connect directly with landlords or property managers</p>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            
            <Col lg={8} className="form-section">
              <Card className={`border-0 shadow-lg form-card ${animateIn ? 'slide-up' : ''}`}>
                <Card.Header className="py-4 border-bottom">
                  <h2 className="fw-bold mb-2">Create Your Account</h2>
                  <p className="text-secondary mb-0">Join NexNest to find the perfect accommodation</p>
                </Card.Header>
                
                <Card.Body className="p-4">
                  {formError && (
                    <Alert variant="danger" className="d-flex align-items-center alert-animated">
                      <i className="bi bi-exclamation-circle-fill me-2"></i>
                      {formError}
                    </Alert>
                  )}
                  
                  <Form onSubmit={handleSubmit}>
                    <Row className="g-4">
                      <Col md={6}>
                        <Form.Group controlId="firstName" className="input-group-animation">
                          <Form.Label className="fw-medium">First Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            isInvalid={!!errors.firstName}
                            placeholder="Enter your first name"
                            className="py-2"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.firstName}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group controlId="lastName" className="input-group-animation">
                          <Form.Label className="fw-medium">Last Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            isInvalid={!!errors.lastName}
                            placeholder="Enter your last name"
                            className="py-2"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.lastName}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group controlId="phoneNumber" className="input-group-animation">
                          <Form.Label className="fw-medium">Phone Number (Optional)</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            isInvalid={!!errors.phoneNumber}
                            placeholder="e.g., +260 971 234567"
                            className="py-2"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.phoneNumber}
                          </Form.Control.Feedback>
                          <Form.Text className="text-muted">
                            Enter 10-12 digits (with or without country code)
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group controlId="email" className="input-group-animation">
                          <Form.Label className="fw-medium">Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            isInvalid={!!errors.email}
                            placeholder="Enter your email address"
                            className="py-2"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.email}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group controlId="password" className="input-group-animation">
                          <Form.Label className="fw-medium">New Password</Form.Label>
                          <Form.Control
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            isInvalid={!!errors.password}
                            placeholder="Create a strong password"
                            className="py-2"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.password}
                          </Form.Control.Feedback>
                          
                          {/* Password Strength Indicator */}
                          {formData.password && (
                            <div className="password-strength-container mt-2">
                              <div className="password-strength-bar">
                                <div 
                                  className="password-strength-fill"
                                  style={{ 
                                    width: `${getPasswordStrengthInfo().width}%`,
                                    backgroundColor: getPasswordStrengthInfo().color
                                  }}
                                ></div>
                              </div>
                              <div className="d-flex justify-content-between align-items-center mt-1">
                                <small 
                                  className="password-strength-text"
                                  style={{ color: getPasswordStrengthInfo().color }}
                                >
                                  {getPasswordStrengthInfo().text}
                                </small>
                              </div>
                              {passwordStrength.feedback.length > 0 && (
                                <div className="password-requirements mt-2">
                                  <small className="text-muted">Password requirements:</small>
                                  <ul className="password-feedback-list">
                                    {passwordStrength.feedback.map((feedback, index) => (
                                      <li key={index} className="password-feedback-item">
                                        <small className="text-danger">{feedback}</small>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group controlId="confirmPassword" className="input-group-animation">
                          <Form.Label className="fw-medium">Confirm Password</Form.Label>
                          <Form.Control
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            isInvalid={!!errors.confirmPassword}
                            placeholder="Confirm your password"
                            className="py-2"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.confirmPassword}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group controlId="userType" className="input-group-animation">
                          <Form.Label className="fw-medium">Register as</Form.Label>
                          <Form.Select
                            name="userType"
                            value={formData.userType}
                            onChange={handleChange}
                            isInvalid={!!errors.userType}
                            className="py-2"
                          >
                            <option value="">Select role</option>
                            <option value="student">Student</option>
                            <option value="landlord">Landlord</option>
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.userType}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6} className="d-flex align-items-end">
                        <div className="terms-box p-2 rounded mb-2 w-100">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="termsCheck" />
                            <label className="form-check-label small" htmlFor="termsCheck">
                              I agree to the <a href="#" className="terms-link">Terms & Conditions</a> and <a href="#" className="terms-link">Privacy Policy</a>
                            </label>
                          </div>
                        </div>
                      </Col>
                    </Row>
                    
                    <div className="mt-4">
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={isLoading}
                        className="w-100 py-3 fw-semibold submit-btn-pulse"
                      >
                        {isLoading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Creating Your Account...
                          </>
                        ) : 'Create Account'}
                      </Button>
                    </div>
                    
                    <div className="mt-4 p-3 bg-light rounded text-center login-link-container">
                      <span className="me-2">Already have an account?</span>
                      <Button variant="link" className="fw-semibold p-0" onClick={handleNavigation}>
                        Sign in to your account
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </main>
      
      {/* Footer */}
      <footer className="footer py-4">
        <Container fluid>
          <Row className="align-items-center">
            <Col md={3} className="mb-3 mb-md-0">
              <h5 className="brand-logo-footer mb-0">NexNest</h5>
            </Col>
            <Col md={6} className="mb-3 mb-md-0">
              <div className="d-flex justify-content-center footer-links">
                <a href="#" className="text-light-emphasis text-decoration-none me-3 footer-link">About</a>
                <a href="#" className="text-light-emphasis text-decoration-none me-3 footer-link">Privacy</a>
                <a href="#" className="text-light-emphasis text-decoration-none me-3 footer-link">Terms</a>
                <a href="#" className="text-light-emphasis text-decoration-none me-3 footer-link">Contact</a>
                <a href="#" className="text-light-emphasis text-decoration-none footer-link">Help Center</a>
              </div>
            </Col>
            <Col md={3} className="text-md-end">
              <p className="text-muted mb-0">&copy; 2025 NexNest. All rights reserved.</p>
            </Col>
          </Row>
        </Container>
      </footer>

      {/* CSS for custom styling beyond Bootstrap */}
      <style>{`
        @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        :root {
          --primary: ${currentScheme.primary};
          --primary-dark: ${currentScheme.primaryDark};
          --primary-light: ${currentScheme.primaryLight};
          --primary-very-light: ${currentScheme.primaryVeryLight};
          --secondary: ${currentScheme.secondary};
          --accent: ${currentScheme.accent};
          --text-primary: #2b2d42;
          --text-secondary: #6c757d;
          --success: #06d6a0;
          --danger: #ef476f;
          --warning: #ffd166;
          --light: #f8f9fa;
          --dark: #212529;
          
          --gradient-primary: linear-gradient(135deg, var(--primary), var(--primary-dark));
          
          --bs-primary: var(--primary);
          --bs-primary-rgb: 48, 0, 126;
          --bs-link-color: var(--primary);
          --bs-link-hover-color: var(--primary-dark);
          
          --transition-speed: 0.3s;
          --box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        }
        
        body, html {
          font-family: 'Inter', sans-serif;
          background-color: #f8f9fa;
          color: var(--text-primary);
          scroll-behavior: smooth;
          overflow-x: hidden;
        }
        
        /* Password Strength Indicator Styles */
        .password-strength-container {
          margin-top: 0.5rem;
        }
        
        .password-strength-bar {
          width: 100%;
          height: 4px;
          background-color: #e9ecef;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .password-strength-fill {
          height: 100%;
          transition: all 0.3s ease;
          border-radius: 2px;
        }
        
        .password-strength-text {
          font-weight: 500;
          font-size: 0.8rem;
        }
        
        .password-requirements {
          background-color: #f8f9fa;
          border-radius: 6px;
          padding: 0.75rem;
          border-left: 3px solid #dc3545;
        }
        
        .password-feedback-list {
          margin: 0.5rem 0 0 0;
          padding-left: 1rem;
        }
        
        .password-feedback-item {
          margin-bottom: 0.25rem;
        }
        
        .password-feedback-item:last-child {
          margin-bottom: 0;
        }
        
        /* Page Layout */
        .registration-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          opacity: 0;
        }
        
        .header {
          background-color: white;
          border-bottom: 1px solid rgba(0,0,0,0.1);
          transition: all var(--transition-speed);
        }
        
        .main-content {
          flex: 1;
          display: flex;
          background: linear-gradient(180deg, var(--primary-very-light), #f8f9fa);
          padding: 2rem 0;
        }
        
        .info-section {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        
        .info-section:before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
          opacity: 0.1;
          z-index: -1;
        }
        
        .info-content {
          padding: 2rem;
          color: var(--text-primary);
        }
        
        .info-title {
          font-weight: 700;
          color: var(--primary);
          position: relative;
          margin-bottom: 2rem;
        }
        
        .info-title:after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 0;
          width: 60px;
          height: 4px;
          background: var(--accent);
        }
        
        .feature-item {
          display: flex;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 12px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }
        
        .feature-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .feature-icon {
          min-width: 50px;
          height: 50px;
          border-radius: 50%;
          background: var(--primary-very-light);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 1rem;
          color: var(--primary);
          font-size: 1.5rem;
        }
        
       
        
        .feature-text h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--primary);
        }
        
        .feature-text p {
          margin-bottom: 0;
          color: var(--text-secondary);
          font-size: 0.95rem;
        }
        
        .form-section {
          padding: 2rem;
        }
        
        .form-card {
          border-radius: 16px;
          overflow: hidden;
          height: 100%;
        }
        
        .color-scheme-indicator {
          display: flex;
          align-items: center;
          font-size: 0.85rem;
          margin-top: 0.3rem;
        }
        
        .color-scheme-text {
          margin-right: 1rem;
          color: var(--text-secondary);
        }
        
        .color-dots {
          display: flex;
          align-items: center;
        }
        
        .color-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          margin-right: 6px;
          cursor: pointer;
          transition: transform 0.3s ease;
          opacity: 0.7;
        }
        
        .color-dot:hover {
          transform: scale(1.2);
          opacity: 1;
        }
        
        .color-dot.active {
          transform: scale(1.2);
          opacity: 1;
          box-shadow: 0 0 0 2px white, 0 0 0 3px var(--primary);
        }
        
        .color-scheme-preview {
          margin-top: 2rem;
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }
        
        .scheme-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .scheme-button {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 2px solid;
          background-color: var(--primary);
          color: white;
          font-weight: 500;
          transition: all 0.3s ease;
          cursor: pointer;
          outline: none;
        }
        
        .scheme-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .scheme-button.active {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          position: relative;
        }
        
        .scheme-button.active:after {
          content: '✓';
          position: absolute;
          top: -10px;
          right: -10px;
          width: 25px;
          height: 25px;
          background: var(--success);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
        }
        
        /* Animation Classes */
        .fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .slide-up {
          animation: slideUp 0.8s ease-out forwards;
        }
        
        @keyframes slideUp {
          from { 
            transform: translateY(30px); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0); 
            opacity: 1; 
          }
        }
        
        /* Form Input Animation */
        .input-group-animation {
          position: relative;
          transform: translateY(10px);
          opacity: 0;
          animation: fadeInUp 0.5s ease-out forwards;
          animation-delay: calc(var(--index, 0) * 0.1s);
        }
        
        .input-group-animation:nth-child(1) { --index: 1; }
        .input-group-animation:nth-child(2) { --index: 2; }
        .input-group-animation:nth-child(3) { --index: 3; }
        .input-group-animation:nth-child(4) { --index: 4; }
        .input-group-animation:nth-child(5) { --index: 5; }
        .input-group-animation:nth-child(6) { --index: 6; }
        .input-group-animation:nth-child(7) { --index: 7; }
        
        @keyframes fadeInUp {
          from { 
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        /* Brand Styling */
        .brand-logo {
          color: var(--primary);
          font-weight: 700;
          font-size: 1.75rem;
          transition: all var(--transition-speed);
        }
        
        .brand-logo:hover {
          color: var(--primary-dark);
        }
        
        .brand-logo-footer {
          color: white;
          font-weight: 600;
          position: relative;
          display: inline-block;
        }
        
        .brand-logo-footer:after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 40px;
          height: 2px;
          background: var(--accent);
        }
        
        /* Button Styling */
        .btn-primary {
          background: var(--gradient-primary);
          border: none;
          transition: all 0.3s ease;
        }
        
        .btn-primary:hover, 
        .btn-primary:focus, 
        .btn-primary:active {
          background: linear-gradient(135deg, var(--primary-dark), var(--primary));
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        .btn-outline-primary {
          color: var(--primary);
          border-color: var(--primary);
          transition: all 0.3s ease;
        }
        
        .btn-outline-primary:hover {
          background-color: var(--primary);
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .signin-btn {
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        
        .signin-btn:before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: var(--primary);
          transition: all 0.3s ease;
          z-index: -1;
        }
        
        .signin-btn:hover {
          color: white;
        }
        
        .signin-btn:hover:before {
          left: 0;
        }
        
        .submit-btn-pulse:not(:disabled) {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(var(--bs-primary-rgb), 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(var(--bs-primary-rgb), 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(var(--bs-primary-rgb), 0);
          }
        }
        
        .btn-link {
          color: var(--primary);
          text-decoration: none;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .btn-link:after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: var(--primary);
          transition: width 0.3s ease;
        }
        
        .btn-link:hover {
          color: var(--primary-dark);
        }
        
        .btn-link:hover:after {
          width: 100%;
        }
        
        /* Form Controls */
        .form-control, .form-select {
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          padding: 0.75rem 1rem;
          transition: all 0.3s ease;
          background-color: #fff;
        }
        
        .form-control:focus, 
        .form-select:focus {
          border-color: var(--primary-light);
          background-color: var(--primary-very-light);
          box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.15);
        }
        
        .form-control::placeholder {
          color: #adb5bd;
          opacity: 0.7;
        }
        
        /* Card Styling */
        .form-card {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: var(--box-shadow);
          transition: all 0.3s ease;
          background-color: white;
        }
        
        .form-card:hover {
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
        }
        
        .card-header {
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          background: white;
          position: relative;
        }
        
        .card-header:before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          height: 4px;
          width: 100%;
          background: var(--gradient-primary);
        }
        
        /* Alert Animation */
        .alert-animated {
          animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
        }
        
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        
        /* Terms box styling */
        .terms-box {
          background-color: var(--primary-very-light);
          border: 1px solid rgba(var(--bs-primary-rgb), 0.2);
          border-radius: 8px;
        }
        
        .terms-link {
          color: var(--primary);
          text-decoration: none;
          font-weight: 500;
          position: relative;
        }
        
        .terms-link:after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 0;
          height: 1px;
          background: var(--primary);
          transition: width 0.3s ease;
        }
        
        .terms-link:hover:after {
          width: 100%;
        }
        
        /* Footer */
        .footer {
          background: linear-gradient(135deg, var(--primary-dark), var(--primary));
          padding: 2rem 0;
          color: white;
          margin-top: auto;
        }
        
        .footer-link {
          position: relative;
          transition: all 0.3s ease;
        }
        
        .footer-link:after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: white;
          transition: width 0.3s ease;
        }
        
        .footer-link:hover {
          color: white !important;
          text-decoration: none !important;
        }
        
        .footer-link:hover:after {
          width: 100%;
        }
        
        .text-light-emphasis {
          color: rgba(255, 255, 255, 0.75) !important;
        }
        
        /* Success Animation Overlay */
        .success-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .success-animation {
          text-align: center;
          animation: scaleUp 0.5s ease-out forwards;
        }
        
        @keyframes scaleUp {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .checkmark-circle {
          width: 100px;
          height: 100px;
          position: relative;
          display: inline-block;
          vertical-align: top;
          margin-bottom: 20px;
        }
        
        .checkmark-circle .background {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: var(--success);
          position: absolute;
        }
        
        .checkmark {
          border-radius: 50%;
          display: block;
          stroke-width: 6;
          stroke: var(--success);
          stroke-miterlimit: 10;
          box-shadow: inset 0px 0px 0px var(--success);
          animation: fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both;
          position: relative;
          top: 30px;
          left: 30px;
          margin: 0 auto;
          width: 40px;
          height: 40px;
        }
        
        .checkmark:after {
          content: "";
          width: 100%;
          height: 100%;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 0;
          left: 0;
        }
        
        .checkmark.draw:after {
          animation: drawCheck 0.8s ease-in-out forwards;
        }
        
        @keyframes drawCheck {
          0% { clip-path: circle(0% at 50% 50%); }
          100% { clip-path: circle(0% at 50% 50%); }
        }
        
        .checkmark:before {
          content: "";
          width: 20px;
          height: 40px;
          border-right: 6px solid var(--success);
          border-bottom: 6px solid var(--success);
          position: absolute;
          top: -10px;
          left: 10px;
          transform: rotate(45deg);
          z-index: 10;
          animation: checkmarkAnimation 0.8s cubic-bezier(0.42, 0, 0.58, 1) forwards;
          transform-origin: 50% 50%;
          opacity: 0;
        }
        
        @keyframes checkmarkAnimation {
          0% {
            height: 0;
            width: 0;
            opacity: 0;
          }
          50% {
            opacity: 1;
            height: 0;
            width: 20px;
          }
          100% {
            height: 40px;
            width: 20px;
            opacity: 1;
          }
        }
        
        .success-text {
          font-size: 24px;
          font-weight: 600;
          color: var(--success);
          margin-top: 20px;
        }
        
        /* Color Scheme Transition */
        .registration-page {
          transition: --primary 1.5s ease, 
                      --primary-dark 1.5s ease, 
                      --primary-light 1.5s ease, 
                      --primary-very-light 1.5s ease,
                      --secondary 1.5s ease,
                      --accent 1.5s ease;
        }
        
        /* Responsive Styles */
        @media (max-width: 1200px) {
          .feature-item {
            padding: 1rem;
          }
          
          .info-content {
            padding: 1rem;
          }
        }
        
        @media (max-width: 991px) {
          .form-section, .info-section {
            padding: 1rem;
          }
          
          .form-card {
            max-width: 100%;
          }
        }
        
        @media (max-width: 767px) {
          .header .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          
          .brand-logo {
            font-size: 1.5rem;
          }
          
          .color-scheme-indicator {
            display: none;
          }
          
          .form-card {
            margin: 0;
            border-radius: 12px;
          }
          
          .card-body, .card-header {
            padding: 1.25rem !important;
          }
          
          .footer-links {
            flex-wrap: wrap;
            justify-content: center;
            margin-bottom: 1rem;
          }
          
          .footer-link {
            margin-bottom: 0.5rem;
            margin-right: 1rem;
          }
        }
        
        @media (max-width: 576px) {
          .main-content {
            padding: 1rem 0;
          }
          
          .form-section, .info-section {
            padding: 0.5rem;
          }
          
          .card-body {
            padding: 1rem !important;
          }
          
          .brand-logo {
            font-size: 1.25rem;
          }
          
          .brand-container .brand-tagline {
            display: none;
          }
          
          h2 {
            font-size: 1.5rem;
          }
          
          .feature-item {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          
          .feature-icon {
            margin-right: 0;
            margin-bottom: 1rem;
          }
          
          .footer {
            text-align: center;
          }
        }
        
        /* Theme Transition Animation */
        @keyframes themeTransition {
          0% { opacity: 0.9; }
          50% { opacity: 0.98; }
          100% { opacity: 1; }
        }
        
        .theme-transition {
          animation: themeTransition 1.5s ease;
        }
        
        /* Make form controls slightly larger on larger screens */
        @media (min-width: 1400px) {
          .form-control, .form-select {
            padding: 0.85rem 1.2rem;
          }
          
          .btn {
            padding-top: 0.7rem;
            padding-bottom: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
};

export default RegistrationForm;