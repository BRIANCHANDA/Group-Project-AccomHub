import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, Location } from 'react-router-dom';
import './InquiryPage.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Configuration constants - Optimized for seamless UX
const CONFIG = {
  POLLING_INTERVAL: 3000, // Faster but intelligent polling
  UNREAD_COUNT_POLLING_INTERVAL: 8000,
  MESSAGE_MAX_LENGTH: 2000,
  RETRY_DELAY: 2000,
  MAX_RETRIES: 3,
  SCROLL_DELAY: 50, // Faster scroll
  CONNECTION_TIMEOUT: 8000,
  PAGE_LIMIT: 50, // Load more messages at once
  ERROR_PAUSE_DURATION: 15000, // Longer pause after errors
  MAX_CONCURRENT_REQUESTS: 3,
  BACKGROUND_SYNC_THRESHOLD: 30000, // 30s without activity triggers background sync
  DEBOUNCE_DELAY: 300,
};

// Theme configuration
const THEME = {
  colors: {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    textDark: '#1f2937',
    textLight: '#6b7280',
    border: '#e5e7eb',
    background: '#f9fafb',
    white: '#ffffff',
  },
};

// Types
interface User {
  id: string;
  firstName: string;
  lastName: string;
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
}

interface PropertyData {
  id: number | string;
  title: string;
  [key: string]: any;
}

interface LocationState {
  studentId?: string;
  receiverId?: string | number;
  receiverName?: string;
  receiverType?: string;
  propertyId?: string | number;
  propertyTitle?: string;
  propertyData?: PropertyData;
  fromLogin?: boolean;
  from?: string;
}

// Enhanced Request Queue with priority handling
class RequestQueue {
  private queue: Array<{ operation: () => Promise<any>; priority: number; resolve: Function; reject: Function }> = [];
  private activeRequests = 0;

  constructor(private maxConcurrent: number) {}

  async enqueue<T>(operation: () => Promise<T>, priority: number = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, priority, resolve, reject });
      this.queue.sort((a, b) => b.priority - a.priority); // Higher priority first
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
        } catch (error) {
          next.reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      }
    }
  }
}

const requestQueue = new RequestQueue(CONFIG.MAX_CONCURRENT_REQUESTS);

// Enhanced API Service with intelligent caching and error recovery
const apiService = {
  cache: new Map<string, { data: any; timestamp: number; ttl: number }>(),
  
  async fetchWithTimeout(url: string, options: RequestInit, timeout: number = CONFIG.CONNECTION_TIMEOUT) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
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
    return null;
  },

  setCachedData(key: string, data: any, ttl: number = 30000) {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  },

  async retryOperation<T>(operation: () => Promise<T>, maxRetries: number = CONFIG.MAX_RETRIES, priority: number = 0): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestQueue.enqueue(operation, priority);
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, CONFIG.RETRY_DELAY * attempt));
        }
      }
    }
    throw lastError;
  },

  async sendMessage(senderId: string, receiverId: string | number, content: string, propertyId: string | number, receiverType: string) {
    if (!senderId || !receiverId || !content || !propertyId || !receiverType) {
      throw new Error('Missing required parameters for sending message');
    }

    try {
      return await this.retryOperation(async () => {
        const response = await this.fetchWithTimeout('/api/messages/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senderId, receiverId, content, propertyId, receiverType }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `HTTP ${response.status}: Failed to send message`);
        }

        return response.json();
      }, 3, 10); // High priority for sending messages
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send message');
    }
  },

  async getConversation(userId1: string, userId2: string | number, options = {}) {
    if (!userId1 || !userId2) {
      throw new Error('Missing user IDs for fetching conversation');
    }

    const cacheKey = `conversation_${userId1}_${userId2}_${JSON.stringify(options)}`;
    const cached = this.getCachedData(cacheKey);
    
    try {
      return await this.retryOperation(async () => {
        const params = new URLSearchParams({
          page: String(options.page || 1),
          limit: String(options.limit || CONFIG.PAGE_LIMIT),
          sortBy: options.sortBy || 'createdAt',
          sortOrder: options.sortOrder || 'desc',
          ...(options.propertyId ? { propertyId: String(options.propertyId) } : {}),
        });

        const response = await this.fetchWithTimeout(
          `/api/messages/messages/conversation/${userId1}/${userId2}?${params}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            const emptyResult = { messages: [], pagination: { page: 1, totalPages: 1, total: 0 } };
            this.setCachedData(cacheKey, emptyResult, 5000); // Short cache for 404
            return emptyResult;
          }
          throw new Error(`HTTP ${response.status}: Failed to fetch conversation`);
        }

        const data = await response.json();
        this.setCachedData(cacheKey, data, 10000); // Cache for 10s
        return data;
      }, 2, 5); // Medium priority
    } catch (error: any) {
      // Return cached data if available during errors
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
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to mark message as read`);
        }

        return response.json();
      }, 2, 3); // Low priority
    } catch (error: any) {
      // Silently fail for read receipts to avoid disrupting UX
      console.warn('Mark as read failed:', error.message);
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
          { method: 'PATCH' }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to mark conversation as read`);
        }

        return response.json();
      }, 2, 2); // Low priority
    } catch (error: any) {
      console.warn('Mark conversation as read failed:', error.message);
      return null;
    }
  },

  async getUnreadCount(userId: string) {
    if (!userId) {
      return { unreadCount: 0 };
    }

    const cacheKey = `unread_${userId}`;
    const cached = this.getCachedData(cacheKey);
    
    try {
      return await this.retryOperation(async () => {
        const response = await this.fetchWithTimeout(`/api/messages/users/${userId}/messages/unread/count`);

        if (!response.ok) {
          if (response.status === 404) {
            const result = { unreadCount: 0 };
            this.setCachedData(cacheKey, result, 5000);
            return result;
          }
          throw new Error(`HTTP ${response.status}: Failed to get unread count`);
        }

        const data = await response.json();
        this.setCachedData(cacheKey, data, 5000); // Cache for 5s
        return data;
      }, 2, 1); // Lowest priority
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
    if (diffInMinutes < 60) return `${diffInMinutes}m`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;

    return date.toLocaleDateString();
  } catch (error) {
    return '';
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

// Loading Spinner Component - Subtle and minimal
const LoadingSpinner: React.FC<{ size?: 'small' | 'large'; message?: string }> = React.memo(({ size = 'large', message = 'Loading...' }) => (
  <div className="loading-spinner">
    <div className={`spinner ${size}`} />
    {size === 'large' && <p className="loading-text">{message}</p>}
  </div>
));

// Error State Component - Clean and actionable
const ErrorState: React.FC<{ error: string; onRetry?: () => void; canRetry?: boolean }> = React.memo(({ error, onRetry, canRetry = true }) => (
  <div className="error-state">
    <h3 className="error-title">Unable to connect</h3>
    <p className="error-message">{error}</p>
    {canRetry && onRetry && (
      <button onClick={onRetry} className="retry-action-button">
        Try Again
      </button>
    )}
  </div>
));

// Message Bubble Component - Enhanced with smooth animations
const MessageBubble: React.FC<{
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
      // Error handled upstream
    } finally {
      setTimeout(() => setIsRetrying(false), CONFIG.RETRY_DELAY);
    }
  }, [isRetrying, message, onRetry]);

  useEffect(() => {
    if (!isCurrentUser && !message.isRead && onMarkAsRead && message.id && message.status === 'sent') {
      // Mark as read silently in background
      onMarkAsRead(message.id);
    }
  }, [isCurrentUser, message.isRead, message.id, message.status, onMarkAsRead]);

  return (
    <div className={`message-bubble ${isCurrentUser ? 'current-user' : 'other-user'}`}>
      <div
        className={`message-content ${isCurrentUser ? 'current-user' : 'other-user'} ${
          message.status === 'sending' ? 'sending' : ''
        } ${message.status === 'failed' ? 'failed' : ''}`}
      >
        <p className="message-text">{message.content}</p>
        <div className={`message-meta ${isCurrentUser ? 'current-user' : 'other-user'}`}>
          <div>
            <time className="message-time" dateTime={message.createdAt || message.timestamp}>
              {formatDistanceToNow(new Date(message.createdAt || message.timestamp!))}
            </time>
            {message.isEdited && <span className="message-edited">edited</span>}
          </div>
          <div className="message-actions">
            {message.status === 'failed' && isCurrentUser && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="retry-button"
                title="Retry sending message"
              >
                {isRetrying ? '⟳' : '!'}
              </button>
            )}
            {isCurrentUser && message.status === 'sent' && (
              <span className="read-receipts">{message.isRead ? '✓✓' : '✓'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Conversation Header Component - Clean and informative
const ConversationHeader: React.FC<{
  receiverName: string;
  propertyTitle?: string;
  isOnline: boolean;
  lastSeen: string;
  onBack: () => void;
  onViewProfile: () => void;
  unreadCount: number;
}> = React.memo(
  ({ receiverName, propertyTitle, isOnline, lastSeen, onBack, onViewProfile, unreadCount }) => (
    <header className="conversation-header">
      <div className="header-content">
        <button onClick={onBack} className="back-button" aria-label="Go back">
          ←
        </button>
        <div className="avatar-container">
          <div className="avatar">{receiverName.charAt(0).toUpperCase()}</div>
          {isOnline && <div className="online-indicator" />}
        </div>
        <div className="header-info">
          <h1 className="receiver-name">{receiverName}</h1>
          <div className="header-meta">
            {propertyTitle && <span className="property-title">🏠 {propertyTitle}</span>}
            <span className="online-status">
              {isOnline ? 'Online' : lastSeen ? `Active ${formatDistanceToNow(new Date(lastSeen))}` : 'Offline'}
            </span>
          </div>
        </div>
        {unreadCount > 0 && <div className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</div>}
        <button onClick={onViewProfile} className="profile-button" aria-label="View profile">
          👤
        </button>
      </div>
    </header>
  )
);

// Message Input Component - Enhanced with better UX
const MessageInput: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isValid: boolean;
  characterCount: number;
}> = React.memo(
  ({ value, onChange, onSubmit, isSubmitting, isValid, characterCount }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (isValid && !isSubmitting) {
            onSubmit(e);
          }
        }
      },
      [isValid, isSubmitting, onSubmit]
    );

    useEffect(() => {
      if (inputRef.current && !isSubmitting) {
        inputRef.current.focus();
      }
    }, [isSubmitting]);

    return (
      <div className="message-input">
        <div className="input-container">
          <div className="input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={onChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isSubmitting}
              className="message-field"
              maxLength={CONFIG.MESSAGE_MAX_LENGTH}
            />
            {characterCount < 100 && (
              <div className={`character-count ${characterCount < 0 ? 'invalid' : 'valid'}`}>
                {characterCount}
              </div>
            )}
          </div>
          <button onClick={onSubmit} disabled={!isValid || isSubmitting} className="send-button">
            {isSubmitting ? (
              <div className="send-button-sending">
                <div className="spinner small" />
              </div>
            ) : (
              <span>Send</span>
            )}
          </button>
        </div>
      </div>
    );
  }
);

// Enhanced Messages Hook with intelligent background sync
const useMessages = (
  currentUser: User | null,
  receiverId: string | number | null,
  propertyId: string | number | null,
  receiverType: string | null
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPollingActive, setIsPollingActive] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  const lastFetchTimeRef = useRef<{ messages: number; unreadCount: number }>({
    messages: 0,
    unreadCount: 0,
  });

  const debouncedActivity = useDebounce(lastActivity, CONFIG.DEBOUNCE_DELAY);

  const fetchMessages = useCallback(async (silent: boolean = true) => {
    if (!currentUser?.id || !receiverId || !isPollingActive) {
      return;
    }

    const now = Date.now();
    if (now - lastFetchTimeRef.current.messages < CONFIG.POLLING_INTERVAL / 2) {
      return;
    }

    try {
      if (!silent) setIsLoading(true);
      
      const data = await apiService.getConversation(currentUser.id, receiverId, {
        propertyId,
        page: pagination.page,
        limit: CONFIG.PAGE_LIMIT,
      });

      setMessages(data.messages || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      setError(null);
      lastFetchTimeRef.current.messages = now;

      // Mark conversation as read silently
      if (data.messages?.some((msg: Message) => !msg.isRead && msg.senderId !== currentUser.id)) {
        apiService.markConversationAsRead(currentUser.id, receiverId);
      }
    } catch (error: any) {
      if (!silent) {
        setError(error.message || 'Unable to load messages');
      }
      // For silent failures, just log and continue
      console.warn('Background message fetch failed:', error.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [currentUser?.id, receiverId, propertyId, pagination.page, isPollingActive]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentUser?.id || !receiverId || !content.trim() || !receiverType || !propertyId) {
        throw new Error('Unable to send message - missing information');
      }

      setLastActivity(Date.now());

      const tempId = `temp_${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        content: content.trim(),
        senderId: currentUser.id,
        receiverId: String(receiverId),
        createdAt: new Date().toISOString(),
        status: 'sending',
        isEdited: false,
        isRead: false,
        sender: {
          id: currentUser.id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
        },
      };

      // Optimistic update
      setMessages((prev) => [...prev, tempMessage]);

      try {
        const responseData = await apiService.sendMessage(
          currentUser.id,
          receiverId,
          content.trim(),
          propertyId,
          receiverType
        );

        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? { ...responseData, status: 'sent' } : msg))
        );
      } catch (error: any) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? { ...msg, status: 'failed' } : msg))
        );
        throw new Error(error.message || 'Failed to send message');
      }
    },
    [currentUser?.id, receiverId, propertyId, receiverType]
  );

  const retryMessage = useCallback(
    async (message: Message) => {
      if (message.status !== 'failed') return;

      setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
      try {
        await sendMessage(message.content);
      } catch (error: any) {
        console.error('Retry failed:', error);
      }
    },
    [sendMessage]
  );

  const markAsRead = useCallback(async (messageId: string) => {
    if (!messageId) return;

    // Optimistic update
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, isRead: true } : msg))
    );

    // Background API call
    apiService.markAsRead(messageId);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!currentUser?.id || !isPollingActive) return;

    const now = Date.now();
    if (now - lastFetchTimeRef.current.unreadCount < CONFIG.UNREAD_COUNT_POLLING_INTERVAL / 2) {
      return;
    }

    try {
      const data = await apiService.getUnreadCount(currentUser.id);
      setUnreadCount(data.unreadCount || 0);
      lastFetchTimeRef.current.unreadCount = now;
    } catch (error: any) {
      // Silent failure for unread count
      console.warn('Background unread count fetch failed:', error.message);
    }
  }, [currentUser?.id, isPollingActive]);

  // Activity-based polling optimization
  useEffect(() => {
    const timeSinceLastActivity = Date.now() - debouncedActivity;
    const shouldReducePolling = timeSinceLastActivity > CONFIG.BACKGROUND_SYNC_THRESHOLD;
    
    if (shouldReducePolling && isPollingActive) {
      // Reduce polling frequency when inactive
      console.log('Reducing polling frequency due to inactivity');
    }
  }, [debouncedActivity, isPollingActive]);

  // Initial fetch
  useEffect(() => {
    if (currentUser?.id && receiverId) {
      fetchMessages(false); // Show initial loading
      fetchUnreadCount();
    }
  }, [currentUser?.id, receiverId]);

  // Intelligent polling
  useEffect(() => {
    if (!currentUser?.id || !receiverId || !isPollingActive) return;

    const timeSinceLastActivity = Date.now() - lastActivity;
    const pollingInterval = timeSinceLastActivity > CONFIG.BACKGROUND_SYNC_THRESHOLD 
      ? CONFIG.POLLING_INTERVAL * 2 // Slower when inactive
      : CONFIG.POLLING_INTERVAL;

    const messageInterval = setInterval(() => fetchMessages(true), pollingInterval);
    const unreadCountInterval = setInterval(fetchUnreadCount, CONFIG.UNREAD_COUNT_POLLING_INTERVAL);

    return () => {
      clearInterval(messageInterval);
      clearInterval(unreadCountInterval);
    };
  }, [currentUser?.id, receiverId, isPollingActive, lastActivity, fetchMessages, fetchUnreadCount]);

  // Pause polling when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPollingActive(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    messages,
    isLoading,
    error,
    pagination,
    unreadCount,
    sendMessage,
    retryMessage,
    markAsRead,
    fetchMessages: () => fetchMessages(false),
  };
};

// Main Component
const InquiryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get data from location state
  const {
    studentId,
    receiverId,
    receiverName,
    receiverType,
    propertyId,
    propertyTitle,
    propertyData,
    fromLogin,
    from,
  } = (location.state || {}) as LocationState;

  // Construct currentUser object
  const currentUser: User | null = studentId
    ? {
        id: studentId,
        firstName: '',
        lastName: '',
      }
    : null;

  // Validate required data
  const hasRequiredData = !!studentId && !!receiverId && !!propertyId;

  const { messages, isLoading, error, unreadCount, sendMessage, retryMessage, markAsRead, fetchMessages } = useMessages(
    hasRequiredData ? currentUser : null,
    hasRequiredData ? receiverId : null,
    hasRequiredData ? propertyId : null,
    hasRequiredData ? receiverType : null
  );

  // Local state
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed values
  const characterCount = CONFIG.MESSAGE_MAX_LENGTH - newMessage.length;
  const isValidMessage = newMessage.trim().length > 0 && newMessage.length <= CONFIG.MESSAGE_MAX_LENGTH;

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, CONFIG.SCROLL_DELAY);
  }, []);

  // Event handlers
  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValidMessage || isSubmitting) return;

      const messageContent = newMessage.trim();
      setNewMessage('');
      setIsSubmitting(true);

      try {
        await sendMessage(messageContent);
        scrollToBottom();
      } catch (err: any) {
        setError(err.message || 'Failed to send message');
      } finally {
        setIsSubmitting(false);
      }
    },
    [isValidMessage, isSubmitting, newMessage, sendMessage, scrollToBottom]
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  }, []);

  const handleBack = useCallback(() => {
    if (propertyData?.id && String(propertyData.id).match(/^[0-9a-zA-Z-]+$/)) {
      navigate(`/property/${propertyData.id}`, { state: { propertyData } });
    } else {
      navigate(from || '/studentdashboard', { state: { studentId } });
    }
  }, [navigate, propertyData, studentId, from]);

  const handleViewProfile = useCallback(() => {
    if (receiverId && String(receiverId).match(/^[0-9a-zA-Z-]+$/)) {
      navigate(`/profile/${receiverId}`, {
        state: { userId: receiverId, fromConversation: true }
      });
    }
  }, [navigate, receiverId]);

  const handleRetry = useCallback(() => {
    setError(null);
    fetchMessages();
  }, [fetchMessages]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  // Handle invalid navigation
  if (!hasRequiredData) {
    return (
      <div className="inquiry-page">
        <div className="container">
          <ErrorState
            error="Invalid conversation data. Please try again from the property page."
            onRetry={handleBack}
            canRetry={true}
          />
        </div>
      </div>
    );
  }

  // Loading state (only shown on initial load)
  if (isLoading && messages.length === 0) {
    return (
      <div className="inquiry-page">
        <div className="container">
          <LoadingSpinner message="Loading conversation..." />
        </div>
      </div>
    );
  }

  // Error state (only shown if no cached data available)
  if (error && messages.length === 0) {
    return (
      <div className="inquiry-page">
        <div className="container">
          <ErrorState 
            error={error} 
            onRetry={handleRetry} 
            canRetry={true} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="inquiry-page">
      <div className="container">
        <div className="conversation-container">
          <ConversationHeader
            receiverName={receiverName || 'Unknown User'}
            propertyTitle={propertyTitle}
            isOnline={false} // Could be enhanced with real-time presence
            lastSeen=""
            onBack={handleBack}
            onViewProfile={handleViewProfile}
            unreadCount={unreadCount}
          />

          <div className="messages-container">
            <div className="messages-list">
              {messages.length === 0 ? (
                <div className="empty-conversation">
                  <div className="empty-icon">💬</div>
                  <h3>Start the conversation</h3>
                  <p>Send a message to begin chatting about {propertyTitle || 'this property'}.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isCurrentUser={message.senderId === currentUser?.id}
                    onRetry={retryMessage}
                    onMarkAsRead={markAsRead}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <MessageInput
            value={newMessage}
            onChange={handleInputChange}
            onSubmit={handleSendMessage}
            isSubmitting={isSubmitting}
            isValid={isValidMessage}
            characterCount={characterCount}
          />
        </div>
      </div>

      {/* Subtle error notification for background failures */}
      {error && messages.length > 0 && (
        <div className="background-error-toast">
          <span>Connection issue - trying to reconnect...</span>
          <button onClick={() => setError(null)} className="toast-close">×</button>
        </div>
      )}
    </div>
  );
};

export default InquiryPage;