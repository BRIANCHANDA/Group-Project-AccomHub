import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MessageCircle, Mail, Phone, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Home, Send } from "lucide-react";
import "./Inquiries.css";

// Inquiry status type
type InquiryStatus = "pending" | "contacted" | "rejected" | "approved";

// Message interface for conversation
interface Message {
  id: number;
  inquiryId: number;
  senderId: number;
  senderType: "landlord" | "student";
  content: string;
  timestamp: string;
}

// Inquiry interface
interface Inquiry {
  inquiryId: number;
  propertyId: number;
  studentId: number;
  status: InquiryStatus;
  message: string;
  contactPreference: string;
  createdAt: string | null;
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  messages?: Message[];
}

// Property interface
interface Property {
  id: number | string;
  title?: string;
  location: string;
  imageUrl?: string | null;
}

const Inquiries = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const landlordId = location.state?.landlordId || 1;
  const [landlordName, setLandlordName] = useState("Landlord");
  const { propertyId } = useParams<{ propertyId?: string }>();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [filter, setFilter] = useState<InquiryStatus | 'all'>('all');
  const [newMessage, setNewMessage] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('landlordDashboardTheme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
    document.body.className = savedTheme === 'dark' ? 'dark-theme' : 'light-theme';
  }, []);

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-theme' : 'light-theme';
  }, [isDarkMode]);

  useEffect(() => {
    if (!landlordId) {
      navigate('/login', { state: { message: "Please login to access your dashboard" } });
      return;
    }

    const fetchProperties = async () => {
      try {
        const response = await fetch(`/api/property-images/landlords/${landlordId}/properties`);
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        const data = await response.json();
        const mappedProperties = data.properties.map((prop: any) => ({
          id: prop.id,
          title: prop.title || '',
          location: prop.location,
          imageUrl: prop.imageUrl
        }));
        setProperties(mappedProperties);
        if (data.landlordName) {
          setLandlordName(data.landlordName);
        }
        if (propertyId) {
          fetchInquiriesForProperty(propertyId);
        } else {
          fetchAllInquiries(mappedProperties.map(p => p.id));
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [landlordId, propertyId, navigate]);

  const fetchInquiriesForProperty = async (propId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/inquiries/properties/${propId}/inquiries`);
      if (!response.ok) {
        throw new Error('Failed to fetch inquiries');
      }
      const data = await response.json();
      const enhancedInquiries = await enhanceInquiriesWithStudentInfo(data);
      setInquiries(enhancedInquiries);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllInquiries = async (propertyIds: (number | string)[]) => {
    setIsLoading(true);
    try {
      let allInquiries: Inquiry[] = [];
      for (const propId of propertyIds) {
        const response = await fetch(`/api/inquiries/properties/${propId}/inquiries`);
        if (response.ok) {
          const data = await response.json();
          allInquiries = [...allInquiries, ...data];
        }
      }
      const enhancedInquiries = await enhanceInquiriesWithStudentInfo(allInquiries);
      setInquiries(enhancedInquiries);
    } catch (error) {
      console.error('Error fetching all inquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const enhanceInquiriesWithStudentInfo = async (inquiriesList: Inquiry[]) => {
    return inquiriesList.map(inquiry => {
      const studentInfo = {
        studentName: `Student ${inquiry.studentId}`,
        studentEmail: `student${inquiry.studentId}@example.com`,
        studentPhone: `+26097${Math.floor(1000000 + Math.random() * 9000000)}`,
      };
      const messages: Message[] = [];
      messages.push({
        id: 1,
        inquiryId: inquiry.inquiryId,
        senderId: inquiry.studentId,
        senderType: "student",
        content: inquiry.message,
        timestamp: inquiry.createdAt || new Date().toISOString()
      });
      if (inquiry.status === 'contacted' || inquiry.status === 'approved') {
        messages.push({
          id: 2,
          inquiryId: inquiry.inquiryId,
          senderId: landlordId,
          senderType: "landlord",
          content: "Thank you for your interest in our property. When would you like to schedule a viewing?",
          timestamp: addDays(inquiry.createdAt || new Date().toISOString(), 1)
        });
        messages.push({
          id: 3,
          inquiryId: inquiry.inquiryId,
          senderId: inquiry.studentId,
          senderType: "student",
          content: "I would be available this weekend, preferably Saturday afternoon. Is that possible?",
          timestamp: addDays(inquiry.createdAt || new Date().toISOString(), 2)
        });
      }
      return { ...inquiry, ...studentInfo, messages };
    });
  };

  const addDays = (dateString: string, days: number): string => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  };

  const handleInquiryClick = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
  };

  const handleStatusUpdate = async (inquiryId: number, newStatus: InquiryStatus) => {
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error('Failed to update inquiry status');
      }
      setInquiries(prevInquiries =>
        prevInquiries.map(inq =>
          inq.inquiryId === inquiryId ? { ...inq, status: newStatus } : inq
        )
      );
      if (selectedInquiry && selectedInquiry.inquiryId === inquiryId) {
        setSelectedInquiry({ ...selectedInquiry, status: newStatus });
      }
      if (newStatus === 'contacted' && selectedInquiry) {
        const hasLandlordMessages = selectedInquiry.messages?.some(m => m.senderType === 'landlord');
        if (!hasLandlordMessages) {
          handleSendMessage("Thank you for your interest in our property. How can I help you?");
        }
      }
    } catch (error) {
      console.error('Error updating inquiry status:', error);
    }
  };

  const handleSendMessage = async (messageContent: string = newMessage) => {
    if (!selectedInquiry || !messageContent.trim()) return;
    try {
      const newMessageObj: Message = {
        id: Date.now(),
        inquiryId: selectedInquiry.inquiryId,
        senderId: landlordId,
        senderType: "landlord",
        content: messageContent.trim(),
        timestamp: new Date().toISOString()
      };
      const response = await fetch(`/api/inquiries/${selectedInquiry.inquiryId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessageObj),
      });
      const updatedInquiry = {
        ...selectedInquiry,
        messages: [...(selectedInquiry.messages || []), newMessageObj],
        status: selectedInquiry.status === 'pending' ? 'contacted' : selectedInquiry.status
      };
      setSelectedInquiry(updatedInquiry);
      setInquiries(prevInquiries =>
        prevInquiries.map(inq =>
          inq.inquiryId === selectedInquiry.inquiryId ? updatedInquiry : inq
        )
      );
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleMessageInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  };

  const handleMessageKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBackToDashboard = () => {
    navigate('/LandlordDashboard', { state: { landlordId } });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPropertyById = (id: number): Property | undefined => {
    return properties.find(p => Number(p.id) === id);
  };

  const getStatusIcon = (status: InquiryStatus) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'contacted': return <AlertCircle size={16} />;
      case 'approved': return <CheckCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusColor = (status: InquiryStatus) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'contacted': return '#3b82f6';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredInquiries = filter === 'all'
    ? inquiries
    : inquiries.filter(inq => inq.status === filter);

  return (
    <div className="inquiries-container">
      <header className="inquiries-header">
        <div className="header-container">
          <div className="header-content">
            <div className="logo-section">
              <button
                className="back-button"
                onClick={handleBackToDashboard}
                aria-label="Back to dashboard"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="inquiries-title">
                {propertyId
                  ? `Inquiries for ${getPropertyById(Number(propertyId))?.title || 'Property'}`
                  : 'All Inquiries'}
              </h1>
            </div>
            <div className="user-info">
              <span className="user-greeting">Hi, {landlordName}!</span>
              <img
                src="/api/placeholder/40/40"
                alt="User Avatar"
                className="user-avatar"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="inquiries-main">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading inquiries...</p>
          </div>
        ) : (
          <div className="inquiries-content">
            <div className="filter-container">
              <div className="filter-header">
                <h2 className="filter-title">Filter Inquiries</h2>
                <span className="inquiry-count-badge">
                  {filteredInquiries.length} {filter === 'all' ? 'Total' : filter} Inquiries
                </span>
              </div>
              <div className="filter-options">
                <button
                  className={`filter-button ${(filter === 'all') ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  className={`filter-button ${(filter === 'pending') ? 'active' : ''}`}
                  onClick={() => setFilter('pending')}
                >
                  Pending
                </button>
                <button
                  className={`filter-button ${(filter === 'contacted') ? 'active' : ''}`}
                  onClick={() => setFilter('contacted')}
                >
                  Contacted
                </button>
                <button
                  className={`filter-button ${(filter === 'approved') ? 'active' : ''}`}
                  onClick={() => setFilter('approved')}
                >
                  Approved
                </button>
                <button
                  className={`filter-button ${(filter === 'rejected') ? 'active' : ''}`}
                  onClick={() => setFilter('rejected')}
                >
                  Rejected
                </button>
              </div>
            </div>

            <div className="inquiries-layout">
              <div className="inquiries-list-container">
                <div className="inquiries-list-header">
                  <h2 className="inquiries-list-title">Inquiry List</h2>
                </div>
                {filteredInquiries.length === 0 ? (
                  <div className="empty-state">
                    <MessageCircle size={32} />
                    <p>No {filter !== 'all' ? filter : ''} inquiries available.</p>
                  </div>
                ) : (
                  <div className="inquiries-list">
                    {filteredInquiries.map((inquiry) => {
                      const property = getPropertyById(inquiry.propertyId);
                      return (
                        <div
                          key={inquiry.inquiryId}
                          className={`inquiry-item ${selectedInquiry?.inquiryId === inquiry.inquiryId ? 'selected' : ''}`}
                          onClick={() => handleInquiryClick(inquiry)}
                        >
                          <div className="inquiry-property-image">
                            {property?.imageUrl ? (
                              <img
                                src={property.imageUrl}
                                alt={property?.title || 'Property'}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = `/api/placeholder/60/60?text=${encodeURIComponent(property?.location || 'Property')}`;
                                }}
                              />
                            ) : (
                              <div className="inquiry-image-placeholder">
                                <Home size={20} />
                              </div>
                            )}
                          </div>
                          <div className="inquiry-details">
                            <h3 className="inquiry-student-name">{inquiry.studentName}</h3>
                            <p className="inquiry-property-location">
                              {property?.title || property?.location || `Property ${inquiry.propertyId}`}
                            </p>
                            <p className="inquiry-date">{formatDate(inquiry.createdAt)}</p>
                          </div>
                          <div
                            className={`inquiry-status status-${inquiry.status}`}
                            style={{ backgroundColor: getStatusColor(inquiry.status) + '22' }}
                          >
                            <span
                              className="status-indicator"
                              style={{ backgroundColor: getStatusColor(inquiry.status) }}
                            ></span>
                            <span className="status-text">{inquiry.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="inquiry-detail-container">
                {selectedInquiry ? (
                  <div className="inquiry-detail">
                    <div className="inquiry-detail-header">
                      <h2 className="inquiry-detail-title">Inquiry Details</h2>
                      <div
                        className={`inquiry-status-badge status-${selectedInquiry.status}`}
                        style={{ backgroundColor: getStatusColor(selectedInquiry.status) + '22', color: getStatusColor(selectedInquiry.status) }}
                      >
                        {getStatusIcon(selectedInquiry.status)}
                        <span>{selectedInquiry.status}</span>
                      </div>
                    </div>
                    <div className="inquiry-detail-content">
                      <div className="inquiry-property-info">
                        <h3 className="section-title">Property</h3>
                        {(() => {
                          const property = getPropertyById(selectedInquiry.propertyId);
                          return (
                            <div className="property-summary">
                              {property?.imageUrl ? (
                                <img
                                  src={property.imageUrl}
                                  alt={property?.title || 'Property'}
                                  className="property-thumbnail"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = `/api/placeholder/100/80?text=${encodeURIComponent(property?.location || 'Property')}`;
                                  }}
                                />
                              ) : (
                                <div className="property-thumbnail-placeholder">
                                  <Home size={24} />
                                </div>
                              )}
                              <div className="property-info">
                                <h4 className="property-title">
                                  {property?.title || `Property ${selectedInquiry.propertyId}`}
                                </h4>
                                <p className="property-location">{property?.location || 'Unknown location'}</p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="inquiry-student-info">
                        <h3 className="section-title">Student Information</h3>
                        <div className="student-info">
                          <p className="student-name">{selectedInquiry.studentName}</p>
                          <div className="contact-info">
                            <div className="contact-item">
                              <Mail size={16} />
                              <span>{selectedInquiry.studentEmail}</span>
                            </div>
                            <div className="contact-item">
                              <Phone size={16} />
                              <span>{selectedInquiry.studentPhone}</span>
                            </div>
                            <div className="contact-item">
                              <MessageCircle size={16} />
                              <span>Preferred: {selectedInquiry.contactPreference}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="conversation-section">
                        <h3 className="section-title">Conversation</h3>
                        <div className="conversation-container">
                          <div className="messages-list">
                            {selectedInquiry.messages?.map((message) => (
                              <div
                                key={message.id}
                                className={`message ${message.senderType === 'landlord' ? 'sent' : 'received'}`}
                              >
                                <div className="message-content">
                                  <p>{message.content}</p>
                                </div>
                                <div className="message-meta">
                                  <span className="message-sender">
                                    {message.senderType === 'landlord' ? 'You' : selectedInquiry.studentName}
                                  </span>
                                  <span className="message-time">
                                    {formatDate(message.timestamp)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {selectedInquiry.status !== 'rejected' && (
                            <div className="message-reply-container">
                              <div className="message-reply-form">
                                <div className="message-input-wrapper">
                                  <textarea
                                    className="message-input"
                                    placeholder="Type your message here..."
                                    value={newMessage}
                                    onChange={handleMessageInputChange}
                                    onKeyDown={handleMessageKeyDown}
                                    disabled={selectedInquiry.status === 'rejected'}
                                    rows={3}
                                  />
                                </div>
                                <div className="message-actions">
                                  <div className="message-hints">
                                    <span className="message-hint">Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to send</span>
                                  </div>
                                  <button
                                    className="send-button"
                                    onClick={() => handleSendMessage()}
                                    disabled={!newMessage.trim() || selectedInquiry.status === 'rejected'}
                                    aria-label="Send message"
                                  >
                                    Send <Send size={16} />
                                  </button>
                                </div>
                              </div>
                              {selectedInquiry.status === 'pending' && (
                                <div className="status-notice">
                                  <AlertCircle size={14} />
                                  <span>Responding will mark this inquiry as "Contacted"</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="inquiry-date-info">
                          <Calendar size={16} />
                          <span>Received: {formatDate(selectedInquiry.createdAt)}</span>
                        </div>
                      </div>
                      <div className="inquiry-actions">
                        <h3 className="section-title">Actions</h3>
                        <div className="action-buttons">
                          {selectedInquiry.status === 'contacted' && (
                            <>
                              <button
                                className="action-button approved"
                                onClick={() => handleStatusUpdate(selectedInquiry.inquiryId, 'approved')}
                              >
                                Approve
                              </button>
                              <button
                                className="action-button rejected"
                                onClick={() => handleStatusUpdate(selectedInquiry.inquiryId, 'rejected')}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {(selectedInquiry.status === 'approved' || selectedInquiry.status === 'rejected') && (
                            <button
                              className="action-button pending"
                              onClick={() => handleStatusUpdate(selectedInquiry.inquiryId, 'pending')}
                            >
                              Reset to Pending
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-inquiry-selected">
                    <MessageCircle size={48} />
                    <p>Select an inquiry to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Inquiries;