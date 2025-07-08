import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams, Location } from 'react-router-dom';
import './Inquiries.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Configuration constants - Optimized for seamless UX
const CONFIG = {
 POLLING_INTERVAL: 3000,
UNREAD_COUNT_POLLING_INTERVAL: 5000,
  MESSAGE_MAX_LENGTH: 2000,
  RETRY_DELAY: 2000,
  MAX_RETRIES: 3,
  SCROLL_DELAY: 50,
  CONNECTION_TIMEOUT: 8000,
  PAGE_LIMIT: 50,
  ERROR_PAUSE_DURATION: 15000,
  MAX_CONCURRENT_REQUESTS: 4,
  BACKGROUND_SYNC_THRESHOLD: 25000,
  DEBOUNCE_DELAY: 250,
};

// Theme configuration - Professional landlord theme
const THEME = {
  colors: {
    primary: '#059669',
    primaryDark: '#047857',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    textDark: '#1f2937',
    textLight: '#6b7280',
    border: '#e5e7eb',
    background: '#f8fafc',
    white: '#ffffff',
    accent: '#8b5cf6',
  },
};

// Types
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  userType?: 'landlord' | 'student' | 'tenant';
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  timestamp?: string;
  status: 'sending' | 'sent' | 'failed';
  isEdited: boolean;
  isRead: boolean;
  sender?: User;
  receiver?: User;
  priority?: 'normal' | 'high' | 'urgent';
  messageType?: 'inquiry' | 'response' | 'follow_up' | 'booking' | 'maintenance';
}

interface PropertyData {
  id: number | string;
  title: string;
  address?: string;
  type?: string;
  price?: number;
  currency?: string;
  status?: string;
  [key: string]: any;
}

interface Conversation {
  id: string;
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
  property?: PropertyData;
  conversationType: 'inquiry' | 'booking' | 'maintenance' | 'general';
  updatedAt: string;
  isOnline?: boolean;
}

interface LocationState {
  landlordId?: string;
  fromDashboard?: boolean;
  from?: string;
}

// Enhanced Request Queue with priority handling and error tracking
class LandlordRequestQueue {
  private queue: Array<{
    operation: () => Promise<any>;
    priority: number;
    resolve: Function;
    reject: Function;
    type: string;
  }> = [];
  private activeRequests = 0;

  constructor(private maxConcurrent: number) {}

  async enqueue<T>(operation: () => Promise<T>, priority: number = 0, type: string = 'default'): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, priority, resolve, reject, type });
      this.queue.sort((a, b) => b.priority - a.priority);
      this.processQueue();
    });
  }

  private async processQueue() {
    while (this.activeRequests < this.maxConcurrent && this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) {
        this.activeRequests++;
        try {
          const result = await next.operation();
          next.resolve(result);
        } catch (error: any) {
          next.reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      }
    }
  }

  getQueueStatus() {
    return {
      pending: this.queue.length,
      active: this.activeRequests,
    };
  }
}

const landlordRequestQueue = new LandlordRequestQueue(CONFIG.MAX_CONCURRENT_REQUESTS);

