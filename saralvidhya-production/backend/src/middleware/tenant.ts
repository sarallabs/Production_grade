import { Request, Response, NextFunction } from 'express';
import { getTenant, TenantPublic } from '../services/registry.js';

export interface TenantRequest extends Request {
  tenant?: TenantPublic;
}

/**
 * Middleware: extracts and validates the tenant from the request path or header.
 */
export async function tenantMiddleware(
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const tenantId = (req.params.tenant || req.params.tenantId || req.headers['x-tenant-id'] || '')
    .toString()
    .trim()
    .toLowerCase();

  if (!tenantId) {
    res.status(400).json({ error: 'Tenant identifier is required' });
    return;
  }

  try {
    const tenant = await getTenant(tenantId);
    if (!tenant) {
      res.status(404).json({ error: `Tenant '${tenantId}' not found` });
      return;
    }

    if (tenant.status === 'suspended') {
      res.status(403).json({ error: `Tenant '${tenantId}' is currently suspended` });
      return;
    }

    if (tenant.status === 'pending') {
      res.status(403).json({ error: `Tenant '${tenantId}' is pending approval and not yet active` });
      return;
    }

    req.tenant = tenant;
    next();
  } catch (err: any) {
    console.error(`[TenantMiddleware] Error loading tenant '${tenantId}':`, err);
    res.status(500).json({ error: 'Failed to resolve tenant' });
  }
}
