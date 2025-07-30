import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './bootstrap-5.3.5-dist/css/bootstrap.min.css';
import { Form, Button, Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { color } from 'bun';

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
  <header className="header">
          <div className="header-container">
            <div className="logo-container">
              <h1 className="logo">NexNest</h1>
              <h2 className="tagline">Student Accommodation Platform</h2>
            </div>
            <nav className="nav">
              <button className="nav-button" onClick={handleNavigation}>
                Sign In
              </button>
            </nav>
          </div>
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
        
/* Registration Form CSS */
:root {
  --primary: #0056b3;
  --primary-dark: #004085;
  --primary-light: #3d80d4;
  --primary-very-light: #ebf5ff;
  --secondary: #4da3ff;
  --accent: #ff9800;
}

/* Page Layout and Structure */
.registration-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-very-light) 0%, #ffffff 100%);
  display: flex;
  flex-direction: column;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s ease-out;
}

.registration-page.fade-in {
  opacity: 1;
  transform: translateY(0);
}

 .header {
            background-color: #ffffff;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            padding: var(--spacing-sm) 0;
            position: fixed;
            top: 0;
            width: 100%;
            z-index: 1050;
          }
          .header-container {
            width: 100%;
            max-width: 1320px;
            margin: 0 auto;
            padding: 0 var(--spacing-sm);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          @media (min-width: 640px) {
            .header-container {
              padding: 0 var(--spacing-md);
            }
          }
          @media (min-width: 1200px) {
            .header-container {
              padding: 0 var(--spacing-lg);
            }
          }
          .logo {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary-color);
            margin: 0;
            background: var(--gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            transition: all var(--transition-normal);
          }
          .tagline {
            font-size: 0.8rem;
            color: #6b7280;
            font-weight: 400;
            margin: 0;
          }
          .nav-button {
            background-color: transparent;
            color: var(--primary-color);
            border: 2px solid var(--primary-color);
            border-radius: 50px;
            padding: 0.4rem 1.25rem;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all var(--transition-normal);
          }
          .nav-button:hover {
            background: var(--gradient);
            color: white;
            border-color: transparent;
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
          }

/* Main Content */
.main-content {
  flex: 1;
  padding: 2rem 0;
  margin: 0;
  margin-top: 80px; /* Add top margin to account for fixed header */
}

.main-content .container-fluid {
  max-width: 1400px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

/* Info Section */
.info-section {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  padding: 3rem 2rem;
  border-radius: 15px 0 0 15px;
  position: relative;
  overflow: hidden;
}

.info-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
  opacity: 0.1;
}

.info-content {
  position: relative;
  z-index: 1;
}

.info-title {
  font-size: 2.2rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 2rem;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.feature-icon {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.feature-icon i {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
}

.feature-text h4 {
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.feature-text p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 0;
}

/* Form Section */
.form-section {
  padding: 0 1rem;
  display: flex;
  align-items: center;
}

.form-card {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  width: 100%;
  transform: translateX(30px);
  opacity: 0;
  transition: all 0.8s ease-out 0.2s;
}

.form-card.slide-up {
  transform: translateX(0);
  opacity: 1;
}

.form-card .card-header {
  background: linear-gradient(135deg, var(--primary-very-light), rgba(255, 255, 255, 0.8));
  border-bottom: 1px solid rgba(0, 86, 179, 0.1);
}

.form-card h2 {
  color: var(--primary-dark);
  font-size: 1.8rem;
}

/* Form Controls */
.input-group-animation {
  position: relative;
  opacity: 0;
  transform: translateY(10px);
  animation: slideInUp 0.6s ease-out forwards;
}

.input-group-animation:nth-child(1) { animation-delay: 0.1s; }
.input-group-animation:nth-child(2) { animation-delay: 0.2s; }
.input-group-animation:nth-child(3) { animation-delay: 0.3s; }
.input-group-animation:nth-child(4) { animation-delay: 0.4s; }
.input-group-animation:nth-child(5) { animation-delay: 0.5s; }
.input-group-animation:nth-child(6) { animation-delay: 0.6s; }

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-control, .form-select {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.form-control:focus, .form-select:focus {
  border-color: var(--primary-light);
  box-shadow: 0 0 0 0.2rem rgba(0, 86, 179, 0.15);
  transform: translateY(-1px);
}

.form-label {
  color: var(--primary-dark);
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

/* Password Strength Indicator */
.password-strength-container {
  margin-top: 8px;
}

.password-strength-bar {
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
  font-size: 0.8rem;
  font-weight: 600;
}

.password-requirements {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0.75rem;
}

.password-feedback-list {
  list-style: none;
  padding-left: 0;
  margin-bottom: 0;
}

.password-feedback-item {
  position: relative;
  padding-left: 1rem;
  margin-bottom: 0.25rem;
}

.password-feedback-item::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #dc3545;
  font-weight: bold;
}

/* Terms Box */
.terms-box {
  background: var(--primary-very-light);
  border: 1px solid rgba(0, 86, 179, 0.1);
}

.terms-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
}

.terms-link:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

/* Submit Button */
.submit-btn-pulse {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.submit-btn-pulse::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.submit-btn-pulse:hover::before {
  left: 100%;
}

.submit-btn-pulse:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 86, 179, 0.3);
}

.submit-btn-pulse:disabled {
  background: #6c757d;
  transform: none;
  box-shadow: none;
}

/* Login Link Container */
.login-link-container {
  background: rgba(0, 86, 179, 0.05);
  border: 1px solid rgba(0, 86, 179, 0.1);
}

/* Alert Styling */
.alert-animated {
  animation: slideDown 0.3s ease-out;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Footer */
.footer {
  background: #1a1a1a;;
  color: white;
  margin-top: auto;
  padding: 2rem 0;
}

.footer .container-fluid {
  max-width: 1400px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

.brand-logo-footer {
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: -0.01em;
}

.footer-links {
  gap: 1.5rem;
}

.footer-link {
  transition: color 0.3s ease;
  font-weight: 500;
}

.footer-link:hover {
  color: var(--secondary) !important;
  text-decoration: none;
}

/* Success Animation */
.success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-out;
}

.success-animation {
  text-align: center;
  animation: bounceIn 0.6s ease-out;
}

.checkmark-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #28a745;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.3s ease-out 0.2s both;
}

.checkmark {
  width: 40px;
  height: 20px;
  border: 4px solid white;
  border-top: none;
  border-right: none;
  transform: rotate(-45deg);
  animation: drawCheckmark 0.3s ease-out 0.5s both;
}

.success-text {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  animation: fadeInUp 0.3s ease-out 0.7s both;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bounceIn {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

@keyframes drawCheckmark {
  from {
    width: 0;
    height: 0;
  }
  to {
    width: 40px;
    height: 20px;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 991.98px) {
  .info-section {
    display: none;
  }
  
  .form-section {
    padding: 0;
  }
  
  .main-content {
    padding: 1rem 0;
  }
  
  .main-content .container-fluid {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
  
  .footer .container-fluid {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}

@media (max-width: 767.98px) {
  .brand-logo {
    font-size: 1.5rem;
  }
  
  .info-title {
    font-size: 1.8rem;
  }
  
  .form-card h2 {
    font-size: 1.5rem;
  }
  
  .footer-links {
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }
  
  .main-content {
    margin-top: 70px; /* Adjust for smaller header on mobile */
  }
  
  .main-content .container-fluid {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
  
  .footer .container-fluid {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
}

@media (max-width: 575.98px) {
  .header .container-fluid {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
  
  .signin-btn {
    padding: 6px 16px;
    font-size: 0.9rem;
  }
  
  .form-card {
    border-radius: 10px;
  }
  
  .form-card .card-body {
    padding: 1.5rem;
  }
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .form-control, .form-select {
    border-width: 1px;
  }
}

/* Ensure proper alignment across all screen sizes */
.container-fluid {
  width: 100%;
  padding-right: 15px;
  padding-left: 15px;
  margin-right: auto;
  margin-left: auto;
}
 
 
/* Remove any conflicting margins/paddings */
.registration-page * {
  box-sizing: border-box;
}

/* Ensure footer sticks to bottom */
.registration-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex-grow: 1;
}

/* Smooth scrolling for better UX */
html {
  scroll-behavior: smooth;
}

        
      `}</style>
    </div>
  );
};

export default RegistrationForm;