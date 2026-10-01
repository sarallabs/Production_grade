import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCourseById, type Course } from '@/data/contentRepository';
import { buildChapterUrl } from '@/utils/courseNavigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

type PaymentMethod = 'credit' | 'debit' | 'upi';

/** Extract the first solid hex/rgb color from a gradient or return a fallback */
function extractColor(accent: string | undefined): string {
  if (!accent) return '#7c3aed';
  // If it's already a solid color (no 'gradient' keyword)
  if (!accent.includes('gradient')) return accent;
  // Pull the first hex color from the gradient string
  const hex = accent.match(/#[0-9a-fA-F]{3,6}/);
  if (hex) return hex[0];
  // Pull the first rgb/hsl value
  const rgb = accent.match(/(rgb|hsl)[^)]+\)/);
  if (rgb) return rgb[0];
  return '#7c3aed';
}

export default function CoursePayment() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit');

  // Credit Card form state
  const [creditCardNumber, setCreditCardNumber] = useState('');
  const [creditCardName, setCreditCardName] = useState('');
  const [creditExpiry, setCreditExpiry] = useState('');
  const [creditCvv, setCreditCvv] = useState('');

  // Debit Card form state
  const [debitCardNumber, setDebitCardNumber] = useState('');
  const [debitCardName, setDebitCardName] = useState('');
  const [debitExpiry, setDebitExpiry] = useState('');
  const [debitCvv, setDebitCvv] = useState('');

  // UPI form state
  const [upiId, setUpiId] = useState('');

  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);

  const isAuthenticated = localStorage.getItem('app_authenticated') === 'true';

  useEffect(() => {
    if (!isSuccess) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleStartLearning();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess]);

  useEffect(() => {
    if (!courseId) return;
    getCourseById(courseId)
      .then((data) => {
        setCourse(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [courseId]);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (paymentMethod === 'credit') {
      if (!creditCardNumber.trim() || !creditCardName.trim() || !creditExpiry.trim() || !creditCvv.trim()) {
        setError('Please fill in all Credit Card details.');
        return;
      }
      if (creditCardNumber.replace(/\s/g, '').length < 16) {
        setError('Please enter a valid 16-digit Credit Card number.');
        return;
      }
      if (creditCvv.length < 3) {
        setError('Please enter a valid 3-digit CVV.');
        return;
      }
    } else if (paymentMethod === 'debit') {
      if (!debitCardNumber.trim() || !debitCardName.trim() || !debitExpiry.trim() || !debitCvv.trim()) {
        setError('Please fill in all Debit Card details.');
        return;
      }
      if (debitCardNumber.replace(/\s/g, '').length < 16) {
        setError('Please enter a valid 16-digit Debit Card number.');
        return;
      }
      if (debitCvv.length < 3) {
        setError('Please enter a valid 3-digit CVV.');
        return;
      }
    } else {
      if (!upiId.trim() || !upiId.includes('@')) {
        setError('Please enter a valid UPI ID (e.g. name@upi).');
        return;
      }
    }

    // Mark as fully enrolled
    if (courseId) {
      localStorage.setItem(`registered_${courseId}`, 'true');
    }
    setIsSuccess(true);
  };

  const handleStartLearning = () => {
    if (!course) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/course/${course.id}` } });
    } else {
      const url = buildChapterUrl({
        id: course.id,
        name: course.name,
        boardId: course.boardId,
        boardName: course.boardName,
        boardShortName: course.boardShortName,
        classId: course.classId,
        className: course.className,
      });
      navigate(url);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 16);
    return v.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) return `${v.slice(0, 2)}/${v.slice(2)}`;
    return v;
  };

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="sv-catalog">
        <SiteHeader />
        <div className="sv-catalog-loading-state" style={{ minHeight: '60vh' }}>
          <div className="sv-catalog-spinner" />
          <p>Loading checkout…</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────
  if (!course) {
    return (
      <div className="sv-catalog">
        <SiteHeader />
        <div className="sv-catalog-empty-state" style={{ minHeight: '60vh' }}>
          <h3>Course Not Found</h3>
          <p>The course checkout is unavailable.</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const { name, boardShortName, className, meta } = course;
  const accentGradient = meta.accent || '#7c3aed';
  // Use a solid color for borders / tab indicators (gradients can't be used there)
  const accentColor = extractColor(meta.accent);

  const nodes = [
    {
      id: 1,
      label: 'Videos',
      description: 'Bite-sized concept video lectures',
      colorClass: 'green',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      ),
      x: 180,
      y: 25,
      textY: 81,
      lineY1: 25,
      lineY2: 77,
      labelPos: 'above',
      delay: '0.3s'
    },
    {
      id: 2,
      label: 'Flashcards',
      description: 'Revision cards for active recall',
      colorClass: 'green',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="14" height="14" rx="2" ry="2"></rect>
          <path d="M17 7h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-2"></path>
        </svg>
      ),
      x: 440,
      y: 25,
      textY: 81,
      lineY1: 25,
      lineY2: 77,
      labelPos: 'below',
      delay: '0.8s'
    },
    {
      id: 3,
      label: 'Quick Study',
      description: 'Concise summary for swift reference',
      colorClass: 'green',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
      ),
      x: 700,
      y: 25,
      textY: 81,
      lineY1: 25,
      lineY2: 77,
      labelPos: 'above',
      delay: '1.2s'
    },
    {
      id: 4,
      label: 'Detailed Notes',
      description: 'Exhaustive reading textbooks',
      colorClass: 'gold',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
      ),
      x: 560,
      y: 185,
      textY: 241,
      lineY1: 185,
      lineY2: 237,
      labelPos: 'below',
      delay: '1.7s'
    },
    {
      id: 5,
      label: 'Assignments',
      description: 'Practice tasks with feedback',
      colorClass: 'blue',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          <line x1="9" y1="12" x2="15" y2="12"></line>
          <line x1="9" y1="16" x2="15" y2="16"></line>
        </svg>
      ),
      x: 300,
      y: 185,
      textY: 241,
      lineY1: 185,
      lineY2: 237,
      labelPos: 'above',
      delay: '2.1s'
    },
    {
      id: 6,
      label: 'Mock Test',
      description: 'Simulated examination environments',
      colorClass: 'blue',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
      x: 380,
      y: 345,
      textY: 401,
      lineY1: 345,
      lineY2: 397,
      labelPos: 'below',
      delay: '2.6s'
    },
    {
      id: 7,
      label: 'Final Test',
      description: 'Earn your course certification',
      colorClass: 'purple',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
          <path d="M4 22h16"></path>
          <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path>
          <path d="M12 2a6 6 0 0 1 6 6c0 3-2.5 6-6 6S6 11 6 8a6 6 0 0 1 6-6z"></path>
        </svg>
      ),
      x: 640,
      y: 345,
      textY: 401,
      lineY1: 345,
      lineY2: 397,
      labelPos: 'above',
      delay: '2.9s'
    }
  ];

  return (
    <div className="sv-catalog">
      <SiteHeader />

      <div className="sv-catalog-register-wrap">
        <div className="sv-catalog-register-card" style={{ maxWidth: 900 }}>

          <div className="sv-catalog-register-banner">
            <h2>Start Your Journey</h2>
          </div>

          {!isSuccess ? (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '12px 20px' }}>
              {/* Left Column: Method Tabs */}
              <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="sv-catalog-payment-tabs" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: 'none', padding: 0 }}>
                  <button
                    type="button"
                    className={`sv-catalog-payment-tab-btn${paymentMethod === 'credit' ? ' active' : ''}`}
                    style={{
                      width: '100%',
                      border: paymentMethod === 'credit' ? `2px solid ${accentColor}` : '1.5px solid var(--svc-line)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      justifyContent: 'flex-start',
                      gap: '8px',
                      background: paymentMethod === 'credit' ? 'rgba(230, 220, 255, 0.4)' : '#ffffff',
                      color: paymentMethod === 'credit' ? accentColor : undefined
                    }}
                    onClick={() => setPaymentMethod('credit')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                      <line x1="6" y1="14" x2="9" y2="14" />
                    </svg>
                    Credit Card
                  </button>
                  <button
                    type="button"
                    className={`sv-catalog-payment-tab-btn${paymentMethod === 'debit' ? ' active' : ''}`}
                    style={{
                      width: '100%',
                      border: paymentMethod === 'debit' ? `2px solid ${accentColor}` : '1.5px solid var(--svc-line)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      justifyContent: 'flex-start',
                      gap: '8px',
                      background: paymentMethod === 'debit' ? 'rgba(230, 220, 255, 0.4)' : '#ffffff',
                      color: paymentMethod === 'debit' ? accentColor : undefined
                    }}
                    onClick={() => setPaymentMethod('debit')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                      <line x1="6" y1="14" x2="9" y2="14" />
                    </svg>
                    Debit Card
                  </button>
                  <button
                    type="button"
                    className={`sv-catalog-payment-tab-btn${paymentMethod === 'upi' ? ' active' : ''}`}
                    style={{
                      width: '100%',
                      border: paymentMethod === 'upi' ? `2px solid ${accentColor}` : '1.5px solid var(--svc-line)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      justifyContent: 'flex-start',
                      gap: '8px',
                      background: paymentMethod === 'upi' ? 'rgba(230, 220, 255, 0.4)' : '#ffffff',
                      color: paymentMethod === 'upi' ? accentColor : undefined
                    }}
                    onClick={() => setPaymentMethod('upi')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M12 2L6 8h4v8h4V8h4L12 2z" />
                      <path d="M4 20h16" strokeLinecap="round" />
                    </svg>
                    UPI
                  </button>
                </div>
              </div>

              {/* Right Column: Form inputs */}
              <div style={{ flex: '1.2 1 320px', display: 'flex', flexDirection: 'column' }}>
                {error && <div className="sv-catalog-register-error">{error}</div>}

                <form onSubmit={handlePay} className="sv-catalog-payment-form" style={{ padding: 0 }}>
                  {paymentMethod === 'credit' && (
                    <div className="sv-catalog-payment-method-fields">
                      <div className="sv-catalog-form-group">
                        <label htmlFor="pay-credit-number">Credit Card Number</label>
                        <input
                          id="pay-credit-number"
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          inputMode="numeric"
                          maxLength={19}
                          value={creditCardNumber}
                          onChange={(e) => setCreditCardNumber(formatCardNumber(e.target.value))}
                        />
                      </div>
                      <div className="sv-catalog-form-group">
                        <label htmlFor="pay-credit-name">Cardholder Name</label>
                        <input
                          id="pay-credit-name"
                          type="text"
                          placeholder="Name on card"
                          value={creditCardName}
                          onChange={(e) => setCreditCardName(e.target.value)}
                        />
                      </div>
                      <div className="sv-catalog-form-row">
                        <div className="sv-catalog-form-group">
                          <label htmlFor="pay-credit-expiry">Expiry (MM/YY)</label>
                          <input
                            id="pay-credit-expiry"
                            type="text"
                            placeholder="MM/YY"
                            inputMode="numeric"
                            maxLength={5}
                            value={creditExpiry}
                            onChange={(e) => setCreditExpiry(formatExpiry(e.target.value))}
                          />
                        </div>
                        <div className="sv-catalog-form-group">
                          <label htmlFor="pay-credit-cvv">CVV</label>
                          <input
                            id="pay-credit-cvv"
                            type="password"
                            placeholder="•••"
                            inputMode="numeric"
                            maxLength={3}
                            value={creditCvv}
                            onChange={(e) => setCreditCvv(e.target.value.replace(/\D/g, ''))}
                          />
                        </div>
                      </div>
                      <p className="sv-catalog-payment-note">
                        🔒 Secured by 256-bit SSL encryption. We accept Credit cards from Visa, Mastercard, Rupay &amp; AMEX.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'debit' && (
                    <div className="sv-catalog-payment-method-fields">
                      <div className="sv-catalog-form-group">
                        <label htmlFor="pay-debit-number">Debit Card Number</label>
                        <input
                          id="pay-debit-number"
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          inputMode="numeric"
                          maxLength={19}
                          value={debitCardNumber}
                          onChange={(e) => setDebitCardNumber(formatCardNumber(e.target.value))}
                        />
                      </div>
                      <div className="sv-catalog-form-group">
                        <label htmlFor="pay-debit-name">Cardholder Name</label>
                        <input
                          id="pay-debit-name"
                          type="text"
                          placeholder="Name on card"
                          value={debitCardName}
                          onChange={(e) => setDebitCardName(e.target.value)}
                        />
                      </div>
                      <div className="sv-catalog-form-row">
                        <div className="sv-catalog-form-group">
                          <label htmlFor="pay-debit-expiry">Expiry (MM/YY)</label>
                          <input
                            id="pay-debit-expiry"
                            type="text"
                            placeholder="MM/YY"
                            inputMode="numeric"
                            maxLength={5}
                            value={debitExpiry}
                            onChange={(e) => setDebitExpiry(formatExpiry(e.target.value))}
                          />
                        </div>
                        <div className="sv-catalog-form-group">
                          <label htmlFor="pay-debit-cvv">CVV</label>
                          <input
                            id="pay-debit-cvv"
                            type="password"
                            placeholder="•••"
                            inputMode="numeric"
                            maxLength={3}
                            value={debitCvv}
                            onChange={(e) => setDebitCvv(e.target.value.replace(/\D/g, ''))}
                          />
                        </div>
                      </div>
                      <p className="sv-catalog-payment-note">
                        🔒 Secured by 256-bit SSL encryption. We accept Debit cards from Visa, Mastercard &amp; Rupay.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'upi' && (
                    <div className="sv-catalog-payment-method-fields">
                      <div className="sv-catalog-form-group">
                        <label htmlFor="pay-upi-id">UPI ID (VPA)</label>
                        <input
                          id="pay-upi-id"
                          type="text"
                          placeholder="yourname@upi"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                      </div>
                      <div className="sv-catalog-payment-qr-teaser" style={{ marginTop: '8px', marginBottom: '10px', padding: '10px 16px', gap: '8px' }}>
                        <style>{`
                          @keyframes qr-scan {
                            0% { top: 0%; opacity: 0.8; }
                            50% { top: 100%; opacity: 0.8; }
                            100% { top: 0%; opacity: 0.8; }
                          }
                        `}</style>
                        <div
                          className="sv-catalog-payment-qr-box"
                          style={{
                            position: 'relative',
                            overflow: 'hidden',
                            border: `2px solid ${accentColor}`,
                            borderRadius: '12px',
                            padding: '8px',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <div style={{ position: 'absolute', top: 6, left: 6, width: 12, height: 12, borderTop: `3px solid ${accentColor}`, borderLeft: `3px solid ${accentColor}` }}></div>
                          <div style={{ position: 'absolute', top: 6, right: 6, width: 12, height: 12, borderTop: `3px solid ${accentColor}`, borderRight: `3px solid ${accentColor}` }}></div>
                          <div style={{ position: 'absolute', bottom: 6, left: 6, width: 12, height: 12, borderBottom: `3px solid ${accentColor}`, borderLeft: `3px solid ${accentColor}` }}></div>
                          <div style={{ position: 'absolute', bottom: 6, right: 6, width: 12, height: 12, borderBottom: `3px solid ${accentColor}`, borderRight: `3px solid ${accentColor}` }}></div>

                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              right: 0,
                              height: '3px',
                              background: '#22c55e',
                              boxShadow: '0 0 10px #22c55e, 0 0 5px #22c55e',
                              animation: 'qr-scan 2.5s infinite linear',
                              pointerEvents: 'none'
                            }}
                          ></div>

                          <svg width="80" height="80" viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg">
                            <rect width="110" height="110" fill="#ffffff" />
                            <rect x="10" y="10" width="28" height="28" fill="#0f172a" rx="2" />
                            <rect x="14" y="14" width="20" height="20" fill="#ffffff" rx="1" />
                            <rect x="18" y="18" width="12" height="12" fill="#0f172a" rx="1" />
                            <rect x="72" y="10" width="28" height="28" fill="#0f172a" rx="2" />
                            <rect x="76" y="14" width="20" height="20" fill="#ffffff" rx="1" />
                            <rect x="80" y="18" width="12" height="12" fill="#0f172a" rx="1" />
                            <rect x="10" y="72" width="28" height="28" fill="#0f172a" rx="2" />
                            <rect x="14" y="76" width="20" height="20" fill="#ffffff" rx="1" />
                            <rect x="18" y="80" width="12" height="12" fill="#0f172a" rx="1" />
                            <rect x="46" y="10" width="6" height="6" fill="#0f172a" rx="1" />
                            <rect x="54" y="10" width="6" height="6" fill="#0f172a" rx="1" />
                            <rect x="46" y="18" width="6" height="6" fill="#0f172a" rx="1" />
                            <rect x="10" y="46" width="6" height="6" fill="#0f172a" rx="1" />
                            <rect x="18" y="46" width="6" height="6" fill="#0f172a" rx="1" />
                            <rect x="46" y="46" width="20" height="6" fill="#0f172a" rx="1" />
                            <rect x="46" y="54" width="6" height="6" fill="#0f172a" rx="1" />
                            <rect x="54" y="62" width="6" height="6" fill="#0f172a" rx="1" />
                            <rect x="72" y="46" width="6" height="6" fill="#0f172a" rx="1" />
                            <rect x="80" y="46" width="14" height="6" fill="#0f172a" rx="1" />
                            <rect x="72" y="54" width="6" height="14" fill="#0f172a" rx="1" />
                            <rect x="80" y="62" width="14" height="6" fill="#0f172a" rx="1" />
                            <rect x="86" y="54" width="8" height="6" fill="#0f172a" rx="1" />
                          </svg>
                        </div>
                        <span style={{ fontWeight: '500', color: '#0f172a' }}>Scan QR Scanner View</span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Point your camera or UPI app to scan and pay instantly</span>
                      </div>
                      <p className="sv-catalog-payment-note" style={{ marginBottom: '10px' }}>
                        🔒 UPI payments are instant and protected by your bank's security layer.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="sv-catalog-register-submit-btn"
                    style={{ marginTop: 8 }}
                  >
                    Pay ₹5,898.82
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* ── Success State: Wait Window ──────────────── */
            <div
              className="sv-catalog-register-success-state"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '54px 24px',
                textAlign: 'center',
              }}
            >
              <style>{`
                @keyframes svSpinRing {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>

              {/* Animated Spinner with Checkmark inside */}
              <div
                style={{
                  position: 'relative',
                  width: '96px',
                  height: '96px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                }}
              >
                {/* Outer spinning ring */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '4px solid #e2e8f0',
                    borderTopColor: '#6366f1',
                    borderRightColor: '#a855f7',
                    animation: 'svSpinRing 1.2s linear infinite',
                  }}
                />
                {/* Center Checkmark Circle */}
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(34, 197, 94, 0.35)',
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>

              <h2
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '8px',
                  letterSpacing: '-0.02em',
                }}
              >
                Setting Up Your Learning Journey...
              </h2>

              <p
                style={{
                  fontSize: '1.05rem',
                  color: '#64748b',
                  maxWidth: '520px',
                  margin: '0 auto 20px auto',
                  lineHeight: 1.55,
                }}
              >
                Enrollment successful for <strong>{course?.name}</strong>.<br />
                Preparing your interactive AI study table...
              </p>

              {/* Progress Bar & Countdown Indicator */}
              <div style={{ width: '100%', maxWidth: '320px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: '#e2e8f0',
                    overflow: 'hidden',
                    marginBottom: '10px',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
                      width: `${((4 - countdown) / 4) * 100}%`,
                      transition: 'width 1s linear',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#6366f1' }}>
                  {countdown > 0 ? `Launching workspace in ${countdown}s...` : 'Opening learning workspace...'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
