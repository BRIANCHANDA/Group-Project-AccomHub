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
    
  ];

  const [featuredProperties, setFeaturedProperties] = useState<Property[]>(mockProperties);
  const [isLoading, setIsLoading] = useState(false); // Start with false to show mock data immediately
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

    // Delay API call slightly to ensure immediate render
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
        const navbarHeight = 70; // Fixed height instead of computed
        const offsetPosition = section.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      } else {
        navigate(`/${path}`);
      }
    }
    setMenuOpen(false);
  };

  return (
    <div className="app-container">
      {/* Streamlined Navigation */}
      <nav className={`navbar navbar-expand-lg sticky-top navbar-light bg-white shadow-sm ${isScrolled ? 'border-bottom' : ''}`}>
        <div className="container">
          <a
            className="navbar-brand fw-bold text-primary"
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavigation('home');
            }}
          >
            🏠 NexNest
          </a>
          <button
            className="navbar-toggler border-0"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-controls="navbarNav"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center">
              {[
                { key: 'home', label: 'Home' },
                { key: 'services', label: 'Services' },
                { key: 'community', label: 'Community' },
                { key: 'contact', label: 'Contact' }
              ].map((item) => (
                <li className="nav-item" key={item.key}>
                  <a
                    className="nav-link px-3"
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
              <li className="nav-item ms-2">
                <button 
                  className="btn btn-outline-primary btn-sm me-2" 
                  onClick={() => handleNavigation('signin')}
                >
                  Sign In
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={() => handleNavigation('register')}
                >
                  Register
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Direct Hero Section - No excessive spacing */}
      <section id="home" ref={homeRef} className="hero bg-light py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-5 fw-bold mb-3 text-dark">
                Find Your Perfect Student Home Near Your University
              </h1>
              <p className="lead mb-4 text-muted">
                Discover quality, affordable student accommodation with verified landlords and transparent pricing in Kitwe.
              </p>
              
              {/* Immediate Search - Above the fold */}
              <div className="search-container mb-4">
                <form className="d-flex" onSubmit={(e) => e.preventDefault()}>
                  <input
                    type="text"
                    className="form-control form-control-lg me-2"
                    placeholder="Search by area, price range, or features..."
                    aria-label="Search accommodations"
                  />
                  <button type="submit" className="btn btn-primary btn-lg px-4">
                    Search
                  </button>
                </form>
              </div>
              
              <div className="d-flex gap-3">
                <button 
                  className="btn btn-outline-primary" 
                  onClick={() => handleNavigation('viewall')}
                >
                  Browse All Properties
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleNavigation('register')}
                >
                  Get Started
                </button>
              </div>
            </div>
            
            <div className="col-lg-6">
              {/* Quick Stats - Updated with more appealing content */}
              <div className="row g-3">
                <div className="col-6">
                  <div className="card text-center border-0 bg-white shadow-sm">
                    <div className="card-body py-3">
                      <h3 className="text-primary mb-1">300+</h3>
                      <small className="text-muted">Active Listings</small>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card text-center border-0 bg-white shadow-sm">
                    <div className="card-body py-3">
                      <h3 className="text-success mb-1">From As Low As K450</h3>
                      <small className="text-muted">Starting Price</small>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card text-center border-0 bg-white shadow-sm">
                    <div className="card-body py-3">
                      <h3 className="text-info mb-1">98%</h3>
                      <small className="text-muted">Student Satisfaction</small>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card text-center border-0 bg-white shadow-sm">
                    <div className="card-body py-3">
                      <h3 className="text-warning mb-1">Fast</h3>
                      <small className="text-muted">Response Time</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties - Now shows immediately */}
      <section className="properties py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="h3 mb-1">Available Student Accommodation</h2>
              <p className="text-muted small mb-0">
                {hasLoadedAPI ? 'Live listings updated regularly' : 'Featured properties near CBU campus'}
              </p>
            </div>
            <button 
              className="btn btn-outline-primary btn-sm" 
              onClick={() => handleNavigation('viewall')}
            >
              View All Properties
            </button>
          </div>
          
          <div className="row">
            {featuredProperties.slice(0, 8).map((property) => (
              <div className="col-md-6 " key={property.id}>
                <div className="card h-100 border-0 shadow-sm">
                  <div className="position-relative">
                    <img 
                      src={property.image} 
                      className="card-img-top" 
                      alt={property.title}
                      style={{ height: '200px', objectFit: 'cover' }}
                      loading="lazy"
                    />
                    {property.tag && (
                      <span className={`badge position-absolute top-0 end-0 m-2 ${
                        property.tag === 'Popular' ? 'bg-success' :
                        property.tag === 'Budget' ? 'bg-info' :
                        property.tag === 'Premium' ? 'bg-warning' :
                        property.tag === 'Luxury' ? 'bg-dark' : 'bg-primary'
                      }`}>
                        {property.tag}
                      </span>
                    )}
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title mb-2">{property.title}</h5>
                    <p className="text-muted small mb-2">
                      📍 {property.location}
                    </p>
                    <p className="fw-bold text-primary mb-3">{property.price}</p>
                    <div className="mb-3">
                      {property.features.slice(0, 3).map((feature, index) => (
                        <span key={index} className="badge bg-light text-dark me-1 mb-1">
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

      {/* Enhanced Services Section */}
      <section id="services" ref={servicesRef} className="py-5 bg-light">
        <div className="container">
          <h2 className="h3 text-center mb-5">Why Students Choose Us</h2>
          <div className="row g-4">
            {[
              {
                icon: '🏆',
                title: 'Trusted by Students',
                description: 'Over 2,000 CBU students have found their perfect accommodation through our platform.',
              },
              {
                icon: '💰',
                title: 'Best Value Guarantee',
                description: 'Compare prices easily and find the best deals with no hidden fees or booking charges.',
              },
              {
                icon: '🚶‍♂️',
                title: 'Walk to Campus',
                description: 'All properties are within easy walking distance or short transport to CBU main campus.',
              },
              {
                icon: '🤝',
                title: 'Direct Connections',
                description: 'Chat directly with verified property owners and get quick responses to your inquiries.',
              },
            ].map((feature, index) => (
              <div className="col-md-6 col-lg-3" key={index}>
                <div className="text-center">
                  <div className="fs-2 mb-3">{feature.icon}</div>
                  <h4 className="h5 mb-3">{feature.title}</h4>
                  <p className="text-muted small">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section - Enhanced */}
      <section id="community" ref={communityRef} className="py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h2 className="h3 mb-3">Join Our Student Community</h2>
              <p className="lead text-muted mb-3">
                Connect with fellow CBU students, share housing tips, find roommates, and get insider advice from our active community.
              </p>
              <div className="d-flex align-items-center gap-4">
                <div className="text-center">
                  <strong className="text-primary fs-5">100 plus</strong>
                  <div className="small text-muted">Active Members</div>
                </div>
                <div className="text-center">
                  <strong className="text-success fs-5">24/7</strong>
                  <div className="small text-muted">Community Support</div>
                </div>
                <div className="text-center">
                  <strong className="text-info fs-5">Free</strong>
                  <div className="small text-muted">To Join</div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button className="btn btn-outline-primary btn-lg">
                Join Community
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section - Enhanced */}
      <section id="contact" ref={contactRef} className="py-5 bg-dark text-white">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <h2 className="h3 mb-4">Need Help Finding Accommodation?</h2>
              <p className="mb-4">Our team is here to help you find the perfect student accommodation near CBU campus.</p>
              <div className="row">
                <div className="col-md-6">
                  <p className="mb-2">
                    <strong>📧 Email:</strong> <a href="mailto:brianchanda02@gmail.com" className="text-white">brianchanda02@gmail.com</a>
                  </p>
                  <p className="mb-2">
                    <strong>📱 WhatsApp:</strong> <a href="tel:+260972526777" className="text-white">+260 972 526 777</a>
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="mb-2">
                    <strong>📍 Location:</strong> CBU Campus Area, Kitwe
                  </p>
                  <p className="mb-2">
                    <strong>⏰ Support:</strong> 8AM - 8PM Daily
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button 
                className="btn btn-light btn-lg"
                onClick={() => handleNavigation('register')}
              >
                Start Your Search Today
              </button>
            </div>
          </div>
        </div>
      </section>

      

      {/* Footer */}
      <footer className="mt-auto py-5 bg-dark text-white">
        <div className="container">
          <div className="row gy-4">
            <div className="col-md-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center">
                <i className="bi bi-building-fill me-2"></i>
               NexNest
              </h5>
              <p className="mb-3">
                Your trusted partner for finding safe and affordable student housing at Copperbelt University.
              </p>
              <div className="d-flex gap-3">
                {['facebook', 'twitter-x', 'instagram', 'linkedin'].map((platform) => (
                  <a href="#" className="text-white" key={platform}>
                    <i className={`bi bi-${platform} fs-5`}></i>
                  </a>
                ))}
              </div>
            </div>
            <div className="col-md-8">
              <div className="row">
                <div className="col-sm-4">
                  <h6 className="fw-bold mb-3">Quick Links</h6>
                  <ul className="list-unstyled mb-0">
                    {['Home', 'Browse Listings', 'Saved Properties', 'My Account'].map((link) => (
                      <li className="mb-2" key={link}>
                        <a href="#" className="text-decoration-none text-white-50 hover-white">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="col-sm-4">
                  <h6 className="fw-bold mb-3">Resources</h6>
                  <ul className="list-unstyled mb-0">
                    {['FAQs', 'Student Guide', 'Safety Tips', 'Blog'].map((resource) => (
                      <li className="mb-2" key={resource}>
                        <a href="#" className="text-decoration-none text-white-50 hover-white">
                          {resource}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="col-sm-4">
                  <h6 className="fw-bold mb-3">Contact Us</h6>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2 d-flex align-items-center">
                      <i className="bi bi-geo-alt me-2"></i>
                      <span className="text-white-50">CBU Campus, Kitwe</span>
                    </li>
                    <li className="mb-2 d-flex align-items-center">
                      <i className="bi bi-envelope me-2"></i>
                      <span className="text-white-50">support@NexNest.ac.zm</span>
                    </li>
                    <li className="mb-2 d-flex align-items-center">
                      <i className="bi bi-telephone me-2"></i>
                      <span className="text-white-50">+260 972 526777</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-12 mt-4">
              <hr className="border-secondary" />
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3">
                <p className="mb-0 text-white-50">
                  © {new Date().getFullYear()} NexNest. All rights reserved.
                </p>
                <div className="mt-3 mt-sm-0">
                  {['Privacy Policy', 'Terms of Service', 'Sitemap'].map((link) => (
                    <a href="#" className="text-decoration-none me-3 text-white-50 hover-white" key={link}>
                      {link}
                    </a>
                  ))}
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