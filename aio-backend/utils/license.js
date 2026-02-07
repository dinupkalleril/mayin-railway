import crypto from 'crypto';

// Offline license verification with expiry check
// Returns { status: 'valid'|'invalid'|'expired', payload: object|null }
export function resolveExpirySeconds(payload) {
  // Try multiple possible keys and formats for backward compatibility
  const candidates = [
    payload?.expires_at,
    payload?.expiresAt,
    payload?.expiry_at,
    payload?.expiryAt,
    payload?.expiry,
    payload?.exp,
    payload?.expires,
    payload?.expiration,
    payload?.expirationDate,
  ];

  for (const val of candidates) {
    if (val === null) return null; // explicit lifetime
    if (typeof val === 'number' && !Number.isNaN(val)) {
      // If looks like milliseconds, convert to seconds
      return val > 1e12 ? Math.floor(val / 1000) : Math.floor(val);
    }
    if (typeof val === 'string') {
      const ms = Date.parse(val);
      if (!Number.isNaN(ms)) return Math.floor(ms / 1000);
      // Try numeric string fallback
      const num = Number(val);
      if (!Number.isNaN(num)) {
        return num > 1e12 ? Math.floor(num / 1000) : Math.floor(num);
      }
    }
  }
  return undefined; // no expiry field found → treat as lifetime by caller
}

export function getExpiryDate(payload) {
  const secs = resolveExpirySeconds(payload);
  if (secs === null || typeof secs === 'undefined') return null;
  return new Date(secs * 1000);
}

export function verifyLicenseKey(licenseKey) {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return { status: 'invalid', payload: null };
  }

  const parts = licenseKey.split('.');
  if (parts.length !== 2) {
    return { status: 'invalid', payload: null };
  }

  const [data, signature] = parts;

  const signingSecret = process.env.LICENSE_SIGNING_SECRET || process.env.LICENSE_SECRET;
  const expectedSignature = crypto
    .createHmac('sha256', signingSecret || '')
    .update(data)
    .digest('hex');

  if (signature !== expectedSignature) {
    return { status: 'invalid', payload: null };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
  } catch (error) {
    return { status: 'invalid', payload: null };
  }

  // Lifetime license if expiry not present or explicitly null
  const expirySeconds = resolveExpirySeconds(payload);
  if (expirySeconds === null || typeof expirySeconds === 'undefined') {
    return { status: 'valid', payload };
  }

  const now = Math.floor(Date.now() / 1000);
  if (now > expirySeconds) {
    return { status: 'expired', payload };
  }

  return { status: 'valid', payload };
}
