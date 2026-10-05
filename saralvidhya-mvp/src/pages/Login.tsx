import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loadCredentials } from "@/utils/credentialsStore";
import logoClean from "../logo-clean.png";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || "/";

  const [studentPassword, setStudentPassword] = useState("");
  const [studentError, setStudentError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // If onboarding (profile + questionnaire) is incomplete, clear bypass flags 
    // on visiting the login page so refreshing the browser returns to the login screen.
    const profileCompleted = !!localStorage.getItem("saral_student_profile");
    const questionnaireCompleted = localStorage.getItem("questionnaire_completed") === "true";
    if (!profileCompleted || !questionnaireCompleted) {
      localStorage.removeItem("app_authenticated");
      localStorage.removeItem("app_role");
      localStorage.removeItem("username");
    }
  }, []);

  // LOGIN FUNCTION
  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError("");

    if (!studentPassword) {
      setStudentError("Please enter password");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const creds = loadCredentials();

      const match = creds.find(
        c => c.role === "student" && c.password === studentPassword
      );

      if (match) {
        localStorage.setItem("app_authenticated", "true");
        localStorage.setItem("app_role", match.role);
        localStorage.setItem("username", match.username);

        // Bypass onboarding flow for password logins
        localStorage.setItem(
          "saral_student_profile",
          JSON.stringify({
            firstName: match.username,
            lastName: "",
            bypassed: true,
          })
        );
        localStorage.setItem("questionnaire_completed", "true");

        navigate("/", { replace: true });
      } else {
        setStudentError("Incorrect password");
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="sv-login-page">
      <div className="sv-login-wrapper">
        {/* LEFT SIDE: Saral Vidhya Tree Brand Logo */}
        <div className="sv-login-brand">
          <img
            src={logoClean}
            alt="Saral Vidhya - Learning Simplified"
            className="sv-brand-logo-img"
          />
        </div>

        {/* RIGHT SIDE: Deep Sage Green Card */}
        <div className="sv-login-card">
          <h1 className="sv-login-title">Welcome</h1>

          <form onSubmit={handleStudentLogin} className="sv-login-form">
            <div className="sv-input-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
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
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  /* Open eye */
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  /* Eyelashes / closed eye icon (matching reference screenshot) */
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 10.5C5.5 14 8.5 15.5 12 15.5C15.5 15.5 18.5 14 21 10.5" />
                    <line x1="6" y1="13.5" x2="4.5" y2="16.5" />
                    <line x1="10" y1="15" x2="9.5" y2="18.5" />
                    <line x1="14" y1="15" x2="14.5" y2="18.5" />
                    <line x1="18" y1="13.5" x2="19.5" y2="16.5" />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              className="sv-login-button"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {studentError && (
              <p className="sv-login-error">
                {studentError}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;