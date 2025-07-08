import React, { useState, useEffect } from 'react';
import { EyeOff } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  Home, Users, MessageSquare, Star, Heart, Bell, Settings,
  Search, Filter, Plus, Edit, Trash2, Eye, MapPin, Calendar,
  TrendingUp, TrendingDown, DollarSign, Building, UserCheck,
  Mail, Phone, Clock, CheckCircle, XCircle, AlertCircle, UserPlus, Lock,
  User
} from 'lucide-react';
import './admin.css'
// Property interface
interface Property {
  id: string | number;
  title?: string;
  description?: string;
  location: string;
  price: string;
  status: string;
  inquiries: number;
  imageUrl?: string | null;
  propertyType?: string;
  landlordName: string;
  landlordEmail: string;
}

// User interface
interface UserData {
  userId: string | number;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  phoneNumber: string | null;
  createdAt: string;
  approved?: boolean;
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Authentication state
  // Authentication state
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // State declarations
  const [properties, setProperties] = useState<Property[]>([]);
  const [userData, setUserData] = useState<UserData[]>([]);

  // Mock data based on schema
  const dashboardStats = {
    totalProperties: 247,
    totalUsers: 1834,
    totalInquiries: 432,
    averageRating: 4.2,
    monthlyRevenue: 125000,
    occupancyRate: 87
  };

  const [propertyStats, setPropertyStats] = useState({
    total: 0,
    available: 0,
    unavailable: 0,
    byType: {}
  });

  const [userStats, setUserStats] = useState({
    total: 0,
    student: 0,
    landlord: 0,
    admin: 0
  });

  const [userTypeData, setUserTypeData] = useState([
    { name: 'Students', value: 0, color: '#3b82f6' },
    { name: 'Landlords', value: 0, color: '#10b981' },
    { name: 'Admins', value: 0, color: '#f59e0b' }
  ]);

  const [propertyTypeData, setPropertyTypeData] = useState([
    { type: 'Apartments', count: 0, percentage: 0 },
    { type: 'Houses', count: 0, percentage: 0 },
    { type: 'Shared Rooms', count: 0, percentage: 0 },
    { type: 'Single Rooms', count: 0, percentage: 0 }
  ]);

  const notificationsData = [
    { id: 1, message: 'New user registered: Chanda bRIAN', type: 'info', date: '2025-05-28 10:00' },
    { id: 2, message: 'Property added: Team Kuno Boarding house', type: 'success', date: '2025-05-27 15:30' }
  ];

  const topProperties = [
    { id: 1, name: 'Sunset Apartments', rating: 4.8, revenue: 15000, image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=200&fit=crop' },
    { id: 2, name: 'Campus View House', rating: 4.6, revenue: 12500, image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=300&h=200&fit=crop' },
    { id: 3, name: 'Student Plaza', rating: 4.5, revenue: 11000, image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300&h=200&fit=crop' }
  ];


  // Authentication check - this should be the first useEffect
  // Authentication and authorization check - this should be the first useEffect
  useEffect(() => {
    const checkAuthenticationAndRole = async () => {
      try {
        // Check if userId exists in location state

        const adminId = location.state?.adminId

        if (!adminId) {
          console.log('No userId found in location state, redirecting to login...');
          navigate('/adminLogin', { replace: true });
          return;
        }

        // Fetch user details to verify admin role
        try {
          const response = await fetch(`/api/users/users/${adminId}`);

          if (!response.ok) {
            throw new Error('Failed to fetch user details');
          }

          const userData = await response.json();
          const userType = userData.userType || userData.user?.userType;

          // Check if user is admin
          if (userType !== 'admin') {
            console.log('User is not an admin, access denied');
            navigate('/unauthorized', {
              replace: true,
              state: { message: 'Admin access required' }
            });
            return;
          }

          // If user is admin, set authenticated
          setUserRole(userType);
          setIsAuthenticated(true);
          console.log('Admin user authenticated:', adminId);

        } catch (apiError) {
          console.error('Error verifying user role:', apiError);
          navigate('/adminLogin', {
            replace: true,
            state: { error: 'Unable to verify user credentials' }
          });
        }

      } catch (error) {
        console.error('Authentication check error:', error);
        navigate('/login', { replace: true });
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuthenticationAndRole();
  }, [location.state, navigate]);

  // Utility functions
  const showToast = (message: string, type: string = 'success') => {
    console.log(`${type.toUpperCase()}: ${message}`);
    // You can implement a proper toast notification here
  };

  const refreshProperties = async () => {
    // Re-fetch properties
    fetchProperties();
  };

  // Fetch Properties
  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/properties/properties/properties');

      if (!response.ok) {
        throw new Error(`Failed to fetch properties: ${response.status}`);
      }

      const data = await response.json();

      const mappedProperties = data.map((prop: any) => ({
        id: prop.propertyId.toString(),
        title: prop.title || 'No Title',
        description: prop.description || '',
        location: prop.address,
        price: `K${prop.monthlyRent} / month`,
        status: prop.isAvailable ? 'Available' : 'Occupied',
        inquiries: 0,
        imageUrl: prop.imageUrl || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=200&fit=crop',
        propertyType: prop.propertyType,
        landlordName: prop.landlordName || 'Unknown',
        landlordEmail: prop.landlordEmail || ''
      }));

      setProperties(mappedProperties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Failed to fetch properties');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Users
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/users');
      if (!response.ok) {
        throw new Error(`Failed to fetch userData: ${response.status}`);
      }

      const data = await response.json();
      const users = data.users || [];

      const mappedUserData: UserData[] = users.map((user: any) => ({
        userId: user.userId.toString(),
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        userType: user.userType || '',
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt || '',
        approved: user.approved
      }));

      setUserData(mappedUserData);


      // Find the current admin user using adminId from location state
      const adminId = location.state?.adminId;
      if (adminId && mappedUserData.length > 0) {
        const currentAdmin = mappedUserData.find(user => user.userId === adminId.toString());
        if (currentAdmin) {
          setName(`${currentAdmin.firstName} ${currentAdmin.lastName}`);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };




  const resetSettings = () => {
    // Reset to default values
    setHasChanges(false);
    showToast('Settings reset to default');
  };
  // Fetch Property Stats
  const fetchPropertyStats = async () => {
    try {
      const response = await fetch('/api/properties/properties/count');
      if (!response.ok) {
        throw new Error('Failed to fetch property stats');
      }
      const data = await response.json();
      setPropertyStats(data);
    } catch (err) {
      console.error('Error fetching property stats:', err);
    }
  };

  // Fetch User Stats
  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/users');

      if (!response.ok) {
        throw new Error(`Failed to fetch user stats: ${response.statusText}`);
      }

      const data = await response.json();
      const counts = data.counts || {
        total: 0,
        student: 0,
        landlord: 0,
        admin: 0
      };

      setUserStats(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching user stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch User Type Stats
  const fetchUserTypeStats = async () => {
    try {
      const response = await fetch('/api/auth/user-type-stats');
      if (!response.ok) throw new Error('Failed to fetch user type stats');
      const data = await response.json();
      setUserTypeData(data);
    } catch (err) {
      console.error('Error fetching user type stats:', err);
    }
  };

  // Fetch Property Type Stats
  const fetchPropertyTypeStats = async () => {
    try {
      const response = await fetch('/api/properties/properties/type-stats');
      if (!response.ok) throw new Error('Failed to fetch property type stats');
      const data = await response.json();
      setPropertyTypeData(data);
    } catch (err) {
      console.error('Error fetching property type stats:', err);
    }
  };

  // Handle Unpublish
  const handleUnpublish = async (propertyId: any) => {
    try {
      const response = await fetch(`   /api/PropertyListingRoute/propertyListing/${propertyId}/unpublish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to unpublish property');
      }

      refreshProperties();
      closeModal();
      showToast('Listing unpublished successfully');

    } catch (error) {
      showToast('Error unpublishing listing', 'error');
      console.error('Unpublish error:', error);
    }
  };


  // Handle Republish
  const handleRepublish = async (propertyId: any) => {
    try {
      const response = await fetch(`/api/PropertyListingRoute/propertyListing/${propertyId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to republish property');
      }

      refreshProperties();
      closeModal();
      showToast('Listing republished successfully');

    } catch (error) {
      showToast('Error republishing listing', 'error');
      console.error('Republish error:', error);
    }
  };



  // useEffect hooks
  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    fetchPropertyStats();
  }, []);

  useEffect(() => {
    fetchUserStats();
  }, []);

  useEffect(() => {
    fetchUserTypeStats();
  }, []);

  useEffect(() => {
    fetchPropertyTypeStats();
  }, []);

  // Sidebar Component
  const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    return (
      <aside className={`sidebar-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <span className="logo-icon">
              <Home size={20} />
            </span>
            <div className="logo-text">
              <h1 className="sidebar-title" style={{ color: 'black' }}>NexNest</h1>
              <p className="sidebar-subtitle">Admin Dashboard</p>
            </div>
          </div>
          <button
            className="toggle-btn"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isCollapsed ? 'M4 6h16M4 12h16M4 18h16' : 'M6 18L18-6M6 6l12 12'}
              />
            </svg>
          </button>
        </div>
        <nav className="sidebar-nav">
          {[
            { id: 'overview', name: 'Overview', icon: Home },
            { id: 'properties', name: 'Properties', icon: Building },
            { id: 'users', name: 'Users', icon: Users },
            { id: 'notifications', name: 'Notifications', icon: Bell },
            { id: 'settings', name: 'Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`sidebar-btn ${activeTab === item.id ? 'active' : ''}`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="sidebar-icon" />
                <span className="sidebar-text">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    );
  };

  // Stats Card Component
  const StatsCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="stats-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="stats-title">{title}</p>
          <p className="stats-value">{value}</p>
        </div>
        <div className={`icon-container ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  // Overview Tab Component
  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="stats-grid">
        <StatsCard
          title="Total Properties"
          value={propertyStats.total.toLocaleString()}
          icon={Building}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <StatsCard
          title="Total Users"
          value={userStats.total.toLocaleString()}
          icon={Users}
          color="bg-gradient-to-r from-green-500 to-green-600"
        />
        <StatsCard
          title="Average Rating"
          value={dashboardStats.averageRating.toFixed(1)}
          icon={Star}
          color="bg-gradient-to-r from-yellow-500 to-yellow-600"
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">User Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userTypeData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {userTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="activity-grid">
        <div className="activity-card">
          <h3 className="card-title">Property Types</h3>
          <div className="space-y-4">
            {propertyTypeData.map((item, index) => (
              <div key={index} className="property-type-item">
                <div className="flex justify-between">
                  <span className="font-medium">{item.type}</span>
                  <span>{item.count} ({item.percentage}%)</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="activity-card">
          <h3 className="card-title">Top Properties</h3>
          <div className="space-y-4">
            {topProperties.map((property) => (
              <div key={property.id} className="property-item">
                <img
                  src={property.image}
                  alt={property.name}
                  className="property-image"
                />
                <div className="property-details">
                  <p className="property-name">{property.name}</p>
                  <div className="property-stats">
                    <span className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      {property.rating}
                    </span>
                    <span>{property.inquiries} inquiries</span>
                  </div>
                </div>
                <div className="property-revenue">
                  <p className="revenue-amount">K{property.revenue.toLocaleString()}</p>
                  <p className="revenue-label">monthly</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Properties Tab Component
  const PropertiesTab = () => (
    <div className="space-y-6">
      <div className="header-section">
        <h2 className="section-title">Properties Management</h2>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-filter">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search properties..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="filter-button">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading properties...</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Rent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties
                  .filter(property =>
                    property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    property.location.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((property) => (
                    <tr key={property.id}>
                      <td>
                        <div className="flex items-center">
                          <img className="table-image" src={property.imageUrl || ''} alt="" />
                          <div className="ml-4">
                            <div className="table-title">{property.title}</div>
                            <div className="table-subtitle">ID: {property.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="type-badge">{property.propertyType}</span>
                      </td>
                      <td>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          {property.location}
                        </div>
                      </td>
                      <td className="font-medium">
                        {property.price}
                     </td>
                    <td>
                      <div className="actions-cell">
                        <div className="action-row">
                          <button
                            className="action-btn view"
                            onClick={() => openModal('viewProperty', property)}
                            title="View Details"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>
                        </div>
                        <div className="action-row">
                          {property.status === 'Available' ? (
                            <button
                              className="action-btn unpublish"
                              onClick={() => openModal('unpublishProperty', property)}
                              title="Unpublish Property"
                            >
                              <EyeOff size={14} />
                              <span>Unpublish</span>
                            </button>
                          ) : (
                            <button
                              className="action-btn republish"
                              onClick={() => openModal('republishProperty', property)}
                              title="Republish Property"
                            >
                              <Eye size={14} />
                              <span>Republish</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // Users Tab Component
  const UsersTab = () => (
    <div className="space-y-6">
      <div className="header-section">
        <h2 className="section-title">Users Management</h2>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-filter">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="filter-button">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>User Type</th>
                  <th>Join Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {userData
                  .filter(user =>
                    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((user) => (
                    <tr key={user.userId}>
                      <td className="user-id">#{user.userId}</td>
                      <td className="table-title">
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </div>
                          <div className="user-details">
                            <span className="user-name">
                              {user.firstName} {user.lastName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="user-email">
                        <Mail className="h-4 w-4 inline-icon" />
                        {user.email}
                      </td>
                      <td className="user-phone">
                        {user.phoneNumber ? (
                          <>
                            <Phone className="h-4 w-4 inline-icon" />
                            {user.phoneNumber}
                          </>
                        ) : (
                          <span className="text-gray-400">No phone</span>
                        )}
                      </td>
                      <td>
                        <span className={`role-badge ${user.userType.toLowerCase().replace(' ', '-')}`}>
                          {user.userType === 'admin' && <Lock className="h-3 w-3" />}
                          {user.userType === 'landlord' && <Building className="h-3 w-3" />}
                          {user.userType === 'student' && <UserCheck className="h-3 w-3" />}
                          {user.userType === 'tenant' && <UserCheck className="h-3 w-3" />}
                          <span>{user.userType}</span>
                        </span>
                      </td>
                      <td className="join-date">
                        <Calendar className="h-4 w-4 inline-icon" />
                        {user.createdAt && user.createdAt !== "string"
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"
                        }
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-icon view"
                            onClick={() => openModal('viewUser', user)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {userData.length === 0 && !loading && (
              <div className="empty-state">
                <Users className="h-12 w-12" />
                <h3>No Users Found</h3>
                <p>There are no users to display at the moment.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Notifications Tab Component
  const NotificationsTab = () => (
    <div className="space-y-6">
      <div className="header-section">
        <h2 className="section-title">Notifications</h2>
        <button className="action-button secondary">
          <span>Clear All</span>
        </button>
      </div>

      <div className="card">
        <div className="space-y-4">
          {notificationsData.map((notification) => (
            <div key={notification.id} className="notification-item">
              <div className={`notification-icon ${notification.type}`}>
                {notification.type === 'info' && <AlertCircle className="h-5 w-5" />}
                {notification.type === 'success' && <CheckCircle className="h-5 w-5" />}
              </div>
              <div className="notification-content">
                <p className="notification-message">{notification.message}</p>
                <p className="notification-date">{notification.date}</p>
              </div>
              <button className="action-icon delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  // Settings Tab Component
  const SettingsTab = () => {
    const [settings, setSettings] = useState({
      // System Settings
      siteName: 'NexNest',
      siteDescription: 'Student Accommodation Platform',
      maintenanceMode: false,
      allowRegistrations: true,
      requireEmailVerification: true,

      // Property Settings
      maxPropertiesPerLandlord: 10,
      autoApproveProperties: false,
      propertyImageLimit: 5,
      featuredPropertyDuration: 30, // days

      // User Settings
      autoApproveUsers: false,
      maxInquiriesPerDay: 5,
      sessionTimeout: 60, // minutes

      // Notification Settings
      emailNotifications: true,
      smsNotifications: false,
      webhookNotifications: false,
      notificationFrequency: 'immediate', // immediate, daily, weekly

      // Security Settings
      passwordMinLength: 8,
      requireStrongPassword: true,
      maxLoginAttempts: 5,
      accountLockoutDuration: 30, // minutes
    });

    const [activeSettingsTab, setActiveSettingsTab] = useState('system');
    const [hasChanges, setHasChanges] = useState(false);

    const handleSettingChange = (key: string, value: any) => {
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
      setHasChanges(true);
    };

    const saveSettings = async () => {
      try {
        // Simulate API call
        console.log('Saving settings:', settings);
        // const response = await fetch('/api/admin/settings', {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(settings)
        // });

        showToast('Settings saved successfully');
        setHasChanges(false);
      } catch (error) {
        showToast('Failed to save settings', 'error');
      }
    };
    return (
      <div className="space-y-6">
        <div className="header-section">
          <h2 className="section-title">System Settings</h2>
          {hasChanges && (
            <div className="settings-alert">
              <AlertCircle className="h-4 w-4" />
              <span>You have unsaved changes</span>
            </div>
          )}
        </div>

        {/* Settings Navigation */}
        <div className="settings-nav">
          {[
            { id: 'system', name: 'System', icon: Settings },
            { id: 'properties', name: 'Properties', icon: Building },
            { id: 'users', name: 'Users', icon: Users },
            { id: 'notifications', name: 'Notifications', icon: Bell },
            { id: 'security', name: 'Security', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={`settings-tab-btn ${activeSettingsTab === tab.id ? 'active' : ''}`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* System Settings */}
        {activeSettingsTab === 'system' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">System Configuration</h3>
            </div>
            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">Site Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.siteName}
                  onChange={(e) => handleSettingChange('siteName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Site Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={settings.siteDescription}
                  onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                />
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                  />
                  <span>Maintenance Mode</span>
                </label>
                <p className="form-help">Temporarily disable public access to the site</p>
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.allowRegistrations}
                    onChange={(e) => handleSettingChange('allowRegistrations', e.target.checked)}
                  />
                  <span>Allow New Registrations</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Property Settings */}
        {activeSettingsTab === 'properties' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Property Management</h3>
            </div>
            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">Max Properties per Landlord</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="50"
                  value={settings.maxPropertiesPerLandlord}
                  onChange={(e) => handleSettingChange('maxPropertiesPerLandlord', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Property Image Limit</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="20"
                  value={settings.propertyImageLimit}
                  onChange={(e) => handleSettingChange('propertyImageLimit', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Featured Property Duration (Days)</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="90"
                  value={settings.featuredPropertyDuration}
                  onChange={(e) => handleSettingChange('featuredPropertyDuration', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.autoApproveProperties}
                    onChange={(e) => handleSettingChange('autoApproveProperties', e.target.checked)}
                  />
                  <span>Auto-approve Property Listings</span>
                </label>
                <p className="form-help">Automatically approve new property listings without manual review</p>
              </div>
            </div>
          </div>
        )}

        {/* User Settings */}
        {activeSettingsTab === 'users' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">User Management</h3>
            </div>
            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">Max Inquiries per Day</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="50"
                  value={settings.maxInquiriesPerDay}
                  onChange={(e) => handleSettingChange('maxInquiriesPerDay', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Session Timeout (Minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  min="15"
                  max="480"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.autoApproveUsers}
                    onChange={(e) => handleSettingChange('autoApproveUsers', e.target.checked)}
                  />
                  <span>Auto-approve User Accounts</span>
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.requireEmailVerification}
                    onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
                  />
                  <span>Require Email Verification</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeSettingsTab === 'notifications' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Notification Preferences</h3>
            </div>
            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">Notification Frequency</label>
                <select
                  className="form-input"
                  value={settings.notificationFrequency}
                  onChange={(e) => handleSettingChange('notificationFrequency', e.target.value)}
                >
                  <option value="immediate">Immediate</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly Summary</option>
                </select>
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  />
                  <span>Email Notifications</span>
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                  />
                  <span>SMS Notifications</span>
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.webhookNotifications}
                    onChange={(e) => handleSettingChange('webhookNotifications', e.target.checked)}
                  />
                  <span>Webhook Notifications</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeSettingsTab === 'security' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Security Configuration</h3>
            </div>
            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">Password Minimum Length</label>
                <input
                  type="number"
                  className="form-input"
                  min="6"
                  max="32"
                  value={settings.passwordMinLength}
                  onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Max Login Attempts</label>
                <input
                  type="number"
                  className="form-input"
                  min="3"
                  max="10"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Account Lockout Duration (Minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  min="5"
                  max="1440"
                  value={settings.accountLockoutDuration}
                  onChange={(e) => handleSettingChange('accountLockoutDuration', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.requireStrongPassword}
                    onChange={(e) => handleSettingChange('requireStrongPassword', e.target.checked)}
                  />
                  <span>Require Strong Passwords</span>
                </label>
                <p className="form-help">Must contain uppercase, lowercase, numbers, and special characters</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="settings-actions">
          <button
            className="action-button primary"
            onClick={saveSettings}
            disabled={!hasChanges}
          >
            <CheckCircle className="h-4 w-4" />
            Save Changes
          </button>
          <button
            className="action-button secondary"
            onClick={resetSettings}
          >
            Reset to Default
          </button>
        </div>
      </div>
    );
  };
  // Modal functions
  const openModal = (type: string, item: any = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedItem(null);
  };

  // Modal Component
  const Modal = () => {
    if (!showModal) return null;

    const renderModalContent = () => {
      switch (modalType) {
        case 'viewProperty':
          return (
            <>
              <h5 className="modal-title">Property Details</h5>
              <div className="modal-body">
                <p><strong>Name:</strong> {selectedItem?.title || 'Unnamed Property'}</p>
                <p><strong>Location:</strong> {selectedItem?.location || 'Unknown'}</p>
                <p><strong>Price:</strong> {selectedItem?.price || 'N/A'}</p>
                <p><strong>Status:</strong> {selectedItem?.status || 'Unknown'}</p>
                <p><strong>Type:</strong> {selectedItem?.propertyType || 'N/A'}</p>
                <p><strong>Landlord:</strong> {selectedItem?.landlordName}</p>
                <p><strong>Landlord Email:</strong> {selectedItem?.landlordEmail}</p>
              </div>
              <div className="modal-footer">
                <button className="action-button secondary" onClick={closeModal}>Close</button>
              </div>
            </>
          );

        case 'unpublishProperty':
          return (
            <>
              <h5 className="modal-title">Unpublish Listing</h5>
              <div className="modal-body">
                <p>Are you sure you want to unpublish <strong>"{selectedItem?.title}"</strong>?</p>
                <p>The listing will be hidden from students but can be republished later.</p>
              </div>
              <div className="modal-footer">
                <button className="action-button secondary" onClick={closeModal}>Cancel</button>
                <button
                  className="action-button danger"
                  onClick={() => handleUnpublish(selectedItem?.id)}
                >
                  Confirm Unpublish
                </button>
              </div>
            </>
          );

        case 'republishProperty':
          return (
            <>
              <h5 className="modal-title">Republish Listing</h5>
              <div className="modal-body">
                <p>Are you sure you want to republish <strong>"{selectedItem?.title}"</strong>?</p>
                <p>The listing will be visible to students again and they can make inquiries.</p>
              </div>
              <div className="modal-footer">
                <button className="action-button secondary" onClick={closeModal}>Cancel</button>
                <button
                  className="action-button primary"
                  onClick={() => handleRepublish(selectedItem?.id)}
                >
                  Confirm Republish
                </button>
              </div>
            </>
          );
        case 'viewUser':
          return (
            <>
              <h5 className="modal-title">User Details</h5>
              <div className="modal-body">
                <p><strong>Name:</strong> {selectedItem?.firstName} {selectedItem?.lastName}</p>
                <p><strong>Email:</strong> {selectedItem?.email}</p>
                <p><strong>Role:</strong> {selectedItem?.userType}</p>
                <p><strong>Phone:</strong> {selectedItem?.phoneNumber || 'Not provided'}</p>
                <p><strong>Account Creation Date:</strong> {
                  selectedItem?.createdAt && selectedItem.createdAt !== "string"
                    ? new Date(selectedItem.createdAt).toLocaleDateString()
                    : "N/A"
                }</p>
              </div>
              <div className="modal-footer">
                <button className="action-button secondary" onClick={closeModal}>Close</button>
              </div>
            </>
          );

        default:
          return null;
      }
    };

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          {renderModalContent()}
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (!isAuthenticated || userRole !== 'admin') {
    return (
      <div className="auth-error">
        <div className="error-container">
          <div className="error-icon">🚫</div>
          <h2>Access Denied</h2>
          <p>Admin privileges required to access this page.</p>
          <button
            className="action-button primary"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }


  // Main render (your existing return statement)
  return (
    <div className="dashboard">
      <Sidebar />
      <main className="main-content">
        <header className="main-header">
          <div className="header-left">
            <h1 className="page-title">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'properties' && 'Properties'}
              {activeTab === 'users' && 'Users'}
              {activeTab === 'notifications' && 'Notifications'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="user-avatar">
                <User className="h-5 w-5" />
              </div>
              <span className="user-name">{name || 'Admin User'}</span>
            </div>
          </div>
        </header>

        <div className="main-body">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'properties' && <PropertiesTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>

      </main>

      <Modal />

     
    </div>
  );
};

export default Dashboard;