import React, { useEffect, useState } from 'react';
import branding from '@/config/branding.json';
import { getCatalog, getVisibleBoardIds } from '@/data/contentRepository';

export default function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const [footerText, setFooterText] = useState('Acharya Nagarjuna University');
  const [appName, setAppName] = useState(branding.appName);

  useEffect(() => {
    const storedBrand = sessionStorage.getItem('sv_brand_name');
    if (storedBrand) setAppName(storedBrand);

    getCatalog().then((catalog) => {
      const visibleIds = getVisibleBoardIds();
      const visibleBoards = catalog.boards.filter(b => visibleIds.includes(b.id));
      if (visibleBoards.length === 1) {
        setFooterText(visibleBoards[0].name);
      } else if (visibleBoards.length > 1) {
        setFooterText(visibleBoards.map(b => b.shortName || b.name).join(', '));
      }
    });
  }, []);

  return (
    <footer className="sv-catalog-footer">
      <div className="sv-catalog-footer-container">
        <div className="sv-catalog-footer-brand">
          <span className="sv-catalog-footer-title">{appName}</span>
          <p className="sv-catalog-footer-desc">
            Empowering students with accessible, high-quality course modules and interactive learning resources.
          </p>
        </div>
        <div className="sv-catalog-footer-copyright">
          &copy; {currentYear} {appName}. All rights reserved. {footerText}.
        </div>
      </div>
    </footer>
  );
}
