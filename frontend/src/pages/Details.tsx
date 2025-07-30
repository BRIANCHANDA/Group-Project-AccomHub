import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './bootstrap-5.3.5-dist/css/bootstrap.min.css';
import './details.css';

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/leaflet/marker-icon-2x.png',
  iconUrl: '/images/leaflet/marker-icon.png',
  shadowUrl: '/images/leaflet/marker-shadow.png',
});

const COLORS = {
  PRIMARY: '#4361ee',
  PRIMARY_DARK: '#3a56d4',
  SECONDARY: '#f8f9fa',
  TEXT_DARK: '#212529',
  TEXT_LIGHT: '#6c757d',
};

// Star Rating Component
const StarRating: React.FC<{ rating: number; small?: boolean }> = ({ rating, small = false }) => {
  const stars = [];
  const size = small ? 'fs-6' : 'fs-5';

  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars.push(
        <i
          key={i}
          className={`bi bi-star-fill ${size} me-1`}
          style={{ color: '#ffc107' }}
        />
      );
    } else if (i - 0.5 <= rating) {
      stars.push(
        <i
          key={i}
          className={`bi bi-star-half ${size} me-1`}
          style={{ color: '#ffc107' }}
        />
      );
    } else {
      stars.push(
        <i
          key={i}
          className={`bi bi-star ${size} me-1`}
          style={{ color: '#ffc107' }}
        />
      );
    }
  }

  return <div className="d-flex align-items-center">{stars}</div>;
};

// Map View Updater Component
const MapViewUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (map && center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
};

// Property Map Component
const PropertyMap: React.FC<{ coordinates: { lat: number; lng: number }; radius: number }> = ({ coordinates, radius }) => {
  const [loading, setLoading] = useState(true);

  const isValidCoordinates =
    coordinates &&
    typeof coordinates.lat === 'number' &&
    typeof coordinates.lng === 'number' &&
    !isNaN(coordinates.lat) &&
    !isNaN(coordinates.lng) &&
    coordinates.lat >= -90 &&
    coordinates.lat <= 90 &&
    coordinates.lng >= -180 &&
    coordinates.lng <= 180;

  const mapCenter: [number, number] = isValidCoordinates ? [coordinates.lat, coordinates.lng] : [0, 0];

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!isValidCoordinates) {
    return (
      <div className="alert alert-warning" role="alert">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Invalid coordinates provided. Please check property location data.
      </div>
    );
  }

  return (
    <div className="map-container rounded-3 overflow-hidden shadow-sm">
      {loading ? (
        <div
          className="d-flex justify-content-center align-items-center bg-light"
          style={{ height: '300px' }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading map...</span>
          </div>
        </div>
      ) : (
        <MapContainer
          style={{ height: '300px', width: '100%' }}
          center={mapCenter}
          zoom={13}
          scrollWheelZoom={false}
        >
          <MapViewUpdater center={mapCenter} zoom={13} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={mapCenter}>
            <Popup>
              <div style={{ padding: '5px', maxWidth: '200px' }}>
                <h6 className="mb-1">Property Location</h6>
                <p className="mb-0 small text-muted">
                  Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
          <Circle
            center={mapCenter}
            radius={Math.max(radius * 1000, 100)}
            pathOptions={{
              color: COLORS.PRIMARY,
              opacity: 0.8,
              weight: 2,
              fillColor: COLORS.PRIMARY,
              fillOpacity: 0.2,
            }}
          />
        </MapContainer>
      )}
    </div>
  );
};

// Interfaces
interface User {
  id: number;
  email: string;
  phoneNumber?: string;
  token?: string;
  userType: 'student' | 'landlord' | 'admin';
}

interface PropertyType {
  id: number;
  title: string;
  location: string;
  price: string;
  type: string;
  image: string;
  images: string[];
  description: string;
  amenities: string[];
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
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
  coordinates?: {
    lat: number;
    lng: number;
  };
  details: Record<string, any>;
}

interface LocationState {
  propertyId?: number;
  studentId?: number;
  from?: string;
  message?: string;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  reviewer: {
    id: number;
    name: string;
  };
  createdAt?: string;
}

interface ReviewsData {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

// Reviews Component
const PropertyReviews: React.FC<{ propertyId: number }> = ({ propertyId }) => {
  const [reviewsData, setReviewsData] = useState<ReviewsData>({
    reviews: [],
    averageRating: 0,
    totalReviews: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!propertyId) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/reviews/properties/${propertyId}/reviews`, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const reviews: Review[] = await response.json();
        const averageRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0;

        setReviewsData({
          reviews,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: reviews.length
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [propertyId]);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const ReviewCard: React.FC<{ review: Review }> = ({ review }) => (
    <div className="review-card p-4 border rounded-3 mb-3 bg-white">
      <div className="d-flex align-items-start">
        <div
          className="review-avatar rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
          style={{
            width: '48px',
            height: '48px',
            backgroundColor: COLORS.PRIMARY,
            color: 'white',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {getInitials(review.reviewer.name)}
        </div>
        <div className="review-content flex-grow-1">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 className="mb-1 fw-semibold">{review.reviewer.name}</h6>
              {review.createdAt && (
                <small className="text-muted">{formatDate(review.createdAt)}</small>
              )}
            </div>
            <StarRating rating={review.rating} small />
          </div>
          <p className="mb-0 text-muted" style={{ lineHeight: '1.6' }}>
            {review.comment}
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="property-section">
        <h3 className="section-title">Reviews & Ratings</h3>
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading reviews...</span>
          </div>
          <p className="mt-2 text-muted">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="property-section">
        <h3 className="section-title">Reviews & Ratings</h3>
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Unable to load reviews at this time. Please try again later.
        </div>
      </div>
    );
  }

  if (reviewsData.totalReviews === 0) {
    return (
      <div className="property-section">
        <h3 className="section-title">Reviews & Ratings</h3>
        <div className="text-center py-5">
          <i className="bi bi-chat-dots fs-1 text-muted mb-3"></i>
          <h5 className="text-muted">No reviews yet</h5>
          <p className="text-muted mb-0">Be the first to review this property!</p>
        </div>
      </div>
    );
  }

  const displayedReviews = showAllReviews ? reviewsData.reviews : reviewsData.reviews.slice(0, 3);

  return (
    <div className="property-section">
      <h3 className="section-title">Reviews & Ratings</h3>
      <div className="reviews-summary p-4 bg-light rounded-3 mb-4">
        <div className="row align-items-center">
          <div className="col-12">
            <div className="d-flex align-items-center">
              <div className="me-4">
                <div className="display-4 fw-bold text-primary">
                  {reviewsData.averageRating.toFixed(1)}
                </div>
                <StarRating rating={reviewsData.averageRating} />
              </div>
              <div>
                <h6 className="mb-1">Overall Rating</h6>
                <p className="mb-0 text-muted">
                  Based on {reviewsData.totalReviews} review{reviewsData.totalReviews !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
          <div className="col-12 mt-3">
            <div className="rating-distribution">
              {[5, 4, 3, 2, 1].map(star => {
                const count = reviewsData.reviews.filter(r => r.rating === star).length;
                const percentage = reviewsData.totalReviews > 0 ? (count / reviewsData.totalReviews) * 100 : 0;
                return (
                  <div key={star} className="d-flex align-items-center mb-1">
                    <span className="me-2 small" style={{ minWidth: '20px' }}>{star}</span>
                    <i className="bi bi-star-fill me-2 small" style={{ color: '#ffc107' }}></i>
                    <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
                      <div
                        className="progress-bar"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS.PRIMARY
                        }}
                      ></div>
                    </div>
                    <span className="small text-muted" style={{ minWidth: '25px' }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="reviews-list">
        {displayedReviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
      {reviewsData.reviews.length > 3 && (
        <div className="text-center mt-3">
          <button
            className="btn btn-outline-primary"
            onClick={() => setShowAllReviews(!showAllReviews)}
          >
            {showAllReviews ? (
              <>
                <i className="bi bi-chevron-up me-2"></i>
                Show Less Reviews
              </>
            ) : (
              <>
                <i className="bi bi-chevron-down me-2"></i>
                Show All {reviewsData.reviews.length} Reviews
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

const PropertyDetailsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const { propertyId } = state || {};

  const [studentId, setStudentId] = useState<number | null>(state?.studentId || null);
  const [property, setProperty] = useState<PropertyType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mapRadius, setMapRadius] = useState(1);

  const parseUserData = useCallback((userData: string): User | null => {
    try {
      const parsedUser = JSON.parse(userData);
      if (!parsedUser?.id || !parsedUser?.email || !parsedUser?.userType) {
        console.warn('PropertyDetailsPage: Missing required user fields');
        return null;
      }
      if (!['student', 'landlord', 'admin'].includes(parsedUser.userType)) {
        console.warn('PropertyDetailsPage: Invalid user type');
        return null;
      }
      const id = typeof parsedUser.id === 'string' ? parseInt(parsedUser.id, 10) : parsedUser.id;
      if (isNaN(id)) {
        console.warn('PropertyDetailsPage: Invalid user ID');
        return null;
      }
      return {
        id,
        email: parsedUser.email,
        phoneNumber: parsedUser.phoneNumber,
        token: parsedUser.token,
        userType: parsedUser.userType,
      };
    } catch (parseError) {
      console.error('PropertyDetailsPage: Failed to parse user data:', parseError);
      return null;
    }
  }, []);

  const clearUserSession = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('admin_token');
    setIsUserLoggedIn(false);
    setCurrentUser(null);
    setStudentId(null);
  }, []);

  const navigateToLogin = useCallback(
    (message: string) => {
      if (!property) return;
      console.log('PropertyDetailsPage: navigateToLogin', {
        message,
        propertyId: property.id,
        studentId: currentUser?.id,
        landlordId: property.landlord.id,
      });
      navigate('/login', {
        state: {
          from: '/inquiry',
          propertyId: property.id,
          studentId: currentUser?.id,
          message,
          receiverId: property.landlord.id,
          receiverName: property.landlord.name,
          receiverType: 'landlord',
          propertyTitle: property.title,
          propertyData: property,
        },
      });
    },
    [navigate, property, currentUser]
  );

  useEffect(() => {
    const loadBootstrap = async () => {
      try {
        await import('bootstrap/dist/js/bootstrap.bundle.min.js');
        console.log('Bootstrap JS loaded successfully for PropertyDetailsPage');
      } catch (err) {
        console.error('Failed to load Bootstrap JS:', err);
      }
    };
    loadBootstrap();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const validateUser = async () => {
      console.log('PropertyDetailsPage: Validating user...', {
        path: window.location.pathname,
        state: location.state,
        propertyId,
        studentId,
      });
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          console.log('PropertyDetailsPage: No user data found');
          setIsUserLoggedIn(false);
          return;
        }
        const parsedUser = parseUserData(userData);
        if (!parsedUser) {
          console.log('PropertyDetailsPage: Invalid user data, clearing session');
          clearUserSession();
          return;
        }
        if (parsedUser.userType !== 'student') {
          console.log('PropertyDetailsPage: User is not a student');
          clearUserSession();
          return;
        }
        console.log('PropertyDetailsPage: User validated successfully', {
          userId: parsedUser.id,
          userType: parsedUser.userType,
        });
        setIsUserLoggedIn(true);
        setCurrentUser(parsedUser);
        setStudentId(parsedUser.id);
      } catch (error) {
        console.error('PropertyDetailsPage: Unexpected validation error:', error);
        clearUserSession();
      }
    };
    validateUser();
  }, [parseUserData, clearUserSession, location.state, propertyId, studentId]);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!propertyId) {
        setError('Property ID is missing');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const timestamp = new Date().getTime();
        const url = `/api/details/details/${propertyId}?_=${timestamp}`;
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const responseData = await response.json();
        setRawApiResponse(responseData);
        if (!responseData.success || !responseData.data) {
          throw new Error('Invalid API response structure');
        }
        const formattedProperty = formatPropertyData(responseData.data);
        if (!formattedProperty) {
          throw new Error('Failed to format property data');
        }
        setProperty(formattedProperty);
        setError(null);
      } catch (err) {
        console.error('Error fetching property details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch property details');
      } finally {
        setLoading(false);
      }
    };
    if (propertyId) {
      fetchPropertyDetails();
    }
    return () => {
      if (property?.images) {
        property.images.forEach((img) => {
          if (img.startsWith('blob:')) {
            URL.revokeObjectURL(img);
          }
        });
      }
    };
  }, [propertyId]);

  const formatPropertyData = (property: any): PropertyType | null => {
    if (!property || typeof property !== 'object') {
      console.error('Invalid property data received:', property);
      return null;
    }
    try {
      const processedImages = (Array.isArray(property.images) ? property.images : [])
        .map((img) => (typeof img === 'string' ? img : img?.imageUrl))
        .filter((img) => img);
      const mainImage = (() => {
        const primaryImage = Array.isArray(property.images)
          ? property.images.find((img) => typeof img !== 'string' && img?.isPrimary)
          : null;
        return primaryImage
          ? typeof primaryImage === 'string'
            ? primaryImage
            : primaryImage?.imageUrl
          : processedImages[0] || '/property-placeholder.jpg';
      })();
      const propertyType = (property.propertyType || '').toLowerCase();
      const formattedType = propertyType.includes('apartment')
        ? 'apartment'
        : propertyType.includes('shared')
        ? 'shared'
        : propertyType.includes('single')
        ? 'single'
        : 'other';
      const landlord = typeof property.landlord === 'string'
        ? { name: property.landlord }
        : {
            name: property.landlord?.name || 'Unknown',
            email: property.landlord?.email,
            phoneNumber: property.landlord?.phoneNumber,
            responseRate: property.landlord?.responseRate,
            responseTime: property.landlord?.responseTime,
            id: property.landlord?.landlordId,
            image: property.landlord?.imageUrl,
          };
      const coordinates = property.latitude && property.longitude
        ? {
            lat: typeof property.latitude === 'string' ? parseFloat(property.latitude) : property.latitude,
            lng: typeof property.longitude === 'string' ? parseFloat(property.longitude) : property.longitude,
          }
        : undefined;
      const monthlyRent = property.monthlyRent
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
        images: processedImages.length > 0 ? processedImages : ['/property-placeholder.jpg'],
        description: property.description || 'No description provided.',
        amenities: property.details?.amenities || [],
        bedrooms: property.details?.bedrooms,
        bathrooms: property.details?.bathrooms,
        size: property.details?.squareMeters,
        available: property.isAvailable ?? true,
        featured: false,
        rating: 4.0,
        landlord,
        coordinates: coordinates && !isNaN(coordinates.lat) && !isNaN(coordinates.lng) ? coordinates : undefined,
        details: property.details || {},
      };
    } catch (err) {
      console.error('Error formatting property data:', err);
      return null;
    }
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  const handleInquiryButtonClick = () => {
    console.log('PropertyDetailsPage: Inquiry button clicked', {
      isUserLoggedIn,
      propertyId: property?.id,
      studentId: currentUser?.id,
      landlordId: property?.landlord.id,
    });
    if (!property || !property.landlord.id) {
      console.error('PropertyDetailsPage: Missing property or landlord data');
      setError('Unable to send inquiry: Property or landlord information missing.');
      return;
    }
    if (isUserLoggedIn && !currentUser?.id) {
      console.error('PropertyDetailsPage: Missing studentId for logged-in user');
      setError('User not properly authenticated.');
      return;
    }
    const messagingData = {
      receiverId: property.landlord.id,
      propertyId: property.id,
      receiverName: property.landlord.name,
      receiverType: 'landlord',
      propertyTitle: property.title,
      propertyData: property,
      from: '/inquiry',
      studentId: currentUser?.id,
    };
    if (!isUserLoggedIn) {
      console.log('PropertyDetailsPage: Not logged in, redirecting to login', messagingData);
      navigateToLogin('Please log in to send an inquiry about this property');
    } else {
      console.log('PropertyDetailsPage: Logged in, navigating to inquiry', messagingData);
      navigate('/inquiry', { state: messagingData });
    }
  };

  const nextImage = () => {
    if (property?.images?.length) {
      setActiveIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property?.images?.length) {
      setActiveIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  const openZoomedImage = (imageUrl: string, index: number) => {
    setZoomedImage(imageUrl);
    setActiveIndex(index);
  };

  const handleNavigation = (path: string) => {
    const paths: { [key: string]: string } = {
      home: '/studentdashboard',
      services: '/services',
      community: '/community',
      contact: '/contact',
      profile: '/profile',
      saved: '/saved-properties',
      settings: '/settings',
      logout: '/logout',
      register: '/register',
      login: '/login',
    };
    navigate(paths[path] || `/${path}`);
    setMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div
            className="spinner-border mb-3"
            role="status"
            style={{ color: COLORS.PRIMARY, width: '3rem', height: '3rem' }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mb-4">Loading property details...</p>
          <div className="d-flex justify-content-center align-items-center">
            <button className="btn btn-sm btn-outline-secondary" onClick={toggleDebugMode}>
              {debugMode ? 'Hide Debug Info' : 'Show Debug Info'}
            </button>
          </div>
          {debugMode && (
            <div className="mt-4 text-start p-3 border rounded bg-light">
              <h6 className="mb-3">Debug Information:</h6>
              <p>
                <strong>Property ID:</strong> {propertyId}
              </p>
              <p>
                <strong>API Endpoint:</strong> /api/details/details/{propertyId}
              </p>
              <p>
                <strong>Request Headers:</strong> Content-Type: application/json, Accept: application/json
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error Loading Property!</h4>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-between align-items-center">
            <button className="btn btn-outline-danger" onClick={() => navigate(-1)}>
              Go Back
            </button>
            <button className="btn btn-outline-secondary" onClick={toggleDebugMode}>
              {debugMode ? 'Hide Debug Info' : 'Show Debug Info'}
            </button>
          </div>
          {debugMode && (
            <div className="mt-4 p-3 border rounded bg-light">
              <h6 className="mb-3">Debug Information:</h6>
              <p>
                <strong>Property ID:</strong> {propertyId}
              </p>
              <p>
                <strong>API Response:</strong>
              </p>
              <pre
                className="bg-dark text-light p-3 rounded"
                style={{ maxHeight: '200px', overflow: 'auto' }}
              >
                {rawApiResponse ? JSON.stringify(rawApiResponse, null, 2) : 'No API response data'}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container py-5 text-center">
        <h3>Property not found</h3>
        <p>The property you're looking for doesn't exist or has been removed.</p>
        <div className="d-flex justify-content-center gap-3">
          <button
            className="btn"
            style={{ backgroundColor: COLORS.PRIMARY, color: 'white' }}
            onClick={() => navigate('/studentdashboard')}
          >
            Back to Properties
          </button>
          <button className="btn btn-outline-secondary" onClick={toggleDebugMode}>
            {debugMode ? 'Hide Debug Info' : 'Show Debug Info'}
          </button>
        </div>
        {debugMode && (
          <div
            className="mt-4 text-start p-3 border rounded bg-light mx-auto"
            style={{ maxWidth: '800px' }}
          >
            <h6 className="mb-3">Debug Information:</h6>
            <p>
              <strong>Property ID:</strong> {propertyId}
            </p>
            <p>
              <strong>Raw API Response:</strong>
            </p>
            <pre
              className="bg-dark text-light p-3 rounded"
              style={{ maxHeight: '200px', overflow: 'auto' }}
            >
              {rawApiResponse ? JSON.stringify(rawApiResponse, null, 2) : 'No API response data'}
            </pre>
          </div>
        )}
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
            <span className="logo-text"> CribConnect</span>
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
                  <i className="bi bi-person me-1"></i>
                  {isUserLoggedIn ? 'Student' : 'Guest'}
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                  {isUserLoggedIn ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <li>
                        <a className="dropdown-item" href="#" onClick={() => handleNavigation('login')}>
                          <i className="bi bi-box-arrow-in-right me-2"></i>Login
                        </a>
                      </li>
                      <li>
                        <a className="dropdown-item" href="#" onClick={() => handleNavigation('register')}>
                          <i className="bi bi-person-plus me-2"></i>Register
                        </a>
                      </li>
                    </>
                  )}
                </ul>
              </li>
              {!isUserLoggedIn && (
                <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                  <button className="btn btn-primary" onClick={() => handleNavigation('register')}>
                    Register
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <div className="container py-5">
        {/* Property Header */}
        <div className="property-section">
          <h1 className="fw-bold mb-3">{property.title}</h1>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
            <p className="mb-0 d-flex align-items-center text-muted">
              <i className="bi bi-geo-alt me-2"></i>
              {property.location}
            </p>
            <h2 className="fw-bold mb-0 mt-2 mt-md-0">{property.price}</h2>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="property-section">
          <h3 className="section-title">Gallery</h3>
          <div className="position-relative mb-3">
            <div
              className="property-main-image rounded-3 overflow-hidden shadow"
              style={{ height: '500px' }}
            >
              <img
                src={property.images[activeIndex] || '/property-placeholder.jpg'}
                className="w-100 h-100"
                style={{ objectFit: 'cover', cursor: 'zoom-in' }}
                alt={`${property.title} - Featured Image`}
                onClick={() => openZoomedImage(property.images[activeIndex], activeIndex)}
                onError={(e) => {
                  e.currentTarget.src = '/property-placeholder.jpg';
                }}
              />
            </div>
            {property.images.length > 1 && (
              <>
                <button
                  className="position-absolute top-50 start-0 translate-middle-y bg-white rounded-circle border-0 shadow p-2 ms-2"
                  onClick={prevImage}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button
                  className="position-absolute top-50 end-0 translate-middle-y bg-white rounded-circle border-0 shadow p-2 me-2"
                  onClick={nextImage}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </>
            )}
          </div>
          {property.images.length > 1 && (
            <div className="d-flex overflow-auto pb-2 mb-4 thumbnail-container">
              {property.images.map((image, index) => (
                <div
                  key={index}
                  className={`thumbnail-wrapper me-2 ${activeIndex === index ? 'active-thumbnail' : ''}`}
                  onClick={() => setActiveIndex(index)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={image}
                    className="thumbnail-image rounded-3"
                    style={{
                      width: '100px',
                      height: '75px',
                      objectFit: 'cover',
                      border: activeIndex === index ? `3px solid ${COLORS.PRIMARY}` : '3px solid transparent',
                    }}
                    alt={`${property.title} - Image ${index + 1}`}
                    onError={(e) => {
                      e.currentTarget.src = '/property-placeholder.jpg';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Property Description */}
        <div className="property-section">
          <h3 className="section-title">Description</h3>
          <p className="text-muted mb-0">{property.description}</p>
        </div>

        {/* Property Details */}
        <div className="property-section">
          <h3 className="section-title">Property Details</h3>
          <div className="row g-3">
            {property.bedrooms && (
              <div className="col-12 col-sm-6 col-md-4">
                <div className="detail-card text-center p-3 rounded bg-light">
                  <i
                    className="bi bi-door-closed fs-3 mb-2"
                    style={{ color: COLORS.PRIMARY }}
                  ></i>
                  <h5 className="mb-1">{property.bedrooms}</h5>
                  <small className="text-muted">Bedrooms</small>
                </div>
              </div>
            )}
            {property.bathrooms && (
              <div className="col-12 col-sm-6 col-md-4">
                <div className="detail-card text-center p-3 rounded bg-light">
                  <i className="bi bi-droplet fs-3 mb-2" style={{ color: COLORS.PRIMARY }}></i>
                  <h5 className="mb-1">{property.bathrooms}</h5>
                  <small className="text-muted">Bathrooms</small>
                </div>
              </div>
            )}
            {property.size && (
              <div className="col-12 col-sm-6 col-md-4">
                <div className="detail-card text-center p-3 rounded bg-light">
                  <i className="bi bi-rulers fs-3 mb-2" style={{ color: COLORS.PRIMARY }}></i>
                  <h5 className="mb-1">{property.size} m²</h5>
                  <small className="text-muted">Size</small>
                </div>
              </div>
            )}
            <div className="col-12 col-sm-6 col-md-4">
              <div className="detail-card text-center p-3 rounded bg-light">
                <i className="bi bi-house fs-3 mb-2" style={{ color: COLORS.PRIMARY }}></i>
                <h5 className="mb-1 text-capitalize">{property.type}</h5>
                <small className="text-muted">Property Type</small>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-4">
              <div className="detail-card text-center p-3 rounded bg-light">
                <i className="bi bi-calendar-check fs-3 mb-2"></i>
                <h5 className="mb-1">{property.available ? 'Yes' : 'No'}</h5>
                <small className="text-muted">Available</small>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-4">
              <div className="detail-card text-center p-3 rounded bg-light">
                <StarRating rating={property.rating} small />
                <small className="text-muted d-block mt-1">Rating</small>
              </div>
            </div>
          </div>
        </div>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="property-section">
            <h3 className="section-title">Amenities</h3>
            <div className="row g-2">
              {property.amenities.map((amenity, index) => (
                <div key={index} className="col-12 col-sm-6 col-md-4">
                  <div className="d-flex align-items-center p-2 rounded bg-light">
                    <i
                      className="bi bi-check-circle-fill me-2"
                      style={{ color: COLORS.PRIMARY }}
                    ></i>
                    <span className="text-capitalize">{amenity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Map */}
        {property.coordinates && (
          <div className="property-section">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="section-title mb-0">Location</h3>
              <div className="d-flex align-items-center">
                <label htmlFor="radius-slider" className="form-label me-2 mb-0 small">
                  Radius: {mapRadius}km
                </label>
                <input
                  type="range"
                  className="form-range"
                  id="radius-slider"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={mapRadius}
                  onChange={(e) => setMapRadius(parseFloat(e.target.value))}
                  style={{ width: '100px' }}
                />
              </div>
            </div>
            <PropertyMap coordinates={property.coordinates} radius={mapRadius} />
            <div className="mt-2">
              <small className="text-muted">
                <i className="bi bi-geo-alt me-1"></i>
                {property.location}
              </small>
            </div>
          </div>
        )}

        {/* Contact Card */}
        <div className="property-section">
          <h3 className="section-title">Contact Landlord</h3>
          <div className="contact-card p-4 rounded-3 shadow-sm">
            <div className="text-center mb-3">
              <div className="landlord-avatar mx-auto mb-3">
                {property.landlord.image ? (
                  <img
                    src={property.landlord.image}
                    className="rounded-circle"
                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                    alt={property.landlord.name}
                    onError={(e) => {
                      e.currentTarget.src = '/avatar-placeholder.png';
                    }}
                  />
                ) : (
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: COLORS.SECONDARY,
                      color: COLORS.PRIMARY,
                    }}
                  >
                    <i className="bi bi-person fs-2"></i>
                  </div>
                )}
              </div>
              <h5 className="mb-1">{property.landlord.name}</h5>
              <small className="text-muted">Property Owner</small>
            </div>
            <div className="row text-center mb-3">
              {property.landlord.email && (
                <div className="col-12 col-sm-6">
                  <div className="border-end pe-2">
                    <div className="fw-bold">{property.landlord.email}</div>
                    <small className="text-muted">Email</small>
                  </div>
                </div>
              )}
              {property.landlord.phoneNumber && (
                <div className="col-12 col-sm-6">
                  <div className="ps-2">
                    <div className="fw-bold">{property.landlord.phoneNumber}</div>
                    <small className="text-muted">Phone Number</small>
                  </div>
                </div>
              )}
            </div>
            <div className="d-grid gap-2">
              
              {property.landlord.phoneNumber && (
                <a
                  href={`tel:${property.landlord.phoneNumber}`}
                  className="btn btn-outline-primary"
                >
                  <i className="bi bi-telephone me-2"></i>
                  Call Now
                </a>
              )}
              {property.landlord.email && (
                <a
                  href={`mailto:${property.landlord.email}?subject=Inquiry about ${property.title}`}
                  className="btn btn-outline-secondary"
                >
                  <i className="bi bi-envelope me-2"></i>
                  Email Direct
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Quick Info Card */}
        <div className="property-section">
          <h3 className="section-title">Quick Information</h3>
          <div className="quick-info-card p-4 rounded-3 shadow-sm">
            <div className="info-item d-flex justify-content-between py-2 border-bottom">
              <span>Monthly Rent</span>
              <strong>{property.price}</strong>
            </div>
            <div className="info-item d-flex justify-content-between py-2 border-bottom">
              <span>Property Type</span>
              <span className="text-capitalize">{property.type}</span>
            </div>
            {property.bedrooms && (
              <div className="info-item d-flex justify-content-between py-2 border-bottom">
                <span>Bedrooms</span>
                <span>{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="info-item d-flex justify-content-between py-2 border-bottom">
                <span>Bathrooms</span>
                <span>{property.bathrooms}</span>
              </div>
            )}
            {property.size && (
              <div className="info-item d-flex justify-content-between py-2 border-bottom">
                <span>Size</span>
                <span>{property.size} m²</span>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <PropertyReviews propertyId={property.id} />
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          className="modal fade show"
          style={{ display: 'block' }}
          tabIndex={-1}
          onClick={() => setZoomedImage(null)}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content bg-transparent border-0">
              <div className="modal-body p-0 position-relative">
                <button
                  type="button"
                  className="btn-close position-absolute top-0 end-0 m-3 bg-white rounded-circle p-2"
                  style={{ zIndex: 1051 }}
                  onClick={() => setZoomedImage(null)}
                  aria-label="Close"
                ></button>
                <img
                  src={zoomedImage}
                  className="w-100 h-auto rounded-3"
                  alt="Zoomed property image"
                  style={{ maxHeight: '90vh', objectFit: 'contain' }}
                  onError={(e) => {
                    e.currentTarget.src = '/property-placeholder.jpg';
                  }}
                />
                {property.images.length > 1 && (
                  <>
                    <button
                      className="position-absolute top-50 start-0 translate-middle-y btn btn-light rounded-circle ms-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newIndex = (activeIndex - 1 + property.images.length) % property.images.length;
                        setActiveIndex(newIndex);
                        setZoomedImage(property.images[newIndex]);
                      }}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                    <button
                      className="position-absolute top-50 end-0 translate-middle-y btn btn-light rounded-circle me-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newIndex = (activeIndex + 1) % property.images.length;
                        setActiveIndex(newIndex);
                        setZoomedImage(property.images[newIndex]);
                      }}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {zoomedImage && (
        <div className="modal-backdrop fade show" onClick={() => setZoomedImage(null)}></div>
      )}

      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-logo">🏠 CribConnect</div>
          <div className="footer-links">
            <a href="#" className="footer-link">About</a>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
            <a href="#" className="footer-link">Contact</a>
          </div>
          <div className="footer-copyright">© 2025 🏠 CribConnect. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default PropertyDetailsPage;