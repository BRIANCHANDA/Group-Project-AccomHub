import React, { useState, useEffect } from "react";
import { Bell, PlusCircle, Trash, Home, Bed, Bath, Square, Settings, Moon, Sun, Edit } from "lucide-react";
import PropertyCreationForm from "./PropertyCraeationForm";

import { useLocation, useNavigate } from 'react-router-dom';
import "./landlord.css";
import PropertyEditForm from "./propertyEditForm";

// Theme colors object
const THEME = {
  light: {
    PRIMARY_COLOR: "rgb(29, 78, 216)",
    PRIMARY_LIGHT: "rgba(29, 78, 216, 0.15)",
    PRIMARY_MEDIUM: "rgba(33, 56, 119, 0.5)",
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

// User interface matching the Details page
interface User {
  id: number;
  email: string;
  phoneNumber?: string;
  token?: string;
  userType: 'student' | 'landlord' | 'admin';
  firstName?: string;
  lastName?: string;
}

// User profile interface
interface UserProfile {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
  createdAt?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPropertyEditForm, setShowPropertyEditForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);

  // Add delete confirmation state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  // Get landlordId from location state
  const landlordId = location.state?.landlordId;
  
  // Enhanced user state management like in Details page
  const [landlordName, setLandlordName] = useState("Landlord");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Theme state - default to light
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Current theme colors
  const currentTheme = isDarkMode ? THEME.dark : THEME.light;

  // Enhanced Property interface
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
    imageUrl?: string | null;
    propertyType?: string;
    details?: PropertyDetails;
  }

  const [properties, setProperties] = useState<Property[]>([]);
  interface Notification {
    id: string;
    [key: string]: any;
  }

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User data parsing function from Details page
  const parseUserData = React.useCallback((userData: string): User | null => {
    try {
      const parsedUser = JSON.parse(userData);
      if (!parsedUser?.id || !parsedUser?.email || !parsedUser?.userType) {
        console.warn('LandlordDashboard: Missing required user fields');
        return null;
      }
      if (!['student', 'landlord', 'admin'].includes(parsedUser.userType)) {
        console.warn('LandlordDashboard: Invalid user type');
        return null;
      }
      const id = typeof parsedUser.id === 'string' ? parseInt(parsedUser.id, 10) : parsedUser.id;
      if (isNaN(id)) {
        console.warn('LandlordDashboard: Invalid user ID');
        return null;
      }
      return {
        id,
        email: parsedUser.email,
        phoneNumber: parsedUser.phoneNumber,
        token: parsedUser.token,
        userType: parsedUser.userType,
        firstName: parsedUser.firstName,
        lastName: parsedUser.lastName,
      };
    } catch (parseError) {
      console.error('LandlordDashboard: Failed to parse user data:', parseError);
      return null;
    }
  }, []);

  // Clear user session function from Details page
  const clearUserSession = React.useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('admin_token');
    setIsUserLoggedIn(false);
    setCurrentUser(null);
    setUserProfile(null);
    setLandlordName('Landlord');
  }, []);

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

  // Enhanced user validation similar to Details page
  useEffect(() => {
    const validateUser = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          setIsUserLoggedIn(false);
          setLandlordName('Landlord');
          return;
        }
        
        const parsedUser = parseUserData(userData);
        if (!parsedUser || parsedUser.userType !== 'landlord') {
          clearUserSession();
          return;
        }
        
        setIsUserLoggedIn(true);
        setCurrentUser(parsedUser);

        // Fetch user profile using the same logic as Details page
        try {
          const response = await fetch(`/api/users/users/${parsedUser.id}`, {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          });
          
          if (response.ok) {
            const profileData = await response.json();
            setUserProfile(profileData);
            setLandlordName(profileData.firstName ? 
              `${profileData.firstName} ${profileData.lastName || ''}`.trim() : 
              'Landlord'
            );
          } else {
            console.error('Failed to fetch user profile');
            // Fallback to parsed user data
            setLandlordName(parsedUser.firstName ? 
              `${parsedUser.firstName} ${parsedUser.lastName || ''}`.trim() : 
              'Landlord'
            );
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Fallback to parsed user data
          setLandlordName(parsedUser.firstName ? 
            `${parsedUser.firstName} ${parsedUser.lastName || ''}`.trim() : 
            'Landlord'
          );
        }
      } catch (error) {
        console.error('LandlordDashboard: Unexpected validation error:', error);
        clearUserSession();
      }
    };
    
    validateUser();
  }, [parseUserData, clearUserSession]);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setShowThemeMenu(false);
  };

  // Handle settings icon click
  const handleSettingsClick = () => {
    setShowThemeMenu(!showThemeMenu);
    if (showNotifications) setShowNotifications(false);
  };

  // Navigation function
  const handleNavigation = (path: string) => {
    const paths: { [key: string]: string } = {
      home: '/',
      dashboard: '/landlord-dashboard',
      profile: '/landlord-profile',
      settings: '/landlord-settings',
      logout: '/logout',
    };
    navigate(paths[path] || `/${path}`);
  };

  // Fetch data when component mounts
  useEffect(() => {
    // Use currentUser.id if available, otherwise fall back to landlordId from location state
    const effectiveLandlordId = currentUser?.id || landlordId;
    
    if (!effectiveLandlordId) {
      navigate('/login', { state: { message: "Please login to access your dashboard" } });
      return;
    }

    fetchProperties();
    fetchNotifications();
  }, [currentUser?.id, landlordId, navigate]);

  // Fetch properties from API
  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const effectiveLandlordId = currentUser?.id || landlordId;
      const response = await fetch(`/api/property-images/landlords/${effectiveLandlordId}/properties`);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();

      // Map API response to Property interface
      const mappedProperties = data.properties.map((prop: any) => ({
        id: prop.id.toString(),
        title: prop.title || '',
        description: prop.description || '',
        location: prop.location,
        price: prop.price,
        status: prop.status || 'Available',
        imageUrl: prop.imageUrl,
        propertyType: prop.propertyType,
        details: prop.details
      }));

      setProperties(mappedProperties);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const effectiveLandlordId = currentUser?.id || landlordId;
      const response = await fetch(`/api/landlords/${effectiveLandlordId}/notifications`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Delete functions
  const handleDeleteClick = (property: Property) => {
    setPropertyToDelete(property);
    setShowDeleteConfirmation(true);
  };

  const deleteProperty = async (id: string) => {
    try {
      const response = await fetch(`/api/properties/properties/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete property');
      }

      setProperties(properties.filter((property) => property.id !== id));
      setShowDeleteConfirmation(false);
      setPropertyToDelete(null);
    } catch (error) {
      console.error('Error deleting property:', error);
      setShowDeleteConfirmation(false);
      setPropertyToDelete(null);
    }
  };

  const handleConfirmDelete = () => {
    if (propertyToDelete) {
      deleteProperty(propertyToDelete.id.toString());
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setPropertyToDelete(null);
  };

  const handleAddPropertyClick = () => {
    setShowPropertyForm(true);
    if (showNotifications) setShowNotifications(false);
    if (showThemeMenu) setShowThemeMenu(false);
  };

  const handlePropertyFormClose = () => {
    setShowPropertyForm(false);
  };

  const handlePropertyFormSubmit = async (propertyId: string, propertyData?: any) => {
    setIsSubmitting(true);
    try {
      const tempProperty: Property = {
        id: propertyId || `temp-${Date.now()}`,
        location: propertyData?.address || propertyData?.location || "New Property",
        price: propertyData?.price || `K${propertyData?.monthlyRent}` || "Price not set",
        status: propertyData?.isAvailable ? "Available" : "Not Available",
        imageUrl: propertyData?.imageUrl || null,
        details: propertyData?.details || {}
      };

      setProperties(prevProperties => {
        const existingIndex = prevProperties.findIndex(p => p.id === propertyId);
        if (existingIndex >= 0) {
          const updatedProperties = [...prevProperties];
          updatedProperties[existingIndex] = tempProperty;
          return updatedProperties;
        } else {
          return [...prevProperties, tempProperty];
        }
      });

      setShowPropertyForm(false);

      if (!propertyData) {
        const response = await fetch('/api/properties/properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(propertyData),
        });
      }

      setTimeout(() => {
        fetchProperties();
      }, 1000);
    } catch (error) {
      console.error('Error creating property:', error);
      setProperties(prevProperties =>
        prevProperties.filter(property => property.id !== propertyId)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (propertyId: string, imageFile: File) => {
    try {
      const formData = new FormData();
      formData.append('propertyId', propertyId);
      formData.append('image', imageFile);
      formData.append('isPrimary', 'true');

      const response = await fetch('/api/property-images/property-images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      const uploadedImageUrl = result.imageUrl;

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
    if (showNotifications) setShowNotifications(false);
    if (showThemeMenu) setShowThemeMenu(false);
    if (showPropertyForm) setShowPropertyForm(false);
  };

  const handleEditFormClose = () => {
    setShowPropertyEditForm(false);
    setEditingProperty(null);
  };

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

      setProperties(prevProperties =>
        prevProperties.map(property =>
          property.id === updatedProperty.id
            ? { ...property, ...updatedProperty }
            : property
        )
      );

      setTimeout(() => {
        fetchProperties();
      }, 1000);
    } catch (error) {
      console.error('Error updating property:', error);
    }
  };

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

  return (
    <div className="dashboard-container">
      {/* Enhanced Header */}
      <header className="dashboard-header">
        <div className="header-container">
          <div className="header-content">
            {/* Brand Logo Section */}
            <div className="brand-section">
              <a
                href="#"
                className="brand-link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation('home');
                }}
              >
                <span className="brand-icon">🏠</span>
                <span className="brand-text">PlacesForLeaners</span>
              </a>
              <div className="dashboard-separator">|</div>
              <h1 className="dashboard-title">Landlord Dashboard</h1>
            </div>

            {/* Welcome Section */}
            <div className="welcome-section">
             
            </div>

            {/* Search Container */}
            <div className="search-container">
              <div className="search-wrapper">
                <input
                  type="text"
                  placeholder="Search properties..."
                  className="search-input"
                />
              </div>
            </div>

            {/* User Actions */}
            <div className="user-actions">
              
              

              {/* Settings */}
              <div className="settings-container" onClick={handleSettingsClick}>
                <button className="settings-button">
                  <Settings size={20} />
                </button>
              </div>

              {/* User Profile */}
              <div className="user-profile-section">
                {userProfile?.profileImage ? (
                  <img
                    src={userProfile.profileImage}
                    alt="User Avatar"
                    className="user-avatar"
                    onError={(e) => {
                      e.currentTarget.src = "/api/placeholder/40/40";
                    }}
                  />
                ) : (
                  <div className="user-avatar-placeholder">
                    <span className="avatar-initials">
                      {landlordName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="user-info">
                   <span className="welcome-text">Welcome back, {landlordName}!</span>
                  
                </div>
              </div>
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
            <div className="menu-divider"></div>
            <div className="theme-option" onClick={() => handleNavigation('profile')}>
              
            </div>
            <div className="theme-option" onClick={() => handleNavigation('logout')}>
              <div className="theme-option-content">
                <span className="theme-label">Logout</span>
              </div>
            </div>
          </div>
        )}

      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        ) : (
          <>
            <div className="navigation-menu">
              <div className="nav-item active">
                <Home size={18} />
                <span>Dashboard</span>
              </div>
            </div>

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
                  <div className="empty-state-icon">
                    <Home size={48} />
                  </div>
                  <h3>No Properties Yet</h3>
                  <p>You don't have any properties yet. Add your first property to get started!</p>
                  <button
                    className="empty-state-button"
                    onClick={handleAddPropertyClick}
                  >
                    <PlusCircle size={18} />
                    Add Your First Property
                  </button>
                </div>
              ) : (
                <div className="properties-grid">
                  {properties.map((property) => (
                    <div key={property.id} className="property-card">
                      <div className="property-image-container">
                        {property.imageUrl ? (
                          <img
                            src={property.imageUrl}
                            alt={property.location}
                            className="property-image"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = `/api/placeholder/280/180?text=${encodeURIComponent(property.location)}`;
                            }}
                          />
                        ) : (
                          <div className="property-image-placeholder">
                            <Home size={32} />
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

                        {property.propertyType && (
                          <p className="property-type">{property.propertyType}</p>
                        )}

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

                        {String(property.id).startsWith('temp-') && (
                          <div className="processing-indicator">
                            <div className="processing-spinner"></div>
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
              <p>Are you sure you want to delete the property:</p>
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

      {/* Property Edit Form */}
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

      {/* Property Creation Form */}
      {showPropertyForm && (
        <PropertyCreationForm
          isOpen={showPropertyForm}
          onClose={handlePropertyFormClose}
          onSubmit={handlePropertyFormSubmit}
          onImageUpload={handleImageUpload}
          landlordId={currentUser?.id || landlordId}
          isDarkMode={isDarkMode}
          themeColors={currentTheme}
        />
      )}

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="footer-logo">🏠 PlacesForLeaners</span>
              <p className="footer-description">Your trusted partner for student housing management.</p>
            </div>
            <div className="footer-links">
              <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); handleNavigation('home'); }}>
                Home
              </a>
              <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); handleNavigation('profile'); }}>
                Profile
              </a>
              <a href="#" className="footer-link">
                Support
              </a>
              <a href="#" className="footer-link">
                Privacy
              </a>
            </div>
            <div className="footer-copyright">
              © {new Date().getFullYear()} PlacesForLeaners. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;