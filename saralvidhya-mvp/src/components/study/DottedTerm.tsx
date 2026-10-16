import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DottedTermProps {
  term?: string;
  definition: string;
  isPurpleTheme?: boolean;
  children: React.ReactNode;
}

export default function DottedTerm({
  definition,
  isPurpleTheme = true,
  children,
}: DottedTermProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number; isAbove: boolean }>({
    x: 0,
    y: 0,
    isAbove: true,
  });

  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const accentDotted = isPurpleTheme ? '#7c3aed' : '#16a34a';
  const popoverBorder = isPurpleTheme ? '#c084fc' : '#86efac';

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    // Clamp horizontally to stay within viewport
    const clampedX = Math.max(160, Math.min(window.innerWidth - 160, centerX));
    // Determine whether to show above or below
    const isAbove = rect.top > 150;
    const y = isAbove ? rect.top - 8 : rect.bottom + 8;

    setCoords({ x: clampedX, y, isAbove });
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  return (
    <>
      <span
        ref={triggerRef}
        onClick={handleToggle}
        className="sv-dotted-term"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleToggle(e as any);
          }
        }}
        title="Tap for definition"
        style={{
          borderBottom: `2.2px dotted ${accentDotted}`,
          cursor: 'pointer',
          display: 'inline',
          paddingBottom: '1px',
          transition: 'all 0.15s ease',
          borderRadius: '2px',
        }}
      >
        {children}
      </span>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            className="sv-definition-popover"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: `${coords.x}px`,
              top: `${coords.y}px`,
              transform: coords.isAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
              zIndex: 999999,
              width: 'max-content',
              maxWidth: '310px',
              minWidth: '180px',
              background: '#ffffff',
              border: `1.5px solid ${popoverBorder}`,
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.14), 0 6px 12px -2px rgba(0, 0, 0, 0.08)',
              color: '#1e293b',
              fontSize: '13px',
              lineHeight: '1.55',
              fontWeight: 500,
              textAlign: 'left',
              animation: coords.isAbove
                ? 'sv-pop-in-up 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                : 'sv-pop-in-down 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'default',
              pointerEvents: 'auto',
            }}
          >
            <style>{`
              @keyframes sv-pop-in-up {
                from { opacity: 0; transform: translate(-50%, -92%) scale(0.95); }
                to { opacity: 1; transform: translate(-50%, -100%) scale(1); }
              }
              @keyframes sv-pop-in-down {
                from { opacity: 0; transform: translate(-50%, 8%) scale(0.95); }
                to { opacity: 1; transform: translate(-50%, 0) scale(1); }
              }
            `}</style>

            {/* Little indicator arrow pointer */}
            <div
              style={{
                position: 'absolute',
                [coords.isAbove ? 'bottom' : 'top']: '-6px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '10px',
                height: '10px',
                background: '#ffffff',
                borderRight: coords.isAbove ? `1.5px solid ${popoverBorder}` : 'none',
                borderBottom: coords.isAbove ? `1.5px solid ${popoverBorder}` : 'none',
                borderLeft: !coords.isAbove ? `1.5px solid ${popoverBorder}` : 'none',
                borderTop: !coords.isAbove ? `1.5px solid ${popoverBorder}` : 'none',
              }}
            />

            {/* Pure explanation only - NO side heading */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {definition}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