// Enhanced API Service with improved error handling
const landlordApiService = {
  cache: new Map<string, { data: any; timestamp: number; ttl: number }>(),

  async fetchWithTimeout(url: string, options: RequestInit, timeout: number = CONFIG.CONNECTION_TIMEOUT) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (error: any) {
      clearTimeout(id);
      throw error.name === 'AbortError' ? new Error('Request timed out') : error;
    }
  },

  getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  },

  setCachedData(key: string, data: any, ttl: number = 30000) {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  },

  async retryOperation<T>(operation: () => Promise<T>, maxRetries: number = CONFIG.MAX_RETRIES, priority: number = 0, type: string = 'default'): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await landlordRequestQueue.enqueue(operation, priority, type);
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, CONFIG.RETRY_DELAY * attempt));
        }
      }
    }
    throw lastError;
  },

  // Get all conversations for a landlord
  async getLandlordConversations(landlordId: string) {
    if (!landlordId) {
      throw new Error('Missing landlord ID');
    }

    const cacheKey = `landlord_conversations_${landlordId}`;
    const cached = this.getCachedData(cacheKey);

    try {
      return await this.retryOperation(async () => {
        const response = await this.fetchWithTimeout(
          `/api/messages/users/${landlordId}/conversations`,
          {}
        );

        const data = await response.json().catch((error) => {
          throw new Error('Invalid response format');
        });
        this.setCachedData(cacheKey, data, 10000);
        return data;
      }, 2, 8, 'get_conversations');
    } catch (error: any) {
      if (cached) {
        return cached;
      }
      throw new Error(error.message || 'Failed to fetch conversations');
    }
  },

  async sendMessage(senderId: string, receiverId: string | number, content: string, propertyId: string | number, receiverType: string, messageType: string = 'response') {
    if (!senderId || !receiverId || !content || !propertyId || !receiverType) {
      throw new Error('Missing required parameters for sending message');
    }

    try {
      return await this.retryOperation(async () => {
        const response = await this.fetchWithTimeout('/api/messages/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId,
            receiverId,
            content,
            propertyId,
            receiverType,
            messageType,
            senderType: 'landlord',
          }),
        });

        const data = await response.json().catch((error) => {
          throw new Error('Invalid response format');
        });
        return data;
      }, 3, 10, 'send_message');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send message');
    }
  },

  async getConversation(userId1: string, userId2: string | number, options: { page?: number; limit?: number; sortBy?: string; sortOrder?: string; propertyId?: string | number } = {}) {
    if (!userId1 || !userId2) {
      throw new Error('Missing user IDs for fetching conversation');
    }

    const cacheKey = `landlord_conversation_${userId1}_${userId2}_${JSON.stringify(options)}`;
    const cached = this.getCachedData(cacheKey);

    try {
      return await this.retryOperation(async () => {
        const params = new URLSearchParams({
          page: String(options.page || 1),
          limit: String(options.limit || CONFIG.PAGE_LIMIT),
          sortBy: options.sortBy || 'createdAt',
          sortOrder: options.sortOrder || 'desc',
          userType: 'landlord',
          ...(options.propertyId ? { propertyId: String(options.propertyId) } : {}),
        });

        const response = await this.fetchWithTimeout(
          `/api/messages/messages/conversation/${userId1}/${userId2}?${params}`,
          {}
        );

        if (response.status === 404) {
          const emptyResult = { messages: [], pagination: { page: 1, totalPages: 1, total: 0 } };
          this.setCachedData(cacheKey, emptyResult, 5000);
          return emptyResult;
        }

        const data = await response.json().catch((error) => {
          throw new Error('Invalid response format');
        });
        this.setCachedData(cacheKey, data, 8000);
        return data;
      }, 2, 6, 'get_conversation');
    } catch (error: any) {
      if (cached) {
        return cached;
      }
      throw new Error(error.message || 'Failed to fetch conversation');
    }
  },

  async markAsRead(messageId: string) {
    if (!messageId) {
      throw new Error('Missing message ID for marking as read');
    }

    try {
      return await this.retryOperation(async () => {
        const response = await this.fetchWithTimeout(`/api/messages/messages/${messageId}/read`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userType: 'landlord' }),
        });

        const data = await response.json().catch((error) => {
          throw new Error('Invalid response format');
        });
        return data;
      }, 2, 3, 'mark_read');
    } catch (error: any) {
      return null;
    }
  },

  async markConversationAsRead(userId1: string, userId2: string | number) {
    if (!userId1 || !userId2) {
      return null;
    }

    try {
      return await this.retryOperation(async () => {
        const response = await this.fetchWithTimeout(
          `/api/messages/messages/conversation/${userId1}/${userId2}/read`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userType: 'landlord' }),
          }
        );

        const data = await response.json().catch((error) => {
          throw new Error('Invalid response format');
        });
        return data;
      }, 2, 2, 'mark_conversation_read');
    } catch (error: any) {
      return null;
    }
  },

  async getUnreadCount(userId: string) {
    if (!userId) {
      return { unreadCount: 0 };
    }

    const cacheKey = `landlord_unread_${userId}`;
    const cached = this.getCachedData(cacheKey);

    try {
      return await this.retryOperation(async () => {
        const response = await this.fetchWithTimeout(
          `/api/messages/users/${userId}/messages/unread/count?userType=landlord`,
          {}
        );

        if (response.status === 404) {
          const result = { unreadCount: 0 };
          this.setCachedData(cacheKey, result, 5000);
          return result;
        }

        const data = await response.json().catch((error) => {
          throw new Error('Invalid response format');
        });
        this.setCachedData(cacheKey, data, 4000);
        return data;
      }, 2, 1, 'unread_count');
    } catch (error: any) {
      if (cached) {
        return cached;
      }
      return { unreadCount: 0 };
    }
  },
};

