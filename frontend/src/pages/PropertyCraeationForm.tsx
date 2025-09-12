import React, { useState, useEffect } from 'react';
import { X, Upload, MapPin } from 'lucide-react';
import { toast } from 'react-toastify'; // Optional: for user feedback
import './amenities.css';
import './propertyCreation.css';

interface GeocodedLocation {
  latitude: number | null;
  longitude: number | null;
  formattedAddress: string;
  status: 'success' | 'error' | 'loading' | 'idle';
  error?: string;
}

interface PropertyType {
  id: string;
  name: string;
  value: string;
}

interface PropertyCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (propertyId: string, propertyData?: any) => void;
  landlordId: string;
}

interface PropertyDetails {
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  squareFootage: string;
  amenities: string[];
}

interface PropertyDataType {
  title: string;
  description: string;
  propertyType: string;
  address: string;
  monthlyRent: string;
  isAvailable: boolean;
  targetUniversity: string;
  details: PropertyDetails;
  location?: {
    latitude: number | null;
    longitude: number | null;
    formattedAddress: string;
  };
}

interface ImageFile {
  file: File;
  preview: string;
  isPrimary: boolean;
}

enum FormStage {
  PROPERTY_DETAILS = 'property_details',
  IMAGE_UPLOAD = 'image_upload',
}

const AVAILABLE_AMENITIES = [
  'Parking',
  'Gym',
  'Pool',
  'WiFi',
  'Air Conditioning',
  'Heating',
  'Washer/Dryer',
  'Dishwasher',
  'Balcony',
  'Pet Friendly',
  'Security System',
  'Elevator',
  'Doorman',
  'Furnished',
  'Fireplace',
];

