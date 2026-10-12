import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

export interface TenantConfig {
  id: string;
  name: string;
  shortName: string;
  status: 'active' | 'suspended';
  branding: {
    appName: string;
    primaryColor: string;
    logoBlob?: string;
    faviconBlob?: string;
    programLabel?: string;
  };
  features: {
    examinerConsole?: boolean;
    expertPanel?: boolean;
    pyq?: boolean;
    ask?: boolean;
    toolOrder?: string[];
  };
  hierarchy: string[];
  storage: {
    bucket: string;
    prefix: string;
  };
}

export interface TenantContextValue {
  tenantId: string | null;
  tenant: TenantConfig | null;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  tenantPath: (path: string) => string;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://saralvidhya-api-193782571555.asia-south1.run.app';

export const RESERVED_PATHS = new Set([
  'config',
  'examiner',
  'x',
  'login',
  'onboarding',
  'profile',
  'leaderboard',
  'persona',
  'questionnaire',
  'assessment-complete',
  'study-table',
  'previous-year-questions',
  'chapters',
  'subjects',
  'dashboard',
]);

/** Resolves the active tenant id from URL path or subdomain, falling back to last-used tenant. */
export function detectTenantId(): string | null {
  // 1. Path-based tenant detection (e.g. /mlrit/... or /angrau/...)
  const first = (window.location.pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
  if (first && !RESERVED_PATHS.has(first)) return first;

  // 2. Subdomain / Hostname detection (highest priority for multi-site deployments)
  const hostname = (window.location.hostname || '').toLowerCase();
  if (hostname.includes('angrau')) return 'angrau';
  if (hostname.includes('mlrit')) return 'mlrit';

  return localStorage.getItem('current_tenant_id');
}

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeDetectedTenant = detectTenantId();
  const [tenantId, setTenantId] = useState<string | null>(activeDetectedTenant);
  const [tenant, setTenant] = useState<TenantConfig | null>(() => {
    if (activeDetectedTenant) {
      const cached = localStorage.getItem(`tenant_cfg_${activeDetectedTenant}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore cache error
        }
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(!!activeDetectedTenant && !tenant);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return activeDetectedTenant ? localStorage.getItem(`sv_session_${activeDetectedTenant}`) : null;
  });

  // Sync tenant ID whenever route or hostname changes
  useEffect(() => {
    const nextTenantId = detectTenantId();
    if (nextTenantId !== tenantId) {
      setTenantId(nextTenantId);
      if (nextTenantId) {
        localStorage.setItem('current_tenant_id', nextTenantId);
        setToken(localStorage.getItem(`sv_session_${nextTenantId}`));
        const cached = localStorage.getItem(`tenant_cfg_${nextTenantId}`);
        if (cached) {
          try {
            setTenant(JSON.parse(cached));
          } catch {
            // ignore
          }
        }
      } else {
        setToken(null);
        setTenant(null);
      }
    }
  }, [location.pathname, tenantId]);

  // Load tenant metadata from API
  useEffect(() => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchTenant = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await fetch(`${API_BASE}/v2/t/${tenantId}`);
        if (!resp.ok) {
          throw new Error(`Institution '${tenantId}' not found.`);
        }
        const data = await resp.json();
        if (isMounted && data.tenant) {
          setTenant(data.tenant);
          localStorage.setItem(`tenant_cfg_${tenantId}`, JSON.stringify(data.tenant));

          // Apply branding dynamically
          if (data.tenant.branding?.appName) {
            document.title = `${data.tenant.branding.appName} – Student Learning`;
          }
          if (data.tenant.branding?.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', data.tenant.branding.primaryColor);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('[TenantProvider] Could not load tenant config:', err.message);
          setError(err.message);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTenant();
    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  const login = useCallback(
    async (password: string): Promise<boolean> => {
      if (!tenantId) return false;
      try {
        const resp = await fetch(`${API_BASE}/v2/t/${tenantId}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || 'Login failed');
        }

        const data = await resp.json();
        if (data.token) {
          setToken(data.token);
          localStorage.setItem(`sv_session_${tenantId}`, data.token);
          localStorage.setItem('app_authenticated', 'true');
          return true;
        }
        return false;
      } catch (err: any) {
        console.error('[Tenant Login]', err);
        throw err;
      }
    },
    [tenantId]
  );

  const logout = useCallback(() => {
    if (tenantId) {
      localStorage.removeItem(`sv_session_${tenantId}`);
    }
    localStorage.removeItem('app_authenticated');
    setToken(null);
  }, [tenantId]);

  const tenantPath = useCallback(
    (path: string): string => {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      if (!tenantId) return cleanPath;
      return `/${tenantId}${cleanPath}`;
    },
    [tenantId]
  );

  const contextValue = useMemo<TenantContextValue>(
    () => ({
      tenantId,
      tenant,
      isLoading,
      error,
      token,
      isAuthenticated: !!token || localStorage.getItem('app_authenticated') === 'true',
      login,
      logout,
      tenantPath,
    }),
    [tenantId, tenant, isLoading, error, token, login, logout, tenantPath]
  );

  return <TenantContext.Provider value={contextValue}>{children}</TenantContext.Provider>;
};

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

export { getRegistryTenantId } from '@/data/manifestService';

export default TenantProvider;
