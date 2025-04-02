import { useState } from 'react';

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
  
  // State for notification banner
  const [showBanner, setShowBanner] = useState(true);

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
    },
    {
      id: 5,
      title: 'Jambo Student Flats',
      location: 'Jambo, 3 min to CBU',
      price: 'K1,650 / month',
      type: 'apartment',
      image: '/api/placeholder/300/200',
      description: 'Modern student apartments with high-speed internet and 24/7 security. Walking distance to campus.',
      amenities: ['High-speed internet', '24/7 Security', 'Study area', 'Furnished'],
      available: true
    },
    {
      id: 6,
      title: 'Riverside Executive Studio',
      location: 'Riverside, 8 min to CBU',
      price: 'K2,200 / month',
      type: 'single',
      image: '/api/placeholder/300/200',
      description: 'Upscale studio apartment with premium furnishings and private balcony.',
      amenities: ['Premium furnishings', 'Private balcony', 'AC', 'Gym access'],
      available: true
    },
    {
      id: 7,
      title: 'Ndeke Budget Rooms',
      location: 'Ndeke, 12 min to CBU',
      price: 'K950 / month',
      type: 'shared',
      image: '/api/placeholder/300/200',
      description: 'Economical shared rooms perfect for students on a budget. Basic amenities provided.',
      amenities: ['Basic furniture', 'Shared bathroom', 'Common kitchen'],
      available: true
    },
    {
      id: 8,
      title: 'Town Center Premium Apartment',
      location: 'Town Center, 15 min to CBU',
      price: 'K2,500 / month',
      type: 'apartment',
      image: '/api/placeholder/300/200',
      description: 'Luxury apartment in the heart of town with modern amenities and excellent views.',
      amenities: ['Modern kitchen', 'Spacious living room', 'Internet included', 'Parking'],
      available: false
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
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f9fafb;
            overflow-x: hidden;
            color: #1f2937;
            line-height: 1.5;
          }
          
          .container {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            width: 100%;
            max-width: 1900px;
            margin: 0 auto;
          }
          
          .header {
            padding: 1.25rem 1.5rem;
            background-color: #ffffff;
            border-bottom: 1px solid #e5e7eb;
            position: sticky;
            top: 0;
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }
          
          .logo {
            font-size: 1.25rem;
            font-weight: 700;
            color: #2c0072;
            letter-spacing: -0.025em;
          }
          
          .search-bar {
            display: flex;
            align-items: center;
            background-color: #f3f4f6;
            border-radius: 0.5rem;
            padding: 0.5rem 0.75rem;
            flex: 1;
            max-width: 600px;
            margin: 0 1.5rem;
            transition: all 0.2s ease;
          }
          
          .search-bar:focus-within {
            box-shadow: 0 0 0 2px rgba(44, 0, 114, 0.2);
          }
          
          .search-input {
            border: none;
            outline: none;
            background-color: transparent;
            width: 100%;
            font-size: 0.875rem;
            padding: 0.25rem 0.5rem;
            color: #1f2937;
          }
          
          .search-button {
            padding: 0.5rem 0.75rem;
            background-color: #2c0074;
            color: white;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            white-space: nowrap;
            transition: all 0.2s ease;
          }
          
          .search-button:hover {
            background-color: #220059;
          }
          
          .profile {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          
          .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #ddd6fe;
            overflow: hidden;
            border: 2px solid #f3f4f6;
          }
          
          .welcome-section {
            padding: 2rem 1.5rem;
            background-color: #ffffff;
            border-bottom: 1px solid #e5e7eb;
            background-image: linear-gradient(to right, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.8)), url('/api/placeholder/1200/300');
            background-size: cover;
            background-position: center;
          }
          
          .welcome-title {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
            color: #111827;
            letter-spacing: -0.025em;
            line-height: 1.2;
          }
          
          .welcome-subtitle {
            color: #4B5563;
            font-size: 1rem;
            max-width: 600px;
          }
          
          .filters-bar {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            padding: 1rem 1.5rem;
            background-color: #ffffff;
            border-bottom: 1px solid #e5e7eb;
            overflow-x: auto;
          }
          
          .filter-row {
            display: flex;
            gap: 0.75rem;
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 0.25rem;
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          .filter-row::-webkit-scrollbar {
            display: none;
          }
          
          .filter-item {
            padding: 0.5rem 0.75rem;
            border-radius: 0.375rem;
            cursor: pointer;
            white-space: nowrap;
            font-size: 0.875rem;
            transition: all 0.2s ease;
            user-select: none;
          }
          
          .filter-active {
            font-weight: 600;
            background-color: #2c0072;
            color: #ffffff;
          }
          
          .filter-inactive {
            background-color: #f3f4f6;
            color: #4B5563;
          }
          
          .filter-inactive:hover {
            background-color: #e5e7eb;
          }
          
          .content-area {
            padding: 1.5rem;
            flex: 1;
            background-color: #f9fafb;
          }
          
          .listings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
          }
          
          .card {
            background-color: #ffffff;
            border-radius: 0.75rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            height: 100%;
            border: 1px solid #f3f4f6;
          }
          
          .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          }
          
          .card-image {
            width: 100%;
            height: 180px;
            object-fit: cover;
            background-color: #e5e7eb;
          }
          
          .card-content {
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            flex: 1;
          }
          
          .card-title {
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #111827;
          }
          
          .card-location {
            font-size: 0.875rem;
            color: #2e0077;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
          }
          
          .card-location:before {
            content: '';
            display: inline-block;
            width: 14px;
            height: 14px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232e0077' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'%3E%3C/path%3E%3Ccircle cx='12' cy='10' r='3'%3E%3C/circle%3E%3C/svg%3E");
            background-size: contain;
            margin-right: 5px;
          }
          
          .card-price {
            font-size: 1.125rem;
            font-weight: 700;
            color: #111827;
            margin-bottom: 1rem;
          }
          
          .card-button {
            padding: 0.625rem;
            background-color: #280068;
            color: #ffffff;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            margin-top: auto;
            transition: background-color 0.2s ease;
          }
          
          .card-button:hover {
            background-color: #1c004b;
          }
          
          .footer {
            padding: 1.5rem;
            background-color: #ffffff;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 0.875rem;
          }
          
          .notification-icon {
            position: relative;
            cursor: pointer;
            margin-right: 1rem;
            color: #1f2937;
            width: 24px;
            height: 24px;
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
            font-weight: 600;
          }
          
          .notification-panel {
            position: absolute;
            top: 60px;
            right: 1rem;
            background-color: white;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            width: 320px;
            max-width: 90vw;
            z-index: 101;
            border: 1px solid #e5e7eb;
            overflow: hidden;
          }
          
          .notification-header {
            padding: 0.875rem 1rem;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #f9fafb;
          }
          
          .notification-header h3 {
            color: #111827 !important;
            font-size: 0.95rem;
            font-weight: 600;
          }
          
          .notification-list {
            max-height: 350px;
            overflow-y: auto;
          }
          
          .notification-item {
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
            cursor: pointer;
            transition: background-color 0.2s ease;
          }
          
          .notification-item:hover {
            background-color: #f9fafb;
          }
          
          .notification-read {
            background-color: #ffffff;
          }
          
          .notification-unread {
            background-color: #f3f4f6;
            position: relative;
          }
          
          .notification-unread:before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 70%;
            background-color: #2c0072;
            border-radius: 0 2px 2px 0;
          }
          
          .banner {
            background-color: #300082;
            color: white;
            padding: 0.875rem 1.5rem;
            text-align: center;
            position: relative;
            font-size: 0.875rem;
            font-weight: 500;
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
            opacity: 0.8;
            transition: opacity 0.2s ease;
          }
          
          .close-banner:hover {
            opacity: 1;
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
            padding: 1.5rem;
            animation: fadeIn 0.2s ease-out;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          
          .modal {
            background-color: white;
            border-radius: 0.75rem;
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            overflow: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            animation: slideUp 0.3s ease-out forwards;
          }
          
          .modal-header {
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            background-color: white;
            z-index: 10;
          }
          
          .modal-header h2 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }
          
          .close-button {
            background: transparent;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6B7280;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            transition: background-color 0.2s ease;
          }
          
          .close-button:hover {
            background-color: #f3f4f6;
            color: #111827;
          }
          
          .modal-content {
            padding: 1.5rem;
          }
          
          .modal-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            position: sticky;
            bottom: 0;
            background-color: white;
            z-index: 10;
          }
          
          .detail-image {
            width: 100%;
            height: auto;
            max-height: 300px;
            object-fit: cover;
            border-radius: 0.5rem;
            margin-bottom: 1.5rem;
          }
          
          .amenities-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.75rem;
          }
          
          .amenity-tag {
            padding: 0.25rem 0.625rem;
            background-color: #f3f4f6;
            border-radius: 9999px;
            font-size: 0.75rem;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .amenity-tag:before {
            content: '✓';
            color: #2c0072;
            font-weight: bold;
          }
          
          .availability-tag {
            display: inline-block;
            padding: 0.375rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
          }
          
          .available {
            background-color: #dcfce7;
            color: #0a5f2b;
          }
          
          .unavailable {
            background-color: #fee2e2;
            color: #991b1b;
          }
          
          .button {
            padding: 0.625rem 1.25rem;
            border-radius: 0.375rem;
            cursor: pointer;
            font-weight: 500;
            font-size: 0.875rem;
            transition: all 0.2s ease;
          }
          
          .button-primary {
            background-color: #280068;
            color: white;
            border: none;
          }
          
          .button-primary:hover {
            background-color: #1c004b;
          }
          
          .button-secondary {
            background-color: #f3f4f6;
            color: #1f2937;
            border: 1px solid #e5e7eb;
          }
          
          .button-secondary:hover {
            background-color: #e5e7eb;
          }
          
          .button-disabled {
            background-color: #9ca3af;
            color: white;
            border: none;
            cursor: not-allowed;
            opacity: 0.7;
          }
          
          .hamburger {
            display: block;
            cursor: pointer;
            padding: 8px;
            z-index: 1000;
            position: relative;
          }
          
          .hamburger svg {
            width: 24px;
            height: 24px;
            stroke: #2a006e;
            display: block;
            visibility: visible;
          }
          
          .mobile-menu {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            background-color: #ffffff;
            width: 80%;
            max-width: 300px;
            z-index: 2000;
            transform: translateX(-100%);
            transition: transform 0.3s ease-in-out;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
            overflow-y: auto;
            display: flex;
            flex-direction: column;
          }
          
          .mobile-menu.open {
            transform: translateX(0);
          }
          
          .mobile-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1999;
            display: none;
          }
          
          .mobile-backdrop.open {
            display: block;
          }
          
          .mobile-menu-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.25rem;
            border-bottom: 1px solid #e5e7eb;
            background-color: #f9fafb;
          }
          
          .mobile-menu-content {
            padding: 1rem;
            flex: 1;
          }
          
          .mobile-menu-section {
            margin-bottom: 1.5rem;
          }
          
          .mobile-menu-item {
            padding: 0.875rem 0.5rem;
            border-bottom: 1px solid #e5e7eb;
            font-size: 1rem;
            color: #1f2937;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            transition: background-color 0.2s ease;
          }
          
          .mobile-menu-item:hover {
            background-color: #f3f4f6;
          }
          
          .hide-xs, .hide-sm, .show-md {
            display: none;
          }
          
          .show-xs {
            display: block;
          }
          
          .no-results {
            text-align: center;
            padding: 2rem;
            font-size: 1rem;
            color: #6b7280;
            width: 100%;
            grid-column: 1 / -1;
          }
          
          .section-heading {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #f3f4f6;
            color: #111827;
          }
          
          /* Responsive breakpoints */
          @media (min-width: 640px) {
            .header {
              padding: 1rem 2rem;
            }
            
            .content-area {
              padding: 1.5rem 2rem;
            }
            
            .welcome-section {
              padding: 2.5rem 2rem;
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
            
            .welcome-title {
              font-size: 2.25rem;
            }
          }
          
          @media (min-width: 1024px) {
            .listings-grid {
              grid-template-columns: repeat(4, 1fr);
            }
            
            .show-md {
              display: block;
            }
          }
          
          @media (min-width: 1280px) {
            .container {
              padding: 0 2rem;
            }
            
            .welcome-section {
              padding: 3rem 2rem;
            }
            
            .listings-grid {
              grid-template-columns: repeat(4, 1fr);
              gap: 2rem;
            }
          }
        `}
      </style>

      {/* Main container */}
      <div className="container">
        {/* Top banner */}
        {showBanner && (
          <div className="banner">
            Welcome To CBU Student Housing! Find Your Perfect Accommodation For This new Acadeic Year.
            <button onClick={() => setShowBanner(false)} className="close-banner">×</button>
          </div>
        )}

        {/* Header */}
        <header className="header">
          <div className="hamburger" onClick={toggleMobileMenu}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </div>

          <div className="logo">ZIT AccomHub</div>

          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search by location or property name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="search-button" onClick={handleSearch}>Search</button>
          </div>

          <div className="profile">
            <div className="notification-icon" onClick={() => setShowNotifications(!showNotifications)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </div>

            <div className="avatar">
              <img src="/api/placeholder/40/40" alt="Profile" />
            </div>
          </div>

          {/* Notification panel */}
          {showNotifications && (
            <div className="notification-panel">
              <div className="notification-header">
                <h3>Notifications</h3>
                <button className="button button-secondary" onClick={markAllAsRead}>
                  Mark all read
                </button>
              </div>

              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item ${notification.read ? 'notification-read' : 'notification-unread'}`}
                      onClick={() => {
                        setNotifications(notifications.map(
                          n => n.id === notification.id ? { ...n, read: true } : n
                        ));
                      }}
                    >
                      <div>{notification.message}</div>
                    </div>
                  ))
                ) : (
                  <div className="notification-item">
                    No notifications to display.
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Welcome section */}
        <section className="welcome-section">
          <h1 className="welcome-title">Find Your Perfect Student Accommodation</h1>
          <p className="welcome-subtitle">
            Discover the best boarding houses, apartments, and shared accommodation options near Copperbelt University.
          </p>
        </section>

        {/* Filters */}
        <div className="filters-bar">
          <div className="filter-row">
            <span className="filter-item filter-inactive">Property type:</span>
            <span
              className={`filter-item ${typeFilter === 'all' ? 'filter-active' : 'filter-inactive'}`}
              onClick={() => setTypeFilter('all')}
            >
              All Properties
            </span>
            <span
              className={`filter-item ${typeFilter === 'apartment' ? 'filter-active' : 'filter-inactive'}`}
              onClick={() => setTypeFilter('apartment')}
            >
              Apartments
            </span>
            <span
              className={`filter-item ${typeFilter === 'shared' ? 'filter-active' : 'filter-inactive'}`}
              onClick={() => setTypeFilter('shared')}
            >
              Shared Rooms
            </span>
            <span
              className={`filter-item ${typeFilter === 'single' ? 'filter-active' : 'filter-inactive'}`}
              onClick={() => setTypeFilter('single')}
            >
              Single Rooms
            </span>
          </div>

          <div className="filter-row">
            <span className="filter-item filter-inactive">Price range:</span>
            <span
              className={`filter-item ${priceFilter === 'all' ? 'filter-active' : 'filter-inactive'}`}
              onClick={() => setPriceFilter('all')}
            >
              All Prices
            </span>
            <span
              className={`filter-item ${priceFilter === 'under1500' ? 'filter-active' : 'filter-inactive'}`}
              onClick={() => setPriceFilter('under1500')}
            >
              Under K1,500
            </span>
            <span
              className={`filter-item ${priceFilter === '1500to2000' ? 'filter-active' : 'filter-inactive'}`}
              onClick={() => setPriceFilter('1500to2000')}
            >
              K1,500 - K2,000
            </span>
            <span
              className={`filter-item ${priceFilter === 'above2000' ? 'filter-active' : 'filter-inactive'}`}
              onClick={() => setPriceFilter('above2000')}
            >
              Above K2,000
            </span>
          </div>
        </div>

        {/* Main content area */}
        <main className="content-area">
          <h2 className="section-heading">Available Properties ({filteredListings.length})</h2>

          <div className="listings-grid">
            {filteredListings.length > 0 ? (
              filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="card"
                  onMouseEnter={() => setHoveredItem(listing.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleViewDetails(listing)}
                >
                  <img src={listing.image} alt={listing.title} className="card-image" />
                  <div className="card-content">
                    <h3 className="card-title">{listing.title}</h3>
                    <p className="card-location">{listing.location}</p>
                    <p className="card-price">{listing.price}</p>
                    <button className="card-button">View Details</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                No properties match your current filters. Try adjusting your search criteria.
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="footer">
          <p>© {new Date().getFullYear()} CBU Student Housing Portal | All Rights Reserved</p>
        </footer>

        {/* Mobile menu */}
        <div className={`mobile-backdrop ${mobileMenuOpen ? 'open' : ''}`} onClick={toggleMobileMenu}></div>
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-header">
            <div className="logo">CBU Housing</div>
            <button className="close-button" onClick={toggleMobileMenu}>×</button>
          </div>
          <div className="mobile-menu-content">
            <div className="mobile-menu-section">
              <h3 className="section-heading">Menu</h3>
              <div className="mobile-menu-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Home
              </div>
              <div className="mobile-menu-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Browse Listings
              </div>
              <div className="mobile-menu-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Help & Support
              </div>
              <div className="mobile-menu-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                Settings
              </div>
            </div>
          </div>
        </div>

        {/* Detail modal */}
        {showDetailModal && selectedListing && (
          <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedListing.title}</h2>
                <button className="close-button" onClick={() => setShowDetailModal(false)}>×</button>
              </div>
              <div className="modal-content">
                <img src={selectedListing.image} alt={selectedListing.title} className="detail-image" />
                
                <p className="card-location">{selectedListing.location}</p>
                <p className="card-price">{selectedListing.price}</p>
                
                <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                  <span className={`availability-tag ${selectedListing.available ? 'available' : 'unavailable'}`}>
                    {selectedListing.available ? 'Available Now' : 'Currently Unavailable'}
                  </span>
                </div>
                
                <p style={{ marginBottom: '1.5rem' }}>{selectedListing.description}</p>
                
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Amenities</h3>
                <div className="amenities-list">
                  {selectedListing.amenities.map((amenity, index) => (
                    <span key={index} className="amenity-tag">{amenity}</span>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="button button-secondary" onClick={() => setShowDetailModal(false)}>
                  Close
                </button>
                {selectedListing.available ? (
                  <button className="button button-primary" onClick={handleBookNow}>
                    Book Now
                  </button>
                ) : (
                  <button className="button button-disabled" disabled>
                    Unavailable
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