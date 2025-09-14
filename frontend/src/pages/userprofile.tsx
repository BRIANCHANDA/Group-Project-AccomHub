import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

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

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    // Get user profile from location state or fetch from localStorage
    if (location.state?.userProfile) {
      setUserProfile(location.state.userProfile);
      setEditForm(location.state.userProfile);
      setIsLoading(false);
    } else {
      // Try to get from localStorage and fetch fresh data
      const user = localStorage.getItem('user');
      if (user) {
        const parsedUser = JSON.parse(user);
        if (parsedUser.id) {
          fetchUserProfile(parsedUser.id);
        } else {
          setError('No user ID found');
          setIsLoading(false);
        }
      } else {
        navigate('/login');
      }
    }
  }, [location.state, navigate]);

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
        setEditForm(profileData);
      } else {
        setError('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Error loading profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(userProfile || {});
  };

  const handleSaveEdit = async () => {
    if (!userProfile?.id) return;

    try {
      const response = await fetch(`/api/users/users/${userProfile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setUserProfile(updatedProfile);
        setIsEditing(false);
        
        // Update localStorage
        const user = localStorage.getItem('user');
        if (user) {
          const parsedUser = JSON.parse(user);
          localStorage.setItem('user', JSON.stringify({ ...parsedUser, ...updatedProfile }));
        }
      } else {
        setError('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Error updating profile');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-danger text-center">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error || 'Profile not found'}
            </div>
            <div className="text-center">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/studentdashboard')}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center">
              <button
                className="btn btn-outline-secondary me-3"
                onClick={() => navigate('/studentdashboard')}
              >
                <i className="bi bi-arrow-left me-1"></i>
                Back
              </button>
              <h2 className="mb-0">My Profile</h2>
            </div>
            {!isEditing && (
              <button
                className="btn btn-primary"
                onClick={handleEdit}
              >
                <i className="bi bi-pencil me-1"></i>
                Edit Profile
              </button>
            )}
          </div>

          {/* Profile Card */}
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <div className="row">
                {/* Profile Image Section */}
                <div className="col-md-4 text-center mb-4 mb-md-0">
                  <div className="profile-image-container mb-3">
                    {userProfile.profileImage ? (
                      <img
                        src={userProfile.profileImage}
                        alt="Profile"
                        className="rounded-circle"
                        style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto"
                        style={{ width: '120px', height: '120px', fontSize: '2rem' }}
                      >
                        {getInitials(userProfile.firstName, userProfile.lastName)}
                      </div>
                    )}
                  </div>
                  <h4 className="mb-1">
                    {userProfile.firstName} {userProfile.lastName}
                  </h4>
                  <p className="text-muted mb-0">{userProfile.email}</p>
                  <p className="text-muted small">
                    Member since {formatDate(userProfile.createdAt)}
                  </p>
                </div>

                {/* Profile Details Section */}
                <div className="col-md-8">
                  {isEditing ? (
                    // Edit Form
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
                      <div className="row g-3">
                        <div className="col-sm-6">
                          <label className="form-label">First Name</label>
                          <input
                            type="text"
                            className="form-control"
                            name="firstName"
                            value={editForm.firstName || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label">Last Name</label>
                          <input
                            type="text"
                            className="form-control"
                            name="lastName"
                            value={editForm.lastName || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            name="email"
                            value={editForm.email || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label">Phone Number</label>
                          <input
                            type="tel"
                            className="form-control"
                            name="phoneNumber"
                            value={editForm.phoneNumber || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label">Year of Study</label>
                          <select
                            className="form-select"
                            name="yearOfStudy"
                            value={editForm.yearOfStudy || ''}
                            onChange={handleInputChange}
                          >
                            <option value="">Select Year</option>
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                            <option value="Graduate">Graduate</option>
                          </select>
                        </div>
                        <div className="col-12">
                          <label className="form-label">University</label>
                          <select
                            className="form-select"
                            name="university"
                            value={editForm.university || ''}
                            onChange={handleInputChange}
                          >
                            <option value="">Select University</option>
                            <option value="University of Zambia (UNZA)">University of Zambia</option>
                            <option value="Copperbelt University (CBU)">Copperbelt University</option>
                            <option value="Mulungushi University">Mulungushi University</option>
                            <option value="Zambia Catholic University">Zambia Catholic University</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="d-flex gap-2 mt-4">
                        <button type="submit" className="btn btn-primary">
                          <i className="bi bi-check-lg me-1"></i>
                          Save Changes
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    // Display Mode
                    <div className="row g-4">
                      <div className="col-sm-6">
                        <div className="profile-field">
                          <label className="form-label text-muted mb-1">First Name</label>
                          <p className="mb-0 fw-medium">{userProfile.firstName || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="profile-field">
                          <label className="form-label text-muted mb-1">Last Name</label>
                          <p className="mb-0 fw-medium">{userProfile.lastName || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="profile-field">
                          <label className="form-label text-muted mb-1">Email Address</label>
                          <p className="mb-0 fw-medium">
                            <i className="bi bi-envelope me-2"></i>
                            {userProfile.email || 'Not specified'}
                          </p>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="profile-field">
                          <label className="form-label text-muted mb-1">Phone Number</label>
                          <p className="mb-0 fw-medium">
                            <i className="bi bi-telephone me-2"></i>
                            {userProfile.phoneNumber || 'Not specified'}
                          </p>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="profile-field">
                          <label className="form-label text-muted mb-1">Year of Study</label>
                          <p className="mb-0 fw-medium">
                            <i className="bi bi-calendar-event me-2"></i>
                            {userProfile.yearOfStudy || 'Not specified'}
                          </p>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="profile-field">
                          <label className="form-label text-muted mb-1">University</label>
                          <p className="mb-0 fw-medium">
                            <i className="bi bi-building me-2"></i>
                            {userProfile.university || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info Card */}
          <div className="card shadow-sm border-0 mt-4">
            <div className="card-body p-4">
              <h5 className="card-title mb-3">
                <i className="bi bi-info-circle me-2"></i>
                Account Information
              </h5>
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="profile-field">
                    <label className="form-label text-muted mb-1">User ID</label>
                    <p className="mb-0 fw-medium">#{userProfile.id}</p>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="profile-field">
                    <label className="form-label text-muted mb-1">Account Created</label>
                    <p className="mb-0 fw-medium">{formatDate(userProfile.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;