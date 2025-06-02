import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './StudentDashboard.css';

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
  createdAt?: string;
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
    id?: number;
    image?: string;
  };
  details: Record<string, any>;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  coordinates?: { lat: number; lng: number };
  createdAt?: string;
}

const StudentDashboard: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('default');
  const [viewMode, setViewMode] = useState('grid');
  const [isScrolled, setIsScrolled] = useState(false);
  const [propertiesData, setPropertiesData] = useState<FormattedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Student'); // State for user's name

  // Check for user in state
  useEffect(() => {
    if (location.state?.studentId) {
      setUserName(location.state.name || 'Student');
    }
  }, [location.state]);




  // Replace the existing Bootstrap initialization code in the useEffect with this improved version
  useEffect(() => {
    const initBootstrap = async () => {
      try {
        // Import Bootstrap JS
        const bootstrap = await import('bootstrap/dist/js/bootstrap.bundle.min.js');
        console.log('Bootstrap JS loaded successfully');

        // Initialize all dropdowns on the page
        document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(dropdownElement => {
          const dropdown = new bootstrap.Dropdown(dropdownElement);
          console.log('Dropdown initialized');

          // Store the dropdown instance on the element for future reference
          (dropdownElement as any)._dropdown = dropdown;
        });
      } catch (err) {
        console.error('Failed to load Bootstrap JS:', err);
      }
    };

    // Wait for DOM to be fully loaded
    if (document.readyState === 'complete') {
      initBootstrap();
    } else {
      window.addEventListener('DOMContentLoaded', initBootstrap);
      return () => window.removeEventListener('DOMContentLoaded', initBootstrap);
    }
  }, []);

  // Add this helper function to handle dropdown menu item clicks properly
  const handleDropdownItemClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    action: () => void,
    closeDropdown = true
  ) => {
    e.preventDefault();
    action();

    if (closeDropdown) {
      // Close the dropdown after selection
      const parentDropdownToggle = (e.target as HTMLElement)
        .closest('.dropdown')
        ?.querySelector('[data-bs-toggle="dropdown"]') as HTMLElement;

      if (parentDropdownToggle && (parentDropdownToggle as any)._dropdown) {
        (parentDropdownToggle as any)._dropdown.hide();
      }
    }
  };

  const getImageUrl = (imageUrl: string | undefined, dimensions: { width: number; height: number } = { width: 400, height: 300 }): string => {
    if (!imageUrl) {
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

  const formatPropertyData = (property: Property): FormattedProperty | null => {
    if (!property || typeof property !== 'object') return null;

    const processedImages = (property.images || []).map(img => {
      const imgUrl = typeof img === 'string' ? img : (img as any)?.imageUrl;
      return getImageUrl(imgUrl);
    });

    const primaryImage = property.images?.find(img => typeof img !== 'string' && (img as any)?.isPrimary);
    const mainImage = primaryImage
      ? getImageUrl(typeof primaryImage === 'string' ? primaryImage : (primaryImage as any)?.imageUrl)
      : processedImages[0] || getImageUrl(undefined);

    const propertyType = (property.propertyType || '').toLowerCase();
    let formattedType = 'other';
    if (propertyType.includes('apartment')) formattedType = 'apartment';
    else if (propertyType.includes('shared')) formattedType = 'shared';
    else if (propertyType.includes('single')) formattedType = 'single';

    let landlord: FormattedProperty['landlord'] = { name: 'Unknown' };
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
        image: property.landlord.imageUrl,
      };
    }

    let coordinates: { lat: number; lng: number } | undefined;
    if (property.latitude && property.longitude) {
      const lat = typeof property.latitude === 'string' ? parseFloat(property.latitude) : property.latitude;
      const lng = typeof property.longitude === 'string' ? parseFloat(property.longitude) : property.longitude;
      if (!isNaN(lat) && !isNaN(lng)) {
        coordinates = { lat, lng };
      }
    }

    const monthlyRent = property.monthlyRent !== undefined && property.monthlyRent !== null
      ? typeof property.monthlyRent === 'string'
        ? parseFloat(property.monthlyRent)
        : property.monthlyRent
      : 0;

    return {
      id: property.propertyId,
      title: property.title || 'Unnamed Property',
      location: property.address || 'Location not specified',
      price: `K${monthlyRent.toLocaleString()} / month`,
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
      landlord,
      coordinates,
      details: property.details || {},
      createdAt: property.createdAt,
    };
  };

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/PropertyListingRoute/propertyListing/student-view', {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const propertiesArray = Array.isArray(data) ? data : (data.data?.properties || []);
        const formattedProperties = propertiesArray
          .map(formatPropertyData)
          .filter((p): p is FormattedProperty => p !== null);
        setPropertiesData(formattedProperties);
        setError(null);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch properties');
        setPropertiesData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProperties();

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredListings = useMemo(() => {
    let filtered = propertiesData.filter(listing => {
      if (!listing) return false;
      if (typeFilter !== 'all' && listing.type !== typeFilter) return false;
      const numericPrice = parseInt(listing.price.replace(/[^\d]/g, ''), 10) || 0;
      if (priceFilter === 'under1500' && numericPrice >= 1500) return false;
      if (priceFilter === '1500to2000' && (numericPrice < 1500 || numericPrice > 2000)) return false;
      if (priceFilter === 'above2000' && numericPrice <= 2000) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const inTitle = listing.title?.toLowerCase().includes(searchLower);
        const inLocation = listing.location?.toLowerCase().includes(searchLower);
        if (!inTitle && !inLocation) return false;
      }
      return true;
    });

    if (sortOption === 'default') return filtered;

    return [...filtered].sort((a, b) => {
      if (sortOption === 'priceLowToHigh') {
        const priceA = parseInt(a.price.replace(/[^\d]/g, ''), 10) || 0;
        const priceB = parseInt(b.price.replace(/[^\d]/g, ''), 10) || 0;
        return priceA - priceB;
      }
      if (sortOption === 'priceHighToLow') {
        const priceA = parseInt(a.price.replace(/[^\d]/g, ''), 10) || 0;
        const priceB = parseInt(b.price.replace(/[^\d]/g, ''), 10) || 0;
        return priceB - priceA;
      }
      if (sortOption === 'ratingHighToLow') {
        return b.rating - a.rating;
      }
      if (sortOption === 'newestFirst') {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return b.id - a.id;
      }
      return 0;
    });
  }, [propertiesData, typeFilter, priceFilter, searchTerm, sortOption]);

  useEffect(() => {
    const calculatedTotalPages = Math.ceil(filteredListings.length / itemsPerPage) || 1;
    setTotalPages(calculatedTotalPages);
    if (currentPage > calculatedTotalPages) {
      setCurrentPage(1);
    }
  }, [filteredListings, itemsPerPage, currentPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredListings.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetails = (listing: FormattedProperty) => {
    navigate('/PropertyDetailsPage', { state: { propertyId: listing.id } });
  };

  const handleNavigation = (path: string) => {
    const paths: { [key: string]: string } = {
      signin: '/login',
      register: '/register',
      about: '/about',
      viewall: '/studentdashboard',
      profile: '/profile',
      saved: '/saved-properties',
      settings: '/settings',
      logout: '/logout',
    };
    if (paths[path]) {
      navigate(paths[path]);
    } else {
      navigate(`/${path}`);
    }
    setMenuOpen(false);
  };

  const StarRating = ({ rating }: { rating: number }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<i key={i} className="bi bi-star-fill star-rating"></i>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<i key={i} className="bi bi-star-half star-rating"></i>);
      } else {
        stars.push(<i key={i} className="bi bi-star star-rating"></i>);
      }
    }
    return <div className="d-flex star-rating">{stars} <span className="ms-1 small">({rating})</span></div>;
  };

  const Pagination = () => {
    const pageNumbers = [];
    const displayPageCount = 5;
    let startPage = Math.max(1, currentPage - Math.floor(displayPageCount / 2));
    let endPage = Math.min(totalPages, startPage + displayPageCount - 1);
    if (endPage - startPage + 1 < displayPageCount) {
      startPage = Math.max(1, endPage - displayPageCount + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>
            {i}
          </button>
        </li>
      );
    }
    return (
      <nav aria-label="Property listing pagination">
        <ul className="pagination justify-content-center mb-0">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
              <i className="bi bi-chevron-double-left"></i>
            </button>
          </li>
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>
          {pageNumbers}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>
              <i className="bi bi-chevron-double-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  const renderGridCard = (listing: FormattedProperty) => (
    <div className="property-card h-100">
      <div className="property-image-container">
        <img src={listing.image} className="card-img-top" alt={listing.title} />
        {listing.featured && <span className="property-tag">Featured</span>}
      </div>
      <div className="card-body d-flex flex-column p-3">
        <div className="d-flex justify-content-between mb-2">
          <h5 className="property-title mb-0">{listing.title}</h5>
          <button className="btn btn-sm btn-link p-0 border-0">
            <i className="bi bi-bookmark"></i>
          </button>
        </div>
        <p className="property-location mb-2"><i className="bi bi-geo-alt-fill me-1"></i>{listing.location}</p>
        <div className="mb-2"><StarRating rating={listing.rating} /></div>
        <p className="property-price mb-3">{listing.price}</p>
        <div className="d-flex flex-wrap gap-1 mb-3">
          {listing.amenities.slice(0, 3).map((amenity, index) => (
            <span key={index} className="feature-badge">{amenity}</span>
          ))}
          {listing.amenities.length > 3 && <span className="feature-badge">+{listing.amenities.length - 3}</span>}
        </div>
        <button
          className="btn btn-outline-primary btn-sm mt-auto"
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails(listing);
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );

  const renderListCard = (listing: FormattedProperty) => (
    <div className="property-card mb-3">
      <div className="row g-0">
        <div className="col-md-4 col-lg-3">
          <div className="property-image-container">
            <img src={listing.image} className="card-img-top" alt={listing.title} />
            {listing.featured && <span className="property-tag">Featured</span>}
          </div>
        </div>
        <div className="col-md-8 col-lg-9">
          <div className="card-body d-flex flex-column p-3">
            <div className="d-flex justify-content-between mb-2">
              <div>
                <h5 className="property-title mb-1">{listing.title}</h5>
                <p className="property-location mb-1"><i className="bi bi-geo-alt-fill me-1"></i>{listing.location}</p>
                <div className="mb-2"><StarRating rating={listing.rating} /></div>
              </div>
              <p className="property-price fs-5">{listing.price}</p>
            </div>
            <p className="card-text small mb-2 d-none d-lg-block">{listing.description.substring(0, 100)}...</p>
            <div className="d-flex flex-wrap gap-1 mb-3">
              {listing.amenities.map((amenity, index) => (
                <span key={index} className="feature-badge">{amenity}</span>
              ))}
            </div>
            <div className="d-flex gap-2 mt-auto">
              <button
                className="btn btn-outline-primary btn-sm"
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

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="alert-banner" role="alert">
        <strong>Welcome to CBU Student Housing!</strong> Find your perfect accommodation for this academic year.
        <button type="button" className="btn-close" aria-label="Close" onClick={() => { }}></button>
      </div>

      <nav className={`navbar navbar-expand-lg navbar-light ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <a
            className="navbar-brand"
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavigation('home');
            }}
          >
            <span className="logo-icon me-2">🏠</span>
            <span className="logo-text">NexNest</span>
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="navbarNav">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
              {['home', 'services', 'community', 'contact'].map((item) => (
                <li className="nav-item" key={item}>
                  <a
                    className="nav-link"
                    href={`#${item}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation(item);
                    }}
                  >
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </a>
                </li>
              ))}
              <li className="nav-item dropdown ms-lg-2">
                <button
                  className="btn btn-outline-primary dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  id="userDropdown"
                >
                  <i className="bi bi-person me-1"></i>{userName} {/* Use dynamic name */}
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                  <li>
                    <a className="dropdown-item" href="#" onClick={() => handleNavigation('profile')}>
                      <i className="bi bi-person me-2"></i>Profile
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#" onClick={() => handleNavigation('saved')}>
                      <i className="bi bi-bookmark me-2"></i>Saved Properties
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#" onClick={() => handleNavigation('settings')}>
                      <i className="bi bi-gear me-2"></i>Settings
                    </a>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <a className="dropdown-item" href="#" onClick={() => handleNavigation('logout')}>
                      <i className="bi bi-box-arrow-right me-2"></i>Logout
                    </a>
                  </li>
                </ul>
              </li>
              <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                <button className="btn btn-primary" onClick={() => handleNavigation('register')}>
                  Register
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container py-5" style={{ paddingTop: 'calc(var(--navbar-height) + 2rem)' }}>
        <div className="text-center mb-4">
          <h2 className="section-title">Student Accommodations</h2>
          <p className="text-muted">Find your perfect student housing near your Univeristy</p>
        </div>

        <div className="filter-card mb-4">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6 col-lg-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search by location or property name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && setCurrentPage(1)}
              />
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div className="dropdown">
                <button
                  className="btn filter-btn dropdown-toggle w-100"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  id="typeFilterDropdown"
                >
                  <i className="bi bi-house me-1"></i>
                  {typeFilter === 'all' ? 'All Types' : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
                </button>
                <ul className="dropdown-menu" aria-labelledby="typeFilterDropdown">
                  <li>
                    <a
                      className="dropdown-item"
                      href="#"
                      onClick={(e) => handleDropdownItemClick(e, () => setTypeFilter('all'))}
                    >
                      All Types
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="#"
                      onClick={(e) => handleDropdownItemClick(e, () => setTypeFilter('apartment'))}
                    >
                      Apartment
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="#"
                      onClick={(e) => handleDropdownItemClick(e, () => setTypeFilter('shared'))}
                    >
                      Shared
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="#"
                      onClick={(e) => handleDropdownItemClick(e, () => setTypeFilter('single'))}
                    >
                      Single Room
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div className="dropdown">
                <button
                  className="btn filter-btn dropdown-toggle w-100"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  id="priceFilterDropdown"
                >
                  <i className="bi bi-cash me-1"></i>
                  {priceFilter === 'all'
                    ? 'Any Price'
                    : priceFilter === 'under1500'
                      ? 'Under K1,500'
                      : priceFilter === '1500to2000'
                        ? 'K1,500 - K2,000'
                        : 'Above K2,000'}
                </button>
                <ul className="dropdown-menu" aria-labelledby="priceFilterDropdown">
                  <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setPriceFilter('all'); }}>Any Price</a></li>
                  <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setPriceFilter('under1500'); }}>Under K1,500</a></li>
                  <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setPriceFilter('1500to2000'); }}>K1,500 - K2,000</a></li>
                  <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setPriceFilter('above2000'); }}>Above K2,000</a></li>
                </ul>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3 d-flex align-items-center">
              <div className="btn-group me-2">
                <button
                  className={`btn view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <i className="bi bi-grid-3x3-gap-fill"></i>
                </button>
                <button
                  className={`btn view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <i className="bi bi-list-ul"></i>
                </button>
              </div>
              <div className="dropdown">
                <button
                  className="btn filter-btn dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  id="itemsPerPageDropdown"
                >
                  <i className="bi bi-grid me-1"></i>
                  {itemsPerPage} per page
                </button>
                <ul className="dropdown-menu" aria-labelledby="itemsPerPageDropdown">
                  <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setItemsPerPage(4); }}>4 per page</a></li>
                  <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setItemsPerPage(8); }}>8 per page</a></li>
                  <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setItemsPerPage(12); }}>12 per page</a></li>
                  <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setItemsPerPage(16); }}>16 per page</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-12 d-flex justify-content-between align-items-center">
            <p className="mb-0">
              <span className="fw-bold">{filteredListings.length}</span> properties found
              {typeFilter !== 'all' && ` • Type: ${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}`}
              {priceFilter !== 'all' &&
                ` • Price: ${priceFilter === 'under1500' ? 'Under K1,500' : priceFilter === '1500to2000' ? 'K1,500 - K2,000' : 'Above K2,000'}`}
              {searchTerm && ` • Search: "${searchTerm}"`}
            </p>
            <div className="dropdown">
              <button
                className="btn btn-sm filter-btn dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                id="sortDropdown"
              >
                <i className="bi bi-sort-down me-1"></i>
                {sortOption === 'default'
                  ? 'Sort by: Default'
                  : sortOption === 'priceLowToHigh'
                    ? 'Sort by: Price (Low to High)'
                    : sortOption === 'priceHighToLow'
                      ? 'Sort by: Price (High to Low)'
                      : sortOption === 'ratingHighToLow'
                        ? 'Sort by: Rating (High to Low)'
                        : 'Sort by: Newest First'}
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="sortDropdown">
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortOption('default'); }}>Default</a></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortOption('priceLowToHigh'); }}>Price: Low to High</a></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortOption('priceHighToLow'); }}>Price: High to Low</a></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortOption('ratingHighToLow'); }}>Rating: High to Low</a></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortOption('newestFirst'); }}>Newest First</a></li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
              </div>
            </div>
          </div>
        )}

        {filteredListings.length === 0 && !error && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow-sm border-0 p-5 text-center">
                <i className="bi bi-search display-1 text-muted mb-4"></i>
                <h3 className="mb-3">No properties found</h3>
                <p className="text-muted mb-4">We couldn't find any properties matching your search criteria. Try adjusting your filters or search terms.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setTypeFilter('all');
                    setPriceFilter('all');
                    setSearchTerm('');
                    setSortOption('default');
                    setCurrentPage(1);
                  }}
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredListings.length > 0 && (
          <div className="row mb-4 justify-content-center">
            {viewMode === 'grid' ? (
              <div className="col-12">
                <div className="row row-cols-2 row-cols-md-2 row-cols-lg-3 g-3">
                  {currentItems.map((listing) => (
                    <div key={listing.id} className="col">
                      {renderGridCard(listing)}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="col-12 col-lg-10 mx-auto">
                {currentItems.map((listing) => (
                  <div key={listing.id} className="col-12 mb-3">
                    {renderListCard(listing)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {filteredListings.length > 0 && (
          <div className="row mb-3">
            <div className="col-12">
              <Pagination />
            </div>
          </div>
        )}
      </div>

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

const base64ToBlobUrl = (base64Data: string): string => {
  try {
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string');
    }
    const contentType = matches[1];
    const base64 = matches[2];
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    const blob = new Blob(byteArrays, { type: contentType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to convert base64 to blob URL:', error);
    throw error;
  }
};

export default StudentDashboard;