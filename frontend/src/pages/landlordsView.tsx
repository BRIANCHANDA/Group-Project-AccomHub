import React, { useState, useEffect } from "react";
import { Bell, PlusCircle, Trash, Home, Users, Bed, Bath, Square, Settings, Moon, Sun, MessageSquare } from "lucide-react";
import PropertyCreationForm from "./PropertyCraeationForm";
import NotificationPanel from "./NotificationPannel";
import { useLocation, useNavigate, Link } from 'react-router-dom';
import "./landloard.css";


const Dashboard = () => {
  // Theme colors
 const THEME = {
  light: {
    PRIMARY_COLOR: "rgb(29, 78, 216)",
    PRIMARY_LIGHT: "rgba(29, 78, 216, 0.15)",
    PRIMARY_MEDIUM: "rgba(29, 78, 216, 0.5)",
    BACKGROUND: "#f9fafb",
    CARD_BACKGROUND: "white",
    TEXT_PRIMARY: "black",
    TEXT_SECONDARY: "#4b5563",
    TEXT_TERTIARY: "#6b7280",
    BORDER: "#e5e7eb"
  },
  dark: {
    PRIMARY_COLOR: "rgb(59, 130, 246)",
    PRIMARY_LIGHT: "rgba(59, 130, 246, 0.15)",
    PRIMARY_MEDIUM: "rgba(59, 130, 246, 0.5)",
    BACKGROUND: "#111827",
    CARD_BACKGROUND: "#1f2937",
    TEXT_PRIMARY: "white",
    TEXT_SECONDARY: "#d1d5db",
    TEXT_TERTIARY: "#9ca3af",
    BORDER: "#374151"
  }
};

  const navigate = useNavigate();
  const location = useLocation();

  // Get landlordId from location state
  const landlordId = location.state?.landlordId;
  const [landlordName, setLandlordName] = useState("Landlord");

  // Theme state - default to light
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Current theme colors
  const currentTheme = isDarkMode ? THEME.dark : THEME.light;

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

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('landlordDashboardTheme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  // Apply theme to document body when theme changes
  useEffect(() => {
    document.body.style.backgroundColor = currentTheme.BACKGROUND;
    document.body.style.color = currentTheme.TEXT_PRIMARY;

    // Save theme preference to localStorage
    localStorage.setItem('landlordDashboardTheme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, currentTheme]);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setShowThemeMenu(false);
  };

  // Handle settings icon click
  const handleSettingsClick = () => {
    setShowThemeMenu(!showThemeMenu);
    // Close other panels if open
    if (showNotifications) setShowNotifications(false);
  };

 
  // Handle navigation to inquiries page
const handleInquiriesClick = () => {
  // Convert landlordId to number before passing
  const landlordIdNumber = Number(landlordId);
  
  // Optional: Add validation to ensure it's a valid number
  if (isNaN(landlordIdNumber)) {
    console.error('Invalid landlordId:', landlordId);
    return;
  }
  
  navigate('/inquiries', { state: { landlordId: landlordIdNumber } });
};

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
    // Close property form and theme menu if open
    if (showPropertyForm) setShowPropertyForm(false);
    if (showThemeMenu) setShowThemeMenu(false);
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
    // Close notifications and theme menu if open
    if (showNotifications) setShowNotifications(false);
    if (showThemeMenu) setShowThemeMenu(false);
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

              {/* Theme Settings Button */}
              <div className="settings-container" onClick={handleSettingsClick}>
                <button className="settings-button">
                  <Settings size={20} />
                </button>
              </div>

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

        {/* Theme Menu */}
        {showThemeMenu && (
          <div className="theme-menu">
            <div className="theme-menu-header">
              <h3>Settings</h3>
            </div>
            <div className="theme-option" onClick={toggleTheme}>
              <div className="theme-option-content">
                <span className="theme-label">
                  {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                </span>
                <div className="theme-icon">
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Panel */}
        {showNotifications && (
          <NotificationPanel
            notifications={notifications}
            onAction={handleNotificationAction}
            primaryColor={currentTheme.PRIMARY_COLOR}
            primaryLight={currentTheme.PRIMARY_LIGHT}
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
            {/* Navigation Menu */}
            <div className="navigation-menu">
              <div className="nav-item active">
                <Home size={18} />
                <span>Dashboard</span>
              </div>
              
            </div>

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

              <div className="stat-card" onClick={handleInquiriesClick} style={{ cursor: 'pointer' }}>
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
          isDarkMode={isDarkMode}
          themeColors={currentTheme}
        />
      )}

 <footer className="mt-auto">
        <div className="container">
          <div className="row gy-4">
            <div className="col-md-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center">
                <i className="bi bi-building-fill me-2"></i>
                NexNest
              </h5>
              <p className="mb-3">Your trusted partner for finding safe and affordable student housing at Copperbelt University.</p>
              <div className="d-flex gap-3">
                {['facebook', 'twitter-x', 'instagram', 'linkedin'].map((platform) => (
                  <a href="#" className="text-white" key={platform}>
                    <i className={`bi bi-${platform} fs-5`}></i>
                  </a>
                ))}
              </div>
            </div>
            <div className="col-md-8">
              <div className="row">
                <div className="col-sm-4">
                  <h6 className="fw-bold mb-3">Quick Links</h6>
                  <ul className="list-unstyled mb-0">
                    {['Home', 'Browse Listings', 'Saved Properties', 'My Account'].map((link) => (
                      <li className="mb-2" key={link}>
                        <a href="#" className="text-decoration-none text-white-50 hover-white">{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="col-sm-4">
                  <h6 className="fw-bold mb-3">Resources</h6>
                  <ul className="list-unstyled mb-0">
                    {['FAQs', 'Student Guide', 'Safety Tips', 'Blog'].map((resource) => (
                      <li className="mb-2" key={resource}>
                        <a href="#" className="text-decoration-none text-white-50 hover-white">{resource}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="col-sm-4">
                  <h6 className="fw-bold mb-3">Contact Us</h6>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2 d-flex align-items-center">
                      <i className="bi bi-geo-alt me-2"></i>
                      <span className="text-white-50">CBU Campus, Kitwe</span>
                    </li>
                    <li className="mb-2 d-flex align-items-center">
                      <i className="bi bi-envelope me-2"></i>
                      <span className="text-white-50">support@nexnest.ac.zm</span>
                    </li>
                    <li className="mb-2 d-flex align-items-center">
                      <i className="bi bi-telephone me-2"></i>
                      <span className="text-white-50">+260 972 526777</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-12 mt-4">
              <hr className="border-secondary" />
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3">
                <p className="mb-0 text-white-50">© {new Date().getFullYear()} NexNest. All rights reserved.</p>
                <div className="mt-3 mt-sm-0">
                  {['Privacy Policy', 'Terms of Service', 'Sitemap'].map((link) => (
                    <a href="#" className="text-decoration-none me-3 text-white-50 hover-white" key={link}>{link}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      {/* CSS Styles */}
      <style jsx>{`
        /* Global Dashboard Styles - Ensure 100% width */
        .dashboard-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: 100vw;
          max-width: 100%;
          background-color: ${currentTheme.BACKGROUND};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          overflow-x: hidden;
          transition: background-color 0.3s ease;
        }

        /* Loading State */
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 300px;
          width: 100%;
          font-size: 1.1rem;
          color: ${currentTheme.TEXT_SECONDARY};
        }

        /* Empty State */
        .empty-state {
          padding: 2rem;
          text-align: center;
          color: ${currentTheme.TEXT_SECONDARY};
          width: 100%;
        }

        /* Header Styles - Full Width */
        .dashboard-header {
          background-color: ${currentTheme.CARD_BACKGROUND};
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          position: fixed;
          top: 0;
          z-index: 1000;
          width: 100%;
          transition: background-color 0.3s ease;
        }

        /* Navigation Menu */
        .navigation-menu {
          display: flex;
          margin-bottom: 2rem;
          border-bottom: 1px solid ${currentTheme.BORDER};
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          color: ${currentTheme.TEXT_SECONDARY};
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .nav-item:hover {
          color: ${currentTheme.PRIMARY_COLOR};
          background-color: ${currentTheme.PRIMARY_LIGHT};
        }

        .nav-item.active {
          color: ${currentTheme.PRIMARY_COLOR};
          border-bottom: 2px solid ${currentTheme.PRIMARY_COLOR};
          font-weight: 500;
        }

        /* Theme Menu */
        .theme-menu {
          position: absolute;
          top: 4rem;
          right: 5rem;
          width: 220px;
          background-color: ${currentTheme.CARD_BACKGROUND};
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid ${currentTheme.BORDER};
          overflow: hidden;
          z-index: 1000;
          transition: all 0.3s ease;
        }
        
        .theme-menu-header {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid ${currentTheme.BORDER};
          color: ${currentTheme.TEXT_PRIMARY};
        }
        
        .theme-option {
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .theme-option:hover {
          background-color: ${currentTheme.PRIMARY_LIGHT};
        }
        
        .theme-option-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .theme-label {
          color: ${currentTheme.TEXT_PRIMARY};
          font-size: 0.9rem;
        }
        
        .theme-icon {
          color: ${currentTheme.PRIMARY_COLOR};
        }


        .settings-button {
          padding: 0.25rem;
          border-radius: 9999px;
          color: ${currentTheme.TEXT_SECONDARY};
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .settings-button:hover {
          background-color: ${currentTheme.PRIMARY_LIGHT};
          color: ${currentTheme.PRIMARY_COLOR};
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
            background-color: ${currentTheme.PRIMARY_LIGHT};
            padding: 4px 8px;
            border-radius: 4px;
            color: ${currentTheme.TEXT_PRIMARY};
          }
          
          .theme-menu {
            right: 1rem;
            width: calc(100% - 2rem);
          }
          
          .property-address {
            color: ${currentTheme.TEXT_TERTIARY};
            font-size: 0.9rem;
            margin-top: 2px;
          }
          
          .property-type {
            font-size: 0.85rem;
            color: ${currentTheme.TEXT_TERTIARY};
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
          color: ${currentTheme.PRIMARY_COLOR};
          margin: 0;
          white-space: nowrap;
        }


        .search-input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid ${currentTheme.BORDER};
          background-color: ${isDarkMode ? '#374151' : '#f3f4f6'};
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          outline: none;
          color: ${currentTheme.TEXT_PRIMARY};
          transition: all 0.3s ease;
        }

        .search-input:focus {
          border-color: ${currentTheme.PRIMARY_COLOR};
          box-shadow: 0 0 0 3px ${currentTheme.PRIMARY_LIGHT};
        }

        .search-input::placeholder {
          color: ${currentTheme.TEXT_TERTIARY};
        }


        .user-greeting {
          color: ${currentTheme.TEXT_SECONDARY};
          display: none;
        }

        @media (min-width: 768px) {
          .user-greeting {
            display: inline;
          }
        }


        .notification-button {
          padding: 0.25rem;
          border-radius: 9999px;
          color: ${currentTheme.TEXT_SECONDARY};
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .notification-button:hover {
          background-color: ${currentTheme.PRIMARY_LIGHT};
          color: ${currentTheme.PRIMARY_COLOR};
        }

        .notification-badge {
          position: absolute;
          top: -0.25rem;
          right: -0.25rem;
          background-color: ${currentTheme.PRIMARY_COLOR};
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
          border: 2px solid ${currentTheme.PRIMARY_LIGHT};
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
  background-color: ${currentTheme.CARD_BACKGROUND};
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.25rem;
  transition: all 0.3s ease;
}


.stat-icon-container {
  height: 3rem;
  width: 3rem;
  border-radius: 0.5rem;
  background-color: ${currentTheme.PRIMARY_LIGHT};
  color: ${currentTheme.PRIMARY_COLOR};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.stat-info {
  flex: 1;
}

.stat-label {
  color: ${currentTheme.TEXT_SECONDARY};
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.stat-value {
  color: ${currentTheme.TEXT_PRIMARY};
  font-size: 1.5rem;
  font-weight: 700;
}


.properties-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: ${currentTheme.TEXT_PRIMARY};
  margin: 0;
}

.add-property-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${currentTheme.PRIMARY_COLOR};
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-property-button:hover {
  opacity: 0.9;
}

.add-property-button:disabled {
  background-color: ${currentTheme.TEXT_TERTIARY};
  cursor: not-allowed;
}


.property-card {
  background-color: ${currentTheme.CARD_BACKGROUND};
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
}

.property-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${isDarkMode ? '#374151' : '#e5e7eb'};
  color: ${currentTheme.TEXT_SECONDARY};
}


.property-location {
  font-size: 1rem;
  font-weight: 600;
  color: ${currentTheme.TEXT_PRIMARY};
  margin-bottom: 0.25rem;
}

.property-address {
  color: ${currentTheme.TEXT_TERTIARY};
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.property-price {
  font-size: 1.125rem;
  font-weight: 700;
  color: ${currentTheme.PRIMARY_COLOR};
  margin-bottom: 0.5rem;
}

.price-period {
  font-size: 0.75rem;
  font-weight: 400;
  color: ${currentTheme.TEXT_SECONDARY};
}


.feature {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: ${currentTheme.TEXT_SECONDARY};
  background-color: ${currentTheme.PRIMARY_LIGHT};
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.property-inquiries {
  font-size: 0.875rem;
  color: ${currentTheme.TEXT_SECONDARY};
  margin-top: 0.5rem;
}

.inquiries-count {
  font-weight: 600;
  color: ${currentTheme.TEXT_PRIMARY};
}

.property-type {
  font-size: 0.75rem;
  color: ${currentTheme.TEXT_TERTIARY};
  font-style: italic;
  margin-top: 0.25rem;
}


.processing-indicator {
  font-size: 0.75rem;
  color: ${currentTheme.TEXT_SECONDARY};
  display: flex;
  align-items: center;
  margin-top: 0.75rem;
}

/* Footer Styles */
        .dashboard-footer {
          background-color: ${currentTheme.CARD_BACKGROUND};
          border-top: 1px solid ${currentTheme.BORDER};
          margin-top: 3rem;
          transition: background-color 0.3s ease;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem 1rem;
        }

        .footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .footer-section {
          display: flex;
          flex-direction: column;
        }

        .footer-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: ${currentTheme.PRIMARY_COLOR};
          margin: 0 0 0.5rem 0;
        }

        .footer-description {
          color: ${currentTheme.TEXT_SECONDARY};
          font-size: 0.875rem;
          line-height: 1.5;
          margin: 0;
        }

        .footer-heading {
          font-size: 1rem;
          font-weight: 600;
          color: ${currentTheme.TEXT_PRIMARY};
          margin: 0 0 1rem 0;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-links li {
          margin-bottom: 0.5rem;
        }

        .footer-link {
          color: ${currentTheme.TEXT_SECONDARY};
          font-size: 0.875rem;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .footer-link:hover {
          color: ${currentTheme.PRIMARY_COLOR};
        }

        .footer-social {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .social-link {
          color: ${currentTheme.TEXT_SECONDARY};
          font-size: 0.875rem;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .social-link:hover {
          color: ${currentTheme.PRIMARY_COLOR};
        }

        .footer-bottom {
          border-top: 1px solid ${currentTheme.BORDER};
          padding-top: 1rem;
          text-align: center;
        }

        .footer-copyright {
          color: ${currentTheme.TEXT_TERTIARY};
          font-size: 0.875rem;
          margin: 0;
        }

        /* Mobile responsive footer */
        @media (max-width: 768px) {
          .footer-content {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }
          
          .footer-container {
            padding: 1.5rem 1rem 1rem;
          }
        }

        @media (max-width: 480px) {
          .footer-content {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          
          .footer-social {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};


export default Dashboard;