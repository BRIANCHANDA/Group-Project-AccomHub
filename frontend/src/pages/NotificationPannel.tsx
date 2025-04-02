import React from "react";
import { X } from "lucide-react";

const NotificationPanel = ({ notifications, onAction, primaryColor, primaryLight }) => {
  return (
    <div className="notifications-panel">
      <div className="notifications-header">
        <h2 className="notifications-title">Booking Inquiries</h2>
      </div>
      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div key={notification.id} className="notification-item">
              <div className="notification-content">
                <div className="notification-header">
                  <p className="notification-property">{notification.property}</p>
                  <p className="notification-date">{notification.date}</p>
                </div>
                <div className="notification-details">
                  <div className="user-info">
                    <p className="notification-name">{notification.name}</p>
                    <p className="notification-contact">
                      <span className="contact-label">Email:</span> {notification.email}
                    </p>
                    <p className="notification-contact">
                      <span className="contact-label">Phone:</span> {notification.phone}
                    </p>
                  </div>
                </div>
                <div className="notification-actions">
                  <button
                    className="accept-button"
                    onClick={() => onAction(notification.id, "accept")}
                  >
                    Accept
                  </button>
                  <button
                    className="decline-button"
                    onClick={() => onAction(notification.id, "decline")}
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-notifications">
            <div className="empty-state">
              <div className="empty-icon">📬</div>
              <p>No new booking inquiries</p>
            </div>
          </div>
        )}
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        /* Notification Panel Styles */
        .notifications-panel {
          position: absolute;
          right: 1rem;
          top: 4rem;
          width: 100%;
          max-width: 28rem;
          background-color: white;
          border-radius: 0.375rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          z-index: 20;
          border: 1px solid ${primaryLight};
          animation: slideDown 0.3s ease-out;
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

        @media (min-width: 768px) {
          .notifications-panel {
            right: 2rem;
          }
        }

        @media (min-width: 1536px) {
          .notifications-panel {
            max-width: 32rem;
          }
        }

        .notifications-header {
          padding: 1rem;
          border-bottom: 1px solid ${primaryLight};
          background-color: ${primaryLight};
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .notifications-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: ${primaryColor};
          margin: 0;
        }

        .notifications-list {
          max-height: 24rem;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: ${primaryLight} transparent;
        }

        .notifications-list::-webkit-scrollbar {
          width: 6px;
        }

        .notifications-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .notifications-list::-webkit-scrollbar-thumb {
          background-color: ${primaryLight};
          border-radius: 10px;
        }

        .notification-item {
          padding: 1rem;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s;
        }

        .notification-item:hover {
          background-color: ${primaryLight};
        }

        .notification-content {
          display: flex;
          flex-direction: column;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .notification-property {
          font-weight: 600;
          color: ${primaryColor};
          margin: 0;
        }

        .notification-date {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
        }

        .notification-details {
          margin-bottom: 0.75rem;
        }

        .notification-name {
          font-weight: 500;
          font-size: 0.875rem;
          color: #1f2937;
          margin: 0 0 0.25rem 0;
        }

        .notification-contact {
          font-size: 0.8125rem;
          color: #4b5563;
          margin: 0 0 0.125rem 0;
        }

        .contact-label {
          font-weight: 500;
          color: #6b7280;
        }

        .notification-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .accept-button {
          flex: 1;
          padding: 0.375rem 0.75rem;
          background-color: ${primaryColor};
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 0.25rem;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.1s;
        }

        .accept-button:hover {
          background-color: rgba(48, 0, 126, 0.9);
        }

        .accept-button:active {
          transform: scale(0.98);
        }

        .decline-button {
          flex: 1;
          padding: 0.375rem 0.75rem;
          background-color: #f3f4f6;
          color: #4b5563;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 0.25rem;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.1s;
        }

        .decline-button:hover {
          background-color: #e5e7eb;
        }

        .decline-button:active {
          transform: scale(0.98);
        }

        .no-notifications {
          padding: 2rem;
          text-align: center;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default NotificationPanel;