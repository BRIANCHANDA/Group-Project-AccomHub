
import { useState, useEffect } from 'react';
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
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [userCaptchaAnswer, setUserCaptchaAnswer] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);

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

  const generateCaptcha = () => {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2, answer;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 20) + 10;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 - num2;
        break;
      case '*':
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 * num2;
        break;
      default:
        num1 = 5;
        num2 = 3;
        answer = 8;
    }
    
    const question = `${num1} ${operation} ${num2} = ?`;
    setCaptchaQuestion(question);
    setCaptchaAnswer(answer.toString());
    setCaptchaVerified(false);
    setUserCaptchaAnswer('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const verifyCaptcha = () => {
    if (userCaptchaAnswer.trim() === captchaAnswer) {
      setCaptchaVerified(true);
      setError('');
      return true;
    } else {
      setCaptchaVerified(false);
      setError('Incorrect verification. Please try again.');
      generateCaptcha();
      return false;
    }
  };

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

    if (!captchaVerified) {
      if (!verifyCaptcha()) {
        return;
      }
    }

    setIsLoading(true);

    try {
      console.log('Attempting login with:', { email });
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password,
          humanVerified: captchaVerified
        }),
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
      generateCaptcha();
      setCaptchaVerified(false);
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
          
          :root {
            --primary-color: ${currentScheme.primary};
            --secondary-color: ${currentScheme.secondary};
            --accent-color: ${currentScheme.accent};
            --gradient: ${currentScheme.gradient};
            --spacing-xs: 0.5rem;
            --spacing-sm: 1rem;
            --spacing-md: 1.5rem;
            --spacing-lg: 2rem;
            --spacing-xl: 3rem;
            --radius-sm: 0.5rem;
            --radius-md: 0.75rem;
            --radius-lg: 1rem;
            --radius-xl: 1.5rem;
            --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 15px rgba(0, 0, 0, 0.08);
            --shadow-lg: 0 8px 25px rgba(0, 0, 0, 0.1);
            --transition-normal: 0.3s ease;
          }

          * {
            box-sizing: border-box;
          }

          body, html {
            margin: 0;
            padding: 0;
            font-family: 'Poppins', sans-serif;
            background-color: #f8f9fa;
            width: 100%;
            overflow-x: hidden;
          }

          .app-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            width: 100%;
          }

          /* Header Styles */
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
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 var(--spacing-md);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .logo-container {
            display: flex;
            flex-direction: column;
          }

          .logo {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--primary-color);
            margin: 0;
            background: var(--gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .tagline {
            font-size: 0.85rem;
            color: #6b7280;
            font-weight: 400;
            margin: 0;
            margin-top: -2px;
          }

          .nav-button {
            background-color: transparent;
            color: var(--primary-color);
            border: 2px solid var(--primary-color);
            border-radius: 50px;
            padding: 0.5rem 1.5rem;
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
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: calc(80px + var(--spacing-lg)) var(--spacing-md) var(--spacing-lg);
            max-width: 1200px;
            margin: 0 auto;
            width: 100%;
          }

          /* Color Selector */
          .color-selector {
            display: flex;
            justify-content: center;
            margin-bottom: var(--spacing-lg);
            gap: var(--spacing-sm);
          }

          .color-option {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            transition: all var(--transition-normal);
            border: 3px solid #ffffff;
            box-shadow: var(--shadow-sm);
          }

          .color-option:hover {
            transform: scale(1.1);
          }

          .color-option.active {
            border: 3px solid #fff;
            box-shadow: 0 0 0 3px var(--primary-color);
            transform: scale(1.05);
          }

          .color-purple { background: ${colorSchemes.purple.gradient}; }
          .color-blue { background: ${colorSchemes.blue.gradient}; }
          .color-teal { background: ${colorSchemes.teal.gradient}; }
          .color-crimson { background: ${colorSchemes.crimson.gradient}; }

          /* Form Card */
          .form-card {
            width: 100%;
            max-width: 450px;
            background-color: #ffffff;
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-lg);
            overflow: hidden;
            position: relative;
            transition: all var(--transition-normal);
          }

          .form-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          }

          .form-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--gradient);
          }

          .form-header {
            padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md);
            text-align: center;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-bottom: 1px solid #e2e8f0;
          }

          .form-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 0.5rem 0;
          }

          .form-subtitle {
            color: #64748b;
            margin: 0;
            font-size: 0.95rem;
          }

          /* Avatar */
          .avatar-container {
            display: flex;
            justify-content: center;
            margin: var(--spacing-lg) 0;
          }

          .avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background-color: var(--accent-color);
            border: 4px solid white;
            box-shadow: var(--shadow-md);
            overflow: hidden;
            position: relative;
          }

          .avatar::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 50%;
            box-shadow: inset 0 0 0 2px var(--secondary-color);
            opacity: 0.3;
          }

          .avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          /* Form Container */
          .form-container {
            padding: 0 var(--spacing-lg) var(--spacing-lg);
          }

          /* Social Buttons */
          .social-signin {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs);
            margin-bottom: var(--spacing-md);
          }

          .social-button {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem;
            border-radius: var(--radius-md);
            font-weight: 500;
            cursor: pointer;
            transition: all var(--transition-normal);
            gap: var(--spacing-xs);
            border: 2px solid #e5e7eb;
            background-color: white;
            color: #4b5563;
            font-size: 0.9rem;
          }

          .social-button:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
            border-color: #d1d5db;
          }

          .social-button.google { color: #ea4335; }
          .social-button.facebook { color: #3b5998; }

          /* Separator */
          .separator {
            display: flex;
            align-items: center;
            text-align: center;
            margin: var(--spacing-md) 0;
            color: #9ca3af;
            font-size: 0.85rem;
          }

          .separator::before,
          .separator::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid #e5e7eb;
          }

          .separator::before { margin-right: var(--spacing-sm); }
          .separator::after { margin-left: var(--spacing-sm); }

          /* Form Elements */
          .form-group {
            margin-bottom: var(--spacing-md);
          }

          .form-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #374151;
            font-size: 0.9rem;
          }

          .input-field {
            width: 100%;
            padding: 0.875rem 1rem;
            border: 2px solid #e5e7eb;
            border-radius: var(--radius-md);
            font-size: 0.95rem;
            transition: all var(--transition-normal);
            background-color: #f9fafb;
            color: #1f2937;
          }

          .input-field:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px var(--accent-color);
            background-color: #ffffff;
          }

          .input-field::placeholder {
            color: #9ca3af;
          }

          /* Captcha */
          .captcha-container {
            background-color: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: var(--radius-md);
            padding: var(--spacing-md);
            margin-bottom: var(--spacing-md);
            text-align: center;
          }

          .captcha-header {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: var(--spacing-xs);
            gap: var(--spacing-xs);
          }

          .captcha-label {
            color: #6b7280;
            font-size: 0.85rem;
            font-weight: 500;
          }

          .captcha-refresh {
            background: none;
            border: none;
            color: var(--primary-color);
            cursor: pointer;
            padding: 0.25rem;
            border-radius: var(--radius-sm);
            transition: all var(--transition-normal);
          }

          .captcha-refresh:hover {
            background-color: var(--accent-color);
          }

          .captcha-question {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--primary-color);
            background: white;
            padding: 0.75rem 1.25rem;
            border-radius: var(--radius-md);
            display: inline-block;
            margin-bottom: var(--spacing-sm);
            box-shadow: var(--shadow-sm);
            border: 1px solid #e5e7eb;
          }

          .captcha-input-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--spacing-xs);
          }

          .captcha-input {
            width: 80px;
            padding: 0.5rem;
            border: 2px solid #dee2e6;
            border-radius: var(--radius-sm);
            text-align: center;
            font-size: 1.1rem;
            font-weight: 600;
            background: white;
          }

          .captcha-input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 2px var(--accent-color);
          }

          .captcha-verified {
            border-color: #22c55e;
            background-color: #f0fdf4;
          }

          .captcha-verified .captcha-question {
            color: #22c55e;
            border-color: #22c55e;
          }

          /* Form Controls */
          .form-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--spacing-md);
          }

          .checkbox-container {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .checkbox {
            width: 16px;
            height: 16px;
          }

          .checkbox-label {
            color: #6b7280;
            font-size: 0.85rem;
            margin: 0;
          }

          .forgot-link {
            color: var(--primary-color);
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: 500;
            transition: all var(--transition-normal);
          }

          .forgot-link:hover {
            color: var(--secondary-color);
            text-decoration: underline;
          }

          /* Submit Button */
          .submit-button {
            width: 100%;
            padding: 1rem;
            background: var(--gradient);
            color: white;
            border: none;
            border-radius: var(--radius-md);
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-normal);
            box-shadow: var(--shadow-sm);
            margin-bottom: var(--spacing-md);
          }

          .submit-button:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
          }

          .submit-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
          }

          .loading-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }

          .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Register Section */
          .register-section {
            background-color: #f8fafc;
            border-radius: var(--radius-md);
            padding: var(--spacing-md);
            text-align: center;
            border: 1px solid #e2e8f0;
            transition: all var(--transition-normal);
          }

          .register-section:hover {
            background-color: var(--accent-color);
            border-color: var(--secondary-color);
          }

          .register-text {
            color: #64748b;
            margin: 0;
            font-size: 0.9rem;
          }

          .register-link {
            color: var(--primary-color);
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-normal);
          }

          .register-link:hover {
            color: var(--secondary-color);
            text-decoration: underline;
          }

          /* Alert */
          .alert {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            margin-bottom: var(--spacing-md);
            border: 1px solid #fecaca;
            border-left: 4px solid #ef4444;
            border-radius: var(--radius-md);
            background-color: #fef2f2;
            color: #dc2626;
            font-size: 0.9rem;
          }

          .alert svg {
            margin-right: 0.5rem;
            flex-shrink: 0;
          }

          /* Footer */
          .footer {
            background-color: #202733ff;
            color: #1f2329ff;
            width: 100%;
            margin-top: auto;
          }

          .footer-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: var(--spacing-xl) var(--spacing-md) var(--spacing-lg);
          }

          .footer-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: var(--spacing-md);
          }

          .footer-logo {
            font-size: 1.5rem;
            font-weight: 700;
            color: #e2e8f0;
            margin: 0;
          }

          .footer-links {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: var(--spacing-md);
          }

          .footer-link {
            color: #a0aec0;
            text-decoration: none;
            font-size: 0.9rem;
            transition: color var(--transition-normal);
          }

          .footer-link:hover {
            color: #e2e8f0;
          }

          .footer-copyright {
            font-size: 0.85rem;
            color: #718096;
          }

          /* Responsive Design */
          @media (min-width: 768px) {
            .footer-content {
              flex-direction: row;
              justify-content: space-between;
              text-align: left;
            }

            .footer-links {
              order: 2;
            }

            .footer-copyright {
              order: 3;
            }
          }

          @media (max-width: 640px) {
            .header-container {
              padding: 0 var(--spacing-sm);
            }

            .main-content {
              padding: calc(80px + var(--spacing-md)) var(--spacing-sm) var(--spacing-md);
            }

            .form-card {
              margin: 0 var(--spacing-xs);
            }

            .logo {
              font-size: 1.5rem;
            }

            .tagline {
              font-size: 0.75rem;
            }

            .nav-button {
              padding: 0.4rem 1rem;
              font-size: 0.85rem;
            }

            .color-option {
              width: 35px;
              height: 35px;
            }

            .footer-links {
              gap: var(--spacing-sm);
            }

            .footer-link {
              font-size: 0.85rem;
            }
          }
        `}
      </style>

      <div className="app-container">
        <header className="header">
          <div className="header-container">
            <div className="logo-container">
              <h1 className="logo">🏠 CribConnect</h1>
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
                    <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.125 3.125v1.372h-1.732V8.05H6.75v1.375H4.719v5.625C1.418 15.397-.002 12.067-.002 8.05c0-4.446 3.582-8.05 8-8.05s8 3.604 8 8.049z" />
                  </svg>
                  Continue with Facebook
                </button>
              </div>

              <div className="separator">or</div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="input-field"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="form-label fw-medium">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    className="input-field"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className={`captcha-container ${captchaVerified ? 'captcha-verified' : ''}`}>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <span className="me-2 text-muted small">Human Verification:</span>
                    <button
                      type="button"
                      className="captcha-refresh"
                      onClick={generateCaptcha}
                      title="Refresh question"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                      </svg>
                    </button>
                  </div>
                  <div className="captcha-question">{captchaQuestion}</div>
                  <div className="d-flex align-items-center justify-content-center">
                    <input
                      type="number"
                      className="captcha-input"
                      value={userCaptchaAnswer}
                      onChange={(e) => setUserCaptchaAnswer(e.target.value)}
                      placeholder="?"
                      required
                    />
                    {captchaVerified && (
                      <span className="text-success ms-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                        </svg>
                      </span>
                    )}
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="rememberMe" />
                    <label className="form-check-label text-muted small" htmlFor="rememberMe">
                      Remember me
                    </label>
                  </div>
                  <a href="#" className="forgot-link">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  className={`submit-button ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="d-flex align-items-center justify-content-center">
                      <div
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></div>
                      Signing In...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="register-section mt-4">
                <p className="mb-2 text-muted">
                  Don't have an account?{' '}
                  <span className="register-link" onClick={handleNavigation}>
                    Create one here
                  </span>
                </p>
              </div>
            </div>
          </div>
        

        <footer className="footer">
          <div className="container">
            <div className="property-section">
              <div className="footer-content">
                <div className="footer-logo">🏠 CribConnect</div>
                <div className="footer-links">
                  <a href="#" className="footer-link">About Us</a>
                  <a href="#" className="footer-link">Contact</a>
                  <a href="#" className="footer-link">Privacy Policy</a>
                  <a href="#" className="footer-link">Terms of Service</a>
                  <a href="#" className="footer-link">Help Center</a>
                </div>
                <div className="footer-copyright">
                  © 2025 🏠 CribConnect. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
      </div>
    </>
  );
};

export default LoginPage;
