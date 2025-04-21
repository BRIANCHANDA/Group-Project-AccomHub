import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [activeColorScheme, setActiveColorScheme] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Color schemes that will rotate
  const colorSchemes = [
    { primary: '#30007e', secondary: '#6d28d9', accent: '#ddd6fe', background: '#efedff' },
    { primary: '#0e4429', secondary: '#10b981', accent: '#d1fae5', background: '#ecfdf5' },
    { primary: '#4c1d95', secondary: '#8b5cf6', accent: '#e0e7ff', background: '#ede9fe' },
    { primary: '#1e3a8a', secondary: '#3b82f6', accent: '#dbeafe', background: '#eff6ff' },
  ];
  
  // Get current color scheme
  const colors = colorSchemes[activeColorScheme];

  // Handle scroll events to change header appearance and trigger animations
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    // Color scheme rotation on interval
    const colorInterval = setInterval(() => {
      setActiveColorScheme((prev) => (prev + 1) % colorSchemes.length);
    }, 10000); // Change color scheme every 10 seconds
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(colorInterval);
    };
  }, []);
  
  // Navigation handlers with improved error handling
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
        section.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Fallback in case the section does not exist
        navigate(`/${path}`);
      }
    }
    // Close mobile menu after navigation
    setMenuOpen(false);
  };

  // Animation and style utilities
  const getHoverStyle = (itemName, baseStyle) => ({
    ...baseStyle,
    transition: 'all 0.3s ease',
    ...(itemName === 'navItem' 
      ? { 
          borderBottom: hoveredItem === itemName 
            ? `2px solid ${colors.primary}` 
            : '2px solid transparent',
          transform: hoveredItem === itemName ? 'translateY(-2px)' : 'none'
        }
      : {}),
    ...(itemName === 'buttonOutline' 
      ? { 
          backgroundColor: hoveredItem === itemName ? '#f3f4f6' : 'transparent',
          transform: hoveredItem === itemName ? 'scale(1.05)' : 'scale(1)'
        }
      : {}),
    ...(itemName === 'buttonFilled' 
      ? { 
          backgroundColor: hoveredItem === itemName ? colors.secondary : colors.primary,
          transform: hoveredItem === itemName ? 'scale(1.05)' : 'scale(1)'
        }
      : {}),
    ...(itemName === 'ctaButton' 
      ? { 
          backgroundColor: hoveredItem === itemName ? '#f9fafb' : '#ffffff',
          transform: hoveredItem === itemName ? 'scale(1.05)' : 'scale(1)',
          boxShadow: hoveredItem === itemName ? '0 10px 15px -3px rgba(0, 0, 0, 0.2)' : 'none'
        }
      : {}),
    ...(itemName?.startsWith('property') 
      ? { 
          transform: hoveredItem === itemName ? 'translateY(-8px)' : 'none',
          boxShadow: hoveredItem === itemName
            ? '0 15px 30px -5px rgba(0, 0, 0, 0.15), 0 10px 15px -5px rgba(0, 0, 0, 0.1)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }
      : {}),
    ...(itemName?.startsWith('feature') 
      ? { 
          transform: hoveredItem === itemName ? 'translateY(-8px) scale(1.03)' : 'none',
          boxShadow: hoveredItem === itemName
            ? '0 15px 30px -5px rgba(0, 0, 0, 0.15), 0 10px 15px -5px rgba(0, 0, 0, 0.1)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }
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
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      overflowX: 'hidden', // Prevent horizontal scrolling
      transition: 'background-color 1s ease'
    },
    
    // Header styles with dynamic scroll behavior
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 5%',
      backgroundColor: scrollPosition > 50 ? '#ffffff' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: scrollPosition > 50 ? 'none' : 'blur(8px)',
      borderBottom: scrollPosition > 50 ? `1px solid ${colors.accent}` : 'none',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      flexWrap: 'wrap',
      gap: '0.5rem',
      transition: 'all 0.3s ease',
      boxShadow: scrollPosition > 50 
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        : 'none'
    },
    logo: {
      fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
      fontWeight: 'bold',
      color: colors.primary,
      flex: '1',
      transition: 'color 0.5s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    logoIcon: {
      fontSize: '1.8rem',
      animation: 'pulse 2s infinite ease-in-out',
      display: 'inline-block',
      '@keyframes pulse': {
        '0%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.1)' },
        '100%': { transform: 'scale(1)' }
      }
    },
    mobileMenuButton: {
      display: 'none',
      backgroundColor: colors.primary,
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      padding: '0.5rem',
      '@media (max-width: 768px)': {
        display: 'block'
      },
      transition: 'transform 0.3s ease'
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
        gap: '1rem',
        animation: menuOpen ? 'slideDown 0.3s ease-in-out' : 'none',
        '@keyframes slideDown': {
          '0%': { opacity: 0, transform: 'translateY(-20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      }
    },
    navItem: {
      fontSize: 'clamp(0.875rem, 1vw, 1rem)',
      color: colors.primary,
      cursor: 'pointer',
      textDecoration: 'none',
      padding: '0.5rem 0',
      transition: 'all 0.3s ease',
      position: 'relative',
      '@media (max-width: 768px)': {
        width: '100%', 
        padding: '0.75rem 0'
      }
    },
    
    // Button styles with enhanced animations
    buttonOutline: {
      padding: 'clamp(0.4rem, 1vw, 0.5rem) clamp(0.75rem, 2vw, 1.25rem)',
      border: `1px solid ${colors.secondary}`,
      borderRadius: '0.375rem',
      backgroundColor: 'transparent',
      color: colors.primary,
      fontSize: 'clamp(0.875rem, 1vw, 1rem)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-block',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      '@media (max-width: 768px)': {
        width: '100%',
        marginTop: '0.5rem'
      }
    },
    buttonFilled: {
      padding: 'clamp(0.4rem, 1vw, 0.5rem) clamp(0.75rem, 2vw, 1.25rem)',
      border: 'none',
      borderRadius: '0.375rem',
      backgroundColor: colors.primary,
      color: '#ffffff',
      fontSize: 'clamp(0.875rem, 1vw, 1rem)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-block',
      textAlign: 'center',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      '@media (max-width: 768px)': {
        width: '100%',
        marginTop: '0.5rem'
      }
    },
    
    // Hero section styles with dynamic background
    hero: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)',
      textAlign: 'center',
      background: `linear-gradient(135deg, ${colors.background} 0%, #f9fafb 100%)`,
      position: 'relative',
      overflow: 'hidden',
      transition: 'background 0.5s ease'
    },
    heroBubble: {
      position: 'absolute',
      borderRadius: '50%',
      background: colors.accent,
      opacity: '0.4',
      filter: 'blur(40px)',
      zIndex: '0',
      animation: 'float 8s infinite ease-in-out'
    },
    title: {
      fontSize: 'clamp(1.5rem, 5vw, 3rem)',
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
      letterSpacing: '-0.025em',
      lineHeight: '1.2',
      maxWidth: '90%',
      position: 'relative',
      zIndex: '1',
      transition: 'color 0.5s ease',
      textShadow: '0 2px 10px rgba(255, 255, 255, 0.5)'
    },
    subtitle: {
      fontSize: 'clamp(0.875rem, 3vw, 1.25rem)',
      color: '#4b5563',
      marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
      maxWidth: 'min(800px, 90%)',
      lineHeight: '1.5',
      position: 'relative',
      zIndex: '1'
    },
    
    // Search box styles with focus animation
    searchContainer: {
      width: '100%',
      maxWidth: 'min(700px, 90%)',
      marginBottom: 'clamp(1.5rem, 5vw, 3rem)',
      position: 'relative',
      zIndex: '1',
      transition: 'transform 0.3s ease',
      transform: isSearchFocused ? 'scale(1.02)' : 'scale(1)'
    },
    searchForm: {
      display: 'flex',
      width: '100%',
      flexDirection: 'row',
      '@media (maxWidth: 480px)': {
        flexDirection: 'column'
      },
      boxShadow: isSearchFocused 
        ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      borderRadius: '0.375rem',
      transition: 'box-shadow 0.3s ease'
    },
    searchInput: {
      flex: '1',
      padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
      borderRadius: '0.375rem',
      border: `1px solid ${isSearchFocused ? colors.secondary : '#d1d5db'}`,
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      outline: 'none',
      transition: 'all 0.3s ease',
      '@media (minWidth: 481px)': {
        borderRadius: '0.375rem 0 0 0.375rem'
      }
    },
    searchButton: {
      padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
      backgroundColor: colors.primary,
      color: 'white',
      border: 'none',
      borderRadius: '0.375rem',
      cursor: 'pointer',
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      transition: 'all 0.3s ease',
      '@media (minWidth: 481px)': {
        borderRadius: '0 0.375rem 0.375rem 0'
      },
      '@media (maxWidth: 480px)': {
        marginTop: '0.5rem'
      }
    },
    
    // Section styles with animated backgrounds
    featuresSection: {
      padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      position: 'relative',
      overflow: 'hidden'
    },
    sectionTitle: {
      fontSize: 'clamp(1.25rem, 4vw, 2rem)',
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
      textAlign: 'center',
      maxWidth: '90%',
      transition: 'color 0.5s ease',
      position: 'relative'
    },
    sectionTitleUnderline: {
      content: '""',
      display: 'block',
      width: '80px',
      height: '4px',
      backgroundColor: colors.secondary,
      margin: '0.5rem auto 0',
      borderRadius: '2px',
      transition: 'background-color 0.5s ease'
    },
    sectionContent: {
      fontSize: 'clamp(0.875rem, 3vw, 1.2rem)',
      color: '#4b5563',
      maxWidth: 'min(800px, 90%)',
      margin: '0 auto clamp(1.5rem, 4vw, 2rem)',
      lineHeight: '1.5',
      position: 'relative'
    },
    
    // Features grid styles with dynamic animations
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))',
      gap: 'clamp(1rem, 3vw, 2rem)',
      width: '100%',
      maxWidth: 'min(1200px, 90%)',
      position: 'relative'
    },
    featureCard: {
      backgroundColor: colors.background,
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      padding: 'clamp(1rem, 3vw, 1.5rem)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      transition: 'all 0.5s ease',
      height: '100%',
      justifyContent: 'flex-start',
      position: 'relative',
      overflow: 'hidden'
    },
    featureIcon: {
      width: 'clamp(40px, 10vw, 50px)',
      height: 'clamp(40px, 10vw, 50px)',
      backgroundColor: colors.accent,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
      fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
      transition: 'all 0.5s ease',
      position: 'relative',
      zIndex: '2'
    },
    featureTitle: {
      fontSize: 'clamp(1rem, 3vw, 1.25rem)',
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 'clamp(0.4rem, 1vw, 0.5rem)',
      transition: 'color 0.5s ease',
      position: 'relative',
      zIndex: '2'
    },
    featureDescription: {
      color: '#4b5563',
      lineHeight: '1.5',
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      position: 'relative',
      zIndex: '2'
    },
    
    // Property listings styles with enhanced cards
    recentListingsSection: {
      padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)',
      background: `linear-gradient(135deg, #f9fafb 0%, ${colors.background} 100%)`,
      transition: 'background 0.5s ease',
      position: 'relative',
      overflow: 'hidden'
    },
    propertiesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
      gap: 'clamp(1rem, 3vw, 2rem)',
      width: '100%',
      maxWidth: 'min(1200px, 90%)',
      margin: '0 auto',
      position: 'relative'
    },
    propertyCard: {
      backgroundColor: '#ffffff',
      borderRadius: '0.5rem',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      cursor: 'pointer',
      transition: 'all 0.4s ease',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    },
    propertyImageWrapper: {
      position: 'relative',
      overflow: 'hidden',
      height: 'clamp(150px, 30vw, 200px)',
    },
    propertyImage: {
      width: '100%',
      height: 'clamp(150px, 30vw, 200px)',
      backgroundColor: '#e5e7eb',
      objectFit: 'cover',
      transition: 'transform 0.6s ease'
    },
    propertyImageOverlay: {
      position: 'absolute',
      inset: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      opacity: '0',
      transition: 'opacity 0.4s ease'
    },
    propertyDetails: {
      padding: 'clamp(1rem, 3vw, 1.5rem)',
      display: 'flex',
      flexDirection: 'column',
      flex: '1',
      position: 'relative',
      zIndex: '1'
    },
    propertyTitle: {
      fontSize: 'clamp(1rem, 3vw, 1.25rem)',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: 'clamp(0.4rem, 1vw, 0.5rem)',
      transition: 'color 0.3s ease'
    },
    propertyLocation: {
      color: colors.secondary,
      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
      marginBottom: 'clamp(0.4rem, 1vw, 0.5rem)',
      transition: 'color 0.5s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    },
    propertyPrice: {
      fontSize: 'clamp(0.95rem, 2.5vw, 1.125rem)',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: 'clamp(0.4rem, 1vw, 0.5rem)',
      transition: 'color 0.3s ease'
    },
    propertyFeatures: {
      display: 'flex',
      gap: 'clamp(0.5rem, 2vw, 1rem)',
      marginTop: 'auto',
      color: '#6b7280',
      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
      flexWrap: 'wrap'
    },
    propertyTag: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      backgroundColor: colors.primary,
      color: 'white',
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      zIndex: '2',
      transition: 'background-color 0.5s ease'
    },
    
    // CTA section styles with dynamic background
    ctaSection: {
      padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)',
      backgroundColor: colors.primary,
      color: '#ffffff',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      transition: 'background-color 0.5s ease'
    },
    ctaBackground: {
      position: 'absolute',
      inset: '0',
      background: `radial-gradient(circle at 20% 30%, ${colors.secondary}22 0%, transparent 50%), 
                  radial-gradient(circle at 80% 60%, ${colors.secondary}22 0%, transparent 50%)`,
      opacity: '0.6',
      transition: 'background 0.5s ease'
    },
    ctaTitle: {
      fontSize: 'clamp(1.25rem, 4vw, 2rem)',
      fontWeight: 'bold',
      marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
      maxWidth: '90%',
      margin: '0 auto',
      position: 'relative',
      zIndex: '1'
    },
    ctaDescription: {
      fontSize: 'clamp(0.875rem, 3vw, 1.125rem)',
      maxWidth: 'min(700px, 90%)',
      margin: '0 auto clamp(1.5rem, 4vw, 2rem)',
      lineHeight: '1.5',
      position: 'relative',
      zIndex: '1'
    },
    ctaButton: {
      padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1.5rem, 4vw, 2rem)',
      backgroundColor: '#ffffff',
      color: colors.secondary,
      border: 'none',
      borderRadius: '0.375rem',
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      position: 'relative',
      zIndex: '1',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    },
    
    // Footer styles
    footer: {
      marginTop: 'auto',
      backgroundColor: '#1f2937',
      padding: 'clamp(2rem, 5vw, 3rem) clamp(1rem, 3vw, 2rem)',
      color: '#ffffff',
      position: 'relative'
    },
    footerContent: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      maxWidth: 'min(1200px, 90%)',
      margin: '0 auto',
      textAlign: 'center',
      position: 'relative',
      zIndex: '1'
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
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      position: 'relative',
      '&:after': {
        content: '""',
        position: 'absolute',
        width: '0',
        height: '2px',
        bottom: '-4px',
        left: '0',
        backgroundColor: colors.secondary,
        transition: 'width 0.3s ease'
      }
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
    backgroundColor: '#f9fafb',
    position: 'relative',
    overflow: 'hidden'
  };

  // Animation effect for staggered entrance
  const getAnimationDelay = (index) => ({
    animation: 'fadeInUp 0.6s ease forwards',
    animationDelay: `${0.1 + (index * 0.1)}s`,
    opacity: '0',
    '@keyframes fadeInUp': {
      '0%': { opacity: 0, transform: 'translateY(20px)' },
      '100%': { opacity: 1, transform: 'translateY(0)' }
    }
  });

  return (
    <div style={styles.container}>
      {/* Header with Navigation */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🏠</span>
          ZIT AccommoHub
        </div>
        
        {/* Mobile menu toggle button */}
        <button 
          style={{
            display: window.innerWidth <= 768 ? 'block' : 'none',
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem',
            transform: menuOpen ? 'rotate(90deg)' : 'rotate(0)',
            transition: 'transform 0.3s ease'
          }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
        
        {/* Navigation Menu */}
        
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