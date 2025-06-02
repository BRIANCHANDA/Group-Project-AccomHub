import React, { useState, useEffect } from 'react';
import { EyeOff } from 'lucide-react';
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
import './admin.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [name, setName] = useState('');

  // Mock data based on schema
  const dashboardStats = {
    totalProperties: 247,
    totalUsers: 1834,
    totalInquiries: 432,
    averageRating: 4.2,
    monthlyRevenue: 125000,
    occupancyRate: 87
  };

  // Corrected Property interface
  interface Property {
    id: string | number;
    title?: string;
    description?: string;
    location: string;
    price: string; // Keep as string to match display format
    status: string; // Changed to required since we always set it
    inquiries: number; // Changed to required
    imageUrl?: string | null;
    propertyType?: string;
    landlordName: string; // Added based on your requirements
    landlordEmail: string; // Added based on your requirements
  }

  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Interface definition - matches your API response
  interface UserData {
    userId: string | number;
    firstName: string;
    lastName: string;
    email: string;
    userType: string;
    phoneNumber: string | null;
    createdAt: string; // API returns string, not Date
    approved?: boolean;
  }

  const [userData, setUserData] = useState<UserData[]>([]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Fixed endpoint URL
        const response = await fetch('/api/properties/properties/properties');

        if (!response.ok) {
          throw new Error(`Failed to fetch properties: ${response.status}`);
        }

        const data = await response.json();

        // Map the API response to Property interface
        const mappedProperties = data.map((prop: any) => ({
          id: prop.propertyId.toString(),
          title: prop.title || 'No Title',
          description: prop.description || '',
          location: prop.address,
          price: `K${prop.monthlyRent} / month`, // Formatted price string
          status: prop.isAvailable ? 'Available' : 'Occupied',
          inquiries: 0, // Default value
          imageUrl: null, // Placeholder
          propertyType: prop.propertyType,
          landlordName: prop.landlordName || 'Unknown',
          landlordEmail: prop.landlordEmail || ''
        }));

        setProperties(mappedProperties);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  useEffect(() => {
    // Fetch function
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/users/users');
        if (!response.ok) {
          throw new Error(`Failed to fetch userData: ${response.status}`);
        }

        const data = await response.json();

        // Extract users array from the response
        const users = data.users || [];

        // Map API response to match our interface
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

        // Set name if needed (using first user as example)
        if (mappedUserData.length > 0) {
          const firstUser = mappedUserData[0];
          setName(`${firstUser.firstName} ${firstUser.lastName}`);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const [propertyStats, setPropertyStats] = useState({
    total: 0,
    available: 0,
    unavailable: 0,
    byType: {}
  });

  useEffect(() => {
    // Fetch property stats
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
    fetchPropertyStats();
  }, []);

  const [userStats, setUserStats] = useState({
    total: 0,
    student: 0,
    landlord: 0,
    admin: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users/users');

        if (!response.ok) {
          throw new Error(`Failed to fetch user stats: ${response.statusText}`);
        }

        const data = await response.json();

        // Extract counts from the API response
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

    fetchUserStats();
  }, []);



  const [userTypeData, setUserTypeData] = useState([
    { name: 'Students', value: 0, color: '#3b82f6' },
    { name: 'Landlords', value: 0, color: '#10b981' },
    { name: 'Admins', value: 0, color: '#f59e0b' }
  ]);

  useEffect(() => {
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

    fetchUserTypeStats();
  }, []);


  const handleUnpublish = async (propertyId: any) => {
    try {
      const response = await fetch(`/api/propertyListing/${propertyId}/unpublish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to unpublish property');
      }

      // Refresh properties or update state
      refreshProperties();
      closeModal();
      showToast('Listing unpublished successfully');

    } catch (error) {
      showToast('Error unpublishing listing', 'error');
      console.error('Unpublish error:', error);
    }
  };






  const [propertyTypeData, setPropertyTypeData] = useState([
    { type: 'Apartments', count: 0, percentage: 0 },
    { type: 'Houses', count: 0, percentage: 0 },
    { type: 'Shared Rooms', count: 0, percentage: 0 },
    { type: 'Single Rooms', count: 0, percentage: 0 }
  ]);

  useEffect(() => {
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

    fetchPropertyTypeStats();
  }, []);

  const inquiryStats = {
    total: 432,
    pending: 120,
    responded: 250,
    closed: 62
  };



  const reviewsData = [
    { id: 1, property: 'Sunset Apartments', user: 'John Doe', rating: 4.8, comment: 'Great location!', date: '2025-05-20' },
    { id: 2, property: 'Campus View', user: 'Jane Smith', rating: 4.5, comment: 'Very clean.', date: '2025-05-19' }
  ];

  const notificationsData = [
    { id: 1, message: 'New user registered: John Doe', type: 'info', date: '2025-05-28 10:00' },
    { id: 2, message: 'Property added: Sunset Apartments', type: 'success', date: '2025-05-27 15:30' }
  ];

  const topProperties = [
    { id: 1, name: 'Sunset Apartments', rating: 4.8, inquiries: 45, revenue: 15000, image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=200&fit=crop' },
    { id: 2, name: 'Campus View House', rating: 4.6, inquiries: 38, revenue: 12500, image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=300&h=200&fit=crop' },
    { id: 3, name: 'Student Plaza', rating: 4.5, inquiries: 32, revenue: 11000, image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300&h=200&fit=crop' }
  ];

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
              <h1 className="sidebar-title">NexNest</h1>
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
            { id: 'inquiries', name: 'Inquiries', icon: MessageSquare },
            { id: 'reviews', name: 'Reviews', icon: Star },
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

  const StatsCard = ({ title, value, icon: Icon, color }) => (
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
          title="Total Inquiries"
          value={dashboardStats.totalInquiries.toLocaleString()}

          icon={MessageSquare}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
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
                  <br />
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
                  <p className="revenue-amount">{property.revenue.toLocaleString()}</p>
                  <p className="revenue-label">monthly</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

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
              {properties.map((property) => (
                <tr key={property.id}>
                  <td>
                    <div className="flex items-center">
                      <img className="table-image" src={property.imageUrl} alt="" />
                      <div className="ml-4">
                        <div className="table-title">{property.title}</div>
                        <div className="table-subtitle">ID: {property.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="type-badge">Property Type:{property.propertyType}</span>
                  </td>
                  <td>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      Location: {property.location}
                    </div>
                  </td>
                  <td className="font-medium">
                    {property.price.toLocaleString()}
                  </td>

                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-icon view"
                        onClick={() => openModal('viewProperty', property)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        className="action-icon unpublish flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded transition-colors"
                        onClick={() => openModal('unpublishProperty', property)}
                      >
                        <EyeOff className="h-4 w-4" />
                        <span className="text-xs">Unpublish</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

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

        {isLoading ? (
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
                        {user.createdAt === "string" ? "N/A" : user.createdAt}
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

            {userData.length === 0 && !isLoading && (
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

  const InquiriesTab = () => (
    <div className="space-y-6">
      <div className="header-section">
        <h2 className="section-title">Inquiries Overview</h2>
      </div>

      <div className="stats-grid">
        <StatsCard
          title="Total Inquiries"
          value={inquiryStats.total.toLocaleString()}
          icon={MessageSquare}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
        />
        <StatsCard
          title="Pending"
          value={inquiryStats.pending.toLocaleString()}
          icon={Clock}
          color="bg-gradient-to-r from-yellow-500 to-yellow-600"
        />
        <StatsCard
          title="Responded"
          value={inquiryStats.responded.toLocaleString()}
          icon={CheckCircle}
          color="bg-gradient-to-r from-green-500 to-green-600"
        />
        <StatsCard
          title="Closed"
          value={inquiryStats.closed.toLocaleString()}
          icon={XCircle}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
        />
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Inquiry Trends</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { name: 'Pending', count: inquiryStats.pending },
            { name: 'Responded', count: inquiryStats.responded },
            { name: 'Closed', count: inquiryStats.closed }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const ReviewsTab = () => (
    <div className="space-y-6">
      <div className="header-section">
        <h2 className="section-title">Reviews Management</h2>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-filter">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search reviews..."
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

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>User</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviewsData.map((review) => (
                <tr key={review.id}>
                  <td className="table-title">{review.property}</td>
                  <td>{review.user}</td>
                  <td>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      {review.rating}
                    </div>
                  </td>
                  <td>{review.comment}</td>
                  <td>{review.date}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-icon view"
                        onClick={() => openModal('viewReview', review)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="action-icon delete"
                        onClick={() => openModal('deleteReview', review)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

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

  const SettingsTab = () => (
    <div className="space-y-6">
      <div className="header-section">
        <h2 className="section-title">Settings</h2>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Account Settings</h3>
        </div>
        <div className="settings-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-group">
              <Mail className="input-icon" />
              <input type="email" className="form-input" defaultValue="admin@example.com" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-group">
              <Lock className="input-icon" />
              <input type="password" className="form-input" defaultValue="********" />
            </div>
          </div>
          <div className="form-actions">
            <button className="action-button primary">Save Changes</button>
            <button className="action-button secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );

  const openModal = (type: React.SetStateAction<string>, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedItem(null);
  };

  const Modal = () => {
    if (!showModal) return null;

    const renderModalContent = () => {
      switch (modalType) {
        case 'addProperty':
          return (
            <>
              <h5 className="modal-title">Add New Property</h5>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Property Name</label>
                  <input type="text" className="form-input" placeholder="Enter property name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input">
                    <option>Apartment</option>
                    <option>House</option>
                    <option>Shared Room</option>
                    <option>Single Room</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Rent</label>
                  <input type="number" className="form-input" placeholder="Enter rent amount" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="action-button secondary" onClick={closeModal}>Cancel</button>
                <button className="action-button primary">Add Property</button>
              </div>
            </>
          );
        case 'viewProperty':
          return (
            <>
              <h5 className="modal-title">Property Details</h5>
              <div className="modal-body">
                <p><strong>Name:</strong> {selectedItem?.name || selectedItem?.title || 'Unnamed Property'}</p>
                <p><strong>Rating:</strong> {selectedItem?.rating || 'N/A'}</p>
                <p><strong>Inquiries:</strong> {selectedItem?.inquiries || 0}</p>


                {/* Additional basic info */}
                <p><strong>Location:</strong> {selectedItem?.location || selectedItem?.address || 'Unknown'}</p>
                <p><strong>Price:</strong> {selectedItem?.price || 'N/A'}</p>
                <p><strong>Status:</strong> {selectedItem?.status || (selectedItem?.isAvailable ? 'Available' : 'Unavailable')}</p>
              </div>
              <div className="modal-footer">
                <button className="action-button secondary" onClick={closeModal}>Close</button>
              </div>
            </>
          );
        case 'editProperty':
          return (
            <>
              <h5 className="modal-title">Edit Property</h5>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Property Name</label>
                  <input type="text" className="form-input" defaultValue={selectedItem?.name} />
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Rent</label>
                  <input type="number" className="form-input" defaultValue={selectedItem?.revenue} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="action-button secondary" onClick={closeModal}>Cancel</button>
                <button className="action-button primary">Save Changes</button>
              </div>
            </>
          );
        case 'deleteProperty':
          return (
            <>
              <h5 className="modal-title">Delete Property</h5>
              <div className="modal-body">
                <p>Are you sure you want to delete <strong>{selectedItem?.name}</strong>?</p>
              </div>
              <div className="modal-footer">
                <button className="action-button secondary" onClick={closeModal}>Cancel</button>
                <button className="action-button danger">Delete</button>
              </div>
            </>
          );

        case 'viewUser':
          return (
            <>
              <h5 className="modal-title">User Details    </h5>
              <div className="modal-body">
                <p><strong>Name:</strong> {selectedItem?.firstName} {selectedItem?.lastName}</p>
                <p><strong>Email:</strong> {selectedItem?.email}</p>
                <p><strong>Role:</strong> {selectedItem?.userType}</p>
                <p><strong>Phone:</strong> {selectedItem?.phoneNumber || 'Not provided'}</p>

                <p><strong>Account Creation Date:</strong> {new Date(selectedItem?.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="modal-footer">
                <button className="action-button secondary" onClick={closeModal}>Close</button>
              </div>
            </>
          );
        case 'editUser':
          return (
            <>
              <h5 className="modal-title">Edit User</h5>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-input" defaultValue={selectedItem?.name} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" defaultValue={selectedItem?.email} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="action-button secondary" onClick={closeModal}>Cancel</button>
                <button className="action-button primary">Save Changes</button>
              </div>
            </>
          );
        case 'deleteUser':
          return (
            <>
              <h5 className="modal-title">Delete User</h5>
              <div className="modal-body">
                <p>Are you sure you want to delete <strong>{selectedItem?.name}</strong>?</p>
              </div>
              <div className="modal-footer">
                <button className="action-button secondary" onClick={closeModal}>Cancel</button>
                <button className="action-button danger">Delete</button>
              </div>
            </>
          );
        case 'viewReview':
          return (
            <>
              <h5 className="modal-title">Review Details</h5>
              <div className="modal-body">
                <p><strong>Property:</strong> {selectedItem?.property}</p>
                <p><strong>User:</strong> {selectedItem?.user}</p>
                <p><strong>Rating:</strong> {selectedItem?.rating}</p>
                <p><strong>Comment:</strong> {selectedItem?.comment}</p>
                <p><strong>Date:</strong> {selectedItem?.date}</p>
              </div>
              <div className="modal-footer">
                <button className="action-button secondary" onClick={closeModal}>Close</button>
              </div>
            </>
          );
        case 'deleteReview':
          return (
            <>
              <h5 className="modal-title">Delete Review</h5>
              <div className="modal-body">
                <p>Are you sure you want to delete review for <strong>{selectedItem?.property}</strong>?</p>
              </div>
              <div className="modal-footer">
                <button className="action-button secondary" onClick={closeModal}>Cancel</button>
                <button className="action-button danger">Delete</button>
              </div>
            </>
          );
        default:
          return null;
      }
    };
    // In your modal component
    {
      modalType === 'unpublishProperty' && (
        <div className="p-4">
          <h3 className="text-lg font-medium mb-3">Unpublish Listing</h3>
          <p className="mb-4">
            Are you sure you want to unpublish "{selectedProperty.title}"?
            The listing will be hidden from students but can be republished later.
          </p>

          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1 border rounded"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              onClick={() => handleUnpublish(selectedProperty.propertyId)}
            >
              Confirm Unpublish
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="modal fade show" style={{ display: 'block' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              {renderModalContent()}
              <button className="btn-close" onClick={closeModal}></button>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show" onClick={closeModal}></div>
      </div>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'properties': return <PropertiesTab />;
      case 'users': return <UsersTab />;
      case 'inquiries': return <InquiriesTab />;
      case 'reviews': return <ReviewsTab />;
      case 'notifications': return <NotificationsTab />;
      case 'settings': return <SettingsTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="main-container">
        <header className="header">
          <div className="header-content">
            <div>
              <h1 className="header-title">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
              <p className="header-subtitle">Welcome back, Admin</p>
            </div>
            <div className="header-actions">
              <button className="notification-button">
                <Bell className="h-5 w-5" />
                <span className="notification-dot"></span>
              </button>
              <div className="user-profile">
                <div className="user-details">
                  <p className="user-name">NexNest Admin</p>
                  <p className="user-role">Administrator</p>
                </div>
                <img
                  className="user-image"
                  src="https://images.unsplash.com/photo-147209-5785-5658abf4ff4e?w=60&h=60&fit=crop&crop=faces"
                  alt="Profile"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="content">
          {renderActiveTab()}
        </main>
      </div>

      {showModal && <Modal />}
    </div>
  );
};

export default Dashboard;


function setLandlordName(landlordName: any) {
  throw new Error('Function not implemented.');
}

function setIsLoading(arg0: boolean) {
  throw new Error('Function not implemented.');
}


function setName(arg0: any) {
  throw new Error('Function not implemented.');
}

function setError(message: any) {
  throw new Error('Function not implemented.');
}