const PropertyCreationForm = ({ isOpen, onClose, onSubmit, landlordId }: PropertyCreationFormProps) => {
  const initialPropertyData: PropertyDataType = {
    title: '',
    description: '',
    propertyType: '',
    address: '',
    monthlyRent: '',
    isAvailable: true,
    targetUniversity: '',
    details: {
      bedrooms: 1,
      bathrooms: 1,
      furnished: false,
      squareFootage: '',
      amenities: [],
    },
  };


  const AVAILABLE_UNIVERSITIES = [
    'University of Zambia (UNZA)',
    'Copperbelt University (CBU)',
    'Mulungushi University (MU)',
    'Zambia Open University',
    'Cavendish University',
    'Texila American University',
    'Information and Communications University',
    'Levy Mwanawasa Medical University',
    'Rockview University',
    'Kwame Nkrumah University',
    'University of Lusaka',
    'Chalimbana University',
    'Other'
  ];



  const [propertyData, setPropertyData] = useState(initialPropertyData);
  const [formStage, setFormStage] = useState<FormStage>(FormStage.PROPERTY_DETAILS);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [isLoadingPropertyTypes, setIsLoadingPropertyTypes] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [landlordIdError, setLandlordIdError] = useState<string>('');
  const [geocodedLocation, setGeocodedLocation] = useState<GeocodedLocation>({
    latitude: null,
    longitude: null,
    formattedAddress: '',
    status: 'idle',
  });
  const [showLocationWindow, setShowLocationWindow] = useState(false);
  const [addressDebounceTimer, setAddressDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [amenityInput, setAmenityInput] = useState<string>('');
  const [amenitySuggestions, setAmenitySuggestions] = useState<string[]>([]);
  const [activeAmenityIndex, setActiveAmenityIndex] = useState<number>(-1);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && !landlordId) {
      setLandlordIdError('No landlord ID provided. Unable to create property.');
    } else {
      setLandlordIdError('');
    }
  }, [isOpen, landlordId]);

  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        setIsLoadingPropertyTypes(true);
        const response = await fetch('/api/properties/property-types', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('');
        }

        const data = await response.json();
        setPropertyTypes(data);

        if (data.length > 0 && !propertyData.propertyType) {
          setPropertyData(prev => ({
            ...prev,
            propertyType: data[0].value,
          }));
        }
      } catch (error) {
        console.error('Error fetching property types:', error);
        setLoadError('');
        setPropertyTypes([
          { id: '1', name: 'Apartment', value: 'apartment' },
          { id: '2', name: 'House', value: 'house' },
          { id: '3', name: 'Shared Room', value: 'shared_room' },
          { id: '4', name: 'Single Room', value: 'single_room' },
        ]);
      } finally {
        setIsLoadingPropertyTypes(false);
      }
    };

    if (isOpen) {
      fetchPropertyTypes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (addressDebounceTimer) {
      clearTimeout(addressDebounceTimer);
    }

    if (propertyData.address && propertyData.address.trim().length > 3) {
      const timer = setTimeout(() => {
        geocodeAddress(propertyData.address);
      }, 1000) as NodeJS.Timeout;

      setAddressDebounceTimer(timer);
    } else {
      setGeocodedLocation({
        latitude: null,
        longitude: null,
        formattedAddress: '',
        status: 'idle',
      });
      setShowLocationWindow(false);
    }

    return () => {
      if (addressDebounceTimer) {
        clearTimeout(addressDebounceTimer);
      }
    };
  }, [propertyData.address]);

  const geocodeAddress = async (address: string) => {
    if (!address.trim()) {
      setGeocodedLocation({
        latitude: null,
        longitude: null,
        formattedAddress: '',
        status: 'idle',
        error: 'Address is required',
      });
      return;
    }

    setGeocodedLocation(prev => ({ ...prev, status: 'loading' }));
    setShowLocationWindow(true);

    try {
      const response = await fetch(`/api/properties/geocoding?address=${encodeURIComponent(address)}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data: { latitude: number | null; longitude: number | null; formattedAddress?: string; success: boolean; error?: string } = await response.json();

      if (data.success && data.latitude !== null && data.longitude !== null) {
        const newLocation = {
          latitude: data.latitude,
          longitude: data.longitude,
          formattedAddress: data.formattedAddress || address,
          status: 'success' as const,
        };

        setGeocodedLocation(newLocation);

        setPropertyData(prev => ({
          ...prev,
          location: {
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            formattedAddress: newLocation.formattedAddress,
          },
        }));
      } else {
        const errorMsg = data.error || 'No results found for this address';
        setGeocodedLocation({
          latitude: null,
          longitude: null,
          formattedAddress: '',
          status: 'error',
          error: errorMsg,
        });
        toast.error(errorMsg); // Optional: User feedback
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to geocode address';
      console.error('Geocoding error:', error);
      setGeocodedLocation({
        latitude: null,
        longitude: null,
        formattedAddress: '',
        status: 'error',
        error: errorMsg,
      });
      toast.error(errorMsg); // Optional: User feedback
    }
  };

  const validatePropertyForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!propertyData.title.trim()) newErrors.title = 'Property title is required';
    if (!propertyData.address.trim()) newErrors.address = 'Address is required';
    if (!propertyData.monthlyRent || parseFloat(propertyData.monthlyRent) <= 0) {
      newErrors.monthlyRent = 'Valid monthly rent is required';
    }
    if (!propertyData.targetUniversity) newErrors.targetUniversity = 'Target university is required';
    if (!propertyData.propertyType) newErrors.propertyType = 'Property type is required';
    if (geocodedLocation.status !== 'success' || geocodedLocation.latitude === null || geocodedLocation.longitude === null) {
      newErrors.address = 'Valid geocoded address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateImageForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (images.length === 0) {
      newErrors.images = 'At least one property image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name.includes('.')) {
      const [parent, child] = name.split('.') as [keyof typeof initialPropertyData, string];
      setPropertyData(prev => ({
        ...prev,
        [parent]: { ...(typeof prev[parent] === 'object' ? prev[parent] : {}), [child]: type === 'checkbox' ? checked : value },
      }));
    } else {
      setPropertyData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  const handleAmenityInput = (value: string) => {
    setAmenityInput(value);

    const lastWord = value.split(/[, ]+/).pop()?.trim() || '';
    if (lastWord) {
      const filteredSuggestions = AVAILABLE_AMENITIES.filter(
        amenity =>
          amenity.toLowerCase().includes(lastWord.toLowerCase()) &&
          !propertyData.details.amenities.includes(amenity)
      );
      setAmenitySuggestions(filteredSuggestions);
      setShowSuggestions(true);
      setActiveAmenityIndex(-1);
    } else {
      setAmenitySuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleDeleteAmenity = (amenityToDelete: string) => {
    const newAmenities = propertyData.details.amenities.filter(
      amenity => amenity !== amenityToDelete
    );

    setPropertyData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        amenities: newAmenities,
      },
    }));

    setAmenityInput(newAmenities.join(', '));
  };



  const toggleAmenity = (amenity: string) => {
    const currentAmenities = propertyData.details.amenities;
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];

    setPropertyData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        amenities: newAmenities,
      },
    }));

    // Clear the input when adding from the available list
    if (!currentAmenities.includes(amenity)) {
      setAmenityInput('');
    } else {
      setAmenityInput(newAmenities.join(', '));
    }
  };

  const handleAmenityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setActiveAmenityIndex(prev => (prev <= 0 ? amenitySuggestions.length - 1 : prev - 1));
        break;

      case 'ArrowDown':
        e.preventDefault();
        setActiveAmenityIndex(prev => (prev >= amenitySuggestions.length - 1 ? 0 : prev + 1));
        break;

      case 'Enter':
        e.preventDefault();
        if (activeAmenityIndex >= 0 && amenitySuggestions[activeAmenityIndex]) {
          const selectedAmenity = amenitySuggestions[activeAmenityIndex];
          const words = amenityInput.split(/[, ]+/);
          words.pop();
          const newInput = [...words, selectedAmenity].join(', ') + ', ';
          handleAmenityInput(newInput);
        }
        break;

      case 'Escape':
        setShowSuggestions(false);
        setAmenitySuggestions([]);
        setActiveAmenityIndex(-1);
        break;
    }
  };

  const handleAmenitySelect = (amenity: string) => {
    const words = amenityInput.split(/[, ]+/);
    words.pop();
    const newInput = [...words, amenity].join(', ') + ', ';
    handleAmenityInput(newInput);
  };

  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (errors.images) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }

    const validFiles: File[] = [];
    const invalidFiles: { file: File; reason: string }[] = [];

    files.forEach(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/gif'].includes(file.type);
      const isValidSize = file.size <= MAX_FILE_SIZE_BYTES;

      if (!isValidType) {
        invalidFiles.push({ file, reason: 'Invalid file type. Only JPEG, PNG, and GIF are accepted.' });
      } else if (!isValidSize) {
        invalidFiles.push({
          file,
          reason: `File too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Max size is ${MAX_FILE_SIZE_MB}MB.`,
        });
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      const invalidMessages = invalidFiles.map(item => `${item.file.name}: ${item.reason}`);
      alert(`Some files were skipped:\n${invalidMessages.join('\n')}`);
    }

    if (validFiles.length === 0) return;

    validFiles.forEach(file => {
      try {
        const previewUrl = URL.createObjectURL(file);
        setPreviewImages(prev => [...prev, previewUrl]);

        setImages(prev => [
          ...prev,
          {
            file,
            preview: previewUrl,
            isPrimary: prev.length === 0,
          },
        ]);
      } catch (error) {
        console.error('Error creating preview:', error);
      }
    });
  };

  const setImageAsPrimary = (index: number): void => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    })));
  };

  interface RemoveImageProps {
    index: number;
  }

  const removeImage = ({ index }: RemoveImageProps): void => {
    if (previewImages[index] && previewImages[index].startsWith('blob:')) {
      URL.revokeObjectURL(previewImages[index]);
    }

    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      if (prev[index]?.isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      return newImages;
    });
  };

  const handleCreateProperty = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validatePropertyForm()) {
      return;
    }

    if (!landlordId) {
      alert('Error: No landlord ID provided');
      return;
    }

    setIsSubmitting(true);

    try {
      const draftRes = await fetch('/api/properties/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landlordId: parseInt(landlordId),
          targetUniversity: propertyData.targetUniversity,
        }),
      });

      if (!draftRes.ok) {
        const errorData = await draftRes.json();
        throw new Error(errorData.message || 'Failed to create draft property');
      }

      const draftData = await draftRes.json();
      const newPropertyId = draftData.propertyId;
      setPropertyId(newPropertyId.toString());

      console.log('Draft property created with ID:', newPropertyId);

      const updateRes = await fetch(`/api/properties/properties/${newPropertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: propertyData.title,
          description: propertyData.description,
          propertyType: propertyData.propertyType,
          address: propertyData.address,
          monthlyRent: parseFloat(propertyData.monthlyRent),
          isAvailable: propertyData.isAvailable,
          targetUniversity: propertyData.targetUniversity,
          ...(propertyData.location &&
            propertyData.location.latitude !== null &&
            propertyData.location.longitude !== null && {
            latitude: propertyData.location.latitude,
            longitude: propertyData.location.longitude,
          }),
        }),
      });

      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        throw new Error(errorData.message || 'Failed to update property details');
      }

      try {
        const detailsRes = await fetch(`/api/property-details/properties/${newPropertyId}/details`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bedrooms: parseInt(String(propertyData.details.bedrooms)) || 0,
            bathrooms: parseFloat(String(propertyData.details.bathrooms)) || 0,
            furnished: propertyData.details.furnished,
            squareFootage: parseFloat(propertyData.details.squareFootage) || 0,
            amenities: propertyData.details.amenities.filter(a => a.trim() !== ''),
          }),
        });

        if (!detailsRes.ok) {
          const errorData = await detailsRes.json();
          throw new Error(errorData.message || 'Failed to update details');
        }

        setFormStage(FormStage.IMAGE_UPLOAD);
      } catch (detailsError) {
        console.error('Failed to update property details:', detailsError);
        alert('There was an issue updating property details. Please try again.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadImages = async (): Promise<boolean> => {
    if (!propertyId) {
      alert('Error: Property ID not found');
      return false;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const totalImages = images.length;
      if (totalImages === 0) {
        return false;
      }

      console.log('Uploading images with propertyId:', propertyId);

      let successCount = 0;
      let failedImages: string[] = [];

      for (let i = 0; i < totalImages; i++) {
        const img = images[i];
        try {
          setUploadProgress(Math.floor((i / totalImages) * 90));

          const formData = new FormData();
          formData.append('propertyId', propertyId);
          formData.append('image', img.file);
          formData.append('isPrimary', img.isPrimary.toString());

          console.log(`Uploading image ${i + 1}:`, {
            propertyId,
            isPrimary: img.isPrimary,
            fileName: img.file.name,
            fileSize: img.file.size,
          });

          const imageRes = await fetch('/api/property-images/property-images', {
            method: 'POST',
            body: formData,
          });

          if (!imageRes.ok) {
            const errorData = await imageRes.json();
            console.error('Image upload response:', await imageRes.clone().text());
            throw new Error(errorData.message || 'Image upload failed');
          }

          successCount++;
        } catch (error) {
          console.error(`Failed to upload image ${i + 1}:`, error);
          failedImages.push(`Image ${i + 1}`);
        }
      }

      if (failedImages.length > 0) {
        console.warn(`${failedImages.length} images failed to upload`);
        if (successCount === 0) {
          alert('Error: All images failed to upload. Please try again.');
          return false;
        } else {
          alert(`Warning: ${failedImages.length} out of ${totalImages} images failed to upload.`);
        }
      }

      setUploadProgress(100);

      previewImages.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });

      return successCount > 0;
    } catch (error) {
      console.error('Image upload process failed:', error);
      alert(`Error uploading images: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitImages = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateImageForm()) {
      return;
    }

    const imagesUploaded = await uploadImages();
    if (imagesUploaded && propertyId) {
      const completePropertyData = {
        id: propertyId,
        location: propertyData.address,
        price: `K${propertyData.monthlyRent}`,
        status: propertyData.isAvailable ? 'Available' : 'Not Available',
        details: {
          bedrooms: propertyData.details.bedrooms,
          bathrooms: propertyData.details.bathrooms,
          furnished: propertyData.details.furnished,
          squareFootage: propertyData.details.squareFootage,
          amenities: propertyData.details.amenities,
        },
        description: propertyData.description,
        propertyType: propertyData.propertyType,
        coordinates: propertyData.location
          ? {
            latitude: propertyData.location.latitude,
            longitude: propertyData.location.longitude,
            formattedAddress: propertyData.location.formattedAddress,
          }
          : undefined,
      };

      onSubmit(propertyId, completePropertyData);
      onClose();
    }
  };

  const handleReset = () => {
    previewImages.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setPreviewImages([]);
    setImages([]);
    setPropertyData(initialPropertyData);
    setErrors({});
    setFormStage(FormStage.PROPERTY_DETAILS);
    setPropertyId(null);
    setGeocodedLocation({
      latitude: null,
      longitude: null,
      formattedAddress: '',
      status: 'idle',
    });
    setShowLocationWindow(false);
    setAmenityInput('');
    setAmenitySuggestions([]);
    setShowSuggestions(false);
    setActiveAmenityIndex(-1);
  };

  const handleCancel = () => {
    if (propertyId && formStage === FormStage.IMAGE_UPLOAD) {
      fetch(`/api/properties/properties/${propertyId}`, {
        method: 'DELETE',
      }).catch(err => console.error('Failed to delete property:', err));
    }

    previewImages.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });

    onClose();
  };

  const closeLocationWindow = () => {
    setShowLocationWindow(false);
  };

  if (!isOpen) return null;

  return (
    <div className="property-form-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{formStage === FormStage.PROPERTY_DETAILS ? 'Add New Property' : 'Upload Property Images'}</h2>
          <button
            type="button"
            onClick={handleCancel}
            className="close-btn"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          {landlordIdError && (
            <div className="error-banner">
              {landlordIdError}
            </div>
          )}

          {formStage === FormStage.PROPERTY_DETAILS ? (
            <form onSubmit={handleCreateProperty} noValidate>
              <fieldset className="form-section">
                <legend>Basic Information</legend>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="property-title">Property Title*</label>
                    <input
                      id="property-title"
                      type="text"
                      name="title"
                      value={propertyData.title}
                      onChange={handleChange}
                      required
                      className={errors.title ? 'input-error' : ''}
                    />
                    {errors.title && <span className="error-message">{errors.title}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="property-type">Property Type*</label>
                    {isLoadingPropertyTypes ? (
                      <div className="loading-spinner">Loading property types...</div>
                    ) : (
                      <>
                        <select
                          id="property-type"
                          name="propertyType"
                          value={propertyData.propertyType}
                          onChange={handleChange}
                          required
                          className={errors.propertyType ? 'input-error' : ''}
                          disabled={propertyTypes.length === 0}
                        >
                          <option value="">Select a property type</option>
                          {propertyTypes.map((type) => (
                            <option key={type.id} value={type.value}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                        {errors.propertyType && (
                          <span className="error-message">{errors.propertyType}</span>
                        )}
                        {loadError && (
                          <span className="error-message">{loadError}</span>
                        )}
                      </>
                    )}
                  </div>


                  <div className="form-group">
                    <label htmlFor="target-university">Target University*</label>
                    <select
                      id="target-university"
                      name="targetUniversity"
                      value={propertyData.targetUniversity}
                      onChange={handleChange}
                      required
                      className={errors.targetUniversity ? 'input-error' : ''}
                    >
                      <option value="">Select target university</option>
                      {AVAILABLE_UNIVERSITIES.map((university) => (
                        <option key={university} value={university}>
                          {university}
                        </option>
                      ))}
                    </select>
                    {errors.targetUniversity && (
                      <span className="error-message">{errors.targetUniversity}</span>
                    )}
                  </div>



                  <div className="form-group full-width address-input-container">
                    <label htmlFor="property-address">Address*</label>
                    <input
                      id="property-address"
                      type="text"
                      name="address"
                      value={propertyData.address}
                      onChange={handleChange}
                      required
                      className={errors.address ? 'input-error' : ''}
                      placeholder="Enter complete address"
                    />
                    {errors.address && <span className="error-message">{errors.address}</span>}

                    {showLocationWindow && (
                      <div className="location-window">
                        <div className="location-header">
                          <MapPin size={16} />
                          <span>Location Coordinates</span>
                          <button
                            type="button"
                            onClick={closeLocationWindow}
                            className="close-location-btn"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="location-content">
                          {geocodedLocation.status === 'loading' && (
                            <div className="location-loading">Detecting location...</div>
                          )}

                          {geocodedLocation.status === 'error' && (
                            <div className="location-error">
                              {geocodedLocation.error || 'Failed to detect location'}
                            </div>
                          )}

                          {geocodedLocation.status === 'success' && geocodedLocation.latitude !== null && geocodedLocation.longitude !== null && (
                            <>
                              <div className="location-item">
                                <span className="location-label">Latitude:</span>
                                <span className="location-value">{geocodedLocation.latitude.toFixed(6)}</span>
                              </div>
                              <div className="location-item">
                                <span className="location-label">Longitude:</span>
                                <span className="location-value">{geocodedLocation.longitude.toFixed(6)}</span>
                              </div>
                              <div className="location-address">
                                {geocodedLocation.formattedAddress}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="monthly-rent">Monthly Rent (K)*</label>
                    <input
                      id="monthly-rent"
                      type="number"
                      name="monthlyRent"
                      value={propertyData.monthlyRent}
                      onChange={handleChange}
                      step="1"
                      min="0"
                      required
                      className={errors.monthlyRent ? 'input-error' : ''}
                    />
                    {errors.monthlyRent && <span className="error-message">{errors.monthlyRent}</span>}
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="property-description">Description</label>
                    <textarea
                      id="property-description"
                      name="description"
                      value={propertyData.description}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Describe the property, including key features, neighborhood, etc."
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="form-section">
                <legend>Property Details</legend>

                <div className="details-grid">
                  <div className="form-group">
                    <label htmlFor="property-bedrooms">Bedrooms</label>
                    <input
                      id="property-bedrooms"
                      type="number"
                      name="details.bedrooms"
                      value={propertyData.details.bedrooms}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="property-bathrooms">Bathrooms</label>
                    <input
                      id="property-bathrooms"
                      type="number"
                      name="details.bathrooms"
                      value={propertyData.details.bathrooms}
                      onChange={handleChange}
                      min="0"
                      step="0.5"
                    />
                    <small>Use 0.5 for half bathrooms</small>
                  </div>
                </div>
                <div className="amenities-section">
                  <div className="form-group">
                    <label htmlFor="amenities">Amenities</label>

                    {/* Available amenities for clicking */}
                    <div className="available-amenities">
                      <p className="amenities-help">Available amenities:</p>
                      <div className="amenities-chips">
                        {AVAILABLE_AMENITIES.map((amenity) => (
                          <button
                            key={amenity}
                            type="button"
                            className={`amenity-chip ${propertyData.details.amenities.includes(amenity) ? 'selected' : ''
                              }`}
                            onClick={() => toggleAmenity(amenity)}
                          >
                            {amenity}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Single input box containing all chips */}
                    <div className="amenity-input-container" onClick={() => document.getElementById('amenities-input')?.focus()}>
                      <div className="chips-container">
                        {propertyData.details.amenities.map((amenity) => (
                          <div key={amenity} className="amenity-chip">
                            {amenity}
                            <button
                              type="button"
                              className="delete-chip-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAmenity(amenity);
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <input
                          id="amenities-input"
                          type="text"
                          value={amenityInput}
                          onChange={(e) => handleAmenityInput(e.target.value)}
                          onKeyDown={handleAmenityKeyDown}
                          placeholder={propertyData.details.amenities.length === 0 ? "Type to search amenities..." : ""}
                          className="amenity-input"
                        />
                      </div>

                      {/* Suggestions dropdown */}
                      {showSuggestions && amenitySuggestions.length > 0 && (
                        <div className="suggestions-dropdown">
                          {amenitySuggestions.map((suggestion, index) => (
                            <div
                              key={suggestion}
                              className={`suggestion-item ${index === activeAmenityIndex ? 'active' : ''
                                }`}
                              onClick={() => {
                                toggleAmenity(suggestion);
                                setAmenityInput('');
                                setShowSuggestions(false);
                              }}
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </fieldset>

              <div className="form-footer">
                <div className="footer-buttons">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isSubmitting}
                    className="reset-btn"
                  >
                    Reset Form
                  </button>
                  <div className="action-buttons">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="submit-btn"
                    >
                      {isSubmitting ? 'Creating Property...' : 'Next: Add Images'}
                    </button>


                  </div>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitImages} noValidate>
              <fieldset className="form-section">
                <legend>Property Images*</legend>

                {propertyId && (
                  <div className="property-id-info">
                    <p><strong>Property ID:</strong> {propertyId}</p>
                    <p>Images will be associated with this property.</p>
                  </div>
                )}

                <div className="image-upload">
                  <input
                    type="file"
                    id="image-upload"
                    multiple
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="image-upload" className="upload-label">
                    <Upload size={24} />
                    <p>Click to upload images</p>
                    <small>PNG, JPG, GIF up to {MAX_FILE_SIZE_MB}MB</small>
                  </label>
                </div>

                {errors.images && <span className="error-message block-error">{errors.images}</span>}

                {previewImages.length > 0 && (
                  <div className="image-previews">
                    <p>Uploaded Images ({previewImages.length})</p>
                    <p className="help-text">Click an image to set as primary listing photo</p>
                    <div className="preview-grid">
                      {previewImages.map((src, index) => (
                        <div key={index} className={`preview-item ${images[index]?.isPrimary ? 'is-primary' : ''}`}>
                          <img
                            src={src}
                            alt={`Property preview ${index + 1}`}
                            onClick={() => setImageAsPrimary(index)}
                          />
                          {images[index]?.isPrimary && (
                            <span className="primary-badge">Primary</span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage({ index })}
                            className="delete-btn"
                            aria-label="Remove image"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isSubmitting && uploadProgress > 0 && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="progress-text">Uploading images: {uploadProgress}%</p>
                  </div>
                )}
              </fieldset>

              <div className="form-footer">
                <div className="footer-buttons">
                  <button
                    type="button"
                    onClick={() => setFormStage(FormStage.PROPERTY_DETAILS)}
                    disabled={isSubmitting}
                    className="back-btn"
                  >
                    Back to Details
                  </button>
                  <div className="action-buttons">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || images.length === 0}
                      className="submit-btn"
                    >
                      {isSubmitting ? 'Uploading Images...' : 'Upload Images & Complete'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCreationForm;