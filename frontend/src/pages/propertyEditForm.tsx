import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Plus, Save } from 'lucide-react';
import './edit.css';

interface PropertyDetails {
  bedrooms?: number | string;
  bathrooms?: number | string;
  squareMeters?: number | string;
  furnished?: boolean;
  amenities?: string[];
  rules?: string[];
}

interface Property {
  id: string | number;
  title?: string;
  description?: string;
  location: string;
  price: string;
  status?: string;
  inquiries?: number;
  imageUrl?: string | null;
  propertyType?: string;
  details?: PropertyDetails;
}

interface PropertyImage {
  id: string | number;
  url: string;
  isPrimary?: boolean;
}

interface PropertyEditFormProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: Property) => Promise<void>;
  onImageUpload: (propertyId: string | number, file: File) => Promise<string>;
  onImageDelete?: (propertyId: string | number, imageId: string | number) => Promise<void>;
  isDarkMode: boolean;
  themeColors: {
    PRIMARY_COLOR: string;
    PRIMARY_LIGHT: string;
    PRIMARY_MEDIUM: string;
    BACKGROUND: string;
    CARD_BACKGROUND: string;
    TEXT_PRIMARY: string;
    TEXT_SECONDARY: string;
    TEXT_TERTIARY: string;
    BORDER: string;
  };
}

interface FormData {
  title: string;
  description: string;
  location: string;
  price: string;
  propertyType: string;
  status: string;
  details: {
    bedrooms: number | string;
    bathrooms: number | string;
    squareMeters: number | string;
    furnished: boolean;
    amenities: string[];
    rules: string[];
  };
}

const PropertyEditForm: React.FC<PropertyEditFormProps> = ({ 
  property, 
  isOpen, 
  onClose, 
  onSave, 
  onImageUpload, 
  onImageDelete,
  isDarkMode, 
  themeColors 
}) => {
  // Form state with proper typing
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    location: '',
    price: '',
    propertyType: '',
    status: 'Available',
    details: {
      bedrooms: '',
      bathrooms: '',
      squareMeters: '',
      furnished: false,
      amenities: [],
      rules: []
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Property types options
  const propertyTypes: string[] = [
    'Apartment',
    'House',
    'Room',
    'Studio',
    'Shared Room',
    'Hostel'
  ];

  // Common amenities
  const commonAmenities: string[] = [
    'WiFi',
    'Air Conditioning',
    'Parking',
    'Kitchen',
    'Laundry',
    'Security',
    'Garden',
    'Balcony',
    'Furnished',
    'Pet Friendly'
  ];

  // Initialize form data when property changes
  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || '',
        description: property.description || '',
        location: property.location || '',
        price: property.price?.replace(/[^\d.]/g, '') || '',
        propertyType: property.propertyType || '',
        status: property.status || 'Available',
        details: {
          bedrooms: property.details?.bedrooms || '',
          bathrooms: property.details?.bathrooms || '',
          squareMeters: property.details?.squareMeters || '',
          furnished: property.details?.furnished || false,
          amenities: property.details?.amenities || [],
          rules: property.details?.rules || []
        }
      });

      // Set existing images
      if (property.imageUrl) {
        setImages([{ id: 'primary', url: property.imageUrl, isPrimary: true }]);
      }

      // Fetch additional images if available
      fetchPropertyImages(property.id);
    }
  }, [property]);

  const fetchPropertyImages = async (propertyId: string | number): Promise<void> => {
    try {
      const response = await fetch(`/api/property-images/properties/${propertyId}/images`);
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      }
    } catch (error) {
      console.error('Error fetching property images:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'details') {
        setFormData(prev => ({
          ...prev,
          details: {
            ...prev.details,
            [child]: type === 'checkbox' ? checked : value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle amenity toggle
  const toggleAmenity = (amenity: string): void => {
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        amenities: prev.details.amenities.includes(amenity)
          ? prev.details.amenities.filter(a => a !== amenity)
          : [...prev.details.amenities, amenity]
      }
    }));
  };

  // Handle rule changes
  const handleRuleChange = (index: number, value: string): void => {
    const newRules = [...formData.details.rules];
    newRules[index] = value;
    setFormData(prev => ({
      ...prev,
      details: { ...prev.details, rules: newRules }
    }));
  };

  const addRule = (): void => {
    setFormData(prev => ({
      ...prev,
      details: { ...prev.details, rules: [...prev.details.rules, ''] }
    }));
  };

  const removeRule = (index: number): void => {
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        rules: prev.details.rules.filter((_, i) => i !== index)
      }
    }));
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = Array.from(e.target.files || []);
    const uploadPromises = files.map(async (file): Promise<PropertyImage | null> => {
      try {
        const imageUrl = await onImageUpload(property.id, file);
        return { 
          id: Date.now() + Math.random(), 
          url: imageUrl, 
          isPrimary: images.length === 0 
        };
      } catch (error) {
        console.error('Error uploading image:', error);
        return null;
      }
    });

    const uploadedImages = await Promise.all(uploadPromises);
    const validImages = uploadedImages.filter((img): img is PropertyImage => img !== null);
    setImages(prev => [...prev, ...validImages]);
  };

  // Handle image deletion
  const handleImageDelete = async (imageId: string | number): Promise<void> => {
    try {
      if (onImageDelete) {
        await onImageDelete(property.id, imageId);
      }
      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  // Set primary image
  const setPrimaryImage = (imageId: string | number): void => {
    setImages(prev => prev.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    })));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.price.trim()) newErrors.price = 'Price is required';
    if (!formData.propertyType) newErrors.propertyType = 'Property type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const updatedProperty: Property = {
        ...formData,
        id: property.id,
        location: formData.location,
        price: formData.price,
        imageUrl: images.find(img => img.isPrimary)?.url || images[0]?.url || null,
        details: {
          ...formData.details,
          // Convert string numbers to actual numbers for API
          bedrooms: formData.details.bedrooms ? Number(formData.details.bedrooms) : undefined,
          bathrooms: formData.details.bathrooms ? Number(formData.details.bathrooms) : undefined,
          squareMeters: formData.details.squareMeters ? Number(formData.details.squareMeters) : undefined,
        }
      };

      await onSave(updatedProperty);
      onClose();
    } catch (error) {
      console.error('Error updating property:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="property-edit-modal-overlay">
      <div className="property-edit-modal">
        <div className="modal-header">
          <h2>Edit Property</h2>
          <button onClick={onClose} className="close-button" type="button">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Property Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter property title"
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <span className="error-text">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label>Property Type *</label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleInputChange}
                  className={errors.propertyType ? 'error' : ''}
                >
                  <option value="">Select type</option>
                  {propertyTypes.map((type: string) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.propertyType && <span className="error-text">{errors.propertyType}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter property location"
                  className={errors.location ? 'error' : ''}
                />
                {errors.location && <span className="error-text">{errors.location}</span>}
              </div>

              <div className="form-group">
                <label>Monthly Rent (K) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="Enter monthly rent"
                  min="0"
                  step="0.01"
                  className={errors.price ? 'error' : ''}
                />
                {errors.price && <span className="error-text">{errors.price}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your property..."
                rows={4}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Property Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Bedrooms</label>
                <input
                  type="number"
                  name="details.bedrooms"
                  value={formData.details.bedrooms}
                  onChange={handleInputChange}
                  placeholder="Number of bedrooms"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Bathrooms</label>
                <input
                  type="number"
                  name="details.bathrooms"
                  value={formData.details.bathrooms}
                  onChange={handleInputChange}
                  placeholder="Number of bathrooms"
                  min="0"
                  step="0.5"
                />
              </div>

              <div className="form-group">
                <label>Size (m²)</label>
                <input
                  type="number"
                  name="details.squareMeters"
                  value={formData.details.squareMeters}
                  onChange={handleInputChange}
                  placeholder="Property size"
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="details.furnished"
                  checked={formData.details.furnished}
                  onChange={handleInputChange}
                />
                <span className="checkmark"></span>
                Property is furnished
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Amenities</h3>
            <div className="amenities-grid">
              {commonAmenities.map((amenity: string) => (
                <label key={amenity} className="amenity-option">
                  <input
                    type="checkbox"
                    checked={formData.details.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                  />
                  <span className="amenity-name">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3>House Rules</h3>
            {formData.details.rules.map((rule: string, index: number) => (
              <div key={index} className="rule-input-group">
                <input
                  type="text"
                  value={rule}
                  onChange={(e) => handleRuleChange(index, e.target.value)}
                  placeholder="Enter a house rule"
                />
                <button
                  type="button"
                  onClick={() => removeRule(index)}
                  className="remove-rule-btn"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addRule}
              className="add-rule-btn"
            >
              <Plus size={16} />
              Add Rule
            </button>
          </div>

          <div className="form-section">
            <h3>Property Images</h3>
            
            <div className="image-upload-area">
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="image-upload" className="upload-button">
                <Upload size={20} />
                Add More Images
              </label>
            </div>

            <div className="images-grid">
              {images.map((image: PropertyImage, index: number) => (
                <div key={image.id} className="image-item">
                  <img src={image.url} alt={`Property ${index + 1}`} />
                  <div className="image-actions">
                    {!image.isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(image.id)}
                        className="set-primary-btn"
                      >
                        Set as Primary
                      </button>
                    )}
                    {image.isPrimary && <span className="primary-badge">Primary</span>}
                    <button
                      type="button"
                      onClick={() => handleImageDelete(image.id)}
                      className="delete-image-btn"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="save-btn">
              <Save size={16} />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyEditForm;