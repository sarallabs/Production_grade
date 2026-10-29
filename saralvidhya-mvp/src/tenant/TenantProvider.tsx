import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  cloudStorage,
  CloudStateProvider,
  setCloudAuthContext,
  applyHydratedCloudState,
  getCloudAuthHeaders,
} from '@/context/CloudStateContext';
import { registerCloudGlossaryTerms } from '@/data/glossaryTerms';

export interface TenantConfig {
  id: string;
  name: string;
  shortName: string;
  academicTerm?: string;
  status: 'active' | 'suspended';
  logoUrl?: string;
  faviconUrl?: string;
  loginBannerUrl?: string;
  assets?: {
    logo?: string;
    favicon?: string;
    loginBanner?: string;
    logoUrl?: string;
    faviconUrl?: string;
    loginBannerUrl?: string;
  };
    publicImageUrls?: Record<string, string>;
    boardLogoUrls?: Record<string, string>;
  branding: {
    appName: string;
    primaryColor: string;
    accentColor?: string;
    logoBlob?: string;
    faviconBlob?: string;
    loginBannerBlob?: string;
    watermarkIcon?: string;
    logoUrl?: string;
    logoPrimaryUrl?: string;
    faviconUrl?: string;
    loginBannerUrl?: string;
    programLabel?: string;
  };
  features: {
    examinerConsole?: boolean;
    expertPanel?: boolean;
    pyq?: boolean;
    ask?: boolean;
    guidedFlow?: boolean;
    toolOrder?: string[];
  };
  hierarchy: string[];
  storage?: {
    bucket: string;
    prefix: string;
  };
  uiCopy?: Record<string, any>;
  translations?: Record<string, Record<string, string>>;
}

export interface TenantContextValue {
  tenantId: string | null;
  tenant: TenantConfig | null;
  config: TenantConfig | null;
  branding: TenantConfig['branding'] | null;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (password: string, userKey?: string) => Promise<boolean>;
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
  'production',
]);

const GENERIC_HOST_PREFIXES = new Set([
  'localhost',
  '127',
  'www',
  'app',
  'saralvidhya',
  'saralvidhya-mvp',
  'saralvidhya-api',
  'saralvidhya-production',
  'production',
]);
import universityConfig from '@/config/university_config.json';

/**
 * Resolves the active tenant id from URL path, query params, or hostname pattern without any hardcoded tenant literals.
 */
export function detectTenantId(): string | null {
  const aliases = ((universityConfig as any).boardTenantAliases || {}) as Record<string, string>;
  const normalizeTenant = (raw: string): string => {
    const clean = raw.trim().toLowerCase();
    if (clean.endsWith('_university')) {
      return clean.replace(/_university$/, '');
    }
    return aliases[clean]?.endsWith('_university') ? clean : aliases[clean] || clean;
  };

  // 1. Hostname / Subdomain pattern detection (e.g. saralvidhya-<tenant>.web.app or <tenant>.saralvidhya.com)
  const hostname = (window.location.hostname || '').toLowerCase();
  const hyphenMatch =
    hostname.match(/(?:^|\.)saralvidhya-([a-z0-9_]+)\./) ||
    hostname.match(/(?:^|\.)([a-z0-9_]+)-saralvidhya\./);
  if (hyphenMatch && hyphenMatch[1] && !GENERIC_HOST_PREFIXES.has(hyphenMatch[1])) {
    return normalizeTenant(hyphenMatch[1]);
  }

  const hostParts = hostname.split('.');
  if (hostParts.length >= 3 && !GENERIC_HOST_PREFIXES.has(hostParts[0]) && !/^[0-9a-f]{6,}$/.test(hostParts[0])) {
    return normalizeTenant(hostParts[0]);
  }

  if (import.meta.env.VITE_DEFAULT_TENANT) {
    return normalizeTenant(String(import.meta.env.VITE_DEFAULT_TENANT));
  }

  if (import.meta.env.VITE_VISIBLE_BOARDS) {
    const boards = String(import.meta.env.VITE_VISIBLE_BOARDS)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (boards.length === 1) {
      return normalizeTenant(boards[0]);
    }
  }

  return cloudStorage.getItem('current_tenant_id');
}

