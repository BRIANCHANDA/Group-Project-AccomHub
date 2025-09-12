import React, { useState, useEffect } from "react";
import { Bell, PlusCircle, Trash, Home, Users, Bed, Bath, Square, Settings, Moon, Sun, MessageSquare, Edit } from "lucide-react";
import PropertyCreationForm from "./PropertyCraeationForm";
import NotificationPanel from "./NotificationPannel";
import { useLocation, useNavigate, Link } from 'react-router-dom';
import "./landlord.css";
import PropertyEditForm from "./propertyEditForm";


const Dashboard = () => {
  // Theme colors object (keep for components that need it)
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
  const [showPropertyEditForm, setShowPropertyEditForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);

  // Add delete confirmation state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

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
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (dashboardContainer) {
      if (isDarkMode) {
        dashboardContainer.classList.add('dark-mode');
      } else {
        dashboardContainer.classList.remove('dark-mode');
      }
    }

    // Save theme preference to localStorage
    localStorage.setItem('landlordDashboardTheme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

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

  // Modified delete function - now shows confirmation dialog
  const handleDeleteClick = (property: Property) => {
    setPropertyToDelete(property);
    setShowDeleteConfirmation(true);
  };

  // Actual delete function
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
      
      // Close confirmation dialog and reset state
      setShowDeleteConfirmation(false);
      setPropertyToDelete(null);
    } catch (error) {
      console.error('Error deleting property:', error);
      // You could show an error message to the user
      setShowDeleteConfirmation(false);
      setPropertyToDelete(null);
    }
  };

  // Handle confirmation dialog actions
  const handleConfirmDelete = () => {
    if (propertyToDelete) {
      deleteProperty(propertyToDelete.id.toString());
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setPropertyToDelete(null);
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

  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setShowPropertyEditForm(true);
    // Close other panels if open
    if (showNotifications) setShowNotifications(false);
    if (showThemeMenu) setShowThemeMenu(false);
    if (showPropertyForm) setShowPropertyForm(false);
  };

  const handleEditFormClose = () => {
    setShowPropertyEditForm(false);
    setEditingProperty(null);
  };

  // Handle property update
  const handlePropertyUpdate = async (updatedProperty: { id: string | number; }) => {
    try {
      const response = await fetch(`/api/properties/properties/${updatedProperty.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProperty),
      });

      if (!response.ok) {
        throw new Error('Failed to update property');
      }

      // Update the property in the local state
      setProperties(prevProperties =>
        prevProperties.map(property =>
          property.id === updatedProperty.id
            ? { ...property, ...updatedProperty }
            : property
        )
      );

      // Refresh properties to get the latest data from server
      setTimeout(() => {
        fetchProperties();
      }, 1000);

    } catch (error) {
      console.error('Error updating property:', error);
      // You could show an error message to the user
    }
  };

  // Handle image deletion for edit form
  const handleEditImageDelete = async (propertyId: any, imageId: any) => {
    try {
      const response = await fetch(`/api/property-images/property-images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
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
                          <div className="property-actions">
                            <button
                              className="edit-property-button"
                              onClick={() => handleEditProperty(property)}
                              title="Edit Property"
                            >
                              <Edit size={16} className="button-icon" />
                              Edit
                            </button>
                            <button
                              className="delete-property-button"
                              onClick={() => handleDeleteClick(property)}
                              title="Delete Property"
                            >
                              <Trash size={16} className="button-icon" />
                              Delete
                            </button>
                          </div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && propertyToDelete && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete the property:
              </p>
              <p className="property-to-delete">
                <strong>{propertyToDelete.title || propertyToDelete.location}</strong>
              </p>
              <p className="warning-text">
                This action cannot be undone. All associated data will be permanently removed.
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-button"
                onClick={handleConfirmDelete}
              >
                <Trash size={16} className="button-icon" />
                Delete Property
              </button>
            </div>
          </div>
        </div>
      )}

      {showPropertyEditForm && editingProperty && (
        <PropertyEditForm
          property={editingProperty}
          isOpen={showPropertyEditForm}
          onClose={handleEditFormClose}
          onSave={handlePropertyUpdate}
          onImageUpload={handleImageUpload}
          onImageDelete={handleEditImageDelete}
          isDarkMode={isDarkMode}
          themeColors={currentTheme}
        />
      )}

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
    </div>
  );
};

export default Dashboard;