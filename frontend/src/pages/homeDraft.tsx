import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './bootstrap-5.3.5-dist/css/bootstrap.min.css';
import './Homepage.css'; // Make sure this points to your updated CSS file

const HomePage = () => {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeColorScheme, setActiveColorScheme] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // References for navigation
  const homeRef = useRef(null);
  const servicesRef = useRef(null);
  const communityRef = useRef(null);
  const contactRef = useRef(null);
  
  // Color schemes that will rotate
  const colorSchemes = [
    // Original themes
    { primary: '#30007e', secondary: '#6d28d9', accent: '#ddd6fe', background: '#efedff' },
    { primary: '#0e4429', secondary: '#10b981', accent: '#d1fae5', background: '#ecfdf5' },
    { primary: '#4c1d95', secondary: '#8b5cf6', accent: '#e0e7ff', background: '#ede9fe' },
    { primary: '#1e3a8a', secondary: '#3b82f6', accent: '#dbeafe', background: '#eff6ff' },
    { primary: '#7f1d1d', secondary: '#ef4444', accent: '#fee2e2', background: '#fef2f2' },
    { primary: '#1f2937', secondary: '#111827', accent: '#e5e7eb', background: '#f3f4f6' },
    { primary: '#111827', secondary: '#374151', accent: '#d1d5db', background: '#f9fafb' },
    { primary: '#1e40af', secondary: '#3b82f6', accent: '#bfdbfe', background: '#eff6ff' },
    // Additional themes 
    { primary: '#7c2d12', secondary: '#ea580c', accent: '#ffedd5', background: '#fff7ed' }, // Orange
    { primary: '#713f12', secondary: '#d97706', accent: '#fef3c7', background: '#fffbeb' }, // Amber
    { primary: '#064e3b', secondary: '#059669', accent: '#a7f3d0', background: '#d1fae5' }, // Emerald
    { primary: '#0f766e', secondary: '#0d9488', accent: '#99f6e4', background: '#ccfbf1' }, // Teal
    { primary: '#0369a1', secondary: '#0ea5e9', accent: '#bae6fd', background: '#e0f2fe' }, // Sky
    { primary: '#4338ca', secondary: '#6366f1', accent: '#c7d2fe', background: '#eef2ff' }, // Indigo
    { primary: '#6b21a8', secondary: '#9333ea', accent: '#e9d5ff', background: '#f5f3ff' }, // Purple
    { primary: '#86198f', secondary: '#c026d3', accent: '#f5d0fe', background: '#fae8ff' }, // Fuchsia
    { primary: '#9d174d', secondary: '#e11d48', accent: '#fecdd3', background: '#fff1f2' }, // Rose
    { primary: '#365314', secondary: '#65a30d', accent: '#d9f99d', background: '#f7fee7' }, // Green
    { primary: '#3f6212', secondary: '#84cc16', accent: '#ecfccb', background: '#f7fee7' }, // Light Green
    { primary: '#334155', secondary: '#64748b', accent: '#e2e8f0', background: '#f8fafc' }, // Cool Gray
    { primary: '#042f2e', secondary: '#0d9488', accent: '#99f6e4', background: '#ccfbf1' }, // Dark Teal
    { primary: '#312e81', secondary: '#6366f1', accent: '#c7d2fe', background: '#eef2ff' }, // Deep Indigo
    { primary: '#581c87', secondary: '#9333ea', accent: '#e9d5ff', background: '#f5f3ff' }, // Deep Purple
    { primary: '#1e1b4b', secondary: '#4f46e5', accent: '#c7d2fe', background: '#eef2ff' }  // Royal
  ];
  
  // Get current color scheme
  const colors = colorSchemes[activeColorScheme];

  // Fetch random properties on component mount
  useEffect(() => {
    const fetchRandomProperties = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/properties/properties/random');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setFeaturedProperties(data);
      } catch (err) {
        console.error("Failed to fetch properties:", err);
        setError(err.message);
        // Use fallback data if API call fails
        setFeaturedProperties([
          {
            id: 'property1',
            title: 'Modern Student Suite',
            location: 'Riverside, 5 min to CBU',
            price: 'K1,500 / month',
            features: ['Single Room', 'Wi-Fi', 'Shared Kitchen'],
            image: '/api/placeholder/400/300',
            tag: 'Popular'
          },
          {
            id: 'property2',
            title: 'Cozy Shared House',
            location: 'Jambo Drive, 10 min to CBU',
            price: 'K1,200 / month',
            features: ['Shared Room', 'Water Included', 'Security'],
            image: '/api/placeholder/400/300',
            tag: 'Affordable'
          },
          {
            id: 'property3',
            title: 'Premium Student Apartment',
            location: 'University Avenue, 2 min to CBU',
            price: 'K2,000 / month',
            features: ['Private Studio', 'All Utilities', 'Study Room'],
            image: '/api/placeholder/400/300',
            tag: 'Premium'
          },
          {
            id: 'property4',
            title: 'Budget Studio Apartment',
            location: 'College View, 8 min to CBU',
            price: 'K1,300 / month',
            features: ['Single Room', 'Basic Utilities', 'Furnished'],
            image: '/api/placeholder/400/300'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRandomProperties();
  }, []);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Handle color scheme rotation
  useEffect(() => {
    // Color scheme rotation on interval
    const colorInterval = setInterval(() => {
      setActiveColorScheme((prev) => (prev + 1) % colorSchemes.length);
    }, 7000); // Change color scheme every 7 seconds
    
    // Update CSS variables when color scheme changes
    document.documentElement.style.setProperty('--primary-color', colors.primary);
    document.documentElement.style.setProperty('--secondary-color', colors.secondary);
    document.documentElement.style.setProperty('--accent-color', colors.accent);
    document.documentElement.style.setProperty('--background-color', colors.background);
    
    return () => {
      clearInterval(colorInterval);
    };
  }, [colors]);
  
  // Improved navigation handler
  const handleNavigation = (path) => {
    if (path === 'signin') {
      navigate('/login');
    } else if (path === 'register') {
      navigate('/register');
    } else if (path === 'about') {
      navigate('/about');
    } else {
      // Try to find an element with the corresponding id on the page
      const section = document.getElementById(path);
      if (section) {
        const navbarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height') || '70');
        
        // Calculate the position to scroll to (element position - navbar height)
        const offsetPosition = section.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
        
        // Scroll to the adjusted position
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      } else {
        // Fallback in case the section does not exist
        navigate(`/${path}`);
      }
    }
    // Close mobile menu after navigation
    setMenuOpen(false);
  };

  return (
    <div className="app-container">
      {/* Header with Navigation */}
      <nav className={`navbar navbar-expand-lg sticky-top navbar-light ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <a className="navbar-brand" href="#home" onClick={(e) => {
            e.preventDefault();
            handleNavigation('home');
          }}>
            <span className="logo-icon me-2">🏠</span>
            <span className="logo-text">ZIT AccommoHub</span>
          </a>
          
          <button 
            className="navbar-toggler" 
            type="button" 
            onClick={() => setMenuOpen(!menuOpen)}
            aria-controls="navbarNav" 
            aria-expanded={menuOpen ? "true" : "false"} 
            aria-label="Toggle navigation"
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
              <li className="nav-item ms-lg-2">
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => handleNavigation('signin')}
                >
                  Sign in
                </button>
              </li>
              <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                <button 
                  className="btn btn-primary"
                  onClick={() => handleNavigation('register')}
                >
                  Register
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section (Home) */}
      <section id="home" ref={homeRef} className="hero py-5">
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-3 hero-title">Find Your Perfect Student Accommodation</h1>
              <p className="lead mb-5">
                Discover the best boarding houses and student accommodations near Copperbelt University.
                We connect students with safe, comfortable, and affordable housing options.
              </p>
              
              {/* Search Box */}
              <div className="search-container mx-auto">
                <form className="d-flex flex-column flex-md-row" onSubmit={(e) => e.preventDefault()}>
                  <input 
                    type="text" 
                    className="form-control form-control-lg"
                    placeholder="Search by location, price, or amenities..." 
                    aria-label="Search accommodations"
                  />
                  <button type="submit" className="btn btn-primary btn-lg ms-md-2 mt-2 mt-md-0">
                    Search
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section (Services) */}
      <section id="services" ref={servicesRef} className="features py-5">
        <div className="container">
          <h2 className="text-center mb-5 section-title">Our Services</h2>
          <div className="row g-4">
            {[
              {
                icon: '🔍',
                title: 'Verified Listings',
                description: 'All accommodations are personally verified by our team to ensure safety, comfort, and accuracy.'
              },
              {
                icon: '💰',
                title: 'Student Budget Friendly',
                description: 'Find accommodations that fit your budget with transparent pricing and no hidden fees.'
              },
              {
                icon: '📍',
                title: 'Prime Locations',
                description: 'All listings are within walking distance or a short commute to Copperbelt University.'
              },
              {
                icon: '📱',
                title: 'Easy Booking',
                description: 'Book viewings, contact landlords, and secure your accommodation all through our platform.'
              }
            ].map((feature, index) => (
              <div className="col-md-6 col-lg-3" key={index}>
                <div className="feature-card h-100">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-desc">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" ref={communityRef} className="community py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="section-title mb-4">Our Community</h2>
              <p className="section-content">
                Join a vibrant community of students and landlords. Engage, share experiences, and grow together.
                We regularly host meetups, workshops, and events to help you connect with fellow students and find
                the perfect roommates or accommodation partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="properties py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="section-title mb-0">Featured Accommodations</h2>
            <button 
              className="btn btn-outline-primary"
              onClick={() => handleNavigation('register')}
            >
              Explore All
            </button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading properties...</p>
            </div>
          ) : error ? (
            <div className="alert alert-warning" role="alert">
              Unable to load properties. Please try again later.
            </div>
          ) : (
            <div className="row g-4">
              {featuredProperties.map((property) => (
                <div className="col-md-6 col-lg-3" key={property.id}>
                  <div className="property-card h-100">
                    <div className="property-image-container">
                      <img src={property.image} className="card-img-top" alt={property.title} />
                      {property.tag && <span className="property-tag">{property.tag}</span>}
                    </div>
                    <div className="card-body d-flex flex-column">
                      <h3 className="property-title">{property.title}</h3>
                      <p className="property-location">
                        <i className="bi bi-geo-alt-fill me-1"></i>
                        {property.location}
                      </p>
                      <p className="property-price">{property.price}</p>
                      <div className="property-features mt-auto">
                        {property.features.map((feature, index) => (
                          <span key={index} className="feature-badge">
                            {feature}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3">
                        <button 
                          className="btn btn-sm btn-outline-primary w-100"
                          onClick={() => handleNavigation('register')}
                        >
                          Sign up to view more details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="text-white mb-3">Ready to Find Your Student Home?</h2>
              <p className="text-white mb-4">
                Join hundreds of Copperbelt University students who have found their perfect accommodation through ZIT AccommoHub.
              </p>
              <button 
                className="btn btn-light btn-lg"
                onClick={() => handleNavigation('register')}
              >
                Get Started Today
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" ref={contactRef} className="contact py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="section-title mb-4">Contact Us</h2>
              <p className="section-content">
                Have questions? Reach out to us via email at <a href="mailto:brianchanda02@gmail.com">brianchanda02@gmail.com</a> or call us at <a href="tel:+260972526777">+260 972526777</a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer py-4">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <div className="footer-links mb-4">
                {['About Us', 'Services', 'Community', 'Contact'].map((item, index) => (
                  <a 
                    key={index}
                    href="#"
                    className="footer-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation(item.toLowerCase().replace(' ', ''));
                    }}
                  >
                    {item}
                  </a>
                ))}
              </div>
              <p className="footer-copyright">
                © 2025 ZIT AccommoHub. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;