export function getFallbackTenantId(): string {
  const active = detectTenantId();
  if (active) return active;
  const boards = ((universityConfig as any).defaultVisibleBoards || []) as string[];
  const first = (boards[1] || boards[0] || 'default').toLowerCase().replace(/_university$/, '');
  return first || 'default';
}

let activeCloudPlatformConfig: Record<string, any> | null = null;
let activeCloudTenantConfig: TenantConfig | null = null;

export function getCloudPlatformConfig(): Record<string, any> | null {
  return activeCloudPlatformConfig;
}

export function getCloudUiCopy(): Record<string, any> {
  return {
    ...(activeCloudPlatformConfig?.uiCopy || {}),
    ...(activeCloudTenantConfig?.uiCopy || {}),
    signInButton: "Enter",
    studyTools: {
      ...(activeCloudPlatformConfig?.uiCopy?.studyTools || {}),
      ...(activeCloudTenantConfig?.uiCopy?.studyTools || {}),
      key_takeaways: "Takeaways",
      prep_exam: "Exam Prep.",
    },
    toolbarLabels: {
      ...(activeCloudPlatformConfig?.uiCopy?.toolbarLabels || {}),
      ...(activeCloudTenantConfig?.uiCopy?.toolbarLabels || {}),
      key_takeaways: "Takeaways",
      prep_exam: "Exam Prep.",
    },
    toolbarSections: {
      ...(activeCloudPlatformConfig?.uiCopy?.toolbarSections || {}),
      ...(activeCloudTenantConfig?.uiCopy?.toolbarSections || {}),
    },
  };
}

export function getCloudPublicImageUrl(localPath: string): string {
  if (!localPath) return localPath;
  const trimmed = localPath.trim();
  const map =
    activeCloudTenantConfig?.assets?.publicImageUrls ||
    activeCloudPlatformConfig?.assets?.publicImageUrls ||
    {};
  const clean = trimmed.replace(/^\/+/, '');
  return map[trimmed] || map[`/${clean}`] || map[clean] || trimmed;
}

