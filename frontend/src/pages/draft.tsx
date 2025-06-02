import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './bootstrap-5.3.5-dist/css/bootstrap.min.css';
import './bootstrap-5.3.5-dist/js/bootstrap.bundle.min.js';


const StudentDashboard: React.FC = () => {
  // For hover effect on listing cards
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  // For type filter: "all", "apartment", "shared", "single"
  const [typeFilter, setTypeFilter] = useState('all');

  // For price filter: "all", "under1500", "1500to2000", "above2000"
  const [priceFilter, setPriceFilter] = useState('all');

  // For search text
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  
  // For notification display
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New listings added in Riverside area!", read: false },
    { id: 2, message: "Your inquiry for Parklands Hostel was received!", read: false }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // For detail view modal
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // State for notification banner
  const [showBanner, setShowBanner] = useState(true);


  // State for inquiry form
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  // For view mode switching
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Color theme state
  const [activeTheme, setActiveTheme] = useState<keyof typeof THEMES>('purple');

  // API data state
  const [propertiesData, setPropertiesData] = useState<FormattedProperty[]>(() => []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  


  // Color schemes
  const THEMES = {
    // Original Themes
    purple: {
      PRIMARY: "rgb(41, 7, 151)",
      PRIMARY_DARK: "rgb(46, 7, 155)",
      PRIMARY_LIGHT: "rgba(88, 43, 232, 0.1)",
      PRIMARY_MEDIUM: "rgba(36, 4, 139, 0.3)",
      GRADIENT: "linear-gradient(45deg, rgb(36, 5, 136) 0%, rgb(37, 1, 148) 100%)",
      SECONDARY: "#F5F3FF",
      ACCENT: "#9061FF"
    },
    teal: {
      PRIMARY: "rgb(20, 184, 166)",
      PRIMARY_DARK: "rgb(13, 148, 136)",
      PRIMARY_LIGHT: "rgba(20, 184, 166, 0.1)",
      PRIMARY_MEDIUM: "rgba(20, 184, 166, 0.3)",
      GRADIENT: "linear-gradient(45deg, rgb(13, 148, 136) 0%, rgb(20, 184, 166) 100%)",
      SECONDARY: "#E6FFFA",
      ACCENT: "#06B6D4"
    },
    indigo: {
      PRIMARY: "rgb(67, 56, 202)",
      PRIMARY_DARK: "rgb(49, 46, 129)",
      PRIMARY_LIGHT: "rgba(67, 56, 202, 0.1)",
      PRIMARY_MEDIUM: "rgba(67, 56, 202, 0.3)",
      GRADIENT: "linear-gradient(45deg, rgb(49, 46, 129) 0%, rgb(79, 70, 229) 100%)",
      SECONDARY: "#EEF2FF",
      ACCENT: "#6366F1"
    }

  };

  // Container style - move outside component
  const containerStyle = {
    maxWidth: '1800px',
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    padding: '0 15px'
  } as const;

  // Get active color scheme
  const COLORS = THEMES[activeTheme as keyof typeof THEMES];

  // Utility function to handle image URLs and placeholders
  const getImageUrl = (imageUrl: string | undefined, dimensions: { width: number, height: number } = { width: 400, height: 300 }): string => {
    if (!imageUrl) {
      // Return a local placeholder image or a placeholder service URL
      return `/placeholder-${dimensions.width}-${dimensions.height}.jpg`;
    }

    if (imageUrl.startsWith('data:image')) {
      try {
        return base64ToBlobUrl(imageUrl);
      } catch (error) {
        console.error('Error converting base64 image:', error);
        return `/placeholder-${dimensions.width}-${dimensions.height}.jpg`;
      }
    }

    return imageUrl;
  };

  // Fetch properties data from API with enhanced error handling

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/PropertyListingRoute/propertyListing/student-view', {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // Handle both array and object responses
        const propertiesArray = Array.isArray(data) ? data :
          (data.data?.properties ? data.data.properties : []);

        // Format properties and handle images
        const formattedProperties = propertiesArray.map(property =>
          formatPropertyData(property)
        ).filter(Boolean) as FormattedProperty[];

        setPropertiesData(formattedProperties);
        setError(null);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch properties');

        // Set empty array to prevent rendering errors
        setPropertiesData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();

    // Cleanup function
    return () => {
      propertiesData.forEach(property => {
        property.images?.forEach(img => {
          if (img.startsWith('blob:')) {
            URL.revokeObjectURL(img);
          }
        });
      });
    };
  }, []);

  // Enhanced property interfaces
  interface Property {
    propertyId: number;
    title?: string;
    address?: string;
    monthlyRent?: number;
    propertyType?: string;
    images?: string[];
    description?: string;
    isAvailable?: boolean;
    landlord?: {
      landlordId?: number;
      name?: string;
      email?: string;
      phoneNumber?: string;
      responseRate?: number;
      responseTime?: string;
      imageUrl?: string;
    } | string;
    details?: {
      amenities?: string[];
      bedrooms?: number;
      bathrooms?: number;
      squareMeters?: number;
    };
    latitude?: number | string;
    longitude?: number | string;
  }

  interface FormattedProperty {
    id: number;
    title: string;
    location: string;
    price: string;
    type: string;
    image: string;
    images: string[];
    description: string;
    amenities: string[];
    available: boolean;
    featured: boolean;
    rating: number;
    landlord: {
      name: string;
      email?: string;
      phoneNumber?: string;
      responseRate?: number;
      responseTime?: string;
      image?: string;
    };
    details: Record<string, any>;
    bedrooms?: number;
    bathrooms?: number;
    size?: number;
    coordinates?: { lat: number, lng: number };
  }
  // Enhanced property data formatter

  const formatPropertyData = (property: Property): FormattedProperty | null => {
    if (!property || typeof property !== 'object') return null;

    // Process images - handle both string URLs and image objects
    const processedImages = (property.images || []).map(img => {
      const imgUrl = typeof img === 'string' ? img : (img as any).imageUrl;
      return getImageUrl(imgUrl);
    });

    // Get main image (try to find primary or use first)
    const primaryImage = property.images?.find(img =>
      typeof img !== 'string' && (img as any).isPrimary
    );
    const mainImage = primaryImage
      ? getImageUrl(typeof primaryImage === 'string' ? primaryImage : (primaryImage as any).imageUrl)
      : processedImages[0] || getImageUrl(undefined);

    // Format property type
    const propertyType = (property.propertyType || '').toLowerCase();
    let formattedType = 'other';
    if (propertyType.includes('apartment')) formattedType = 'apartment';
    else if (propertyType.includes('shared')) formattedType = 'shared';
    else if (propertyType.includes('single')) formattedType = 'single';

    // Process landlord data
    let landlord: {
      name: string;
      email?: string;
      phoneNumber?: string;
      responseRate?: number;
      responseTime?: string;
      id?: number;
      image?: string;
    } = {
      name: 'Unknown'
    };

    if (typeof property.landlord === 'string') {
      landlord.name = property.landlord;
    } else if (property.landlord && typeof property.landlord === 'object') {
      landlord = {
        name: property.landlord.name || 'Unknown',
        email: property.landlord.email,
        phoneNumber: property.landlord.phoneNumber,
        responseRate: property.landlord.responseRate,
        responseTime: property.landlord.responseTime,
        id: property.landlord.landlordId,
        image: property.landlord.imageUrl
      };
    }

    // Format coordinates
    let coordinates: { lat: number, lng: number } | undefined;
    if (property.latitude && property.longitude) {
      const lat = typeof property.latitude === 'string' ? parseFloat(property.latitude) : property.latitude;
      const lng = typeof property.longitude === 'string' ? parseFloat(property.longitude) : property.longitude;
      if (!isNaN(lat) && !isNaN(lng)) {
        coordinates = { lat, lng };
      }
    }

    // Make sure to properly handle address and monthlyRent
    // For address, use direct property access with fallback
    const propertyAddress = property.address || 'Location not specified';

    // For monthlyRent, handle both string and number types
    let monthlyRent = 0;
    if (property.monthlyRent !== undefined && property.monthlyRent !== null) {
      monthlyRent = typeof property.monthlyRent === 'string'
        ? parseFloat(property.monthlyRent)
        : property.monthlyRent;
    }

    return {
      id: property.propertyId,
      title: property.title || 'Unnamed Property',
      location: propertyAddress, // Use the extracted address
      price: `K${monthlyRent.toLocaleString()} / month`, // Use the extracted monthlyRent
      type: formattedType,
      image: mainImage,
      images: processedImages,
      description: property.description || 'No description provided.',
      amenities: property.details?.amenities || [],
      bedrooms: property.details?.bedrooms,
      bathrooms: property.details?.bathrooms,
      size: property.details?.squareMeters,
      available: property.isAvailable ?? true,
      featured: false,
      rating: 4.0,
      landlord: landlord, // Now returns the full landlord object
      coordinates,
      details: property.details || {}
    };
  };



  const allListings = propertiesData;  
  const formatPrice = (amount: number) => {
    return `K${amount.toLocaleString()} / month`;
  };

  // Helper to extract numeric price from formatted string
  const getNumericPrice = (priceString: string) => {
    if (!priceString) return 0;
    const numeric = priceString.replace(/[^\d]/g, ''); // Remove all non-digit characters
    return parseInt(numeric, 10) || 0;
  };

  // Filter logic
  const filteredListings = allListings.filter((listing) => {
    // Skip if listing is invalid
    if (!listing) return false;

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
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const inTitle = listing.title?.toLowerCase().includes(searchLower);
      const inLocation = listing.location?.toLowerCase().includes(searchLower);
      if (!inTitle && !inLocation) {
        return false;
      }
    }

    return true;
  });

  // Handle view details click
  interface Listing {
    id: number;
    title: string;
    location: string;
    price: string;
    type: string;
    image: string;
    images: string[];
    description: string;
    amenities: string[];
    available: boolean;
    featured: boolean;
    rating: number;
    bedrooms?: number;
    bathrooms?: number;
    size?: number;
    landlord: {
      name: string;
      email?: string;
      phoneNumber?: string;
      responseRate?: number;
      responseTime?: string;
      image?: string;
    };
    details: Record<string, any>;
  }

 
