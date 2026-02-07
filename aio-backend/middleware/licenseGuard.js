import { pool } from '../config/db.js';

// License guard: blocks access if user's license is expired or revoked
export async function licenseGuard(req, res, next) {
  try {
    // Try to infer userId from common locations used by routes
    const userId = req.body?.userId || req.params?.userId || req.query?.userId;

    if (!userId) {
      // If route doesn't specify user, let it pass (route may still validate separately)
      return next();
    }

    // Look up user's license
    const userRes = await pool.query('SELECT license_key FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const licenseKey = userRes.rows[0].license_key;
    if (!licenseKey) {
      return res.status(403).json({ error: 'No license associated with user' });
    }

    const licRes = await pool.query('SELECT status, expires_at FROM licenses WHERE license_key = $1', [licenseKey]);
    if (licRes.rows.length === 0) {
      return res.status(403).json({ error: 'License not found' });
    }

    const lic = licRes.rows[0];

    // Treat explicit status flags first
    if (lic.status === 'revoked') {
      return res.status(403).json({ error: 'License revoked' });
    }

    // Enforce expiry when expires_at is set
    if (lic.expires_at && new Date(lic.expires_at) < new Date()) {
      // Update status to expired (best-effort)
      try { await pool.query('UPDATE licenses SET status = $1 WHERE license_key = $2', ['expired', licenseKey]); } catch {}
      return res.status(403).json({ error: 'License expired' });
    }

    return next();
  } catch (err) {
    console.error('licenseGuard error:', err);
    return res.status(500).json({ error: 'License validation failed' });
  }
}