// Utility functions
const formatDistanceToNow = (date: Date): string => {
  try {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (error: any) {
    return '';
  }
};

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error: any) {
    return `${currency} ${amount}`;
  }
};

// Debounce utility
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Loading Spinner Component
const LoadingSpinner: React.FC<{ size?: 'small' | 'large'; message?: string }> = React.memo(({ size = 'large', message = 'Loading...' }) => {
  return (
    <div className="landlord-loading-spinner">
      <div className={`spinner ${size}`} />
      {size === 'large' && <p className="loading-text">{message}</p>}
    </div>
  );
});

// Error State Component
const ErrorState: React.FC<{ error: string; onRetry?: () => void; canRetry?: boolean }> = React.memo(({ error, onRetry, canRetry = true }) => {
  return (
    <div className="landlord-error-state">
      <div className="error-icon">⚠️</div>
      <h3 className="error-title">Connection Issue</h3>
      <p className="error-message">{error}</p>
      {canRetry && onRetry && (
        <button onClick={onRetry} className="retry-action-button">
          <span>🔄</span>
          Try Again
        </button>
      )}
    </div>
  );
});

// Conversation List Item Component
const ConversationListItem: React.FC<{
  conversation: Conversation;
  onClick: () => void;
  landlordId: string;
}> = React.memo(({ conversation, onClick, landlordId }) => {
  // FIX: Add null check for participants
  const participants = conversation.participants || [];
  const otherParticipant = participants.find(p => p.id !== landlordId);
  const isUnread = conversation.unreadCount > 0;

  const getConversationIcon = (type: string) => {
    switch (type) {
      case 'inquiry':
        return '❓';
      case 'booking':
        return '📅';
      case 'maintenance':
        return '🔧';
      default:
        return '💬';
    }
  };

  return (
    <div 
      className={`conversation-list-item ${isUnread ? 'unread' : ''}`}
      onClick={onClick}
    >
      <div className="conversation-avatar">
        <div className="avatar">
          {otherParticipant?.firstName?.charAt(0)?.toUpperCase() || '?'}
        </div>
        {conversation.isOnline && <div className="online-indicator" />}
      </div>

      <div className="conversation-details">
        <div className="conversation-header">
          <h3 className="participant-name">
            {otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Unknown User'}
          </h3>
          <div className="conversation-meta">
            <span className="conversation-type">
              {getConversationIcon(conversation.conversationType)}
            </span>
            <time className="last-message-time">
              {formatDistanceToNow(new Date(conversation.lastMessage.createdAt))}
            </time>
          </div>
        </div>

        {conversation.property && (
          <div className="property-info">
            <span className="property-title">🏠 {conversation.property.title}</span>
            {conversation.property.price && (
              <span className="property-price">
                {formatCurrency(conversation.property.price, conversation.property.currency)}
              </span>
            )}
          </div>
        )}

        <div className="last-message">
          <p className="message-preview">
            {conversation.lastMessage.senderId === landlordId ? 'You: ' : ''}
            {conversation.lastMessage.content}
          </p>
          {isUnread && (
            <div className="unread-badge">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Message Bubble Component
const LandlordMessageBubble: React.FC<{
  message: Message;
  isCurrentUser: boolean;
  onRetry?: (message: Message) => Promise<void>;
  onMarkAsRead?: (messageId: string) => Promise<void>;
}> = React.memo(({ message, isCurrentUser, onRetry, onMarkAsRead }) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    if (isRetrying || message.status !== 'failed') return;

    setIsRetrying(true);
    try {
      await onRetry?.(message);
    } catch (error: any) {
    } finally {
      setTimeout(() => setIsRetrying(false), CONFIG.RETRY_DELAY);
    }
  }, [isRetrying, message, onRetry]);

  useEffect(() => {
    if (!isCurrentUser && !message.isRead && onMarkAsRead && message.id && message.status === 'sent') {
      onMarkAsRead(message.id).catch((error) => {});
    }
  }, [isCurrentUser, message.isRead, message.id, message.status, onMarkAsRead]);

  const getMessageTypeIcon = (type?: string) => {
    switch (type) {
      case 'inquiry':
        return '❓';
      case 'booking':
        return '📅';
      case 'maintenance':
        return '🔧';
      case 'follow_up':
        return '📞';
      default:
        return '💬';
    }
  };

  const getPriorityClass = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'urgent';
      case 'high':
        return 'high';
      default:
        return 'normal';
    }
  };

  return (
    <div className={`landlord-message-bubble ${isCurrentUser ? 'current-user' : 'other-user'}`}>
      <div
        className={`message-content ${isCurrentUser ? 'current-user' : 'other-user'} ${
          message.status === 'sending' ? 'sending' : ''
        } ${message.status === 'failed' ? 'failed' : ''} ${getPriorityClass(message.priority)}`}
      >
        {message.messageType && !isCurrentUser && (
          <div className="message-type">
            <span className="message-type-icon">{getMessageTypeIcon(message.messageType)}</span>
            <span className="message-type-label">{message.messageType}</span>
          </div>
        )}
        <p className="message-text">{message.content}</p>
        <div className={`message-meta ${isCurrentUser ? 'current-user' : 'other-user'}`}>
          <div className="meta-left">
            <time className="message-time" dateTime={message.createdAt || message.timestamp}>
              {formatDistanceToNow(new Date(message.createdAt || message.timestamp!))}
            </time>
            {message.isEdited && <span className="message-edited">edited</span>}
            {message.priority && message.priority !== 'normal' && (
              <span className={`priority-badge ${message.priority}`}>
                {message.priority === 'urgent' ? '🚨' : '⚡'}
              </span>
            )}
          </div>
          <div className="message-actions">
            {message.status === 'failed' && isCurrentUser && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="retry-button"
                title="Retry sending message"
              >
                {isRetrying ? '⟳' : '⚠️'}
              </button>
            )}
            {isCurrentUser && message.status === 'sent' && (
              <span className={`read-receipts ${message.isRead ? 'read' : 'delivered'}`}>
                {message.isRead ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Conversation Header Component
const LandlordConversationHeader: React.FC<{
  receiverName: string;
  propertyTitle?: string;
  propertyData?: PropertyData;
  isOnline: boolean;
  lastSeen: string;
  onBack: () => void;
  onViewProfile: () => void;
  onViewProperty: () => void;
  unreadCount: number;
  conversationType?: string;
}> = React.memo(
  ({ receiverName, propertyTitle, propertyData, isOnline, lastSeen, onBack, onViewProfile, onViewProperty, unreadCount, conversationType }) => {
     const safePropertyData = propertyData || {};
    return (
      <header className="landlord-conversation-header">
        <div className="header-content">
          <button onClick={onBack} className="back-button" aria-label="Go back">
            ← Back
          </button>

          <div className="conversation-info">
            <div className="participant-info">
              <div className="avatar-container">
                <div className="avatar">{receiverName.charAt(0).toUpperCase()}</div>
                {isOnline && <div className="online-indicator" />}
              </div>
              <div className="participant-details">
                <h1 className="receiver-name">{receiverName}</h1>
                <div className="participant-meta">
                  <span className="online-status">
                    {isOnline ? '🟢 Online' : lastSeen ? `Last seen ${formatDistanceToNow(new Date(lastSeen))}` : '⚫ Offline'}
                  </span>
                  {conversationType && (
                    <span className="conversation-type">
                      {conversationType === 'inquiry' && '❓ Inquiry'}
                      {conversationType === 'booking' && '📅 Booking'}
                      {conversationType === 'maintenance' && '🔧 Maintenance'}
                      {conversationType === 'general' && '💬 General'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {safePropertyData && (
              <div className="property-info">
                <div className="property-summary">
                  <h3 className="property-title">🏠 {propertyTitle}</h3>
                  <div className="property-details">
                    {safePropertyData.address && <span className="property-address">📍 {safePropertyData.address}</span>}
                    {safePropertyData.price && (
                      <span className="property-price">
                        💰 {formatCurrency(safePropertyData.price, safePropertyData.currency)}
                        {safePropertyData.type && ` • ${safePropertyData.type}`}
                      </span>
                    )}
                    {safePropertyData.status && (
                      <span className={`property-status ${safePropertyData.status.toLowerCase()}`}>
                        {safePropertyData.status}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={onViewProperty} className="view-property-button" title="View property details">
                  🏠
                </button>
              </div>
            )}
          </div>

          <div className="header-actions">
            {unreadCount > 0 && (
              <div className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</div>
            )}
            <button onClick={onViewProfile} className="profile-button" title="View tenant profile">
              👤 Profile
            </button>
          </div>
        </div>
      </header>
    );
  }
);

// Message Input Component
const LandlordMessageInput: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isValid: boolean;
  characterCount: number;
  onQuickReply?: (template: string) => void;
}> = React.memo(
  ({ value, onChange, onSubmit, isSubmitting, isValid, characterCount, onQuickReply }) => {
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const quickReplies = [
      "Thank you for your inquiry! I'll get back to you shortly.",
      "The property is still available. Would you like to schedule a viewing?",
      "I'd be happy to provide more information about this property.",
      "When would be a good time for you to view the property?",
      "The rent includes utilities. Let me know if you have other questions.",
    ];

    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (isValid && !isSubmitting) {
            onSubmit(e);
          }
        }
      },
      [isValid, isSubmitting, onSubmit]
    );

    const handleQuickReply = useCallback(
      (template: string) => {
        onQuickReply?.(template);
        inputRef.current?.focus();
      },
      [onQuickReply]
    );

    useEffect(() => {
      if (inputRef.current && !isSubmitting) {
        inputRef.current.focus();
      }
    }, [isSubmitting]);

    // Auto-resize textarea
    useEffect(() => {
      if (inputRef.current) {
        try {
          inputRef.current.style.height = 'auto';
          inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
        } catch (error: any) {}
      }
    }, [value]);

    return (
      <div className="landlord-message-input">
        <div className="quick-replies">
          <div className="quick-replies-scroll">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(reply)}
                className="quick-reply-button"
                disabled={isSubmitting}
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={onSubmit} className="message-form">
          <div className="input-container">
            <textarea
              ref={inputRef}
              value={value}
              onChange={onChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className={`message-textarea ${!isValid ? 'invalid' : ''}`}
              disabled={isSubmitting}
              maxLength={CONFIG.MESSAGE_MAX_LENGTH}
              rows={2}
            />
            <div className="input-actions">
              <div className="character-counter">
                <span className={characterCount > CONFIG.MESSAGE_MAX_LENGTH * 0.9 ? 'warning' : ''}>
                  {characterCount}/{CONFIG.MESSAGE_MAX_LENGTH}
                </span>
              </div>
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="send-button"
                title="Send message"
              >
                {isSubmitting ? '⟳' : '→'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }
);

// Conversations List Component
const ConversationsList: React.FC<{
  conversations: Conversation[];
  onConversationClick: (conversation: Conversation) => void;
  landlordId: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  totalUnreadCount: number;
}> = React.memo(({ conversations, onConversationClick, landlordId, searchTerm, onSearchChange, totalUnreadCount }) => {
  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    
    return conversations.filter(conversation => {
      const otherParticipant = conversation.participants.find(p => p.id !== landlordId);
      const participantName = otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}`.toLowerCase() : '';
      const propertyTitle = conversation.property?.title?.toLowerCase() || '';
      const lastMessageContent = conversation.lastMessage?.content?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      
      return participantName.includes(searchLower) || 
             propertyTitle.includes(searchLower) || 
             lastMessageContent.includes(searchLower);
    });
  }, [conversations, searchTerm, landlordId]);

  const sortedConversations = useMemo(() => {
    if (!Array.isArray(filteredConversations)) return [];
    
    return [...filteredConversations].sort((a, b) => {
      if (!a || !b) return 0;
      
      // Prioritize unread conversations
      const aUnread = a.unreadCount || 0;
      const bUnread = b.unreadCount || 0;
      
      if (aUnread > 0 && bUnread === 0) return -1;
      if (aUnread === 0 && bUnread > 0) return 1;
      
      // Then sort by last message time
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      
      return bTime - aTime;
    });
  }, [filteredConversations]);

  return (
    <div className="conversations-list">
      <div className="conversations-header">
        <div className="header-title">
          <h2>Messages</h2>
          {totalUnreadCount > 0 && (
            <div className="total-unread-badge">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </div>
          )}
        </div>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      <div className="conversations-container">
        {sortedConversations.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? (
              <>
                <div className="empty-icon">🔍</div>
                <h3>No conversations found</h3>
                <p>Try adjusting your search terms</p>
              </>
            ) : (
              <>
                <div className="empty-icon">💬</div>
                <h3>No conversations yet</h3>
                <p>Your tenant inquiries will appear here</p>
              </>
            )}
          </div>
        ) : (
          <div className="conversations-list-container">
            {sortedConversations.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                onClick={() => onConversationClick(conversation)}
                landlordId={landlordId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// Main Inquiries Component
const Inquiries: React.FC = () => {
  const location = useLocation() as Location & { state: LocationState };
  const navigate = useNavigate();
  const { receiverId } = useParams<{ receiverId: string }>();
  
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timer | null>(null);
  const unreadPollingRef = useRef<NodeJS.Timer | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, CONFIG.DEBOUNCE_DELAY);
  
  // Get landlord ID from location state or localStorage
  const landlordId = useMemo(() => {
    return location.state?.landlordId || localStorage.getItem('landlordId') || '';
  }, [location.state?.landlordId]);

  // Validation
  const isMessageValid = useMemo(() => {
    return messageInput.trim().length > 0 && messageInput.length <= CONFIG.MESSAGE_MAX_LENGTH;
  }, [messageInput]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }, CONFIG.SCROLL_DELAY);
  }, []);

const loadConversations = useCallback(async (showLoading: boolean = true) => {
  if (!landlordId) {
    setError('Landlord ID is required');
    setIsLoading(false);
    return;
  }

  try {
    // Only show loading on initial load, not refreshes
    if (showLoading && conversations.length === 0) setIsLoading(true);
    setConnectionStatus('connecting');
    
    const data = await landlordApiService.getLandlordConversations(landlordId);
    
    if (data?.conversations) {
      setConversations(data.conversations);
      setTotalUnreadCount(data.totalUnreadCount || 0);
      setConnectionStatus('connected');
      setError(null);
    } else {
      setConversations([]);
      setTotalUnreadCount(0);
      setConnectionStatus('connected');
    }
  } catch (error: any) {
    console.error('Failed to load conversations:', error);
    // Don't show error if we have existing conversations (background refresh failed)
    if (conversations.length === 0) {
      setError(error.message || 'Failed to load conversations');
      setConnectionStatus('disconnected');
    }
  } finally {
    if (showLoading && conversations.length === 0) setIsLoading(false);
  }
}, [landlordId, conversations.length]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (userId1: string, userId2: string | number, propertyId?: string | number) => {
    if (!userId1 || !userId2) return;

    try {
      setIsLoadingMessages(true);
      setError(null);

      const options = {
        page: 1,
        limit: CONFIG.PAGE_LIMIT,
        ...(propertyId ? { propertyId } : {})
      };

      const data = await landlordApiService.getConversation(userId1, userId2, options);
      
      if (data?.messages) {
        setMessages(data.messages);
        scrollToBottom(false);
        
        // Mark conversation as read
        await landlordApiService.markConversationAsRead(userId1, userId2);
      } else {
        setMessages([]);
      }
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      setError(error.message || 'Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [scrollToBottom]);

  // Send message
  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isMessageValid || !currentConversation || isSubmittingMessage) return;

    const participants = currentConversation.participants || [];
    const otherParticipant = participants.find(p => p?.id !== landlordId);
    if (!otherParticipant?.id) return;

    const messageContent = messageInput.trim();
    const tempId = `temp_${Date.now()}`;
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: tempId,
      content: messageContent,
      senderId: landlordId,
      receiverId: otherParticipant.id,
      createdAt: new Date().toISOString(),
      status: 'sending',
      isEdited: false,
      isRead: false,
      messageType: 'response'
    };

    try {
      setIsSubmittingMessage(true);
      setMessages(prev => [...prev, optimisticMessage]);
      setMessageInput('');
      scrollToBottom();

      const response = await landlordApiService.sendMessage(
        landlordId,
        otherParticipant.id,
        messageContent,
        currentConversation.property?.id || '',
        'tenant',
        'response'
      );

      // Update optimistic message with real data
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...response, status: 'sent' as const }
          : msg
      ));

      // Update conversation's last message
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversation.id 
          ? { ...conv, lastMessage: { ...response, status: 'sent' as const }, updatedAt: new Date().toISOString() }
          : conv
      ));

    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      // Mark optimistic message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
      
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSubmittingMessage(false);
    }
  }, [isMessageValid, currentConversation, landlordId, messageInput, isSubmittingMessage, scrollToBottom]);

  // Retry failed message
  const retryMessage = useCallback(async (message: Message) => {
    if (message.status !== 'failed' || !currentConversation) return;

    const participants = currentConversation.participants || [];
    const otherParticipant = participants.find(p => p?.id !== landlordId);
    if (!otherParticipant?.id) return;

    try {
      // Update message status to sending
      setMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...msg, status: 'sending' as const }
          : msg
      ));

      const response = await landlordApiService.sendMessage(
        landlordId,
        otherParticipant.id,
        message.content,
        currentConversation.property?.id || '',
        'tenant',
        message.messageType || 'response'
      );

      // Update with successful response
      setMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...response, status: 'sent' as const }
          : msg
      ));

    } catch (error: any) {
      console.error('Failed to retry message:', error);
      
      // Mark as failed again
      setMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
    }
  }, [currentConversation, landlordId]);

  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      await landlordApiService.markAsRead(messageId);
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isRead: true }
          : msg
      ));
    } catch (error: any) {
      // Silently fail - not critical
    }
  }, []);

  // Handle conversation click
  const handleConversationClick = useCallback((conversation: Conversation) => {
    if (!conversation) return;
    
    setCurrentConversation(conversation);
    
    const participants = conversation.participants || [];
    const otherParticipant = participants.find(p => p?.id !== landlordId);
    if (otherParticipant?.id) {
      loadMessages(landlordId, otherParticipant.id, conversation.property?.id);
    }
  }, [landlordId, loadMessages]);

  // Handle quick reply
  const handleQuickReply = useCallback((template: string) => {
    setMessageInput(template);
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (currentConversation) {
      setCurrentConversation(null);
      setMessages([]);
    } else {
      navigate(location.state?.from || '/landlord/dashboard');
    }
  }, [currentConversation, navigate, location.state?.from]);

  // Polling for new messages and conversations
  const startPolling = useCallback(() => {
    // Clear existing timers
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (unreadPollingRef.current) clearInterval(unreadPollingRef.current);

    pollingRef.current = setInterval(async () => {
  try {
    const data = await landlordApiService.getLandlordConversations(landlordId);
    if (data?.conversations) {
      setConversations(data.conversations);
      setTotalUnreadCount(data.totalUnreadCount || 0);
    }
  } catch (error) {
    // Silently fail background refresh
  }
}, CONFIG.POLLING_INTERVAL);

    // Poll for unread count
    unreadPollingRef.current = setInterval(async () => {
      try {
        const data = await landlordApiService.getUnreadCount(landlordId);
        setTotalUnreadCount(data.unreadCount || 0);
      } catch (error: any) {
        // Silently fail
      }
    }, CONFIG.UNREAD_COUNT_POLLING_INTERVAL);
  }, [landlordId, loadConversations]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (unreadPollingRef.current) {
      clearInterval(unreadPollingRef.current);
      unreadPollingRef.current = null;
    }
  }, []);

  // Handle visibility change for background sync
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      stopPolling();
    } else {
      startPolling();
      // Silent refresh when coming back to tab
setTimeout(() => {
  loadConversations(false);
}, 100);
    }
  }, [startPolling, stopPolling, loadConversations]);

  // Initialize component
  useEffect(() => {
    if (!landlordId) {
      setError('Landlord ID is required');
      setIsLoading(false);
      return;
    }

    loadConversations();
    startPolling();

    // Handle browser visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Auto-select conversation if receiverId is provided
    if (receiverId) {
      // Wait for conversations to load, then find and select the conversation
      const timer = setTimeout(() => {
        const conversation = conversations.find(conv => 
          conv.participants.some(p => p.id === receiverId)
        );
        if (conversation) {
          handleConversationClick(conversation);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [landlordId, receiverId, conversations, loadConversations, startPolling, stopPolling, handleVisibilityChange, handleConversationClick]);

  // Handle error retry
  const handleRetry = useCallback(() => {
    setError(null);
    loadConversations();
  }, [loadConversations]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="landlord-inquiries-container">
        <LoadingSpinner message="Loading your conversations..." />
      </div>
    );
  }

  // Render error state
  if (error && conversations.length === 0) {
    return (
      <div className="landlord-inquiries-container">
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="landlord-inquiries-container">
      <div className="inquiries-layout">
        {/* Conversations List */}
        <div className={`conversations-panel ${currentConversation ? 'hidden-mobile' : ''}`}>
          <ConversationsList
            conversations={conversations}
            onConversationClick={handleConversationClick}
            landlordId={landlordId}
            searchTerm={debouncedSearchTerm}
            onSearchChange={setSearchTerm}
            totalUnreadCount={totalUnreadCount}
          />
        </div>

        {/* Messages Panel */}
        <div className={`messages-panel ${!currentConversation ? 'hidden-mobile' : ''}`}>
          {currentConversation ? (
            <>
              <LandlordConversationHeader
                receiverName={
                  (() => {
                    const participants = currentConversation.participants || [];
                    const otherParticipant = participants.find(p => p?.id !== landlordId);
                    if (otherParticipant) {
                      const firstName = otherParticipant.firstName || '';
                      const lastName = otherParticipant.lastName || '';
                      return `${firstName} ${lastName}`.trim() || 'Unknown User';
                    }
                    return 'Unknown User';
                  })()
                }
                propertyTitle={currentConversation.property?.title}
                propertyData={currentConversation.property}
                isOnline={currentConversation.isOnline || false}
                lastSeen={currentConversation.updatedAt}
                onBack={handleBack}
                onViewProfile={() => {}}
                onViewProperty={() => {}}
                unreadCount={currentConversation.unreadCount}
                conversationType={currentConversation.conversationType}
              />

              <div className="messages-container" ref={messagesContainerRef}>
                {isLoadingMessages ? (
                  <div className="messages-loading">
                    <LoadingSpinner size="small" message="Loading messages..." />
                  </div>
                ) : (
                  <>
                    <div className="messages-list">
                      {messages.map((message) => (
                        <LandlordMessageBubble
                          key={message.id}
                          message={message}
                          isCurrentUser={message.senderId === landlordId}
                          onRetry={retryMessage}
                          onMarkAsRead={markMessageAsRead}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </>
                )}
              </div>

              <LandlordMessageInput
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onSubmit={sendMessage}
                isSubmitting={isSubmittingMessage}
                isValid={isMessageValid}
                characterCount={messageInput.length}
                onQuickReply={handleQuickReply}
              />
            </>
          ) : (
            <div className="no-conversation-selected">
              <div className="empty-icon">💬</div>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the list to start messaging</p>
            </div>
          )}
        </div>
      </div>
{/* Connection Status Indicator - Only show when actually disconnected */}
{connectionStatus === 'disconnected' && conversations.length === 0 && (
  <div className={`connection-status ${connectionStatus}`}>
    ⚠️ Connection lost
  </div>
)}
    </div>
  );
};

export default Inquiries;