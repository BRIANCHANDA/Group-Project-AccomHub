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
  targetUniversity?: string;
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
  targetUniversity: string;
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

interface UserProfile {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  university?: string;
  yearOfStudy?: string;
  profileImage?: string;
  createdAt?: string;
}

const universityOptions = [
  { value: 'all', label: 'All Universities' },
  { value: 'University of Zambia (UNZA)', label: 'University of Zambia' },
  { value: 'Copperbelt University (CBU)', label: 'Copperbelt University' },
  { value: 'Mulungushi University', label: 'Mulungushi University' },
  { value: 'Zambia Catholic University', label: 'Zambia Catholic University' },
  { value: 'Other', label: 'Other' }
];

const StudentDashboard: React.FC = () => {
  const [ratingSuccess, setRatingSuccess] = useState<{show: boolean, message: string}>({show: false, message: ''});
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
  const [userName, setUserName] = useState('Student');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [universityFilter, setUniversityFilter] = useState(() => {
    return sessionStorage.getItem('selectedUniversity') || 'all';
  });
  const [showRateModal, setShowRateModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check login status and fetch user profile
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      setIsLoggedIn(true);
      setStudentId(parsedUser.id || null);
      setUserName(parsedUser.firstName || 'Student');
      
      // Fetch full user profile
      if (parsedUser.id) {
        fetchUserProfile(parsedUser.id);
      }
    }
  }, []);

  const fetchUserProfile = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/users/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const profileData = await response.json();
        setUserProfile(profileData);
        // Update display name with full profile info
        if (profileData.firstName) {
          setUserName(profileData.firstName);
        }
      } else {
        console.error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    if (location.state?.showRateModal && location.state?.propertyId) {
      const propertyToRate = propertiesData.find(p => p.id === location.state.propertyId);
      if (propertyToRate) {
        setRatingModal({ isOpen: true, property: propertyToRate });
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, propertiesData, navigate]);

  const handleUniversityChange = (university: string) => {
    setUniversityFilter(university);
    sessionStorage.setItem('selectedUniversity', university);
    setCurrentPage(1);
  };

  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    if (location.state?.studentId) {
      setUserName(location.state.name || 'Student');
      setStudentId(location.state.studentId);
    }
  }, [location.state]);

  useEffect(() => {
    if (location.state?.showRateModal) {
      setShowRateModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  useEffect(() => {
    const initBootstrap = async () => {
      if (!window.bootstrap) {
        await import('bootstrap/dist/js/bootstrap.bundle.min.js');
      }
    };

    const initDropdowns = () => {
      document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(dropdownElement => {
        if (!(dropdownElement as any)._dropdown) {
          const dropdown = new window.bootstrap.Dropdown(dropdownElement);
          (dropdownElement as any)._dropdown = dropdown;
        }
      });
    };

    initBootstrap().then(initDropdowns);

    return () => {
      document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(dropdownElement => {
        if ((dropdownElement as any)._dropdown) {
          (dropdownElement as any)._dropdown.dispose();
          delete (dropdownElement as any)._dropdown;
        }
      });
    };
  }, []);

  const handleDropdownItemClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    action: () => void,
    closeDropdown = true
  ) => {
    e.preventDefault();
    action();

    if (closeDropdown) {
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
      targetUniversity: property.targetUniversity || 'Not specified',
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
          .filter((p: FormattedProperty | null): p is FormattedProperty => p !== null);
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', 
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setIsLoggedIn(false);
      setStudentId(null);
      setUserProfile(null);
      navigate('/studentdashboard', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      setStudentId(null);
      setUserProfile(null);
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

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

      if (universityFilter !== 'all') {
        const propertyUniversity = (listing.targetUniversity || '').trim().toLowerCase();
        const selectedUniversity = universityFilter.trim().toLowerCase();

        console.log('Comparing:', {
          propertyUniversity,
          selectedUniversity,
          match: propertyUniversity === selectedUniversity
        });

        if (propertyUniversity !== selectedUniversity) {
          return false;
        }
      }

      const numericPrice = parseInt(listing.price.replace(/[^\d]/g, ''), 10) || 0;
      if (priceFilter === 'under1500' && numericPrice >= 1500) return false;
      if (priceFilter === '1500to2000' && (numericPrice < 1500 || numericPrice > 2000)) return false;
      if (priceFilter === 'above2000' && numericPrice <= 2000) return false;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const inTitle = listing.title?.toLowerCase().includes(searchLower);
        const inLocation = listing.location?.toLowerCase().includes(searchLower);
        const inUniversity = listing.targetUniversity?.toLowerCase().includes(searchLower);
        if (!inTitle && !inLocation && !inUniversity) return false;
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
  }, [propertiesData, typeFilter, priceFilter, searchTerm, sortOption, universityFilter]);

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
    settings: '/settings',
    logout: '/logout',
    home: '/',
  };

  // For sections that exist on home page, navigate there with hash
  const homeSections = ['services', 'community', 'contact'];
  
  if (homeSections.includes(path)) {
    navigate(`/#${path}`);
    return;
  }
  
  if (path === 'logout') {
    handleLogout();
  } else if (path === 'profile' && userProfile) {
    navigate('/profile', { state: { userProfile, studentId } });
  } else if (paths[path]) {
    navigate(paths[path]);
  } else {
    navigate(`/${path}`);
  }
  setMenuOpen(false);
};

  const handleRateProperty = (listing: FormattedProperty) => {
    if (!isLoggedIn) {
      navigate('/login', {
        state: {
          redirectTo: 'rate',
          propertyId: listing.id,
          from: location.pathname
        }
      });
    } else {
      setRatingModal({ isOpen: true, property: listing });
    }
  };

  const submitRating = async (rating: number, comment: string) => {
    if (!ratingModal.property) {
      console.error('Missing property information');
      return;
    }

    if (!studentId) {
      console.error('Student ID is required to submit rating');
      navigate('/login', {
        state: {
          redirectTo: 'rate',
          propertyId: ratingModal.property.id,
          from: location.pathname
        }
      });
      return;
    }

    try {
      const response = await fetch('/api/reviews/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: ratingModal.property.id,
          reviewerId: studentId,
          rating: rating,
          comment: comment,
        }),
      });

      if (response.ok) {
        console.log('Rating submitted successfully');
        setRatingSuccess({
          show: true, 
          message: `Thank you! Your ${rating}-star rating for "${ratingModal.property.title}" has been submitted successfully.`
        });
        setTimeout(() => {
          setRatingSuccess({show: false, message: ''});
        }, 5000);
      } else {
        console.error('Failed to submit rating');
        setRatingSuccess({
          show: true, 
          message: 'Failed to submit your rating. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setRatingSuccess({
        show: true, 
        message: 'An error occurred while submitting your rating. Please try again.'
      });
    }
  };

  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
    property: FormattedProperty | null;
  }>({ isOpen: false, property: null });

  const RatingModal = ({
    property,
    isOpen,
    onClose,
    onSubmit
  }: {
    property: FormattedProperty | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
  }) => {
    const location = useLocation();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoveredRating, setHoveredRating] = useState(0);

    useEffect(() => {
      if (isOpen && location.state?.showRateModal) {
        document.getElementById('rating-input')?.focus();
      }
    }, [isOpen, location.state]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (rating > 0) {
        onSubmit(rating, comment);
        setRating(0);
        setComment('');
        onClose();
      }
    };

    if (!isOpen || !property) return null;

    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Rate Property</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <h6>{property.title}</h6>
                  <p className="text-muted small">{property.location}</p>
                </div>

                <div className="rating-section">
                  <label className="form-label">Your Rating</label>
                  <div className="star-rating-container">
                    <div className="d-flex gap-1 justify-content-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          id={star === 1 ? 'rating-input' : undefined}
                          className={`star-button ${star <= (hoveredRating || rating) ? 'star-filled' : 'star-empty'}`}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                        >
                          <div className="css-star"></div>
                        </button>
                      ))}
                    </div>
                    <div className={`text-center rating-text ${rating > 0 ? 'has-rating' : ''}`}>
                      <small>
                        {rating === 0 ? 'Click to rate' : `You rated: ${rating} star${rating > 1 ? 's' : ''}`}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="comment-section">
                  <label className="form-label">Comment (Optional)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this property..."
                  ></textarea>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={rating === 0}>
                    Submit Rating
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
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

   // Fixed Grid View Card Rendering
  const renderGridCard = (listing: FormattedProperty) => (
    <div className="property-card h-100">
      <div className="property-image-container position-relative">
        <img
          src={listing.image}
          className="card-img-top"
          alt={listing.title}
          style={{ height: isMobile ? '180px' : '200px', objectFit: 'cover' }}
        />
        {listing.featured && <span className="property-tag position-absolute top-0 start-0">Featured</span>}
        {!listing.available && (
          <div className="position-absolute top-0 end-0 bg-danger text-white px-2 py-1 small">
            Unavailable
          </div>
        )}
      </div>
      <div className="card-body d-flex flex-column p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="property-title mb-0 flex-grow-1" 
              style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', lineHeight: '1.3' }}>
            {listing.title}
          </h5>
        </div>
        
        <p className="property-location mb-2 text-muted small">
          <i className="bi bi-geo-alt-fill me-1"></i>
          {isMobile && listing.location.length > 30 
            ? listing.location.substring(0, 30) + '...' 
            : listing.location}
        </p>
        
        <p className="property-university mb-2 small text-muted">
          <i className="bi bi-building me-1"></i>
          {listing.targetUniversity}
        </p>
        
        {!isMobile && (
          <div className="mb-2">
            <StarRating rating={listing.rating} />
          </div>
        )}
        
        <p className="property-price mb-3 fw-bold text-primary" 
           style={{ fontSize: isMobile ? '1rem' : '1.1rem' }}>
          {listing.price}
        </p>
        
        {/* Property Details */}
        {!isMobile && (listing.bedrooms || listing.bathrooms || listing.size) && (
          <div className="d-flex gap-3 mb-3 small text-muted">
            {listing.bedrooms && (
              <span><i className="bi bi-bed me-1"></i>{listing.bedrooms} bed{listing.bedrooms > 1 ? 's' : ''}</span>
            )}
            {listing.bathrooms && (
              <span><i className="bi bi-droplet me-1"></i>{listing.bathrooms} bath</span>
            )}
            {listing.size && (
              <span><i className="bi bi-arrows-move me-1"></i>{listing.size}m²</span>
            )}
          </div>
        )}
        
        {/* Amenities */}
        {!isMobile && listing.amenities.length > 0 && (
          <div className="d-flex flex-wrap gap-1 mb-3">
            {listing.amenities.slice(0, 3).map((amenity, index) => (
              <span key={index} className="badge bg-light text-dark border small">{amenity}</span>
            ))}
            {listing.amenities.length > 3 && (
              <span className="badge bg-primary small">+{listing.amenities.length - 3} more</span>
            )}
          </div>
        )}
        
        <div className="d-flex gap-2 mt-auto">
          <button
            className={`btn btn-outline-primary ${isMobile ? 'btn-sm flex-grow-1' : 'flex-grow-1'}`}
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(listing);
            }}
          >
            {isMobile ? 'View' : 'View Details'}
          </button>
          <button
            className={`btn btn-outline-warning ${isMobile ? 'btn-sm' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleRateProperty(listing);
            }}
            title="Rate Property"
            style={{ minWidth: isMobile ? 'auto' : '70px' }}
          >
            <i className="bi bi-star"></i>
            {!isMobile && ' Rate'}
          </button>
        </div>
      </div>
    </div>
  );

  // Fixed List View Card Rendering
  const renderListCard = (listing: FormattedProperty) => (
    <div className="card property-card mb-3 border-0 shadow-sm">
      <div className="row g-0">
        {!isMobile && (
          <div className="col-md-4">
            <div className="property-image-container position-relative h-100">
              <img 
                src={listing.image} 
                className="img-fluid w-100 h-100" 
                alt={listing.title}
                style={{ objectFit: 'cover', minHeight: '200px' }}
              />
              {listing.featured && <span className="property-tag position-absolute top-0 start-0">Featured</span>}
              {!listing.available && (
                <div className="position-absolute top-0 end-0 bg-danger text-white px-2 py-1 small">
                  Unavailable
                </div>
              )}
            </div>
          </div>
        )}
        <div className={`${isMobile ? 'col-12' : 'col-md-8'}`}>
          <div className="card-body p-4">
            <div className="row">
              <div className="col-md-8">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="property-title mb-1" style={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                    {listing.title}
                  </h5>
                </div>
                
                <p className="property-location mb-2 text-muted">
                  <i className="bi bi-geo-alt-fill me-2"></i>
                  {listing.location}
                </p>
                
                <p className="property-university mb-2 text-muted small">
                  <i className="bi bi-building me-2"></i>
                  {listing.targetUniversity}
                </p>
                
                {!isMobile && (
                  <div className="mb-3">
                    <StarRating rating={listing.rating} />
                  </div>
                )}
                
                {/* Property Details */}
                {(listing.bedrooms || listing.bathrooms || listing.size) && (
                  <div className="d-flex flex-wrap gap-3 mb-3 text-muted small">
                    {listing.bedrooms && (
                      <span><i className="bi bi-bed me-1"></i>{listing.bedrooms} bedroom{listing.bedrooms > 1 ? 's' : ''}</span>
                    )}
                    {listing.bathrooms && (
                      <span><i className="bi bi-droplet me-1"></i>{listing.bathrooms} bathroom{listing.bathrooms > 1 ? 's' : ''}</span>
                    )}
                    {listing.size && (
                      <span><i className="bi bi-arrows-move me-1"></i>{listing.size} m²</span>
                    )}
                  </div>
                )}
                
                {!isMobile && listing.description && (
                  <p className="card-text text-muted mb-3">
                    {listing.description.length > 120 
                      ? listing.description.substring(0, 120) + '...' 
                      : listing.description}
                  </p>
                )}
                
                {!isMobile && listing.amenities.length > 0 && (
                  <div className="d-flex flex-wrap gap-1 mb-3">
                    {listing.amenities.slice(0, 4).map((amenity, index) => (
                      <span key={index} className="badge bg-light text-dark border small">{amenity}</span>
                    ))}
                    {listing.amenities.length > 4 && (
                      <span className="badge bg-primary small">+{listing.amenities.length - 4} more</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="col-md-4 text-md-end">
                <p className="property-price mb-3 fw-bold text-primary fs-4">
                  {listing.price}
                </p>
                
                <div className="d-flex flex-column gap-2">
                  <button
                    className="btn btn-outline-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(listing);
                    }}
                  >
                    <i className="bi bi-eye me-1"></i>
                    View Details
                  </button>
                  <button
                    className="btn btn-outline-warning"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRateProperty(listing);
                    }}
                  >
                    <i className="bi bi-star me-1"></i>
                    Rate Property
                  </button>
                </div>
              </div>
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
            <span className="logo-text">PlacesForLearners</span>
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
              
              {isLoggedIn ? (
                <li className="nav-item dropdown ms-lg-2">
                  <button
                    className="btn btn-outline-primary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    id="userDropdown"
                  >
                    <i className="bi bi-person me-1"></i>
                    {userProfile?.firstName || userName}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li>
                      <h6 className="dropdown-header">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-person-circle me-2"></i>
                          <div>
                            <div className="fw-bold">{userProfile?.firstName} {userProfile?.lastName}</div>
                            <small className="text-muted">{userProfile?.email}</small>
                          </div>
                        </div>
                      </h6>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                   
                    
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <a
                        className="dropdown-item"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLogout();
                        }}
                        disabled={isLoggingOut}
                      >
                        <i className="bi bi-box-arrow-right me-2"></i>
                        {isLoggingOut ? 'Logging out...' : 'Logout'}
                      </a>
                    </li>
                  </ul>
                </li>
              ) : (
                <>
                  <li className="nav-item ms-lg-2">
                    <button 
                      className="btn btn-outline-primary me-2" 
                      onClick={() => handleNavigation('signin')}
                    >
                      Sign In
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleNavigation('register')}
                    >
                      Register
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <div className="container py-5" style={{ paddingTop: 'calc(var(--navbar-height) + 2rem)' }}>
        <div className="filter-card mb-4">
          <div className="row g-2 align-items-center">
            <div className={isMobile ? "col-12 mb-2" : "col-12 col-md-6 col-lg-3"}>
              <input
                type="text"
                className="form-control"
                placeholder={isMobile ? "Search..." : "Search by location or property name"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && setCurrentPage(1)}
              />
            </div>

            <div className={isMobile ? "col-6" : "col-12 col-md-6 col-lg-3"}>
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

            <div className={isMobile ? "col-6" : "col-12 col-md-6 col-lg-3"}>
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
                  <li><a className="dropdown-item" href="#" onClick={(e) => handleDropdownItemClick(e, () => setPriceFilter('all'))}>Any Price</a></li>
                  <li><a className="dropdown-item" href="#" onClick={(e) => handleDropdownItemClick(e, () => setPriceFilter('under1500'))}>Under K1,500</a></li>
                  <li><a className="dropdown-item" href="#" onClick={(e) => handleDropdownItemClick(e, () => setPriceFilter('1500to2000'))}>K1,500 - K2,000</a></li>
                  <li><a className="dropdown-item" href="#" onClick={(e) => handleDropdownItemClick(e, () => setPriceFilter('above2000'))}>Above K2,000</a></li>
                </ul>
              </div>
            </div>

            <div className={isMobile ? "col-6" : "col-12 col-md-6 col-lg-3"}>
              <div className="dropdown">
                <button
                  className="btn filter-btn dropdown-toggle w-100"
                  type="button"
                  id="universityFilterDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={(e) => {
                    e.preventDefault();
                    const dropdown = new window.bootstrap.Dropdown(e.currentTarget);
                    dropdown.toggle();
                  }}
                >
                  <i className="bi bi-building me-1"></i>
                  {universityOptions.find(u => u.value === universityFilter)?.label || 'University'}
                </button>
                <ul className="dropdown-menu" aria-labelledby="universityFilterDropdown">
                  {universityOptions.map(option => (
                    <li key={option.value}>
                      <a
                        className="dropdown-item"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleUniversityChange(option.value);
                          const dropdownElement = document.getElementById('universityFilterDropdown');
                          if (dropdownElement && (dropdownElement as any)._dropdown) {
                            (dropdownElement as any)._dropdown.hide();
                          }
                        }}
                      >
                        {option.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="row g-2 align-items-center mt-2">
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
                  <li><a className="dropdown-item" href="#" onClick={(e) => handleDropdownItemClick(e, () => setItemsPerPage(4))}>4 per page</a></li>
                  <li><a className="dropdown-item" href="#" onClick={(e) => handleDropdownItemClick(e, () => setItemsPerPage(8))}>8 per page</a></li>
                  <li><a className="dropdown-item" href="#" onClick={(e) => handleDropdownItemClick(e, () => setItemsPerPage(12))}>12 per page</a></li>
                  <li><a className="dropdown-item" href="#" onClick={(e) => handleDropdownItemClick(e, () => setItemsPerPage(16))}>16 per page</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-12 d-flex justify-content-between align-items-center">
            <p className="mb-0">
              <span className="fw-bold">{filteredListings.length}</span>
              {isMobile ? ' found' : ' properties found'}
              {!isMobile && typeFilter !== 'all' && ` • Type: ${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}`}
              {!isMobile && priceFilter !== 'all' &&
                ` • Price: ${priceFilter === 'under1500' ? 'Under K1,500' : priceFilter === '1500to2000' ? 'K1,500 - K2,000' : 'Above K2,000'}`}
              {!isMobile && universityFilter !== 'all' && ` • University: ${universityOptions.find(u => u.value === universityFilter)?.label}`}
              {!isMobile && searchTerm && ` • Search: "${searchTerm}"`}
            </p>
            {!isMobile && (
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
            )}
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
                <div className={`row g-3 ${isMobile ? 'row-cols-1' : 'row-cols-2 row-cols-md-2 row-cols-lg-3'}`}>
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

        <RatingModal
          property={ratingModal.property}
          isOpen={ratingModal.isOpen}
          onClose={() => setRatingModal({ isOpen: false, property: null })}
          onSubmit={submitRating}
        />
      </div>

      {ratingSuccess.show && (
        <div 
          className="toast-container position-fixed top-0 end-0 p-3" 
          style={{zIndex: 9999}}
        >
          <div 
            className={`toast show ${ratingSuccess.message.includes('Failed') || ratingSuccess.message.includes('error') ? 'bg-danger' : 'bg-success'} text-white`}
            role="alert" 
            aria-live="assertive" 
            aria-atomic="true"
          >
            <div className="toast-header">
              <i className={`bi ${ratingSuccess.message.includes('Failed') || ratingSuccess.message.includes('error') ? 'bi-x-circle-fill' : 'bi-check-circle-fill'} me-2`}></i>
              <strong className="me-auto">
                {ratingSuccess.message.includes('Failed') || ratingSuccess.message.includes('error') ? 'Error' : 'Success'}
              </strong>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                aria-label="Close"
                onClick={() => setRatingSuccess({show: false, message: ''})}
              ></button>
            </div>
            <div className="toast-body">
              {ratingSuccess.message}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-auto">
        <div className="container">
          <div className="row gy-4">
            <div className="col-md-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center">
                <i className="bi bi-building-fill me-2"></i>
                🏠 PlacesForLearners
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
                    {['Home', 'Browse Listings', 'My Account'].map((link) => (
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
                      <span className="text-white-50">support@PlacesForLearners.ac.zm</span>
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
                <p className="mb-0 text-white-50">© {new Date().getFullYear()} PlacesForLearners. All rights reserved.</p>
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