import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loadCredentials } from "@/utils/credentialsStore";
import { CLOUD_API_BASE, MEDHA_TENANT_ID, hydrateMedhaCloudConfig } from "@/data/manifestService";
import branding from "@/config/branding.json";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || "/";

  const [studentPassword, setStudentPassword] = useState("");
  const [studentError, setStudentError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const logoClean = `${import.meta.env.BASE_URL}logo-clean.png`;
  const anuLogo = branding.logoPrimary.startsWith("/")
    ? `${import.meta.env.BASE_URL}${branding.logoPrimary.substring(1)}`
    : `${import.meta.env.BASE_URL}${branding.logoPrimary}`;

  useEffect(() => {
    // Warm up the DB-driven catalog, manifest, and fileIndex while the user is on the Login screen
    hydrateMedhaCloudConfig();

    const profileCompleted = !!localStorage.getItem("saral_student_profile");
    const questionnaireCompleted = localStorage.getItem("questionnaire_completed") === "true";
    if (!profileCompleted || !questionnaireCompleted) {
      localStorage.removeItem("app_authenticated");
      localStorage.removeItem("sv_login_verified");
      localStorage.removeItem("app_role");
      localStorage.removeItem("username");
      sessionStorage.removeItem("sv_medha_session_v4");
    }
  }, []);

  const completeLoginSession = (displayName: string, token?: string) => {
    sessionStorage.setItem("sv_medha_session_v4", "true");
    localStorage.setItem("app_authenticated", "true");
    localStorage.setItem("sv_login_verified", "true");
    localStorage.setItem("app_role", "student");
    localStorage.setItem("username", displayName);
    if (token) {
      localStorage.setItem("sv_medha_token", token);
    }

    localStorage.setItem(
      "saral_student_profile",
      JSON.stringify({
        firstName: displayName,
        lastName: "",
        bypassed: true,
      })
    );
    localStorage.setItem("questionnaire_completed", "true");

    const targetUrl =
      from === "/login" || from.endsWith("/login") ? "/" : from;
    navigate(targetUrl, { replace: true });
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError("");

    const trimmed = studentPassword.trim();
    if (!trimmed) {
      setStudentError("Please enter access code");
      return;
    }

    setLoading(true);

    // 1. Check local fast-path credentials / default codes
    const creds = loadCredentials();
    const defaultPass = (import.meta as any).env?.VITE_DEFAULT_PASSWORD || "Ekam@2026";
    const isDirectMatch =
      trimmed === defaultPass ||
      trimmed.toLowerCase() === "anu@2026" ||
      trimmed.toLowerCase() === "ekam@2026" ||
      trimmed.toLowerCase() === "medha@2026";

    const match = creds.find(
      (c) => c.role === "student" && (c.password === trimmed || isDirectMatch)
    );

    // 2. Authenticate against Cloud Run DB (`POST /v2/t/medha/login`)
    try {
      const res = await fetch(`${CLOUD_API_BASE}/v2/t/${MEDHA_TENANT_ID}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success || data?.ok || data?.token) {
          completeLoginSession(match?.username || "ANU Student", data.token);
          return;
        }
      }
    } catch {
      // Fall back to local verification if offline
    }

    if (match || isDirectMatch) {
      completeLoginSession(match?.username || "ANU Student");
    } else {
      setStudentError("Incorrect access code");
      setLoading(false);
    }
  };

  return (
    <div className="sv-login-page">
      <div className="sv-login-wrapper">
        {/* LEFT SIDE: Saral Vidhya Production Lockup Image */}
        <div className="sv-login-brand">
          <img
            src={logoClean}
            alt="Saral Vidhya - Learning Simplified"
            className="sv-brand-logo-img"
          />
        </div>

        {/* RIGHT SIDE: Pine Deep Card + Floating ANU Logo + Feature Pills */}
        <div className="sv-login-right">
          <div className="sv-login-card-shell">
            {/* ANU Logo Medallion upside the card */}
            <div className="sv-college-logo-badge" title={branding.appName}>
              <img
                src={anuLogo}
                alt={branding.appName}
                className="sv-college-logo-img sv-college-logo-img--anu"
              />
            </div>

            <div className="sv-login-card">
              <h1 className="sv-login-title">Welcome to Saral Vidhya</h1>

              <form onSubmit={handleStudentLogin} className="sv-login-form">
                <label className="sv-input-label" htmlFor="sv-access-code-input">
                  ACCESS CODE
                </label>
                <div className="sv-input-container">
                  <input
                    id="sv-access-code-input"
                    type={showPassword ? "text" : "password"}
                    placeholder=""
                    className="sv-password-input"
                    value={studentPassword}
                    onChange={(e) => {
                      setStudentPassword(e.target.value);
                      setStudentError("");
                    }}
                    autoFocus
                  />

                  <button
                    type="button"
                    className="sv-password-toggle-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide access code" : "Show access code"}
                    title={showPassword ? "Hide access code" : "Show access code"}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  className="sv-login-button"
                  disabled={loading}
                >
                  {loading ? "Entering..." : "Enter"}
                </button>

                {studentError && (
                  <p className="sv-login-error">{studentError}</p>
                )}
              </form>
            </div>
          </div>

          {/* Bottom Feature Pills: Learn, Prepare, Examine */}
          <div className="sv-login-pills" aria-hidden="true">
            <div className="sv-login-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CC0B4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span>Learn</span>
            </div>
            <div className="sv-login-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E7B864" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
              <span>Prepare</span>
            </div>
            <div className="sv-login-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B5BA9B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1.5" fill="#B5BA9B" />
              </svg>
              <span>Examine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
