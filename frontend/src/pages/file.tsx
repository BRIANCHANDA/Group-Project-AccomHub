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



  // Process all properties, ensuring to filter out any null results
  const allListings = propertiesData;  // Don't reprocess already formatted data

  // Helper to extract numeric price from e.g. "K1,500 / month" -> 1500
  // Helper to format price with K prefix and commas
  const formatPrice = (amount: number) => {
    return `K${amount.toLocaleString()} / month`;
  };

  // Helper to extract numeric price from formatted string
  const getNumericPrice = (priceString: string) => {
    if (!priceString) return 0;
    const numeric = priceString.replace(/[^\d]/g, ''); // Remove all non-digit characters
    return parseInt(numeric, 10) || 0;
  };

  
  // Modified handleInquirySubmit to work with your modal
  const handleInquirySubmit = async (e) => {
    e.preventDefault();

    if (!selectedListing || !inquiryMessage || !inquiryEmail || !inquiryPhone) {
      alert("Please fill out all required fields");
      return;
    }
    try {
      
      const submittingStudentId = studentId || currentUser.id; 
      const contactPreference = "any"; // Default to "any" since your form doesn't have this field yet

      const inquiryData = {
        propertyId: selectedListing.id,
        studentId: submittingStudentId,
        message: inquiryMessage,
        email: inquiryEmail,
        phone: inquiryPhone,
        contactPreference: contactPreference
      };

      // Make API call to create inquiry
      const response = await fetch('/api/inquiries/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inquiryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit inquiry');
      }

      const data = await response.json();

      // Clear the form and close modal
      setInquiryEmail('');
      setInquiryPhone('');
      setInquiryMessage('');
      setShowInquiryModal(false);

      // Show success message
      alert(`Your inquiry for ${selectedListing.title} has been sent successfully!`);

    } catch (error) {
      console.error('Error submitting inquiry:', error);
      alert(`Failed to submit inquiry: ${error.message}`);
    }
  };

  // Open inquiry modal
  const openInquiryModal = () => {
    setShowInquiryModal(true);
    setShowDetailModal(false);
  };

      {selectedListing && (
        <div className={`modal fade ${showDetailModal ? 'show' : ''}`} tabIndex={-1} style={{ display: showDetailModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">{selectedListing.title}</h5>
                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body">
                {/* Image carousel */}
                <div id="propertyImages" className="carousel slide mb-4" data-bs-ride="carousel">
                  <div className="carousel-inner rounded-3 overflow-hidden">
                    {selectedListing.images && selectedListing.images.length > 0 ? (
                      selectedListing.images.map((image, index) => (
                        <div className={`carousel-item ${index === 0 ? 'active' : ''}`} key={index}>
                          <img
                            src={image}
                            className="d-block w-100"
                            style={{ height: "350px", objectFit: "cover" }}
                            alt={`${selectedListing.title} - image ${index + 1}`}
                            onError={(e) => {
                              e.currentTarget.src = '/property-placeholder.jpg';
                            }}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="carousel-item active">
                        <img
                          src={selectedListing.image || '/property-placeholder.jpg'}
                          className="d-block w-100"
                          style={{ height: "350px", objectFit: "cover" }}
                          alt={selectedListing.title}
                        />
                      </div>
                    )}
                  </div>
                  <button className="carousel-control-prev" type="button" data-bs-target="#propertyImages" data-bs-slide="prev">
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Previous</span>
                  </button>
                  <button className="carousel-control-next" type="button" data-bs-target="#propertyImages" data-bs-slide="next">
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Next</span>
                  </button>
                </div>

                <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
                  <div>
                    <h3 className="fw-bold mb-2">{selectedListing.title}</h3>
                    <p className="d-flex align-items-center mb-1" style={{ color: COLORS.PRIMARY }}>
                      <i className="bi bi-geo-alt me-1"></i> {selectedListing.location}
                    </p>
                    <div className="mb-2">
                      <StarRating rating={selectedListing.rating} />
                    </div>
                  </div>
                  <div className="text-end">
                    <h3 className="fw-bold" style={{ color: COLORS.PRIMARY_DARK }}>{selectedListing.price}</h3>
                    <span className={`badge ${selectedListing.available ? 'bg-success' : 'bg-danger'}`}>
                      {selectedListing.available ? 'Available Now' : 'Currently Unavailable'}
                    </span>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-4">
                    <div className="text-center">
                      <i className="bi bi-door-open fs-4" style={{ color: COLORS.PRIMARY }}></i>
                      <p className="mb-0 fw-bold">{selectedListing.bedrooms || 'N/A'} Bedrooms</p>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center">
                      <i className="bi bi-bucket fs-4" style={{ color: COLORS.PRIMARY }}></i>
                      <p className="mb-0 fw-bold">{selectedListing.bathrooms || 'N/A'} Bathrooms</p>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center">
                      <i className="bi bi-arrows-angle-expand fs-4" style={{ color: COLORS.PRIMARY }}></i>
                      <p className="mb-0 fw-bold">{selectedListing.size || 'N/A'} m²</p>
                    </div>
                  </div>
                </div>

                <hr />

                <div className="row mb-4">
                  <div className="col-md-8">
                    <h5 className="fw-bold mb-3">Description</h5>
                    <p>{selectedListing.description}</p>


                    <h5 className="fw-bold mb-3 mt-4">Property Manager</h5>
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-light overflow-hidden me-3" style={{ width: "50px", height: "50px" }}>
                        <img
                          src={selectedListing.landlord.image || '/default-avatar.png'}
                          alt="Landlord"
                          className="w-100 h-100"
                          onError={(e) => {
                            e.currentTarget.src = '/default-avatar.png';
                          }}
                        />
                      </div>
                      <div>
                        <p className="fw-bold mb-0">{selectedListing.landlord.name}</p>
                        {selectedListing.landlord.responseRate && (
                          <div className="d-flex align-items-center">
                            <StarRating rating={selectedListing.landlord.responseRate / 20} small />
                            <span className="ms-2 small">
                              {selectedListing.landlord.responseRate}% response rate
                            </span>
                          </div>
                        )}
                        {selectedListing.landlord.responseTime && (
                          <p className="small text-muted mb-0">
                            Typically responds within {selectedListing.landlord.responseTime}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="fw-bold mb-0">{selectedListing.landlord.name}</p>
                    <p className="small text-muted mb-0">Property Manager</p>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <h5 className="fw-bold mb-3">Amenities</h5>
                <ul className="list-group list-group-flush">
                  {selectedListing.amenities && selectedListing.amenities.length > 0 ? (
                    selectedListing.amenities.map((amenity, index) => (
                      <li className="list-group-item px-0 d-flex align-items-center" key={index}>
                        <i className="bi bi-check-circle-fill me-2" style={{ color: COLORS.PRIMARY }}></i>
                        {amenity}
                      </li>
                    ))
                  ) : (
                    <li className="list-group-item px-0 text-muted">No amenities listed</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="bg-light rounded-3 p-4">
              <h5 className="fw-bold mb-3">Contact Information</h5>
              <div className="row">
                {selectedListing.landlord.email && (
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <i className="bi bi-envelope fs-4 me-3" style={{ color: COLORS.PRIMARY }}></i>
                      <div>
                        <p className="fw-bold mb-0">Email</p>
                        <p className="mb-0">
                          <a href={`mailto:${selectedListing.landlord.email}`}>
                            {selectedListing.landlord.email}
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {selectedListing.landlord.phoneNumber && (
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <i className="bi bi-telephone fs-4 me-3" style={{ color: COLORS.PRIMARY }}></i>
                      <div>
                        <p className="fw-bold mb-0">Phone</p>
                        <p className="mb-0">
                          <a href={`tel:${selectedListing.landlord.phoneNumber}`}>
                            {selectedListing.landlord.phoneNumber}
                          </a>
                        </p>
                        {selectedListing.landlord.responseRate && (
                          <small className="text-muted">
                            Response rate: {selectedListing.landlord.responseRate}%
                          </small>
                        )}
                        {selectedListing.landlord.responseTime && (
                          <small className="text-muted d-block">
                            Typically responds within {selectedListing.landlord.responseTime}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn"
              onClick={() => setShowDetailModal(false)}
              style={{ borderColor: COLORS.PRIMARY, color: COLORS.PRIMARY }}
            >
              Close
            </button>
            <button
              type="button"
              className="btn text-white"
              style={{ backgroundColor: COLORS.PRIMARY }}
              onClick={openInquiryModal}
              disabled={!selectedListing.available}
            >
              Send Inquiry
            </button>
          </div>
        </div>
      )}



      {/* Inquiry Form Modal */}

      {selectedListing && (
        <div className={`modal fade ${showInquiryModal ? 'show' : ''}`} tabIndex="-1" style={{ display: showInquiryModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: COLORS.PRIMARY, color: 'white' }}>
                <h5 className="modal-title">Inquiry for {selectedListing.title}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowInquiryModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleInquirySubmit}>
                  <div className="mb-3">
                    <label htmlFor="inquiryEmail" className="form-label">Email address</label>
                    <input
                      type="email"
                      className="form-control"
                      id="inquiryEmail"
                      placeholder="Your email address"
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="inquiryPhone" className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      id="inquiryPhone"
                      placeholder="Your phone number"
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="inquiryMessage" className="form-label">Message</label>
                    <textarea
                      className="form-control"
                      id="inquiryMessage"
                      rows="4"
                      placeholder="I'm interested in this property and would like to..."
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn text-white"
                      style={{ backgroundColor: COLORS.PRIMARY }}
                    >
                      Submit Inquiry
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
