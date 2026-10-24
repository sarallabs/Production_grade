import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loadCredentials } from "@/utils/credentialsStore";
import { useTenant, API_BASE } from "@/tenant/TenantProvider";
import { cloudStorage, setCloudAuthContext } from "@/context/CloudStateContext";
import universityConfig from "@/config/university_config.json";
const logoClean = `${import.meta.env.BASE_URL}logo-clean.png`;
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId, tenant, login: tenantLogin } = useTenant();

  const from = (location.state as { from?: string })?.from || "/";

  const [studentPassword, setStudentPassword] = useState("");
  const [studentError, setStudentError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resolvedCollege = (() => {
    const boardLogos = ((universityConfig as any).boardLogos || {}) as Record<string, string>;
    const defaultLogoFile = ((universityConfig as any).defaultBoardLogo || "logo-angrau.png") as string;
    const searchParams = new URLSearchParams(location.search);
    const queryTenant = (searchParams.get("tenant") || searchParams.get("boardId") || "").toLowerCase();
    const pathLower = location.pathname.toLowerCase();
    const visibleBoards = (
      cloudStorage.getItem("sv_visible_boards") ||
      import.meta.env.VITE_VISIBLE_BOARDS ||
      ""
    ).toLowerCase();
    const activeId = (tenantId || queryTenant || "").toLowerCase();

    for (const [boardKey, logoFile] of Object.entries(boardLogos)) {
      const keyLower = boardKey.toLowerCase();
      if (
        activeId === keyLower ||
        (visibleBoards.includes(keyLower) && !visibleBoards.includes(",")) ||
        (!activeId && studentPassword.trim().toLowerCase().startsWith(keyLower.slice(0, 3)))
      ) {
        return {
          id: keyLower,
          src: `${import.meta.env.BASE_URL}${logoFile}`,
          alt: tenant?.name || tenant?.shortName || keyLower.toUpperCase(),
        };
      }
    }

    const customLogo = tenant?.logoUrl || tenant?.branding?.logoUrl;
    if (customLogo) {
      return {
        id: activeId || "college",
        src: customLogo,
        alt: tenant?.name || tenant?.shortName || "College Logo",
      };
    }

    return {
      id: "default",
      src: `${import.meta.env.BASE_URL}${defaultLogoFile}`,
      alt: tenant?.name || tenant?.shortName || "College Logo",
    };
  })();
  useEffect(() => {
    // If onboarding (profile + questionnaire) is incomplete, clear bypass flags 
    // on visiting the login page so refreshing the browser returns to the login screen.
    const profileCompleted = !!cloudStorage.getItem("saral_student_profile");
    const questionnaireCompleted = cloudStorage.getItem("questionnaire_completed") === "true";
    if (!profileCompleted || !questionnaireCompleted) {
      cloudStorage.removeItem("app_authenticated");
      cloudStorage.removeItem("app_role");
      cloudStorage.removeItem("username");
    }
  }, []);

  // LOGIN FUNCTION
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError("");

    if (!studentPassword) {
      setStudentError("Please enter access code");
      return;
    }

    setLoading(true);

    // If a tenant is active, authenticate against v2 registry backend
    if (tenantId) {
      try {
        const ok = await tenantLogin(studentPassword);
        if (ok) {
          cloudStorage.removeItem("sv_video_open_counts");
          cloudStorage.setItem("app_authenticated", "true");
          cloudStorage.setItem("app_role", "student");
          const displayName = tenant?.shortName ? `${tenant.shortName} Student` : "Student";
          cloudStorage.setItem("username", displayName);
          cloudStorage.setItem(
            "saral_student_profile",
            JSON.stringify({
              firstName: displayName,
              lastName: "",
              bypassed: true,
            })
          );
          cloudStorage.setItem("questionnaire_completed", "true");

          const targetUrl =
            from === "/login" || from.endsWith("/login")
              ? "/"
              : from;
          navigate(targetUrl, {
            replace: true,
          });
          return;
        } else {
          setStudentError("Incorrect password");
          setLoading(false);
          return;
        }
      } catch (err: any) {
        setStudentError(err.message || "Incorrect password");
        setLoading(false);
        return;
      }
    }

    // If on central/root portal without a pre-selected tenantId, try matching against configured board tenants
    const candidateTenants = Array.from(
      new Set(
        (((universityConfig as any).defaultVisibleBoards || []) as string[]).map((b) =>
          b.toLowerCase().replace(/_university$/, "")
        )
      )
    );

    for (const candidate of candidateTenants) {
      try {
        const resp = await fetch(`${API_BASE}/v2/t/${candidate}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: studentPassword }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.token) {
            cloudStorage.removeItem("sv_video_open_counts");
            setCloudAuthContext(candidate, data.token);
            cloudStorage.setItem("app_authenticated", "true");
            cloudStorage.setItem("app_role", "student");
            const displayName = data.tenant?.shortName
              ? `${data.tenant.shortName} Student`
              : `${candidate.toUpperCase()} Student`;
            cloudStorage.setItem("username", displayName);
            cloudStorage.setItem(
              "saral_student_profile",
              JSON.stringify({
                firstName: displayName,
                lastName: "",
                bypassed: true,
              })
            );
            cloudStorage.setItem("questionnaire_completed", "true");
            navigate("/", { replace: true });
            return;
          }
        }
      } catch {
        // try next candidate tenant
      }
    }

    // Fallback: Legacy credentials check (only for central/root portal)
    setTimeout(() => {
      const creds = loadCredentials();

      const defaultPass = import.meta.env.VITE_DEFAULT_PASSWORD || '';
      const isDefaultMatch = Boolean(defaultPass && studentPassword === defaultPass);

      const match = creds.find(
        c => c.role === "student" && (c.password === studentPassword || isDefaultMatch)
      );

      if (match) {
        cloudStorage.removeItem("sv_video_open_counts");
        cloudStorage.setItem("app_authenticated", "true");
        cloudStorage.setItem("app_role", match.role);
        cloudStorage.setItem("username", match.username);

        // Bypass onboarding flow for password logins
        cloudStorage.setItem(
          "saral_student_profile",
          JSON.stringify({
            firstName: match.username,
            lastName: "",
            bypassed: true,
          })
        );
        cloudStorage.setItem("questionnaire_completed", "true");

        navigate("/", { replace: true });
      } else {
        setStudentError("Incorrect access code");
        setLoading(false);
      }
    }, 400);
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

        {/* RIGHT SIDE: Pine Deep Card + Floating College Logo + Feature Pills */}
        <div className="sv-login-right">
          <div className="sv-login-card-shell">
            {/* College Logo Medallion upside the card */}
            <div className="sv-college-logo-badge" title={resolvedCollege.alt}>
              <img
                src={resolvedCollege.src}
                alt={resolvedCollege.alt}
                className={`sv-college-logo-img sv-college-logo-img--${resolvedCollege.id}`}
              />
            </div>

            <div className="sv-login-card">
              <h1 className="sv-login-title">Welcome to Saral Vidhya</h1>
              <p className="sv-login-subtitle">
                Personalised Adaptive Learning Platform{" "}
                <span className="sv-login-subtitle-highlight">
                  exclusively built for Students.
                </span>
              </p>

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
                  <p className="sv-login-error">
                    {studentError}
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Bottom Feature Pills: Learn, Practice, Prepare */}
          <div className="sv-login-pills" aria-hidden="true">
            <div className="sv-login-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B8E7B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span>Learn</span>
            </div>
            <div className="sv-login-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D9A55C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
              <span>Practice</span>
            </div>
            <div className="sv-login-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#BE7E57" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1.5" fill="#BE7E57" />
              </svg>
              <span>Prepare</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;