export function getCloudBoardLogoUrl(boardId: string): string | undefined {
  if (!boardId) return undefined;
  const map =
    activeCloudTenantConfig?.assets?.boardLogoUrls ||
    activeCloudPlatformConfig?.assets?.boardLogoUrls ||
    {};
  return map[boardId] || map[boardId.toLowerCase()];
}
function applyTenantBrandingToDom(cfg: TenantConfig) {
  if (cfg.branding?.appName) {
    cfg.branding.appName =
      cfg.branding.appName.replace(/\s*Medha/gi, '').trim() || 'Saral Vidhya';
    document.title = `${cfg.branding.appName} – Student Learning`;
  }
  if (cfg.branding?.primaryColor) {
    const color =
      cfg.branding.primaryColor.toLowerCase() === '#1e3a8a'
        ? '#365345'
        : cfg.branding.primaryColor;
    document.documentElement.style.setProperty('--primary-color', color);
  }
  if (cfg.branding?.accentColor) {
    document.documentElement.style.setProperty('--accent-color', cfg.branding.accentColor);
  }
  const favUrl = cfg.faviconUrl || cfg.branding?.faviconUrl || cfg.assets?.faviconUrl;
  if (favUrl && typeof document !== 'undefined') {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = favUrl;
  }
}

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const activeDetectedTenant = detectTenantId();
  const [tenantId, setTenantId] = useState<string | null>(activeDetectedTenant);
  const [tenant, setTenant] = useState<TenantConfig | null>(() => {
    if (activeDetectedTenant) {
      const cached = cloudStorage.getItem(`tenant_cfg_${activeDetectedTenant}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore
        }
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(!!activeDetectedTenant && !tenant);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return activeDetectedTenant ? cloudStorage.getItem(`sv_session_${activeDetectedTenant}`) : null;
  });
  const [cookieAuthenticated, setCookieAuthenticated] = useState<boolean>(false);

  // Sync tenant ID whenever route or query string changes
  useEffect(() => {
    const nextTenantId = detectTenantId();
    if (nextTenantId !== tenantId) {
      setTenantId(nextTenantId);
      if (nextTenantId) {
        cloudStorage.setItem('current_tenant_id', nextTenantId, true);
        const memTok = cloudStorage.getItem(`sv_session_${nextTenantId}`);
        setToken(memTok);
        setCloudAuthContext(nextTenantId, memTok);
        const cached = cloudStorage.getItem(`tenant_cfg_${nextTenantId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as TenantConfig;
            applyTenantBrandingToDom(parsed);
            setTenant(parsed);
          } catch {
            // ignore
          }
        }
      } else {
        setToken(null);
        setTenant(null);
        setCloudAuthContext(null, null);
      }
    }
  }, [location.pathname, location.search, tenantId]);

  // Load tenant metadata and probe HttpOnly cookie session from Cloud Run API
  useEffect(() => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchTenantAndSession = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await fetch(`${API_BASE}/v2/t/${tenantId}`);
        if (!resp.ok) {
          throw new Error(`Institution '${tenantId}' not found.`);
        }
        const data = await resp.json();
        if (isMounted && data.tenant) {
          if (data.platformConfig) {
            activeCloudPlatformConfig = data.platformConfig;
            if (data.platformConfig.glossaryTerms) {
              registerCloudGlossaryTerms(data.platformConfig.glossaryTerms);
            }
          }
          if (data.tenant.glossaryTerms) {
            registerCloudGlossaryTerms(data.tenant.glossaryTerms);
          }
          activeCloudTenantConfig = data.tenant;
          applyTenantBrandingToDom(data.tenant);
          setTenant(data.tenant);
          cloudStorage.setItem(`tenant_cfg_${tenantId}`, JSON.stringify(data.tenant), true);
        }

        // If a session token already exists for this tenant, mark authenticated immediately;
        // CloudStateProvider handles hydrating /me/state once.
        if (cloudStorage.getItem(`sv_session_${tenantId}`) && isMounted) {
          setCookieAuthenticated(true);
          cloudStorage.setItem('app_authenticated', 'true', true);
          if (!cloudStorage.getItem('username')) {
            const displayName = data.tenant?.shortName ? `${data.tenant.shortName} Student` : 'Student';
            cloudStorage.setItem('username', displayName, true);
            cloudStorage.setItem(
              'saral_student_profile',
              JSON.stringify({ firstName: displayName, lastName: '', bypassed: true }),
              true
            );
            cloudStorage.setItem('questionnaire_completed', 'true', true);
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

    fetchTenantAndSession();
    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  const login = useCallback(
    async (password: string, userKey?: string): Promise<boolean> => {
      if (!tenantId) return false;
      try {
        const resp = await fetch(`${API_BASE}/v2/t/${tenantId}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password, userKey }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || 'Login failed');
        }

        const data = await resp.json();
        if (data.token) {
          setToken(data.token);
          setCookieAuthenticated(true);
          setCloudAuthContext(tenantId, data.token);
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
      fetch(`${API_BASE}/v2/t/${tenantId}/logout`, {
        method: 'POST',
        headers: getCloudAuthHeaders(tenantId),
      }).catch(() => {});
      cloudStorage.removeItem(`sv_session_${tenantId}`);
    }
    cloudStorage.removeItem('app_authenticated');
    cloudStorage.removeItem('app_role');
    cloudStorage.removeItem('app_user_id');
    cloudStorage.removeItem('username');
    cloudStorage.removeItem('questionnaire_completed');
    cloudStorage.removeItem('sv_video_open_counts');
    setCookieAuthenticated(false);
    setToken(null);
    setCloudAuthContext(tenantId, null);
  }, [tenantId]);

  const tenantPath = useCallback(
    (path: string): string => {
      return path.startsWith('/') ? path : `/${path}`;
    },
    []
  );

  const contextValue = useMemo<TenantContextValue>(
    () => ({
      tenantId,
      tenant,
      config: tenant,
      branding: tenant?.branding || null,
      isLoading,
      error,
      token,
      isAuthenticated:
        !!token || cookieAuthenticated || cloudStorage.getItem('app_authenticated') === 'true',
      login,
      logout,
      tenantPath,
    }),
    [tenantId, tenant, isLoading, error, token, cookieAuthenticated, login, logout, tenantPath]
  );

  return (
    <TenantContext.Provider value={contextValue}>
      <CloudStateProvider tenantId={tenantId} token={token}>
        {children}
      </CloudStateProvider>
    </TenantContext.Provider>
  );
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
