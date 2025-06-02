import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import './bootstrap-5.3.5-dist/css/bootstrap.min.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [colorScheme, setColorScheme] = useState('purple');

  const loginMessage = location.state?.message || '';
  const propertyId = location.state?.propertyId;

  console.log('LoginPage mounted', {
    locationState: location.state,
    propertyId,
  });

  const colorSchemes = {
    purple: {
      primary: '#1a56db',
      secondary: '#4f88ff',
      accent: '#c5dbff',
      gradient: 'linear-gradient(135deg, #1a56db 0%, #4f88ff 100%)',
    },
    blue: {
      primary: 'rgb(48, 0, 126)',
      secondary: '#8052ff',
      accent: '#d4c1ff',
      gradient: 'linear-gradient(135deg, rgb(48, 0, 126) 0%, #8052ff 100%)',
    },
    teal: {
      primary: '#0d9488',
      secondary: '#34d399',
      accent: '#ccfbf1',
      gradient: 'linear-gradient(135deg, #0d9488 0%, #34d399 100%)',
    },
    crimson: {
      primary: '#be123c',
      secondary: '#fb7185',
      accent: '#fee2e2',
      gradient: 'linear-gradient(135deg, #be123c 0%, #fb7185 100%)',
    },
  };

  const currentScheme = colorSchemes[colorScheme];

  const handleNavigation = () => {
    console.log('Navigating to register');
    navigate('/register');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      console.log('Validation failed: missing email or password');
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
        body: JSON.stringify({ email, password }),
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
        studentId: user.id,
        userType: user.userType,
      });

      if (user.userType === 'student') {
        if (propertyId) {
          console.log('Redirecting to inquiry:', { propertyId, studentId: user.id });
          navigate(`/inquiry`, {
            state: {
              studentId: user.id,
              propertyId,
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
    } finally {
      setIsLoading(false);
    }
  };

  const changeColorScheme = (scheme) => {
    console.log('Changing color scheme to:', scheme);
    setColorScheme(scheme);
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
          body, html {
            width: 100%;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
            min-height: 100vh;
            font-family: 'Poppins', sans-serif;
            background-color: #f8f9fa;
          }
          .app-container {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            width: 100vw;
            background-color: white;
            background-size: cover;
            background-attachment: fixed;
          }
          .header {
            background-color: #ffffff;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            padding: 1rem 0;
            position: sticky;
            top: 0;
            z-index: 100;
            width: 100%;
          }
          .header-container {
            width: 100%;
            padding: 0 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
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
          .logo {
            font-size: 1.5rem;
            font-weight: 700;
            color: ${currentScheme.primary};
            margin: 0;
            background: ${currentScheme.gradient};
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            transition: all 0.3s ease;
          }
          .tagline {
            font-size: 0.8rem;
            color: #6b7280;
            font-weight: 400;
            margin: 0;
          }
          .nav-button {
            background-color: transparent;
            color: ${currentScheme.primary};
            border: 2px solid ${currentScheme.primary};
            border-radius: 50px;
            padding: 0.4rem 1.25rem;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .nav-button:hover {
            background: ${currentScheme.gradient};
            color: white;
            border-color: transparent;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
            width: 100%;
          }
          .color-selector {
            display: flex;
            justify-content: center;
            margin-bottom: 1.5rem;
            gap: 0.75rem;
          }
          .color-option {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          }
          .color-option:hover {
            transform: scale(1.15);
          }
          .color-option.active {
            border: 2px solid #fff;
            box-shadow: 0 0 0 2px ${currentScheme.primary};
          }
          .color-purple {
            background: ${colorSchemes.purple.gradient};
          }
          .color-blue {
            background: ${colorSchemes.blue.gradient};
          }
          .color-teal {
            background: ${colorSchemes.teal.gradient};
          }
          .color-crimson {
            background: ${colorSchemes.crimson.gradient};
          }
          .form-card {
            width: 100%;
            max-width: 500px;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            position: relative;
            transition: all 0.3s ease;
          }
          .form-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.3);
          }
          .form-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: ${currentScheme.gradient};
            transition: all 0.3s ease;
          }
          @media (max-width: 576px) {
            .form-card {
              max-width: 90%;
            }
          }
          @media (min-width: 1600px) {
            .form-card {
              max-width: 600px;
            }
          }
          .form-header {
            padding: 2rem 1.5rem 1rem;
            text-align: center;
            background-color: #f9fafb;
            position: relative;
            overflow: hidden;
          }
          .form-header::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 0;
            right: 0;
            height: 20px;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          .avatar-container {
            display: flex;
            justify-content: center;
            margin: 1.75rem 0;
            position: relative;
          }
          .avatar {
            width: 110px;
            height: 110px;
            border-radius: 50%;
            background-color: ${currentScheme.accent};
            border: 4px solid white;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            transition: all 0.3s ease;
          }
          .avatar::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 50%;
            box-shadow: inset 0 0 0 2px ${currentScheme.secondary};
            opacity: 0.5;
            pointer-events: none;
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
          .form-container {
            padding: 2rem;
          }
          @media (min-width: 640px) {
            .form-container {
              padding: 2.5rem 3rem;
            }
          }
          .input-field {
            width: 100%;
            padding: 0.875rem 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            background-color: #f9fafb;
            color: black;
          }
          .input-field:focus {
            outline: none;
            border-color: ${currentScheme.primary};
            box-shadow: 0 0 0 3px ${currentScheme.accent};
            background-color: #ffffff;
            color: black;
          }
          .input-field::placeholder {
            color: rgb(33, 36, 41);
          }
          .submit-button {
            width: 100%;
            padding: 0.975rem;
            background: ${currentScheme.gradient};
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
          }
          .submit-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
          }
          .submit-button:active {
            transform: translateY(0);
          }
          .submit-button::after {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: rgba(255, 255, 255, 0.1);
            transform: rotate(30deg);
            transition: all 0.3s ease;
          }
          .submit-button:hover::after {
            transform: rotate(30deg) translate(10%, 10%);
          }
          .submit-button.loading {
            background: ${currentScheme.secondary};
            cursor: not-allowed;
          }
          .forgot-link {
            color: ${currentScheme.primary};
            text-decoration: none;
            transition: all 0.2s ease;
            font-size: 0.85rem;
            font-weight: 500;
          }
          .forgot-link:hover {
            color: ${currentScheme.secondary};
            text-decoration: underline;
          }
          .register-section {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
            border: 1px solid #e5e7eb;
            transition: all 0.3s ease;
          }
          .register-section:hover {
            background-color: ${currentScheme.accent};
            border-color: ${currentScheme.secondary};
          }
          .register-link {
            color: ${currentScheme.primary};
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .register-link:hover {
            color: ${currentScheme.secondary};
            text-decoration: underline;
          }
          .footer {
            background: #1f2937;
            color: #f9fafb;
            padding: 2rem 1rem;
            width: 100%;
            position: relative;
            overflow: hidden;
          }
          .footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: ${currentScheme.gradient};
          }
          .footer-content {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .footer-logo {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 1rem;
            background: ${currentScheme.gradient};
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            transition: all 0.3s ease;
          }
          .footer-links {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            margin-bottom: 1rem;
            gap: 0.75rem;
          }
          .footer-link {
            color: #d1d5db;
            text-decoration: none;
            margin: 0 0.5rem;
            font-size: 0.85rem;
            transition: all 0.2s ease;
            position: relative;
          }
          .footer-link::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 0;
            height: 1px;
            background: ${currentScheme.secondary};
            transition: all 0.3s ease;
          }
          .footer-link:hover {
            color: white;
          }
          .footer-link:hover::after {
            width: 100%;
          }
          .footer-copyright {
            font-size: 0.8rem;
            color: #9ca3af;
          }
          @media (min-width: 768px) {
            .footer-content {
              flex-direction: row;
              justify-content: space-between;
              text-align: left;
              flex-wrap: wrap;
              padding: 0 2rem;
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
              margin-top: 1.5rem;
            }
          }
          @media (min-width: 1024px) {
            .footer-content {
              flex-wrap: nowrap;
              padding: 0 4rem;
            }
            .footer-copyright {
              width: auto;
              text-align: right;
              order: 3;
              margin-top: 0;
            }
          }
          .alert {
            border-left: 4px solid #ef4444;
            border-radius: 8px;
            background-color: #fee2e2;
            transition: all 0.3s ease;
          }
          .social-signin {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin: 1.5rem 0;
          }
          .social-button {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            gap: 0.75rem;
            border: 1px solid #e5e7eb;
            background-color: white;
            color: #4b5563;
          }
          .social-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .social-button.google {
            color: #ea4335;
          }
          .social-button.facebook {
            color: #3b5998;
          }
          .separator {
            display: flex;
            align-items: center;
            text-align: center;
            margin: 1.5rem 0;
            color: #9ca3af;
          }
          .separator::before,
          .separator::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid #e5e7eb;
          }
          .separator::before {
            margin-right: 1rem;
          }
          .separator::after {
            margin-left: 1rem;
          }
        `}
      </style>

      <div className="app-container">
        <header className="header">
          <div className="header-container">
            <div className="logo-container">
              <h1 className="logo">NexNest</h1>
              <h2 className="tagline">Student Accommodation Platform</h2>
            </div>
            <nav className="nav">
              <button className="nav-button" onClick={handleNavigation}>
                Create Account
              </button>
            </nav>
          </div>
        </header>

        <main className="main-content">
          <div className="color-selector">
            <div
              className={`color-option color-purple ${colorScheme === 'purple' ? 'active' : ''}`}
              onClick={() => changeColorScheme('purple')}
              title="Purple Theme"
            ></div>
            <div
              className={`color-option color-blue ${colorScheme === 'blue' ? 'active' : ''}`}
              onClick={() => changeColorScheme('blue')}
              title="Blue Theme"
            ></div>
            <div
              className={`color-option color-teal ${colorScheme === 'teal' ? 'active' : ''}`}
              onClick={() => changeColorScheme('teal')}
              title="Teal Theme"
            ></div>
            <div
              className={`color-option color-crimson ${colorScheme === 'crimson' ? 'active' : ''}`}
              onClick={() => changeColorScheme('crimson')}
              title="Crimson Theme"
            ></div>
          </div>

          <div className="form-card">
            <div className="form-header">
              <h2 className="h4 fw-bold mb-2">Welcome Back</h2>
              <p className="text-muted mb-0">
                {loginMessage || 'Sign in to access your NexNest account'}
              </p>
            </div>

            <div className="avatar-container">
              <div className="avatar">
                <img
                  src="/OIP.jpeg"
                  alt="User avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>

            <div className="form-container">
              {error && (
                <div className="alert d-flex align-items-center mb-4 p-3" role="alert">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    className="me-2"
                    viewBox="0 0 16 16"
                  >
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="social-signin">
                <button className="social-button google">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M15.545 6.642a7.902 7.902 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002-.002C11.978 15.376 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" />
                  </svg>
                  Continue with Google
                </button>
                <button className="social-button facebook">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303 .621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z" />
                  </svg>
                  Continue with Facebook
                </button>
              </div>

              <div className="separator">OR</div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="Your email"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="Your password"
                    required
                  />
                </div>

                <div className="text-end mb-4">
                  <a href="#" className="forgot-link">
                    Forgot Password?
                  </a>
                </div>

                <div className="mb-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`submit-button ${isLoading ? 'loading' : ''}`}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </button>
                </div>

                <div className="register-section">
                  <span className="text-muted">Don't have an account yet?</span>{' '}
                  <span className="register-link" onClick={handleNavigation}>
                    Create an Account
                  </span>
                </div>
              </form>
            </div>
          </div>
        </main>

        <footer className="footer">
          <div className="container footer-content">
            <div className="footer-logo">NexNest</div>
            <div className="footer-links">
              <a href="#" className="footer-link">About</a>
              <a href="#" className="footer-link">Privacy Policy</a>
              <a href="#" className="footer-link">Terms of Service</a>
              <a href="#" className="footer-link">Contact</a>
            </div>
            <div className="footer-copyright">© 2025 NexNest. All rights reserved.</div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LoginPage;