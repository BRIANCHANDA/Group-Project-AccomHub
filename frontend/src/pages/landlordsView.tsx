import React, { useState, useEffect } from "react";
import { Bell, PlusCircle, Trash, Home, Users, Bed, Bath, Square } from "lucide-react";
import PropertyCreationForm from "./PropertyCraeationForm";
import NotificationPanel from "./NotificationPannel";
import { useLocation, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  // Primary color: rgb(48, 0, 126) - Deep Purple
  // Using this consistently across the dashboard
  const PRIMARY_COLOR = "rgb(48, 0, 126)";
  const PRIMARY_LIGHT = "rgba(48, 0, 126, 0.1)";
  const PRIMARY_MEDIUM = "rgba(48, 0, 126, 0.3)";

  const navigate = useNavigate();
  const location = useLocation();
  
  // Get landlordId from location state (from login page)
  const landlordId = location.state?.landlordId;
  const [landlordName, setLandlordName] = useState("Landlord");
  
  // Enhanced Property interface to match the API response
  interface PropertyDetails {
    bedrooms?: number;
    bathrooms?: number;
    furnished?: boolean;
    squareMeters?: number;
    amenities?: string[];
    rules?: string[];
  }
  
  interface Property {
    id: string | number;
    title?: string;
    description?: string;
    location: string;
    price: string;
    status?: string;
    inquiries?: number;
    imageUrl?: string | null;
    propertyType?: string;
    details?: PropertyDetails;
  }

  const [properties, setProperties] = useState<Property[]>([]);
  
  interface Notification {
    id: string;
    [key: string]: any; // Add other properties as needed
  }

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch data when component mounts
  useEffect(() => {
    // Check if user is logged in
    if (!landlordId) {
      // Redirect to login if no landlordId
      navigate('/login', { state: { message: "Please login to access your dashboard" } });
      return;
    }
    
    // Fetch landlord properties
    fetchProperties();
    
    // Fetch notifications
    fetchNotifications();
  }, [landlordId, navigate]);

  // Fetch properties from API using the route defined in paste-2.txt
  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/property-images/landlords/${landlordId}/properties`);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();
      
      // Map API response to our Property interface
      const mappedProperties = data.properties.map((prop: any) => ({
        id: prop.id.toString(),
        title: prop.title || '',
        description: prop.description || '',
        location: prop.location,
        price: prop.price,
        status: prop.status || 'Available',
        inquiries: prop.inquiries || 0,
        imageUrl: prop.imageUrl,
        propertyType: prop.propertyType,
        details: prop.details
      }));
      
      setProperties(mappedProperties);
      
      // If landlord info is included in response
      if (data.landlordName) {
        setLandlordName(data.landlordName);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      // You could set an error state here
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`/api/landlords/${landlordId}/notifications`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const deleteProperty = async (id: string) => {
    try {
      // API call to delete property
      const response = await fetch(`/api/properties/properties/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete property');
      }
      
      // Update UI after successful deletion
      setProperties(properties.filter((property) => property.id !== id));
    } catch (error) {
      console.error('Error deleting property:', error);
      // You could show an error message to the user
    }
  };

  const handleNotificationToggle = () => {
    setShowNotifications(!showNotifications);
    // Close property form if open
    if (showPropertyForm) setShowPropertyForm(false);
  };

  const handleNotificationAction = async (id: any, action: any) => {
    try {
      // API call to handle notification action (e.g., mark as read, delete)
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process notification');
      }
      
      // Update UI after successful action
      setNotifications(notifications.filter((notification) => notification.id !== id));
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const handleAddPropertyClick = () => {
    setShowPropertyForm(true);
    // Close notifications if open
    if (showNotifications) setShowNotifications(false);
  };

  const handlePropertyFormClose = () => {
    setShowPropertyForm(false);
  };

  // Modified function to handle property form submission
  const handlePropertyFormSubmit = async (propertyId: string, propertyData?: any) => {
    setIsSubmitting(true);
    
    try {
      // Use the property data directly if it's available from the form
      const tempProperty: Property = {
        id: propertyId || `temp-${Date.now()}`,
        location: propertyData?.address || propertyData?.location || "New Property",
        price: propertyData?.price || `K${propertyData?.monthlyRent}` || "Price not set",
        status: propertyData?.isAvailable ? "Available" : "Not Available",
        inquiries: 0,
        // Store the actual image URL if provided
        imageUrl: propertyData?.imageUrl || null,
        details: propertyData?.details || {}
      };
      
      // Add the property to the UI
      setProperties(prevProperties => {
        // Check if this property already exists (in case of update)
        const existingIndex = prevProperties.findIndex(p => p.id === propertyId);
        
        if (existingIndex >= 0) {
          // Replace the existing property
          const updatedProperties = [...prevProperties];
          updatedProperties[existingIndex] = tempProperty;
          return updatedProperties;
        } else {
          // Add as a new property
          return [...prevProperties, tempProperty];
        }
      });
      
      // Close the form
      setShowPropertyForm(false);
      
      // Only make the API call if we didn't get the data directly from the form
      if (!propertyData) {
        // Your existing API call to create property
        const response = await fetch('/api/properties/properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(propertyData),
        });
        
      } else {
        // Property was already created and we're just updating the UI
        console.log("Property was created successfully:", propertyId);
      }
      
      // Refresh properties to get the complete data from the server
      setTimeout(() => {
        fetchProperties();
      }, 1000);
      
    } catch (error) {
      console.error('Error creating property:', error);
      // Remove the temporary property if there was an error
      setProperties(prevProperties => 
        prevProperties.filter(property => property.id !== propertyId)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Improved image upload handler
  const handleImageUpload = async (propertyId: string, imageFile: File) => {
    try {
      // Create form data for image upload
      const formData = new FormData();
      formData.append('propertyId', propertyId);
      formData.append('image', imageFile);
      formData.append('isPrimary', 'true');
      
      // Upload the image to your API
      const response = await fetch('/api/property-images/property-images', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const result = await response.json();
      const uploadedImageUrl = result.imageUrl;
      
      // Update the property with the new image URL
      setProperties(prevProperties => 
        prevProperties.map(property => 
          property.id === propertyId ? { ...property, imageUrl: uploadedImageUrl } : property
        )
      );
      
      return uploadedImageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  // Calculate total inquiries across all properties
  const totalInquiries = properties.reduce((sum, property) => sum + (property.inquiries || 0), 0);

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
              <span className="user-greeting">Hi, {landlordName}!</span>
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
        {isLoading ? (
          <div className="loading-container">
            <p>Loading your dashboard...</p>
          </div>
        ) : (
          <>
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
                    <p className="stat-value">{totalInquiries}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Properties Section */}
            <div className="properties-container">
              <div className="properties-header">
                <h2 className="properties-title">Manage Properties</h2>
                <button 
                  className="add-property-button" 
                  onClick={handleAddPropertyClick}
                  disabled={isSubmitting}
                >
                  <PlusCircle size={18} className="button-icon" />
                  {isSubmitting ? 'Adding...' : 'Add New Property'}
                </button>
              </div>

              {properties.length === 0 ? (
                <div className="empty-state">
                  <p>You don't have any properties yet. Add your first property to get started!</p>
                </div>
              ) : (
                <div className="properties-grid">
                  {properties.map((property) => (
                    <div key={property.id} className="property-card">
                      <div className="property-image-container">
                        {property.imageUrl ? (
                          // Display the actual property image if available
                          <img 
                            src={property.imageUrl} 
                            alt={property.location}
                            className="property-image"
                            onError={(e) => {
                              // If image fails to load, use a fallback with the property name
                              const target = e.target as HTMLImageElement;
                              target.onerror = null; // Prevent infinite loop
                              target.src = `/api/placeholder/280/180?text=${encodeURIComponent(property.location)}`;
                            }}
                          />
                        ) : (
                          // Fallback image with property name
                          <div className="property-image-placeholder">
                            <p>No image available</p>
                          </div>
                        )}
                        <div className={`property-status ${
                          property.status === "Available" ? "status-available" : "status-rented"
                        }`}>
                          {property.status || "Available"}
                        </div>
                      </div>
                      
                      <div className="property-details">
                        <h3 className="property-location">
                          {property.title || property.location}
                        </h3>
                        <p className="property-address">{property.location}</p>
                        <p className="property-price">{property.price} <span className="price-period">per month</span></p>
                        
                        {/* Display property details if available */}
                        {property.details && (
                          <div className="property-features">
                            {property.details.bedrooms !== undefined && (
                              <span className="feature">
                                <Bed size={16} />
                                {property.details.bedrooms} {property.details.bedrooms === 1 ? 'bed' : 'beds'}
                              </span>
                            )}
                            {property.details.bathrooms !== undefined && (
                              <span className="feature">
                                <Bath size={16} />
                                {property.details.bathrooms} {property.details.bathrooms === 1 ? 'bath' : 'baths'}
                              </span>
                            )}
                            {property.details.squareMeters !== undefined && (
                              <span className="feature">
                                <Square size={16} />
                                {property.details.squareMeters}m²
                              </span>
                            )}
                            {property.details.furnished !== undefined && (
                              <span className="feature">
                                {property.details.furnished ? 'Furnished' : 'Unfurnished'}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <p className="property-inquiries">
                          <span className="inquiries-count">{property.inquiries || 0}</span> inquiries
                        </p>
                        
                        {/* Property type if available */}
                        {property.propertyType && (
                          <p className="property-type">{property.propertyType}</p>
                        )}
                        
                        {/* Don't show delete button for properties currently being added */}
                        {!String(property.id).startsWith('temp-') && (
                          <button 
                            className="delete-property-button"
                            onClick={() => deleteProperty(property.id.toString())}
                          >
                            <Trash size={16} className="button-icon" />
                            Delete
                          </button>
                        )}
                        
                        {/* Show indicator for properties being processed */}
                        {String(property.id).startsWith('temp-') && (
                          <div className="processing-indicator">
                            Processing...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Property Creation Form Modal */}
      {showPropertyForm && (
        <PropertyCreationForm 
          isOpen={showPropertyForm}
          onClose={handlePropertyFormClose}
          onSubmit={handlePropertyFormSubmit}
          onImageUpload={handleImageUpload}
          landlordId={landlordId}
        />
      )}

      {/* CSS Styles */}
      <style jsx>{`
        /* Global Reset & Viewport Setup */
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        /* Essential Full Screen Setup */
        html, body {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }

        /* Global Dashboard Styles - Ensure 100% width */
        .dashboard-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: 100vw;
          max-width: 100%;
          background-color: #f9fafb;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          overflow-x: hidden;
        }

        /* Loading State */
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 300px;
          width: 100%;
          font-size: 1.1rem;
          color: #6b7280;
        }

        /* Empty State */
        .empty-state {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
          width: 100%;
        }

        /* Header Styles - Full Width */
        .dashboard-header {
          background-color: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          position: fixed;
          top: 0;
          z-index: 1000;
          width: 100%;
          
        }

        .header-container {
          width: 100%;
          max-width: 100%;
          padding: 0 1rem;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 4rem;
          width: 100%;
        }

        /* Improved mobile-first responsive layout */
        @media (max-width: 768px) {
          .header-content {
            height: auto;
            padding: 1rem 0;
            gap: 1rem;
            flex-wrap: wrap;
          }
          
          .logo-section {
            width: 100%;
            text-align: center;
          }
          
          .search-container {
            width: 100%;
            margin: 0.5rem 0;
            order: 3;
          }

              .property-features {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 8px 0;
        }
        
        .feature {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.85rem;
          background-color: ${PRIMARY_LIGHT};
          padding: 4px 8px;
          border-radius: 4px;
        }
        
        .property-address {
          color: #666;
          font-size: 0.9rem;
          margin-top: 2px;
        }
        
        .property-type {
          font-size: 0.85rem;
          color: #666;
          font-style: italic;
          margin-top: 4px;
        }
          
          .user-actions {
            width: 100%;
            justify-content: center;
            order: 2;
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
          width: 100%;
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
          gap: 0.75rem;
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
        
        /* Main Content Styles - Full Width */
        .dashboard-main {
          flex: 1;
          width: 100%;
          padding: 1rem;
          box-sizing: border-box;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          padding-top: 5rem;
        }

        /* Stats Grid Styles */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
          width: 100%;
        }

        /* Better breakpoints for stat cards */
        @media (min-width: 480px) {
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
          width: 100%;
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

        /* Properties Container Styles - Full Width */
        .properties-container {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          border: 1px solid ${PRIMARY_LIGHT};
          overflow: hidden;
          width: 100%;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .properties-header {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid ${PRIMARY_LIGHT};
          background-color: ${PRIMARY_LIGHT};
          width: 100%;
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

        .add-property-button:disabled {
          background-color: ${PRIMARY_MEDIUM};
          cursor: not-allowed;
        }

        @media (min-width: 640px) {
          .add-property-button {
            width: auto;
          }
        }

        .add-property-button:hover:not(:disabled) {
          background-color: rgba(48, 0, 126, 0.9);
        }

        .button-icon {
          margin-right: 0.5rem;
        }

        /* Properties Grid - Improved to completely fill available space */
        .properties-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem;
          padding: 1rem;
          width: 100%;
          box-sizing: border-box;
          flex: 1;
        }

        /* Property card styles */
        .property-card {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          border: 1px solid ${PRIMARY_LIGHT};
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
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
          padding-bottom: 60%;
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
          flex: 1;
          display: flex;
          flex-direction: column;
          color:black;
        }

        .property-location {
          font-size: 0.9375rem;
          font-weight: 500;
          color:rgb(0, 0, 0);
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
          margin-top: auto;
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

        .processing-indicator {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 1rem;
          margin-top: auto;
          background-color: ${PRIMARY_LIGHT};
          color: ${PRIMARY_COLOR};
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Ensure the layout works on very small screens */
        @media screen and (max-width: 320px) {
          .dashboard-container {
            padding: 0;
          }
          
          .dashboard-main {
            padding: 0.5rem;
          }
          
          .header-container {
            padding: 0 0.5rem;
          }
          
          .properties-grid {
            padding: 0.5rem;
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;