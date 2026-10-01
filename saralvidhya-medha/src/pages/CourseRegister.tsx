import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { getCourseById, type Course } from '@/data/contentRepository';
import { buildChapterUrl } from '@/utils/courseNavigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { loadCredentials, addCredential } from '@/utils/credentialsStore';

/** Keep digits only, dropping a pasted +91 country code or a leading 0. */
function normalisePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export default function CourseRegister() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [agreedToTnc, setAgreedToTnc] = useState(false);
  
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  const isAuthenticated = localStorage.getItem('app_authenticated') === 'true';

  useEffect(() => {
    if (!courseId) return;

    // Check if registration details already exist
    const detailsSaved = localStorage.getItem(`registered_details_${courseId}`) === 'true';
    if (detailsSaved) {
      setIsRegistered(true);
    }

    // Pre-fill form from student profile if logged in
    const profileRaw = localStorage.getItem('saral_student_profile');
    if (profileRaw) {
      try {
        const profile = JSON.parse(profileRaw);
        if (profile.firstName) {
          setFullName(profile.firstName + (profile.lastName ? ' ' + profile.lastName : ''));
        }
        if (profile.email) {
          setEmail(profile.email);
        }
        if (profile.phone) {
          setPhone(profile.phone);
        }
        if (profile.university) {
          setUniversity(profile.university);
        }
      } catch (e) {
        const username = localStorage.getItem('username');
        if (username) setFullName(username);
      }
    } else {
      const username = localStorage.getItem('username');
      if (username) setFullName(username);
    }

    getCourseById(courseId).then((data) => {
      setCourse(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [courseId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || !phone.trim() || !university.trim()) {
      setError('Please fill in all the required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    // Indian mobile numbers are 10 digits and never start below 6.
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!agreedToTnc) {
      setError('You must agree to the Terms and Conditions.');
      return;
    }

    // Save registration details mock state
    if (courseId) {
      localStorage.setItem(`registered_details_${courseId}`, 'true');
    }

    // Seed student login account automatically in credentials store to prevent login prompt redirect
    try {
      const creds = loadCredentials();
      const existing = creds.find(c => c.username.toLowerCase() === fullName.trim().toLowerCase());
      if (!existing) {
        addCredential(fullName.trim(), "Ekam@2026", "student");
      }
    } catch (err) {
      console.error(err);
    }

    // Auto-authenticate & set profile details to prevent manual onboarding prompt
    localStorage.setItem("app_authenticated", "true");
    localStorage.setItem("app_role", "student");
    localStorage.setItem("username", fullName.trim());
    localStorage.setItem("saral_student_profile", JSON.stringify({
      firstName: fullName.trim(),
      lastName: "",
      email: email.trim(),
      phone: phone.trim(),
      university: university.trim(),
      bypassed: true
    }));
    localStorage.setItem("questionnaire_completed", "true");

    setIsRegistered(true);
  };

  const handleStartLearning = () => {
    if (!course) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/course/${course.id}` } });
    } else {
      const searchParams = new URLSearchParams(location.search);
      const targetChapter = searchParams.get('chapter') ? parseInt(searchParams.get('chapter') as string, 10) : undefined;
      const url = buildChapterUrl({
        id: course.id,
        name: course.name,
        boardId: course.boardId,
        boardName: course.boardName,
        boardShortName: course.boardShortName,
        classId: course.classId,
        className: course.className,
      }, targetChapter);
      navigate(url);
    }
  };

  if (loading) {
    return (
      <div className="sv-catalog">
        <SiteHeader />
        <div className="sv-catalog-loading-state" style={{ minHeight: '60vh' }}>
          <div className="sv-catalog-spinner"></div>
          <p>Loading registration...</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="sv-catalog">
        <SiteHeader />
        <div className="sv-catalog-empty-state" style={{ minHeight: '60vh' }}>
          <h3>Course Not Found</h3>
          <p>The course you want to register for does not exist.</p>
          <Link to="/" className="sv-catalog-primary-btn" style={{ textDecoration: 'none' }}>
            Back to Catalog
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const { name, boardShortName, className, meta } = course;

  return (
    <div className="sv-catalog">
      <SiteHeader />

      <div className="sv-catalog-register-wrap">
        <div className="sv-catalog-register-card">
          <div className="sv-catalog-register-banner">
            <h2>Course Registration</h2>
          </div>

          {!isRegistered ? (
            <form onSubmit={handleSubmit} className="sv-catalog-register-form">
              <h3>Fill in your Details</h3>
              <p className="sv-catalog-register-instructions">
                Provide your academic information below to register and gain free access to the course resources.
                Fields marked <span className="sv-catalog-required" aria-hidden="true">*</span> are required.
              </p>

              {error && <div className="sv-catalog-register-error">{error}</div>}

              <div className="sv-catalog-form-group">
                <label htmlFor="reg-name">
                  Full Name <span className="sv-catalog-required" aria-hidden="true">*</span>
                </label>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="sv-catalog-form-group">
                <label htmlFor="reg-email">
                  Email Address <span className="sv-catalog-required" aria-hidden="true">*</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="sv-catalog-form-group">
                <label htmlFor="reg-phone">
                  Phone Number <span className="sv-catalog-required" aria-hidden="true">*</span>
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(normalisePhone(e.target.value))}
                  required
                />
              </div>

              <div className="sv-catalog-form-group">
                <label htmlFor="reg-uni">
                  College / University <span className="sv-catalog-required" aria-hidden="true">*</span>
                </label>
                <input
                  id="reg-uni"
                  type="text"
                  placeholder="Enter your university or college name"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  required
                />
              </div>

              <div className="sv-catalog-form-group sv-catalog-form-group--checkbox">
                <label className="sv-catalog-checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreedToTnc}
                    onChange={(e) => setAgreedToTnc(e.target.checked)}
                  />
                  <span>
                    I agree to the <a href="#tnc" onClick={(e) => { e.preventDefault(); alert("Mock Terms & Conditions Agreement:\nBy checking this box, you agree to participate in the mock course curriculum."); }}>Terms and Conditions</a>.
                  </span>
                </label>
              </div>

              <button type="submit" className="sv-catalog-register-submit-btn">
                Complete Registration
              </button>

              <div className="sv-catalog-register-cancel">
                <Link to={`/course/${courseId}`}>Cancel and Go Back</Link>
              </div>
            </form>
          ) : (
            <div className="sv-catalog-register-success-state">
              <div className="sv-catalog-success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.25">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3>Registration Details Saved!</h3>
              <p>
                Your registration details have been saved successfully. Please proceed to payment to activate your enrollment in <strong>{name}</strong>.
              </p>
              
              <button
                onClick={() => navigate(`/course/${course.id}/payment`)}
                className="sv-catalog-success-cta-btn"
              >
                Proceed to Payment
              </button>

              <button
                type="button"
                onClick={() => setIsRegistered(false)}
                className="sv-catalog-success-cta-btn sv-catalog-success-cta-btn--secondary"
              >
                Edit Registration Details
              </button>

              <div className="sv-catalog-register-cancel">
                <Link to={`/course/${course.id}`}>Cancel</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