const handleViewDetails = (listing: Listing) => {
  navigate('/PropertyDetailsPage', { 
    state: { 
      propertyId: listing.id 
    } 
  });
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
    
  };

  // Star rating component
  const StarRating = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<i key={i} className="bi bi-star-fill text-warning"></i>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<i key={i} className="bi bi-star-half text-warning"></i>);
      } else {
        stars.push(<i key={i} className="bi bi-star text-warning"></i>);
      }
    }

    return <div className="d-flex">{stars} <span className="ms-1 small">({rating})</span></div>;
  };

  // Render grid view card
  const renderGridCard = (listing: Listing) => (
    <div
      className="card h-100 border-0 shadow-sm overflow-hidden"
      onMouseEnter={() => setHoveredItem(listing.id)}
      onMouseLeave={() => setHoveredItem(null)}
      style={{
        transform: hoveredItem === listing.id ? 'translateY(-5px)' : 'none',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'pointer',
        boxShadow: hoveredItem === listing.id ? '0 10px 20px rgba(0,0,0,0.1)' : ''
      }}
      onClick={() => handleViewDetails(listing)}
    >
      <div className="position-relative">
        <img
          src={listing.image}
          className="card-img-top"
          alt={listing.title}
          style={{ height: "200px", objectFit: "cover" }}
        />
        <span className={`position-absolute top-0 end-0 m-2 badge ${listing.available ? 'bg-success' : 'bg-danger'}`}>
          {listing.available ? 'Available' : 'Unavailable'}
        </span>
        {listing.featured && (
          <div className="position-absolute top-0 start-0 m-2 badge bg-warning text-dark">
            Featured
          </div>
        )}
      </div>
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between mb-2">
          <h5 className="card-title fw-bold mb-0">{listing.title}</h5>
          <div className="text-end">
            <button className="btn btn-sm btn-link p-0 border-0">
              <i className="bi bi-bookmark"></i>
            </button>
          </div>
        </div>
        <p className="card-text mb-2 small d-flex align-items-center" style={{ color: COLORS.PRIMARY }}>
          <i className="bi bi-geo-alt me-1"></i> {listing.location}
        </p>
        <div className="mb-2">
          <StarRating rating={listing.rating} />
        </div>
        <p className="card-text fw-bold mb-3" style={{ color: COLORS.PRIMARY_DARK }}>{listing.price}</p>
        <div className="d-flex flex-wrap gap-1 mb-3">
          {listing.amenities.slice(0, 3).map((amenity, index) => (
            <span key={index} className="badge small"
              style={{ backgroundColor: COLORS.PRIMARY_LIGHT, color: COLORS.PRIMARY }}>
              {amenity}
            </span>
          ))}
          {listing.amenities.length > 3 && (
            <span className="badge small"
              style={{ backgroundColor: COLORS.PRIMARY_LIGHT, color: COLORS.PRIMARY }}>
              +{listing.amenities.length - 3} more
            </span>
          )}
        </div>
        <div className="d-flex mt-auto gap-2">
          <button
            className="btn flex-grow-1"
            style={{
              borderColor: COLORS.PRIMARY,
              color: COLORS.PRIMARY
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(listing);
            }}
          >
            Details
          </button>
          
        </div>
      </div>
    </div>
  );

  // Render list view card
  const renderListCard = (listing: Listing) => (
    <div
      className="card border-0 shadow-sm overflow-hidden mb-3"
      onMouseEnter={() => setHoveredItem(listing.id)}
      onMouseLeave={() => setHoveredItem(null)}
      style={{
        transform: hoveredItem === listing.id ? 'translateY(-3px)' : 'none',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'pointer',
        boxShadow: hoveredItem === listing.id ? '0 10px 20px rgba(0,0,0,0.1)' : ''
      }}
      onClick={() => handleViewDetails(listing)}
    >
      <div className="row g-0">
        <div className="col-md-4 col-lg-3 position-relative">
          <img
            src={listing.image}
            alt={listing.title}
            className="img-fluid h-100 w-100"
            style={{ objectFit: "cover" }}
          />
          <span className={`position-absolute top-0 end-0 m-2 badge ${listing.available ? 'bg-success' : 'bg-danger'}`}>
            {listing.available ? 'Available' : 'Unavailable'}
          </span>
          {listing.featured && (
            <div className="position-absolute top-0 start-0 m-2 badge bg-warning text-dark">
              Featured
            </div>
          )}
        </div>
        <div className="col-md-8 col-lg-9">
          <div className="card-body h-100 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h5 className="card-title fw-bold mb-1">{listing.title}</h5>
                <p className="card-text mb-1 small d-flex align-items-center" style={{ color: COLORS.PRIMARY }}>
                  <i className="bi bi-geo-alt me-1"></i> {listing.location}
                </p>
                <div className="mb-2">
                  <StarRating rating={listing.rating} />
                </div>
              </div>
              <p className="card-text fw-bold fs-5" style={{ color: COLORS.PRIMARY_DARK }}>{listing.price}</p>
            </div>

            <p className="card-text small mb-2 d-none d-lg-block">{listing.description.substring(0, 100)}...</p>

            <div className="d-flex flex-wrap gap-1 mb-3">
              {listing.amenities.map((amenity, index) => (
                <span key={index} className="badge small"
                  style={{ backgroundColor: COLORS.PRIMARY_LIGHT, color: COLORS.PRIMARY }}>
                  {amenity}
                </span>
              ))}
            </div>

            <div className="d-flex mt-auto gap-2">
              <button
                className="btn btn-sm"
                style={{
                  borderColor: COLORS.PRIMARY,
                  color: COLORS.PRIMARY
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(listing);
                }}
              >
                View Details
              </button>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border" role="status" style={{ color: THEMES[activeTheme].PRIMARY }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid" >
      {/* Top alert banner */}
      {showBanner && (
        <div className="alert fade show m-0 rounded-0 text-center"
          role="alert"
          style={{ backgroundColor: COLORS.PRIMARY_LIGHT, color: COLORS.PRIMARY }}>
          <strong>Welcome To CBU Student Housing!</strong> Find Your Perfect Accommodation For This New Academic Year.
          <button type="button" className="btn-close" onClick={() => setShowBanner(false)} aria-label="Close"></button>
        </div>
      )}

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark shadow-sm sticky-top" style={{ backgroundColor: COLORS.PRIMARY }}>
        <div className="container" style={containerStyle}>
          <button
            className="navbar-toggler border-0"
            type="button"
            onClick={toggleMobileMenu}
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <a className="navbar-brand fw-bold d-flex align-items-center" href="#">
            <i className="bi bi-house-door-fill me-2"></i>
            ZIT AccomHub
          </a>

          <div className="d-none d-lg-flex flex-grow-1 mx-lg-4">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search by location or property name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="btn text-white" type="button" onClick={handleSearch}
                style={{ backgroundColor: COLORS.PRIMARY_DARK }}>
                <i className="bi bi-search me-1"></i>
                Search
              </button>
            </div>
          </div>

          <div className="d-flex align-items-center">
            {/* Theme selector dropdown */}
            <div className="dropdown me-3 d-none d-md-block">
              <button
                className="btn text-white dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ backgroundColor: 'transparent' }}
              >
                <i className="bi bi-palette-fill me-1"></i>
                Theme
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                {/* Original Themes */}
                <li><h6 className="dropdown-header">Classic</h6></li>
                <li><button className="dropdown-item" onClick={() => setActiveTheme('purple')}>Purple</button></li>
                <li><button className="dropdown-item" onClick={() => setActiveTheme('teal')}>Teal</button></li>
                <li><button className="dropdown-item" onClick={() => setActiveTheme('indigo')}>Indigo</button></li>

              </ul>
            </div>

            <div className="position-relative me-3 cursor-pointer text-white" onClick={() => setShowNotifications(!showNotifications)}>
              <i className="bi bi-bell fs-5"></i>
              {unreadCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="d-flex align-items-center">
              <div className="dropdown">
                <div className="rounded-circle bg-white overflow-hidden border" style={{ width: "40px", height: "40px" }} role="button" data-bs-toggle="dropdown">
                  <img src="/api/placeholder/40/40" alt="Profile" className="w-100 h-100" />
                </div>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><a className="dropdown-item" href="#"><i className="bi bi-person me-2"></i>My Profile</a></li>
                  <li><a className="dropdown-item" href="#"><i className="bi bi-bookmark me-2"></i>Saved Listings</a></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><a className="dropdown-item" href="#"><i className="bi bi-box-arrow-right me-2"></i>Sign Out</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile search for small screens */}
      <div className="d-lg-none bg-white p-2 border-bottom shadow-sm">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Search accommodations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn text-white" type="button" onClick={handleSearch}
            style={{ backgroundColor: COLORS.PRIMARY }}>
            <i className="bi bi-search"></i>
          </button>
        </div>
      </div>

      {/* Notification dropdown */}
      {showNotifications && (
        <div className="position-absolute end-0 mt-1 me-3 shadow-lg bg-white rounded-3 border overflow-hidden" style={{ width: "320px", maxWidth: "90vw", zIndex: "1000", top: "55px" }}>
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{ backgroundColor: COLORS.SECONDARY }}>
            <h6 className="fw-bold m-0">Notifications</h6>
            {unreadCount > 0 && (
              <button
                className="btn btn-sm"
                onClick={markAllAsRead}
                style={{ color: COLORS.PRIMARY, borderColor: COLORS.PRIMARY }}
              >
                Mark all read
              </button>
            )}
          </div>
          <div style={{ maxHeight: "350px", overflowY: "auto" }}>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-bottom ${notification.read ? 'bg-white' : COLORS.PRIMARY_LIGHT}`}
                  onClick={() => {
                    setNotifications(notifications.map(
                      n => n.id === notification.id ? { ...n, read: true } : n
                    ));
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="d-flex">
                    {!notification.read && (
                      <div className="rounded-circle me-2 mt-1" style={{ width: "8px", height: "8px", backgroundColor: COLORS.PRIMARY }}></div>
                    )}
                    <div>{notification.message}</div>
                  </div>
                  <div className="small text-muted mt-1">Just now</div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-muted">
                <i className="bi bi-bell-slash fs-4 mb-2 d-block"></i>
                No notifications to display
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile menu */}
      <div className={`offcanvas offcanvas-start ${mobileMenuOpen ? 'show' : ''}`} tabIndex={-1} id="mobileMenu">
        <div className="offcanvas-header" style={{ backgroundColor: COLORS.PRIMARY, color: 'white' }}>
          <h5 className="offcanvas-title fw-bold d-flex align-items-center">
            <i className="bi bi-house-door-fill me-2"></i>
            ZIT AccomHub
          </h5>
          <button type="button" className="btn-close btn-close-white" onClick={toggleMobileMenu}></button>
        </div>
        <div className="offcanvas-body p-0">
          <div className="p-3">
            <div className="d-flex align-items-center mb-3">
              <div className="rounded-circle bg-light overflow-hidden border me-3" style={{ width: "48px", height: "48px" }}>
                <img src="/api/placeholder/48/48" alt="Profile" className="w-100 h-100" />
              </div>
              <div>
                <p className="fw-bold mb-0">Dear Student</p>
                <p className="text-muted small mb-0">Student at CBU</p>
              </div>
            </div>
          </div>

          <div className="list-group list-group-flush">
            <a href="#" className="list-group-item list-group-item-action active" style={{ backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY }}>
              <i className="bi bi-house me-2"></i> Home
            </a>
            <a href="#" className="list-group-item list-group-item-action">
              <i className="bi bi-search me-2"></i> Browse Listings
            </a>
            <a href="#" className="list-group-item list-group-item-action">
              <i className="bi bi-bookmark me-2"></i> Saved Properties
            </a>
            <a href="#" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <span><i className="bi bi-bell me-2"></i> Notifications</span>
              {unreadCount > 0 && <span className="badge bg-danger rounded-pill">{unreadCount}</span>}
            </a>
            <a href="#" className="list-group-item list-group-item-action">
              <i className="bi bi-question-circle me-2"></i> Help & Support
            </a>
          </div>

          <div className="list-group list-group-flush">
            <a href="#" className="list-group-item list-group-item-action active" style={{ backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY }}>
              <i className="bi bi-house me-2"></i> Home
            </a>
            <a href="#" className="list-group-item list-group-item-action">
              <i className="bi bi-search me-2"></i> Browse Listings
            </a>
            <a href="#" className="list-group-item list-group-item-action">
              <i className="bi bi-bookmark me-2"></i> Saved Properties
            </a>
            <a href="#" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <span><i className="bi bi-bell me-2"></i> Notifications</span>
              {unreadCount > 0 && <span className="badge bg-danger rounded-pill">{unreadCount}</span>}
            </a>
            <a href="#" className="list-group-item list-group-item-action">
              <i className="bi bi-question-circle me-2"></i> Help & Support
            </a>
          </div>

          <hr />

          <div className="p-3">
            <p className="fw-bold mb-2">Theme Selection</p>
            <div className="d-flex gap-2 mb-4">
              <button
                className={`btn btn-sm ${activeTheme === 'purple' ? 'active' : ''}`}
                style={{
                  backgroundColor: activeTheme === 'purple' ? THEMES.purple.PRIMARY : 'white',
                  color: activeTheme === 'purple' ? 'white' : THEMES.purple.PRIMARY,
                  borderColor: THEMES.purple.PRIMARY
                }}
                onClick={() => setActiveTheme('purple')}
              >
                Purple
              </button>
              <button
                className={`btn btn-sm ${activeTheme === 'teal' ? 'active' : ''}`}
                style={{
                  backgroundColor: activeTheme === 'teal' ? THEMES.teal.PRIMARY : 'white',
                  color: activeTheme === 'teal' ? 'white' : THEMES.teal.PRIMARY,
                  borderColor: THEMES.teal.PRIMARY
                }}
                onClick={() => setActiveTheme('teal')}
              >
                Teal
              </button>
              <button
                className={`btn btn-sm ${activeTheme === 'indigo' ? 'active' : ''}`}
                style={{
                  backgroundColor: activeTheme === 'indigo' ? THEMES.indigo.PRIMARY : 'white',
                  color: activeTheme === 'indigo' ? 'white' : THEMES.indigo.PRIMARY,
                  borderColor: THEMES.indigo.PRIMARY
                }}
                onClick={() => setActiveTheme('indigo')}
                title="Indigo"
              ></button>
            </div>

            <button className="btn w-100 text-white" style={{ backgroundColor: COLORS.PRIMARY }} onClick={toggleMobileMenu}>
              <i className="bi bi-box-arrow-right me-2"></i> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container py-4" style={containerStyle}>
        {/* Page header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h1 className="h3 mb-0 fw-bold" style={{ color: COLORS.PRIMARY_DARK }}>Student Accommodations</h1>
            <p className="text-muted mb-0">Find and book your perfect student housing</p>
          </div>

          <div className="d-flex gap-2">
            {/* View switcher */}
            <div className="btn-group d-none d-md-flex">
              <button
                className={`btn ${viewMode === 'grid' ? 'active' : ''}`}
                style={{
                  backgroundColor: viewMode === 'grid' ? COLORS.PRIMARY : 'white',
                  color: viewMode === 'grid' ? 'white' : COLORS.PRIMARY,
                  borderColor: COLORS.PRIMARY
                }}
                onClick={() => setViewMode('grid')}
              >
                <i className="bi bi-grid-3x3-gap-fill me-1"></i> Grid
              </button>
              <button
                className={`btn ${viewMode === 'list' ? 'active' : ''}`}
                style={{
                  backgroundColor: viewMode === 'list' ? COLORS.PRIMARY : 'white',
                  color: viewMode === 'list' ? 'white' : COLORS.PRIMARY,
                  borderColor: COLORS.PRIMARY
                }}
                onClick={() => setViewMode('list')}
              >
                <i className="bi bi-list-ul me-1"></i> List
              </button>
            </div>

            {/* Filter dropdown */}
            <div className="dropdown">
              <button
                className="btn dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ borderColor: COLORS.PRIMARY, color: COLORS.PRIMARY }}
              >
                <i className="bi bi-funnel-fill me-1"></i>
                Filters
              </button>
              <div className="dropdown-menu dropdown-menu-end p-3" style={{ width: "250px" }}>
                <h6 className="fw-bold mb-2">Property Type</h6>
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="typeFilter"
                      id="typeAll"
                      checked={typeFilter === 'all'}
                      onChange={() => setTypeFilter('all')}
                    />
                    <label className="form-check-label" htmlFor="typeAll">All Types</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="typeFilter"
                      id="typeApartment"
                      checked={typeFilter === 'apartment'}
                      onChange={() => setTypeFilter('apartment')}
                    />
                    <label className="form-check-label" htmlFor="typeApartment">Apartments</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="typeFilter"
                      id="typeShared"
                      checked={typeFilter === 'shared'}
                      onChange={() => setTypeFilter('shared')}
                    />
                    <label className="form-check-label" htmlFor="typeShared">Shared Accommodation</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="typeFilter"
                      id="typeSingle"
                      checked={typeFilter === 'single'}
                      onChange={() => setTypeFilter('single')}
                    />
                    <label className="form-check-label" htmlFor="typeSingle">Single Rooms</label>
                  </div>
                </div>

                <h6 className="fw-bold mb-2">Price Range</h6>
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="priceFilter"
                      id="priceAll"
                      checked={priceFilter === 'all'}
                      onChange={() => setPriceFilter('all')}
                    />
                    <label className="form-check-label" htmlFor="priceAll">All Prices</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="priceFilter"
                      id="priceUnder1500"
                      checked={priceFilter === 'under1500'}
                      onChange={() => setPriceFilter('under1500')}
                    />
                    <label className="form-check-label" htmlFor="priceUnder1500">Under K1,500</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="priceFilter"
                      id="price1500to2000"
                      checked={priceFilter === '1500to2000'}
                      onChange={() => setPriceFilter('1500to2000')}
                    />
                    <label className="form-check-label" htmlFor="price1500to2000">K1,500 - K2,000</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="priceFilter"
                      id="priceAbove2000"
                      checked={priceFilter === 'above2000'}
                      onChange={() => setPriceFilter('above2000')}
                    />
                    <label className="form-check-label" htmlFor="priceAbove2000">Above K2,000</label>
                  </div>
                </div>

                <button
                  className="btn btn-sm w-100 text-white"
                  style={{ backgroundColor: COLORS.PRIMARY }}
                  onClick={() => {
                    
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        {(typeFilter !== 'all' || priceFilter !== 'all' || searchTerm) && (
          <div className="d-flex flex-wrap gap-2 mb-3">
            {typeFilter !== 'all' && (
              <div className="badge bg-light text-dark border px-3 py-2 d-flex align-items-center">
                <span>Type: {typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}</span>
                <button type="button" className="btn-close ms-2" aria-label="Close" onClick={() => setTypeFilter('all')}></button>
              </div>
            )}

            {priceFilter !== 'all' && (
              <div className="badge bg-light text-dark border px-3 py-2 d-flex align-items-center">
                <span>
                  Price: {priceFilter === 'under1500' ? 'Under K1,500' :
                    priceFilter === '1500to2000' ? 'K1,500 - K2,000' :
                      'Above K2,000'}
                </span>
                <button type="button" className="btn-close ms-2" aria-label="Close" onClick={() => setPriceFilter('all')}></button>
              </div>
            )}

            {searchTerm && (
              <div className="badge bg-light text-dark border px-3 py-2 d-flex align-items-center">
                <span>Search: {searchTerm}</span>
                <button type="button" className="btn-close ms-2" aria-label="Close" onClick={() => setSearchTerm('')}></button>
              </div>
            )}

            <button
              className="badge bg-light text-dark border px-3 py-2 d-flex align-items-center"
              onClick={() => {
                setTypeFilter('all');
                setPriceFilter('all');
                setSearchTerm('');
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Results count */}
        <p className="text-muted mb-4">
          Showing {filteredListings.length} {filteredListings.length === 1 ? 'property' : 'properties'}
        </p>

        {/* No results */}
        {filteredListings.length === 0 && (
          <div className="text-center p-5 bg-white rounded shadow-sm">
            <i className="bi bi-search display-1 text-muted mb-3"></i>
            <h4>No Properties Found</h4>
            <p className="text-muted">Try adjusting your filters or search criteria.</p>
            <button
              className="btn"
              style={{ backgroundColor: COLORS.PRIMARY, color: 'white' }}
              onClick={() => {
                setTypeFilter('all');
                setPriceFilter('all');
                setSearchTerm('');
              }}
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Property listings - Grid view */}
        {viewMode === 'grid' && filteredListings.length > 0 && (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
            {filteredListings.map((listing) => (
              <div className="col" key={listing.id}>
                {renderGridCard(listing)}
              </div>
            ))}
          </div>
        )}

        {/* Property listings - List view */}
        {viewMode === 'list' && filteredListings.length > 0 && (
          <div className="d-flex flex-column gap-3">
            {filteredListings.map((listing) => (
              <div key={listing.id}>
                {renderListCard(listing)}
              </div>
            ))}
          </div>
        )}
      </div>

      

      {/* Footer */}
      <footer className="bg-dark text-white py-4 mt-5">
        <div className="container" style={containerStyle}>
          <div className="row">
            <div className="col-lg-4 mb-4 mb-lg-0">
              <h5 className="fw-bold mb-3">ZIT AccomHub</h5>
              <p className="small">Connecting students with quality accommodation solutions. Find your perfect home away from home with our comprehensive listing platform.</p>
              <div className="d-flex gap-3 mb-3">
                <a href="#" className="text-white"><i className="bi bi-facebook fs-5"></i></a>
                <a href="#" className="text-white"><i className="bi bi-twitter-x fs-5"></i></a>
                <a href="#" className="text-white"><i className="bi bi-instagram fs-5"></i></a>
              </div>
            </div>
            <div className="col-sm-6 col-lg-2 mb-4 mb-lg-0">
              <h6 className="fw-bold mb-3">Quick Links</h6>
              <ul className="list-unstyled small">
                <li className="mb-2"><a href="#" className="text-white text-decoration-none">Home</a></li>
                <li className="mb-2"><a href="#" className="text-white text-decoration-none">About Us</a></li>
                <li className="mb-2"><a href="#" className="text-white text-decoration-none">Contact</a></li>
                <li className="mb-2"><a href="#" className="text-white text-decoration-none">FAQs</a></li>
              </ul>
            </div>
            <div className="col-sm-6 col-lg-3 mb-4 mb-lg-0">
              <h6 className="fw-bold mb-3">For Students</h6>
              <ul className="list-unstyled small">
                <li className="mb-2"><a href="#" className="text-white text-decoration-none">How It Works</a></li>
                <li className="mb-2"><a href="#" className="text-white text-decoration-none">Safety Tips</a></li>
                <li className="mb-2"><a href="#" className="text-white text-decoration-none">Student Resources</a></li>
                <li className="mb-2"><a href="#" className="text-white text-decoration-none">Booking Guide</a></li>
              </ul>
            </div>
            <div className="col-lg-3">
              <h6 className="fw-bold mb-3">Contact Us</h6>
              <ul className="list-unstyled small">
                <li className="mb-2 d-flex align-items-center">
                  <i className="bi bi-geo-alt me-2"></i> CBU Campus, Kitwe, Zambia
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <i className="bi bi-envelope me-2"></i> chandabrian02@gmail.com
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <i className="bi bi-telephone me-2"></i> +260 972 526777
                </li>
              </ul>
            </div>
          </div>
          <hr />
          <div className="text-center small">
            <p className="mb-0">&copy; {new Date().getFullYear()} ZIT AccomHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
    </div>
  );

}

export default StudentDashboard;

function fetchProperties() {
  throw new Error('Function not implemented.');
}

function base64ToBlobUrl(imageUrl: string): string {
  throw new Error('Function not implemented.');
}
