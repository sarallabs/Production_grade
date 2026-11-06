import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import branding from '@/config/branding.json';

export default function SiteHeader() {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('app_authenticated') === 'true';
  const defaultLogo = branding.logoPrimary.startsWith('/') 
    ? `${import.meta.env.BASE_URL}${branding.logoPrimary.substring(1)}` 
    : `${import.meta.env.BASE_URL}${branding.logoPrimary}`;
  const [logoSrc, setLogoSrc] = useState(defaultLogo);
  const [appName, setAppName] = useState(branding.appName);

  useEffect(() => {
    const storedBrand = sessionStorage.getItem('sv_brand_name');
    if (storedBrand) setAppName(storedBrand);

    const storedLogo = sessionStorage.getItem('sv_logo');
    if (storedLogo) setLogoSrc(storedLogo);
  }, []);

  const handleCtaClick = () => {
    navigate('/login');
  };

  return (
    <header className="sv-catalog-header">
      <div className="sv-catalog-header-container">
        <Link to="/" className="sv-catalog-logo-link">
          <img
            src={logoSrc}
            alt={appName}
            className="sv-catalog-logo"
            onError={(e) => {
              // Fallback if base URL path issues arise
              e.currentTarget.src = '/brand-logo.png';
            }}
          />
          <span className="sv-catalog-app-name">{appName}</span>
        </Link>
        <nav className="sv-catalog-nav">
          {!isAuthenticated ? (
            <button className="sv-catalog-cta-btn" onClick={handleCtaClick}>
              Log In
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
