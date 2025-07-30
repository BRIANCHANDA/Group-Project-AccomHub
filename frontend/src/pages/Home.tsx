import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './bootstrap-5.3.5-dist/css/bootstrap.min.css';
import './Homepage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  interface Property {
    id: number;
    image: string;
    title: string;
    location: string;
    price: string;
    features: string[];
    tag?: string;
  }

  // Mock data to show immediately while API loads
  const mockProperties: Property[] = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
      title: 'Modern Studio Apartment',
      location: 'Near CBU Main Campus',
      price: 'K450/month',
      features: ['WiFi', 'Furnished', 'Security'],
      tag: 'Popular'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
      title: 'Shared 2-Bedroom House',
      location: 'CBU Student Area',
      price: 'K350/month',
      features: ['Kitchen', 'Parking', 'Garden'],
      tag: 'Budget'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
      title: 'Single Room with Bath',
      location: '5 mins walk to CBU',
      price: 'K300/month',
      features: ['Private Bath', 'Desk', 'Wardrobe']
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400',
      title: 'Luxury Student Apartment',
      location: 'Premium CBU Housing',
      price: 'K650/month',
      features: ['AC', 'Gym Access', 'Study Room'],
      tag: 'Premium'
    }
  ];

  const [featuredProperties, setFeaturedProperties] = useState<Property[]>(mockProperties);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoadedAPI, setHasLoadedAPI] = useState(false);

  // References for navigation
  const homeRef = useRef(null);
  const servicesRef = useRef(null);
  const communityRef = useRef(null);
  const contactRef = useRef(null);

  // Fetch real properties in background after component mounts
  useEffect(() => {
    const fetchRealProperties = async () => {
      try {
        const response = await fetch('/api/properties/properties/random');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setFeaturedProperties(data);
            setHasLoadedAPI(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch properties:', err);
        // Keep mock data on error, don't show error to user
      }
    };

    const timer = setTimeout(fetchRealProperties, 100);
    return () => clearTimeout(timer);
  }, []);

  // Optimized scroll handler with throttling
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('.navbar')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  // Simplified navigation handler
  const handleNavigation = (path) => {
    const paths = {
      signin: '/login',
      register: '/register',
      about: '/about',
      viewall: '/studentdashboard',
    };

    if (paths[path]) {
      navigate(paths[path]);
    } else if (path.startsWith('property/')) {
      const propertyId = path.split('/')[1];
      navigate(`/property/${propertyId}`);
    } else {
      const section = document.getElementById(path);
      if (section) {
        const navbarHeight = 60;
        const offsetPosition = section.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      } else {
        navigate(`/${path}`);
      }
    }
    setMenuOpen(false);
  };

  return (
    <div className="app-container  w-100 min-vh-100">
      {/* Mobile-First Navigation */}
      <nav className={`navbar navbar-expand-lg fixed-top navbar-light bg-white shadow-sm ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container-fluid">
          <a
            className="navbar-brand fw-bold text-primary d-flex align-items-center"
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavigation('home');
            }}
          >
            <span className="me-1">🏠</span>
            <span>CribConnect</span>
          </a>
          
          <button
            className="navbar-toggler border-0 p-1"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            aria-controls="navbarNav"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="navbarNav">
            <ul className="navbar-nav ms-auto">
              {[
                { key: 'home', label: 'Home' },
                { key: 'services', label: 'Services' },
                { key: 'community', label: 'Community' },
                { key: 'contact', label: 'Contact' }
              ].map((item) => (
                <li className="nav-item" key={item.key}>
                  <a
                    className="nav-link px-3 py-2"
                    href={`#${item.key}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation(item.key);
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li className="nav-item d-lg-none">
                <hr className="my-2" />
              </li>
              <li className="nav-item">
                <button 
                  className="btn btn-outline-primary btn-sm w-100 w-lg-auto mb-2 mb-lg-0 me-lg-2" 
                  onClick={() => handleNavigation('signin')}
                >
                  Sign In
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className="btn btn-primary btn-sm w-100 w-lg-auto" 
                  onClick={() => handleNavigation('register')}
                >
                  Register
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Compact Mobile-First Hero Section */}
      <section id="home" ref={homeRef} className="hero bg-gradient-to-br from-blue-50 to-white py-4 py-md-5">
        <div className="container-fluid">
          {/* Main Content */}
          <div className="text-center mb-4">
            <h1 className="h2 fw-bold mb-3 text-dark">
              Find Your Perfect Student Home
            </h1>
            <p className="text-muted mb-4 mx-auto" style={{maxWidth: '400px'}}>
              Quality, affordable accommodation near CBU with verified landlords
            </p>
            
            {/* Mobile-Optimized Search */}
            <div className="search-container mb-4">
              <div className="input-group shadow-sm" style={{maxWidth: '400px', margin: '0 auto'}}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by area, price..."
                  aria-label="Search accommodations"
                />
                <button className="btn btn-primary px-3" type="button">
                  <span className="d-none d-sm-inline">Search</span>
                  <span className="d-sm-none">🔍</span>
                </button>
              </div>
            </div>
            
            {/* Quick Action Buttons */}
            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <button 
                className="btn btn-primary" 
                onClick={() => handleNavigation('viewall')}
              >
                Browse Properties
              </button>
              <button 
                className="btn btn-outline-primary" 
                onClick={() => handleNavigation('register')}
              >
                Get Started
              </button>
            </div>
          </div>
          
          {/* Compact Stats */}
          <div className="row g-2 justify-content-center">
            <div className="col-6 col-sm-3">
              <div className="card text-center border-0 bg-white shadow-sm h-100">
                <div className="card-body py-3">
                  <div className="text-primary fw-bold h5 mb-1">300+</div>
                  <small className="text-muted">Listings</small>
                </div>
              </div>
            </div>
            <div className="col-6 col-sm-3">
              <div className="card text-center border-0 bg-white shadow-sm h-100">
                <div className="card-body py-3">
                  <div className="text-success fw-bold h5 mb-1">K300</div>
                  <small className="text-muted">From</small>
                </div>
              </div>
            </div>
            <div className="col-6 col-sm-3">
              <div className="card text-center border-0 bg-white shadow-sm h-100">
                <div className="card-body py-3">
                  <div className="text-info fw-bold h5 mb-1">Few Mins Walk</div>
                  <small className="text-muted">To Your Campus</small>
                </div>
              </div>
            </div>
            <div className="col-6 col-sm-3">
              <div className="card text-center border-0 bg-white shadow-sm h-100">
                <div className="card-body py-3">
                  <div className="text-warning fw-bold h5 mb-1">24/7</div>
                  <small className="text-muted">Support</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile-First Properties Section */}
      <section className="properties py-4 py-md-5">
        <div className="container-fluid px-3">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="h4 mb-1">Available Properties</h2>
              <p className="text-muted small mb-0">
                {hasLoadedAPI ? 'Live listings' : 'Featured near CBU'}
              </p>
            </div>
            <button 
              className="btn btn-outline-primary btn-sm" 
              onClick={() => handleNavigation('viewall')}
            >
              View All
            </button>
          </div>
          
          {/* Mobile-First Grid */}
          <div className="row g-3">
            {featuredProperties.slice(0, 6).map((property) => (
              <div className="col-12 col-sm-6 col-lg-4" key={property.id}>
                <div className="card h-100 border-0 shadow-sm">
                  <div className="position-relative">
                    <img 
                      src={property.image} 
                      className="card-img-top" 
                      alt={property.title}
                      style={{height: '200px', objectFit: 'cover'}}
                      loading="lazy"
                    />
                    {property.tag && (
                      <span className={`badge position-absolute top-0 end-0 m-2 ${
                        property.tag === 'Popular' ? 'bg-success' :
                        property.tag === 'Budget' ? 'bg-info' :
                        property.tag === 'Premium' ? 'bg-warning text-dark' : 'bg-primary'
                      }`}>
                        {property.tag}
                      </span>
                    )}
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title h6 mb-2">{property.title}</h5>
                    <p className="text-muted small mb-2">
                      📍 {property.location}
                    </p>
                    <p className="fw-bold text-primary mb-3">{property.price}</p>
                    <div className="mb-3">
                      {property.features.slice(0, 3).map((feature, index) => (
                        <span key={index} className="badge bg-light text-dark me-1 mb-1 small">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <button
                      className="btn btn-primary btn-sm mt-auto"
                      onClick={() => navigate('/PropertyDetailsPage', { state: { propertyId: property.id } })}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compact Services Section */}
      <section id="services" ref={servicesRef} className="features py-4 py-md-5 bg-light">
        <div className="container-fluid">
          <h2 className="h4 text-center mb-4">Why Choose NexNest</h2>
          <div className="row g-3">
            {[
              {
                icon: '🏆',
                title: 'Trusted',
                description: '2,000+ CBU students served',
              },
              {
                icon: '💰',
                title: 'Best Value',
                description: 'No hidden fees, transparent pricing',
              },
              {
                icon: '🚶‍♂️',
                title: 'Near Campus',
                description: 'Walking distance to CBU',
              },
              {
                icon: '🤝',
                title: 'Direct Contact',
                description: 'Chat with verified owners',
              },
            ].map((feature, index) => (
              <div className="col-6 col-lg-3" key={index}>
                <div className="text-center p-3">
                  <div className="fs-1 mb-2">{feature.icon}</div>
                  <h5 className="h6 mb-2">{feature.title}</h5>
                  <p className="small text-muted mb-0">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile-Optimized Community Section */}
      <section id="community" ref={communityRef} className="community py-4 py-md-5">
        <div className="container-fluid">
          <div className="text-center mb-4">
            <h2 className="h4 mb-3">Join Our Community</h2>
            <p className="text-muted mb-4">
              Connect with CBU students, find roommates, get housing tips
            </p>
            <div className="d-flex justify-content-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-primary fw-bold">100+</div>
                <small className="text-muted">Members</small>
              </div>
              <div className="text-center">
                <div className="text-success fw-bold">24/7</div>
                <small className="text-muted">Support</small>
              </div>
              <div className="text-center">
                <div className="text-info fw-bold">Free</div>
                <small className="text-muted">To Join</small>
              </div>
            </div>
            <button className="btn btn-outline-primary">
              Join Community
            </button>
          </div>
        </div>
      </section>

      {/* Compact Contact Section */}
      <section id="contact" ref={contactRef} className="contact py-4 py-md-5 bg-primary text-white">
        <div className="container-fluid">
          <div className="text-center">
            <h2 className="h4 mb-3">Need Help?</h2>
            <p className="mb-4">Get assistance finding your perfect student accommodation</p>
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6">
                <div className="d-flex align-items-center justify-content-center">
                  <span className="me-2">📧</span>
                  <a href="mailto:brianchanda02@gmail.com" className="text-white text-decoration-none">
                    brianchanda02@gmail.com
                  </a>
                </div>
              </div>
              <div className="col-12 col-sm-6">
                <div className="d-flex align-items-center justify-content-center">
                  <span className="me-2">📱</span>
                  <a href="tel:+260972526777" className="text-white text-decoration-none">
                    +260 972 526 777
                  </a>
                </div>
              </div>
            </div>
            <button 
              className="btn btn-light"
              onClick={() => handleNavigation('register')}
            >
              Get Started Today
            </button>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-4 bg-dark text-white">
        <div className="container-fluid">
          <div className="row g-4">
            <div className="col-12 col-md-6 text-center text-md-start">
              <h5 className="fw-bold mb-2">🏠 CribConnect</h5>
              <p className="small mb-0">
                Trusted student housing platform for CBU students in Kitwe
              </p>
            </div>
            <div className="col-12 col-md-6">
              <div className="row g-3">
                <div className="col-6 text-center">
                  <h6 className="small fw-bold mb-2">Quick Links</h6>
                  <div className="d-flex flex-column">
                    {['Home', 'Browse', 'Account'].map((link) => (
                      <a href="#" className="text-decoration-none text-white-50 small mb-1" key={link}>
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="col-6 text-center">
                  <h6 className="small fw-bold mb-2">Support</h6>
                  <div className="d-flex flex-column">
                    {['Help', 'FAQs', 'Contact'].map((link) => (
                      <a href="#" className="text-decoration-none text-white-50 small mb-1" key={link}>
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12">
              <hr className="border-secondary my-3" />
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center">
                <p className="small text-white-50 mb-2 mb-sm-0">
                  © {new Date().getFullYear()} NexNest. All rights reserved.
                </p>
                <div className="d-flex gap-3">
                  <a href="#" className="text-white-50 text-decoration-none small">Privacy</a>
                  <a href="#" className="text-white-50 text-decoration-none small">Terms</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;