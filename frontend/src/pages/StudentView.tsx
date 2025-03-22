import React, { useState } from 'react';

const StudentDashboard = () => {
  // For hover effect on listing cards
  const [hoveredItem, setHoveredItem] = useState(null);

  // For type filter: "all", "apartment", "shared", "single"
  const [typeFilter, setTypeFilter] = useState('all');

  // For price filter: "all", "under1500", "1500to2000", "above2000"
  const [priceFilter, setPriceFilter] = useState('all');

  // For search text
  const [searchTerm, setSearchTerm] = useState('');

  // For notification display
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New listings added in Riverside area!", read: false },
    { id: 2, message: "Your booking request for Parklands Hostel was approved!", read: false }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // For detail view modal
  const [selectedListing, setSelectedListing] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  

  // Sample listings data
  const listingsData = [
    {
      id: 1,
      title: 'Riverside Boarding House',
      location: 'Riverside, 5 min to CBU',
      price: 'K1,500 / month',
      type: 'apartment',
      image: '/api/placeholder/300/200',
      description: 'A comfortable apartment near the river with 2 bedrooms, a shared kitchen, and 24/7 security. Includes water and WiFi.',
      amenities: ['WiFi', 'Security', 'Water included', 'Furnished'],
      available: true
    },
    {
      id: 2,
      title: 'Ndeke Apartment',
      location: 'Ndeke, 10 min to CBU',
      price: 'K1,200 / month',
      type: 'shared',
      image: '/api/placeholder/300/200',
      description: 'Affordable shared accommodation with 3 other students. Common areas include kitchen and living room.',
      amenities: ['Shared kitchen', 'Laundry', 'Student-friendly'],
      available: true
    },
    {
      id: 3,
      title: 'Kitwe Flats',
      location: 'Town Center, 15 min to CBU',
      price: 'K2,000 / month',
      type: 'single',
      image: '/api/placeholder/300/200',
      description: 'Modern single room apartment in the heart of Kitwe. Close to shops and transport links.',
      amenities: ['Private bathroom', 'Mini kitchen', 'AC'],
      available: false
    },
    {
      id: 4,
      title: 'Parklands Hostel',
      location: 'Parklands, 7 min to CBU',
      price: 'K1,800 / month',
      type: 'shared',
      image: '/api/placeholder/300/200',
      description: 'Student hostel with all utilities included. Study areas and common rooms available.',
      amenities: ['Study rooms', 'Meal plan option', 'WiFi'],
      available: true
    }
  ];

  // Helper to extract numeric price from e.g. "K1,500 / month" -> 1500
  const getNumericPrice = (priceString) => {
    const numeric = priceString.replace(/K|,|\s|\/month/g, ''); // remove K, commas, /month, spaces
    return parseInt(numeric, 10);
  };

  // Filter logic
  const filteredListings = listingsData.filter((listing) => {
    // 1) Type filter
    if (typeFilter !== 'all' && listing.type !== typeFilter) {
      return false;
    }

    // 2) Price filter
    const numericPrice = getNumericPrice(listing.price);
    if (priceFilter === 'under1500' && numericPrice >= 1500) return false;
    if (priceFilter === '1500to2000' && (numericPrice < 1500 || numericPrice > 2000)) return false;
    if (priceFilter === 'above2000' && numericPrice <= 2000) return false;

    // 3) Search term (in title or location)
    const searchLower = searchTerm.toLowerCase();
    const inTitle = listing.title.toLowerCase().includes(searchLower);
    const inLocation = listing.location.toLowerCase().includes(searchLower);
    if (searchTerm && !inTitle && !inLocation) {
      return false;
    }

    return true;
  });

  // Handle view details click
  const handleViewDetails = (listing) => {
    setSelectedListing(listing);
    setShowDetailModal(true);
  };

  // Handle book now
  const handleBookNow = () => {
    if (selectedListing) {
      // Show booking confirmation
      alert(`Booking request sent for ${selectedListing.title}!`);

      // Add notification
      const newNotification = {
        id: notifications.length + 1,
        message: `Booking request sent for ${selectedListing.title}!`,
        read: false
      };

      setNotifications([newNotification, ...notifications]);
      setShowDetailModal(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setShowNotifications(false);
  };

  // State for notification banner
  const [showBanner, setShowBanner] = useState(true);

  // For search on button click
  const handleSearch = () => {
    // We already store the searchTerm in state,
    // so the actual filtering is done by `filteredListings`.
    // This function can be used if you need to do extra logic
    // or fetch from an API, etc.
  };

  return (
    <>
      {/* Responsive styles using media queries */}
      <style>
        {`
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: Arial, sans-serif;
            background-color: #f9fafb;
            overflow-x: hidden;
          }
          
          .container {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            width: 100%;
          }
          
          .header {
            padding: 1rem;
            background-color: #ffffff;
            border-bottom: 1px solid #e5e7eb;
            position: sticky;
            top: 0;
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          .logo {
            font-size: 1.25rem;
            font-weight: bold;
            color: #6d28d9;
          }
          
          .search-bar {
            display: flex;
            align-items: center;
            background-color: #f3f4f6;
            border-radius: 0.5rem;
            padding: 0.5rem;
            flex: 1;
            max-width: 600px;
            margin: 0 1rem;
          }
          
          .search-input {
            border: none;
            outline: none;
            background-color: transparent;
            width: 100%;
            font-size: 0.875rem;
            padding: 0 0.5rem;
          }
          
          .search-button {
            padding: 0.5rem 0.75rem;
            background-color: #6d28d9;
            color: white;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 0.75rem;
            white-space: nowrap;
          }
          
          .profile {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: #ddd6fe;
            overflow: hidden;
            color:black;
          }
          
          .welcome-section {
            padding: 1rem;
            background-color: #ffffff;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .welcome-title {
            font-size: 1.25rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
          }
          
          .welcome-subtitle {
            color: #6b7280;
            font-size: 0.875rem;
          }
          
          .filters-bar {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: 0.75rem;
            background-color: #ffffff;
            border-bottom: 1px solid #e5e7eb;
            overflow-x: auto;
          }
          .notification-header h3 {
            color: #000000 !important;
}
          .filter-row {
            display: flex;
            gap: 0.5rem;
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 0.25rem;
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          
          .filter-row::-webkit-scrollbar {
            display: none;  /* Chrome, Safari, Opera */
          }
          
          .filter-item {
            padding: 0.5rem 0.75rem;
            border-radius: 0.375rem;
            cursor: pointer;
            white-space: nowrap;
            font-size: 0.875rem;
          }
          
          .filter-active {
            font-weight: bold;
            background-color: #6d28d9;
            color: #ffffff;
          }
          
          .filter-inactive {
            background-color: #f3f4f6;
            color: #1f2937;
          }
          
          .content-area {
            padding: 1rem;
            flex: 1;
          }
          
          .listings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1rem;
          }
          
          .card {
            background-color: #ffffff;
            border-radius: 0.5rem;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            transition: transform 0.3s;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          
          .card:hover {
            transform: translateY(-5px);
          }
          
          .card-image {
            width: 100%;
            height: 160px;
            object-fit: cover;
            background-color: #e5e7eb;
          }
          
          .card-content {
            padding: 1rem;
            display: flex;
            flex-direction: column;
            flex: 1;
          }
          
          .card-title {
            font-size: 1rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
            color: black;
          }
          
          .card-location {
            font-size: 0.875rem;
            color: #6d28d9;
            margin-bottom: 0.5rem;
          }
          
          .card-price {
            font-size: 0.95rem;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 0.75rem;
          }
          
          .card-button {
            padding: 0.5rem;
            background-color: #6d28d9;
            color: #ffffff;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 0.875rem;
            margin-top: auto;
          }
          
          .footer {
            padding: 1rem;
            background-color: #ffffff;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 0.875rem;
          }
          
          .notification-icon {
            position: relative;
            cursor: pointer;
            margin-right: 0.5rem;
            color: black;
          }
          
          .notification-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background-color: #ef4444;
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 0.7rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .notification-panel {
            position: absolute;
            top: 60px;
            right: 1rem;
            background-color: white;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            width: 300px;
            max-width: 90vw;
            z-index: 101;
          }
          
          .notification-header {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color:header;
          }
          
          .notification-list {
            max-height: 300px;
            overflow-y: auto;
            color:black;
          }
          
          .notification-item {
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
            cursor: pointer;
            color:black;
          }
          
          .notification-read {
            background-color: #ffffff;
          }
          
          .notification-unread {
            background-color: #f3f4f6;
          }
          
          .banner {
            background-color: #6d28d9;
            color: white;
            padding: 0.75rem 1rem;
            text-align: center;
            position: relative;
            font-size: 0.875rem;
          }
          
          .close-banner {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            background-color: transparent;
            border: none;
            color: white;
            font-size: 1.25rem;
          }
          
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            padding: 1rem;
          }
          
          .modal {
            background-color: white;
            border-radius: 0.5rem;
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            overflow: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            color:black;
          }
          
          .modal-header {
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .modal-content {
            padding: 1rem;
          }
          
          .modal-footer {
            padding: 1rem;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
            
          }
          
          .detail-image {
            width: 100%;
            height: auto;
            max-height: 300px;
            object-fit: cover;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
            color:black;
          }
          
          .amenities-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.5rem;
            color:black;
          }
          
          .amenity-tag {
            padding: 0.25rem 0.5rem;
            background-color: #f3f4f6;
            border-radius: 9999px;
            font-size: 0.75rem;
          }
          
          .availability-tag {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: bold;
          }
          
          .available {
            background-color: #dcfce7;
            color: #166534;
          }
          
          .unavailable {
            background-color: #fee2e2;
            color: #991b1b;
          }
          
          .button {
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            cursor: pointer;
            font-weight: bold;
            font-size: 0.875rem;
          }
          
          .button-primary {
            background-color: #6d28d9;
            color: white;
            border: none;
          }
          
          .button-secondary {
            background-color: #f3f4f6;
            color: #1f2937;
            border: 1px solid #e5e7eb;
          }
          
          .button-disabled {
            background-color: #9ca3af;
            color: white;
            border: none;
            cursor: not-allowed;
          }
          
          ..hamburger {
              display: block;
              cursor: pointer;
              padding: 8px;
              z-index: 1000;
              position: relative; /* Add this */
            }
            .hamburger svg {
                width: 24px;
                height: 24px;
                stroke: #6d28d9;
                display: block; /* Ensure it's displaying */
                visibility: visible; /* Add this explicitly */
              }

/* Mobile menu positioning fix */
.mobile-menu {
  transform: translateX(-100%);
}

.mobile-menu.open {
  transform: translateX(0);
}

/* Ensure menu appears above other content */
.mobile-menu {
  z-index: 1001;
}

.mobile-backdrop {
  z-index: 999;
}
          
         

                .mobile-menu {
                  position: fixed;
                  top: 0;
                  left: 0;
                  bottom: 0;
                  background-color: #ffffff;
                  width: 80%;
                  max-width: 300px;
                  z-index: 200;
                  transform: translateX(-100%);
                  transition: transform 0.3s ease-in-out;
                  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
                  overflow-y: auto;
                  display: flex;
                  flex-direction: column;
                }


.mobile-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 199;
  display: none;
}

.


          .mobile-menu.open {
            transform: translateX(0);
          }
          
          .mobile-menu-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
          
          }
          
          .mobile-menu-content {
            padding: 1rem;
            flex: 1;
          }
          
          .mobile-menu-section {
            margin-bottom: 1.5rem;
          }
          
          .mobile-menu-footer {
            padding: 1rem;
            border-top: 1px solid #e5e7eb;
          }
          
          
          .mobile-backdrop.open {
            display: block;
          }
          
          .mobile-menu-item {
            padding: 0.75rem 0;
            border-bottom: 1px solid #e5e7eb;
            font-size: 1rem;
            
            color: #1f2937; /* Dark gray text */
            border-bottom: 1px solid #e5e7eb
          }
          
          .hide-xs, .hide-sm, .show-md {
            display: none;
          }
          
          .show-xs {
            display: block;
          }
          
          /* Responsive breakpoints */
          @media (min-width: 640px) {
            .header {
              padding: 1rem 2rem;
            }
            
            .content-area {
              padding: 1.5rem;
            }
            
            .welcome-section {
              padding: 1.5rem 2rem;
            }
            
            .filters-bar {
              padding: 1rem 2rem;
            }
            
            .listings-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 1.5rem;
            }
            
            .banner {
              padding: 0.75rem 2rem;
            }
            
            .hide-xs {
              display: block;
            }
            
            .show-xs {
              display: none;
            }
          }
          
          @media (min-width: 768px) {
            .logo {
              font-size: 1.5rem;
            }
            
            .listings-grid {
              grid-template-columns: repeat(3, 1fr);
            }
            
            .hamburger {
              display: none;
            }
            
            .filters-bar {
              padding: 1rem 2rem;
            }
            
            .hide-sm {
              display: block;
            }
            
            .show-md {
              display: block;
            }
          }
          
          @media (min-width: 1024px) {
            .listings-grid {
              grid-template-columns: repeat(4, 1fr);
            }
            
            .content-area {
              padding: 2rem;
            }
          }
          
          @media (max-width: 767px) {
            .hamburger {
              display: block;
            }
            
            .desktop-menu {
              display: none;
            }
          }
        `}
      </style>

      <div className="container">
        {/* Notification Banner */}
        {showBanner && (
          <div className="banner">
            Welcome to ZIT AccommoHub! Special early bird discounts for new students until April 30th.
            <button className="close-banner" onClick={() => setShowBanner(false)}>×</button>
          </div>
        )}

        {/* Header */}
        <header className="header">
          {/* Mobile menu button */}
          <div className="hamburger" onClick={toggleMobileMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </div>

          <div className="logo">ZIT AccommoHub</div>

          {/* Search Bar - hidden on small screens */}
          <div className="search-bar hide-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '20px', height: '20px', fill: '#9ca3af' }}
              viewBox="0 0 24 24"
            >
              <path d="M9.5 3C13.6421 3 17 6.35786 17 10.5C17 12.3413 16.3161 14.0316 15.1863 15.3262L20.7071 20.8536L19.2929 22.2678L13.7688 16.7413C12.4806 17.7611 10.8827 18.5 9.5 18.5C5.35786 18.5 2 15.1421 2 11C2 6.85786 5.35786 3.5 9.5 3.5ZM9.5 5.5C6.46243 5.5 4 7.96243 4 11C4 14.0376 6.46243 16.5 9.5 16.5C12.5376 16.5 15 14.0376 15 11C15 7.96243 12.5376 5.5 9.5 5.5Z" />
            </svg>
            <input
              type="text"
              placeholder="Search by title or location..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="search-button" onClick={handleSearch}>
              Search
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Notification Icon */}
            <div className="notification-icon" onClick={() => setShowNotifications(!showNotifications)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {unreadCount > 0 && <div className="notification-badge">{unreadCount}</div>}
            </div>

            {/* Profile - Hide user name on small screens */}
            <div className="profile">
              <span className="hide-xs" style={{ fontSize: '0.9rem', color: '#1f2937' }}>Hi, Student!</span>
              <div className="avatar">
                <img
                  src="/api/placeholder/40/40"
                  alt="profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>

          {/* Notification Panel */}
          {showNotifications && (
            <div className="notification-panel">
              <div className="notification-header">
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#6d28d9',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No notifications</div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`notification-item ${notif.read ? 'notification-read' : 'notification-unread'}`}
                      onClick={() => {
                        setNotifications(
                          notifications.map(n =>
                            n.id === notif.id ? { ...n, read: true } : n
                          )
                        );
                      }}
                    >
                      {notif.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </header>

        {/* Mobile Search Bar - shown only on small screens */}
        <div className="show-xs" style={{ padding: '0.5rem 1rem', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', padding: '0.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px', fill: '#9ca3af', marginRight: '0.5rem' }} viewBox="0 0 24 24">
              <path d="M9.5 3C13.6421 3 17 6.35786 17 10.5C17 12.3413 16.3161 14.0316 15.1863 15.3262L20.7071 20.8536L19.2929 22.2678L13.7688 16.7413C12.4806 17.7611 10.8827 18.5 9.5 18.5C5.35786 18.5 2 15.1421 2 11C2 6.85786 5.35786 3.5 9.5 3.5ZM9.5 5.5C6.46243 5.5 4 7.96243 4 11C4 14.0376 6.46243 16.5 9.5 16.5C12.5376 16.5 15 14.0376 15 11C15 7.96243 12.5376 5.5 9.5 5.5Z" />
            </svg>
            <input
              type="text"
              placeholder="Search by title or location..."
              style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '100%', fontSize: '0.875rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Welcome Section */}
        <section className="welcome-section">
          <h2 className="welcome-title">Find your accommodation with ease...</h2>
          <p className="welcome-subtitle">
            Browse our latest listings and discover your perfect place near Copperbelt University.
          </p>
        </section>

        {/* Filters Bar */}
        <div className="filters-bar">
          {/* Filter by Type */}
          <div className="filter-row">
            <div
              className={`filter-item ${typeFilter === 'all' ? 'filter-active' : 'filter-inactive'}`}
              onClick={() => setTypeFilter('all')}
            >
              All Types
            </div>
            <div
              className={`filter-item ${typeFilter === 'apartment' ? 'filter-active' : 'filter-inactive'}`}
              onClick={() => setTypeFilter('apartment')}
            >
              Apartment
            </div>
            <div
              className={`filter-item ${typeFilter === 'shared' ? 'filter-active' : 'filter-inactive'}`}
              onClick={() => setTypeFilter('shared')}
            >
              Shared Room
            </div>
            <div
              className={`filter-item ${typeFilter === 'single' ? 'filter-active' : 'filter-inactive'}`}
              onClick={() => setTypeFilter('single')}
            >
              Single Room
            </div>
          </div>

          {/* Filter by Price */}
          <div className="filter-row">
            <div
              className={`filter-item ${priceFilter === 'all' ? 'filter-active' : 'filter-inactive'}`}
              onClick={() => setPriceFilter('all')}
            >
              All Prices
            </div>
            <div
              className={`filter-item ${priceFilter === 'under1500' ? 'filter-active' : 'filter-inactive'}`}
              onClick={() => setPriceFilter('under1500')}
            >
              Under K1500
            </div>
            <div
              className={`filter-item ${priceFilter === '1500to2000' ? 'filter-active' : 'filter-inactive'}`}
              onClick={() => setPriceFilter('1500to2000')}
            >
              K1500–K2000
            </div>
            <div
              className={`filter-item ${priceFilter === 'above2000' ? 'filter-active' : 'filter-inactive'}`}
              onClick={() => setPriceFilter('above2000')}
            >
              Above K2000
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="content-area">
          <div className="listings-grid">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="card"
                onMouseEnter={() => setHoveredItem(listing.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="card-image"
                />
                <div className="card-content">
                  <h3 className="card-title">{listing.title}</h3>
                  <p className="card-location">{listing.location}</p>
                  <p className="card-price">{listing.price}</p>
                  <button
                    className="card-button"
                    onClick={() => handleViewDetails(listing)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="footer">
          <p>&copy; 2025 ZIT AccommoHub. All rights reserved.</p>
        </footer>

        {/* Mobile menu button - Update this section */}
<div className="hamburger" onClick={toggleMobileMenu}>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ display: 'block' }} // Add this line
  >
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
</div>

{/* Mobile menu - Add this right after the header */}
<div className={`mobile-backdrop ${mobileMenuOpen ? 'open' : ''}`} onClick={toggleMobileMenu} />
<div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
  <div className="mobile-menu-header">
    <div className="logo">ZIT AccommoHub</div>
    <button className="close-button" onClick={toggleMobileMenu}>×</button>
  </div>
  <div className="mobile-menu-content">
    <div className="mobile-menu-section">
      <div className="mobile-menu-item" onClick={toggleMobileMenu}>Home</div>
      <div className="mobile-menu-item" onClick={toggleMobileMenu}>My Bookings</div>
      <div className="mobile-menu-item" onClick={toggleMobileMenu}>Saved Listings</div>
    </div>
  </div>
</div>
        {/* Details Modal */}
        {showDetailModal && selectedListing && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{selectedListing.title}</h2>
                <button className="close-button" onClick={() => setShowDetailModal(false)}>×</button>
              </div>
              <div className="modal-content">
                <img
                  src={selectedListing.image}
                  alt={selectedListing.title}
                  className="detail-image"
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>{selectedListing.price}</h3>
                  <span className={`availability-tag ${selectedListing.available ? 'available' : 'unavailable'}`}>
                    {selectedListing.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <p className="card-location">{selectedListing.location}</p>
                <p style={{ marginBottom: '1rem' }}>{selectedListing.description}</p>
                <div className="amenities-list">
                  {selectedListing.amenities.map((amenity, index) => (
                    <div key={index} className="amenity-tag">{amenity}</div>
                  ))}
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <h4>Contact Information</h4>
                  <p style={{ marginTop: '0.5rem' }}>
                    Landlord: ZIT Accommodations<br />
                    Phone: +260 97 123 4567<br />
                    Email: bookings@zitaccommohub.com
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="button button-secondary"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
                {selectedListing.available ? (
                  <button
                    className="button button-primary"
                    onClick={handleBookNow}
                  >
                    Book Now
                  </button>
                ) : (
                  <button className="button button-disabled" disabled>
                    Not Available
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StudentDashboard;