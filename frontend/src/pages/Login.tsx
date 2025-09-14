import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './bootstrap-5.3.5-dist/css/bootstrap.min.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const recaptchaRef = useRef(null);
  const recaptchaWidgetId = useRef(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [recaptchaRendered, setRecaptchaRendered] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Your reCAPTCHA site key
  const RECAPTCHA_SITE_KEY = '6LflBJ8rAAAAAG2CLZQWKMGY4LWVHCvLmnh9ivb6';

  const {
    message: loginMessage,
    propertyId,
    receiverId,
    receiverName,
    receiverType,
    propertyTitle,
    propertyData,
    from,
  } = location.state || {};

  console.log('LoginPage mounted', {
    locationState: location.state,
    propertyId,
    receiverId,
    from,
  });

  // Scroll handler (consistent with register page)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (menuOpen && !event.target.closest('.navbar')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  // Load reCAPTCHA script
  useEffect(() => {
    const loadRecaptcha = () => {
      const existingScript = document.querySelector('script[src*="recaptcha"]');
      if (existingScript || window.grecaptcha) {
        setRecaptchaLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('reCAPTCHA script loaded successfully');
        setRecaptchaLoaded(true);
      };
      
      script.onerror = (error) => {
        console.error('Failed to load reCAPTCHA script:', error);
        setError('Failed to load verification system. Please check your internet connection and try again.');
      };
      
      document.head.appendChild(script);
    };

    loadRecaptcha();

    return () => {
      setRecaptchaLoaded(false);
      setRecaptchaRendered(false);
    };
  }, []);

  // Render reCAPTCHA
  useEffect(() => {
    const renderRecaptcha = () => {
      if (!recaptchaLoaded || !window.grecaptcha || !recaptchaRef.current || recaptchaRendered) {
        return;
      }

      try {
        if (typeof window.grecaptcha.render !== 'function') {
          console.log('grecaptcha.render not ready, retrying...');
          setTimeout(renderRecaptcha, 100);
          return;
        }

        console.log('Rendering reCAPTCHA...');
        
        const widgetId = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          size: 'normal',
          theme: 'light',
          callback: (token) => {
            console.log('reCAPTCHA verified:', token ? 'success' : 'failed');
            setRecaptchaToken(token);
            setError('');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            setRecaptchaToken('');
            setError('Verification expired. Please complete the verification again.');
          },
          'error-callback': (error) => {
            console.log('reCAPTCHA error:', error);
            setRecaptchaToken('');
            setError('Verification failed. Please try again.');
          },
        });

        recaptchaWidgetId.current = widgetId;
        setRecaptchaRendered(true);
        console.log('reCAPTCHA rendered successfully with widget ID:', widgetId);

      } catch (error) {
        console.error('reCAPTCHA render error:', error);
        setError('Failed to initialize verification. Please refresh the page and try again.');
      }
    };

    const timer = setTimeout(renderRecaptcha, 100);
    return () => clearTimeout(timer);
  }, [recaptchaLoaded, RECAPTCHA_SITE_KEY]);

  const resetRecaptcha = () => {
    if (window.grecaptcha && recaptchaWidgetId.current !== null) {
      try {
        window.grecaptcha.reset(recaptchaWidgetId.current);
        setRecaptchaToken('');
        console.log('reCAPTCHA reset successfully');
      } catch (error) {
        console.error('reCAPTCHA reset error:', error);
        setRecaptchaRendered(false);
        setTimeout(() => {
          if (recaptchaRef.current) {
            recaptchaRef.current.innerHTML = '';
          }
        }, 100);
      }
    }
  };

  const handleNavigation = (path: string) => {
    const paths: Record<string, string> = {
      register: '/register',
      home: '/',
      about: '/about',
      viewall: '/studentdashboard',
    };

    if (paths[path]) {
      navigate(paths[path]);
    } else {
      navigate(`/${path}`);
    }
    setMenuOpen(false);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      console.log('Validation failed: missing email or password');
      return;
    }

    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting login with:', { email });
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, recaptchaToken }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const user = data.user;
      if (!user || !user.id || !user.email || !user.userType) {
        throw new Error('Invalid user data received');
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify({
        ...user,
        token: data.token,
      }));
      console.log('Stored in localStorage:', { user, authToken: data.token });

      console.log('Preparing redirect:', {
        propertyId,
        receiverId,
        studentId: user.id,
        userType: user.userType,
        from,
      });

      if (user.userType === 'student') {
        if (from === '/inquiry' && propertyId && receiverId) {
          console.log('Redirecting to messages:', {
            studentId: user.id,
            propertyId,
            receiverId,
          });
          navigate('/inquiry', {
            state: {
              studentId: user.id,
              propertyId,
              receiverId,
              receiverName,
              receiverType,
              propertyTitle,
              propertyData,
              fromLogin: true,
            },
          });
        } else {
          console.log('Redirecting to studentdashboard');
          navigate('/studentdashboard', {
            state: { studentId: user.id },
          });
        }
      } else if (user.userType === 'landlord') {
        console.log('Redirecting to LandlordDashboard');
        navigate('/LandlordDashboard', {
          state: { landlordId: user.id },
        });
      } else if (user.userType === 'admin') {
        console.log('Redirecting to admin-view');
        navigate('/admin-view', {
          state: { adminId: user.id },
        });
      } else {
        throw new Error('Unknown user type');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during sign in');
      resetRecaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container w-100 min-vh-100">
      {/* NAVBAR - Same as Register */}
      <nav className={`navbar navbar-expand-lg fixed-top navbar-light bg-white shadow-sm ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container-lg">
          <a
            className="navbar-brand fw-bold text-primary d-flex align-items-center"
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavigation('home');
            }}
          >
            <span className="me-1">🏠</span>
            <span>PlacesForLeaners</span>
          </a>

          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-controls="navbarNav"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="navbarNav">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="#home"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('home');
                  }}
                >
                  Home
                </a>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-outline-primary btn-sm" onClick={() => handleNavigation('register')}>
                Create Account
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => handleNavigation('home')}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="py-4 py-md-5" style={{ paddingTop: '120px', marginTop: '20px' }}>
        <div className="container-lg">
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-6">
              {/* Header */}
              <div className="text-center mb-4">
                <h1 className="h3 fw-bold mb-2 text-dark">Welcome Back</h1>
                <p className="text-muted mb-0">
                  {loginMessage || 'Sign in to access your PlacesForLeaners account'}
                </p>
              </div>

              {/* Form Card */}
              <div className="card shadow-sm border-0">
                <div className="card-body p-4">
                  {error && (
                    <div className="alert alert-danger d-flex align-items-center mb-4">
                      <i className="bi bi-exclamation-circle-fill me-2"></i>
                      {error}
                    </div>
                  )}

                  {/* Social Login Buttons */}
                  <div className="d-grid gap-2 mb-4">
                    <button className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>
                    <button className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877f2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Continue with Facebook
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="text-center mb-4">
                    <span className="text-muted small">or sign in with email</span>
                    <hr className="my-3" />
                  </div>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fw-medium">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="form-control"
                          placeholder="Enter your email address"
                          required
                        />
                      </div>
                      
                      <div className="col-12">
                        <label className="form-label fw-medium">Password</label>
                        <input
                          type="password"
                          name="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="form-control"
                          placeholder="Enter your password"
                          required
                        />
                      </div>
                      
                      {/* reCAPTCHA Container */}
                      <div className="col-12">
                        <div className={`p-3 border rounded ${recaptchaToken ? 'border-success bg-light-success' : 'border-light bg-light'}`}>
                          <div className="text-center mb-2">
                            <small className="text-muted fw-medium">Please verify you're human:</small>
                          </div>
                          
                          {!recaptchaLoaded ? (
                            <div className="d-flex align-items-center justify-content-center gap-2 py-3">
                              <div className="spinner-border spinner-border-sm text-muted" role="status"></div>
                              <small className="text-muted">Loading verification...</small>
                            </div>
                          ) : recaptchaToken ? (
                            <div className="d-flex align-items-center justify-content-center gap-2 py-2 text-success">
                              <i className="bi bi-check-circle-fill"></i>
                              <small className="fw-medium">Verification complete</small>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div ref={recaptchaRef} className="d-inline-block"></div>
                              {recaptchaLoaded && !recaptchaRendered && (
                                <div className="d-flex align-items-center justify-content-center gap-2 py-3">
                                  <div className="spinner-border spinner-border-sm text-muted" role="status"></div>
                                  <small className="text-muted">Initializing verification...</small>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id="rememberMe"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <label className="form-check-label small" htmlFor="rememberMe">
                              Remember me
                            </label>
                          </div>
                          <a href="#" className="text-primary small text-decoration-none">
                            Forgot password?
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary w-100 py-2"
                      >
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Signing In...
                          </>
                        ) : 'Sign In'}
                      </button>
                    </div>
                    
                    <div className="mt-3 text-center">
                      <span className="text-muted me-2">Don't have an account?</span>
                      <button type="button" className="btn btn-link p-0" onClick={() => handleNavigation('register')}>
                        Create one here
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Additional Info */}
              <div className="text-center mt-4">
                <div className="row g-2">
                  <div className="col-4">
                    <div className="card text-center border-0 bg-light h-100">
                      <div className="card-body py-3">
                        <div className="text-primary fw-bold">Secure</div>
                        <small className="text-muted">Login</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="card text-center border-0 bg-light h-100">
                      <div className="card-body py-3">
                        <div className="text-success fw-bold">24/7</div>
                        <small className="text-muted">Access</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="card text-center border-0 bg-light h-100">
                      <div className="card-body py-3">
                        <div className="text-info fw-bold">Trusted</div>
                        <small className="text-muted">Platform</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER - Same as Register */}
      <footer className="py-4 bg-dark text-white mt-auto">
        <div className="container-lg">
          <div className="row g-4">
            <div className="col-12 col-md-6 text-center text-md-start">
              <h5 className="fw-bold mb-2">🏠 PlacesForLeaners</h5>
              <p className="small mb-0">Trusted student housing platform for CBU students in Kitwe</p>
            </div>
            <div className="col-12 col-md-6">
              <div className="row g-3">
                <div className="col-6 text-center">
                  <h6 className="small fw-bold mb-2">Quick Links</h6>
                  <div className="d-flex flex-column">
                    <a href="#" className="text-decoration-none text-white-50 small mb-1" onClick={() => handleNavigation('home')}>Home</a>
                    <button className="btn btn-link p-0 text-start text-white-50 small mb-1 text-decoration-none" onClick={() => handleNavigation('viewall')}>Browse Properties</button>
                    <a href="#" className="text-decoration-none text-white-50 small mb-1" onClick={() => handleNavigation('register')}>Create Account</a>
                  </div>
                </div>
                <div className="col-6 text-center">
                  <h6 className="small fw-bold mb-2">Support</h6>
                  <div className="d-flex flex-column">
                    {['Help', 'FAQs', 'Contact'].map((link) => (
                      <a href="#" className="text-decoration-none text-white-50 small mb-1" key={link}>{link}</a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12">
              <hr className="border-secondary my-3" />
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center">
                <p className="small text-white-50 mb-2 mb-sm-0">© {new Date().getFullYear()} PlacesForLeaners. All rights reserved.</p>
                <div className="d-flex gap-3 align-items-center">
                  <a href="#" className="text-white-50 text-decoration-none small">Privacy</a>
                  <a href="#" className="text-white-50 text-decoration-none small">Terms</a>
                  <span className="text-white-50">•</span>
                  <button className="btn btn-link p-0 text-white-50 small text-decoration-underline" onClick={() => handleNavigation('viewall')}>Browse All</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .form-control, .form-select {
          border-radius: 8px;
          border: 1px solid #dee2e6;
          padding: 0.5rem 0.75rem;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }

        .form-control:focus, .form-select:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
        }

        .btn-primary {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }

        .btn-primary:hover {
          background-color: #0b5ed7;
          border-color: #0a58ca;
        }

        .btn-outline-primary {
          color: #0d6efd;
          border-color: #0d6efd;
        }

        .btn-outline-primary:hover {
          background-color: #0d6efd;
          border-color: #0d6efd;
          color: #fff;
        }

        .btn-outline-secondary {
          color: #6c757d;
          border-color: #dee2e6;
        }

        .btn-outline-secondary:hover {
          background-color: #f8f9fa;
          border-color: #dee2e6;
          color: #6c757d;
        }

        .navbar.scrolled {
          background-color: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(10px);
        }

        .card {
          border-radius: 12px;
        }

        .app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        main {
          flex: 1;
        }

        .bg-light-success {
          background-color: #f8f9fa !important;
        }

        .border-success {
          border-color: #198754 !important;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;