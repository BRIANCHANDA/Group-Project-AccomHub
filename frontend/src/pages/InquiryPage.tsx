import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './details.css';

// Constants
const COLORS = {
  PRIMARY: '#4361ee',
  PRIMARY_DARK: '#3a56d4',
  SECONDARY: '#f8f9fa',
  TEXT_DARK: '#212529',
  TEXT_LIGHT: '#6c757d',
};

const POLLING_INTERVAL = 10000; // 10 seconds

const InquiryPage = () => {
  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  // State from location
  const { propertyId, inquiryId, studentId: initialStudentId } = location.state || {};
  
  // Component state
  const [state, setState] = useState({
    messages: [],
    newMessage: '',
    submitting: false,
    error: '',
    currentUser: null,
    propertyTitle: 'Property Inquiry',
    isLoading: true,
    landlordId: null,
  });

  // Destructure state for easier access
  const {
    messages,
    newMessage,
    submitting,
    error,
    currentUser,
    propertyTitle,
    isLoading,
    landlordId
  } = state;

  // Derived state
  const studentId = initialStudentId || currentUser?.id;
  const hasRequiredIds = inquiryId && studentId && propertyId && landlordId;

  // Helper function to update state
  const updateState = (newState) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Validate user session
  const validateUser = useCallback(async () => {
    console.log('Validating user session...');
    updateState({ isLoading: true });

    try {
      if (!propertyId) {
        console.error('No propertyId provided');
        updateState({ error: 'Invalid property selection' });
        navigate('/studentdashboard');
        return;
      }

      const userData = localStorage.getItem('user');
      if (!userData) {
        console.log('No user session found');
        navigate('/login', {
          state: {
            from: '/inquiry',
            propertyId,
            message: 'Please log in to send messages',
          },
        });
        return;
      }

      const parsedUser = JSON.parse(userData);
      if (!parsedUser?.id || !parsedUser?.email || parsedUser.userType !== 'student') {
        console.error('Invalid user data');
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        navigate('/login', {
          state: {
            from: '/inquiry',
            propertyId,
            message: 'Invalid user data. Please log in again.',
          },
        });
        return;
      }

      console.log('User validated successfully');
      updateState({ currentUser: parsedUser });
    } catch (error) {
      console.error('User validation error:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      navigate('/login', {
        state: {
          from: '/inquiry',
          propertyId,
          message: 'Session error. Please log in again.',
        },
      });
    } finally {
      updateState({ isLoading: false });
    }
  }, [navigate, propertyId]);

  // Fetch messages for the inquiry
  const fetchMessages = useCallback(async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/messages/users/${currentUser.id}/messages`, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to fetch messages');
      }

      const data = await response.json();
      console.log('Fetched messages:', data.length);

      const formattedMessages = data.map((msg: { id: any; content: any; sender: any; createdAt: any; inquiryId: any; propertyId: any; }) => ({
        id: msg.id,
        message: msg.content,
        senderId: msg.sender,
        senderType: msg.sender === currentUser.id ? 'student' : 'landlord',
        timestamp: msg.createdAt || new Date().toISOString(),
        inquiryId: msg.inquiryId,
        propertyId: msg.propertyId || propertyId,
      }));

      const relevantMessages = formattedMessages.filter(
        (        msg: { inquiryId: any; propertyId: any; }) => (inquiryId && msg.inquiryId === inquiryId) || msg.propertyId === propertyId
      );

      updateState({ messages: relevantMessages });
      scrollToBottom();
    } catch (error) {
      console.error('Message fetch error:', error);
      updateState({ error: error.message || 'Failed to load messages' });
    }
  }, [currentUser, inquiryId, propertyId, scrollToBottom]);

  // Fetch property details (including landlordId)
  const fetchPropertyDetails = useCallback(async () => {
    if (!currentUser || !propertyId) return;

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to fetch property');
      }

      const data = await response.json();
      console.log('Fetched property details:', data);

      updateState({
        landlordId: data.landlordId,
        propertyTitle: data.title || 'Property Inquiry'
      });
    } catch (error) {
      console.error('Property fetch error:', error);
      updateState({ error: error.message || 'Failed to load property details' });
    }
  }, [currentUser, propertyId]);

  // Create new inquiry if needed
  const createInquiry = useCallback(async () => {
    if (inquiryId || !currentUser || !propertyId || !studentId) return;

    try {
      const response = await fetch('/api/inquiries/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          studentId,
          propertyId,
          email: currentUser.email,
          phoneNumber: currentUser.phoneNumber || '',
          message: 'Initial inquiry',
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to create inquiry');
      }

      const data = await response.json();
      console.log('Created new inquiry:', data.inquiryId);

      navigate(location.pathname, {
        state: { ...location.state, inquiryId: data.inquiryId },
        replace: true,
      });
    } catch (error) {
      console.error('Inquiry creation error:', error);
      updateState({ error: error.message || 'Failed to start conversation' });
    }
  }, [inquiryId, currentUser, propertyId, studentId, navigate, location]);

  // Message validation
  const validateMessage = () => {
    if (!newMessage.trim()) return 'Message cannot be empty';
    if (newMessage.length < 2) return 'Message must be at least 2 characters';
    return null;
  };

  // Handle message submission
  const handleSendMessage = async (e) => {
    e.preventDefault();
    updateState({ error: '', submitting: true });

    const validationError = validateMessage();
    if (validationError) {
      updateState({ error: validationError, submitting: false });
      return;
    }

    if (!hasRequiredIds) {
      console.error('Missing required IDs:', { inquiryId, studentId, propertyId, landlordId });
      updateState({ 
        error: 'System error. Please try again later.',
        submitting: false 
      });
      return;
    }

    try {
      const response = await fetch('/api/messages/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          senderId: studentId,
          receiverId: landlordId,
          content: newMessage,
          propertyId,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to send message');
      }

      updateState({ newMessage: '' });
      await fetchMessages(); // Refresh messages immediately
    } catch (error) {
      console.error('Message submission error:', error);
      updateState({ error: error.message || 'Failed to send message' });
    } finally {
      updateState({ submitting: false });
    }
  };

  // Navigation handler
  const handleNavigation = useCallback((path) => {
    const paths = {
      home: '/studentdashboard',
      services: '/services',
      community: '/community',
      contact: '/contact',
      profile: '/profile',
      saved: '/saved-properties',
      settings: '/settings',
      logout: '/logout',
    };
    navigate(paths[path] || `/${path}`);
  }, [navigate]);

  // Initial setup effects
  useEffect(() => {
    validateUser();
  }, [validateUser]);

  useEffect(() => {
    if (currentUser && propertyId) {
      fetchPropertyDetails();
    }
  }, [currentUser, propertyId, fetchPropertyDetails]);

  useEffect(() => {
    createInquiry();
  }, [createInquiry]);

  // Polling effect for messages
  useEffect(() => {
    if (!currentUser) return;

    fetchMessages(); // Initial fetch
    const interval = setInterval(fetchMessages, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [currentUser, fetchMessages]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" style={{ color: COLORS.PRIMARY }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading your messages...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container">
          <a
            className="navbar-brand"
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavigation('home');
            }}
          >
            <span className="logo-icon me-2">🏠</span>
            <span className="logo-text">NexNest</span>
          </a>
          
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center">
              {['home', 'services', 'community', 'contact'].map((item) => (
                <li className="nav-item" key={item}>
                  <a
                    className="nav-link"
                    href={`#${item}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation(item);
                    }}
                  >
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </a>
                </li>
              ))}
              
              <li className="nav-item dropdown ms-lg-2">
                <button
                  className="btn btn-outline-primary dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-person me-1"></i>
                  {currentUser ? currentUser.name || 'Student' : 'Guest'}
                </button>
                
                <ul className="dropdown-menu dropdown-menu-end">
                  {currentUser ? (
                    <>
                      <li>
                        <a className="dropdown-item" href="#" onClick={() => handleNavigation('profile')}>
                          <i className="bi bi-person me-2"></i>Profile
                        </a>
                      </li>
                      <li>
                        <a className="dropdown-item" href="#" onClick={() => handleNavigation('saved')}>
                          <i className="bi bi-bookmark me-2"></i>Saved Properties
                        </a>
                      </li>
                      <li>
                        <a className="dropdown-item" href="#" onClick={() => handleNavigation('settings')}>
                          <i className="bi bi-gear me-2"></i>Settings
                        </a>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <a className="dropdown-item" href="#" onClick={() => handleNavigation('logout')}>
                          <i className="bi bi-box-arrow-right me-2"></i>Logout
                        </a>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <a className="dropdown-item" href="#" onClick={() => handleNavigation('login')}>
                          <i className="bi bi-box-arrow-in-right me-2"></i>Login
                        </a>
                      </li>
                      <li>
                        <a className="dropdown-item" href="#" onClick={() => handleNavigation('register')}>
                          <i className="bi bi-person-plus me-2"></i>Register
                        </a>
                      </li>
                    </>
                  )}
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content py-5">
        <div className="container">
          <div className="chat-section">
            <h2 className="mb-4 fw-bold" style={{ color: COLORS.PRIMARY }}>
              Chat for {propertyTitle}
            </h2>

            {error && (
              <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div>{error}</div>
              </div>
            )}

            <div 
              className="chat-container border rounded p-3 bg-white" 
              style={{ height: '400px', overflowY: 'auto' }}
            >
              {messages.length === 0 ? (
                <div className="text-center text-muted py-5">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={`${message.id}-${message.timestamp}`}
                    className={`d-flex mb-3 ${message.senderType === 'student' ? 'justify-content-start' : 'justify-content-end'}`}
                  >
                    <div
                      className={`p-2 rounded ${message.senderType === 'student' ? 'bg-primary text-white' : 'bg-secondary'}`}
                      style={{
                        maxWidth: '70%',
                        backgroundColor: message.senderType === 'student' ? COLORS.PRIMARY : COLORS.SECONDARY,
                        color: message.senderType === 'student' ? '#fff' : COLORS.TEXT_DARK,
                      }}
                    >
                      <p className="mb-1">{message.message}</p>
                      <small className={message.senderType === 'student' ? 'text-light' : 'text-muted'}>
                        {new Date(message.timestamp).toLocaleString()}
                      </small>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="mt-3">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  value={newMessage}
                  onChange={(e) => updateState({ newMessage: e.target.value })}
                  placeholder="Type your message..."
                  disabled={submitting || !hasRequiredIds}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !hasRequiredIds}
                  style={{ 
                    backgroundColor: COLORS.PRIMARY, 
                    borderColor: COLORS.PRIMARY 
                  }}
                >
                  {submitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      Sending...
                    </>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-3">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate(-1)}
              >
                Back to Property
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h5>NexNest</h5>
              <p className="text-muted">Your trusted platform for student accommodation.</p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="mb-0">© {new Date().getFullYear()} NexNest. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InquiryPage;