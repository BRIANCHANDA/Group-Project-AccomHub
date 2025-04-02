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
  onSubmit: (propertyId: string) => void;
  landlordId: string;
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
    images: []
  };

  const [propertyData, setPropertyData] = useState(initialPropertyData);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [isLoadingPropertyTypes, setIsLoadingPropertyTypes] = useState(true);
  const [loadError, setLoadError] = useState('');

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
        const response = await fetch('/api/auth/property-types');
        
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

  const validateForm = () => {
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
    images: any[];
  }

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

  interface ImageFile {
    file: File;
    preview: string;
    isPrimary: boolean;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    // Validate file size and type
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/gif'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Only images under 10MB are accepted.');
    }
    
    const newPreviewImages: string[] = validFiles.map(file => URL.createObjectURL(file));
    
    setPreviewImages((prev: string[]) => [...prev, ...newPreviewImages]);
    setPropertyData(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles.map((file, i) => ({
        file,
        preview: newPreviewImages[i],
        isPrimary: prev.images.length === 0 && i === 0
      } as ImageFile))]
    }));
  };

  const setImageAsPrimary = (index: number): void => {
    setPropertyData((prev: PropertyDataType) => ({
      ...prev,
      images: prev.images.map((img: ImageFile, i: number) => ({
        ...img,
        isPrimary: i === index
      }))
    }));
  };

  interface RemoveImageProps {
    index: number;
  }

  const removeImage = ({ index }: RemoveImageProps): void => {
    URL.revokeObjectURL(previewImages[index]); 
    setPreviewImages((prev: string[]) => prev.filter((_, i) => i !== index));
    setPropertyData((prev: PropertyDataType) => {
      const newImages: ImageFile[] = prev.images.filter((_, i) => i !== index);
      if (prev.images[index]?.isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      return { ...prev, images: newImages };
    });
  };

  interface FileReaderResult {
    result: string | ArrayBuffer | null;
  }

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve: (value: string) => void, reject: (error: Error) => void) => {
      const reader: FileReader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error: ProgressEvent<FileReader>) => reject(new Error('File reading failed'));
    });
  };

  interface PropertyCreationPayload {
    title: string;
    description: string;
    propertyType: string;
    address: string;
    monthlyRent: number;
    isAvailable: boolean;
    landlordId: string;
  }

  interface PropertyDetailsPayload {
    bedrooms: number;
    bathrooms: number;
    furnished: boolean;
    squareFootage: number;
    amenities: string[];
  }

  interface ErrorResponse {
    message: string;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!landlordId) {
      alert('Error: No landlord ID provided');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create Property
      const propertyRes = await fetch('/api/auth/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: propertyData.title,
          description: propertyData.description,
          propertyType: propertyData.propertyType,
          address: propertyData.address,
          monthlyRent: parseFloat(propertyData.monthlyRent),
          isAvailable: propertyData.isAvailable,
          landlordId: landlordId
        })
      });

      if (!propertyRes.ok) {
        const errorData = await propertyRes.json();
        throw new Error(errorData.message || 'Failed to create property');
      }
      
      const { propertyId } = await propertyRes.json();

      // Upload Images
      if (propertyData.images.length > 0) {
        await Promise.all(propertyData.images.map(async (img) => {
          const base64 = await convertToBase64(img.file);
          const imageRes = await fetch('/api/auth/property-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              propertyId,
              image: base64,
              isPrimary: img.isPrimary
            })
          });
          
          if (!imageRes.ok) {
            const errorData = await imageRes.json();
            throw new Error(errorData.message || 'Image upload failed');
          }
        }));
      }

      // Update Property Details
      const detailsRes = await fetch(`/api/auth/properties/${propertyId}/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedrooms: parseInt(String(propertyData.details.bedrooms)),
          bathrooms: parseFloat(String(propertyData.details.bathrooms)), // Allow for half bathrooms
          furnished: propertyData.details.furnished,
          squareFootage: parseFloat(propertyData.details.squareFootage) || 0,
          amenities: propertyData.details.amenities.filter(a => a.trim() !== '')
        })
      });

      if (!detailsRes.ok) {
        const errorData = await detailsRes.json();
        throw new Error(errorData.message || 'Failed to update details');
      }

      // Clean up object URLs
      previewImages.forEach(url => URL.revokeObjectURL(url));
      
      onSubmit(propertyId);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    // Clean up object URLs
    previewImages.forEach(url => URL.revokeObjectURL(url));
    setPreviewImages([]);
    setPropertyData(initialPropertyData);
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="property-form-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add New Property</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="close-btn"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
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
                <label htmlFor="monthly-rent">Monthly Rent ($)*</label>
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

          {/* Image Upload Section */}
          <fieldset className="form-section">
            <legend>Property Images</legend>
            
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
                <small>PNG, JPG, GIF up to 10MB</small>
              </label>
            </div>

            {previewImages.length > 0 && (
              <div className="image-previews">
                <p>Uploaded Images ({previewImages.length})</p>
                <p className="help-text">Click an image to set as primary listing photo</p>
                <div className="preview-grid">
                  {previewImages.map((src, index) => (
                    <div key={index} className={`preview-item ${propertyData.images[index]?.isPrimary ? 'is-primary' : ''}`}>
                      <img
                        src={src}
                        alt={`Property preview ${index + 1}`}
                        onClick={() => setImageAsPrimary(index)}
                      />
                      {propertyData.images[index]?.isPrimary && (
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
          </fieldset>

          {/* Form Footer */}
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
                  onClick={onClose}
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
                  {isSubmitting ? 'Creating...' : 'Create Property'}
                </button>
              </div>
            </div>
          </div>
        </form>
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
          padding: 1rem;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
        }

        .modal-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          color: #6b7280;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .close-btn:hover {
          background-color: #f3f4f6;
          color: #1f2937;
        }

        .form-section {
          margin-bottom: 2rem;
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
          border-radius: 8px;
          background-color: #f9fafb;
        }

        legend {
          font-weight: 600;
          padding: 0 0.5rem;
          color: #4b5563;
        }

        .form-grid, .details-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          margin-top: 1rem;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 500;
          color: #4b5563;
        }

        input, select, textarea {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          width: 100%;
          transition: border-color 0.2s;
          font-size: 0.95rem;
        }

        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        .input-error {
          border-color: #ef4444;
        }

        .input-error:focus {
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
        }

        .error-message {
          color: #ef4444;
          font-size: 0.8rem;
          margin-top: 0.25rem;
        }

        small {
          color: #6b7280;
          font-size: 0.75rem;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-group input[type="checkbox"] {
          width: auto;
        }

        .loading-spinner {
          padding: 0.75rem;
          color: #6b7280;
          background-color: #f3f4f6;
          border-radius: 4px;
          font-size: 0.9rem;
          text-align: center;
        }

        .amenities-section {
          margin-top: 1.5rem;
        }

        .amenities-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .amenities-header h4 {
          margin: 0;
          color: #4b5563;
        }

        .add-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #3b82f6;
          background: none;
          border: 1px solid #3b82f6;
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          font-size: 0.85rem;
          transition: background-color 0.2s;
        }

        .add-btn:hover {
          background-color: rgba(59, 130, 246, 0.1);
        }

        .amenity-input {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          align-items: center;
        }

        .remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: 4px;
        }

        .remove-btn:hover {
          color: #ef4444;
          background-color: rgba(239, 68, 68, 0.1);
        }

        .remove-btn:disabled {
          color: #d1d5db;
          cursor: not-allowed;
        }

        .help-text {
          color: #6b7280;
          font-size: 0.85rem;
          margin-top: 0;
        }

        .image-upload {
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          margin: 1rem 0;
          transition: border-color 0.2s;
        }

        .image-upload:hover {
          border-color: #3b82f6;
        }

        #image-upload {
          display: none;
        }

        .upload-label {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
        }

        .upload-label p {
          margin: 0.5rem 0 0 0;
          font-weight: 500;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .preview-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 4px;
          overflow: hidden;
          transition: transform 0.2s;
        }

        .preview-item:hover {
          transform: scale(1.02);
        }

        .preview-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 4px;
          border: 2px solid #e5e7eb;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .preview-item.is-primary img {
          border-color: #3b82f6;
        }

        .primary-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: #3b82f6;
          color: white;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          border-radius: 0 0 0 4px;
        }

        .delete-btn {
          position: absolute;
          top: 0.25rem;
          left: 0.25rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 1.5rem;
          height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .preview-item:hover .delete-btn {
          opacity: 1;
        }

        .form-footer {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .footer-buttons {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
        }

        .reset-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.reset-btn:hover {
  background-color: #f3f4f6;
  color: #4b5563;
}

.reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  padding: 0.75rem 1.25rem;
  border: 1px solid #d1d5db;
  background-color: white;
  color: #4b5563;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background-color: #f3f4f6;
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn {
  padding: 0.75rem 1.25rem;
  border: none;
  background-color: #3b82f6;
  color: white;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover {
  background-color: #2563eb;
}

.submit-btn:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .modal-content {
    padding: 1.5rem;
    width: 95%;
  }

  .form-section {
    padding: 1rem;
  }

  .footer-buttons {
    flex-direction: column;
    gap: 1rem;
  }

  .action-buttons {
    width: 100%;
  }

  .cancel-btn, .submit-btn {
    flex: 1;
  }
}
`}</style>
        
      </div>
    
  );
};

export default PropertyCreationForm;

