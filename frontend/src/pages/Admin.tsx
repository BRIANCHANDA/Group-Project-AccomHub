
import React, { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('properties');
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list or detail
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data - in a real app, you would fetch this from your API
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setProperties([
        { propertyId: 1, title: 'Modern Apartment near University', propertyType: 'apartment', monthlyRent: 650, isAvailable: true, address: '123 Campus Ave', landlordId: 2 },
        { propertyId: 2, title: 'Cozy Single Room', propertyType: 'single_room', monthlyRent: 350, isAvailable: true, address: '456 Student St', landlordId: 2 },
        { propertyId: 3, title: 'Shared House for Students', propertyType: 'house', monthlyRent: 1200, isAvailable: false, address: '789 College Blvd', landlordId: 4 },
      ]);
      
      setUsers([
        { userId: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', userType: 'student', createdAt: '2025-01-15', status: 'active' },
        { userId: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', userType: 'landlord', createdAt: '2025-01-10', status: 'active' },
        { userId: 3, firstName: 'Admin', lastName: 'User', email: 'admin@example.com', userType: 'admin', createdAt: '2024-12-01', status: 'active' },
        { userId: 4, firstName: 'Robert', lastName: 'Johnson', email: 'robert@example.com', userType: 'landlord', createdAt: '2025-02-05', status: 'active' },
      ]);
      
      setBookings([
        { bookingId: 1, propertyId: 1, studentId: 1, status: 'approved', moveInDate: '2025-04-01', createdAt: '2025-03-01' },
        { bookingId: 2, propertyId: 2, studentId: 1, status: 'pending', moveInDate: '2025-05-01', createdAt: '2025-03-15' },
        { bookingId: 3, propertyId: 3, studentId: 1, status: 'cancelled', moveInDate: '2025-04-15', createdAt: '2025-02-20' },
      ]);

      setPendingRegistrations([
        { regId: 1, firstName: 'Michael', lastName: 'Brown', email: 'michael@example.com', userType: 'landlord', createdAt: '2025-03-20', documents: ['id_verification.pdf', 'property_proof.pdf'] },
        { regId: 2, firstName: 'Sarah', lastName: 'Wilson', email: 'sarah@example.com', userType: 'landlord', createdAt: '2025-03-22', documents: ['id_verification.pdf', 'property_proof.pdf'] },
        { regId: 3, firstName: 'David', lastName: 'Taylor', email: 'david@example.com', userType: 'student', createdAt: '2025-03-18', documents: ['student_id.pdf', 'enrollment_proof.pdf'] },
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setViewMode('list');
    setSelectedItem(null);
    setFilterStatus('all');
  };

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedItem(null);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#28a745';
      case 'pending': return '#ffc107';
      case 'rejected': return '#dc3545';
      case 'cancelled': return '#6c757d';
      case 'active': return '#28a745';
      case 'inactive': return '#6c757d';
      default: return '#6c757d';
    }
  };

  // Filter data based on current filter status
  const getFilteredData = (dataSet) => {
    if (filterStatus === 'all') return dataSet;
    return dataSet.filter(item => item.status === filterStatus);
  };

  const handleApproveRegistration = (regId) => {
    // In a real app, you would call an API to approve the registration
    console.log(`Approving registration ${regId}`);
    // For this demo, we'll just update the UI
    setPendingRegistrations(pendingRegistrations.filter(reg => reg.regId !== regId));
  };

  const handleRejectRegistration = (regId) => {
    // In a real app, you would call an API to reject the registration
    console.log(`Rejecting registration ${regId}`);
    // For this demo, we'll just update the UI
    setPendingRegistrations(pendingRegistrations.filter(reg => reg.regId !== regId));
  };

  const renderProperties = () => {
    if (viewMode === 'list') {
      return (
        <div className="data-table">
          <h2>Properties Management</h2>
          <div className="table-actions">
            <div className="filter-controls">
              <span className="filter-label">Filter:</span>
              <select 
                className="filter-dropdown"
                value={filterStatus}
                onChange={(e) => handleFilterChange(e.target.value)}
              >
                <option value="all">All Properties</option>
                <option value="active">Available</option>
                <option value="inactive">Unavailable</option>
              </select>
            </div>
            <input type="text" placeholder="Search properties..." className="search-input" />
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Rent (€)</th>
                  <th>Available</th>
                  <th>Address</th>
                  <th>Landlord ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map(property => (
                  <tr key={property.propertyId}>
                    <td>{property.propertyId}</td>
                    <td>{property.title}</td>
                    <td>{property.propertyType}</td>
                    <td>{property.monthlyRent}</td>
                    <td>
                      <span className={`status-badge ${property.isAvailable ? 'status-active' : 'status-inactive'}`}>
                        {property.isAvailable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>{property.address}</td>
                    <td>{property.landlordId}</td>
                    <td>
                      <button className="view-btn" onClick={() => handleViewItem(property)}>View</button>
                      <button className="edit-btn">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>Showing 1-3 of 3 items</span>
            <div className="pagination-controls">
              <button disabled>Previous</button>
              <button className="active">1</button>
              <button disabled>Next</button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="detail-view">
          <button className="back-button" onClick={handleBackToList}>← Back to List</button>
          <h2>Property Details</h2>
          <div className="detail-card">
            <h3>{selectedItem.title}</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Property ID:</span>
                <span className="detail-value">{selectedItem.propertyId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{selectedItem.propertyType}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Monthly Rent:</span>
                <span className="detail-value">€{selectedItem.monthlyRent}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Available:</span>
                <span className="detail-value">
                  <span className={`status-badge ${selectedItem.isAvailable ? 'status-active' : 'status-inactive'}`}>
                    {selectedItem.isAvailable ? 'Yes' : 'No'}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Landlord ID:</span>
                <span className="detail-value">{selectedItem.landlordId}</span>
              </div>
              <div className="detail-item full-width">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{selectedItem.address}</span>
              </div>
            </div>
            <div className="action-buttons">
              <button className="edit-btn">Edit Property</button>
              <button className="view-btn">View Landlord</button>
              <button className="action-button">View Bookings</button>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderUsers = () => {
    if (viewMode === 'list') {
      return (
        <div className="data-table">
          <h2>User Management</h2>
          <div className="table-actions">
            <div className="filter-controls">
              <span className="filter-label">Filter:</span>
              <select 
                className="filter-dropdown"
                value={filterStatus}
                onChange={(e) => handleFilterChange(e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <input type="text" placeholder="Search users..." className="search-input" />
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.userId}>
                    <td>{user.userId}</td>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`user-type-badge user-type-${user.userType}`}>
                        {user.userType}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(user.status) }}>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.createdAt}</td>
                    <td>
                      <button className="view-btn" onClick={() => handleViewItem(user)}>View</button>
                      <button className="edit-btn">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>Showing 1-4 of 4 items</span>
            <div className="pagination-controls">
              <button disabled>Previous</button>
              <button className="active">1</button>
              <button disabled>Next</button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="detail-view">
          <button className="back-button" onClick={handleBackToList}>← Back to List</button>
          <h2>User Details</h2>
          <div className="detail-card">
            <h3>{selectedItem.firstName} {selectedItem.lastName}</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">User ID:</span>
                <span className="detail-value">{selectedItem.userId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{selectedItem.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">User Type:</span>
                <span className="detail-value">
                  <span className={`user-type-badge user-type-${selectedItem.userType}`}>
                    {selectedItem.userType}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  <span className="status-badge" style={{ backgroundColor: getStatusColor(selectedItem.status) }}>
                    {selectedItem.status}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Joined:</span>
                <span className="detail-value">{selectedItem.createdAt}</span>
              </div>
            </div>
            <div className="action-buttons">
              <button className="edit-btn">Edit User</button>
              {selectedItem.status === 'active' ? (
                <button className="deactivate-btn">Deactivate User</button>
              ) : (
                <button className="activate-btn">Activate User</button>
              )}
              {selectedItem.userType === 'student' && (
                <button className="action-button">View Bookings</button>
              )}
              {selectedItem.userType === 'landlord' && (
                <button className="action-button">View Properties</button>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  const renderBookings = () => {
    if (viewMode === 'list') {
      return (
        <div className="data-table">
          <h2>Bookings Management</h2>
          <div className="table-actions">
            <div className="filter-controls">
              <span className="filter-label">Filter:</span>
              <select 
                className="filter-dropdown"
                value={filterStatus}
                onChange={(e) => handleFilterChange(e.target.value)}
              >
                <option value="all">All Bookings</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <input type="text" placeholder="Search bookings..." className="search-input" />
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Property ID</th>
                  <th>Student ID</th>
                  <th>Status</th>
                  <th>Move-in Date</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.bookingId}>
                    <td>{booking.bookingId}</td>
                    <td>{booking.propertyId}</td>
                    <td>{booking.studentId}</td>
                    <td>
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(booking.status) }}>
                        {booking.status}
                      </span>
                    </td>
                    <td>{booking.moveInDate}</td>
                    <td>{booking.createdAt}</td>
                    <td>
                      <button className="view-btn" onClick={() => handleViewItem(booking)}>View</button>
                      <button className="edit-btn">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>Showing 1-3 of 3 items</span>
            <div className="pagination-controls">
              <button disabled>Previous</button>
              <button className="active">1</button>
              <button disabled>Next</button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="detail-view">
          <button className="back-button" onClick={handleBackToList}>← Back to List</button>
          <h2>Booking Details</h2>
          <div className="detail-card">
            <h3>Booking #{selectedItem.bookingId}</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Property ID:</span>
                <span className="detail-value">{selectedItem.propertyId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Student ID:</span>
                <span className="detail-value">{selectedItem.studentId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  <span className="status-badge" style={{ backgroundColor: getStatusColor(selectedItem.status) }}>
                    {selectedItem.status}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Move-in Date:</span>
                <span className="detail-value">{selectedItem.moveInDate}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Created At:</span>
                <span className="detail-value">{selectedItem.createdAt}</span>
              </div>
            </div>
            <div className="action-buttons">
              <button className="edit-btn">Edit Booking</button>
              {selectedItem.status === 'pending' && (
                <>
                  <button className="approve-btn">Approve</button>
                  <button className="reject-btn">Reject</button>
                </>
              )}
              <button className="view-btn">View Property</button>
              <button className="view-btn">View Student</button>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderPendingRegistrations = () => {
    return (
      <div className="data-table">
        <h2>Pending Registrations</h2>
        <div className="table-actions">
          <div className="filter-controls">
            <span className="filter-label">Filter:</span>
            <select 
              className="filter-dropdown"
              value={filterStatus}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <option value="all">All Registrations</option>
              <option value="landlord">Landlords Only</option>
            </select>
          </div>
          <input type="text" placeholder="Search registrations..." className="search-input" />
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Created At</th>
                <th>Documents</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRegistrations
                .filter(reg => filterStatus === 'all' || reg.userType === filterStatus)
                .map(registration => (
                  <tr key={registration.regId}>
                    <td>{registration.regId}</td>
                    <td>{registration.firstName} {registration.lastName}</td>
                    <td>{registration.email}</td>
                    <td>
                      <span className={`user-type-badge user-type-${registration.userType}`}>
                        {registration.userType}
                      </span>
                    </td>
                    <td>{registration.createdAt}</td>
                    <td>
                      {registration.documents.map((doc, index) => (
                        <div key={index} className="document-link">
                          <a href="#">{doc}</a>
                        </div>
                      ))}
                    </td>
                    <td>
                      {registration.userType === 'landlord' ? (
                        <>
                          <button className="approve-btn" onClick={() => handleApproveRegistration(registration.regId)}>Approve</button>
                          <button className="reject-btn" onClick={() => handleRejectRegistration(registration.regId)}>Reject</button>
                        </>
                      ) : (
                        <span className="auto-approval-note">Auto-approved</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>Showing 1-3 of 3 items</span>
          <div className="pagination-controls">
            <button disabled>Previous</button>
            <button className="active">1</button>
            <button disabled>Next</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Zit AccomHub Admin</h1>
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <button className="logout-btn">Logout</button>
          </div>
        </div>
      </header>
      
      <div className="dashboard-container">
        <nav className="sidebar">
          <ul>
            <li 
              className={activeTab === 'properties' ? 'active' : ''} 
              onClick={() => handleTabChange('properties')}
            >
              Properties
            </li>
            <li 
              className={activeTab === 'users' ? 'active' : ''} 
              onClick={() => handleTabChange('users')}
            >
              Users
            </li>
            <li 
              className={activeTab === 'bookings' ? 'active' : ''} 
              onClick={() => handleTabChange('bookings')}
            >
              Bookings
            </li>
            <li 
              className={activeTab === 'registrations' ? 'active' : ''} 
              onClick={() => handleTabChange('registrations')}
            >
              Pending Registrations
            </li>
            <li>
              Reviews
            </li>
            <li>
              Messages
            </li>
            <li>
              Reports
            </li>
            <li>
              Settings
            </li>
          </ul>
        </nav>
        
        <main className="content">
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <div>Loading dashboard data...</div>
            </div>
          ) : (
            <>
              {activeTab === 'properties' && renderProperties()}
              {activeTab === 'users' && renderUsers()}
              {activeTab === 'bookings' && renderBookings()}
              {activeTab === 'registrations' && renderPendingRegistrations()}
            </>
          )}
        </main>
      </div>
      
      <footer className="dashboard-footer">
        <p>© 2025 StudentHousing Admin Dashboard</p>
      </footer>

      <style jsx>{`
        /* Global Styles */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
        }
        
        /* Dashboard Layout */
        .admin-dashboard {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        
        .dashboard-header {
          background-color: rgb(48, 0, 126);
          color: white;
          padding: 1rem 2rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1800px;
          margin: 0 auto;
          width: 100%;
        }
        
        .dashboard-container {
          display: flex;
          flex: 1;
          max-width: 1800px;
          margin: 0 auto;
          width: 100%;
        }
        
        .dashboard-footer {
          padding: 1rem;
          text-align: center;
          background-color: #f8f9fa;
          border-top: 1px solid #dee2e6;
          font-size: 0.9rem;
          color: #6c757d;
        }
        
        /* Sidebar Navigation */
        .sidebar {
          width: 240px;
          background-color: #f8f9fa;
          border-right: 1px solid #dee2e6;
          padding: 1.5rem 0;
          height: calc(100vh - 110px);
          position: sticky;
          top: 0;
        }
        
        .sidebar ul {
          list-style: none;
        }
        
        .sidebar li {
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          font-weight: 500;
          color: #495057;
          border-left: 4px solid transparent;
          transition: all 0.2s ease;
        }
        
        .sidebar li:hover {
          background-color: rgba(48, 0, 126, 0.05);
          color: rgb(48, 0, 126);
        }
        
        .sidebar li.active {
          background-color: rgba(48, 0, 126, 0.1);
          color: rgb(48, 0, 126);
          border-left-color: rgb(48, 0, 126);
        }
        
        /* Content Area */
        .content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }
        
        .loading {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100%;
          font-size: 1.2rem;
          color: #6c757d;
          gap: 1rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(48, 0, 126, 0.1);
          border-radius: 50%;
          border-top: 4px solid rgb(48, 0, 126);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Table Styles */
        .data-table {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          padding: 1.5rem;
        }
        
        .data-table h2 {
          margin-bottom: 1.5rem;
          color: rgb(48, 0, 126);
        }
        
        .table-actions {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          align-items: center;
        }
        
        .table-container {
          overflow-x: auto;
          margin-bottom: 1rem;
          max-height: calc(100vh - 300px);
          overflow-y: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }
        
        th {
          text-align: left;
          padding: 0.75rem;
          background-color: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
          color: #495057;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        td {
          padding: 0.75rem;
          border-bottom: 1px solid #e9ecef;
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        tr:hover {
          background-color: #f8f9fa;
        }

        /* Pagination */
        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid #e9ecef;
          font-size: 0.9rem;
          color: #6c757d;
        }

        .pagination-controls {
          display: flex;
          gap: 0.5rem;
        }

        .pagination-controls button {
          background-color: transparent;
          border: 1px solid #dee2e6;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          color: #6c757d;
        }

        
          ////
  .pagination-controls button.active {
  background-color: rgb(48, 0, 126);
  color: white;
  border-color: rgb(48, 0, 126);
}

.pagination-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-controls button:not(:disabled):hover {
  background-color: #e9ecef;
}

/* Status Badges */
.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  display: inline-block;
}

.status-active {
  background-color: #28a745;
}

.status-inactive {
  background-color: #6c757d;
}

/* User Type Badges */
.user-type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
}

.user-type-admin {
  background-color: #dc3545;
  color: white;
}

.user-type-landlord {
  background-color: #fd7e14;
  color: white;
}

.user-type-student {
  background-color: #17a2b8;
  color: white;
}

/* Button Styles */
button {
  cursor: pointer;
  padding: 0.375rem 0.75rem;
  border-radius: 4px;
  font-weight: 500;
  border: none;
  transition: all 0.2s;
}

.view-btn {
  background-color: #e9ecef;
  color: #495057;
  margin-right: 0.5rem;
}

.view-btn:hover {
  background-color: #dee2e6;
}

.edit-btn {
  background-color: #17a2b8;
  color: white;
  margin-right: 0.5rem;
}

.edit-btn:hover {
  background-color: #138496;
}

.approve-btn {
  background-color: #28a745;
  color: white;
  margin-right: 0.5rem;
}

.approve-btn:hover {
  background-color: #218838;
}

.reject-btn, .deactivate-btn {
  background-color: #dc3545;
  color: white;
}

.reject-btn:hover, .deactivate-btn:hover {
  background-color: #c82333;
}

.activate-btn {
  background-color: #28a745;
  color: white;
}

.activate-btn:hover {
  background-color: #218838;
}

.action-button {
  background-color: rgb(48, 0, 126);
  color: white;
  margin-right: 0.5rem;
}

.action-button:hover {
  background-color: rgb(38, 0, 101);
}

.logout-btn {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.375rem 0.75rem;
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Form Controls */
.filter-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-label {
  font-weight: 500;
}

.filter-dropdown,
.search-input {
  padding: 0.375rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.95rem;
}

.search-input {
  min-width: 240px;
}

/* Detail View */
.detail-view {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.back-button {
  background-color: transparent;
  color: rgb(48, 0, 126);
  padding: 0;
  margin-bottom: 1rem;
  display: inline-block;
}

.back-button:hover {
  text-decoration: underline;
}

.detail-view h2 {
  margin-bottom: 1.5rem;
  color: rgb(48, 0, 126);
}

.detail-card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
}

.detail-card h3 {
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e9ecef;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.detail-item.full-width {
  grid-column: span 2;
}

.detail-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-size: 1rem;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

/* User Info in Header */
.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  font-weight: 500;
}

/* Document Links */
.document-link {
  margin-bottom: 0.25rem;
}

.document-link a {
  color: rgb(48, 0, 126);
  text-decoration: none;
  font-size: 0.9rem;
}

.document-link a:hover {
  text-decoration: underline;
}

.auto-approval-note {
  font-style: italic;
  color: #6c757d;
  font-size: 0.9rem;
}

/* Responsive Adjustments */
@media (max-width: 992px) {
  .dashboard-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #dee2e6;
    padding: 0.5rem 0;
  }
  
  .sidebar ul {
    display: flex;
    overflow-x: auto;
    padding: 0.5rem;
  }
  
  .sidebar li {
    padding: 0.5rem 1rem;
    white-space: nowrap;
    border-left: none;
    border-bottom: 3px solid transparent;
  }
  
  .sidebar li.active {
    border-left-color: transparent;
    border-bottom-color: rgb(48, 0, 126);
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-item.full-width {
    grid-column: 1;
  }
  
  .action-buttons {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .data-table {
    padding: 1rem;
  }
  
  .pagination {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
  `}</style>
    </div>
  );
};

export default AdminDashboard;