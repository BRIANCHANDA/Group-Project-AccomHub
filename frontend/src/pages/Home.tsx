// Home.tsx
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
  const [error, setError] = useState<any>(null);
  const [hasLoadedAPI, setHasLoadedAPI] = useState(false);

  // References for navigation
  const homeRef = useRef<HTMLElement | null>(null);
  const servicesRef = useRef<HTMLElement | null>(null);
  const communityRef = useRef<HTMLElement | null>(null);
  const contactRef = useRef<HTMLElement | null>(null);

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
        // Keep mock data on error
      }
    };

    const timer = setTimeout(fetchRealProperties, 100);
    return () => clearTimeout(timer);
  }, []);

  // Scroll handler
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

  // Close mobile menu when clicking outside or on window resize
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (menuOpen && !event.target.closest('.navbar-collapse') && !event.target.closest('.navbar-toggler')) {
        setMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleNavigation = (path: string) => {
    const paths: Record<string, string> = {
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
    <div className="app-container w-100 min-vh-100">
      <style>{`
        @media (max-width: 991.98px) {
          .navbar-collapse {
            position: absolute !important;
            top: 100% !important;
            left: 0 !important;
            right: 0 !important;
            background: white !important;
            border-radius: 0 0 12px 12px !important;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
            padding: 1.5rem 0 !important;
            margin: 0 !important;
            z-index: 1050 !important;
            border-top: 1px solid #e9ecef !important;
          }

          .navbar-collapse.show {
            animation: slideDown 0.3s ease-out !important;
          }

          .mobile-nav-link {
            padding: 0.75rem 1.5rem !important;
            margin: 0.25rem 0 !important;
            border-radius: 8px !important;
            transition: all 0.2s ease !important;
            text-align: center !important;
            font-weight: 500 !important;
          }

          .mobile-nav-link:hover {
            background-color: #f8f9fa !important;
            color: #0d6efd !important;
            transform: translateX(5px) !important;
          }

          .mobile-buttons {
            padding: 1rem 1.5rem 0.5rem !important;
            border-top: 1px solid #e9ecef !important;
            margin-top: 1rem !important;
          }

          .mobile-buttons .btn {
            width: 100% !important;
            margin-bottom: 0.5rem !important;
            font-weight: 500 !important;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hamburger-icon {
          width: 24px;
          height: 18px;
          position: relative;
          cursor: pointer;
        }

        .hamburger-line {
          width: 100%;
          height: 2px;
          background-color: #333;
          position: absolute;
          transition: all 0.3s ease;
        }

        .hamburger-line:nth-child(1) {
          top: 0;
        }

        .hamburger-line:nth-child(2) {
          top: 50%;
          transform: translateY(-50%);
        }

        .hamburger-line:nth-child(3) {
          bottom: 0;
        }

        .hamburger-active .hamburger-line:nth-child(1) {
          transform: rotate(45deg) translateY(8px);
        }

        .hamburger-active .hamburger-line:nth-child(2) {
          opacity: 0;
        }

        .hamburger-active .hamburger-line:nth-child(3) {
          transform: rotate(-45deg) translateY(-8px);
        }

        .mobile-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1040;
          opacity: 0;
          animation: fadeIn 0.3s ease forwards;
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>

      {/* Mobile backdrop */}
      {menuOpen && <div className="mobile-backdrop d-lg-none" onClick={() => setMenuOpen(false)}></div>}

      {/* NAVBAR */}
      <nav className={`navbar navbar-expand-lg fixed-top navbar-light bg-white shadow-sm ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container-lg">
          {/* Brand */}
          <a
            className="navbar-brand fw-bold text-primary d-flex align-items-center"
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavigation('home');
            }}
          >
            <span className="me-2">🏠</span>
            <span>PlacesForLearners</span>
          </a>

          {/* Custom hamburger toggle */}
          <button
            className="navbar-toggler border-0 p-2"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            aria-controls="navbarNav"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
            style={{ boxShadow: 'none' }}
          >
            <div className={`hamburger-icon ${menuOpen ? 'hamburger-active' : ''}`}>
              <div className="hamburger-line"></div>
              <div className="hamburger-line"></div>
              <div className="hamburger-line"></div>
            </div>
          </button>

          {/* Nav Content */}
          <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="navbarNav">
            {/* Centered nav links */}
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
              {[
                { key: 'home', label: 'Home' },
                { key: 'services', label: 'Services' },
                { key: 'community', label: 'Community' },
                { key: 'contact', label: 'Contact' }
              ].map((item) => (
                <li className="nav-item" key={item.key}>
                  <a
                    className="nav-link mobile-nav-link"
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
            </ul>

            {/* Right-side buttons */}
            <div className="d-flex align-items-center gap-2 mobile-buttons">
              <button className="btn btn-outline-primary btn-sm" onClick={() => handleNavigation('signin')}>
                Sign In
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => handleNavigation('register')}>
                Register
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section id="home" ref={homeRef} className="hero bg-gradient-to-br from-blue-50 to-white py-4 py-md-5">
        <div className="container-lg">
          <div className="text-center mb-4" style={{ paddingTop: 80 }}>
            <h1 className="h2 fw-bold mb-3 text-dark">Find Your Perfect Student Home</h1>
            <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '600px' }}>
              Quality, affordable accommodation near your University with verified landlords
            </p>

            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <button className="btn btn-primary btn-lg px-4" onClick={() => handleNavigation('viewall')}>
                <span className="me-1">🏠</span> Browse All Properties
              </button>
              <button className="btn btn-outline-primary" onClick={() => handleNavigation('register')}>
                Get Started
              </button>
            </div>

            <div className="mt-3">
              <small className="text-muted">
                Over 300+ verified listings •
                <button className="btn btn-link btn-sm p-0 text-decoration-underline" onClick={() => handleNavigation('viewall')}>
                  See them all
                </button>
              </small>
            </div>
          </div>

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

      {/* PROPERTIES */}
      <section className="properties py-4 py-md-5">
        <div className="container-lg px-3">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="h4 mb-1">Featured Properties</h2>
              <p className="text-muted small mb-0">{hasLoadedAPI ? 'Live listings' : 'Popular near CBU'}</p>
            </div>
            <button className="btn btn-outline-primary btn-sm d-flex align-items-center" onClick={() => handleNavigation('viewall')}>
              <span className="d-none d-sm-inline me-1">View All</span>
              <span className="d-sm-none">All</span>
              <span className="ms-1">→</span>
            </button>
          </div>

          <div className="row g-3">
            {featuredProperties.slice(0, 6).map((property) => (
              <div className="col-12 col-sm-6 col-lg-4" key={property.id}>
                <div className="card h-100 border-0 shadow-sm">
                  <div className="position-relative">
                    <img src={property.image} className="card-img-top" alt={property.title} style={{ height: '200px', objectFit: 'cover' }} loading="lazy" />
                    {property.tag && (
                      <span className={`badge position-absolute top-0 end-0 m-2 ${property.tag === 'Popular' ? 'bg-success' : property.tag === 'Budget' ? 'bg-info' : property.tag === 'Premium' ? 'bg-warning text-dark' : 'bg-primary'}`}>
                        {property.tag}
                      </span>
                    )}
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title h6 mb-2">{property.title}</h5>
                    <p className="text-muted small mb-2">📍 {property.location}</p>
                    <p className="fw-bold text-primary mb-3">{property.price}</p>
                    <div className="mb-3">
                      {property.features.slice(0, 3).map((feature, index) => (
                        <span key={index} className="badge bg-light text-dark me-1 mb-1 small">{feature}</span>
                      ))}
                    </div>
                    <button className="btn btn-primary btn-sm mt-auto" onClick={() => navigate('/PropertyDetailsPage', { state: { propertyId: property.id } })}>
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-4 py-4 bg-light rounded">
            <h5 className="mb-2">Want to see more options?</h5>
            <p className="text-muted mb-3 small">Discover {hasLoadedAPI ? 'hundreds' : '300+'} more verified student accommodations</p>
            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <button className="btn btn-primary" onClick={() => handleNavigation('viewall')}><span className="me-1">🏠</span> Browse All Properties</button>
              <button className="btn btn-outline-primary" onClick={() => handleNavigation('register')}>Create Account</button>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" ref={servicesRef} className="features py-4 py-md-5 bg-light">
        <div className="container-lg">
          <h2 className="h4 text-center mb-4">Why Choose PlacesForLearners</h2>
          <div className="row g-3">
            {[
              { icon: '🏆', title: 'Trusted', description: '2,000+ CBU students served' },
              { icon: '💰', title: 'Best Value', description: 'No hidden fees, transparent pricing' },
              { icon: '🚶‍♂️', title: 'Near Campus', description: 'Walking distance to CBU' },
              { icon: '🤝', title: 'Direct Contact', description: 'Chat with verified owners' }
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
          <div className="text-center mt-4">
            <p className="text-muted mb-3">Ready to find your perfect student home?</p>
            <button className="btn btn-primary me-2" onClick={() => handleNavigation('viewall')}>Start Browsing</button>
            <button className="btn btn-outline-primary" onClick={() => handleNavigation('register')}>Join Now</button>
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section id="community" ref={communityRef} className="community py-4 py-md-5">
        <div className="container-lg">
          <div className="text-center mb-4">
            <h2 className="h4 mb-3">Join Our Community</h2>
            <p className="text-muted mb-4">Connect with Your University Mates, find roommates, get housing tips</p>
            <div className="d-flex justify-content-center gap-4 mb-4">
              <div className="text-center"><div className="text-primary fw-bold">100+</div><small className="text-muted">Members</small></div>
              <div className="text-center"><div className="text-success fw-bold">24/7</div><small className="text-muted">Support</small></div>
              <div className="text-center"><div className="text-info fw-bold">Free</div><small className="text-muted">To Join</small></div>
            </div>
            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <button className="btn btn-outline-primary">Join Community</button>
              <button className="btn btn-primary" onClick={() => handleNavigation('viewall')}>Find Housing</button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" ref={contactRef} className="contact py-4 py-md-5 bg-primary text-white">
        <div className="container-lg">
          <div className="text-center">
            <h2 className="h4 mb-3">Need Help Finding Housing?</h2>
            <p className="mb-4">Get assistance finding your perfect student accommodation</p>
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6"><div className="d-flex align-items-center justify-content-center"><span className="me-2">📧</span><a href="mailto:brianchanda02@gmail.com" className="text-white text-decoration-none">brianchanda02@gmail.com</a></div></div>
              <div className="col-12 col-sm-6"><div className="d-flex align-items-center justify-content-center"><span className="me-2">📱</span><a href="tel:+260972526777" className="text-white text-decoration-none">+260 972 526 777</a></div></div>
            </div>
            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <button className="btn btn-light" onClick={() => handleNavigation('register')}>Get Started Today</button>
              <button className="btn btn-outline-light" onClick={() => handleNavigation('viewall')}>Browse Properties</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-4 bg-dark text-white">
        <div className="container-lg">
          <div className="row g-4">
            <div className="col-12 col-md-6 text-center text-md-start">
              <h5 className="fw-bold mb-2">🏠 PlacesForLearners</h5>
              <p className="small mb-0">Trusted student housing platform for CBU students in Kitwe</p>
            </div>
            <div className="col-12 col-md-6">
              <div className="row g-3">
                <div className="col-6 text-center">
                  <h6 className="small fw-bold mb-2">Quick Links</h6>
                  <div className="d-flex flex-column">
                    <a href="#" className="text-decoration-none text-white-50 small mb-1" onClick={() => handleNavigation('home')}>Home</a>
                    <button className="btn btn-link p-0 text-start text-white-50 small mb-1 text-decoration-none" onClick={() => handleNavigation('viewall')}>Browse Properties</button>
                    <a href="#" className="text-decoration-none text-white-50 small mb-1" onClick={() => handleNavigation('register')}>Account</a>
                  </div>
                </div>
                <div className="col-6 text-center">
                  <h6 className="small fw-bold mb-2">Support</h6>
                  <div className="d-flex flex-column">
                    {['Help', 'FAQs', 'Contact'].map((link) => (
                      <a href="#" className="text-decoration-none text-white-50 small mb-1" key={link}>{link}</a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12">
              <hr className="border-secondary my-3" />
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center">
                <p className="small text-white-50 mb-2 mb-sm-0">© {new Date().getFullYear()} PlacesForLearners. All rights reserved.</p>
                <div className="d-flex gap-3 align-items-center">
                  <a href="#" className="text-white-50 text-decoration-none small">Privacy</a>
                  <a href="#" className="text-white-50 text-decoration-none small">Terms</a>
                  <span className="text-white-50">•</span>
                  <button className="btn btn-link p-0 text-white-50 small text-decoration-underline" onClick={() => handleNavigation('viewall')}>Browse All</button>
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