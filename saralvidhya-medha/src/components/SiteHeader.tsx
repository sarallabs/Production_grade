import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import branding from '@/config/branding.json';

export interface SiteHeaderProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  suggestions?: { text: string; category: string }[];
  onSelectSuggestion?: (text: string) => void;
  subtitleBadge?: string;
  backToCourses?: boolean;
}

export default function SiteHeader({
  searchQuery,
  onSearchChange,
  suggestions = [],
  onSelectSuggestion,
  subtitleBadge,
  backToCourses,
}: SiteHeaderProps = {}) {
  const navigate = useNavigate();
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isAuthenticated =
    sessionStorage.getItem('sv_medha_session_v4') === 'true' &&
    localStorage.getItem('app_authenticated') === 'true';
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

  const handleLogoutClick = () => {
    sessionStorage.removeItem('sv_medha_session_v4');
    localStorage.removeItem('app_authenticated');
    localStorage.removeItem('sv_login_verified');
    localStorage.removeItem('app_role');
    localStorage.removeItem('username');
    navigate('/login', { replace: true });
  };

  return (
    <header className="sv-catalog-header">
      <div className="sv-catalog-header-container">
        <div className="sv-catalog-header-left">
          <Link to="/" className="sv-catalog-logo-link">
            <span className="sv-catalog-logo-medallion">
              <img
                src={logoSrc}
                alt={appName}
                className="sv-catalog-logo"
                onError={(e) => {
                  e.currentTarget.src = '/brand-logo.png';
                }}
              />
            </span>
            <span className="sv-catalog-app-name">{appName}</span>
          </Link>

          {subtitleBadge && (
            <span className="sv-catalog-header-badge">{subtitleBadge}</span>
          )}

          {backToCourses && (
            <Link to="/" className="sv-catalog-header-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              All Courses
            </Link>
          )}
        </div>

        {onSearchChange && (
          <div className="sv-header-search-wrap">
            <svg className="sv-header-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search courses, disciplines, tags, or faculty..."
              value={searchQuery ?? ''}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
              className="sv-header-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="sv-header-search-clear"
                aria-label="Clear search"
                onClick={() => {
                  onSearchChange('');
                  setShowSuggestions(false);
                }}
              >
                &times;
              </button>
            )}

            {showSuggestions && suggestions.length > 0 && (
              <div className="sv-catalog-search-dropdown">
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="sv-catalog-search-suggestion-item"
                    onMouseDown={() => {
                      if (onSelectSuggestion) {
                        onSelectSuggestion(item.text);
                      } else {
                        onSearchChange(item.text);
                      }
                      setShowSuggestions(false);
                    }}
                  >
                    <span className="sv-suggestion-text">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <circle cx="11" cy="11" r="8" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3" />
                      </svg>
                      {item.text}
                    </span>
                    <span className="sv-catalog-suggestion-badge">{item.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <nav className="sv-catalog-nav">
          {!isAuthenticated ? (
            <button className="sv-catalog-cta-btn" onClick={handleCtaClick}>
              Log In
            </button>
          ) : (
            <button
              className="sv-header-logout-btn"
              onClick={handleLogoutClick}
              title="Log Out"
              aria-label="Log Out"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
