import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loadCredentials } from "@/utils/credentialsStore";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/services/firebase";
import logo from "../logo.png";

function Login() {

  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: string })?.from || "/";

  const [studentPassword, setStudentPassword] = useState("");
  const [studentError, setStudentError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // If onboarding (profile + questionnaire) is incomplete, clear bypass flags 
    // on visiting the login page so refreshing the browser returns to the login screen.
    const profileCompleted = !!localStorage.getItem('saral_student_profile');
    const questionnaireCompleted = localStorage.getItem('questionnaire_completed') === 'true';
    if (!profileCompleted || !questionnaireCompleted) {
      localStorage.removeItem('app_authenticated');
      localStorage.removeItem('app_role');
      localStorage.removeItem('username');
    }
  }, []);

  // LOGIN FUNCTION
  const handleStudentLogin = (
    e: React.FormEvent
  ) => {

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
        c =>
          c.role === "student" &&
          c.password === studentPassword
      );

      if (match) {

        localStorage.setItem("app_authenticated", "true");
        localStorage.setItem("app_role", match.role);
        localStorage.setItem("username", match.username);

        // Bypass onboarding flow for password logins
        localStorage.setItem("saral_student_profile", JSON.stringify({
          firstName: match.username,
          lastName: "",
          bypassed: true
        }));
        localStorage.setItem("questionnaire_completed", "true");

        navigate(from, { replace: true });

      } else {

        setStudentError(
          "Incorrect password"
        );

        setLoading(false);
      }

    }, 400);
  };

  const handleGoToProfile = () => {
    navigate("/profile?mode=setup", { replace: true });
  };

  return (

    <div className="login-container">

      <div className="login-card">

        {/* LEFT SIDE */}
        <div className="left-section">

          <img
            src={logo}
            alt="logo"
            className="logo"
          />

        </div>

        {/* RIGHT SIDE */}
        <div className="right-section">

          {/* Profile Button Top Right */}
          <button
            type="button"
            style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.3s ease",
              color: "#6B21A8"
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            disabled={loading}
            onClick={handleGoToProfile}
            aria-label="View Student Profile"
            title="View Student Profile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
               <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>

          <form
            onSubmit={handleStudentLogin}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "28px"
            }}
          >

            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="password-input"
                value={studentPassword}
                onChange={(e) => {
                  setStudentPassword(
                    e.target.value
                  );
                  setStudentError("");
                }}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? "Loading..." : "Login"}
            </button>

          </form>

          {/* ERROR MESSAGE */}
          {studentError && (
            <p
              style={{
                color: "white",
                fontSize: "14px",
                marginTop: "-10px",
                fontWeight: 500
              }}
            >
              {studentError}
            </p>
          )}

        </div>

      </div>

    </div>
  );
}

export default Login;