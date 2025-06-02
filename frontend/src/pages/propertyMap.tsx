import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Circle,
  InfoWindow,
} from "@react-google-maps/api";

// Define colors constant (consistent with PropertyDetailsPage)
const COLORS = {
  PRIMARY: "#4361ee",
  PRIMARY_DARK: "#3a56d4",
  SECONDARY: "#f8f9fa",
  TEXT_DARK: "#212529",
  TEXT_LIGHT: "#6c757d",
};

// Interface for property data from API
interface PropertyData {
  propertyId: number;
  title: string;
  description: string;
  propertyType: string;
  address: string;
  monthlyRent: number;
  isAvailable: boolean;
  latitude: number;
  longitude: number;
  details: {
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    rules: string[];
  };
  images: Array<{
    imageId: number;
    imageUrl: string;
    isPrimary: boolean;
  }>;
  landlord: {
    landlordId: number;
    name: string;
    email: string;
    phoneNumber: string;
    responseRate: number;
    responseTime: string;
  };
}

// Interface for nearby property data
interface NearbyProperty {
  propertyId: number;
  title: string;
  address: string;
  distance: number; // in km
  propertyType: string;
  latitude?: number;
  longitude?: number;
}

// Enhanced Property Map Component
const PropertyMap: React.FC<{
  propertyId: number;
  radius?: number;
  onRadiusChange?: (radius: number) => void;
}> = ({ propertyId, radius = 2, onRadiusChange }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [showInfoWindow, setShowInfoWindow] = useState<number | null>(null);
  const [mapType, setMapType] = useState<google.maps.MapTypeId>(google.maps.MapTypeId.ROADMAP);
  const [loading, setLoading] = useState(true);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [nearbyProperties, setNearbyProperties] = useState<NearbyProperty[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch property details from API
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/details/details/${propertyId}`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setPropertyData(result.data);
          // Set coordinates from API response
          setCoordinates({
            lat: result.data.latitude,
            lng: result.data.longitude,
          });
          setError(null);
        } else {
          throw new Error("Invalid API response structure");
        }
      } catch (err) {
        console.error("Error fetching property details:", err);
        setError("Failed to load property details.");
      }
    };

    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [propertyId]);

  // Fetch nearby properties from backend
  useEffect(() => {
    const fetchNearbyProperties = async () => {
      if (!coordinates) return;
      
      try {
        const response = await fetch(
          `/api/properties/nearby?lat=${coordinates.lat}&longitude=${coordinates.lng}&radius=${radius * 1000}`,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setNearbyProperties(data || []);
      } catch (err) {
        console.error("Error fetching nearby properties:", err);
        // Don't set error for nearby properties failure, just log it
      }
    };

    if (coordinates) {
      fetchNearbyProperties();
    }
  }, [coordinates, radius]);

  // Validate coordinates and property data
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (!propertyData || !coordinates || isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
    if (loading) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: "300px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading property details...</span>
          </div>
        </div>
      );
    }
    return (
      <div className="alert alert-warning" role="alert">
        Invalid property coordinates. Please check property location data.
      </div>
    );
  }

  const mapStyles = {
    height: "300px",
    width: "100%",
  };

  const circleOptions = {
    strokeColor: COLORS.PRIMARY,
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: COLORS.PRIMARY,
    fillOpacity: 0.2,
    radius: radius * 1000, // Convert km to meters
  };

  const onMarkerClick = (propertyId: number) => {
    setShowInfoWindow(showInfoWindow === propertyId ? null : propertyId);
  };

  const onMapLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setLoading(false);
  };

  const changeMapType = (newType: google.maps.MapTypeId) => {
    if (map) {
      setMapType(newType);
      map.setMapTypeId(newType);
    }
  };

  const handleRadiusChange = (newRadius: number) => {
    if (onRadiusChange) {
      onRadiusChange(newRadius);
    }
  };

  // Check for Google Maps API key
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return (
      <div className="alert alert-danger" role="alert">
        Google Maps API key is missing. Please configure REACT_APP_GOOGLE_MAPS_API_KEY in your environment.
      </div>
    );
  }

  return (
    <div className="map-section">
      <div className="map-container rounded-3 overflow-hidden shadow-sm">
        {loading && (
          <div
            className="d-flex justify-content-center align-items-center bg-light"
            style={{ height: "300px" }}
          >
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading map...</span>
            </div>
          </div>
        )}
        <LoadScript googleMapsApiKey={apiKey} loadingElement={<div />}>
          <GoogleMap
            mapContainerStyle={mapStyles}
            zoom={14}
            center={coordinates}
            onLoad={onMapLoad}
            mapTypeId={mapType}
            options={{
              streetViewControl: true,
              mapTypeControl: false,
              fullscreenControl: true,
              zoomControl: true,
              scrollwheel: false,
            }}
          >
            {/* Main property marker */}
            <Marker
              position={coordinates}
              onClick={() => onMarkerClick(propertyData.propertyId)}
              icon={{
                url: "/marker-house.png",
                scaledSize: new window.google.maps.Size(40, 40),
              }}
              title={propertyData.title}
            />
            {showInfoWindow === propertyData.propertyId && (
              <InfoWindow
                position={coordinates}
                onCloseClick={() => setShowInfoWindow(null)}
              >
                <div style={{ padding: "5px", maxWidth: "250px" }}>
                  <h6 className="mb-1">{propertyData.title}</h6>
                  <p className="mb-1 small text-muted">{propertyData.address}</p>
                  <p className="mb-1 small">
                    <strong>K{propertyData.monthlyRent.toLocaleString()}/month</strong>
                  </p>
                  <div className="d-flex gap-1 mb-2">
                    <span className="badge bg-primary text-capitalize">
                      {propertyData.propertyType.replace('_', ' ')}
                    </span>
                    {propertyData.isAvailable && (
                      <span className="badge bg-success">Available</span>
                    )}
                  </div>
                  <small className="text-muted">
                    {propertyData.details.bedrooms} bed • {propertyData.details.bathrooms} bath
                  </small>
                </div>
              </InfoWindow>
            )}

            {/* Nearby properties markers */}
            {nearbyProperties.map((property) => (
              <React.Fragment key={property.propertyId}>
                <Marker
                  position={{
                    lat: property.latitude || coordinates.lat + (Math.random() - 0.5) * 0.01,
                    lng: property.longitude || coordinates.lng + (Math.random() - 0.5) * 0.01,
                  }}
                  onClick={() => onMarkerClick(property.propertyId)}
                  icon={{
                    url: "/marker-nearby.png",
                    scaledSize: new window.google.maps.Size(30, 30),
                  }}
                  title={property.title}
                />
                {showInfoWindow === property.propertyId && (
                  <InfoWindow
                    position={{
                      lat: property.latitude || coordinates.lat + (Math.random() - 0.5) * 0.01,
                      lng: property.longitude || coordinates.lng + (Math.random() - 0.5) * 0.01,
                    }}
                    onCloseClick={() => setShowInfoWindow(null)}
                  >
                    <div style={{ padding: "5px", maxWidth: "200px" }}>
                      <h6 className="mb-1">{property.title}</h6>
                      <p className="mb-1 small text-muted">{property.address}</p>
                      <span className="badge bg-secondary text-capitalize">
                        {property.propertyType.replace('_', ' ')}
                      </span>
                      <p className="mb-0 small">{property.distance.toFixed(2)} km away</p>
                    </div>
                  </InfoWindow>
                )}
              </React.Fragment>
            ))}

            <Circle center={coordinates} options={circleOptions} />
          </GoogleMap>
        </LoadScript>
      </div>

      <div className="map-controls mt-3 d-flex flex-wrap justify-content-between align-items-center">
        <div className="map-type-buttons mb-2">
          <div className="btn-group" role="group" aria-label="Map type selection">
            <button
              type="button"
              className={`btn ${
                mapType === google.maps.MapTypeId.ROADMAP ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => changeMapType(google.maps.MapTypeId.ROADMAP)}
              aria-label="Switch to roadmap view"
            >
              <i className="bi bi-map me-1"></i>Map
            </button>
            <button
              type="button"
              className={`btn ${
                mapType === google.maps.MapTypeId.SATELLITE ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => changeMapType(google.maps.MapTypeId.SATELLITE)}
              aria-label="Switch to satellite view"
            >
              <i className="bi bi-globe me-1"></i>Satellite
            </button>
            <button
              type="button"
              className={`btn ${
                mapType === google.maps.MapTypeId.HYBRID ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => changeMapType(google.maps.MapTypeId.HYBRID)}
              aria-label="Switch to hybrid view"
            >
              <i className="bi bi-layers-half me-1"></i>Hybrid
            </button>
          </div>
        </div>

        {onRadiusChange && (
          <div className="radius-control mb-2 d-flex align-items-center">
            <label htmlFor="radiusSlider" className="form-label mb-0 me-2">
              Search Radius: <strong>{radius} km</strong>
            </label>
            <input
              type="range"
              className="form-range"
              id="radiusSlider"
              min="1"
              max="5"
              step="0.5"
              value={radius}
              onChange={(e) => handleRadiusChange(parseFloat(e.target.value))}
              style={{ width: "150px" }}
              aria-label={`Adjust search radius, current value ${radius} kilometers`}
            />
          </div>
        )}
      </div>

      <div className="nearby-places mt-3">
        <h5 className="mb-3">
          <i className="bi bi-geo-alt-fill me-2 text-primary"></i>Nearby Properties
        </h5>
        {nearbyProperties.length > 0 ? (
          <div className="row">
            {nearbyProperties.map((place) => (
              <div className="col-md-4 mb-2" key={place.propertyId}>
                <div className="d-flex align-items-center p-2 rounded bg-light">
                  <div className="me-2 text-primary">
                    <i className="bi bi-house fs-4"></i>
                  </div>
                  <div>
                    <p className="mb-0 fw-medium">{place.title}</p>
                    <small className="text-muted">{place.distance.toFixed(2)} km</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">No nearby properties found within {radius} km.</p>
        )}
        <div className="mt-3 text-center">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-primary"
            aria-label="Get directions to property location"
          >
            <i className="bi bi-signpost-2 me-2"></i>Get Directions
          </a>
        </div>
      </div>

      {/* Property Summary */}
      <div className="property-summary mt-3 p-3 bg-light rounded">
        <h6 className="mb-2">Property Details</h6>
        <div className="row">
          <div className="col-md-6">
            <small className="text-muted d-block">Address</small>
            <p className="mb-1">{propertyData.address}</p>
          </div>
          <div className="col-md-6">
            <small className="text-muted d-block">Monthly Rent</small>
            <p className="mb-1 fw-bold text-primary">K{propertyData.monthlyRent.toLocaleString()}</p>
          </div>
        </div>
        <div className="row mt-2">
          <div className="col-md-4">
            <small className="text-muted d-block">Bedrooms</small>
            <p className="mb-1">{propertyData.details.bedrooms}</p>
          </div>
          <div className="col-md-4">
            <small className="text-muted d-block">Bathrooms</small>
            <p className="mb-1">{propertyData.details.bathrooms}</p>
          </div>
          <div className="col-md-4">
            <small className="text-muted d-block">Status</small>
            <span className={`badge ${propertyData.isAvailable ? 'bg-success' : 'bg-warning'}`}>
              {propertyData.isAvailable ? 'Available' : 'Not Available'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyMap;