
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Navigation handlers with improved error handling
  const handleNavigation = (path: string) => {
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
        section.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Fallback in case the section does not exist
        navigate(`/${path}`);
      }
    }
    // Close mobile menu after navigation
    setMenuOpen(false);
  };

  // Extracted reusable hover effect for cleaner code
  const getHoverStyle = (itemName: string | null, baseStyle: any) => ({
    ...baseStyle,
    ...(itemName === 'navItem' 
      ? { borderBottom: hoveredItem === itemName ? '2px solidrgb(50, 1, 129)' : '2px solid transparent' }
      : {}),
    ...(itemName === 'buttonOutline' 
      ? { backgroundColor: hoveredItem === itemName ? '#f3f4f6' : 'transparent' }
      : {}),
    ...(itemName === 'buttonFilled' 
      ? { backgroundColor: hoveredItem === itemName ? '#5b21b6' : '#6d28d9' }
      : {}),
    ...(itemName === 'ctaButton' 
      ? { backgroundColor: hoveredItem === itemName ? '#f9fafb' : '#ffffff' }
      : {}),
    ...(itemName?.startsWith('property') 
      ? { transform: hoveredItem === itemName ? 'translateY(-5px)' : 'none' }
      : {})
  });

  // Media query breakpoints
  const mediaQueries = {
    mobile: '@media (max-width: 640px)',
    tablet: '@media (min-width: 641px) and (max-width: 1024px)',
    desktop: '@media (min-width: 1025px)',
    largeScreen: '@media (min-width: 1800px)'
  };

  // Styles - reorganized for better maintainability and responsiveness
  const styles = {
    // Layout
    container: {
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      overflowX: 'hidden' // Prevent horizontal scrolling
    },
    
    // Header styles
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 5%',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #f0f0f0',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      flexWrap: 'wrap',
      gap: '0.5rem'
    },
    logo: {
      fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
      fontWeight: 'bold',
      color: 'rgb(48, 0, 126)',
      flex: '1'
    },
    mobileMenuButton: {
      display: 'none',
      backgroundColor: 'rgb(48, 0, 126)',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      padding: '0.5rem',
      '@media (max-width: 768px)': {
        display: 'block'
      }
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(0.5rem, 2vw, 2rem)',
      flexWrap: 'wrap',
      '@media (max-width: 768px)': {
        display: menuOpen ? 'flex' : 'none',
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: '100%',
        padding: '1rem 0',
        gap: '1rem'
      }
    },
    navItem: {
      fontSize: 'clamp(0.875rem, 1vw, 1rem)',
      color: 'rgb(48, 0, 126)',
      cursor: 'pointer',
      textDecoration: 'none',
      padding: '0.5rem 0',
      transition: 'border-bottom 0.2s ease',
      '@media (max-width: 768px)': {
        width: '100%', 
        padding: '0.75rem 0'
      }
    },
    
    // Button styles
    buttonOutline: {
      padding: 'clamp(0.4rem, 1vw, 0.5rem) clamp(0.75rem, 2vw, 1.25rem)',
      border: '1px solid #d1d5db',
      borderRadius: '0.375rem',
      backgroundColor: 'transparent',
      color: 'rgb(48, 0, 126)',
      fontSize: 'clamp(0.875rem, 1vw, 1rem)',
      cursor: 'pointer',
      transition: 'background-color 0.3s, transform 0.2s',
      display: 'inline-block',
      textAlign: 'center',
      '@media (max-width: 768px)': {
        width: '100%',
        marginTop: '0.5rem'
      }
    },
    buttonFilled: {
      padding: 'clamp(0.4rem, 1vw, 0.5rem) clamp(0.75rem, 2vw, 1.25rem)',
      border: 'none',
      borderRadius: '0.375rem',
      backgroundColor: 'rgb(48, 0, 126)',
      color: '#ffffff',
      fontSize: 'clamp(0.875rem, 1vw, 1rem)',
      cursor: 'pointer',
      transition: 'background-color 0.3s, transform 0.2s',
      display: 'inline-block',
      textAlign: 'center',
      '@media (max-width: 768px)': {
        width: '100%',
        marginTop: '0.5rem'
      }
    },
    
    // Hero section styles
    hero: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)',
      textAlign: 'center',
      backgroundColor: '#f9fafb'
    },
    title: {
      fontSize: 'clamp(1.5rem, 5vw, 3rem)',
      fontWeight: 'bold',
      color: 'rgb(48, 0, 126)',
      marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
      letterSpacing: '-0.025em',
      lineHeight: '1.2',
      maxWidth: '90%'
    },
    subtitle: {
      fontSize: 'clamp(0.875rem, 3vw, 1.25rem)',
      color: '#4b5563',
      marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
      maxWidth: 'min(800px, 90%)',
      lineHeight: '1.5'
    },
    
    // Search box styles
    searchContainer: {
      width: '100%',
      maxWidth: 'min(700px, 90%)',
      marginBottom: 'clamp(1.5rem, 5vw, 3rem)'
    },
    searchForm: {
      display: 'flex',
      width: '100%',
      flexDirection: 'row',
      '@media (maxWidth: 480px)': {
        flexDirection: 'column'
      }
    },
    searchInput: {
      flex: '1',
      padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
      borderRadius: '0.375rem',
      border: '1px solid #d1d5db',
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      outline: 'none',
      '@media (minWidth: 481px)': {
        borderRadius: '0.375rem 0 0 0.375rem'
      }
    },
    searchButton: {
      padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
      backgroundColor: '#6d28d9',
      color: 'rgb(48, 0, 126)',
      border: 'none',
      borderRadius: '0.375rem',
      cursor: 'pointer',
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      '@media (minWidth: 481px)': {
        borderRadius: '0 0.375rem 0.375rem 0'
      },
      '@media (maxWidth: 480px)': {
        marginTop: '0.5rem'
      }
    },
    
    // Section styles
    featuresSection: {
      padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#ffffff'
    },
    sectionTitle: {
      fontSize: 'clamp(1.25rem, 4vw, 2rem)',
      fontWeight: 'bold',
      color: 'rgb(48, 0, 126)',
      marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
      textAlign: 'center',
      maxWidth: '90%'
    },
    sectionContent: {
      fontSize: 'clamp(0.875rem, 3vw, 1.2rem)',
      color: '#4b5563',
      maxWidth: 'min(800px, 90%)',
      margin: '0 auto clamp(1.5rem, 4vw, 2rem)'
    },
    
    // Features grid styles
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))',
      gap: 'clamp(1rem, 3vw, 2rem)',
      width: '100%',
      maxWidth: 'min(1200px, 90%)'
    },
    featureCard: {
      backgroundColor: 'rgb(239, 237, 245)',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      padding: 'clamp(1rem, 3vw, 1.5rem)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      transition: 'transform 0.3s, box-shadow 0.3s',
      height: '100%',
      justifyContent: 'flex-start'
    },
    featureIcon: {
      width: 'clamp(40px, 10vw, 50px)',
      height: 'clamp(40px, 10vw, 50px)',
      backgroundColor: '#ddd6fe',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
      fontSize: 'clamp(1.25rem, 3vw, 1.5rem)'
    },
    featureTitle: {
      fontSize: 'clamp(1rem, 3vw, 1.25rem)',
      fontWeight: 'bold',
      color: 'rgb(48, 0, 126)',
      marginBottom: 'clamp(0.4rem, 1vw, 0.5rem)'
    },
    featureDescription: {
      color: '#4b5563',
      lineHeight: '1.5',
      fontSize: 'clamp(0.875rem, 2vw, 1rem)'
    },
    
    // Property listings styles
    recentListingsSection: {
      padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)',
      backgroundColor: '#f9fafb'
    },
    propertiesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
      gap: 'clamp(1rem, 3vw, 2rem)',
      width: '100%',
      maxWidth: 'min(1200px, 90%)',
      margin: '0 auto'
    },
    propertyCard: {
      backgroundColor: '#ffffff',
      borderRadius: '0.5rem',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      cursor: 'pointer',
      transition: 'transform 0.3s, box-shadow 0.3s',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    },
    propertyImage: {
      width: '100%',
      height: 'clamp(150px, 30vw, 200px)',
      backgroundColor: '#e5e7eb',
      objectFit: 'cover'
    },
    propertyDetails: {
      padding: 'clamp(1rem, 3vw, 1.5rem)',
      display: 'flex',
      flexDirection: 'column',
      flex: '1'
    },
    propertyTitle: {
      fontSize: 'clamp(1rem, 3vw, 1.25rem)',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: 'clamp(0.4rem, 1vw, 0.5rem)'
    },
    propertyLocation: {
      color: '#6d28d9',
      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
      marginBottom: 'clamp(0.4rem, 1vw, 0.5rem)'
    },
    propertyPrice: {
      fontSize: 'clamp(0.95rem, 2.5vw, 1.125rem)',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: 'clamp(0.4rem, 1vw, 0.5rem)'
    },
    propertyFeatures: {
      display: 'flex',
      gap: 'clamp(0.5rem, 2vw, 1rem)',
      marginTop: 'auto',
      color: '#6b7280',
      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
      flexWrap: 'wrap'
    },
    
    // CTA section styles
    ctaSection: {
      padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)',
      backgroundColor: '#6d28d9',
      color: '#ffffff',
      textAlign: 'center'
    },
    ctaTitle: {
      fontSize: 'clamp(1.25rem, 4vw, 2rem)',
      fontWeight: 'bold',
      marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
      maxWidth: '90%',
      margin: '0 auto'
    },
    ctaDescription: {
      fontSize: 'clamp(0.875rem, 3vw, 1.125rem)',
      maxWidth: 'min(700px, 90%)',
      margin: '0 auto clamp(1.5rem, 4vw, 2rem)',
      lineHeight: '1.5'
    },
    ctaButton: {
      padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1.5rem, 4vw, 2rem)',
      backgroundColor: '#ffffff',
      color: '#6d28d9',
      border: 'none',
      borderRadius: '0.375rem',
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.3s, transform 0.2s'
    },
    
    // Footer styles
    footer: {
      marginTop: 'auto',
      backgroundColor: '#1f2937',
      padding: 'clamp(2rem, 5vw, 3rem) clamp(1rem, 3vw, 2rem)',
      color: '#ffffff'
    },
    footerContent: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      maxWidth: 'min(1200px, 90%)',
      margin: '0 auto',
      textAlign: 'center'
    },
    footerLinks: {
      display: 'flex',
      gap: 'clamp(1rem, 3vw, 2rem)',
      marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
      flexWrap: 'wrap',
      justifyContent: 'center'
    },
    footerLink: {
      color: '#e5e7eb',
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'color 0.3s',
      fontSize: 'clamp(0.875rem, 2vw, 1rem)'
    },
    footerCopyright: {
      color: '#9ca3af',
      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
    }
  };

  // Common section style for community and contact sections
  const commonSectionStyle = {
    padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)', 
    textAlign: 'center', 
    backgroundColor: '#f9fafb'
  };

  return (
    <div style={styles.container}>
      {/* Header with Navigation */}
      <header style={styles.header}>
        <div style={styles.logo}>ZIT AccommoHub</div>
        
        {/* Mobile menu toggle button */}
        <button 
          style={{
            display: window.innerWidth <= 768 ? 'block' : 'none',
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem',
          }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        
        <nav style={{
          ...styles.nav,
          display: window.innerWidth > 768 ? 'flex' : menuOpen ? 'flex' : 'none',
          flexDirection: window.innerWidth > 768 ? 'row' : 'column',
          alignItems: window.innerWidth > 768 ? 'center' : 'flex-start',
          width: window.innerWidth > 768 ? 'auto' : '100%',
          padding: window.innerWidth > 768 ? '0' : '1rem 0',
          gap: window.innerWidth > 768 ? 'clamp(0.5rem, 2vw, 2rem)' : '1rem'
        }}>
          {['home', 'services', 'community', 'contact'].map((item) => (
            <div 
              key={item}
              style={{
                ...styles.navItem,
                borderBottom: hoveredItem === item ? '2px solidrgb(42, 0, 110)' : '2px solid transparent',
                width: window.innerWidth > 768 ? 'auto' : '100%',
                padding: window.innerWidth > 768 ? '0.5rem 0' : '0.75rem 0'
              }}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => handleNavigation(item)}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </div>
          ))}
          <button 
            style={{
              ...styles.buttonOutline,
              backgroundColor: hoveredItem === 'signin' ? '#f3f4f6' : 'transparent',
              width: window.innerWidth > 768 ? 'auto' : '100%',
              marginTop: window.innerWidth > 768 ? '0' : '0.5rem'
            }}
            onMouseEnter={() => setHoveredItem('signin')}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => handleNavigation('signin')}
          >
            Sign in
          </button>
          <button 
            style={{
              ...styles.buttonFilled,
              backgroundColor: hoveredItem === 'register' ? '#5b21b6' : '#6d28d9',
              width: window.innerWidth > 768 ? 'auto' : '100%',
              marginTop: window.innerWidth > 768 ? '0' : '0.5rem'
            }}
            onMouseEnter={() => setHoveredItem('register')}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => handleNavigation('register')}
          >
            Register
          </button>
        </nav>
      </header>

      {/* Hero Section (Home) */}
      <section id="home" style={styles.hero}>
        <h1 style={styles.title}>Find Your Perfect Student Accommodation</h1>
        <p style={styles.subtitle}>
          Discover the best boarding houses and student accommodations near Copperbelt University.
          We connect students with safe, comfortable, and affordable housing options.
        </p>
        {/* Search Box */}
        <div style={styles.searchContainer}>
          <form style={styles.searchForm} onSubmit={(e) => e.preventDefault()}>
            <input 
              type="text" 
              placeholder="Search by location, price, or amenities..." 
              style={{
                ...styles.searchInput,
                borderRadius: window.innerWidth > 480 ? '0.375rem 0 0 0.375rem' : '0.375rem'
              }}
              aria-label="Search accommodations"
            />
            <button type="submit" style={{
              ...styles.searchButton,
              borderRadius: window.innerWidth > 480 ? '0 0.375rem 0.375rem 0' : '0.375rem',
              marginTop: window.innerWidth > 480 ? '0' : '0.5rem'
            }}>
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Features Section (Services) */}
      <section id="services" style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>Our Services</h2>
        <div style={styles.featuresGrid}>
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
            <div 
              key={index} 
              style={{
                ...styles.featureCard,
                transform: hoveredItem === `feature${index}` ? 'translateY(-5px)' : 'none',
                boxShadow: hoveredItem === `feature${index}` ? 
                  '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 
                  '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              onMouseEnter={() => setHoveredItem(`feature${index}`)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div style={styles.featureIcon}>{feature.icon}</div>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Community Section */}
      <section id="community" style={commonSectionStyle}>
        <h2 style={styles.sectionTitle}>Our Community</h2>
        <p style={styles.sectionContent}>
          Join a vibrant community of students and landlords. Engage, share experiences, and grow together.
          We regularly host meetups, workshops, and events to help you connect with fellow students and find
          the perfect roommates or accommodation partners.
        </p>
      </section>

      {/* Recent Listings Section */}
      <section style={styles.recentListingsSection}>
        <h2 style={styles.sectionTitle}>Featured Accommodations</h2>
        <div style={styles.propertiesGrid}>
          {[
            {
              id: 'property1',
              title: 'Modern Student Suite',
              location: 'Riverside, 5 min to CBU',
              price: 'K1,500 / month',
              features: ['Single Room', 'Wi-Fi', 'Shared Kitchen']
            },
            {
              id: 'property2',
              title: 'Cozy Shared House',
              location: 'Jambo Drive, 10 min to CBU',
              price: 'K1,200 / month',
              features: ['Shared Room', 'Water Included', 'Security']
            },
            {
              id: 'property3',
              title: 'Premium Student Apartment',
              location: 'University Avenue, 2 min to CBU',
              price: 'K2,000 / month',
              features: ['Private Studio', 'All Utilities', 'Study Room']
            }
          ].map((property) => (
            <div 
              key={property.id}
              style={{
                ...styles.propertyCard,
                transform: hoveredItem === property.id ? 'translateY(-5px)' : 'none',
                boxShadow: hoveredItem === property.id ? 
                  '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 
                  '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              onMouseEnter={() => setHoveredItem(property.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => navigate(`/property/${property.id}`)}
            >
              <div style={styles.propertyImage}>
                <img src="/api/placeholder/400/200" alt={property.title} style={styles.propertyImage} />
              </div>
              <div style={styles.propertyDetails}>
                <h3 style={styles.propertyTitle}>{property.title}</h3>
                <p style={styles.propertyLocation}>{property.location}</p>
                <p style={styles.propertyPrice}>{property.price}</p>
                <div style={styles.propertyFeatures}>
                  {property.features.map((feature, index) => (
                    <span key={index}>{index > 0 ? `• ${feature}` : feature}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Ready to Find Your Student Home?</h2>
        <p style={styles.ctaDescription}>
          Join hundreds of Copperbelt University students who have found their perfect accommodation through ZIT AccommoHub.
        </p>
        <button 
          style={{
            ...styles.ctaButton,
            backgroundColor: hoveredItem === 'ctaButton' ? '#f9fafb' : '#ffffff',
            transform: hoveredItem === 'ctaButton' ? 'scale(1.05)' : 'scale(1)'
          }}
          onMouseEnter={() => setHoveredItem('ctaButton')}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => handleNavigation('register')}
        >
          Get Started Today
        </button>
      </section>

      {/* Contact Section */}
      <section id="contact" style={commonSectionStyle}>
        <h2 style={styles.sectionTitle}>Contact Us</h2>
        <p style={styles.sectionContent}>
          Have questions? Reach out to us via email at <a href="mailto:brianchanda02@gmail.com" style={{color: '#6d28d9'}}>brianchanda02@gmail.com</a> or call us at <a href="tel:+260972526777" style={{color: '#6d28d9'}}>+260 972526777</a>.
        </p>
      </section>

      {/* Footer */}
<footer style={styles.footer}>
  <div style={styles.footerContent}>
    <div style={styles.footerLinks}>
      {['About Us', 'Services', 'Community', 'Contact'].map((item, index) => (
        <span 
          key={index}
          style={{
            ...styles.footerLink,
            color: hoveredItem === `footer${item.replace(' ', '')}` ? '#ffffff' : '#e5e7eb'
          }}
          onMouseEnter={() => setHoveredItem(`footer${item.replace(' ', '')}`)}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => handleNavigation(item.toLowerCase().replace(' ', ''))}
        >
          {item}
        </span>
      ))}
    </div>
    <p style={styles.footerCopyright}>
      © 2025 ZIT AccommoHub. All rights reserved.
    </p>
  </div>
</footer>
</div>
  );
};

export default HomePage;