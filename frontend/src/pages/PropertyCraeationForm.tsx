import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Minus } from 'lucide-react';

interface PropertyType {
  id: string;
  name: string;
  value: string;
}

interface PropertyCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (propertyId: string, propertyData?: any) => void; // Updated to include propertyData
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
  details: PropertyDetails;
}

interface ImageFile {
  file: File;
  preview: string;
  isPrimary: boolean;
}

// Define form stages
enum FormStage {
  PROPERTY_DETAILS = 'property_details',
  IMAGE_UPLOAD = 'image_upload',
}

const PropertyCreationForm = ({ isOpen, onClose, onSubmit, landlordId }: PropertyCreationFormProps) => {
  const initialPropertyData: PropertyDataType = {
    title: '',
    description: '',
    propertyType: '',
    address: '',
    monthlyRent: '',
    isAvailable: true,
    details: {
      bedrooms: 1,
      bathrooms: 1,
      furnished: false,
      squareFootage: '',
      amenities: [''],
    },
  };

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

  useEffect(() => {
    if (isOpen && !landlordId) {
      setLandlordIdError('No landlord ID provided. Unable to create property.');
    } else {
      setLandlordIdError('');
    }
  }, [isOpen, landlordId]);

  // Fetch property types from database
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        setIsLoadingPropertyTypes(true);
        const response = await fetch('/api/properties/property-types', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch property types');
        }
        
        const data = await response.json();
        setPropertyTypes(data);
        
        // Set the default property type to the first item if available
        if (data.length > 0 && !propertyData.propertyType) {
          setPropertyData(prev => ({
            ...prev,
            propertyType: data[0].value
          }));
        }
      } catch (error) {
        console.error('Error fetching property types:', error);
        setLoadError('Failed to load property types. Please try again later.');
        // Fallback to default property types if fetch fails
        setPropertyTypes([
          { id: '1', name: 'Apartment', value: 'apartment' },
          { id: '2', name: 'House', value: 'house' },
          { id: '3', name: 'Shared Room', value: 'shared_room' },
          { id: '4', name: 'Single Room', value: 'single_room' }
        ]);
      } finally {
        setIsLoadingPropertyTypes(false);
      }
    };

    if (isOpen) {
      fetchPropertyTypes();
    }
  }, [isOpen]);

  const validatePropertyForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!propertyData.title.trim()) newErrors.title = 'Property title is required';
    if (!propertyData.address.trim()) newErrors.address = 'Address is required';
    if (!propertyData.monthlyRent || parseFloat(propertyData.monthlyRent) <= 0) {
      newErrors.monthlyRent = 'Valid monthly rent is required';
    }
    if (!propertyData.propertyType) newErrors.propertyType = 'Property type is required';
    
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
        [parent]: { ...(typeof prev[parent] === 'object' ? prev[parent] : {}), [child]: type === 'checkbox' ? checked : value }
      }));
    } else {
      setPropertyData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleArrayChange = (type: 'amenities', index: number, value: string) => {
    setPropertyData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [type]: prev.details[type].map((item, i) => i === index ? value : item)
      }
    }));
  };

  const addArrayItem = (type: keyof Pick<PropertyDetails, 'amenities'>) => {
    setPropertyData((prev: PropertyDataType) => ({
      ...prev,
      details: {
        ...prev.details,
        [type]: [...prev.details[type], '']
      }
    }));
  };

  const removeArrayItem = (type: keyof Pick<PropertyDetails, 'amenities'>, index: number) => {
    if (propertyData.details[type].length <= 1) return;
    
    setPropertyData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [type]: prev.details[type].filter((_, i) => i !== index)
      }
    }));
  };

  // Updated file size limit in MB
  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    // Clear any existing image errors
    if (errors.images) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
    
    // Validate file size and type with clear feedback
    const validFiles: File[] = [];
    const invalidFiles: {file: File, reason: string}[] = [];
    
    files.forEach(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/gif'].includes(file.type);
      const isValidSize = file.size <= MAX_FILE_SIZE_BYTES;
      
      if (!isValidType) {
        invalidFiles.push({file, reason: 'Invalid file type. Only JPEG, PNG, and GIF are accepted.'});
      } else if (!isValidSize) {
        invalidFiles.push({file, reason: `File too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Max size is ${MAX_FILE_SIZE_MB}MB.`});
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      const invalidMessages = invalidFiles.map(item => 
        `${item.file.name}: ${item.reason}`
      );
      alert(`Some files were skipped:\n${invalidMessages.join('\n')}`);
    }
    
    if (validFiles.length === 0) return;
    
    // Create preview URLs
    validFiles.forEach(file => {
      try {
        const previewUrl = URL.createObjectURL(file);
        setPreviewImages(prev => [...prev, previewUrl]);
        
        setImages(prev => [...prev, {
          file,
          preview: previewUrl,
          isPrimary: prev.length === 0
        }]);
      } catch (error) {
        console.error('Error creating preview:', error);
      }
    });
  };

  const setImageAsPrimary = (index: number): void => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
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

  // Create property and get propertyId
  const handleCreateProperty = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validatePropertyForm()) {
      return;
    }
    
    if (!landlordId) {
      alert('Error: No landlord ID provided');
      return;
    }
  
    // Set loading state
    setIsSubmitting(true);
  
    try {
      // Step 1: Create a draft property to get an ID
      const draftRes = await fetch('/api/properties/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landlordId: parseInt(landlordId)
        })
      });
  
      if (!draftRes.ok) {
        const errorData = await draftRes.json();
        throw new Error(errorData.message || 'Failed to create draft property');
      }
      
      const draftData = await draftRes.json();
      const newPropertyId = draftData.propertyId;
      setPropertyId(newPropertyId.toString());
      
      // Add explicit debugging
      console.log('Draft property created with ID:', newPropertyId);
  
      // Step 2: Update the draft property with complete information
      const updateRes = await fetch(`/api/properties/properties/${newPropertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: propertyData.title,
          description: propertyData.description,
          propertyType: propertyData.propertyType,
          address: propertyData.address,
          monthlyRent: parseFloat(propertyData.monthlyRent),
          isAvailable: propertyData.isAvailable
        })
      });
  
      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        throw new Error(errorData.message || 'Failed to update property details');
      }
      
      // Step 3: Update Property Details
      try {
        const detailsRes = await fetch(`/api/property-details/properties/${newPropertyId}/details`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bedrooms: parseInt(String(propertyData.details.bedrooms)) || 0,
            bathrooms: parseFloat(String(propertyData.details.bathrooms)) || 0,
            furnished: propertyData.details.furnished,
            squareFootage: parseFloat(propertyData.details.squareFootage) || 0,
            amenities: propertyData.details.amenities.filter(a => a.trim() !== '')
          })
        });
  
        if (!detailsRes.ok) {
          const errorData = await detailsRes.json();
          throw new Error(errorData.message || 'Failed to update details');
        }
        
        // Property created successfully, move to image upload stage
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

  // Upload images to server
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
          
          // Create FormData to send the raw file
          const formData = new FormData();
          formData.append('propertyId', propertyId);
          formData.append('image', img.file);
          formData.append('isPrimary', img.isPrimary.toString());
          
          // Debug log to see what's being sent
          console.log(`Uploading image ${i+1}:`, {
            propertyId,
            isPrimary: img.isPrimary,
            fileName: img.file.name,
            fileSize: img.file.size
          });
          
          const imageRes = await fetch('/api/property-images/property-images', {
            method: 'POST',
            body: formData
          });
          
          if (!imageRes.ok) {
            const errorData = await imageRes.json();
            console.error('Image upload response:', await imageRes.clone().text());
            throw new Error(errorData.message || 'Image upload failed');
          }
          
          successCount++;
        } catch (error) {
          console.error(`Failed to upload image ${i+1}:`, error);
          failedImages.push(`Image ${i+1}`);
        }
      }
      
      // Inform user if some images failed
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
      
      // Clean up object URLs
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
        status: propertyData.isAvailable ? "Available" : "Not Available",
        details: {
          bedrooms: propertyData.details.bedrooms,
          bathrooms: propertyData.details.bathrooms,
          furnished: propertyData.details.furnished,
          squareFootage: propertyData.details.squareFootage,
          amenities: propertyData.details.amenities
        },
        description: propertyData.description,
        propertyType: propertyData.propertyType
      };
      
      onSubmit(propertyId, completePropertyData);


      
      onClose();
    }
  };

  const handleReset = () => {
    // Clean up object URLs
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
  };
  
  const handleCancel = () => {
    // If property was created but not completed, delete it
    if (propertyId && formStage === FormStage.IMAGE_UPLOAD) {
      // Optional: add API call to delete the property
      fetch(`/api/properties/properties/${propertyId}`, {
        method: 'DELETE'
      }).catch(err => console.error('Failed to delete property:', err));
    }
    
    // Clean up object URLs
    previewImages.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    
    onClose();
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

        {landlordIdError && (
          <div className="error-banner">
            {landlordIdError}
          </div>
        )}

        {formStage === FormStage.PROPERTY_DETAILS ? (
          <form onSubmit={handleCreateProperty} noValidate>
            {/* Basic Information Section */}
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

                <div className="form-group full-width">
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
                </div>

                <div className="form-group">
                  <label htmlFor="monthly-rent">Monthly Rent (K)*</label>
                  <input
                    id="monthly-rent"
                    type="number"
                    name="monthlyRent"
                    value={propertyData.monthlyRent}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                    className={errors.monthlyRent ? 'input-error' : ''}
                  />
                  {errors.monthlyRent && <span className="error-message">{errors.monthlyRent}</span>}
                </div>

                <div className="form-group checkbox-group">
                  <label htmlFor="is-available">
                    <input
                      id="is-available"
                      type="checkbox"
                      name="isAvailable"
                      checked={propertyData.isAvailable}
                      onChange={handleChange}
                    />
                    Available for Rent
                  </label>
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

            {/* Property Details Section */}
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

                <div className="form-group">
                  <label htmlFor="property-sqft">Square Footage</label>
                  <input
                    id="property-sqft"
                    type="number"
                    name="details.squareFootage"
                    value={propertyData.details.squareFootage}
                    onChange={handleChange}
                    min="0"
                    placeholder="e.g. 800"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label htmlFor="property-furnished">
                    <input
                      id="property-furnished"
                      type="checkbox"
                      name="details.furnished"
                      checked={propertyData.details.furnished}
                      onChange={handleChange}
                    />
                    Furnished
                  </label>
                </div>
              </div>

              <div className="amenities-section">
                <div className="amenities-header">
                  <h4>Amenities</h4>
                  <button 
                    type="button" 
                    onClick={() => addArrayItem('amenities')}
                    className="add-btn"
                  >
                    <Plus size={16} /> Add Amenity
                  </button>
                </div>
                
                {propertyData.details.amenities.map((amenity, index) => (
                  <div key={index} className="amenity-input">
                    <input
                      type="text"
                      value={amenity}
                      onChange={(e) => handleArrayChange('amenities', index, e.target.value)}
                      placeholder="Enter amenity (e.g., Parking, Gym, Pool)"
                    />
                    <button 
                      type="button" 
                      onClick={() => removeArrayItem('amenities', index)}
                      className="remove-btn"
                      disabled={propertyData.details.amenities.length <= 1}
                      aria-label="Remove amenity"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </fieldset>

            {/* Form Footer for Property Details */}
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
            {/* Image Upload Section */}
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

            {/* Form Footer for Image Upload */}
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
    
          <style jsx>{`
        .property-form-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        
        .modal-content {
          background: white;
          border-radius: 8px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .modal-header h2 {
          margin: 0;
          color: rgb(48, 0, 126);
          font-size: 1.5rem;
        }
        
        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          padding: 4px;
        }
        
        .close-btn:hover {
          color: #333;
        }
        
        .error-banner {
          background-color: #fee2e2;
          color: #b91c1c;
          padding: 12px 16px;
          margin: 0;
          text-align: center;
          font-weight: 500;
        }
        
        .form-section {
          border: none;
          padding: 20px 24px;
          margin: 0 0 12px 0;
        }
        
        .form-section legend {
          font-weight: 600;
          color: rgb(48, 0, 126);
          font-size: 1.1rem;
          padding: 0 8px;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .form-group {
          margin-bottom: 12px;
        }
        
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #333;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }
        
        .checkbox-group {
          display: flex;
          align-items: center;
        }
        
        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        
        .checkbox-group input {
          width: auto;
          margin-right: 6px;
        }
        
        .input-error {
          border-color: #dc2626 !important;
        }
        
        .error-message {
          color: #dc2626;
          font-size: 0.85rem;
          margin-top: 4px;
          display: block;
        }
        
        .block-error {
          margin: 12px 0;
        }
        
        .amenities-section {
          margin-top: 16px;
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
        }
        
        .amenities-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .amenities-header h4 {
          margin: 0;
          font-weight: 600;
          color: #333;
        }
        
        .add-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgb(48, 0, 126);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 0.9rem;
        }
        
        .add-btn:hover {
          background: rgba(48, 0, 126, 0.9);
        }
        
        .amenity-input {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .remove-btn {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .remove-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .form-footer {
          padding: 16px 24px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        
        .footer-buttons {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .action-buttons {
          display: flex;
          gap: 12px;
        }
        
        .reset-btn, .back-btn {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #4b5563;
          border-radius: 4px;
          padding: 10px 16px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .cancel-btn {
          background: white;
          border: 1px solid #d1d5db;
          color: #4b5563;
          border-radius: 4px;
          padding: 10px 16px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .submit-btn {
          background: rgb(48, 0, 126);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 16px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .submit-btn:hover {
          background: rgba(48, 0, 126, 0.9);
        }
        
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .image-upload {
          border: 2px dashed #cbd5e1;
          border-radius: 6px;
          padding: 24px;
          text-align: center;
          margin-bottom: 20px;
        }
        
        .image-upload input {
          display: none;
        }
        
        .upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          color: #64748b;
        }
        
        .upload-label p {
          margin: 8px 0 4px;
          font-weight: 500;
        }
        
        .upload-label small {
          font-size: 0.8rem;
        }
        
        .property-id-info {
          background: #f0f9ff;
          border-radius: 4px;
          padding: 12px 16px;
          margin-bottom: 16px;
          border-left: 4px solid rgb(48, 0, 126);
        }
        
        .property-id-info p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        
        .property-id-info p:first-child {
          margin-bottom: 4px;
        }
        
        .image-previews {
          margin-top: 20px;
        }
        
        .image-previews p {
          margin: 0 0 8px;
          font-weight: 500;
        }
        
        .help-text {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: normal !important;
          margin-bottom: 12px !important;
        }
        
        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
        }
        
        .preview-item {
          position: relative;
          border-radius: 4px;
          overflow: hidden;
          aspect-ratio: 1;
          border: 2px solid transparent;
        }
        
        .preview-item.is-primary {
          border-color: rgb(48, 0, 126);
        }
        
        .preview-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          cursor: pointer;
        }
        
        .primary-badge {
          position: absolute;
          top: 4px;
          left: 4px;
          background: rgb(48, 0, 126);
          color: white;
          font-size: 0.75rem;
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .delete-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0.8;
        }
        
        .delete-btn:hover {
          opacity: 1;
        }
        
        .upload-progress {
          margin-top: 16px;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        
        .progress-fill {
          height: 100%;
          background-color: rgb(48, 0, 126);
          transition: width 0.3s ease;
        }
        
        .progress-text {
          font-size: 0.9rem;
          text-align: center;
          margin: 0;
          color: #64748b;
        }
        
        .loading-spinner {
          padding: 10px;
          color: #64748b;
          font-style: italic;
        }
        
        /* Responsive adjustments */
        @media (max-width: 640px) {
          .form-grid, 
          .details-grid {
            grid-template-columns: 1fr;
          }
          
          .footer-buttons {
            flex-direction: column;
            gap: 12px;
          }
          
          .action-buttons {
            width: 100%;
          }
          
          .action-buttons button {
            flex: 1;
          }
          
          .reset-btn, .back-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default PropertyCreationForm;