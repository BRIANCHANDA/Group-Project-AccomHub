import React, { useState } from "react";
import { Bell, PlusCircle, Trash, Home, Users, DollarSign, Calendar } from "lucide-react";
import PropertyCreationForm from "./PropertyCraeationForm";
import NotificationPanel from "./NotificationPannel";

const Dashboard = () => {
  // Primary color: rgb(48, 0, 126) - Deep Purple
  // Using this consistently across the dashboard
  const PRIMARY_COLOR = "rgb(48, 0, 126)";
  const PRIMARY_LIGHT = "rgba(48, 0, 126, 0.1)";
  const PRIMARY_MEDIUM = "rgba(48, 0, 126, 0.3)";

  const [properties, setProperties] = useState([
    {
      id: 1,
      location: "BB boarding, Nkana East",
      price: "K670",
      inquiries: 50,
      status: "Available",
      image: "/api/placeholder/280/180"
      
    },
    {
      id: 2,
      location: "BB boarding, Nkana East",
      price: "K670",
      inquiries: 6,
      status: "Rented",
      image: "/api/placeholder/280/180"
    },
    {
      id: 3,
      location: "Riverside Apartments, Kitwe",
      price: "K850",
      inquiries: 12,
      status: "Available",
      image: "/api/placeholder/280/180"
    },
    {
      id: 4,
      location: "Park View Estate, Ndola",
      price: "K920",
      inquiries: 3,
      status: "Rented",
      image: "/api/placeholder/280/180"
    },
  ]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      property: "BH REAL ESTATES",
      name: "John Doe",
      email: "john@gmail.com",
      phone: "0975325262",
      date: "23 June, 2028",
    },
    {
      id: 2,
      property: "BH REAL ESTATES",
      name: "Jane Doe",
      email: "jane02@gmail.com",
      phone: "0975325262",
      date: "23 June, 2028",
    },
    {
      id: 3,
      property: "BH REAL ESTATES",
      name: "Bravo Doe",
      email: "bravo@gmail.com",
      phone: "0975365262",
      date: "5 Jan, 2028",
    },
  ]);

  const deleteProperty = (id) => {
    setProperties(properties.filter((property) => property.id !== id));
  };

  const handleNotificationToggle = () => {
    setShowNotifications(!showNotifications);
    // Close property form if open
    if (showPropertyForm) setShowPropertyForm(false);
  };

  const handleNotificationAction = (id, action) => {
    setNotifications(notifications.filter((notification) => notification.id !== id));
  };

  const handleAddPropertyClick = () => {
    setShowPropertyForm(true);
    // Close notifications if open
    if (showNotifications) setShowNotifications(false);
  };

  const handlePropertyFormClose = () => {
    setShowPropertyForm(false);
  };

  const handlePropertyFormSubmit = (formData) => {
    // Create a new property from the form data
    const newProperty = {
      id: properties.length > 0 ? Math.max(...properties.map(p => p.id)) + 1 : 1,
      location: formData.property.address,
      price: `K${formData.property.monthlyRent}`,
      inquiries: 0,
      status: formData.property.isAvailable ? "Available" : "Rented",
      image: formData.propertyImages.length > 0 
        ? formData.propertyImages.find(img => img.isPrimary)?.imageUrl || formData.propertyImages[0].imageUrl
        : "/api/placeholder/280/180"
    };

    // Add the new property to the properties state
    setProperties([...properties, newProperty]);
    
    // Close the form
    setShowPropertyForm(false);
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-container">
          <div className="header-content">
            <div className="logo-section">
              <h1 className="dashboard-title">Landlord Dashboard</h1>
            </div>
            
            <div className="search-container">
              <div className="search-wrapper">
                <input
                  type="text"
                  placeholder="Search properties..."
                  className="search-input"
                />
              </div>
            </div>
            
            <div className="user-actions">
              <span className="user-greeting">Hi, Landlord!</span>
              <div className="notification-container" onClick={handleNotificationToggle}>
                <button className="notification-button">
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="notification-badge">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </div>
              <img
                src="/api/placeholder/40/40"
                alt="User Avatar"
                className="user-avatar"
              />
            </div>
          </div>
        </div>

        {/* Notifications Panel */}
        {showNotifications && (
          <NotificationPanel 
            notifications={notifications} 
            onAction={handleNotificationAction} 
            primaryColor={PRIMARY_COLOR}
            primaryLight={PRIMARY_LIGHT}
          />
        )}
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon-container">
                <Home size={24} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Total Properties</p>
                <p className="stat-value">{properties.length}</p>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon-container">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Active Inquiries</p>
                <p className="stat-value">{notifications.length}</p>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon-container">
                <DollarSign size={24} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Monthly Revenue</p>
                <p className="stat-value">K24,500</p>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon-container">
                <Calendar size={24} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Occupancy Rate</p>
                <p className="stat-value">
                  {Math.round((properties.filter(p => p.status === "Rented").length / properties.length) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Section */}
        <div className="properties-container">
          <div className="properties-header">
            <h2 className="properties-title">Manage Properties</h2>
            <button className="add-property-button" onClick={handleAddPropertyClick}>
              <PlusCircle size={18} className="button-icon" />
              Add New Property
            </button>
          </div>

          <div className="properties-grid">
            {properties.map((property) => (
              <div key={property.id} className="property-card">
                <div className="property-image-container">
                  <img 
                    src={property.image} 
                    alt={property.location}
                    className="property-image"
                  />
                  <div className={`property-status ${
                    property.status === "Available" ? "status-available" : "status-rented"
                  }`}>
                    {property.status}
                  </div>
                </div>
                
                <div className="property-details">
                  <h3 className="property-location">{property.location}</h3>
                  <p className="property-price">{property.price} <span className="price-period">per month</span></p>
                  <p className="property-inquiries">
                    <span className="inquiries-count">{property.inquiries}</span> inquiries
                  </p>
                  
                  <button 
                    className="delete-property-button"
                    onClick={() => deleteProperty(property.id)}
                  >
                    <Trash size={16} className="button-icon" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Property Creation Form Modal */}
      <PropertyCreationForm 
        isOpen={showPropertyForm}
        onClose={handlePropertyFormClose}
        onSubmit={handlePropertyFormSubmit}
      />

      {/* CSS Styles */}
      <style jsx>{`
        /* Global Dashboard Styles */
        .dashboard-container {
          min-height: 100vh;
          width: 100%;
          background-color: #f9fafb;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          overflow-x: hidden;
        }

        /* Header Styles */
        .dashboard-header {
          background-color: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 10;
          width: 100%;
        }

        .header-container {
          width: 100%;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 4rem;
          flex-wrap: wrap;
        }

        @media (max-width: 640px) {
          .header-content {
            padding: 0.5rem 0;
          }
          
          .logo-section {
            width: 100%;
            margin-bottom: 0.5rem;
          }
          
          .search-container {
            flex: 1;
            margin: 0;
          }
        }

        .dashboard-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: ${PRIMARY_COLOR};
          margin: 0;
          white-space: nowrap;
        }

        .search-container {
          flex: 1;
          max-width: 28rem;
          margin: 0 1rem;
        }

        .search-wrapper {
          position: relative;
        }

        .search-input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
          background-color: #f3f4f6;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          outline: none;
          color: black;
        }

        .search-input:focus {
          border-color: ${PRIMARY_COLOR};
          box-shadow: 0 0 0 3px ${PRIMARY_LIGHT};
        }

        .user-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .user-greeting {
          color: #4b5563;
          display: none;
        }

        @media (min-width: 768px) {
          .user-greeting {
            display: inline;
          }
        }

        .notification-container {
          position: relative;
          cursor: pointer;
        }

        .notification-button {
          padding: 0.25rem;
          border-radius: 9999px;
          color: #4b5563;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-button:hover {
          background-color: ${PRIMARY_LIGHT};
          color: ${PRIMARY_COLOR};
        }

        .notification-badge {
          position: absolute;
          top: -0.25rem;
          right: -0.25rem;
          background-color: ${PRIMARY_COLOR};
          color: white;
          font-size: 0.75rem;
          height: 1.25rem;
          width: 1.25rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-avatar {
          height: 2rem;
          width: 2rem;
          border-radius: 9999px;
          border: 2px solid ${PRIMARY_LIGHT};
        }
        
        /* Main Content Styles */
        .dashboard-main {
          width: 100%;
          margin: 0 auto;
          padding: 1rem;
          box-sizing: border-box;
        }

        /* Stats Grid Styles */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        @media (min-width: 480px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-card {
          background-color: white;
          padding: 1rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          border: 1px solid ${PRIMARY_LIGHT};
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .stat-content {
          display: flex;
          align-items: center;
        }

        .stat-icon-container {
          padding: 0.75rem;
          border-radius: 9999px;
          background-color: ${PRIMARY_LIGHT};
          color: ${PRIMARY_COLOR};
          margin-right: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-info {
          flex: 1;
        }

        .stat-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          margin: 0 0 0.25rem 0;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: ${PRIMARY_COLOR};
          margin: 0;
        }

        /* Properties Container Styles */
        .properties-container {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          border: 1px solid ${PRIMARY_LIGHT};
          overflow: hidden;
          width: 100%;
        }

        .properties-header {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid ${PRIMARY_LIGHT};
          background-color: ${PRIMARY_LIGHT};
        }

        @media (min-width: 640px) {
          .properties-header {
            flex-direction: row;
            align-items: center;
            padding: 1rem 1.5rem;
          }
        }

        .properties-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: ${PRIMARY_COLOR};
          margin: 0 0 0.75rem 0;
        }

        @media (min-width: 640px) {
          .properties-title {
            margin: 0;
          }
        }

        .add-property-button {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1rem;
          background-color: ${PRIMARY_COLOR};
          color: white;
          border-radius: 0.375rem;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background-color 0.2s;
          width: 100%;
          justify-content: center;
        }

        @media (min-width: 640px) {
          .add-property-button {
            width: auto;
          }
        }

        .add-property-button:hover {
          background-color: rgba(48, 0, 126, 0.9);
        }

        .button-icon {
          margin-right: 0.5rem;
        }

        /* Properties Grid Styles - Enhanced for better responsive layout */
        .properties-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1rem;
          padding: 1rem;
          width: 100%;
          box-sizing: border-box;
        }

        @media (min-width: 480px) {
          .properties-grid {
            grid-template-columns: repeat(1, 1fr);
          }
        }

        @media (min-width: 640px) {
          .properties-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem;
            padding: 1.25rem;
          }
        }

        @media (min-width: 768px) {
          .properties-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .properties-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
            padding: 1.5rem;
          }
        }

        @media (min-width: 1280px) {
          .properties-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (min-width: 1536px) {
          .properties-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }

        @media (min-width: 1800px) {
          .properties-grid {
            grid-template-columns: repeat(6, 1fr);
          }
        }

        .property-card {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          border: 1px solid ${PRIMARY_LIGHT};
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          width: 100%;
        }

        .property-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border-color: ${PRIMARY_COLOR};
        }

        .property-image-container {
          position: relative;
          width: 100%;
          height: 0;
          padding-bottom: 56.25%; /* 16:9 aspect ratio */
          overflow: hidden;
        }

        .property-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        
        .property-card:hover .property-image {
          transform: scale(1.05);
        }

        .property-status {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 0.25rem;
        }

        .status-available {
          background-color: ${PRIMARY_LIGHT};
          color: ${PRIMARY_COLOR};
        }

        .status-rented {
          background-color: rgba(220, 38, 38, 0.1);
          color: rgb(220, 38, 38);
        }

        .property-details {
          padding: 1rem;
        }

        .property-location {
          font-size: 0.9375rem;
          font-weight: 500;
          color: #1f2937;
          margin: 0 0 0.25rem 0;
          word-wrap: break-word;
        }

        .property-price {
          font-size: 1.125rem;
          font-weight: 700;
          color: ${PRIMARY_COLOR};
          margin: 0 0 0.5rem 0;
        }

        .price-period {
          font-size: 0.75rem;
          font-weight: 400;
          color: #6b7280;
        }

        .property-inquiries {
          font-size: 0.875rem;
          color: #4b5563;
          margin: 0 0 0.75rem 0;
        }

        .inquiries-count {
          font-weight: 500;
        }

        .delete-property-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 1rem;
          margin-top: 0.5rem;
          background-color: white;
          color: #4b5563;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .delete-property-button:hover {
          background-color: #fee2e2;
          color: #dc2626;
          border-color: #fecaca;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;